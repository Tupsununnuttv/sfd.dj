<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['twitch', 'tiktok'] as $provider) {
                $table->string("{$provider}_id")->nullable()->unique();
                $table->string("{$provider}_display_name")->nullable();
                $table->text("{$provider}_access_token")->nullable();
                $table->text("{$provider}_refresh_token")->nullable();
                $table->timestamp("{$provider}_token_expires_at")->nullable();
            }
            $table->string('twitch_login')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['twitch', 'tiktok'] as $provider) {
                $table->dropUnique(["{$provider}_id"]);
                $table->dropColumn(array_map(fn ($field) => "{$provider}_{$field}", ['id', 'display_name', 'access_token', 'refresh_token', 'token_expires_at']));
            }
            $table->dropColumn('twitch_login');
        });
    }
};
