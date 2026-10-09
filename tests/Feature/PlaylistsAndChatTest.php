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

    public function test_soundcloud_and_spotify_links_are_matched_on_youtube_and_playlists_import(): void
    {
        config(['services.youtube.key' => 'k', 'services.spotify.client_id' => null, 'services.spotify.client_secret' => null]);
        Http::fake([
            'soundcloud.com/oembed*' => Http::response(['title' => 'Midnight City by M83']),
            'open.spotify.com/track/*' => Http::response('<html><meta property="og:title" content="Get Lucky"><meta property="og:description" content="Daft Punk · Random Access Memories · Song · 2013"></html>'),
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

        $this->actingAs($me)->postJson("/api/playlists/{$list->id}/songs", ['url' => 'https://soundcloud.com/m83/midnight-city'])->assertJson(['added' => 1]);
        $this->assertSame('soundcloud', $list->songs()->first()->origin);
        Http::assertSent(fn ($r) => str_contains($r->url(), 'search') && str_contains(urldecode($r->url()), 'Midnight City by M83'));

        $this->actingAs($me)->postJson("/api/playlists/{$list->id}/songs", ['url' => 'https://open.spotify.com/track/abc123'])->assertOk();
        Http::assertSent(fn ($r) => str_contains($r->url(), 'search') && str_contains(urldecode($r->url()), 'Daft Punk Get Lucky'));

        // import: a YouTube playlist expands, unsupported things report an error per line
        $res = $this->actingAs($me)->postJson("/api/playlists/{$list->id}/import", ['text' => implode("\n", [
            'https://www.youtube.com/playlist?list=PLabc',
            'https://soundcloud.com/m83/sets/some-set',
            'https://open.spotify.com/playlist/xyz',
            'https://example.com/nope',
        ])])->assertOk();

        $this->assertSame(2, $res->json('added'));
        $this->assertCount(3, $res->json('errors'));
        $this->assertStringContainsString('SPOTIFY_CLIENT_ID', implode(' ', $res->json('errors')));
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
        $this->actingAs($guest)->post("/rooms/{$room->slug}/messages", [])->assertSessionHasErrors('body');

        // roles and badges must be present in chat (they were silently missing before)
        $page = $this->actingAs($guest)->get("/rooms/{$room->slug}")->assertOk();
        $page->assertInertia(fn ($p) => $p
            ->where('messages.0.role.key', 'owner')->where('messages.0.badges.0.icon', '👑')
            ->where('messages.1.sticker', '🔥')->where('messages.1.reply.user', $host->name)
            ->where('messages.2.image_url', 'https://media.tenor.com/abc/x.gif'));

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

        // profile photo replaces the avatar, and an avatar from the shop replaces the photo again
        $this->actingAs($host)->post('/profile/photo', ['photo' => $this->png('me.png')])->assertRedirect();
        $this->assertStringStartsWith('img:', $host->refresh()->avatar);
        $file = substr($host->avatar, 4);
        Storage::disk('local')->assertExists("avatars/{$file}");
        $this->actingAs($host)->post('/shop/equip', ['avatar' => 'char:foxy']);
        Storage::disk('local')->assertMissing("avatars/{$file}");
        $this->assertSame('char:foxy', $host->refresh()->avatar);

        // only avatars from the shop list can be equipped (not someone else's photo name)
        $this->actingAs($host)->post('/shop/equip', ['avatar' => 'img:'.$file])->assertSessionHasErrors('avatar');
        $this->actingAs($host)->post('/profile/photo', ['photo' => $this->realFile('x.png', '<svg onload="1"/>')])->assertSessionHasErrors('photo');
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
