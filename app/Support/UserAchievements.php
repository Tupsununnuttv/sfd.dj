<?php

namespace App\Support;

use App\Models\ChatMessage;
use App\Models\Friendship;
use App\Models\PlaylistItem;
use App\Models\User;
use App\Models\Vote;

class UserAchievements
{
    public static function forUser(User $user, ?int $roomCount = null, ?int $customPlaylistCount = null): array
    {
        $mine = fn () => PlaylistItem::where('user_id', $user->id);
        $votesOnMine = fn (string $type) => Vote::where('type', $type)->whereIn('playlist_item_id', $mine()->select('id'))->count();
        $stats = [
            'xp' => $user->xp ?? 0,
            'level' => $user->level,
            'songs_played' => $mine()->whereNotNull('played_at')->count(),
            'woots' => $votesOnMine('woot'),
            'grabs' => $votesOnMine('grab'),
            'friends' => Friendship::where('status', 'accepted')->where(fn ($query) => $query->where('user_id', $user->id)->orWhere('friend_id', $user->id))->count(),
            'referrals' => $user->referrals()->count(),
            'messages' => ChatMessage::where('user_id', $user->id)->where('type', 'user')->count(),
        ];
        $roomCount ??= $user->rooms()->count();
        $customPlaylistCount ??= $user->playlists()->where('kind', 'custom')->count();

        return [
            'stats' => $stats,
            'achievements' => self::build($stats, $roomCount, $customPlaylistCount),
        ];
    }

    private static function build(array $stats, int $rooms, int $playlists): array
    {
        $list = [
            ['first-play', 'First play', 'Have a song played in a room', '🎧', $stats['songs_played'], 1],
            ['dj-10', 'Regular DJ', 'Have 10 songs played', '🎚️', $stats['songs_played'], 10],
            ['dj-100', 'Resident legend', 'Have 100 songs played', '🏆', $stats['songs_played'], 100],
            ['woot-10', 'Crowd pleaser', 'Get 10 woots on your songs', '👍', $stats['woots'], 10],
            ['woot-100', 'Fan favourite', 'Get 100 woots on your songs', '🔥', $stats['woots'], 100],
            ['grab-5', 'Worth saving', 'Get 5 grabs on your songs', '💾', $stats['grabs'], 5],
            ['chatty', 'Chatterbox', 'Write 100 chat messages', '💬', $stats['messages'], 100],
            ['friend-1', 'Not alone', 'Make your first friend', '🤝', $stats['friends'], 1],
            ['friend-10', 'Social butterfly', 'Have 10 friends', '🦋', $stats['friends'], 10],
            ['invite-1', 'Talent scout', 'Invite a friend who registers', '📣', $stats['referrals'], 1],
            ['invite-10', 'Ambassador', 'Invite 10 friends', '🌟', $stats['referrals'], 10],
            ['host', 'Host with the most', 'Create a room', '🏠', $rooms, 1],
            ['curator', 'Curator', 'Make 3 playlists of your own', '📚', $playlists, 3],
            ['level-5', 'Level 5', 'Reach level 5', '⭐', $stats['level'], 5],
            ['level-10', 'Level 10', 'Reach level 10', '💎', $stats['level'], 10],
        ];

        return array_map(fn ($achievement) => [
            'key' => $achievement[0],
            'title' => $achievement[1],
            'text' => $achievement[2],
            'icon' => $achievement[3],
            'have' => min($achievement[4], $achievement[5]),
            'goal' => $achievement[5],
            'done' => $achievement[4] >= $achievement[5],
        ], $list);
    }
}
