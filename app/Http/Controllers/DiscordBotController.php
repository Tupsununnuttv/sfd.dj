<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\User;
use App\Support\UserAchievements;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiscordBotController extends Controller
{
    public function member(Request $request, string $discordId): JsonResponse
    {
        $this->authorizeBot($request);

        $user = User::where('discord_id', $discordId)->firstOrFail();
        $summary = UserAchievements::forUser($user);

        return response()->json([
            'user' => [
                'username' => $user->username,
                'name' => $user->name,
                'level' => $summary['stats']['level'],
                'xp' => $summary['stats']['xp'],
            ],
            'achievements' => $summary['achievements'],
        ]);
    }

    public function announcements(Request $request): JsonResponse
    {
        $this->authorizeBot($request);
        $after = $request->query('after');
        $announcements = $after === null
            ? collect()
            : Announcement::where('id', '>', max(0, (int) $after))->orderBy('id')->limit(10)->get(['id', 'message', 'level', 'created_at']);

        return response()->json([
            'latest_id' => (int) (Announcement::max('id') ?? 0),
            'announcements' => $announcements,
        ]);
    }

    private function authorizeBot(Request $request): void
    {
        $expected = (string) config('services.discord.bot_token');
        $provided = (string) $request->header('Authorization');
        abort_unless($expected !== '' && hash_equals('Bot '.$expected, $provided), 401);
    }
}
