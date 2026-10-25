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
        $played = $mine()->whereNotNull('played_at')->selectRaw('COUNT(*) AS songs_played, COUNT(DISTINCT room_id) AS rooms_played')->first();
        $received = Vote::where('user_id', '!=', $user->id)->whereIn('type', ['woot', 'grab'])
            ->whereIn('playlist_item_id', $mine()->select('id'))->selectRaw('type, COUNT(*) AS total')->groupBy('type')->pluck('total', 'type');
        $given = Vote::where('user_id', $user->id)->whereIn('type', ['woot', 'grab'])
            ->whereIn('playlist_item_id', PlaylistItem::where('user_id', '!=', $user->id)->select('id'))
            ->selectRaw('type, COUNT(*) AS total')->groupBy('type')->pluck('total', 'type');
        $stats = [
            'xp' => $user->xp ?? 0,
            'level' => $user->level,
            'songs_played' => (int) $played->songs_played,
            'rooms_played' => (int) $played->rooms_played,
            'woots' => (int) ($received['woot'] ?? 0),
            'grabs' => (int) ($received['grab'] ?? 0),
            'woots_given' => (int) ($given['woot'] ?? 0),
            'grabs_given' => (int) ($given['grab'] ?? 0),
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
            ['dj-25', 'Finding the groove', 'Have 25 songs played', '🎶', $stats['songs_played'], 25],
            ['dj-50', 'Booth regular', 'Have 50 songs played', '🎛️', $stats['songs_played'], 50],
            ['dj-100', 'Resident legend', 'Have 100 songs played', '🏆', $stats['songs_played'], 100],
            ['dj-250', 'Marathon DJ', 'Have 250 songs played', '💿', $stats['songs_played'], 250],
            ['dj-1000', 'Deck master', 'Have 1,000 songs played', '👑', $stats['songs_played'], 1000],
            ['explorer-3', 'Room explorer', 'Have your songs played in 3 different rooms', '🧭', $stats['rooms_played'], 3],
            ['explorer-10', 'World tour', 'Have your songs played in 10 different rooms', '🌍', $stats['rooms_played'], 10],
            ['woot-1', 'First applause', 'Get your first woot on a song', '👏', $stats['woots'], 1],
            ['woot-10', 'Crowd pleaser', 'Get 10 woots on your songs', '👍', $stats['woots'], 10],
            ['woot-100', 'Fan favourite', 'Get 100 woots on your songs', '🔥', $stats['woots'], 100],
            ['woot-500', 'Crowd magnet', 'Get 500 woots on your songs', '🧲', $stats['woots'], 500],
            ['grab-1', 'A keeper', 'Get your first grab on a song', '❤️', $stats['grabs'], 1],
            ['grab-5', 'Worth saving', 'Get 5 grabs on your songs', '💾', $stats['grabs'], 5],
            ['grab-25', 'On repeat', 'Get 25 grabs on your songs', '🔁', $stats['grabs'], 25],
            ['woot-given-1', 'First cheer', 'Give a woot to another DJ', '🙌', $stats['woots_given'], 1],
            ['woot-given-50', 'Hype crew', 'Give 50 woots to other DJs', '📢', $stats['woots_given'], 50],
            ['woot-given-250', 'Community champion', 'Give 250 woots to other DJs', '💜', $stats['woots_given'], 250],
            ['grab-given-1', 'First discovery', 'Grab a song into your playlist', '🔎', $stats['grabs_given'], 1],
            ['grab-given-25', 'Treasure hunter', 'Grab 25 songs into your playlists', '💎', $stats['grabs_given'], 25],
            ['chat-1', 'Say hello', 'Write your first room chat message', '👋', $stats['messages'], 1],
            ['chatty', 'Chatterbox', 'Write 100 chat messages', '💬', $stats['messages'], 100],
            ['chat-1000', 'Part of the conversation', 'Write 1,000 room chat messages', '🗨️', $stats['messages'], 1000],
            ['friend-1', 'Not alone', 'Make your first friend', '🤝', $stats['friends'], 1],
            ['friend-10', 'Social butterfly', 'Have 10 friends', '🦋', $stats['friends'], 10],
            ['invite-1', 'Talent scout', 'Invite a friend who registers', '📣', $stats['referrals'], 1],
            ['invite-10', 'Ambassador', 'Invite 10 friends', '🌟', $stats['referrals'], 10],
            ['host', 'Host with the most', 'Create a room', '🏠', $rooms, 1],
            ['curator-1', 'My first mix', 'Create your first custom playlist', '🎼', $playlists, 1],
            ['curator', 'Curator', 'Make 3 playlists of your own', '📚', $playlists, 3],
            ['curator-10', 'Music librarian', 'Create 10 custom playlists', '🗂️', $playlists, 10],
            ['level-5', 'Level 5', 'Reach level 5', '⭐', $stats['level'], 5],
            ['level-10', 'Level 10', 'Reach level 10', '💎', $stats['level'], 10],
            ['level-25', 'Rising star', 'Reach level 25', '🌠', $stats['level'], 25],
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
