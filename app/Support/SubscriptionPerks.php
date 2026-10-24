<?php

namespace App\Support;

use App\Models\User;

final class SubscriptionPerks
{
    public const SONG_EFFECTS = ['pulse', 'notes', 'sparkles', 'hearts', 'waves', 'confetti', 'aurora', 'orbit', 'laser', 'fireflies', 'prism', 'galaxy', 'eclipse', 'meteor', 'hologram', 'supernova'];
    public const LOBBY_EFFECTS = ['sparkles', 'notes', 'hearts', 'waves', 'aurora', 'orbit', 'fireflies', 'galaxy', 'eclipse', 'petals', 'comets', 'neon'];
    // Each control has a feature entitlement, a label, and either options or an input type.
    public const CONTROLS = [
        'frame' => ['profile_frame', 'Profile frame', ['bronze', 'silver', 'gold', 'glow', 'animated', 'custom']],
        'join' => ['join_effect', 'Join animation', ['pulse', 'sparkles', 'orbit', 'aurora', 'galaxy']],
        'gradient' => ['name_gradient', 'Name gradient', ['sunset', 'ocean', 'candy', 'custom']],
        'ring' => ['avatar_ring', 'Animated avatar ring', ['orbit', 'pulse', 'rainbow']],
        'aura' => ['exclusive_aura', 'Exclusive aura', ['aurora', 'cosmic', 'flames']],
        'profile_animation' => ['profile_animation', 'Profile animation', ['pulse', 'float', 'shimmer']],
        'song' => ['song_effects', 'Song effect', self::SONG_EFFECTS],
        'lobby' => ['lobby_effects', 'Lobby effect', self::LOBBY_EFFECTS],
        'theme' => ['room_theme', 'Room theme (rooms you host)', ['midnight', 'ocean', 'sunset', 'forest', 'cosmic', 'custom']],
        'particles' => ['room_particles', 'Room particles', ['snow', 'stars', 'sparks']],
        'bubble' => ['chat_bubble', 'Chat bubble', ['soft', 'outline', 'glass']],
        'message' => ['message_effects', 'Message animation', ['fade', 'rise', 'sparkle']],
        'typing' => ['typing_indicator', 'Typing indicator', ['dots', 'wave', 'sparkle']],
        'reaction' => ['reaction_animations', 'Reaction animation', ['pop', 'float', 'spin']],
        'song_reaction' => ['song_reactions', 'Song reaction', ['✨', '🔥', '💜', '🎵', '🌟', '💎']],
        'transition' => ['song_transition', 'Song transition', ['fade', 'zoom', 'prism']],
        'entrance' => ['custom_entrance', 'Entrance animation', ['spotlight', 'portal', 'supernova']],
        'sound' => ['entrance_sound', 'Entrance sound', ['chime', 'bell', 'synth']],
        'status' => ['status_style', 'Status style', ['pill', 'outline', 'glow']],
        'palette' => ['color_palettes', 'Color palette', ['silver', 'ocean', 'sunset', 'candy', 'forest']],
        'background_animation' => ['animated_background', 'Animated profile background', ['aurora', 'waves', 'stars']],
        'banner' => ['room_banner', 'Animated room banner', 'text'],
        'announcement' => ['lobby_announcements', 'Lobby announcement (rooms you host)', 'text'],
        'join_message' => ['join_message', 'Custom join message', 'text'],
        'dedication' => ['song_dedication', 'Song dedication (name or message)', 'text'],
        'music' => ['music_showcase', 'Profile music links (one per line)', 'links'],
        'badges' => ['badge_showcase', 'Showcase badge keys (comma separated)', 'badges'],
        'accent' => ['profile_background', 'Profile / room accent', 'color'],
        'secondary' => ['full_customization', 'Secondary accent', 'color'],
        'background' => ['profile_background', 'Profile background colour', 'color'],
    ];

    public static function value(?string $plan, string $feature): string
    {
        $index = array_search($plan, array_keys(Plans::TIERS), true);
        return $index === false ? '—' : (Plans::FEATURES[$feature][1][$index] ?? '—');
    }

    public static function allows(User $user, string $feature): bool
    {
        return self::value($user->activePlan(), $feature) !== '—';
    }

    public static function options(?string $plan, string $field): array
    {
        [$feature, , $options] = self::CONTROLS[$field];
        if (! is_array($options) || self::value($plan, $feature) === '—') return [];
        $rank = array_search($plan, array_keys(Plans::TIERS), true);
        $value = self::value($plan, $feature);
        if (in_array($field, ['song', 'lobby'], true)) return $value === 'All' ? $options : array_slice($options, 0, (int) $value);
        $count = match ($field) {
            'frame' => $rank + 1,
            'join' => $rank < 3 ? 1 : ($rank === 3 ? 3 : count($options)),
            'theme' => $value === 'Basic' ? 2 : ($value === 'Advanced' ? 5 : count($options)),
            'profile_animation' => $value === 'Basic' ? 1 : ($value === 'Advanced' ? 2 : 3),
            'entrance' => $value === 'Basic' ? 1 : count($options),
            'gradient' => $plan === 'premium' ? 4 : 3,
            default => count($options),
        };
        return array_slice($options, 0, $count);
    }

    public static function schema(User $user): array
    {
        $plan = $user->activePlan();
        return array_map(fn ($field, $control) => [
            'key' => $field, 'label' => $control[1], 'feature' => $control[0],
            'type' => is_array($control[2]) ? 'select' : $control[2],
            'options' => self::options($plan, $field),
            'unlocked' => self::value($plan, $control[0]) !== '—',
        ], array_keys(self::CONTROLS), self::CONTROLS);
    }

    /** Only current entitlements reach the browser. Stored choices survive expiry without remaining active. */
    public static function appearance(User $user): ?array
    {
        $plan = $user->activePlan();
        if (! $plan) return null;
        $saved = $user->pref('subscription', []);
        $values = [];
        foreach (self::CONTROLS as $field => [$feature, , $type]) {
            if (self::value($plan, $feature) === '—') continue;
            $value = $saved[$field] ?? '';
            if (is_array($type) && $value !== '' && ! in_array($value, self::options($plan, $field), true)) $value = '';
            if ($value !== '') $values[$field] = $value;
        }
        if (! array_key_exists('frame', $saved)) $values['frame'] = $plan;
        if (! array_key_exists('join', $saved)) $values['join'] = $plan === 'premium' ? 'galaxy' : 'pulse';
        $values['plan'] = $plan;
        $values['color'] = Plans::TIERS[$plan]['color'];
        $ends = $user->activeSubscriptionGifts->where('plan', $plan)->pluck('expires_at');
        if ($user->directPlan() === $plan) {
            if (! $user->plan_until) $ends = collect();
            else $ends->push($user->plan_until);
        }
        if ($ends->isNotEmpty()) $values['expires_at'] = $ends->max()->toIso8601String();
        foreach (['animated_name', 'name_glow', 'dj_spotlight', 'queue_highlight', 'entrance_aura'] as $feature) {
            $values[$feature] = self::value($plan, $feature) !== '—';
        }
        if (self::allows($user, 'profile_background') && isset($saved['image'])) $values['image'] = route('media.avatar', basename($saved['image']));
        return $values;
    }

    public static function priority(User $user): int
    {
        $rank = array_search($user->activePlan(), array_keys(Plans::TIERS), true);
        return $rank === false ? 0 : $rank;
    }
}
