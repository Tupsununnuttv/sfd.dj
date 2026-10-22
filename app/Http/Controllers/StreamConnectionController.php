<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class StreamConnectionController extends Controller
{
    public static function configured(string $provider): bool
    {
        return filled(config("services.{$provider}.client_id")) && filled(config("services.{$provider}.client_secret"));
    }

    public function connect(Request $request, string $provider): RedirectResponse
    {
        if (! self::configured($provider)) {
            return $this->back($provider, 'Account linking is not configured on this site yet.');
        }

        $request->session()->put("{$provider}_oauth", [
            'state' => $state = Str::random(64),
            'user_id' => $request->user()->id,
            'expires' => now()->addMinutes(10)->timestamp,
        ]);
        $tiktok = $provider === 'tiktok';

        return redirect()->away(($tiktok ? 'https://www.tiktok.com/v2/auth/authorize/' : 'https://id.twitch.tv/oauth2/authorize').'?'.http_build_query([
            $tiktok ? 'client_key' : 'client_id' => config("services.{$provider}.client_id"),
            'redirect_uri' => route("{$provider}.callback"),
            'response_type' => 'code',
            'scope' => $tiktok ? 'user.info.basic' : '',
            'state' => $state,
        ]));
    }

    public function callback(Request $request, string $provider): RedirectResponse
    {
        $pending = $request->session()->pull("{$provider}_oauth");
        $state = $request->query('state');
        if (! is_array($pending) || ! is_string($state) || ! hash_equals($pending['state'], $state)
            || $pending['user_id'] !== $request->user()->id || $pending['expires'] < now()->timestamp) {
            return $this->back($provider, 'The connection expired or was not started here. Please try again.');
        }
        if ($request->filled('error') || ! is_string($request->query('code')) || ! $request->filled('code')) {
            return $this->back($provider, 'Account linking was cancelled.');
        }
        if (! self::configured($provider)) {
            return $this->back($provider, 'Account linking is not configured on this site yet.');
        }

        $tiktok = $provider === 'tiktok';
        try {
            $token = Http::asForm()->connectTimeout(3)->timeout(10)->post($tiktok ? 'https://open.tiktokapis.com/v2/oauth/token/' : 'https://id.twitch.tv/oauth2/token', [
                $tiktok ? 'client_key' : 'client_id' => config("services.{$provider}.client_id"),
                'client_secret' => config("services.{$provider}.client_secret"),
                'code' => $request->query('code'),
                'grant_type' => 'authorization_code',
                'redirect_uri' => route("{$provider}.callback"),
            ]);
            $access = $token->json('access_token');
            if (! $token->successful() || ! is_string($access) || $access === '') {
                return $this->back($provider, 'Authorization failed. Please try connecting again.');
            }

            $api = Http::withToken($access)->connectTimeout(3)->timeout(10);
            $profile = $tiktok
                ? $api->get('https://open.tiktokapis.com/v2/user/info/', ['fields' => 'open_id,display_name'])
                : $api->withHeaders(['Client-Id' => config('services.twitch.client_id')])->get('https://api.twitch.tv/helix/users');
        } catch (ConnectionException) {
            return $this->back($provider, 'Could not reach the service. Please try again.');
        }

        $id = $profile->json($tiktok ? 'data.user.open_id' : 'data.0.id');
        $name = $profile->json($tiktok ? 'data.user.display_name' : 'data.0.display_name');
        $login = $tiktok ? null : $profile->json('data.0.login');
        if (! $profile->successful() || ($tiktok && $profile->json('error.code', 'ok') !== 'ok')
            || ! is_string($id) || $id === '' || strlen($id) > 255 || ! is_string($name) || $name === '' || strlen($name) > 255
            || (! $tiktok && (! is_string($login) || ! preg_match('/^[a-zA-Z0-9_]{1,25}$/', $login)))
            || ($tiktok && $token->json('open_id') !== $id)) {
            return $this->back($provider, 'The service did not return a valid account. Please try again.');
        }

        $user = $request->user();
        if (User::where("{$provider}_id", $id)->where('id', '!=', $user->id)->exists()) {
            return $this->back($provider, 'That account is already connected to another SFD-DJ.EU account.');
        }
        $values = [
            "{$provider}_id" => $id,
            "{$provider}_display_name" => $name,
            "{$provider}_access_token" => $access,
            "{$provider}_refresh_token" => is_string($token->json('refresh_token')) ? $token->json('refresh_token') : null,
            "{$provider}_token_expires_at" => now()->addSeconds(max(1, (int) $token->json('expires_in', 3600))),
        ];
        if (! $tiktok) {
            $values['twitch_login'] = strtolower($login);
        }
        try {
            $user->forceFill($values)->save();
        } catch (UniqueConstraintViolationException) {
            return $this->back($provider, 'That account is already connected to another SFD-DJ.EU account.');
        }

        return $this->back($provider, 'Account connected.', true);
    }

    public function disconnect(Request $request, string $provider): RedirectResponse
    {
        $request->session()->forget("{$provider}_oauth");
        $user = $request->user();
        $access = $user->getAttribute("{$provider}_access_token");
        if ($access && self::configured($provider)) {
            try {
                $response = Http::asForm()->connectTimeout(3)->timeout(10)->post(
                    $provider === 'tiktok' ? 'https://open.tiktokapis.com/v2/oauth/revoke/' : 'https://id.twitch.tv/oauth2/revoke',
                    $provider === 'tiktok'
                        ? ['client_key' => config('services.tiktok.client_id'), 'client_secret' => config('services.tiktok.client_secret'), 'token' => $access]
                        : ['client_id' => config('services.twitch.client_id'), 'token' => $access],
                );
                $revoked = $response->successful() && ($provider !== 'tiktok' || ! $response->json('error'));
            } catch (ConnectionException) {
                $revoked = false;
            }
        } else {
            $revoked = ! $access;
        }
        $values = array_fill_keys(array_map(fn ($field) => "{$provider}_{$field}", ['id', 'display_name', 'access_token', 'refresh_token', 'token_expires_at']), null);
        if ($provider === 'twitch') {
            $values['twitch_login'] = null;
        }
        $user->forceFill($values)->save();

        return $this->back($provider, $revoked ? 'Account disconnected.' : 'Account disconnected locally. Remove SFD-DJ.EU from your connected apps on the service to revoke its access.', $revoked);
    }

    private function back(string $provider, string $notice, bool $ok = false): RedirectResponse
    {
        return to_route('settings.connections')->with("{$provider}_notice", $notice)->with("{$provider}_notice_ok", $ok);
    }
}
