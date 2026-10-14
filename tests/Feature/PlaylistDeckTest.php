<?php

namespace Tests\Feature;

use App\Events\PlaybackUpdated;
use App\Models\Playlist;
use App\Models\PlaylistItem;
use App\Models\User;
use App\Services\YouTube;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PlaylistDeckTest extends TestCase
{
    use RefreshDatabase;

    private function song(string $id, ?string $title = null): array
    {
        return ['youtube_id' => str_pad($id, 11, 'x'), 'title' => $title ?? "Song {$id}", 'duration' => 200];
    }

    /** A playlist of three songs (a, b, c, in that order). */
    private function list(User $user, string $name = 'Mix'): Playlist
    {
        $list = $user->playlists()->create(['name' => $name, 'kind' => 'custom']);
        $list->addSongs([$this->song('a'), $this->song('b'), $this->song('c')]);

        return $list;
    }

    private function titles(Playlist $list): array
    {
        return $list->songs()->pluck('title')->all();
    }

    public function test_songs_keep_the_order_they_were_added_in_and_can_be_dragged_into_another(): void
    {
        $me = User::factory()->create();
        $list = $this->list($me);
        $this->assertSame(['Song a', 'Song b', 'Song c'], $this->titles($list));

        [$a, $b, $c] = $list->songs()->pluck('id')->all();
        $this->actingAs($me)->putJson("/api/playlists/{$list->id}/order", ['ids' => [$c, $a, $b]])->assertOk();
        $this->assertSame(['Song c', 'Song a', 'Song b'], $this->titles($list));
        $this->actingAs($me)->getJson("/api/playlists/{$list->id}")->assertJsonPath('0.title', 'Song c')->assertJsonPath('0.position', 1)->assertJsonPath('2.position', 3);

        // a song that is not named stays after the named ones, ids of other lists are ignored, a new song goes last
        $other = $this->list($me, 'Other');
        $this->actingAs($me)->putJson("/api/playlists/{$list->id}/order", ['ids' => [$b, $other->songs()->first()->id]])->assertOk();
        $this->assertSame(['Song b', 'Song c', 'Song a'], $this->titles($list));
        $list->addSongs([$this->song('d')]);
        $this->assertSame(['Song b', 'Song c', 'Song a', 'Song d'], $this->titles($list));
        $this->assertSame(['Song a', 'Song b', 'Song c'], $this->titles($other), 'the other list was not touched');

        // strangers cannot reorder, and the list must be sent as numbers
        $this->actingAs(User::factory()->create())->putJson("/api/playlists/{$list->id}/order", ['ids' => [$a]])->assertForbidden();
        $this->actingAs($me)->putJson("/api/playlists/{$list->id}/order", ['ids' => ['x']])->assertStatus(422);
        $this->actingAs($me)->putJson("/api/playlists/{$list->id}/order", [])->assertStatus(422);
    }

    public function test_shuffle_keeps_every_song_and_gives_each_its_own_place(): void
    {
        $me = User::factory()->create();
        $list = $me->playlists()->create(['name' => 'Big', 'kind' => 'custom']);
        $list->addSongs(array_map(fn ($i) => $this->song("s{$i}"), range(1, 30)));
        $before = $list->songs()->pluck('id')->all();

        $after = $this->actingAs($me)->postJson("/api/playlists/{$list->id}/shuffle")->assertOk()->json();

        $this->assertCount(30, $after);
        $this->assertEqualsCanonicalizing($before, array_column($after, 'id'));
        $this->assertSame(range(1, 30), array_column($after, 'position'));
        $this->assertNotSame($before, array_column($after, 'id'), 'thirty songs in the same order after a shuffle');
        $this->actingAs(User::factory()->create())->postJson("/api/playlists/{$list->id}/shuffle")->assertForbidden();
    }

    public function test_one_playlist_is_active_the_first_one_to_begin_with(): void
    {
        $me = User::factory()->create();

        $first = $this->actingAs($me)->postJson('/api/playlists', ['name' => 'First'])->assertCreated()->assertJsonPath('is_active', true)->json('id');
        $second = $this->actingAs($me)->postJson('/api/playlists', ['name' => 'Second'])->assertCreated()->assertJsonPath('is_active', false)->json('id');

        $lists = fn () => collect($this->actingAs($me)->getJson('/api/playlists')->assertOk()->json())->where('kind', 'custom')->pluck('is_active', 'id')->all();
        $this->assertSame([$first => true, $second => false], $lists());

        $this->actingAs($me)->postJson("/api/playlists/{$second}/activate")->assertOk()->assertJsonPath('lists.1.is_active', true);
        $this->assertSame([$first => false, $second => true], $lists());

        // when the active one goes, the other takes over; with none left, nothing is active
        $this->actingAs($me)->deleteJson("/api/playlists/{$second}")->assertOk();
        $this->assertSame([$first => true], $lists());

        // other people's lists cannot be activated
        $this->actingAs(User::factory()->create())->postJson("/api/playlists/{$first}/activate")->assertForbidden();
        $this->assertNull(Playlist::activeFor(User::factory()->create()));
    }

    public function test_the_list_sums_up_each_playlist_and_a_person_without_an_active_one_gets_one(): void
    {
        $me = User::factory()->create();
        $a = $this->list($me, 'Alpha');
        $b = $this->list($me, 'Beta');
        $this->assertSame(0, Playlist::where('user_id', $me->id)->where('is_active', true)->count()); // lists made without the endpoint

        $rows = collect($this->actingAs($me)->getJson('/api/playlists')->assertOk()->json())->keyBy('id');

        $this->assertSame(3, $rows[$a->id]['songs_count']);
        $this->assertSame(600, (int) $rows[$a->id]['songs_sum_duration']);
        $this->assertTrue($rows[$a->id]['is_active'], 'the first list became the active one');
        $this->assertFalse($rows[$b->id]['is_active']);
    }

    public function test_free_playlists_hold_five_thousand_songs(): void
    {
        $me = User::factory()->create();
        $list = $me->playlists()->create(['name' => 'Long mix', 'kind' => 'custom']);
        $songs = array_map(fn (int $number) => [
            'youtube_id' => sprintf('%011d', $number),
            'title' => "Song {$number}",
            'duration' => 180,
        ], range(1, 5001));

        $this->assertSame(5000, $me->limits()['songs']);
        $this->assertSame(5000, $list->addSongs($songs));
        $this->assertSame(5000, $list->songs()->count());
    }

    public function test_youtube_playlist_import_reads_multiple_api_pages(): void
    {
        config(['services.youtube.key' => 'test-key']);
        Http::fake(function (Request $request) {
            $path = parse_url($request->url(), PHP_URL_PATH);
            parse_str((string) parse_url($request->url(), PHP_URL_QUERY), $query);

            if (str_ends_with($path, '/playlistItems')) {
                $start = isset($query['pageToken']) ? 50 : 0;
                $items = [];
                for ($number = $start; $number < min($start + 50, 51); $number++) {
                    $items[] = ['contentDetails' => ['videoId' => sprintf('%011d', $number + 1)]];
                }

                return Http::response(['items' => $items, 'nextPageToken' => $start === 0 ? 'next-page' : null]);
            }

            if (str_ends_with($path, '/videos')) {
                return Http::response(['items' => collect(explode(',', $query['id']))->map(fn ($id) => [
                    'id' => $id,
                    'snippet' => ['title' => "Song {$id}", 'channelTitle' => 'Test channel'],
                    'contentDetails' => ['duration' => 'PT3M'],
                    'status' => ['embeddable' => true],
                ])->all()]);
            }

            return Http::response([], 404);
        });

        $songs = app(YouTube::class)->playlist('test-playlist', 1000);

        $this->assertCount(51, $songs);
        $this->assertSame('00000000001', $songs[0]['id']);
        $this->assertSame('00000000051', $songs[50]['id']);
        Http::assertSentCount(4);
    }

    public function test_youtube_connection_imports_private_playlists_and_shows_channel_on_profile(): void
    {
        config([
            'services.youtube.key' => null,
            'services.youtube.client_id' => 'google-client',
            'services.youtube.client_secret' => 'google-secret',
        ]);
        Http::fake([
            'oauth2.googleapis.com/token' => Http::sequence()
                ->push(['access_token' => 'youtube-access-token', 'refresh_token' => 'youtube-refresh-token', 'expires_in' => 3600])
                ->push(['access_token' => 'youtube-refreshed-token', 'expires_in' => 3600]),
            'googleapis.com/youtube/v3/channels*' => Http::response(['items' => [[
                'id' => 'UCchannel123',
                'snippet' => ['title' => 'My YouTube Channel'],
            ]]]),
            'googleapis.com/youtube/v3/playlistItems*' => Http::response(['items' => [[
                'contentDetails' => ['videoId' => 'abcdefghijk'],
            ]]]),
            'googleapis.com/youtube/v3/videos*' => Http::response(['items' => [[
                'id' => 'abcdefghijk',
                'snippet' => ['title' => 'Private playlist song', 'channelTitle' => 'Music channel'],
                'contentDetails' => ['duration' => 'PT3M'],
                'status' => ['embeddable' => true],
            ]]]),
        ]);

        $user = User::factory()->create();
        $list = $user->playlists()->create(['name' => 'Private YouTube playlist', 'kind' => 'custom']);

        $this->actingAs($user)->get(route('settings.connections'))->assertInertia(fn (Assert $page) => $page
            ->component('Settings/Connections')
            ->where('youtube.configured', true)
            ->where('youtube.connected', false));
        $this->actingAs($user)->get(route('settings.account'))->assertInertia(fn (Assert $page) => $page
            ->component('Settings/Account')
            ->missing('discord')
            ->missing('spotify')
            ->missing('youtube'));

        $authorization = $this->actingAs($user)->get(route('youtube.connect'))->assertRedirect();
        parse_str((string) parse_url($authorization->headers->get('Location'), PHP_URL_QUERY), $parameters);
        $this->assertSame('https://www.googleapis.com/auth/youtube.readonly', $parameters['scope']);
        $this->assertSame('offline', $parameters['access_type']);
        $state = session('youtube_state');

        $this->get(route('youtube.callback', ['code' => 'google-auth-code', 'state' => $state]))
            ->assertRedirect(route('settings.connections'))
            ->assertSessionHas('youtube_notice', 'YouTube connected. Your channel will appear on your profile and you can import playlists this account can access.');

        $user->refresh();
        $this->assertSame('UCchannel123', $user->youtube_channel_id);
        $this->assertSame('youtube-refresh-token', $user->youtube_refresh_token);
        $this->assertArrayNotHasKey('youtube_refresh_token', $user->toArray());

        $user->forceFill(['youtube_token_expires_at' => now()->subMinute()])->save();
        $this->actingAs($user)->postJson(route('api.playlists.import', $list), [
            'text' => 'https://www.youtube.com/playlist?list=private-list-123',
        ])->assertOk()->assertJson(['found' => 1, 'added' => 1]);
        $this->assertSame('Private playlist song', $list->songs()->sole()->title);
        Http::assertSent(fn (Request $request) => str_contains($request->url(), '/playlistItems') && $request->hasHeader('Authorization', 'Bearer youtube-refreshed-token'));

        $this->getJson(route('users.card', $user))->assertOk()
            ->assertJsonPath('youtube_channel.title', 'My YouTube Channel')
            ->assertJsonPath('youtube_channel.url', 'https://www.youtube.com/channel/UCchannel123')
            ->assertJsonMissingPath('youtube_access_token')
            ->assertJsonMissingPath('youtube_refresh_token');

        $this->actingAs($user)->delete(route('youtube.disconnect'))->assertRedirect(route('settings.connections'));
        $this->assertNull($user->fresh()->youtube_refresh_token);
    }

    public function test_youtube_oauth_rejects_a_forged_state(): void
    {
        config(['services.youtube.client_id' => 'google-client', 'services.youtube.client_secret' => 'google-secret']);
        $user = User::factory()->create();

        $this->actingAs($user)->withSession(['youtube_state' => 'expected-state'])
            ->get(route('youtube.callback', ['code' => 'google-auth-code', 'state' => 'forged-state']))
            ->assertRedirect(route('settings.connections'))
            ->assertSessionHas('youtube_notice');

        $this->assertNull($user->fresh()->youtube_channel_id);
    }

    public function test_spotify_oauth_and_playlist_items_import(): void
    {
        config(['services.youtube.key' => 'youtube-test-key']);
        config(['services.spotify.client_id' => 'spotify-client', 'services.spotify.client_secret' => 'spotify-secret']);
        Http::fake([
            'accounts.spotify.com/api/token' => Http::response([
                'access_token' => 'authorized-spotify-token',
                'refresh_token' => 'spotify-refresh-token',
                'expires_in' => 3600,
            ]),
            'api.spotify.com/v1/me' => Http::response(['id' => 'spotify-user', 'display_name' => 'Spotify Person']),
            'api.spotify.com/v1/playlists/*/items*' => Http::response(['items' => [
                ['item' => ['name' => 'Song Name', 'artists' => [['name' => 'Artist Name']]]],
            ], 'next' => null]),
            'googleapis.com/youtube/v3/search*' => Http::response(['items' => [[
                'id' => ['videoId' => 'abcdefghijk'],
                'snippet' => ['title' => 'Artist Name - Song Name', 'channelTitle' => 'Test channel'],
            ]]]),
            'googleapis.com/youtube/v3/videos*' => Http::response(['items' => [[
                'id' => 'abcdefghijk',
                'snippet' => ['title' => 'Artist Name - Song Name', 'channelTitle' => 'Test channel'],
                'contentDetails' => ['duration' => 'PT3M'],
                'status' => ['embeddable' => true],
            ]]]),
        ]);

        $user = User::factory()->create();
        $list = $user->playlists()->create(['name' => 'Spotify import', 'kind' => 'custom']);

        $connect = $this->actingAs($user)->get('http://127.0.0.1:8000/auth/spotify')->assertRedirect();
        parse_str((string) parse_url($connect->headers->get('Location'), PHP_URL_QUERY), $authorization);
        $this->assertSame('playlist-read-private', $authorization['scope']);
        $this->assertSame('http://127.0.0.1:8000/auth/spotify/callback', $authorization['redirect_uri']);
        $state = session('spotify_state');
        $this->get(route('spotify.callback', ['code' => 'authorization-code', 'state' => $state]))
            ->assertRedirect(route('settings.connections'))
            ->assertSessionHas('spotify_notice', 'Spotify connected. You can import playlists owned by or shared with this account.');

        $user->refresh();
        $this->assertSame('spotify-user', $user->spotify_id);
        $this->assertSame('Spotify Person', $user->spotify_display_name);
        $this->assertSame('authorized-spotify-token', $user->spotify_access_token);
        $this->assertArrayNotHasKey('spotify_access_token', $user->toArray());

        $this->actingAs($user)->postJson(route('api.playlists.import', $list), ['text' => 'https://open.spotify.com/playlist/0GBy7zKDS6HNBOwnZR1TCV'])
            ->assertOk()
            ->assertJsonPath('found', 1)
            ->assertJsonPath('added', 1);
        $this->assertSame('Artist Name - Song Name', $list->songs()->sole()->title);
        Http::assertSent(fn (Request $request) => str_contains($request->url(), '/playlists/0GBy7zKDS6HNBOwnZR1TCV/items') && $request->hasHeader('Authorization', 'Bearer authorized-spotify-token'));

        $this->actingAs($user)->delete(route('spotify.disconnect'))->assertRedirect(route('settings.connections'));
        $this->assertNull($user->fresh()->spotify_refresh_token);
    }

    public function test_spotify_saying_no_is_logged_and_shown_in_its_own_words(): void
    {
        config(['services.spotify.client_id' => 'client-id', 'services.spotify.client_secret' => 'client-secret']);
        Log::spy();
        Http::fake([
            'accounts.spotify.com/api/token' => Http::response(['access_token' => 'the-access-token', 'refresh_token' => 'the-refresh-token', 'expires_in' => 3600]),
            'api.spotify.com/v1/me' => Http::response(['error' => ['status' => 403, 'message' => 'Check settings on developer.spotify.com/dashboard, the user may not be registered.']], 403),
        ]);
        $user = User::factory()->create();

        $this->actingAs($user)->get('http://127.0.0.1:8000/auth/spotify')->assertRedirect();

        // the token came, the profile did not (a Development Mode app and somebody who is not listed): say why, in red, and keep nothing
        $this->get(route('spotify.callback', ['code' => 'authorization-code', 'state' => session('spotify_state')]))
            ->assertRedirect(route('settings.connections'))
            ->assertSessionHas('spotify_notice', fn ($notice) => str_contains($notice, 'User Management') && str_contains($notice, 'Spotify answered 403: Check settings on developer.spotify.com/dashboard'))
            ->assertSessionHas('spotify_notice_ok', false);
        $this->assertNull($user->fresh()->spotify_id);
        $this->assertNull($user->fresh()->spotify_refresh_token);

        // the log has what Spotify answered and no token
        Log::shouldHaveReceived('warning')->withArgs(fn ($message, $context) => $context['status'] === 403 && str_contains($context['spotify_said'], 'not be registered') && ! str_contains(json_encode($context), 'token'))->once();
    }

    public function test_spotify_linking_never_starts_from_localhost_and_says_where_to_go_instead(): void
    {
        config(['services.spotify.client_id' => 'client-id', 'services.spotify.client_secret' => 'client-secret']);
        $user = User::factory()->create();

        // Spotify refuses "localhost" as a return address, so nothing is sent to Spotify: the person is told to use 127.0.0.1
        $this->actingAs($user)->get('http://localhost:8000/auth/spotify')
            ->assertRedirect(route('settings.connections'))
            ->assertSessionHas('spotify_notice', fn ($notice) => str_contains($notice, 'http://127.0.0.1:8000'));
        $this->assertNull(session('spotify_state'));

        // on the live site the address is https (behind the proxy) and is what the Spotify app has to list
        $live = $this->actingAs($user)->withHeader('X-Forwarded-Proto', 'https')->get('http://sfd-dj.eu/auth/spotify');
        parse_str((string) parse_url($live->headers->get('Location'), PHP_URL_QUERY), $query);
        $this->assertSame('https://sfd-dj.eu/auth/spotify/callback', $query['redirect_uri']);
    }

    public function test_the_connections_page_tells_staff_what_to_add_in_the_spotify_app_but_not_for_localhost(): void
    {
        $staff = User::factory()->create();
        $staff->forceFill(['roles' => ['admin']])->save();

        $this->actingAs($staff)->get('http://127.0.0.1:8000/settings/connections')->assertInertia(fn (Assert $page) => $page->where('spotify.redirect', 'http://127.0.0.1:8000/auth/spotify/callback'));
        $this->actingAs($staff)->get('http://localhost:8000/settings/connections')->assertInertia(fn (Assert $page) => $page->where('spotify.redirect', null));
        $this->actingAs(User::factory()->create())->get('http://127.0.0.1:8000/settings/connections')->assertInertia(fn (Assert $page) => $page->where('spotify.redirect', null));
    }

    public function test_the_deck_shows_my_lists_and_the_next_track_of_the_active_one(): void
    {
        $me = User::factory()->create();
        $this->getJson('/api/playlists/deck')->assertUnauthorized();

        $this->actingAs($me)->getJson('/api/playlists/deck')->assertOk()->assertJson(['lists' => [], 'next' => null]);

        $a = $this->list($me, 'Alpha');
        $b = $this->list($me, 'Beta');
        $b->addSongs([$this->song('z', 'Zed')]);
        $b->reorder([$b->songs()->where('title', 'Zed')->value('id')]); // Zed first

        $deck = $this->actingAs($me)->getJson('/api/playlists/deck')->assertOk();
        $deck->assertJsonPath('lists.0.name', 'Alpha')->assertJsonPath('lists.0.is_active', true)->assertJsonPath('lists.0.songs_count', 3)
            ->assertJsonPath('lists.1.name', 'Beta')->assertJsonPath('lists.1.songs_count', 4)->assertJsonPath('next.title', 'Song a');

        $this->actingAs($me)->postJson("/api/playlists/{$b->id}/activate")->assertOk()->assertJsonPath('next.title', 'Zed');
    }

    public function test_join_waitlist_queues_the_next_track_of_the_active_playlist_once(): void
    {
        Event::fake([PlaybackUpdated::class]);
        $me = User::factory()->create();
        $room = $me->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);

        $this->actingAs($me)->postJson("/rooms/{$room->slug}/join")->assertOk()->assertJson(['queued' => false, 'reason' => 'no_playlist']);

        $empty = $me->playlists()->create(['name' => 'Empty', 'kind' => 'custom']);
        $this->actingAs($me)->postJson("/rooms/{$room->slug}/join")->assertOk()->assertJson(['queued' => false, 'reason' => 'empty']);
        $empty->delete();

        $list = $this->list($me);
        $song = $list->songs()->first();
        $this->actingAs($me)->postJson("/rooms/{$room->slug}/join")->assertOk()->assertJson(['queued' => true, 'title' => 'Song a']);
        Event::assertDispatched(PlaybackUpdated::class);

        $item = PlaylistItem::where('room_id', $room->id)->sole();
        $this->assertSame($song->youtube_id, $item->youtube_id);
        $this->assertSame($song->id, $item->playlist_song_id);
        $this->assertSame($me->id, $item->user_id);
        $this->assertSame($item->id, $room->refresh()->current_item_id, 'nothing was playing, so it starts');

        // pressing it again does not queue a second song
        $this->actingAs($me)->postJson("/rooms/{$room->slug}/join")->assertOk()->assertJson(['queued' => false, 'reason' => 'already']);
        $this->assertSame(1, PlaylistItem::where('room_id', $room->id)->count());

        // guests cannot, and a locked waitlist is closed to people who do not manage it
        $this->app['auth']->forgetGuards();
        $this->postJson("/rooms/{$room->slug}/join")->assertUnauthorized();
        $room->update(['waitlist_locked' => true]);
        $other = User::factory()->create();
        $this->list($other);
        $this->actingAs($other)->postJson("/rooms/{$room->slug}/join")->assertStatus(422);
    }

    public function test_a_song_that_was_played_goes_to_the_bottom_of_its_playlist(): void
    {
        Event::fake([PlaybackUpdated::class]);
        $me = User::factory()->create();
        $room = $me->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);
        $list = $this->list($me);

        $this->actingAs($me)->postJson("/rooms/{$room->slug}/join")->assertJson(['queued' => true, 'title' => 'Song a']);
        $this->assertSame(['Song a', 'Song b', 'Song c'], $this->titles($list), 'it stays on top while it waits and plays');

        $room->refresh()->advance(); // the song ends
        $this->assertSame(['Song b', 'Song c', 'Song a'], $this->titles($list));

        // the next turn plays the next song
        $this->actingAs($me)->postJson("/rooms/{$room->slug}/join")->assertJson(['queued' => true, 'title' => 'Song b']);
        $room->refresh()->advance();
        $this->assertSame(['Song c', 'Song a', 'Song b'], $this->titles($list));

        // a song queued by hand (a link, or "Queue" in the manager) does not move anything
        $this->actingAs($me)->post("/rooms/{$room->slug}/queue-playlist", ['playlist_id' => $list->id])->assertNoContent();
        $room->refresh()->advance();
        $this->assertSame(['Song c', 'Song a', 'Song b'], $this->titles($list));
    }

    public function test_the_channel_is_kept_with_a_song_from_the_api_or_from_oembed(): void
    {
        config(['services.youtube.key' => 'k']);
        Http::fake(['googleapis.com/youtube/v3/videos*' => Http::response(['items' => [[
            'id' => 'aaaaaaaaaaa', 'snippet' => ['title' => 'Breath', 'channelTitle' => 'Trap Nation'], 'contentDetails' => ['duration' => 'PT3M21S'], 'status' => ['embeddable' => true],
        ]]])]);
        $me = User::factory()->create();
        $list = $me->playlists()->create(['name' => 'Mix', 'kind' => 'custom']);

        $this->actingAs($me)->postJson("/api/playlists/{$list->id}/songs", ['video_id' => 'aaaaaaaaaaa'])->assertJson(['added' => 1]);
        $this->actingAs($me)->getJson("/api/playlists/{$list->id}")->assertJsonPath('0.channel', 'Trap Nation')->assertJsonPath('0.duration', 201);

        // without the API key YouTube's oEmbed names the author
        config(['services.youtube.key' => null]);
        Http::fake(['youtube.com/oembed*' => Http::response(['title' => 'Senses', 'author_name' => 'Prismo'])]);
        $this->actingAs($me)->postJson("/api/playlists/{$list->id}/songs", ['video_id' => 'bbbbbbbbbbb'])->assertJson(['added' => 1]);
        $this->actingAs($me)->getJson("/api/playlists/{$list->id}")->assertJsonPath('1.channel', 'Prismo');
    }

    public function test_playlist_availability_check_marks_working_unavailable_and_missing_videos(): void
    {
        config(['services.youtube.key' => 'test-key']);
        $me = User::factory()->create();
        $list = $this->list($me);
        $songs = $list->songs()->get();
        [$available, $notEmbeddable, $missing] = $songs->pluck('id')->all();
        $youtubeIds = $songs->pluck('youtube_id')->all();

        Http::fake(['googleapis.com/youtube/v3/videos*' => Http::response(['items' => [
            ['id' => $youtubeIds[0], 'status' => ['embeddable' => true]],
            ['id' => $youtubeIds[1], 'status' => ['embeddable' => false]],
        ]])]);

        $this->actingAs($me)->postJson("/api/playlists/{$list->id}/availability", ['song_ids' => [$available, $notEmbeddable, $missing]])
            ->assertOk()
            ->assertJsonPath("availability.{$available}", true)
            ->assertJsonPath("availability.{$notEmbeddable}", false)
            ->assertJsonPath("availability.{$missing}", false);

        $other = User::factory()->create();
        $this->actingAs($other)->postJson("/api/playlists/{$list->id}/availability", ['song_ids' => [$available]])->assertForbidden();
        $this->actingAs($me)->postJson("/api/playlists/{$list->id}/availability", ['song_ids' => array_fill(0, 51, $available)])->assertUnprocessable();

        config(['services.youtube.key' => null]);
        $this->actingAs($me)->postJson("/api/playlists/{$list->id}/availability", ['song_ids' => [$available]])->assertStatus(503);
    }
}
