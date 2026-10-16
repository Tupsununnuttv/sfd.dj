<?php

namespace App\Http\Controllers;

use App\Models\PlaylistItem;
use App\Models\Room;
use App\Models\SiteEvent;
use App\Models\User;
use App\Support\RoomPresence;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** The public website: the home page with live numbers. The other pages (features, about, legal ...) are plain text pages. */
class SiteController extends Controller
{
    public function home(Request $request): Response
    {
        $me = $request->user();
        $listening = RoomPresence::counts();

        $rooms = Room::visibleTo($me)->withCount('items')->with('user:id,name')->get()
            ->sortByDesc(fn (Room $r) => ($r->is_featured ? 1000 : 0) + ($listening[$r->id] ?? 0))
            ->take(6)->values();
        $playing = PlaylistItem::whereIn('id', $rooms->pluck('current_item_id')->filter())->pluck('title', 'id');

        // the next event, or the one that is on right now (public rooms only on the home page)
        $event = SiteEvent::withCount('attendees')->with('room')
            ->where(fn ($q) => $q->where('ends_at', '>', now())->orWhere(fn ($w) => $w->whereNull('ends_at')->where('starts_at', '>', now()->subHours(3))))
            ->orderBy('starts_at')->first();

        return Inertia::render('Welcome', [
            'rooms' => $rooms->map(fn (Room $r) => $r->only('id', 'name', 'slug', 'description', 'badges', 'genre', 'is_private', 'is_featured', 'items_count') + [
                'user' => $r->user->only('name'),
                'listening' => $listening[$r->id] ?? 0,
                'now_playing' => $playing[$r->current_item_id] ?? null,
                'live_title' => $r->liveNow()['title'] ?? null, // a live stream is on the big screen
            ]),
            'event' => $event ? [
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'starts_at' => $event->starts_at->toIso8601String(),
                'going' => $event->attendees_count,
                'room' => $event->room && ! $event->room->is_private ? $event->room->only('name', 'slug') : null,
            ] : null,
            'topDjs' => User::where('is_bot', false)->withCount(['playlistItems as plays' => fn ($q) => $q->whereNotNull('played_at')])->orderByDesc('plays')->limit(3)->get()
                ->filter(fn ($u) => $u->plays > 0)->map(fn ($u) => $u->only('id', 'name', 'avatar', 'primary_role') + ['plays' => $u->plays])->values(),
            'genres' => Room::where('is_private', false)->whereNotNull('genre')->selectRaw('genre, count(*) as n')->groupBy('genre')->orderByDesc('n')->limit(8)->pluck('n', 'genre'),
            'stats' => [
                'members' => User::where('is_bot', false)->count(),
                'rooms' => Room::where('is_private', false)->count(),
                'songs_played' => PlaylistItem::whereNotNull('played_at')->count(),
                'listening' => array_sum($listening),
            ],
        ]);
    }
}
