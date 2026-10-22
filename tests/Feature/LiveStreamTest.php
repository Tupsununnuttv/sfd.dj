<?php

namespace Tests\Feature;

use App\Events\MessageSent;
use App\Events\PlaybackUpdated;
use App\Models\ChatMessage;
use App\Models\Room;
use App\Models\User;
use App\Support\LiveStream;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Live streams: a room puts a YouTube, Twitch or Kick stream on its big screen, the songs wait, and the Live streams page lists the rooms that have one. */
class LiveStreamTest extends TestCase
{
    use RefreshDatabase;

    private function room(User $host, string $slug = 'live-room'): Room
    {
        return $host->rooms()->create(['name' => 'Live Room', 'slug' => $slug]);
    }

    public function test_tiktok_live_is_a_canonical_external_watch_link_and_uses_room_permissions(): void
    {
        $expected = ['kind' => 'tiktok', 'ref' => 'some.name', 'url' => 'https://www.tiktok.com/@some.name/live', 'thumbnail' => null];
        foreach (['https://www.tiktok.com/@Some.Name/live?share=1', 'tiktok.com/@some.name/live/'] as $link) {
            $this->assertSame($expected, LiveStream::parse($link));
        }
        foreach (['https://tiktok.com/@name', 'https://tiktok.com/@name/video/123', 'https://tiktok.com/@name/live/extra', 'https://tiktok.com.evil.test/@name/live', 'https://tiktok.com/@<script>/live'] as $link) {
            $this->assertNull(LiveStream::parse($link));
        }

        Event::fake([PlaybackUpdated::class, MessageSent::class]);
        $host = User::factory()->create();
        $room = $this->room($host);
        $url = 'https://www.tiktok.com/@Some.Name/live';
        $this->actingAs(User::factory()->create())->post("/rooms/{$room->slug}/live", ['url' => $url])->assertForbidden();
        $this->actingAs($host)->post("/rooms/{$room->slug}/live", ['url' => $url])->assertNoContent();
        $this->assertSame('tiktok', $room->refresh()->live['kind']);
        $this->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $page) => $page
            ->where('playback.live.kind', 'tiktok')->where('playback.live.url', $expected['url']));
        $this->delete("/rooms/{$room->slug}/live")->assertNoContent();
        $this->assertNull($room->refresh()->live);
    }

    public function test_the_links_of_youtube_twitch_and_kick_streams_are_understood_and_nothing_else(): void
    {
        $video = ['kind' => 'youtube', 'ref' => 'dQw4w9WgXcQ', 'url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'thumbnail' => 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'];
        foreach ([
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=12', 'youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ?si=abc',
            'https://www.youtube.com/live/dQw4w9WgXcQ?feature=share', 'https://m.youtube.com/embed/dQw4w9WgXcQ', ' https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ ',
        ] as $link) {
            $this->assertSame($video, LiveStream::parse($link), $link);
        }

        $channel = 'UCabcdefghijklmnopqrstuv';
        foreach (["https://www.youtube.com/channel/{$channel}", "https://www.youtube.com/channel/{$channel}/live", "https://www.youtube.com/embed/live_stream?channel={$channel}"] as $link) {
            $this->assertSame(['kind' => 'youtube', 'ref' => $channel, 'url' => "https://www.youtube.com/channel/{$channel}/live", 'thumbnail' => null], LiveStream::parse($link), $link);
        }

        $twitch = ['kind' => 'twitch', 'ref' => 'some_name', 'url' => 'https://www.twitch.tv/some_name', 'thumbnail' => 'https://static-cdn.jtvnw.net/previews-ttv/live_user_some_name-640x360.jpg'];
        foreach (['https://www.twitch.tv/Some_Name', 'twitch.tv/some_name/', 'https://m.twitch.tv/some_name?sr=a', 'https://player.twitch.tv/?channel=some_name&parent=example.com'] as $link) {
            $this->assertSame($twitch, LiveStream::parse($link), $link);
        }

        $kick = ['kind' => 'kick', 'ref' => 'some-name', 'url' => 'https://kick.com/some-name', 'thumbnail' => null];
        foreach (['https://kick.com/Some-Name', 'kick.com/some-name/', 'https://player.kick.com/some-name'] as $link) {
            $this->assertSame($kick, LiveStream::parse($link), $link);
        }

        // no other site, no page that is not a stream, nothing that only looks like one
        foreach ([
            '', 'not a link', 'javascript:alert(1)', 'https://example.com/live', 'https://vimeo.com/12345678', 'https://soundcloud.com/artist/track',
            'https://youtube.com/@somechannel', 'https://www.youtube.com/watch?v=short', 'https://www.youtube.com/', 'https://www.youtube.com/channel/UCshort',
            'https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ', 'https://evil.example/?u=https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'https://www.twitch.tv/directory', 'https://www.twitch.tv/', 'https://twitch.tv/ab', 'https://kick.com/categories', 'https://kick.com/',
        ] as $link) {
            $this->assertNull(LiveStream::parse($link), "not a stream: {$link}");
        }
    }

    public function test_the_host_goes_live_everybody_hears_of_it_and_the_songs_wait(): void
    {
        Event::fake([PlaybackUpdated::class, MessageSent::class]);
        $host = User::factory()->create();
        $dj = User::factory()->create();
        $other = User::factory()->create();
        $room = $this->room($host);
        $room->enqueue(['youtube_id' => 'aaaaaaaaaaa', 'title' => 'First', 'thumbnail' => null, 'duration' => 300], $dj->id);
        $this->travel(100)->seconds(); // 1:40 into the first song

        // only somebody who may go live: the host, and those with the room right (the Co-Host has it, a plain member has not)
        $this->actingAs($other)->post("/rooms/{$room->slug}/live", ['url' => 'https://www.twitch.tv/hostname'])->assertForbidden();
        $room->members()->create(['user_id' => $dj->id, 'room_role_id' => $room->roles()->where('name', 'Bouncer')->value('id')]);
        $this->actingAs($dj)->post("/rooms/{$room->slug}/live", ['url' => 'https://www.twitch.tv/hostname'])->assertForbidden();
        $this->assertNull($room->refresh()->live);

        // what is not accepted
        $this->actingAs($host)->post("/rooms/{$room->slug}/live", ['url' => 'https://example.com/stream'])->assertSessionHasErrors('url');
        $this->actingAs($host)->post("/rooms/{$room->slug}/live", [])->assertSessionHasErrors('url');
        $this->actingAs($host)->post("/rooms/{$room->slug}/live", ['url' => 'https://www.twitch.tv/hostname', 'title' => 'a pdf for you'])->assertSessionHasErrors('title');
        $this->actingAs($host)->post("/rooms/{$room->slug}/live", ['url' => 'https://www.twitch.tv/hostname', 'title' => 'see plug.dj'])->assertSessionHasErrors('title');
        $this->assertNull($room->refresh()->live);

        // live: kept in the room, said in the chat, sent to everybody, and shown by the page
        $this->actingAs($host)->post("/rooms/{$room->slug}/live", ['url' => 'https://www.twitch.tv/HostName', 'title' => '  Friday set  '])->assertNoContent();
        $room->refresh();
        $this->assertSame(['kind' => 'twitch', 'ref' => 'hostname', 'title' => 'Friday set', 'user_id' => $host->id], collect($room->live)->only('kind', 'ref', 'title', 'user_id')->all());
        $this->assertSame('live', ChatMessage::where('room_id', $room->id)->latest('id')->value('kind'));
        $this->assertSame("{$host->name} is live: Friday set", ChatMessage::where('room_id', $room->id)->latest('id')->value('body'));
        Event::assertDispatched(PlaybackUpdated::class, fn ($e) => $e->broadcastWith()['live']['title'] === 'Friday set' && $e->broadcastWith()['live']['by']['id'] === $host->id && ! isset($e->broadcastWith()['live']['user_id']));
        $this->actingAs($other)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $page) => $page->where('playback.live.kind', 'twitch')->where('playback.live.url', 'https://www.twitch.tv/hostname')->where('playback.live.by.name', $host->name)->missing('can.go_live'));
        $this->actingAs($host)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $page) => $page->where('can.go_live', true)->where('permissionLabels.go_live', fn ($label) => is_string($label)));
        $this->app['auth']->forgetGuards();
        $this->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $page) => $page->where('playback.live.title', 'Friday set')); // guests watch too

        // the clock of the song stops: an hour later the song is still the one that was playing and nobody's "ended" report moves it
        $this->travel(1)->hours();
        $room->refresh()->syncCurrent();
        $item = $room->current_item_id;
        $this->assertNotNull($item);
        $this->actingAs($host)->post("/rooms/{$room->slug}/skip", ['item_id' => $item, 'ended' => true])->assertNoContent();
        $this->assertSame($item, $room->refresh()->current_item_id);

        // switching to another stream keeps the time it began and is not announced again
        $before = $room->live['started_at'];
        $lines = ChatMessage::where('room_id', $room->id)->count();
        $this->actingAs($host)->post("/rooms/{$room->slug}/live", ['url' => 'https://kick.com/hostname'])->assertNoContent();
        $this->assertSame(['kick', $before, 'Live Room'], [$room->refresh()->live['kind'], $room->live['started_at'], $room->live['title']]); // no title: the room's name
        $this->assertSame($lines, ChatMessage::where('room_id', $room->id)->count());

        // the stream ends: only those who may go live (or moderate) can end it; the song goes on where it stopped
        $this->actingAs($other)->delete("/rooms/{$room->slug}/live")->assertForbidden();
        $this->actingAs($host)->delete("/rooms/{$room->slug}/live")->assertNoContent();
        $this->assertNull($room->refresh()->live);
        $this->assertSame('The live stream has ended', ChatMessage::where('room_id', $room->id)->latest('id')->value('body'));
        $this->assertEqualsWithDelta(100, $room->playback()['elapsed'], 2, 'it was 1:40 into the song when the stream began');
        $this->assertNull($room->playback()['live']);
        $this->actingAs($host)->delete("/rooms/{$room->slug}/live")->assertNoContent(); // ending a stream that is not on is not an error
    }

    public function test_a_song_that_began_during_the_stream_starts_from_the_beginning_and_who_may_go_live_follows_the_room_roles(): void
    {
        Event::fake([PlaybackUpdated::class, MessageSent::class]);
        $host = User::factory()->create();
        $coHost = User::factory()->create();
        $bouncer = User::factory()->create();
        $dj = User::factory()->create();
        $room = $this->room($host);
        $room->members()->create(['user_id' => $coHost->id, 'room_role_id' => $room->roles()->where('name', 'Co-Host')->value('id')]);
        $room->members()->create(['user_id' => $bouncer->id, 'room_role_id' => $room->roles()->where('name', 'Bouncer')->value('id')]);

        $this->assertContains('go_live', $room->roles()->where('name', 'Co-Host')->first()->permissions);
        $this->assertNotContains('go_live', $room->roles()->where('name', 'Manager')->first()->permissions);

        $this->actingAs($coHost)->post("/rooms/{$room->slug}/live", ['url' => 'https://youtu.be/dQw4w9WgXcQ', 'title' => 'Co-host live'])->assertNoContent();
        $this->assertSame($coHost->id, $room->refresh()->live['user_id']);

        // nobody was playing; a DJ joins during the stream and a song starts at once
        $this->travel(10)->minutes();
        $room->enqueue(['youtube_id' => 'bbbbbbbbbbb', 'title' => 'Second', 'thumbnail' => null, 'duration' => 200], $dj->id);
        $this->travel(5)->minutes();

        // a moderator who may not go live can still take the stream off; a plain DJ cannot
        $this->actingAs($dj)->delete("/rooms/{$room->slug}/live")->assertForbidden();
        $this->actingAs($bouncer)->delete("/rooms/{$room->slug}/live")->assertNoContent();
        $this->assertNull($room->refresh()->live);
        $this->assertEqualsWithDelta(0, $room->playback()['elapsed'], 2);
        $this->assertSame('Second', $room->playback()['current']['title']);
    }

    public function test_a_stream_that_nobody_ended_is_over_after_a_day(): void
    {
        Event::fake([PlaybackUpdated::class, MessageSent::class]);
        $host = User::factory()->create();
        $dj = User::factory()->create();
        $room = $this->room($host);
        $room->enqueue(['youtube_id' => 'aaaaaaaaaaa', 'title' => 'First', 'thumbnail' => null, 'duration' => 100000], $dj->id);
        $this->actingAs($host)->post("/rooms/{$room->slug}/live", ['url' => 'https://kick.com/hostname'])->assertNoContent();
        $this->assertNotNull($room->refresh()->liveNow());

        $this->travel(Room::LIVE_HOURS + 1)->hours();

        $this->assertNull($room->refresh()->liveNow());
        $this->assertNull($room->playback()['live']);
        $this->actingAs($host)->get('/live')->assertInertia(fn (Assert $page) => $page->has('streams', 0));
        $this->assertNull($room->refresh()->live, 'the Live streams page ended it');
    }

    public function test_the_live_streams_page_and_the_menu_number_show_the_rooms_that_are_live(): void
    {
        Event::fake([PlaybackUpdated::class, MessageSent::class]);
        $a = User::factory()->create();
        $b = User::factory()->create();
        $quiet = $this->room(User::factory()->create(), 'quiet-room');
        $one = $this->room($a, 'room-a');
        $two = $this->room($b, 'room-b');
        $secret = $b->rooms()->create(['name' => 'Secret', 'slug' => 'secret-room', 'is_private' => true]);
        $this->actingAs($a)->post("/rooms/{$one->slug}/live", ['url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'title' => 'A live'])->assertNoContent();
        $this->actingAs($b)->post("/rooms/{$two->slug}/live", ['url' => 'https://www.twitch.tv/roomb', 'title' => 'B live'])->assertNoContent();
        $this->actingAs($b)->post("/rooms/{$secret->slug}/live", ['url' => 'https://kick.com/secretb', 'title' => 'Secret live'])->assertNoContent();

        // everybody sees the two public ones, with who streams and the picture; the private room's stream is for those who may enter it
        $this->actingAs($a)->get('/live')->assertInertia(fn (Assert $page) => $page->component('Live')->has('streams', 2)
            ->where('streams', fn ($streams) => collect($streams)->pluck('live.title')->sort()->values()->all() === ['A live', 'B live'])
            ->where('streams.0.live.by.name', fn ($name) => in_array($name, [$a->name, $b->name], true))
            ->where('liveCount', 2));
        $this->actingAs($b)->get('/live')->assertInertia(fn (Assert $page) => $page->has('streams', 3)->where('liveCount', 3));
        $this->app['auth']->forgetGuards();
        $this->get('/live')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Live')->has('streams', 2)->where('liveCount', 2));

        // the rooms list knows which rooms are live (the card shows it)
        $this->actingAs($a)->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('rooms', fn ($rooms) => collect($rooms)->firstWhere('slug', 'room-a')['live']['title'] === 'A live' && collect($rooms)->firstWhere('slug', 'quiet-room')['live'] === null));

        $this->actingAs($a)->delete("/rooms/{$one->slug}/live")->assertNoContent();
        $this->actingAs($a)->get('/live')->assertInertia(fn (Assert $page) => $page->has('streams', 1)->where('liveCount', 1));
    }
}
