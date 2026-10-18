<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class WhisperDeleted implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public int $id, public array $userIds) {}

    public function broadcastOn(): array
    {
        return array_map(fn ($id) => new PrivateChannel('App.Models.User.'.$id), $this->userIds);
    }

    public function broadcastAs(): string
    {
        return 'whisper-deleted';
    }

    public function broadcastWith(): array
    {
        return ['id' => $this->id];
    }
}
