<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('cosmetics')->nullable(); // {badge, accessory, frame, effect} shop keys
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->string('genre', 40)->nullable();
            $table->boolean('is_private')->default(false);
            $table->boolean('is_featured')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('cosmetics'));
        Schema::table('rooms', fn (Blueprint $table) => $table->dropColumn(['genre', 'is_private', 'is_featured']));
    }
};
