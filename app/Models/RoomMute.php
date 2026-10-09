<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomMute extends Model
{
    protected $fillable = ['room_id', 'user_id', 'muted_by', 'until'];

    protected function casts(): array
    {
        return ['until' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeActive($query): void
    {
        $query->where(fn ($q) => $q->whereNull('until')->orWhere('until', '>', now()));
    }
}
