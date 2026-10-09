<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\Room;
use App\Support\RoomPresence;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** The read side of the public API (/api/v1). Writing goes through the same controllers as the website. */
class ApiController extends Controller
{
    public function me(Request $request): JsonResponse
    {
        $me = $request->user();

        return response()->json($me->only('id', 'name', 'username', 'avatar', 'level', 'xp', 'primary_role', 'badges', 'is_bot') + [
            'roles' => $me->roles ?? [],
            'site_permissions' => $me->site_permissions,
        ]);
    }

    public function rooms(Request $request): JsonResponse
    {
        $listening = RoomPresence::counts();

        return response()->json(Room::visibleTo($request->user())->with('user:id,name')->withCount('items')->latest()->get()->map(fn (Room $r) => [
            'slug' => $r->slug,
            'name' => $r->name,
            'description' => $r->description,
            'genre' => $r->genre,
            'is_private' => $r->is_private,
            'host' => $r->user->only('id', 'name'),
            'listening' => $listening[$r->id] ?? 0,
            'queue_length' => $r->items_count,
        ])->values());
    }

    /** One room: its settings, what is playing, the waitlist, and what the caller may do there. */
    public function room(Request $request, Room $room): JsonResponse
    {
        $room->syncCurrent();

        return response()->json($room->only('slug', 'name', 'description', 'genre', 'is_private', 'welcome_message', 'rules', 'rule_list') + [
            'host' => $room->user->only('id', 'name'),
            'listening' => RoomPresence::counts()[$room->id] ?? 0,
            'permissions' => $room->permissionsFor($request->user()),
            'playback' => $room->playback(),
        ]);
    }

    /** Chat history. `after=<id>` returns only newer messages (oldest first) so a bot can poll; otherwise the latest `limit`. */
    public function messages(Request $request, Room $room): JsonResponse
    {
        $data = $request->validate(['after' => ['nullable', 'integer', 'min:0'], 'limit' => ['nullable', 'integer', 'min:1', 'max:100']]);
        $limit = $data['limit'] ?? 50;
        $query = $room->messages()->with([ChatMessage::WITH_USER, 'replyTo.user']);

        $messages = isset($data['after'])
            ? $query->where('id', '>', $data['after'])->orderBy('id')->limit($limit)->get()
            : $query->latest('id')->limit($limit)->get()->reverse();

        return response()->json($messages->map->payload()->values());
    }

    /** The room's own roles and who holds them. */
    public function members(Room $room): JsonResponse
    {
        return response()->json([
            'host' => $room->user->only('id', 'name'),
            'roles' => $room->roles()->get(['id', 'name', 'color', 'permissions']),
            'members' => $room->members()->with('user:id,name,avatar')->get()->map(fn ($m) => ['user_id' => $m->user_id, 'name' => $m->user->name, 'room_role_id' => $m->room_role_id])->values(),
        ]);
    }
}
