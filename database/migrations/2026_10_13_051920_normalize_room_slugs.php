<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->string('legacy_slug')->nullable()->unique();
        });

        $rooms = DB::table('rooms')->get(['id', 'slug']);
        $renames = [];
        $occupied = [];

        foreach ($rooms as $room) {
            if (preg_match('/-[a-z]{4}$/D', $room->slug) === 1) {
                $renames[] = ['id' => $room->id, 'old' => $room->slug, 'base' => substr($room->slug, 0, -5) ?: 'room'];
            } else {
                $occupied[$room->slug] = true;
            }
        }

        foreach ($renames as &$rename) {
            $rename['slug'] = $rename['base'];
            $suffix = 2;

            while (isset($occupied[$rename['slug']])) {
                $rename['slug'] = $rename['base'].'-'.$suffix++;
            }

            $occupied[$rename['slug']] = true;
        }
        unset($rename);

        foreach ($renames as $rename) {
            DB::table('rooms')->where('id', $rename['id'])->update([
                'legacy_slug' => $rename['old'],
                'slug' => 'room-slug-migration-'.Str::uuid(),
            ]);
        }

        foreach ($renames as $rename) {
            DB::table('rooms')->where('id', $rename['id'])->update(['slug' => $rename['slug']]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $rooms = DB::table('rooms')->whereNotNull('legacy_slug')->get(['id', 'legacy_slug']);

        foreach ($rooms as $room) {
            DB::table('rooms')->where('id', $room->id)->update(['slug' => 'room-slug-rollback-'.Str::uuid()]);
        }

        foreach ($rooms as $room) {
            DB::table('rooms')->where('id', $room->id)->update(['slug' => $room->legacy_slug, 'legacy_slug' => null]);
        }

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropUnique(['legacy_slug']);
            $table->dropColumn('legacy_slug');
        });
    }
};
