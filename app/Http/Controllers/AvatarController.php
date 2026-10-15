<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * The Avatar shop. Things cost SFD Coins (priceOf) and open up at a level (UNLOCK): you earn coins by playing songs, getting woots and grabs, levelling up and taking the daily
 * reward (User::award), and you buy what you can afford at your level. What you buy is yours for good (UserItem). What costs nothing (level 1) is free for everybody,
 * and SFD-DJ.EU staff can wear everything.
 * Avatars are characters (whole people); the plain emoji and the animated avatars that used to be here are gone from the shop. Somebody who picked one of them before
 * keeps seeing it (the page still draws it) but nobody can pick one now. Badges, accessories, frames and effects are drawn as pictures of their own.
 * ponytail: prices follow the level that unlocks an item (priceOf), so there is no price list to keep; give an item its own price there if one should ever differ.
 */
class AvatarController extends Controller
{
    /** The animated avatars (resources/js/lib/animatedAvatars.tsx), stored as "anim:<key>" in users.avatar. They are not in the shop any more: only people who already wear one still see it. */
    public const ANIMATED = ['spin' => 'Spin', 'ghost' => 'Ghost beat', 'ember' => 'Ember', 'robo' => 'Robo DJ', 'neoncat' => 'Neon cat', 'fang' => 'Fang'];

    /**
     * Characters are whole people, drawn in three states in public/Avatars/<State>/<name>.<type>: Standing (before you press Woot or Grab),
     * Dancing (after) and DJing (on the stage). They are stored as "char:<name>" in users.avatar, so a name is 2 to 11 lower-case letters or digits.
     * Every picture in Standing is a character you can wear: drop a new one in the folders and the shop shows it. scripts/make-characters.mjs draws the built-in ones.
     */
    public const CHARACTER_TYPES = ['svg' => 'image/svg+xml', 'webp' => 'image/webp', 'gif' => 'image/gif', 'png' => 'image/png'];

    /**
     * Characters for people who hold a site role: the role named here or any role above it (App\Enums\Role is in rank order). Only they see them in the
     * shop and only they can wear them; everybody sees them in a room. A character that is not listed here is for everybody.
     */
    public const ROLE_ONLY = [
        'char:ice' => 'brand_ambassador', 'char:icemini' => 'brand_ambassador', 'char:azure' => 'brand_ambassador', 'char:azuremini' => 'brand_ambassador',
        'char:sun' => 'brand_ambassador', 'char:sunmini' => 'brand_ambassador', 'char:nebula' => 'brand_ambassador', 'char:nebulamini' => 'brand_ambassador',
        'char:fedora' => 'brand_ambassador', 'char:blaze' => 'brand_ambassador', 'char:echo' => 'brand_ambassador', 'char:blazeref' => 'brand_ambassador', 'char:echoref' => 'brand_ambassador',
        'char:pandabear' => 'brand_ambassador',
        'char:zoos02' => 'owner', 'char:rift' => 'owner', 'char:skully' => 'owner', 'char:fox' => 'owner',
    ];

    /** Shop names that are not just the file name with a capital letter. */
    private const CHARACTER_LABELS = ['icemini' => 'Ice Mini', 'azuremini' => 'Azure Mini', 'sunmini' => 'Sun Mini', 'nebulamini' => 'Nebula Mini', 'blazeref' => 'Blaze Ref', 'echoref' => 'Echo Ref', 'zoos02' => 'Zoo S02', 'pandabear' => 'Panda Bear', 'emberdragon' => 'Ember Dragon', 'frostdragon' => 'Frost Dragon', 'kikomochi' => 'Kiko & Mochi', 'wilmer' => 'Wilmer'];

    /** Where to look for a state's picture, in order: a character with no DJing picture dances on the stage, and one with no Dancing picture just stands. */
    private const CHARACTER_FOLDERS = ['standing' => ['Standing'], 'dancing' => ['Dancing', 'Standing'], 'djing' => ['DJing', 'Dancing', 'Standing']];

