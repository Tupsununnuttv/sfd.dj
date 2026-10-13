<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('youtube_channel_id', 64)->nullable()->index();
            $table->string('youtube_channel_title')->nullable();
            $table->text('youtube_access_token')->nullable();
            $table->text('youtube_refresh_token')->nullable();
            $table->timestamp('youtube_token_expires_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'youtube_channel_id',
                'youtube_channel_title',
                'youtube_access_token',
                'youtube_refresh_token',
                'youtube_token_expires_at',
            ]);
        });
    }
};
