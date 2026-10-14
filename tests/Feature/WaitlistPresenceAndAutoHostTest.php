<?php

namespace Tests\Feature;

use App\Events\PlaybackUpdated;
use App\Models\Playlist;
use App\Models\PlaylistItem;
use App\Models\Room;
use App\Models\User;
use App\Models\Vote;
use ArrayObject;
use Illuminate\Broadcasting\Broadcasters\PusherBroadcaster;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Pusher\Pusher;
use Tests\TestCase;

/**
 * Somebody who has left the room leaves the waitlist and the booth (also with cycling), Auto Host plays the host's playlist while nobody waits,
 * Autowoot never takes a vote back, and songs are found by name without YouTube.
 */
class WaitlistPresenceAndAutoHostTest extends TestCase
{
    use RefreshDatabase;

    /** Who the live server says is in a room: change the ids in the returned list and the server sees it at once. */
    private function presence(array $ids): ArrayObject
    {
        $here = new ArrayObject($ids);
        config(['broadcasting.default' => 'presence-fake', 'broadcasting.connections.presence-fake' => ['driver' => 'presence-fake']]);
        Broadcast::extend('presence-fake', fn () => new PusherBroadcaster(new class($here) extends Pusher
        {
            public function __construct(private ArrayObject $here)
            {
                parent::__construct('key', 'secret', '1');
            }

            public function get(string $path, array $params = [], $associative = false)
            {
                return ['users' => array_map(fn ($id) => ['id' => $id], $this->here->getArrayCopy())];
            }

            public function trigger($channels, string $event, $data, array $params = [], bool $already_encoded = false): object
            {
                return (object) [];
            }
        }));

        return $here;
    }

    private function list(User $user, array $ids = ['a', 'b', 'c'], string $name = 'Mix'): Playlist
    {
        $list = $user->playlists()->create(['name' => $name, 'kind' => 'custom']);
        $list->addSongs(array_map(fn ($id) => ['youtube_id' => str_pad($id, 11, 'x'), 'title' => "Song {$id}", 'duration' => 200], $ids));

        return $list;
    }

    private function line(Room $room): array
    {
        return $room->refresh()->items()->pluck('user_id')->all();
    }

    public function test_a_dj_who_left_the_room_is_not_cycled_back_into_the_line(): void
    {
        Event::fake([PlaybackUpdated::class]);
        $host = User::factory()->create();
        $ann = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-p', 'waitlist_cycle' => true]);
        $this->list($host);
        $this->list($ann);
        $this->actingAs($host)->postJson("/rooms/{$room->slug}/join");
        $this->actingAs($ann)->postJson("/rooms/{$room->slug}/join");
        $this->presence([$ann->id]); // the host closed the tab while their song played

        $room->refresh()->advance(); // their song ends

        $this->assertSame([$ann->id], $this->line($room), 'the host did not go to the back of the line');
        $this->assertSame($ann->id, PlaylistItem::find($room->current_item_id)->user_id);
    }

    public function test_somebody_who_left_is_skipped_when_their_turn_comes(): void
    {
        Event::fake([PlaybackUpdated::class]);
        [$host, $ann, $bob] = User::factory()->count(3)->create()->all();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-s']);
        foreach ([$host, $ann, $bob] as $person) {
            $this->list($person);
            $this->actingAs($person)->postJson("/rooms/{$room->slug}/join");
        }
        $this->presence([$host->id, $bob->id]); // Ann is gone

        $room->refresh()->advance();

        $this->assertSame($bob->id, PlaylistItem::find($room->current_item_id)->user_id);
        $this->assertSame([$bob->id], $this->line($room));
    }

