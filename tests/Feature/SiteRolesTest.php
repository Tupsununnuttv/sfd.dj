<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\ChatMessage;
use App\Models\SitePermission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SiteRolesTest extends TestCase
{
    use RefreshDatabase;

    private function userWith(string ...$roles): User
    {
        $user = User::factory()->create();
        $user->forceFill(['roles' => $roles])->save();

        return $user->refresh();
    }

    /** key, icon, label, group: the list exactly as it was asked for. */
    private function list(): array
    {
        return [
            ['owner', '👑', 'Owner', 'staff'],
            ['developer', '🛠️', 'Developer', 'staff'],
            ['admin', '🔴', 'Admin', 'staff'],
            ['lead_moderator', '🟣', 'Lead Moderator', 'staff'],
            ['brand_ambassador', '💗', 'Brand Ambassador', 'staff'],
            ['site_moderator', '🟢', 'Site Moderator', 'staff'],
            ['moderator', '🟠', 'Moderator', 'staff'],
            ['helper', '🟡', 'Helper', 'staff2'],
            ['promoter', '📢', 'Promoter', 'staff2'],
            ['translator', '🌐', 'Translator', 'staff2'],
            ['content_provider', '📝', 'Content Provider', 'creator'],
            ['music_producer', '🎵', 'Music Producer', 'creator'],
            ['artist', '🎤', 'Artist', 'creator'],
            ['partnership', '🤝', 'Partnership', 'community'],
            ['vip', '💜', 'VIP', 'community'],
            ['early_supporter', '💎', 'Early Supporter', 'community'],
            ['beta_tester', '🧪', 'Beta Tester', 'community'],
            ['supporter', '⭐', 'Supporter', 'community'],
            ['member', '👤', 'User', 'community'],
        ];
    }

    public function test_the_roles_come_in_the_agreed_order_groups_icons_and_names(): void
    {
        $actual = array_map(fn (Role $r) => [$r->value, $r->icon(), $r->label(), $r->group()], Role::cases());

        $this->assertSame($this->list(), $actual);
        $this->assertSame(['staff', 'staff2', 'creator', 'community'], array_keys(Role::GROUPS));
        $this->assertSame('🛡️', Role::GROUPS['staff']['icon']);
        $this->assertSame('Creator / Contributor', Role::GROUPS['creator']['label']);
        $this->assertSame('Community / Status', Role::GROUPS['community']['label']);
        $this->assertNull(Role::tryFrom('content_creator'));
        $this->assertCount(19, array_unique(array_map(fn (Role $r) => $r->color(), Role::cases())), 'every role has its own colour');
    }

    public function test_the_permissions_tab_lists_every_role_in_that_order_with_its_group(): void
    {
        $keys = array_column($this->list(), 0);
        $withoutUser = array_slice($keys, 0, -1);

        $this->actingAs($this->userWith('owner'))->get('/admin')->assertInertia(fn (Assert $page) => $page
            ->component('Admin')
            ->where('roleGroups', fn ($groups) => $groups->keys()->all() === ['staff', 'staff2', 'creator', 'community'])
            ->where('matrix.roles', fn ($roles) => $roles->pluck('key')->all() === $keys
                && $roles->last() === ['key' => 'member', 'label' => 'User', 'color' => '#a3a3a3', 'rank' => 18, 'icon' => '👤', 'group' => 'community'])
            ->where('roleOptions', fn ($roles) => $roles->pluck('key')->all() === $withoutUser)
            ->where('assignable', fn ($roles) => $roles->pluck('key')->all() === $withoutUser));
    }

    public function test_whoever_is_given_a_role_shows_it_in_chat_and_a_plain_user_shows_nothing(): void
    {
        $room = User::factory()->create()->rooms()->create(['name' => 'R', 'slug' => 'roles-room']);
        $lead = $this->userWith('lead_moderator', 'vip');
        $plain = User::factory()->create();

        $say = fn (User $u) => $room->messages()->create(['user_id' => $u->id, 'body' => 'hi'])->load(ChatMessage::WITH_USER)->payload();

        $msg = $say($lead);
        $this->assertSame('Lead Moderator', $msg['role']['label']);
        $this->assertSame('#a855f7', $msg['role']['color']);
        $this->assertSame(['🟣', '💜'], array_column($msg['badges'], 'icon')); // every role they hold, the highest first

        $msg = $say($plain);
        $this->assertSame('User', $msg['role']['label']);
        $this->assertSame([], $msg['badges']);
    }

    public function test_lead_moderator_outranks_moderators_and_starts_with_the_recommended_permissions(): void
    {
        $lead = $this->userWith('lead_moderator');
        $brand = $this->userWith('brand_ambassador');
        $mod = $this->userWith('moderator');
        $admin = $this->userWith('admin');
        $plain = User::factory()->create();

        $this->assertTrue($admin->outranks($lead));
        $this->assertTrue($lead->outranks($brand));
        $this->assertTrue($brand->outranks($mod));

        foreach (['admin.access', 'users.manage', 'rooms.moderate', 'ipbans.manage'] as $permission) {
            $this->assertTrue($lead->hasPermission($permission), $permission);
        }
        $this->assertFalse($lead->hasPermission('maintenance.toggle'));
        $this->assertFalse($lead->hasPermission('rooms.manage'));

        // they can hand out the roles below theirs, nothing at or above their own
        $this->actingAs($lead)->patch("/admin/users/{$plain->id}/roles", ['roles' => ['moderator', 'artist']])->assertRedirect();
        $this->assertSame(['moderator', 'artist'], $plain->refresh()->roles);
        $this->actingAs($lead)->patch("/admin/users/{$plain->id}/roles", ['roles' => ['lead_moderator']])->assertSessionHasErrors('roles.0');
        $this->actingAs($lead)->patch("/admin/users/{$plain->id}/roles", ['roles' => ['admin']])->assertSessionHasErrors('roles.0');
    }

    public function test_only_real_roles_can_be_saved_in_the_matrix_and_the_user_row_never_stores_anything(): void
    {
        $owner = $this->userWith('owner');

        $this->actingAs($owner)->put('/admin/permissions', ['granted' => [
            'lead_moderator' => ['users.manage'],
            'member' => ['admin.access'],
            'content_creator' => ['admin.access'],
        ]])->assertRedirect();

        $this->assertSame(['lead_moderator'], SitePermission::query()->distinct()->pluck('role')->all());
        $this->assertSame(['users.manage'], SitePermission::matrix()['lead_moderator']);

        // "Reset to recommended" brings the Lead Moderator defaults back
        $this->actingAs($owner)->put('/admin/permissions/reset')->assertRedirect();
        $this->assertContains('admin.access', SitePermission::matrix()['lead_moderator']);
    }

    public function test_the_update_moves_content_creators_to_content_provider_and_seeds_lead_moderator_once(): void
    {
        $a = $this->userWith('content_creator', 'vip');
        $b = $this->userWith('content_creator', 'content_provider');
        SitePermission::create(['role' => 'content_creator', 'permission' => 'events.manage']);
        SitePermission::where('role', 'lead_moderator')->delete();

        $migration = require database_path('migrations/2026_10_22_000001_update_site_roles.php');
        $migration->up();
        $migration->up(); // running it again changes nothing

        $this->assertSame(['content_provider', 'vip'], $a->refresh()->roles);
        $this->assertSame(['content_provider'], $b->refresh()->roles);
        $this->assertSame(0, SitePermission::where('role', 'content_creator')->count());
        $this->assertEqualsCanonicalizing(Role::defaultPermissions()['lead_moderator'], SitePermission::where('role', 'lead_moderator')->pluck('permission')->all());
    }

    public function test_staff_delete_the_accounts_of_people_ranked_below_them_and_nobody_else(): void
    {
        $admin = $this->userWith('admin');
        $owner = $this->userWith('owner');
        $mod = $this->userWith('moderator');
        $plain = User::factory()->create();
        $room = $plain->rooms()->create(['name' => 'Theirs', 'slug' => 'theirs']);

        // a moderator cannot (no users.manage), an admin cannot touch the owner, nor themselves
        $this->actingAs($mod)->delete("/admin/users/{$plain->id}")->assertForbidden();
        $this->actingAs($admin)->delete("/admin/users/{$owner->id}")->assertForbidden();
        $this->actingAs($admin)->delete("/admin/users/{$admin->id}")->assertForbidden();
        $this->assertModelExists($plain);

        $this->actingAs($admin)->delete("/admin/users/{$plain->id}")->assertRedirect();
        $this->assertModelMissing($plain);
        $this->assertModelMissing($room); // what was theirs goes with them
    }

    public function test_every_role_has_a_drawn_icon_and_the_room_lists_people_under_their_room_role(): void
    {
        $icons = file_get_contents(resource_path('js/Components/RoleIcon.tsx'));
        foreach (Role::cases() as $role) {
            $this->assertMatchesRegularExpression('/^    '.$role->value.': \w+,$/m', $icons, "{$role->value} has no icon");
        }
        foreach (['Host', "'Co-Host'", 'Manager', 'Bouncer', "'Resident DJ'"] as $name) {
            $this->assertStringContainsString("{$name}: ", $icons);
        }

        // the badges in front of a name draw the icon, not the emoji
        $this->assertStringContainsString('<RoleIcon key={b.key} role={b} />', file_get_contents(resource_path('js/Components/Badges.tsx')));

        // the Users tab of a room: the host, then the room roles in their order, then everybody else
        $room = file_get_contents(resource_path('js/Pages/Room.tsx'));
        $this->assertStringContainsString('const roleGroups = [', $room);
        $this->assertStringContainsString('people: rankedUsers.filter((member) => member.id === host.id && !isSiteRanked(member))', $room);
        $this->assertStringContainsString('[...roles].sort((a, b) => a.rank - b.rank)', $room);
        $this->assertStringContainsString("type Tab = 'room' | 'chat' | 'waitlist' | 'users'", $room);
        $this->assertStringContainsString('data-role-group={role.label}', $room);
    }
}
