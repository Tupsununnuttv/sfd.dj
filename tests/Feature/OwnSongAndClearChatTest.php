<?php

namespace Tests\Feature;

use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OwnSongAndClearChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_nobody_votes_on_their_own_song_but_others_can(): void
    {
        $dj = User::factory()->create();
        $fan = User::factory()->create();
        $room = $dj->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);
        $room->enqueue(['youtube_id' => 'aaaaaaaaaaa', 'title' => 'A', 'thumbnail' => null, 'duration' => 200], $dj->id);

        foreach (['woot', 'meh', 'grab'] as $type) {
            $this->actingAs($dj)->postJson('/rooms/lobby-1/vote', ['type' => $type])->assertStatus(422)->assertJsonPath('message', 'You cannot woot, meh or grab your own song.');
        }
        $this->assertSame(['woot' => 0, 'meh' => 0, 'grab' => 0], $room->refresh()->playback()['votes']);

        $this->actingAs($fan)->postJson('/rooms/lobby-1/vote', ['type' => 'woot'])->assertNoContent();
        $this->assertSame(1, $room->refresh()->playback()['votes']['woot']);
    }

    public function test_clear_chat_removes_every_message_announcements_and_broadcasts_too(): void
    {
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);
        $room->messages()->create(['user_id' => $host->id, 'body' => 'hi all']);
        ChatMessage::system($room, 'announcement', 'Party at 8', $host);
        ChatMessage::system($room, 'broadcast', 'Site news', $host);
        ChatMessage::system($room, 'kick', 'someone was kicked', $host);
        ChatMessage::system($room, 'grab', 'x grabbed a song', $host);

        $this->actingAs(User::factory()->create())->deleteJson('/rooms/lobby-1/messages')->assertForbidden();
        $this->actingAs($host)->deleteJson('/rooms/lobby-1/messages')->assertNoContent();

        $this->assertSame([], $room->messages()->pluck('body')->all());
    }
}
