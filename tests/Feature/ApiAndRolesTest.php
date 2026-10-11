<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Events\RoomBotPresenceChanged;
use App\Models\Room;
use App\Models\RoomBan;
use App\Models\RoomBotPresence;
use App\Models\Setting;
use App\Models\SitePermission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ApiAndRolesTest extends TestCase
{
    use RefreshDatabase;

    private function userWith(string ...$roles): User
    {
        $user = User::factory()->create();
        $user->forceFill(['roles' => $roles])->save();

        return $user;
    }

    /** Makes a bot for $owner through the Developers page; returns [bot, plain token]. */
    private function makeBot(User $owner, string $name = 'DJ Helper'): array
    {
        $this->actingAs($owner)->post('/settings/developers/bots', ['name' => $name])->assertRedirect();
        $bot = $owner->bots()->latest('id')->firstOrFail();
        $token = session('new_token')['token'];
        $this->app['auth']->forgetGuards();

        return [$bot, $token];
    }

    public function test_owner_can_hand_out_any_role_including_owner_but_admin_cannot(): void
    {
        $owner = $this->userWith('owner');
        $admin = $this->userWith('admin');
        $member = User::factory()->create();

        $this->actingAs($owner)->get('/admin')->assertInertia(fn (Assert $p) => $p->where('assignable.0.key', 'owner'));
        $this->actingAs($owner)->patch("/admin/users/{$member->id}/roles", ['roles' => ['owner']])->assertRedirect();
        $this->assertSame('owner', $member->refresh()->role()->value);

        $member->forceFill(['roles' => []])->save();
        $this->actingAs($admin)->patch("/admin/users/{$member->id}/roles", ['roles' => ['owner']])->assertSessionHasErrors('roles.0');
    }

    public function test_matrix_has_events_and_community_permissions_and_can_be_reset(): void
    {
        $owner = $this->userWith('owner');
        $promoter = $this->userWith('promoter');
        $admin = $this->userWith('admin');

        $this->assertTrue($promoter->hasPermission('events.manage'));
        $this->assertFalse($promoter->hasPermission('admin.access'));
        $this->assertTrue($admin->hasPermission('community.manage'));

        $this->actingAs($admin)->put('/admin/permissions/reset')->assertForbidden();
        SitePermission::query()->delete();
        SitePermission::forget();
        $this->assertFalse($admin->refresh()->hasPermission('events.manage'));

        $this->actingAs($owner)->put('/admin/permissions/reset')->assertRedirect();
        $this->assertTrue($admin->refresh()->hasPermission('events.manage'));
        $this->assertTrue($promoter->refresh()->hasPermission('events.manage'));
    }

    public function test_room_and_admin_role_options_share_the_strict_authority_order(): void
    {
        $expected = [
            'owner', 'developer', 'admin', 'lead_moderator', 'brand_ambassador',
            'site_moderator', 'moderator', 'helper', 'promoter', 'translator',
            'content_provider', 'music_producer', 'artist',
            'partnership', 'vip', 'early_supporter', 'beta_tester', 'supporter', 'member',
        ];
        $this->assertSame($expected, array_map(fn (Role $role) => $role->value, Role::cases()));

        $owner = $this->userWith('owner');
        $room = $owner->rooms()->create(['name' => 'Ordered', 'slug' => 'ordered-room']);
        $this->actingAs($owner)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $page) => $page->where('roleOrder', $expected));
        $this->actingAs($owner)->get('/admin')->assertInertia(fn (Assert $page) => $page
            ->where('roleOptions.5.key', 'site_moderator')
            ->where('roleOptions.6.key', 'moderator'));
    }

    public function test_community_page_is_for_everyone_and_editing_needs_community_manage(): void
    {
        $admin = $this->userWith('admin')->refresh();
        $member = User::factory()->create()->refresh();

        $this->actingAs($member)->get('/community')->assertInertia(fn (Assert $p) => $p->where('canEdit', false)->where('settings', null));
        $this->actingAs($admin)->get('/community')->assertInertia(fn (Assert $p) => $p->where('canEdit', true)->has('settings.labels'));
        $this->actingAs($admin)->get('/admin')->assertInertia(fn (Assert $p) => $p->missing('community.labels'));
    }

    public function test_bots_are_made_in_settings_and_work_only_through_tokens(): void
    {
        $owner = User::factory()->create();
        [$bot, $token] = $this->makeBot($owner);

        $this->assertTrue($bot->is_bot);
        $this->assertSame($owner->id, $bot->bot_owner_id);
        $this->assertSame('char:robo', $bot->character);
        $this->assertStringContainsString('bot', $bot->username);
        $this->assertSame('bot', collect($bot->badges)->pluck('key')->last());

        $this->getJson('/api/v1/me')->assertUnauthorized();
        $this->withToken('nonsense')->getJson('/api/v1/me')->assertUnauthorized();

        $me = $this->withToken($token)->getJson('/api/v1/me')->assertOk()->assertJsonPath('id', $bot->id)->assertJsonPath('is_bot', true)->json();
        $this->assertArrayNotHasKey('email', $me);

        // the bot's own login does not work (random password, nobody knows it)
        $this->app['auth']->forgetGuards();
        $this->app['auth']->shouldUse('web'); // an earlier API call in this test made sanctum the default guard
        $this->post('/login', ['email' => $bot->username, 'password' => 'password'])->assertSessionHasErrors();
        $this->assertGuest();

        // deleting the bot kills its tokens
        $this->actingAs($owner)->delete("/settings/developers/bots/{$bot->id}")->assertRedirect();
        $this->assertNull(User::find($bot->id));
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_only_the_owner_can_make_tokens_and_delete_bots(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        [$bot] = $this->makeBot($owner);

        $this->actingAs($other)->delete("/settings/developers/bots/{$bot->id}")->assertForbidden();
        $this->actingAs($other)->post('/settings/developers/tokens', ['name' => 'steal', 'bot_id' => $bot->id])->assertNotFound();

        $this->actingAs($owner)->post('/settings/developers/tokens', ['name' => 'laptop'])->assertRedirect();
        $this->assertSame(1, $owner->tokens()->count());
        $this->actingAs($other)->get('/settings/developers')->assertOk()->assertInertia(fn (Assert $p) => $p->where('bots', [])->where('tokens', []));

        $id = $owner->tokens()->first()->id;
        $this->actingAs($other)->delete("/settings/developers/tokens/{$id}");
        $this->assertSame(1, $owner->tokens()->count()); // someone else's token stays
        $this->actingAs($owner)->delete("/settings/developers/tokens/{$id}");
        $this->assertSame(0, $owner->tokens()->count());
    }

    public function test_bot_can_read_and_chat_but_needs_a_room_role_to_moderate(): void
    {
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);
        $room->ensureDefaultRoles();
        $troll = User::factory()->create();
        [$bot, $token] = $this->makeBot($host);

        $this->withToken($token)->getJson('/api/v1/rooms')->assertOk()->assertJsonPath('0.slug', 'lobby-1')->assertJsonPath('0.host.id', $host->id);
        $this->withToken($token)->getJson('/api/v1/rooms/lobby-1')->assertOk()->assertJsonPath('playback.current', null)->assertJsonPath('permissions', []);

        $this->withToken($token)->postJson('/api/v1/rooms/lobby-1/messages', ['body' => 'Hello, I am a bot'])->assertNoContent();
        $this->assertDatabaseHas('room_bot_presences', ['room_id' => $room->id, 'user_id' => $bot->id]);

        $this->travel(91)->seconds();
        $this->withToken($token)->getJson('/api/v1/rooms/lobby-1/messages')->assertOk();
        $this->assertCount(1, RoomBotPresence::activeMembers($room), 'any room-scoped API request renews an active bot lease');
        $this->actingAs($host)->get('/rooms/lobby-1')->assertInertia(fn (Assert $page) => $page
            ->where('botMembers.0.id', $bot->id)
            ->where('botMembers.0.character', 'char:robo'));
        $this->app['auth']->forgetGuards();
        $messages = $this->withToken($token)->getJson('/api/v1/rooms/lobby-1/messages')->assertOk()->assertJsonPath('0.body', 'Hello, I am a bot')->assertJsonPath('0.user_id', $bot->id)->json();
        $this->assertSame('bot', collect($messages[0]['badges'])->pluck('key')->last());

        // polling: only newer messages, oldest first
        $last = $messages[0]['id'];
        $this->withToken($token)->postJson('/api/v1/rooms/lobby-1/messages', ['body' => 'second'])->assertNoContent();
        $this->withToken($token)->getJson("/api/v1/rooms/lobby-1/messages?after={$last}")->assertJsonCount(1)->assertJsonPath('0.body', 'second');

        // no role, no power
        $this->withToken($token)->postJson("/api/v1/rooms/lobby-1/kick/{$troll->id}")->assertForbidden();
        $this->withToken($token)->postJson("/api/v1/rooms/lobby-1/mute/{$troll->id}", ['for' => '10m'])->assertForbidden();

        // the host gives the bot the Manager role (through the normal site), and now it can
        $manager = $room->roles()->where('name', 'Manager')->firstOrFail();
        $this->app['auth']->forgetGuards();
        $this->actingAs($host)->putJson("/rooms/lobby-1/members/{$bot->id}", ['room_role_id' => $manager->id])->assertSuccessful();
        $this->app['auth']->forgetGuards();

        $this->withToken($token)->getJson('/api/v1/rooms/lobby-1')->assertJsonPath('permissions.0', fn ($p) => is_string($p));
        $this->withToken($token)->postJson("/api/v1/rooms/lobby-1/mute/{$troll->id}", ['for' => '10m'])->assertNoContent();
        $this->withToken($token)->getJson('/api/v1/rooms/lobby-1/members')->assertOk()->assertJsonPath('members.0.user_id', $bot->id);
    }

    public function test_bots_can_heartbeat_and_leave_visual_room_presence(): void
    {
        Event::fake([RoomBotPresenceChanged::class]);
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);
        [$bot, $token] = $this->makeBot($host);

        $this->withToken($token)->postJson('/api/v1/rooms/lobby-1/presence')->assertOk()->assertJsonPath('online', true)->assertJsonPath('expires_in', RoomBotPresence::TTL_SECONDS);
        $this->assertDatabaseHas('room_bot_presences', ['room_id' => $room->id, 'user_id' => $bot->id]);
        Event::assertDispatched(RoomBotPresenceChanged::class, fn (RoomBotPresenceChanged $event) => $event->online && $event->member['id'] === $bot->id);

        $this->travel(31)->seconds();
        $this->withToken($token)->postJson('/api/v1/rooms/lobby-1/presence')->assertOk();
        Event::assertDispatchedTimes(RoomBotPresenceChanged::class, 2);
        $this->travel(91)->seconds();
        $this->assertCount(0, RoomBotPresence::activeMembers($room));

        $this->withToken($token)->deleteJson('/api/v1/rooms/lobby-1/presence')->assertNoContent();
        $this->assertDatabaseMissing('room_bot_presences', ['room_id' => $room->id, 'user_id' => $bot->id]);
        Event::assertDispatched(RoomBotPresenceChanged::class, fn (RoomBotPresenceChanged $event) => ! $event->online && $event->member['id'] === $bot->id);

        $human = User::factory()->create();
        $humanToken = $human->createToken('human')->plainTextToken;
        $this->app['auth']->forgetGuards();
        $this->withToken($humanToken)->postJson('/api/v1/rooms/lobby-1/presence')->assertForbidden();
    }

    public function test_private_rooms_are_hidden_and_banned_users_are_shut_out_everywhere(): void
    {
        $host = User::factory()->create();
        $secret = $host->rooms()->create(['name' => 'Secret', 'slug' => 'secret-1', 'is_private' => true]);
        $open = $host->rooms()->create(['name' => 'Open', 'slug' => 'open-1']);
        $guy = User::factory()->create();
        $token = $guy->createToken('t')->plainTextToken;

        $this->withToken($token)->getJson('/api/v1/rooms')->assertJsonCount(1)->assertJsonPath('0.slug', 'open-1');
        $this->withToken($token)->getJson('/api/v1/rooms/secret-1')->assertForbidden();
        $this->withToken($token)->postJson('/api/v1/rooms/secret-1/messages', ['body' => 'hi'])->assertForbidden();

        RoomBan::create(['room_id' => $open->id, 'user_id' => $guy->id, 'banned_by' => $host->id]);
        $this->withToken($token)->postJson('/api/v1/rooms/open-1/messages', ['body' => 'hi'])->assertForbidden()->assertJsonPath('message', 'You are banned from this room.');

        // the website had the same hole: a banned user could post by sending the request directly
        $this->app['auth']->forgetGuards();
        $this->actingAs($guy)->postJson('/rooms/open-1/messages', ['body' => 'hi'])->assertForbidden();
        $this->assertSame(0, Room::find($open->id)->messages()->count());
    }

    public function test_maintenance_mode_answers_the_api_with_json(): void
    {
        $guy = User::factory()->create();
        $token = $guy->createToken('t')->plainTextToken;
        Setting::put('maintenance', '1');

        $this->withToken($token)->getJson('/api/v1/me')->assertStatus(503)->assertJsonPath('message', 'SFD.DJ is in maintenance mode.');
    }
}
