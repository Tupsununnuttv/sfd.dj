<?php

namespace Tests\Feature;

use App\Events\PlaybackUpdated;
use App\Events\VoteCast;
use App\Http\Controllers\AvatarController;
use App\Http\Controllers\PlaylistController;
use App\Models\Playlist;
use App\Models\PlaylistItem;
use App\Models\PlaylistSong;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Broadcasting\Channel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

/** Grab asks which playlist the song goes in, the room hears about every vote, and everybody has a character. */
class GrabAndCharacterTest extends TestCase
{
    use RefreshDatabase;

    /** A room with one song playing, played by $dj. */
    private function playing(?User $dj = null): array
    {
        $dj ??= User::factory()->create();
        $room = $dj->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-grab']);
        $room->enqueue(['youtube_id' => 'aaaaaaaaaaa', 'title' => 'Song A', 'thumbnail' => null, 'duration' => 200], $dj->id);

        return [$room->refresh(), PlaylistItem::firstOrFail(), $dj];
    }

    private function grab(User $who, string $slug, array $body)
    {
        return $this->actingAs($who)->postJson("/rooms/{$slug}/vote", ['type' => 'grab'] + $body);
    }

    private function list(User $user, string $name): Playlist
    {
        return $user->playlists()->create(['name' => $name, 'kind' => 'custom']);
    }

    public function test_a_grab_with_no_playlist_asks_for_one_and_saves_nothing(): void
    {
        Event::fake([PlaybackUpdated::class, VoteCast::class]);
        $fan = User::factory()->create();
        [$room, $song, $dj] = $this->playing();

        $this->grab($fan, $room->slug, ['item_id' => $song->id])
            ->assertStatus(422)
            ->assertJsonPath('errors.playlist_id.0', 'You have no playlist yet. Make one first, then you can grab songs into it.');
        $this->assertSame(0, Vote::count());
        $this->assertSame(0, Playlist::count());
        $this->assertSame(0, $dj->refresh()->xp);
        Event::assertNotDispatched(VoteCast::class);

        // a blank name is no name
        $this->grab($fan, $room->slug, ['item_id' => $song->id, 'new_playlist' => '   '])->assertStatus(422);
        $this->assertSame(0, Playlist::count());
    }

    public function test_a_grab_can_make_the_first_playlist_and_puts_the_song_in_it(): void
    {
        Event::fake([PlaybackUpdated::class, VoteCast::class]);
        $fan = User::factory()->create();
        [$room, $song, $dj] = $this->playing();

        $this->grab($fan, $room->slug, ['item_id' => $song->id, 'new_playlist' => ' Road trip '])
            ->assertOk()
            ->assertJsonPath('playlist.name', 'Road trip')
            ->assertJsonPath('added', true)
            ->assertJsonPath('songs', 1);

        $list = Playlist::firstOrFail();
        $this->assertSame($fan->id, $list->user_id);
        $this->assertSame('custom', $list->kind);
        $this->assertTrue($list->is_active, 'the first list a person makes is the one they play from');
        $this->assertSame(['Song A'], $list->songs()->pluck('title')->all());
        $this->assertSame(1, Vote::where('type', 'grab')->count());
        $this->assertSame(3, $dj->refresh()->xp);
        $this->assertSame(2, $dj->coins);
        Event::assertDispatchedTimes(VoteCast::class, 1);
        Event::assertDispatched(VoteCast::class, fn (VoteCast $e) => $e->roomId === $room->id && $e->userId === $fan->id && $e->name === $fan->name && $e->type === 'grab');
    }

