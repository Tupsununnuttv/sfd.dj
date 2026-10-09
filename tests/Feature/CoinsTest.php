<?php

namespace Tests\Feature;

use App\Events\PlaybackUpdated;
use App\Http\Controllers\AvatarController;
use App\Models\CoinTransaction;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** SFD Coins: how they are earned, what things cost and what buying does. */
class CoinsTest extends TestCase
{
    use RefreshDatabase;

    /** Level L starts at 20 * (L - 1)^2 XP. */
    private function atLevel(int $level, int $coins = 0): User
    {
        $user = User::factory()->create();
        $user->forceFill(['xp' => 20 * ($level - 1) ** 2, 'coins' => $coins])->save();

        return $user->refresh();
    }

    private function buy(User $user, array ...$items)
    {
        return $this->actingAs($user)->post('/shop/buy', ['items' => array_map(fn ($i) => ['slot' => $i[0], 'key' => $i[1]], $items)]);
    }

    public function test_a_new_account_starts_with_no_coins_and_the_wallet_is_on_the_shop_page(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/shop')->assertInertia(fn (Assert $page) => $page
            ->where('coins', 0)->where('daily', ['amount' => 25, 'claimable' => true])->where('history', [])
            ->has('earn', 6));
        $this->actingAs($user)->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('auth.coins', 0));
    }

    public function test_the_daily_reward_pays_25_coins_once_a_day(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/shop/daily')->assertSessionHasNoErrors();
        $this->assertSame(25, $user->refresh()->coins);

        $this->actingAs($user)->post('/shop/daily')->assertSessionHasErrors('daily');
        $this->actingAs($user)->post('/shop/daily')->assertSessionHasErrors('daily');
        $this->assertSame(25, $user->refresh()->coins, 'a second click pays nothing');
        $this->actingAs($user)->get('/shop')->assertInertia(fn (Assert $page) => $page->where('coins', 25)->where('daily.claimable', false)->where('history.0.reason', 'daily'));

        // the next day it pays again
        $this->travel(1)->day();
        $this->actingAs($user)->post('/shop/daily')->assertSessionHasNoErrors();
        $this->assertSame(50, $user->refresh()->coins);
    }

    public function test_every_new_level_pays_10_coins_times_the_level(): void
    {
        $user = User::factory()->create();

        $user->addXp(5); // still level 1
        $this->assertSame(0, (int) $user->refresh()->coins);

        $user->addXp(15); // 20 XP: level 2
        $this->assertSame(20, $user->refresh()->coins);

        $user->addXp(20 * 4 ** 2 - 20); // 320 XP: level 5, so levels 3, 4 and 5 are paid at once
        $user->refresh();
        $this->assertSame(5, $user->level);
        $this->assertSame(20 + 30 + 40 + 50, $user->coins);
        $this->assertSame(['Level 2', 'Level 3', 'Level 4', 'Level 5'], $user->coinHistory()->orderBy('id')->pluck('note')->all());

        $this->assertSame(100, User::coinsForLevel(10));
    }

    public function test_a_played_song_pays_5_coins_and_one_more_for_every_two_woots(): void
    {
        Event::fake([PlaybackUpdated::class]);
        $dj = User::factory()->create();
        $room = User::factory()->create()->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-coins']);
        $room->enqueue(['youtube_id' => 'aaaaaaaaaaa', 'title' => 'Gold Digger', 'thumbnail' => null, 'duration' => 200], $dj->id);

        foreach (User::factory()->count(5)->create() as $fan) {
            Vote::create(['playlist_item_id' => $room->current_item_id, 'user_id' => $fan->id, 'type' => 'woot']);
        }
        $this->travel(3)->minutes(); // it was heard
        $room->advance();

        $this->assertSame(5 + 2, $dj->refresh()->coins, '5 coins, and 2 more for 5 woots');
        $this->assertSame('song', $dj->coinHistory()->first()->reason);
        $this->assertSame('Gold Digger', $dj->coinHistory()->first()->note);
    }

    public function test_a_song_that_is_skipped_at_once_pays_no_coins(): void
    {
        Event::fake([PlaybackUpdated::class]);
        $dj = User::factory()->create();
        $room = User::factory()->create()->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-skip']);
        $room->enqueue(['youtube_id' => 'aaaaaaaaaaa', 'title' => 'A', 'thumbnail' => null, 'duration' => 200], $dj->id);

        $room->advance(); // nothing was heard
        $this->assertSame(0, $dj->coinHistory()->where('reason', 'song')->count());

        // a short song is heard when most of it has played; ten seconds into a long one is not enough
        $room->enqueue(['youtube_id' => 'bbbbbbbbbbb', 'title' => 'B', 'thumbnail' => null, 'duration' => 200], $dj->id);
        $this->travel(10)->seconds();
        $room->advance();
        $this->assertSame(0, $dj->coinHistory()->where('reason', 'song')->count());

        // heard for a minute, it pays
        $room->enqueue(['youtube_id' => 'ccccccccccc', 'title' => 'C', 'thumbnail' => null, 'duration' => 200], $dj->id);
        $this->travel(1)->minutes();
        $room->advance();
        $this->assertSame(1, $dj->coinHistory()->where('reason', 'song')->count());
    }

    public function test_a_grab_pays_the_owner_of_the_song_2_coins_and_only_the_first_time(): void
    {
        Event::fake([PlaybackUpdated::class]);
        $dj = User::factory()->create();
        $fan = User::factory()->create();
        $room = $dj->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-grab']);
        $room->enqueue(['youtube_id' => 'aaaaaaaaaaa', 'title' => 'A', 'thumbnail' => null, 'duration' => 200], $dj->id);
        $list = $fan->playlists()->create(['name' => 'Mine', 'kind' => 'custom']);

        $this->actingAs($fan)->postJson('/rooms/lobby-grab/vote', ['type' => 'grab', 'playlist_id' => $list->id])->assertOk();
        $this->assertSame(2, $dj->refresh()->coins);
        $this->actingAs($fan)->postJson('/rooms/lobby-grab/vote', ['type' => 'grab', 'playlist_id' => $list->id])->assertOk();
        $this->assertSame(2, $dj->refresh()->coins, 'grabbing it again pays nothing');
        $this->assertSame(0, (int) $fan->refresh()->coins, 'the one who grabs earns nothing');
    }

    public function test_a_friend_who_joins_with_your_link_pays_50_coins(): void
    {
        $referrer = User::factory()->create();

        $this->get('/register?ref='.$referrer->referral_code)->assertOk();
        $this->post('/register', ['username' => 'newbie', 'email' => 'new@example.com', 'password' => 'password-123', 'password_confirmation' => 'password-123', 'terms' => true])->assertRedirect('/dashboard');

        $this->assertSame(50, $referrer->coinHistory()->where('reason', 'referral')->value('amount'));
        $this->assertSame('newbie', $referrer->coinHistory()->where('reason', 'referral')->value('note'));
    }

    public function test_only_the_first_20_friends_pay_coins(): void
    {
        $referrer = User::factory()->create();
        User::factory()->count(20)->create(['referred_by' => $referrer->id]); // 20 friends are in already

        $this->get('/register?ref='.$referrer->referral_code)->assertOk();
        $this->post('/register', ['username' => 'friend21', 'email' => 'f21@example.com', 'password' => 'password-123', 'password_confirmation' => 'password-123', 'terms' => true])->assertRedirect('/dashboard');

        $this->assertSame(0, $referrer->coinHistory()->where('reason', 'referral')->count(), 'the 21st pays nothing');
    }

    public function test_level_1_is_free_and_the_price_grows_with_the_level(): void
    {
        foreach (['avatar' => 'char:foxy', 'badge' => 'rookie', 'accessory' => 'headphones', 'frame' => 'bronze', 'effect' => 'glow'] as $slot => $key) {
            $this->assertSame(0, AvatarController::priceOf($slot, $key), "{$slot} {$key} is free");
        }

        foreach (['badge', 'accessory', 'frame', 'effect'] as $slot) {
            $prices = collect(AvatarController::keysOf($slot))->sortBy(fn ($k) => AvatarController::levelOf($slot, $k))->map(fn ($k) => AvatarController::priceOf($slot, $k))->values();
            $this->assertSame($prices->sort()->values()->all(), $prices->all(), "the {$slot} prices rise with the level");
            $this->assertGreaterThan(0, $prices->last());
        }

        $this->assertSame(1760, AvatarController::priceOf('badge', 'legend'));
        $this->assertSame(1940, AvatarController::priceOf('frame', 'prism'));
        $this->assertSame(380, AvatarController::priceOf('avatar', 'char:robo'), 'a character costs more than a badge of the same level');
        $this->assertGreaterThan(AvatarController::priceOf('badge', 'goldenear'), AvatarController::priceOf('avatar', 'char:robo'));
        $this->assertSame(0, AvatarController::priceOf('avatar', 'char:ice'), 'a character that comes with a role has no price');
    }

    public function test_you_buy_with_coins_and_what_you_buy_is_yours_for_good(): void
    {
        $user = $this->atLevel(10, 1000);

        $this->actingAs($user)->get('/shop')->assertInertia(fn (Assert $page) => $page
            ->where('catalog.badge', fn ($badges) => $badges->firstWhere('key', 'goldenear') === ['key' => 'goldenear', 'label' => 'Golden Ear', 'icon' => null, 'level' => 10, 'rarity' => 'epic', 'price' => 190, 'owned' => false]));

        $this->buy($user, ['badge', 'goldenear'])->assertSessionHasNoErrors();
        $this->assertSame(1000 - 190, $user->refresh()->coins);
        $this->assertDatabaseHas('user_items', ['user_id' => $user->id, 'slot' => 'badge', 'item' => 'goldenear', 'price' => 190]);
        $this->assertSame(['amount' => -190, 'balance' => 810, 'reason' => 'shop', 'note' => 'Golden Ear'], $user->coinHistory()->first()->only('amount', 'balance', 'reason', 'note'));

        $this->actingAs($user)->get('/shop')->assertInertia(fn (Assert $page) => $page
            ->where('coins', 810)
            ->where('catalog.badge', fn ($badges) => $badges->firstWhere('key', 'goldenear')['owned'] === true));

        // it can be worn now, and it stays theirs when they take it off
        $this->actingAs($user)->post('/shop/cosmetic', ['slot' => 'badge', 'key' => 'goldenear'])->assertSessionHasNoErrors();
        $this->assertSame('goldenear', $user->refresh()->cosmetics['badge']);
        $this->actingAs($user)->post('/shop/cosmetic', ['slot' => 'badge', 'key' => null]);
        $this->actingAs($user)->post('/shop/cosmetic', ['slot' => 'badge', 'key' => 'goldenear'])->assertSessionHasNoErrors();
    }

    public function test_you_cannot_buy_without_the_level_or_the_coins_or_what_you_have_already(): void
    {
        $user = $this->atLevel(10, 100);

        $this->buy($user, ['badge', 'goldenear'])->assertSessionHasErrors('items');   // costs 190
        $this->buy($user, ['frame', 'aurora'])->assertSessionHasErrors('items.0.key'); // level 38
        $this->buy($user, ['badge', 'rookie'])->assertSessionHasErrors('items.0.key'); // free: already yours
        $this->buy($user, ['badge', 'nope'])->assertSessionHasErrors('items.0.key');
        $this->buy($user, ['avatar', 'char:ice'])->assertSessionHasErrors('items.0.key'); // comes with a role
        $this->actingAs($user)->post('/shop/buy', ['items' => [['slot' => 'sword', 'key' => 'x']]])->assertSessionHasErrors('items.0.slot');
        $this->actingAs($user)->post('/shop/buy', ['items' => []])->assertSessionHasErrors('items');
        $this->assertSame(100, $user->refresh()->coins);
        $this->assertDatabaseCount('user_items', 0);
        $this->assertDatabaseCount('coin_transactions', 0);

        $user->forceFill(['coins' => 1000])->save();
        $this->buy($user, ['badge', 'streak'])->assertSessionHasNoErrors();
        $this->buy($user, ['badge', 'streak'])->assertSessionHasErrors('items.0.key'); // bought
        $this->assertSame(1000 - 60, $user->refresh()->coins);
        $this->assertDatabaseCount('user_items', 1);
    }

    public function test_buying_several_things_is_all_or_nothing(): void
    {
        $user = $this->atLevel(20, 600);

        // 190 + 240 + 470 = 900: too much, so none of it is bought
        $this->buy($user, ['badge', 'goldenear'], ['accessory', 'visor'], ['badge', 'platinum'])->assertSessionHasErrors('items');
        $this->assertSame(600, $user->refresh()->coins);
        $this->assertDatabaseCount('user_items', 0);

        $user->forceFill(['coins' => 900])->save();
        $this->buy($user, ['badge', 'goldenear'], ['accessory', 'visor'], ['badge', 'platinum'], ['badge', 'platinum'])->assertSessionHasNoErrors(); // twice in the list is paid once
        $this->assertSame(0, $user->refresh()->coins);
        $this->assertSame(3, $user->items()->count());
        $this->assertSame(900, $user->items()->sum('price'));

        // one bad item in the list stops all of them
        $user->forceFill(['coins' => 5000])->save();
        $this->buy($user, ['effect', 'sparkles'], ['frame', 'prism'])->assertSessionHasErrors('items.1.key');
        $this->assertSame(5000, $user->refresh()->coins);
        $this->assertSame(3, $user->items()->count());
    }

    public function test_staff_have_everything_and_have_nothing_to_buy(): void
    {
        $staff = User::factory()->create();
        $staff->forceFill(['roles' => ['admin']])->save();

        $this->buy($staff, ['badge', 'legend'])->assertSessionHasErrors('items');
        $this->actingAs($staff)->post('/shop/outfit', ['badge' => 'legend', 'frame' => 'prism', 'effect' => 'void', 'avatar' => 'char:robo'])->assertSessionHasNoErrors();
        $this->actingAs($staff)->get('/shop')->assertInertia(fn (Assert $page) => $page
            ->where('catalog.frame', fn ($frames) => $frames->every(fn ($f) => $f['owned'] === true)));
    }

    public function test_only_what_is_yours_can_be_worn_and_what_you_already_wear_stays_yours(): void
    {
        $user = $this->atLevel(10, 1000);

        $this->actingAs($user)->post('/shop/outfit', ['accessory' => 'visor'])->assertSessionHasErrors('accessory'); // costs coins
        $this->actingAs($user)->post('/shop/outfit', ['frame' => 'aurora'])->assertSessionHasErrors('frame');       // level 38
        $this->actingAs($user)->post('/shop/equip', ['avatar' => 'char:robo'])->assertSessionHasErrors('avatar');
        $this->actingAs($user)->post('/shop/outfit', ['frame' => 'bronze', 'effect' => 'glow', 'badge' => 'rookie'])->assertSessionHasNoErrors(); // free

        $this->buy($user, ['accessory', 'visor'], ['avatar', 'char:robo'])->assertSessionHasNoErrors();
        $this->actingAs($user)->post('/shop/outfit', ['accessory' => 'visor', 'avatar' => 'char:robo'])->assertSessionHasNoErrors();
        $this->assertSame('char:robo', $user->refresh()->avatar);

        // somebody who wore it before the shop sold things keeps wearing it, and can put it on again
        $old = $this->atLevel(1);
        $old->forceFill(['cosmetics' => ['frame' => 'prism']])->save();
        $this->actingAs($old)->post('/shop/outfit', ['frame' => 'prism', 'badge' => 'rookie'])->assertSessionHasNoErrors();
        $this->actingAs($old)->post('/shop/outfit', ['effect' => 'void'])->assertSessionHasErrors('effect');
    }

    public function test_the_history_lists_what_came_and_went_newest_first(): void
    {
        $user = $this->atLevel(10, 0);
        $user->award(25, 'daily');
        $user->award(7, 'song', 'A song');
        $this->buy($user, ['badge', 'bassline'])->assertSessionHasErrors('items'); // no coins: not in the history

        $user->award(100, 'referral', 'Somebody');
        $this->buy($user, ['badge', 'bassline'])->assertSessionHasNoErrors();

        $this->actingAs($user)->get('/shop')->assertInertia(fn (Assert $page) => $page
            ->where('coins', 25 + 7 + 100 - 40)
            ->where('history', fn ($lines) => $lines->pluck('reason')->all() === ['shop', 'referral', 'song', 'daily'] && $lines->first()['amount'] === -40));
        $this->assertSame(
            [-40, 100, 7, 25],
            CoinTransaction::where('user_id', $user->id)->orderByDesc('id')->pluck('amount')->all(),
        );
    }

    public function test_coins_stay_private_they_are_only_in_your_own_data(): void
    {
        $rich = $this->atLevel(5, 4321);
        $room = $rich->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-private']);
        $other = User::factory()->create();

        $this->assertArrayNotHasKey('coins', $rich->toArray());
        $this->assertArrayNotHasKey('daily_coins_on', $rich->toArray());
        $this->actingAs($other)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $page) => $page->where('auth.coins', 0));
        $this->actingAs($other)->get('/users/'.$rich->id)->assertOk();
        $this->assertStringNotContainsString('4321', $this->actingAs($other)->get("/rooms/{$room->slug}")->getContent());
        $this->actingAs($rich)->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('auth.coins', 4321));
    }

    public function test_the_page_draws_the_wallet_and_the_buy_buttons(): void
    {
        $shop = file_get_contents(resource_path('js/Pages/Shop.tsx'));
        foreach (["route('shop.buy')", "route('shop.daily')", 'CoinIcon', 'it.price', 'it.owned'] as $needle) {
            $this->assertStringContainsString($needle, $shop);
        }
        $this->assertFileExists(resource_path('js/Components/CoinIcon.tsx'));
        $this->assertStringContainsString('CoinPill', file_get_contents(resource_path('js/Components/Sidebar.tsx')));
    }
}
