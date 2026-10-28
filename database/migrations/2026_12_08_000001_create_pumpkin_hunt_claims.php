<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pumpkin_hunt_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('season', 32);
            $table->unsignedTinyInteger('pumpkin_id');
            $table->timestamp('claimed_at');
            $table->unique(['user_id', 'season', 'pumpkin_id'], 'pumpkin_claim_user_season_id_unique');
        });

        DB::table('room_feature_releases')->insertOrIgnore([
            'key' => 'pumpkin_hunt', 'preview_at' => now(), 'early_days' => 3,
            'enabled' => true, 'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('room_feature_releases')->where('key', 'pumpkin_hunt')->delete();
        Schema::dropIfExists('pumpkin_hunt_claims');
    }
};
