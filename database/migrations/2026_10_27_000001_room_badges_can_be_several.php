<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** A room can hold several badges at once (official, verified, partnered): the single "badge" column becomes a "badges" list. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->json('badges')->nullable();
        });

        DB::table('rooms')->whereNotNull('badge')->get(['id', 'badge'])->each(
            fn ($room) => DB::table('rooms')->where('id', $room->id)->update(['badges' => json_encode([$room->badge])])
        );

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('badge');
        });
    }

    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->string('badge', 16)->nullable();
        });

        // only one badge fits back: the first
        DB::table('rooms')->whereNotNull('badges')->get(['id', 'badges'])->each(
            fn ($room) => DB::table('rooms')->where('id', $room->id)->update(['badge' => json_decode($room->badges, true)[0] ?? null])
        );

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('badges');
        });
    }
};
