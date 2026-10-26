<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;
use Inertia\Inertia;

/** Public room entry and selection for Discord's anonymous, read-only Activity. */
class DiscordActivityController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        $slug = trim((string) config('discord-activity.room', ''));
        $room = $slug !== '' ? Room::atAddress($slug)->where('is_private', false)->first() : null;
        if ($room) {
            // Discord's proxy can follow a redirect back into itself. Render in
            // place so the original launch URL and SDK parameters stay intact.
            return app(RoomController::class)->show($request, $room);
        }

        return $this->rooms($request);
    }

    public function rooms(Request $request): Response
    {
        return Inertia::render('Discord/Activity', [
            'rooms' => fn () => SiteController::topRooms(null, 100)->filter(fn (array $room) => ! $room['is_private'])->values()->all(),
        ]);
    }

    /** Retired for the guest-only Activity; normal website Discord OAuth is separate. */
    public function token(Request $request): JsonResponse
    {
        return response()->json(['message' => 'This Activity is for watching rooms as a guest.'], 403);
    }
}
