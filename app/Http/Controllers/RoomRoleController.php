<?php

namespace App\Http\Controllers;

use App\Events\RoomRolesUpdated;
use App\Models\ChatMessage;
use App\Models\Room;
use App\Models\RoomMember;
use App\Models\RoomRole;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

/** Custom room roles and who holds them. Only people with "manage_roles" in the room may use this. */
class RoomRoleController extends Controller
{
    private const MAX_CUSTOM_ROLES = 20;

    public function store(Request $request, Room $room): RedirectResponse
    {
        $this->authorizeManage($request, $room);
        abort_if($room->roles()->where('builtin', false)->count() >= self::MAX_CUSTOM_ROLES, 422, 'Too many custom roles.');

        $room->roles()->create($this->validated($request, $room) + ['rank' => 10, 'builtin' => false]);
        RoomRolesUpdated::dispatch($room->id);

        return back();
    }

    public function update(Request $request, Room $room, RoomRole $role): RedirectResponse
    {
        $this->authorizeManage($request, $room);
        abort_unless($role->room_id === $room->id && ! $role->builtin, 404);

        $role->update($this->validated($request, $room, $role));
        RoomRolesUpdated::dispatch($room->id);

        return back();
    }

    public function destroy(Request $request, Room $room, RoomRole $role): RedirectResponse
    {
        $this->authorizeManage($request, $room);
        abort_unless($role->room_id === $room->id && ! $role->builtin, 404);

        $role->delete(); // members holding it fall back to plain listeners (cascade)
        RoomRolesUpdated::dispatch($room->id);

        return back();
    }

    /** Give a user a room role, or take it away with room_role_id = null. */
    public function assign(Request $request, Room $room, User $user): Response
    {
        $this->authorizeManage($request, $room);
        abort_if($user->id === $room->user_id, 422, 'The host already has every permission.');

        $roleId = $request->validate(['room_role_id' => ['nullable', 'integer']])['room_role_id'];

        $actor = $request->user();

        if ($roleId === null) {
            $old = RoomMember::with('role')->where('room_id', $room->id)->where('user_id', $user->id)->first();
            $old?->delete();
            $old && $room->log($actor, 'role', $user, "Removed {$old->role->name}");
            $old && ChatMessage::system($room, 'demote', "{$actor->name} removed {$user->name}'s {$old->role->name} role", $actor);
        } else {
            $role = $room->roles()->findOrFail($roleId);
            // Only someone who can already assign roles may hand out a role that can assign roles.
            abort_if(in_array('manage_roles', $role->permissions, true) && $room->user_id !== $request->user()->id && ! $request->user()->hasPermission('rooms.manage'), 403);

            RoomMember::updateOrCreate(['room_id' => $room->id, 'user_id' => $user->id], ['room_role_id' => $role->id]);
            $room->log($actor, 'role', $user, "Promoted to {$role->name}");
            ChatMessage::system($room, 'promote', "{$actor->name} promoted {$user->name} to {$role->name}", $actor);
        }

        RoomRolesUpdated::dispatch($room->id);

        return response()->noContent();
    }

    /** Find any SFD-DJ.EU user by name, to give them a role (the host is left out). */
    public function search(Request $request, Room $room): JsonResponse
    {
        $this->authorizeManage($request, $room);
        $q = trim((string) $request->query('q'));

        return response()->json(
            strlen($q) < 2 ? [] : User::whereLike('name', '%'.$q.'%')
                ->where('id', '!=', $room->user_id)->orderBy('name')->limit(8)->get(['id', 'name', 'avatar'])
        );
    }

    private function authorizeManage(Request $request, Room $room): void
    {
        abort_unless($room->can($request->user(), 'manage_roles'), 403);
    }

    private function validated(Request $request, Room $room, ?RoomRole $ignore = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:30', Rule::unique('room_roles', 'name')->where('room_id', $room->id)->ignore($ignore?->id)],
            'color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'permissions' => ['present', 'array'],
            'permissions.*' => ['string', Rule::in(array_keys(Room::PERMISSIONS))],
        ]);

        return ['name' => $data['name'], 'color' => $data['color'], 'permissions' => array_values(array_unique($data['permissions']))];
    }
}
