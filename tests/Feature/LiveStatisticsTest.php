<?php

namespace Tests\Feature;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\User;
use App\Support\RoomPresence;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;
use Mockery;
use Tests\TestCase;

class LiveStatisticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_counts_change_without_a_cache_delay_and_never_count_bots_as_members(): void
    {
        Cache::put('site_listener_snapshot', ['count' => 0], 60);
        $member = User::factory()->create();
        User::factory()->create(['is_bot' => true]);
        $member->rooms()->create(['name' => 'Public', 'slug' => 'public', 'is_private' => false]);
        $member->rooms()->create(['name' => 'Private', 'slug' => 'private', 'is_private' => true]);
        $response = $this->getJson('/api/site-stats')->assertOk()->assertJsonPath('members', 1)->assertJsonPath('rooms', 1)->assertJsonPath('listening', 0);
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertSame(['members', 'online', 'rooms', 'songs', 'listening', 'updated_at'], array_keys($response->json()));
        $newMember = User::factory()->create();
        $this->getJson('/api/site-stats')->assertJsonPath('members', 2);
        foreach (['/login', '/register'] as $page) {
            $this->get($page)->assertInertia(fn (Assert $p) => $p->where('siteStats.members', 2)->where('siteStats.rooms', 1));
        }
        $this->get('/')->assertInertia(fn (Assert $p) => $p->where('stats.members', 2)->where('stats.rooms', 1));
        $newMember->delete();
        $this->getJson('/api/site-stats')->assertJsonPath('members', 1);
    }

    public function test_online_counts_use_the_same_five_minute_human_activity_window(): void
    {
        Cache::put('site_listener_snapshot', ['count' => null], 60);
        User::factory()->create(['last_seen_at' => now()->subMinute()]);
        User::factory()->create(['last_seen_at' => now()->subMinutes(6)]);
        User::factory()->create(['last_seen_at' => null]);
        User::factory()->create(['is_bot' => true, 'last_seen_at' => now()]);
        $this->getJson('/api/site-stats')->assertJsonPath('members', 3)->assertJsonPath('online', 1)->assertJsonPath('listening', null);
        $this->travel(5)->minutes();
        $this->getJson('/api/site-stats')->assertJsonPath('online', 0);
    }

    public function test_listeners_are_deduplicated_across_rooms_and_bots_and_deleted_accounts_are_excluded(): void
    {
        [$one, $two] = User::factory()->count(2)->create();
        $bot = User::factory()->create(['is_bot' => true]);
        $pusher = Mockery::mock();
        $connection = Mockery::mock();
        Broadcast::shouldReceive('connection')->andReturn($connection);
        $connection->shouldReceive('getPusher')->andReturn($pusher);
        $pusher->shouldReceive('get')->with('/channels', ['filter_by_prefix' => 'presence-room.', 'info' => 'user_count'], true)->once()
            ->andReturn(['channels' => ['presence-room.1' => ['user_count' => 3], 'presence-room.2' => ['user_count' => 3]]]);
        $pusher->shouldReceive('get')->with('/channels/presence-room.1/users', [], true)->once()
            ->andReturn(['users' => [['id' => $one->id], ['id' => $two->id], ['id' => $bot->id]]]);
        $pusher->shouldReceive('get')->with('/channels/presence-room.2/users', [], true)->once()
            ->andReturn(['users' => [['id' => $one->id], ['id' => $two->id], ['id' => 999999]]]);
        $this->assertSame(2, RoomPresence::listenerCount());
        $this->assertSame(2, RoomPresence::listenerCount());
    }

    public function test_unreachable_listener_service_is_unknown_instead_of_a_fake_zero(): void
    {
        Broadcast::shouldReceive('connection')->andThrow(new \RuntimeException('Presence unavailable'));
        $this->getJson('/api/site-stats')->assertOk()->assertJsonPath('listening', null);
    }

    public function test_admin_overview_user_totals_and_filters_stay_consistent(): void
    {
        Cache::put('site_listener_snapshot', ['count' => 1], 60);
        $admin = User::factory()->create(['roles' => ['admin']]);
        User::factory()->create(['last_seen_at' => now()]);
        User::factory()->create(['last_seen_at' => now()->subDays(2)]);
        User::factory()->create(['is_bot' => true, 'last_seen_at' => now()]);
        $this->actingAs($admin)->get('/admin')->assertInertia(fn (Assert $p) => $p
            ->where('stats.users', 3)->where('stats.accounts', 4)->where('stats.bots', 1)
            ->where('stats.online', 2)->where('overview.kpis.online', 2)->where('overview.kpis.new_7d', 3)
            ->where('users.total', 4)->has('users.data', 4)->has('overview.recentUsers', 3));
        $this->get('/admin?type=members')->assertInertia(fn (Assert $p) => $p->where('users.total', 3)->has('users.data', 3));
        $this->get('/admin?type=bots')->assertInertia(fn (Assert $p) => $p->where('users.total', 1)->where('users.data.0.is_bot', true));
        $this->get('/admin?type=online')->assertInertia(fn (Assert $p) => $p->where('users.total', 2));
        $new = User::factory()->create();
        $this->get('/admin', ['X-Inertia' => 'true', 'X-Inertia-Version' => app(HandleInertiaRequests::class)->version(Request::create('/admin')), 'X-Inertia-Partial-Component' => 'Admin', 'X-Inertia-Partial-Data' => 'stats,users'])
            ->assertOk()->assertJsonPath('props.stats.users', 4)->assertJsonPath('props.users.total', 5);
        $new->delete();
        $this->getJson('/api/site-stats')->assertJsonPath('members', 3)->assertJsonPath('online', 2);
    }
}
