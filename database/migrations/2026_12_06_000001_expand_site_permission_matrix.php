<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Models\SitePermission;

return new class extends Migration
{
    public function up(): void
    {
        // Split existing grants without removing rights from an already configured team.
        foreach ([
            'users.manage' => ['users.roles', 'users.awards', 'subscriptions.manage', 'users.verify', 'users.violations', 'users.delete'],
            'admin.access' => ['support.manage'],
            'maintenance.toggle' => ['email.manage'],
        ] as $parent => $children) {
            foreach (DB::table('site_permissions')->where('permission', $parent)->pluck('role')->unique() as $role) {
                foreach ($children as $permission) SitePermission::firstOrCreate(compact('role', 'permission'));
            }
        }
        SitePermission::forget();
    }

    public function down(): void
    {
        DB::table('site_permissions')->whereIn('permission', ['users.roles', 'users.awards', 'subscriptions.manage', 'users.verify', 'users.violations', 'users.delete', 'support.manage', 'email.manage'])->delete();
        SitePermission::forget();
    }
};
