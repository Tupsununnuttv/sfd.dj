<?php

namespace App\Events;

use App\Models\Room;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/** Somebody wooted, meh'd or grabbed the song that is playing: every browser in the room (guests too) writes a line about it in the chat. It is never stored. */
class VoteCast implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public int $roomId, public int $userId, public string $name, public string $type, public ?array $appearance = null) {}

    public function broadcastOn(): array
    {
        return Room::channelsFor($this->roomId);
    }

    public function broadcastAs(): string
    {
        return 'vote-cast';
    }

    public function broadcastWith(): array
    {
        return ['user_id' => $this->userId, 'name' => $this->name, 'type' => $this->type] + ($this->appearance ? ['appearance' => $this->appearance] : []);
    }
}
