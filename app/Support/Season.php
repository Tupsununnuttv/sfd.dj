<?php

namespace App\Support;

use Carbon\CarbonInterface;

/**
 * The special times of the year. While one lasts, every room shows its background (Room::shownBackground): the host may pick another of the same
 * season (Halloween V2 instead of Halloween) or switch it off in their room with any other background. When it is over, rooms show their own again.
 * The days are month-day, both included; a season that runs over New Year ends in January.
 */
final class Season
{
    public const ALL = [
        'halloween' => ['label' => 'Halloween', 'from' => '10-01', 'to' => '10-31', 'when' => 'October', 'backgrounds' => ['halloween', 'halloween2']],
        'christmas' => ['label' => 'Christmas', 'from' => '12-01', 'to' => '01-06', 'when' => '1 December to 6 January', 'backgrounds' => ['christmas', 'christmas2']],
    ];

    /** The season that is on now, with an id for this year's run of it ("christmas-2026" lasts into January 2027), or null. */
    public static function current(?CarbonInterface $now = null): ?array
    {
        $now ??= now();
        $day = $now->format('m-d');

        foreach (self::ALL as $key => $season) {
            $wraps = $season['to'] < $season['from'];
            $on = $wraps ? ($day >= $season['from'] || $day <= $season['to']) : ($day >= $season['from'] && $day <= $season['to']);

            if ($on) {
                $year = $wraps && $day <= $season['to'] ? $now->year - 1 : $now->year;

                return ['key' => $key, 'id' => "{$key}-{$year}"] + $season;
            }
        }

        return null;
    }

    /** Every season for Room settings: its name, when it is, its backgrounds and whether it is on now. */
    public static function list(): array
    {
        $now = self::current()['key'] ?? null;

        return array_map(fn (string $key, array $s) => ['key' => $key, 'label' => $s['label'], 'when' => $s['when'], 'backgrounds' => $s['backgrounds'], 'on' => $key === $now], array_keys(self::ALL), self::ALL);
    }
}
