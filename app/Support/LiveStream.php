<?php

namespace App\Support;

/** Parse supported live links and store only canonical URLs. TikTok LIVE is an external watch link. */
final class LiveStream
{
    public const KINDS = ['youtube' => 'YouTube', 'twitch' => 'Twitch', 'kick' => 'Kick', 'tiktok' => 'TikTok'];

    /** First parts of Twitch and Kick addresses that are pages of the site, not channels. */
    private const NOT_CHANNELS = ['directory', 'videos', 'video', 'p', 'settings', 'downloads', 'jobs', 'turbo', 'store', 'subscriptions', 'friends', 'inventory', 'wallet', 'drops', 'prime', 'popout', 'embed', 'user', 'legal', 'privacy', 'categories', 'category', 'browse', 'dashboard', 'following', 'search', 'clips', 'clip', 'terms'];

    /**
     * What the address points at: `kind`, `ref` (the YouTube video or channel id, or the Twitch or Kick channel), the stream's own `url` and a `thumbnail`.
     * Null when it is not a live stream address of a supported site.
     *
     * @return array{kind: string, ref: string, url: string, thumbnail: ?string}|null
     */
    public static function parse(string $input): ?array
    {
        $input = trim($input);
        $parts = parse_url(preg_match('~^https?://~i', $input) ? $input : 'https://'.$input) ?: [];
        $host = strtolower(preg_replace('/^(?:www|m)\./i', '', $parts['host'] ?? ''));
        $path = array_values(array_filter(explode('/', $parts['path'] ?? ''), 'strlen'));
        parse_str($parts['query'] ?? '', $query);

        return match (true) {
            in_array($host, ['youtube.com', 'youtube-nocookie.com', 'youtu.be'], true) => self::youtube($host, $path, $query),
            in_array($host, ['twitch.tv', 'player.twitch.tv'], true) => self::channel('twitch', $host === 'player.twitch.tv' ? (string) ($query['channel'] ?? '') : (string) ($path[0] ?? '')),
            in_array($host, ['kick.com', 'player.kick.com'], true) => self::channel('kick', (string) ($path[0] ?? '')),
            $host === 'tiktok.com' => self::tiktok($path),
            default => null,
        };
    }

    /** TikTok LIVE opens on TikTok: its post embed player does not support LIVE. */
    private static function tiktok(array $path): ?array
    {
        if (count($path) !== 2 || $path[1] !== 'live' || ! preg_match('/^@([a-zA-Z0-9_][a-zA-Z0-9_.]{0,23})$/', $path[0], $match)) {
            return null;
        }

        $name = strtolower($match[1]);

        return ['kind' => 'tiktok', 'ref' => $name, 'url' => "https://www.tiktok.com/@{$name}/live", 'thumbnail' => null];
    }

    /** A video (a live stream is one: watch?v=, /live/, /embed/, youtu.be/) or a channel (/channel/UC…, whose live stream is shown). */
    private static function youtube(string $host, array $path, array $query): ?array
    {
        $first = $path[0] ?? '';
        $id = match (true) {
            $host === 'youtu.be' => $first,
            $first === 'watch' => (string) ($query['v'] ?? ''),
            $first === 'embed' && ($path[1] ?? '') === 'live_stream' => (string) ($query['channel'] ?? ''),
            in_array($first, ['live', 'embed', 'v', 'channel'], true) => (string) ($path[1] ?? ''),
            default => '',
        };

        if (preg_match('/^[A-Za-z0-9_-]{11}$/', $id)) {
            return ['kind' => 'youtube', 'ref' => $id, 'url' => "https://www.youtube.com/watch?v={$id}", 'thumbnail' => "https://i.ytimg.com/vi/{$id}/hqdefault.jpg"];
        }

        return preg_match('/^UC[A-Za-z0-9_-]{22}$/', $id) ? ['kind' => 'youtube', 'ref' => $id, 'url' => "https://www.youtube.com/channel/{$id}/live", 'thumbnail' => null] : null;
    }

    private static function channel(string $kind, string $name): ?array
    {
        $name = strtolower($name);

        if (! preg_match('/^[a-z0-9_-]{3,25}$/', $name) || in_array($name, self::NOT_CHANNELS, true)) {
            return null;
        }

        return $kind === 'twitch'
            ? ['kind' => 'twitch', 'ref' => $name, 'url' => "https://www.twitch.tv/{$name}", 'thumbnail' => "https://static-cdn.jtvnw.net/previews-ttv/live_user_{$name}-640x360.jpg"]
            : ['kind' => 'kick', 'ref' => $name, 'url' => "https://kick.com/{$name}", 'thumbnail' => null];
    }
}
