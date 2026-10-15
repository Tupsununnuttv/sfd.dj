<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * A room's web address follows its name, and every address it ever had keeps working (it sends people to the current one), so links in chats,
 * bookmarks and bots survive a rename. This table remembers them. The one old address a room could have (`legacy_slug`, from when the
 * addresses were tidied up) moves here too, and that column goes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_slugs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->string('slug')->unique();
            $table->timestamp('created_at')->nullable();
        });

        DB::table('rooms')->whereNotNull('legacy_slug')->orderBy('id')->get(['id', 'legacy_slug'])->each(
            fn (object $room) => DB::table('room_slugs')->insert(['room_id' => $room->id, 'slug' => $room->legacy_slug, 'created_at' => now()]),
        );

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropUnique(['legacy_slug']);
            $table->dropColumn('legacy_slug');
        });
    }

    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->string('legacy_slug')->nullable()->unique();
        });

        // a room could have one old address: the newest it left behind
        DB::table('room_slugs')->orderBy('id')->get()->each(
            fn (object $old) => DB::table('rooms')->where('id', $old->room_id)->update(['legacy_slug' => $old->slug]),
        );

        Schema::dropIfExists('room_slugs');
    }
};
