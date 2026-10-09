<?php

namespace App\Http\Controllers;

use App\Models\Friendship;
use App\Models\PlaylistItem;
use App\Models\User;
use App\Models\Vote;
use App\Support\Awards;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Someone's public profile: the full page, and the small JSON behind the quick-profile card in rooms. Never shows email. */
class UserProfileController extends Controller
{
    public function show(Request $request, User $user): Response
    {
        return Inertia::render('UserProfile', ['profile' => $this->profile($request, $user)]);
    }

    public function card(Request $request, User $user): JsonResponse
    {
        return response()->json($this->profile($request, $user));
    }

    private function profile(Request $request, User $user): array
    {
        $me = $request->user();
        $songs = fn () => PlaylistItem::where('user_id', $user->id);
        $votes = fn (string $type) => Vote::where('type', $type)->whereIn('playlist_item_id', $songs()->select('id'))->count();

        $link = $me ? Friendship::where(fn ($q) => $q->where('user_id', $me->id)->where('friend_id', $user->id))
            ->orWhere(fn ($q) => $q->where('user_id', $user->id)->where('friend_id', $me->id))->first() : null;

        return $user->only('id', 'name', 'username', 'avatar', 'cosmetics', 'primary_role', 'badges', 'level', 'bio', 'favorite_genre', 'pronouns', 'flag') + [
            'status' => $me?->id === $user->id ? $user->status : $user->shownStatus(), // you see what you chose, everybody else what you let them see
            'awards' => array_map(Awards::badge(...), Awards::clean($user->awards)),
            'joined' => $user->created_at->toIso8601String(),
            'discord' => $user->discord_username,
            'is_me' => $me?->id === $user->id,
            'friendship' => ! $link ? 'none' : ($link->status === 'accepted' ? 'friends' : ($link->user_id === $me->id ? 'sent' : 'received')),
            'friendship_id' => $link?->id,
            'stats' => [
                'xp' => $user->xp,
                'songs_played' => $songs()->whereNotNull('played_at')->count(),
                'woots' => $votes('woot'),
                'grabs' => $votes('grab'),
                'friends' => Friendship::where('status', 'accepted')->where(fn ($q) => $q->where('user_id', $user->id)->orWhere('friend_id', $user->id))->count(),
            ],
            'rooms' => $user->rooms()->visibleTo($me)->latest()->limit(10)->get(['id', 'name', 'slug', 'genre']),
        ];
    }
}
