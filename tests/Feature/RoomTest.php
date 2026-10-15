<?php

namespace Tests\Feature;

use App\Events\ChatCleared;
use App\Events\MessageSent;
use App\Events\PlaybackUpdated;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class RoomTest extends TestCase
{
    use RefreshDatabase;

    public function test_created_rooms_use_clean_unique_slugs_and_old_urls_redirect(): void
    {
        $owner = User::factory()->create();

        $this->actingAs($owner)->post('/rooms', ['name' => 'Chillzone'])
            ->assertRedirect('/rooms/chillzone');
        $this->assertDatabaseHas('rooms', ['name' => 'Chillzone', 'slug' => 'chillzone']);

        $this->actingAs(User::factory()->create())->post('/rooms', ['name' => 'Chillzone'])
            ->assertRedirect('/rooms/chillzone-2');

        $legacyRoom = $owner->rooms()->create(['name' => 'Old Chillzone', 'slug' => 'old-chillzone']);
        $legacyRoom->oldSlugs()->create(['slug' => 'old-chillzone-ciwy']);
        $this->assertDatabaseHas('room_slugs', ['room_id' => $legacyRoom->id, 'slug' => 'old-chillzone-ciwy']);

        $this->actingAs($owner)->get('/rooms/old-chillzone-ciwy')->assertRedirect('/rooms/old-chillzone');
    }

    public function test_a_live_update_server_that_is_down_does_not_break_the_chat(): void
    {
        // Reverb is set up but nothing answers on its port: the way a server that is not running looks
        config([
            'broadcasting.default' => 'reverb',
            'broadcasting.connections.reverb.key' => 'key',
            'broadcasting.connections.reverb.secret' => 'secret',
            'broadcasting.connections.reverb.app_id' => '1',
            'broadcasting.connections.reverb.options' => ['host' => '127.0.0.1', 'port' => 1, 'scheme' => 'http', 'useTLS' => false],
            'broadcasting.connections.reverb.client_options' => ['connect_timeout' => 1, 'timeout' => 2],
        ]);
        Log::spy();

        $user = User::factory()->create();
        $room = $user->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-down']);

        $this->actingAs($user)->post("/rooms/{$room->slug}/messages", ['body' => 'still here'])->assertSuccessful();

        $this->assertDatabaseHas('chat_messages', ['room_id' => $room->id, 'body' => 'still here']);
        Log::shouldHaveReceived('error')->withArgs(fn ($message) => str_contains((string) $message, 'Pusher error'))->atLeast()->once(); // reported, not thrown
    }

    public function test_queue_plays_in_order_and_skip_ignores_stale_items(): void
    {
        Event::fake([PlaybackUpdated::class, MessageSent::class]);
        Http::fake(['*' => Http::response(['title' => 'Song'])]);

        $user = User::factory()->create();
        $room = $user->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-abcd']);

        $this->actingAs($user)->post("/rooms/{$room->slug}/queue", ['url' => 'https://youtu.be/dQw4w9WgXcQ'])->assertNoContent();
        $this->actingAs($user)->post("/rooms/{$room->slug}/queue", ['url' => 'https://www.youtube.com/watch?v=9bZkp7q19f0'])->assertNoContent();

        $state = $room->refresh()->playback();
        $this->assertSame('dQw4w9WgXcQ', $state['current']['youtube_id']);
        $this->assertCount(1, $state['queue']);

        $first = $state['current']['id'];
        $this->actingAs($user)->post("/rooms/{$room->slug}/skip", ['item_id' => $first])->assertNoContent();
        $this->actingAs($user)->post("/rooms/{$room->slug}/skip", ['item_id' => $first])->assertNoContent(); // duplicate "ended"

        $state = $room->refresh()->playback();
        $this->assertSame('9bZkp7q19f0', $state['current']['youtube_id']);
        $this->assertCount(0, $state['queue']);

        $this->actingAs($user)->post("/rooms/{$room->slug}/skip", ['item_id' => $state['current']['id']]);
        $this->assertNull($room->refresh()->playback()['current']);
    }

    public function test_player_duration_is_saved_only_for_the_current_song_and_broadcast(): void
    {
        Event::fake([PlaybackUpdated::class]);
        $user = User::factory()->create();
        $room = $user->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-duration']);
        $current = $room->enqueue(['youtube_id' => 'abcdefghijk', 'title' => 'Current', 'duration' => 0], $user->id);
        $next = $room->enqueue(['youtube_id' => 'lmnopqrstuv', 'title' => 'Next', 'duration' => 0], $user->id);

        $this->actingAs($user)->postJson("/rooms/{$room->slug}/duration", ['item_id' => $next->id, 'duration' => 3672])->assertNoContent();
        $this->assertDatabaseHas('playlist_items', ['id' => $next->id, 'duration' => 0]);

        $this->actingAs($user)->postJson("/rooms/{$room->slug}/duration", ['item_id' => $current->id, 'duration' => 3672])->assertNoContent();
        $this->assertDatabaseHas('playlist_items', ['id' => $current->id, 'duration' => 3672]);
        $this->assertSame(3672, $room->refresh()->playback()['current']['duration']);
        Event::assertDispatched(PlaybackUpdated::class);
    }

    public function test_rejects_non_youtube_links_and_broadcasts_chat(): void
    {
        Event::fake([PlaybackUpdated::class, MessageSent::class]);

        $user = User::factory()->create();
        $room = $user->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-abcd']);

        $this->actingAs($user)->postJson("/rooms/{$room->slug}/queue", ['url' => 'https://example.com'])
            ->assertJsonValidationErrors('url');

        $this->actingAs($user)->post("/rooms/{$room->slug}/messages", ['body' => 'hi'])->assertNoContent();
        Event::assertDispatched(MessageSent::class);
        $this->actingAs($user)->get("/rooms/{$room->slug}")->assertOk();
    }

    public function test_only_owner_moderates_and_avatars_are_whitelisted(): void
    {
        Event::fake([PlaybackUpdated::class, MessageSent::class, ChatCleared::class]);

        $owner = User::factory()->create();
        $guest = User::factory()->create();
        $room = $owner->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-abcd']);

        $this->actingAs($guest)->delete("/rooms/{$room->slug}/messages")->assertForbidden();
        $this->actingAs($guest)->patch("/rooms/{$room->slug}", ['name' => 'Hacked'])->assertForbidden();
        $this->actingAs($owner)->delete("/rooms/{$room->slug}/messages")->assertNoContent();
        Event::assertDispatched(ChatCleared::class);

        $this->actingAs($guest)->post('/shop/equip', ['avatar' => 'char:foxy']);
        $this->assertSame('char:foxy', $guest->refresh()->character);
        $this->actingAs($guest)->post('/shop/equip', ['avatar' => '💩'])->assertSessionHasErrors('avatar');
        $this->actingAs($guest)->post('/shop/equip', ['avatar' => '🎧'])->assertSessionHasErrors('avatar'); // the plain emoji are not in the shop any more
    }

    public function test_presence_channel_auth_returns_member_info(): void
    {
        config(['broadcasting.default' => 'reverb']);
        require base_path('routes/channels.php'); // register channels on the reverb driver
        $user = User::factory()->create(['avatar' => '🎧']);
        $room = $user->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);

        $res = $this->actingAs($user)->post('/broadcasting/auth', [
            'channel_name' => "presence-room.{$room->id}",
            'socket_id' => '123.456',
        ])->assertOk();

        $this->assertSame($user->name, json_decode($res->json('channel_data'), true)['user_info']['name']);
        $this->post('/logout');
        $this->post('/broadcasting/auth', ['channel_name' => "presence-room.{$room->id}", 'socket_id' => '1.2'])->assertForbidden();
    }
}
