<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExistingMemberReferralTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_accepts_a_typed_code_and_rejects_invalid_codes_before_creating_the_account(): void
    {
        $inviter = User::factory()->create();
        $this->get('/register?ref='.$inviter->referral_code)->assertInertia(fn ($p) => $p->where('referralCode', $inviter->referral_code));
        $data = ['username' => 'newlistener', 'email' => 'newlistener@example.com', 'password' => 'password-123', 'password_confirmation' => 'password-123', 'terms' => true];
        $this->post('/register', $data + ['referral_code' => 'not-a-code'])->assertSessionHasErrors('referral_code');
        $this->assertDatabaseMissing('users', ['email' => $data['email']]);
        $this->post('/register', $data + ['referral_code' => $inviter->referral_code])->assertSessionHasNoErrors();
        $this->assertSame($inviter->id, User::where('email', $data['email'])->firstOrFail()->referred_by);
        $this->assertSame(100, $inviter->refresh()->xp);
    }

    public function test_clearing_the_registration_code_opts_out_of_the_link_invite(): void
    {
        $inviter = User::factory()->create();
        $this->get('/register?ref='.$inviter->referral_code)->assertOk();
        $this->post('/register', ['username' => 'nocode', 'email' => 'nocode@example.com', 'password' => 'password-123', 'password_confirmation' => 'password-123', 'terms' => true, 'referral_code' => ''])->assertSessionHasNoErrors();
        $this->assertNull(User::where('email', 'nocode@example.com')->firstOrFail()->referred_by);
        $this->assertSame(0, $inviter->refresh()->xp);
    }

    public function test_existing_member_can_open_the_original_link_and_accept_once(): void
    {
        $inviter = User::factory()->create();
        $member = User::factory()->create();
        $this->actingAs($member)->get('/register?ref='.$inviter->referral_code)
            ->assertRedirect(route('referral', ['ref' => $inviter->referral_code]));
        $this->get('/referral?ref='.$inviter->referral_code)->assertInertia(fn ($p) => $p
            ->where('pendingCode', $inviter->referral_code)->where('invitedBy', null));
        $this->post('/referral/claim', ['code' => $inviter->referral_code])->assertRedirect('/referral');
        $this->assertSame($inviter->id, $member->refresh()->referred_by);
        $this->assertSame(100, $inviter->refresh()->xp);
        $this->assertSame(50, $inviter->coinHistory()->where('reason', 'referral')->sum('amount'));
        $this->post('/referral/claim', ['code' => $inviter->referral_code])->assertSessionHasErrors('code');
        $this->post('/referral/claim', ['code' => User::factory()->create()->referral_code])->assertSessionHasErrors('code');
        $this->assertSame(100, $inviter->refresh()->xp);
        $this->assertSame(1, $inviter->referrals()->count());
        $this->get('/referral')->assertInertia(fn ($p) => $p->where('invitedBy.id', $inviter->id));
    }

    public function test_self_invalid_and_bot_codes_are_rejected_and_guests_cannot_claim(): void
    {
        $member = User::factory()->create();
        $this->post('/referral/claim', ['code' => $member->referral_code])->assertRedirect('/login');
        $this->actingAs($member);
        foreach ([$member->referral_code, 'missing-code', User::factory()->create(['is_bot' => true])->referral_code] as $code) {
            $this->post('/referral/claim', ['code' => $code])->assertSessionHasErrors('code');
        }
        $this->assertNull($member->refresh()->referred_by);
    }

    public function test_existing_member_rewards_respect_the_same_twenty_member_coin_limit(): void
    {
        $inviter = User::factory()->create();
        User::factory()->count(20)->create(['referred_by' => $inviter->id]);
        $this->actingAs(User::factory()->create())->post('/referral/claim', ['code' => $inviter->referral_code])->assertSessionHasNoErrors();
        $this->assertSame(21, $inviter->referrals()->count());
        $this->assertSame(100, $inviter->refresh()->xp);
        $this->assertSame(0, $inviter->coinHistory()->where('reason', 'referral')->count());
    }

    public function test_signed_out_existing_members_keep_the_invite_when_logging_in(): void
    {
        $inviter = User::factory()->create();
        $this->get('/register?ref='.$inviter->referral_code)->assertOk()
            ->assertSessionHas('url.intended', route('referral', ['ref' => $inviter->referral_code]));
    }
}
