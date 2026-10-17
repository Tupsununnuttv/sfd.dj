<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SelfDjBot extends Model
{
    protected $fillable = ['user_id', 'bot_id', 'room_id', 'playlist_id', 'managed_account'];

    protected function casts(): array
    {
        return ['managed_account' => 'boolean', 'bot_id' => 'integer', 'playlist_id' => 'integer'];
    }

    public function bot(): BelongsTo
    {
        return $this->belongsTo(User::class, 'bot_id');
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function playlist(): BelongsTo
    {
        return $this->belongsTo(Playlist::class);
    }

    public function scopeVisibleTo(Builder $query, User $user): void
    {
        if (! $user->is_staff) {
            $query->where(fn (Builder $q) => $q->where('user_id', $user->id)->orWhereHas('room', fn (Builder $r) => $r->where('user_id', $user->id)));
        }
    }

    /** The room is the source of truth, so kicks, bans and the legacy controls also pause this bot. */
    public function enabled(): bool
    {
        return $this->playlist_id !== null && $this->room->auto_host_bot_id === $this->bot_id
            && $this->room->auto_host_playlist_id === $this->playlist_id;
    }
}
