<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

/**
 * Friends who whisper together. The owner adds and removes people and renames it, everybody can leave. A whisper to the group is a `whispers` row with
 * its `group_id` (and no `to_id`). Somebody who joins later reads nothing from before: `since_id` on their membership marks where their share starts,
 * `read_id` how far they have read (the red number).
 */
class WhisperGroup extends Model
{
    /** The owner counts. */
    public const MAX_MEMBERS = 20;

    /** Groups one person may own at the same time. */
    public const MAX_OWNED = 10;

    protected $fillable = ['name', 'owner_id'];

    protected static function booted(): void
    {
        // the whispers go one by one, so the recordings go with them
        static::deleting(function (WhisperGroup $group) {
            $group->whispers()->get()->each->delete();
            $group->members()->detach();
        });
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /** Longest-standing first. */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'whisper_group_user', 'group_id', 'user_id')->withPivot('since_id', 'read_id')->withTimestamps()
            ->orderBy('whisper_group_user.created_at')->orderBy('users.id');
    }

    public function whispers(): HasMany
    {
        return $this->hasMany(Whisper::class, 'group_id');
    }

    /** The whispers the person this group was loaded through (`User::whisperGroups`) may read: those written after they joined. */
    public function readable(): HasMany
    {
        return $this->whispers()->where('id', '>', (int) $this->pivot?->since_id);
    }

    /** Put people in. What was written before stays hidden from them, and is not a red number either. */
    public function admit(iterable $users): void
    {
        $since = (int) $this->whispers()->max('id');

        foreach ($users as $user) {
            $this->members()->attach($user->id, ['since_id' => $since, 'read_id' => $since]);
        }
    }

    /** Somebody goes (they left, or the owner removed them). The longest-standing member becomes the owner when the owner goes, and with nobody left the group ends. */
    public function release(User $user): void
    {
        $this->members()->detach($user->id);

        if ($this->members()->doesntExist()) {
            $this->delete();
        } elseif ($this->owner_id === $user->id) {
            $this->update(['owner_id' => $this->members()->value('users.id')]);
        }
    }

    /** They have seen everything written so far. */
    public function markReadBy(User $user): void
    {
        $this->members()->updateExistingPivot($user->id, ['read_id' => (int) $this->whispers()->max('id')]);
    }

    /** What each of their groups has written that they have not read: [group id => how many]. Their own whispers do not count. */
    public static function unreadCounts(User $user): Collection
    {
        return Whisper::query()
            ->join('whisper_group_user as m', fn ($join) => $join->on('m.group_id', '=', 'whispers.group_id')->where('m.user_id', $user->id))
            ->where('whispers.from_id', '!=', $user->id)
            ->whereColumn('whispers.id', '>', 'm.read_id')
            ->groupBy('whispers.group_id')
            ->selectRaw('whispers.group_id as group_id, count(*) as n')
            ->pluck('n', 'group_id');
    }

    /** What a list or a header shows (load `members` first). */
    public function summary(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'owner_id' => $this->owner_id,
            'members' => $this->members->map->only('id', 'name', 'username', 'avatar')->values(),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
