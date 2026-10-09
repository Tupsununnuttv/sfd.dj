<?php

namespace Tests\Feature;

use App\Events\PlaybackUpdated;
use App\Models\ChatMessage;
use App\Models\Playlist;
use App\Models\PlaylistItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

/** The waitlist is people in a line: each plays the top song of their active playlist when their turn comes. */
class WaitlistPeopleTest extends TestCase
{
    use RefreshDatabase;

    private function list(User $user, array $ids = ['a', 'b', 'c']): Playlist
    {
        $list = $user->playlists()->create(['name' => 'Mix', 'kind' => 'custom']);
        $list->addSongs(array_map(fn ($id) => ['youtube_id' => str_pad($id, 11, 'x'), 'title' => "Song {$id}", 'duration' => 200], $ids));

        return $list;
    }

    public function test_joining_writes_who_joined_and_the_waitlist_holds_one_entry_per_person(): void
    {
        Event::fake([PlaybackUpdated::class]);
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-w']);
        $ann = User::factory()->create();
        $this->list($host);
        $this->list($ann);

        $this->actingAs($host)->postJson("/rooms/{$room->slug}/join")->assertJson(['queued' => true]);
        $this->actingAs($ann)->postJson("/rooms/{$room->slug}/join")->assertJson(['queued' => true]);
        $this->actingAs($ann)->postJson("/rooms/{$room->slug}/join")->assertJson(['queued' => false, 'reason' => 'already']);

        $this->assertSame([$host->id, $ann->id], PlaylistItem::where('room_id', $room->id)->orderBy('id')->pluck('user_id')->all());
        $this->assertDatabaseHas('chat_messages', ['room_id' => $room->id, 'kind' => 'join', 'body' => "{$ann->name} joined the waitlist"]);
        $this->assertSame(2, ChatMessage::where('kind', 'join')->count(), 'once for each person, the second press said nothing');
    }

    public function test_the_same_song_cannot_be_added_twice_but_other_songs_by_the_same_person_can(): void
    {
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-d']);
        $song = ['youtube_id' => 'abcdefghijk', 'title' => 'Song a', 'duration' => 200];

        $first = $room->enqueue($song, $host->id);
        $duplicate = $room->enqueue($song, $host->id);
        $room->enqueue(['youtube_id' => 'lmnopqrstuv', 'title' => 'Song b', 'duration' => 200], $host->id);
        $staleDuplicate = $room->items()->create($song + ['user_id' => $host->id, 'position' => 3]);

        $room->syncCurrent();

        $this->assertSame($first->id, $duplicate->id);
        $this->assertDatabaseMissing('playlist_items', ['id' => $staleDuplicate->id]);
        $this->assertSame(2, $room->items()->count());
    }

    public function test_the_next_dj_plays_the_top_song_of_their_playlist_as_it_is_on_their_turn(): void
    {
        Event::fake([PlaybackUpdated::class]);
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-w']);
        $ann = User::factory()->create();
        $this->list($host);
        $annList = $this->list($ann, ['x', 'y', 'z']);

        $this->actingAs($host)->postJson("/rooms/{$room->slug}/join");
        $this->actingAs($ann)->postJson("/rooms/{$room->slug}/join");

        // while she waits, Ann drags another song to the top
        $z = $annList->songs()->where('title', 'Song z')->first();
        $this->actingAs($ann)->putJson("/api/playlists/{$annList->id}/order", ['ids' => [$z->id]])->assertOk();

        $room->refresh()->advance(); // the host's song ends
        $this->assertSame('Song z', PlaylistItem::find($room->refresh()->current_item_id)->title);

        // nobody is left in the line: nothing plays
        $room->refresh()->advance();
        $this->assertNull($room->refresh()->current_item_id);
    }

    public function test_with_cycling_a_dj_goes_to_the_back_with_the_next_song_of_their_playlist(): void
    {
        Event::fake([PlaybackUpdated::class]);
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-w', 'waitlist_cycle' => true]);
        $ann = User::factory()->create();
        $this->list($host);
        $this->list($ann, ['x', 'y']);

        $this->actingAs($host)->postJson("/rooms/{$room->slug}/join");
        $this->actingAs($ann)->postJson("/rooms/{$room->slug}/join");

        $room->refresh()->advance(); // the host has played Song a: Ann plays now, the host is at the back with Song b
        $line = PlaylistItem::where('room_id', $room->id)->whereNull('played_at')->orderBy('position')->get();
        $this->assertSame([$ann->id, $host->id], $line->pluck('user_id')->all());
        $this->assertSame('Song b', $line->last()->title);

        // a DJ whose list is empty does not come back
        $ann->playlists()->first()->songs()->delete();
        $room->refresh()->advance();
        $this->assertSame([$host->id], PlaylistItem::where('room_id', $room->id)->whereNull('played_at')->pluck('user_id')->all());
    }

