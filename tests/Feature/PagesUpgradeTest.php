<?php

namespace Tests\Feature;

use App\Models\Friendship;
use App\Models\SiteEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PagesUpgradeTest extends TestCase
{
    use RefreshDatabase;

    private function userWith(string ...$roles): User
    {
        $user = User::factory()->create();
        $user->forceFill(['roles' => $roles])->save();

        return $user->refresh();
    }

    public function test_activity_is_remembered_at_most_every_two_minutes(): void
    {
        $user = User::factory()->create()->refresh();
        $this->assertNull($user->last_seen_at);

        $this->actingAs($user)->get('/dashboard')->assertOk();
        $first = $user->refresh()->last_seen_at;
        $this->assertNotNull($first);

        $this->travel(1)->minutes();
        $this->actingAs($user)->get('/dashboard');
        $this->assertTrue($user->refresh()->last_seen_at->equalTo($first)); // too soon: not written again

        $this->travel(3)->minutes();
        $this->actingAs($user)->get('/dashboard');
        $this->assertTrue($user->refresh()->last_seen_at->greaterThan($first));
    }

    public function test_friends_page_shows_online_friends_first_and_people_you_may_know(): void
    {
        $me = User::factory()->create()->refresh();
        $online = User::factory()->create(['name' => 'Zed']);
        $offline = User::factory()->create(['name' => 'Amy']);
        $stranger = User::factory()->create(['name' => 'Cleo']);
        $other = User::factory()->create(['name' => 'Dan']);
        $online->forceFill(['last_seen_at' => now()])->save();

        foreach ([$online, $offline] as $f) {
            Friendship::create(['user_id' => $me->id, 'friend_id' => $f->id, 'status' => 'accepted']);
        }
        Friendship::create(['user_id' => $online->id, 'friend_id' => $stranger->id, 'status' => 'accepted']);
        Friendship::create(['user_id' => $offline->id, 'friend_id' => $stranger->id, 'status' => 'accepted']);
        Friendship::create(['user_id' => $online->id, 'friend_id' => $other->id, 'status' => 'accepted']);

        $this->actingAs($me)->get('/friends')->assertOk()->assertInertia(fn (Assert $p) => $p
            ->where('friends.0.name', 'Zed')->where('friends.0.online', true)
            ->where('friends.1.name', 'Amy')->where('friends.1.online', false)
            ->where('friends.0.user_id', $online->id)
            ->where('suggestions.0.name', 'Cleo')->where('suggestions.0.mutual', 2)
            ->where('suggestions.1.name', 'Dan')->where('suggestions.1.mutual', 1)
            ->has('suggestions', 2));
    }

    public function test_events_show_who_is_going_and_whether_they_are_live(): void
    {
        $user = User::factory()->create();
        $live = SiteEvent::create(['title' => 'Now', 'starts_at' => now()->subMinutes(10), 'ends_at' => now()->addHour()]);
        SiteEvent::create(['title' => 'Later', 'starts_at' => now()->addDays(2)]);
        $live->attendees()->attach($user->id);

        $this->actingAs($user)->get('/events')->assertInertia(fn (Assert $p) => $p
            ->where('upcoming.0.title', 'Now')->where('upcoming.0.is_live', true)->where('upcoming.0.going', true)
            ->where('upcoming.0.attendees.0.id', $user->id)
            ->where('upcoming.1.is_live', false)->where('upcoming.1.going_count', 0));
    }

    public function test_whispers_page_offers_friends_and_referral_page_has_numbers(): void
    {
        $me = User::factory()->create()->refresh();
        $friend = User::factory()->create(['username' => 'bff']);
        Friendship::create(['user_id' => $me->id, 'friend_id' => $friend->id, 'status' => 'accepted']);
        $invited = User::factory()->create();
        $invited->forceFill(['referred_by' => $me->id])->save();

        $this->actingAs($me)->get('/whispers')->assertInertia(fn (Assert $p) => $p->where('friends.0.username', 'bff'));
        $this->actingAs($me)->get('/referral')->assertOk()->assertInertia(fn (Assert $p) => $p
            ->has('referrals', 1)->where('referrals.0.id', $invited->id)->where('rank', 1)
            ->where('topInviters.0.id', $me->id)->where('topInviters.0.count', 1));
    }

    public function test_my_stuff_has_achievements_and_an_account_checklist(): void
    {
        $me = User::factory()->create()->refresh();
        $me->rooms()->create(['name' => 'Home', 'slug' => 'home-1']);

        $this->actingAs($me)->get('/my-stuff')->assertOk()->assertInertia(fn (Assert $p) => $p
            ->has('achievements', 15)
            ->where('achievements', fn ($list) => collect($list)->firstWhere('key', 'host')['done'] === true && collect($list)->firstWhere('key', 'first-play')['done'] === false)
            ->where('account.email_verified', true)->where('account.two_factor', false)->where('account.photo', false));
    }

    public function test_my_stuff_counts_a_selected_character_as_a_profile_picture(): void
    {
        $me = User::factory()->create(['avatar' => 'char:foxy']);

        $this->actingAs($me)->get('/my-stuff')->assertOk()->assertInertia(fn (Assert $p) => $p
            ->where('account.photo', true));
    }

    public function test_admin_overview_filters_and_health(): void
    {
        $owner = $this->userWith('owner');
        $mod = $this->userWith('moderator');
        $bot = User::factory()->create(['name' => 'Robo']);
        $bot->forceFill(['is_bot' => true, 'bot_owner_id' => $owner->id])->save();

        $this->actingAs($this->userWith())->get('/admin')->assertForbidden();

        $this->actingAs($owner)->get('/admin')->assertOk()->assertInertia(fn (Assert $p) => $p
            ->has('overview.kpis')->has('overview.series.users', 14)->has('overview.series.messages', 14)->has('overview.series.songs', 14)
            ->where('overview.kpis.bots', 1)
            ->where('overview.health', fn ($h) => collect($h)->contains(fn ($row) => $row[0] === 'Email' && $row[1] === 'warn')) // tests send mail to an array
            ->has('roleOptions')->where('filters.sort', 'newest'));

        $this->actingAs($owner)->get('/admin?type=bots')->assertInertia(fn (Assert $p) => $p->has('users.data', 1)->where('users.data.0.name', 'Robo'));
        $this->actingAs($owner)->get('/admin?role=moderator')->assertInertia(fn (Assert $p) => $p->has('users.data', 1)->where('users.data.0.id', $mod->id));
        $this->actingAs($owner)->get('/admin?sort=oldest')->assertInertia(fn (Assert $p) => $p->where('users.data.0.id', $owner->id));
        $this->actingAs($owner)->get('/admin?q=Robo')->assertInertia(fn (Assert $p) => $p->has('users.data', 1));
        $this->actingAs($owner)->get('/admin?role=nonsense&sort=nonsense')->assertOk()->assertInertia(fn (Assert $p) => $p->where('filters.role', null)->where('filters.sort', 'newest'));
    }
}
