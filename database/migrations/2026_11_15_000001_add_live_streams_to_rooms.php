<?php

use App\Models\RoomRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** A room can show a live stream (YouTube, Twitch or Kick) on its big screen instead of the DJs: `live` holds which one, its title, who started it and when. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->json('live')->nullable()->after('current_started_at');
        });

        // the new room right "Go live": Co-Hosts can do everything but own the room, so they have it too (a host can take it off in Room settings)
        RoomRole::where('builtin', true)->where('name', 'Co-Host')->get()->each(function (RoomRole $role) {
            in_array('go_live', $role->permissions, true) || $role->update(['permissions' => [...$role->permissions, 'go_live']]);
        });
    }

    public function down(): void
    {
        Schema::table('rooms', fn (Blueprint $table) => $table->dropColumn('live'));
    }
};
