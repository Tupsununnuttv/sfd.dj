<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

/**
 * Turns a pasted link into playable songs. YouTube links play from YouTube and SoundCloud tracks play from SoundCloud (its own player, see soundcloud()).
 * Spotify tracks cannot be played from Spotify, so they are matched to the same song on YouTube (a search, so it can pick the wrong version).
 *
 * Every song comes back as: youtube_id, title, channel, thumbnail, duration, origin, origin_url.
 * `youtube_id` is "what plays": an 11-character YouTube video id, or `sc:` and a SoundCloud track number (see isSoundCloud).
 */
class Music
{
    /** Songs per import. Matching a Spotify track costs one YouTube search (100 quota units). */
    public const IMPORT_LIMIT = 1000;

    /** A SoundCloud song's `youtube_id` starts with this, so it can never be taken for a YouTube video id (those are 11 characters, no colon). */
    public const SOUNDCLOUD = 'sc:';

    public static function isSoundCloud(?string $id): bool
    {
        return str_starts_with((string) $id, self::SOUNDCLOUD);
    }

    /** Spotify tracks must each be searched on YouTube, unlike a native YouTube playlist import. */
    private array $importWarnings = [];

    public function __construct(private YouTube $youtube, private Spotify $spotify) {}

    /** @return array<int, array> */
    public function resolve(string $url, ?User $user = null): array
    {
        $url = trim($url);
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));

        if (preg_match('/(^|\.)soundcloud\.com$/', $host)) {
            return [$this->soundcloud($url)];
        }
        if ($host === 'open.spotify.com') {
            return $this->spotify($url, $user);
        }
        if (str_contains($host, 'youtube.com') || $host === 'youtu.be') {
            return $this->youtubeLink($url, $user);
        }

        $this->fail('That link is not from YouTube, SoundCloud or Spotify.');
    }

    /** Resolve one link per line. Returns the songs found and an error message for each line that failed. */
    public function resolveMany(string $text, ?User $user = null): array
    {
        $songs = [];
        $errors = [];
        $this->importWarnings = [];
        $lines = array_slice(array_values(array_filter(array_map('trim', preg_split('/\R/', $text)))), 0, self::IMPORT_LIMIT);

        foreach ($lines as $line) {
            try {
                foreach ($this->resolve($line, $user) as $song) {
                    $songs[] = $song;
                    if (count($songs) >= self::IMPORT_LIMIT) {
                        break 2;
                    }
                }
            } catch (ValidationException $e) {
                $errors[] = $line.': '.collect($e->errors())->flatten()->first();
            }
        }

        return [array_slice($songs, 0, self::IMPORT_LIMIT), [...$errors, ...$this->importWarnings]];
    }

    private function youtubeLink(string $url, ?User $user): array
    {
        $isPlaylistPage = str_contains($url, 'youtube.com/playlist');

        if (! $isPlaylistPage && ($id = $this->youtube->idFromUrl($url))) {
            $info = $this->youtube->video($id) ?? $this->fail('That video was not found or cannot be embedded.');

            return [$this->song($id, $info, 'youtube', $url)];
        }

        if (preg_match('/[?&]list=([\w-]+)/', $url, $m)) {
            $items = $this->youtube->playlist($m[1], self::IMPORT_LIMIT, $user);
            $items ?: $this->fail('That YouTube playlist is empty, private, or the connected account cannot access it. Connect YouTube or configure YOUTUBE_API_KEY for public playlists.');

            return array_map(fn ($i) => $this->song($i['id'], $i, 'youtube', $url), $items);
        }

        $this->fail('Not a YouTube video or playlist link.');
    }

    /**
     * One SoundCloud track, played by SoundCloud's own player (no API key needed): oEmbed names the track (its number sits in the player address),
     * its title ("Song name by Artist"), artist and picture, and the track page says how long it is.
     */
    private function soundcloud(string $url): array
    {
        if (str_contains($url, '/sets/')) {
            $this->fail('SoundCloud playlists cannot be imported (SoundCloud needs separate API access). Add the tracks one by one.');
        }

        [$seconds, $address] = $this->soundcloudPage(strtok($url, '?#') ?: $url); // a shared link carries tracking: ?si=...&utm_source=...

        try {
            $res = Http::timeout(6)->get('https://soundcloud.com/oembed', ['format' => 'json', 'url' => $address]);
        } catch (ConnectionException) {
            $this->fail('Could not reach SoundCloud.');
        }

        $res->successful() || $this->fail('SoundCloud track not found.');

        $player = urldecode((string) $res->json('html')); // ...player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F2159496900&...
        preg_match('~api\.soundcloud\.com/tracks/(\d+)~', $player, $track) || $this->fail('That SoundCloud link is not a single track. Paste the link of one track.');
        str_contains($player, 'secret_token') && $this->fail('A private SoundCloud track cannot be played here. Make it public on SoundCloud first.');

        return $this->song(self::SOUNDCLOUD.$track[1], [
            'title' => (string) $res->json('title'),
            'channel' => $res->json('author_name'),
            'thumbnail' => $res->json('thumbnail_url'),
            'duration' => $seconds,
        ], 'soundcloud', $address);
    }

    /**
     * What the track's page says: its length in seconds (schema.org `duration`, "PT00H03M15S") and its own address (so a short on.soundcloud.com link becomes the real one).
     * If the page cannot be read the length is 0 and the room reads it from the player when the song plays (RoomController::updateDuration).
     *
     * @return array{0: int, 1: string}
     */
    private function soundcloudPage(string $url): array
    {
        try {
            $html = Http::timeout(5)->withHeaders(['User-Agent' => 'Mozilla/5.0 (compatible; SFD-DJ.EU)'])->get($url)->body();
        } catch (ConnectionException) {
            return [0, $url];
        }

        $seconds = preg_match('/itemprop="duration"\s+content="PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"/', $html, $m) ? (int) ($m[1] ?? 0) * 3600 + (int) ($m[2] ?? 0) * 60 + (int) ($m[3] ?? 0) : 0;
        $address = preg_match('~<meta property="og:url" content="(https://soundcloud\.com/[^"?#]+)"~', $html, $m) ? $m[1] : $url;

        return [$seconds, $address];
    }

    /**
     * Is each SoundCloud track still there? `$ids` are `sc:` song ids; the answer says true for the ones SoundCloud still shares (its oEmbed answers for them).
     *
     * @param  array<int, string>  $ids  song row id => youtube_id
     * @return array<int, bool> song row id => available
     */
    public function soundcloudAvailability(array $ids): array
    {
        $answers = Http::pool(fn (Pool $pool) => collect($ids)->map(
            fn (string $id, int $songId) => $pool->as((string) $songId)->timeout(6)->get('https://soundcloud.com/oembed', ['format' => 'json', 'url' => 'https://api.soundcloud.com/tracks/'.substr($id, 3)]),
        )->all()); // 3 = the length of "sc:"

        return collect($ids)->keys()->mapWithKeys(fn (int $songId) => [$songId => ($answers[(string) $songId] ?? null) instanceof Response && $answers[(string) $songId]->successful()])->all();
    }

    private function spotify(string $url, ?User $user): array
    {
        if (! preg_match('~/(track|playlist|album)/([A-Za-z0-9]+)(?:[/?#]|$)~', $url, $m)) {
            $this->fail('Not a Spotify track, playlist or album link.');
        }

        if ($m[1] === 'track') {
            return [$this->matchOnYoutube($this->spotifyTrackQuery($url), 'spotify', $url)];
        }

        // a playlist or an album: any public one, with no Spotify account (see Spotify::queries)
        preg_match('~^([A-Za-z0-9]{22})$~', $m[2], $id) || $this->fail("Spotify {$m[1]} links must include a valid 22-character {$m[1]} ID.");
        $this->youtube->hasKey() || $this->fail("Matching Spotify {$m[1]} tracks needs the YouTube API key.");

        $queries = $this->spotify->queries($m[1], $id[1], $user, self::IMPORT_LIMIT);
        if (count($queries) === Spotify::PUBLIC_LIMIT) {
            $this->importWarnings[] = "{$url}: Spotify gives out the first ".Spotify::PUBLIC_LIMIT." songs of a public {$m[1]}. If it has more, the rest is not in this import (connect Spotify in Settings if it is yours).";
        }

        $songs = [];
        foreach ($queries as $query) {
            try {
                $songs[] = $this->matchOnYoutube($query, 'spotify', $url);
            } catch (ValidationException $e) {
                $this->importWarnings[] = $query.': '.collect($e->errors())->flatten()->first();
            }
        }

        return $songs;
    }

    /** "Artist Title" for a Spotify track, read from the page's og: tags (artist is the first part of og:description). */
    private function spotifyTrackQuery(string $url): string
    {
        try {
            $html = Http::timeout(6)->withHeaders(['User-Agent' => 'Mozilla/5.0 (compatible; SFD-DJ.EU)'])->get($url)->body();
        } catch (ConnectionException) {
            $this->fail('Could not reach Spotify.');
        }

        $og = fn (string $prop) => preg_match('/<meta[^>]+property="og:'.$prop.'"[^>]+content="([^"]*)"/i', $html, $m) ? html_entity_decode($m[1], ENT_QUOTES) : '';
        $title = $og('title');
        $artist = trim(explode('·', $og('description'))[0]);

        $title !== '' || $this->fail('Spotify track not found.');

        return trim($artist.' '.$title);
    }

    /** Find the same song on YouTube. */
    private function matchOnYoutube(string $query, string $origin, string $originUrl): array
    {
        $this->youtube->hasKey() || $this->fail('Matching SoundCloud and Spotify songs needs the YouTube API key.');
        $query !== '' || $this->fail('Could not read the song title.');

        $found = $this->youtube->search($query) ?? $this->fail('YouTube search is unavailable right now.');

        foreach ($found as $candidate) {
            if ($info = $this->youtube->video($candidate['id'])) {
                return $this->song($candidate['id'], $info, $origin, $originUrl);
            }
        }

        $this->fail("No playable YouTube match for “{$query}”.");
    }

    private function song(string $id, array $info, string $origin, string $originUrl): array
    {
        return [
            'youtube_id' => $id,
            'title' => $info['title'],
            'channel' => $info['channel'] ?? null,
            'thumbnail' => $info['thumbnail'],
            'duration' => $info['duration'],
            'origin' => $origin,
            'origin_url' => $originUrl,
        ];
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['url' => $message]);
    }
}
