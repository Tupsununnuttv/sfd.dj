<?php

namespace App\Support;

/**
 * The special badges staff give to people (Admin panel → Users): they are earned, never bought. Each is a key, a name, what it means and a colour;
 * the page draws each one as a picture of its own (resources/js/lib/art/awards.tsx), so keep the keys of both in step (a test checks that).
 * They show in front of a name next to the role icons and the badge from the shop, as "award:<key>".
 */
final class Awards
{
    public const ALL = [
        'beta' => ['Beta Tester', 'Tried SFD.DJ before it opened and helped make it better.', '#2dd4bf'],
        'founder' => ['Founding Member', 'Was here in the very first days, before the doors opened.', '#facc15'],
        'bughunter' => ['Bug Hunter', 'Found a bug and reported it, and it got fixed.', '#f87171'],
        'contributor' => ['Contributor', 'Helped build SFD.DJ: code, art, music or words.', '#60a5fa'],
        'champion' => ['Event Champion', 'Won an SFD.DJ event or contest.', '#fbbf24'],
        'tastemaker' => ['Tastemaker', 'Plays the songs that everybody ends up asking for.', '#c084fc'],
        'hero' => ['Community Hero', 'Made the community a better place to be.', '#fb7185'],
    ];

    /** An award that is the same thing as a role: somebody who holds the role is not shown the badge twice. (The role's icon is drawn as this badge, too.) */
    public const ROLE_TWIN = ['beta' => 'beta_tester'];

    /** One award as the pages want it (the same shape as a role badge, with the meaning added). */
    public static function badge(string $key): ?array
    {
        if (! isset(self::ALL[$key])) {
            return null;
        }

        [$label, $text, $color] = self::ALL[$key];

        return ['key' => "award:{$key}", 'label' => $label, 'color' => $color, 'icon' => null, 'text' => $text];
    }

    /** Only real awards, each once, always in the order above. */
    public static function clean(?array $keys): array
    {
        return array_values(array_intersect(array_keys(self::ALL), $keys ?? []));
    }

    /** What the Admin panel shows: every award with its name and meaning. */
    public static function catalog(): array
    {
        return array_map(fn ($key) => ['key' => $key] + array_combine(['label', 'text', 'color'], self::ALL[$key]), array_keys(self::ALL));
    }
}
