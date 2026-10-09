<?php

namespace Tests\Feature;

use App\Events\FriendRequested;
use App\Events\MessageSent;
use App\Events\PlaybackUpdated;
use App\Events\UserKicked;
use App\Models\Playlist;
use App\Models\PlaylistItem;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RoomSocialTest extends TestCase
{
    use RefreshDatabase;

    private function roomWithSong(User $host, User $dj): array
    {
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);
        $room->enqueue(['youtube_id' => 'aaaaaaaaaaa', 'title' => 'Song A', 'thumbnail' => null, 'duration' => 200], $dj->id);

        return [$room->refresh(), PlaylistItem::first()];
    }

    public function test_woot_meh_grab_with_system_message_and_xp(): void
    {
        Event::fake([PlaybackUpdated::class, MessageSent::class]);
        $host = User::factory()->create();
        $dj = User::factory()->create();
        $fan = User::factory()->create();
        [$room, $song] = $this->roomWithSong($host, $dj);

        $this->actingAs($fan)->post("/rooms/{$room->slug}/vote", ['type' => 'woot'])->assertNoContent();
        $this->assertSame(['woot' => 1, 'meh' => 0, 'grab' => 0], $room->votes());

        // meh replaces woot; repeating meh takes it back
        $this->actingAs($fan)->post("/rooms/{$room->slug}/vote", ['type' => 'meh']);
        $this->assertSame(['woot' => 0, 'meh' => 1, 'grab' => 0], $room->votes());
        $this->actingAs($fan)->post("/rooms/{$room->slug}/vote", ['type' => 'meh']);
        $this->assertSame(0, Vote::count());

        // grab puts the song in the playlist the person picks, once, and pays the DJ
        $mine = $fan->playlists()->create(['name' => 'Road trip', 'kind' => 'custom']);
        $this->actingAs($fan)->postJson("/rooms/{$room->slug}/vote", ['type' => 'grab', 'playlist_id' => $mine->id])->assertOk();
        $this->actingAs($fan)->postJson("/rooms/{$room->slug}/vote", ['type' => 'grab', 'playlist_id' => $mine->id])->assertOk();
        $this->assertSame(1, $mine->songs()->count());
        $this->assertSame(3, $dj->refresh()->xp);

        $this->actingAs($fan)->post("/rooms/{$room->slug}/vote", ['type' => 'bogus'])->assertSessionHasErrors('type');

        // the grabbed song shows on the Playlists page, in the list that was picked, and only its owner can read it
        $this->actingAs($fan)->getJson('/api/playlists')->assertOk()->assertJsonPath('0.songs_count', 1)->assertJsonPath('0.kind', 'custom');
        $this->actingAs($dj)->getJson("/api/playlists/{$mine->id}")->assertForbidden();
        $this->actingAs($fan)->getJson("/api/playlists/{$mine->id}")->assertJsonPath('0.title', 'Song A');
    }

    public function test_skip_leave_waitlist_and_announce_write_system_messages(): void
    {
        Event::fake([PlaybackUpdated::class, MessageSent::class]);
        $host = User::factory()->create();
        $dj = User::factory()->create();
        [$room, $song] = $this->roomWithSong($host, $dj);
        $room->enqueue(['youtube_id' => 'bbbbbbbbbbb', 'title' => 'Song B', 'thumbnail' => null, 'duration' => 0], $dj->id);
        $room->enqueue(['youtube_id' => 'ccccccccccc', 'title' => 'Song C', 'thumbnail' => null, 'duration' => 0], $host->id);

        // a manual skip is logged, a song ending is not
        $this->actingAs($host)->post("/rooms/{$room->slug}/skip", ['item_id' => $song->id])->assertNoContent();
        $this->assertDatabaseHas('chat_messages', ['kind' => 'skip']);

        // leaving the waitlist removes the DJ's remaining songs
        $this->actingAs($dj)->delete("/rooms/{$room->slug}/waitlist")->assertNoContent();
        $this->assertDatabaseHas('chat_messages', ['kind' => 'leave']);
        $this->assertSame(0, $room->items()->where('user_id', $dj->id)->count());
        $this->assertSame(1, $room->items()->count());

        // announcements need moderate_chat
        $this->actingAs($dj)->post("/rooms/{$room->slug}/announce", ['message' => 'Hi'])->assertForbidden();
        $this->actingAs($host)->post("/rooms/{$room->slug}/announce", ['message' => 'Party time'])->assertNoContent();
        $this->assertDatabaseHas('chat_messages', ['kind' => 'announcement', 'body' => 'Party time']);

        // system lines come back in the room payload for people who join later
        $this->actingAs($dj)->get("/rooms/{$room->slug}")->assertInertia(fn ($p) => $p->where('messages.0.type', 'system'));
    }

    public function test_kick_ban_unban_and_role_messages(): void
    {
        Event::fake([UserKicked::class, MessageSent::class]);
        $host = User::factory()->create();
        $troll = User::factory()->create();
        $mod = User::factory()->create();
        $staff = User::factory()->create();
        $staff->forceFill(['roles' => ['moderator']])->save();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);
        $bouncer = $room->roles()->where('name', 'Bouncer')->firstOrFail();

        // nobody can kick without the permission, and the host / staff / yourself are protected
        $this->actingAs($troll)->post("/rooms/{$room->slug}/kick/{$mod->id}")->assertForbidden();
        $this->actingAs($host)->put("/rooms/{$room->slug}/members/{$mod->id}", ['room_role_id' => $bouncer->id])->assertNoContent();
        $this->assertDatabaseHas('chat_messages', ['kind' => 'promote']);
        $this->actingAs($mod)->post("/rooms/{$room->slug}/kick/{$host->id}")->assertForbidden();
        $this->actingAs($mod)->post("/rooms/{$room->slug}/ban/{$staff->id}")->assertForbidden();
        $this->actingAs($mod)->post("/rooms/{$room->slug}/ban/{$mod->id}")->assertStatus(422);

        // kick: logged and broadcast, can come back. ban: cannot open the room until unbanned
        $this->actingAs($mod)->post("/rooms/{$room->slug}/kick/{$troll->id}")->assertNoContent();
        Event::assertDispatched(UserKicked::class, fn ($e) => $e->userId === $troll->id && ! $e->banned);
        $this->actingAs($troll)->get("/rooms/{$room->slug}")->assertOk();

        $this->actingAs($mod)->post("/rooms/{$room->slug}/ban/{$troll->id}")->assertNoContent();
        $this->assertDatabaseHas('chat_messages', ['kind' => 'ban']);
        $this->actingAs($troll)->get("/rooms/{$room->slug}")->assertForbidden();
        $this->actingAs($mod)->get("/rooms/{$room->slug}")->assertInertia(fn ($p) => $p->has('bans', 1));

        $this->actingAs($mod)->delete("/rooms/{$room->slug}/ban/{$troll->id}")->assertNoContent();
        $this->actingAs($troll)->get("/rooms/{$room->slug}")->assertOk();

        // removing a role is logged too
        $this->actingAs($host)->put("/rooms/{$room->slug}/members/{$mod->id}", ['room_role_id' => null])->assertNoContent();
        $this->assertDatabaseHas('chat_messages', ['kind' => 'demote']);
    }

    public function test_song_search_and_adding_use_the_youtube_api(): void
    {
        Event::fake([PlaybackUpdated::class]);
        config(['services.youtube.key' => 'test-key']);

        Http::fake([
            'googleapis.com/youtube/v3/search*' => Http::response(['items' => [
                ['id' => ['videoId' => 'dQw4w9WgXcQ'], 'snippet' => ['title' => 'Never &amp; Gonna', 'channelTitle' => 'Rick', 'thumbnails' => ['medium' => ['url' => 'https://img/x.jpg']]]],
            ]]),
            'googleapis.com/youtube/v3/videos*' => Http::sequence()
                ->push(['items' => [['snippet' => ['title' => 'Never Gonna'], 'contentDetails' => ['duration' => 'PT3M34S'], 'status' => ['embeddable' => true]]]])
                ->push(['items' => [['snippet' => ['title' => 'Blocked'], 'contentDetails' => ['duration' => 'PT1M'], 'status' => ['embeddable' => false]]]]),
        ]);

        $user = User::factory()->create();
        $room = $user->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);

        $this->actingAs($user)->getJson('/youtube/search?q=rick')->assertOk()
            ->assertJsonPath('0.id', 'dQw4w9WgXcQ')->assertJsonPath('0.title', 'Never & Gonna');

        $this->actingAs($user)->post("/rooms/{$room->slug}/queue", ['video_id' => 'dQw4w9WgXcQ'])->assertNoContent();
        $this->assertSame(214, PlaylistItem::first()->duration);

        // a video that cannot be embedded is refused
        $this->actingAs($user)->postJson("/rooms/{$room->slug}/queue", ['video_id' => 'bbbbbbbbbbb'])->assertJsonValidationErrors('url');

        // without a key, search says so instead of failing silently
        config(['services.youtube.key' => '']);
        $this->actingAs($user)->getJson('/youtube/search?q=rick')->assertStatus(503);
    }

    public function test_friend_request_is_broadcast_to_the_receiver(): void
    {
        Event::fake([FriendRequested::class]);
        $a = User::factory()->create(['name' => 'Alice']);
        $b = User::factory()->create(['name' => 'Bob']);

        $this->actingAs($a)->post('/friends', ['name' => 'Bob'])->assertRedirect();

        Event::assertDispatched(FriendRequested::class, fn ($e) => $e->friendship->friend_id === $b->id);
    }

    public function test_unverified_users_are_sent_to_verify_their_email(): void
    {
        $this->mailWorks();
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)->get('/dashboard')->assertRedirect('/verify-email');
        $this->actingAs($user)->get('/profile')->assertOk(); // still reachable to fix a typo
    }
}
