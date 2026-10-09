<?php

use App\Enums\Role;
use App\Models\SitePermission;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // "Content Creator" is gone from the list: whoever had it is now a Content Provider
        DB::table('users')->where('roles', 'like', '%content_creator%')->get(['id', 'roles'])->each(function ($user) {
            $roles = collect(json_decode($user->roles, true) ?: [])->map(fn ($role) => $role === 'content_creator' ? 'content_provider' : $role)->unique()->values();
            DB::table('users')->where('id', $user->id)->update(['roles' => $roles->toJson()]);
        });
        DB::table('site_permissions')->where('role', 'content_creator')->delete();

        // Lead Moderator is new: start it with the recommended permissions (a fresh install already got them)
        $lead = Role::LeadModerator->value;
        if (! DB::table('site_permissions')->where('role', $lead)->exists()) {
            foreach (Role::defaultPermissions()[$lead] as $permission) {
                DB::table('site_permissions')->insert(['role' => $lead, 'permission' => $permission]);
            }
        }

        SitePermission::forget();
    }

    public function down(): void
    {
        // nothing to undo: the old role names are not coming back
    }
};
