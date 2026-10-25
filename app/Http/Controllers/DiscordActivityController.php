<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\User;
use App\Support\DiscordActivity;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The website as a Discord Activity (see docs/discord-activity.md): a light page with the live rooms, opened by Discord at the site's
 * root (SiteController::home hands over when Discord adds frame_id) or at /discord. Rooms themselves play on the full website: their
 * video, sockets and pictures live on other addresses than the Activity's own, which Discord's proxy blocks without URL mappings.
 * Signing in uses the Activity OAuth flow (authorize in the SDK, the code exchanged here with the client secret) with the `identify`
 * scope only, and only for a Discord account that is already linked to an SFD-DJ.EU account (Settings > Connections).
 */
class DiscordActivityController extends DiscordController
{
    public function show(Request $request): Response
    {
        $me = $request->user();
        $site = DiscordActivity::siteUrl();

        return Inertia::render('Discord/Activity', [
            'applicationId' => self::configured() ? (string) config('services.discord.client_id') : null, // public (it is in every Discord invite); the secret never leaves the server
            'siteUrl' => $site,
            'rooms' => fn () => SiteController::topRooms($me, 12)->map(fn (array $room) => $room + ['url' => "{$site}/rooms/{$room['slug']}"])->all(),
        ]);
    }

    /** Trades the code the Discord SDK gave the Activity for a signed-in session, the same way "Log in with Discord" does. */
    public function token(Request $request): JsonResponse
    {
        abort_unless(self::configured(), 503, 'Discord is not set up on this site yet.');
        $code = $request->validate(['code' => ['required', 'string', 'max:512']])['code'];

        $accessToken = '';

        try {
            $token = Http::asForm()->timeout(10)->post('https://discord.com/api/oauth2/token', [
                'client_id' => config('services.discord.client_id'),
                'client_secret' => config('services.discord.client_secret'),
                'grant_type' => 'authorization_code',
                'code' => $code, // an Activity's code is exchanged without a redirect_uri
            ]);
            $accessToken = (string) $token->json('access_token');
            if (! $token->ok()) {
                // invalid_client = the id and secret in .env are not the same Discord app; invalid_grant = the code was old or used twice
                Log::warning('Discord Activity sign-in: Discord refused the code.', ['status' => $token->status(), 'error' => $token->json('error')]);
            }
            $me = $token->ok() && $accessToken !== ''
                ? Http::withToken($accessToken)->timeout(10)->get('https://discord.com/api/users/@me')
                : null;
        } catch (ConnectionException) {
            if ($accessToken !== '') {
                $this->revokeAccessToken($accessToken);
            }

            return response()->json(['message' => 'Discord could not be reached. Please try again later.'], 503);
        }

        // the Activity only needs to know who this is: the Discord token is not kept, and never sent to the browser
        if ($accessToken !== '') {
            $this->revokeAccessToken($accessToken);
        }
        if (! $me?->ok() || ! $me->json('id')) {
            return response()->json(['message' => 'Discord could not verify your account. Please try again.'], 422);
        }

        $user = User::where('discord_id', (string) $me->json('id'))->first();

        if (! $user) {
            return response()->json(['status' => 'unlinked']);
        }
        // these two cannot be finished inside the Activity: the full website asks for the email link and the two-factor code
        if ($user->two_factor_enabled) {
            return response()->json(['status' => 'two-factor']);
        }
        if (! $user->hasVerifiedEmail() && Setting::verificationRequired()) {
            return response()->json(['status' => 'unverified']);
        }

        $request->session()->regenerate();
        Auth::login($user);
        $request->session()->put('auth_version', (int) $user->auth_version);

        return response()->json(['status' => 'signed-in']);
    }
}
