<?php

namespace App\Support;

use App\Models\Room;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Cache;
use Pusher\ApiErrorException;

class RoomPresence
{
    /** Unique human listeners across rooms. null means the presence service could not be checked. */
    public static function listenerCount(): ?int
    {
        $snapshot = Cache::remember('site_listener_snapshot', 3, function () {
            try {
                $pusher = Broadcast::connection()->getPusher();
                $channels = $pusher->get('/channels', ['filter_by_prefix' => 'presence-room.', 'info' => 'user_count'], true);
                if (! isset($channels['channels'])) {
                    return ['count' => null];
                }
                $ids = [];
                foreach ($channels['channels'] as $name => $info) {
                    if (! preg_match('/^presence-room\.\d+$/', $name) || (int) ($info['user_count'] ?? 0) === 0) {
                        continue;
                    }
                    $members = $pusher->get('/channels/'.$name.'/users', [], true);
                    if (! isset($members['users'])) {
                        return ['count' => null];
                    }
                    foreach ($members['users'] as $member) {
                        $ids[(int) $member['id']] = true;
                    }
                }

                return ['count' => User::where('is_bot', false)->whereKey(array_keys($ids))->count()];
            } catch (\Throwable) {
                return ['count' => null];
            }
        });

        return $snapshot['count'];
    }

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

    /**
     * The ids of the people in one room right now, asked fresh (no cache): for taking somebody who has left out of the waitlist.
     * An empty list when nobody is there; null when it cannot be known (the live server does not answer), and then nobody should be taken out.
     */
    public static function idsIn(Room $room): ?array
    {
        try {
            $response = Broadcast::connection()->getPusher()->get("/channels/presence-room.{$room->id}/users", [], true);
        } catch (ApiErrorException $e) {
            return $e->getCode() === 404 ? [] : null; // 404: nobody is in the channel
        } catch (\Throwable) {
            return null;
        }

        return is_array($response['users'] ?? null) ? array_map(fn ($user) => (int) $user['id'], $response['users']) : null;
    }

    /** The privacy-visible participants in one room, for guests watching its public view. */
    public static function membersIn(Room $room): array
    {
        $ids = Cache::remember('room_presence_members:'.$room->id, 5, function () use ($room): array {
            try {
                $response = Broadcast::connection()->getPusher()->get("/channels/presence-room.{$room->id}/users", [], true);

                return collect($response['users'] ?? [])->pluck('id')->map(fn ($id) => (int) $id)->all();
            } catch (\Throwable) {
                return [];
            }
        });

        return User::query()->whereKey($ids)->get()
            ->filter(fn (User $user) => $user->shownStatus() !== 'offline')
            ->map(fn (User $user) => $user->presenceInfo())
            ->values()
            ->all();
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
