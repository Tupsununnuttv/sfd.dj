<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/** A community event: a title, a time and optionally the room it happens in. */
class SiteEvent extends Model
{
    protected $fillable = ['title', 'description', 'starts_at', 'ends_at', 'room_id', 'created_by'];

    protected function casts(): array
    {
        return ['starts_at' => 'datetime', 'ends_at' => 'datetime'];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function attendees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'site_event_attendees');
    }
}
