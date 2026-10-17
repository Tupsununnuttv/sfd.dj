<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('self_dj_bots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('bot_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('room_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('playlist_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('managed_account')->default(true);
            $table->timestamps();
        });

        // Keep existing Auto Hosts, including bot accounts that have their own API tokens.
        DB::table('rooms')->whereNotNull('auto_host_bot_id')->orderBy('id')->each(function ($room) {
            $bot = DB::table('users')->find($room->auto_host_bot_id);
            if (! $bot) {
                return;
            }
            DB::table('self_dj_bots')->insert([
                'user_id' => $bot->bot_owner_id ?? $room->user_id,
                'bot_id' => $bot->id, 'room_id' => $room->id,
                'playlist_id' => $room->auto_host_playlist_id,
                'managed_account' => false,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('self_dj_bots');
    }
};