    public function test_the_sweep_takes_out_who_left_and_never_who_is_still_here(): void
    {
        Event::fake([PlaybackUpdated::class]);
        [$host, $ann, $bob] = User::factory()->count(3)->create()->all();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-x', 'waitlist_cycle' => true]);
        foreach ([$host, $ann, $bob] as $person) {
            $this->list($person);
            $this->actingAs($person)->postJson("/rooms/{$room->slug}/join");
        }

        // while nobody can say who is here (the live server does not answer), nobody is taken out
        $this->actingAs($ann)->post("/rooms/{$room->slug}/waitlist/sweep")->assertNoContent();
        $this->assertSame([$host->id, $ann->id, $bob->id], $this->line($room));

        $here = $this->presence([$ann->id]); // the DJ (the host) and Bob dropped off
        $this->actingAs($ann)->post("/rooms/{$room->slug}/waitlist/sweep")->assertNoContent();

        $this->assertSame([$ann->id], $this->line($room), 'the DJ left the booth (no cycling back) and Bob left the line');
        $this->assertSame($ann->id, PlaylistItem::find($room->current_item_id)->user_id);
        $this->assertDatabaseHas('chat_messages', ['room_id' => $room->id, 'kind' => 'leave', 'body' => "{$bob->name} left the waitlist (left the room)"]);
        $this->assertDatabaseHas('chat_messages', ['room_id' => $room->id, 'kind' => 'leave', 'body' => "{$host->name} left the waitlist (left the room)"]);

        // Ann is still here: asking again changes nothing
        $here->append($host->id);
        $this->actingAs($ann)->post("/rooms/{$room->slug}/waitlist/sweep")->assertNoContent();
        $this->assertSame([$ann->id], $this->line($room));
    }

    public function test_auto_host_plays_while_nobody_waits_and_makes_way_for_people(): void
    {
        Event::fake([PlaybackUpdated::class]);
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-a']);
        $bot = User::factory()->create(['is_bot' => true]);
        $bot->forceFill(['is_bot' => true, 'bot_owner_id' => $host->id])->save();
        $list = $this->list($host, ['h1', 'h2'], 'Host mix');
        $ann = User::factory()->create();
        $this->list($ann, ['a1']);

        $this->actingAs($host)->getJson("/rooms/{$room->slug}/auto-host")
            ->assertOk()->assertJsonPath('bot_id', null)->assertJsonPath('bots.0.id', $bot->id)->assertJsonPath('playlists.0.songs_count', 2);

        // on: the booth was empty, so the bot plays the top song of the list at once, and it is in the room
        $this->actingAs($host)->putJson("/rooms/{$room->slug}/auto-host", ['bot_id' => $bot->id, 'playlist_id' => $list->id])->assertNoContent();
        $now = PlaylistItem::find($room->refresh()->current_item_id);
        $this->assertSame([$bot->id, 'Song h1'], [$now->user_id, $now->title]);
        $this->assertDatabaseHas('room_bot_presences', ['room_id' => $room->id, 'user_id' => $bot->id]);

        // a person joins: they play after the bot's song
        $this->actingAs($ann)->postJson("/rooms/{$room->slug}/join")->assertJson(['queued' => true]);
        $room->refresh()->advance();
        $this->assertSame($ann->id, PlaylistItem::find($room->refresh()->current_item_id)->user_id);

        // the line is empty again: the bot plays the next song of the list (h1 went to its bottom)
        $room->refresh()->advance();
        $this->assertSame([$bot->id, 'Song h2'], [PlaylistItem::find($room->refresh()->current_item_id)->user_id, PlaylistItem::find($room->current_item_id)->title]);

        // off: its song stops and it leaves the room
        $this->actingAs($host)->putJson("/rooms/{$room->slug}/auto-host", ['bot_id' => null])->assertNoContent();
        $this->assertNull($room->refresh()->current_item_id);
        $this->assertNull($room->auto_host_bot_id);
        $this->assertDatabaseMissing('room_bot_presences', ['room_id' => $room->id, 'user_id' => $bot->id]);
    }

    public function test_only_the_host_sets_up_auto_host_and_only_with_their_own_bot_and_a_list_with_songs(): void
    {
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-b']);
        $stranger = User::factory()->create();
        $strangersBot = User::factory()->create();
        $strangersBot->forceFill(['is_bot' => true, 'bot_owner_id' => $stranger->id])->save();
        $empty = $host->playlists()->create(['name' => 'Empty', 'kind' => 'custom']);
        $bot = User::factory()->create();
        $bot->forceFill(['is_bot' => true, 'bot_owner_id' => $host->id])->save();

        $this->actingAs($stranger)->getJson("/rooms/{$room->slug}/auto-host")->assertForbidden();
        $this->actingAs($stranger)->putJson("/rooms/{$room->slug}/auto-host", ['bot_id' => $strangersBot->id])->assertForbidden();
        $this->actingAs($host)->putJson("/rooms/{$room->slug}/auto-host", ['bot_id' => $strangersBot->id, 'playlist_id' => $empty->id])->assertJsonValidationErrors('bot_id');
        $this->actingAs($host)->putJson("/rooms/{$room->slug}/auto-host", ['bot_id' => $bot->id, 'playlist_id' => $empty->id])->assertJsonValidationErrors('playlist_id');
        $this->assertNull($room->refresh()->auto_host_bot_id);
    }

