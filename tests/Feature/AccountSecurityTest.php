<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class AccountSecurityTest extends TestCase
{
    use RefreshDatabase;

    private function securedUser(): User
    {
        return User::factory()->create([
            'two_factor_secret' => (new Google2FA)->generateSecretKey(),
            'two_factor_confirmed_at' => now(),
            'two_factor_recovery_codes' => ['one-use-code', 'spare-code'],
        ]);
    }

    private function challenge(User $user): void
    {
        Auth::logout();
        $this->flushSession();
        $this->post('/login', ['email' => $user->email, 'password' => 'password', 'remember' => true])
            ->assertRedirect('/two-factor-challenge')->assertSessionHas('two_factor.started_at');
        $this->assertGuest();
    }

    public function test_authenticator_codes_cannot_be_reused_for_a_second_login(): void
    {
        $user = $this->securedUser();
        $code = (new Google2FA)->getCurrentOtp($user->two_factor_secret);
        $this->challenge($user);
        $this->post('/two-factor-challenge', ['code' => $code])->assertSessionHasNoErrors()->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
        $this->assertGreaterThan(0, $user->fresh()->two_factor_last_used_at);

        $this->challenge($user);
        $this->post('/two-factor-challenge', ['code' => $code])->assertSessionHasErrors('code');
        $this->assertGuest();
        $this->post('/two-factor-challenge', ['recovery_code' => 'one-use-code'])->assertSessionHasNoErrors();
        $this->assertAuthenticatedAs($user);
        $this->assertSame(['spare-code'], $user->fresh()->two_factor_recovery_codes);
    }

    public function test_expired_and_revoked_challenges_cannot_authenticate(): void
    {
        $user = $this->securedUser();
        $this->challenge($user);
        $this->withSession(['two_factor.started_at' => now()->subMinutes(6)->timestamp]);
        $this->post('/two-factor-challenge', ['recovery_code' => 'one-use-code'])->assertRedirect('/login')->assertSessionMissing('two_factor');
        $this->assertGuest();
        $this->challenge($user);
        $user->increment('auth_version');
        $this->post('/two-factor-challenge', ['recovery_code' => 'one-use-code'])->assertSessionHasErrors('code');
        $this->assertGuest();
        $this->assertContains('one-use-code', $user->fresh()->two_factor_recovery_codes);
    }

    public function test_challenge_attempts_are_limited_across_browser_sessions(): void
    {
        $user = $this->securedUser();
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->challenge($user);
            $this->post('/two-factor-challenge', ['recovery_code' => 'invalid-code'])->assertSessionHasErrors('code');
        }
        $this->challenge($user);
        $this->post('/two-factor-challenge', ['recovery_code' => 'one-use-code'])->assertSessionHasErrors('code');
        $this->assertGuest();
    }

    public function test_security_changes_require_the_password_and_second_factor(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->post('/two-factor')->assertSessionHasErrors('password');
        $this->assertNull($user->fresh()->two_factor_secret);

        $user = $this->securedUser();
        $this->actingAs($user)->delete('/two-factor', ['password' => 'password'])->assertSessionHasErrors('code');
        $this->assertTrue($user->fresh()->two_factor_enabled);
        $this->delete('/two-factor', ['password' => 'password', 'code' => 'one-use-code'])->assertSessionHasNoErrors();
        $this->assertFalse($user->fresh()->two_factor_enabled);
        $this->assertSame(1, $user->fresh()->auth_version);
        $this->get('/settings/account')->assertOk();
    }

    public function test_email_changes_require_the_current_password(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->patch('/profile', ['name' => $user->name, 'email' => 'changed@example.test'])
            ->assertSessionHasErrors('current_password');
        $this->assertSame($user->email, $user->fresh()->email);
    }

    public function test_password_changes_revoke_old_sessions_remember_tokens_and_api_tokens(): void
    {
        Notification::fake();
        $user = User::factory()->create(['remember_token' => 'previous-remember-token']);
        $user->createToken('old-device');
        $this->actingAs($user)->put('/password', ['current_password' => 'password', 'password' => 'new-password-123', 'password_confirmation' => 'new-password-123'])->assertSessionHasNoErrors();
        $user->refresh();
        $this->assertSame(1, $user->auth_version);
        $this->assertNotSame('previous-remember-token', $user->remember_token);
        $this->assertSame(0, $user->tokens()->count());
        $this->get('/settings/account')->assertOk();

        // Old file/Redis sessions are rejected too, even without rows in the sessions table.
        $this->actingAs($user)->withSession(['auth_version' => 0])->getJson('/settings/account')->assertUnauthorized();
        $this->assertGuest();
    }

    public function test_password_reset_revokes_preexisting_access(): void
    {
        Notification::fake();
        $user = User::factory()->create();
        $user->createToken('old-device');
        $token = Password::createToken($user);
        $this->post('/reset-password', ['token' => $token, 'email' => $user->email, 'password' => 'new-password-123', 'password_confirmation' => 'new-password-123'])->assertSessionHasNoErrors();
        $this->assertSame(1, $user->fresh()->auth_version);
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_web_headers_protect_private_pages_and_allow_same_origin_overlays(): void
    {
        $this->get('https://localhost/login')->assertOk()
            ->assertHeader('X-Frame-Options', 'SAMEORIGIN')->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('Strict-Transport-Security', 'max-age=15552000')
            ->assertHeader('Permissions-Policy', 'camera=(self), geolocation=(), microphone=(self)');
        $response = $this->actingAs(User::factory()->create())->get('/settings/account')->assertOk();
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertStringContainsString("frame-ancestors 'self'", $response->headers->get('Content-Security-Policy'));
    }
}
