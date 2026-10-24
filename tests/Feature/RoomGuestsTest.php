<?php

namespace Tests\Feature;

use App\Events\RoomGuestsChanged;
use App\Models\User;
use App\Support\RoomGuests;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RoomGuestsTest extends TestCase
{
    use RefreshDatabase;

    public function test_anonymous_watchers_have_private_session_aliases_and_expire_without_accounts(): void
    {
        Event::fake([RoomGuestsChanged::class]);
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Watching', 'slug' => 'watching']);
        $response = $this->withSession(['room_guest_key' => 'first-browser-secret'])->postJson('/rooms/watching/watchers')->assertOk();
        $person = $response->json('guests.0');
        $this->assertTrue($person['is_guest']);
        $this->assertMatchesRegularExpression('/^guest-[a-f0-9]{12}$/', $person['id']);
        $this->assertStringNotContainsString('first-browser-secret', $response->getContent());
        $this->assertArrayNotHasKey('seen_at', $person);
        $this->postJson('/rooms/watching/watchers')->assertJsonCount(1, 'guests');
        $this->withSession(['room_guest_key' => 'second-browser-secret'])->postJson('/rooms/watching/watchers')->assertJsonCount(2, 'guests');
        $this->assertSame(1, User::count());
        $this->assertSame([$room->id => 2], RoomGuests::counts([$room->id]));
        Event::assertDispatchedTimes(RoomGuestsChanged::class, 2);
        $this->travel(RoomGuests::TTL + 1)->seconds();
        $this->assertSame([], RoomGuests::members($room));
        $this->assertSame([$room->id => 0], RoomGuests::counts([$room->id]));
    }

    public function test_guest_watchers_are_shown_in_room_data_and_dashboard_counts_alongside_the_selfbot(): void
    {
        Event::fake([RoomGuestsChanged::class]);
        $host = User::factory()->create();
        $bot = User::factory()->create(['name' => 'Night Radio', 'is_bot' => true]);
        $room = $host->rooms()->create(['name' => 'Watching', 'slug' => 'watching', 'auto_host_bot_id' => $bot->id]);
        Cache::put('room_listener_counts', [$room->id => 3], 10);
        $this->postJson('/rooms/watching/watchers')->assertJsonCount(1, 'guests');
        $this->get('/rooms/watching')->assertInertia(fn (Assert $page) => $page->has('guestMembers', 1)->where('guestMembers.0.is_guest', true)->where('listening', 4));
        $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('rooms.0.auto_host_bot.name', 'Night Radio')->where('counts.'.$room->id, 4));
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('rooms.0.auto_host_bot.name', 'Night Radio')->where('rooms.0.listening', 4));
        $room->update(['live' => ['kind' => 'twitch', 'ref' => 'radio', 'url' => 'https://www.twitch.tv/radio', 'thumbnail' => null, 'title' => 'Night live', 'user_id' => $host->id, 'started_at' => now()->toIso8601String()]]);
        $this->get('/live')->assertInertia(fn (Assert $page) => $page->where('streams.0.room.auto_host_bot.name', 'Night Radio')->where('streams.0.listening', 4));
    }

    public function test_an_older_session_snapshot_cannot_create_a_second_alias_for_the_same_browser(): void
    {
        Event::fake([RoomGuestsChanged::class]);
        $host = User::factory()->create();
        $host->rooms()->create(['name' => 'Two tabs', 'slug' => 'two-tabs']);
        $first = $this->postJson('/rooms/two-tabs/watchers')->assertOk()->json('guests.0.id');
        $sessionId = session()->getId();
        // Another request that read the session before the first heartbeat saved can lose the field.
        $this->withCredentials()->withCookie(config('session.cookie'), $sessionId)->withSession(['room_guest_key' => null])->postJson('/rooms/two-tabs/watchers')->assertOk()
            ->assertJsonCount(1, 'guests')->assertJsonPath('guests.0.id', $first);
        Event::assertDispatchedTimes(RoomGuestsChanged::class, 1);
    }

    public function test_private_rooms_cannot_be_watched_and_logging_in_removes_the_anonymous_alias(): void
    {
        Event::fake([RoomGuestsChanged::class]);
        $host = User::factory()->create();
        $public = $host->rooms()->create(['name' => 'Public', 'slug' => 'public-watch']);
        $private = $host->rooms()->create(['name' => 'Private', 'slug' => 'private-watch', 'is_private' => true]);
        $this->postJson('/rooms/private-watch/watchers')->assertForbidden();
        $this->assertSame([], RoomGuests::members($private));
        $this->postJson('/rooms/public-watch/watchers')->assertJsonCount(1, 'guests');
        $this->actingAs($host)->postJson('/rooms/public-watch/watchers')->assertJsonCount(0, 'guests');
        $this->assertSame([], RoomGuests::members($public));
    }
}
