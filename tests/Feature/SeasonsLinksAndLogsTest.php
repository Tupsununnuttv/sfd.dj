<?php

namespace Tests\Feature;

use App\Http\Controllers\RoomController;
use App\Models\Room;
use App\Models\User;
use App\Support\LinkGuard;
use App\Support\Season;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Halloween and Christmas that come on by themselves, links to other sites that never go out, and the moderation log that the host can clear. */
class SeasonsLinksAndLogsTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function room(string $background = 'neon'): Room
    {
        $room = User::factory()->create()->rooms()->create(['name' => 'Seasons', 'slug' => 'seasons']);
        $room->forceFill(['background' => $background])->save();

        return $room->refresh();
    }

    private function shown(?User $who = null): ?string
    {
        $background = null;
        ($who ? $this->actingAs($who) : $this)->get('/rooms/seasons')->assertInertia(function (Assert $page) use (&$background) {
            $background = $page->toArray()['props']['room']['background'];
        });

        return $background;
    }

    private function save(User $who, ?string $background, string $name = 'Seasons')
    {
        return $this->actingAs($who)->patch('/rooms/seasons', ['name' => $name, 'background' => $background]);
    }

    public function test_the_seasons_have_their_days_and_christmas_runs_into_january(): void
    {
        $at = fn (string $day) => Season::current(Carbon::parse($day))['id'] ?? null;

        $this->assertNull($at('2026-09-30'));
        $this->assertSame('halloween-2026', $at('2026-10-01'));
        $this->assertSame('halloween-2026', $at('2026-10-31 23:59'));
        $this->assertNull($at('2026-11-01'));
        $this->assertSame('christmas-2026', $at('2026-12-01'));
        $this->assertSame('christmas-2026', $at('2027-01-06'));
        $this->assertNull($at('2027-01-07'));

        // their backgrounds are the host's, and exactly the ones in the Special group of Room settings
        $special = [];
        preg_match_all('/^    (\w+): \{[^\n]*special: true/m', file_get_contents(resource_path('js/lib/backgrounds.ts')), $special);
        $this->assertSame($special[1], array_merge(...array_column(Season::ALL, 'backgrounds')));
        $this->assertSame([], array_diff($special[1], RoomController::HOST_BACKGROUNDS));
    }

    public function test_in_october_every_room_turns_halloween_the_host_picks_v2_and_after_it_the_room_has_its_own_again(): void
    {
        $room = $this->room('neon');
        $host = $room->user;

        Carbon::setTestNow('2026-09-20');
        $this->assertSame('neon', $this->shown());

        Carbon::setTestNow('2026-10-09');
        $this->assertSame('halloween', $this->shown()); // by itself, also for guests
        $this->get('/rooms/seasons')->assertInertia(fn (Assert $page) => $page->where('seasons.0.key', 'halloween')->where('seasons.0.on', true)->where('seasons.1.on', false));

        // saving the settings with the season's background on (a new name) changes nothing about it
        $this->save($host, 'halloween', 'Spooky')->assertSessionHasNoErrors();
        $this->assertSame('halloween', $this->shown());
        $this->assertSame('neon', $room->refresh()->background);

        // the host likes V2 better: only for the season
        $this->save($host, 'halloween2')->assertSessionHasNoErrors();
        $this->assertSame('halloween2', $this->shown());
        $this->assertSame('neon', $room->refresh()->background);

        Carbon::setTestNow('2026-11-02');
        $this->assertSame('neon', $this->shown());

        // a year on Halloween comes again, the choice of last year is forgotten
        Carbon::setTestNow('2027-10-05');
        $this->assertSame('halloween', $this->shown());
    }

    public function test_any_other_background_switches_the_season_off_in_the_room_and_becomes_its_own(): void
    {
        $room = $this->room('neon');
        $host = $room->user;
        Carbon::setTestNow('2026-12-10');
        $this->assertSame('christmas', $this->shown());

        $this->save($host, 'ultra')->assertSessionHasNoErrors();
        $this->assertSame('ultra', $this->shown());
        $this->assertSame('ultra', $room->refresh()->background);

        Carbon::setTestNow('2027-01-10');
        $this->assertSame('ultra', $this->shown());

        // a room whose own background is one of the season's keeps it in the season
        $room->forceFill(['background' => 'christmas2', 'season' => null, 'season_background' => null])->save();
        Carbon::setTestNow('2027-12-03');
        $this->assertSame('christmas2', $this->shown());
    }

    public function test_a_manager_can_save_the_settings_while_the_season_is_on_but_not_pick_a_custom_background(): void
    {
        $room = $this->room('neon');
        $manager = User::factory()->create();
        $room->members()->create(['user_id' => $manager->id, 'room_role_id' => $room->roles()->where('name', 'Manager')->value('id')]);
        Carbon::setTestNow('2026-10-20');

        $this->save($manager, 'halloween', 'Renamed')->assertSessionHasNoErrors();
        $this->assertSame('Renamed', $room->refresh()->name);
        $this->save($manager, 'halloween2')->assertSessionHasErrors('background');
        $this->save($manager, 'forest')->assertSessionHasNoErrors(); // a colour scheme: the season is off here now
        $this->assertSame('forest', $this->shown());
    }

    public function test_links_to_other_sites_are_found_and_only_partners_and_sfd_dj_pass(): void
    {
        foreach (['go to plug.dj', 'https://www.youtube.com/watch?v=x', 'see plug . dj', 'plug(dot)dj', 'plug[.]dj', 'www.example.org', 't.me/someone', 'join WAVEZ', 'wavez.fm is better', 'plugdj forever', 'turntable.fm'] as $text) {
            $this->assertSame(LinkGuard::MESSAGE, LinkGuard::check($text), $text);
        }
        foreach (['join club.dj', 'https://cord.dj/r/x', 'app.borealise.com/room', 'https://borealise.com', 'check sfd.dj/rooms', 'That was great. Live sets!', 'e.g. this', 'version 1.5', 'mail me at me@gmail.com', 'my turntable is broken', 'the dot com era', ''] as $text) {
            $this->assertNull(LinkGuard::check($text), $text);
        }
    }

    public function test_chat_whispers_bios_and_room_texts_refuse_other_sites_but_staff_may(): void
    {
        $room = $this->room();
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $staff = User::factory()->create();
        $staff->forceFill(['roles' => ['admin']])->save();

        $this->actingAs($me)->postJson('/rooms/seasons/messages', ['body' => 'come to plug.dj'])->assertStatus(422)->assertJsonPath('errors.body.0', LinkGuard::MESSAGE);
        $this->assertSame(0, $room->messages()->where('user_id', $me->id)->count());
        $this->assertTrue($room->logs()->where('action', 'automod')->where('details', 'like', '%plug.dj%')->exists()); // the moderators see it
        $this->actingAs($me)->postJson('/rooms/seasons/messages', ['body' => 'our partner club.dj'])->assertNoContent();
        $this->actingAs($staff)->postJson('/rooms/seasons/messages', ['body' => 'staff may post youtube.com'])->assertNoContent();

        $this->actingAs($me)->postJson('/api/whispers', ['user_id' => $friend->id, 'body' => 'psst wavez.fm'])->assertStatus(422)->assertJsonPath('message', LinkGuard::MESSAGE);
        $this->actingAs($me)->postJson('/api/whispers', ['user_id' => $friend->id, 'body' => 'see you at cord.dj'])->assertCreated();

        $this->actingAs($me)->patch('/profile', ['name' => $me->name, 'email' => $me->email, 'bio' => 'Find me on plug.dj'])->assertSessionHasErrors('bio');
        $this->actingAs($room->user)->patch('/rooms/seasons', ['name' => 'Seasons', 'description' => 'we moved to wavez'])->assertSessionHasErrors('description');
    }

    public function test_the_host_and_staff_delete_lines_of_the_moderation_log_and_moderators_cannot(): void
    {
        $room = $this->room();
        $host = $room->user;
        $manager = User::factory()->create();
        $room->members()->create(['user_id' => $manager->id, 'room_role_id' => $room->roles()->where('name', 'Manager')->value('id')]);
        foreach (range(1, 3) as $i) {
            $room->log($manager, 'kick', $host, "line {$i}");
        }
        $first = $room->logs()->first();
        $other = User::factory()->create()->rooms()->create(['name' => 'Other', 'slug' => 'other']);
        $other->log($host, 'kick', $manager);

        $this->actingAs($manager)->get('/rooms/seasons')->assertInertia(fn (Assert $page) => $page->where('mod.can_clear_logs', false));
        $this->actingAs($host)->get('/rooms/seasons')->assertInertia(fn (Assert $page) => $page->where('mod.can_clear_logs', true));

        $this->actingAs($manager)->deleteJson("/rooms/seasons/logs/{$first->id}")->assertForbidden();
        $this->actingAs($manager)->deleteJson('/rooms/seasons/logs')->assertForbidden();
        $this->actingAs($host)->deleteJson('/rooms/seasons/logs/'.$other->logs()->first()->id)->assertNotFound(); // not this room's

        $this->actingAs($host)->deleteJson("/rooms/seasons/logs/{$first->id}")->assertNoContent();
        $this->assertSame(2, $room->logs()->count());

        $staff = User::factory()->create();
        $staff->forceFill(['roles' => ['admin']])->save();
        $this->actingAs($staff)->deleteJson('/rooms/seasons/logs')->assertNoContent();
        $this->assertSame(0, $room->logs()->count());
        $this->assertSame(1, $other->logs()->count());
    }
}
