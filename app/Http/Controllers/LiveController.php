<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Support\RoomPresence;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** The Live streams page: the rooms that have a live stream on their big screen right now (private rooms only for those who may enter them). */
class LiveController extends Controller
{
    public function index(Request $request): Response
    {
        // read again every few seconds by the page (partial reload)
        return Inertia::render('Live', [
            'streams' => fn () => $this->streams($request),
        ]);
    }

    private function streams(Request $request): array
    {
        $listening = RoomPresence::counts();

        return Room::visibleTo($request->user())->whereNotNull('live')->get()
            ->filter(function (Room $room) {
                if ($room->liveNow()) {
                    return true;
                }
                $room->endLive(); // it ran for too long and nobody ended it

                return false;
            })
            ->map(fn (Room $room) => [
                'room' => $room->only('id', 'name', 'slug', 'genre', 'badges', 'is_private'),
                'live' => $room->liveState(),
                'listening' => $listening[$room->id] ?? 0,
            ])
            ->sortByDesc(fn (array $stream) => [$stream['listening'], $stream['live']['started_at']])->values()->all();
    }
}
