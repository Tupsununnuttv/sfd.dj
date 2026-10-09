<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->string('welcome_message', 300)->nullable();
            $table->text('rules')->nullable();
            $table->boolean('waitlist_locked')->default(false);
            $table->boolean('waitlist_cycle')->default(false);
            $table->json('automod')->nullable();
        });

        Schema::create('room_mutes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('muted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('until')->nullable(); // null = until unmuted
            $table->timestamps();
            $table->unique(['room_id', 'user_id']);
        });

        Schema::create('room_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('target_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 30); // kick, ban, unban, mute, unmute, role, clear_chat, delete_message, skip, remove_song, settings, automod
            $table->string('details')->nullable();
            $table->timestamps();
            $table->index(['room_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_logs');
        Schema::dropIfExists('room_mutes');
        Schema::table('rooms', fn (Blueprint $table) => $table->dropColumn(['welcome_message', 'rules', 'waitlist_locked', 'waitlist_cycle', 'automod']));
    }
};
