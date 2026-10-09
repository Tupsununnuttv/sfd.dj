<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A private message from one person to another. */
class Whisper extends Model
{
    protected $fillable = ['from_id', 'to_id', 'body', 'read_at'];

    /** Every whisper between these two people, either direction. */
    public function scopeBetween(Builder $query, int $a, int $b): void
    {
        $query->where(fn ($q) => $q->where('from_id', $a)->where('to_id', $b))
            ->orWhere(fn ($q) => $q->where('from_id', $b)->where('to_id', $a));
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_id');
    }

    public function payload(int $me): array
    {
        return [
            'id' => $this->id,
            'mine' => $this->from_id === $me,
            'from_id' => $this->from_id,
            'to_id' => $this->to_id,
            'body' => $this->body,
            'at' => $this->created_at->toIso8601String(),
        ];
    }
}
