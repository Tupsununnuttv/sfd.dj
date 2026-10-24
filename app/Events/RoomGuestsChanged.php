<?php

namespace App\Events;

use App\Models\Room;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class RoomGuestsChanged implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public int $roomId, public array $guests) {}

    public function broadcastOn(): array
    {
        return Room::channelsFor($this->roomId);
    }

    public function broadcastAs(): string
    {
        return 'room-guests';
    }

    public function broadcastWith(): array
    {
        return ['guests' => $this->guests];
    }
}
