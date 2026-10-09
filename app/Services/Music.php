<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

/**
 * Turns a pasted link into playable songs. Rooms play YouTube, so SoundCloud and Spotify tracks are
 * matched to the same song on YouTube (a search, so it can pick the wrong version).
 *
 * Every song comes back as: youtube_id, title, channel, thumbnail, duration, origin, origin_url.
 */
class Music
{
    /** Songs per import. Matching a SoundCloud/Spotify track costs one YouTube search (100 quota units). */
    public const IMPORT_LIMIT = 25;

    public function __construct(private YouTube $youtube) {}

    /** @return array<int, array> */
    public function resolve(string $url): array
    {
        $url = trim($url);
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));

        if (preg_match('/(^|\.)soundcloud\.com$/', $host)) {
            return [$this->soundcloud($url)];
        }
        if ($host === 'open.spotify.com') {
            return $this->spotify($url);
        }
        if (str_contains($host, 'youtube.com') || $host === 'youtu.be') {
            return $this->youtubeLink($url);
        }

        $this->fail('That link is not from YouTube, SoundCloud or Spotify.');
    }

    /** Resolve one link per line. Returns the songs found and an error message for each line that failed. */
    public function resolveMany(string $text): array
    {
        $songs = [];
        $errors = [];
        $lines = array_slice(array_values(array_filter(array_map('trim', preg_split('/\R/', $text)))), 0, self::IMPORT_LIMIT);

        foreach ($lines as $line) {
            try {
                foreach ($this->resolve($line) as $song) {
                    $songs[] = $song;
                }
            } catch (ValidationException $e) {
                $errors[] = $line.': '.collect($e->errors())->flatten()->first();
            }
        }

        return [array_slice($songs, 0, self::IMPORT_LIMIT), $errors];
    }

    private function youtubeLink(string $url): array
    {
        $isPlaylistPage = str_contains($url, 'youtube.com/playlist');

        if (! $isPlaylistPage && ($id = $this->youtube->idFromUrl($url))) {
            $info = $this->youtube->video($id) ?? $this->fail('That video was not found or cannot be embedded.');

            return [$this->song($id, $info, 'youtube', $url)];
        }

        if (preg_match('/[?&]list=([\w-]+)/', $url, $m)) {
            $items = $this->youtube->playlist($m[1], self::IMPORT_LIMIT);
            $items ?: $this->fail('That YouTube playlist is empty, private or needs the YouTube API key.');

            return array_map(fn ($i) => $this->song($i['id'], $i, 'youtube', $url), $items);
        }

        $this->fail('Not a YouTube video or playlist link.');
    }

    private function soundcloud(string $url): array
    {
        if (str_contains($url, '/sets/')) {
            $this->fail('SoundCloud playlists cannot be imported (SoundCloud needs separate API access). Add the tracks one by one.');
        }

        try {
            $res = Http::timeout(5)->get('https://soundcloud.com/oembed', ['format' => 'json', 'url' => $url]);
        } catch (ConnectionException) {
            $this->fail('Could not reach SoundCloud.');
        }

        $res->successful() || $this->fail('SoundCloud track not found.');

        // oEmbed titles look like "Song name by Artist"
        return $this->matchOnYoutube((string) $res->json('title'), 'soundcloud', $url);
    }

    private function spotify(string $url): array
    {
        if (! preg_match('~/(track|playlist|album)/(\w+)~', $url, $m)) {
            $this->fail('Not a Spotify track, playlist or album link.');
        }

        if ($m[1] === 'track') {
            return [$this->matchOnYoutube($this->spotifyTrackQuery($url), 'spotify', $url)];
        }

        // Playlists and albums need Spotify API credentials; oEmbed does not list their tracks.
        $token = $this->spotifyToken() ?? $this->fail('Spotify playlists and albums need SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env. Add single tracks instead.');

        $path = $m[1] === 'playlist' ? "playlists/{$m[2]}/tracks?limit=".self::IMPORT_LIMIT : "albums/{$m[2]}/tracks?limit=".self::IMPORT_LIMIT;
        $res = Http::timeout(8)->withToken($token)->get('https://api.spotify.com/v1/'.$path);
        $res->successful() || $this->fail('Spotify did not return that list (is it private?).');

        $songs = [];
        foreach ($res->json('items', []) as $item) {
            $t = $item['track'] ?? $item;
            $query = ($t['artists'][0]['name'] ?? '').' '.($t['name'] ?? '');
            try {
                $songs[] = $this->matchOnYoutube(trim($query), 'spotify', $url);
            } catch (ValidationException) {
                // skip tracks with no playable match
            }
        }

        return $songs ?: $this->fail('None of the tracks could be matched on YouTube.');
    }

    /** "Artist Title" for a Spotify track, read from the page's og: tags (artist is the first part of og:description). */
    private function spotifyTrackQuery(string $url): string
    {
        try {
            $html = Http::timeout(6)->withHeaders(['User-Agent' => 'Mozilla/5.0 (compatible; SFD.DJ)'])->get($url)->body();
        } catch (ConnectionException) {
            $this->fail('Could not reach Spotify.');
        }

        $og = fn (string $prop) => preg_match('/<meta[^>]+property="og:'.$prop.'"[^>]+content="([^"]*)"/i', $html, $m) ? html_entity_decode($m[1], ENT_QUOTES) : '';
        $title = $og('title');
        $artist = trim(explode('·', $og('description'))[0]);

        $title !== '' || $this->fail('Spotify track not found.');

        return trim($artist.' '.$title);
    }

    private function spotifyToken(): ?string
    {
        $id = config('services.spotify.client_id');
        $secret = config('services.spotify.client_secret');

        if (! $id || ! $secret) {
            return null;
        }

        return Cache::remember('spotify_token', 3000, function () use ($id, $secret) {
            $res = Http::timeout(6)->asForm()->withBasicAuth($id, $secret)->post('https://accounts.spotify.com/api/token', ['grant_type' => 'client_credentials']);

            return $res->successful() ? $res->json('access_token') : null;
        });
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