    public function test_a_grab_goes_into_the_playlist_that_was_picked_and_only_one_of_your_own(): void
    {
        Event::fake([PlaybackUpdated::class, VoteCast::class]);
        $fan = User::factory()->create();
        $stranger = User::factory()->create();
        [$room, $song, $dj] = $this->playing();
        $first = $this->list($fan, 'First');
        $second = $this->list($fan, 'Second');
        $theirs = $this->list($stranger, 'Theirs');

        $this->grab($fan, $room->slug, ['item_id' => $song->id, 'playlist_id' => $second->id])
            ->assertOk()->assertJsonPath('playlist.id', $second->id)->assertJsonPath('added', true)->assertJsonPath('songs', 1);
        $this->assertSame(0, $first->songs()->count());

        // again into the same list: it is there already, nothing is added, nothing is paid twice
        $this->grab($fan, $room->slug, ['item_id' => $song->id, 'playlist_id' => $second->id])->assertOk()->assertJsonPath('added', false)->assertJsonPath('songs', 1);
        // into another one of mine: that one gets it too
        $this->grab($fan, $room->slug, ['item_id' => $song->id, 'playlist_id' => $first->id])->assertOk()->assertJsonPath('added', true);
        $this->assertSame(1, $first->songs()->count());
        $this->assertSame(1, Vote::where('type', 'grab')->count(), 'one grab, however many lists');
        $this->assertSame(3, $dj->refresh()->xp);
        Event::assertDispatchedTimes(VoteCast::class, 1);

        // somebody else's list, a list that does not exist, and no list at all
        $this->grab($fan, $room->slug, ['item_id' => $song->id, 'playlist_id' => $theirs->id])->assertStatus(422)->assertJsonPath('errors.playlist_id.0', 'Pick one of your own playlists.');
        $this->grab($fan, $room->slug, ['item_id' => $song->id, 'playlist_id' => 9999])->assertStatus(422)->assertJsonPath('errors.playlist_id.0', 'Pick one of your own playlists.');
        $this->grab($fan, $room->slug, ['item_id' => $song->id])->assertStatus(422)->assertJsonPath('errors.playlist_id.0', 'Pick the playlist to put this song in.');
        $this->assertSame(0, $theirs->songs()->count());
    }

    public function test_a_grab_of_a_song_that_is_gone_or_into_a_full_or_too_many_playlists_changes_nothing(): void
    {
        Event::fake([PlaybackUpdated::class, VoteCast::class]);
        $fan = User::factory()->create();
        [$room, $song] = $this->playing();
        $list = $this->list($fan, 'Mix');

        // the song changed while the window was open
        $this->grab($fan, $room->slug, ['item_id' => $song->id + 99, 'playlist_id' => $list->id])->assertStatus(409);
        $this->assertSame(0, $list->songs()->count());
        $this->assertSame(0, Vote::count());

        // a full list takes no more, but a song that is in it already is still a fine grab
        $now = now();
        $rows = array_map(fn ($i) => [
            'playlist_id' => $list->id, 'youtube_id' => str_pad("f{$i}", 11, 'x'), 'title' => "Filler {$i}", 'duration' => 100, 'origin' => 'youtube', 'position' => $i, 'created_at' => $now, 'updated_at' => $now,
        ], range(1, Playlist::MAX_SONGS));
        foreach (array_chunk($rows, 500) as $batch) {
            PlaylistSong::insert($batch);
        }
        $this->grab($fan, $room->slug, ['item_id' => $song->id, 'playlist_id' => $list->id])->assertStatus(422)->assertJsonPath('errors.playlist_id.0', fn ($m) => str_contains($m, 'is full'));
        $this->assertSame(0, Vote::count());
        PlaylistSong::where('playlist_id', $list->id)->where('position', 1)->update(['youtube_id' => $song->youtube_id]);
        $this->grab($fan, $room->slug, ['item_id' => $song->id, 'playlist_id' => $list->id])->assertOk()->assertJsonPath('added', false);
        $this->assertSame(Playlist::MAX_SONGS, $list->songs()->count());

        // and nobody makes more playlists than the limit allows, not even to grab into
        $other = User::factory()->create();
        foreach (range(1, PlaylistController::MAX_PLAYLISTS) as $i) {
            $this->list($other, "List {$i}");
        }
        $this->grab($other, $room->slug, ['item_id' => $song->id, 'new_playlist' => 'One more'])->assertStatus(422);
        $this->assertSame(PlaylistController::MAX_PLAYLISTS, Playlist::where('user_id', $other->id)->count());
    }

