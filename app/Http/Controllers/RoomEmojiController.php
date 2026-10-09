<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\RoomEmoji;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Custom emojis a room's staff can add (typed in chat as :name:). */
class RoomEmojiController extends Controller
{
    public const MAX_PER_ROOM = 30; // without a plan: the host's plan allows more (App\Support\Plans)

    public function store(Request $request, Room $room): RedirectResponse
    {
        abort_unless($room->can($request->user(), 'edit_settings'), 403);

        $data = $request->validate([
            'name' => ['required', 'regex:/^[a-z0-9_]{2,20}$/', Rule::unique('room_emojis', 'name')->where('room_id', $room->id)],
            'image' => ['required', 'file', 'mimes:png,webp,gif', 'max:100'],
        ], ['name.regex' => 'Use 2 to 20 lowercase letters, numbers or underscores.']);

        abort_if($room->emojis()->count() >= $room->user->limits()['emojis'], 422, 'This room has the maximum number of emojis.');

        $room->emojis()->create(['name' => $data['name'], 'file' => MediaController::store($request->file('image'), 'emojis')]);

        return back();
    }

    public function destroy(Request $request, Room $room, RoomEmoji $emoji): RedirectResponse
    {
        abort_unless($room->can($request->user(), 'edit_settings'), 403);
        abort_unless($emoji->room_id === $room->id, 404);

        MediaController::disk()->delete('emojis/'.$emoji->file);
        $emoji->delete();

        return back();
    }
}
