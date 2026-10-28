<?php

namespace App\Support;

use App\Models\Room;
use App\Models\User;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use JsonException;

/** A bounded annual hunt: every pumpkin and the completion bonus pay once per account. */
final class PumpkinHunt
{
    public const TOTAL = 20;

    public const PER_PUMPKIN = 5;

    public const COMPLETION_BONUS = 150;

    public const PAGES = ['dashboard', 'community', 'events', 'playlists', 'shop', 'faq', 'docs', 'patch-notes', 'history'];

    private const LOCATIONS = [
        'dashboard' => ['label' => 'Rooms', 'ids' => [1, 2, 3, 4]],
        'community' => ['label' => 'Community', 'ids' => [5, 6, 7, 8]],
        'events' => ['label' => 'Events', 'ids' => [9, 10, 11, 12]],
        'shop' => ['label' => 'Avatar shop', 'ids' => [13, 14, 15, 16]],
        'playlists' => ['label' => 'Playlists', 'ids' => [17, 18, 19, 20]],
    ];

    private const PAGE_ALIASES = ['history' => 'dashboard', 'faq' => 'community', 'docs' => 'events', 'patch-notes' => 'shop'];

    public static function current(): ?array
    {
        if (! config('pumpkin-hunt.enabled', true)) return null;

        $now = now();
        $start = Carbon::parse($now->year.'-'.config('pumpkin-hunt.starts_on', '10-20'), $now->timezone)->startOfDay();
        $end = Carbon::parse($now->year.'-'.config('pumpkin-hunt.ends_before', '11-08'), $now->timezone)->startOfDay();

        return $now->gte($start) && $now->lt($end)
            ? ['id' => 'halloween-'.$now->year, 'ends_at' => $end->toIso8601String()]
            : null;
    }

    /** A completed hunt stays visible on the profile after its season has ended. */
    public static function bestProgress(User $user): int
    {
        return (int) (DB::table('pumpkin_hunt_claims')->where('user_id', $user->id)
            ->selectRaw('COUNT(*) AS found')->groupBy('season')->get()->max('found') ?? 0);
    }

    public static function payload(User $user, ?string $page = null, ?Room $room = null): array
    {
        if ($page !== null) self::ensurePage($page);
        if ($room) self::ensureRoomAccess($user, $room);

        $season = self::current();
        $active = $season !== null && $user->exists && ! $user->is_bot;
        $collected = $active ? DB::table('pumpkin_hunt_claims')->where('user_id', $user->id)
            ->where('season', $season['id'])->orderBy('pumpkin_id')->pluck('pumpkin_id')->map(fn ($id) => (int) $id)->all() : [];
        $ids = $active ? self::idsFor($user, $season['id'], $page, $room) : [];

        return [
            'active' => $active,
            'season' => $season['id'] ?? null,
            'ends_at' => $season['ends_at'] ?? null,
            'total' => self::TOTAL,
            'found' => count($collected),
            'collected' => $collected,
            'per_pumpkin' => self::PER_PUMPKIN,
            'completion_bonus' => self::COMPLETION_BONUS,
            'coins' => (int) $user->coins,
            // Keep the four placement slots stable when a collected pumpkin disappears.
            'encounter_ids' => array_values($ids),
            'pumpkins' => array_values(array_map(fn (int $id) => [
                'id' => $id,
                'token' => self::token($user, $season['id'], $id, $page, $room),
                'seed' => self::seed($user, $season['id'], 'pumpkin:'.$id),
            ], array_diff($ids, $collected))),
            'locations' => array_map(fn (string $key, array $location) => [
                'page' => $key,
                'label' => $location['label'],
                'found' => count(array_intersect($collected, $location['ids'])),
                'total' => count($location['ids']),
            ], array_keys(self::LOCATIONS), array_values(self::LOCATIONS)),
        ];
    }

