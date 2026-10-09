<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\Friendship;
use App\Models\PlaylistItem;
use App\Models\Vote;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Everything that belongs to the logged-in user, on one page. */
class MyStuffController extends Controller
{
    public function index(Request $request): Response
    {
        $me = $request->user();
        $mine = fn () => PlaylistItem::where('user_id', $me->id);
        $votesOnMine = fn (string $type) => Vote::where('type', $type)->whereIn('playlist_item_id', $mine()->select('id'))->count();
        $label = fn (array $catalog, ?string $key) => $key && isset($catalog[$key]) ? (is_array($catalog[$key]) ? $catalog[$key]['label'] : $catalog[$key]) : null;
        $worn = $me->cosmetics ?? [];

        $stats = [
            'xp' => $me->xp ?? 0,
            'level' => $me->level,
            'songs_played' => $mine()->whereNotNull('played_at')->count(),
            'woots' => $votesOnMine('woot'),
            'grabs' => $votesOnMine('grab'),
            'friends' => Friendship::where('status', 'accepted')->where(fn ($q) => $q->where('user_id', $me->id)->orWhere('friend_id', $me->id))->count(),
            'referrals' => $me->referrals()->count(),
            'messages' => ChatMessage::where('user_id', $me->id)->where('type', 'user')->count(),
        ];
        $rooms = $me->rooms()->withCount('items')->latest()->get(['id', 'name', 'slug', 'genre', 'is_private', 'badges', 'created_at']);
        $playlists = $me->playlists()->withCount('songs')->orderBy('name')->get(['id', 'name', 'kind']);

        return Inertia::render('MyStuff', [
            'stats' => $stats,
            'rooms' => $rooms,
            'playlists' => $playlists,
            'recent' => $mine()->whereNotNull('played_at')->with('room:id,name,slug')->latest('played_at')->limit(8)->get()
                ->map(fn ($i) => ['id' => $i->id, 'title' => $i->title, 'thumbnail' => $i->thumbnail, 'played_at' => $i->played_at->toIso8601String(), 'room' => $i->room->only('name', 'slug')]),
            'worn' => [
                'Badge' => $label(AvatarController::BADGES, $worn['badge'] ?? null),
                'Accessory' => $label(AvatarController::ACCESSORIES, $worn['accessory'] ?? null),
                'Frame' => $label(AvatarController::FRAMES, $worn['frame'] ?? null),
                'Effect' => $label(AvatarController::EFFECTS, $worn['effect'] ?? null),
            ],
            'account' => [
                'joined' => $me->created_at->toIso8601String(),
                'username' => $me->username,
                'email_verified' => $me->hasVerifiedEmail(),
                'two_factor' => $me->two_factor_enabled,
                'discord' => $me->discord_username,
                'photo' => str_starts_with((string) $me->avatar, 'img:'),
            ],
            'achievements' => $this->achievements($stats, $rooms->count(), $playlists->where('kind', 'custom')->count()),
        ]);
    }

    /** Things you have done, worked out from your own numbers. [key, title, what it takes, icon, how far you are, goal] */
    private function achievements(array $s, int $rooms, int $playlists): array
    {
        $list = [
            ['first-play', 'First play', 'Have a song played in a room', '🎧', $s['songs_played'], 1],
            ['dj-10', 'Regular DJ', 'Have 10 songs played', '🎚️', $s['songs_played'], 10],
            ['dj-100', 'Resident legend', 'Have 100 songs played', '🏆', $s['songs_played'], 100],
            ['woot-10', 'Crowd pleaser', 'Get 10 woots on your songs', '👍', $s['woots'], 10],
            ['woot-100', 'Fan favourite', 'Get 100 woots on your songs', '🔥', $s['woots'], 100],
            ['grab-5', 'Worth saving', 'Get 5 grabs on your songs', '💾', $s['grabs'], 5],
            ['chatty', 'Chatterbox', 'Write 100 chat messages', '💬', $s['messages'], 100],
            ['friend-1', 'Not alone', 'Make your first friend', '🤝', $s['friends'], 1],
            ['friend-10', 'Social butterfly', 'Have 10 friends', '🦋', $s['friends'], 10],
            ['invite-1', 'Talent scout', 'Invite a friend who registers', '📣', $s['referrals'], 1],
            ['invite-10', 'Ambassador', 'Invite 10 friends', '🌟', $s['referrals'], 10],
            ['host', 'Host with the most', 'Create a room', '🏠', $rooms, 1],
            ['curator', 'Curator', 'Make 3 playlists of your own', '📚', $playlists, 3],
            ['level-5', 'Level 5', 'Reach level 5', '⭐', $s['level'], 5],
            ['level-10', 'Level 10', 'Reach level 10', '💎', $s['level'], 10],
        ];

        return array_map(fn ($a) => ['key' => $a[0], 'title' => $a[1], 'text' => $a[2], 'icon' => $a[3], 'have' => min($a[4], $a[5]), 'goal' => $a[5], 'done' => $a[4] >= $a[5]], $list);
    }
}
