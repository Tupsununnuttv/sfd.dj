<?php

namespace App\Http\Controllers;

use App\Events\PlaybackUpdated;
use App\Models\ChatMessage;
use App\Models\Room;
use App\Models\RoomBotPresence;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

/**
 * Auto Host (Room settings → Music & Waitlist): the host hosts one of their own bots in the room, with no script of their own to run. Whenever nobody else
 * is in the waitlist, the bot plays the next song of one of the host's playlists (Room::autoHostItem); when somebody joins, they play after the bot's song.
 * Only the host of the room (or SFD-DJ.EU staff) can switch it, and only with their own bot and their own playlist.
 */
class AutoHostController extends Controller
{
    public function show(Request $request, Room $room): JsonResponse
    {
        $me = $this->allow($request, $room);

        return response()->json([
            'bot_id' => $room->auto_host_bot_id,
            'playlist_id' => $room->auto_host_playlist_id,
            'bots' => $me->bots()->get(['id', 'name'])->map->only('id', 'name')->values(),
            'playlists' => $me->playlists()->withCount('songs')->orderBy('name')->get(['id', 'name'])->map->only('id', 'name', 'songs_count')->values(),
        ]);
    }

    /** Switch it on with `bot_id` and `playlist_id`, or off with no `bot_id`. */
    public function update(Request $request, Room $room): Response
    {
        $me = $this->allow($request, $room);
        $data = $request->validate(['bot_id' => ['nullable', 'integer'], 'playlist_id' => ['nullable', 'integer']]);
        $before = $room->autoHostBot;

        if (empty($data['bot_id'])) {
            $room->update(['auto_host_bot_id' => null, 'auto_host_playlist_id' => null]);
            $this->stop($room, $before);

            return response()->noContent();
        }

        $bot = $me->bots()->find($data['bot_id']) ?? throw ValidationException::withMessages(['bot_id' => 'Pick one of your own bots (Settings → Developers).']);
        $playlist = $me->playlists()->find($data['playlist_id'] ?? 0) ?? throw ValidationException::withMessages(['playlist_id' => 'Pick one of your own playlists.']);

        if ($playlist->songs()->doesntExist()) {
            throw ValidationException::withMessages(['playlist_id' => "“{$playlist->name}” has no songs yet."]);
        }

        if ($before && $before->id !== $bot->id) {
            $this->stop($room, $before);
        }

        $room->update(['auto_host_bot_id' => $bot->id, 'auto_host_playlist_id' => $playlist->id]);
        RoomBotPresence::hold($room, $bot);
        $before?->id === $bot->id || ChatMessage::system($room, 'join', "{$bot->name} is the Auto Host now: it plays when nobody else is in the waitlist", $me);

        $room->startAutoHostIfIdle();
        PlaybackUpdated::dispatch($room->refresh());

        return response()->noContent();
    }

    /** The bot leaves the room; a song of its that is playing stops. */
    private function stop(Room $room, ?User $bot): void
    {
        if (! $bot) {
            return;
        }

        RoomBotPresence::leave($room, $bot);
        $room->items()->where('user_id', $bot->id)->where('id', '!=', $room->current_item_id ?? 0)->delete();

        if ($room->current_item_id && $room->items()->whereKey($room->current_item_id)->where('user_id', $bot->id)->exists()) {
            $room->advance(false);
        }

        PlaybackUpdated::dispatch($room->refresh());
    }

    private function allow(Request $request, Room $room): User
    {
        $me = $request->user();
        abort_unless($me->id === $room->user_id || $me->is_staff, 403, 'Only the host of the room can set up its Auto Host.');

        return $me;
    }
}
