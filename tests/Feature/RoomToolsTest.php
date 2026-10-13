<?php

namespace Tests\Feature;

use App\Events\MessageSent;
use App\Events\PlaybackUpdated;
use App\Events\UserKicked;
use App\Models\PlaylistItem;
use App\Models\Room;
use App\Models\RoomMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RoomToolsTest extends TestCase
{
    use RefreshDatabase;

    private function room(User $host): Room
    {
        Event::fake([MessageSent::class, PlaybackUpdated::class, UserKicked::class]);

        return $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);
    }

    public function test_settings_welcome_and_logs(): void
    {
        $host = User::factory()->create();
        $guest = User::factory()->create();
        $room = $this->room($host);

        $this->actingAs($host)->patch("/rooms/{$room->slug}", ['name' => 'Lobby', 'welcome_message' => 'Hi all!'])->assertRedirect();
        $room->refresh();
        $this->assertSame('Hi all!', $room->welcome_message);

        $this->actingAs($guest)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $p) => $p
            ->where('room.welcome_message', 'Hi all!')->where('room.rule_list', null)->where('mod', null));
        $this->actingAs($host)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $p) => $p->has('mod.logs', 1)->where('mod.logs.0.action', 'settings'));
    }

    public function test_mute_blocks_chat_and_is_listed_and_unmuted(): void
    {
        $host = User::factory()->create();
        $guest = User::factory()->create();
        $room = $this->room($host);

        $this->actingAs($guest)->post("/rooms/{$room->slug}/mute/{$host->id}", ['for' => '1h'])->assertForbidden();
        $this->actingAs($host)->post("/rooms/{$room->slug}/mute/{$guest->id}", ['for' => 'nonsense'])->assertSessionHasErrors('for');
        $this->actingAs($host)->post("/rooms/{$room->slug}/mute/{$guest->id}", ['for' => '1h'])->assertNoContent();

        $this->actingAs($guest)->postJson("/rooms/{$room->slug}/messages", ['body' => 'hello'])->assertJsonValidationErrors('body');
        $this->actingAs($host)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $p) => $p->has('mod.muted', 1)->where('mod.muted.0.id', $guest->id));

        $this->actingAs($host)->delete("/rooms/{$room->slug}/mute/{$guest->id}")->assertNoContent();
        $this->actingAs($guest)->postJson("/rooms/{$room->slug}/messages", ['body' => 'hello'])->assertNoContent();
        $this->assertSame(['unmute', 'mute'], $room->logs()->latest('id')->pluck('action')->all());

        // an expired mute no longer counts
        $room->mutes()->create(['user_id' => $guest->id, 'until' => now()->subMinute()]);
        $this->assertFalse($room->isMuted($guest));
    }

    public function test_kicks_and_bans_are_logged(): void
    {
        $host = User::factory()->create();
        $guest = User::factory()->create();
        $room = $this->room($host);

        $this->actingAs($host)->post("/rooms/{$room->slug}/kick/{$guest->id}")->assertNoContent();
        $this->actingAs($host)->post("/rooms/{$room->slug}/ban/{$guest->id}")->assertNoContent();

        $this->actingAs($host)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $p) => $p
            ->has('mod.kicked', 1)->where('mod.kicked.0.target', $guest->name)->has('mod.logs', 2));
    }

    public function test_automod_filters(): void
    {
        $host = User::factory()->create();
        $guest = User::factory()->create();
        $room = $this->room($host);
        $say = fn (string $body) => $this->actingAs($guest)->postJson("/rooms/{$room->slug}/messages", ['body' => $body]);

        $this->actingAs($guest)->put("/rooms/{$room->slug}/automod", ['enabled' => true, 'links' => true, 'caps' => true, 'repeat' => true])->assertForbidden();
        $this->actingAs($host)->put("/rooms/{$room->slug}/automod", [
            'enabled' => true, 'links' => true, 'caps' => true, 'repeat' => true, 'words_text' => 'Badword, other thing',
        ])->assertNoContent();
        $this->assertSame(['badword', 'other thing'], $room->refresh()->automod['words']);

        $say('visit https://spam.example now')->assertJsonValidationErrors('body'); // other sites never go out (LinkGuard)
        $say('our partner https://club.dj/x')->assertJsonValidationErrors('body'); // the room's own link filter blocks even the partners
        $say('THIS IS ALL SHOUTING TEXT')->assertJsonValidationErrors('body');
        $say('you are a BADWORD!')->assertJsonValidationErrors('body');
        $say('badwording is fine')->assertNoContent();   // whole words only
        $say('same again')->assertNoContent();
        $say('same again')->assertJsonValidationErrors('body');
        $this->assertSame(4, $room->logs()->where('action', 'automod')->count() - 1);

        // moderators are exempt, and the filter can be switched off
        $this->actingAs($host)->postJson("/rooms/{$room->slug}/messages", ['body' => 'https://club.dj/ok'])->assertNoContent();
        $this->actingAs($host)->put("/rooms/{$room->slug}/automod", ['enabled' => false, 'links' => true, 'caps' => true, 'repeat' => true])->assertNoContent();
        $say('https://club.dj/ok')->assertNoContent();
    }

    public function test_locked_waitlist_and_cycle(): void
    {
        $host = User::factory()->create();
        $guest = User::factory()->create();
        $room = $this->room($host);
        $song = ['youtube_id' => 'aaaaaaaaaaa', 'title' => 'A', 'thumbnail' => null, 'duration' => 100];
        Http::fake();

        $this->actingAs($guest)->patchJson("/rooms/{$room->slug}/waitlist-settings", ['locked' => true])->assertForbidden();
        $this->actingAs($host)->patchJson("/rooms/{$room->slug}/waitlist-settings", ['locked' => true, 'cycle' => true])->assertNoContent();
        $this->assertTrue($room->refresh()->playback()['locked']);

        $this->actingAs($guest)->postJson("/rooms/{$room->slug}/queue", ['url' => 'https://youtu.be/dQw4w9WgXcQ'])->assertJsonValidationErrors('url');

        // cycling: the song that was played comes back at the end of the line
        $room->enqueue($song, $host->id);
        $room->enqueue(['youtube_id' => 'bbbbbbbbbbb', 'title' => 'B'] + $song, $host->id);
        $room->refresh()->advance();
        $this->assertSame(['B', 'A'], $room->items()->pluck('title')->all());
        $this->assertSame(1, PlaylistItem::where('room_id', $room->id)->whereNotNull('played_at')->count());

        $this->actingAs($host)->patchJson("/rooms/{$room->slug}/waitlist-settings", ['locked' => false, 'cycle' => false])->assertNoContent();
        $room->refresh()->advance();
        $this->assertSame(['A'], $room->items()->pluck('title')->all()); // no re-queue once cycling is off
    }

    public function test_role_search_and_assign_from_settings(): void
    {
        $host = User::factory()->create();
        $other = User::factory()->create(['name' => 'Zebra Fan']);
        $room = $this->room($host);
        $role = $room->roles()->where('name', 'Bouncer')->first();

        $this->actingAs($other)->getJson("/rooms/{$room->slug}/find-users?q=Zeb")->assertForbidden();
        $this->actingAs($host)->getJson("/rooms/{$room->slug}/find-users?q=Zeb")->assertOk()->assertJsonCount(1)->assertJsonPath('0.name', 'Zebra Fan');
        $this->actingAs($host)->getJson("/rooms/{$room->slug}/find-users?q=Z")->assertOk()->assertJsonCount(0);

        $this->actingAs($host)->putJson("/rooms/{$room->slug}/members/{$other->id}", ['room_role_id' => $role->id])->assertNoContent();
        $this->assertTrue(RoomMember::where('user_id', $other->id)->exists());
        $this->actingAs($host)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $p) => $p->has('memberList', 1)->where('memberList.0.name', 'Zebra Fan'));
    }

    public function test_emote_lists_are_proxied_and_cached(): void
    {
        Cache::flush();
        Http::fake([
            'api.betterttv.net/*' => Http::response([['id' => '54fa8fce01e468494b85b53c', 'code' => 'CiGrip']]),
            '7tv.io/v3/emote-sets/global' => Http::response(['emotes' => [['id' => '01FGH8NE3800064MEQW00DNBNG', 'name' => 'reckH']]]),
            '7tv.io/v3/gql' => Http::response(['data' => ['emotes' => ['items' => [['id' => '01EZTCN91800012PTN006Q50PR', 'name' => 'Pog', 'extra' => 1]]]]]),
        ]);
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/emotes')->assertOk()
            ->assertJsonPath('bttv.0.name', 'CiGrip')->assertJsonPath('7tv.0.name', 'reckH');
        $this->actingAs($user)->getJson('/emotes/search?q=pog')->assertOk()->assertExactJson([['id' => '01EZTCN91800012PTN006Q50PR', 'name' => 'Pog']]);
        $this->actingAs($user)->getJson('/emotes/search?q=p')->assertStatus(422);
    }
}
