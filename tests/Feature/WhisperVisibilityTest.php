<?php

namespace Tests\Feature;

use App\Events\WhisperConversationCleared;
use App\Events\WhisperDeleted;
use App\Events\WhisperSent;
use App\Models\User;
use App\Models\Whisper;
use App\Models\WhisperGroup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WhisperVisibilityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake([WhisperDeleted::class, WhisperConversationCleared::class, WhisperSent::class]);
    }

    public function test_received_messages_can_only_be_hidden_by_their_participants(): void
    {
        [$sender, $recipient, $outsider] = User::factory()->count(3)->create();
        $message = Whisper::create(['from_id' => $sender->id, 'to_id' => $recipient->id, 'body' => 'Hello']);
        $url = "/api/whispers/messages/{$message->id}/hide";
        $this->actingAs($outsider)->deleteJson($url)->assertNotFound();
        $this->actingAs($recipient)->deleteJson($url)->assertNoContent();
        $this->deleteJson($url)->assertNoContent();
        $this->getJson('/api/whispers')->assertExactJson([]);
        $this->getJson("/api/whispers/{$sender->id}")->assertJsonCount(0, 'messages');
        $this->actingAs($sender)->getJson("/api/whispers/{$recipient->id}")->assertJsonPath('messages.0.id', $message->id);
        $this->assertDatabaseHas('whispers', ['id' => $message->id, 'body' => 'Hello']);
        $this->assertDatabaseCount('hidden_whispers', 1);
        Event::assertDispatched(WhisperDeleted::class, fn ($event) => $event->userIds === [$recipient->id]);
    }

    public function test_clearing_hides_all_existing_history_only_for_the_current_user_and_new_messages_return(): void
    {
        [$me, $other, $third] = User::factory()->count(3)->create();
        for ($i = 0; $i < 105; $i++) {
            $last = Whisper::create(['from_id' => $i % 2 ? $me->id : $other->id, 'to_id' => $i % 2 ? $other->id : $me->id, 'body' => 'Old message']);
        }
        $elsewhere = Whisper::create(['from_id' => $third->id, 'to_id' => $me->id, 'body' => 'Other conversation']);
        $group = WhisperGroup::create(['name' => 'Friends', 'owner_id' => $me->id]);
        $group->admit([$me, $other]);
        $groupMessage = Whisper::create(['from_id' => $other->id, 'group_id' => $group->id, 'body' => 'Group message']);

        $this->actingAs($me)->deleteJson("/api/whispers/{$other->id}")->assertOk()->assertJsonPath('through_id', $last->id);
        $this->getJson('/api/whispers')->assertJsonCount(1)->assertJsonPath('0.user.id', $third->id);
        $this->getJson("/api/whispers/{$other->id}?before={$last->id}")->assertJsonCount(0, 'messages')->assertJsonPath('has_more', false);
        $this->getJson("/api/whisper-groups/{$group->id}")->assertJsonPath('messages.0.id', $groupMessage->id);
        $this->getJson("/api/whispers/{$third->id}")->assertJsonPath('messages.0.id', $elsewhere->id);
        $this->actingAs($other)->getJson("/api/whispers/{$me->id}")->assertJsonCount(100, 'messages')->assertJsonPath('has_more', true);
        Event::assertDispatched(WhisperConversationCleared::class, fn ($event) => $event->userId === $me->id && $event->otherId === $other->id && count($event->broadcastOn()) === 1);

        $fresh = Whisper::create(['from_id' => $other->id, 'to_id' => $me->id, 'body' => 'New message']);
        $this->actingAs($me)->getJson('/api/whispers')->assertJsonCount(2)->assertJsonPath('0.last.id', $fresh->id)->assertJsonPath('0.unread', 1);
        $this->getJson("/api/whispers/{$other->id}")->assertJsonCount(1, 'messages')->assertJsonPath('messages.0.id', $fresh->id);
        $this->assertDatabaseCount('whispers', 108);
    }

    public function test_hidden_messages_are_removed_from_unread_counts_and_reply_previews_only_for_the_viewer(): void
    {
        [$sender, $recipient] = User::factory()->count(2)->create();
        $original = Whisper::create(['from_id' => $sender->id, 'to_id' => $recipient->id, 'body' => 'Hide this']);
        $reply = Whisper::create(['from_id' => $sender->id, 'to_id' => $recipient->id, 'body' => 'Reply', 'reply_to_id' => $original->id]);
        $this->actingAs($recipient)->deleteJson("/api/whispers/messages/{$original->id}/hide")->assertNoContent();
        $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('unreadWhispers', 1));
        $this->getJson("/api/whispers/{$sender->id}")->assertJsonCount(1, 'messages')->assertJsonPath('messages.0.reply', null);
        $this->actingAs($sender)->getJson("/api/whispers/{$recipient->id}")->assertJsonPath('messages.1.reply.id', $original->id);
        $this->assertSame($original->id, $reply->refresh()->reply_to_id);
        $this->actingAs($recipient)->deleteJson("/api/whispers/{$sender->id}")->assertOk();
        $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('unreadWhispers', 0));
    }

    public function test_hiding_voice_messages_keeps_the_other_participants_recording_and_authors_can_still_delete_it(): void
    {
        config(['filesystems.uploads' => 'local']);
        Storage::fake('local');
        [$sender, $recipient] = User::factory()->count(2)->create();
        $message = Whisper::create(['from_id' => $sender->id, 'to_id' => $recipient->id, 'body' => '', 'audio' => 'recording.webm', 'audio_seconds' => 3]);
        Storage::disk('local')->put('whispers/recording.webm', 'recording');
        $this->actingAs($recipient)->deleteJson("/api/whispers/messages/{$message->id}/hide")->assertNoContent();
        $this->get("/api/whispers/{$message->id}/audio")->assertNotFound();
        Storage::disk('local')->assertExists('whispers/recording.webm');
        $this->actingAs($sender)->get("/api/whispers/{$message->id}/audio")->assertOk();
        $this->deleteJson("/api/whispers/messages/{$message->id}")->assertNoContent();
        Storage::disk('local')->assertMissing('whispers/recording.webm');
        $this->assertDatabaseCount('hidden_whispers', 0);
    }

    public function test_hiding_does_not_allow_group_messages_or_anyone_elses_conversations_to_be_changed(): void
    {
        [$a, $b, $outsider] = User::factory()->count(3)->create();
        $group = WhisperGroup::create(['name' => 'Friends', 'owner_id' => $a->id]);
        $group->admit([$a, $b]);
        $message = Whisper::create(['from_id' => $a->id, 'group_id' => $group->id, 'body' => 'Group']);
        $this->actingAs($b)->deleteJson("/api/whispers/messages/{$message->id}/hide")->assertNotFound();
        $direct = Whisper::create(['from_id' => $a->id, 'to_id' => $b->id, 'body' => 'Private']);
        $this->actingAs($outsider)->deleteJson("/api/whispers/{$b->id}")->assertOk();
        $this->actingAs($b)->getJson("/api/whispers/{$a->id}")->assertJsonPath('messages.0.id', $direct->id);
        $this->assertDatabaseCount('hidden_whispers', 0);
    }
}
