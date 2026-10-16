<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** A whisper can answer an earlier whisper of the same conversation (like a reply in room chat). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('whispers', function (Blueprint $table) {
            $table->unsignedBigInteger('reply_to_id')->nullable()->after('audio_seconds');
        });
    }

    public function down(): void
    {
        Schema::table('whispers', fn (Blueprint $table) => $table->dropColumn('reply_to_id'));
    }
};
