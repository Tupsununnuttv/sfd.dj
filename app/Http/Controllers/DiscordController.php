<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Link a Discord account to your SFD.DJ account (OAuth2, "identify" scope only: we learn your Discord id and name, nothing else).
 * Needs an application from discord.com/developers with DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in .env
 * and the redirect URL from route('discord.callback') added to its OAuth2 settings.
 */
class DiscordController extends Controller
{
    public static function configured(): bool
    {
        return filled(config('services.discord.client_id')) && filled(config('services.discord.client_secret'));
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
            'scope' => 'identify',
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

        $request->user()->forceFill(['discord_id' => $id, 'discord_username' => $me->json('global_name') ?: $me->json('username')])->save();

        return $this->back('Discord linked.');
    }

    public function disconnect(Request $request): RedirectResponse
    {
        $request->user()->forceFill(['discord_id' => null, 'discord_username' => null])->save();

        return $this->back('Discord unlinked.');
    }

    private function back(string $notice): RedirectResponse
    {
        return to_route('settings.account')->with('discord_notice', $notice);
    }
}
