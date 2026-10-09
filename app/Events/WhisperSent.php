<?php

namespace App\Events;

use App\Models\Whisper;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/** Goes to the receiver, and to the sender's other tabs. Only those two can listen on their private channels. */
class WhisperSent implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public Whisper $whisper) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('App.Models.User.'.$this->whisper->to_id), new PrivateChannel('App.Models.User.'.$this->whisper->from_id)];
    }

    public function broadcastAs(): string
    {
        return 'whisper';
    }

    public function broadcastWith(): array
    {
        $w = $this->whisper->load('sender:id,name,username,avatar');

        return [
            'id' => $w->id,
            'from_id' => $w->from_id,
            'to_id' => $w->to_id,
            'body' => $w->body,
            'at' => $w->created_at->toIso8601String(),
            'sender' => $w->sender->only('id', 'name', 'username', 'avatar'),
        ];
    }
}
