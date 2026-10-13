<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\DiscordRoleSync;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Link a Discord account and, with the member's consent, join the configured SFD.DJ guild and synchronize its mapped roles.
 * OAuth requests identify and guilds.join only; the site never reads Discord messages. Role synchronization also needs a bot in that guild.
 */
class DiscordController extends Controller
{
    public static function configured(): bool
    {
        return filled(config('services.discord.client_id')) && filled(config('services.discord.client_secret'));
    }

    public function login(Request $request): RedirectResponse
    {
        if (! self::configured()) {
            return to_route('login')->with('discord_error', 'Discord login is not set up on this site yet.');
        }

        $request->session()->put('discord_login_state', $state = Str::random(40));

        return redirect()->away('https://discord.com/oauth2/authorize?'.http_build_query([
            'client_id' => config('services.discord.client_id'),
            'response_type' => 'code',
            'redirect_uri' => route('discord.login.callback'),
            'scope' => 'identify',
            'state' => $state,
        ]));
    }

    public function loginCallback(Request $request): RedirectResponse
    {
        $state = $request->session()->pull('discord_login_state');

        if (! $state || ! hash_equals($state, (string) $request->query('state'))) {
            return to_route('login')->with('discord_error', 'The Discord login took too long or was not started here. Please try again.');
        }
        if ($request->filled('error') || ! $request->filled('code')) {
            return to_route('login')->with('discord_error', 'Discord login was cancelled.');
        }

        $accessToken = '';

        try {
            $token = Http::asForm()->timeout(10)->post('https://discord.com/api/oauth2/token', [
                'client_id' => config('services.discord.client_id'),
                'client_secret' => config('services.discord.client_secret'),
                'grant_type' => 'authorization_code',
                'code' => $request->query('code'),
                'redirect_uri' => route('discord.login.callback'),
            ]);
            $accessToken = (string) $token->json('access_token');
            $me = $token->ok() && $accessToken !== ''
                ? Http::withToken($accessToken)->timeout(10)->get('https://discord.com/api/users/@me')
                : null;
        } catch (ConnectionException) {
            if ($accessToken !== '') {
                $this->revokeAccessToken($accessToken);
            }

            return to_route('login')->with('discord_error', 'Discord could not be reached. Please try again later.');
        }

        if (! $me?->ok() || ! $me->json('id')) {
            $this->revokeAccessToken($accessToken);

            return to_route('login')->with('discord_error', 'Discord could not verify your account. Please try again.');
        }

        $user = User::where('discord_id', (string) $me->json('id'))->first();
        $this->revokeAccessToken($accessToken);

        if (! $user) {
            return to_route('login')->with('discord_error', 'This Discord account is not linked to an SFD.DJ account. Log in with your password and connect Discord in Settings > Connections.');
        }

        $request->session()->regenerate();

        if ($user->two_factor_enabled) {
            $request->session()->put(['two_factor.id' => $user->id, 'two_factor.remember' => false]);

            return to_route('two-factor.challenge');
        }

        Auth::login($user);

        return redirect()->intended(route('dashboard', absolute: false));
    }

    public function connect(Request $request): RedirectResponse
    {
        if (! self::configured()) {
            return $this->back('Discord linking is not set up on this site yet.');
        }

        $request->session()->put('discord_state', $state = Str::random(40));

        return redirect()->away('https://discord.com/oauth2/authorize?'.http_build_query([
            'client_id' => config('services.discord.client_id'),
            'response_type' => 'code',
            'redirect_uri' => route('discord.callback'),
            'scope' => 'identify guilds.join',
            'state' => $state,
            'prompt' => 'consent',
        ]));
    }

    public function callback(Request $request): RedirectResponse
    {
        $state = $request->session()->pull('discord_state');

        if (! $state || ! hash_equals($state, (string) $request->query('state'))) {
            return $this->back('The Discord link took too long or was not started here. Please try again.');
        }
        if ($request->filled('error') || ! $request->filled('code')) {
            return $this->back('Discord linking was cancelled.');
        }

        $token = Http::asForm()->timeout(10)->post('https://discord.com/api/oauth2/token', [
            'client_id' => config('services.discord.client_id'),
            'client_secret' => config('services.discord.client_secret'),
            'grant_type' => 'authorization_code',
            'code' => $request->query('code'),
            'redirect_uri' => route('discord.callback'),
        ]);
        $me = $token->ok() ? Http::withToken($token->json('access_token'))->timeout(10)->get('https://discord.com/api/users/@me') : null;

        if (! $me?->ok() || ! $me->json('id')) {
            return $this->back('Discord did not accept the link. Please try again.');
        }

        $id = (string) $me->json('id');
        if (User::where('discord_id', $id)->where('id', '!=', $request->user()->id)->exists()) {
            return $this->back('That Discord account is already linked to another SFD.DJ account.');
        }

        $user = $request->user();
        $user->forceFill(['discord_id' => $id, 'discord_username' => $me->json('global_name') ?: $me->json('username')])->save();
        $roleSyncError = DiscordRoleSync::sync($user, (string) $token->json('access_token'));
        $this->revokeAccessToken((string) $token->json('access_token'));

        return $this->back($roleSyncError ? "Discord linked, but server role sync failed: {$roleSyncError}" : 'Discord linked and SFD.DJ roles synced.');
    }

    public function disconnect(Request $request): RedirectResponse
    {
        $user = $request->user();
        $roleSyncError = DiscordRoleSync::sync($user, clear: true);
        $user->forceFill(['discord_id' => null, 'discord_username' => null])->save();

        return $this->back($roleSyncError ? "Discord unlinked, but server roles could not be removed: {$roleSyncError}" : 'Discord unlinked and SFD.DJ roles removed.');
    }

    private function revokeAccessToken(string $accessToken): void
    {
        try {
            Http::asForm()->timeout(5)->post('https://discord.com/api/oauth2/token/revoke', [
                'client_id' => config('services.discord.client_id'),
                'client_secret' => config('services.discord.client_secret'),
                'token' => $accessToken,
                'token_type_hint' => 'access_token',
            ]);
        } catch (ConnectionException) {
        }
    }

    private function back(string $notice): RedirectResponse
    {
        return to_route('settings.connections')->with('discord_notice', $notice);
    }
}
