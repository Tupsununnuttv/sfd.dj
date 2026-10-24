<?php

namespace App\Support;

use App\Http\Controllers\PlaylistController;
use App\Http\Controllers\RoomEmojiController;
use App\Models\Playlist;

/**
 * The paid plans, each a step up from the one before: SFD-DJ.EU Bronze, Silver, Gold, Plus, Pro and Premium, by the month or the year (prices in euro cents, as the
 * owner set them: the year costs a lot less than twelve months, `catalog()` says how much). Each gives the role of the same name (App\Enums\Role: a gem and a name in the plan's colour, for as long as the plan lasts), more XP for
 * everything you do, more playlists, more songs in each of them and more emojis in the rooms you host. They are optional: nothing that is free now becomes paid.
 * The order here is the order the pages show them in.
 * People pay through Stripe (App\Support\Stripe); staff can also give a plan by hand (Admin panel, Users).
 */
final class Plans
{
    /** What everybody has without a plan. */
    public const FREE = ['xp' => 1.0, 'playlists' => PlaylistController::MAX_PLAYLISTS, 'songs' => Playlist::MAX_SONGS, 'emojis' => RoomEmojiController::MAX_PER_ROOM];

    public const TIERS = [
        'bronze' => ['name' => 'Bronze', 'color' => '#cd7f32', 'month' => 299, 'year' => 1999, 'xp' => 1.05, 'playlists' => 120, 'songs' => 6000, 'emojis' => 35],
        'silver' => ['name' => 'Silver', 'color' => '#cbd5e1', 'month' => 449, 'year' => 2999, 'xp' => 1.1, 'playlists' => 150, 'songs' => 7500, 'emojis' => 40],
        'gold' => ['name' => 'Gold', 'color' => '#facc15', 'month' => 699, 'year' => 3999, 'xp' => 1.15, 'playlists' => 175, 'songs' => 9000, 'emojis' => 45],
        'plus' => ['name' => 'Plus', 'color' => '#14b8a6', 'month' => 999, 'year' => 5999, 'xp' => 1.2, 'playlists' => 200, 'songs' => 12000, 'emojis' => 50],
        'pro' => ['name' => 'Pro', 'color' => '#818cf8', 'month' => 1499, 'year' => 7999, 'xp' => 1.25, 'playlists' => 250, 'songs' => 15000, 'emojis' => 60],
        'premium' => ['name' => 'Premium', 'color' => '#f472b6', 'month' => 2099, 'year' => 9999, 'xp' => 1.3, 'playlists' => 350, 'songs' => 20000, 'emojis' => 75],
    ];

    /** Subscription entitlements, shared by monthly, yearly and gifted subscriptions. */
    public const FEATURES = [
        'priority_queue' => ['Priority queue', ['—', 'Basic', 'Better', 'High', 'Higher', 'Highest']],
        'song_effects' => ['Song effects', ['—', '2', '4', '7', '12', 'All']],
        'lobby_effects' => ['Lobby effects', ['—', '—', '2', '4', '8', 'All']],
        'profile_frame' => ['Profile frame', ['Simple', 'Silver', 'Gold', 'Glowing', 'Animated', 'Fully custom']],
        'join_effect' => ['Join effect', ['Small', 'Small', 'Small', 'Animated', 'Animated', 'Exclusive']],
        'name_glow' => ['Name glow', ['—', '—', '—', 'Included', 'Included', 'Included']],
        'animated_name' => ['Animated name', ['—', '—', 'Included', 'Included', 'Included', 'Included']],
        'join_message' => ['Custom join message', ['—', '—', 'Included', 'Included', 'Included', 'Included']],
        'profile_animation' => ['Profile animation', ['—', '—', '—', 'Basic', 'Advanced', 'Exclusive']],
        'room_theme' => ['Custom room theme', ['—', '—', '—', 'Basic', 'Advanced', 'Full']],
        'exclusive_aura' => ['Exclusive aura', ['—', '—', '—', '—', 'Included', 'Included']],
        'custom_entrance' => ['Custom entrance', ['—', '—', '—', '—', 'Basic', 'Full']],
        'name_gradient' => ['Custom name gradient', ['—', '—', 'Included', 'Included', 'Included', 'Included']],
        'avatar_ring' => ['Animated avatar ring', ['—', '—', '—', 'Included', 'Included', 'Included']],
        'entrance_sound' => ['Room entrance sound', ['—', '—', '—', '—', 'Included', 'Included']],
        'badge_showcase' => ['Profile badges showcase', ['—', 'Included', 'Included', 'Included', 'Included', 'Included']],
        'chat_bubble' => ['Custom chat bubble', ['—', '—', 'Included', 'Included', 'Included', 'Included']],
        'message_effects' => ['Message effects', ['—', '—', '—', 'Included', 'Included', 'Included']],
        'typing_indicator' => ['Custom typing indicator', ['—', '—', '—', '—', 'Included', 'Included']],
        'dj_spotlight' => ['DJ spotlight', ['—', '—', 'Included', 'Included', 'Included', 'Included']],
        'song_dedication' => ['Song dedication', ['—', 'Included', 'Included', 'Included', 'Included', 'Included']],
        'song_transition' => ['Custom song transition', ['—', '—', '—', '—', 'Included', 'Included']],
        'room_banner' => ['Animated room banner', ['—', '—', '—', 'Included', 'Included', 'Included']],
        'room_particles' => ['Room particle effects', ['—', '—', '—', '—', 'Included', 'Included']],
        'reaction_animations' => ['Custom reaction animations', ['—', '—', 'Included', 'Included', 'Included', 'Included']],
        'music_showcase' => ['Profile music showcase', ['—', 'Included', 'Included', 'Included', 'Included', 'Included']],
        'status_style' => ['Custom status style', ['Included', 'Included', 'Included', 'Included', 'Included', 'Included']],
        'color_palettes' => ['Exclusive color palettes', ['—', 'Included', 'Included', 'Included', 'Included', 'Included']],
        'queue_highlight' => ['Custom queue highlight', ['—', '—', 'Included', 'Included', 'Included', 'Included']],
        'profile_background' => ['Custom profile background', ['—', '—', '—', 'Included', 'Included', 'Included']],
        'animated_background' => ['Animated profile background', ['—', '—', '—', '—', 'Included', 'Included']],
        'entrance_aura' => ['Premium entrance aura', ['—', '—', '—', '—', '—', 'Included']],
        'full_customization' => ['Full visual customization', ['—', '—', '—', '—', '—', 'Included']],
        'song_reactions' => ['Custom song reactions', ['—', '—', '—', 'Included', 'Included', 'Included']],
        'lobby_announcements' => ['Custom lobby announcements', ['—', '—', '—', '—', 'Included', 'Included']],
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

    /** The plans as the pages show them: name, colour, prices (`save` is how many percent the year costs less than twelve months) and what each one gives. */
    public static function catalog(): array
    {
        return array_map(fn (string $key, array $t) => [
            'key' => $key,
            'name' => $t['name'],
            'color' => $t['color'],
            'month' => self::price($t['month']),
            'year' => self::price($t['year']),
            'save' => (int) round(100 - 100 * $t['year'] / (12 * $t['month'])),
            'features' => array_map(fn (string $id, array $feature) => [
                'key' => $id,
                'label' => $feature[0],
                'value' => $feature[1][array_search($key, array_keys(self::TIERS), true)],
                'available' => true,
            ], array_keys(self::FEATURES), self::FEATURES),
            'limits' => ['xp' => (int) round(($t['xp'] - 1) * 100), 'playlists' => $t['playlists'], 'songs' => $t['songs'], 'emojis' => $t['emojis']],
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
