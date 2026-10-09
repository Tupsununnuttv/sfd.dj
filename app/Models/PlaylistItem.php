<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlaylistItem extends Model
{
    protected $fillable = ['room_id', 'user_id', 'youtube_id', 'title', 'thumbnail', 'duration', 'position', 'played_at', 'playlist_song_id'];

    protected function casts(): array
    {
        return ['played_at' => 'datetime'];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
