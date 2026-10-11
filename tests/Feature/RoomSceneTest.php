<?php

namespace Tests\Feature;

use App\Http\Controllers\RoomController;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RoomSceneTest extends TestCase
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

    public function test_the_song_that_is_playing_says_who_the_dj_is_so_a_guest_can_see_them_behind_the_booth(): void
    {
        $host = User::factory()->create();
        $host->forceFill(['avatar' => '🎧', 'roles' => ['vip'], 'xp' => 80, 'cosmetics' => ['frame' => 'gold']])->save();
        $other = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Scene', 'slug' => 'scene-room']);
        $room->enqueue(['youtube_id' => 'aaaaaaaaaaa', 'title' => 'First', 'thumbnail' => null, 'duration' => 300], $host->id);
        $room->enqueue(['youtube_id' => 'bbbbbbbbbbb', 'title' => 'Second', 'thumbnail' => null, 'duration' => 300], $other->id);

        // a guest sees nobody else in the room, but the DJ is there
        $this->get('/rooms/scene-room')->assertInertia(fn (Assert $page) => $page
            ->component('Room')
            ->where('playback.current.title', 'First')
            ->where('playback.current.dj.id', $host->id)
            ->where('playback.current.dj.name', $host->name)
            ->where('playback.current.dj.avatar', '🎧')
            ->where('playback.current.dj.character', $host->character)
            ->where('playback.current.dj.cosmetics', ['frame' => 'gold'])
            ->where('playback.current.dj.level', 3)
            ->where('playback.current.dj.role.label', 'VIP')
            ->where('playback.current.dj.badges.0.icon', '💜')
            ->missing('playback.current.dj.email')
            ->missing('playback.queue.0.dj'));
    }

    public function test_the_host_can_pick_the_halloween_background_and_nothing_else_unknown(): void
    {
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Spooky', 'slug' => 'spooky-room']);

        $this->actingAs($host)->patch('/rooms/spooky-room', ['name' => 'Spooky', 'background' => 'halloween'])->assertSessionHasNoErrors();
        $this->assertSame('halloween', $room->refresh()->background);
        $this->get('/rooms/spooky-room')->assertInertia(fn (Assert $page) => $page->where('room.background', 'halloween'));

        $this->actingAs($host)->patch('/rooms/spooky-room', ['name' => 'Spooky', 'background' => 'not-a-real-background'])->assertSessionHasErrors('background');
        $this->assertSame('halloween', $room->refresh()->background);
    }

    public function test_every_background_the_server_accepts_is_drawn_named_and_saved_as_a_picture(): void
    {
        $scenes = file_get_contents(resource_path('js/lib/scenes.ts'));
        $banners = file_get_contents(resource_path('js/lib/backgrounds.ts'));

        foreach (RoomController::BACKGROUNDS as $key) {
            $this->assertMatchesRegularExpression('/^    '.$key.': \{/m', $scenes, "scenes.ts has no palette for {$key}");
            $this->assertMatchesRegularExpression('/^    '.$key.': \{ label: /m', $banners, "backgrounds.ts has no name for {$key}");
        }

        // the pictures (1600 x 900) that go with the scenes, for the default one and for each of them
        foreach (['default', ...array_diff(RoomController::BACKGROUNDS, ['custom'])] as $key) { // "custom" is the host's own picture, there is none to ship
            foreach (['png', 'svg'] as $type) {
                $this->assertFileExists(public_path("backgrounds/{$key}.{$type}"));
            }
            $this->assertSame([1600, 900], array_slice(getimagesize(public_path("backgrounds/{$key}.png")), 0, 2), "{$key}.png is not 1600 x 900");
        }

        // Halloween and Christmas are sceneries of their own, not the club in other colours
        foreach (['halloween' => 'Halloween', 'christmas' => 'Christmas', 'halloween2' => 'Halloween2', 'christmas2' => 'Christmas2', 'winter' => 'Winter', 'spring' => 'Spring', 'easter' => 'Easter', 'summer' => 'Summer', 'midsummer' => 'Midsummer', 'synthwave' => 'Synthwave', 'retrowave' => 'Retrowave', 'definity' => 'Definity', 'anime' => 'Anime', 'latam' => 'Latam', 'lightshow' => 'Lightshow', 'cats' => 'Cats', 'goldmine' => 'GoldMine', 'skull' => 'Skull', 'skulls' => 'Skulls', 'ultra' => 'Ultra', 'foxy' => 'Foxy', 'dragon' => 'Dragon', 'tastycat' => 'Tastycat', 'tasty' => 'Tasty', 'monstercat' => 'Monstercat', 'custom' => 'Custom'] as $key => $file) {
            $this->assertStringContainsString("theme: '{$key}'", $scenes);
            $this->assertFileExists(resource_path("js/Components/scene/{$file}.tsx"));
        }
    }

    public function test_nobody_is_behind_the_booth_when_nothing_is_playing(): void
    {
        $host = User::factory()->create();
        $host->rooms()->create(['name' => 'Quiet', 'slug' => 'quiet-room']);

        $this->actingAs($host)->get('/rooms/quiet-room')->assertInertia(fn (Assert $page) => $page->where('playback.current', null));
    }

    public function test_halloween_and_christmas_are_in_a_special_group_of_their_own_for_the_host(): void
    {
        $banners = file_get_contents(resource_path('js/lib/backgrounds.ts'));
        preg_match_all('/^    (\w+): \{[^\n]*special: true/m', $banners, $special);
        $this->assertSame(['halloween', 'halloween2', 'christmas', 'christmas2'], $special[1]);

        // they stay the host's to pick, like the other custom ones, and the settings show them under "Special"
        $this->assertSame([], array_diff($special[1], RoomController::HOST_BACKGROUNDS));
        $panel = file_get_contents(resource_path('js/Components/RoomSettingsPanel.tsx'));
        $this->assertStringContainsString('data-special-backgrounds', $panel);
        $this->assertStringContainsString('Special</span>', $panel);
        $this->assertStringContainsString('scenes.filter(([, b]) => b.host && !b.special)', $panel);

        // smoke puffs grow round their own middle (they used to grow from the corner of the room and fly across it)
        $this->assertStringContainsString('.sc-smoke { transform-box: fill-box; transform-origin: center; }', file_get_contents(resource_path('css/app.css')));

        // the host can put the new ones on
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Seasons', 'slug' => 'seasons']);
        foreach (['halloween2', 'easter', 'midsummer'] as $key) {
            $this->actingAs($host)->patch('/rooms/seasons', ['name' => 'Seasons', 'background' => $key])->assertSessionHasNoErrors();
            $this->assertSame($key, $room->refresh()->background);
        }
    }
}
