<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class UserRestrictionsChanged implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public int $userId, public array $state) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('App.Models.User.'.$this->userId)];
    }

    public function broadcastAs(): string
    {
        return 'user-restrictions-changed';
    }

    public function broadcastWith(): array
    {
        return ['user_id' => $this->userId, 'state' => $this->state];
    }
}