    /**
     * Cosmetic slots: badge, accessory, frame and effect. Each is a key and a name; the page draws them as small pictures of its own (resources/js/lib/cosmetics.tsx),
     * so keep the keys of both in step (a test checks that). Everything that was here before (emoji badges and accessories, plain rings and glows) is gone.
     */
    public const BADGES = [
        'rookie' => 'Rookie', 'selector' => 'Selector', 'digger' => 'Crate Digger', 'bassline' => 'Bassline',
        'streak' => 'Hot Streak', 'nightowl' => 'Night Owl', 'voltage' => 'Voltage',
        'goldenear' => 'Golden Ear', 'diamond' => 'Diamond Cut', 'spotlight' => 'Spotlight', 'platinum' => 'Platinum Disc', 'laureate' => 'Laureate',
        'royal' => 'Royal', 'cosmic' => 'Cosmic', 'dragonseal' => 'Dragon Seal', 'legend' => 'Legend',
    ];

    public const ACCESSORIES = [
        'headphones' => 'DJ Headphones', 'shades' => 'Aviators', 'cap' => 'Snapback', 'beanie' => 'Beanie',
        'catears' => 'Cat Ears', 'foxears' => 'Fox Ears', 'flowers' => 'Flower Crown', 'halo' => 'Halo',
        'visor' => 'Cyber Visor', 'laurel' => 'Laurel Wreath', 'horns' => 'Devil Horns', 'tophat' => 'Top Hat', 'crown' => 'Royal Crown',
        'wings' => 'Angel Wings', 'dragon' => 'Dragon Horns', 'phoenix' => 'Phoenix Crest',
    ];

    public const FRAMES = [
        'bronze' => 'Bronze', 'silver' => 'Silver', 'gold' => 'Gold', 'fireflies' => 'Fireflies',
        'neon' => 'Neon Pulse', 'comic' => 'Comic Pop', 'carbon' => 'Carbon', 'emerald' => 'Emerald', 'web' => 'Spider Web',
        'vinyl' => 'Vinyl', 'candles' => 'Candlelight', 'equalizer' => 'Equalizer', 'skulls' => 'Skull Ring', 'thorns' => 'Rose Thorns', 'lanterns' => 'Lanterns', 'frost' => 'Frostbite',
        'crystals' => 'Crystal Grove', 'hellfire' => 'Hellfire', 'portal' => 'Rift Portal', 'aurora' => 'Aurora', 'prism' => 'Prism',
    ];

    public const EFFECTS = [
        'glow' => 'Soft Glow', 'waves' => 'Sound Waves',
        'sparkles' => 'Sparkles', 'notes' => 'Music Notes', 'hearts' => 'Hearts',
        'petals' => 'Sakura', 'snow' => 'Snowfall', 'flames' => 'Flames', 'lightning' => 'Thunder',
        'toxic' => 'Toxic Haze', 'cosmic' => 'Cosmic Dust', 'void' => 'Void',
    ];

    /** The level that unlocks an item. Everything not listed here is free from level 1. */
    public const UNLOCK = [
        'avatar' => ['char:neko' => 2, 'char:bun' => 3, 'char:wilmer' => 4, 'char:panda' => 5, 'char:milky' => 6, 'char:pip' => 7, 'char:wolfie' => 8, 'char:robo' => 10, 'char:spooky' => 14, 'char:kikomochi' => 16, 'char:boomer' => 20, 'char:emberdragon' => 30, 'char:frostdragon' => 35],
        'badge' => ['digger' => 2, 'bassline' => 3, 'streak' => 4, 'nightowl' => 6, 'voltage' => 8, 'goldenear' => 10, 'diamond' => 13, 'spotlight' => 16, 'platinum' => 20, 'laureate' => 24, 'royal' => 28, 'cosmic' => 34, 'dragonseal' => 42, 'legend' => 55],
        'accessory' => ['cap' => 2, 'beanie' => 3, 'catears' => 4, 'foxears' => 5, 'flowers' => 7, 'halo' => 9, 'visor' => 10, 'laurel' => 12, 'horns' => 15, 'tophat' => 18, 'crown' => 22, 'wings' => 26, 'dragon' => 32, 'phoenix' => 45],
        'frame' => ['gold' => 2, 'fireflies' => 3, 'neon' => 4, 'comic' => 5, 'carbon' => 6, 'emerald' => 8, 'web' => 9, 'vinyl' => 11, 'candles' => 12, 'equalizer' => 14, 'skulls' => 16, 'thorns' => 18, 'lanterns' => 20, 'frost' => 22, 'crystals' => 25, 'hellfire' => 28, 'portal' => 32, 'aurora' => 38, 'prism' => 50],
        'effect' => ['waves' => 2, 'sparkles' => 4, 'notes' => 6, 'hearts' => 8, 'petals' => 11, 'snow' => 15, 'flames' => 19, 'lightning' => 23, 'toxic' => 27, 'cosmic' => 36, 'void' => 48],
    ];

