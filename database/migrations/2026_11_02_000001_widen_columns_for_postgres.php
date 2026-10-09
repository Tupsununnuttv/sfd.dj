<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The live site runs on Postgres, which (unlike SQLite) holds every column to its length. Four were shorter than what the site stores:
 * an uploaded profile photo is "img:" and a 24-letter name (avatar was 16), a bio may be 500 long (it was 200), a Tenor GIF link up to 400
 * (the chat image was 255) and a pasted song link up to 300 (origin_url was 255).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar', 64)->nullable()->change();
            $table->string('bio', 500)->nullable()->change();
        });
        Schema::table('chat_messages', fn (Blueprint $table) => $table->string('image', 500)->nullable()->change());
        Schema::table('playlist_songs', fn (Blueprint $table) => $table->string('origin_url', 500)->nullable()->change());
    }

    public function down(): void
    {
        // shorter columns would cut what is stored in them now
    }
};
