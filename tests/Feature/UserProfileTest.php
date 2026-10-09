<?php

namespace Tests\Feature;

use App\Models\Friendship;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UserProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_card_shows_public_facts_only_and_the_friendship_state(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create(['username' => 'kate_k', 'discord_username' => 'Kate D']);
        $other->rooms()->create(['name' => 'Open', 'slug' => 'open-1']);
        $other->rooms()->create(['name' => 'Secret', 'slug' => 'secret-1', 'is_private' => true]);

        $json = $this->actingAs($me)->getJson("/api/users/{$other->id}")
            ->assertOk()
            ->assertJsonPath('username', 'kate_k')
            ->assertJsonPath('discord', 'Kate D')
            ->assertJsonPath('friendship', 'none')
            ->assertJsonPath('is_me', false)
            ->assertJsonCount(1, 'rooms') // the private room stays hidden
            ->assertJsonPath('rooms.0.slug', 'open-1')
            ->json();
        $this->assertArrayNotHasKey('email', $json);

        $f = Friendship::create(['user_id' => $me->id, 'friend_id' => $other->id]);
        $this->getJson("/api/users/{$other->id}")->assertJsonPath('friendship', 'sent');

        $this->actingAs($other)->getJson("/api/users/{$me->id}")->assertJsonPath('friendship', 'received');
        $f->update(['status' => 'accepted']);
        $this->getJson("/api/users/{$me->id}")->assertJsonPath('friendship', 'friends');
        $this->getJson("/api/users/{$other->id}")->assertJsonPath('is_me', true);
    }

    public function test_guests_can_open_a_profile_page(): void
    {
        $other = User::factory()->create();

        $this->get("/users/{$other->id}")->assertOk()->assertInertia(fn (Assert $p) => $p->component('UserProfile')->where('profile.friendship', 'none'));
        $this->getJson("/api/users/{$other->id}")->assertOk();
    }
}
