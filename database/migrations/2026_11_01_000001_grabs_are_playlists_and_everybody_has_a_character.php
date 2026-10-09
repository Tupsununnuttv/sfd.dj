<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Two things that used to hide from people:
 * - A grabbed song went into a built-in "Grabs" list that the playlist manager never showed, so it looked as if grabbing did nothing. A grab now goes into a playlist the person picks,
 *   so the built-in lists become ordinary playlists called Grabs (an empty one just goes).
 * - Somebody with no avatar was shown as the first letter of their name in a coloured circle. Everybody has a character now: the ones who had none get one of the free ones.
 */
return new class extends Migration
{
    /** The characters that cost nothing and need no role (AvatarController::starterCharacters), written out so this stays true whatever the shop does later. */
    private const STARTERS = ['char:foxy'];

    public function up(): void
    {
        DB::table('playlists')->where('kind', 'grabs')->get(['id'])->each(function ($list) {
            if (DB::table('playlist_songs')->where('playlist_id', $list->id)->exists()) {
                DB::table('playlists')->where('id', $list->id)->update(['kind' => 'custom', 'is_active' => false]);
            } else {
                DB::table('playlists')->where('id', $list->id)->delete();
            }
        });

        DB::table('users')->where('is_bot', false)->where(fn ($q) => $q->whereNull('avatar')->orWhere('avatar', ''))->get(['id'])->each(
            fn ($user) => DB::table('users')->where('id', $user->id)->update(['avatar' => self::STARTERS[array_rand(self::STARTERS)]])
        );
    }

    public function down(): void
    {
        // a grabbed list stays a playlist, and a character stays a character
    }
};
