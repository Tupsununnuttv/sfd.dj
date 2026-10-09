<?php

namespace App\Support;

use App\Models\PlaylistItem;
use App\Models\Room;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

/** A few public numbers for the login and register pages ("1,204 members, 12 rooms"). Cached for 30 seconds. */
class PublicStats
{
    public static function get(): array
    {
        return Cache::remember('public_stats', 30, fn () => [
            'members' => User::where('is_bot', false)->count(),
            'rooms' => Room::where('is_private', false)->count(),
            'songs' => PlaylistItem::whereNotNull('played_at')->count(),
            'listening' => array_sum(RoomPresence::counts()),
        ]);
    }
}
