<?php

namespace Tests\Feature;

use App\Http\Controllers\RoomController;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Halloween and Christmas are custom backgrounds: only the host of a room sees them in Room settings and can pick them. */
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
        $this->assertSame(['halloween', 'halloween2', 'christmas', 'christmas2', 'winter', 'spring', 'easter', 'summer', 'midsummer', 'synthwave', 'retrowave', 'definity', 'anime', 'latam', 'lightshow', 'cats', 'goldmine', 'skull', 'skulls', 'ultra', 'foxy', 'dragon', 'tastycat', 'tasty', 'monstercat', 'custom'], RoomController::HOST_BACKGROUNDS);
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

    public function test_somebody_who_may_edit_the_settings_is_not_shown_them_and_cannot_pick_them(): void
    {
        $host = User::factory()->create();
        $room = $this->room($host);
        $manager = $this->manager($room);

        $this->actingAs($manager)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $page) => $page
            ->where('can.edit_settings', true)
            ->where('backgrounds', ['midnight', 'sunset', 'neon', 'forest', 'club']));

        foreach (RoomController::HOST_BACKGROUNDS as $key) {
            $this->save($manager, $room, $key)->assertSessionHasErrors('background');
            $this->assertNull($room->refresh()->background);
        }

        // the plain ones are still theirs to pick
        $this->save($manager, $room, 'sunset')->assertSessionHasNoErrors();
        $this->assertSame('sunset', $room->refresh()->background);
    }

    public function test_when_the_host_has_put_one_on_a_manager_can_keep_it_or_leave_it_but_not_pick_another_custom_one(): void
    {
        $host = User::factory()->create();
        $room = $this->room($host);
        $manager = $this->manager($room);
        $this->save($host, $room, 'halloween')->assertSessionHasNoErrors();

        // they are not shown it, yet saving the settings again does not take it off
        $this->actingAs($manager)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $page) => $page->where('room.background', 'halloween')->where('backgrounds', fn ($list) => ! in_array('halloween', $list->all(), true)));
        $this->save($manager, $room, 'halloween')->assertSessionHasNoErrors();
        $this->assertSame('halloween', $room->refresh()->background);

        // another custom one is the host's alone
        $this->save($manager, $room, 'christmas')->assertSessionHasErrors('background');
        $this->assertSame('halloween', $room->refresh()->background);

        // and they may swap it for a plain one
        $this->save($manager, $room, 'neon')->assertSessionHasNoErrors();
        $this->assertSame('neon', $room->refresh()->background);
    }

    public function test_site_staff_and_guests_are_not_the_host_either(): void
    {
        $host = User::factory()->create();
        $room = $this->room($host);

        $admin = User::factory()->create();
        $admin->forceFill(['roles' => ['admin']])->save();
        $this->assertTrue($room->can($admin, 'edit_settings'));
        $this->actingAs($admin)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $page) => $page->where('backgrounds', ['midnight', 'sunset', 'neon', 'forest', 'club']));
        $this->save($admin, $room, 'christmas')->assertSessionHasErrors('background');
        $this->assertNull($room->refresh()->background);

        // a guest watching the room is sent the plain ones (they cannot save anything anyway)
        $this->app['auth']->forgetGuards();
        $this->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $page) => $page->where('backgrounds', ['midnight', 'sunset', 'neon', 'forest', 'club']));
        $this->patch("/rooms/{$room->slug}", ['name' => 'x', 'background' => 'christmas'])->assertRedirect(route('login'));
        $this->assertNull($room->refresh()->background);
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
