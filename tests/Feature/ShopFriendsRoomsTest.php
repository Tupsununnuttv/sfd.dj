<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Vote;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ShopFriendsRoomsTest extends TestCase
{
    use RefreshDatabase;

    private function staff(): User
    {
        $user = User::factory()->create();
        $user->forceFill(['roles' => ['admin']])->save();

        return $user;
    }

    public function test_cosmetics_are_validated_and_badge_shows_in_badges(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/shop/cosmetic', ['slot' => 'badge', 'key' => 'rookie'])->assertRedirect();
        $this->actingAs($user)->post('/shop/cosmetic', ['slot' => 'frame', 'key' => 'silver']);
        $this->actingAs($user)->post('/shop/cosmetic', ['slot' => 'frame', 'key' => 'nope'])->assertSessionHasErrors('key');
        $this->actingAs($user)->post('/shop/cosmetic', ['slot' => 'sword', 'key' => 'x'])->assertSessionHasErrors('slot');

        $user->refresh();
        $this->assertSame(['badge' => 'rookie', 'frame' => 'silver'], $user->cosmetics);
        $this->assertSame('shop:rookie', collect($user->badges)->last()['key']);
        $this->assertSame('Rookie', collect($user->badges)->last()['label']);

        $this->actingAs($user)->post('/shop/cosmetic', ['slot' => 'badge', 'key' => null]);
        $this->assertSame(['frame' => 'silver'], $user->refresh()->cosmetics);
    }

    public function test_friends_page_lists_people_and_fans_and_adds_by_id(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $fan = User::factory()->create();
        $room = $me->rooms()->create(['name' => 'R', 'slug' => 'r-1']);
        $song = $room->enqueue(['youtube_id' => 'aaaaaaaaaaa', 'title' => 'S', 'thumbnail' => null, 'duration' => 100], $me->id);
        Vote::create(['playlist_item_id' => $song->id, 'user_id' => $fan->id, 'type' => 'woot']);

        $this->actingAs($me)->get('/friends')->assertInertia(fn (Assert $page) => $page
            ->has('people', 2)
            ->has('fans', 1, fn (Assert $f) => $f->where('name', $fan->name)->where('votes', 1)->where('linked', false)->etc()));

        $this->actingAs($me)->post('/friends', ['user_id' => $other->id])->assertRedirect();
        $this->assertDatabaseHas('friendships', ['user_id' => $me->id, 'friend_id' => $other->id, 'status' => 'pending']);

        $this->actingAs($me)->get('/friends')->assertInertia(fn (Assert $page) => $page->has('people', 1));
    }

    public function test_private_rooms_are_for_host_and_staff_only(): void
    {
        $host = User::factory()->create();
        $guest = User::factory()->create();
        $staff = $this->staff();

        $this->actingAs($host)->post('/rooms', ['name' => 'Secret', 'genre' => 'Jazz', 'is_private' => true])->assertRedirect();
        $room = $host->rooms()->first();
        $this->assertTrue($room->is_private);
        $this->assertSame('Jazz', $room->genre);

        $this->actingAs($guest)->get("/rooms/{$room->slug}")->assertForbidden();
        $this->actingAs($guest)->post("/rooms/{$room->slug}/messages", ['body' => 'hi'])->assertForbidden();
        $this->actingAs($host)->get("/rooms/{$room->slug}")->assertOk();
        $this->actingAs($staff)->get("/rooms/{$room->slug}")->assertOk();

        // hidden from the guest's dashboard, shown to host (as "mine") and staff
        $this->actingAs($guest)->get('/dashboard')->assertInertia(fn (Assert $p) => $p->has('rooms', 0));
        $this->actingAs($host)->get('/dashboard')->assertInertia(fn (Assert $p) => $p->has('rooms', 1)->has('mine', 1));
        $this->actingAs($staff)->get('/dashboard')->assertInertia(fn (Assert $p) => $p->has('rooms', 1));

        $this->actingAs($host)->post('/rooms', ['name' => 'Bad', 'genre' => 'Nonsense'])->assertSessionHasErrors('genre');
    }

    public function test_featured_rooms_by_admin_and_only_host_can_lock(): void
    {
        $host = User::factory()->create();
        $guest = User::factory()->create();
        $staff = $this->staff();
        $room = $host->rooms()->create(['name' => 'Open', 'slug' => 'open-1']);

        $this->actingAs($staff)->patch("/admin/rooms/{$room->slug}", ['is_featured' => true])->assertRedirect();
        $this->assertTrue($room->refresh()->is_featured);
        $this->actingAs($guest)->get('/dashboard')->assertInertia(fn (Assert $p) => $p->has('featured', 1));
        $this->actingAs($guest)->patch("/admin/rooms/{$room->slug}", ['is_featured' => false])->assertForbidden();

        $this->actingAs($host)->patch("/rooms/{$room->slug}", ['name' => 'Open', 'genre' => 'Lo-fi', 'is_private' => true])->assertRedirect();
        $this->assertSame(['Lo-fi', true], [$room->refresh()->genre, $room->is_private]);
    }
}
