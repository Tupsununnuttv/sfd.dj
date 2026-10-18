<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/** A whisper group got people, lost people or was renamed: everybody concerned (the members, and the one who has just gone) reads their list again. `removed` is who has gone, if somebody has. */
class WhisperGroupChanged implements ShouldBroadcastNow
{
    use Dispatchable;

    /** @param  array<int, int>  $userIds */
    public function __construct(public int $groupId, public array $userIds, public ?int $removed = null, public bool $deleted = false) {}

    public function broadcastOn(): array
    {
        return array_map(fn ($id) => new PrivateChannel('App.Models.User.'.$id), $this->userIds);
    }

    public function broadcastAs(): string
    {
        return 'whisper-group';
    }

    public function broadcastWith(): array
    {
        return ['group_id' => $this->groupId, 'removed' => $this->removed, 'deleted' => $this->deleted];
    }
}
