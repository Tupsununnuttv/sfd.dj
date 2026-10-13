<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SpotifyController extends Controller
{
    public static function configured(): bool
    {
        return filled(config('services.spotify.client_id')) && filled(config('services.spotify.client_secret'));
    }

    public function connect(Request $request): RedirectResponse
    {
        if (! self::configured()) {
            return $this->back('Spotify linking is not configured on this site yet.');
        }

        $request->session()->put('spotify_state', $state = Str::random(40));

        return redirect()->away('https://accounts.spotify.com/authorize?'.http_build_query([
            'client_id' => config('services.spotify.client_id'),
            'response_type' => 'code',
            'redirect_uri' => route('spotify.callback'),
            'scope' => 'playlist-read-private',
            'state' => $state,
        ]));
    }

    public function callback(Request $request): RedirectResponse
    {
        $state = $request->session()->pull('spotify_state');

        if (! $state || ! hash_equals($state, (string) $request->query('state'))) {
            return $this->back('The Spotify link expired or was not started here. Please try again.');
        }
        if ($request->filled('error') || ! $request->filled('code')) {
            return $this->back('Spotify linking was cancelled.');
        }
        if (! self::configured()) {
            return $this->back('Spotify linking is not configured on this site yet.');
        }

        try {
            $token = Http::asForm()->withBasicAuth(config('services.spotify.client_id'), config('services.spotify.client_secret'))
                ->timeout(10)->post('https://accounts.spotify.com/api/token', [
                    'grant_type' => 'authorization_code',
                    'code' => $request->query('code'),
                    'redirect_uri' => route('spotify.callback'),
                ]);
        } catch (ConnectionException) {
            return $this->back('Could not connect to Spotify. Please try again.');
        }

        $accessToken = $token->json('access_token');
        $refreshToken = $token->json('refresh_token');
        if (! $token->successful() || ! is_string($accessToken) || ! is_string($refreshToken)) {
            return $this->back('Spotify did not authorize the connection. Check that the callback URL is registered in the Spotify app.');
        }

        try {
            $profile = Http::withToken($accessToken)->timeout(10)->get('https://api.spotify.com/v1/me');
        } catch (ConnectionException) {
            return $this->back('Could not read the Spotify account. Please try again.');
        }

        $spotifyId = $profile->json('id');
        if (! $profile->successful() || ! is_string($spotifyId) || $spotifyId === '') {
            return $this->back('Spotify did not return an account profile. Please try connecting again.');
        }

        $user = $request->user();
        if (User::where('spotify_id', $spotifyId)->where('id', '!=', $user->id)->exists()) {
            return $this->back('That Spotify account is already connected to another SFD-DJ.EU account.');
        }

        $user->forceFill([
            'spotify_id' => $spotifyId,
            'spotify_display_name' => $profile->json('display_name'),
            'spotify_access_token' => $accessToken,
            'spotify_refresh_token' => $refreshToken,
            'spotify_token_expires_at' => now()->addSeconds(max(1, (int) $token->json('expires_in', 3600))),
        ])->save();

        return $this->back('Spotify connected. You can import playlists owned by or shared with this account.');
    }

    public function disconnect(Request $request): RedirectResponse
    {
        $request->user()->forceFill([
            'spotify_id' => null,
            'spotify_display_name' => null,
            'spotify_access_token' => null,
            'spotify_refresh_token' => null,
            'spotify_token_expires_at' => null,
        ])->save();

        return $this->back('Spotify disconnected.');
    }

    private function back(string $notice): RedirectResponse
    {
        return to_route('settings.connections')->with('spotify_notice', $notice);
    }
}
