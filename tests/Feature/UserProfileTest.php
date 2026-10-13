<?php

namespace Tests\Feature;

use App\Models\Friendship;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UserProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_card_shows_public_facts_only_and_the_friendship_state(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create(['username' => 'kate_k', 'discord_username' => 'Kate D']);
        $other->forceFill([
            'youtube_channel_id' => 'UCchannel123',
            'youtube_channel_title' => 'Kate Channel',
            'youtube_access_token' => 'private-access-token',
            'youtube_refresh_token' => 'private-refresh-token',
        ])->save();
        $other->rooms()->create(['name' => 'Open', 'slug' => 'open-1']);
        $other->rooms()->create(['name' => 'Secret', 'slug' => 'secret-1', 'is_private' => true]);

        $json = $this->actingAs($me)->getJson("/api/users/{$other->id}")
            ->assertOk()
            ->assertJsonPath('username', 'kate_k')
            ->assertJsonPath('discord', 'Kate D')
            ->assertJsonPath('youtube_channel.title', 'Kate Channel')
            ->assertJsonPath('youtube_channel.url', 'https://www.youtube.com/channel/UCchannel123')
            ->assertJsonPath('friendship', 'none')
            ->assertJsonPath('is_me', false)
            ->assertJsonCount(1, 'rooms') // the private room stays hidden
            ->assertJsonPath('rooms.0.slug', 'open-1')
            ->json();
        $this->assertArrayNotHasKey('email', $json);
        $this->assertArrayNotHasKey('youtube_access_token', $json);
        $this->assertArrayNotHasKey('youtube_refresh_token', $json);

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

    public function test_profile_shows_live_listening_room_only_when_online_status_is_visible(): void
    {
        $listener = User::factory()->create(['discord_username' => 'beta']);
        $listener->forceFill(['last_seen_at' => now()])->save();
        $room = $listener->rooms()->create(['name' => 'Live room', 'slug' => 'live-room']);
        Cache::put('room_user_rooms', [$listener->id => [$room->id]], 3);

        $this->getJson("/api/users/{$listener->id}")
            ->assertOk()
            ->assertJsonPath('activity.online', true)
            ->assertJsonPath('activity.listening.slug', 'live-room');

        $listener->forceFill(['preferences' => ['privacy' => ['show_online' => false]]])->save();
        Cache::put('room_user_rooms', [$listener->id => [$room->id]], 3);
        $this->getJson("/api/users/{$listener->id}")->assertJsonPath('activity', null);

        Cache::forget('room_user_rooms');
    }
}
