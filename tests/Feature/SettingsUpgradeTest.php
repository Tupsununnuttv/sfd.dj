<?php

namespace Tests\Feature;

use App\Models\Friendship;
use App\Models\PlaylistItem;
use App\Models\Room;
use App\Models\SiteEvent;
use App\Models\User;
use App\Models\Vote;
use App\Models\Whisper;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SettingsUpgradeTest extends TestCase
{
    use RefreshDatabase;

    public function test_language_and_time_preferences_are_saved_validated_and_shared(): void
    {
        $user = User::factory()->create(['preferences' => ['audio' => ['default_volume' => 35]]]);
        $this->actingAs($user)->get('/settings/language-time')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Settings/LanguageTime'));
        foreach (['en', 'et', 'ru'] as $language) {
            $this->patchJson('/settings/preferences', ['regional' => ['language' => $language, 'time_format' => '12']])
                ->assertOk()->assertJsonPath('preferences.regional.language', $language)
                ->assertJsonPath('preferences.regional.time_format', '12')
                ->assertJsonPath('preferences.audio.default_volume', 35);
        }
        $this->patchJson('/settings/preferences', ['regional' => ['time_format' => '24']])
            ->assertOk()->assertJsonPath('preferences.regional.language', 'ru');
        $user->refresh();
        $this->get('/settings/language-time')->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.preferences.regional.language', 'ru')
            ->where('auth.user.preferences.regional.time_format', '24'));
        $this->patchJson('/settings/preferences', ['regional' => ['language' => 'invalid', 'time_format' => 'invalid']])
            ->assertUnprocessable()->assertJsonValidationErrors(['regional.language', 'regional.time_format']);
        $this->assertSame('24', $user->fresh()->pref('regional.time_format'));
    }

    public function test_compact_preferences_can_save_as_json_without_reloading_a_page(): void
    {
        $user = User::factory()->create(['preferences' => ['room' => ['autowoot' => true]]]);
        $this->actingAs($user)->patchJson('/settings/preferences', ['appearance' => ['compact_chat' => true]])
            ->assertOk()->assertJsonPath('preferences.appearance.compact_chat', true)->assertJsonPath('preferences.room.autowoot', true);
        $this->patchJson('/settings/preferences', ['room' => ['compact_layout' => true]])
            ->assertOk()->assertJsonPath('preferences.appearance.compact_chat', true)->assertJsonPath('preferences.room.compact_layout', true);
        $this->patchJson('/settings/preferences', ['appearance' => ['compact' => true]])
            ->assertOk()->assertJsonPath('preferences.appearance.compact', true)->assertJsonPath('preferences.room.compact_layout', true);
        $this->patchJson('/settings/preferences', ['appearance' => ['compact' => 'invalid']])->assertUnprocessable();
        $this->assertTrue($user->fresh()->pref('appearance.compact'));
    }

    public function test_compact_chat_is_saved_independently_of_text_size_and_room_layout(): void
    {
        $user = User::factory()->create(['preferences' => ['appearance' => ['chat_size' => 'large', 'show_badges' => true], 'room' => ['compact_layout' => false]]]);
        $this->actingAs($user)->patch('/settings/preferences', ['appearance' => ['compact_chat' => true]])->assertSessionHasNoErrors();
        $this->assertTrue($user->refresh()->pref('appearance.compact_chat'));
        $this->assertSame('large', $user->pref('appearance.chat_size'));
        $this->assertTrue($user->pref('appearance.show_badges'));
        $this->assertFalse($user->pref('room.compact_layout'));
        $this->get('/settings/appearance')->assertOk()->assertInertia(fn (Assert $page) => $page->where('auth.user.preferences.appearance.compact_chat', true));
        $this->patch('/settings/preferences', ['appearance' => ['compact_chat' => false]])->assertSessionHasNoErrors();
        $this->assertFalse($user->refresh()->pref('appearance.compact_chat'));
    }

    public function test_compact_room_layout_is_a_persistent_independent_personal_setting(): void
    {
        $user = User::factory()->create(['preferences' => ['room' => ['autowoot' => true], 'appearance' => ['compact' => false]]]);
        $this->actingAs($user)->patch('/settings/preferences', ['room' => ['compact_layout' => true]])->assertSessionHasNoErrors();
        $this->assertTrue($user->refresh()->pref('room.compact_layout'));
        $this->assertTrue($user->pref('room.autowoot'));
        $this->assertFalse($user->pref('appearance.compact'));
        $this->get('/settings/appearance')->assertOk()->assertInertia(fn (Assert $page) => $page->where('auth.user.preferences.room.compact_layout', true));
        $this->patch('/settings/preferences', ['room' => ['compact_layout' => false]])->assertSessionHasNoErrors();
        $this->assertFalse($user->refresh()->pref('room.compact_layout'));
    }

    private function user(array $attrs = []): User
    {
        return User::factory()->create($attrs)->refresh();
    }

    public function test_bio_and_favourite_genre_are_saved_validated_and_shown(): void
    {
        $me = $this->user(['username' => 'dj_kate']);
        $genre = Room::GENRES[0];

        $this->actingAs($me)->patch('/profile', ['username' => 'dj_kate', 'name' => 'Kate', 'email' => $me->email, 'bio' => 'Deep house at night', 'favorite_genre' => $genre])->assertSessionHasNoErrors();
        $me->refresh();
        $this->assertSame('Deep house at night', $me->bio);
        $this->assertSame($genre, $me->favorite_genre);

        $this->actingAs($me)->patch('/profile', ['username' => 'dj_kate', 'name' => 'Kate', 'email' => $me->email, 'bio' => str_repeat('x', 501)])->assertSessionHasErrors('bio');
        $this->actingAs($me)->patch('/profile', ['username' => 'dj_kate', 'name' => 'Kate', 'email' => $me->email, 'bio' => str_repeat('x', 500)])->assertSessionHasNoErrors(); // 500 is fine
        $this->actingAs($me)->patch('/profile', ['username' => 'dj_kate', 'name' => 'Kate', 'email' => $me->email, 'bio' => 'Deep house at night'])->assertSessionHasNoErrors();
        $this->actingAs($me)->patch('/profile', ['username' => 'dj_kate', 'name' => 'Kate', 'email' => $me->email, 'favorite_genre' => 'Not a genre'])->assertSessionHasErrors('favorite_genre');

        // everybody sees it on the public profile and in the quick card, nobody sees the email
        $this->app['auth']->forgetGuards();
        $this->getJson("/api/users/{$me->id}")->assertJsonPath('bio', 'Deep house at night')->assertJsonPath('favorite_genre', $genre)->assertJsonMissingPath('email');
        $this->get('/settings/privacy')->assertRedirect('/login');
    }

    public function test_username_check_answers_taken_free_and_invalid(): void
    {
        $me = $this->user(['username' => 'dj_kate']);

        $this->getJson('/api/username-available?username=DJ_KATE')->assertJson(['available' => false]);
        $this->getJson('/api/username-available?username=fresh_name')->assertJson(['available' => true]);
        $this->getJson('/api/username-available?username=no')->assertJson(['available' => false]);
        $this->getJson('/api/username-available?username=bad name!')->assertJson(['available' => false]);
        $this->actingAs($me)->getJson('/api/username-available?username=dj_kate')->assertJson(['available' => true]); // your own is fine
    }

    public function test_people_choose_who_can_whisper_them_and_send_friend_requests(): void
    {
        $quiet = $this->user();
        $stranger = $this->user();
        $friend = $this->user();
        $staff = $this->user();
        $staff->forceFill(['roles' => ['admin']])->save();
        Friendship::create(['user_id' => $quiet->id, 'friend_id' => $friend->id, 'status' => 'accepted']);

        $quiet->forceFill(['preferences' => ['privacy' => ['whispers' => 'friends', 'friend_requests' => false]]])->save();

        $this->actingAs($stranger)->postJson('/api/whispers', ['user_id' => $quiet->id, 'body' => 'hi'])->assertForbidden()->assertJsonPath('message', "{$quiet->name} does not take whispers from you.");
        $this->actingAs($friend)->postJson('/api/whispers', ['user_id' => $quiet->id, 'body' => 'hi'])->assertCreated();
        $this->actingAs($staff)->postJson('/api/whispers', ['user_id' => $quiet->id, 'body' => 'from staff'])->assertCreated();

        $quiet->forceFill(['preferences' => ['privacy' => ['whispers' => 'nobody', 'friend_requests' => false]]])->save();
        $this->actingAs($friend)->postJson('/api/whispers', ['user_id' => $quiet->id, 'body' => 'again'])->assertForbidden();
        $this->assertSame(2, Whisper::count());

        // friend requests: blocked for strangers, but answering a request they sent works
        $this->actingAs($stranger)->post('/friends', ['user_id' => $quiet->id])->assertSessionHasErrors('name');
        Friendship::create(['user_id' => $quiet->id, 'friend_id' => $stranger->id, 'status' => 'pending']);
        $this->actingAs($stranger)->post('/friends', ['user_id' => $quiet->id])->assertSessionHasNoErrors();
        $this->assertSame('accepted', Friendship::where('user_id', $quiet->id)->where('friend_id', $stranger->id)->first()->status);
    }

    public function test_hiding_the_online_status_makes_you_look_offline(): void
    {
        $me = $this->user();
        $shy = $this->user();
        $shy->forceFill(['last_seen_at' => now(), 'preferences' => ['privacy' => ['show_online' => false]]])->save();
        Friendship::create(['user_id' => $me->id, 'friend_id' => $shy->id, 'status' => 'accepted']);

        $this->actingAs($me)->get('/friends')->assertInertia(fn (Assert $p) => $p->where('friends.0.online', false)->where('friends.0.last_seen_at', null));

        $shy->forceFill(['preferences' => ['privacy' => ['show_online' => true]]])->save();
        $this->actingAs($me)->get('/friends')->assertInertia(fn (Assert $p) => $p->where('friends.0.online', true));
    }

    public function test_new_preferences_are_validated(): void
    {
        $me = $this->user();

        $this->actingAs($me)->patch('/settings/preferences', ['privacy' => ['whispers' => 'friends', 'show_online' => false], 'notifications' => ['desktop' => true, 'mentions' => false], 'appearance' => ['show_badges' => false], 'audio' => ['mute_on_join' => true]])->assertSessionHasNoErrors();
        $this->assertSame('friends', $me->refresh()->pref('privacy.whispers'));
        $this->assertTrue($me->pref('audio.mute_on_join'));

        $this->actingAs($me)->patch('/settings/preferences', ['privacy' => ['whispers' => 'strangers']])->assertSessionHasErrors('privacy.whispers');
    }

    public function test_other_devices_can_be_logged_out_with_the_password(): void
    {
        $me = $this->user();
        foreach (['other-one', 'other-two'] as $id) {
            DB::table('sessions')->insert(['id' => $id, 'user_id' => $me->id, 'ip_address' => '10.0.0.1', 'user_agent' => 'Mozilla/5.0 (Windows NT 10.0) Chrome/120', 'payload' => '', 'last_activity' => time()]);
        }
        DB::table('sessions')->insert(['id' => 'somebody-else', 'user_id' => $this->user()->id, 'payload' => '', 'last_activity' => time()]);

        $this->actingAs($me)->delete('/settings/sessions', ['password' => 'wrong'])->assertSessionHasErrors('password');
        $this->assertSame(2, DB::table('sessions')->where('user_id', $me->id)->count());

        $this->actingAs($me)->delete('/settings/sessions/other-one')->assertRedirect();
        $this->assertSame(1, DB::table('sessions')->where('user_id', $me->id)->count());

        $this->actingAs($me)->delete('/settings/sessions', ['password' => 'password'])->assertSessionHasNoErrors();
        $this->assertSame(0, DB::table('sessions')->where('user_id', $me->id)->count());
        $this->assertSame(1, DB::table('sessions')->where('id', 'somebody-else')->count()); // never somebody else's
    }

    public function test_the_data_export_has_your_things_and_no_secrets(): void
    {
        $me = $this->user(['username' => 'dj_kate', 'bio' => 'hello']);
        $other = $this->user(['username' => 'bob_b']);
        Whisper::create(['from_id' => $me->id, 'to_id' => $other->id, 'body' => 'a private line']);
        $me->rooms()->create(['name' => 'Home', 'slug' => 'home-1']);
        $me->createToken('laptop');

        $res = $this->actingAs($me)->get('/settings/export')->assertOk();
        $this->assertStringContainsString('attachment; filename="sfddj-my-data-', $res->headers->get('Content-Disposition'));
        $json = $res->json();

        $this->assertSame($me->email, $json['account']['email']);
        $this->assertSame('hello', $json['account']['bio']);
        $this->assertSame('a private line', $json['whispers'][0]['body']);
        $this->assertSame('bob_b', $json['whispers'][0]['to']);
        $this->assertSame('Home', $json['rooms_created'][0]['name']);

        $raw = $res->getContent();
        $this->assertStringNotContainsString($me->password, $raw);
        $this->assertStringNotContainsString('laptop', $raw); // API tokens are not in it
        $this->assertStringNotContainsString('two_factor', $raw);
    }

    public function test_registering_needs_the_terms_and_shows_who_invited_you(): void
    {
        $inviter = $this->user(['name' => 'Alex']);
        $data = ['username' => 'newbie', 'email' => 'new@example.com', 'password' => 'password-123', 'password_confirmation' => 'password-123'];

        $this->get('/register?ref='.$inviter->referral_code)->assertInertia(fn (Assert $p) => $p->where('inviter.name', 'Alex'));
        $this->post('/register', $data)->assertSessionHasErrors('terms');
        $this->assertGuest();
        $this->post('/register', $data + ['terms' => true])->assertRedirect('/dashboard');

        $this->app['auth']->forgetGuards();
        $this->flushSession();
        $this->get('/register')->assertInertia(fn (Assert $p) => $p->where('inviter', null));
    }

    public function test_login_and_register_pages_carry_the_public_numbers(): void
    {
        $this->user();
        $this->get('/login')->assertInertia(fn (Assert $p) => $p->where('siteStats.members', 1)->has('siteStats.listening'));
        $this->actingAs($this->user())->get('/dashboard')->assertInertia(fn (Assert $p) => $p->where('siteStats', null));
    }

    public function test_community_dashboard_and_home_carry_the_new_data(): void
    {
        $me = $this->user(['favorite_genre' => Room::GENRES[0]]);
        $other = $this->user();
        $room = $other->rooms()->create(['name' => 'Beats', 'slug' => 'beats-1', 'genre' => Room::GENRES[0]]);
        $room->enqueue(['youtube_id' => 'aaaaaaaaaaa', 'title' => 'Song A', 'thumbnail' => null, 'duration' => 200], $other->id);
        $room->refresh()->advance();
        Vote::create(['playlist_item_id' => PlaylistItem::first()->id, 'user_id' => $me->id, 'type' => 'woot']);
        $other->forceFill(['roles' => ['admin'], 'bio' => 'I run this place'])->save();
        SiteEvent::create(['title' => 'Party', 'starts_at' => now()->addDay()]);

        $this->actingAs($me)->get('/community')->assertInertia(fn (Assert $p) => $p
            ->has('pulse.woots')->where('pulse.woots', 1)
            ->where('week.songs.0.title', 'Song A')->where('week.songs.0.woots', 1)
            ->has('week.djs')->has('week.chatters')->has('week.rooms')->has('newest')
            ->where('genres.0.genre', Room::GENRES[0])
            ->where('team.0.id', $other->id)->where('team.0.bio', 'I run this place'));

        $this->actingAs($me)->get('/dashboard')->assertInertia(fn (Assert $p) => $p
            ->has('goals', 3)->where('goals.1.key', 'woot')->where('goals.1.have', 1)
            ->where('recommended.reason', 'Because you like '.Room::GENRES[0])->where('recommended.rooms.0.slug', 'beats-1')
            ->has('friendsOnline')->where('continue', null));

        $this->app['auth']->forgetGuards();
        $this->get('/')->assertInertia(fn (Assert $p) => $p->where('event.title', 'Party')->has('topDjs', 1)->where('genres', [Room::GENRES[0] => 1]));
    }
}
