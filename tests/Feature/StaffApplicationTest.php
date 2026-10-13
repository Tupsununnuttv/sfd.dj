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
        $page->assertOk()->assertInertia(fn (Assert $inertia) => $inertia->component('StaffApplication')->where('discord.connected', true)->where('configured', true));

        $this->actingAs($user)->post('/staff/apply', [
            'motivation' => 'I want to help the community.',
            'experience' => 'I have moderated music communities.',
            'availability' => 'Evenings UTC.',
        ])->assertRedirect(route('staff-application.create'))
            ->assertSessionHas('staff_application_notice');

        Http::assertSent(fn (HttpRequest $request) => $request->url() === 'https://discord.com/api/v10/channels/staff-channel-id/messages'
            && $request->hasHeader('Authorization', 'Bot bot-token')
            && $request['embeds'][0]['fields'][1]['value'] === 'DJ Kate (`discord-user-id)'
            && $request['components'][0]['components'][0]['label'] === 'Approve');
    }

    public function test_staff_application_requires_a_linked_discord_account(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/staff/apply', [
            'motivation' => 'I want to help the community.',
            'experience' => 'I have moderated music communities.',
            'availability' => 'Evenings UTC.',
        ])->assertRedirect(route('staff-application.create'))
            ->assertSessionHas('staff_application_error');

        Http::assertNothingSent();
    }
}
