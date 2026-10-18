<?php

namespace Tests\Feature;

use App\Events\ChatReactionUpdated;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ChatReactionTest extends TestCase
{
    use RefreshDatabase;

    public function test_reactions_persist_broadcast_switch_and_toggle_without_rewards(): void
    {
        Event::fake([ChatReactionUpdated::class]);
        $host = User::factory()->create();
        $member = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Music', 'slug' => 'music']);
        $message = $room->messages()->create(['user_id' => $host->id, 'body' => 'Hello', 'type' => 'user']);
        $url = '/rooms/music/messages/'.$message->id.'/reaction';
        $this->actingAs($member)->postJson($url, ['emoji' => '🔥'])->assertOk()->assertJsonPath('reactions.0.users.0', $member->id);
        $this->actingAs($host)->postJson($url, ['emoji' => '🔥'])->assertOk()->assertJsonCount(2, 'reactions.0.users');
        $this->get('/rooms/music')->assertInertia(fn ($p) => $p->where('messages.0.reactions.0.emoji', '🔥'));
        $this->actingAs($member)->postJson($url, ['emoji' => '❤️'])->assertOk()->assertJsonCount(2, 'reactions');
        $this->postJson($url, ['emoji' => '❤️'])->assertOk()->assertJsonCount(1, 'reactions');
        $this->assertSame(0, $member->refresh()->xp);
        $this->assertDatabaseCount('chat_reactions', 1);
        Event::assertDispatched(ChatReactionUpdated::class, 4);
        $message->delete();
        $this->assertDatabaseCount('chat_reactions', 0);
    }

    public function test_guest_muted_banned_private_and_wrong_room_reactions_are_rejected(): void
    {
        Event::fake([ChatReactionUpdated::class]);
        $host = User::factory()->create();
        $member = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Music', 'slug' => 'music']);
        $other = $host->rooms()->create(['name' => 'Other', 'slug' => 'other']);
        $message = $room->messages()->create(['user_id' => $host->id, 'body' => 'Hello', 'type' => 'user']);
        $url = '/rooms/music/messages/'.$message->id.'/reaction';
        $this->postJson($url, ['emoji' => '🔥'])->assertUnauthorized();
        $this->actingAs($member)->postJson('/rooms/other/messages/'.$message->id.'/reaction', ['emoji' => '🔥'])->assertNotFound();
        $this->postJson($url, ['emoji' => '<script>'])->assertUnprocessable();
        $room->update(['is_private' => true]);
        $this->postJson($url, ['emoji' => '🔥'])->assertForbidden();
        $room->update(['is_private' => false]);
        $room->bans()->create(['user_id' => $member->id]);
        $this->postJson($url, ['emoji' => '🔥'])->assertForbidden();
        $room->bans()->delete();
        $room->mutes()->create(['user_id' => $member->id]);
        $this->postJson($url, ['emoji' => '🔥'])->assertForbidden();
        $this->assertDatabaseCount('chat_reactions', 0);
    }
}
