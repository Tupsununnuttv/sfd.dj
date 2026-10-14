<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
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

        // Spotify takes only https return addresses, or http://127.0.0.1 and http://[::1] on your own computer: never "localhost"
        if ($request->getHost() === 'localhost') {
            return $this->back('Spotify does not accept "localhost". Open this site as '.str_replace('localhost', '127.0.0.1', $request->getSchemeAndHttpHost()).' (same port), log in there and press Connect Spotify again.');
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
            return $this->refused('Spotify did not authorize the connection. Check that the callback URL is registered in the Spotify app.', $token);
        }

        try {
            $profile = Http::withToken($accessToken)->timeout(10)->get('https://api.spotify.com/v1/me');
        } catch (ConnectionException) {
            return $this->back('Could not read the Spotify account. Please try again.');
        }

        $spotifyId = $profile->json('id');
        if (! $profile->successful() || ! is_string($spotifyId) || $spotifyId === '') {
            return $this->refused('Spotify did not return an account profile.'.($profile->status() === 403
                ? ' The Spotify app is in Development Mode: this Spotify account must be listed under User Management in the Spotify Dashboard, and the owner of the app needs Spotify Premium.'
                : ' Please try connecting again.'), $profile);
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

        return $this->back('Spotify connected. You can import playlists owned by or shared with this account.', ok: true);
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

        return $this->back('Spotify disconnected.', ok: true);
    }

    /** Back to Settings → Connections with a message: green when it worked ($ok), red when it did not. */
    private function back(string $notice, bool $ok = false): RedirectResponse
    {
        return to_route('settings.connections')->with('spotify_notice', $notice)->with('spotify_notice_ok', $ok);
    }

    /** Spotify said no: write what it answered to the log (never a token) and show it after our own words, so the cause is not a guess. */
    private function refused(string $notice, Response $response): RedirectResponse
    {
        $why = $response->json('error_description') ?? $response->json('error.message') ?? $response->json('error');
        $why = is_string($why) ? $why : Str::limit(trim($response->body()), 200);

        Log::warning('Spotify linking: '.$notice, ['status' => $response->status(), 'spotify_said' => $why]);

        return $this->back($notice.' (Spotify answered '.$response->status().($why !== '' ? ': '.$why : '').')');
    }
}
