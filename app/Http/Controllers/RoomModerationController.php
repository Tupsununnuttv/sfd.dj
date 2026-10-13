<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\Room;
use App\Models\RoomLog;
use App\Models\RoomMute;
use App\Models\User;
use App\Support\Automod;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/** Muting, the automod filters and the moderation log. Kicks and bans live in RoomController. */
class RoomModerationController extends Controller
{
    private const DURATIONS = ['10m' => 10, '1h' => 60, '24h' => 1440, 'forever' => null];

    /** Stop a user from chatting in this room for a while (or until unmuted). */
    public function mute(Request $request, Room $room, User $user): Response
    {
        $actor = $request->user();
        abort_unless($room->can($actor, 'moderate_users'), 403);
        abort_if($user->id === $actor->id, 422, 'You cannot do that to yourself.');
        abort_if($user->id === $room->user_id || $user->hasPermission('rooms.moderate') || $user->hasPermission('rooms.manage'), 403, 'That user cannot be muted.');

        $length = $request->validate(['for' => ['required', 'in:'.implode(',', array_keys(self::DURATIONS))]])['for'];
        $minutes = self::DURATIONS[$length];

        RoomMute::updateOrCreate(
            ['room_id' => $room->id, 'user_id' => $user->id],
            ['muted_by' => $actor->id, 'until' => $minutes ? now()->addMinutes($minutes) : null],
        );

        $label = $length === 'forever' ? 'until unmuted' : "for {$length}";
        ChatMessage::system($room, 'mute', "{$actor->name} muted {$user->name} {$label}", $actor);
        $room->log($actor, 'mute', $user, $label);

        return response()->noContent();
    }

    public function unmute(Request $request, Room $room, User $user): Response
    {
        $actor = $request->user();
        abort_unless($room->can($actor, 'moderate_users'), 403);

        if ($room->mutes()->where('user_id', $user->id)->delete()) {
            ChatMessage::system($room, 'mute', "{$actor->name} unmuted {$user->name}", $actor);
            $room->log($actor, 'unmute', $user);
        }

        return response()->noContent();
    }

    /** Take one line out of the moderation log. Only the host and SFD-DJ.EU staff may: the log is how the others' actions are checked. */
    public function destroyLog(Request $request, Room $room, RoomLog $log): Response
    {
        abort_unless($room->clearsLogs($request->user()), 403);
        abort_unless($log->room_id === $room->id, 404);

        $log->delete();

        return response()->noContent();
    }

    /** Empty the whole moderation log of the room (the host and staff). */
    public function clearLogs(Request $request, Room $room): Response
    {
        abort_unless($room->clearsLogs($request->user()), 403);

        $room->logs()->delete();

        return response()->noContent();
    }

    public function automod(Request $request, Room $room): Response
    {
        abort_unless($room->can($request->user(), 'moderate_chat'), 403);

        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'links' => ['required', 'boolean'],
            'caps' => ['required', 'boolean'],
            'repeat' => ['required', 'boolean'],
            'words_text' => ['nullable', 'string', 'max:1000'],
        ]);

        $words = collect(preg_split('/[,\n]+/', (string) ($data['words_text'] ?? '')))
            ->map(fn ($w) => mb_strtolower(trim($w)))->filter()->unique()->take(100)->map(fn ($w) => mb_substr($w, 0, 40))->values()->all();

        $room->update(['automod' => ['enabled' => $data['enabled'], 'links' => $data['links'], 'caps' => $data['caps'], 'repeat' => $data['repeat'], 'words' => $words]]);
        $room->log($request->user(), 'settings', null, 'AutoMod '.($data['enabled'] ? 'updated' : 'turned off'));

        return response()->noContent();
    }
}
