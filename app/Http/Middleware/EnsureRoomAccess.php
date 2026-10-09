<?php

namespace App\Http\Middleware;

use App\Models\Room;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** A request about a room only goes through for people who may be in it: not banned, and staff or host for private rooms. */
class EnsureRoomAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $room = $request->route('room');
        $user = $request->user();

        if ($room instanceof Room && $user) {
            abort_unless($room->canEnter($user), 403, 'This room is private.');
            abort_if($room->bans()->where('user_id', $user->id)->exists(), 403, 'You are banned from this room.');
        }

        return $next($request);
    }
}
