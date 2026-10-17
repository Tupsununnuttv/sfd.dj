<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoomDeletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_and_site_staff_can_delete_rooms(): void
    {
        $owner = User::factory()->create();
        $staff = User::factory()->create(['roles' => ['lead_moderator']]);
        $this->assertTrue($staff->is_staff);

        foreach ([$owner, $staff] as $actor) {
            $room = $owner->rooms()->create(['name' => 'Delete me', 'slug' => 'delete-me']);
            $message = $room->messages()->create(['user_id' => $owner->id, 'body' => 'Hello']);
            $this->actingAs($actor)->get('/rooms/'.$room->slug)
                ->assertInertia(fn ($page) => $page->where('can.delete_room', true));
            $this->actingAs($actor)->delete('/rooms/'.$room->slug)->assertRedirect(route('dashboard'));
            $this->assertDatabaseMissing('rooms', ['id' => $room->id]);
            $this->assertDatabaseMissing('chat_messages', ['id' => $message->id]);
            $this->assertDatabaseMissing('room_roles', ['room_id' => $room->id]);
        }
    }

    public function test_guest_member_and_room_cohost_cannot_delete(): void
    {
        $owner = User::factory()->create();
        $room = $owner->rooms()->create(['name' => 'Keep me', 'slug' => 'keep-me']);
        $this->delete('/rooms/'.$room->slug)->assertRedirect(route('login'));

        $member = User::factory()->create();
        $cohost = User::factory()->create();
        $room->members()->create(['user_id' => $cohost->id, 'room_role_id' => $room->roles()->where('name', 'Co-Host')->firstOrFail()->id]);
        foreach ([$member, $cohost] as $actor) {
            $this->actingAs($actor)->get('/rooms/'.$room->slug)
                ->assertInertia(fn ($page) => $page->where('can.delete_room', false));
            $this->actingAs($actor)->delete('/rooms/'.$room->slug)->assertForbidden();
        }
        $this->assertDatabaseHas('rooms', ['id' => $room->id]);
    }
}
