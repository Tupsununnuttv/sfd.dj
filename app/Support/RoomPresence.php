<?php

namespace App\Support;

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Cache;

class RoomPresence
{
    /** Who is listening where right now: user id => the ids of the rooms they are in (one, unless they have two tabs in two rooms). Empty when Reverb is unreachable. */
    private static function locations(): array
    {
        return Cache::remember('room_user_rooms', 3, function () {
            $where = [];

            foreach (array_keys(array_filter(self::counts())) as $roomId) {
                try {
                    $res = Broadcast::connection()->getPusher()->get("/channels/presence-room.{$roomId}/users", [], true);
                    foreach ($res['users'] ?? [] as $u) {
                        $where[(int) $u['id']][] = $roomId;
                    }
                } catch (\Throwable) {
                    // that room's list is simply missing
                }
            }

            return $where;
        });
    }

    /** Where everybody who is listening right now is: user id => room id. Empty when Reverb is unreachable. */
    public static function whereIs(): array
    {
        return array_map(fn (array $rooms) => $rooms[0], self::locations());
    }

    /** Every room this person is in right now, to tell them about a change of look. */
    public static function roomsOf(int $userId): array
    {
        return self::locations()[$userId] ?? [];
    }

    /** Live listener count per room id, read from Reverb. Empty when Reverb is unreachable. */
    public static function counts(): array
    {
        // ponytail: 3s cache so many open dashboards cannot hammer Reverb
        return Cache::remember('room_listener_counts', 3, function () {
            try {
                $res = Broadcast::connection()->getPusher()->get('/channels', ['filter_by_prefix' => 'presence-room.', 'info' => 'user_count'], true);
                $counts = [];

                foreach ($res['channels'] ?? [] as $name => $info) {
                    $counts[(int) substr($name, strlen('presence-room.'))] = (int) ($info['user_count'] ?? 0);
                }

                return $counts;
            } catch (\Throwable) {
                return [];
            }
        });
    }
}
