<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Http\Controllers\AvatarController;
use App\Models\SitePermission;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CharacterTest extends TestCase
{
    use RefreshDatabase;

    private const BUILT_IN = ['bun', 'foxy', 'neko', 'panda', 'robo', 'wolfie'];

    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    private const GIF = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    /** Level L starts at 20 * (L - 1)^2 XP. */
    private function atLevel(int $level): User
    {
        $user = User::factory()->create();
        $user->forceFill(['xp' => 20 * ($level - 1) ** 2])->save();

        return $user->refresh();
    }

    public function test_every_built_in_character_has_a_picture_in_each_of_the_three_folders(): void
    {
        $this->assertSame([], array_diff(self::BUILT_IN, array_keys(AvatarController::characters())));

        foreach (self::BUILT_IN as $name) {
            foreach (['standing' => 'Standing', 'dancing' => 'Dancing', 'djing' => 'DJing'] as $state => $folder) {
                $response = $this->get("/characters/{$state}/{$name}")->assertOk();

                $this->assertMatchesRegularExpression("#Avatars/{$folder}/{$name}\\.(svg|webp|gif|png)$#", str_replace('\\', '/', $response->baseResponse->getFile()->getPathname()));
                $this->assertContains($response->headers->get('Content-Type'), AvatarController::CHARACTER_TYPES);
                $this->assertSame('nosniff', $response->headers->get('X-Content-Type-Options'));
                $this->assertStringContainsString('sandbox', $response->headers->get('Content-Security-Policy'));
            }
        }
    }

    public function test_always_play_animations_leaves_the_reduced_motion_clause_out_of_the_picture(): void
    {
        $plain = $this->get('/characters/dancing/foxy')->assertOk();
        $this->assertStringContainsString('prefers-reduced-motion', file_get_contents($plain->baseResponse->getFile()->getPathname()));

        $moving = $this->get('/characters/dancing/foxy?motion=1')->assertOk();
        $svg = $moving->getContent();
        $this->assertStringNotContainsString('prefers-reduced-motion', $svg);
        $this->assertStringContainsString('@keyframes', $svg);
        $this->assertStringEndsWith("</svg>\n", $svg);
        $this->assertSame('image/svg+xml', $moving->headers->get('Content-Type'));
        $this->assertSame('nosniff', $moving->headers->get('X-Content-Type-Options'));
    }

    public function test_the_always_play_animations_preference_is_saved_and_must_be_a_yes_or_no(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->patch('/settings/preferences', ['appearance' => ['always_animate' => true]])->assertSessionHasNoErrors();
        $this->assertTrue($user->refresh()->preferences['appearance']['always_animate']);

        $this->actingAs($user)->patch('/settings/preferences', ['appearance' => ['always_animate' => 'maybe']])->assertSessionHasErrors('appearance.always_animate');
        $this->assertTrue($user->refresh()->preferences['appearance']['always_animate']);
    }

    public function test_bad_states_and_names_are_not_found(): void
    {
        foreach (['/characters/sitting/foxy', '/characters/Standing/foxy', '/characters/standing/nobody', '/characters/standing/FOXY', '/characters/standing/a', '/characters/standing/abcdefghijkl', '/characters/standing/foxy.svg', '/characters/standing/..%2F..%2F.env', '/characters/standing/..'] as $url) {
            $this->get($url)->assertNotFound();
        }
    }

    public function test_a_character_with_only_a_standing_picture_still_works_in_every_state_and_a_new_picture_is_picked_up(): void
    {
        $standing = public_path('Avatars/Standing/zzfall.png');
        $dancing = public_path('Avatars/Dancing/zzfall.gif');
        file_put_contents($standing, base64_decode(self::PNG));

        try {
            $this->assertArrayHasKey('zzfall', AvatarController::characters());

            foreach (['standing', 'dancing', 'djing'] as $state) {
                $this->assertSame('image/png', $this->get("/characters/{$state}/zzfall")->assertOk()->headers->get('Content-Type'));
            }

            // a Dancing picture is used on the stage too, until there is a DJing one
            file_put_contents($dancing, base64_decode(self::GIF));
            $this->assertSame('image/png', $this->get('/characters/standing/zzfall')->headers->get('Content-Type'));
            $this->assertSame('image/gif', $this->get('/characters/dancing/zzfall')->headers->get('Content-Type'));
            $this->assertSame('image/gif', $this->get('/characters/djing/zzfall')->headers->get('Content-Type'));
        } finally {
            @unlink($standing);
            @unlink($dancing);
        }

        $this->assertArrayNotHasKey('zzfall', AvatarController::characters());
        $this->get('/characters/standing/zzfall')->assertNotFound();
    }

    public function test_a_picture_that_is_only_in_the_dancing_folder_is_not_a_character(): void
    {
        $dancing = public_path('Avatars/Dancing/zzonly.png');
        file_put_contents($dancing, base64_decode(self::PNG));

        try {
            $this->assertArrayNotHasKey('zzonly', AvatarController::characters());
            $this->actingAs($this->atLevel(12))->post('/shop/equip', ['avatar' => 'char:zzonly'])->assertSessionHasErrors('avatar');
        } finally {
            @unlink($dancing);
        }
    }

    public function test_the_shop_lists_the_characters_with_their_level(): void
    {
        $this->actingAs(User::factory()->create())->get('/shop')->assertInertia(fn (Assert $page) => $page
            ->where('catalog.avatar', fn ($avatars) => $avatars->firstWhere('key', 'char:foxy') === ['key' => 'char:foxy', 'label' => 'Foxy', 'icon' => null, 'level' => 1, 'rarity' => 'common', 'price' => 0, 'owned' => true, 'character' => true]
                && $avatars->firstWhere('key', 'char:robo')['level'] === 10
                && $avatars->firstWhere('key', 'char:robo')['rarity'] === 'epic'
                && $avatars->where('character', true)->count() === count(AvatarController::charactersFor(User::first()))));
    }

    public function test_a_character_is_worn_separately_from_the_profile_avatar(): void
    {
        foreach (array_keys(AvatarController::characters()) as $name) {
            $this->assertLessThanOrEqual(16, strlen("char:{$name}"), "char:{$name} does not fit users.avatar");
        }

        $user = $this->atLevel(1);
        $this->actingAs($user)->post('/shop/equip', ['avatar' => 'char:foxy'])->assertSessionHasNoErrors();
        $this->assertSame('char:foxy', $user->refresh()->character);

        $this->actingAs($user)->post('/shop/equip', ['avatar' => 'char:robo'])->assertSessionHasErrors('avatar'); // level 10
        $this->actingAs($user)->post('/shop/outfit', ['avatar' => 'char:robo'])->assertSessionHasErrors('avatar');
        $this->actingAs($user)->post('/shop/equip', ['avatar' => 'char:nobody'])->assertSessionHasErrors('avatar');
        $this->assertSame('char:foxy', $user->refresh()->character);

        $staff = User::factory()->create();
        $staff->forceFill(['roles' => ['admin']])->save();
        $this->actingAs($staff)->post('/shop/outfit', ['avatar' => 'char:robo', 'frame' => 'gold'])->assertSessionHasNoErrors();
        $this->assertSame('char:robo', $staff->refresh()->character);
    }

    private function withRole(?string $role): User
    {
        $user = User::factory()->create();
        $user->forceFill(['roles' => $role ? [$role] : null])->save();

        return $user->refresh();
    }

    public function test_every_role_only_character_has_its_pictures(): void
    {
        foreach (AvatarController::ROLE_ONLY as $key => $role) {
            $name = substr($key, 5);
            $this->assertNotNull(Role::tryFrom($role), "{$key} needs a role that does not exist");

            foreach (['Standing', 'Dancing', 'DJing'] as $folder) {
                $this->assertNotEmpty(glob(public_path("Avatars/{$folder}/{$name}.*")), "{$key} has no picture in {$folder}");
            }
        }
    }

    public function test_a_character_for_a_role_is_for_that_role_and_the_ones_above_it(): void
    {
        foreach (['brand_ambassador', 'lead_moderator', 'admin', 'developer', 'owner'] as $role) {
            $user = $this->withRole($role);
            $this->actingAs($user)->post('/shop/equip', ['avatar' => 'char:fedora'])->assertSessionHasNoErrors();
            $this->assertSame('char:fedora', $user->refresh()->avatar, "{$role} may wear it");
        }

        foreach ([null, 'moderator', 'site_moderator', 'helper', 'promoter', 'vip', 'artist'] as $role) {
            $user = $this->withRole($role);
            $this->actingAs($user)->post('/shop/equip', ['avatar' => 'char:fedora'])->assertSessionHasErrors('avatar');
            $this->actingAs($user)->post('/shop/outfit', ['avatar' => 'char:fedora'])->assertSessionHasErrors('avatar');
            $this->assertNull($user->refresh()->avatar, ($role ?? 'a plain user').' may not wear it');
        }
    }

    public function test_being_staff_does_not_get_you_a_character_for_a_role_you_do_not_hold(): void
    {
        $moderator = $this->withRole('moderator');
        SitePermission::create(['role' => 'moderator', 'permission' => 'admin.access']);
        SitePermission::forget();
        $this->assertTrue($moderator->refresh()->is_staff);

        $this->actingAs($moderator)->post('/shop/outfit', ['avatar' => 'char:blaze'])->assertSessionHasErrors('avatar');
        $this->actingAs($moderator)->post('/shop/outfit', ['avatar' => 'char:zoos02'])->assertSessionHasErrors('avatar');
        $this->assertNull($moderator->refresh()->avatar);
    }

    public function test_the_zoo_fox_is_for_the_owner_alone(): void
    {
        foreach (['brand_ambassador', 'lead_moderator', 'admin', 'developer'] as $role) {
            $user = $this->withRole($role);
            $this->actingAs($user)->post('/shop/equip', ['avatar' => 'char:zoos02'])->assertSessionHasErrors('avatar');
            $this->assertNull($user->refresh()->avatar, "{$role} may not wear the fox");
        }

        $owner = $this->withRole('owner');
        $this->actingAs($owner)->post('/shop/equip', ['avatar' => 'char:zoos02'])->assertSessionHasNoErrors();
        $this->assertSame('char:zoos02', $owner->refresh()->avatar);
    }

    public function test_the_shop_shows_a_character_for_a_role_only_to_people_who_hold_it(): void
    {
        $keys = fn (?User $user) => $this->actingAs($user ?? User::factory()->create())->get('/shop')->inertiaProps('catalog.avatar');
        $has = fn (array $avatars, string $key) => in_array($key, array_column($avatars, 'key'), true);

        $plain = $keys($this->withRole(null));
        $this->assertTrue($has($plain, 'char:foxy'));
        $this->assertFalse($has($plain, 'char:fedora'));
        $this->assertFalse($has($plain, 'char:zoos02'));

        $ambassador = $keys($this->withRole('brand_ambassador'));
        $this->assertTrue($has($ambassador, 'char:fedora'));
        $this->assertTrue($has($ambassador, 'char:nebulamini'));
        $this->assertFalse($has($ambassador, 'char:zoos02'));

        $owner = $keys($this->withRole('owner'));
        $this->assertTrue($has($owner, 'char:zoos02'));
        $fox = collect($owner)->firstWhere('key', 'char:zoos02');
        $this->assertSame(['key' => 'owner', 'label' => 'Owner', 'icon' => '👑', 'color' => '#f43f5e'], $fox['role']);
        $this->assertSame('owner', $fox['rarity'], 'the characters of the Owner have a shelf of their own');
        $this->assertSame('Zoo S02', $fox['label']);
    }

    public function test_the_avatar_goes_when_the_role_it_needs_goes(): void
    {
        $user = $this->withRole('brand_ambassador');
        $user->forceFill(['avatar' => 'char:echo'])->save();

        // another role that is still high enough: the avatar stays
        $user->forceFill(['roles' => ['brand_ambassador', 'vip']])->save();
        $this->assertSame('char:echo', $user->refresh()->avatar);

        $user->forceFill(['roles' => ['admin']])->save();
        $this->assertSame('char:echo', $user->refresh()->avatar);

        $user->forceFill(['roles' => ['moderator']])->save();
        $this->assertSame('char:foxy', $user->refresh()->character);
        $this->assertSame('char:foxy', $user->refresh()->avatar);

        // an avatar for everybody is never touched
        $user->forceFill(['avatar' => 'char:foxy', 'roles' => null])->save();
        $this->assertSame('char:foxy', $user->refresh()->avatar);
    }

    public function test_the_page_draws_characters_from_the_same_three_states(): void
    {
        $source = file_get_contents(resource_path('js/lib/characters.ts'));

        foreach (['standing', 'dancing', 'djing'] as $state) {
            $this->assertStringContainsString("'{$state}'", $source);
        }
        $this->assertStringContainsString("route('characters.show'", $source);
        $this->assertStringContainsString('characterOf(user.character) ?? characterOf(user.avatar) ?? DEFAULT_CHARACTER', file_get_contents(resource_path('js/Components/RoomScene.tsx')));
        $avatar = file_get_contents(resource_path('js/Components/Avatar.tsx'));
        $this->assertStringContainsString('!avatar || photo ? DEFAULT_CHARACTER : null', $avatar);
        $this->assertStringContainsString('onError={() => setFailedPhoto(photo)}', $avatar);
    }

    public function test_every_user_has_a_full_body_character_separate_from_the_profile_picture(): void
    {
        $plain = User::factory()->create();
        $withPhoto = User::factory()->create(['avatar' => 'img:profile.webp']);

        $this->assertSame('char:foxy', $plain->character);
        $this->assertSame('char:foxy', $withPhoto->character);
        $this->assertSame('img:profile.webp', $withPhoto->avatar);
        $this->assertSame('char:foxy', $withPhoto->presenceInfo()['character']);
    }

    public function test_everybody_who_wooted_or_grabbed_the_song_dances_and_the_rest_stand(): void
    {
        $host = User::factory()->create();
        [$wooter, $grabber, $mehr, $changedMind] = User::factory()->count(4)->create();
        $room = $host->rooms()->create(['name' => 'Floor', 'slug' => 'floor-room']);
        $room->enqueue(['youtube_id' => 'aaaaaaaaaaa', 'title' => 'First', 'thumbnail' => null, 'duration' => 300], $host->id);
        $room->enqueue(['youtube_id' => 'bbbbbbbbbbb', 'title' => 'Second', 'thumbnail' => null, 'duration' => 300], $host->id);
        $room->refresh();

        $this->assertSame([], $room->dancers(), 'nobody has voted: everybody stands');

        $vote = fn (User $user, string $type) => Vote::create(['playlist_item_id' => $room->current_item_id, 'user_id' => $user->id, 'type' => $type]);
        $vote($wooter, 'woot');
        $vote($grabber, 'grab');
        $vote($mehr, 'meh');
        $vote($changedMind, 'grab');
        $vote($changedMind, 'meh'); // grabbed it, then did not like it after all

        $this->assertEqualsCanonicalizing([$wooter->id, $grabber->id], $room->dancers());
        $this->assertEqualsCanonicalizing([$wooter->id, $grabber->id], $room->playback()['dancers']);

        // a guest gets the list too, so the room looks the same to everybody
        $this->get('/rooms/floor-room')->assertInertia(fn (Assert $page) => $page
            ->where('playback.dancers', fn ($ids) => $ids->sort()->values()->all() === collect([$wooter->id, $grabber->id])->sort()->values()->all()));

        // the next song: everybody stands again until they vote
        $room->advance();
        $this->assertSame([], $room->refresh()->dancers());
    }

    public function test_panda_bear_is_for_brand_ambassadors_and_up(): void
    {
        $shelf = fn (User $user) => collect($this->actingAs($user)->get('/shop')->inertiaProps('catalog.avatar'))->keyBy('key');

        $this->assertFalse($shelf($this->withRole(null))->has('char:pandabear'));
        $this->assertSame('staff', $shelf($this->withRole('brand_ambassador'))['char:pandabear']['rarity']);

        // whoever bought it without the role gets the coins back and another character; a Brand Ambassador keeps it
        $buyer = $this->withRole(null);
        $buyer->forceFill(['character' => 'char:pandabear', 'coins' => 5])->save();
        $buyer->items()->create(['slot' => 'avatar', 'item' => 'char:pandabear', 'price' => 230]);
        $ambassador = $this->withRole('brand_ambassador');
        $ambassador->items()->create(['slot' => 'avatar', 'item' => 'char:pandabear', 'price' => 230]);
        $ambassador->forceFill(['character' => 'char:pandabear'])->save();

        (require database_path('migrations/2026_11_08_000001_make_panda_bear_brand_ambassador_only.php'))->up();

        $this->assertSame(235, $buyer->refresh()->coins);
        $this->assertNotSame('char:pandabear', $buyer->character);
        $this->assertFalse($buyer->items()->where('item', 'char:pandabear')->exists());
        $this->assertSame('char:pandabear', $ambassador->refresh()->character);
        $this->assertTrue($ambassador->items()->where('item', 'char:pandabear')->exists());
    }

    public function test_fox_is_for_the_owner_alone_and_stands_on_the_owner_shelf(): void
    {
        $shelf = fn (User $user) => collect($this->actingAs($user)->get('/shop')->inertiaProps('catalog.avatar'))->keyBy('key');

        foreach ([null, 'brand_ambassador', 'admin', 'developer'] as $role) {
            $user = $this->withRole($role);
            $this->assertFalse($shelf($user)->has('char:fox'), ($role ?? 'a plain user').' does not see the fox in the shop');
            $this->actingAs($user)->post('/shop/equip', ['avatar' => 'char:fox'])->assertSessionHasErrors('avatar');
        }

        $owner = $this->withRole('owner');
        $fox = $shelf($owner)['char:fox'];
        $this->assertSame('owner', $fox['rarity'], 'on the shelf of the Owner');
        $this->assertSame('Fox', $fox['label']);
        $this->actingAs($owner)->post('/shop/equip', ['avatar' => 'char:fox'])->assertSessionHasNoErrors();
        $this->assertSame('char:fox', $owner->refresh()->character);

        // whoever bought him before gets the coins back and another character; the Owner keeps him
        $buyer = $this->withRole(null);
        $buyer->forceFill(['character' => 'char:fox', 'coins' => 5])->save();
        $buyer->items()->create(['slot' => 'avatar', 'item' => 'char:fox', 'price' => 430]);
        $owner->items()->create(['slot' => 'avatar', 'item' => 'char:fox', 'price' => 430]);

        (require database_path('migrations/2026_11_09_000001_make_fox_owner_only.php'))->up();

        $this->assertSame(435, $buyer->refresh()->coins);
        $this->assertNotSame('char:fox', $buyer->character);
        $this->assertFalse($buyer->items()->where('item', 'char:fox')->exists());
        $this->assertSame('char:fox', $owner->refresh()->character);
        $this->assertTrue($owner->items()->where('item', 'char:fox')->exists());
    }

    public function test_adam_and_mochi_are_a_common_character_for_everybody_from_level_3(): void
    {
        $shelf = fn (User $user) => collect($this->actingAs($user)->get('/shop')->inertiaProps('catalog.avatar'))->keyBy('key');

        // on the Common shelf (levels 1 to 3) for everybody, no role needed; level 3 costs 80 SFD Coins
        $this->assertSame(
            ['key' => 'char:adammochi', 'label' => 'Adam & Mochi', 'icon' => null, 'level' => 3, 'rarity' => 'common', 'price' => 80, 'owned' => false, 'character' => true],
            $shelf($this->withRole(null))['char:adammochi'],
        );

        $low = $this->atLevel(2);
        $low->forceFill(['coins' => 500])->save();
        $this->actingAs($low)->post('/shop/buy', ['items' => [['slot' => 'avatar', 'key' => 'char:adammochi']]])->assertSessionHasErrors('items.0.key'); // level 3

        $user = $this->atLevel(3);
        $user->forceFill(['coins' => 500])->save();
        $this->actingAs($user)->post('/shop/equip', ['avatar' => 'char:adammochi'])->assertSessionHasErrors('avatar'); // has to be bought first
        $this->actingAs($user)->post('/shop/buy', ['items' => [['slot' => 'avatar', 'key' => 'char:adammochi']]])->assertSessionHasNoErrors();
        $this->actingAs($user)->post('/shop/equip', ['avatar' => 'char:adammochi'])->assertSessionHasNoErrors();
        $this->assertSame('char:adammochi', $user->refresh()->character);
        $this->assertSame(420, $user->coins);

        foreach (['standing', 'dancing', 'djing'] as $state) {
            $this->get("/characters/{$state}/adammochi")->assertOk();
        }
    }
}
