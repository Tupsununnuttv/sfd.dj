<?php

namespace Tests\Feature;

use App\Events\WhisperSent;
use App\Models\Announcement;
use App\Models\Setting;
use App\Models\User;
use App\Models\Whisper;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
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

    /** A tenth of a second of silence: a real WAV, small enough to keep in a test. */
    private function wav(): string
    {
        $data = str_repeat("\x80", 800);

        return 'RIFF'.pack('V', 36 + strlen($data)).'WAVEfmt '.pack('VvvVVvv', 16, 1, 1, 8000, 8000, 1, 8).'data'.pack('V', strlen($data)).$data;
    }

    public function test_a_voice_message_is_kept_privately_and_only_its_two_people_can_hear_it(): void
    {
        Storage::fake(config('filesystems.uploads'));
        Event::fake([WhisperSent::class]);
        $a = User::factory()->create();
        $b = User::factory()->create();
        $c = User::factory()->create();
        $voice = fn (User $from, array $extra = []) => $this->actingAs($from)->postJson('/api/whispers/voice', $extra + ['user_id' => $b->id, 'audio' => UploadedFile::fake()->createWithContent('voice.wav', $this->wav()), 'seconds' => 7]);

        $voice($a)->assertCreated()->assertJsonPath('message.voice.seconds', 7)->assertJsonPath('message.body', '')->assertJsonPath('message.mine', true);
        $whisper = Whisper::firstOrFail();
        $this->assertStringEndsWith('.wav', $whisper->audio);
        Storage::disk(config('filesystems.uploads'))->assertExists('whispers/'.$whisper->audio);
        Event::assertDispatched(WhisperSent::class, fn ($event) => $event->broadcastWith()['voice'] === ['seconds' => 7] && $event->broadcastWith()['body'] === '');

        // the two of them hear it (it is not a public file); nobody else, and not somebody who is not logged in
        $url = "/api/whispers/{$whisper->id}/audio";
        $heard = $this->actingAs($b)->get($url)->assertOk()->assertHeader('Content-Type', 'audio/wav')->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->assertSame($this->wav(), $heard->streamedContent());
        $this->actingAs($a)->get($url)->assertOk();
        $this->actingAs($c)->get($url)->assertNotFound();
        $this->app['auth']->forgetGuards();
        $this->getJson($url)->assertUnauthorized();

        // it shows in the thread and the list as a voice message, and counts as unread until the thread is opened
        $this->actingAs($b)->getJson('/api/whispers')->assertJsonPath('0.unread', 1)->assertJsonPath('0.last.voice.seconds', 7);
        $this->actingAs($b)->getJson("/api/whispers/{$a->id}")->assertJsonPath('messages.0.voice.seconds', 7);
        $this->actingAs($b)->getJson('/api/whispers')->assertJsonPath('0.unread', 0);

        // what a recording may be: audio, up to 120 seconds, to somebody else who takes whispers from you
        $voice($a, ['seconds' => 121])->assertJsonValidationErrors('seconds');
        $voice($a, ['seconds' => 0])->assertJsonValidationErrors('seconds');
        $voice($a, ['audio' => UploadedFile::fake()->createWithContent('voice.txt', 'not sound')])->assertJsonValidationErrors('audio');
        $voice($a, ['audio' => UploadedFile::fake()->create('big.wav', 3000, 'audio/wav')])->assertJsonValidationErrors('audio');
        $voice($a, ['user_id' => $a->id])->assertStatus(422);
        $b->forceFill(['preferences' => ['privacy' => ['whispers' => 'nobody']]])->save();
        $voice($a)->assertForbidden();
        $this->assertSame(1, Whisper::count());

        // the recording goes with the whisper, and with the account
        $b->forceFill(['preferences' => null])->save();
        $voice($a)->assertCreated();
        $second = Whisper::latest('id')->firstOrFail();
        $second->delete();
        Storage::disk(config('filesystems.uploads'))->assertMissing('whispers/'.$second->audio);
        $a->delete();
        Storage::disk(config('filesystems.uploads'))->assertMissing('whispers/'.$whisper->audio);
    }

    public function test_whispers_can_be_marked_read_on_screen_and_only_the_other_persons_are_touched(): void
    {
        Event::fake([WhisperSent::class]);
        $a = User::factory()->create();
        $b = User::factory()->create();
        $this->actingAs($a)->postJson('/api/whispers', ['user_id' => $b->id, 'body' => 'to bob'])->assertCreated();
        $this->actingAs($b)->postJson('/api/whispers', ['user_id' => $a->id, 'body' => 'to alice'])->assertCreated();

        $this->actingAs($b)->postJson("/api/whispers/{$a->id}/read")->assertNoContent();

        $this->assertNotNull(Whisper::where('to_id', $b->id)->first()->read_at, 'what alice wrote to bob is read');
        $this->assertNull(Whisper::where('to_id', $a->id)->first()->read_at, "bob's reading does not read alice's");
        $this->actingAs($b)->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('unreadWhispers', 0));
        $this->actingAs($a)->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('unreadWhispers', 1));
    }

    public function test_a_whisper_can_carry_emojis_and_emotes_and_answer_an_earlier_whisper_of_the_same_conversation(): void
    {
        Storage::fake(config('filesystems.uploads'));
        Event::fake([WhisperSent::class]);
        $a = User::factory()->create();
        $b = User::factory()->create();
        $c = User::factory()->create();

        // emojis and emote tokens are only text, kept as written (the word guard and the link guard let the emote codes through)
        $emotes = 'hello 🔥 :7tv:01F6MQ33FG000FSP42K4V0K9M3: and :bttv:54fa925e01e468494b85b54d:';
        $first = $this->actingAs($a)->postJson('/api/whispers', ['user_id' => $b->id, 'body' => $emotes])->assertCreated()->assertJsonPath('message.body', $emotes)->assertJsonPath('message.reply', null)->json('message.id');

        // bob answers it; the quote names who wrote it and what it said, in the answer, on the wire, in the thread and in the list
        $this->actingAs($b)->postJson('/api/whispers', ['user_id' => $a->id, 'body' => 'nice', 'reply_to_id' => $first])->assertCreated()
            ->assertJsonPath('message.reply', ['id' => $first, 'from_id' => $a->id, 'body' => $emotes]);
        $answer = Whisper::latest('id')->firstOrFail();
        $this->assertSame($first, $answer->reply_to_id);
        Event::assertDispatched(WhisperSent::class, fn ($e) => $e->whisper->is($answer) && $e->broadcastWith()['reply'] === ['id' => $first, 'from_id' => $a->id, 'body' => $emotes]);
        $this->actingAs($a)->getJson("/api/whispers/{$b->id}")->assertJsonPath('messages.0.reply', null)->assertJsonPath('messages.1.reply.body', $emotes)->assertJsonPath('messages.1.reply.from_id', $a->id);
        $this->actingAs($a)->getJson('/api/whispers')->assertJsonPath('0.last.reply.id', $first);

        // a voice message can answer one, and is quoted as a voice message when it is answered
        $voice = $this->actingAs($a)->postJson('/api/whispers/voice', ['user_id' => $b->id, 'audio' => UploadedFile::fake()->createWithContent('voice.wav', $this->wav()), 'seconds' => 3, 'reply_to_id' => $answer->id])
            ->assertCreated()->assertJsonPath('message.reply.body', 'nice')->json('message.id');
        $this->actingAs($b)->postJson('/api/whispers', ['user_id' => $a->id, 'body' => 'got it', 'reply_to_id' => $voice])->assertCreated()->assertJsonPath('message.reply.body', '🎤 Voice message');

        // you may answer your own whisper too
        $this->actingAs($a)->postJson('/api/whispers', ['user_id' => $b->id, 'body' => 'also', 'reply_to_id' => $first])->assertCreated()->assertJsonPath('message.reply.from_id', $a->id);

        // an answer can only point into its own conversation: somebody else's whisper, or one that does not exist, is sent as a plain whisper and never quoted
        $secret = Whisper::create(['from_id' => $c->id, 'to_id' => $a->id, 'body' => 'top secret'])->id;
        foreach ([$secret, 99999] as $id) {
            $this->actingAs($a)->postJson('/api/whispers', ['user_id' => $b->id, 'body' => 'sneaky', 'reply_to_id' => $id])->assertCreated()->assertJsonPath('message.reply', null)->assertDontSee('top secret');
            $this->actingAs($a)->postJson('/api/whispers/voice', ['user_id' => $b->id, 'audio' => UploadedFile::fake()->createWithContent('voice.wav', $this->wav()), 'seconds' => 1, 'reply_to_id' => $id])->assertCreated()->assertJsonPath('message.reply', null);
        }
        $this->assertNull(Whisper::where('body', 'sneaky')->first()->reply_to_id);
        $this->actingAs($a)->postJson('/api/whispers', ['user_id' => $b->id, 'body' => 'x', 'reply_to_id' => 'abc'])->assertJsonValidationErrors('reply_to_id');
    }

    public function test_discord_linking(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create(['discord_id' => '777']);

        // not configured: a friendly notice, nothing happens
        config(['services.discord.client_id' => null, 'services.discord.client_secret' => null]);
        $this->actingAs($me)->get('/auth/discord')->assertRedirect(route('settings.connections'))->assertSessionHas('discord_notice');

        config(['services.discord.client_id' => 'cid', 'services.discord.client_secret' => 'secret']);
        $res = $this->actingAs($me)->get('/auth/discord');
        $this->assertStringStartsWith('https://discord.com/oauth2/authorize?', $res->headers->get('Location'));
        $state = session('discord_state');
        $this->assertSame(40, strlen($state));

        // wrong state: refused
        $this->get('/auth/discord/callback?code=abc&state=forged')->assertRedirect(route('settings.connections'));
        $this->assertNull($me->refresh()->discord_id);

        // right state: linked
        Http::fake([
            'discord.com/api/oauth2/token' => Http::response(['access_token' => 'tok']),
            'discord.com/api/oauth2/token/revoke' => Http::response([]),
            'discord.com/api/users/@me' => Http::response(['id' => '123456', 'username' => 'kate', 'global_name' => 'Kate D']),
        ]);
        $this->withSession(['discord_state' => 'goodstate'])->get('/auth/discord/callback?code=abc&state=goodstate')->assertRedirect(route('settings.connections'));
        $me->refresh();
        $this->assertSame(['123456', 'Kate D'], [$me->discord_id, $me->discord_username]);
        $this->actingAs($me)->get('/settings/connections')->assertInertia(fn (Assert $p) => $p->component('Settings/Connections')->where('discord.username', 'Kate D')->where('discord.configured', true));
        $this->assertArrayNotHasKey('discord_id', $me->toArray()); // the id never leaves the server

        // one Discord account cannot be on two SFD-DJ.EU accounts
        Http::fake(['discord.com/api/oauth2/token' => Http::response(['access_token' => 't']), 'discord.com/api/oauth2/token/revoke' => Http::response([]), 'discord.com/api/users/@me' => Http::response(['id' => '777', 'username' => 'x'])]);
        $this->withSession(['discord_state' => 's2'])->get('/auth/discord/callback?code=abc&state=s2');
        $this->assertSame('123456', $me->refresh()->discord_id);

        $this->actingAs($me)->delete('/auth/discord')->assertRedirect();
        $this->assertNull($me->refresh()->discord_username);
        $this->assertSame('777', $other->refresh()->discord_id);
    }

    public function test_discord_oauth_redirect_uses_the_forwarded_https_scheme(): void
    {
        $user = User::factory()->create();
        config(['services.discord.client_id' => 'client-id', 'services.discord.client_secret' => 'client-secret']);

        $response = $this->actingAs($user)
            ->withHeader('X-Forwarded-Proto', 'https')
            ->get('http://sfd-dj.eu/auth/discord');

        parse_str((string) parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);

        $this->assertSame('https://sfd-dj.eu/auth/discord/callback', $query['redirect_uri']);
    }

    public function test_discord_oauth_redirect_uses_http_for_localhost(): void
    {
        $user = User::factory()->create();
        config(['services.discord.client_id' => 'client-id', 'services.discord.client_secret' => 'client-secret']);

        $response = $this->actingAs($user)
            ->get('http://localhost:8000/auth/discord');

        parse_str((string) parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);

        $this->assertSame('http://localhost:8000/auth/discord/callback', $query['redirect_uri']);
    }

    public function test_discord_login_authenticates_an_existing_linked_account(): void
    {
        $user = User::factory()->create(['discord_id' => 'discord-user-id']);
        config(['services.discord.client_id' => 'client-id', 'services.discord.client_secret' => 'client-secret']);
        Http::fake([
            'discord.com/api/oauth2/token' => Http::response(['access_token' => 'access-token']),
            'discord.com/api/oauth2/token/revoke' => Http::response([]),
            'discord.com/api/users/@me' => Http::response(['id' => 'discord-user-id']),
        ]);

        $authorize = $this->get('/auth/discord/login');
        parse_str((string) parse_url($authorize->headers->get('Location'), PHP_URL_QUERY), $query);
        $this->assertSame('identify', $query['scope']);

        $this->withSession(['discord_login_state' => $query['state']])
            ->get('/auth/discord/login/callback?code=code&state='.$query['state'])
            ->assertRedirect(route('dashboard', absolute: false));

        $this->assertAuthenticatedAs($user);
    }

    public function test_discord_login_does_not_create_or_link_an_account(): void
    {
        $user = User::factory()->create();
        config(['services.discord.client_id' => 'client-id', 'services.discord.client_secret' => 'client-secret']);
        Http::fake([
            'discord.com/api/oauth2/token' => Http::response(['access_token' => 'access-token']),
            'discord.com/api/oauth2/token/revoke' => Http::response([]),
            'discord.com/api/users/@me' => Http::response(['id' => 'unlinked-discord-id']),
        ]);

        $this->withSession(['discord_login_state' => 'valid-state'])
            ->get('/auth/discord/login/callback?code=code&state=valid-state')
            ->assertRedirect(route('login'))
            ->assertSessionHas('discord_error');

        $this->assertGuest();
        $this->assertNull($user->refresh()->discord_id);
    }

    public function test_discord_login_still_requires_two_factor_authentication(): void
    {
        $user = User::factory()->create(['discord_id' => 'discord-user-id']);
        $user->forceFill(['two_factor_confirmed_at' => now()])->save();
        config(['services.discord.client_id' => 'client-id', 'services.discord.client_secret' => 'client-secret']);
        Http::fake([
            'discord.com/api/oauth2/token' => Http::response(['access_token' => 'access-token']),
            'discord.com/api/oauth2/token/revoke' => Http::response([]),
            'discord.com/api/users/@me' => Http::response(['id' => 'discord-user-id']),
        ]);

        $this->withSession(['discord_login_state' => 'valid-state'])
            ->get('/auth/discord/login/callback?code=code&state=valid-state')
            ->assertRedirect(route('two-factor.challenge'))
            ->assertSessionHas('two_factor.id', $user->id);

        $this->assertGuest();
    }

    public function test_discord_bot_can_only_read_stats_for_linked_accounts_with_its_token(): void
    {
        $user = User::factory()->create(['discord_id' => '12345678901234567', 'xp' => 1280]);
        config(['services.discord.bot_token' => 'private-bot-token']);

        $this->getJson('/api/discord/members/12345678901234567')
            ->assertUnauthorized();

        $this->withHeader('Authorization', 'Bot wrong-token')->getJson('/api/discord/members/12345678901234567')
            ->assertUnauthorized();

        $this->withHeader('Authorization', 'Bot private-bot-token')->getJson('/api/discord/members/12345678901234567')
            ->assertOk()
            ->assertJsonPath('user.level', 9)
            ->assertJsonPath('achievements.13.key', 'level-5')
            ->assertJsonPath('achievements.13.done', true)
            ->assertJsonMissingPath('user.email');

        $this->withHeader('Authorization', 'Bot private-bot-token')->getJson('/api/discord/members/12345678901234568')
            ->assertNotFound();
    }

    public function test_discord_bot_can_poll_new_site_announcements_with_its_token(): void
    {
        $user = User::factory()->create();
        $announcement = Announcement::create(['user_id' => $user->id, 'message' => 'New listening rooms are live.', 'level' => 'info']);
        config(['services.discord.bot_token' => 'private-bot-token']);

        $this->getJson('/api/discord/announcements')->assertUnauthorized();

        $this->withHeader('Authorization', 'Bot private-bot-token')
            ->getJson('/api/discord/announcements')
            ->assertOk()
            ->assertJsonPath('latest_id', $announcement->id)
            ->assertJsonCount(0, 'announcements');

        $this->withHeader('Authorization', 'Bot private-bot-token')
            ->getJson('/api/discord/announcements?after=0')
            ->assertOk()
            ->assertJsonPath('announcements.0.message', 'New listening rooms are live.');
    }

    public function test_discord_connect_joins_server_and_syncs_site_roles(): void
    {
        $me = User::factory()->create();
        $me->forceFill(['roles' => ['early_supporter']])->save();
        config([
            'services.discord.client_id' => 'client-id',
            'services.discord.client_secret' => 'client-secret',
            'services.discord.bot_token' => 'bot-token',
            'services.discord.guild_id' => 'guild-id',
            'services.discord.member_role_id' => 'member-role-id',
        ]);
        $memberReads = 0;
        Http::fake(function (Request $request) use (&$memberReads) {
            $url = $request->url();

            if (str_ends_with($url, '/oauth2/token')) {
                return Http::response(['access_token' => 'user-token']);
            }
            if (str_ends_with($url, '/users/@me')) {
                return Http::response(['id' => 'discord-user-id', 'username' => 'beta', 'global_name' => 'Beta']);
            }
            if (str_ends_with($url, '/guilds/guild-id/roles')) {
                return Http::response([
                    ['id' => 'beta-role-id', 'name' => 'SFD-DJ.EU | Early Supporter'],
                    ['id' => 'other-role-id', 'name' => 'Community'],
                    ['id' => 'member-role-id', 'name' => 'Member'],
                ]);
            }
            if (str_ends_with($url, '/guilds/guild-id/members/discord-user-id') && $request->method() === 'GET') {
                $memberReads++;

                return $memberReads === 1 ? Http::response([], 404) : Http::response(['roles' => ['beta-role-id', 'other-role-id', 'member-role-id']]);
            }
            if (str_ends_with($url, '/guilds/guild-id/members/discord-user-id') && $request->method() === 'PUT') {
                return Http::response([], 201);
            }
            if (str_ends_with($url, '/guilds/guild-id/members/discord-user-id') && $request->method() === 'PATCH') {
                return Http::response(['roles' => $request['roles']]);
            }
            if (str_ends_with($url, '/oauth2/token/revoke')) {
                return Http::response([], 200);
            }

            return Http::response([], 500);
        });

        $authorizeResponse = $this->actingAs($me)->get('/auth/discord');
        $state = session('discord_state');
        $authorizeUrl = $authorizeResponse->headers->get('Location');
        parse_str((string) parse_url($authorizeUrl, PHP_URL_QUERY), $query);
        $this->assertSame('identify guilds.join', $query['scope']);

        $this->withSession(['discord_state' => $state])->get('/auth/discord/callback?code=abc&state='.$state)
            ->assertRedirect(route('settings.connections'))
            ->assertSessionHas('discord_notice', 'Discord linked and SFD-DJ.EU roles synced.');

        Http::assertSent(fn (Request $request) => $request->method() === 'PUT'
            && str_ends_with($request->url(), '/guilds/guild-id/members/discord-user-id')
            && $request['access_token'] === 'user-token'
            && $request['roles'] === ['beta-role-id', 'member-role-id']);

        $this->actingAs($me)->delete('/auth/discord')->assertRedirect();
        Http::assertSent(fn (Request $request) => $request->method() === 'PATCH'
            && str_ends_with($request->url(), '/guilds/guild-id/members/discord-user-id')
            && $request['roles'] === ['other-role-id', 'member-role-id']);
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
        $this->freezeTime();
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);
        $song = ['youtube_id' => 'aaaaaaaaaaa', 'thumbnail' => null, 'duration' => 200];
        $room->enqueue(['title' => 'A'] + $song, $host->id);
        $room->enqueue(['youtube_id' => 'bbbbbbbbbbb', 'title' => 'B'] + $song, $host->id);
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
