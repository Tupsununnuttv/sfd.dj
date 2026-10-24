<?php

namespace App\Support;

use App\Models\Room;
use App\Models\RoomFeatureRelease;

class RoomReleases
{
    /** Use this on the server before executing a newly staged room feature. */
    public static function allows(Room $room, string $feature): bool
    {
        if (! array_key_exists($feature, config('room-releases.features', []))) return false;
        return RoomFeatureRelease::find($feature)?->availableIn($room) ?? false;
    }

    public static function payload(Room $room): array
    {
        $available = RoomFeatureRelease::orderByDesc('preview_at')->get()->filter(fn ($release) => $release->availableIn($room));
        return [
            'early_access' => $room->early_access,
            'early_days' => (int) config('room-releases.early_days', 3),
            'features' => $available->pluck('key')->values()->all(),
            // Unreleased titles and descriptions never reach an ineligible room.
            'updates' => $available->map(fn ($release) => self::describe($release))->values()->all(),
        ];
    }

    public static function adminCatalog(): array
    {
        $releases = RoomFeatureRelease::all()->keyBy('key');
        return collect(config('room-releases.features', []))->map(fn ($definition, $key) => self::describe(
            $releases->get($key) ?? new RoomFeatureRelease(['key' => $key, 'enabled' => false, 'early_days' => config('room-releases.early_days', 3)])
        ))->values()->all();
    }

    private static function describe(RoomFeatureRelease $release): array
    {
        return config('room-releases.features.'.$release->key, []) + [
            'key' => $release->key, 'enabled' => (bool) $release->enabled,
            'early_days' => (int) $release->early_days, 'preview_at' => $release->preview_at?->toIso8601String(),
            'public_at' => $release->publicAt()?->toIso8601String(), 'phase' => $release->phase(),
        ];
    }
}
