<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class Spotify
{
    private const PAGE_SIZE = 50;

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
