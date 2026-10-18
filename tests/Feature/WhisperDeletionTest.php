<?php

namespace Tests\Feature;

use App\Events\WhisperDeleted;
use App\Events\WhisperGroupChanged;
use App\Models\User;
use App\Models\Whisper;
use App\Models\WhisperGroup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class WhisperDeletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_the_author_can_delete_a_message_and_its_recording_and_reply_quotes(): void
    {
        Event::fake([WhisperDeleted::class]);
        config(['filesystems.uploads' => 'local']);
        Storage::fake('local');
        $author = User::factory()->create();
        $recipient = User::factory()->create();
        $message = Whisper::create(['from_id' => $author->id, 'to_id' => $recipient->id, 'body' => '', 'audio' => 'voice.webm', 'audio_seconds' => 3]);
        Storage::disk('local')->put('whispers/voice.webm', 'recording');
        $reply = Whisper::create(['from_id' => $recipient->id, 'to_id' => $author->id, 'body' => 'Reply', 'reply_to_id' => $message->id]);
        $url = '/api/whispers/messages/'.$message->id;
        $this->actingAs($recipient)->deleteJson($url)->assertNotFound();
        $this->actingAs(User::factory()->create())->deleteJson($url)->assertNotFound();
        $this->assertDatabaseHas('whispers', ['id' => $message->id]);
        $this->actingAs($author)->deleteJson($url)->assertNoContent();
        $this->assertDatabaseMissing('whispers', ['id' => $message->id]);
        $this->assertNull($reply->refresh()->reply_to_id);
        Storage::disk('local')->assertMissing('whispers/voice.webm');
        Event::assertDispatched(WhisperDeleted::class, fn ($event) => $event->id === $message->id && $event->userIds === [$author->id, $recipient->id]);
    }

    public function test_only_the_owner_can_delete_a_group_and_all_its_messages(): void
    {
        Event::fake([WhisperGroupChanged::class, WhisperDeleted::class]);
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $group = WhisperGroup::create(['name' => 'Friends', 'owner_id' => $owner->id]);
        $group->admit([$owner, $member]);
        $message = Whisper::create(['from_id' => $member->id, 'group_id' => $group->id, 'body' => 'Hello']);
        $url = '/api/whisper-groups/'.$group->id;
        $this->actingAs($member)->deleteJson($url)->assertForbidden();
        $this->actingAs(User::factory()->create())->deleteJson($url)->assertNotFound();
        $this->actingAs($member)->deleteJson('/api/whispers/messages/'.$message->id)->assertNoContent();
        $this->actingAs($owner)->deleteJson($url)->assertNoContent();
        $this->assertDatabaseMissing('whisper_groups', ['id' => $group->id]);
        $this->assertDatabaseMissing('whisper_group_user', ['group_id' => $group->id]);
        Event::assertDispatched(WhisperGroupChanged::class, fn ($event) => $event->groupId === $group->id && $event->deleted && count($event->userIds) === 2);
    }
}
