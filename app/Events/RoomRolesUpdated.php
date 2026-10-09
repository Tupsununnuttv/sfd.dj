<?php

namespace App\Events;

use App\Models\Room;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/** Tells everyone in a room to refetch roles and who holds them. */
class RoomRolesUpdated implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public int $roomId) {}

    public function broadcastOn(): array
    {
        return Room::channelsFor($this->roomId);
    }

    public function broadcastAs(): string
    {
        return 'roles-updated';
    }
}
