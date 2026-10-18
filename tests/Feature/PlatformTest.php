<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Events\PlaybackUpdated;
use App\Events\RoomRolesUpdated;
use App\Models\Friendship;
use App\Models\PlaylistItem;
use App\Models\Room;
use App\Models\Setting;
use App\Models\SitePermission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class PlatformTest extends TestCase
{
    use RefreshDatabase;

    private function userWith(string ...$roles): User
    {
        $user = User::factory()->create();
        $user->forceFill(['roles' => $roles])->save();

        return $user;
    }

    public function test_dashboard_renders_with_rooms_activity_and_no_reverb(): void
    {
        $user = User::factory()->create();
        $user->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);

        $this->actingAs($user)->get('/dashboard')->assertOk()
            ->assertInertia(fn ($page) => $page->component('Dashboard')->has('rooms', 1)->has('activity'));
        $this->actingAs($user)->get('/explore')->assertNotFound();
    }

    public function test_new_rooms_get_default_roles_and_host_roles_gate_actions(): void
    {
        Event::fake([RoomRolesUpdated::class, PlaybackUpdated::class]);

        $host = User::factory()->create();
        $guest = User::factory()->create();
        $other = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);

        $this->assertSame(['Co-Host', 'Manager', 'Bouncer', 'Resident DJ'], $room->roles()->pluck('name')->all());

        // a plain guest can do nothing
        $this->actingAs($guest)->delete("/rooms/{$room->slug}/messages")->assertForbidden();
        $this->actingAs($guest)->post("/rooms/{$room->slug}/roles", ['name' => 'X', 'color' => '#ffffff', 'permissions' => []])->assertForbidden();

        // the host creates a custom role and gives it to the guest
        $this->actingAs($host)->post("/rooms/{$room->slug}/roles", ['name' => 'Chat Cop', 'color' => '#ff0000', 'permissions' => ['moderate_chat']])->assertRedirect();
        $custom = $room->roles()->where('name', 'Chat Cop')->firstOrFail();
        $this->actingAs($host)->put("/rooms/{$room->slug}/members/{$guest->id}", ['room_role_id' => $custom->id])->assertNoContent();

        $this->actingAs($guest)->delete("/rooms/{$room->slug}/messages")->assertNoContent();      // allowed by the custom role
        $this->actingAs($guest)->patch("/rooms/{$room->slug}", ['name' => 'Mine'])->assertForbidden(); // not granted

        // invalid permission names and the host's own role are rejected
        $this->actingAs($host)->post("/rooms/{$room->slug}/roles", ['name' => 'Bad', 'color' => '#ff0000', 'permissions' => ['nuke']])->assertSessionHasErrors('permissions.0');
        $this->actingAs($host)->put("/rooms/{$room->slug}/members/{$host->id}", ['room_role_id' => $custom->id])->assertStatus(422);

        // a Co-Host (can assign roles) cannot hand out more power than a role they hold unless it lacks manage_roles
        $coHost = $room->roles()->where('name', 'Co-Host')->firstOrFail();
        $this->actingAs($host)->put("/rooms/{$room->slug}/members/{$guest->id}", ['room_role_id' => $coHost->id])->assertNoContent();
        $this->actingAs($guest)->put("/rooms/{$room->slug}/members/{$other->id}", ['room_role_id' => $coHost->id])->assertForbidden();

        // built-in roles cannot be edited or deleted
        $this->actingAs($host)->delete("/rooms/{$room->slug}/roles/{$coHost->id}")->assertNotFound();

        // deleting a custom role removes it from its holders
        $this->actingAs($host)->delete("/rooms/{$room->slug}/roles/{$custom->id}")->assertRedirect();
        $this->assertDatabaseMissing('room_roles', ['id' => $custom->id]);
    }

    public function test_manual_skip_needs_permission_but_song_end_does_not(): void
    {
        Event::fake([PlaybackUpdated::class]);

        $host = User::factory()->create();
        $dj = User::factory()->create();
        $stranger = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);

        foreach (['a', 'b', 'c'] as $i => $id) {
            $room->enqueue(['youtube_id' => str_repeat($id, 11), 'title' => $id], $dj->id);
        }
        $first = $room->refresh()->current_item_id;

        $this->actingAs($stranger)->post("/rooms/{$room->slug}/skip", ['item_id' => $first])->assertForbidden();
        $this->travel(30)->seconds(); // unknown-length songs cannot be ended immediately by a listener
        $this->actingAs($stranger)->post("/rooms/{$room->slug}/skip", ['item_id' => $first, 'ended' => true])->assertNoContent();
        $this->assertNotSame($first, $room->refresh()->current_item_id);

        // the person who queued a song may skip it themselves
        $this->actingAs($dj)->post("/rooms/{$room->slug}/skip", ['item_id' => $room->current_item_id])->assertNoContent();
        $this->assertSame(1, PlaylistItem::where('room_id', $room->id)->whereNull('played_at')->count());
    }

    public function test_friend_requests_accept_and_unfriend(): void
    {
        $a = User::factory()->create(['name' => 'Alice']);
        $b = User::factory()->create(['name' => 'Bob']);

        $this->actingAs($a)->post('/friends', ['name' => 'nobody'])->assertSessionHasErrors('name');
        $this->actingAs($a)->post('/friends', ['name' => 'alice'])->assertSessionHasErrors('name'); // yourself
        $this->actingAs($a)->post('/friends', ['name' => 'bob'])->assertRedirect();
        $this->actingAs($a)->post('/friends', ['name' => 'bob'])->assertSessionHasErrors('name');   // already sent

        $friendship = Friendship::firstOrFail();
        $this->actingAs($a)->patch("/friends/{$friendship->id}")->assertForbidden(); // sender cannot accept their own request
        $this->actingAs($b)->get('/friends')->assertInertia(fn ($p) => $p->has('incoming', 1)->has('friends', 0));
        $this->actingAs($b)->patch("/friends/{$friendship->id}")->assertRedirect();
        $this->actingAs($a)->get('/friends')->assertInertia(fn ($p) => $p->has('friends', 1)->has('incoming', 0));

        $outsider = User::factory()->create();
        $this->actingAs($outsider)->delete("/friends/{$friendship->id}")->assertForbidden();
        $this->actingAs($b)->delete("/friends/{$friendship->id}")->assertRedirect();
        $this->assertSame(0, Friendship::count());
    }

    public function test_ip_bans_maintenance_and_broadcast(): void
    {
        $admin = $this->userWith('admin');
        $member = User::factory()->create();

        // banning your own IP is refused, other IPs work and then block visitors
        $this->actingAs($admin)->post('/admin/ip-bans', ['ip' => '127.0.0.1'])->assertSessionHasErrors('ip');
        $this->actingAs($admin)->post('/admin/ip-bans', ['ip' => '203.0.113.9', 'reason' => 'spam'])->assertRedirect();
        $this->actingAs($member)->post('/admin/ip-bans', ['ip' => '203.0.113.10'])->assertForbidden();
        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.9'])->get('/')->assertForbidden();
        $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])->get('/')->assertOk();

        $this->actingAs($member)->post('/admin/broadcast', ['message' => 'x', 'level' => 'info'])->assertForbidden();

        // maintenance: members see the maintenance page, staff and login still work
        $this->actingAs($admin)->put('/admin/maintenance', ['enabled' => true])->assertForbidden(); // admins lack maintenance.toggle by default
        Setting::put('maintenance', '1');
        $this->actingAs($member)->get('/dashboard')->assertStatus(503);
        $this->actingAs($admin)->get('/dashboard')->assertOk();
        $this->app['auth']->forgetGuards();
        $this->get('/login')->assertOk();

        // a broadcast is written in the chat of every room, and nowhere else
        $room = $admin->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby']);
        $this->actingAs($admin)->post('/admin/broadcast', ['message' => 'Hello all', 'level' => 'info'])->assertRedirect();
        $this->assertDatabaseHas('chat_messages', ['room_id' => $room->id, 'type' => 'system', 'kind' => 'broadcast', 'body' => 'Hello all']);
    }

    public function test_permission_matrix_is_owner_only_and_drives_access(): void
    {
        $owner = $this->userWith('owner');
        $admin = $this->userWith('admin');
        $helper = $this->userWith('helper');

        $this->actingAs($helper)->get('/admin')->assertForbidden();
        $this->actingAs($admin)->put('/admin/permissions', ['granted' => []])->assertForbidden();

        // owner gives Helper admin access and takes broadcast away from Admin
        $this->actingAs($owner)->put('/admin/permissions', ['granted' => [
            'helper' => ['admin.access'],
            'admin' => ['admin.access', 'users.manage'],
        ]])->assertRedirect();

        $this->assertTrue($helper->refresh()->hasPermission('admin.access'));
        $this->assertFalse($admin->refresh()->hasPermission('broadcast.send'));
        $this->assertTrue($owner->refresh()->hasPermission('maintenance.toggle')); // owner is never locked out
        $this->actingAs($helper)->get('/admin')->assertOk();
        $this->assertNotNull(SitePermission::where('role', 'helper')->first());
    }

    public function test_violations_preferences_and_site_moderators(): void
    {
        $admin = $this->userWith('admin');
        $member = User::factory()->create();
        $siteMod = $this->userWith('site_moderator');
        $room = $member->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);

        $this->actingAs($admin)->post("/admin/users/{$member->id}/violations", ['reason' => 'Spamming chat'])->assertRedirect();
        $this->actingAs($member)->get('/settings/violations')->assertInertia(fn ($p) => $p->has('violations', 1));
        $this->actingAs($member)->post("/admin/users/{$admin->id}/violations", ['reason' => 'nope'])->assertForbidden();

        $this->actingAs($member)->patch('/settings/preferences', ['audio' => ['default_volume' => 35], 'appearance' => ['chat_size' => 'large']])->assertRedirect();
        $this->actingAs($member)->patch('/settings/preferences', ['audio' => ['default_volume' => 500]])->assertSessionHasErrors('audio.default_volume');
        $this->assertSame(35, $member->refresh()->preferences['audio']['default_volume']);
        $this->assertSame('large', $member->preferences['appearance']['chat_size']);

        // a Site Moderator can moderate any room, but cannot edit its settings
        $this->actingAs($siteMod)->delete("/rooms/{$room->slug}/messages")->assertNoContent();
        $this->actingAs($siteMod)->patch("/rooms/{$room->slug}", ['name' => 'Taken'])->assertForbidden();

        // team roles exist and are ordered below Helper but above supporters
        $roles = collect(Role::cases())->map->value->all();
        $this->assertLessThan(array_search('promoter', $roles), array_search('helper', $roles));
        $this->assertLessThan(array_search('supporter', $roles), array_search('brand_ambassador', $roles));
    }
}