    private const SLOTS = ['avatar', 'badge', 'accessory', 'frame', 'effect'];

    /** The characters you can wear (name => label): every picture in public/Avatars/Standing. */
    public static function characters(): array
    {
        $found = [];

        foreach (glob(public_path('Avatars/Standing/*')) ?: [] as $file) {
            $name = pathinfo($file, PATHINFO_FILENAME);

            if (isset(self::CHARACTER_TYPES[strtolower(pathinfo($file, PATHINFO_EXTENSION))]) && preg_match('/^[a-z0-9]{2,11}$/', $name)) {
                $found[$name] = self::CHARACTER_LABELS[$name] ?? ucfirst($name);
            }
        }

        return $found;
    }

    /** The characters this person may see and wear: the ones for everybody and, if they hold the role, the ones for a role. */
    public static function charactersFor(?User $user): array
    {
        return array_filter(self::characters(), fn ($label, $name) => ! ($need = self::roleNeeded("char:{$name}")) || ($user && self::holds($user, $need)), ARRAY_FILTER_USE_BOTH);
    }

    /** The characters everybody may start with: the ones that cost nothing and need no role. */
    public static function starterCharacters(): array
    {
        return array_values(array_filter(self::avatarKeys(), fn (string $key) => self::priceOf('avatar', $key) === 0 && ! self::roleNeeded($key)));
    }

    /** A character for somebody new, one of the free ones picked at random. Everybody has a character: there is no plain first-letter avatar any more. */
    public static function starterCharacter(): ?string
    {
        $free = self::starterCharacters();

        return $free === [] ? null : $free[array_rand($free)];
    }

    /** The site role an avatar needs, or null if it needs none. */
    public static function roleNeeded(string $avatar): ?Role
    {
        return isset(self::ROLE_ONLY[$avatar]) ? Role::from(self::ROLE_ONLY[$avatar]) : null;
    }

    /** Does the person hold that role or one above it? (0 is the highest rank.) */
    public static function holds(User $user, Role $need): bool
    {
        return $user->role()->rank() <= $need->rank();
    }

    /** Everything that may be stored as the avatar from the shop: a character. (Photos come from the upload.) */
    private static function avatarKeys(): array
    {
        return array_map(fn ($name) => "char:{$name}", array_keys(self::characters()));
    }

    public static function levelOf(string $slot, string $key): int
    {
        return self::UNLOCK[$slot][$key] ?? 1;
    }

    /** How the price grows from one kind of thing to the next: a character costs more than a badge. */
    private const PRICE_FACTOR = ['avatar' => 1.6, 'badge' => 0.8, 'accessory' => 1.0, 'frame' => 1.0, 'effect' => 1.2];

    /** What earns SFD Coins, for the page to list. */
    public const EARN = [
        ['What', 'Coins'],
        ['You reach a new level', '10 for every level you are on'],
        ['A song of yours is played', '5, and 1 more for every 2 woots'],
        ['Somebody grabs your song', '2'],
        ['The daily reward', '25'],
        ['A friend joins with your link', '50'],
    ];

    /** What an item costs in SFD Coins: nothing at level 1, then more the higher the level that opens it. */
    public static function priceOf(string $slot, string $key): int
    {
        $level = self::levelOf($slot, $key);

        return $level <= 1 ? 0 : (int) (round(12 * $level ** 1.3 * self::PRICE_FACTOR[$slot] / 10) * 10);
    }

    /** The keys of everything that is in the shop for a slot. */
    public static function keysOf(string $slot): array
    {
        return match ($slot) {
            'avatar' => self::avatarKeys(),
            'badge' => array_keys(self::BADGES),
            'accessory' => array_keys(self::ACCESSORIES),
            'frame' => array_keys(self::FRAMES),
            'effect' => array_keys(self::EFFECTS),
            default => [],
        };
    }

