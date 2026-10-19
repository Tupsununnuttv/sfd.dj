<?php

namespace App\Models;

use App\Support\RoomPresence;
use App\Support\Season;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
        'go_live' => 'Go live: put a live stream on the big screen',
    ];

    /** Roles every room starts with. rank: lower = more power. */
    public const DEFAULT_ROLES = [
        ['name' => 'Co-Host', 'color' => '#f97316', 'rank' => 1, 'permissions' => ['moderate_chat', 'manage_queue', 'skip', 'edit_settings', 'manage_roles', 'moderate_users', 'go_live']],
        ['name' => 'Manager', 'color' => '#eab308', 'rank' => 2, 'permissions' => ['moderate_chat', 'manage_queue', 'skip', 'edit_settings', 'moderate_users']],
        ['name' => 'Bouncer', 'color' => '#22c55e', 'rank' => 3, 'permissions' => ['moderate_chat', 'skip', 'moderate_users']],
        ['name' => 'Resident DJ', 'color' => '#d946ef', 'rank' => 4, 'permissions' => ['skip']],
    ];

    /** How many people can be in the waitlist at once (the one who plays counts). */
    public const MAX_WAITLIST = 67;

    /** A live stream nobody has ended is over after this many hours. */
    public const LIVE_HOURS = 24;

    /** Very short clips and manual skips do not earn playback rewards. */
    public const MIN_REWARD_PLAY_SECONDS = 30;

    public const SONG_XP = 10;

    public const WOOT_XP = 1;

    /** The badges staff can give a room, in the order they are shown. A room can have any of them at once. */
    public const BADGES = ['official', 'verified', 'partnered'];

    public const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'House', 'Techno', 'Drum & Bass', 'Dubstep', 'Lo-fi', 'Jazz', 'Classical', 'Metal', 'Indie', 'Country', 'Reggae', 'Latin', 'K-Pop', 'Mixed'];

    protected $fillable = ['user_id', 'name', 'slug', 'description', 'current_item_id', 'current_started_at', 'badges', 'background', 'genre', 'is_private', 'is_featured', 'custom_background', 'welcome_message', 'rules', 'rule_list', 'custom_css', 'live', 'waitlist_locked', 'waitlist_cycle', 'automod', 'auto_host_bot_id', 'auto_host_playlist_id'];

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

    /** The addresses this room had before its current one (see changeSlug). */
    public function oldSlugs(): HasMany
    {
        return $this->hasMany(RoomSlug::class);
    }

    /** The room that has this address: as its current one, or as one it used to have. */
    public function scopeAtAddress(Builder $query, string $slug): void
    {
        $query->where(fn (Builder $q) => $q->where('slug', $slug)->orWhereIn('id', RoomSlug::where('slug', $slug)->select('room_id')));
    }

    /**
     * The address for a room name: its words joined with dashes ("Late Night Jazz" is late-night-jazz), and -2, -3 ... when another room has it or had it
     * (old addresses stay taken, so a link to somebody's old room never lands in a new one). The room itself may keep or take back its own addresses.
     */
    public static function slugFor(string $name, ?self $room = null): string
    {
        $base = Str::slug($name) ?: 'room';
        $slug = $base;
        $suffix = 2;

        while (
            self::where('slug', $slug)->when($room, fn (Builder $q) => $q->whereKeyNot($room->id))->exists()
            || RoomSlug::where('slug', $slug)->when($room, fn (Builder $q) => $q->where('room_id', '!=', $room->id))->exists()
        ) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }

    /** Move the room to a new address. The one it leaves is remembered, so links to it keep working. */
    public function changeSlug(string $slug): void
    {
        DB::transaction(function () use ($slug) {
            $this->oldSlugs()->where('slug', $slug)->delete(); // taking back an address it had before
            $this->oldSlugs()->firstOrCreate(['slug' => $this->slug]);
            $this->update(['slug' => $slug]);
        });
    }

    protected function casts(): array
    {
        return ['current_item_id' => 'integer', 'auto_host_bot_id' => 'integer', 'auto_host_playlist_id' => 'integer', 'current_started_at' => 'datetime', 'is_private' => 'boolean', 'is_featured' => 'boolean', 'waitlist_locked' => 'boolean', 'waitlist_cycle' => 'boolean', 'automod' => 'array', 'badges' => 'array', 'rule_list' => 'array', 'live' => 'array'];
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
            $this->background === 'custom' && $this->custom_background && $this->season !== $season['id'] => 'custom',
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

    /** Auto Host: the host's bot that plays while nobody else is in the waitlist, and the playlist it plays from. */
    public function autoHostBot(): BelongsTo
    {
        return $this->belongsTo(User::class, 'auto_host_bot_id');
    }

    public function currentItem(): BelongsTo
    {
        return $this->belongsTo(PlaylistItem::class, 'current_item_id');
    }

    public function autoHostPlaylist(): BelongsTo
    {
        return $this->belongsTo(Playlist::class, 'auto_host_playlist_id');
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

    public function canDelete(?User $user): bool
    {
        return $user && ($user->id === $this->user_id || $user->is_staff || $user->hasPermission('rooms.manage'));
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
     * Only a verified natural completion may earn rewards. Stale calls never advance the next song.
     */
    public function advance(bool $requeue = true, bool $completed = false): bool
    {
        $expectedItem = $this->current_item_id;
        $advanced = DB::transaction(function () use ($requeue, $completed, $expectedItem): bool {
            $room = static::query()->lockForUpdate()->findOrFail($this->getKey());
            if ($room->current_item_id !== $expectedItem) {
                return false;
            }

            $present = $room->presentUserIds();
            $played = PlaylistItem::with('user')->where('room_id', $room->id)->whereNull('played_at')->find($expectedItem);

            if ($played) {
                $reward = $completed && $room->playbackHasEnded($played)
                    && $played->duration >= self::MIN_REWARD_PLAY_SECONDS
                    && $room->current_started_at->diffInSeconds(now()) >= self::MIN_REWARD_PLAY_SECONDS;

                $played->update(['played_at' => now()]);
                // Move the played song to the bottom of its playlist; only present DJs cycle back into the queue.
                $played->playlist_song_id && PlaylistSong::find($played->playlist_song_id)?->sendToBottom();
                $requeue && $room->waitlist_cycle && ($present === null || in_array($played->user_id, $present, true)) && $room->requeue($played);

                if ($reward) {
                    $woots = Vote::where('playlist_item_id', $played->id)->where('type', 'woot')->count();
                    $played->user->addXp(self::SONG_XP + $woots * self::WOOT_XP);
                    $played->user->award(5 + intdiv($woots, 2), 'song', $played->title);
                }
            }

            $room->start($room->nextReady($present) ?? $room->autoHostItem());

            return true;
        });
        $this->refresh();

        return $advanced;
    }

    /** Check the server clock, not just an untrusted player "ended" report. */
    public function playbackHasEnded(PlaylistItem $item): bool
    {
        if (! $this->current_started_at || $this->liveNow()) {
            return false;
        }

        // A little tolerance accommodates player timing; unknown-length tracks may end after 30s but earn no rewards.
        $minimum = $item->duration > 0 ? max(1, $item->duration - 3) : self::MIN_REWARD_PLAY_SECONDS;

        return $this->current_started_at->diffInSeconds(now()) >= $minimum;
    }

    /**
     * Who is in the room right now: the people on its live channel, the bots that checked in, and the Auto Host bot.
     * null when that cannot be known (the live server does not answer): then nobody is taken out of the line.
     */
    public function presentUserIds(): ?array
    {
        $people = RoomPresence::idsIn($this);

        if ($people === null) {
            return null;
        }

        $bots = RoomBotPresence::where('room_id', $this->id)->where('last_seen_at', '>=', now()->subSeconds(RoomBotPresence::TTL_SECONDS))->pluck('user_id')->all();

        return array_values(array_unique([...$people, ...$bots, ...array_filter([$this->auto_host_bot_id])]));
    }

    /**
     * Take everybody who is no longer in the room out of the waitlist, and a DJ who left out of the booth (their song is skipped, with cycling too).
     * For a tab that was closed, a computer that went to sleep or a lost connection, where the page could not say goodbye itself. Returns who was taken out.
     *
     * @return Collection<int, User>
     */
    public function dropAbsent(): Collection
    {
        $present = $this->presentUserIds();

        if ($present === null) {
            return collect();
        }

        $gone = $this->items()->with('user:id,name')->whereNotIn('user_id', $present)->get();

        if ($gone->isEmpty()) {
            return collect();
        }

        $this->takeOutItems($gone);

        return $gone->pluck('user')->unique('id')->values();
    }

    /** Take somebody out of the waitlist and the booth: they left, or were kicked or banned. True when they had a song in the line. */
    public function takeOut(User $user): bool
    {
        $theirs = $this->items()->where('user_id', $user->id)->get(['id']);
        $theirs->isNotEmpty() && $this->takeOutItems($theirs);

        return $theirs->isNotEmpty();
    }

    /**
     * The waiting songs among these are deleted; if one of them is playing it is skipped (not to the back of the line, even with cycling).
     *
     * @param  Collection<int, PlaylistItem>  $items
     */
    private function takeOutItems(Collection $items): void
    {
        PlaylistItem::whereIn('id', $items->pluck('id'))->where('id', '!=', $this->current_item_id ?? 0)->delete();
        $items->contains('id', $this->current_item_id) && $this->advance(false);
    }

    /** Auto Host: when nobody is waiting, the host's bot plays the top song of the chosen playlist (the song then goes to the bottom of it, so the list goes round). */
    private function autoHostItem(): ?PlaylistItem
    {
        $song = $this->auto_host_bot_id ? $this->autoHostPlaylist?->songs()->first() : null;

        return $song ? $this->items()->create(['user_id' => $this->auto_host_bot_id, 'position' => ($this->items()->max('position') ?? 0) + 1] + $this->fromSong($song)) : null;
    }

    /** Auto Host was just switched on: if the booth is empty, the bot starts at once. */
    public function startAutoHostIfIdle(): void
    {
        if (! $this->current_item_id && $this->items()->doesntExist()) {
            $this->start($this->autoHostItem());
        }
    }

    private function fromSong(PlaylistSong $song): array
    {
        return ['youtube_id' => $song->youtube_id, 'title' => $song->title, 'thumbnail' => $song->thumbnail, 'duration' => $song->duration, 'playlist_song_id' => $song->id];
    }

    /** Cycling: a DJ who has just played goes to the back of the line. Their next turn is the next song of their active playlist; a song that did not come from a playlist plays again. */
    private function requeue(PlaylistItem $played): void
    {
        if ($played->user_id === $this->auto_host_bot_id) {
            return; // self DJs only play when the human queue is empty
        }
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

    /**
     * The next DJ in line plays the top song of their active playlist as it is now, not the one it was when they joined.
     * Somebody who is no longer in the room (`$present`, when known) is taken out of the line instead.
     */
    private function nextReady(?array $present = null): ?PlaylistItem
    {
        while ($item = $this->items()->first()) {
            if ($present !== null && ! in_array($item->user_id, $present, true)) {
                $item->delete();

                continue;
            }

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

        if ($this->live) {
            if ($this->liveNow()) {
                return; // a live stream is on: the song that was playing waits for it
            }
            $this->endLive(); // nobody ended it in time
        }

        for ($i = 0; $i < 50 && $this->current_item_id; $i++) {
            $item = PlaylistItem::find($this->current_item_id);

            if ($item && $item->duration > 0 && $this->current_started_at && $this->current_started_at->copy()->addSeconds($item->duration + 3)->isFuture()) {
                return;
            }
            if ($item && $item->duration <= 0) {
                return; // length unknown: only a player can say it ended
            }

            $this->advance(completed: true);
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

    /** The live stream that is on the big screen now, as it is kept (kind, ref, url, thumbnail, title, user_id, started_at), or null. One that has run for too long is not on any more. */
    public function liveNow(): ?array
    {
        $live = $this->live;

        return $live && Carbon::parse($live['started_at'])->addHours(self::LIVE_HOURS)->isFuture() ? $live : null;
    }

    /**
     * Put a live stream (see App\Support\LiveStream::parse) on the big screen, or change which one it is. The DJs wait meanwhile: the clock of the song that was
     * playing stops (see endLive). Switching to another stream keeps the time it started.
     */
    public function goLive(User $by, array $stream, string $title): void
    {
        $this->liveNow() || $this->endLive(); // one nobody ended in time is over first

        $this->update(['live' => [
            'kind' => $stream['kind'], 'ref' => $stream['ref'], 'url' => $stream['url'], 'thumbnail' => $stream['thumbnail'],
            'title' => $title !== '' ? $title : $this->name, 'user_id' => $by->id,
            'started_at' => $this->live['started_at'] ?? now()->toIso8601String(),
        ]]);
    }

    /** The stream is over and the DJs go on. The song that was playing continues where it stopped, and one that began meanwhile starts from the beginning. */
    public function endLive(): void
    {
        if (! $this->live) {
            return;
        }

        if ($this->current_started_at) {
            $stopped = Carbon::parse($this->live['started_at'])->max($this->current_started_at);
            $this->current_started_at = $this->current_started_at->copy()->addSeconds($stopped->diffInSeconds(now(), true));
        }

        $this->live = null;
        $this->save();
    }

    /** The live stream as the pages get it: what it is, and who is streaming (shown at the booth and in the top bar). */
    public function liveState(): ?array
    {
        $live = $this->liveNow();

        if (! $live) {
            return null;
        }

        $by = User::find($live['user_id']);

        return Arr::except($live, ['user_id']) + [
            'by' => $by ? ['id' => $by->id, 'name' => $by->name, 'avatar' => $by->avatar, 'character' => $by->character, 'cosmetics' => $by->cosmetics, 'role' => $by->primary_role, 'badges' => $by->badges, 'level' => $by->level] : null,
        ];
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
        $models = $this->items()->with('user:id,name,avatar,character,cosmetics,roles,awards,xp,is_bot,plan,plan_until')->get();
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
            'live' => $this->liveState(),
        ];
    }
}
