<?php

namespace App\Events;

use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/** Somebody in the room changed how they look (picture, shop items, flag, status ...): everybody in the room draws them again, so nobody has to refresh. */
class UserUpdated implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public int $roomId, public array $member) {}

    public function broadcastOn(): PresenceChannel
    {
        return new PresenceChannel('room.'.$this->roomId);
    }

    public function broadcastAs(): string
    {
        return 'user-updated';
    }

    public function broadcastWith(): array
    {
        return $this->member;
    }
}
