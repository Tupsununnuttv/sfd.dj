<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\PlaylistItem;
use App\Models\SubscriptionGift;
use App\Support\SubscriptionPerks;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class SubscriptionPerksTest extends TestCase
{
    use RefreshDatabase;

    public function test_tier_options_enforce_the_exact_effect_counts(): void
    {
        foreach (['bronze' => 0, 'silver' => 2, 'gold' => 4, 'plus' => 7, 'pro' => 12, 'premium' => 16] as $plan => $count) {
            $this->assertCount($count, SubscriptionPerks::options($plan, 'song'));
        }
        foreach (['gold' => 2, 'plus' => 4, 'pro' => 8, 'premium' => 12] as $plan => $count) {
            $this->assertCount($count, SubscriptionPerks::options($plan, 'lobby'));
        }
    }

    public function test_customization_persists_and_expiry_removes_effects_without_losing_choices(): void
    {
        Event::fake();
        $user = User::factory()->create(['plan' => 'premium', 'plan_until' => now()->addYear(), 'preferences' => ['audio' => ['default_volume' => 40]]]);
        $this->actingAs($user)->patch('/settings/subscription-perks', ['song' => 'galaxy', 'frame' => 'custom', 'theme' => 'custom', 'accent' => '#123abc', 'secondary' => '#abcdef', 'join_message' => 'Hello everyone', 'music' => 'https://youtu.be/abcdefghijk', 'badges' => 'premium'])->assertSessionHasNoErrors();
        $user->refresh();
        $this->assertSame('galaxy', $user->cosmetics['subscription']['song']);
        $this->assertSame('#123abc', $user->cosmetics['subscription']['accent']);
        $this->assertSame(40, $user->preferences['audio']['default_volume']);
        $this->assertNull($user->getRawOriginal('cosmetics'), 'Subscription styling is never stored in shop inventory.');
        $user->forceFill(['plan_until' => now()->subMinute()])->save();
        $this->assertNull($user->fresh()->cosmetics);
        $this->assertSame('galaxy', $user->preferences['subscription']['song']);
        $this->actingAs($user->fresh())->patch('/settings/subscription-perks', ['song' => 'galaxy'])->assertSessionHasErrors('song');
    }

    public function test_lower_tiers_cannot_forge_higher_perks_or_external_links_or_badges(): void
    {
        Event::fake();
        $user = User::factory()->create(['plan' => 'silver', 'plan_until' => now()->addMonth()]);
        $this->actingAs($user)->patch('/settings/subscription-perks', ['song' => 'notes'])->assertSessionHasNoErrors();
        foreach ([['song' => 'galaxy'], ['announcement' => 'Forged'], ['gradient' => 'custom'], ['music' => 'https://evil.example/track'], ['badges' => 'owner']] as $data) {
            $this->patch('/settings/subscription-perks', $data)->assertSessionHasErrors(array_keys($data)[0]);
        }
        $this->assertSame('notes', $user->fresh()->preferences['subscription']['song']);
        $this->assertArrayNotHasKey('announcement', $user->preferences['subscription'] ?? []);
    }

    public function test_priority_is_bounded_and_the_oldest_waiter_is_protected_after_three_turns(): void
    {
        $owner = User::factory()->create();
        $room = $owner->rooms()->create(['name' => 'Priority test', 'slug' => 'priority-test']);
        $waiting = collect();
        for ($index = 0; $index < 8; $index++) {
            $user = User::factory()->create($index === 7 ? ['plan' => 'premium', 'plan_until' => now()->addYear()] : []);
            $waiting->push($room->items()->create(['user_id' => $user->id, 'youtube_id' => 'abcdefghijk', 'title' => 'Song '.$index, 'duration' => 60, 'position' => $index + 1]));
        }
        $ordered = $room->priorityOrder($waiting);
        $this->assertSame(2, $ordered->search(fn ($item) => $item->id === $waiting[7]->id), 'Premium advances by five positions at most.');
        $waiting[7]->update(['position' => 2]);
        $short = collect([$waiting[0], $waiting[7]]);
        $this->assertSame($waiting[7]->id, $room->priorityOrder($short)->first()->id);
        for ($index = 0; $index < 3; $index++) {
            PlaylistItem::create(['room_id' => $room->id, 'user_id' => $owner->id, 'youtube_id' => 'abcdefghijk', 'title' => 'Played', 'duration' => 60, 'position' => 20 + $index, 'played_at' => now()->addSeconds($index)]);
        }
        $this->assertSame($waiting[0]->id, $room->priorityOrder($short)->first()->id, 'Free members get a guaranteed turn.');
    }

    public function test_default_subscription_style_does_not_change_owned_shop_cosmetics(): void
    {
        $user = User::factory()->create(['plan' => 'bronze', 'plan_until' => now()->addMonth(), 'cosmetics' => ['frame' => 'basic']]);
        $this->assertSame('bronze', $user->cosmetics['subscription']['frame']);
        $this->assertSame('basic', $user->cosmetics['frame']);
        $user->update(['cosmetics' => $user->cosmetics]);
        $this->assertSame(['frame' => 'basic'], json_decode($user->getRawOriginal('cosmetics'), true));
    }

    public function test_profile_background_upload_is_gated_and_is_removed_from_the_public_style(): void
    {
        Event::fake();
        Storage::fake('public');
        config(['filesystems.uploads' => 'public']);
        $user = User::factory()->create(['plan' => 'plus', 'plan_until' => now()->addYear()]);
        $png = fn () => UploadedFile::fake()->createWithContent('background.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII='));
        $this->actingAs($user)->post('/settings/subscription-background', ['image' => $png()])
            ->assertSessionHasNoErrors();
        $filename = $user->fresh()->preferences['subscription']['image'];
        Storage::disk('public')->assertExists('avatars/'.$filename);
        $this->assertStringContainsString($filename, $user->fresh()->cosmetics['subscription']['image']);
        $this->delete('/settings/subscription-background')->assertRedirect();
        Storage::disk('public')->assertMissing('avatars/'.$filename);
        $this->assertArrayNotHasKey('image', $user->fresh()->cosmetics['subscription']);
        $free = User::factory()->create();
        $this->actingAs($free)->post('/settings/subscription-background', ['image' => $png()])->assertForbidden();
    }

    public function test_gifted_plans_unlock_the_same_customization_and_stop_on_expiry(): void
    {
        $user = User::factory()->create(['preferences' => ['subscription' => ['song' => 'supernova']]]);
        SubscriptionGift::create(['sender_id' => User::factory()->create()->id, 'recipient_id' => $user->id, 'plan' => 'premium', 'amount' => 2099])
            ->forceFill(['paid_at' => now(), 'activated_at' => now(), 'expires_at' => now()->addMonth()])->save();
        $user->refresh();
        $this->assertSame('supernova', $user->cosmetics['subscription']['song']);
        $this->assertArrayHasKey('expires_at', $user->cosmetics['subscription']);
        $this->travel(32)->days();
        $this->assertNull($user->fresh()->cosmetics);
    }
}
