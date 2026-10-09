<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoomEmoji extends Model
{
    protected $table = 'room_emojis'; // "emoji" is uncountable, so Laravel would guess room_emoji

    protected $fillable = ['room_id', 'name', 'file'];

    public function url(): string
    {
        return route('media.emoji', $this->file);
    }
}
