<?php

namespace App\Support;

use App\Models\Room;
use App\Models\User;
use Illuminate\Support\Collection;

/** Who is around right now: listening in a room, or active in the last minutes. Respects the "show my online status" privacy setting. */
class Presence
{
    /** @return array{where: array<int,int>, rooms: Collection} user id => room id, and the rooms the viewer may see */
    public static function snapshot(?User $viewer): array
    {
        $where = RoomPresence::whereIs();

        return [
            'where' => $where,
            'rooms' => Room::visibleTo($viewer)->whereIn('id', array_values(array_unique($where)))->get(['id', 'name', 'slug'])->keyBy('id'),
        ];
    }

    /** online, last_seen_at, room and status for one person. Somebody who hides their status (or chose to be offline) always looks offline and never seen. */
    public static function of(User $user, array $snapshot): array
    {
        if ($user->shownStatus() === 'offline') {
            return ['online' => false, 'last_seen_at' => null, 'room' => null, 'hidden' => true, 'status' => 'offline'];
        }

        $roomId = $snapshot['where'][$user->id] ?? null;

        return [
            'online' => $roomId !== null || ($user->last_seen_at?->gt(now()->subMinutes(5)) ?? false),
            'last_seen_at' => $user->last_seen_at?->toIso8601String(),
            'room' => $roomId !== null && isset($snapshot['rooms'][$roomId]) ? $snapshot['rooms'][$roomId]->only('name', 'slug') : null,
            'hidden' => false,
            'status' => $user->shownStatus(),
        ];
    }
}
