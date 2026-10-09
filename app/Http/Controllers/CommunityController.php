<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\PlaylistItem;
use App\Models\Room;
use App\Models\Setting;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommunityController extends Controller
{
    public const REFERRAL_XP = 100;

    public function index(Request $request): Response
    {
        $me = $request->user();

        return Inertia::render('Community', [
            'stats' => [
                'members' => User::count(),
                'rooms' => Room::count(),
                'songs_played' => PlaylistItem::whereNotNull('played_at')->count(),
                'messages' => ChatMessage::count(),
            ],
            'pulse' => $this->pulse(),
            'week' => $this->week(),
            'newest' => User::where('is_bot', false)->latest('id')->limit(8)->get()->map(fn (User $u) => $u->only('id', 'name', 'avatar') + ['joined' => $u->created_at->toIso8601String()])->values(),
            'genres' => Room::where('is_private', false)->whereNotNull('genre')->selectRaw('genre, count(*) as n')->groupBy('genre')->orderByDesc('n')->limit(8)->get()->map(fn ($g) => ['genre' => $g->genre, 'n' => (int) $g->n])->values(),
            'team' => $this->team(),
            'inviters' => User::where('is_bot', false)->withCount('referrals')->has('referrals')->orderByDesc('referrals_count')->limit(5)->get()->map(fn (User $u) => $u->only('id', 'name', 'avatar', 'primary_role') + ['count' => $u->referrals_count])->values(),
            'canEdit' => (bool) $me?->hasPermission('community.manage'),
            'settings' => $me?->hasPermission('community.manage') ? [
                'social' => collect(Setting::SOCIALS)->mapWithKeys(fn ($label, $key) => [$key => Setting::get("social.$key", '')])->all(),
                'donation' => [
                    'enabled' => Setting::get('donation.enabled') === '1',
                    'title' => Setting::get('donation.title', 'Keep SFD.DJ running'),
                    'goal' => (float) Setting::get('donation.goal', '0'),
                    'current' => (float) Setting::get('donation.current', '0'),
                    'currency' => Setting::get('donation.currency', '€'),
                    'url' => Setting::get('donation.url', ''),
                ],
                'labels' => Setting::SOCIALS,
            ] : null,
            'me' => $me ? [
                'xp' => $me->xp,
                'level' => $me->level,
                'rank' => User::where('xp', '>', $me->xp)->count() + 1,
                'from' => User::xpFor($me->level),
                'to' => User::xpFor(min($me->level + 1, User::MAX_LEVEL)),
            ] : null,
            'topXp' => User::orderByDesc('xp')->limit(25)->get()
                ->map->only('id', 'name', 'avatar', 'xp', 'level', 'primary_role')->values(),
            'topDjs' => User::withCount(['playlistItems as plays' => fn ($q) => $q->whereNotNull('played_at')])
                ->orderByDesc('plays')->limit(10)->get()->filter(fn ($u) => $u->plays > 0)
                ->map(fn ($u) => $u->only('id', 'name', 'avatar', 'primary_role') + ['plays' => $u->plays])->values(),
        ]);
    }

    /** What happened today, for the pulse strip. */
    private function pulse(): array
    {
        $today = now()->startOfDay();

        return [
            'messages' => ChatMessage::where('type', 'user')->where('created_at', '>=', $today)->count(),
            'songs' => PlaylistItem::where('played_at', '>=', $today)->count(),
            'joined' => User::where('is_bot', false)->where('created_at', '>=', $today)->count(),
            'woots' => Vote::where('type', 'woot')->where('created_at', '>=', $today)->count(),
        ];
    }

    /** The last seven days: busiest DJs and chatters, best songs and rooms. Private rooms never count. */
    private function week(): array
    {
        $since = now()->subDays(7);
        $inPublicRoom = fn () => PlaylistItem::whereHas('room', fn ($r) => $r->where('is_private', false));

        $songs = Vote::where('type', 'woot')->where('created_at', '>=', $since)
            ->whereIn('playlist_item_id', $inPublicRoom()->select('id'))
            ->selectRaw('playlist_item_id, count(*) as woots')->groupBy('playlist_item_id')->orderByDesc('woots')->limit(5)->get();
        $items = PlaylistItem::with(['user:id,name,avatar', 'room:id,name,slug'])->whereIn('id', $songs->pluck('playlist_item_id'))->get()->keyBy('id');

        $plays = PlaylistItem::where('played_at', '>=', $since)->whereHas('room', fn ($r) => $r->where('is_private', false))
            ->selectRaw('room_id, count(*) as plays')->groupBy('room_id')->orderByDesc('plays')->limit(5)->get();
        $rooms = Room::whereIn('id', $plays->pluck('room_id'))->get()->keyBy('id');

        $chat = ChatMessage::where('type', 'user')->where('created_at', '>=', $since)->whereIn('room_id', Room::where('is_private', false)->select('id'))
            ->selectRaw('user_id, count(*) as n')->groupBy('user_id')->orderByDesc('n')->limit(5)->get();
        $chatters = User::whereIn('id', $chat->pluck('user_id'))->where('is_bot', false)->get()->keyBy('id');

        return [
            'songs' => $songs->filter(fn ($s) => $items->has($s->playlist_item_id))->map(fn ($s) => [
                'title' => $items[$s->playlist_item_id]->title,
                'thumbnail' => $items[$s->playlist_item_id]->thumbnail,
                'woots' => (int) $s->woots,
                'dj' => $items[$s->playlist_item_id]->user->only('id', 'name'),
                'room' => $items[$s->playlist_item_id]->room->only('name', 'slug'),
            ])->values(),
            'djs' => User::where('is_bot', false)->withCount(['playlistItems as plays' => fn ($q) => $q->where('played_at', '>=', $since)])->orderByDesc('plays')->limit(5)->get()
                ->filter(fn ($u) => $u->plays > 0)->map(fn ($u) => $u->only('id', 'name', 'avatar', 'primary_role') + ['plays' => $u->plays])->values(),
            'rooms' => $plays->filter(fn ($p) => $rooms->has($p->room_id))->map(fn ($p) => $rooms[$p->room_id]->only('id', 'name', 'slug', 'genre') + ['plays' => (int) $p->plays])->values(),
            'chatters' => $chat->filter(fn ($c) => $chatters->has($c->user_id))->map(fn ($c) => $chatters[$c->user_id]->only('id', 'name', 'avatar', 'primary_role') + ['messages' => (int) $c->n])->values(),
        ];
    }

    /** The people who run the site, highest role first. */
    private function team(): array
    {
        $roles = ['owner', 'developer', 'admin', 'moderator', 'site_moderator'];

        return User::where('is_bot', false)->where(fn ($q) => collect($roles)->each(fn ($r) => $q->orWhereJsonContains('roles', $r)))->get()
            ->sortBy(fn (User $u) => $u->role()->rank())->values()
            ->map(fn (User $u) => $u->only('id', 'name', 'avatar', 'primary_role', 'bio'))->all();
    }

    /** Social links shown in the room footbar and the donation goal. Everybody sees them; people with community.manage change them. */
    public function update(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('community.manage'), 403);

        $link = ['nullable', 'string', 'max:200', 'regex:~^https://~i']; // https only: no javascript: links
        $data = $request->validate([
            'social' => ['required', 'array'],
            'social.*' => $link,
            'donation.enabled' => ['required', 'boolean'],
            'donation.title' => ['required', 'string', 'max:60'],
            'donation.goal' => ['required', 'numeric', 'min:0', 'max:100000000'],
            'donation.current' => ['required', 'numeric', 'min:0', 'max:100000000'],
            'donation.currency' => ['required', 'string', 'max:3'],
            'donation.url' => $link,
        ], ['*.regex' => 'Links must start with https://']);

        foreach (array_keys(Setting::SOCIALS) as $key) {
            Setting::put("social.$key", $data['social'][$key] ?? null);
        }
        foreach (['title', 'goal', 'current', 'currency', 'url'] as $key) {
            Setting::put("donation.$key", (string) ($data['donation'][$key] ?? ''));
        }
        Setting::put('donation.enabled', $data['donation']['enabled'] ? '1' : '0');

        return back();
    }

    public function referral(Request $request): Response
    {
        $me = $request->user();

        return Inertia::render('Referral', [
            'link' => url('/register?ref='.$me->referral_code),
            'code' => $me->referral_code,
            'reward' => self::REFERRAL_XP,
            'referrals' => $me->referrals()->latest()->get()->map(fn (User $u) => $u->only('id', 'name', 'avatar', 'level', 'created_at') + ['primary_role' => $u->primary_role])->values(),
            // who has brought the most friends in (people with at least one), and where you stand
            'topInviters' => User::where('is_bot', false)->withCount('referrals')->has('referrals')->orderByDesc('referrals_count')->limit(5)->get()
                ->map(fn (User $u) => $u->only('id', 'name', 'avatar') + ['count' => $u->referrals_count])->values(),
            'rank' => $me->referrals()->count() > 0
                ? User::where('is_bot', false)->has('referrals', '>', $me->referrals()->count())->count() + 1
                : null,
        ]);
    }
}
