<?php

namespace Tests\Feature;

use App\Models\PlaylistItem;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RoomInfoTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_room_page_carries_the_numbers_for_room_info(): void
    {
        $host = User::factory()->create();
        $guest = User::factory()->create();
        $fan = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-info']);
        $other = $host->rooms()->create(['name' => 'Elsewhere', 'slug' => 'elsewhere-info']);

        $one = PlaylistItem::create(['room_id' => $room->id, 'user_id' => $host->id, 'youtube_id' => 'aaaaaaaaaaa', 'title' => 'A', 'played_at' => now()]);
        $two = PlaylistItem::create(['room_id' => $room->id, 'user_id' => $guest->id, 'youtube_id' => 'bbbbbbbbbbb', 'title' => 'B', 'played_at' => now()]);
        PlaylistItem::create(['room_id' => $room->id, 'user_id' => $guest->id, 'youtube_id' => 'ccccccccccc', 'title' => 'C', 'played_at' => now()]);
        PlaylistItem::create(['room_id' => $room->id, 'user_id' => $fan->id, 'youtube_id' => 'ddddddddddd', 'title' => 'D']); // still waiting: not played
        $elsewhere = PlaylistItem::create(['room_id' => $other->id, 'user_id' => $fan->id, 'youtube_id' => 'eeeeeeeeeee', 'title' => 'E', 'played_at' => now()]);

        foreach ([$one, $two] as $song) {
            Vote::create(['playlist_item_id' => $song->id, 'user_id' => $fan->id, 'type' => 'woot']);
        }
        Vote::create(['playlist_item_id' => $two->id, 'user_id' => $host->id, 'type' => 'meh']);
        Vote::create(['playlist_item_id' => $elsewhere->id, 'user_id' => $host->id, 'type' => 'woot']); // another room's woot does not count

        $this->actingAs($fan)->get('/rooms/lobby-info')->assertInertia(fn (Assert $page) => $page
            ->component('Room')
            ->where('stats', ['songs_played' => 3, 'djs' => 2, 'woots' => 2]));
    }

    public function test_guests_see_the_numbers_too(): void
    {
        $host = User::factory()->create();
        $host->rooms()->create(['name' => 'Open', 'slug' => 'open-info']);

        $this->get('/rooms/open-info')->assertInertia(fn (Assert $page) => $page->where('stats', ['songs_played' => 0, 'djs' => 0, 'woots' => 0]));
    }
}
