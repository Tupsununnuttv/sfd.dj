<?php

namespace App\Events;

use App\Models\Room;
use App\Models\ChatMessage;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public ChatMessage $message) {}

    public function broadcastOn(): array
    {
        return Room::channelsFor($this->message->room_id);
    }

    public function broadcastAs(): string
    {
        return 'message';
    }

    public function broadcastWith(): array
    {
        return $this->message->payload();
    }
}