    /** The name of an item, for the lines of the coin history. */
    private static function labelOf(string $slot, string $key): string
    {
        return match ($slot) {
            'avatar' => self::characters()[substr($key, 5)] ?? $key,
            'badge' => self::BADGES[$key] ?? $key,
            'accessory' => self::ACCESSORIES[$key] ?? $key,
            'frame' => self::FRAMES[$key] ?? $key,
            default => self::EFFECTS[$key] ?? $key,
        };
    }

    /** What a person has bought: slot => keys. */
    public static function bought(User $user): array
    {
        return $user->items()->get(['slot', 'item'])->groupBy('slot')->map(fn ($rows) => $rows->pluck('item')->all())->all();
    }

    /** Is it theirs? Staff have everything, what costs nothing is free for all, and the rest has to be bought. (`$bought` is `bought()` if you have it already.) */
    public static function owns(?User $user, string $slot, string $key, ?array $bought = null): bool
    {
        if ($user?->is_staff || self::priceOf($slot, $key) === 0) {
            return true;
        }

        return $user !== null && in_array($key, ($bought ?? self::bought($user))[$slot] ?? [], true);
    }

    /** Four looks, by level: common (1 to 3), rare (4 to 9), epic (10 to 24), legendary (25 and up). */
    public static function rarityOf(int $level): string
    {
        return $level >= 25 ? 'legendary' : ($level >= 10 ? 'epic' : ($level >= 4 ? 'rare' : 'common'));
    }

    public function show(Request $request): Response
    {
        $user = $request->user();
        $bought = $user ? self::bought($user) : [];
        $item = fn (string $slot, string $key, string $label, ?string $icon = null) => [
            'key' => $key, 'label' => $label, 'icon' => $icon, 'level' => $level = self::levelOf($slot, $key), 'rarity' => self::rarityOf($level),
            'price' => self::priceOf($slot, $key), 'owned' => self::owns($user, $slot, $key, $bought),
        ];
        $sorted = fn (array $items) => collect($items)->sortBy([['level', 'asc']])->values()->all(); // stable: keeps the order inside a level

        return Inertia::render('Shop', [
            'catalog' => [
                'avatar' => $sorted([
                    ...collect(self::charactersFor($request->user()))->map(function ($label, $name) use ($item) {
                        $row = $item('avatar', "char:{$name}", $label) + ['character' => true];
                        $need = self::roleNeeded("char:{$name}");

                        // a shelf of their own: the Owner's characters, and the ones for people with a role
                        return $need ? ['rarity' => $need === Role::Owner ? 'owner' : 'staff', 'role' => ['key' => $need->value, 'label' => $need->label(), 'icon' => $need->icon(), 'color' => $need->color()]] + $row : $row;
                    })->values()->all(),
                ]),
                'badge' => $sorted(collect(self::BADGES)->map(fn ($label, $k) => $item('badge', $k, $label))->values()->all()),
                'accessory' => $sorted(collect(self::ACCESSORIES)->map(fn ($label, $k) => $item('accessory', $k, $label))->values()->all()),
                'frame' => $sorted(collect(self::FRAMES)->map(fn ($label, $k) => $item('frame', $k, $label))->values()->all()),
                'effect' => $sorted(collect(self::EFFECTS)->map(fn ($label, $k) => $item('effect', $k, $label))->values()->all()),
            ],
            'coins' => (int) ($user->coins ?? 0),
            'daily' => ['amount' => User::DAILY_COINS, 'claimable' => $user !== null && ! $user->daily_coins_on?->isToday()],
            'earn' => self::EARN,
            'history' => $user ? $user->coinHistory()->latest('id')->limit(8)->get(['amount', 'reason', 'note', 'created_at'])
                ->map(fn ($t) => ['amount' => $t->amount, 'reason' => $t->reason, 'note' => $t->note, 'at' => $t->created_at?->toIso8601String()])->all() : [],
        ]);
    }

