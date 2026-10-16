<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Models\ChatMessage;
use App\Models\Room;
use App\Support\Plans;
use App\Support\RoomPresence;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** The read side of the public API (/api/v1). Writing goes through the same controllers as the website. */
class ApiController extends Controller
{
    /** The front door, no token needed: the version, the time on the server and the limits, so a tool can check it is talking to the right address. */
    public function root(): JsonResponse
    {
        return response()->json([
            'name' => 'SFD-DJ.EU API',
            'version' => 'v1',
            'time' => now()->toIso8601String(),
            'docs' => url('/docs').'#developers',
            'package' => 'sfddj',
            'limits' => ['requests_per_minute' => 120, 'chat_per_minute' => 60, 'whispers_per_minute' => 30],
        ]);
    }

    /** The subscriptions with numbers a program can use (prices in euro cents, `xp` as a multiplier), and what everybody has without one. No token needed. */
    public function plans(): JsonResponse
    {
        return response()->json([
            'free' => Plans::FREE,
            'plans' => collect(Plans::TIERS)->map(fn (array $t, string $key) => ['key' => $key, 'currency' => 'eur'] + $t)->values(),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $me = $request->user();

        return response()->json($me->only('id', 'name', 'username', 'avatar', 'level', 'xp', 'primary_role', 'badges', 'is_bot') + [
            'roles' => $me->roles ?? [],
            'site_permissions' => $me->site_permissions,
            'character' => str_starts_with((string) $me->character, 'char:') ? substr($me->character, 5) : null,
            'plan' => $me->activePlan(),
            'limits' => $me->limits(),
            'coins' => (int) $me->coins,
        ]);
    }

    /** The characters this account may wear, with their level, price, whether they are theirs and the three pictures of each. */
    public function characters(Request $request): JsonResponse
    {
        $me = $request->user();
        $bought = AvatarController::bought($me);

        return response()->json(collect(AvatarController::charactersFor($me))->map(function (string $label, string $name) use ($me, $bought) {
            $key = "char:{$name}";
            $level = AvatarController::levelOf('avatar', $key);
            $role = AvatarController::roleNeeded($key);

            return [
                'name' => $name,
                'label' => $label,
                'level' => $level,
                'rarity' => $role ? ($role === Role::Owner ? 'owner' : 'staff') : AvatarController::rarityOf($level),
                'price' => AvatarController::priceOf('avatar', $key),
                'owned' => AvatarController::owns($me, 'avatar', $key, $bought),
                'role' => $role?->value,
                'images' => collect(['standing', 'dancing', 'djing'])->mapWithKeys(fn (string $state) => [$state => route('characters.show', ['state' => $state, 'name' => $name])]),
            ];
        })->sortBy('level')->values());
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
