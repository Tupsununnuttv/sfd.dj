<?php

namespace App\Http\Controllers;

use App\Models\PlaylistItem;
use App\Support\UserAchievements;
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
        $label = fn (array $catalog, ?string $key) => $key && isset($catalog[$key]) ? (is_array($catalog[$key]) ? $catalog[$key]['label'] : $catalog[$key]) : null;
        $worn = $me->cosmetics ?? [];
        $rooms = $me->rooms()->withCount('items')->latest()->get(['id', 'name', 'slug', 'genre', 'is_private', 'badges', 'created_at']);
        $playlists = $me->playlists()->withCount('songs')->orderBy('name')->get(['id', 'name', 'kind']);
        $summary = UserAchievements::forUser($me, $rooms->count(), $playlists->where('kind', 'custom')->count());

        return Inertia::render('MyStuff', [
            'stats' => $summary['stats'],
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
            'achievements' => $summary['achievements'],
        ]);
    }
}
