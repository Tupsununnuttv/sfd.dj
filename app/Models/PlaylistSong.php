<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlaylistSong extends Model
{
    protected $fillable = ['playlist_id', 'youtube_id', 'title', 'channel', 'thumbnail', 'duration', 'origin', 'origin_url', 'position'];

    /** After it has been played a song waits at the end of its list, so the next turn plays the next song. */
    public function sendToBottom(): void
    {
        $this->update(['position' => (static::where('playlist_id', $this->playlist_id)->max('position') ?? 0) + 1]);
    }
}
