<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Models\Announcement;
use App\Models\ChatMessage;
use App\Models\IpBan;
use App\Models\PlaylistItem;
use App\Models\Room;
use App\Models\RoomLog;
use App\Models\Setting;
use App\Models\SitePermission;
use App\Models\SupportTicket;
use App\Models\User;
use App\Models\Violation;
use App\Support\Awards;
use App\Support\DiscordRoleSync;
use App\Support\MailStatus;
use App\Support\Plans;
use App\Support\RoomPresence;
use App\Support\Stripe;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AdminController extends Controller
{
    public function index(Request $request): Response
    {
        $actor = $this->allow($request, 'admin.access');
        $q = trim((string) $request->query('q'));
        $role = Role::tryFrom((string) $request->query('role'))?->value;
        $type = in_array($request->query('type'), ['bots', 'online'], true) ? $request->query('type') : null;
        $sort = in_array($request->query('sort'), ['newest', 'oldest', 'xp', 'seen'], true) ? $request->query('sort') : 'newest';

        return Inertia::render('Admin', [
            'q' => $q,
            'filters' => ['role' => $role, 'type' => $type, 'sort' => $sort],
            'stats' => [
                'users' => User::count(),
                'rooms' => Room::count(),
                'messages' => ChatMessage::count(),
                'songs_played' => PlaylistItem::whereNotNull('played_at')->count(),
            ],
            'overview' => $this->overview($actor),
            'users' => User::query()
                ->when($q, fn ($query) => $query->where(fn ($w) => $w->whereLike('name', "%{$q}%")->orWhereLike('username', "%{$q}%")->orWhereLike('email', "%{$q}%")))
                ->when($role, fn ($query) => $query->whereJsonContains('roles', $role))
                ->when($type === 'bots', fn ($query) => $query->where('is_bot', true))
                ->when($type === 'online', fn ($query) => $query->where('last_seen_at', '>', now()->subMinutes(5)))
                ->when($sort === 'oldest', fn ($query) => $query->orderBy('id'))
                ->when($sort === 'xp', fn ($query) => $query->orderByDesc('xp')->orderBy('id'))
                ->when($sort === 'seen', fn ($query) => $query->orderByRaw('last_seen_at is null')->orderByDesc('last_seen_at'))
                ->when($sort === 'newest', fn ($query) => $query->orderByDesc('id'))
                ->simplePaginate(15)->withQueryString()
                ->through(fn (User $u) => $u->only('id', 'name', 'username', 'email', 'avatar', 'roles', 'xp', 'level', 'primary_role', 'badges', 'is_bot') + [
                    'awards' => Awards::clean($u->awards),
                    'plan' => $u->activePlan(),
                    'plan_until' => $u->activePlan() ? $u->plan_until?->toIso8601String() : null,
                    'plan_paid' => $u->activePlan() && filled($u->stripe_subscription_id), // bought through Stripe: Stripe runs it
                    'email_verified' => $u->hasVerifiedEmail(),
                    'editable' => $actor->hasPermission('users.manage') && $actor->outranks($u),
                    'violations' => $u->violations()->count(),
                    'joined' => $u->created_at->toIso8601String(),
                    'last_seen_at' => $u->last_seen_at?->toIso8601String(),
                ]),
            'roleGroups' => Role::GROUPS,
            'awardList' => Awards::catalog(),
            'planList' => array_map(fn ($key, $t) => ['key' => $key, 'name' => $t['name'], 'color' => $t['color']], array_keys(Plans::TIERS), Plans::TIERS),
            'roleOptions' => array_values(array_filter(Role::meta(), fn ($r) => $r['key'] !== 'member')),
            'rooms' => Room::with('user:id,name')->withCount('items')->latest()->get(),
            'counts' => (object) RoomPresence::counts(),
            'openTickets' => SupportTicket::where('status', 'open')->count(),
            'assignable' => array_values(array_map(fn (Role $r) => $r->info(), $this->grantable($actor))),
            'matrix' => [
                'roles' => Role::meta(), // every role in rank order, the plain User last (it shows what everybody has: nothing extra)
                'permissions' => Role::PERMISSIONS,
                'granted' => SitePermission::matrix(),
                'editable' => $this->isOwner($actor),
            ],
            'announcements' => Announcement::latest()->limit(10)->get(['id', 'message', 'level', 'created_at']),
            'ipBans' => IpBan::latest()->get(['id', 'ip', 'reason', 'created_at']),
            'maintenance' => Setting::get('maintenance') === '1',
            // the mail setup (server, from address) goes only to those who may open the Email tab
            'email' => $actor->hasPermission('maintenance.toggle') ? MailStatus::describe() + [
                'choice' => Setting::get('email_verification') ?? 'required', // what staff chose
                'enforced' => Setting::verificationRequired(), // what is true now: "required" only counts while the site can send mail
                'unverified' => User::where('is_bot', false)->whereNull('email_verified_at')->count(),
                'test' => $request->session()->get('mail_test'),
            ] : null,
            'myIp' => $request->ip(),
        ]);
    }

    /** The first tab: numbers that matter today, two weeks of activity, what just happened, and whether the site is set up properly. */
    private function overview(User $actor): array
    {
        $days = collect(range(13, 0))->map(fn ($i) => now()->subDays($i)->toDateString());
        $perDay = function (string $table, string $column = 'created_at', ?callable $where = null) use ($days) {
            $rows = DB::table($table)->when($where, fn ($q) => $where($q))->where($column, '>=', $days->first())
                ->selectRaw("date({$column}) as d, count(*) as n")->groupBy('d')->pluck('n', 'd');

            return $days->map(fn ($d) => ['day' => $d, 'n' => (int) ($rows[$d] ?? 0)])->all();
        };
        $listening = array_sum(RoomPresence::counts());

        return [
            'kpis' => [
                'online' => max($listening, User::where('last_seen_at', '>', now()->subMinutes(5))->count()),
                'listening' => $listening,
                'active_24h' => User::where('last_seen_at', '>', now()->subDay())->count(),
                'new_7d' => User::where('created_at', '>=', now()->subDays(7))->count(),
                'messages_24h' => ChatMessage::where('type', 'user')->where('created_at', '>=', now()->subDay())->count(),
                'songs_24h' => PlaylistItem::where('played_at', '>=', now()->subDay())->count(),
                'bots' => User::where('is_bot', true)->count(),
                'violations_7d' => Violation::where('created_at', '>=', now()->subDays(7))->count(),
            ],
            'series' => [
                'users' => $perDay('users'),
                'messages' => $perDay('chat_messages', 'created_at', fn ($q) => $q->where('type', 'user')),
                'songs' => $perDay('playlist_items', 'played_at'),
            ],
            'recentUsers' => User::latest('id')->limit(6)->get()->map(fn (User $u) => $u->only('id', 'name', 'avatar', 'is_bot') + ['joined' => $u->created_at->toIso8601String()]),
            'recentViolations' => Violation::with(['user:id,name', 'issuer:id,name'])->latest('id')->limit(5)->get()
                ->map(fn ($v) => ['id' => $v->id, 'user' => $v->user?->name, 'by' => $v->issuer?->name, 'reason' => $v->reason, 'at' => $v->created_at->toIso8601String()]),
            'recentModeration' => RoomLog::with(['actor:id,name', 'target:id,name', 'room:id,name,slug'])->whereIn('action', ['kick', 'ban', 'unban', 'mute', 'unmute', 'clear_chat', 'delete_message'])->latest('id')->limit(8)->get()
                ->map(fn ($l) => ['id' => $l->id, 'action' => $l->action, 'actor' => $l->actor?->name, 'target' => $l->target?->name, 'room' => $l->room?->only('name', 'slug'), 'at' => $l->created_at->toIso8601String()]),
            'health' => $this->health($this->isOwner($actor)),
        ];
    }

    /**
     * Is the site set up the way it should be? ok = fine, warn = something is not working, off = an optional extra that is not switched on.
     * The lines that show the inside of the setup (live updates, email, Stripe, debug mode, the YouTube sign-in) are for the Owner only: the others do not even get them.
     */
    private function health(bool $owner): array
    {
        $maintenance = Setting::get('maintenance') === '1';
        $discordLinking = DiscordController::configured();
        $discordRoleSync = DiscordRoleSync::configured();
        $spotifyLinking = SpotifyController::configured();

        return array_values(array_filter([
            $owner ? $this->liveUpdatesHealth() : null,
            $owner ? $this->emailHealth() : null,
            ['Song search (YouTube API)', config('services.youtube.key') ? 'ok' : 'warn', config('services.youtube.key') ? 'Search and song lengths work.' : 'No YOUTUBE_API_KEY: song search and lengths are unavailable. Pasting links still works.'],
            ['GIF search (GIPHY)', config('services.giphy.api_key') ? 'ok' : 'off', config('services.giphy.api_key') ? 'Direct browser search is enabled.' : 'No GIPHY_API_KEY.'],
            ['Discord linking', $discordLinking ? 'ok' : 'off', $discordLinking ? 'People can link their Discord account.' : 'Add DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET to switch it on.'],
            ['Discord server roles', ! $discordLinking ? 'off' : ($discordRoleSync ? 'ok' : 'warn'), ! $discordLinking ? 'Discord linking must be configured first.' : ($discordRoleSync ? 'Role sync is configured; test a link to confirm bot permissions and role mappings.' : 'Add DISCORD_BOT_TOKEN and DISCORD_GUILD_ID to enable automatic server roles.')],
            $owner ? ['Stripe API (subscriptions)', ...array_values(Stripe::apiHealth())] : null,
            $owner ? ['Stripe webhook', filled(config('services.stripe.webhook_secret')) ? 'ok' : 'warn', filled(config('services.stripe.webhook_secret')) ? 'Webhook signing secret is configured. Stripe delivery is confirmed only after a signed event is received.' : 'STRIPE_WEBHOOK_SECRET is missing. Subscription changes will not sync until the webhook secret is configured.'] : null,
            ['Maintenance mode', $maintenance ? 'warn' : 'ok', $maintenance ? 'ON: visitors see the maintenance page.' : 'Off.'],
            $owner ? ['Debug mode', config('app.debug') && app()->environment('production') ? 'warn' : 'ok', config('app.debug') ? 'APP_DEBUG is on'.(app()->environment('production') ? ': turn it off in production, errors can show private details.' : ' (fine for development).') : 'Off.'] : null,
            ['Spotify playlist import', $spotifyLinking ? 'ok' : 'off', $spotifyLinking ? 'Users can connect Spotify; playlist access still requires the connected account to own or collaborate on the playlist.' : 'Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to allow people to connect Spotify.'],
            $owner ? $this->youtubeLinkingHealth() : null,
        ]));
    }

    private function liveUpdatesHealth(): array
    {
        $reachable = true;
        try {
            Broadcast::connection()->getPusher()->get('/channels', [], true);
        } catch (Throwable) {
            $reachable = false;
        }

        return ['Live updates ('.ucfirst((string) config('broadcasting.default')).')', $reachable ? 'ok' : 'warn', $reachable ? 'Chat, votes and music sync reach everyone live.' : (config('broadcasting.default') === 'reverb' ? 'Not reachable. Chat and sync will not update live. Start it with: php artisan reverb:start' : 'Not reachable. Chat and sync will not update live. Check the PUSHER_ keys.')];
    }

    private function emailHealth(): array
    {
        $mail = config('mail.default');
        $logged = ! MailStatus::configured();

        return ['Email', $logged ? 'warn' : 'ok', $logged ? "No mail server is set up (MAIL_MAILER is \"{$mail}\"): messages are only written to the log, so nobody has to confirm their email. Admin panel → Email shows what to put in .env." : "Sending through {$mail}."];
    }

    /**
     * Connecting a YouTube channel goes through Google. Google lets in only the Test users while the OAuth consent screen is in Testing: everybody else gets
     * "Access blocked: ... has not completed the Google verification process" (error 403 access_denied) on Google's own page, so the site cannot catch it.
     */
    private function youtubeLinkingHealth(): array
    {
        if (! YouTubeController::configured()) {
            return ['YouTube channel linking', 'off', 'Add YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET (Google Cloud → APIs & Services → Credentials → OAuth client ID) to let people connect their channel.'];
        }

        return ['YouTube channel linking', 'ok', 'People can connect their channel. The OAuth client in Google Cloud must list '.route('youtube.callback').' as an authorized redirect URI. While the OAuth consent screen is in Testing, Google refuses everybody who is not a Test user ("Access blocked ... has not completed the Google verification process", error 403 access_denied): add them under OAuth consent screen → Test users, or press Publish app (until Google verifies it, up to 100 people can connect, each after a warning screen).'];
    }

    public function updateRoles(Request $request, User $user): RedirectResponse
    {
        $actor = $this->allow($request, 'users.manage');
        abort_unless($actor->outranks($user), 403);

        $allowed = array_map(fn (Role $r) => $r->value, $this->grantable($actor));
        $data = $request->validate([
            'roles' => ['present', 'array'],
            'roles.*' => ['string', Rule::in($allowed)],
        ]);

        $user->forceFill(['roles' => array_values(array_unique($data['roles']))])->save();
        if ($user->discord_id && DiscordRoleSync::configured() && ($syncError = DiscordRoleSync::sync($user))) {
            Log::warning('Discord role synchronization failed after an admin role change.', ['user_id' => $user->id, 'reason' => $syncError]);
        }

        return back();
    }

    /** Give or take the special badges (beta tester, bug hunter ...). */
    public function updateAwards(Request $request, User $user): RedirectResponse
    {
        $this->allow($request, 'users.manage');

        $data = $request->validate([
            'awards' => ['present', 'array'],
            'awards.*' => ['string', Rule::in(array_keys(Awards::ALL))],
        ]);

        $user->forceFill(['awards' => Awards::clean($data['awards']) ?: null])->save();
        $user->announce();

        return back();
    }

    /** Give somebody Plus or Premium by hand (for a month, a year or for good), or take it away. A plan paid through Stripe is run by Stripe: staff only see it. */
    public function updatePlan(Request $request, User $user): RedirectResponse
    {
        $this->allow($request, 'users.manage');

        $data = $request->validate([
            'plan' => ['nullable', Rule::in(array_keys(Plans::TIERS))],
            'months' => ['required_with:plan', 'nullable', 'integer', Rule::in([0, 1, 3, 12])], // 0 = for good
        ]);

        $user->forceFill($data['plan'] ?? null
            ? ['plan' => $data['plan'], 'plan_until' => $data['months'] ? now()->addMonths($data['months']) : null, 'plan_renews' => false, 'plan_interval' => null]
            : ['plan' => null, 'plan_until' => null, 'plan_renews' => false])->save();
        $user->announce();

        return back();
    }

    /** Staff choose whether people must confirm their email (it is only asked for while the site can send mail, see Setting::verificationRequired). */
    public function emailSettings(Request $request): RedirectResponse
    {
        $this->allow($request, 'maintenance.toggle');

        Setting::put('email_verification', $request->validate(['verification' => ['required', Rule::in(['required', 'optional'])]])['verification']);

        return back();
    }

    /** Send a test message to the staff member's own address and say what happened: the way to find out if the mail server in .env works. */
    public function testMail(Request $request): RedirectResponse
    {
        $actor = $this->allow($request, 'maintenance.toggle');
        $configured = MailStatus::configured();

        try {
            Mail::raw("This is a test message from the admin panel of SFD-DJ.EU.\n\nIf you can read it, the site can send email.", fn ($m) => $m->to($actor->email)->subject('SFD-DJ.EU test email'));
            $result = ['ok' => true, 'to' => $actor->email, 'message' => $configured ? "Sent to {$actor->email}. Look in the inbox, and in the Spam folder." : 'No mail server is set up, so the message was only written to storage/logs/laravel.log.'];
        } catch (Throwable $e) {
            report($e);
            $result = ['ok' => false, 'to' => $actor->email, 'message' => Str::limit($e->getMessage(), 300)];
        }

        return back()->with('mail_test', $result + ['configured' => $configured]);
    }

    /** Staff confirm somebody's email by hand: for the person whose message never arrives. */
    public function confirmEmail(Request $request, User $user): RedirectResponse
    {
        $this->allow($request, 'users.manage');

        $user->hasVerifiedEmail() || $user->markEmailAsVerified();

        return back();
    }

    /** Update a lower-ranked user's account details and optionally replace their password. */
    public function updateAccount(Request $request, User $user): RedirectResponse
    {
        $actor = $this->allow($request, 'users.manage');
        abort_unless($actor->outranks($user), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:30'],
            'username' => ['nullable', 'string', 'min:3', 'max:20', 'regex:/^[A-Za-z0-9_]+$/', function (string $attribute, mixed $value, \Closure $fail) use ($user) {
                if (User::whereRaw('lower(username) = ?', [mb_strtolower($value)])->where('id', '!=', $user->id)->exists()) {
                    $fail('That username is taken.');
                }
            }],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class)->ignore($user->id)],
            'password' => ['nullable', Password::defaults(), 'confirmed'],
        ]);

        $emailChanged = $user->email !== $data['email'];
        $changes = [
            'name' => $data['name'],
            'username' => $data['username'] ?? null,
            'email' => $data['email'],
        ];

        if ($emailChanged) {
            $changes['email_verified_at'] = null;
        }

        if (filled($data['password'] ?? null)) {
            $changes['password'] = Hash::make($data['password']);
            $changes['remember_token'] = Str::random(60);
        }

        $user->forceFill($changes)->save();

        if ($emailChanged) {
            $user->sendEmailVerificationNotification();
        }

        $user->announce();

        return back();
    }

    public function warn(Request $request, User $user): RedirectResponse
    {
        $actor = $this->allow($request, 'users.manage');
        abort_unless($actor->outranks($user), 403);

        $reason = $request->validate(['reason' => ['required', 'string', 'max:200']])['reason'];
        Violation::create(['user_id' => $user->id, 'issued_by' => $actor->id, 'reason' => $reason]);

        return back();
    }

    /** Delete somebody's account for good: their rooms, playlists, messages and friends go with it. Only people ranked below you (so never yourself). */
    public function destroyUser(Request $request, User $user): RedirectResponse
    {
        $actor = $this->allow($request, 'users.manage');
        abort_unless($actor->outranks($user), 403);

        $user->delete();

        return back();
    }

    public function updateRoom(Request $request, Room $room): RedirectResponse
    {
        $this->allow($request, 'rooms.manage');

        $data = $request->validate([
            'badges' => ['sometimes', 'nullable', 'array'],
            'badges.*' => [Rule::in(Room::BADGES)],
            'is_featured' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('badges', $data)) {
            // each badge once, always in the same order
            $data['badges'] = array_values(array_intersect(Room::BADGES, $data['badges'] ?? []));
        }

        $room->update($data);

        return back();
    }

    public function destroyRoom(Request $request, Room $room): RedirectResponse
    {
        $this->allow($request, 'rooms.manage');

        $room->delete();

        return back();
    }

    /** Owner-only: tick which site permissions each role has. The Owner role itself always has all of them. */
    public function updatePermissions(Request $request): RedirectResponse
    {
        abort_unless($this->isOwner($this->allow($request, 'admin.access')), 403);

        $roles = array_map(fn (Role $r) => $r->value, array_filter(Role::assignable(), fn (Role $r) => $r !== Role::Owner));
        $data = $request->validate([
            'granted' => ['present', 'array'],
            'granted.*' => ['array'],
            'granted.*.*' => ['string', Rule::in(array_keys(Role::PERMISSIONS))],
        ]);

        SitePermission::query()->delete();
        foreach ($data['granted'] as $role => $permissions) {
            if (in_array($role, $roles, true)) {
                foreach (array_unique($permissions) as $permission) {
                    SitePermission::create(['role' => $role, 'permission' => $permission]);
                }
            }
        }
        SitePermission::forget();

        return back();
    }

    public function broadcast(Request $request): RedirectResponse
    {
        $actor = $this->allow($request, 'broadcast.send');

        $data = $request->validate([
            'message' => ['required', 'string', 'max:500'],
            'level' => ['required', Rule::in(['info', 'warning'])],
        ]);

        // kept in the list of broadcasts, and written in the chat of every room (they only show there, never as a bar over the page)
        Announcement::create($data + ['user_id' => $actor->id]);
        $text = ($data['level'] === 'warning' ? '⚠️ ' : '').$data['message'];
        Room::query()->each(fn (Room $room) => ChatMessage::system($room, 'broadcast', $text, $actor));

        return back();
    }

    public function banIp(Request $request): RedirectResponse
    {
        $actor = $this->allow($request, 'ipbans.manage');

        $data = $request->validate([
            'ip' => ['required', 'ip', Rule::unique('ip_bans', 'ip'), Rule::notIn([$request->ip()])],
            'reason' => ['nullable', 'string', 'max:200'],
        ], ['ip.not_in' => 'You cannot ban your own IP address.']);

        IpBan::create($data + ['banned_by' => $actor->id]);

        return back();
    }

    public function unbanIp(Request $request, IpBan $ipBan): RedirectResponse
    {
        $this->allow($request, 'ipbans.manage');

        $ipBan->delete();

        return back();
    }

    public function maintenance(Request $request): RedirectResponse
    {
        $this->allow($request, 'maintenance.toggle');

        Setting::put('maintenance', $request->boolean('enabled') ? '1' : '0');

        return back();
    }

    /** Roles this admin may hand out: everything ranked below their own; an Owner may also make other Owners. */
    private function grantable(User $actor): array
    {
        return array_values(array_filter(Role::assignable(), fn (Role $r) => $r->rank() > $actor->role()->rank() || $this->isOwner($actor)));
    }

    /** Owner-only: put the matrix back to the recommended defaults. */
    public function resetPermissions(Request $request): RedirectResponse
    {
        abort_unless($this->isOwner($this->allow($request, 'admin.access')), 403);

        SitePermission::query()->delete();
        foreach (Role::defaultPermissions() as $role => $permissions) {
            foreach ($permissions as $permission) {
                SitePermission::create(['role' => $role, 'permission' => $permission]);
            }
        }
        SitePermission::forget();

        return back();
    }

    private function allow(Request $request, string $permission): User
    {
        abort_unless($request->user()->hasPermission($permission), 403);

        return $request->user();
    }

    private function isOwner(User $user): bool
    {
        return in_array(Role::Owner->value, $user->roles ?? [], true);
    }
}
