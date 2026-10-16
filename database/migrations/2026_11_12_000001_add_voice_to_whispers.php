<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** A whisper can be a voice message: the recording's file (on the uploads disk, in whispers/) and how many seconds it lasts. Its `body` is empty. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('whispers', function (Blueprint $table) {
            $table->string('audio', 40)->nullable()->after('body');
            $table->unsignedSmallInteger('audio_seconds')->nullable()->after('audio');
        });
    }

    public function down(): void
    {
        Schema::table('whispers', fn (Blueprint $table) => $table->dropColumn(['audio', 'audio_seconds']));
    }
};