    public function test_autowoot_only_ever_adds_a_woot(): void
    {
        Event::fake([PlaybackUpdated::class]);
        $dj = User::factory()->create();
        $room = $dj->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-v']);
        $item = $room->enqueue(['youtube_id' => 'abcdefghijk', 'title' => 'Song', 'duration' => 200], $dj->id);
        [$ann, $bob, $cid] = User::factory()->count(3)->create()->all();
        $types = fn (User $who) => Vote::where('playlist_item_id', $item->id)->where('user_id', $who->id)->pluck('type')->all();

        $this->actingAs($ann)->post("/rooms/{$room->slug}/vote", ['type' => 'woot', 'item_id' => $item->id, 'auto' => true])->assertNoContent();
        $this->assertSame(['woot'], $types($ann));
        $this->actingAs($ann)->post("/rooms/{$room->slug}/vote", ['type' => 'woot', 'item_id' => $item->id, 'auto' => true])->assertNoContent();
        $this->assertSame(['woot'], $types($ann), 'a second auto woot did not take the first back');

        $this->actingAs($bob)->post("/rooms/{$room->slug}/vote", ['type' => 'meh']);
        $this->actingAs($bob)->post("/rooms/{$room->slug}/vote", ['type' => 'woot', 'item_id' => $item->id, 'auto' => true])->assertNoContent();
        $this->assertSame(['meh'], $types($bob), 'a meh given by hand stays');

        $this->actingAs($cid)->post("/rooms/{$room->slug}/vote", ['type' => 'woot']);
        $this->actingAs($cid)->post("/rooms/{$room->slug}/vote", ['type' => 'woot']);
        $this->assertSame([], $types($cid), 'pressing Woot by hand still toggles');

        $this->actingAs($ann)->patch('/settings/preferences', ['room' => ['autowoot' => true], 'appearance' => ['compact' => true]])->assertSessionHasNoErrors();
        $this->assertSame([true, true], [$ann->refresh()->preferences['room']['autowoot'], $ann->preferences['appearance']['compact']]);
        $this->actingAs($ann)->patch('/settings/preferences', ['room' => ['autowoot' => 'yes']])->assertSessionHasErrors('room.autowoot');
    }

    public function test_songs_on_the_site_are_found_by_name_even_without_youtube(): void
    {
        config(['services.youtube.key' => null]);
        $someone = User::factory()->create();
        $list = $someone->playlists()->create(['name' => 'Mix', 'kind' => 'custom']);
        $list->addSongs([
            ['youtube_id' => 'FGBhQbmPwH8', 'title' => 'Daft Punk - One More Time (Official Video)', 'duration' => 320],
            ['youtube_id' => 'abcdefghijk', 'title' => 'Something Else', 'duration' => 200],
        ]);
        $me = User::factory()->create();

        $this->actingAs($me)->getJson('/youtube/search?q=one+more+TIME')
            ->assertOk()->assertJsonCount(1)
            ->assertJsonPath('0.id', 'FGBhQbmPwH8')
            ->assertJsonPath('0.channel', fn ($channel) => str_ends_with($channel, 'on SFD-DJ.EU'));

        $this->actingAs($me)->getJson('/youtube/search?q=nothing+like+this')->assertStatus(503);
    }

    public function test_a_youtube_search_is_asked_once_a_day_for_the_same_words(): void
    {
        config(['services.youtube.key' => 'k']);
        Http::fake(['googleapis.com/youtube/v3/search*' => Http::response(['items' => [['id' => ['videoId' => 'zzzzzzzzzzz'], 'snippet' => ['title' => 'Found', 'channelTitle' => 'Chan', 'thumbnails' => []]]]])]);
        $me = User::factory()->create();

        $this->actingAs($me)->getJson('/youtube/search?q=Found')->assertOk()->assertJsonPath('0.id', 'zzzzzzzzzzz');
        $this->actingAs($me)->getJson('/youtube/search?q=found')->assertOk()->assertJsonPath('0.id', 'zzzzzzzzzzz');

        Http::assertSentCount(1);
        $this->assertSame(0, DB::table('playlist_songs')->count());
    }
}
