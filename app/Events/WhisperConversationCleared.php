<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class WhisperConversationCleared implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public int $userId, public int $otherId, public int $throughId) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('App.Models.User.'.$this->userId)];
    }

    public function broadcastAs(): string
    {
        return 'whisper-conversation-cleared';
    }

    public function broadcastWith(): array
    {
        return ['user_id' => $this->otherId, 'through_id' => $this->throughId];
    }
}
