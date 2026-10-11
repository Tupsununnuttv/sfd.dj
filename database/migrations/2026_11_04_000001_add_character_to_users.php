<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('character', 16)->default('char:foxy');
        });

        DB::table('users')->where('avatar', 'like', 'char:%')->update(['character' => DB::raw('avatar')]);
        DB::table('users')->whereNull('character')->update(['character' => 'char:foxy']);
        DB::table('users')->where('is_bot', true)->update(['character' => 'char:robo']);
        DB::table('users')->where('is_bot', true)->where(fn ($query) => $query->whereNull('avatar')->orWhere('avatar', '')->orWhere('avatar', 'like', 'char:%'))->update(['avatar' => 'char:robo']);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('character');
        });
    }
};
