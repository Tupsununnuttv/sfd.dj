<?php

namespace App\Events;

use App\Models\Room;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class MessageDeleted implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public int $roomId, public int $messageId) {}

    public function broadcastOn(): array
    {
        return Room::channelsFor($this->roomId);
    }

    public function broadcastAs(): string
    {
        return 'message-deleted';
    }

    public function broadcastWith(): array
    {
        return ['id' => $this->messageId];
    }
}
