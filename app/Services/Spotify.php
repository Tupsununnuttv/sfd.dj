<?php

namespace App\Services;

use App\Models\User;
use App\Support\StreamingUrl;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class Spotify
{
    private const PAGE_SIZE = 50;

    /** How many songs Spotify's public page shows of a playlist or an album. */
    public const PUBLIC_LIMIT = 100;

    /**
     * "Artist - Title" for each track of a playlist or an album (`$kind`), the words to look the song up on YouTube with.
     * Anybody's public playlist or album works, with no Spotify account at all: it is read from Spotify's public page (the first 100 songs).
     * Somebody who connected Spotify gets the whole list from Spotify's API when it is theirs (private ones too, and more than 100 songs); when it is not, the public page answers.
     *
     * @return array<int, string>
     */
    public function queries(string $kind, string $id, ?User $user, int $limit): array
    {
        if ($kind === 'playlist' && $user && filled($user->spotify_refresh_token)) {
            try {
                if ($queries = $this->playlistQueries($user, $id, $limit)) {
                    return $queries;
                }
            } catch (ValidationException) {
                // not theirs to read (Spotify allows that to the owner and collaborators), or the connection is gone: the public page may still say
            }
        }

        return $this->publicQueries($kind, $id, $limit);
    }

    /**
     * What Spotify's public embed page (open.spotify.com/embed/playlist/<id>) says: the same page a website shows when somebody embeds the playlist.
     * It needs no account and no key. A private playlist, or one that does not exist, has no track list there.
     *
     * @return array<int, string>
     */
    public function publicQueries(string $kind, string $id, int $limit): array
    {
        try {
            $html = StreamingUrl::page("https://open.spotify.com/embed/{$kind}/{$id}")->body();
        } catch (ConnectionException) {
            $this->fail('Could not reach Spotify.');
        }

        $page = preg_match('~<script id="__NEXT_DATA__" type="application/json">(.*?)</script>~s', $html, $m) ? json_decode($m[1], true) : null;
        $tracks = data_get($page, 'props.pageProps.state.data.entity.trackList');

        if (! is_array($tracks)) {
            $this->fail("Spotify shows nothing of this {$kind}: it is private or it does not exist. Make it public in Spotify (or connect the Spotify account that owns it, in Settings) and try again.");
        }

        $queries = [];
        foreach ($tracks as $track) {
            $title = trim((string) ($track['title'] ?? ''));
            $artists = trim(str_replace("\u{a0}", ' ', (string) ($track['subtitle'] ?? ''))); // "Artist,<no-break space>Another artist"
            if ($title !== '') {
                $queries[] = $artists !== '' ? $artists.' - '.$title : $title;
            }
        }

        $queries !== [] || $this->fail("There are no songs to read in this Spotify {$kind}.");

        return array_slice($queries, 0, $limit);
    }

    /** @return array<int, string> */
    public function playlistQueries(User $user, string $playlistId, int $limit): array
    {
        $accessToken = $this->accessToken($user);
        $queries = [];

        for ($offset = 0; $offset < $limit; $offset += self::PAGE_SIZE) {
            try {
                $response = $this->playlistItems($accessToken, $playlistId, $offset);
            } catch (ConnectionException) {
                $this->fail('Could not connect to Spotify to read the playlist.');
            }

            if ($response->status() === 401) {
                $accessToken = $this->accessToken($user, true);
                try {
                    $response = $this->playlistItems($accessToken, $playlistId, $offset);
                } catch (ConnectionException) {
                    $this->fail('Could not connect to Spotify to read the playlist.');
                }
            }

            if ($response->status() === 403 && str_contains(strtolower($response->body()), 'premium')) {
                $this->fail('Spotify has paused this site\'s Spotify app: its owner needs an active Spotify Premium subscription. Try again a few hours after that is fixed.');
            }
            if ($response->status() === 403) {
                $this->fail('Spotify only allows playlist tracks to be read by the playlist owner or a collaborator. Connect the account that has access to this playlist.');
            }
            if ($response->status() === 401) {
                $this->fail('Your Spotify connection expired. Disconnect and connect Spotify again in Settings → Account.');
            }
            if (! $response->successful()) {
                $this->fail('Could not read this Spotify playlist. Check that the connected account can access it.');
            }

            foreach ($response->json('items', []) as $entry) {
                $track = $entry['item'] ?? $entry['track'] ?? null;
                if (! is_array($track)) {
                    continue;
                }

                $name = trim((string) ($track['name'] ?? ''));
                $artists = collect($track['artists'] ?? [])->pluck('name')->filter()->implode(', ');
                if ($name !== '' && $artists !== '') {
                    $queries[] = $artists.' - '.$name;
                    if (count($queries) >= $limit) {
                        break;
                    }
                }
            }

            if (! is_string($response->json('next')) || $response->json('next') === '' || count($queries) >= $limit) {
                break;
            }
        }

        return $queries;
    }

    private function accessToken(User $user, bool $forceRefresh = false): string
    {
        $expiresAt = $user->spotify_token_expires_at;
        if (! $forceRefresh && filled($user->spotify_access_token) && $expiresAt?->isAfter(now()->addMinute())) {
            return $user->spotify_access_token;
        }

        $clientId = config('services.spotify.client_id');
        $clientSecret = config('services.spotify.client_secret');
        if (! filled($clientId) || ! filled($clientSecret) || ! filled($user->spotify_refresh_token)) {
            $this->fail('Connect Spotify in Settings → Account before importing playlist tracks.');
        }

        try {
            $response = Http::asForm()->withBasicAuth($clientId, $clientSecret)->timeout(10)->post('https://accounts.spotify.com/api/token', [
                'grant_type' => 'refresh_token',
                'refresh_token' => $user->spotify_refresh_token,
            ]);
        } catch (ConnectionException) {
            $this->fail('Could not refresh your Spotify connection. Please try again.');
        }

        $accessToken = $response->json('access_token');
        if (! $response->successful() || ! is_string($accessToken) || $accessToken === '') {
            $this->fail('Your Spotify connection expired. Disconnect and connect Spotify again in Settings → Account.');
        }

        $changes = [
            'spotify_access_token' => $accessToken,
            'spotify_token_expires_at' => now()->addSeconds(max(1, (int) $response->json('expires_in', 3600))),
        ];
        if (filled($response->json('refresh_token'))) {
            $changes['spotify_refresh_token'] = $response->json('refresh_token');
        }

        $user->forceFill($changes)->saveQuietly();

        return $accessToken;
    }

    private function playlistItems(string $accessToken, string $playlistId, int $offset): Response
    {
        return Http::timeout(10)->withToken($accessToken)->get('https://api.spotify.com/v1/playlists/'.$playlistId.'/items', [
            'limit' => self::PAGE_SIZE,
            'offset' => $offset,
            'fields' => 'items(item(name,artists(name))),next',
        ]);
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['url' => $message]);
    }
}
