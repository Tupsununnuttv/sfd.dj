<?php

namespace App\Models;

use App\Events\MessageSent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ChatMessage extends Model
{
    /** Columns of the sender needed to show their badges. Roles and XP must be here or everyone looks like a Member. */
    public const WITH_USER = 'user:id,name,avatar,roles,awards,xp,cosmetics,is_bot,plan,plan_until';

    protected $fillable = ['room_id', 'user_id', 'body', 'type', 'kind', 'image', 'sticker', 'reply_to_id'];

    public const REACTIONS = ['❤️', '😂', '🔥', '👏', '👍', '😮', '😢', '🎵'];

    public function reactionSummary(): array
    {
        return ($this->relationLoaded('reactions') ? $this->reactions : $this->reactions()->get())
            ->groupBy('emoji')->map(fn ($rows, $emoji) => ['emoji' => $emoji, 'users' => $rows->pluck('user_id')->map(fn ($id) => (int) $id)->values()->all()])->values()->all();
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(ChatReaction::class)->orderBy('id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reply_to_id');
    }

    /** A line in chat written by the system (grabs, kicks, role changes, ...). `$actor` is who caused it. */
    public static function system(Room $room, string $kind, string $body, User $actor): self
    {
        $message = static::create(['room_id' => $room->id, 'user_id' => $actor->id, 'body' => $body, 'type' => 'system', 'kind' => $kind]);
        MessageSent::dispatch($message->load(self::WITH_USER));

        return $message;
    }

    public function payload(): array
    {
        $reply = $this->reply_to_id ? $this->replyTo : null;

        return [
            'id' => $this->id,
            'reactions' => $this->type === 'user' ? $this->reactionSummary() : [],
            'created_at' => $this->created_at->toIso8601String(),
            'type' => $this->type,
            'kind' => $this->kind,
            'body' => $this->body,
            'user' => $this->user->name,
            'user_id' => $this->user_id,
            'avatar' => $this->user->avatar,
            'cosmetics' => $this->user->cosmetics,
            'role' => $this->user->primary_role,
            'badges' => $this->user->badges,
            'level' => $this->user->level,
            'sticker' => $this->sticker,
            // GIFs are stored as their https address, uploads as a file name served by MediaController
            'image_url' => $this->image ? (str_starts_with($this->image, 'https://') ? $this->image : route('media.chat', $this->image)) : null,
            'reply' => $this->reply_to_id
                ? ['id' => $this->reply_to_id, 'user' => $reply?->user->name, 'body' => $reply ? Str::limit($reply->body ?: ($reply->sticker ?: 'a picture'), 80) : null]
                : null,
        ];
    }
}
