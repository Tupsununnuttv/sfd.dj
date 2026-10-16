<?php

namespace App\Models;

use App\Enums\Role;
use App\Events\UserUpdated;
use App\Http\Controllers\AvatarController;
use App\Http\Controllers\MediaController;
use App\Notifications\PasswordChangedNotification;
use App\Notifications\ResetPasswordNotification;
use App\Notifications\VerifyEmailNotification;
use App\Support\Awards;
use App\Support\Countries;
use App\Support\MailStatus;
use App\Support\Plans;
use App\Support\RoomPresence;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;
use Throwable;

#[Fillable(['name', 'username', 'email', 'password', 'avatar', 'character', 'cosmetics', 'bio', 'favorite_genre', 'country', 'pronouns', 'status'])]
#[Hidden(['discord_id', 'spotify_id', 'spotify_display_name', 'spotify_access_token', 'spotify_refresh_token', 'youtube_channel_id', 'youtube_channel_title', 'youtube_access_token', 'youtube_refresh_token', 'password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes', 'referral_code', 'referred_by', 'coins', 'daily_coins_on', 'stripe_customer_id', 'stripe_subscription_id'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /** The highest level, and the XP at which it starts (20 * (level - 1)^2: the same curve the pages use). */
    public const MAX_LEVEL = 100;

    public const XP_FOR_MAX_LEVEL = 196020;

    /** The roles that stand at the top of the levels: the Owner, the Developers and the Admins are at level 100 from the start. */
    private const MAXED_ROLES = ['owner', 'developer', 'admin'];

    /** SFD Coins: what a new account starts with, what the daily reward is and what a friend who joins through your link is worth. */
    public const START_COINS = 100;

    public const DAILY_COINS = 25;

    public const REFERRAL_COINS = 50;

    /** How somebody shows themselves: around, busy, away, or offline (they look offline to everybody but can use the site). */
    public const STATUSES = ['online', 'busy', 'away', 'offline'];

    protected $appends = ['primary_role', 'badges', 'flag', 'level', 'is_staff', 'can_moderate', 'two_factor_enabled', 'site_permissions'];

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            do {
                $code = Str::upper(Str::random(8));
            } while (static::where('referral_code', $code)->exists());

            $user->referral_code ??= $code;
            $user->character ??= str_starts_with((string) $user->avatar, 'char:')
                ? $user->avatar
                : (AvatarController::starterCharacter() ?? 'char:foxy');
        });

        static::deleting(function (User $user) { // the account goes, its photo and the voice messages it sent or got too; a group it owned goes to somebody else
            $user->clearAvatarImage();
            $user->whisperGroups()->get()->each->release($user);
            Whisper::forgetAudioOf($user);
        });

        // an avatar that needs a role goes when the role does
        static::saving(function (User $user) {
            if ($user->hasMaxedRole() && (int) $user->xp < self::XP_FOR_MAX_LEVEL) {
                $user->xp = self::XP_FOR_MAX_LEVEL;
            }

            if ($user->isDirty('avatar') && str_starts_with((string) $user->avatar, 'char:') && ! $user->isDirty('character')) {
                $user->character = $user->avatar;
            }

            if ($user->isDirty('roles') && ($need = AvatarController::roleNeeded((string) $user->character)) && ! AvatarController::holds($user, $need)) {
                $user->character = AvatarController::starterCharacter() ?? 'char:foxy';
            }

            if ($user->isDirty('character') && ! str_starts_with((string) $user->avatar, 'img:')) {
                $user->avatar = $user->character;
            }
        });
    }

    /** One saved preference by dotted path (for example "privacy.whispers"), or the default when it was never set. */
    public function pref(string $path, mixed $default = null): mixed
    {
        return data_get($this->preferences, $path, $default);
    }

    /** Bot accounts this person made. */
    public function bots(): HasMany
    {
        return $this->hasMany(self::class, 'bot_owner_id');
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }

    public function playlistItems(): HasMany
    {
        return $this->hasMany(PlaylistItem::class);
    }

    public function playlists(): HasMany
    {
        return $this->hasMany(Playlist::class);
    }

    /** Delete the uploaded profile photo, if the avatar is one (stored as "img:<file>"). */
    public function clearAvatarImage(): void
    {
        if (str_starts_with((string) $this->avatar, 'img:')) {
            MediaController::disk()->delete('avatars/'.substr($this->avatar, 4));
        }
    }

    /** What became of the last "confirm your email" message: sent, not-set-up or failed (see sendEmailVerificationNotification). Not stored. */
    public string $verificationMail = '';

    /**
     * Send the "confirm your email" message. It never throws: a mail server that is down must not break signing up or the Send button.
     * 'sent' = handed to the mail server, 'not-set-up' = this site cannot send mail yet (the message only lands in storage/logs/laravel.log), 'failed' = the mail server said no.
     */
    public function sendEmailVerificationNotification(): string
    {
        try {
            $this->notify(new VerifyEmailNotification);
        } catch (Throwable $e) {
            report($e);

            return $this->verificationMail = 'failed';
        }

        return $this->verificationMail = MailStatus::configured() ? 'sent' : 'not-set-up';
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    /** Tell them their password was changed (`$ip` is where from). It never throws: the password is changed already, a mail server that is down must not turn that into an error page. */
    public function sendPasswordChangedNotification(string $ip): void
    {
        try {
            $this->notify(new PasswordChangedNotification($ip));
        } catch (Throwable $e) {
            report($e);
        }
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(self::class, 'referred_by');
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(self::class, 'referred_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(UserItem::class);
    }

    public function coinHistory(): HasMany
    {
        return $this->hasMany(CoinTransaction::class);
    }

    /** ponytail: XP is bumped in place, no ledger table; add one if you need XP history. Every new level pays coins (see coinsForLevel). */
    /** The paid plan someone has now (bronze, silver, gold, plus, pro or premium: App\Support\Plans), or null. A plan without an end date was given for good. */
    public function activePlan(): ?string
    {
        return isset(Plans::TIERS[$this->plan]) && (! $this->plan_until || $this->plan_until->isFuture()) ? $this->plan : null;
    }

    /** How much someone may have: playlists, songs in each, emojis in the rooms they host. More with a plan. */
    public function limits(): array
    {
        return array_intersect_key(Plans::TIERS[$this->activePlan()] ?? Plans::FREE, array_flip(['playlists', 'songs', 'emojis']));
    }

    public function addXp(int $amount): void
    {
        $amount = (int) round($amount * (Plans::TIERS[$this->activePlan()]['xp'] ?? 1)); // a plan gives more XP for everything
        $before = $this->level;
        $this->increment('xp', $amount);

        for ($level = $before + 1; $level <= $this->level; $level++) {
            $this->award(self::coinsForLevel($level), 'level', "Level {$level}");
        }
    }

    /** What reaching a level pays in SFD Coins: 10 for each level you are on (level 2 pays 20, level 10 pays 100). */
    public static function coinsForLevel(int $level): int
    {
        return 10 * $level;
    }

    /** Give SFD Coins and write it down. */
    public function award(int $coins, string $reason, ?string $note = null): void
    {
        if ($coins <= 0) {
            return;
        }

        DB::transaction(function () use ($coins, $reason, $note) {
            $this->increment('coins', $coins);
            $this->coinHistory()->create(['amount' => $coins, 'balance' => (int) $this->coins, 'reason' => $reason, 'note' => $note ? Str::limit($note, 120, '') : null]);
        });
    }

    /** Take SFD Coins for something, and write it down. False if there are not enough: the check and the taking are one step, so two clicks can never spend the same coins. */
    public function spend(int $coins, string $reason, ?string $note = null): bool
    {
        return DB::transaction(function () use ($coins, $reason, $note) {
            if (! static::whereKey($this->id)->where('coins', '>=', $coins)->decrement('coins', $coins)) {
                return false;
            }

            $this->refresh();
            $this->coinHistory()->create(['amount' => -$coins, 'balance' => (int) $this->coins, 'reason' => $reason, 'note' => $note ? Str::limit($note, 120, '') : null]);

            return true;
        });
    }

    /** The daily reward: once a day. Returns the coins it paid, 0 if today's was taken already. The day is written first and only the request that wrote it pays. */
    public function claimDaily(): int
    {
        $today = now()->toDateString();
        $won = static::whereKey($this->id)->where(fn ($q) => $q->whereNull('daily_coins_on')->orWhere('daily_coins_on', '<', $today))->update(['daily_coins_on' => $today]);

        if (! $won) {
            return 0;
        }

        $this->award(self::DAILY_COINS, 'daily');

        return self::DAILY_COINS;
    }

    public function role(): Role
    {
        $roles = array_filter(array_map(Role::tryFrom(...), $this->roles ?? []));

        return collect($roles)->sortBy(fn (Role $r) => $r->rank())->first() ?? Role::Member;
    }

    /** The role their subscription gives (Bronze to Premium, named like the plan), or null without one. It is worked out from the plan every time, never stored, so it ends with the plan. */
    public function subscriptionRole(): ?Role
    {
        return Role::tryFrom((string) $this->activePlan());
    }

    /** The role people see on them: the one they were given, and for somebody with none (a plain User) the one their subscription gives. Rights come from role() alone. */
    public function shownRole(): Role
    {
        $role = $this->role();

        return $role === Role::Member ? ($this->subscriptionRole() ?? $role) : $role;
    }

    public function outranks(self $other): bool
    {
        return $this->role()->rank() < $other->role()->rank();
    }

    protected function primaryRole(): Attribute
    {
        return Attribute::get(fn () => $this->roleInfo($this->shownRole()));
    }

    /** The flag they chose, { code, name }, or null. */
    protected function flag(): Attribute
    {
        return Attribute::get(fn () => Countries::flag($this->country));
    }

    /** The status other people see: "offline" for somebody who chose it, or who hides their online status in the privacy settings. */
    public function shownStatus(): string
    {
        return $this->pref('privacy.show_online', true) === false || $this->status === 'offline' ? 'offline' : ($this->status ?: 'online');
    }

    /** What the room knows about somebody who is in it: the same when they come in and whenever it changes (UserUpdated). */
    public function presenceInfo(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'avatar' => $this->avatar,
            'character' => $this->character,
            'cosmetics' => $this->cosmetics,
            'role' => $this->primary_role,
            'badges' => $this->badges,
            'level' => $this->level,
            'flag' => $this->flag,
            'status' => $this->shownStatus(),
        ];
    }

    /** Tell the rooms this person is in that something about them changed, so everybody sees it at once without refreshing. */
    public function announce(): void
    {
        foreach (RoomPresence::roomsOf($this->id) as $roomId) {
            UserUpdated::dispatch($roomId, $this->presenceInfo());
        }
    }

    /** Every role the user holds, and the one their subscription gives, highest first, as small badges shown before their name (max 4). */
    protected function badges(): Attribute
    {
        return Attribute::get(function () {
            $roles = collect($this->roles ?? [])
                ->map(Role::tryFrom(...))->push($this->subscriptionRole())->filter()->sortBy(fn (Role $r) => $r->rank())->take(4)
                ->map(fn (Role $r) => $this->roleInfo($r))->values();

            // the badge equipped in the Avatar shop goes after the role icons
            $key = $this->cosmetics['badge'] ?? '';
            $shop = AvatarController::BADGES[$key] ?? null; // its name; the page draws the badge itself

            $roles = $this->is_bot ? $roles->push(['key' => 'bot', 'label' => 'Bot', 'color' => '#38bdf8', 'icon' => '🤖']) : $roles;

            // the special badges staff gave them (Beta Tester ...), then the one from the shop
            $roles = $roles->concat(array_map(Awards::badge(...), Awards::clean($this->awards)));

            return $shop ? $roles->push(['key' => 'shop:'.$key, 'label' => $shop, 'color' => '#a78bfa', 'icon' => null])->all() : $roles->all();
        });
    }

    private function roleInfo(Role $r): array
    {
        return ['key' => $r->value, 'label' => $r->label(), 'color' => $r->color(), 'icon' => $r->icon()];
    }

    /** XP needed to reach a level. */
    public static function xpFor(int $level): int
    {
        return 20 * ($level - 1) ** 2;
    }

    /** Owner, Developer and Admin: their level is the highest one (the XP is brought up to it whenever they are saved). */
    public function hasMaxedRole(): bool
    {
        return array_intersect(self::MAXED_ROLES, $this->roles ?? []) !== [];
    }

    protected function level(): Attribute
    {
        return Attribute::get(fn () => min(self::MAX_LEVEL, (int) floor(sqrt($this->xp / 20)) + 1));
    }

    protected function isStaff(): Attribute
    {
        return Attribute::get(fn () => $this->hasPermission('admin.access'));
    }

    protected function canModerate(): Attribute
    {
        return Attribute::get(fn () => $this->hasPermission('rooms.moderate'));
    }

    /** Site-wide permission check. The Owner role has everything; other roles follow the permissions matrix. */
    public function hasPermission(string $permission): bool
    {
        return in_array($permission, $this->sitePermissionList(), true);
    }

    private function sitePermissionList(): array
    {
        $roles = $this->roles ?? [];

        if (in_array(Role::Owner->value, $roles, true)) {
            return array_keys(Role::PERMISSIONS);
        }

        $matrix = SitePermission::matrix();

        return array_values(array_unique(array_merge([], ...array_map(fn ($r) => $matrix[$r] ?? [], $roles))));
    }

    protected function sitePermissions(): Attribute
    {
        return Attribute::get(fn () => $this->sitePermissionList());
    }

    public function violations(): HasMany
    {
        return $this->hasMany(Violation::class)->latest();
    }

    /** The whisper groups this person is in (their share of each: `since_id`, `read_id`). */
    public function whisperGroups(): BelongsToMany
    {
        return $this->belongsToMany(WhisperGroup::class, 'whisper_group_user', 'user_id', 'group_id')->withPivot('since_id', 'read_id')->withTimestamps();
    }

    /** Whether `$from` may whisper to this person (or put them in a group): everyone, only friends or nobody is what they chose; staff can always reach people. */
    public function takesWhispersFrom(User $from): bool
    {
        $mode = $this->pref('privacy.whispers', 'everyone');
        $friends = fn () => Friendship::where('status', 'accepted')->where(fn ($q) => $q->where(['user_id' => $from->id, 'friend_id' => $this->id])->orWhere(fn ($w) => $w->where(['user_id' => $this->id, 'friend_id' => $from->id])))->exists();

        return $from->is_staff || ! ($mode === 'nobody' || ($mode === 'friends' && ! $friends()));
    }

    /** Accepted friends as User models. */
    public function friends()
    {
        $ids = Friendship::where('status', 'accepted')
            ->where(fn ($q) => $q->where('user_id', $this->id)->orWhere('friend_id', $this->id))
            ->get()->map(fn (Friendship $f) => $f->user_id === $this->id ? $f->friend_id : $f->user_id);

        return static::whereIn('id', $ids)->orderBy('name')->get();
    }

    protected function twoFactorEnabled(): Attribute
    {
        return Attribute::get(fn () => $this->two_factor_confirmed_at !== null);
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'password' => 'hashed',
            'roles' => 'array',
            'is_bot' => 'boolean',
            'preferences' => 'array',
            'cosmetics' => 'array',
            'awards' => 'array',
            'daily_coins_on' => 'date',
            'two_factor_secret' => 'encrypted',
            'two_factor_recovery_codes' => 'encrypted:array',
            'two_factor_confirmed_at' => 'datetime',
            'spotify_access_token' => 'encrypted',
            'spotify_refresh_token' => 'encrypted',
            'spotify_token_expires_at' => 'datetime',
            'youtube_access_token' => 'encrypted',
            'youtube_refresh_token' => 'encrypted',
            'youtube_token_expires_at' => 'datetime',
            'plan_until' => 'datetime',
            'plan_renews' => 'boolean',
        ];
    }
}