    public static function claim(User $user, string $token): array
    {
        abort_if($user->is_bot, 403, 'Bots cannot collect hunt rewards.');
        try {
            $proof = json_decode(Crypt::decryptString($token), true, 16, JSON_THROW_ON_ERROR);
        } catch (DecryptException|JsonException) {
            throw ValidationException::withMessages(['token' => 'This pumpkin could not be verified. Refresh the page and try again.']);
        }

        if (! is_array($proof) || ($proof['version'] ?? null) !== 1 || ! is_int($proof['pumpkin_id'] ?? null)
            || ! is_int($proof['user_id'] ?? null) || ! is_string($proof['season'] ?? null)
            || ! is_int($proof['expires_at'] ?? null) || ! array_key_exists('page', $proof) || ! array_key_exists('room_id', $proof)) {
            throw ValidationException::withMessages(['token' => 'This pumpkin could not be verified. Refresh the page and try again.']);
        }

        abort_unless($proof['user_id'] === $user->id, 403, 'This pumpkin belongs to another hunter.');
        abort_if($proof['expires_at'] <= now()->timestamp, 409, 'This pumpkin needs a fresh page. Refresh and try again.');
        $page = $proof['page'];
        $roomId = $proof['room_id'];
        if (($page !== null && ! is_string($page)) || ($roomId !== null && ! is_int($roomId)) || ($page !== null && $roomId !== null)) {
            throw ValidationException::withMessages(['token' => 'This pumpkin could not be verified.']);
        }
        if ($page !== null) self::ensurePage($page);

        return DB::transaction(function () use ($user, $proof, $page, $roomId) {
            // Serialize every claim for an account before checking its claims or paying any coins.
            // SQLite ignores FOR UPDATE; acquire its writer lock before opening a read snapshot.
            if (DB::connection()->getDriverName() === 'sqlite') {
                DB::table('users')->where('id', $user->id)->update(['coins' => DB::raw('coins')]);
            }
            $hunter = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            abort_if($hunter->is_bot, 403, 'Bots cannot collect hunt rewards.');
            $season = self::current();
            abort_unless($season && $proof['season'] === $season['id'], 409, 'The Halloween pumpkin hunt is not active.');
            abort_if($proof['expires_at'] <= now()->timestamp, 409, 'This pumpkin needs a fresh page. Refresh and try again.');
            $room = $roomId !== null ? Room::findOrFail($roomId) : null;
            if ($room) self::ensureRoomAccess($hunter, $room);

            abort_unless(in_array($proof['pumpkin_id'], self::idsFor($hunter, $season['id'], $page, $room), true), 422, 'This pumpkin is not hidden here.');
            $claims = DB::table('pumpkin_hunt_claims')->where('user_id', $hunter->id)->where('season', $season['id']);
            $already = (clone $claims)->where('pumpkin_id', $proof['pumpkin_id'])->exists();
            $awarded = 0;
            $bonus = 0;

            if (! $already) {
                DB::table('pumpkin_hunt_claims')->insert([
                    'user_id' => $hunter->id, 'season' => $season['id'],
                    'pumpkin_id' => $proof['pumpkin_id'], 'claimed_at' => now(),
                ]);
                $awarded = self::PER_PUMPKIN;
                $hunter->award($awarded, 'pumpkin_hunt', 'Halloween pumpkin '.$proof['pumpkin_id'].' / '.self::TOTAL.' ('.$season['id'].')');
                if ($claims->count() === self::TOTAL) {
                    $bonus = self::COMPLETION_BONUS;
                    $hunter->award($bonus, 'pumpkin_bonus', 'All Halloween pumpkins found ('.$season['id'].')');
                }
            }

            return [
                'state' => self::payload($hunter, $page, $room),
                'awarded' => $awarded,
                'bonus' => $bonus,
                'coins' => (int) $hunter->coins,
                'already_claimed' => $already,
            ];
        }, 3);
    }

    private static function ensurePage(string $page): void
    {
        abort_unless(in_array($page, self::PAGES, true), 422, 'This page is not part of the pumpkin hunt.');
    }

    private static function ensureRoomAccess(User $user, Room $room): void
    {
        abort_unless($room->canEnter($user), 403, 'This room is private.');
        abort_if($room->bans()->where('user_id', $user->id)->exists(), 403, 'You are banned from this room.');
        abort_unless(RoomReleases::allows($room, 'pumpkin_hunt'), 403, 'The pumpkin hunt is not available in this room yet.');
    }

    private static function idsFor(User $user, string $season, ?string $page, ?Room $room): array
    {
        if ($room) {
            $ids = range(1, self::TOTAL);
            usort($ids, fn (int $a, int $b) => self::seed($user, $season, 'room:'.$room->id.':'.$a) <=> self::seed($user, $season, 'room:'.$room->id.':'.$b));

            return array_slice($ids, 0, 4);
        }

        return self::LOCATIONS[self::PAGE_ALIASES[$page] ?? $page]['ids'] ?? [];
    }

    private static function token(User $user, string $season, int $id, ?string $page, ?Room $room): string
    {
        return Crypt::encryptString(json_encode([
            'version' => 1, 'user_id' => (int) $user->id, 'season' => $season, 'pumpkin_id' => $id,
            'page' => $room ? null : $page, 'room_id' => $room ? (int) $room->id : null,
            'expires_at' => now()->addMinutes((int) config('pumpkin-hunt.token_minutes', 15))->timestamp,
        ], JSON_THROW_ON_ERROR));
    }

    private static function seed(User $user, string $season, string $placement): int
    {
        return (int) hexdec(substr(hash_hmac('sha256', $user->id.':'.$season.':'.$placement, (string) config('app.key')), 0, 7));
    }
}
