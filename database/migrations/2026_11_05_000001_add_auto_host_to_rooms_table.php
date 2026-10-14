<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Auto Host: one of the host's bots plays songs from one of the host's playlists whenever nobody else is in the waitlist (Room::autoHostItem). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->foreignId('auto_host_bot_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('auto_host_playlist_id')->nullable()->constrained('playlists')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropConstrainedForeignId('auto_host_playlist_id');
            $table->dropConstrainedForeignId('auto_host_bot_id');
        });
    }
};
