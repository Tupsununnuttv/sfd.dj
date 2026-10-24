<?php

namespace App\Support;

use App\Events\RoomGuestsChanged;
use App\Models\Room;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/** Anonymous watchers use session aliases, never account ids, IP addresses or raw session ids. */
class RoomGuests
{
    public const TTL = 120;

    private static function active(array $members): array
    {
        return array_filter($members, fn ($member) => ($member['seen_at'] ?? 0) >= now()->timestamp - self::TTL);
    }

    private static function publicMembers(array $members): array
    {
        return array_values(array_map(fn ($member) => ['id' => $member['id'], 'name' => $member['name'], 'is_guest' => true], self::active($members)));
    }

    public static function members(Room $room): array
    {
        return self::publicMembers(Cache::get('room_guests:'.$room->id, []));
    }

    public static function counts(array $roomIds): array
    {
        $keys = array_map(fn ($id) => 'room_guests:'.$id, $roomIds);
        $stored = $keys ? Cache::many($keys) : [];

        return array_combine($roomIds, array_map(fn ($key) => count(self::active($stored[$key] ?? [])), $keys)) ?: [];
    }

    /** Repeated tabs share one alias; expired tabs disappear even if their final request is lost. */
    public static function heartbeat(Request $request, Room $room, bool $leave = false): array
    {
        $secret = $request->session()->get('room_guest_key');
        if (! $secret && ! $request->user() && ! $leave) {
            // Concurrent tabs can save an older session snapshot after this heartbeat.
            // A deterministic, keyed alias survives that lost field without duplicating a guest.
            $secret = hash_hmac('sha256', $request->session()->getId(), config('app.key'));
            $request->session()->put('room_guest_key', $secret);
        }
        if (! $secret) {
            return self::members($room);
        }
        $id = 'guest-'.substr(hash('sha256', $secret), 0, 12);
        $changed = false;
        try {
            $members = Cache::lock('room_guests_lock:'.$room->id, 5)->block(2, function () use ($room, $id, $request, $leave, &$changed) {
                $stored = Cache::get('room_guests:'.$room->id, []);
                $before = array_keys($stored);
                $stored = self::active($stored);
                if ($leave || $request->user()) {
                    unset($stored[$id]);
                } else {
                    $stored[$id] = ['id' => $id, 'name' => 'Guest '.strtoupper(substr($id, -6)), 'seen_at' => now()->timestamp];
                }
                $changed = $before !== array_keys($stored);
                Cache::put('room_guests:'.$room->id, $stored, self::TTL + 30);

                return self::publicMembers($stored);
            });
        } catch (LockTimeoutException) {
            return self::members($room);
        }
        if ($changed) {
            RoomGuestsChanged::dispatch($room->id, $members);
        }

        return $members;
    }
}
