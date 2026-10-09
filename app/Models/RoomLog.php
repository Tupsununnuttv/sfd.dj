<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomLog extends Model
{
    protected $fillable = ['room_id', 'actor_id', 'target_id', 'action', 'details'];

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function target(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_id');
    }
}
