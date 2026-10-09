<?php

namespace Tests\Feature;

use App\Http\Controllers\AvatarController;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ShopUpgradeTest extends TestCase
{
    use RefreshDatabase;

    /** Level L starts at 20 * (L - 1)^2 XP. */
    private function atLevel(int $level, int $coins = 0): User
    {
        $user = User::factory()->create();
        $user->forceFill(['xp' => 20 * ($level - 1) ** 2, 'coins' => $coins])->save();

        return $user->refresh();
    }

    /** Give somebody things as if they had bought them. */
    private function own(User $user, array $things): void
    {
        foreach ($things as [$slot, $key]) {
            $user->items()->create(['slot' => $slot, 'item' => $key, 'price' => 0]);
        }
    }

    public function test_every_unlock_points_at_a_real_item(): void
    {
        $catalog = [
            'avatar' => array_map(fn ($name) => "char:{$name}", array_keys(AvatarController::characters())),
            'badge' => array_keys(AvatarController::BADGES),
            'accessory' => array_keys(AvatarController::ACCESSORIES),
            'frame' => array_keys(AvatarController::FRAMES),
            'effect' => array_keys(AvatarController::EFFECTS),
        ];

        foreach (AvatarController::UNLOCK as $slot => $levels) {
            foreach (array_keys($levels) as $key) {
                $this->assertContains($key, $catalog[$slot], "UNLOCK {$slot}.{$key} is not in the shop");
            }
        }
        $this->assertSame($catalog['avatar'], array_unique($catalog['avatar']), 'an avatar is listed twice');
    }

    /** The keys of one of the maps of pictures in resources/js/lib/art: every line of it that starts with a key (four spaces in). */
    private function drawn(string $file, string $map): array
    {
        $source = file_get_contents(resource_path("js/lib/art/{$file}.tsx"));
        $this->assertSame(1, preg_match('/^(?:export )?const '.$map.'\b.*?^};/ms', $source, $block), "{$file}.tsx has no {$map}");
        preg_match_all('/^    (\w+): /m', $block[0], $keys);

        return $keys[1];
    }

    public function test_the_page_has_a_picture_for_every_badge_accessory_frame_and_effect_and_for_nothing_else(): void
    {
        foreach ([
            'badge' => ['badges', 'SIGN', AvatarController::BADGES],
            'accessory' => ['accessories', 'accessoryArt', AvatarController::ACCESSORIES],
            'frame' => ['frames', 'frameArt', AvatarController::FRAMES],
            'effect' => ['effects', 'effectArt', AvatarController::EFFECTS],
        ] as $slot => [$file, $map, $catalog]) {
            $this->assertEqualsCanonicalizing(array_keys($catalog), $this->drawn($file, $map), "the pictures of the {$slot}s and AvatarController differ");
        }

        // every badge sits on a medal, and the page draws a worn badge itself (it is no emoji any more)
        $badges = file_get_contents(resource_path('js/lib/art/badges.tsx'));
        foreach (array_keys(AvatarController::BADGES) as $key) {
            $this->assertMatchesRegularExpression('/\b'.$key.': \[\'(round|hex|shield|burst)\', /', $badges, "{$key} has no medal");
        }
        $this->assertStringContainsString("startsWith('shop:')", file_get_contents(resource_path('js/Components/Badges.tsx')));

        // the animated avatars are not in the shop any more, but the page still draws the ones people already wear (and nothing else)
        $drawn = file_get_contents(resource_path('js/lib/animatedAvatars.tsx'));
        preg_match('/export const animatedAvatars\b.*?\n};/s', $drawn, $m);
        preg_match_all('/^\s+(\w+): \w+,$/m', $m[0] ?? '', $keys);
        $this->assertEqualsCanonicalizing(array_keys(AvatarController::ANIMATED), $keys[1], 'animatedAvatars.tsx and AvatarController::ANIMATED differ');
    }

    public function test_the_old_items_are_gone_and_what_people_wore_was_cleared(): void
    {
        foreach ([
            [AvatarController::BADGES, ['headphones', 'flame', 'vinyl', 'rocket', 'clover', 'heart', 'note', 'trophy', 'bolt', 'moon', 'medal', 'target', 'brain', 'alien', 'ufo', 'butterfly', 'blossom', 'star', 'dragon']],
            [AvatarController::ACCESSORIES, ['headset', 'bow', 'party', 'wand', 'star', 'flower', 'grad', 'helmet', 'pumpkin', 'snow', 'disco', 'sparkle', 'wizard', 'unicorn', 'rainbow', 'flame']],
            [AvatarController::FRAMES, ['ocean', 'violet', 'white', 'ruby', 'obsidian', 'double', 'candy', 'sunset', 'electric', 'rainbow']],
            [AvatarController::EFFECTS, ['fire', 'ice', 'gold', 'pulse', 'sakura', 'ember', 'storm', 'rainbow']],
        ] as [$catalog, $gone]) {
            foreach ($gone as $old) {
                $this->assertArrayNotHasKey($old, $catalog, "{$old} was an old item");
            }
        }
        $this->assertSame(16, count(AvatarController::BADGES));
        $this->assertSame(16, count(AvatarController::ACCESSORIES));
        $this->assertSame(13, count(AvatarController::FRAMES));
        $this->assertSame(12, count(AvatarController::EFFECTS));

        // the old things somebody wore are taken off; what they already picked from the new shop stays, and nobody is given anything
        $migration = require database_path('migrations/2026_10_28_000001_reset_shop_cosmetics.php');
        $old = User::factory()->create(['cosmetics' => ['badge' => 'flame', 'accessory' => 'wizard', 'effect' => 'rainbow']]);
        $mixed = User::factory()->create(['cosmetics' => ['badge' => 'flame', 'frame' => 'gold']]);
        $new = User::factory()->create(['cosmetics' => ['badge' => 'legend', 'accessory' => 'crown', 'frame' => 'carbon', 'effect' => 'lightning']]);
        $bare = User::factory()->create();
        $migration->up();

        $this->assertNull($old->refresh()->cosmetics);
        $this->assertSame(['frame' => 'gold'], $mixed->refresh()->cosmetics);
        $this->assertSame(['badge' => 'legend', 'accessory' => 'crown', 'frame' => 'carbon', 'effect' => 'lightning'], $new->refresh()->cosmetics);
        $this->assertNull($bare->refresh()->cosmetics);
    }

    public function test_the_shop_lists_every_item_with_a_level_and_a_rarity_cheapest_first(): void
    {
        $this->actingAs(User::factory()->create())->get('/shop')->assertInertia(fn (Assert $page) => $page
            ->component('Shop')
            ->has('catalog.avatar', count(AvatarController::charactersFor(null)))
            ->has('catalog.badge', count(AvatarController::BADGES))
            ->has('catalog.accessory', count(AvatarController::ACCESSORIES))
            ->has('catalog.frame', count(AvatarController::FRAMES))
            ->has('catalog.effect', count(AvatarController::EFFECTS))
            ->where('catalog.avatar.0', ['key' => 'char:foxy', 'label' => 'Foxy', 'icon' => null, 'level' => 1, 'rarity' => 'common', 'price' => 0, 'owned' => true, 'character' => true])
            ->where('catalog.frame.0', ['key' => 'bronze', 'label' => 'Bronze', 'icon' => null, 'level' => 1, 'rarity' => 'common', 'price' => 0, 'owned' => true])
            ->where('catalog.frame.12', ['key' => 'prism', 'label' => 'Prism', 'icon' => null, 'level' => 50, 'rarity' => 'legendary', 'price' => 1940, 'owned' => false])
            ->where('catalog.badge.15', ['key' => 'legend', 'label' => 'Legend', 'icon' => null, 'level' => 55, 'rarity' => 'legendary', 'price' => 1760, 'owned' => false])
            ->where('catalog.accessory.1.key', 'shades')
            ->where('catalog.effect.11.key', 'void'));
    }

    public function test_the_shop_has_no_plain_emoji_and_no_animated_avatars_only_characters(): void
    {
        $this->actingAs(User::factory()->create())->get('/shop')->assertInertia(fn (Assert $page) => $page
            ->where('catalog.avatar', fn ($avatars) => $avatars->count() > 0 && $avatars->every(fn ($a) => str_starts_with($a['key'], 'char:'))));

        // an emoji cannot be picked any more, however high the level or the role
        $owner = User::factory()->create();
        $owner->forceFill(['roles' => ['owner'], 'xp' => 20 * 11 ** 2])->save();
        foreach (['🎧', '🐉', '🦅', '🍀', '🎃', '🧙'] as $emoji) {
            $this->actingAs($owner)->post('/shop/equip', ['avatar' => $emoji])->assertSessionHasErrors('avatar');
            $this->actingAs($owner)->post('/shop/outfit', ['avatar' => $emoji])->assertSessionHasErrors('avatar');
        }
        foreach (['anim:spin', 'anim:fang'] as $animated) {
            $this->actingAs($owner)->post('/shop/equip', ['avatar' => $animated])->assertSessionHasErrors('avatar');
            $this->actingAs($owner)->post('/shop/outfit', ['avatar' => $animated])->assertSessionHasErrors('avatar');
        }
        $this->assertNull($owner->refresh()->avatar);

        // somebody who picked one before keeps it: it is only drawn, and the rest of their look can still be saved
        $old = $this->atLevel(3);
        $old->forceFill(['avatar' => '🦊'])->save();
        $this->actingAs($old)->post('/shop/outfit', ['badge' => 'rookie'])->assertSessionHasNoErrors();
        $this->assertSame('🦊', $old->refresh()->avatar);
        $old->forceFill(['avatar' => 'anim:spin'])->save();
        $this->actingAs($old)->post('/shop/outfit', ['badge' => 'selector'])->assertSessionHasNoErrors();
        $this->assertSame('anim:spin', $old->refresh()->avatar, 'an animated avatar that was picked before is still worn');
        $this->actingAs($old)->get('/shop')->assertOk();
    }

    public function test_rarity_follows_the_level(): void
    {
        $this->assertSame('common', AvatarController::rarityOf(1));
        $this->assertSame('common', AvatarController::rarityOf(3));
        $this->assertSame('rare', AvatarController::rarityOf(4));
        $this->assertSame('rare', AvatarController::rarityOf(9));
        $this->assertSame('epic', AvatarController::rarityOf(10));
        $this->assertSame('epic', AvatarController::rarityOf(24));
        $this->assertSame('legendary', AvatarController::rarityOf(25));
        $this->assertSame(2, AvatarController::levelOf('frame', 'gold'));
        $this->assertSame(38, AvatarController::levelOf('frame', 'aurora'));
        $this->assertSame(1, AvatarController::levelOf('frame', 'bronze'));
    }

    public function test_things_have_to_be_bought_and_need_the_level(): void
    {
        $user = $this->atLevel(1);

        $this->actingAs($user)->post('/shop/cosmetic', ['slot' => 'frame', 'key' => 'aurora'])->assertSessionHasErrors('key');
        $this->actingAs($user)->post('/shop/equip', ['avatar' => 'char:robo'])->assertSessionHasErrors('avatar');
        $this->assertNull($user->refresh()->cosmetics);
        $this->assertNull($user->avatar);

        // enough coins, but not the level for the aurora frame (38); the carbon one (6) is for sale at level 7
        $user = $this->atLevel(7);
        $user->forceFill(['coins' => 5000])->save();
        $this->actingAs($user)->post('/shop/cosmetic', ['slot' => 'frame', 'key' => 'carbon'])->assertSessionHasErrors('key'); // not bought yet
        $this->actingAs($user)->post('/shop/buy', ['items' => [['slot' => 'frame', 'key' => 'aurora']]])->assertSessionHasErrors('items.0.key');
        $this->actingAs($user)->post('/shop/buy', ['items' => [['slot' => 'frame', 'key' => 'carbon']]])->assertSessionHasNoErrors();
        $this->actingAs($user)->post('/shop/cosmetic', ['slot' => 'frame', 'key' => 'carbon'])->assertSessionHasNoErrors();
        $this->assertSame('carbon', $user->refresh()->cosmetics['frame']);

        $user = $this->atLevel(38, 5000);
        $this->actingAs($user)->post('/shop/buy', ['items' => [['slot' => 'frame', 'key' => 'aurora']]])->assertSessionHasNoErrors();
        $this->actingAs($user)->post('/shop/cosmetic', ['slot' => 'frame', 'key' => 'aurora'])->assertSessionHasNoErrors();
        $this->assertSame('aurora', $user->refresh()->cosmetics['frame']);
    }

    public function test_staff_can_wear_everything_and_what_you_already_wear_stays_yours(): void
    {
        $staff = User::factory()->create();
        $staff->forceFill(['roles' => ['admin']])->save();
        $this->actingAs($staff)->post('/shop/equip', ['avatar' => 'char:robo'])->assertSessionHasNoErrors();
        $this->assertSame('char:robo', $staff->refresh()->avatar);

        // a member who already wears a prism frame (from before the levels existed) can keep it and put it on again
        $member = $this->atLevel(1);
        $member->forceFill(['cosmetics' => ['frame' => 'prism']])->save();
        $this->actingAs($member)->post('/shop/outfit', ['frame' => 'prism', 'badge' => 'rookie'])->assertSessionHasNoErrors();
        $this->assertSame(['frame' => 'prism', 'badge' => 'rookie'], $member->refresh()->cosmetics);
        // but they cannot pick a different locked one
        $this->actingAs($member)->post('/shop/outfit', ['effect' => 'void'])->assertSessionHasErrors('effect');
    }

    public function test_an_outfit_is_saved_in_one_go_and_null_takes_a_slot_off(): void
    {
        $user = $this->atLevel(30);
        $this->own($user, [['avatar', 'char:robo'], ['badge', 'royal'], ['badge', 'voltage'], ['accessory', 'crown'], ['frame', 'frost'], ['effect', 'toxic']]);

        $this->actingAs($user)->post('/shop/outfit', ['avatar' => 'char:robo', 'badge' => 'royal', 'accessory' => 'crown', 'frame' => 'frost', 'effect' => 'toxic'])->assertRedirect();
        $user->refresh();
        $this->assertSame('char:robo', $user->avatar);
        $this->assertSame(['badge' => 'royal', 'accessory' => 'crown', 'frame' => 'frost', 'effect' => 'toxic'], $user->cosmetics);
        $this->assertSame(['key' => 'shop:royal', 'label' => 'Royal', 'color' => '#a78bfa', 'icon' => null], collect($user->badges)->last(), 'the page draws the badge itself, it has no icon');

        // an accessory or an effect can come off, a character cannot: there is no plain-letter avatar any more
        $this->actingAs($user)->post('/shop/outfit', ['accessory' => null, 'effect' => null, 'avatar' => null])->assertSessionHasErrors('avatar');
        $this->assertSame('char:robo', $user->refresh()->avatar);
        $this->assertSame(['badge' => 'royal', 'accessory' => 'crown', 'frame' => 'frost', 'effect' => 'toxic'], $user->cosmetics, 'a refused look changes nothing');
        $this->actingAs($user)->post('/shop/outfit', ['accessory' => null, 'effect' => null])->assertRedirect();
        $user->refresh();
        $this->assertSame('char:robo', $user->avatar);
        $this->assertSame(['badge' => 'royal', 'frame' => 'frost'], $user->cosmetics);

        // slots that are not sent are left alone
        $this->actingAs($user)->post('/shop/outfit', ['badge' => 'voltage']);
        $this->assertSame(['badge' => 'voltage', 'frame' => 'frost'], $user->refresh()->cosmetics);
    }

    public function test_an_outfit_with_one_bad_item_changes_nothing(): void
    {
        $user = $this->atLevel(3);
        $this->own($user, [['badge', 'bassline']]);
        $user->forceFill(['cosmetics' => ['badge' => 'rookie']])->save();

        $this->actingAs($user)->post('/shop/outfit', ['badge' => 'bassline', 'frame' => 'nope'])->assertSessionHasErrors('frame');
        $this->actingAs($user)->post('/shop/outfit', ['badge' => 'bassline', 'effect' => 'void'])->assertSessionHasErrors('effect');
        $this->actingAs($user)->post('/shop/outfit', ['avatar' => '💩'])->assertSessionHasErrors('avatar');

        $this->assertSame(['badge' => 'rookie'], $user->refresh()->cosmetics);
    }

    public function test_a_photo_is_only_replaced_when_a_new_avatar_is_picked(): void
    {
        $user = $this->atLevel(1);
        $user->forceFill(['avatar' => 'img:me.webp'])->save();

        $this->actingAs($user)->post('/shop/outfit', ['badge' => 'rookie', 'avatar' => 'img:me.webp'])->assertSessionHasErrors('avatar');
        $this->actingAs($user)->post('/shop/outfit', ['badge' => 'rookie'])->assertSessionHasNoErrors();
        $this->assertSame('img:me.webp', $user->refresh()->avatar);

        $this->actingAs($user)->post('/shop/outfit', ['avatar' => 'char:foxy'])->assertSessionHasNoErrors();
        $this->assertSame('char:foxy', $user->refresh()->avatar);
    }

    public function test_guests_cannot_save_an_outfit(): void
    {
        $this->post('/shop/outfit', ['badge' => 'rookie'])->assertRedirect();
        $this->assertDatabaseCount('users', 0);
    }

    public function test_characters_are_listed_with_their_level_and_marked_as_characters(): void
    {
        $this->actingAs(User::factory()->create())->get('/shop')->assertInertia(fn (Assert $page) => $page
            ->where('catalog.avatar', fn ($avatars) => $avatars->firstWhere('key', 'char:robo') === ['key' => 'char:robo', 'label' => 'Robo', 'icon' => null, 'level' => 10, 'rarity' => 'epic', 'price' => 380, 'owned' => false, 'character' => true]
                && $avatars->firstWhere('key', 'char:bun')['level'] === 3
                && $avatars->firstWhere('key', 'char:foxy')['level'] === 1
                && $avatars->doesntContain(fn ($a) => str_starts_with($a['key'], 'anim:'))));
    }

    public function test_characters_follow_levels_and_staff_can_wear_them_all(): void
    {
        $user = $this->atLevel(1);
        $this->actingAs($user)->post('/shop/equip', ['avatar' => 'char:wolfie'])->assertSessionHasErrors('avatar');
        $this->actingAs($user)->post('/shop/equip', ['avatar' => 'char:nope'])->assertSessionHasErrors('avatar');
        $this->assertNull($user->refresh()->avatar);

        $user = $this->atLevel(3, 500);
        $this->actingAs($user)->post('/shop/equip', ['avatar' => 'char:bun'])->assertSessionHasErrors('avatar'); // has to be bought first
        $this->actingAs($user)->post('/shop/buy', ['items' => [['slot' => 'avatar', 'key' => 'char:bun']]])->assertSessionHasNoErrors();
        $this->actingAs($user)->post('/shop/equip', ['avatar' => 'char:bun'])->assertSessionHasNoErrors();
        $this->assertSame('char:bun', $user->refresh()->avatar);
        $this->actingAs($user)->post('/shop/outfit', ['avatar' => 'char:panda'])->assertSessionHasErrors('avatar');
        $this->actingAs($user)->post('/shop/buy', ['items' => [['slot' => 'avatar', 'key' => 'char:panda']]])->assertSessionHasErrors('items.0.key'); // level 5

        $staff = User::factory()->create();
        $staff->forceFill(['roles' => ['admin']])->save();
        $this->actingAs($staff)->post('/shop/outfit', ['avatar' => 'char:robo', 'frame' => 'prism'])->assertSessionHasNoErrors();
        $this->assertSame('char:robo', $staff->refresh()->avatar);
    }

    public function test_a_character_replaces_an_uploaded_photo_and_the_photo_file_goes(): void
    {
        Storage::fake('local');
        $user = $this->atLevel(5);
        $this->own($user, [['avatar', 'char:panda']]);
        Storage::disk('local')->put('avatars/aaaaaaaaaaaaaaaaaaaaaaaa.gif', 'x');
        $user->forceFill(['avatar' => 'img:aaaaaaaaaaaaaaaaaaaaaaaa.gif'])->save();

        $this->actingAs($user)->post('/shop/outfit', ['avatar' => 'char:panda'])->assertSessionHasNoErrors();

        $this->assertSame('char:panda', $user->refresh()->avatar);
        Storage::disk('local')->assertMissing('avatars/aaaaaaaaaaaaaaaaaaaaaaaa.gif');
    }

    public function test_an_animated_gif_can_be_the_profile_photo_but_not_a_huge_one(): void
    {
        Storage::fake('local');
        $user = $this->atLevel(1);
        $gif = base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');

        $this->actingAs($user)->post('/profile/photo', ['photo' => UploadedFile::fake()->createWithContent('loop.gif', $gif)])->assertSessionHasNoErrors();
        $this->assertMatchesRegularExpression('/^img:[a-f0-9]{24}\.gif$/', $user->refresh()->avatar);
        Storage::disk('local')->assertExists('avatars/'.substr($user->avatar, 4));

        // more than a megabyte is too much for a profile picture
        $big = UploadedFile::fake()->createWithContent('big.png', $png.str_repeat("\0", 1100 * 1024));
        $this->actingAs($user)->post('/profile/photo', ['photo' => $big])->assertSessionHasErrors('photo');
    }
}
