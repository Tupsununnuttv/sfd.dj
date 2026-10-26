<?php

namespace App\Http\Controllers;

use App\Models\PlaylistItem;
use App\Models\Room;
use App\Models\SiteEvent;
use App\Models\User;
use App\Support\PublicStats;
use App\Support\RoomPresence;
use App\Support\RoomGuests;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use App\Support\DiscordActivity;
use Inertia\Inertia;
use Inertia\Response;

/** The public website: the home page with live numbers. The other pages (features, about, legal ...) are plain text pages. */
class SiteController extends Controller
{
    /** The busiest rooms the visitor may see, featured first, with what plays and how many listen (the home page, and the Discord Activity). */
    public static function topRooms(?User $me, int $limit = 6)
    {
        // Rank thin room records first; only the displayed cards need relations and queue totals.
        $catalogue = Room::visibleTo($me)->get(['id', 'user_id', 'name', 'slug', 'description', 'badges', 'genre', 'is_private', 'is_featured', 'current_item_id', 'auto_host_bot_id', 'live']);
        $listening = RoomPresence::counts();
        foreach (RoomGuests::counts($catalogue->modelKeys()) as $id => $count) $listening[$id] = ($listening[$id] ?? 0) + $count;
        $rooms = $catalogue->sortByDesc(fn (Room $r) => ($r->is_featured ? 1000 : 0) + ($listening[$r->id] ?? 0))->take($limit)->values();
        $rooms->loadCount('items')->load(['user:id,name', 'autoHostBot:id,name']);
        $playing = PlaylistItem::whereIn('id', $rooms->pluck('current_item_id')->filter())->pluck('title', 'id');

        return $rooms->map(fn (Room $r) => $r->only('id', 'name', 'slug', 'description', 'badges', 'genre', 'is_private', 'is_featured', 'items_count') + [
            'user' => $r->user->only('name'),
            'auto_host_bot' => $r->autoHostBot?->only('id', 'name'),
            'listening' => $listening[$r->id] ?? 0,
            'now_playing' => $playing[$r->current_item_id] ?? null,
            'live_title' => $r->liveNow()['title'] ?? null, // a live stream is on the big screen
        ]);
    }

    public function home(Request $request): Response|RedirectResponse
    {
        if (DiscordActivity::request($request)) return app(DiscordActivityController::class)->show($request);
        $me = $request->user();

        return Inertia::render('Welcome', [
            'rooms' => fn () => self::topRooms($me),
            'event' => function () {
                $event = SiteEvent::withCount('attendees')->with('room:id,name,slug,is_private')
                    ->where(fn ($q) => $q->where('ends_at', '>', now())->orWhere(fn ($w) => $w->whereNull('ends_at')->where('starts_at', '>', now()->subHours(3))))
                    ->orderBy('starts_at')->first();

                return $event ? [
                    'id' => $event->id,
                    'title' => $event->title,
                    'description' => $event->description,
                    'starts_at' => $event->starts_at->toIso8601String(),
                    'going' => $event->attendees_count,
                    'room' => $event->room && ! $event->room->is_private ? $event->room->only('name', 'slug') : null,
                ] : null;
            },
            'topDjs' => fn () => User::where('is_bot', false)->withCount(['playlistItems as plays' => fn ($q) => $q->whereNotNull('played_at')])->orderByDesc('plays')->limit(3)->get()
                ->filter(fn ($u) => $u->plays > 0)->map(fn ($u) => $u->only('id', 'name', 'avatar', 'primary_role') + ['plays' => $u->plays])->values(),
            'genres' => fn () => Room::where('is_private', false)->whereNotNull('genre')->selectRaw('genre, count(*) as n')->groupBy('genre')->orderByDesc('n')->limit(8)->pluck('n', 'genre'),
            'stats' => fn () => (fn ($stats) => $stats + ['songs_played' => $stats['songs']])(PublicStats::get()),
        ]);
    }
}
