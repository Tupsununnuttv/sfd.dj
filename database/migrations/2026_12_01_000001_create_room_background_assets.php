<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_background_assets', function (Blueprint $table) {
            $table->foreignId('room_id')->primary()->constrained()->cascadeOnDelete();
            $table->string('name', 64)->unique();
            $table->string('mime', 32);
            $table->string('checksum', 64);
            // Base64 is portable across SQLite, MySQL and PostgreSQL; upload size remains capped at 4 MB.
            $table->longText('content');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_background_assets');
    }
};
