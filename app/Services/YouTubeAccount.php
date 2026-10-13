<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class YouTubeAccount
{
    public function accessToken(User $user, bool $forceRefresh = false): string
    {
        $expiresAt = $user->youtube_token_expires_at;
        if (! $forceRefresh && filled($user->youtube_access_token) && $expiresAt?->isAfter(now()->addMinute())) {
            return $user->youtube_access_token;
        }

        $clientId = config('services.youtube.client_id');
        $clientSecret = config('services.youtube.client_secret');
        if (! filled($clientId) || ! filled($clientSecret) || ! filled($user->youtube_refresh_token)) {
            $this->fail('Connect YouTube in Settings → Connections before importing your private playlists.');
        }

        try {
            $response = Http::asForm()->timeout(10)->post('https://oauth2.googleapis.com/token', [
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'grant_type' => 'refresh_token',
                'refresh_token' => $user->youtube_refresh_token,
            ]);
        } catch (ConnectionException) {
            $this->fail('Could not refresh your YouTube connection. Please try again.');
        }

        $accessToken = $response->json('access_token');
        if (! $response->successful() || ! is_string($accessToken) || $accessToken === '') {
            $this->fail('Your YouTube connection expired. Disconnect and connect YouTube again in Settings → Connections.');
        }

        $changes = [
            'youtube_access_token' => $accessToken,
            'youtube_token_expires_at' => now()->addSeconds(max(1, (int) $response->json('expires_in', 3600))),
        ];
        if (filled($response->json('refresh_token'))) {
            $changes['youtube_refresh_token'] = $response->json('refresh_token');
        }

        $user->forceFill($changes)->saveQuietly();

        return $accessToken;
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['url' => $message]);
    }
}
