<?php

namespace Tests\Feature;

use App\Events\UserRestrictionsChanged;
use App\Events\WhisperSent;
use App\Models\Friendship;
use App\Models\User;
use App\Models\Whisper;
use App\Models\WhisperCall;
use App\Models\WhisperGroup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UserRestrictionsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake([UserRestrictionsChanged::class, WhisperSent::class]);
    }

    private function change(User $viewer, User $target, array $data)
    {
        return $this->actingAs($viewer)->putJson("/api/users/{$target->id}/restrictions", $data);
    }

    public function test_block_and_ignore_are_private_independent_and_reversible(): void
    {
        [$a, $b] = User::factory()->count(2)->create();
        $this->change($a, $b, ['ignored' => true])->assertOk()->assertJsonPath('state.ignored', [$b->id]);
        $this->change($a, $b, ['blocked' => true])->assertOk()->assertJsonPath('state.blocked', [$b->id])->assertJsonPath('state.ignored', [$b->id]);
        $this->change($a, $b, ['blocked' => false])->assertOk()->assertJsonPath('state.blocked', [])->assertJsonPath('state.ignored', [$b->id]);
        $this->getJson('/api/user-restrictions')->assertJsonCount(1, 'people')->assertJsonPath('people.0.user.id', $b->id);
        $this->actingAs($b)->getJson('/api/user-restrictions')->assertJsonCount(0, 'people')->assertJsonPath('state.ignored', []);
        $this->change($a, $b, ['ignored' => false])->assertOk()->assertJsonPath('state.ignored', []);
        $this->assertDatabaseCount('user_restrictions', 0);
        Event::assertDispatched(UserRestrictionsChanged::class, fn ($event) => $event->userId === $a->id && (string) $event->broadcastOn()[0] === 'private-App.Models.User.'.$a->id);
    }

    public function test_restrictions_require_authentication_and_cannot_target_yourself(): void
    {
        $a = User::factory()->create();
        $this->getJson('/api/user-restrictions')->assertUnauthorized();
        $this->putJson("/api/users/{$a->id}/restrictions", ['blocked' => true])->assertUnauthorized();
        $this->change($a, $a, ['blocked' => true])->assertUnprocessable();
        $b = User::factory()->create();
        $this->change($a, $b, [])->assertUnprocessable();
        $this->change($a, $b, ['blocked' => 'invalid'])->assertUnprocessable();
        $this->assertDatabaseCount('user_restrictions', 0);
    }

    public function test_block_prevents_whispers_calls_and_friend_requests_in_both_directions_even_for_staff(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create(['roles' => ['admin']]);
        $this->change($a, $b, ['blocked' => true])->assertOk();
        foreach ([[$a, $b], [$b, $a]] as [$sender, $target]) {
            $this->actingAs($sender)->postJson('/api/whispers', ['user_id' => $target->id, 'body' => 'Hello'])->assertForbidden();
            $this->postJson('/api/whisper-calls', ['user_id' => $target->id, 'video' => false])->assertForbidden();
            $this->postJson('/friends', ['user_id' => $target->id])->assertUnprocessable();
        }
        $this->assertDatabaseCount('whispers', 0);
        $this->assertDatabaseCount('whisper_calls', 0);
        $this->assertDatabaseCount('friendships', 0);
        $this->change($a, $b, ['blocked' => false])->assertOk();
        $this->actingAs($b)->postJson('/api/whispers', ['user_id' => $a->id, 'body' => 'Hello again'])->assertCreated();
    }

    public function test_block_ends_existing_calls_and_cancels_pending_friend_requests(): void
    {
        [$a, $b] = User::factory()->count(2)->create();
        $call = WhisperCall::create(['caller_id' => $b->id, 'callee_id' => $a->id, 'video' => false, 'status' => 'ringing', 'offer' => "v=0\r\n", 'caller_seen' => now()]);
        $friendship = Friendship::create(['user_id' => $b->id, 'friend_id' => $a->id]);
        $this->change($a, $b, ['blocked' => true])->assertOk();
        $this->assertSame('ended', $call->refresh()->status);
        $this->assertNull($call->offer);
        $this->assertDatabaseMissing('friendships', ['id' => $friendship->id]);
        $this->actingAs($b)->patchJson("/api/whisper-calls/{$call->id}", ['action' => 'heartbeat'])->assertConflict();
    }

    public function test_ignore_hides_whispers_quotes_and_unread_counts_without_deleting_messages(): void
    {
        [$a, $b, $c] = User::factory()->count(3)->create();
        $message = Whisper::create(['from_id' => $b->id, 'to_id' => $a->id, 'body' => 'Ignored text']);
        $own = Whisper::create(['from_id' => $a->id, 'to_id' => $b->id, 'body' => 'My reply', 'reply_to_id' => $message->id]);
        $this->change($a, $b, ['ignored' => true])->assertOk();
        $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('unreadWhispers', 0)->where('userRestrictions.ignored', [$b->id]));
        $this->getJson("/api/whispers/{$b->id}")->assertJsonCount(1, 'messages')->assertJsonPath('messages.0.id', $own->id)->assertJsonPath('messages.0.reply', null);
        $this->actingAs($b)->postJson('/api/whispers', ['user_id' => $a->id, 'body' => 'Still hidden'])->assertCreated();
        $this->actingAs($a)->getJson('/api/whispers')->assertJsonPath('0.unread', 0)->assertJsonPath('0.last.id', $own->id);
        $this->actingAs($b)->getJson("/api/whispers/{$a->id}")->assertJsonCount(3, 'messages')->assertJsonPath('messages.1.reply.id', $message->id);
        $this->actingAs($c)->getJson('/api/user-restrictions')->assertJsonPath('state.ignored', []);
        $this->change($a, $b, ['ignored' => false])->assertOk();
        $this->getJson("/api/whispers/{$b->id}")->assertJsonCount(3, 'messages');
        $this->assertDatabaseCount('whispers', 3);
    }

    public function test_shared_group_history_last_message_and_unread_counts_filter_hidden_authors(): void
    {
        [$a, $b, $c] = User::factory()->count(3)->create();
        $group = WhisperGroup::create(['name' => 'Together', 'owner_id' => $a->id]);
        $group->admit([$a, $b, $c]);
        $hidden = Whisper::create(['group_id' => $group->id, 'from_id' => $b->id, 'body' => 'Hidden']);
        $visible = Whisper::create(['group_id' => $group->id, 'from_id' => $c->id, 'body' => 'Visible', 'reply_to_id' => $hidden->id]);
        Whisper::create(['group_id' => $group->id, 'from_id' => $b->id, 'body' => 'Hidden latest']);
        $this->change($a, $b, ['blocked' => true])->assertOk();
        $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('unreadWhispers', 1));
        $this->getJson('/api/whisper-groups')->assertJsonPath('0.last.id', $visible->id)->assertJsonPath('0.last.reply', null)->assertJsonPath('0.unread', 1);
        $this->getJson("/api/whisper-groups/{$group->id}")->assertJsonCount(1, 'messages')->assertJsonPath('messages.0.reply', null);
        $this->actingAs($c)->getJson("/api/whisper-groups/{$group->id}")->assertJsonCount(3, 'messages')->assertJsonPath('messages.1.reply.id', $hidden->id);
    }

    public function test_block_prevents_group_invitations_without_removing_existing_memberships(): void
    {
        [$a, $b] = User::factory()->count(2)->create();
        Friendship::create(['user_id' => $a->id, 'friend_id' => $b->id, 'status' => 'accepted']);
        $this->change($a, $b, ['blocked' => true])->assertOk();
        $this->actingAs($b)->postJson('/api/whisper-groups', ['name' => 'New group', 'user_ids' => [$a->id]])->assertForbidden();
        $this->assertDatabaseCount('whisper_groups', 0);
        $this->assertDatabaseHas('friendships', ['user_id' => $a->id, 'friend_id' => $b->id, 'status' => 'accepted']);
    }

    public function test_chat_history_and_reply_quotes_hide_only_for_the_viewer(): void
    {
        [$a, $b, $c] = User::factory()->count(3)->create();
        $room = $a->rooms()->create(['name' => 'Filters', 'slug' => 'restriction-room']);
        $hidden = $room->messages()->create(['user_id' => $b->id, 'type' => 'user', 'body' => 'Hidden chat']);
        $reply = $room->messages()->create(['user_id' => $c->id, 'type' => 'user', 'body' => 'Visible reply', 'reply_to_id' => $hidden->id]);
        $this->change($a, $b, ['ignored' => true])->assertOk();
        $this->get('/rooms/restriction-room')->assertInertia(fn (Assert $page) => $page->has('messages', 1)->where('messages.0.id', $reply->id)->where('messages.0.reply', null));
        $this->actingAs($c)->get('/rooms/restriction-room')->assertInertia(fn (Assert $page) => $page->has('messages', 2)->where('messages.1.reply.user_id', $b->id));
    }

    public function test_ignored_voice_recordings_are_hidden_only_for_the_viewer(): void
    {
        config(['filesystems.uploads' => 'local']);
        Storage::fake('local');
        [$a, $b] = User::factory()->count(2)->create();
        $message = Whisper::create(['from_id' => $b->id, 'to_id' => $a->id, 'body' => '', 'audio' => 'ignored.webm', 'audio_seconds' => 2]);
        Storage::disk('local')->put('whispers/ignored.webm', 'audio');
        $this->change($a, $b, ['ignored' => true])->assertOk();
        $this->get("/api/whispers/{$message->id}/audio")->assertNotFound();
        $this->actingAs($b)->get("/api/whispers/{$message->id}/audio")->assertOk();
        Storage::disk('local')->assertExists('whispers/ignored.webm');
        $this->change($a, $b, ['ignored' => false])->assertOk();
        $this->get("/api/whispers/{$message->id}/audio")->assertOk();
    }
}
