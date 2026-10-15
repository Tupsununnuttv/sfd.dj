<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_email_verification_screen_can_be_rendered(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user)->get('/verify-email');

        $response->assertStatus(200);
    }

    public function test_email_can_be_verified(): void
    {
        $user = User::factory()->unverified()->create();

        Event::fake();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $response = $this->actingAs($user)->get($verificationUrl);

        Event::assertDispatched(Verified::class);
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $response->assertRedirect(route('dashboard', absolute: false).'?verified=1');
    }

    public function test_email_is_not_verified_with_invalid_hash(): void
    {
        $user = User::factory()->unverified()->create();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1('wrong-email')]
        );

        $this->actingAs($user)->get($verificationUrl);

        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_the_link_works_without_being_logged_in(): void
    {
        $user = User::factory()->unverified()->create();

        $this->get($this->link($user))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Auth/EmailConfirmed')->where('confirmed', true)->where('name', $user->name));

        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }

    public function test_the_link_works_while_logged_in_as_somebody_else(): void
    {
        $user = User::factory()->unverified()->create();
        $other = User::factory()->unverified()->create();

        $this->actingAs($other)->get($this->link($user))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Auth/EmailConfirmed')->where('confirmed', true));

        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $this->assertFalse($other->fresh()->hasVerifiedEmail());
    }

    public function test_an_expired_link_explains_itself_instead_of_a_403(): void
    {
        $user = User::factory()->unverified()->create();

        $this->get($this->link($user, now()->subMinute()))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Auth/EmailConfirmed')->where('confirmed', false));

        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    private function link(User $user, ?\DateTimeInterface $expires = null): string
    {
        return URL::temporarySignedRoute('verification.verify', $expires ?? now()->addMinutes(60), ['id' => $user->id, 'hash' => sha1($user->email)]);
    }
}
