<?php

namespace Tests\Feature;

use App\Models\Playlist;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** The newer parts of the public API: the front door, the price list, a richer /me, the characters, your playlists and queueing a whole playlist. */
class ApiV1ExtrasTest extends TestCase
{
    use RefreshDatabase;

    /** A personal token for the person. The guard is reset, so the next call really goes through the token. */
    private function token(User $user): string
    {
        $token = $user->createToken('test')->plainTextToken;
        $this->app['auth']->forgetGuards();

        return $token;
    }

    /** The next call is made with this token, whoever the guard remembers from the call before. */
    private function as(string $token): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($token);
    }

    public function test_the_addresses_of_a_copy_on_your_own_computer_are_for_the_owner_alone(): void
    {
        $live = [['Live site', 'https://sfd-dj.eu/api/v1']];
        $local = [['Your own computer', 'http://127.0.0.1:8000/api/v1'], ['Your own computer', 'http://localhost:8000/api/v1']];

        $plain = User::factory()->create();
        $this->actingAs($plain)->get('/settings/developers')->assertOk()->assertInertia(fn (Assert $page) => $page->where('addresses', $live));

        $admin = User::factory()->create();
        $admin->forceFill(['roles' => ['admin']])->save();
        $this->actingAs($admin)->get('/settings/developers')->assertInertia(fn (Assert $page) => $page->where('addresses', $live));

        $owner = User::factory()->create();
        $owner->forceFill(['roles' => ['owner']])->save();
        $this->actingAs($owner)->get('/settings/developers')->assertInertia(fn (Assert $page) => $page->where('addresses', [...$live, ...$local]));
    }

    public function test_the_front_door_and_the_price_list_need_no_token(): void
    {
        $this->getJson('/api/v1')->assertOk()->assertJsonPath('name', 'SFD-DJ.EU API')->assertJsonPath('version', 'v1')->assertJsonPath('limits.requests_per_minute', 120);

        $plans = $this->getJson('/api/v1/plans')->assertOk()->assertJsonPath('free.playlists', 100)->json('plans');
        $this->assertSame(['bronze', 'silver', 'gold', 'plus', 'pro', 'premium'], array_column($plans, 'key'));
        $this->assertSame(['key' => 'plus', 'currency' => 'eur', 'name' => 'Plus', 'color' => '#14b8a6', 'month' => 999, 'year' => 5999, 'xp' => 1.25, 'playlists' => 200, 'songs' => 10000, 'emojis' => 50], $plans[3]);

        // everything else still wants a token
        $this->getJson('/api/v1/playlists')->assertUnauthorized();
        $this->getJson('/api/v1/characters')->assertUnauthorized();
    }

    public function test_me_tells_the_plan_the_limits_the_coins_and_the_character(): void
    {
        $me = User::factory()->create();
        $this->withToken($this->token($me))->getJson('/api/v1/me')->assertOk()->assertJsonPath('plan', null)->assertJsonPath('limits.playlists', 100)->assertJsonPath('coins', 0);

        $me->forceFill(['plan' => 'gold', 'plan_until' => now()->addDays(5), 'coins' => 42, 'character' => 'char:neko'])->save();
        $this->withToken($this->token($me))->getJson('/api/v1/me')->assertOk()
            ->assertJsonPath('plan', 'gold')->assertJsonPath('limits.playlists', 175)->assertJsonPath('limits.songs', 9000)
            ->assertJsonPath('coins', 42)->assertJsonPath('character', 'neko');
    }

    public function test_characters_are_what_the_account_may_wear_and_each_has_three_pictures(): void
    {
        $plain = User::factory()->create();
        $list = $this->withToken($this->token($plain))->getJson('/api/v1/characters')->assertOk()->json();
        $this->assertContains('foxy', array_column($list, 'name'));
        $this->assertNotContains('skully', array_column($list, 'name'), 'the Owner\'s characters are not listed for anybody else');

        $foxy = collect($list)->firstWhere('name', 'foxy');
        $this->assertSame(['name' => 'foxy', 'label' => 'Foxy', 'level' => 1, 'rarity' => 'common', 'price' => 0, 'owned' => true, 'role' => null], collect($foxy)->except('images')->all());
        $this->assertSame(['standing', 'dancing', 'djing'], array_keys($foxy['images']));
        $this->assertSame(url('/characters/djing/foxy'), $foxy['images']['djing']);
        $this->assertSame(['foxy' => 1], collect($list)->pluck('level', 'name')->only('foxy')->all());
        $this->assertSame(collect($list)->pluck('level')->sort()->values()->all(), collect($list)->pluck('level')->all(), 'lowest level first');

        $owner = User::factory()->create();
        $owner->forceFill(['roles' => ['owner']])->save();
        $skully = collect($this->withToken($this->token($owner))->getJson('/api/v1/characters')->json())->firstWhere('name', 'skully');
        $this->assertSame(['owner', 'owner'], [$skully['rarity'], $skully['role']]);
    }

    public function test_playlists_work_through_a_token_with_the_rules_of_the_site(): void
    {
        $me = User::factory()->create();
        $token = $this->token($me);
        $api = fn () => $this->as($token);

        $made = $api()->postJson('/api/v1/playlists', ['name' => 'Warm up'])->assertCreated()->assertJsonPath('name', 'Warm up')->assertJsonPath('is_active', true)->json();
        $id = $made['id'];
        $list = Playlist::findOrFail($id);
        $list->addSongs([['youtube_id' => 'aaaaaaaaaaa', 'title' => 'One', 'duration' => 100], ['youtube_id' => 'bbbbbbbbbbb', 'title' => 'Two', 'duration' => 200]]);

        $api()->getJson('/api/v1/playlists')->assertOk()->assertJsonPath('0.name', 'Warm up')->assertJsonPath('0.songs_count', 2);
        $api()->getJson("/api/v1/playlists/{$id}")->assertOk()->assertJsonPath('0.title', 'One')->assertJsonPath('1.title', 'Two');
        $api()->patchJson("/api/v1/playlists/{$id}", ['name' => 'Warm up 2'])->assertOk()->assertJsonPath('name', 'Warm up 2');

        [$one, $two] = $list->songs()->pluck('id')->all();
        $api()->putJson("/api/v1/playlists/{$id}/order", ['ids' => [$two, $one]])->assertOk();
        $api()->getJson("/api/v1/playlists/{$id}")->assertJsonPath('0.title', 'Two');
        $api()->deleteJson("/api/v1/playlists/{$id}/songs/{$two}")->assertOk()->assertJsonPath('ok', true);
        $this->assertSame(['One'], $list->songs()->pluck('title')->all());

        $second = $api()->postJson('/api/v1/playlists', ['name' => 'Second'])->assertCreated()->json('id');
        $api()->postJson("/api/v1/playlists/{$second}/activate")->assertOk();
        $this->assertTrue(Playlist::find($second)->is_active);
        $this->assertFalse(Playlist::find($id)->is_active);

        // somebody else's list is theirs alone
        $stranger = User::factory()->create();
        $strangerToken = $this->token($stranger);
        $this->as($strangerToken)->getJson("/api/v1/playlists/{$id}")->assertForbidden();
        $this->as($strangerToken)->deleteJson("/api/v1/playlists/{$id}")->assertForbidden();

        $api()->deleteJson("/api/v1/playlists/{$id}")->assertOk();
        $this->assertNull(Playlist::find($id));
    }

    public function test_the_playlist_limit_of_the_plan_holds_in_the_api_too(): void
    {
        $me = User::factory()->create();
        $me->playlists()->createMany(array_map(fn ($i) => ['name' => "List {$i}", 'kind' => 'custom'], range(1, 100)));
        $token = $this->token($me);

        $this->withToken($token)->postJson('/api/v1/playlists', ['name' => 'One more'])->assertStatus(422);

        $me->forceFill(['plan' => 'bronze', 'plan_until' => now()->addDay()])->save();
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->postJson('/api/v1/playlists', ['name' => 'One more'])->assertCreated();
    }

    public function test_a_whole_playlist_can_be_queued_in_a_room(): void
    {
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-2']);
        $me = User::factory()->create();
        $list = $me->playlists()->create(['name' => 'Mix', 'kind' => 'custom']);
        $list->addSongs([['youtube_id' => 'aaaaaaaaaaa', 'title' => 'One', 'duration' => 100], ['youtube_id' => 'bbbbbbbbbbb', 'title' => 'Two', 'duration' => 200]]);

        $this->withToken($this->token($me))->postJson('/api/v1/rooms/lobby-2/queue-playlist', ['playlist_id' => $list->id])->assertNoContent();
        $this->assertSame(2, $room->items()->where('user_id', $me->id)->count());
    }
}
