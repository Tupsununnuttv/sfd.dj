<?php

namespace Tests\Feature;

use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Staff give a room Official, Verified and Partnered badges, any mix of them at once. */
class RoomBadgeTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->forceFill(['roles' => ['admin']])->save();

        return $admin;
    }

    public function test_staff_can_give_a_room_any_mix_of_official_verified_and_partnered(): void
    {
        $admin = $this->admin();
        $room = User::factory()->create()->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);
        $this->assertSame(['official', 'verified', 'partnered'], Room::BADGES);

        $this->actingAs(User::factory()->create())->patch('/admin/rooms/lobby-1', ['badges' => ['verified']])->assertForbidden();
        $this->assertNull($room->refresh()->badges);

        $cases = [
            [['verified'], ['verified']],
            [['verified', 'partnered'], ['verified', 'partnered']],
            [['partnered', 'official', 'verified'], ['official', 'verified', 'partnered']], // always in the same order
            [['verified', 'verified', 'official'], ['official', 'verified']],               // each one once
            [['official'], ['official']],
            [[], []],
        ];
        foreach ($cases as [$sent, $kept]) {
            $this->actingAs($admin)->patch('/admin/rooms/lobby-1', ['badges' => $sent])->assertRedirect();
            $this->assertSame($kept, $room->refresh()->badges);
        }

        $this->actingAs($admin)->patch('/admin/rooms/lobby-1', ['badges' => ['verified', 'partnered']]);
        $this->actingAs($admin)->patch('/admin/rooms/lobby-1', ['badges' => null])->assertSessionHasNoErrors();
        $this->assertSame([], $room->refresh()->badges, 'none sent takes them all away');

        $this->actingAs($admin)->patch('/admin/rooms/lobby-1', ['badges' => ['verified', 'fake']])->assertSessionHasErrors('badges.1');
        $this->actingAs($admin)->patch('/admin/rooms/lobby-1', ['badges' => 'verified'])->assertSessionHasErrors('badges');
    }

    public function test_changing_something_else_leaves_the_badges_alone(): void
    {
        $room = User::factory()->create()->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-2', 'badges' => ['official', 'partnered']]);

        $this->actingAs($this->admin())->patch('/admin/rooms/lobby-2', ['is_featured' => true])->assertRedirect();

        $this->assertSame(['official', 'partnered'], $room->refresh()->badges);
        $this->assertTrue($room->is_featured);
    }

    public function test_the_pages_get_the_badges_as_a_list(): void
    {
        $host = User::factory()->create();
        $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-3', 'badges' => ['official', 'verified', 'partnered']]);
        $host->rooms()->create(['name' => 'Plain', 'slug' => 'plain-3']);

        $this->actingAs($this->admin())->get('/admin')->assertOk();
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('rooms', fn ($rooms) => $rooms->firstWhere('slug', 'lobby-3')['badges'] === ['official', 'verified', 'partnered']));
        $this->actingAs($host)->get('/rooms/lobby-3')->assertInertia(fn (Assert $page) => $page->where('room.badges', ['official', 'verified', 'partnered']));
        $this->actingAs($host)->get('/my-stuff')->assertInertia(fn (Assert $page) => $page->where('rooms', fn ($rooms) => $rooms->firstWhere('slug', 'lobby-3')['badges'] === ['official', 'verified', 'partnered']));
    }

    public function test_the_admin_panel_has_a_switch_for_each_badge_and_the_pill_knows_all_three(): void
    {
        $pill = file_get_contents(resource_path('js/Components/RoomBadge.tsx'));
        foreach (['official', 'verified', 'partnered'] as $key) {
            $this->assertStringContainsString("{$key}: {", $pill);
        }

        $tab = file_get_contents(resource_path('js/Components/admin/RoomsTab.tsx'));
        $this->assertStringContainsString('roomBadgeKeys.map', $tab, 'one switch per badge');
        $this->assertStringContainsString('{ badges:', $tab);
        $this->assertStringNotContainsString('<select value={r.badge', $tab, 'not a single choice any more');
    }
}
