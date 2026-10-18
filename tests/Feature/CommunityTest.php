<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class CommunityTest extends TestCase
{
    use RefreshDatabase;

    private function userWith(string ...$roles): User
    {
        $user = User::factory()->create();
        $user->forceFill(['roles' => $roles])->save();

        return $user;
    }

    public function test_admin_panel_is_staff_only_and_roles_respect_rank(): void
    {
        $member = User::factory()->create();
        $admin = $this->userWith('admin');
        $owner = $this->userWith('owner');

        $this->actingAs($member)->get('/admin')->assertForbidden();
        $this->actingAs($admin)->get('/admin')->assertOk();

        // admin can hand out lower roles...
        $this->actingAs($admin)->patch("/admin/users/{$member->id}/roles", ['roles' => ['moderator', 'vip']])->assertRedirect();
        $this->assertSame('moderator', $member->refresh()->role()->value);

        // ...but not their own rank or higher, and cannot touch someone who outranks them
        $this->actingAs($admin)->patch("/admin/users/{$member->id}/roles", ['roles' => ['admin']])->assertSessionHasErrors('roles.0');
        $this->actingAs($admin)->patch("/admin/users/{$owner->id}/roles", ['roles' => []])->assertForbidden();

        // moderators can moderate rooms but are not staff
        $this->assertTrue($member->can_moderate);
        $this->assertFalse($member->is_staff);
    }

    public function test_two_factor_login_flow_with_recovery_code(): void
    {
        $user = User::factory()->create();
        $g = new Google2FA;

        $this->actingAs($user)->post('/two-factor', ['password' => 'password']);
        $secret = $user->refresh()->two_factor_secret;
        $this->post('/two-factor/confirm', ['code' => '000000'])->assertSessionHasErrors('code');
        $this->post('/two-factor/confirm', ['code' => $g->getCurrentOtp($secret)])->assertSessionHas('recovery_codes');
        $this->assertTrue($user->refresh()->two_factor_enabled);
        $recovery = $user->two_factor_recovery_codes[0];

        $this->post('/logout');
        $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertRedirect('/two-factor-challenge');
        $this->assertGuest();

        $this->post('/two-factor-challenge', ['code' => '000000'])->assertSessionHasErrors('code');
        $this->post('/two-factor-challenge', ['recovery_code' => $recovery])->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
        $this->assertNotContains($recovery, $user->refresh()->two_factor_recovery_codes); // single use
    }

    public function test_referral_signup_rewards_referrer(): void
    {
        $referrer = User::factory()->create();

        $this->get('/register?ref='.$referrer->referral_code)->assertOk();
        $this->post('/register', [
            'username' => 'newbie', 'email' => 'new@example.com', 'password' => 'password-123', 'password_confirmation' => 'password-123', 'terms' => true,
        ])->assertRedirect('/dashboard');

        $this->assertSame(100, $referrer->refresh()->xp);
        $this->assertSame($referrer->id, User::where('email', 'new@example.com')->first()->referred_by);
        $this->actingAs($referrer)->get('/community')->assertOk();
        $this->actingAs($referrer)->get('/referral')->assertOk();
    }

    public function test_signing_up_without_an_invite_link_credits_nobody(): void
    {
        $codeless = User::factory()->create();
        $codeless->forceFill(['referral_code' => null])->save(); // an older account, from before the codes

        $this->get('/register')->assertInertia(fn (Assert $page) => $page->where('inviter', null));
        $this->post('/register', [
            'username' => 'newbie', 'email' => 'new@example.com', 'password' => 'password-123', 'password_confirmation' => 'password-123', 'terms' => true,
        ])->assertRedirect('/dashboard');

        $this->assertNull(User::where('email', 'new@example.com')->first()->referred_by);
        $this->assertSame(0, $codeless->refresh()->xp);
    }
}
