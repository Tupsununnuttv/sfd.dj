<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\Room;
use App\Models\SelfDjBot;
use App\Models\User;
use App\Services\SelfDjPlayback;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Legacy Auto Host endpoints, kept in sync with Self DJ Bots: the host hosts one of their own bots in the room. Whenever nobody else
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
    public function update(Request $request, Room $room, SelfDjPlayback $playback): Response
    {
        $me = $this->allow($request, $room);
        $data = $request->validate(['bot_id' => ['nullable', 'integer'], 'playlist_id' => ['nullable', 'integer']]);

        if (empty($data['bot_id'])) {
            $playback->configure($room, null, null);

            return response()->noContent();
        }

        $bot = $me->bots()->find($data['bot_id']) ?? throw ValidationException::withMessages(['bot_id' => 'Pick one of your own bots (Settings → Developers).']);
        $playlist = $me->playlists()->find($data['playlist_id'] ?? 0) ?? throw ValidationException::withMessages(['playlist_id' => 'Pick one of your own playlists.']);

        if ($playlist->songs()->doesntExist()) {
            throw ValidationException::withMessages(['playlist_id' => "“{$playlist->name}” has no songs yet."]);
        }

        if ($room->bans()->where('user_id', $bot->id)->exists()) {
            throw ValidationException::withMessages(['bot_id' => 'This bot is banned from the room.']);
        }

        DB::transaction(function () use ($room, $me, $bot, $playlist, $playback) {
            $room = Room::whereKey($room->id)->lockForUpdate()->firstOrFail();
            $existing = SelfDjBot::where('room_id', $room->id)->first();
            SelfDjBot::updateOrCreate(['room_id' => $room->id], [
                'user_id' => $me->id, 'bot_id' => $bot->id, 'playlist_id' => $playlist->id,
                'managed_account' => $existing?->bot_id === $bot->id && $existing->managed_account,
            ]);
            $before = $room->auto_host_bot_id;
            $playback->configure($room, $bot, $playlist);
            $before === $bot->id || ChatMessage::system($room, 'join', "{$bot->name} is the self DJ now: it plays when nobody else is in the waitlist", $me);
        });

        return response()->noContent();
    }

    private function allow(Request $request, Room $room): User
    {
        $me = $request->user();
        abort_unless($me->id === $room->user_id || $me->is_staff, 403, 'Only the host of the room can set up its Auto Host.');

        return $me;
    }
}
