<?php

namespace Tests\Feature;

use App\Events\MessageSent;
use App\Events\PlaybackUpdated;
use App\Models\Room;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PlaybackRewardsTest extends TestCase
{
    use RefreshDatabase;

    private function room(User $dj, int $duration = 200): Room
    {
        Event::fake([PlaybackUpdated::class, MessageSent::class]);
        $room = $dj->rooms()->create(['name' => 'Rewards', 'slug' => 'rewards']);
        $room->enqueue(['youtube_id' => 'aaaaaaaaaaa', 'title' => 'First song', 'duration' => $duration], $dj->id);
        $room->enqueue(['youtube_id' => 'bbbbbbbbbbb', 'title' => 'Next song', 'duration' => 200], $dj->id);

        return $room->refresh();
    }

    public function test_repeated_manual_skips_award_no_xp_or_song_coins_even_after_the_duration(): void
    {
        $dj = User::factory()->create();
        $room = $this->room($dj);
        $room->update(['waitlist_cycle' => true]);
        $this->travel(4)->minutes();

        for ($i = 0; $i < 8; $i++) {
            $this->actingAs($dj)->postJson("/rooms/{$room->slug}/skip", ['item_id' => $room->refresh()->current_item_id])->assertNoContent();
        }

        $this->assertSame(0, $dj->refresh()->xp);
        $this->assertSame(0, $dj->coinHistory()->where('reason', 'song')->count());
    }

    public function test_a_forged_early_ending_cannot_skip_someone_elses_song_or_award_xp(): void
    {
        $dj = User::factory()->create();
        $room = $this->room($dj);
        $first = $room->current_item_id;
        $listener = User::factory()->create();

        $this->actingAs($listener)->postJson("/rooms/{$room->slug}/skip", ['item_id' => $first])->assertForbidden();
        $this->travel(45)->seconds();
        $this->actingAs($listener)->postJson("/rooms/{$room->slug}/skip", ['item_id' => $first, 'ended' => true])->assertNoContent();

        $this->assertSame($first, $room->refresh()->current_item_id);
        $this->assertSame(0, $dj->refresh()->xp);
        $this->assertDatabaseMissing('chat_messages', ['room_id' => $room->id, 'kind' => 'ended']);
    }

    public function test_a_natural_completion_rewards_the_dj_and_woots_once(): void
    {
        $dj = User::factory()->create();
        $room = $this->room($dj);
        $first = $room->current_item_id;
        $listener = User::factory()->create();
        Vote::create(['playlist_item_id' => $first, 'user_id' => $listener->id, 'type' => 'woot']);
        $this->travel(200)->seconds();

        $this->actingAs($listener)->postJson("/rooms/{$room->slug}/skip", ['item_id' => $first, 'ended' => true])->assertNoContent();
        $second = $room->refresh()->current_item_id;
        $this->actingAs($listener)->postJson("/rooms/{$room->slug}/skip", ['item_id' => $first, 'ended' => true])->assertNoContent();

        $this->assertNotSame($first, $second);
        $this->assertSame($second, $room->refresh()->current_item_id);
        $this->assertSame(11, $dj->refresh()->xp);
        $this->assertSame(1, $dj->coinHistory()->where('reason', 'song')->count());
        $this->assertSame(1, $room->messages()->where('kind', 'ended')->count());
    }

    public function test_stale_room_instances_cannot_double_award_or_advance_the_next_track(): void
    {
        $dj = User::factory()->create();
        $room = $this->room($dj);
        $stale = $room->fresh();
        $this->travel(200)->seconds();

        $this->assertTrue($room->advance(completed: true));
        $second = $room->current_item_id;
        $this->assertFalse($stale->advance(completed: true));

        $this->assertSame($second, $room->refresh()->current_item_id);
        $this->assertSame(10, $dj->refresh()->xp);
        $this->assertSame(1, $dj->coinHistory()->where('reason', 'song')->count());
    }

    public function test_short_and_unknown_length_tracks_can_end_but_do_not_earn_completion_rewards(): void
    {
        $dj = User::factory()->create();
        $room = $this->room($dj, 5);
        $this->travel(5)->seconds();
        $this->actingAs($dj)->postJson("/rooms/{$room->slug}/skip", ['item_id' => $room->current_item_id, 'ended' => true])->assertNoContent();
        $room->refresh()->items()->whereKey($room->current_item_id)->update(['duration' => 0]);
        $this->travel(40)->seconds();
        $this->actingAs($dj)->postJson("/rooms/{$room->slug}/skip", ['item_id' => $room->current_item_id, 'ended' => true])->assertNoContent();

        $this->assertNull($room->refresh()->current_item_id);
        $this->assertSame(0, $dj->refresh()->xp);
        $this->assertSame(0, $dj->coinHistory()->where('reason', 'song')->count());
    }

    public function test_server_sync_rewards_a_completed_song_but_removal_does_not(): void
    {
        $dj = User::factory()->create();
        $room = $this->room($dj);
        $this->travel(204)->seconds();
        $room->syncCurrent();
        $this->assertSame(10, $dj->refresh()->xp);

        $this->travel(204)->seconds();
        $room->removeItem($room->current_item_id);
        $this->assertSame(10, $dj->refresh()->xp);
        $this->assertSame(1, $dj->coinHistory()->where('reason', 'song')->count());
    }

    public function test_my_stuff_explains_actual_rewards_and_the_active_plan_multiplier(): void
    {
        $member = User::factory()->create();
        $member->forceFill(['plan' => 'plus', 'plan_until' => now()->addMonth()])->save();

        $this->actingAs($member)->get('/my-stuff')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('MyStuff')
            ->where('xpGuide.song', 10)
            ->where('xpGuide.woot', 1)
            ->where('xpGuide.minimum_play_seconds', 30)
            ->where('xpGuide.chat', 2)
            ->where('xpGuide.chat_cooldown_seconds', 10)
            ->where('xpGuide.grab', 3)
            ->where('xpGuide.referral', 100)
            ->where('xpGuide.multiplier', 1.2)
            ->where('xpGuide.plan', 'Plus')
        );
    }
}
