<?php

namespace App\Support;

/**
 * Nobody shares other sites on SFD-DJ.EU: chat, whispers, bios and the texts of rooms may only point at SFD-DJ.EU itself and at our partners. Web addresses
 * are found with or without http:// or www., also when written as "plug . dj", "plug(dot)dj" or "plug[.]dj", and other music sites are refused by
 * their name too. SFD-DJ.EU staff are never stopped (the callers check that).
 */
final class LinkGuard
{
    /** Our partners: their sites, and every address under them (app.borealise.com), may be shared anywhere. Keep in step with the partners on the home page. */
    public const PARTNERS = ['club.dj', 'borealise.com', 'cord.dj'];

    /** Other music sites, refused even when written without their address. */
    private const NAMES = '/(?<![a-z0-9])(?:wavez|plug\s?dj|dubtrack|jqbx)(?![a-z0-9])/i';

    /**
     * The endings of web addresses written without http:// or a path (plug.dj, wavez.fm). Short endings that are words of their own ("is", "it", "me",
     * "to") are left out, as they end sentences ("that.is"); with a path after them (t.me/name) any ending counts.
     */
    private const TLDS = 'com|net|org|info|biz|io|gg|tv|fm|dj|co|xyz|app|dev|live|club|site|online|store|shop|link|page|top|pro|fun|cool|vip|music|radio|stream|audio|video|tube|media|social|chat|space|world|zone|news|blog|tech|cloud|wtf|lol|ee|eu|uk|de|fr|nl|ru|ua|lv|lt|fi|se|dk|pl|cz|sk|ch|es|pt|ie|br|ar|mx|ca|au|nz|jp|kr|cn|tk|ml|ga|cf|ly|gl|gd|sh|ac|ai|cc|ws|vn|th|tr|gr|ro|hu|bg|rs|hr|si|ba|md|kz|il|ae|za|ng|ke|ph|lk|pk|nu|su|fyi|gs|ms|ps|vc|tw|hk|sg|cx';

    public const MESSAGE = 'Links to other sites cannot be shared here. Only SFD-DJ.EU and our partners: club.dj, borealise.com and cord.dj.';

    /** Why the text may not go out (it points people at another site), or null when it may. */
    public static function check(?string $text): ?string
    {
        if ($text === null || trim($text) === '') {
            return null;
        }

        foreach (self::hosts($text) as $host) {
            if (! self::allowed($host)) {
                return self::MESSAGE;
            }
        }

        return preg_match(self::NAMES, self::plain($text)) ? self::MESSAGE : null;
    }

    /** Every web address in the text, by its host name (lower case, without www.). */
    public static function hosts(string $text): array
    {
        $label = '(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+';
        preg_match_all('~(?:https?://|www\.)([a-z0-9][a-z0-9.-]*)|(?<![a-z0-9.@-])('.$label.'(?:'.self::TLDS.'))(?![a-z0-9-])|(?<![a-z0-9.@-])('.$label.'[a-z]{2,24})(?=/)~', self::plain($text), $m, PREG_SET_ORDER);

        return array_values(array_unique(array_map(fn ($found) => preg_replace('/^www\./', '', rtrim(end($found) ?: '', '.')), $m)));
    }

    /** SFD-DJ.EU itself and our partners, and every address under them. */
    public static function allowed(string $host): bool
    {
        $host = preg_replace('/^www\./', '', rtrim(strtolower($host), '.'));

        foreach ([...self::PARTNERS, 'sfd-dj.eu', ...array_filter([parse_url((string) config('app.url'), PHP_URL_HOST)])] as $ok) {
            if ($host === $ok || str_ends_with($host, '.'.$ok)) {
                return true;
            }
        }

        return false;
    }

    /** The text as the checks read it: lower case, and the usual ways of hiding a dot turned back into one. */
    private static function plain(string $text): string
    {
        $t = str_replace(['．', '。', '｡', '․'], '.', mb_strtolower($text));
        $t = preg_replace('/\s*[(\[{<]\s*(?:dot|\.)\s*[)\]}>]\s*/u', '.', $t); // plug(dot)dj, plug[.]dj, plug (dot) dj

        return preg_replace('/(?<=[a-z0-9])\s+\.\s*(?=[a-z0-9])/u', '.', $t); // plug .dj, plug . dj (a space before a full stop is not how sentences end)
    }
}
