<?php

namespace Tests\Feature;

use App\Http\Controllers\RoomController;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Custom and seasonal backgrounds are available to people with permission to edit a room's settings. */
class CustomBackgroundTest extends TestCase
{
    use RefreshDatabase;

    // a day out of every season: in October or December every room shows Halloween or Christmas by itself (SeasonsLinksAndLogsTest)
    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-06-15 12:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function room(User $host): Room
    {
        return $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);
    }

    /** Somebody with a room role that may edit the settings (the Manager role every room starts with). */
    private function manager(Room $room): User
    {
        $user = User::factory()->create();
        $room->members()->create(['user_id' => $user->id, 'room_role_id' => $room->roles()->where('name', 'Manager')->value('id')]);

        return $user;
    }

    private function save(User $user, Room $room, ?string $background)
    {
        return $this->actingAs($user)->patch("/rooms/{$room->slug}", ['name' => $room->name, 'background' => $background]);
    }

    public function test_the_custom_backgrounds_are_marked_on_the_server_and_in_the_page(): void
    {
        $this->assertSame(['halloween', 'halloween2', 'christmas', 'christmas2', 'winter', 'spring', 'easter', 'summer', 'midsummer', 'synthwave', 'retrowave', 'synthwave2', 'retrowave2', 'definity', 'anime', 'latam', 'lightshow', 'cats', 'goldmine', 'celestial', 'skull', 'skulls', 'ultra', 'foxy', 'dragon', 'tastycat', 'tasty', 'monstercat', 'custom'], RoomController::HOST_BACKGROUNDS);
        $this->assertSame([], array_diff(RoomController::HOST_BACKGROUNDS, RoomController::BACKGROUNDS));

        // lib/backgrounds.ts marks exactly the same ones with host: true
        $names = file_get_contents(resource_path('js/lib/backgrounds.ts'));
        foreach (RoomController::BACKGROUNDS as $key) {
            $marked = (bool) preg_match('/^    '.$key.': \{[^\n]*host: true/m', $names);
            $this->assertSame(in_array($key, RoomController::HOST_BACKGROUNDS, true), $marked, "{$key} is marked differently on the server and in lib/backgrounds.ts");
        }
    }

    public function test_the_host_is_shown_the_custom_backgrounds_and_can_pick_each_of_them(): void
    {
        $host = User::factory()->create();
        $room = $this->room($host);

        $this->actingAs($host)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $page) => $page
            ->where('backgrounds', RoomController::BACKGROUNDS));

        foreach (['halloween', 'christmas', 'club', null] as $key) {
            $this->save($host, $room, $key)->assertSessionHasNoErrors();
            $this->assertSame($key, $room->refresh()->background);
        }
    }

    public function test_a_room_manager_with_settings_permission_can_see_and_pick_custom_backgrounds(): void
    {
        $host = User::factory()->create();
        $room = $this->room($host);
        $manager = $this->manager($room);

        $this->actingAs($manager)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $page) => $page
            ->where('can.edit_settings', true)
            ->where('backgrounds', RoomController::BACKGROUNDS));

        foreach (array_diff(RoomController::HOST_BACKGROUNDS, ['custom']) as $key) {
            $this->save($manager, $room, $key)->assertSessionHasNoErrors();
            $this->assertSame($key, $room->refresh()->background);
        }

        $room->update(['custom_background' => 'room-picture.png']);
        $this->save($manager, $room, 'custom')->assertSessionHasNoErrors();
        $this->assertSame('custom', $room->refresh()->background);
    }

    public function test_a_manager_can_keep_or_change_a_host_selected_background(): void
    {
        $host = User::factory()->create();
        $room = $this->room($host);
        $manager = $this->manager($room);
        $this->save($host, $room, 'halloween')->assertSessionHasNoErrors();

        $this->actingAs($manager)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $page) => $page->where('room.background', 'halloween')->where('backgrounds', RoomController::BACKGROUNDS));
        $this->save($manager, $room, 'halloween')->assertSessionHasNoErrors();
        $this->assertSame('halloween', $room->refresh()->background);

        $this->save($manager, $room, 'christmas')->assertSessionHasNoErrors();
        $this->assertSame('christmas', $room->refresh()->background);

        // and they may swap it for a plain one
        $this->save($manager, $room, 'neon')->assertSessionHasNoErrors();
        $this->assertSame('neon', $room->refresh()->background);
    }

    public function test_site_staff_and_owners_can_manage_backgrounds_but_guests_cannot(): void
    {
        $host = User::factory()->create();
        $room = $this->room($host);

        $admin = User::factory()->create();
        $admin->forceFill(['roles' => ['admin']])->save();
        $this->assertTrue($room->can($admin, 'edit_settings'));
        $this->actingAs($admin)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $page) => $page->where('backgrounds', RoomController::BACKGROUNDS));
        $this->save($admin, $room, 'christmas')->assertSessionHasNoErrors();
        $this->assertSame('christmas', $room->refresh()->background);

        $owner = User::factory()->create();
        $owner->forceFill(['roles' => ['owner']])->save();
        $this->assertTrue($room->can($owner, 'edit_settings'));
        $this->actingAs($owner)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $page) => $page->where('backgrounds', RoomController::BACKGROUNDS));
        $this->save($owner, $room, 'halloween')->assertSessionHasNoErrors();
        $this->assertSame('halloween', $room->refresh()->background);

        // a guest watching the room is sent the plain ones (they cannot save anything anyway)
        $this->app['auth']->forgetGuards();
        $this->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $page) => $page->where('backgrounds', ['midnight', 'sunset', 'neon', 'forest', 'club']));
        $this->patch("/rooms/{$room->slug}", ['name' => 'x', 'background' => 'christmas'])->assertRedirect(route('login'));
        $this->assertSame('halloween', $room->refresh()->background);
    }

    public function test_everybody_in_the_room_sees_the_background_the_host_picked(): void
    {
        $host = User::factory()->create();
        $room = $this->room($host);
        $this->save($host, $room, 'christmas');

        foreach ([User::factory()->create(), null] as $viewer) {
            $viewer ? $this->actingAs($viewer) : $this->app['auth']->forgetGuards();
            $this->get("/rooms/{$room->slug}")->assertOk()->assertInertia(fn (Assert $page) => $page->where('room.background', 'christmas'));
        }
    }
}
