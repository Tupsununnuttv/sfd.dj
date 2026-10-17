<?php

namespace Tests\Feature;

use App\Events\MessageDeleted;
use App\Events\MessageSent;
use App\Events\PlaybackUpdated;
use App\Models\ChatMessage;
use App\Models\Playlist;
use App\Models\PlaylistItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PlaylistsAndChatTest extends TestCase
{
    use RefreshDatabase;

    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    private function png(string $name = 'a.png'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, base64_decode(self::PNG));
    }

    /** A real temp file, so the server checks the content (fake uploads only look at the file name). */
    private function realFile(string $name, string $content): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'up');
        file_put_contents($path, $content);

        return new UploadedFile($path, $name, 'image/png', null, true);
    }

    private function video(string $title, string $duration = 'PT3M', bool $embeddable = true): array
    {
        return ['snippet' => ['title' => $title], 'contentDetails' => ['duration' => $duration], 'status' => ['embeddable' => $embeddable]];
    }

    public function test_playlists_crud_and_adding_songs_from_youtube(): void
    {
        config(['services.youtube.key' => 'k']);
        Http::fake(['googleapis.com/youtube/v3/videos*' => Http::response(['items' => [$this->video('Song One', 'PT2M5S') + ['id' => 'aaaaaaaaaaa']]])]);

        $me = User::factory()->create();
        $other = User::factory()->create();

        $this->actingAs($me)->getJson('/api/playlists')->assertOk()->assertExactJson([]); // no hidden list: you have the playlists you made
        $id = $this->actingAs($me)->postJson('/api/playlists', ['name' => 'Road trip'])->assertCreated()->json('id');

        $this->actingAs($me)->postJson("/api/playlists/{$id}/songs", ['video_id' => 'aaaaaaaaaaa'])->assertOk()->assertJson(['added' => 1]);
        $this->actingAs($me)->postJson("/api/playlists/{$id}/songs", ['video_id' => 'aaaaaaaaaaa'])->assertJson(['added' => 0]); // no duplicates
        $this->actingAs($me)->getJson("/api/playlists/{$id}")->assertJsonPath('0.title', 'Song One')->assertJsonPath('0.duration', 125);

        // other people's playlists are off limits
        $this->actingAs($other)->getJson("/api/playlists/{$id}")->assertForbidden();
        $this->actingAs($other)->postJson("/api/playlists/{$id}/songs", ['video_id' => 'aaaaaaaaaaa'])->assertForbidden();
        $this->actingAs($other)->deleteJson("/api/playlists/{$id}")->assertForbidden();

        $this->actingAs($me)->patchJson("/api/playlists/{$id}", ['name' => 'Gym'])->assertJsonPath('name', 'Gym');
        $song = Playlist::find($id)->songs()->first();
        $this->actingAs($me)->deleteJson("/api/playlists/{$id}/songs/{$song->id}")->assertOk();
        $this->actingAs($me)->deleteJson("/api/playlists/{$id}")->assertOk();
    }

    /** What SoundCloud's oEmbed answers for a track: the title, the artist, the picture and a player whose address holds the track's number. */
    private function soundcloudOembed(string $title = 'Midnight City by M83', string $player = 'url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F123456789&show_artwork=true'): array
    {
        return ['title' => $title, 'author_name' => 'M83', 'thumbnail_url' => 'https://i1.sndcdn.com/artworks-abc-t500x500.jpg', 'html' => '<iframe width="100%" height="400" allow="autoplay" src="https://w.soundcloud.com/player/?visual=true&'.$player.'"></iframe>'];
    }

    public function test_soundcloud_and_spotify_links_play_from_soundcloud_or_are_matched_on_youtube_and_playlists_import(): void
    {
        config(['services.youtube.key' => 'k']);
        config(['services.spotify.client_id' => 'spotify-client', 'services.spotify.client_secret' => 'spotify-secret']);
        Http::fake([
            'soundcloud.com/oembed*' => Http::response($this->soundcloudOembed()),
            'soundcloud.com/m83/midnight-city' => Http::response('<html><meta property="og:url" content="https://soundcloud.com/m83/midnight-city"><meta itemprop="duration" content="PT00H04M03S" /></html>'),
            'open.spotify.com/track/*' => Http::response('<html><meta property="og:title" content="Get Lucky"><meta property="og:description" content="Daft Punk · Random Access Memories · Song · 2013"></html>'),
            'accounts.spotify.com/api/token' => Http::response(['access_token' => 'refreshed-spotify-token', 'refresh_token' => 'rotated-refresh-token', 'expires_in' => 3600]),
            'api.spotify.com/v1/playlists/*/items*' => Http::sequence()
                ->push(['items' => [
                    ['item' => ['name' => 'Playlist Track', 'artists' => [['name' => 'Artist Name']]]],
                ], 'next' => 'https://api.spotify.com/v1/playlists/0GBy7zKDS6HNBOwnZR1TCV/items?offset=50'])
                ->push(['items' => [
                    ['item' => ['name' => 'Second Track', 'artists' => [['name' => 'Another Artist']]]],
                ], 'next' => null]),
            'googleapis.com/youtube/v3/search*' => Http::response(['items' => [
                ['id' => ['videoId' => 'bbbbbbbbbbb'], 'snippet' => ['title' => 'Match', 'channelTitle' => 'c', 'thumbnails' => []]],
            ]]),
            'googleapis.com/youtube/v3/playlistItems*' => Http::response(['items' => [['contentDetails' => ['videoId' => 'ccccccccccc']], ['contentDetails' => ['videoId' => 'ddddddddddd']]]]),
            'googleapis.com/youtube/v3/videos*' => Http::response(['items' => [
                $this->video('Match', 'PT4M') + ['id' => 'bbbbbbbbbbb'],
                $this->video('PL One') + ['id' => 'ccccccccccc'],
                $this->video('PL Two') + ['id' => 'ddddddddddd'],
            ]]),
        ]);

        $me = User::factory()->create();
        $list = $me->playlists()->create(['name' => 'Mix', 'kind' => 'custom']);
        $me->forceFill([
            'spotify_access_token' => 'linked-spotify-token',
            'spotify_refresh_token' => 'linked-refresh-token',
            'spotify_token_expires_at' => now()->subMinute(),
        ])->save();

        // SoundCloud plays from SoundCloud: the song is the track (sc: and its number), with the length from its page, and YouTube is not asked at all
        $this->actingAs($me)->postJson("/api/playlists/{$list->id}/songs", ['url' => 'https://soundcloud.com/m83/midnight-city?si=abc&utm_source=clipboard'])->assertJson(['added' => 1]);
        $song = $list->songs()->first();
        $this->assertSame(['sc:123456789', 'Midnight City by M83', 'M83', 243, 'soundcloud', 'https://soundcloud.com/m83/midnight-city', 'https://i1.sndcdn.com/artworks-abc-t500x500.jpg'], [$song->youtube_id, $song->title, $song->channel, $song->duration, $song->origin, $song->origin_url, $song->thumbnail]);
        Http::assertNotSent(fn ($r) => str_contains($r->url(), 'googleapis.com'));
        $this->actingAs($me)->postJson("/api/playlists/{$list->id}/songs", ['url' => 'https://soundcloud.com/m83/midnight-city'])->assertJson(['added' => 0]); // no duplicates

        $this->actingAs($me)->postJson("/api/playlists/{$list->id}/songs", ['url' => 'https://open.spotify.com/track/abc123'])->assertOk();
        Http::assertSent(fn ($r) => str_contains($r->url(), 'search') && str_contains(urldecode($r->url()), 'Daft Punk Get Lucky'));

        // Playlists expand through Spotify's API; unsupported things report an error per line.
        $res = $this->actingAs($me)->postJson("/api/playlists/{$list->id}/import", ['text' => implode("\n", [
            'https://www.youtube.com/playlist?list=PLabc',
            'https://soundcloud.com/m83/sets/some-set',
            'https://open.spotify.com/playlist/0GBy7zKDS6HNBOwnZR1TCV?si=example',
            'https://open.spotify.com/playlist/xyz',
            'https://example.com/nope',
        ])])->assertOk();

        $this->assertSame(2, $res->json('added'));
        $this->assertCount(3, $res->json('errors'));
        $this->assertStringContainsString('valid 22-character playlist ID', implode(' ', $res->json('errors')));
        Http::assertSent(fn ($request) => str_contains($request->url(), '/api/token'));
        Http::assertSent(fn ($request) => str_contains($request->url(), '/playlists/0GBy7zKDS6HNBOwnZR1TCV/items'));
        Http::assertSent(fn ($request) => str_contains($request->url(), '/playlists/0GBy7zKDS6HNBOwnZR1TCV/items') && $request->hasHeader('Authorization', 'Bearer refreshed-spotify-token'));
        Http::assertSent(fn ($request) => str_contains($request->url(), 'offset=50') && str_contains($request->url(), 'limit=50'));
        Http::assertSent(fn ($request) => str_contains($request->url(), 'search') && str_contains(urldecode($request->url()), 'Artist Name - Playlist Track'));
        Http::assertSent(fn ($request) => str_contains($request->url(), 'search') && str_contains(urldecode($request->url()), 'Another Artist - Second Track'));
    }

    public function test_a_soundcloud_link_that_is_not_one_public_track_is_refused_and_an_unreadable_page_only_costs_the_length(): void
    {
        Http::fake([
            'soundcloud.com/oembed*' => Http::sequence()
                ->push(['title' => 'M83', 'html' => '<iframe src="https://w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Fusers%2F42"></iframe>']) // an artist, not a track
                ->push($this->soundcloudOembed(player: 'url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F123456789%3Fsecret_token%3Ds-AbCd')) // a private track
                ->push([], 404) // gone
                ->push($this->soundcloudOembed()), // fine
            'soundcloud.com/*' => Http::response('', 500), // the pages cannot be read
        ]);
        $me = User::factory()->create();
        $list = $me->playlists()->create(['name' => 'Mix', 'kind' => 'custom']);
        $add = fn (string $url) => $this->actingAs($me)->postJson("/api/playlists/{$list->id}/songs", ['url' => $url]);

        $this->assertStringContainsString('not a single track', $add('https://soundcloud.com/m83')->assertStatus(422)->json('errors.url.0'));
        $this->assertStringContainsString('private', $add('https://soundcloud.com/m83/private-one/s-AbCd')->assertStatus(422)->json('errors.url.0'));
        $this->assertStringContainsString('not found', $add('https://soundcloud.com/m83/gone')->assertStatus(422)->json('errors.url.0'));
        $this->assertSame(0, $list->songs()->count());

        $add('https://soundcloud.com/m83/midnight-city')->assertJson(['added' => 1]);
        $this->assertSame(0, $list->songs()->first()->duration); // the room reads the length from the player when it plays
    }

    public function test_the_length_a_player_reports_also_fills_in_the_song_in_the_djs_playlist(): void
    {
        $user = User::factory()->create();
        $list = $user->playlists()->create(['name' => 'Mix', 'kind' => 'custom']);
        $list->addSongs([['youtube_id' => 'sc:123456789', 'title' => 'Track', 'duration' => 0]]); // as a grab does: only what plays
        $song = $list->songs()->first();
        $room = $user->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-sc']);
        $item = $room->enqueue(['youtube_id' => $song->youtube_id, 'title' => $song->title, 'duration' => 0, 'playlist_song_id' => $song->id], $user->id);

        $this->actingAs($user)->postJson("/rooms/{$room->slug}/duration", ['item_id' => $item->id, 'duration' => 195])->assertNoContent();

        $this->assertSame(195, $song->refresh()->duration);
        $this->assertSame('soundcloud', $song->origin, 'a SoundCloud id is a SoundCloud song even when nothing else is said');
    }

    public function test_a_soundcloud_song_is_queued_from_my_playlist_by_its_id_and_a_grab_keeps_its_address(): void
    {
        $me = User::factory()->create();
        $stranger = User::factory()->create();
        $list = $me->playlists()->create(['name' => 'Mix', 'kind' => 'custom']);
        $list->addSongs([['youtube_id' => 'sc:123456789', 'title' => 'Midnight City by M83', 'duration' => 243, 'origin' => 'soundcloud', 'origin_url' => 'https://soundcloud.com/m83/midnight-city']]);
        $song = $list->songs()->first();
        $room = $stranger->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-song-id']);

        // nothing is looked up: what the list saved goes into the waitlist (a SoundCloud track has no YouTube video to ask about)
        $this->actingAs($me)->postJson("/rooms/{$room->slug}/queue", ['song_id' => $song->id])->assertNoContent();
        $this->assertSame(['sc:123456789', 'Midnight City by M83', 243], [$room->refresh()->playback()['current']['youtube_id'], $room->playback()['current']['title'], $room->playback()['current']['duration']]);

        // somebody else's song is not mine to queue
        $this->actingAs($stranger)->postJson("/rooms/{$room->slug}/queue", ['song_id' => $song->id])->assertStatus(422);

        // grabbing it into another list knows it is SoundCloud, and where it lives
        $other = $stranger->playlists()->create(['name' => 'Grabs', 'kind' => 'custom']);
        $other->addSongs([['youtube_id' => 'sc:123456789', 'title' => 'Midnight City by M83', 'duration' => 243]]);
        $this->assertSame(['soundcloud', 'https://soundcloud.com/m83/midnight-city'], [$other->songs()->first()->origin, $other->songs()->first()->origin_url]);
    }

    public function test_the_availability_check_asks_soundcloud_about_soundcloud_tracks_and_youtube_about_the_rest(): void
    {
        config(['services.youtube.key' => 'k']);
        Http::fake([
            'soundcloud.com/oembed*' => fn ($request) => str_contains(urldecode($request->url()), '/tracks/111') ? Http::response($this->soundcloudOembed()) : Http::response([], 404),
            'googleapis.com/youtube/v3/videos*' => Http::response(['items' => [$this->video('Song One') + ['id' => 'aaaaaaaaaaa']]]),
        ]);
        $me = User::factory()->create();
        $list = $me->playlists()->create(['name' => 'Mix', 'kind' => 'custom']);
        $list->addSongs([['youtube_id' => 'sc:111', 'title' => 'Still there'], ['youtube_id' => 'sc:222', 'title' => 'Gone'], ['youtube_id' => 'aaaaaaaaaaa', 'title' => 'Song One']]);
        $ids = $list->songs()->pluck('id', 'title');

        $answer = $this->actingAs($me)->postJson("/api/playlists/{$list->id}/availability", ['song_ids' => $ids->values()->all()])->assertOk()->json('availability');

        $this->assertSame([true, false, true], [$answer[$ids['Still there']], $answer[$ids['Gone']], $answer[$ids['Song One']]]);
    }

    /** Spotify's public embed page of a playlist or album: the same page a website shows when somebody embeds it. */
    private function spotifyEmbed(array $songs, string $type = 'playlist'): string
    {
        $tracks = array_map(fn ($song) => ['title' => $song[0], 'subtitle' => $song[1]], $songs);

        return '<html><script id="__NEXT_DATA__" type="application/json">'.json_encode(['props' => ['pageProps' => ['state' => ['data' => ['entity' => ['type' => $type, 'name' => 'A list', 'trackList' => $tracks]]]]]]).'</script></html>';
    }

    private function youtubeMatchFake(): array
    {
        return [
            'googleapis.com/youtube/v3/search*' => Http::response(['items' => [['id' => ['videoId' => 'bbbbbbbbbbb'], 'snippet' => ['title' => 'Match', 'channelTitle' => 'c', 'thumbnails' => []]]]]),
            'googleapis.com/youtube/v3/videos*' => Http::response(['items' => [$this->video('Match') + ['id' => 'bbbbbbbbbbb']]]),
        ];
    }

    public function test_any_public_spotify_playlist_or_album_is_imported_with_no_spotify_account(): void
    {
        config(['services.youtube.key' => 'k']);
        Http::fake([
            'open.spotify.com/embed/playlist/*' => Http::response($this->spotifyEmbed([['Get Lucky', "Daft Punk,\u{a0}Pharrell Williams"], ['Solo Title', '']])),
            'open.spotify.com/embed/album/*' => Http::response($this->spotifyEmbed([['Airwolf', 'Kasabian']], 'album')),
            ...$this->youtubeMatchFake(),
        ]);

        // nobody has connected anything: no token, no ownership, a playlist that belongs to somebody else
        $me = User::factory()->create();
        $list = $me->playlists()->create(['name' => 'Mix', 'kind' => 'custom']);

        $res = $this->actingAs($me)->postJson("/api/playlists/{$list->id}/import", ['text' => implode("\n", [
            'https://open.spotify.com/playlist/5vW2J51ywGTwvK7FcgpGRb?si=21fb334e867e4bc2',
            'https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy',
        ])])->assertOk();

        $this->assertSame(3, $res->json('found'));
        $this->assertSame([], $res->json('errors'));
        Http::assertNotSent(fn ($request) => str_contains($request->url(), 'api.spotify.com') || str_contains($request->url(), 'accounts.spotify.com'));
        // "Artist - Title" is what YouTube is asked for: the no-break space between artists is a plain space, a song with no artist is just its title
        Http::assertSent(fn ($request) => str_contains($request->url(), 'search') && str_contains(urldecode($request->url()), 'Daft Punk, Pharrell Williams - Get Lucky'));
        Http::assertSent(fn ($request) => str_contains($request->url(), 'search') && str_contains(urldecode($request->url()), '=Solo Title'));
        Http::assertSent(fn ($request) => str_contains($request->url(), 'search') && str_contains(urldecode($request->url()), 'Kasabian - Airwolf'));
    }

    public function test_a_private_or_missing_spotify_playlist_says_so_and_only_the_first_hundred_songs_are_read(): void
    {
        config(['services.youtube.key' => 'k']);
        Http::fake([
            'open.spotify.com/embed/playlist/0GBy7zKDS6HNBOwnZR1TCV' => Http::response('<html><script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{"status":404}}}</script></html>'),
            'open.spotify.com/embed/playlist/5vW2J51ywGTwvK7FcgpGRb' => Http::response($this->spotifyEmbed(array_fill(0, 100, ['Same Song', 'Same Artist']))),
            ...$this->youtubeMatchFake(),
        ]);
        $me = User::factory()->create();
        $list = $me->playlists()->create(['name' => 'Mix', 'kind' => 'custom']);
        $import = fn (string $id) => $this->actingAs($me)->postJson("/api/playlists/{$list->id}/import", ['text' => "https://open.spotify.com/playlist/{$id}"])->assertOk();

        $private = $import('0GBy7zKDS6HNBOwnZR1TCV');
        $this->assertSame(0, $private->json('found'));
        $this->assertStringContainsString('private or it does not exist', $private->json('errors.0'));

        $big = $import('5vW2J51ywGTwvK7FcgpGRb');
        $this->assertSame(100, $big->json('found'));
        $this->assertStringContainsString('first 100 songs', $big->json('errors.0'));
    }

    public function test_a_connected_account_that_may_not_read_the_playlist_still_imports_it_from_the_public_page(): void
    {
        config(['services.youtube.key' => 'k']);
        config(['services.spotify.client_id' => 'spotify-client', 'services.spotify.client_secret' => 'spotify-secret']);
        $user = User::factory()->create();
        $list = $user->playlists()->create(['name' => 'Mix', 'kind' => 'custom']);
        $user->forceFill(['spotify_access_token' => 'linked-spotify-token', 'spotify_refresh_token' => 'linked-refresh-token', 'spotify_token_expires_at' => now()->addHour()])->save();

        // Spotify's API says no (not the owner), or its whole app is paused because the app's owner has no Premium: neither stops the import
        foreach ([Http::response([], 403), Http::response('Active premium subscription required for the owner of the app.', 403)] as $apiAnswer) {
            Http::fake([
                'api.spotify.com/v1/playlists/*/items*' => $apiAnswer,
                'open.spotify.com/embed/playlist/*' => Http::response($this->spotifyEmbed([['Get Lucky', 'Daft Punk']])),
                ...$this->youtubeMatchFake(),
            ]);

            $this->actingAs($user)->postJson("/api/playlists/{$list->id}/import", ['text' => 'https://open.spotify.com/playlist/0GBy7zKDS6HNBOwnZR1TCV'])
                ->assertOk()->assertJsonPath('found', 1)->assertJsonPath('errors', []);
            Http::assertSent(fn ($request) => str_contains($request->url(), 'api.spotify.com'));
            Http::assertSent(fn ($request) => str_contains($request->url(), 'open.spotify.com/embed'));
        }
    }

    public function test_room_queue_accepts_links_and_whole_playlists(): void
    {
        Event::fake([PlaybackUpdated::class]);
        config(['services.youtube.key' => 'k']);
        Http::fake(['googleapis.com/youtube/v3/videos*' => Http::response(['items' => [$this->video('Song') + ['id' => 'aaaaaaaaaaa']]])]);

        $me = User::factory()->create();
        $room = $me->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);
        $list = $me->playlists()->create(['name' => 'Mix', 'kind' => 'custom']);
        $list->addSongs([
            ['youtube_id' => 'bbbbbbbbbbb', 'title' => 'B'],
            ['youtube_id' => 'ccccccccccc', 'title' => 'C'],
        ]);

        $this->actingAs($me)->post("/rooms/{$room->slug}/queue", ['url' => 'https://youtu.be/aaaaaaaaaaa'])->assertNoContent();
        $this->actingAs($me)->post("/rooms/{$room->slug}/queue-playlist", ['playlist_id' => $list->id])->assertNoContent();
        $this->assertSame(3, PlaylistItem::where('room_id', $room->id)->count());

        // someone else's playlist cannot be queued
        $this->actingAs(User::factory()->create())->post("/rooms/{$room->slug}/queue-playlist", ['playlist_id' => $list->id])->assertNotFound();
    }

    public function test_chat_sticker_gif_reply_delete_and_roles_in_chat(): void
    {
        Event::fake([MessageSent::class, MessageDeleted::class]);
        $host = User::factory()->create();
        $host->forceFill(['roles' => ['owner']])->save();
        $guest = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);

        $this->actingAs($host)->post("/rooms/{$room->slug}/messages", ['body' => 'hello'])->assertNoContent();
        $first = ChatMessage::first();

        $this->actingAs($guest)->post("/rooms/{$room->slug}/messages", ['sticker' => '🔥', 'reply_to_id' => $first->id])->assertNoContent();
        $this->actingAs($guest)->post("/rooms/{$room->slug}/messages", ['sticker' => 'not-a-sticker'])->assertSessionHasErrors('sticker');
        $this->actingAs($guest)->post("/rooms/{$room->slug}/messages", ['gif' => 'https://evil.example/x.gif'])->assertSessionHasErrors('gif');
        $this->actingAs($guest)->post("/rooms/{$room->slug}/messages", ['gif' => 'https://media.tenor.com/abc/x.gif'])->assertNoContent();
        $this->actingAs($guest)->post("/rooms/{$room->slug}/messages", ['gif' => 'https://media1.giphy.com/media/abc/giphy.gif'])->assertNoContent();
        $this->actingAs($guest)->post("/rooms/{$room->slug}/messages", [])->assertSessionHasErrors('body');

        // roles and badges must be present in chat (they were silently missing before)
        $page = $this->actingAs($guest)->get("/rooms/{$room->slug}")->assertOk();
        $page->assertInertia(fn ($p) => $p
            ->where('messages.0.created_at', $first->created_at->toIso8601String())
            ->where('messages.0.role.key', 'owner')->where('messages.0.badges.0.icon', '👑')
            ->where('messages.1.sticker', '🔥')->where('messages.1.reply.user', $host->name)
            ->where('messages.2.image_url', 'https://media.tenor.com/abc/x.gif')
            ->where('messages.3.image_url', 'https://media1.giphy.com/media/abc/giphy.gif'));

        // delete: your own, or anyone's with the permission
        $sticker = ChatMessage::where('sticker', '🔥')->first();
        $this->actingAs(User::factory()->create())->delete("/rooms/{$room->slug}/messages/{$sticker->id}")->assertForbidden();
        $this->actingAs($guest)->delete("/rooms/{$room->slug}/messages/{$sticker->id}")->assertNoContent();
        $this->actingAs($host)->delete("/rooms/{$room->slug}/messages/{$first->id}")->assertNoContent();
        Event::assertDispatched(MessageDeleted::class, 2);

        // a reply whose original is gone still shows up, marked as deleted
        $this->assertNull(ChatMessage::find($first->id));
    }

    public function test_uploads_are_validated_stored_privately_and_served_by_name(): void
    {
        Storage::fake('local');
        Event::fake([MessageSent::class]);
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);

        // chat picture
        $this->actingAs($host)->post("/rooms/{$room->slug}/chat-image", ['image' => $this->realFile('x.png', '<script>alert(1)</script>')])->assertSessionHasErrors('image');
        $this->actingAs($host)->post("/rooms/{$room->slug}/chat-image", ['image' => $this->png(), 'body' => 'look'])->assertNoContent();
        $url = ChatMessage::first()->payload()['image_url'];
        $this->assertStringContainsString('/media/chat/', $url);
        $this->actingAs($host)->get(parse_url($url, PHP_URL_PATH))->assertOk()->assertHeader('Content-Type', 'image/png');
        $this->actingAs($host)->get('/media/chat/..%2F..%2F.env')->assertNotFound();
        $this->actingAs($host)->get('/media/chat/nothere0000000000.png')->assertNotFound();
        $this->app['auth']->forgetGuards();
        $this->get(parse_url($url, PHP_URL_PATH))->assertOk(); // guests watching a public room may see pictures (random file names)

        // the profile photo and full-body character are stored independently
        $this->actingAs($host)->post('/profile/photo', ['photo' => $this->png('me.png')])->assertRedirect();
        $this->assertStringStartsWith('img:', $host->refresh()->avatar);
        $file = substr($host->avatar, 4);
        Storage::disk('local')->assertExists("avatars/{$file}");
        $this->actingAs($host)->post('/shop/equip', ['avatar' => 'char:foxy']);
        Storage::disk('local')->assertExists("avatars/{$file}");
        $this->assertSame('img:'.$file, $host->refresh()->avatar);
        $this->assertSame('char:foxy', $host->refresh()->character);

        // only avatars from the shop list can be equipped (not someone else's photo name)
        $this->actingAs($host)->post('/shop/equip', ['avatar' => 'img:'.$file])->assertSessionHasErrors('avatar');
        $this->actingAs($host)->post('/profile/photo', ['photo' => $this->realFile('x.png', '<svg onload="1"/>')])->assertSessionHasErrors('photo');
    }

    public function test_members_can_send_picture_replies_and_muted_uploads_leave_no_file(): void
    {
        Storage::fake('local');
        config(['filesystems.uploads' => 'local']);
        Event::fake([MessageSent::class]);
        $host = User::factory()->create();
        $member = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Pictures', 'slug' => 'pictures']);
        $original = $room->messages()->create(['user_id' => $host->id, 'body' => 'Show me']);
        $this->actingAs($member)->post('/rooms/pictures/chat-image', [
            'image' => $this->png(), 'body' => 'My picture', 'reply_to_id' => $original->id,
        ])->assertNoContent();
        $message = $room->messages()->latest('id')->first();
        $this->assertSame('My picture', $message->body);
        $this->assertEquals($original->id, $message->reply_to_id);
        Storage::disk('local')->assertExists('chat/'.$message->image);
        Event::assertDispatched(MessageSent::class);

        $room->mutes()->create(['user_id' => $member->id, 'muted_by' => $host->id]);
        $this->post('/rooms/pictures/chat-image', ['image' => $this->png()])->assertSessionHasErrors('body');
        $this->assertCount(1, Storage::disk('local')->files('chat'));
        $this->assertSame(2, $room->messages()->count());
    }

    public function test_room_emojis_are_host_only_and_listed_in_the_room(): void
    {
        Storage::fake('local');
        $host = User::factory()->create();
        $guest = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);

        $this->actingAs($guest)->post("/rooms/{$room->slug}/emojis", ['name' => 'party', 'image' => $this->png()])->assertForbidden();
        $this->actingAs($host)->post("/rooms/{$room->slug}/emojis", ['name' => 'Bad Name', 'image' => $this->png()])->assertSessionHasErrors('name');
        $this->actingAs($host)->post("/rooms/{$room->slug}/emojis", ['name' => 'party', 'image' => $this->png()])->assertRedirect();
        $this->actingAs($host)->post("/rooms/{$room->slug}/emojis", ['name' => 'party', 'image' => $this->png()])->assertSessionHasErrors('name'); // taken

        $this->actingAs($guest)->get("/rooms/{$room->slug}")->assertInertia(fn ($p) => $p->has('emojis', 1)->where('emojis.0.name', 'party'));

        $emoji = $room->emojis()->first();
        $this->actingAs($guest)->delete("/rooms/{$room->slug}/emojis/{$emoji->id}")->assertForbidden();
        $this->actingAs($host)->delete("/rooms/{$room->slug}/emojis/{$emoji->id}")->assertRedirect();
        $this->assertSame(0, $room->emojis()->count());
    }

    public function test_history_shows_everyones_songs_with_filters_and_gif_search_degrades(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $r1 = $a->rooms()->create(['name' => 'One', 'slug' => 'one-1']);
        $r2 = $a->rooms()->create(['name' => 'Two', 'slug' => 'two-1']);
        PlaylistItem::create(['room_id' => $r1->id, 'user_id' => $a->id, 'youtube_id' => 'aaaaaaaaaaa', 'title' => 'A', 'played_at' => now()]);
        PlaylistItem::create(['room_id' => $r2->id, 'user_id' => $b->id, 'youtube_id' => 'bbbbbbbbbbb', 'title' => 'B', 'played_at' => now()]);
        PlaylistItem::create(['room_id' => $r2->id, 'user_id' => $b->id, 'youtube_id' => 'ccccccccccc', 'title' => 'Not played yet']);

        $this->actingAs($a)->get('/history')->assertInertia(fn ($p) => $p->has('songs', 2));
        $this->actingAs($a)->get('/history?room=two-1')->assertInertia(fn ($p) => $p->has('songs', 1)->where('songs.0.title', 'B')->where('songs.0.user.name', $b->name));
        $this->actingAs($a)->get('/history?mine=1')->assertInertia(fn ($p) => $p->has('songs', 1)->where('songs.0.title', 'A'));

        // Tenor blocked for the key: a clear 503 message, not a crash
        Http::fake(['tenor.googleapis.com/*' => Http::response(['error' => 'blocked'], 403)]);
        $this->actingAs($a)->getJson('/gifs?q=cats')->assertStatus(503)->assertJsonPath('message', fn ($m) => str_contains($m, 'GIF search'));
    }
}
