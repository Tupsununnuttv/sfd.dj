<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SiteTest extends TestCase
{
    use RefreshDatabase;

    public function test_every_public_page_opens_for_guests(): void
    {
        $pages = ['/' => 'Welcome', '/features' => 'Site/Features', '/about' => 'Site/About', '/brand' => 'Site/Brand', '/pricing' => 'Site/Pricing', '/developers' => 'Site/Developers', '/contact' => 'Site/Contact'];
        foreach ($pages as $url => $component) {
            $this->get($url)->assertOk()->assertInertia(fn (Assert $p) => $p->component($component));
        }
        foreach (['rooms', 'music', 'chat', 'moderation', 'roles', 'avatars'] as $slug) {
            $this->get("/features/{$slug}")->assertOk()->assertInertia(fn (Assert $p) => $p->component('Site/Feature')->where('slug', $slug));
        }
        foreach (['rules', 'terms', 'privacy'] as $doc) {
            $this->get("/legal/{$doc}")->assertOk()->assertInertia(fn (Assert $p) => $p->component('Site/Legal')->where('slug', $doc));
        }
        $this->get('/features/nonsense')->assertNotFound();
        $this->get('/legal/nonsense')->assertNotFound();
    }

    public function test_friends_page_can_be_embedded_only_by_the_same_origin(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/friends')
            ->assertOk()
            ->assertHeader('X-Frame-Options', 'SAMEORIGIN');
    }

    public function test_home_shows_public_rooms_with_live_numbers_and_hides_private_ones(): void
    {
        $host = User::factory()->create();
        $open = $host->rooms()->create(['name' => 'Open', 'slug' => 'open-1']);
        $host->rooms()->create(['name' => 'Secret', 'slug' => 'secret-1', 'is_private' => true]);
        $open->enqueue(['youtube_id' => 'aaaaaaaaaaa', 'title' => 'Song A', 'thumbnail' => null, 'duration' => 200], $host->id);

        $this->get('/')->assertInertia(fn (Assert $p) => $p
            ->has('rooms', 1)
            ->where('rooms.0.slug', 'open-1')
            ->where('rooms.0.now_playing', 'Song A')
            ->where('stats.rooms', 1)
            ->where('stats.members', 1));

        // the host sees their own private room too
        $this->actingAs($host)->get('/')->assertInertia(fn (Assert $p) => $p->has('rooms', 2));
    }
}
