<?php

namespace App\Events;

use App\Models\Whisper;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Support\Facades\DB;

/** Goes to the receiver, and to the sender's other tabs; a whisper to a group goes to every member. Only those people can listen on their private channels. */
class WhisperSent implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public Whisper $whisper) {}

    public function broadcastOn(): array
    {
        $people = $this->whisper->group_id
            ? DB::table('whisper_group_user')->where('group_id', $this->whisper->group_id)->pluck('user_id')->all()
            : [$this->whisper->to_id, $this->whisper->from_id];

        return array_map(fn ($id) => new PrivateChannel('App.Models.User.'.$id), $people);
    }

    public function broadcastAs(): string
    {
        return 'whisper';
    }

    public function broadcastWith(): array
    {
        $w = $this->whisper->load('sender:id,name,username,avatar', 'replyTo', 'group:id,name');

        return [
            'id' => $w->id,
            'from_id' => $w->from_id,
            'to_id' => $w->to_id,
            'group_id' => $w->group_id,
            'group' => $w->group?->only('id', 'name'),
            'from' => $w->group_id ? $w->sender->only('id', 'name', 'username', 'avatar') : null,
            'body' => $w->body,
            'voice' => $w->voicePayload(),
            'reply' => $w->replyPayload(),
            'at' => $w->created_at->toIso8601String(),
            'sender' => $w->sender->only('id', 'name', 'username', 'avatar'),
        ];
    }
}
