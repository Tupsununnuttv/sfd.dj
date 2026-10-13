<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class YouTubeController extends Controller
{
    public static function configured(): bool
    {
        return filled(config('services.youtube.client_id')) && filled(config('services.youtube.client_secret'));
    }

    public function connect(Request $request): RedirectResponse
    {
        if (! self::configured()) {
            return $this->back('YouTube linking is not configured on this site yet.');
        }

        $request->session()->put('youtube_state', $state = Str::random(40));

        return redirect()->away('https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query([
            'client_id' => config('services.youtube.client_id'),
            'redirect_uri' => route('youtube.callback'),
            'response_type' => 'code',
            'scope' => 'https://www.googleapis.com/auth/youtube.readonly',
            'access_type' => 'offline',
            'include_granted_scopes' => 'true',
            'prompt' => 'consent select_account',
            'state' => $state,
        ]));
    }

    public function callback(Request $request): RedirectResponse
    {
        $state = $request->session()->pull('youtube_state');

        if (! $state || ! hash_equals($state, (string) $request->query('state'))) {
            return $this->back('The YouTube link expired or was not started here. Please try again.');
        }
        if ($request->filled('error') || ! $request->filled('code')) {
            return $this->back('YouTube linking was cancelled.');
        }
        if (! self::configured()) {
            return $this->back('YouTube linking is not configured on this site yet.');
        }

        try {
            $token = Http::asForm()->timeout(10)->post('https://oauth2.googleapis.com/token', [
                'client_id' => config('services.youtube.client_id'),
                'client_secret' => config('services.youtube.client_secret'),
                'grant_type' => 'authorization_code',
                'code' => $request->query('code'),
                'redirect_uri' => route('youtube.callback'),
            ]);
        } catch (ConnectionException) {
            return $this->back('Could not connect to Google. Please try again.');
        }

        $accessToken = $token->json('access_token');
        $refreshToken = $token->json('refresh_token');
        if (! $token->successful() || ! is_string($accessToken) || ! is_string($refreshToken)) {
            return $this->back('Google did not authorize the YouTube connection. Check that the callback URL is registered in the Google Cloud OAuth client.');
        }

        try {
            $channels = Http::withToken($accessToken)->timeout(10)->get('https://www.googleapis.com/youtube/v3/channels', [
                'part' => 'snippet',
                'mine' => 'true',
            ]);
        } catch (ConnectionException) {
            return $this->back('Could not read your YouTube channel. Please try again.');
        }

        $channelId = $channels->json('items.0.id');
        $channelTitle = $channels->json('items.0.snippet.title');
        if (! $channels->successful() || ! is_string($channelId) || $channelId === '' || ! is_string($channelTitle) || $channelTitle === '') {
            return $this->back('Google did not return a YouTube channel. Make sure this Google account has a YouTube channel and try again.');
        }

        $user = $request->user();
        if (User::where('youtube_channel_id', $channelId)->where('id', '!=', $user->id)->exists()) {
            return $this->back('That YouTube channel is already connected to another SFD.DJ account.');
        }

        $user->forceFill([
            'youtube_channel_id' => $channelId,
            'youtube_channel_title' => $channelTitle,
            'youtube_access_token' => $accessToken,
            'youtube_refresh_token' => $refreshToken,
            'youtube_token_expires_at' => now()->addSeconds(max(1, (int) $token->json('expires_in', 3600))),
        ])->save();

        return $this->back('YouTube connected. Your channel will appear on your profile and you can import playlists this account can access.');
    }

    public function disconnect(Request $request): RedirectResponse
    {
        $request->user()->forceFill([
            'youtube_channel_id' => null,
            'youtube_channel_title' => null,
            'youtube_access_token' => null,
            'youtube_refresh_token' => null,
            'youtube_token_expires_at' => null,
        ])->save();

        return $this->back('YouTube disconnected.');
    }

    private function back(string $notice): RedirectResponse
    {
        return to_route('settings.connections')->with('youtube_notice', $notice);
    }
}
