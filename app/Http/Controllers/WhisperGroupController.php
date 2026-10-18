<?php

namespace App\Http\Controllers;

use App\Events\WhisperGroupChanged;
use App\Models\User;
use App\Models\Whisper;
use App\Models\WhisperGroup;
use App\Support\LinkGuard;
use App\Support\WordGuard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Collection;

/**
 * Whisper groups: you make one with friends, the owner adds and removes people, everybody can leave. The messages are sent by WhisperController
 * (with a `group_id`). Somebody who joins reads only what is written after that.
 */
class WhisperGroupController extends Controller
{
    /** Only the current owner can remove the entire group, including its recordings. */
    public function destroy(Request $request, WhisperGroup $group): Response
    {
        $group = $this->ownedBy($request, $group);
        $people = $group->members->modelKeys();
        $id = $group->id;
        $group->delete();
        WhisperGroupChanged::dispatch($id, $people, deleted: true);

        return response()->noContent();
    }

    /** Your groups, with the newest whisper of each and how many you have not read. */
    public function index(Request $request): JsonResponse
    {
        $me = $request->user();
        $groups = $me->whisperGroups()->orderBy('whisper_groups.id')->with('members')->get();
        $latest = Whisper::with(['replyTo', 'sender:id,name,username,avatar'])
            ->whereIn('id', Whisper::selectRaw('max(id)')->whereIn('group_id', $groups->modelKeys())->groupBy('group_id'))
            ->get()->keyBy('group_id');
        $unread = WhisperGroup::unreadCounts($me);

        return response()->json($groups->map(function (WhisperGroup $group) use ($latest, $unread, $me) {
            $last = $latest[$group->id] ?? null;

            return [
                'group' => $group->summary(),
                'last' => $last && $last->id > $group->pivot->since_id ? $last->payload($me->id) : null, // it may be from before they came
                'unread' => (int) ($unread[$group->id] ?? 0),
            ];
        })->values());
    }

    /** Your friends, for choosing who goes in a group. */
    public function friends(Request $request): JsonResponse
    {
        return response()->json($request->user()->friends()->map->only('id', 'name', 'username', 'avatar')->values());
    }

    /** The group with what you may read of it; opening it marks it read. */
    public function show(Request $request, WhisperGroup $group): JsonResponse
    {
        $request->validate(['before' => ['nullable', 'integer', 'min:1']]);
        $me = $request->user();
        $group = $this->mine($request, $group)->load('members');
        $group->markReadBy($me);

        return response()->json([
            'group' => $group->summary(),
        ] + Whisper::history($group->readable()->with(['replyTo', 'sender:id,name,username,avatar']), $me->id, $request->integer('before')));
    }

    /** The group is on screen: what was written is read (the red number in the menu). */
    public function read(Request $request, WhisperGroup $group): Response
    {
        $this->mine($request, $group)->markReadBy($request->user());

        return response()->noContent();
    }

    /** Make a group of your friends: a name and who goes in (you are the owner). */
    public function store(Request $request): JsonResponse
    {
        $me = $request->user();
        $data = $request->validate([
            'name' => ['required', 'string', 'max:40'],
            'user_ids' => ['required', 'array', 'min:1', 'max:'.(WhisperGroup::MAX_MEMBERS - 1)],
            'user_ids.*' => ['integer', 'distinct'],
        ]);

        $name = $this->cleanName($data['name'], $me);
        abort_if(WhisperGroup::where('owner_id', $me->id)->count() >= WhisperGroup::MAX_OWNED, 422, 'You own '.WhisperGroup::MAX_OWNED.' groups already. Leave one first.');
        $friends = $this->friendsAmong($me, $data['user_ids']);

        $group = WhisperGroup::create(['name' => $name, 'owner_id' => $me->id]);
        $group->admit([$me, ...$friends]);
        $group->load('members');
        WhisperGroupChanged::dispatch($group->id, $group->members->modelKeys());

        return response()->json($group->summary(), 201);
    }

    /** Rename: the owner. */
    public function update(Request $request, WhisperGroup $group): JsonResponse
    {
        $group = $this->ownedBy($request, $group);
        $data = $request->validate(['name' => ['required', 'string', 'max:40']]);

        $group->update(['name' => $this->cleanName($data['name'], $request->user())]);
        WhisperGroupChanged::dispatch($group->id, $group->members->modelKeys());

        return response()->json($group->summary());
    }

    /** Add friends: the owner. Somebody who is in already is skipped. */
    public function add(Request $request, WhisperGroup $group): JsonResponse
    {
        $group = $this->ownedBy($request, $group);
        $data = $request->validate(['user_ids' => ['required', 'array', 'min:1', 'max:'.(WhisperGroup::MAX_MEMBERS - 1)], 'user_ids.*' => ['integer', 'distinct']]);

        $new = $this->friendsAmong($request->user(), $data['user_ids'])->reject(fn (User $user) => $group->members->contains($user));
        abort_if($group->members->count() + $new->count() > WhisperGroup::MAX_MEMBERS, 422, 'A group has room for '.WhisperGroup::MAX_MEMBERS.' people.');

        $group->admit($new);
        $group->load('members');
        WhisperGroupChanged::dispatch($group->id, $group->members->modelKeys());

        return response()->json($group->summary());
    }

    /** Take somebody out: the owner, or anybody taking themselves out (leaving). */
    public function remove(Request $request, WhisperGroup $group, User $user): Response
    {
        $group = $this->mine($request, $group);
        abort_unless($user->id === $request->user()->id || $group->owner_id === $request->user()->id, 403, 'Only the owner can remove people.');
        abort_unless($group->members()->whereKey($user->id)->exists(), 404);

        $everyone = $group->members()->pluck('users.id')->all(); // the one who goes hears of it too
        $group->release($user);
        WhisperGroupChanged::dispatch($group->id, $everyone, $user->id);

        return response()->noContent();
    }

    /** The group, loaded through you: 404 when you are not in it (nobody learns that it exists). */
    private function mine(Request $request, WhisperGroup $group): WhisperGroup
    {
        return $request->user()->whisperGroups()->whereKey($group->id)->firstOrFail();
    }

    /** The same, and you must be its owner. Members are loaded. */
    private function ownedBy(Request $request, WhisperGroup $group): WhisperGroup
    {
        $group = $this->mine($request, $group)->load('members');
        abort_unless($group->owner_id === $request->user()->id, 403, 'Only the owner can do that.');

        return $group;
    }

    /** The name as it is kept; nobody names a group with a word that is not allowed or a link to another site. */
    private function cleanName(string $name, User $me): string
    {
        $name = trim($name);
        $why = WordGuard::check($name) ?? ($me->is_staff ? null : LinkGuard::check($name));
        abort_if($why !== null, 422, (string) $why);
        abort_if($name === '', 422, 'Give the group a name.');

        return $name;
    }

    /** The people with these ids. All of them must be your friends and take whispers from you. */
    private function friendsAmong(User $me, array $ids): Collection
    {
        $friends = $me->friends()->keyBy('id');
        $chosen = collect($ids)->map(fn ($id) => $friends[$id] ?? null);

        abort_if($chosen->contains(null), 422, 'You can only add your friends.');
        $chosen->each(fn (User $user) => abort_unless($user->takesWhispersFrom($me), 403, "{$user->name} does not take whispers from you."));

        return $chosen->values();
    }
}
