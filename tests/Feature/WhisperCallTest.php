<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WhisperCall;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WhisperCallTest extends TestCase
{
    use RefreshDatabase;

    private function start(User $from, User $to, bool $video = false): string
    {
        return $this->actingAs($from)->postJson('/api/whisper-calls', ['user_id' => $to->id, 'video' => $video, 'offer' => "v=0\r\no=test"])
            ->assertCreated()->json('call.id');
    }

    public function test_private_voice_and_video_calls_can_be_answered_and_ended(): void
    {
        foreach ([false, true] as $video) {
            $caller = User::factory()->create();
            $callee = User::factory()->create();
            $id = $this->start($caller, $callee, $video);
            $this->actingAs($callee)->getJson('/api/whisper-calls')->assertOk()->assertJsonPath('call.video', $video)->assertJsonPath('call.offer', "v=0\r\no=test");
            $this->patchJson('/api/whisper-calls/'.$id, ['action' => 'answer', 'answer' => "v=0\r\no=answer"])->assertOk()->assertJsonPath('call.status', 'active');
            $this->actingAs($caller)->getJson('/api/whisper-calls')->assertJsonPath('call.answer', "v=0\r\no=answer");
            $this->patchJson('/api/whisper-calls/'.$id, ['action' => 'end'])->assertOk();
            $this->assertDatabaseHas('whisper_calls', ['id' => $id, 'status' => 'ended', 'offer' => null, 'answer' => null]);
            $this->actingAs($callee)->getJson('/api/whisper-calls')->assertJsonPath('call', null);
        }
    }

    public function test_third_parties_cannot_see_or_signal_calls_and_callers_cannot_answer(): void
    {
        $caller = User::factory()->create();
        $callee = User::factory()->create();
        $id = $this->start($caller, $callee);
        $this->patchJson('/api/whisper-calls/'.$id, ['action' => 'answer', 'answer' => 'v=0'])->assertStatus(409);
        $this->actingAs(User::factory()->create())->getJson('/api/whisper-calls')->assertJsonPath('call', null);
        foreach (['end', 'heartbeat', 'answer'] as $action) {
            $this->patchJson('/api/whisper-calls/'.$id, ['action' => $action, 'answer' => 'v=0'])->assertNotFound();
        }
    }

    public function test_privacy_self_calls_bots_busy_and_invalid_signals_are_rejected(): void
    {
        $caller = User::factory()->create();
        $private = User::factory()->create(['preferences' => ['privacy' => ['whispers' => 'nobody']]]);
        $this->actingAs($caller)->postJson('/api/whisper-calls', ['user_id' => $private->id, 'video' => false, 'offer' => 'v=0'])->assertForbidden();
        $this->postJson('/api/whisper-calls', ['user_id' => $caller->id, 'video' => false, 'offer' => 'v=0'])->assertUnprocessable();
        $this->postJson('/api/whisper-calls', ['user_id' => User::factory()->create(['is_bot' => true])->id, 'video' => false, 'offer' => 'v=0'])->assertUnprocessable();
        $callee = User::factory()->create();
        $id = $this->start($caller, $callee);
        $this->actingAs(User::factory()->create())->postJson('/api/whisper-calls', ['user_id' => $callee->id, 'video' => false, 'offer' => 'v=0'])->assertStatus(409);
        $this->actingAs($callee)->patchJson('/api/whisper-calls/'.$id, ['action' => 'answer', 'answer' => str_repeat('x', 60001)])->assertUnprocessable();
    }

    public function test_abandoned_and_unanswered_calls_expire_and_cannot_restart(): void
    {
        $caller = User::factory()->create();
        $callee = User::factory()->create();
        $id = $this->start($caller, $callee);
        $this->travel(46)->seconds();
        $this->actingAs($callee)->getJson('/api/whisper-calls')->assertJsonPath('call', null);
        $this->patchJson('/api/whisper-calls/'.$id, ['action' => 'answer', 'answer' => 'v=0'])->assertStatus(409);
        $this->assertNull(WhisperCall::find($id)->offer);
    }

    public function test_turn_credentials_are_temporary_and_configuration_requires_authentication(): void
    {
        config(['calls.turn_url' => 'turn:relay.example.com:3478', 'calls.turn_secret' => 'test-shared-secret']);
        $this->getJson('/api/whisper-calls/config')->assertUnauthorized();
        $me = User::factory()->create();
        $response = $this->actingAs($me)->getJson('/api/whisper-calls/config')->assertOk()->assertHeader('Cache-Control', 'no-store, private');
        $turn = collect($response->json('iceServers'))->firstWhere('urls', 'turn:relay.example.com:3478');
        $this->assertGreaterThan(now()->timestamp, (int) explode(':', $turn['username'])[0]);
        $this->assertSame(base64_encode(hash_hmac('sha1', $turn['username'], 'test-shared-secret', true)), $turn['credential']);
        $this->assertStringNotContainsString('test-shared-secret', $response->getContent());
    }

    public function test_privacy_changes_before_answer_and_duplicate_answers_are_rejected(): void
    {
        $caller = User::factory()->create();
        $callee = User::factory()->create();
        $id = $this->start($caller, $callee);
        $callee->forceFill(['preferences' => ['privacy' => ['whispers' => 'nobody']]])->save();
        $this->actingAs($callee)->patchJson('/api/whisper-calls/'.$id, ['action' => 'answer', 'answer' => 'v=0'])->assertForbidden();
        $callee->forceFill(['preferences' => []])->save();
        $this->actingAs($callee)->patchJson('/api/whisper-calls/'.$id, ['action' => 'answer', 'answer' => 'v=0'])->assertOk();
        $this->patchJson('/api/whisper-calls/'.$id, ['action' => 'answer', 'answer' => 'v=0'])->assertStatus(409);
        $this->travel(40)->seconds();
        $this->actingAs($caller)->patchJson('/api/whisper-calls/'.$id, ['action' => 'heartbeat'])->assertOk();
        $this->travel(6)->seconds();
        $this->getJson('/api/whisper-calls')->assertJsonPath('call', null);
    }

    public function test_ringing_calls_expire_even_when_the_caller_keeps_polling(): void
    {
        $id = $this->start(User::factory()->create(), User::factory()->create());
        for ($i = 0; $i < 3; $i++) {
            $this->travel(30)->seconds();
            $this->patchJson('/api/whisper-calls/'.$id, ['action' => 'heartbeat'])->assertOk();
        }
        $this->travel(1)->seconds();
        $this->getJson('/api/whisper-calls')->assertJsonPath('call', null);
    }
}
