<?php

namespace Tests\Feature;

use App\Events\PlaybackUpdated;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Levels go from 1 to 100 and the top staff are at 100; the waitlist holds 67 people. */
class LevelsAndWaitlistLimitTest extends TestCase
{
    use RefreshDatabase;

    private function atXp(int $xp): User
    {
        $user = User::factory()->create();
        $user->forceFill(['xp' => $xp])->save();

        return $user->refresh();
    }

    public function test_the_levels_stop_at_100(): void
    {
        $this->assertSame(1, $this->atXp(0)->level);
        $this->assertSame(2, $this->atXp(20)->level);
        $this->assertSame(99, $this->atXp(User::xpFor(100) - 1)->level);
        $this->assertSame(100, $this->atXp(User::xpFor(100))->level);
        $this->assertSame(100, $this->atXp(User::xpFor(100) * 5)->level, 'more XP does not make level 101');
        $this->assertSame(196020, User::XP_FOR_MAX_LEVEL);
        $this->assertSame(User::XP_FOR_MAX_LEVEL, User::xpFor(User::MAX_LEVEL));
    }

    public function test_the_owner_developers_and_admins_are_at_level_100_and_the_others_are_not(): void
    {
        foreach (['owner', 'developer', 'admin'] as $role) {
            $user = User::factory()->create();
            $user->forceFill(['roles' => [$role]])->save();

            $this->assertSame(100, $user->refresh()->level, "{$role} is at the top");
            $this->assertGreaterThanOrEqual(User::XP_FOR_MAX_LEVEL, $user->xp);
        }

        // a member who is made an admin goes to the top; one who is not stays where the XP says
        $member = User::factory()->create();
        $this->assertSame(1, $member->level);
        $member->forceFill(['roles' => ['moderator']])->save();
        $this->assertSame(1, $member->refresh()->level);
        $member->forceFill(['roles' => ['admin']])->save();
        $this->assertSame(100, $member->refresh()->level);

        // the XP of somebody who already has more is not lowered
        $rich = $this->atXp(User::XP_FOR_MAX_LEVEL * 2);
        $rich->forceFill(['roles' => ['owner']])->save();
        $this->assertSame(User::XP_FOR_MAX_LEVEL * 2, $rich->refresh()->xp);
    }

    public function test_the_pages_know_the_top_level_has_nothing_above_it(): void
    {
        $owner = User::factory()->create();
        $owner->forceFill(['roles' => ['owner']])->save();

        $this->actingAs($owner)->get('/community')->assertInertia(fn (Assert $page) => $page
            ->where('me.level', 100)
            ->where('me.from', 196020)
            ->where('me.to', 196020));

        $level = file_get_contents(resource_path('js/lib/level.ts'));
        $this->assertStringContainsString('MAX_LEVEL = 100', $level);
        $this->assertStringContainsString('if (level >= MAX_LEVEL) return 100;', $level, 'the bar is full at the top');
    }

    public function test_the_waitlist_holds_67_people_and_the_67th_is_the_last_one_in(): void
    {
        Event::fake([PlaybackUpdated::class]);
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-67']);
        $this->assertSame(67, Room::MAX_WAITLIST);

        $people = User::factory()->count(67)->create();
        foreach ($people as $i => $person) {
            $room->enqueue(['youtube_id' => str_pad((string) $i, 11, 'x'), 'title' => "Song {$i}", 'thumbnail' => null, 'duration' => 200], $person->id);
        }
        $this->assertSame(67, $room->items()->count());

        $late = User::factory()->create();
        $list = $late->playlists()->create(['name' => 'Mix', 'kind' => 'custom']);
        $list->addSongs([['youtube_id' => 'abcdefghijk', 'title' => 'Late song', 'duration' => 100]]);

        // somebody new is turned away, and nothing was added
        $this->actingAs($late)->postJson("/rooms/{$room->slug}/join")->assertOk()->assertJson(['queued' => false, 'reason' => 'full']);
        $this->actingAs($late)->post("/rooms/{$room->slug}/queue-playlist", ['playlist_id' => $list->id])->assertSessionHasErrors('url');
        $this->assertSame(67, $room->items()->count());

        // somebody who is in the line already is told so, not "full"
        $this->actingAs($people[10])->postJson("/rooms/{$room->slug}/join")->assertOk()->assertJson(['queued' => false, 'reason' => 'already']);

        // a place frees up and the next one gets it
        $room->removeItem($room->items()->skip(5)->first()->id);
        $this->assertSame(66, $room->items()->count());
        $this->actingAs($late)->postJson("/rooms/{$room->slug}/join")->assertOk()->assertJson(['queued' => true]);
        $this->assertSame(67, $room->items()->count());

        $this->actingAs($host)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $page) => $page->where('playback.max', 67));
    }
}
