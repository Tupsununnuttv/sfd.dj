<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\SiteEvent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Inertia\Inertia;
use Inertia\Response;

/** Community events. Anyone can look; members can create and RSVP; creators and staff can delete. */
class EventController extends Controller
{
    public function index(Request $request): Response
    {
        $me = $request->user();
        $manage = (bool) $me?->hasPermission('events.manage');
        $card = fn (SiteEvent $e) => [
            'id' => $e->id,
            'title' => $e->title,
            'description' => $e->description,
            'image_url' => $e->image ? route('media.event', $e->image) : null,
            'starts_at' => $e->starts_at->toIso8601String(),
            'ends_at' => $e->ends_at?->toIso8601String(),
            'room' => $e->room && $e->room->canEnter($me) ? $e->room->only('name', 'slug') : null,
            'going_count' => $e->attendees_count,
            'attendees' => $e->attendees()->limit(6)->get(['users.id', 'users.name', 'users.avatar'])->map->only('id', 'name', 'avatar')->values(),
            'can_delete' => $me && ($manage || $me->id === $e->created_by),
            'is_live' => $e->starts_at->lte(now()) && ($e->ends_at ? $e->ends_at->gt(now()) : $e->starts_at->gt(now()->subHours(3))),
            'going' => $me ? $e->attendees()->whereKey($me->id)->exists() : false,
        ];
        $events = fn () => SiteEvent::with('room')->withCount('attendees');
        // an event is upcoming until it ends (or, with no end time, for 3 hours after it starts)
        $upcoming = fn ($q) => $q->where('ends_at', '>', now())->orWhere(fn ($w) => $w->whereNull('ends_at')->where('starts_at', '>', now()->subHours(3)));
        $over = fn ($q) => $q->where('ends_at', '<=', now())->orWhere(fn ($w) => $w->whereNull('ends_at')->where('starts_at', '<=', now()->subHours(3)));

        return Inertia::render('Events', [
            'upcoming' => $events()->where($upcoming)->orderBy('starts_at')->get()->map($card)->values(),
            'past' => $events()->where($over)->orderByDesc('starts_at')->limit(10)->get()->map($card)->values(),
            'canCreate' => (bool) $me,
            'canManage' => $manage,
            'rooms' => $me ? Room::visibleTo($me)->orderBy('name')->get(['id', 'name']) : [],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $rooms = Room::visibleTo($request->user())->pluck('id')->all();
        $data = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'room_id' => ['nullable', Rule::in($rooms)],
            'image' => ['nullable', File::image()->types(['jpg', 'jpeg', 'png', 'webp'])->max('4mb')->dimensions(Rule::dimensions()->maxWidth(2400)->maxHeight(1600))],
        ]);

        $upload = $data['image'] ?? null;
        unset($data['image']);
        if ($upload instanceof UploadedFile) {
            $data['image'] = MediaController::store($upload, 'events');
        }

        SiteEvent::create($data + ['created_by' => $request->user()->id]);

        return back();
    }

    public function destroy(Request $request, SiteEvent $event): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('events.manage') || $request->user()->id === $event->created_by, 403);

        $image = $event->image;
        $event->delete();

        if ($image) {
            MediaController::disk()->delete('events/'.$image);
        }

        return back();
    }

    /** Toggle "I am going". */
    public function attend(Request $request, SiteEvent $event): RedirectResponse
    {
        $event->attendees()->toggle($request->user()->id);

        return back();
    }
}
