<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** The top bar, the footbar and the menu of a room, the playlists page, and the partners on the home page. */
class RoomBarsTest extends TestCase
{
    use RefreshDatabase;

    private function source(string $path): string
    {
        return file_get_contents(resource_path("js/{$path}"));
    }

    public function test_the_menu_of_a_room_has_the_room_a_way_out_and_still_every_old_item_in_its_place(): void
    {
        $menu = $this->source('Components/Sidebar.tsx');

        // the heading is the name of the room, then Room, then what was there before in the same order, and Leave Room last
        $places = array_map(fn (string $text) => strpos($menu, $text), ['{room.name}</p>', "<span className={expanded ? 'inline' : 'hidden lg:inline'}>Room</span>", 'Playlists</span>', 'Whispers</span>', 'label="History"', 'Room settings</span>', 'Room moderation</span>', 'Leave Room</span>']);
        $this->assertNotContains(false, $places);
        $this->assertSame($places, collect($places)->sort()->values()->all(), 'the room section is out of order');

        // Leave Room goes to the Dashboard, and the menu above the room section is unchanged
        $this->assertStringContainsString("href={route('dashboard')} title=\"Leave Room\"", $menu);
        foreach (['Dashboard', 'Community', 'Events', 'Friends', 'Avatar shop', 'Referral', 'FAQ', 'Patch notes', 'Docs', 'My Stuff', 'Admin panel', 'Log out'] as $label) {
            $this->assertStringContainsString($label, $menu);
        }
    }

    public function test_room_user_rows_use_authority_weights_username_ties_and_put_bots_last(): void
    {
        $room = $this->source('Pages/Room.tsx');
        $sort = $this->source('lib/roomUserSort.ts');

        $this->assertStringContainsString('sortRoomUsersByWeight(users, roleOrder)', $room);
        $this->assertStringContainsString("label: 'API Bots'", $room);
        $this->assertStringContainsString('if (user.is_bot) return roleOrder.length + 1;', $sort);
        $this->assertStringContainsString('roleOrder.indexOf(key)', $sort);
        $this->assertStringContainsString('localeCompare(b.username ?? b.name', $sort);
    }

    public function test_the_top_bar_keeps_everything_it_had_and_gains_the_way_out_and_the_name_of_the_room(): void
    {
        $bar = $this->source('Components/RoomHeader.tsx');

        foreach (['you are here', 'watching', 'is playing:', 'Waiting for the next DJ', 'listening', 'RoomBadge', 'Leave the room', "route('dashboard')", '{room.name}', 'Our social media', 'SocialIcon'] as $text) {
            $this->assertStringContainsString($text, $bar);
        }
        // our social media took the place of the Room info button; Room info is still in More, in the footbar
        $this->assertStringNotContainsString('Room info', $bar);
        $this->assertStringContainsString("label: 'Room info'", $this->source('Components/RoomFootbar.tsx'));
        $this->assertStringContainsString('<RoomHeader', $this->source('Pages/Room.tsx'));
    }

    public function test_the_footbar_shows_the_active_playlist_and_the_next_track_and_keeps_playback_and_skip(): void
    {
        $bar = $this->source('Components/RoomFootbar.tsx');

        foreach (['Active playlist', 'Next track', "route('api.playlists.deck')", "route('api.playlists.activate'", 'Manage playlists', 'Skip song', 'Playback', 'More'] as $text) {
            $this->assertStringContainsString($text, $bar);
        }

        $room = $this->source('Pages/Room.tsx');
        $this->assertStringContainsString('<RoomFootbar', $room);
        $this->assertStringContainsString("route('rooms.join'", $room, 'Join Waitlist uses the active playlist');
    }

