<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StaffApplicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_connected_user_can_submit_a_staff_application_to_discord(): void
    {
        $user = User::factory()->create(['discord_id' => 'discord-user-id', 'discord_username' => 'DJ Kate']);
        config([
            'services.discord.bot_token' => 'bot-token',
            'services.discord.staff_applications_channel_id' => 'staff-channel-id',
        ]);
        Http::fake(['discord.com/api/v10/channels/staff-channel-id/messages' => Http::response(['id' => 'message-id'], 201)]);

        $page = $this->actingAs($user)->get('/staff/apply');
        $page->assertOk()->assertInertia(fn (Assert $inertia) => $inertia->component('StaffApplication')->where('discord.connected', true)->where('configured', true)
            // the Requirements on the page are two links straight to the Discord channels
            ->where('links', [
                ['label' => '#staff-requirements', 'url' => 'https://discord.com/channels/827767815452753950/827776116851736628'],
                ['label' => '#staff-application-questions', 'url' => 'https://discord.com/channels/827767815452753950/827776072551759912'],
            ]));

        $this->actingAs($user)->post('/staff/apply', [
            'motivation' => 'I want to help the community.',
            'experience' => 'I have moderated music communities.',
            'availability' => 'Evenings UTC.',
        ])->assertRedirect(route('staff-application.create'))
            ->assertSessionHas('staff_application_notice');

        Http::assertSent(fn (HttpRequest $request) => $request->url() === 'https://discord.com/api/v10/channels/staff-channel-id/messages'
            && $request->hasHeader('Authorization', 'Bot bot-token')
            && $request['embeds'][0]['fields'][1]['value'] === 'DJ Kate (`discord-user-id)'
            && str_contains($request['embeds'][0]['description'], '[#staff-requirements](https://discord.com/channels/827767815452753950/827776116851736628)')
            && $request['components'][0]['components'][0]['label'] === 'Approve');
    }

    public function test_somebody_without_a_linked_discord_account_can_apply_too(): void
    {
        $user = User::factory()->create();
        config([
            'services.discord.bot_token' => 'bot-token',
            'services.discord.staff_applications_channel_id' => 'staff-channel-id',
        ]);
        Http::fake(['discord.com/api/v10/channels/staff-channel-id/messages' => Http::response(['id' => 'message-id'], 201)]);

        $this->actingAs($user)->get('/staff/apply')->assertOk()
            ->assertInertia(fn (Assert $inertia) => $inertia->component('StaffApplication')->where('discord.connected', false)->where('configured', true));

        $this->actingAs($user)->post('/staff/apply', [
            'motivation' => 'I want to help the community.',
            'experience' => 'I have moderated music communities.',
            'availability' => 'Evenings UTC.',
        ])->assertRedirect(route('staff-application.create'))
            ->assertSessionHas('staff_application_notice')
            ->assertSessionMissing('staff_application_error');

        // the staff see who it is from the website account, and the buttons carry "none" instead of a Discord ID
        Http::assertSent(fn (HttpRequest $request) => $request->url() === 'https://discord.com/api/v10/channels/staff-channel-id/messages'
            && str_contains($request['embeds'][0]['fields'][0]['value'], route('users.show', $user))
            && $request['embeds'][0]['fields'][1]['value'] === 'Not connected'
            && str_ends_with($request['components'][0]['components'][0]['custom_id'], ':none')
            && str_ends_with($request['components'][0]['components'][1]['custom_id'], ':none'));
    }

    public function test_the_application_still_needs_a_login_and_the_staff_channel_to_be_set_up(): void
    {
        $this->get('/staff/apply')->assertRedirect(route('login'));

        config(['services.discord.bot_token' => null, 'services.discord.staff_applications_channel_id' => null]);
        $this->actingAs(User::factory()->create())->post('/staff/apply', [
            'motivation' => 'I want to help the community.',
            'experience' => 'I have moderated music communities.',
            'availability' => 'Evenings UTC.',
        ])->assertRedirect(route('staff-application.create'))
            ->assertSessionHas('staff_application_error');

        Http::assertNothingSent();
    }
}
