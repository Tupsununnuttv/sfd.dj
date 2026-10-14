<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\PlaylistItem;
use App\Models\Whisper;
use App\Support\DiscordRoleSync;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use PragmaRX\Google2FA\Google2FA;

class SettingsController extends Controller
{
    public function account(Request $request): Response
    {
        $user = $request->user();
        $setup = ! $user->two_factor_enabled && $user->two_factor_secret;

        return Inertia::render('Settings/Account', [
            'sessions' => $this->sessions($request),
            'twoFactor' => [
                'enabled' => $user->two_factor_enabled,
                // pending = secret generated but not yet confirmed with a code
                'pending' => (bool) $setup,
                'secret' => $setup ? $user->two_factor_secret : null,
                'otpauth' => $setup ? app(Google2FA::class)->getQRCodeUrl(config('app.name'), $user->email, $user->two_factor_secret) : null,
            ],
        ]);
    }

    public function connections(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Settings/Connections', [
            'discord' => [
                'configured' => DiscordController::configured(),
                'role_sync_configured' => DiscordRoleSync::configured(),
                'username' => $user->discord_username,
                'notice' => session('discord_notice'),
                'redirect' => $user->is_staff ? route('discord.callback') : null,
                'login_redirect' => $user->is_staff ? route('discord.login.callback') : null,
            ],
            'spotify' => [
                'configured' => SpotifyController::configured(),
                'connected' => filled($user->spotify_refresh_token),
                'display_name' => $user->spotify_display_name,
                'notice' => session('spotify_notice'),
                'notice_ok' => (bool) session('spotify_notice_ok'),
                'redirect' => $user->is_staff && $request->getHost() !== 'localhost' ? route('spotify.callback') : null, // what to add under Redirect URIs in the Spotify app (not shown for "localhost": Spotify refuses it)
            ],
            'youtube' => [
                'configured' => YouTubeController::configured(),
                'connected' => filled($user->youtube_refresh_token),
                'channel_title' => $user->youtube_channel_title,
                'channel_url' => $user->youtube_channel_id ? 'https://www.youtube.com/channel/'.$user->youtube_channel_id : null,
                'notice' => session('youtube_notice'),
                'redirect' => $user->is_staff ? route('youtube.callback') : null,
            ],
        ]);
    }

    /** Every browser or device this account is logged in on (needs the database session driver). */
    private function sessions(Request $request): array
    {
        if (config('session.driver') !== 'database') {
            return ['supported' => false, 'list' => []];
        }

        $current = $request->session()->getId();
        $rows = DB::table(config('session.table', 'sessions'))->where('user_id', $request->user()->id)->orderByDesc('last_activity')->get();

        return ['supported' => true, 'list' => $rows->map(fn ($row) => [
            'id' => $row->id,
            'current' => $row->id === $current,
            'ip' => $row->ip_address,
            'last_active' => Carbon::createFromTimestamp($row->last_activity)->toIso8601String(),
        ] + $this->describeAgent((string) $row->user_agent))->values()->all()];
    }

    /** "Chrome on Windows" from a user agent text. Good enough to recognise your own devices. */
    private function describeAgent(string $ua): array
    {
        $browser = match (true) {
            str_contains($ua, 'Edg/') => 'Edge',
            str_contains($ua, 'OPR/'), str_contains($ua, 'Opera') => 'Opera',
            str_contains($ua, 'Firefox/') => 'Firefox',
            str_contains($ua, 'Chrome/') => 'Chrome',
            str_contains($ua, 'Safari/') => 'Safari',
            default => 'Unknown browser',
        };
        $os = match (true) {
            str_contains($ua, 'Android') => 'Android',
            str_contains($ua, 'iPhone'), str_contains($ua, 'iPad') => 'iOS',
            str_contains($ua, 'Windows') => 'Windows',
            str_contains($ua, 'Mac OS') => 'macOS',
            str_contains($ua, 'Linux') => 'Linux',
            default => 'Unknown system',
        };

        return ['browser' => $browser, 'os' => $os, 'mobile' => (bool) preg_match('/Mobile|Android|iPhone|iPad/i', $ua)];
    }

    /** Log out one other device. */
    public function revokeSession(Request $request, string $id): RedirectResponse
    {
        abort_if($id === $request->session()->getId(), 422, 'That is this browser. Use Log out.');
        DB::table(config('session.table', 'sessions'))->where('user_id', $request->user()->id)->where('id', $id)->delete();

        return back();
    }

    /** Log out everywhere except here. Needs the password, so somebody at an unlocked computer cannot do it. */
    public function revokeOtherSessions(Request $request): RedirectResponse
    {
        $request->validate(['password' => ['required', 'current_password']]);
        DB::table(config('session.table', 'sessions'))->where('user_id', $request->user()->id)->where('id', '!=', $request->session()->getId())->delete();

        return back();
    }

    /** Everything we keep about you as one JSON file. Never includes password hashes, two-factor secrets or API tokens. */
    public function export(Request $request): JsonResponse
    {
        $me = $request->user();
        $whispers = Whisper::where('from_id', $me->id)->orWhere('to_id', $me->id)->orderBy('id')->with(['sender:id,username', 'receiver:id,username'])->get();

        $data = [
            'exported_at' => now()->toIso8601String(),
            'account' => $me->only('name', 'username', 'email', 'bio', 'favorite_genre', 'xp', 'level', 'roles', 'discord_username') + ['joined' => $me->created_at->toIso8601String(), 'email_verified' => $me->hasVerifiedEmail()],
            'preferences' => $me->preferences,
            'shop_items' => $me->cosmetics,
            'friends' => $me->friends()->map->only('username', 'name')->values(),
            'rooms_created' => $me->rooms()->get(['name', 'slug', 'description', 'genre', 'is_private', 'created_at']),
            'playlists' => $me->playlists()->with('songs')->get()->map(fn ($p) => ['name' => $p->name, 'kind' => $p->kind, 'songs' => $p->songs->map->only('title', 'youtube_id')->values()]),
            'whispers' => $whispers->map(fn ($w) => ['from' => $w->sender?->username, 'to' => $w->receiver?->username, 'body' => $w->body, 'at' => $w->created_at->toIso8601String()])->values(),
            'violations' => $me->violations()->get(['reason', 'created_at']),
            'counts' => [
                'songs_played' => PlaylistItem::where('user_id', $me->id)->whereNotNull('played_at')->count(),
                'chat_messages' => ChatMessage::where('user_id', $me->id)->where('type', 'user')->count(),
                'people_invited' => $me->referrals()->count(),
            ],
        ];

        return response()->json($data, 200, ['Content-Disposition' => 'attachment; filename="sfddj-my-data-'.now()->format('Y-m-d').'.json"'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public function violations(Request $request): Response
    {
        return Inertia::render('Settings/Violations', [
            'violations' => $request->user()->violations()->get(['id', 'reason', 'created_at']),
        ]);
    }

    public function updatePreferences(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'appearance.chat_size' => ['sometimes', Rule::in(['small', 'normal', 'large'])],
            'appearance.show_avatars' => ['sometimes', 'boolean'],
            'appearance.always_animate' => ['sometimes', 'boolean'],
            'appearance.compact' => ['sometimes', 'boolean'],
            'room.autowoot' => ['sometimes', 'boolean'],
            'audio.default_volume' => ['sometimes', 'integer', 'between:0,100'],
            'audio.mute_on_join' => ['sometimes', 'boolean'],
            'notifications.friend_requests' => ['sometimes', 'boolean'],
            'notifications.announcements' => ['sometimes', 'boolean'],
            'notifications.whispers' => ['sometimes', 'boolean'],
            'notifications.mentions' => ['sometimes', 'boolean'],
            'notifications.desktop' => ['sometimes', 'boolean'],
            'appearance.show_badges' => ['sometimes', 'boolean'],
            'appearance.show_activity' => ['sometimes', 'boolean'],
            'privacy.whispers' => ['sometimes', Rule::in(['everyone', 'friends', 'nobody'])],
            'privacy.friend_requests' => ['sometimes', 'boolean'],
            'privacy.show_online' => ['sometimes', 'boolean'],
        ]);

        $user = $request->user();
        $user->forceFill(['preferences' => array_replace_recursive($user->preferences ?? [], $data)])->save();

        return back();
    }
}
