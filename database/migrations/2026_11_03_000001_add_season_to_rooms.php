<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What the host chose for a special season (App\Support\Season): `season` is which run of it ("halloween-2026"), `season_background` the background of
 * that season they picked, or null when they switched the season off in their room. A choice for an older run is forgotten by itself.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->string('season', 24)->nullable();
            $table->string('season_background', 24)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('rooms', fn (Blueprint $table) => $table->dropColumn(['season', 'season_background']));
    }
};
