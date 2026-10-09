<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Every step checks first, so the migration can be re-run after a half-finished attempt.
    public function up(): void
    {
        // the order of the songs in a playlist (drag them to change it), and who uploaded the video
        Schema::table('playlist_songs', function (Blueprint $table) {
            if (! Schema::hasColumn('playlist_songs', 'position')) {
                $table->unsignedInteger('position')->default(0);
                $table->index(['playlist_id', 'position']);
            }
            if (! Schema::hasColumn('playlist_songs', 'channel')) {
                $table->string('channel', 120)->nullable();
            }
        });

        // the playlist a person plays from: one per person, the first one they made until they pick another
        Schema::table('playlists', function (Blueprint $table) {
            if (! Schema::hasColumn('playlists', 'is_active')) {
                $table->boolean('is_active')->default(false);
            }
        });

        // a song in the waitlist that came from somebody's active playlist remembers where from, so it can go to the bottom of it once it has been played
        Schema::table('playlist_items', function (Blueprint $table) {
            if (! Schema::hasColumn('playlist_items', 'playlist_song_id')) {
                $table->unsignedBigInteger('playlist_song_id')->nullable();
            }
        });

        // songs keep the order they were added in; each person's first playlist is their active one
        DB::table('playlist_songs')->where('position', 0)->update(['position' => DB::raw('id')]);

        DB::table('playlists')->where('kind', 'custom')->orderBy('id')->get(['id', 'user_id'])->groupBy('user_id')->each(function ($lists) {
            DB::table('playlists')->where('id', $lists->first()->id)->update(['is_active' => true]);
        });
    }

    public function down(): void
    {
        Schema::table('playlist_items', function (Blueprint $table) {
            $table->dropColumn('playlist_song_id');
        });
        Schema::table('playlists', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
        Schema::table('playlist_songs', function (Blueprint $table) {
            $table->dropIndex(['playlist_id', 'position']);
            $table->dropColumn(['position', 'channel']);
        });
    }
};
