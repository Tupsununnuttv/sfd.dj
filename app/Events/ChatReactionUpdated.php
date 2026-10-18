<?php

namespace App\Events;

use App\Models\Room;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class ChatReactionUpdated implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public int $roomId, public int $id, public array $reactions) {}

    public function broadcastOn(): array
    {
        return Room::channelsFor($this->roomId);
    }

    public function broadcastAs(): string
    {
        return 'chat-reaction';
    }

    public function broadcastWith(): array
    {
        return ['id' => $this->id, 'reactions' => $this->reactions];
    }
}
