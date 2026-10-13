<?php

namespace App\Http\Controllers;

use App\Events\FriendRequested;
use App\Models\Friendship;
use App\Models\PlaylistItem;
use App\Models\User;
use App\Models\Vote;
use App\Support\Presence;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class FriendController extends Controller
{
    public function index(Request $request): Response
    {
        $me = $request->user();
        $card = fn (User $u) => $u->only('id', 'name', 'username', 'avatar', 'primary_role', 'level') + ['user_id' => $u->id];

        // who is where right now (listening in a room), and who was active in the last minutes
        $snapshot = Presence::snapshot($me);
        $seen = fn (User $u) => Presence::of($u, $snapshot);

        // everyone I am already connected to (friend or pending either way), to leave out of "People"
        $linked = Friendship::where('user_id', $me->id)->pluck('friend_id')
            ->merge(Friendship::where('friend_id', $me->id)->pluck('user_id'))->push($me->id);

        // fans: people who woot or grab the songs I play
        $fans = Vote::whereIn('type', ['woot', 'grab'])
            ->whereIn('playlist_item_id', PlaylistItem::where('user_id', $me->id)->select('id'))
            ->where('user_id', '!=', $me->id)
            ->selectRaw('user_id, count(*) as votes')->groupBy('user_id')->orderByDesc('votes')->limit(50)->get();
        $fanUsers = User::whereIn('id', $fans->pluck('user_id'))->get()->keyBy('id');

        $friends = Friendship::where('status', 'accepted')
            ->where(fn ($q) => $q->where('user_id', $me->id)->orWhere('friend_id', $me->id))
            ->with(['sender', 'receiver'])->get()
            ->map(fn ($f) => ['id' => $f->id] + $card($f->user_id === $me->id ? $f->receiver : $f->sender) + $seen($f->user_id === $me->id ? $f->receiver : $f->sender))
            ->sortBy([['online', 'desc'], ['name', 'asc']])->values();

        return Inertia::render('Friends', [
            'people' => User::where('is_bot', false)->whereNotIn('id', $linked)->latest()->limit(60)->get()->map($card)->values(),
            'fans' => $fans->map(fn ($f) => $card($fanUsers[$f->user_id]) + ['votes' => (int) $f->votes, 'linked' => $linked->contains($f->user_id)])->values(),
            'friends' => $friends,
            'suggestions' => $this->suggestions($me, $linked, $card),
            'incoming' => Friendship::where('friend_id', $me->id)->where('status', 'pending')->with('sender')->latest()->get()
                ->map(fn ($f) => ['id' => $f->id] + $card($f->sender)),
            'outgoing' => Friendship::where('user_id', $me->id)->where('status', 'pending')->with('receiver')->latest()->get()
                ->map(fn ($f) => ['id' => $f->id] + $card($f->receiver)),
        ]);
    }

    /** People you may know: friends of your friends, the ones you share the most friends with first. */
    private function suggestions(User $me, $linked, \Closure $card): array
    {
        $mine = Friendship::where('status', 'accepted')->where(fn ($q) => $q->where('user_id', $me->id)->orWhere('friend_id', $me->id))->get()
            ->map(fn ($f) => $f->user_id === $me->id ? $f->friend_id : $f->user_id)->all();

        if (! $mine) {
            return [];
        }

        $mutual = [];
        $theirs = Friendship::where('status', 'accepted')->where(fn ($q) => $q->whereIn('user_id', $mine)->orWhereIn('friend_id', $mine))->get();
        foreach ($theirs as $f) {
            foreach ([[$f->user_id, $f->friend_id], [$f->friend_id, $f->user_id]] as [$a, $b]) {
                if (in_array($a, $mine, true) && ! in_array($b, $mine, true) && ! $linked->contains($b)) {
                    $mutual[$b] = ($mutual[$b] ?? 0) + 1;
                }
            }
        }
        arsort($mutual);

        return User::where('is_bot', false)->whereIn('id', array_slice(array_keys($mutual), 0, 8))->get()
            ->map(fn (User $u) => $card($u) + ['mutual' => $mutual[$u->id]])->sortByDesc('mutual')->values()->all();
    }

    /** Send a friend request by exact user name. If they already asked you, this accepts. */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required_without:user_id', 'nullable', 'string', 'max:255'],
            'user_id' => ['required_without:name', 'nullable', 'integer'],
        ]);
        $me = $request->user();
        $target = isset($data['user_id'])
            ? User::find($data['user_id'])
            : (User::whereRaw('lower(username) = ?', [mb_strtolower($data['name'])])->first()
                ?? User::whereRaw('lower(name) = ?', [mb_strtolower($data['name'])])->first()); // a unique display name works too

        if (! $target) {
            throw ValidationException::withMessages(['name' => 'No user with that name.']);
        }
        if ($target->id === $me->id) {
            throw ValidationException::withMessages(['name' => 'You cannot add yourself.']);
        }

        $existing = Friendship::where(fn ($q) => $q->where('user_id', $me->id)->where('friend_id', $target->id))
            ->orWhere(fn ($q) => $q->where('user_id', $target->id)->where('friend_id', $me->id))->first();

        if ($existing?->status === 'accepted') {
            throw ValidationException::withMessages(['name' => 'You are already friends.']);
        }
        if ($existing && $existing->user_id === $me->id) {
            throw ValidationException::withMessages(['name' => 'Request already sent.']);
        }

        // people can switch friend requests off (an answer to a request they sent themselves always works)
        if (! $existing && $target->pref('privacy.friend_requests', true) === false && ! $me->is_staff) {
            throw ValidationException::withMessages(['name' => "{$target->name} is not accepting friend requests."]);
        }

        if ($existing) {
            $existing->update(['status' => 'accepted']); // they had asked you first
        } else {
            FriendRequested::dispatch(Friendship::create(['user_id' => $me->id, 'friend_id' => $target->id]));
        }

        return back();
    }

    public function accept(Request $request, Friendship $friendship): RedirectResponse
    {
        abort_unless($friendship->friend_id === $request->user()->id && $friendship->status === 'pending', 403);

        $friendship->update(['status' => 'accepted']);

        return back();
    }

    /** Decline an incoming request, cancel an outgoing one, or unfriend. */
    public function destroy(Request $request, Friendship $friendship): RedirectResponse
    {
        abort_unless(in_array($request->user()->id, [$friendship->user_id, $friendship->friend_id], true), 403);

        $friendship->delete();

        return back();
    }
}
