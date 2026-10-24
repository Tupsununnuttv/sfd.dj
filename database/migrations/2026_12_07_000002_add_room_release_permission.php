<?php

use App\Models\SitePermission;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['developer', 'admin'] as $role) {
            if (SitePermission::where('role', $role)->where('permission', 'rooms.manage')->exists()) {
                SitePermission::firstOrCreate(['role' => $role, 'permission' => 'releases.manage']);
            }
        }
        SitePermission::forget();
    }

    public function down(): void
    {
        SitePermission::where('permission', 'releases.manage')->delete();
        SitePermission::forget();
    }
};
