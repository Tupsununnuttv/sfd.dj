<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_feature_releases', function (Blueprint $table) {
            $table->string('key', 64)->primary();
            $table->timestamp('preview_at')->nullable();
            $table->unsignedTinyInteger('early_days')->default(3);
            $table->boolean('enabled')->default(false);
            $table->timestamps();
        });
        DB::table('room_feature_releases')->insert([
            'key' => 'room_updates', 'preview_at' => now(), 'early_days' => 3,
            'enabled' => true, 'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('room_feature_releases');
    }
};
