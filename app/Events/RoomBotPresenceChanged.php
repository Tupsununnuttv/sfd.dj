<?php

namespace App\Events;

use App\Models\Room;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class RoomBotPresenceChanged implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public int $roomId, public array $member, public bool $online) {}

    public function broadcastOn(): array
    {
        return Room::channelsFor($this->roomId);
    }

    public function broadcastAs(): string
    {
        return 'room-bot-presence';
    }

    public function broadcastWith(): array
    {
        return $this->member + ['online' => $this->online];
    }
}
