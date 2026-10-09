<?php

namespace App\Support;

use App\Http\Controllers\PlaylistController;
use App\Http\Controllers\RoomEmojiController;
use App\Models\Playlist;

/**
 * The paid plans: SFD.DJ Plus and Premium, by the month or the year (prices in euro cents). Each gives a gem next to your name, more XP for everything
 * you do, more playlists, more songs in each of them and more emojis in the rooms you host. They are optional: nothing that is free now becomes paid.
 * People pay through Stripe (App\Support\Stripe); staff can also give a plan by hand (Admin panel, Users).
 */
final class Plans
{
    /** What everybody has without a plan. */
    public const FREE = ['xp' => 1.0, 'playlists' => PlaylistController::MAX_PLAYLISTS, 'songs' => Playlist::MAX_SONGS, 'emojis' => RoomEmojiController::MAX_PER_ROOM];

    public const TIERS = [
        'plus' => ['name' => 'Plus', 'color' => '#2dd4bf', 'month' => 299, 'year' => 2999, 'xp' => 1.25, 'playlists' => 60, 'songs' => 1000, 'emojis' => 50],
        'premium' => ['name' => 'Premium', 'color' => '#fbbf24', 'month' => 599, 'year' => 5999, 'xp' => 1.5, 'playlists' => 100, 'songs' => 2000, 'emojis' => 100],
    ];

    /** The most songs a playlist can hold on any plan (the order of a playlist is checked against it). */
    public static function mostSongs(): int
    {
        return max(array_column(self::TIERS, 'songs'));
    }

    /** "€2.99" */
    public static function price(int $cents): string
    {
        return '€'.number_format($cents / 100, 2);
    }

    /** The plans as the pages show them: name, colour, prices and what each one gives. */
    public static function catalog(): array
    {
        return array_map(fn (string $key, array $t) => [
            'key' => $key,
            'name' => $t['name'],
            'color' => $t['color'],
            'month' => self::price($t['month']),
            'year' => self::price($t['year']),
            'perks' => [
                "A {$t['name']} gem next to your name, in chat, in the room and on your profile",
                '+'.round(($t['xp'] - 1) * 100).'% XP for everything you do',
                "{$t['playlists']} playlists (".self::FREE['playlists'].' without a plan)',
                number_format($t['songs']).' songs in each playlist ('.self::FREE['songs'].' without)',
                "{$t['emojis']} emojis in the rooms you host (".self::FREE['emojis'].' without)',
            ],
        ], array_keys(self::TIERS), self::TIERS);
    }
}
