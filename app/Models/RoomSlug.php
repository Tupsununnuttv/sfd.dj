<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** An address a room used to have (its web address follows its name). It keeps working and sends people to the room's current address, and no other room may take it. */
class RoomSlug extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['room_id', 'slug'];

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
