<?php

namespace App\Events;

use App\Models\Friendship;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class FriendRequested implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public Friendship $friendship) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('App.Models.User.'.$this->friendship->friend_id);
    }

    public function broadcastAs(): string
    {
        return 'friend-requested';
    }

    public function broadcastWith(): array
    {
        $sender = $this->friendship->sender;

        return ['id' => $this->friendship->id, 'user_id' => $sender->id, 'name' => $sender->name, 'avatar' => $sender->avatar];
    }
}
