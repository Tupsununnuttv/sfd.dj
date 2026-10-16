<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Whisper groups: friends who whisper together. A whisper to a group is a `whispers` row with a `group_id` and no single receiver. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whisper_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name', 40);
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('whisper_group_user', function (Blueprint $table) {
            $table->foreignId('group_id')->constrained('whisper_groups')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('since_id')->default(0); // whispers up to this one were written before they came: they never see them
            $table->unsignedBigInteger('read_id')->default(0); // the last whisper they have read
            $table->timestamps();
            $table->primary(['group_id', 'user_id']);
            $table->index('user_id');
        });

        Schema::table('whispers', function (Blueprint $table) {
            $table->unsignedBigInteger('to_id')->nullable()->change();
            $table->unsignedBigInteger('group_id')->nullable()->after('to_id'); // ponytail: no foreign key (SQLite cannot add one here); WhisperGroup deletes its whispers itself
            $table->index(['group_id', 'id']);
        });
    }

    public function down(): void
    {
        DB::table('whispers')->whereNotNull('group_id')->delete(); // without a receiver they cannot stay once `to_id` is required again

        Schema::table('whispers', function (Blueprint $table) {
            $table->dropIndex(['group_id', 'id']);
            $table->dropColumn('group_id');
            $table->unsignedBigInteger('to_id')->nullable(false)->change();
        });
        Schema::dropIfExists('whisper_group_user');
        Schema::dropIfExists('whisper_groups');
    }
};
