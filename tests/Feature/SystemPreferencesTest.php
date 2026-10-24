<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SystemPreferencesTest extends TestCase
{
    use RefreshDatabase;

    public function test_system_settings_are_private_and_preferences_merge_without_changing_audio_or_custom_choices(): void
    {
        $this->get('/settings/system')->assertRedirect('/login');
        $this->patchJson('/settings/preferences', ['system' => ['low_performance' => true]])->assertUnauthorized();
        $user = User::factory()->create(['preferences' => ['audio' => ['default_volume' => 35], 'appearance' => ['always_animate' => true], 'system' => ['animated_characters' => false]]]);
        $this->actingAs($user)->get('/settings/system')->assertOk()->assertInertia(fn ($page) => $page->component('Settings/System'));
        $this->patchJson('/settings/preferences', ['system' => ['low_performance' => true]])->assertOk()
            ->assertJsonPath('preferences.system.low_performance', true)->assertJsonPath('preferences.system.animated_characters', false)
            ->assertJsonPath('preferences.audio.default_volume', 35)->assertJsonPath('preferences.appearance.always_animate', true);
        $this->patchJson('/settings/preferences', ['system' => ['low_performance' => false]])->assertOk()->assertJsonPath('preferences.system.animated_characters', false);
        $this->actingAs($user->fresh())->get('/settings/system')->assertInertia(fn ($page) => $page->where('auth.user.preferences.system.low_performance', false)->where('auth.user.preferences.system.animated_characters', false));
    }

    public function test_system_preferences_reject_invalid_values_and_fake_browser_hardware_settings(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->patchJson('/settings/preferences', ['system' => ['low_performance' => 'invalid']])->assertUnprocessable()->assertJsonValidationErrors('system.low_performance');
        $this->patchJson('/settings/preferences', ['system' => ['hardware_acceleration' => true]])->assertUnprocessable()->assertJsonValidationErrors('system');
        $this->patchJson('/settings/preferences', ['system' => 'invalid'])->assertUnprocessable();
        $this->assertNull($user->fresh()->preferences);
    }

    public function test_accepted_numeric_boolean_inputs_are_stored_as_actual_booleans(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->patchJson('/settings/preferences', ['system' => ['low_performance' => '1']])->assertOk()->assertJsonPath('preferences.system.low_performance', true);
        $this->patchJson('/settings/preferences', ['system' => ['low_performance' => '0']])->assertOk()->assertJsonPath('preferences.system.low_performance', false);
        $this->assertFalse($user->fresh()->pref('system.low_performance'));
    }
}