    public function test_leaving_the_waitlist_works_with_cycling_on_even_when_it_is_your_song(): void
    {
        Event::fake([PlaybackUpdated::class]);
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-w', 'waitlist_cycle' => true]);
        $ann = User::factory()->create();
        $this->list($host);
        $this->list($ann);
        $line = fn () => PlaylistItem::where('room_id', $room->id)->whereNull('played_at')->orderBy('position')->pluck('user_id')->all();

        $this->actingAs($host)->postJson("/rooms/{$room->slug}/join");
        $this->actingAs($ann)->postJson("/rooms/{$room->slug}/join");
        $this->assertSame([$host->id, $ann->id], $line());

        // the host is playing and leaves: they are out, they do not go to the back of the line, and Ann plays
        $this->actingAs($host)->delete("/rooms/{$room->slug}/waitlist")->assertNoContent();
        $this->assertSame([$ann->id], $line());
        $this->assertSame($ann->id, PlaylistItem::find($room->refresh()->current_item_id)->user_id);

        // the same when the one who plays is taken out of the line by somebody who manages it
        $this->actingAs($host)->delete("/rooms/{$room->slug}/queue/{$room->current_item_id}")->assertNoContent();
        $this->assertSame([], $line());
        $this->assertNull($room->refresh()->current_item_id);

        // and a song that ends by itself still sends the DJ to the back, as cycling says
        $this->actingAs($host)->postJson("/rooms/{$room->slug}/join");
        $this->actingAs($ann)->postJson("/rooms/{$room->slug}/join");
        $room->refresh()->advance();
        $this->assertSame([$ann->id, $host->id], $line());
    }

    public function test_a_finished_song_and_a_removed_person_are_told_in_chat(): void
    {
        Event::fake([PlaybackUpdated::class]);
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-w']);
        $this->list($host);

        $this->actingAs($host)->postJson("/rooms/{$room->slug}/join");
        $item = PlaylistItem::where('room_id', $room->id)->sole();

        $this->actingAs($host)->post("/rooms/{$room->slug}/skip", ['item_id' => $item->id, 'ended' => true])->assertNoContent();
        $this->assertDatabaseHas('chat_messages', ['room_id' => $room->id, 'kind' => 'ended', 'body' => "“Song a” by {$host->name} has ended"]);
        $this->assertDatabaseMissing('chat_messages', ['room_id' => $room->id, 'kind' => 'skip']);

        $ann = User::factory()->create();
        $this->list($ann);
        $this->actingAs($ann)->postJson("/rooms/{$room->slug}/join");
        $annItem = PlaylistItem::where('room_id', $room->id)->where('user_id', $ann->id)->whereNull('played_at')->first();
        $this->actingAs($host)->delete("/rooms/{$room->slug}/queue/{$annItem->id}")->assertNoContent();
        $this->assertDatabaseHas('chat_messages', ['room_id' => $room->id, 'kind' => 'remove', 'body' => "{$host->name} removed {$ann->name} from the waitlist"]);
    }

    public function test_clearing_the_chat_removes_everything_for_good(): void
    {
        Event::fake([PlaybackUpdated::class]);
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-w']);
        $room->messages()->create(['user_id' => $host->id, 'body' => 'hi', 'type' => 'user']);
        ChatMessage::system($room, 'announcement', 'Hear this', $host);
        ChatMessage::system($room, 'broadcast', 'From the site', $host);
        ChatMessage::system($room, 'join', 'Ann joined the waitlist', $host);

        $this->actingAs($host)->delete("/rooms/{$room->slug}/messages")->assertNoContent();

        $this->assertSame(0, $room->messages()->count());
        $this->actingAs($host)->get("/rooms/{$room->slug}")->assertInertia(fn ($page) => $page->where('messages', []));
    }
}
