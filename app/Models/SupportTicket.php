<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/** One live-support conversation, started by a visitor (usually on the login page, so often without an account). */
class SupportTicket extends Model
{
    public const MAX_MESSAGES = 200;

    protected $fillable = ['name', 'email', 'status', 'last_message_at'];

    protected function casts(): array
    {
        return ['last_message_at' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::creating(fn (self $t) => $t->token = Str::random(40));
    }

    public function messages(): HasMany
    {
        return $this->hasMany(SupportMessage::class)->orderBy('id');
    }

    /** Add a line to the chat and tell the right browsers (see SupportMessageSent). */
    public function say(string $sender, string $body, ?User $staff = null): SupportMessage
    {
        $message = $this->messages()->create(['sender' => $sender, 'staff_id' => $staff?->id, 'body' => $body]);
        $this->forceFill(['last_message_at' => now(), 'status' => 'open'])->save();
        \App\Events\SupportMessageSent::dispatch($this, $message);

        return $message;
    }

    /** What the staff inbox shows for this conversation. */
    public function summary(): array
    {
        $last = $this->messages()->reorder('id', 'desc')->first();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'status' => $this->status,
            'last_message_at' => $this->last_message_at?->toIso8601String(),
            'preview' => $last ? Str::limit($last->body, 70) : '',
            'waiting' => $this->status === 'open' && $last?->sender === 'visitor', // the visitor spoke last
        ];
    }
}
