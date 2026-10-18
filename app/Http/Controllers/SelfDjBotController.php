<?php

namespace App\Http\Controllers;

use App\Models\Playlist;
use App\Models\Room;
use App\Models\SelfDjBot;
use App\Models\User;
use App\Services\SelfDjPlayback;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SelfDjBotController extends Controller
{
    public const MAX_BOTS = 5;

    public function index(Request $request): Response
    {
        $me = $request->user();
        abort_if($me->is_bot, 403);
        $bots = SelfDjBot::visibleTo($me)->with(['bot', 'room.currentItem', 'playlist' => fn ($q) => $q->withCount('songs')])->latest()->get();

        return Inertia::render('Selfbots', [
            'bots' => $bots->map(function (SelfDjBot $config) {
                $room = $config->room;
                $enabled = $config->enabled();
                $playing = $enabled && $room->currentItem?->user_id === $config->bot_id;
                $status = ! $config->playlist || ! $config->playlist->songs_count ? 'needs_playlist'
                    : (! $enabled ? 'paused' : ($room->liveNow() ? 'live_stream' : ($playing ? 'playing' : 'standby')));

                return [
                    'id' => $config->id, 'name' => $config->bot->name,
                    'room' => $room->only('id', 'name', 'slug'),
                    'playlist' => $config->playlist?->only('id', 'name', 'songs_count'),
                    'enabled' => $enabled, 'status' => $status,
                    'track' => $playing && ! $room->liveNow() ? $room->currentItem?->title : null,
                ];
            }),
            'rooms' => Room::query()->when(! $me->is_staff, fn ($q) => $q->where('user_id', $me->id))->orderBy('name')->get(['id', 'name', 'slug']),
            'playlists' => $me->playlists()->withCount('songs')->orderBy('name')->get(['id', 'name'])->map->only('id', 'name', 'songs_count'),
            'selectedRoom' => $request->string('room')->toString(),
            'limit' => self::MAX_BOTS,
            'ownedCount' => $me->bots()->count(),
        ]);
    }

    public function store(Request $request, SelfDjPlayback $playback): RedirectResponse
    {
        abort_if($request->user()->is_bot, 403);
        $data = $this->validateInput($request);
        DB::transaction(function () use ($request, $data, $playback) {
            $me = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            if ($me->bots()->count() >= self::MAX_BOTS) {
                throw ValidationException::withMessages(['name' => 'You can have up to '.self::MAX_BOTS.' bots. Edit an existing bot or remove one first.']);
            }
            $room = $this->room($me, $data['room']);
            $this->availableRoom($room);
            $playlist = $this->playlist($me, $data['playlist_id']);
            // users.username is VARCHAR(20); the dj_ prefix is part of that limit.
            $username = 'dj_'.Str::lower(Str::random(17));
            $bot = new User(['name' => $data['name'], 'username' => $username, 'email' => $username.'@bots.invalid', 'password' => Str::random(48)]);
            $bot->forceFill(['is_bot' => true, 'bot_owner_id' => $me->id, 'character' => 'char:robo', 'email_verified_at' => now()])->save();
            SelfDjBot::create(['user_id' => $me->id, 'bot_id' => $bot->id, 'room_id' => $room->id, 'playlist_id' => $playlist->id]);
            if ($data['enabled']) {
                $playback->configure($room, $bot, $playlist);
            }
        });

        return back();
    }

    public function update(Request $request, int $selfbot, SelfDjPlayback $playback): RedirectResponse
    {
        $data = $this->validateInput($request);
        DB::transaction(function () use ($request, $selfbot, $data, $playback) {
            $config = SelfDjBot::visibleTo($request->user())->lockForUpdate()->findOrFail($selfbot);
            $room = $this->room($request->user(), $data['room']);
            $this->availableRoom($room, $config);
            $playlist = $this->playlist($request->user(), $data['playlist_id'], $config);
            if ($data['enabled'] && $room->bans()->where('user_id', $config->bot_id)->exists()) {
                throw ValidationException::withMessages(['room' => 'This bot is banned from the room. Lift the ban before enabling it.']);
            }
            if ($config->room_id !== $room->id && $config->room->auto_host_bot_id === $config->bot_id) {
                $playback->configure($config->room, null, null);
            }
            $config->bot->update(['name' => $data['name']]);
            $config->update(['room_id' => $room->id, 'playlist_id' => $playlist->id]);
            if ($data['enabled']) {
                $playback->configure($room, $config->bot, $playlist);
            } elseif ($room->auto_host_bot_id === $config->bot_id) {
                $playback->configure($room, null, null);
            }
        });

        return back();
    }

    public function toggle(Request $request, int $selfbot, SelfDjPlayback $playback): RedirectResponse
    {
        $data = $request->validate(['enabled' => ['required', 'boolean']]);
        DB::transaction(function () use ($request, $selfbot, $data, $playback) {
            $config = SelfDjBot::visibleTo($request->user())->lockForUpdate()->findOrFail($selfbot);
            $room = $this->room($request->user(), $config->room->slug);
            if ($data['enabled']) {
                $playlist = $this->playlist($request->user(), $config->playlist_id ?? 0, $config);
                if ($room->bans()->where('user_id', $config->bot_id)->exists()) {
                    throw ValidationException::withMessages(['enabled' => 'This bot is banned from the room. Lift the ban before enabling it.']);
                }
                $playback->configure($room, $config->bot, $playlist);
            } elseif ($room->auto_host_bot_id === $config->bot_id) {
                $playback->configure($room, null, null);
            }
        });

        return back();
    }

    public function destroy(Request $request, int $selfbot, SelfDjPlayback $playback): RedirectResponse
    {
        DB::transaction(function () use ($request, $selfbot, $playback) {
            $config = SelfDjBot::visibleTo($request->user())->lockForUpdate()->findOrFail($selfbot);
            if ($config->room->auto_host_bot_id === $config->bot_id) {
                $playback->configure($config->room, null, null);
            }
            $config->delete();
            if ($config->managed_account && ! SelfDjBot::where('bot_id', $config->bot_id)->exists() && ! Room::where('auto_host_bot_id', $config->bot_id)->exists()) {
                $config->bot->tokens()->delete();
                $config->bot->delete();
            }
        });

        return back();
    }

    private function validateInput(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:30'],
            'room' => ['required', 'string', 'max:255'],
            'playlist_id' => ['required', 'integer'], 'enabled' => ['required', 'boolean'],
        ]);
    }

    private function room(User $me, string $name): Room
    {
        $query = Room::query()->when(! $me->is_staff, fn ($q) => $q->where('user_id', $me->id));
        $room = (clone $query)->where('slug', $name)->lockForUpdate()->first();
        if (! $room) {
            $matches = $query->where('name', $name)->lockForUpdate()->limit(2)->get();
            if ($matches->count() === 1) {
                $room = $matches->first();
            }
        }

        return $room ?? throw ValidationException::withMessages(['room' => 'Choose a room you own, or enter its exact slug. Site staff can manage any room.']);
    }

    private function availableRoom(Room $room, ?SelfDjBot $config = null): void
    {
        if (SelfDjBot::where('room_id', $room->id)->when($config, fn ($q) => $q->whereKeyNot($config->id))->exists()
            || ($room->auto_host_bot_id && $room->auto_host_bot_id !== $config?->bot_id)) {
            throw ValidationException::withMessages(['room' => 'This room already has a self DJ bot. Edit its configuration instead.']);
        }
    }

    private function playlist(User $me, int $id, ?SelfDjBot $config = null): Playlist
    {
        $playlist = $me->playlists()->find($id);
        if (! $playlist && $config?->playlist_id === $id) {
            $playlist = $config->playlist;
        }
        if (! $playlist || ! $playlist->songs()->exists()) {
            throw ValidationException::withMessages(['playlist_id' => 'Choose one of your playlists with at least one track.']);
        }

        return $playlist;
    }
}
