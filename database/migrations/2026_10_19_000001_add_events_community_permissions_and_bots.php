<?php

use App\Enums\Role;
use App\Models\SitePermission;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Events and community links used to ride on "broadcast.send"; give the new permissions to the roles that should have them.
        foreach (Role::defaultPermissions() as $role => $permissions) {
            foreach (array_intersect($permissions, ['events.manage', 'community.manage']) as $permission) {
                SitePermission::firstOrCreate(['role' => $role, 'permission' => $permission]);
            }
        }
        SitePermission::forget();

        // Bot accounts: normal users that belong to someone and can only be reached with an API token.
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_bot')->default(false);
            $table->foreignId('bot_owner_id')->nullable()->constrained('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('bot_owner_id');
            $table->dropColumn('is_bot');
        });
    }
};
