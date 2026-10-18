<?php

namespace App\Support;

use App\Models\PlaylistItem;
use App\Models\Room;
use App\Models\User;

/** Shared definitions for public and staff counters. People never include bot accounts. */
class PublicStats
{
    public static function get(): array
    {
        return [
            'members' => User::where('is_bot', false)->count(),
            'online' => User::where('is_bot', false)->where('last_seen_at', '>', now()->subMinutes(5))->count(),
            'rooms' => Room::where('is_private', false)->count(),
            'songs' => PlaylistItem::whereNotNull('played_at')->count(),
            'listening' => RoomPresence::listenerCount(),
            'updated_at' => now()->toIso8601String(),
        ];
    }
}
