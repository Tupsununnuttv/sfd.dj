<?php

namespace App\Events;

use App\Models\Room;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/** The room's settings changed (name, scene, rules, its own CSS ...): everybody in the room, guests too, reads them again. */
class RoomUpdated implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public int $roomId) {}

    public function broadcastOn(): array
    {
        return Room::channelsFor($this->roomId);
    }

    public function broadcastAs(): string
    {
        return 'room-updated';
    }
}
