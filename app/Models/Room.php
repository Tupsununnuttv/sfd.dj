<?php

namespace App\Models;

use App\Support\Season;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Room extends Model
{
    /** What a room role can be allowed to do. The Host (owner) can always do everything. */
    public const PERMISSIONS = [
        'moderate_chat' => 'Clear chat',
        'manage_queue' => 'Remove songs from the waitlist',
        'skip' => 'Skip any song',
        'edit_settings' => 'Edit room settings',
        'manage_roles' => 'Assign room roles',
        'moderate_users' => 'Kick and ban users',
    ];

    /** Roles every room starts with. rank: lower = more power. */
    public const DEFAULT_ROLES = [
        ['name' => 'Co-Host', 'color' => '#f97316', 'rank' => 1, 'permissions' => ['moderate_chat', 'manage_queue', 'skip', 'edit_settings', 'manage_roles', 'moderate_users']],
        ['name' => 'Manager', 'color' => '#eab308', 'rank' => 2, 'permissions' => ['moderate_chat', 'manage_queue', 'skip', 'edit_settings', 'moderate_users']],
        ['name' => 'Bouncer', 'color' => '#22c55e', 'rank' => 3, 'permissions' => ['moderate_chat', 'skip', 'moderate_users']],
        ['name' => 'Resident DJ', 'color' => '#d946ef', 'rank' => 4, 'permissions' => ['skip']],
    ];

    /** How many people can be in the waitlist at once (the one who plays counts). */
    public const MAX_WAITLIST = 67;

    /** The badges staff can give a room, in the order they are shown. A room can have any of them at once. */
    public const BADGES = ['official', 'verified', 'partnered'];

    public const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'House', 'Techno', 'Drum & Bass', 'Dubstep', 'Lo-fi', 'Jazz', 'Classical', 'Metal', 'Indie', 'Country', 'Reggae', 'Latin', 'K-Pop', 'Mixed'];

    protected $fillable = ['user_id', 'name', 'slug', 'description', 'current_item_id', 'current_started_at', 'badges', 'background', 'genre', 'is_private', 'is_featured', 'custom_background', 'welcome_message', 'rules', 'rule_list', 'custom_css', 'waitlist_locked', 'waitlist_cycle', 'automod'];

    protected $hidden = ['legacy_slug'];

    protected static function booted(): void
    {
        static::created(fn (Room $room) => $room->ensureDefaultRoles());
    }

    /** The rules as plain text, one line each ("1. Be kind: no insults"), for what still reads the old single block of text (the bot API). */
    public static function rulesText(array $list): string
    {
        return implode("\n", array_map(fn ($r, $i) => ($i + 1).'. '.$r['title'].($r['text'] !== '' ? ': '.$r['text'] : ''), $list, array_keys($list)));
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected function casts(): array
    {
        return ['current_item_id' => 'integer', 'current_started_at' => 'datetime', 'is_private' => 'boolean', 'is_featured' => 'boolean', 'waitlist_locked' => 'boolean', 'waitlist_cycle' => 'boolean', 'automod' => 'array', 'badges' => 'array', 'rule_list' => 'array'];
    }

    /** Channels that carry a room's live events: the presence channel for people inside, plus a public viewing channel for guests (never for private rooms). */
    public static function channelsFor(int $id): array
    {
        $channels = [new PresenceChannel('room.'.$id)];

        if (! static::whereKey($id)->value('is_private')) {
            $channels[] = new Channel('room-view.'.$id);
        }

        return $channels;
    }

    /**
     * The background the room shows now. In a special season (Halloween, Christmas) that is the season's: the one the host picked for it, the room's own
     * if it already is one of the season's, or else the season's first. A host who switched the season off in the room keeps their own.
     */
    public function shownBackground(): ?string
    {
        $season = Season::current();

        return match (true) {
            ! $season => $this->background,
            $this->season === $season['id'] => $this->season_background ?? $this->background,
            in_array($this->background, $season['backgrounds'], true) => $this->background,
            default => $season['backgrounds'][0],
        };
    }

    /** Put a background on (not saved yet). In a season one of its own backgrounds is for the season only; any other is the room's own from now on and switches the season off here. */
    public function pickBackground(?string $key): void
    {
        $season = Season::current();

        if ($season && in_array($key, $season['backgrounds'], true)) {
            $this->forceFill(['season' => $season['id'], 'season_background' => $key]);
        } else {
            $this->forceFill(['background' => $key] + ($season ? ['season' => $season['id'], 'season_background' => null] : []));
        }
    }

    /** Private rooms are for their host and SFD-DJ.EU staff only. */
    public function canEnter(?User $user): bool
    {
        return ! $this->is_private || ($user && ($user->id === $this->user_id || $user->is_staff));
    }

    public function scopeVisibleTo(Builder $query, ?User $user): void
    {
        if (! $user?->is_staff) {
            $query->where(fn ($q) => $q->where('is_private', false)->when($user, fn ($w) => $w->orWhere('user_id', $user->id)));
        }
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PlaylistItem::class)->whereNull('played_at')->orderBy('position')->orderBy('id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
    }

    public function roles(): HasMany
    {
        return $this->hasMany(RoomRole::class)->orderBy('rank')->orderBy('id');
    }

    public function emojis(): HasMany
    {
        return $this->hasMany(RoomEmoji::class)->orderBy('name');
    }

    public function bans(): HasMany
    {
        return $this->hasMany(RoomBan::class);
    }

    public function mutes(): HasMany
    {
        return $this->hasMany(RoomMute::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(RoomLog::class);
    }

    /** Who may delete lines of the moderation log: the host and SFD-DJ.EU staff, never the moderators whose actions it records. */
    public function clearsLogs(?User $user): bool
    {
        return $user && ($user->id === $this->user_id || $user->is_staff);
    }

    /** Write a line in the moderation log. */
    public function log(User $actor, string $action, ?User $target = null, ?string $details = null): void
    {
        $this->logs()->create(['actor_id' => $actor->id, 'target_id' => $target?->id, 'action' => $action, 'details' => $details ? mb_substr($details, 0, 250) : null]);
    }

    public function isMuted(User $user): bool
    {
        return $this->mutes()->active()->where('user_id', $user->id)->exists();
    }

    public function members(): HasMany
    {
        return $this->hasMany(RoomMember::class);
    }

    public function ensureDefaultRoles(): void
    {
        foreach (self::DEFAULT_ROLES as $role) {
            $this->roles()->firstOrCreate(['name' => $role['name'], 'builtin' => true], $role);
        }
    }

    /** Permission keys this user holds in this room. */
    public function permissionsFor(User $user): array
    {
        $all = array_keys(self::PERMISSIONS);

        if ($user->id === $this->user_id || $user->hasPermission('rooms.manage')) {
            return $all;
        }

        $perms = $user->hasPermission('rooms.moderate') ? ['moderate_chat', 'manage_queue', 'skip', 'moderate_users'] : [];
        $granted = $this->members()->where('user_id', $user->id)->with('role')->first()?->role?->permissions ?? [];

        return array_values(array_unique([...$perms, ...array_intersect($granted, $all)]));
    }

    public function can(User $user, string $permission): bool
    {
        return in_array($permission, $this->permissionsFor($user), true);
    }

    /** Add a song to the queue; starts playing it if nothing is playing. */
    public function enqueue(array $data, int $userId): PlaylistItem
    {
        return DB::transaction(function () use ($data, $userId): PlaylistItem {
            $room = static::query()->lockForUpdate()->findOrFail($this->getKey());
            $existing = $room->items()->where('user_id', $userId)->where('youtube_id', $data['youtube_id'])->first();

            if ($existing) {
                return $existing;
            }

            $item = $room->items()->create($data + [
                'user_id' => $userId,
                'position' => ($room->items()->max('position') ?? 0) + 1,
            ]);

            if (! $room->current_item_id) {
                $room->start($item);
            }

            return $item;
        });
    }

    /**
     * Drop the current song and start the next one (or stop).
     * `$requeue` is false when the DJ is leaving the line or was taken out of it: with cycling they must not go to the back of it.
     */
    public function advance(bool $requeue = true): void
    {
        // ponytail: skipping a song also pays its owner; track skips separately if XP gets farmed
        if ($played = PlaylistItem::with('user')->find($this->current_item_id)) {
            $played->update(['played_at' => now()]);
            // a song that came from somebody's active playlist goes to the bottom of it, so their next turn plays the next song
            $played->playlist_song_id && PlaylistSong::find($played->playlist_song_id)?->sendToBottom();
            $requeue && $this->waitlist_cycle && $this->requeue($played);
            $woots = Vote::where('playlist_item_id', $played->id)->where('type', 'woot')->count();
            $played->user->addXp(10 + $woots); // +1 XP per woot
            // and 5 SFD Coins, and one more for every two woots, but only for a song that was really heard: one that is skipped at once pays nothing
            $heard = $this->current_started_at ? $this->current_started_at->diffInSeconds(now()) : 0;
            $heard >= min(30, $played->duration ?: 30) && $played->user->award(5 + intdiv($woots, 2), 'song', $played->title);
        }
        $this->start($this->nextReady());
    }

    private function fromSong(PlaylistSong $song): array
    {
        return ['youtube_id' => $song->youtube_id, 'title' => $song->title, 'thumbnail' => $song->thumbnail, 'duration' => $song->duration, 'playlist_song_id' => $song->id];
    }

    /** Cycling: a DJ who has just played goes to the back of the line. Their next turn is the next song of their active playlist; a song that did not come from a playlist plays again. */
    private function requeue(PlaylistItem $played): void
    {
        $data = $played->only('user_id', 'youtube_id', 'title', 'thumbnail', 'duration');

        if ($played->playlist_song_id) {
            $song = Playlist::activeFor($played->user)?->songs()->first();

            if (! $song) {
                return; // nothing left to play: they leave the line
            }
            $data = ['user_id' => $played->user_id] + $this->fromSong($song);
        }

        $this->enqueue($data, $played->user_id);
    }

    /** The next DJ in line plays the top song of their active playlist as it is now, not the one it was when they joined. */
    private function nextReady(): ?PlaylistItem
    {
        while ($item = $this->items()->first()) {
            if (! $item->playlist_song_id) {
                return $item;
            }

            if ($song = Playlist::activeFor($item->user)?->songs()->first()) {
                $item->update($this->fromSong($song));

                return $item;
            }
            $item->delete(); // their playlist ran dry or is gone: they drop out of the line
        }

        return null;
    }

    private function removeDuplicateWaitingItems(): void
    {
        DB::transaction(function (): void {
            $room = static::query()->lockForUpdate()->findOrFail($this->getKey());
            $groups = $room->items()->get(['id', 'user_id', 'youtube_id'])
                ->groupBy(fn (PlaylistItem $item) => $item->user_id.':'.$item->youtube_id)
                ->filter(fn ($items) => $items->count() > 1);

            foreach ($groups as $duplicates) {
                $keep = $duplicates->firstWhere('id', $room->current_item_id) ?? $duplicates->first();
                $room->items()->whereIn('id', $duplicates->where('id', '!=', $keep->id)->pluck('id'))->delete();
            }
        });
    }

    /**
     * Songs that have run past their length are over, even if nobody's player reported it (empty room, blocked embed).
     * Called when someone opens the room, so the timeline always starts at 0:00 of the song that is really playing.
     */
    public function syncCurrent(): void
    {
        $this->removeDuplicateWaitingItems();

        for ($i = 0; $i < 50 && $this->current_item_id; $i++) {
            $item = PlaylistItem::find($this->current_item_id);

            if ($item && $item->duration > 0 && $this->current_started_at && $this->current_started_at->copy()->addSeconds($item->duration + 3)->isFuture()) {
                return;
            }
            if ($item && $item->duration <= 0) {
                return; // length unknown: only a player can say it ended
            }

            $this->advance();
        }
    }

    /** Remove a song from the queue; removing the current one skips to the next. */
    public function removeItem(int $id): void
    {
        if ($id === $this->current_item_id) {
            $this->advance(false); // taken out of the line: not to the back of it, even with cycling
        } else {
            PlaylistItem::where('room_id', $this->id)->whereKey($id)->delete();
        }
    }

    private function start(?PlaylistItem $item): void
    {
        $this->update([
            'current_item_id' => $item?->id,
            'current_started_at' => $item ? now() : null,
        ]);
    }

    /** woot / meh / grab totals for the song that is playing. */
    public function votes(): array
    {
        $counts = Vote::where('playlist_item_id', $this->current_item_id)->selectRaw('type, count(*) as n')->groupBy('type')->pluck('n', 'type');

        return ['woot' => (int) ($counts['woot'] ?? 0), 'meh' => (int) ($counts['meh'] ?? 0), 'grab' => (int) ($counts['grab'] ?? 0)];
    }

    /** Who is dancing to the song that is playing: everybody who wooted or grabbed it (and did not meh it). Everybody else stands. */
    public function dancers(): array
    {
        $by = Vote::where('playlist_item_id', $this->current_item_id)->get(['user_id', 'type'])->groupBy('type')->map->pluck('user_id');

        return $by->only(['woot', 'grab'])->flatten()->unique()->diff($by->get('meh', []))->values()->all();
    }

    /** State sent to clients: what plays now, seconds already elapsed, and the queue. */
    public function playback(): array
    {
        $models = $this->items()->with('user:id,name,avatar,character,cosmetics,roles,xp,is_bot,plan,plan_until')->get();
        $items = $models->map(fn (PlaylistItem $i) => [
            'id' => $i->id,
            'user_id' => $i->user_id,
            'youtube_id' => $i->youtube_id,
            'title' => $i->title,
            'thumbnail' => $i->thumbnail,
            'duration' => $i->duration,
            'added_by' => $i->user->name,
        ]);

        $current = $items->firstWhere('id', $this->current_item_id);
        if ($current) {
            $dj = $models->firstWhere('id', $this->current_item_id)->user;
            $current['dj'] = ['id' => $dj->id, 'name' => $dj->name, 'avatar' => $dj->avatar, 'character' => $dj->character, 'cosmetics' => $dj->cosmetics, 'role' => $dj->primary_role, 'badges' => $dj->badges, 'level' => $dj->level];
        }

        return [
            'current' => $current,
            'elapsed' => $current ? max(0, $this->current_started_at->diffInSeconds(now(), true)) : 0,
            'queue' => $items->reject(fn ($i) => $i['id'] === $this->current_item_id)->values(),
            'votes' => $this->votes(),
            'dancers' => $this->dancers(),
            'locked' => $this->waitlist_locked,
            'cycle' => $this->waitlist_cycle,
            'max' => self::MAX_WAITLIST,
        ];
    }
}
