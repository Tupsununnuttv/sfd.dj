<?php

namespace App\Events;

use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/** Tells the named user's browser to leave the room (kick) and stay out (ban). */
class UserKicked implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public int $roomId, public int $userId, public bool $banned) {}

    public function broadcastOn(): PresenceChannel
    {
        return new PresenceChannel('room.'.$this->roomId);
    }

    public function broadcastAs(): string
    {
        return 'user-kicked';
    }

    public function broadcastWith(): array
    {
        return ['user_id' => $this->userId, 'banned' => $this->banned];
    }
}
