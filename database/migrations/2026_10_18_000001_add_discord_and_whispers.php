<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('discord_id', 32)->nullable()->unique();
            $table->string('discord_username', 64)->nullable();
        });

        Schema::create('whispers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('to_id')->constrained('users')->cascadeOnDelete();
            $table->string('body', 500);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['to_id', 'read_at']);
            $table->index(['from_id', 'to_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whispers');
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['discord_id', 'discord_username']));
    }
};
