<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
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
    public const IMPORT_LIMIT = 1000;

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

    private function spotify(string $url, ?User $user): array
    {
        if (! preg_match('~/(track|playlist|album)/([A-Za-z0-9]+)(?:[/?#]|$)~', $url, $m)) {
            $this->fail('Not a Spotify track, playlist or album link.');
        }

        if ($m[1] === 'track') {
            return [$this->matchOnYoutube($this->spotifyTrackQuery($url), 'spotify', $url)];
        }

        if ($m[1] === 'playlist') {
            preg_match('~^([A-Za-z0-9]{22})$~', $m[2], $id) || $this->fail('Spotify playlist links must include a valid 22-character playlist ID.');

            $user || $this->fail('Connect Spotify in Settings → Account before importing playlist tracks.');
            $this->youtube->hasKey() || $this->fail('Matching Spotify playlist tracks needs the YouTube API key.');

            $queries = $this->spotify->playlistQueries($user, $id[1], self::IMPORT_LIMIT);
            $queries || $this->fail('Spotify playlist is empty or not publicly accessible.');

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

        $this->fail('Spotify album imports are not supported. Paste individual Spotify track links instead.');
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
