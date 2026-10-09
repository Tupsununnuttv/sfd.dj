<?php

use App\Models\Playlist;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Every step checks first, so the migration can be re-run after a half-finished attempt.
    public function up(): void
    {
        if (! Schema::hasTable('playlists')) {
            Schema::create('playlists', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('name', 60);
                $table->string('kind', 10)->default('custom'); // custom | grabs
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('playlist_songs')) {
            Schema::create('playlist_songs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('playlist_id')->constrained()->cascadeOnDelete();
                $table->string('youtube_id', 20);           // what actually plays
                $table->string('title');
                $table->string('thumbnail')->nullable();
                $table->unsignedInteger('duration')->default(0);
                $table->string('origin', 12)->default('youtube'); // youtube | soundcloud | spotify
                $table->string('origin_url')->nullable();
                $table->timestamps();

                $table->unique(['playlist_id', 'youtube_id']);
            });
        }

        // The old "Grabs" list becomes a normal playlist per user.
        if (Schema::hasTable('grabs')) {
            DB::table('grabs')->orderBy('id')->each(function ($g) {
                $playlist = Playlist::firstOrCreate(['user_id' => $g->user_id, 'kind' => 'grabs'], ['name' => 'Grabs']);
                $playlist->songs()->reorder()->firstOrCreate(['youtube_id' => $g->youtube_id], ['title' => $g->title, 'thumbnail' => $g->thumbnail]);
            });
            Schema::drop('grabs');
        }

        Schema::table('chat_messages', function (Blueprint $table) {
            foreach (['image' => fn () => $table->string('image')->nullable(),
                      'sticker' => fn () => $table->string('sticker', 16)->nullable(),
                      'reply_to_id' => fn () => $table->unsignedBigInteger('reply_to_id')->nullable()] as $column => $add) {
                if (! Schema::hasColumn('chat_messages', $column)) {
                    $add();
                }
            }
        });

        if (! Schema::hasTable('room_emojis')) {
            Schema::create('room_emojis', function (Blueprint $table) {
                $table->id();
                $table->foreignId('room_id')->constrained()->cascadeOnDelete();
                $table->string('name', 20);
                $table->string('file');
                $table->timestamps();

                $table->unique(['room_id', 'name']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('room_emojis');
        Schema::table('chat_messages', fn (Blueprint $table) => $table->dropColumn(['image', 'sticker', 'reply_to_id']));
        Schema::dropIfExists('playlist_songs');
        Schema::dropIfExists('playlists');
    }
};