    /** May this person wear it? A role-only avatar needs the role. Otherwise it has to be theirs (bought, or free), staff can wear everything, and what you already wear stays yours. `$field` is where the error shows. */
    private function ensureOwned(User $user, string $slot, ?string $key, ?string $field = null): void
    {
        if ($slot === 'avatar' && $key !== null && ($need = self::roleNeeded($key)) && ! self::holds($user, $need)) {
            throw ValidationException::withMessages([$field ?? $slot => $need === Role::Owner ? 'Only the Owner can wear that.' : "Only {$need->label()} and above can wear that."]);
        }

        if ($key === null || self::owns($user, $slot, $key) || ($slot === 'avatar' ? $user->character : ($user->cosmetics[$slot] ?? null)) === $key) {
            return;
        }

        $need = self::levelOf($slot, $key);

        throw ValidationException::withMessages([$field ?? $slot => $user->level < $need
            ? "Reach level {$need} to buy that. You are level {$user->level}."
            : 'Buy that in the shop first: it costs '.number_format(self::priceOf($slot, $key)).' SFD Coins.']);
    }

    /** Buy things with SFD Coins: up to six at once, all or nothing. They are yours for good. */
    public function buy(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:6'],
            'items.*.slot' => ['required', Rule::in(self::SLOTS)],
            'items.*.key' => ['required', 'string', 'max:40'],
        ]);
        $user = $request->user();

        if ($user->is_staff) {
            throw ValidationException::withMessages(['items' => 'You are SFD-DJ.EU staff: everything is already yours.']);
        }

        $bought = self::bought($user);
        $rows = [];

        foreach ($data['items'] as $i => ['slot' => $slot, 'key' => $key]) {
            $field = "items.{$i}.key";

            if (! in_array($key, self::keysOf($slot), true)) {
                throw ValidationException::withMessages([$field => 'Unknown item.']);
            }
            if ($slot === 'avatar' && self::roleNeeded($key)) {
                throw ValidationException::withMessages([$field => 'That one comes with a role: it cannot be bought.']);
            }
            if (self::owns($user, $slot, $key, $bought)) {
                throw ValidationException::withMessages([$field => 'You have that already.']);
            }
            if ($user->level < ($need = self::levelOf($slot, $key))) {
                throw ValidationException::withMessages([$field => "Reach level {$need} to buy that. You are level {$user->level}."]);
            }

            $rows["{$slot}:{$key}"] = ['slot' => $slot, 'item' => $key, 'price' => self::priceOf($slot, $key)];
        }

        $total = array_sum(array_column($rows, 'price'));

        DB::transaction(function () use ($user, $rows, $total) {
            if (! $user->spend($total, 'shop', implode(', ', array_map(fn ($r) => self::labelOf($r['slot'], $r['item']), $rows)))) {
                throw ValidationException::withMessages(['items' => 'Not enough SFD Coins: you need '.number_format($total).' and have '.number_format((int) $user->coins).'.']);
            }

            foreach ($rows as $row) {
                $user->items()->create($row);
            }
        });
        $user->announce(); // the coins in the menu of the room you are in

        return back();
    }

    /** The daily reward, once a day. */
    public function daily(Request $request): RedirectResponse
    {
        if (! $request->user()->claimDaily()) {
            throw ValidationException::withMessages(['daily' => 'You have today\'s coins already. Come back tomorrow.']);
        }
        $request->user()->announce();

        return back();
    }

    /** Save a whole look in one go: any of avatar, badge, accessory, frame and effect, with null meaning none. */
    public function outfit(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'avatar' => ['sometimes', 'required', Rule::in(self::avatarKeys())], // a character: never none
            'badge' => ['sometimes', 'nullable', Rule::in(array_keys(self::BADGES))],
            'accessory' => ['sometimes', 'nullable', Rule::in(array_keys(self::ACCESSORIES))],
            'frame' => ['sometimes', 'nullable', Rule::in(array_keys(self::FRAMES))],
            'effect' => ['sometimes', 'nullable', Rule::in(array_keys(self::EFFECTS))],
        ]);
        $user = $request->user();

        foreach (self::SLOTS as $slot) {
            if (array_key_exists($slot, $data)) {
                $this->ensureOwned($user, $slot, $data[$slot]);
            }
        }

        if (array_key_exists('avatar', $data) && $data['avatar'] !== $user->character) {
            $user->character = $data['avatar'];
        }

        $worn = $user->cosmetics ?? [];
        foreach (['badge', 'accessory', 'frame', 'effect'] as $slot) {
            if (array_key_exists($slot, $data)) {
                $data[$slot] === null ? $worn = array_diff_key($worn, [$slot => 1]) : $worn[$slot] = $data[$slot];
            }
        }
        $user->cosmetics = $worn ?: null;
        $user->save();
        $user->announce();

        return back();
    }

    /** Equip (or, with a null key, remove) a badge, accessory, frame or effect. */
    public function cosmetic(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'slot' => ['required', Rule::in(['badge', 'accessory', 'frame', 'effect'])],
            'key' => ['nullable', 'string'],
        ]);
        $catalog = ['badge' => self::BADGES, 'accessory' => self::ACCESSORIES, 'frame' => self::FRAMES, 'effect' => self::EFFECTS][$data['slot']];

        if (isset($data['key']) && ! array_key_exists($data['key'], $catalog)) {
            throw ValidationException::withMessages(['key' => 'Unknown item.']);
        }

        $user = $request->user();
        $this->ensureOwned($user, $data['slot'], $data['key'] ?? null, 'key');
        $user->update(['cosmetics' => array_filter([...($user->cosmetics ?? []), $data['slot'] => $data['key'] ?? null])]);
        $user->announce();

        return back();
    }

    /** A character's picture for a state, /characters/standing/foxy. Anyone may look: guests watching a room see everybody's character. */
    public function character(Request $request, string $state, string $name): BinaryFileResponse|HttpResponse
    {
        abort_unless(isset(self::CHARACTER_FOLDERS[$state]) && preg_match('/^[a-z0-9]{2,11}$/', $name), 404);

        foreach (self::CHARACTER_FOLDERS[$state] as $folder) {
            foreach (self::CHARACTER_TYPES as $ext => $type) {
                $file = public_path("Avatars/{$folder}/{$name}.{$ext}");

                if (! is_file($file)) {
                    continue;
                }

                $headers = [
                    'Content-Type' => $type,
                    'Cache-Control' => 'public, max-age=300',
                    'X-Content-Type-Options' => 'nosniff',
                    'Content-Security-Policy' => "default-src 'none'; style-src 'unsafe-inline'; sandbox", // opened on its own, a picture can never run a script
                ];

                // ?motion=1 is "Always play animations" (Settings, Appearance): the picture keeps moving even if the computer is set to reduce motion
                if ($ext === 'svg' && $request->boolean('motion')) {
                    return response(preg_replace('/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[^{}]*\{[^{}]*\}\s*\}/', '', file_get_contents($file)), 200, $headers);
                }

                return response()->file($file, $headers);
            }
        }

        abort(404);
    }

    /** Pick a full-body character without replacing the user's profile photo. */
    public function equip(Request $request): RedirectResponse
    {
        $data = $request->validate(['avatar' => ['required', Rule::in(self::avatarKeys())]]);

        $user = $request->user();
        $this->ensureOwned($user, 'avatar', $data['avatar']);
        $user->update(['character' => $data['avatar']]);
        $user->announce();

        return back();
    }

    /** Upload a profile photo. The browser crops and shrinks still pictures to a small square; an animated GIF, WebP or PNG comes as it is (so it keeps looping) and may be a bit bigger. */
    public function upload(Request $request): RedirectResponse
    {
        $request->validate(['photo' => ['required', 'file', 'mimes:png,jpg,jpeg,webp,gif', 'max:1024', 'dimensions:max_width=1024,max_height=1024']]);

        $user = $request->user();
        $name = MediaController::store($request->file('photo'), 'avatars');

        $user->clearAvatarImage();
        $user->update(['avatar' => 'img:'.$name]);
        $user->announce();

        return back();
    }

    /** Take the photo away and show the user's currently selected character in the profile frame. */
    public function remove(Request $request): RedirectResponse
    {
        $user = $request->user();
        $user->clearAvatarImage();
        $user->update(['avatar' => $user->character ?? self::starterCharacter() ?? 'char:foxy']);
        $user->announce();

        return back();
    }
}
