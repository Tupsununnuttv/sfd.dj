<?php

namespace App\Models;

use App\Events\RoomBotPresenceChanged;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RoomBotPresence extends Model
{
    public const TTL_SECONDS = 90;

    private const BROADCAST_INTERVAL_SECONDS = 30;

    public $timestamps = false;

    protected $fillable = ['room_id', 'user_id', 'last_seen_at', 'last_broadcast_at'];

    protected function casts(): array
    {
        return ['last_seen_at' => 'immutable_datetime', 'last_broadcast_at' => 'immutable_datetime'];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function touchFor(Room $room, User $bot): void
    {
        $presence = self::query()->firstOrNew(['room_id' => $room->id, 'user_id' => $bot->id]);
        $now = now();
        $broadcast = ! $presence->exists || ! $presence->last_broadcast_at || $presence->last_broadcast_at->lt($now->copy()->subSeconds(self::BROADCAST_INTERVAL_SECONDS));
        $presence->last_seen_at = $presence->last_seen_at?->isFuture() ? $presence->last_seen_at : $now; // an Auto Host bot is held in the room (hold): a call of its own does not cut that short
        if ($broadcast) {
            $presence->last_broadcast_at = $now;
        }
        $presence->save();

        if ($broadcast) {
            RoomBotPresenceChanged::dispatch($room->id, self::memberInfo($bot, $now), true);
        }
    }

    /** Keep a bot in the room with no check-ins of its own: the Auto Host, which the site runs itself. It stays until leave(). */
    public static function hold(Room $room, User $bot): void
    {
        $until = now()->addYears(10);
        self::query()->updateOrCreate(['room_id' => $room->id, 'user_id' => $bot->id], ['last_seen_at' => $until, 'last_broadcast_at' => now()]);
        RoomBotPresenceChanged::dispatch($room->id, self::memberInfo($bot, $until), true);
    }

    public static function leave(Room $room, User $bot): void
    {
        $presence = self::query()->where('room_id', $room->id)->where('user_id', $bot->id)->first();
        if (! $presence) {
            return;
        }

        $member = self::memberInfo($bot, $presence->last_seen_at);
        DB::table('room_bot_presences')->where('room_id', $room->id)->where('user_id', $bot->id)->delete();
        RoomBotPresenceChanged::dispatch($room->id, $member, false);
    }

    /** @return Collection<int, array<string, mixed>> */
    public static function activeMembers(Room $room): Collection
    {
        return self::query()->where('room_id', $room->id)
            ->where('last_seen_at', '>=', now()->subSeconds(self::TTL_SECONDS))
            ->with('user')
            ->get()
            ->map(fn (self $presence) => self::memberInfo($presence->user, $presence->last_seen_at))
            ->values();
    }

    /** @return array<string, mixed> */
    private static function memberInfo(User $bot, mixed $seenAt): array
    {
        return $bot->presenceInfo() + [
            'is_bot' => true,
            'bot_seen_at' => $seenAt?->toIso8601String(),
        ];
    }
}
