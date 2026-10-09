<?php

namespace Tests\Feature;

use App\Events\WhisperSent;
use App\Models\Room;
use App\Models\Setting;
use App\Models\User;
use App\Models\Whisper;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WhispersDiscordCommunityTest extends TestCase
{
    use RefreshDatabase;

    private function staff(): User
    {
        $user = User::factory()->create();
        $user->forceFill(['roles' => ['admin']])->save();

        return $user;
    }

    public function test_whispers_are_private_between_two_people_and_track_unread(): void
    {
        Event::fake([WhisperSent::class]);
        $a = User::factory()->create(['username' => 'alice_a']);
        $b = User::factory()->create(['username' => 'bob_b']);
        $c = User::factory()->create();

        $this->actingAs($a)->postJson('/api/whispers', ['user_id' => $b->id, 'body' => 'hi bob'])->assertCreated()->assertJsonPath('message.mine', true);
        $this->actingAs($a)->postJson('/api/whispers', ['username' => 'BOB_B', 'body' => 'you there?'])->assertCreated();
        $this->actingAs($a)->postJson('/api/whispers', ['user_id' => $a->id, 'body' => 'me'])->assertStatus(422);
        $this->actingAs($a)->postJson('/api/whispers', ['username' => 'nobody_here', 'body' => 'x'])->assertStatus(422);
        $this->actingAs($a)->postJson('/api/whispers', ['user_id' => $b->id, 'body' => str_repeat('a', 501)])->assertJsonValidationErrors('body');
        Event::assertDispatched(WhisperSent::class, fn ($e) => collect($e->broadcastOn())->map->name->sort()->values()->all() === collect(["private-App.Models.User.{$a->id}", "private-App.Models.User.{$b->id}"])->sort()->values()->all());

        // bob sees 2 unread, then reads the thread
        $this->actingAs($b)->get('/dashboard')->assertInertia(fn (Assert $p) => $p->where('unreadWhispers', 2));
        $this->actingAs($b)->getJson('/api/whispers')->assertJsonPath('0.unread', 2)->assertJsonPath('0.user.username', 'alice_a');
        $this->actingAs($b)->getJson("/api/whispers/{$a->id}")->assertJsonCount(2, 'messages')->assertJsonPath('messages.0.mine', false);
        $this->actingAs($b)->get('/dashboard')->assertInertia(fn (Assert $p) => $p->where('unreadWhispers', 0));

        // a third person sees nothing of it
        $this->actingAs($c)->getJson("/api/whispers/{$a->id}")->assertJsonCount(0, 'messages');
        $this->actingAs($c)->getJson('/api/whispers')->assertJsonCount(0);
        $this->assertSame(2, Whisper::count());

        $this->app['auth']->forgetGuards();
        $this->getJson('/api/whispers')->assertUnauthorized();
        $this->get('/whispers')->assertRedirect('/login');
    }

    public function test_discord_linking(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create(['discord_id' => '777']);

        // not configured: a friendly notice, nothing happens
        config(['services.discord.client_id' => null, 'services.discord.client_secret' => null]);
        $this->actingAs($me)->get('/auth/discord')->assertRedirect(route('settings.account'))->assertSessionHas('discord_notice');

        config(['services.discord.client_id' => 'cid', 'services.discord.client_secret' => 'secret']);
        $res = $this->actingAs($me)->get('/auth/discord');
        $this->assertStringStartsWith('https://discord.com/oauth2/authorize?', $res->headers->get('Location'));
        $state = session('discord_state');
        $this->assertSame(40, strlen($state));

        // wrong state: refused
        $this->get('/auth/discord/callback?code=abc&state=forged')->assertRedirect(route('settings.account'));
        $this->assertNull($me->refresh()->discord_id);

        // right state: linked
        Http::fake([
            'discord.com/api/oauth2/token' => Http::response(['access_token' => 'tok']),
            'discord.com/api/users/@me' => Http::response(['id' => '123456', 'username' => 'kate', 'global_name' => 'Kate D']),
        ]);
        $this->withSession(['discord_state' => 'goodstate'])->get('/auth/discord/callback?code=abc&state=goodstate')->assertRedirect(route('settings.account'));
        $me->refresh();
        $this->assertSame(['123456', 'Kate D'], [$me->discord_id, $me->discord_username]);
        $this->actingAs($me)->get('/settings/account')->assertInertia(fn (Assert $p) => $p->where('discord.username', 'Kate D')->where('discord.configured', true));
        $this->assertArrayNotHasKey('discord_id', $me->toArray()); // the id never leaves the server

        // one Discord account cannot be on two SFD.DJ accounts
        Http::fake(['discord.com/api/oauth2/token' => Http::response(['access_token' => 't']), 'discord.com/api/users/@me' => Http::response(['id' => '777', 'username' => 'x'])]);
        $this->withSession(['discord_state' => 's2'])->get('/auth/discord/callback?code=abc&state=s2');
        $this->assertSame('123456', $me->refresh()->discord_id);

        $this->actingAs($me)->delete('/auth/discord')->assertRedirect();
        $this->assertNull($me->refresh()->discord_username);
        $this->assertSame('777', $other->refresh()->discord_id);
    }

    public function test_social_links_and_donation_goal(): void
    {
        $staff = $this->staff();
        $member = User::factory()->create();
        $payload = [
            'social' => ['discord' => 'https://discord.gg/abc', 'instagram' => 'https://instagram.com/sfddj', 'youtube' => '', 'x' => '', 'tiktok' => '', 'twitch' => '', 'facebook' => ''],
            'donation' => ['enabled' => true, 'title' => 'Servers', 'goal' => 500, 'current' => 125, 'currency' => '€', 'url' => 'https://ko-fi.com/sfddj'],
        ];

        $this->actingAs($member)->put('/community', $payload)->assertForbidden();
        $this->actingAs($staff)->put('/community', ['social' => ['discord' => 'javascript:alert(1)']] + $payload)->assertSessionHasErrors('social.discord');
        $bad = $payload;
        $bad['donation']['url'] = 'http://not-secure.example';
        $this->actingAs($staff)->put('/community', $bad)->assertSessionHasErrors('donation.url');
        $this->actingAs($staff)->put('/community', $payload)->assertSessionHasNoErrors();

        $community = Setting::community();
        $this->assertSame(['discord' => 'https://discord.gg/abc', 'instagram' => 'https://instagram.com/sfddj'], $community['social']);
        $this->assertSame(25, $community['donation']['percent']);

        // everyone gets it with every page (guests too)
        $this->app['auth']->forgetGuards();
        $this->get('/dashboard')->assertInertia(fn (Assert $p) => $p->where('community.donation.title', 'Servers')->where('community.social.discord', 'https://discord.gg/abc'));

        $off = $payload;
        $off['donation']['enabled'] = false;
        $this->actingAs($staff)->put('/community', $off);
        $this->assertNull(Setting::community()['donation']);
    }

    public function test_songs_that_ran_past_their_length_are_finished_when_the_room_opens(): void
    {
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);
        $song = ['youtube_id' => 'aaaaaaaaaaa', 'thumbnail' => null, 'duration' => 200];
        $room->enqueue(['title' => 'A'] + $song, $host->id);
        $room->enqueue(['title' => 'B'] + $song, $host->id);
        $room->refresh();

        // fresh song: stays
        $room->syncCurrent();
        $this->assertSame('A', $room->playback()['current']['title']);

        // started 10 minutes ago: A is over, B just started
        $room->forceFill(['current_started_at' => now()->subMinutes(10)])->save();
        $room->refresh()->syncCurrent();
        $this->assertSame('B', $room->refresh()->playback()['current']['title']);
        $this->assertSame(0, (int) $room->playback()['elapsed']);

        // opening the page does it too
        $room->forceFill(['current_started_at' => now()->subMinutes(10)])->save();
        $this->actingAs($host)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $p) => $p->where('playback.current', null));
    }
    public function test_pages_with_played_songs_render(): void
    {
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);
        $room->enqueue(['youtube_id' => 'aaaaaaaaaaa', 'title' => 'A', 'thumbnail' => null, 'duration' => 200], $host->id);
        $room->refresh()->advance(); // A has now been played
        $host->refresh();

        $this->actingAs($host)->get('/dashboard')->assertOk()->assertInertia(fn (Assert $p) => $p->has('activity'));
        $this->actingAs($host)->get('/my-stuff')->assertOk()->assertInertia(fn (Assert $p) => $p->has('recent', 1));
        $this->actingAs($host)->get('/history')->assertOk();
        $this->actingAs($host)->get('/community')->assertOk();
    }
}