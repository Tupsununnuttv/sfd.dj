<?php

namespace App\Support;

use App\Http\Controllers\PlaylistController;
use App\Http\Controllers\RoomEmojiController;
use App\Models\Playlist;

/**
 * The paid plans, each a step up from the one before: SFD-DJ.EU Bronze, Silver, Gold, Plus, Pro and Premium, by the month or the year (prices in euro cents; the
 * year is two months free). Each gives the role of the same name (App\Enums\Role: a gem and a name in the plan's colour, for as long as the plan lasts), more XP for
 * everything you do, more playlists, more songs in each of them and more emojis in the rooms you host. They are optional: nothing that is free now becomes paid.
 * The order here is the order the pages show them in.
 * People pay through Stripe (App\Support\Stripe); staff can also give a plan by hand (Admin panel, Users).
 */
final class Plans
{
    /** What everybody has without a plan. */
    public const FREE = ['xp' => 1.0, 'playlists' => PlaylistController::MAX_PLAYLISTS, 'songs' => Playlist::MAX_SONGS, 'emojis' => RoomEmojiController::MAX_PER_ROOM];

    public const TIERS = [
        'bronze' => ['name' => 'Bronze', 'color' => '#cd7f32', 'month' => 99, 'year' => 999, 'xp' => 1.05, 'playlists' => 120, 'songs' => 6000, 'emojis' => 35],
        'silver' => ['name' => 'Silver', 'color' => '#cbd5e1', 'month' => 149, 'year' => 1499, 'xp' => 1.1, 'playlists' => 150, 'songs' => 7500, 'emojis' => 40],
        'gold' => ['name' => 'Gold', 'color' => '#facc15', 'month' => 199, 'year' => 1999, 'xp' => 1.15, 'playlists' => 175, 'songs' => 9000, 'emojis' => 45],
        'plus' => ['name' => 'Plus', 'color' => '#14b8a6', 'month' => 299, 'year' => 2999, 'xp' => 1.25, 'playlists' => 200, 'songs' => 10000, 'emojis' => 50],
        'pro' => ['name' => 'Pro', 'color' => '#818cf8', 'month' => 449, 'year' => 4499, 'xp' => 1.35, 'playlists' => 300, 'songs' => 15000, 'emojis' => 75],
        'premium' => ['name' => 'Premium', 'color' => '#f472b6', 'month' => 599, 'year' => 5999, 'xp' => 1.5, 'playlists' => 500, 'songs' => 20000, 'emojis' => 100],
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
                "The {$t['name']} role: a gem and a coloured name in chat, in the room and on your profile",
                '+'.round(($t['xp'] - 1) * 100).'% XP for everything you do',
                "{$t['playlists']} playlists (".self::FREE['playlists'].' without a plan)',
                number_format($t['songs']).' songs in each playlist ('.self::FREE['songs'].' without)',
                "{$t['emojis']} emojis in the rooms you host (".self::FREE['emojis'].' without)',
            ],
        ], array_keys(self::TIERS), self::TIERS);
    }
}
