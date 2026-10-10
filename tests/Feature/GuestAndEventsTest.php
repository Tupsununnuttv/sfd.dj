<?php

namespace Tests\Feature;

use App\Events\MessageSent;
use App\Events\PlaybackUpdated;
use App\Models\Room;
use App\Models\SiteEvent;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GuestAndEventsTest extends TestCase
{
    use RefreshDatabase;

    private function staff(): User
    {
        $user = User::factory()->create();
        $user->forceFill(['roles' => ['admin']])->save();

        return $user;
    }

    public function test_guests_can_browse_public_pages_and_watch_a_room(): void
    {
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Open', 'slug' => 'open-1', 'welcome_message' => 'Hello']);
        $room->messages()->create(['user_id' => $host->id, 'body' => 'first']);

        $this->get('/dashboard')->assertOk()->assertInertia(fn (Assert $p) => $p->where('auth.guest', true)->where('auth.user.id', 0)->has('rooms', 1)->has('mine', 0));
        $this->get('/community')->assertOk()->assertInertia(fn (Assert $p) => $p->where('me', null));
        $this->get('/history')->assertOk();
        foreach (['/events', '/faq', '/patch-notes', '/docs'] as $page) {
            $this->get($page)->assertOk();
        }
        $this->get("/rooms/{$room->slug}")->assertOk()->assertInertia(fn (Assert $p) => $p
            ->where('can', [])->where('mod', null)->has('messages', 1)->where('myVotes.woot', false)->has('listening'));
    }

    public function test_guests_cannot_act_or_see_member_pages(): void
    {
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Open', 'slug' => 'open-1']);

        $this->post("/rooms/{$room->slug}/messages", ['body' => 'hi'])->assertRedirect('/login');
        $this->post("/rooms/{$room->slug}/vote", ['type' => 'woot'])->assertRedirect('/login');
        $this->post('/events', ['title' => 'Guest event', 'starts_at' => now()->addDay()->toIso8601String()])->assertRedirect('/login');
        foreach (['/playlists', '/friends', '/shop', '/my-stuff', '/profile', '/admin'] as $page) {
            $this->get($page)->assertRedirect('/login');
        }
    }

    public function test_private_rooms_stay_closed_to_guests_and_hidden(): void
    {
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Secret', 'slug' => 'secret-1', 'is_private' => true]);

        $this->get("/rooms/{$room->slug}")->assertForbidden();
        $this->get('/dashboard')->assertInertia(fn (Assert $p) => $p->has('rooms', 0));
    }

    public function test_unverified_users_are_still_sent_to_verification(): void
    {
        $this->mailWorks();
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)->get('/dashboard')->assertRedirect(route('verification.notice'));
    }

    public function test_live_events_also_go_to_the_public_view_channel_unless_private(): void
    {
        $host = User::factory()->create();
        $open = $host->rooms()->create(['name' => 'Open', 'slug' => 'open-1']);
        $secret = $host->rooms()->create(['name' => 'Secret', 'slug' => 'secret-1', 'is_private' => true]);

        $names = fn ($channels) => array_map(fn ($c) => $c->name, $channels);
        $this->assertSame(["presence-room.{$open->id}", "room-view.{$open->id}"], $names((new PlaybackUpdated($open))->broadcastOn()));
        $this->assertSame(["presence-room.{$secret->id}"], $names((new PlaybackUpdated($secret))->broadcastOn()));
        $this->assertInstanceOf(Channel::class, Room::channelsFor($open->id)[1]);
        $this->assertInstanceOf(PresenceChannel::class, Room::channelsFor($open->id)[0]);
        $this->assertSame(["presence-room.{$open->id}", "room-view.{$open->id}"], $names((new MessageSent($open->messages()->create(['user_id' => $host->id, 'body' => 'x'])))->broadcastOn()));
    }

    public function test_events_staff_create_everyone_sees_members_rsvp(): void
    {
        $staff = $this->staff();
        $member = User::factory()->create();
        $room = $staff->rooms()->create(['name' => 'Party', 'slug' => 'party-1']);
        $privateRoom = $staff->rooms()->create(['name' => 'Secret', 'slug' => 'secret-party', 'is_private' => true]);

        $this->actingAs($member)->post('/events', ['title' => 'Community meetup', 'starts_at' => now()->addDays(2)->toIso8601String()])->assertRedirect();
        $this->actingAs($member)->from('/events')->post('/events', ['title' => 'Private party', 'starts_at' => now()->addDays(3)->toIso8601String(), 'room_id' => $privateRoom->id])->assertSessionHasErrors('room_id');
        $memberEvent = SiteEvent::where('title', 'Community meetup')->firstOrFail();
        $this->actingAs($staff)->post('/events', ['title' => 'Listening party', 'starts_at' => now()->addDay()->toIso8601String(), 'room_id' => $room->id])->assertRedirect();
        $this->actingAs($staff)->post('/events', ['title' => 'Bad times', 'starts_at' => now()->addDay()->toIso8601String(), 'ends_at' => now()->toIso8601String()])->assertSessionHasErrors('ends_at');
        SiteEvent::create(['title' => 'Old one', 'starts_at' => now()->subDays(2), 'ends_at' => now()->subDays(2)->addHour()]);
        $event = SiteEvent::where('title', 'Listening party')->first();

        $this->app['auth']->forgetGuards(); // back to a guest
        $this->actingAs($member)->get('/events')->assertOk()->assertInertia(fn (Assert $p) => $p
            ->has('upcoming', 2)->where('upcoming.0.title', 'Listening party')->where('upcoming.0.room.slug', 'party-1')
            ->where('upcoming.0.going', false)->where('upcoming.0.can_delete', false)
            ->where('upcoming.1.title', 'Community meetup')->where('upcoming.1.can_delete', true)
            ->has('past', 1)->where('canCreate', true)->where('canManage', false));

        $this->actingAs($member)->post("/events/{$event->id}/attend")->assertRedirect();
        $this->actingAs($member)->get('/events')->assertInertia(fn (Assert $p) => $p->where('upcoming.0.going', true)->where('upcoming.0.going_count', 1));
        $this->actingAs($member)->post("/events/{$event->id}/attend");
        $this->assertSame(0, $event->attendees()->count());
        $this->app['auth']->forgetGuards();
        $this->post("/events/{$event->id}/attend")->assertRedirect('/login');

        $this->actingAs($member)->delete("/events/{$event->id}")->assertForbidden();
        $this->actingAs($member)->delete("/events/{$memberEvent->id}")->assertRedirect();
        $this->assertNull(SiteEvent::find($memberEvent->id));
        $this->actingAs($staff)->get('/events')->assertInertia(fn (Assert $p) => $p->where('canManage', true)->has('rooms', 2));
        $this->actingAs($staff)->delete("/events/{$event->id}")->assertRedirect();
        $this->assertNull(SiteEvent::find($event->id));
    }

    public function test_my_stuff_page(): void
    {
        $me = User::factory()->create(['cosmetics' => ['badge' => 'rookie', 'frame' => 'silver']]);
        $me->rooms()->create(['name' => 'Mine', 'slug' => 'mine-1']);

        $this->actingAs($me)->get('/my-stuff')->assertOk()->assertInertia(fn (Assert $p) => $p
            ->has('rooms', 1)->where('worn.Badge', 'Rookie')->where('worn.Frame', 'Silver')->where('worn.Effect', null)->where('stats.level', 1));
    }
}
