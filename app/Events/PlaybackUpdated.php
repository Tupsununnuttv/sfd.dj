<?php

namespace App\Events;

use App\Models\Room;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class PlaybackUpdated implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public Room $room) {}

    public function broadcastOn(): array
    {
        return Room::channelsFor($this->room->id);
    }

    public function broadcastAs(): string
    {
        return 'playback';
    }

    public function broadcastWith(): array
    {
        return $this->room->playback();
    }
}
