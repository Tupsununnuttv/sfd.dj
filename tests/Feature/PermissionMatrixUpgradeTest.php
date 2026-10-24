<?php

namespace Tests\Feature;

use App\Models\SitePermission;
use App\Models\User;
use App\Enums\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PermissionMatrixUpgradeTest extends TestCase
{
    use RefreshDatabase;

    private function helper(array $permissions): User
    {
        SitePermission::where('role', 'helper')->delete();
        foreach ($permissions as $permission) SitePermission::create(['role' => 'helper', 'permission' => $permission]);
        SitePermission::forget();
        return User::factory()->create(['roles' => ['helper']]);
    }

    public function test_role_management_does_not_grant_account_subscription_or_support_access(): void
    {
        $helper = $this->helper(['admin.access', 'users.roles']);
        $target = User::factory()->create();
        $this->actingAs($helper)->get('/admin')->assertOk();
        $this->patch('/admin/users/'.$target->id.'/roles', ['roles' => ['artist']])->assertRedirect();
        $this->assertSame(['artist'], $target->fresh()->roles);
        $this->patch('/admin/users/'.$target->id.'/plan', ['plan' => 'premium', 'months' => 12])->assertForbidden();
        $this->patch('/admin/users/'.$target->id.'/awards', ['awards' => []])->assertForbidden();
        $this->patch('/admin/users/'.$target->id.'/account', [])->assertForbidden();
        $this->patch('/admin/users/'.$target->id.'/email')->assertForbidden();
        $this->post('/admin/users/'.$target->id.'/violations', ['reason' => 'No permission'])->assertForbidden();
        $this->delete('/admin/users/'.$target->id)->assertForbidden();
        $this->getJson('/admin/support/tickets')->assertForbidden();
        $this->put('/admin/permissions', ['granted' => []])->assertForbidden();
    }

    public function test_subscription_and_support_permissions_are_independent(): void
    {
        $helper = $this->helper(['subscriptions.manage', 'support.manage']);
        $target = User::factory()->create();
        $this->actingAs($helper)->patch('/admin/users/'.$target->id.'/plan', ['plan' => 'bronze', 'months' => 1])->assertRedirect();
        $this->assertSame('bronze', $target->fresh()->activePlan());
        $this->getJson('/admin/support/tickets')->assertOk();
        $this->put('/admin/email', ['verification' => 'optional'])->assertForbidden();
        $this->patch('/admin/users/'.$target->id.'/roles', ['roles' => ['artist']])->assertForbidden();
    }

    public function test_migration_preserves_existing_grants_once_and_does_not_grant_unrelated_powers(): void
    {
        $this->helper(['users.manage']);
        $migration = require database_path('migrations/2026_12_06_000001_expand_site_permission_matrix.php');
        $migration->up();
        $migration->up();
        $granted = SitePermission::matrix()['helper'];
        $this->assertContains('users.roles', $granted);
        $this->assertContains('subscriptions.manage', $granted);
        $this->assertNotContains('support.manage', $granted);
        $this->assertNotContains('admin.access', $granted);
        $this->assertSame(count($granted), count(array_unique($granted)));
        $this->assertCount(17, Role::PERMISSIONS);
    }
}
