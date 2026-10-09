<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** username = the unique handle; name stays the display name shown in rooms. */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 20)->nullable()->unique();
        });

        // existing people keep their current name as username (cleaned up, made unique)
        $taken = [];
        foreach (DB::table('users')->orderBy('id')->get(['id', 'name']) as $u) {
            $base = trim(substr(preg_replace('/[^A-Za-z0-9_]+/', '_', $u->name), 0, 16), '_');
            $base = strlen($base) >= 3 ? $base : 'user'.$u->id;
            $name = $base;
            for ($i = 2; isset($taken[strtolower($name)]); $i++) {
                $name = $base.$i;
            }
            $taken[strtolower($name)] = true;
            DB::table('users')->where('id', $u->id)->update(['username' => $name]);
        }
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('username'));
    }
};