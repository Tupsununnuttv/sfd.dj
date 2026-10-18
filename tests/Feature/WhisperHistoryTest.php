<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Whisper;
use App\Models\WhisperGroup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class WhisperHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_old_messages_are_accessible_in_order_without_crossing_conversations(): void
    {
        [$a, $b, $outsider] = User::factory()->count(3)->create();
        $ids = [];
        for ($i = 0; $i < 205; $i++) {
            $ids[] = Whisper::create(['from_id' => $i % 2 ? $a->id : $b->id, 'to_id' => $i % 2 ? $b->id : $a->id, 'body' => "Message {$i}"])->id;
            Whisper::create(['from_id' => $outsider->id, 'to_id' => $a->id, 'body' => 'Private elsewhere']);
        }
        $latest = $this->actingAs($a)->getJson("/api/whispers/{$b->id}")->assertOk()->assertJsonCount(100, 'messages')->assertJsonPath('has_more', true);
        $this->assertSame(array_slice($ids, 105), array_column($latest->json('messages'), 'id'));
        $older = $this->getJson("/api/whispers/{$b->id}?before={$ids[105]}")->assertOk()->assertJsonCount(100, 'messages')->assertJsonPath('has_more', true);
        $this->assertSame(array_slice($ids, 5, 100), array_column($older->json('messages'), 'id'));
        $first = $this->getJson("/api/whispers/{$b->id}?before={$ids[5]}")->assertOk()->assertJsonCount(5, 'messages')->assertJsonPath('has_more', false);
        $this->assertSame(array_slice($ids, 0, 5), array_column($first->json('messages'), 'id'));
        $this->getJson("/api/whispers/{$b->id}?before=-1")->assertUnprocessable();
    }

    public function test_group_history_pagination_preserves_the_membership_boundary(): void
    {
        [$owner, $newcomer] = User::factory()->count(2)->create();
        $group = WhisperGroup::create(['owner_id' => $owner->id, 'name' => 'History']);
        $group->admit([$owner]);
        $old = Whisper::create(['from_id' => $owner->id, 'group_id' => $group->id, 'body' => 'Before membership']);
        $group->admit([$newcomer]);
        $ids = [];
        for ($i = 0; $i < 102; $i++) {
            $ids[] = Whisper::create(['from_id' => $owner->id, 'group_id' => $group->id, 'body' => "Message {$i}"])->id;
        }
        $this->actingAs($newcomer)->getJson("/api/whisper-groups/{$group->id}")->assertOk()->assertJsonCount(100, 'messages')->assertJsonPath('has_more', true);
        $this->getJson("/api/whisper-groups/{$group->id}?before={$ids[2]}")->assertOk()->assertJsonCount(2, 'messages')->assertJsonPath('has_more', false)->assertJsonPath('messages.0.id', $ids[0]);
        $this->getJson("/api/whisper-groups/{$group->id}?before={$old->id}")->assertOk()->assertJsonCount(0, 'messages');
    }

    public function test_old_recordings_allow_replay_and_seek_but_are_still_private(): void
    {
        config(['filesystems.uploads' => 'voice-test']);
        Storage::fake('voice-test');
        [$a, $b, $outsider] = User::factory()->count(3)->create();
        $voice = Whisper::create(['from_id' => $a->id, 'to_id' => $b->id, 'body' => '', 'audio' => 'old.wav', 'audio_seconds' => 10]);
        $voice->forceFill(['created_at' => now()->subYear()])->save();
        Storage::disk('voice-test')->put('whispers/old.wav', '0123456789');
        $url = "/api/whispers/{$voice->id}/audio";
        $this->actingAs($b)->get($url)->assertOk()->assertHeader('Accept-Ranges', 'bytes')->assertHeader('Content-Type', 'audio/wav');
        $this->get($url, ['Range' => 'bytes=2-5'])->assertStatus(206)->assertHeader('Content-Range', 'bytes 2-5/10')->assertHeader('Content-Length', '4');
        $this->get($url, ['Range' => 'bytes=20-'])->assertStatus(416);
        $this->actingAs($outsider)->get($url, ['Range' => 'bytes=0-2'])->assertNotFound();

        // Exercise the remote storage stream using the same fake disk, without network access.
        config(['filesystems.disks.voice-test.driver' => 's3']);
        $this->actingAs($a)->get($url, ['Range' => 'bytes=2-5'])->assertStatus(206)->assertStreamedContent('2345');
        $this->get($url, ['Range' => 'bytes=-3'])->assertStatus(206)->assertStreamedContent('789');
        $this->get($url, ['Range' => 'bytes=0-2,6-8'])->assertStatus(416);
    }
}
