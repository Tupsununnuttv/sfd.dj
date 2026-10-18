<?php

namespace Tests\Feature;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PerformanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_sidebar_refresh_skips_unrequested_dashboard_queries(): void
    {
        $user = User::factory()->create();
        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = $query->sql;
        });
        $this->actingAs($user)->get('/dashboard', [
            'X-Inertia' => 'true',
            'X-Inertia-Version' => app(HandleInertiaRequests::class)->version(request()),
            'X-Inertia-Partial-Component' => 'Dashboard',
            'X-Inertia-Partial-Data' => 'unreadWhispers',
        ])->assertOk()->assertJsonPath('props.unreadWhispers', 0)->assertJsonMissingPath('props.rooms');
        foreach (['site_events', 'playlist_items', 'rooms'] as $table) {
            $this->assertEmpty(array_filter($queries, fn ($sql) => str_contains($sql, 'from "'.$table.'"')), 'Unrequested dashboard data queried '.$table);
        }
    }

    public function test_admin_users_batch_gifts_and_violation_counts_and_skip_other_tabs(): void
    {
        $owner = User::factory()->create();
        $owner->forceFill(['roles' => ['owner']])->save();
        User::factory()->count(16)->create();
        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = $query->sql;
        });
        $this->actingAs($owner)->get('/admin', [
            'X-Inertia' => 'true',
            'X-Inertia-Version' => app(HandleInertiaRequests::class)->version(request()),
            'X-Inertia-Partial-Component' => 'Admin',
            'X-Inertia-Partial-Data' => 'users',
        ])->assertOk()->assertJsonCount(15, 'props.users.data')->assertJsonMissingPath('props.rooms');
        foreach (['rooms', 'announcements'] as $table) {
            $this->assertEmpty(array_filter($queries, fn ($sql) => str_contains($sql, 'from "'.$table.'"')), 'An inactive admin tab queried '.$table);
        }
        // The IP ban exists-check must still run on every request; the full admin list must not.
        $this->assertEmpty(array_filter($queries, fn ($sql) => str_contains($sql, 'from "ip_bans"') && ! str_contains($sql, 'exists(')));
        $this->assertCount(1, array_filter($queries, fn ($sql) => str_contains($sql, 'from "violations"')));
        $this->assertLessThanOrEqual(2, count(array_filter($queries, fn ($sql) => str_contains($sql, 'from "subscription_gifts"'))));
    }
}
