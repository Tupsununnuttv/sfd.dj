<?php

namespace Tests\Feature;

use App\Events\SupportMessageSent;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class SupportTest extends TestCase
{
    use RefreshDatabase;

    private function staff(): User
    {
        $user = User::factory()->create();
        $user->forceFill(['roles' => ['admin']])->save();

        return $user;
    }

    public function test_a_guest_starts_a_chat_and_staff_answer_it(): void
    {
        Event::fake([SupportMessageSent::class]);
        $staff = $this->staff();

        $res = $this->postJson('/support/tickets', ['name' => 'Lost Lisa', 'email' => 'lisa@example.com', 'body' => 'I cannot log in'])->assertCreated();
        $token = $res->json('token');
        $this->assertSame(40, strlen($token));
        $this->assertSame('I cannot log in', $res->json('messages.0.body'));
        Event::assertDispatched(SupportMessageSent::class, fn ($e) => collect($e->broadcastOn())->map->name->contains("support.{$token}") && collect($e->broadcastOn())->map->name->contains('private-support-staff'));

        $this->getJson("/support/tickets/{$token}")->assertOk()->assertJsonCount(1, 'messages')->assertJsonPath('status', 'open');
        $this->getJson('/support/tickets/'.str_repeat('x', 40))->assertNotFound();

        $ticket = SupportTicket::first();
        $this->actingAs($staff)->getJson('/admin/support/tickets')->assertOk()->assertJsonPath('0.waiting', true)->assertJsonPath('0.name', 'Lost Lisa');
        $this->actingAs($staff)->postJson("/admin/support/tickets/{$ticket->id}/reply", ['body' => 'Try resetting your password'])->assertCreated()->assertJsonPath('message.sender', 'staff');
        $this->actingAs($staff)->getJson('/admin/support/tickets')->assertJsonPath('0.waiting', false);

        $this->app['auth']->forgetGuards();
        $this->getJson("/support/tickets/{$token}")->assertJsonCount(2, 'messages')->assertJsonPath('messages.1.who', $staff->name);

        // solved, then the visitor writes again: it reopens
        $this->actingAs($staff)->patchJson("/admin/support/tickets/{$ticket->id}", ['status' => 'closed'])->assertOk();
        $this->assertSame('closed', $ticket->refresh()->status);
        $this->app['auth']->forgetGuards();
        $this->postJson("/support/tickets/{$token}/messages", ['body' => 'still broken'])->assertCreated();
        $this->assertSame('open', $ticket->refresh()->status);
    }

    public function test_validation_and_staff_only_areas(): void
    {
        $member = User::factory()->create();

        $this->postJson('/support/tickets', ['name' => 'x', 'body' => 'hi'])->assertJsonValidationErrors('name');
        $this->postJson('/support/tickets', ['name' => 'Bob', 'body' => ''])->assertJsonValidationErrors('body');
        $this->postJson('/support/tickets', ['name' => 'Bob', 'email' => 'nope', 'body' => 'hi'])->assertJsonValidationErrors('email');
        $this->postJson('/support/tickets', ['name' => 'Bob', 'body' => str_repeat('a', 1001)])->assertJsonValidationErrors('body');

        $ticket = SupportTicket::create(['name' => 'Bob']);
        $this->getJson('/admin/support/tickets')->assertUnauthorized();
        $this->actingAs($member)->getJson('/admin/support/tickets')->assertForbidden();
        $this->actingAs($member)->getJson("/admin/support/tickets/{$ticket->id}")->assertForbidden();
        $this->actingAs($member)->postJson("/admin/support/tickets/{$ticket->id}/reply", ['body' => 'hi'])->assertForbidden();
        $this->actingAs($member)->patchJson("/admin/support/tickets/{$ticket->id}", ['status' => 'closed'])->assertForbidden();
    }

    public function test_the_login_page_loads_with_support_available(): void
    {
        $this->get('/login')->assertOk();
    }
}