    public function test_the_room_hears_about_each_vote_once_per_person_and_song(): void
    {
        Event::fake([PlaybackUpdated::class, VoteCast::class]);
        $fan = User::factory()->create();
        $friend = User::factory()->create();
        [$room, $song, $dj] = $this->playing();
        $room->enqueue(['youtube_id' => 'bbbbbbbbbbb', 'title' => 'Song B', 'thumbnail' => null, 'duration' => 200], $dj->id);
        $vote = fn (User $who, string $type) => $this->actingAs($who)->postJson("/rooms/{$room->slug}/vote", ['type' => $type, 'item_id' => PlaylistItem::find($room->refresh()->current_item_id)->id]);

        $vote($fan, 'woot')->assertNoContent();
        Event::assertDispatchedTimes(VoteCast::class, 1);
        Event::assertDispatched(VoteCast::class, fn (VoteCast $e) => $e->userId === $fan->id && $e->type === 'woot' && $e->roomId === $room->id);

        $vote($fan, 'woot'); // taken back: nothing to announce
        $vote($fan, 'woot'); // put back on: the room was told already
        Event::assertDispatchedTimes(VoteCast::class, 1);

        $vote($fan, 'meh'); // a different vote is news
        $vote($friend, 'woot');
        Event::assertDispatchedTimes(VoteCast::class, 3);
        Event::assertDispatched(VoteCast::class, fn (VoteCast $e) => $e->userId === $fan->id && $e->type === 'meh');
        Event::assertDispatched(VoteCast::class, fn (VoteCast $e) => $e->userId === $friend->id && $e->type === 'woot');

        // the next song starts with a clean slate
        $this->actingAs($room->user)->post("/rooms/{$room->slug}/skip", ['item_id' => $song->id])->assertNoContent();
        $this->assertNotSame($song->id, $room->refresh()->current_item_id);
        $vote($fan, 'woot');
        Event::assertDispatchedTimes(VoteCast::class, 4);

        // the DJ's own song cannot be voted on, so it is not announced either
        $this->actingAs($dj)->postJson("/rooms/{$room->slug}/vote", ['type' => 'woot'])->assertStatus(422);
        Event::assertDispatchedTimes(VoteCast::class, 4);
    }

    public function test_a_vote_is_announced_to_the_room_and_a_private_room_stays_private(): void
    {
        [$room] = $this->playing();
        $event = new VoteCast($room->id, 7, 'Kati', 'meh');

        $this->assertSame('vote-cast', $event->broadcastAs());
        $this->assertSame(['user_id' => 7, 'name' => 'Kati', 'type' => 'meh'], $event->broadcastWith());
        $this->assertSame(['presence-room.'.$room->id, 'room-view.'.$room->id], array_map(fn (Channel $c) => $c->name, $event->broadcastOn()));

        $room->update(['is_private' => true]);
        $this->assertSame(['presence-room.'.$room->id], array_map(fn (Channel $c) => $c->name, (new VoteCast($room->id, 7, 'Kati', 'meh'))->broadcastOn()));
    }

    public function test_everybody_starts_as_a_free_character(): void
    {
        $starters = AvatarController::starterCharacters();
        $this->assertContains('char:foxy', $starters);
        foreach ($starters as $key) {
            $this->assertNull(AvatarController::ROLE_ONLY[$key] ?? null, "{$key} needs a role");
            $this->assertFileExists(public_path('Avatars/Standing/'.substr($key, 5).'.svg'));
        }

        $this->post('/register', ['username' => 'new_face', 'name' => 'New Face', 'email' => 'new@example.com', 'password' => 'password', 'password_confirmation' => 'password', 'terms' => true]);
        $this->assertAuthenticated();
        $this->assertContains(User::where('email', 'new@example.com')->firstOrFail()->avatar, $starters);
    }

