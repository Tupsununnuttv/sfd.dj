<?php

namespace Tests\Feature;

use App\Events\RoomUpdated;
use App\Models\PlaylistItem;
use App\Models\Room;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

/** A room's web address follows its name; every address it ever had keeps working. */
class RoomRenameTest extends TestCase
{
    use RefreshDatabase;

    private function room(User $host, string $name): Room
    {
        $this->actingAs($host)->post('/rooms', ['name' => $name])->assertRedirect();

        return Room::where('user_id', $host->id)->where('name', $name)->firstOrFail();
    }

    private function rename(User $who, string $slug, string $name)
    {
        return $this->actingAs($who)->patch("/rooms/{$slug}", ['name' => $name]);
    }

    public function test_renaming_a_room_moves_its_address_and_the_old_one_keeps_working(): void
    {
        Event::fake([RoomUpdated::class]);
        $host = User::factory()->create();
        $room = $this->room($host, 'Late Night');
        $this->assertSame('late-night', $room->slug);

        // the host lands on the new address, and the room is told
        $this->rename($host, 'late-night', 'Early Morning Jazz')->assertRedirect('/rooms/early-morning-jazz');
        Event::assertDispatched(RoomUpdated::class, fn (RoomUpdated $e) => $e->roomId === $room->id);
        $room->refresh();
        $this->assertSame(['Early Morning Jazz', 'early-morning-jazz'], [$room->name, $room->slug]);
        $this->assertSame(['late-night'], $room->oldSlugs()->pluck('slug')->all());

        // a link to the old address goes on to the new one (not for good: a 302), and the page there works
        $this->actingAs($host)->get('/rooms/late-night')->assertStatus(302)->assertRedirect('/rooms/early-morning-jazz');
        $this->actingAs($host)->get('/rooms/early-morning-jazz')->assertOk();

        // a page that was open when the room was renamed still chats, and a bot still reads the room by the old address
        $this->actingAs($host)->postJson('/rooms/late-night/messages', ['body' => 'still here'])->assertNoContent();
        $this->assertSame(1, $room->messages()->count());
        $token = $host->createToken('test')->plainTextToken;
        $this->withToken($token)->getJson('/api/v1/rooms/late-night')->assertOk()->assertJsonPath('slug', 'early-morning-jazz');
    }

    public function test_every_old_address_stays_and_a_room_may_take_one_back(): void
    {
        $host = User::factory()->create();
        $room = $this->room($host, 'Alpha');

        $this->rename($host, 'alpha', 'Bravo');
        $this->rename($host, 'bravo', 'Charlie');
        $this->assertSame(['alpha', 'bravo'], $room->oldSlugs()->orderBy('id')->pluck('slug')->all());
        $this->actingAs($host)->get('/rooms/alpha')->assertRedirect('/rooms/charlie');
        $this->actingAs($host)->get('/rooms/bravo')->assertRedirect('/rooms/charlie');

        $this->rename($host, 'charlie', 'Alpha')->assertRedirect('/rooms/alpha');
        $this->assertSame('alpha', $room->refresh()->slug);
        $this->assertSame(['bravo', 'charlie'], $room->oldSlugs()->orderBy('slug')->pluck('slug')->all(), 'it is not its own old address any more');
        $this->actingAs($host)->get('/rooms/charlie')->assertRedirect('/rooms/alpha');
        $this->actingAs($host)->get('/rooms/alpha')->assertOk();
    }

    public function test_no_other_room_takes_a_current_or_an_old_address(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $jazz = $this->room($a, 'Jazz');
        $blues = $this->room($b, 'Blues');

        // somebody else's current address: the name gets a number
        $this->rename($b, 'blues', 'Jazz')->assertRedirect('/rooms/jazz-2');

        // an address the first room left: still taken, and the link to it still goes to that room
        $this->rename($a, 'jazz', 'Soul')->assertRedirect('/rooms/soul');
        $this->assertSame('jazz-3', $this->room(User::factory()->create(), 'Jazz')->slug);
        $this->actingAs($a)->get('/rooms/jazz')->assertRedirect('/rooms/soul');
        $this->assertSame(['soul', 'jazz-2'], [$jazz->refresh()->slug, $blues->refresh()->slug]);
    }

    public function test_a_name_that_makes_the_same_address_keeps_it_and_stays_on_the_page(): void
    {
        $host = User::factory()->create();
        $room = $this->room($host, 'Chillzone');

        $this->from('/rooms/chillzone')->actingAs($host)->patch('/rooms/chillzone', ['name' => 'CHILLZONE!'])->assertRedirect('/rooms/chillzone');
        $room->refresh();
        $this->assertSame(['CHILLZONE!', 'chillzone'], [$room->name, $room->slug]);
        $this->assertSame(0, $room->oldSlugs()->count());

        // changing only the description does not touch the address either
        $this->actingAs($host)->patch('/rooms/chillzone', ['name' => 'CHILLZONE!', 'description' => 'Slow tunes'])->assertRedirect();
        $this->assertSame('chillzone', $room->refresh()->slug);
    }

    public function test_only_those_who_may_edit_the_settings_rename_it_and_a_name_with_no_letters_still_gets_an_address(): void
    {
        $host = User::factory()->create();
        $room = $this->room($host, 'Quiet');

        $this->rename(User::factory()->create(), 'quiet', 'Hijacked')->assertForbidden();
        $this->assertSame(['Quiet', 'quiet'], [$room->refresh()->name, $room->slug]);

        $this->rename($host, 'quiet', '!!!')->assertRedirect('/rooms/room');
        $this->assertSame('room', $room->refresh()->slug);
    }

    public function test_the_donation_form_and_the_history_filter_know_a_rooms_old_address(): void
    {
        $host = User::factory()->create();
        $room = $this->room($host, 'Lobby');
        PlaylistItem::create(['room_id' => $room->id, 'user_id' => $host->id, 'youtube_id' => 'aaaaaaaaaaa', 'title' => 'A', 'played_at' => now()]);
        $this->rename($host, 'lobby', 'Main Hall');

        $this->actingAs($host)->get('/history?room=lobby')->assertInertia(fn ($p) => $p->has('songs', 1)->where('songs.0.title', 'A'));
        Setting::put('donation.url', 'https://ko-fi.com/test');
        $this->actingAs($host)->postJson('/donations', ['amount' => 5, 'room' => 'lobby'])->assertOk()->assertJson(['stripe' => false]); // the room is found: the donation page set by staff opens
        $this->actingAs($host)->postJson('/donations', ['amount' => 5, 'room' => 'nonsense'])->assertStatus(422);
    }
}
