<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whisper_calls', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('caller_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('callee_id')->constrained('users')->cascadeOnDelete();
            $table->boolean('video')->default(false);
            $table->string('status')->default('ringing');
            $table->text('offer')->nullable();
            $table->text('answer')->nullable();
            $table->timestamp('caller_seen');
            $table->timestamp('callee_seen')->nullable();
            $table->timestamps();
            $table->index(['caller_id', 'status']);
            $table->index(['callee_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whisper_calls');
    }
};
