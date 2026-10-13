<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportMessage extends Model
{
    protected $fillable = ['support_ticket_id', 'sender', 'staff_id', 'body'];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function payload(): array
    {
        return [
            'id' => $this->id,
            'sender' => $this->sender,
            'who' => $this->sender === 'staff' ? ($this->staff?->name ?? 'SFD-DJ.EU Support') : null,
            'body' => $this->body,
            'at' => $this->created_at->toIso8601String(),
        ];
    }
}
