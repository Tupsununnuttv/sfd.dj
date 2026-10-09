<?php

use App\Models\RoomRole;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Every step checks first, so the migration can be re-run after a half-finished attempt.
    public function up(): void
    {
        if (! Schema::hasColumn('chat_messages', 'type')) {
            Schema::table('chat_messages', function (Blueprint $table) {
                $table->string('type', 10)->default('user');  // user | system
                $table->string('kind', 16)->nullable();       // grab, kick, ban, promote, demote, skip, remove, leave, announcement
            });
        }

        if (! Schema::hasColumn('rooms', 'background')) {
            Schema::table('rooms', fn (Blueprint $table) => $table->string('background', 16)->nullable());
        }

        if (! Schema::hasTable('votes')) {
            Schema::create('votes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('playlist_item_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('type', 5); // woot | meh | grab
                $table->timestamps();

                $table->unique(['playlist_item_id', 'user_id', 'type']);
            });
        }

        if (! Schema::hasTable('grabs')) {
            Schema::create('grabs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('youtube_id', 20);
                $table->string('title');
                $table->string('thumbnail')->nullable();
                $table->timestamps();

                $table->unique(['user_id', 'youtube_id']);
            });
        }

        if (! Schema::hasTable('room_bans')) {
            Schema::create('room_bans', function (Blueprint $table) {
                $table->id();
                $table->foreignId('room_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('banned_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->unique(['room_id', 'user_id']);
            });
        }

        // Rooms made before this change: let Co-Host, Manager and Bouncer kick/ban too.
        RoomRole::where('builtin', true)->whereIn('name', ['Co-Host', 'Manager', 'Bouncer'])->each(
            fn (RoomRole $r) => $r->update(['permissions' => array_values(array_unique([...$r->permissions, 'moderate_users']))])
        );

        // Everyone who signed up before email verification existed counts as verified.
        User::whereNull('email_verified_at')->update(['email_verified_at' => now()]);
    }

    public function down(): void
    {
        foreach (['room_bans', 'grabs', 'votes'] as $t) {
            Schema::dropIfExists($t);
        }
        Schema::table('rooms', fn (Blueprint $table) => $table->dropColumn('background'));
        Schema::table('chat_messages', fn (Blueprint $table) => $table->dropColumn(['type', 'kind']));
    }
};
