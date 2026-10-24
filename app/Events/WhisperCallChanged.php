<?php

namespace App\Events;

use App\Models\WhisperCall;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/** Wake only the participants; SDP and call details remain behind the authenticated endpoint. */
class WhisperCallChanged implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public WhisperCall $call) {}

    public function broadcastOn(): array
    {
        return array_map(fn ($id) => new PrivateChannel('App.Models.User.'.$id), [$this->call->caller_id, $this->call->callee_id]);
    }

    public function broadcastAs(): string
    {
        return 'whisper-call-changed';
    }

    public function broadcastWith(): array
    {
        return ['id' => $this->call->id];
    }
}