    public function test_the_volume_and_how_far_the_song_is_are_in_the_top_bar_and_woot_grab_meh_never_fade(): void
    {
        $top = $this->source('Components/RoomHeader.tsx');
        $bottom = $this->source('Components/RoomFootbar.tsx');

        // the volume on the right of the top bar, how far the song is under "… is playing:" in the middle of it
        foreach (['aria-label="Volume"', "'Mute'", 'data-volume', 'mmss(position)', 'mmss(duration)', 'data-progress', 'is playing:'] as $text) {
            $this->assertStringContainsString($text, $top);
        }
        // the footbar has neither any more, and no Playlists button either (Playlists is in the menu)
        foreach (['aria-label="Volume"', 'mmss(position)', 'aria-label="Playlists"', "label: 'Playlists'"] as $text) {
            $this->assertStringNotContainsString($text, $bottom);
        }
        $room = $this->source('Pages/Room.tsx');
        $this->assertMatchesRegularExpression('/<RoomHeader[^>]*onVolume=/s', $room);

        // Woot, Grab and Meh stay as bright when nothing is playing: they just cannot be pressed
        $this->assertStringNotContainsString('opacity-45', $this->source('Components/VoteBar.tsx'));
    }

    public function test_the_playlists_page_and_the_room_overlay_both_use_the_new_manager(): void
    {
        $this->actingAs(User::factory()->create())->get('/playlists')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Playlists'));

        foreach (['Pages/Playlists.tsx', 'Pages/Room.tsx'] as $file) {
            $this->assertStringContainsString('<PlaylistManager', $this->source($file));
        }
        $manager = $this->source('Components/PlaylistManager.tsx');
        foreach (['My Playlists', 'Selected playlist', 'Drag tracks to define the play order', 'Set as active', 'Queue all', "route('api.playlists.order'", "route('api.playlists.shuffle'"] as $text) {
            $this->assertStringContainsString($text, $manager);
        }
    }

    public function test_the_home_page_names_the_partners(): void
    {
        $this->get('/')->assertOk();

        $words = $this->source('lib/siteContent.ts');
        foreach (['Borealise', 'club.dj', 'cord.dj'] as $name) {
            $this->assertStringContainsString("name: '{$name}'", $words);
        }
        $this->assertStringContainsString('Our partners', $this->source('Pages/Welcome.tsx'));
        $this->assertStringContainsString('{partners.map', $this->source('Pages/Welcome.tsx'));
    }

    public function test_the_music_starts_by_itself_and_a_browser_that_holds_the_sound_back_gets_it_muted_until_a_click(): void
    {
        $room = $this->source('Pages/Room.tsx');

        $this->assertStringNotContainsString('Click to join the room', $room);
        $this->assertStringNotContainsString('sfddj.joined', $room);
        // not playing (or playing without sound) after a moment: play it muted, and the first click or key anywhere turns the sound on
        $this->assertStringContainsString('p?.mute?.();', $room);
        $this->assertStringContainsString('p?.playVideo?.();', $room);
        $this->assertStringContainsString('onAutoplayBlocked:', $room);
        $this->assertStringContainsString('e.data === 2', $room);
        $this->assertStringContainsString("document.addEventListener('visibilitychange'", $room);
        $this->assertStringContainsString("window.addEventListener('pageshow'", $room);
        $this->assertStringContainsString('returnedToRoom', $room);
        $this->assertStringContainsString("['pointerup', 'keydown', 'touchend']", $room);
        $this->assertStringContainsString('player.current?.unMute?.();', $room);
        $this->assertStringContainsString('Tap to start playback with sound', $room);
        $this->assertStringContainsString('SYNC_THRESHOLD_SECONDS = 8', $room);
        $this->assertStringContainsString('SYNC_COOLDOWN_MS = 15_000', $room);
        $this->assertStringContainsString('activePlayer.seekTo?.(target, true)', $room);
        $this->assertStringNotContainsString('title="Add friend"', $room);
        $this->assertStringNotContainsString('addFriend(', $room);
        $this->assertStringContainsString('min-w-0 max-w-full flex-1 truncate leading-5', $room);
        $this->assertStringNotContainsString('auto_join', $this->source('Pages/Settings/Audio.tsx'));
    }
}
