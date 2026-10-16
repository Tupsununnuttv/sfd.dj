<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Events\ChatCleared;
use App\Events\MessageDeleted;
use App\Events\MessageSent;
use App\Events\PlaybackUpdated;
use App\Events\RoomUpdated;
use App\Events\UserKicked;
use App\Events\VoteCast;
use App\Models\ChatMessage;
use App\Models\Friendship;
use App\Models\Playlist;
use App\Models\PlaylistItem;
use App\Models\PlaylistSong;
use App\Models\Room;
use App\Models\RoomBan;
use App\Models\RoomBotPresence;
use App\Models\RoomMember;
use App\Models\SiteEvent;
use App\Models\User;
use App\Models\Vote;
use App\Rules\NoOtherSites;
use App\Services\Music;
use App\Services\YouTube;
use App\Support\Automod;
use App\Support\LinkGuard;
use App\Support\LiveStream;
use App\Support\Presence;
use App\Support\RoomCss;
use App\Support\RoomPresence;
use App\Support\Season;
use App\Support\WordGuard;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class RoomController extends Controller
{
    /** Keys of the room backdrops; the page maps each one to its gradient. */
    public const BACKGROUNDS = ['midnight', 'sunset', 'neon', 'forest', 'club', 'halloween', 'halloween2', 'christmas', 'christmas2', 'winter', 'spring', 'easter', 'summer', 'midsummer', 'synthwave', 'retrowave', 'synthwave2', 'retrowave2', 'definity', 'anime', 'latam', 'lightshow', 'cats', 'goldmine', 'skull', 'skulls', 'ultra', 'foxy', 'dragon', 'tastycat', 'tasty', 'monstercat', 'custom'];

    /** The custom (seasonal) backdrops: only the host of a room sees them in Room settings and can pick them. Everybody who comes into the room sees the one that is on. */
    public const HOST_BACKGROUNDS = ['halloween', 'halloween2', 'christmas', 'christmas2', 'winter', 'spring', 'easter', 'summer', 'midsummer', 'synthwave', 'retrowave', 'synthwave2', 'retrowave2', 'definity', 'anime', 'latam', 'lightshow', 'cats', 'goldmine', 'skull', 'skulls', 'ultra', 'foxy', 'dragon', 'tastycat', 'tasty', 'monstercat', 'custom'];

    /** Big-emoji "stickers" for chat. */
    public const STICKERS = ['🎉', '🔥', '💃', '🕺', '🤘', '😎', '🥳', '😂', '😍', '🤯', '👏', '🙌', '💯', '❤️', '💜', '🎧', '🎸', '🥁', '🎤', '🎶', '🚀', '👑', '😴', '🙈'];

    public function index(Request $request): InertiaResponse
    {
        $me = $request->user();
        $rooms = Room::visibleTo($me)->withCount('items')->with('user:id,name')->latest()->get();
        $mineId = $me?->id;

        return Inertia::render('Dashboard', [
            'rooms' => $rooms,
            'mine' => $rooms->where('user_id', $mineId)->values(),
            'featured' => $rooms->where('is_featured', true)->values(),
            'genres' => Room::GENRES,
            // re-fetched every few seconds by the page (partial reload): live listener counts, what plays where, the feed
            'counts' => fn () => (object) RoomPresence::counts(),
            'nowPlaying' => fn () => (object) $this->nowPlaying($rooms),
            'activity' => fn () => $this->recentActivity($me),
            'stats' => $me ? $this->myStats($me) : null,
            'daily' => $me ? ['amount' => User::DAILY_COINS, 'claimable' => ! $me->daily_coins_on?->isToday()] : null, // the daily SFD Coins
            'friendIds' => $me ? $this->friendIds($me) : [],
            'events' => SiteEvent::with('room')->withCount('attendees')
                ->where(fn ($q) => $q->where('ends_at', '>', now())->orWhere(fn ($w) => $w->whereNull('ends_at')->where('starts_at', '>', now()->subHours(3))))
                ->orderBy('starts_at')->limit(3)->get()
                ->map(fn (SiteEvent $e) => ['id' => $e->id, 'title' => $e->title, 'starts_at' => $e->starts_at->toIso8601String(), 'going_count' => $e->attendees_count, 'room' => $e->room && $e->room->canEnter($me) ? $e->room->only('name', 'slug') : null])->values(),
            'goals' => fn () => $me ? $this->goals($me) : [],
            'continue' => fn () => $me ? $this->continueRoom($me, $rooms) : null,
            'friendsOnline' => fn () => $me ? $this->friendsOnline($me) : [],
            'recommended' => fn () => $me ? $this->recommended($me, $rooms) : ['reason' => '', 'rooms' => []],
            'topDjs' => User::where('is_bot', false)->withCount(['playlistItems as plays' => fn ($q) => $q->whereNotNull('played_at')])
                ->orderByDesc('plays')->limit(5)->get()->filter(fn ($u) => $u->plays > 0)
                ->map(fn ($u) => $u->only('id', 'name', 'avatar') + ['plays' => $u->plays])->values(),
            'mySongs' => $me ? PlaylistItem::where('user_id', $me->id)->whereNotNull('played_at')->with('room:id,name,slug')->latest('played_at')->limit(5)->get()
                ->map(fn ($i) => ['id' => $i->id, 'title' => $i->title, 'thumbnail' => $i->thumbnail, 'played_at' => $i->played_at->toIso8601String(), 'room' => $i->room->only('name', 'slug')])->values() : [],
        ]);
    }

    /** Three small things to do today. They count what you really did since midnight. */
    private function goals(User $me): array
    {
        $today = now()->startOfDay();

        return [
            ['key' => 'play', 'title' => 'Get a song played', 'have' => min(1, PlaylistItem::where('user_id', $me->id)->where('played_at', '>=', $today)->count()), 'goal' => 1, 'href' => 'playlists'],
            ['key' => 'woot', 'title' => 'Woot 3 songs', 'have' => min(3, Vote::where('user_id', $me->id)->where('type', 'woot')->where('created_at', '>=', $today)->count()), 'goal' => 3, 'href' => null],
            ['key' => 'chat', 'title' => 'Chat: 5 messages', 'have' => min(5, ChatMessage::where('user_id', $me->id)->where('type', 'user')->where('created_at', '>=', $today)->count()), 'goal' => 5, 'href' => null],
        ];
    }

    /** The room you were last active in, so you can step back in. */
    private function continueRoom(User $me, $rooms): ?array
    {
        $message = ChatMessage::where('user_id', $me->id)->where('type', 'user')->latest('id')->first(['room_id', 'created_at']);
        $song = PlaylistItem::where('user_id', $me->id)->latest('id')->first(['room_id', 'created_at']);
        $last = collect([$message, $song])->filter()->sortByDesc('created_at')->first();
        $room = $last ? $rooms->firstWhere('id', $last->room_id) : null;

        return $room ? $room->only('name', 'slug', 'genre') + ['at' => $last->created_at->toIso8601String()] : null;
    }

    /** Friends who are around right now, with the room they are in. */
    private function friendsOnline(User $me): array
    {
        $snapshot = Presence::snapshot($me);

        return $me->friends()->map(fn (User $f) => $f->only('id', 'name', 'avatar') + Presence::of($f, $snapshot))
            ->filter(fn ($f) => $f['online'])->sortByDesc(fn ($f) => $f['room'] !== null)->take(8)->values()->all();
    }

    /** Rooms you might like: your favourite genre (or the one you play most), the busiest first. */
    private function recommended(User $me, $rooms): array
    {
        $genre = $me->favorite_genre ?: PlaylistItem::where('user_id', $me->id)->whereNotNull('played_at')->with('room:id,genre')->get()
            ->pluck('room.genre')->filter()->countBy()->sortDesc()->keys()->first();
        $counts = RoomPresence::counts();
        $pick = fn ($list) => $list->where('user_id', '!=', $me->id)->sortByDesc(fn ($r) => $counts[$r->id] ?? 0)->take(3)->values();
        $matching = $genre ? $pick($rooms->where('genre', $genre)) : collect();

        return [
            'reason' => $matching->isNotEmpty() ? "Because you like {$genre}" : 'Busy right now',
            'rooms' => ($matching->isNotEmpty() ? $matching : $pick($rooms))->map(fn ($r) => $r->only('id', 'name', 'slug', 'genre', 'badges') + ['listening' => $counts[$r->id] ?? 0])->all(),
        ];
    }

    /** What is playing in each room right now: room id => song, DJ and votes. */
    private function nowPlaying($rooms): array
    {
        $items = PlaylistItem::with('user:id,name')->whereIn('id', $rooms->pluck('current_item_id')->filter())->get()->keyBy('id');

        return $rooms->filter(fn (Room $r) => $items->has($r->current_item_id))->mapWithKeys(fn (Room $r) => [
            $r->id => ['title' => $items[$r->current_item_id]->title, 'thumbnail' => $items[$r->current_item_id]->thumbnail, 'dj' => $items[$r->current_item_id]->user->name],
        ])->all();
    }

    /** The numbers on the dashboard's top row. */
    private function myStats(User $me): array
    {
        $mine = fn () => PlaylistItem::where('user_id', $me->id);
        $votes = fn (string $type) => Vote::where('type', $type)->whereIn('playlist_item_id', $mine()->select('id'))->count();

        return [
            'xp' => $me->xp ?? 0,
            'level' => $me->level,
            'from' => User::xpFor($me->level),
            'to' => User::xpFor(min($me->level + 1, User::MAX_LEVEL)),
            'rank' => User::where('xp', '>', $me->xp ?? 0)->count() + 1,
            'songs_played' => $mine()->whereNotNull('played_at')->count(),
            'woots' => $votes('woot'),
            'friends' => count($this->friendIds($me)),
        ];
    }

    private function friendIds(User $me): array
    {
        return Friendship::where('status', 'accepted')->where(fn ($q) => $q->where('user_id', $me->id)->orWhere('friend_id', $me->id))->get()
            ->map(fn ($f) => $f->user_id === $me->id ? $f->friend_id : $f->user_id)->values()->all();
    }

    /** Every song that has been played, newest first. Filter by room (`room` = slug) or to your own songs (`mine`). */
    public function history(Request $request): InertiaResponse
    {
        $room = $request->query('room');
        $mine = $request->boolean('mine');

        return Inertia::render('History', [
            'songs' => PlaylistItem::whereNotNull('played_at')
                ->whereHas('room', fn ($r) => $r->visibleTo($request->user()))
                ->when($room, fn ($q) => $q->whereHas('room', fn ($r) => $r->atAddress($room)))
                ->when($mine && $request->user(), fn ($q) => $q->where('user_id', $request->user()->id))
                ->with(['room:id,name,slug', 'user:id,name,avatar'])->latest('played_at')->limit(100)->get(),
            'rooms' => Room::visibleTo($request->user())->orderBy('name')->get(['name', 'slug']),
            'filters' => ['room' => $room, 'mine' => $mine],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:50', new NoOtherSites],
            'description' => ['nullable', 'string', 'max:140', new NoOtherSites],
            'genre' => ['nullable', Rule::in(Room::GENRES)],
            'is_private' => ['boolean'],
        ]);

        $room = $request->user()->rooms()->create($data + ['slug' => Room::slugFor($data['name'])]);

        return to_route('rooms.show', $room);
    }

    public function show(Request $request, Room $room): InertiaResponse|RedirectResponse
    {
        // an old address (the room was renamed): on to the current one. Not a 301, which a browser keeps for good: the room may take that address back
        if ($request->route()->originalParameter('room') !== $room->slug) {
            return to_route('rooms.show', $room);
        }

        $room->syncCurrent();
        $user = $request->user(); // null for guests: they can watch and read, nothing more
        abort_if($user && $room->bans()->where('user_id', $user->id)->exists(), 403, 'You are banned from this room.');

        $can = $user ? $room->permissionsFor($user) : [];
        $mine = $user ? Vote::where('playlist_item_id', $room->current_item_id)->where('user_id', $user->id)->pluck('type')->all() : [];
        $css = RoomCss::clean($room->custom_css);

        return Inertia::render('Room', [
            'room' => $room->only('id', 'name', 'slug', 'description', 'badges', 'genre', 'is_private', 'welcome_message', 'rules', 'rule_list') + [
                'background' => $room->shownBackground(), // in Halloween or Christmas time the season's
                'created_at' => $room->created_at,
                'custom_background_url' => $room->custom_background ? route('media.room', $room->custom_background) : null,
                'css' => $css['css'], // what everybody gets: only the harmless part, all of it inside the room
            ] + ($this->ownsCss($user, $room) ? ['css_source' => $room->custom_css, 'css_notes' => $css['notes']] : []), // the host sees what they wrote and what was left out
            'genres' => Room::GENRES,
            'host' => $room->user->only('id', 'name', 'avatar', 'cosmetics') + ['primary_role' => $room->user->primary_role],
            'can' => array_fill_keys($can, true),
            'roles' => $room->roles()->get(['id', 'name', 'color', 'rank', 'permissions', 'builtin']),
            'roleOrder' => array_map(fn (Role $role) => $role->value, Role::manual()),
            'roleGroupOf' => collect(Role::manual())->mapWithKeys(fn (Role $role) => [$role->value => $role->group()]),
            'members' => $room->members()->pluck('room_role_id', 'user_id'),
            'botMembers' => RoomBotPresence::activeMembers($room),
            'friendIds' => $user ? $this->friendIds($user) : [],
            'memberList' => in_array('manage_roles', $can, true)
                ? $room->members()->with('user:id,name,avatar')->get()->map(fn ($m) => ['user_id' => $m->user_id, 'name' => $m->user->name, 'avatar' => $m->user->avatar, 'room_role_id' => $m->room_role_id])->values()
                : [],
            'mod' => array_intersect(['moderate_chat', 'moderate_users', 'edit_settings'], $can) ? $this->modPanel($room) + ['can_clear_logs' => $room->clearsLogs($user)] : null,
            'permissionLabels' => Room::PERMISSIONS,
            'backgrounds' => $this->visibleBackgrounds($user, $room),
            'seasons' => Season::list(),
            'bans' => in_array('moderate_users', $can, true)
                ? $room->bans()->with('user:id,name,avatar')->get()->map(fn ($b) => $b->user->only('id', 'name', 'avatar'))->values()
                : [],
            'myVotes' => ['woot' => in_array('woot', $mine, true), 'meh' => in_array('meh', $mine, true), 'grab' => in_array('grab', $mine, true)],
            'stickers' => self::STICKERS,
            'emojis' => $room->emojis()->get()->map(fn ($e) => ['id' => $e->id, 'name' => $e->name, 'url' => $e->url()]),
            'messages' => $room->messages()->with([ChatMessage::WITH_USER, 'replyTo.user'])->latest('id')->limit(50)->get()
                ->reverse()->map->payload()->values(),
            'playback' => $room->playback(),
            'listening' => RoomPresence::counts()[$room->id] ?? 0,
            'stats' => $this->stats($room),
        ]);
    }

    /** The privacy-visible participants for guests watching a public room. */
    public function members(Room $room): JsonResponse
    {
        return response()->json(RoomPresence::membersIn($room));
    }

    /** What the Room info window shows about the room's history. */
    private function stats(Room $room): array
    {
        $played = PlaylistItem::where('room_id', $room->id)->whereNotNull('played_at');

        return [
            'songs_played' => $played->count(),
            'djs' => $played->distinct()->count('user_id'),
            'woots' => Vote::where('type', 'woot')->whereIn('playlist_item_id', PlaylistItem::where('room_id', $room->id)->select('id'))->count(),
        ];
    }

    /** The custom and seasonal backgrounds are available to anyone with room settings permission. */
    private function visibleBackgrounds(?User $user, Room $room): array
    {
        return $user && $room->can($user, 'edit_settings') ? self::BACKGROUNDS : array_values(array_diff(self::BACKGROUNDS, self::HOST_BACKGROUNDS));
    }

    public function update(Request $request, Room $room): RedirectResponse
    {
        abort_unless($room->can($request->user(), 'edit_settings'), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:50', new NoOtherSites],
            'description' => ['nullable', 'string', 'max:140', new NoOtherSites],
            'background' => ['nullable', Rule::in([...$this->visibleBackgrounds($request->user(), $room), $room->shownBackground()])], // the one that is on (a custom or a season's) may be saved again by anyone who can edit settings
            'genre' => ['nullable', Rule::in(Room::GENRES)],
            'is_private' => ['sometimes', 'boolean'],
            'welcome_message' => ['nullable', 'string', 'max:300', new NoOtherSites],
        ]);

        if (($data['background'] ?? null) === 'custom' && ! $room->custom_background) {
            throw ValidationException::withMessages(['background' => 'Upload a picture first.']);
        }

        // only the host (or staff) may lock or unlock the room
        if (! $room->can($request->user(), 'edit_settings') || ($request->user()->id !== $room->user_id && ! $request->user()->is_staff)) {
            unset($data['is_private']);
        }

        // the form sends the background that is on with everything else: only a different one is a choice (in a season it may be just for the season)
        if (array_key_exists('background', $data) && $data['background'] !== $room->shownBackground()) {
            $room->pickBackground($data['background']);
        }
        unset($data['background']);

        // the web address follows the name: the one it leaves is remembered and keeps working (links, bookmarks and bots)
        $moved = false;
        if ($data['name'] !== $room->name && ($slug = Room::slugFor($data['name'], $room)) !== $room->slug) {
            $room->changeSlug($slug);
            $moved = true;
        }

        $room->update($data);
        $room->log($request->user(), 'settings', null, 'Room settings changed');
        RoomUpdated::dispatch($room->id);

        return $moved ? to_route('rooms.show', $room) : back(); // this page is at the old address
    }

    /** The rules people read when they come in: up to ten, each with a title and a few words. (The old block of text is kept in step for the bot API.) */
    public function rules(Request $request, Room $room): RedirectResponse
    {
        abort_unless($room->can($request->user(), 'edit_settings'), 403);

        $data = $request->validate([
            'rules' => ['present', 'array', 'max:10'],
            'rules.*.title' => ['required', 'string', 'max:60', new NoOtherSites],
            'rules.*.text' => ['nullable', 'string', 'max:500', new NoOtherSites],
        ]);

        $list = collect($data['rules'])->map(fn ($r) => ['title' => trim($r['title']), 'text' => trim((string) ($r['text'] ?? ''))])->filter(fn ($r) => $r['title'] !== '')->values()->all();

        $room->update(['rule_list' => $list ?: null, 'rules' => $list ? Room::rulesText($list) : null]);
        $room->log($request->user(), 'settings', null, 'Room rules changed');
        RoomUpdated::dispatch($room->id);

        return back();
    }

    /** The room's own CSS: the host (and staff) write it, everybody who comes in gets the harmless part of it (RoomCss). */
    public function css(Request $request, Room $room): RedirectResponse
    {
        abort_unless($this->ownsCss($request->user(), $room), 403);

        $data = $request->validate(['css' => ['nullable', 'string', 'max:20000']]);

        $room->update(['custom_css' => trim((string) ($data['css'] ?? '')) ?: null]);
        $room->log($request->user(), 'settings', null, 'Room CSS changed');
        RoomUpdated::dispatch($room->id);

        return back();
    }

    /** Only the host of a room and SFD-DJ.EU staff write its CSS. */
    private function ownsCss(?User $user, Room $room): bool
    {
        return $user && ($user->id === $room->user_id || $user->is_staff);
    }

    /** A room settings manager may upload a picture for this room (it replaces the previous one and is put on at once). */
    public function uploadBackground(Request $request, Room $room): RedirectResponse
    {
        abort_unless($room->can($request->user(), 'edit_settings'), 403);
        $request->validate(['image' => ['required', 'file', 'image', 'mimes:png,jpg,jpeg,webp', 'max:4096', 'dimensions:min_width=800,min_height=450']]);

        $old = $room->custom_background;
        $room->pickBackground('custom'); // in a season too: the host's own picture switches the season off here
        $room->update(['custom_background' => MediaController::store($request->file('image'), 'room-backgrounds')]);
        $old && MediaController::disk()->delete("room-backgrounds/{$old}");
        $room->log($request->user(), 'settings', null, 'Own background picture uploaded');
        RoomUpdated::dispatch($room->id);

        return back();
    }

    public function removeBackground(Request $request, Room $room): RedirectResponse
    {
        abort_unless($room->can($request->user(), 'edit_settings'), 403);

        $room->custom_background && MediaController::disk()->delete("room-backgrounds/{$room->custom_background}");
        $room->update(['custom_background' => null, 'background' => $room->background === 'custom' ? null : $room->background]);
        RoomUpdated::dispatch($room->id);

        return back();
    }

    /** Lock/unlock the waitlist or switch cycling on/off. */
    public function waitlistSettings(Request $request, Room $room): Response
    {
        abort_unless($room->can($request->user(), 'manage_queue'), 403);
        $data = $request->validate(['locked' => ['sometimes', 'boolean'], 'cycle' => ['sometimes', 'boolean']]);
        $me = $request->user();

        $room->update(array_filter(['waitlist_locked' => $data['locked'] ?? null, 'waitlist_cycle' => $data['cycle'] ?? null], fn ($v) => $v !== null));

        foreach (['locked' => ['locked the waitlist', 'unlocked the waitlist'], 'cycle' => ['turned waitlist cycling on', 'turned waitlist cycling off']] as $key => [$on, $off]) {
            if (isset($data[$key])) {
                $text = $data[$key] ? $on : $off;
                ChatMessage::system($room, 'waitlist', "{$me->name} {$text}", $me);
                $room->log($me, 'waitlist', null, ucfirst($text));
            }
        }
        PlaybackUpdated::dispatch($room->refresh());

        return response()->noContent();
    }

    /**
     * Put a live stream on the big screen instead of the DJs (`url`: a YouTube, Twitch or Kick stream), or switch to another one. Everybody in the room, guests too,
     * sees it at once and the chat tells them. The songs in the waitlist wait until the stream ends.
     */
    public function goLive(Request $request, Room $room): Response
    {
        $me = $request->user();
        abort_unless($room->can($me, 'go_live'), 403);

        $data = $request->validate([
            'url' => ['required', 'string', 'max:300'],
            'title' => ['nullable', 'string', 'max:80', new NoOtherSites],
        ]);

        $stream = LiveStream::parse($data['url']);
        if (! $stream) {
            throw ValidationException::withMessages(['url' => 'Paste the link of a YouTube, Twitch or Kick live stream. For YouTube it is the address of the live video (youtube.com/watch?v=… or youtube.com/live/…), not the name of the channel.']);
        }

        $title = trim((string) ($data['title'] ?? ''));
        if ($why = WordGuard::check($title)) {
            throw ValidationException::withMessages(['title' => $why]);
        }

        $starting = ! $room->liveNow();
        $room->goLive($me, $stream, $title);
        $starting && ChatMessage::system($room, 'live', "{$me->name} is live: {$room->live['title']}", $me);
        $room->log($me, 'live', null, $room->live['title']);
        PlaybackUpdated::dispatch($room->refresh());

        return response()->noContent();
    }

    /** The stream is over: the host and the others who may go live end it, and so can the moderators (a stream that should not be on is taken off at once). */
    public function endLive(Request $request, Room $room): Response
    {
        $me = $request->user();
        abort_unless($room->can($me, 'go_live') || $room->can($me, 'moderate_users'), 403);

        if ($room->live) {
            $room->endLive();
            ChatMessage::system($room, 'live', 'The live stream has ended', $me);
            $room->log($me, 'live_end');
            PlaybackUpdated::dispatch($room->refresh());
        }

        return response()->noContent();
    }

    /** Text, and optionally a sticker, a Tenor GIF and/or a reply to an earlier message. */
    public function message(Request $request, Room $room): Response
    {
        $data = $request->validate([
            'body' => ['nullable', 'string', 'max:300'],
            'sticker' => ['nullable', Rule::in(self::STICKERS)],
            'gif' => ['nullable', 'string', 'max:400', 'regex:~^https://(?:[\w.-]*tenor\.com|media\d*\.giphy\.com|i\.giphy\.com)/~'],
            'reply_to_id' => ['nullable', 'integer'],
        ], ['gif.regex' => 'Only Tenor or GIPHY GIF links can be sent.']);

        if (blank($data['body'] ?? null) && blank($data['sticker'] ?? null) && blank($data['gif'] ?? null)) {
            throw ValidationException::withMessages(['body' => 'Write something first.']);
        }

        return $this->post($request, $room, [
            'body' => $data['body'] ?? '',
            'sticker' => $data['sticker'] ?? null,
            'image' => $data['gif'] ?? null,
            'reply_to_id' => $data['reply_to_id'] ?? null,
        ]);
    }

    /** A picture from the device, with an optional caption. */
    public function image(Request $request, Room $room): Response
    {
        $data = $request->validate([
            'image' => ['required', 'file', 'mimes:png,jpg,jpeg,webp,gif', 'max:3072'],
            'body' => ['nullable', 'string', 'max:300'],
            'reply_to_id' => ['nullable', 'integer'],
        ]);

        return $this->post($request, $room, [
            'body' => $data['body'] ?? '',
            'image' => MediaController::store($request->file('image'), 'chat'),
            'reply_to_id' => $data['reply_to_id'] ?? null,
        ]);
    }

    /** Remove one message: your own, or anyone's with the clear-chat permission. */
    public function deleteMessage(Request $request, Room $room, ChatMessage $message): Response
    {
        abort_unless($message->room_id === $room->id, 404);
        abort_unless($message->user_id === $request->user()->id || $room->can($request->user(), 'moderate_chat'), 403);

        $message->user_id === $request->user()->id || $room->log($request->user(), 'delete_message', $message->user, $message->body);
        $message->delete();
        MessageDeleted::dispatch($room->id, $message->id);

        return response()->noContent();
    }

    /** GIF search through Tenor (needs the Tenor API enabled for the Google key). Empty query = trending. */
    public function gifs(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q'));

        try {
            $res = Http::timeout(5)->get('https://tenor.googleapis.com/v2/'.($q === '' ? 'featured' : 'search'), array_filter([
                'key' => config('services.tenor.key'),
                'client_key' => 'sfddj',
                'q' => $q ?: null,
                'limit' => 18,
                'media_filter' => 'gif,tinygif',
                'contentfilter' => 'medium',
            ]));
        } catch (ConnectionException) {
            $res = null;
        }

        abort_unless($res?->successful(), 503, 'GIF search is not set up yet. Paste a Tenor GIF link, or enable the Tenor API for the site key.');

        return response()->json(collect($res->json('results', []))->map(fn ($g) => [
            'id' => $g['id'],
            'preview' => $g['media_formats']['tinygif']['url'] ?? $g['media_formats']['gif']['url'],
            'url' => $g['media_formats']['gif']['url'],
        ])->values());
    }

    private function post(Request $request, Room $room, array $fields): Response
    {
        $me = $request->user();

        if ($room->isMuted($me)) {
            throw ValidationException::withMessages(['body' => 'You are muted in this room.']);
        }
        if ($why = WordGuard::check($fields['body'] ?? '')) { // nobody, staff and bots included
            $room->log($me, 'automod', $me, 'a word that is not allowed on the site: '.$fields['body']);
            throw ValidationException::withMessages(['body' => $why]);
        }
        if (! $me->is_staff && ($why = LinkGuard::check($fields['body'] ?? ''))) {
            $room->log($me, 'automod', $me, 'a link to another site: '.$fields['body']);
            throw ValidationException::withMessages(['body' => $why]);
        }
        if ($reason = Automod::check($room, $me, $fields['body'] ?? '')) {
            $room->log($me, 'automod', $me, $reason.': '.$fields['body']);
            throw ValidationException::withMessages(['body' => 'Blocked by AutoMod: '.$reason.'.']);
        }

        // a reply must point at a message of this room
        if ($fields['reply_to_id'] && ! $room->messages()->whereKey($fields['reply_to_id'])->exists()) {
            $fields['reply_to_id'] = null;
        }

        $recent = $room->messages()->where('user_id', $me->id)->where('type', 'user')->where('created_at', '>', now()->subSeconds(10))->exists();
        $message = $room->messages()->create($fields + ['user_id' => $me->id]);
        $recent || $me->addXp(2); // at most one XP award per 10s, so spamming earns nothing
        if ($me->is_bot) {
            RoomBotPresence::touchFor($room, $me);
        }
        MessageSent::dispatch($message->load([ChatMessage::WITH_USER, 'replyTo.user']));

        return response()->noContent();
    }

    public function clearChat(Request $request, Room $room): Response
    {
        abort_unless($room->can($request->user(), 'moderate_chat'), 403);

        // everything goes, announcements and broadcasts too, so nothing comes back when the page is refreshed
        $room->messages()->delete();
        $room->log($request->user(), 'clear_chat');
        ChatCleared::dispatch($room->id);

        return response()->noContent();
    }

    /** A room-wide notice shown in chat as a system announcement. */
    public function announce(Request $request, Room $room): Response
    {
        abort_unless($room->can($request->user(), 'moderate_chat'), 403);
        $text = $request->validate(['message' => ['required', 'string', 'max:200']])['message'];

        ChatMessage::system($room, 'announcement', $text, $request->user());

        return response()->noContent();
    }

    /** Song search for the "add a song" box. Needs YOUTUBE_API_KEY. */
    /**
     * Find songs by their name. First the songs already on SFD-DJ.EU (in somebody's playlist) whose title has every word typed: that needs no YouTube quota,
     * so it works even when YouTube search has used up its daily limit. Then YouTube's own results (YouTube::search, kept for a day per search).
     * Every result is a YouTube video that plays through YouTube's own player, as any link would.
     */
    public function search(Request $request, YouTube $youtube): JsonResponse
    {
        $q = trim($request->validate(['q' => ['required', 'string', 'max:100']])['q']);
        $library = $this->librarySongs($q);
        $results = $youtube->search($q);

        abort_if($results === null && $library === [], 503, 'YouTube search is not available right now (its daily limit may be used up). Paste a YouTube link instead, or try again tomorrow.');

        return response()->json(collect($library)->concat($results ?? [])->unique('id')->values());
    }

    /** Up to five YouTube songs already on SFD-DJ.EU whose title contains every word of `$q`, the most used first. */
    private function librarySongs(string $q): array
    {
        $words = collect(preg_split('/\s+/u', mb_strtolower($q)))->filter(fn ($word) => mb_strlen($word) >= 2)->take(6);

        if ($words->isEmpty()) {
            return [];
        }

        $query = DB::table('playlist_songs')->whereRaw('length(youtube_id) = 11');
        $words->each(fn ($word) => $query->whereLike('title', '%'.addcslashes($word, '%_\\').'%'));

        return $query->select('youtube_id', DB::raw('max(title) as title'), DB::raw('max(channel) as channel'), DB::raw('max(thumbnail) as thumbnail'), DB::raw('count(*) as uses'))
            ->groupBy('youtube_id')->orderByDesc('uses')->limit(5)->get()
            ->map(fn ($song) => [
                'id' => $song->youtube_id,
                'title' => $song->title,
                'channel' => trim(($song->channel ? $song->channel.' · ' : '').'on SFD-DJ.EU'),
                'thumbnail' => $song->thumbnail ?: "https://i.ytimg.com/vi/{$song->youtube_id}/mqdefault.jpg",
            ])->all();
    }

    /** Add to the waitlist: a search result (`video_id`), a song of one of my own playlists (`song_id`) or a YouTube / SoundCloud / Spotify link (`url`). */
    public function enqueue(Request $request, Room $room, YouTube $youtube, Music $music): Response
    {
        $this->ensureWaitlistOpen($request, $room);
        $data = $request->validate([
            'url' => ['nullable', 'string', 'max:300'],
            'video_id' => ['nullable', 'regex:/^[\w-]{11}$/'],
            'song_id' => ['nullable', 'integer'],
        ]);

        if (isset($data['song_id'])) {
            // what the list saved is enough (a SoundCloud track has no YouTube video to ask about)
            $song = PlaylistSong::whereIn('playlist_id', $request->user()->playlists()->select('id'))->find($data['song_id'])
                ?? throw ValidationException::withMessages(['url' => 'That song is not in one of your playlists.']);
            $songs = [$song->only('youtube_id', 'title', 'thumbnail', 'duration')];
        } elseif (isset($data['video_id'])) {
            $info = $youtube->video($data['video_id']);
            if (! $info) {
                throw ValidationException::withMessages(['url' => 'Video not found or cannot be embedded.']);
            }
            $songs = [['youtube_id' => $data['video_id']] + $info];
        } elseif (isset($data['url'])) {
            $songs = $music->resolve($data['url'], $request->user());
        } else {
            throw ValidationException::withMessages(['url' => 'Paste a link or pick a song.']);
        }

        foreach ($songs as $song) {
            $room->enqueue(Arr::only($song, ['youtube_id', 'title', 'thumbnail', 'duration']), $request->user()->id);
        }
        PlaybackUpdated::dispatch($room->refresh());

        return response()->noContent();
    }

    /**
     * Join Waitlist: queue the next track of my active playlist (the footbar shows it). Once it has been played it goes to the bottom of that list.
     * `queued: false` says why: I am in the waitlist already, I have no playlist, or the active one is empty (then the page opens the playlists).
     */
    public function join(Request $request, Room $room): JsonResponse
    {
        $this->ensureWaitlistOpen($request, $room, checkFull: false); // a full line is answered below, in words the page shows
        $me = $request->user();

        if ($room->items()->where('user_id', $me->id)->exists()) {
            return response()->json(['queued' => false, 'reason' => 'already']);
        }

        if ($room->items()->count() >= Room::MAX_WAITLIST) {
            return response()->json(['queued' => false, 'reason' => 'full']);
        }

        $list = Playlist::activeFor($me);
        $song = $list?->songs()->first();

        if (! $song) {
            return response()->json(['queued' => false, 'reason' => $list ? 'empty' : 'no_playlist']);
        }

        $room->enqueue(['youtube_id' => $song->youtube_id, 'title' => $song->title, 'thumbnail' => $song->thumbnail, 'duration' => $song->duration, 'playlist_song_id' => $song->id], $me->id);
        ChatMessage::system($room, 'join', "{$me->name} joined the waitlist", $me);
        PlaybackUpdated::dispatch($room->refresh());

        return response()->json(['queued' => true, 'title' => $song->title]);
    }

    /** Put every song of one of your playlists into the waitlist (up to 50). */
    public function queuePlaylist(Request $request, Room $room): Response
    {
        $this->ensureWaitlistOpen($request, $room);
        $playlist = Playlist::where('user_id', $request->user()->id)->findOrFail($request->validate(['playlist_id' => ['required', 'integer']])['playlist_id']);

        foreach ($playlist->songs()->limit(50)->get() as $song) {
            $room->enqueue(['youtube_id' => $song->youtube_id, 'title' => $song->title, 'thumbnail' => $song->thumbnail, 'duration' => $song->duration], $request->user()->id);
        }
        PlaybackUpdated::dispatch($room->refresh());

        return response()->noContent();
    }

    /** A locked waitlist only takes songs from people who manage the queue, and a full one (67 people) takes nobody new. */
    private function ensureWaitlistOpen(Request $request, Room $room, bool $checkFull = true): void
    {
        if ($room->waitlist_locked && ! $room->can($request->user(), 'manage_queue')) {
            throw ValidationException::withMessages(['url' => 'The waitlist is locked.']);
        }

        if ($checkFull && $room->items()->count() >= Room::MAX_WAITLIST && ! $room->items()->where('user_id', $request->user()->id)->exists()) {
            throw ValidationException::withMessages(['url' => 'The waitlist is full ('.Room::MAX_WAITLIST.' people).']);
        }
    }

    public function removeItem(Request $request, Room $room, int $item): Response
    {
        abort_unless($room->can($request->user(), 'manage_queue'), 403);

        $song = PlaylistItem::where('room_id', $room->id)->find($item);
        $room->removeItem($item);
        $song && $room->log($request->user(), 'remove_song', $song->user, $song->title);
        $song && ChatMessage::system($room, 'remove', "{$request->user()->name} removed {$song->user->name} from the waitlist", $request->user());
        PlaybackUpdated::dispatch($room->refresh());

        return response()->noContent();
    }

    public function updateDuration(Request $request, Room $room): Response
    {
        $data = $request->validate([
            'item_id' => ['required', 'integer'],
            'duration' => ['required', 'integer', 'min:1', 'max:86400'],
        ]);

        $updated = DB::transaction(function () use ($room, $data): bool {
            $lockedRoom = Room::query()->lockForUpdate()->findOrFail($room->id);
            if ($lockedRoom->current_item_id !== $data['item_id']) {
                return false;
            }

            /** @var PlaylistItem|null $item */
            $item = PlaylistItem::query()
                ->where('room_id', $lockedRoom->id)
                ->whereKey($data['item_id'])
                ->lockForUpdate()
                ->first();
            if ($item === null || $item->duration > 0) {
                return false;
            }

            $item->update(['duration' => $data['duration']]);
            // the song in the DJ's playlist learns its length too (a SoundCloud track whose page did not say it), so the list shows it
            $item->playlist_song_id && PlaylistSong::whereKey($item->playlist_song_id)->where('duration', 0)->update(['duration' => $data['duration']]);

            return true;
        });

        if ($updated) {
            PlaybackUpdated::dispatch($room->refresh());
        }

        return response()->noContent();
    }

    public function skip(Request $request, Room $room): Response
    {
        $data = $request->validate(['item_id' => ['required', 'integer'], 'ended' => ['sometimes', 'boolean']]);
        $ended = $data['ended'] ?? false;
        $song = PlaylistItem::with('user:id,name')->find($data['item_id']);

        // A finished song is reported by every listener's player, so it needs no permission.
        // A manual skip needs the skip permission, or the song has to be yours.
        // ponytail: "ended" is client-reported and cannot be verified; compare against the stored duration if it gets abused
        if (! $ended && ! $room->can($request->user(), 'skip') && $song?->user_id !== $request->user()->id) {
            abort(403);
        }

        // while a live stream is on the big screen nobody hears the songs: no "ended" report counts
        if ($ended && $room->liveNow()) {
            return response()->noContent();
        }

        // Several clients report "ended" at once; only the first one for the current song counts.
        if ($room->current_item_id === $data['item_id']) {
            $room->advance();
            $ended || $room->log($request->user(), 'skip', $song->user, $song->title);
            $ended && ChatMessage::system($room, 'ended', "“{$song->title}” by {$song->user->name} has ended", $song->user);
            $ended || ChatMessage::system($room, 'skip', "{$request->user()->name} skipped “{$song->title}” ({$song->user->name})", $request->user());
            PlaybackUpdated::dispatch($room->refresh());
        }

        return response()->noContent();
    }

    /**
     * Woot, meh or grab the song that is playing. Woot and meh replace each other and toggle off when repeated.
     * A grab goes into one of your own playlists: `playlist_id`, or `new_playlist` (a name) to make one on the spot. `item_id` is the song the person saw: if the song has changed since, nothing happens.
     * Every vote that is added (not one that is taken back) is announced to the room once per person and song (VoteCast).
     */
    public function vote(Request $request, Room $room): Response|JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(['woot', 'meh', 'grab'])],
            'item_id' => ['nullable', 'integer'],
            'playlist_id' => ['nullable', 'integer'],
            'new_playlist' => ['nullable', 'string', 'max:60'],
            'auto' => ['sometimes', 'boolean'], // Autowoot: only ever adds a woot, never takes back a woot or a meh the person gave themselves
        ]);
        $type = $data['type'];
        $item = PlaylistItem::with('user')->find($room->current_item_id);
        if ($item === null) {
            abort(409, 'Nothing is playing.');
        }
        abort_if($item->user_id === $request->user()->id, 422, 'You cannot woot, meh or grab your own song.');
        abort_if(isset($data['item_id']) && (int) $data['item_id'] !== $item->id, 409, 'That song is not playing any more.');

        $me = $request->user();
        $key = ['playlist_item_id' => $item->id, 'user_id' => $me->id];
        $answer = response()->noContent();

        if ($type === 'grab') {
            $list = $this->grabTarget($me, $item, $data);
            $vote = Vote::firstOrCreate($key + ['type' => 'grab']);
            $added = $list->addSongs([['youtube_id' => $item->youtube_id, 'title' => $item->title, 'thumbnail' => $item->thumbnail, 'duration' => $item->duration]]);
            $voted = $vote->wasRecentlyCreated;

            if ($voted) {
                $item->user->addXp(3);
                $item->user->award(2, 'grab', $item->title);
            }

            $answer = response()->json(['playlist' => $list->only('id', 'name'), 'added' => $added > 0, 'songs' => $list->songs()->count()]);
        } elseif (($data['auto'] ?? false) && ($type !== 'woot' || Vote::where($key)->whereIn('type', ['woot', 'meh'])->exists())) {
            return $answer;
        } else {
            Vote::where($key)->where('type', $type === 'woot' ? 'meh' : 'woot')->delete();
            $existing = Vote::where($key)->where('type', $type)->first();
            $existing ? $existing->delete() : Vote::create($key + ['type' => $type]);
            $voted = ! $existing;
        }

        // one line in the chat per person, song and kind of vote: pressing again and again does not fill it
        if ($voted && Cache::add("vote-line.{$item->id}.{$me->id}.{$type}", true, 21600)) {
            VoteCast::dispatch($room->id, $me->id, $me->name, $type);
        }

        PlaybackUpdated::dispatch($room->refresh());

        return $answer;
    }

    /** The playlist a grab goes into: one of the person's own (`playlist_id`), or a new one (`new_playlist`). With neither, it says what to do: a person with no playlist has to make one first. */
    private function grabTarget(User $me, PlaylistItem $item, array $data): Playlist
    {
        if (filled($data['new_playlist'] ?? null)) {
            abort_if(Playlist::where('user_id', $me->id)->count() >= $me->limits()['playlists'], 422, 'You have reached the playlist limit.');
            $list = $me->playlists()->create(['name' => trim($data['new_playlist']), 'kind' => 'custom']);
            Playlist::activeFor($me); // the first list a person makes is the one they play from

            return $list;
        }

        if (! isset($data['playlist_id'])) {
            throw ValidationException::withMessages(['playlist_id' => Playlist::where('user_id', $me->id)->exists() ? 'Pick the playlist to put this song in.' : 'You have no playlist yet. Make one first, then you can grab songs into it.']);
        }

        $list = Playlist::where('user_id', $me->id)->find($data['playlist_id']) ?? throw ValidationException::withMessages(['playlist_id' => 'Pick one of your own playlists.']);

        if ($list->songs()->count() >= $me->limits()['songs'] && ! $list->songs()->where('youtube_id', $item->youtube_id)->exists()) {
            throw ValidationException::withMessages(['playlist_id' => "“{$list->name}” is full (".$me->limits()['songs'].' songs). Pick another one.']);
        }

        return $list;
    }

    /** Remove all of your own songs from the waitlist. If yours is playing, it is skipped. */
    public function leaveWaitlist(Request $request, Room $room): Response
    {
        $me = $request->user();

        if ($room->takeOut($me)) {
            ChatMessage::system($room, 'leave', "{$me->name} left the waitlist", $me);
            PlaybackUpdated::dispatch($room->refresh());
        }

        return response()->noContent();
    }

    /**
     * Somebody in the waitlist (or the DJ) has dropped off the room's live channel: the pages still in the room ask for this.
     * The server checks with the live server itself, so nobody can be taken out who is still there.
     */
    public function sweep(Room $room): Response
    {
        Cache::lock("room-sweep:{$room->id}", 3)->get(function () use ($room) {
            $gone = $room->dropAbsent();

            foreach ($gone as $user) {
                ChatMessage::system($room, 'leave', "{$user->name} left the waitlist (left the room)", $user);
            }

            $gone->isNotEmpty() && PlaybackUpdated::dispatch($room->refresh());
        });

        return response()->noContent();
    }

    public function kick(Request $request, Room $room, User $user): Response
    {
        $actor = $this->moderateUser($request, $room, $user);

        $room->log($actor, 'kick', $user);
        ChatMessage::system($room, 'kick', "{$actor->name} kicked {$user->name}", $actor);
        $this->sendAway($room, $user, false);

        return response()->noContent();
    }

    /**
     * A kicked or banned person leaves at once: out of the waitlist and the booth, and their page is told to go (UserKicked; every other page drops them
     * from the room too). A bot has no page: it is taken out of the room here, and stops being the Auto Host.
     */
    private function sendAway(Room $room, User $user, bool $banned): void
    {
        $room->auto_host_bot_id === $user->id && $room->update(['auto_host_bot_id' => null, 'auto_host_playlist_id' => null]);
        $room->takeOut($user) && PlaybackUpdated::dispatch($room->refresh());
        $user->is_bot && RoomBotPresence::leave($room, $user);

        UserKicked::dispatch($room->id, $user->id, $banned);
    }

    public function ban(Request $request, Room $room, User $user): Response
    {
        $actor = $this->moderateUser($request, $room, $user);

        RoomBan::firstOrCreate(['room_id' => $room->id, 'user_id' => $user->id], ['banned_by' => $actor->id]);
        RoomMember::where('room_id', $room->id)->where('user_id', $user->id)->delete();

        $room->log($actor, 'ban', $user);
        ChatMessage::system($room, 'ban', "{$actor->name} banned {$user->name}", $actor);
        $this->sendAway($room, $user, true);

        return response()->noContent();
    }

    public function unban(Request $request, Room $room, User $user): Response
    {
        abort_unless($room->can($request->user(), 'moderate_users'), 403);

        $room->bans()->where('user_id', $user->id)->delete();
        $room->log($request->user(), 'unban', $user);

        return response()->noContent();
    }

    /** What the moderation panel shows: the log, kicked and muted users and the automod filters. */
    private function modPanel(Room $room): array
    {
        $line = fn ($l) => ['id' => $l->id, 'action' => $l->action, 'actor' => $l->actor?->name, 'target' => $l->target?->name, 'target_id' => $l->target_id, 'details' => $l->details, 'at' => $l->created_at->toIso8601String()];
        $logs = fn () => $room->logs()->with(['actor:id,name', 'target:id,name'])->latest('id');
        $automod = Automod::settings($room);

        return [
            'logs' => $logs()->limit(100)->get()->map($line)->values(),
            'kicked' => $logs()->where('action', 'kick')->limit(50)->get()->map($line)->values(),
            'muted' => $room->mutes()->active()->with('user:id,name,avatar')->get()
                ->map(fn ($m) => ['id' => $m->user_id, 'name' => $m->user->name, 'avatar' => $m->user->avatar, 'until' => $m->until?->toIso8601String()])->values(),
            'automod' => $automod + ['words_text' => implode(', ', $automod['words'])],
        ];
    }

    /** Checks the actor may kick/ban the target (never the host, yourself or site staff). */
    private function moderateUser(Request $request, Room $room, User $target): User
    {
        $actor = $request->user();

        abort_unless($room->can($actor, 'moderate_users'), 403);
        abort_if($target->id === $actor->id, 422, 'You cannot do that to yourself.');
        abort_if($target->id === $room->user_id || $target->hasPermission('rooms.moderate') || $target->hasPermission('rooms.manage'), 403, 'That user cannot be kicked or banned.');

        return $actor;
    }

    /** Newest songs played, rooms created and members joined, mixed into one feed. */
    private function recentActivity(?User $me): array
    {
        $songs = PlaylistItem::whereNotNull('played_at')->whereHas('room', fn ($r) => $r->visibleTo($me))
            ->with(['user:id,name,avatar', 'room:id,name,slug'])->latest('played_at')->limit(8)->get()
            ->map(fn ($i) => ['type' => 'song', 'at' => $i->played_at, 'user' => $i->user->only('id', 'name', 'avatar'), 'text' => "had “{$i->title}” played in {$i->room->name}", 'slug' => $i->room->slug]);

        $rooms = Room::visibleTo($me)->with('user:id,name,avatar')->latest()->limit(5)->get()
            ->map(fn ($r) => ['type' => 'room', 'at' => $r->created_at, 'user' => $r->user->only('id', 'name', 'avatar'), 'text' => "opened the room {$r->name}", 'slug' => $r->slug]);

        $joined = User::latest()->limit(5)->get()
            ->map(fn ($u) => ['type' => 'join', 'at' => $u->created_at, 'user' => $u->only('id', 'name', 'avatar'), 'text' => 'joined SFD-DJ.EU', 'slug' => null]);

        return $songs->concat($rooms)->concat($joined)->sortByDesc('at')->take(10)->values()
            ->map(fn ($a) => ['at' => $a['at']->toIso8601String()] + $a)->all();
    }
}
