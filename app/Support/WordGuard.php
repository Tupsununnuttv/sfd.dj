<?php

namespace App\Support;

/**
 * Words nobody may write on SFD-DJ.EU, staff and bots included: slurs, and words about abusing children (with "pdf", the joke for that).
 * Room chat (also through the API) and whispers refuse a message that has one; the room's moderation log keeps the attempt. Hidden
 * spellings are caught too: "P E D E", "p.e.d.e", "l1ts", "pedofiiil" and Cyrillic letters drawn like ours. A room adds its own words
 * in AutoMod; this list is for the whole site.
 */
final class WordGuard
{
    public const MESSAGE = 'That word is not allowed on SFD-DJ.EU, so the message was not sent.';

    /**
     * Each word as a pattern for a whole word, with the endings Estonian adds: "litsid" is caught but "litsents" and "politsei" are not,
     * "pede" is caught but "pedestal" and "centipede" are not, and "faggot" is caught but "fagott" (the bassoon) is not.
     */
    private const WORDS = [
        // abusing children
        'pedofiil\p{L}*', 'pa?edophil\p{L}*', 'pedos?', 'pdfs?', 'pedobear', 'педофил\p{L}*',
        // about gay people
        'pede(?:d|de|dega|dele|ga|ks|le|lt|s|sid|st|t)?', 'pederast\p{L}*', 'pid[oa]r\p{L}*', 'пид[оа]р\p{L}*', 'fag(?:s|got\p{L}*)?',
        // about women
        'lits(?:i|id|ide|idega|idele|iga|iks|il|ile|ilt|is|ist)?', 'hoor(?:a|ad|ade|aga|aks|ale|alt|at)?', 'whores?', 'sluts?', 'slutty', 'cunts?', 'шлюх\p{L}*',
        // about race and origin
        'neeg(?:er|ri|rid|rit|reid|rile|riks|riga|rite)', 'nigg(?:a|ah|as|az|er|ers)', 'tibla\p{L}*', 't[sš]urka\p{L}*', 'churka\p{L}*', 'чурк\p{L}*',
    ];

    /** What people swap in to get past a filter: digits and signs for letters, and Cyrillic letters drawn like ours. */
    private const LOOKALIKES = ['0' => 'o', '1' => 'i', '3' => 'e', '4' => 'a', '5' => 's', '7' => 't', '@' => 'a', '$' => 's', 'а' => 'a', 'е' => 'e', 'о' => 'o', 'р' => 'p', 'с' => 'c', 'у' => 'y', 'х' => 'x', 'і' => 'i'];

    /** Why the text may not go out (it has one of the words), or null when it may. */
    public static function check(?string $text): ?string
    {
        if ($text === null || trim($text) === '') {
            return null;
        }

        $words = '/(?<![\p{L}\p{N}])(?:'.implode('|', self::WORDS).')(?![\p{L}\p{N}])/u';

        foreach (self::readings($text) as $reading) {
            if (preg_match($words, $reading)) {
                return self::MESSAGE;
            }
        }

        return null;
    }

    /** The text as the check reads it: as written, with the lookalikes swapped back, and with stretched letters ("liiiits") cut short. */
    private static function readings(string $text): array
    {
        $t = mb_strtolower(preg_replace('/:(?:bttv|7tv):\w+:/', ' ', $text)); // emote codes are not words

        // letters spaced out with blanks, dots or dashes ("p e d e", "p.e.d.e", "l-1-t-s") read as one word
        $t = preg_replace_callback('/(?<![\p{L}\p{N}])(?:[\p{L}\p{N}@$][\s.\-_*+~|]+){2,}[\p{L}\p{N}@$](?![\p{L}\p{N}])/u', fn (array $m) => preg_replace('/[\s.\-_*+~|]+/u', '', $m[0]), $t);
        $plain = strtr($t, self::LOOKALIKES);

        return [$t, $plain, preg_replace('/(\p{L})\1{2,}/u', '$1$1', $plain), preg_replace('/(\p{L})\1+/u', '$1', $plain)];
    }
}
