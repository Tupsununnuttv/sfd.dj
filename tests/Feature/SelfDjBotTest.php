<?php

namespace Tests\Feature;

use App\Models\Playlist;
use App\Models\Room;
use App\Models\SelfDjBot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class SelfDjBotTest extends TestCase
{
    use RefreshDatabase;

    private function setupDj(): array
    {
        Event::fake();
        $user = User::factory()->create();
        $room = $user->rooms()->create(['name' => 'Night Radio', 'slug' => 'night-radio']);
        $playlist = $user->playlists()->create(['name' => 'Night Mix', 'kind' => 'custom']);
        $playlist->addSongs([
            ['youtube_id' => 'aaaaaaaaaaa', 'title' => 'First track', 'duration' => 200],
            ['youtube_id' => 'bbbbbbbbbbb', 'title' => 'Second track', 'duration' => 200],
        ]);
        $this->actingAs($user);

        return [$user, $room, $playlist];
    }

    private function createBot(Room $room, Playlist $playlist, bool $enabled = true): SelfDjBot
    {
        $this->post('/selfbots', ['name' => 'Midnight DJ', 'room' => $room->slug, 'playlist_id' => $playlist->id, 'enabled' => $enabled])->assertRedirect()->assertSessionHasNoErrors();

        return SelfDjBot::where('room_id', $room->id)->firstOrFail();
    }

    public function test_create_pause_resume_delete_and_status_without_creating_api_tokens(): void
    {
        [$user, $room, $playlist] = $this->setupDj();
        $config = $this->createBot($room, $playlist);
        $this->assertTrue($config->bot->is_bot);
        $this->assertSame(0, $config->bot->tokens()->count());
        $this->assertSame($config->bot_id, $room->refresh()->currentItem->user_id);
        $this->get('/selfbots')->assertInertia(fn ($p) => $p->component('Selfbots')->has('bots', 1)
            ->where('bots.0.status', 'playing')->where('bots.0.track', 'First track')->where('bots.0.enabled', true));
        $this->patch("/selfbots/{$config->id}/enabled", ['enabled' => false])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertNull($room->refresh()->current_item_id);
        $this->assertDatabaseMissing('room_bot_presences', ['user_id' => $config->bot_id]);
        $this->assertSame($playlist->id, $config->refresh()->playlist_id);
        $this->patch("/selfbots/{$config->id}/enabled", ['enabled' => true])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('Second track', $room->refresh()->currentItem->title);
        $this->delete("/selfbots/{$config->id}")->assertRedirect();
        $this->assertDatabaseMissing('self_dj_bots', ['id' => $config->id]);
        $this->assertDatabaseMissing('users', ['id' => $config->bot_id]);
        $this->assertDatabaseHas('rooms', ['id' => $room->id]);
        $this->assertDatabaseHas('playlists', ['id' => $playlist->id]);
        $this->assertNull($room->refresh()->current_item_id);
    }

    public function test_disabled_bot_can_be_renamed_and_moved_to_a_room_by_exact_name(): void
    {
        [$user, $room, $playlist] = $this->setupDj();
        $config = $this->createBot($room, $playlist, false);
        $this->assertNull($room->refresh()->auto_host_bot_id);
        $this->assertDatabaseMissing('room_bot_presences', ['user_id' => $config->bot_id]);
        $next = $user->rooms()->create(['name' => 'Morning Radio', 'slug' => 'morning-radio']);
        $this->put("/selfbots/{$config->id}", ['name' => 'Morning DJ', 'room' => $next->name, 'playlist_id' => $playlist->id, 'enabled' => true])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('Morning DJ', $config->refresh()->bot->name);
        $this->assertEquals($next->id, $config->room_id);
        $this->assertSame($config->bot_id, $next->refresh()->currentItem->user_id);
        // Moving an enabled bot also removes its old presence and current song.
        $this->put("/selfbots/{$config->id}", ['name' => 'Morning DJ', 'room' => $room->slug, 'playlist_id' => $playlist->id, 'enabled' => true])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertNull($next->refresh()->current_item_id);
        $this->assertDatabaseMissing('room_bot_presences', ['room_id' => $next->id, 'user_id' => $config->bot_id]);
        $this->assertSame($config->bot_id, $room->refresh()->currentItem->user_id);
    }

    public function test_other_members_cannot_manage_bots_or_use_rooms_and_playlists_they_do_not_own(): void
    {
        [$user, $room, $playlist] = $this->setupDj();
        $config = $this->createBot($room, $playlist);
        $stranger = User::factory()->create();
        $otherRoom = $stranger->rooms()->create(['name' => 'Other', 'slug' => 'other']);
        $data = ['name' => 'Other DJ', 'room' => $room->slug, 'playlist_id' => $playlist->id, 'enabled' => true];
        $this->actingAs($stranger)->get('/selfbots')->assertInertia(fn ($p) => $p->has('bots', 0));
        $this->post('/selfbots', $data)->assertSessionHasErrors('room');
        $this->post('/selfbots', array_replace($data, ['room' => $otherRoom->slug]))->assertSessionHasErrors('playlist_id');
        $this->put("/selfbots/{$config->id}", $data)->assertNotFound();
        $this->patch("/selfbots/{$config->id}/enabled", ['enabled' => false])->assertNotFound();
        $this->delete("/selfbots/{$config->id}")->assertNotFound();
        $this->assertSame(1, SelfDjBot::count());
    }

    public function test_staff_can_manage_a_room_owners_configuration(): void
    {
        [$user, $room, $playlist] = $this->setupDj();
        $config = $this->createBot($room, $playlist);
        $staff = User::factory()->create(['roles' => ['lead_moderator']]);
        $this->actingAs($staff)->get('/selfbots')->assertInertia(fn ($p) => $p->has('bots', 1));
        $this->patch("/selfbots/{$config->id}/enabled", ['enabled' => false])->assertRedirect()->assertSessionHasNoErrors();
        $this->patch("/selfbots/{$config->id}/enabled", ['enabled' => true])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertTrue($config->fresh()->enabled());
    }

    public function test_conflicts_empty_playlists_and_bot_limit_do_not_create_extra_accounts(): void
    {
        [$user, $room, $playlist] = $this->setupDj();
        $empty = $user->playlists()->create(['name' => 'Empty', 'kind' => 'custom']);
        $data = ['name' => 'Midnight DJ', 'room' => $room->slug, 'playlist_id' => $empty->id, 'enabled' => true];
        $this->post('/selfbots', $data)->assertSessionHasErrors('playlist_id');
        $this->assertSame(0, $user->bots()->count());
        $this->createBot($room, $playlist);
        $this->post('/selfbots', array_replace($data, ['playlist_id' => $playlist->id]))->assertSessionHasErrors('room');
        $this->assertSame(1, $user->bots()->count());
        User::factory()->count(4)->create(['is_bot' => true, 'bot_owner_id' => $user->id]);
        $this->post('/selfbots', array_replace($data, ['playlist_id' => $playlist->id]))->assertSessionHasErrors('name');
        $this->assertSame(5, $user->bots()->count());
    }

    public function test_djs_have_priority_even_when_cycling_and_bot_has_its_own_active_playlist(): void
    {
        [$user, $room, $playlist] = $this->setupDj();
        $config = $this->createBot($room, $playlist);
        $botList = $config->bot->playlists()->create(['name' => 'Bot API list', 'kind' => 'custom']);
        $botList->addSongs([['youtube_id' => 'ccccccccccc', 'title' => 'Must not queue', 'duration' => 200]]);
        $room->update(['waitlist_cycle' => true]);
        $human = User::factory()->create();
        $room->enqueue(['youtube_id' => 'ddddddddddd', 'title' => 'Human DJ', 'duration' => 200], $human->id);
        $room->refresh()->advance();
        $this->assertSame($human->id, $room->refresh()->currentItem->user_id);
        $this->assertSame(0, $room->items()->where('user_id', $config->bot_id)->count());
        $room->takeOut($human);
        $this->assertSame($config->bot_id, $room->refresh()->currentItem->user_id);
        $this->assertSame('Second track', $room->currentItem->title);
    }

    public function test_missing_playlist_and_banned_bot_cannot_be_enabled(): void
    {
        [$user, $room, $playlist] = $this->setupDj();
        $config = $this->createBot($room, $playlist, false);
        $room->bans()->create(['user_id' => $config->bot_id, 'banned_by' => $user->id]);
        $this->patch("/selfbots/{$config->id}/enabled", ['enabled' => true])->assertSessionHasErrors('enabled');
        $this->assertNull($room->refresh()->auto_host_bot_id);
        $playlist->delete();
        $this->get('/selfbots')->assertInertia(fn ($p) => $p->where('bots.0.status', 'needs_playlist')->where('bots.0.enabled', false));
        $this->patch("/selfbots/{$config->id}/enabled", ['enabled' => true])->assertSessionHasErrors('playlist_id');
        $this->delete("/selfbots/{$config->id}")->assertRedirect();
    }

    public function test_migration_preserves_existing_auto_hosts_and_api_accounts(): void
    {
        [$user, $room, $playlist] = $this->setupDj();
        $bot = User::factory()->create(['is_bot' => true, 'bot_owner_id' => $user->id]);
        $bot->createToken('existing');
        $room->update(['auto_host_bot_id' => $bot->id, 'auto_host_playlist_id' => $playlist->id]);
        $migration = require database_path('migrations/2026_11_16_000001_create_self_dj_bots_table.php');
        $migration->down();
        $migration->up();
        $config = SelfDjBot::firstOrFail();
        $this->assertFalse($config->managed_account);
        $this->assertTrue($config->enabled());
        $this->delete("/selfbots/{$config->id}")->assertRedirect();
        $this->assertDatabaseHas('users', ['id' => $bot->id]);
        $this->assertSame(1, $bot->tokens()->count());
    }

    public function test_legacy_controls_and_developer_deletion_stay_in_sync(): void
    {
        [$user, $room, $playlist] = $this->setupDj();
        $bot = User::factory()->create(['is_bot' => true, 'bot_owner_id' => $user->id]);
        $this->putJson('/rooms/night-radio/auto-host', ['bot_id' => $bot->id, 'playlist_id' => $playlist->id])->assertNoContent();
        $this->get('/selfbots')->assertInertia(fn ($p) => $p->has('bots', 1)->where('bots.0.enabled', true));
        $this->delete(route('developers.bots.destroy', $bot->id))->assertRedirect();
        $this->assertNull($room->refresh()->current_item_id);
        $this->assertNull($room->auto_host_bot_id);
        $this->assertDatabaseMissing('self_dj_bots', ['bot_id' => $bot->id]);
        $this->assertDatabaseMissing('room_bot_presences', ['user_id' => $bot->id]);
    }

    public function test_invalid_input_returns_validation_errors_without_creating_a_bot(): void
    {
        $this->setupDj();
        $this->post('/selfbots', ['name' => ['invalid'], 'room' => ['invalid'], 'playlist_id' => 'invalid', 'enabled' => 'invalid'])
            ->assertSessionHasErrors(['name', 'room', 'playlist_id', 'enabled']);
        $this->assertDatabaseCount('self_dj_bots', 0);
    }
}