    public function test_a_character_is_never_taken_off_not_even_with_the_photo(): void
    {
        $me = User::factory()->create(['avatar' => 'char:foxy']);

        // the shop has no plain-letter avatar: a character has to be named
        $this->actingAs($me)->post('/shop/equip', ['avatar' => null])->assertSessionHasErrors('avatar');
        $this->actingAs($me)->post('/shop/equip', [])->assertSessionHasErrors('avatar');
        $this->actingAs($me)->post('/shop/outfit', ['avatar' => ''])->assertSessionHasErrors('avatar');
        $this->assertSame('char:foxy', $me->refresh()->avatar);

        // taking the photo away makes them a character again
        $me->forceFill(['avatar' => 'img:somebody.png'])->save();
        $this->actingAs($me)->delete('/profile/photo')->assertRedirect();
        $this->assertContains($me->refresh()->avatar, AvatarController::starterCharacters());

        // the Avatar shop does not list a "none" for avatars: its catalog is characters only
        $this->actingAs($me)->get('/shop')->assertOk()->assertInertia(fn ($p) => $p->where('catalog.avatar.0.key', fn ($key) => str_starts_with($key, 'char:')));
    }

    public function test_the_migration_turns_grab_lists_into_playlists_and_gives_a_character_to_whoever_has_none(): void
    {
        $migration = require database_path('migrations/2026_11_01_000001_grabs_are_playlists_and_everybody_has_a_character.php');

        $saver = User::factory()->create(['avatar' => 'char:blaze']);
        $empty = User::factory()->create(['avatar' => null]);
        $nobody = User::factory()->create(['avatar' => '']);
        $bot = User::factory()->create(['avatar' => null, 'is_bot' => true]);
        $grabs = Playlist::create(['user_id' => $saver->id, 'name' => 'Grabs', 'kind' => 'grabs', 'is_active' => false]);
        $grabs->addSongs([['youtube_id' => 'aaaaaaaaaaa', 'title' => 'Song A', 'duration' => 100]]);
        $mine = $this->list($saver, 'Mine');
        $mine->makeActive();
        $unused = Playlist::create(['user_id' => $empty->id, 'name' => 'Grabs', 'kind' => 'grabs', 'is_active' => false]);

        $migration->up();
        $migration->up(); // running it again changes nothing

        // a grab list with songs is a playlist like any other, one that is empty just goes, the one they played from stays that
        $this->assertSame('custom', $grabs->refresh()->kind);
        $this->assertFalse($grabs->is_active);
        $this->assertTrue($mine->refresh()->is_active);
        $this->assertNull(Playlist::find($unused->id));
        $this->assertSame(0, Playlist::where('kind', 'grabs')->count());
        $this->actingAs($saver)->patchJson("/api/playlists/{$grabs->id}", ['name' => 'Old grabs'])->assertOk();
        $this->actingAs($saver)->deleteJson("/api/playlists/{$grabs->id}")->assertOk();

        // everybody has a character now (but a bot is left alone, and so is the one that had a character)
        $this->assertSame('char:blaze', $saver->refresh()->avatar);
        $this->assertSame('char:foxy', $empty->refresh()->avatar);
        $this->assertSame('char:foxy', $nobody->refresh()->avatar);
        $this->assertNull($bot->refresh()->avatar);
        $this->assertSame(0, DB::table('users')->where('is_bot', false)->where(fn ($q) => $q->whereNull('avatar')->orWhere('avatar', ''))->count());
    }

    public function test_the_lines_about_joins_leaves_and_votes_have_a_switch_in_the_appearance_settings(): void
    {
        $me = User::factory()->create();

        $this->actingAs($me)->patch('/settings/preferences', ['appearance' => ['show_activity' => false]])->assertSessionHasNoErrors();
        $this->assertFalse($me->refresh()->pref('appearance.show_activity'));
        $this->actingAs($me)->get('/dashboard')->assertInertia(fn ($p) => $p->where('auth.user.preferences.appearance.show_activity', false));

        $this->actingAs($me)->patch('/settings/preferences', ['appearance' => ['show_activity' => 'maybe']])->assertSessionHasErrors('appearance.show_activity');
    }
}
