<?php

namespace App\Http\Middleware;

use App\Models\Friendship;
use App\Models\Setting;
use App\Models\User;
use App\Models\Whisper;
use App\Support\MailStatus;
use App\Support\Plans;
use App\Support\PublicStats;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    private function guest(): User
    {
        $guest = new User(['name' => 'Guest']);
        $guest->id = 0;
        $guest->xp = 0;

        return $guest;
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            // Guests get a placeholder user so pages that anyone may open never see null.
            'auth' => [
                'user' => $request->user() ?? $this->guest(),
                'guest' => $request->user() === null,
                'coins' => (int) ($request->user()?->coins ?? 0), // SFD Coins: only your own, never in the other people's user data
                'limits' => $request->user()?->limits() ?? Plans::FREE, // how many playlists, songs and room emojis you may have (more with a plan)
            ],
            // somebody who has not confirmed their email yet: must they, can the site send the message, and what became of the last one (the banner and the confirm page use it)
            'verification' => fn () => ($u = $request->user()) && ! $u->hasVerifiedEmail()
                ? ['required' => Setting::verificationRequired(), 'mail' => MailStatus::configured(), 'status' => str_starts_with((string) $request->session()->get('status'), 'verification-link-') ? $request->session()->get('status') : null]
                : null,
            'pendingFriends' => fn () => $request->user()
                ? Friendship::where('friend_id', $request->user()->id)->where('status', 'pending')->count()
                : 0,
            'unreadWhispers' => fn () => $request->user() ? Whisper::where('to_id', $request->user()->id)->whereNull('read_at')->count() : 0,
            // social links and the donation goal, both edited in Admin panel → Community
            'community' => fn () => Setting::community(),
            // the numbers shown on the log in and register pages (nobody logged in needs more)
            'siteStats' => fn () => $request->user() ? null : PublicStats::get(),
            // one-time recovery codes, flashed right after 2FA is confirmed
            'recoveryCodes' => fn () => $request->session()->get('recovery_codes'),
        ];
    }
}
