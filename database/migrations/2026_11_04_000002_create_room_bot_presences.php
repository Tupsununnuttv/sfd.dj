<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_bot_presences', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('last_seen_at')->index();
            $table->timestamp('last_broadcast_at')->nullable();
            $table->unique(['room_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_bot_presences');
    }
};
