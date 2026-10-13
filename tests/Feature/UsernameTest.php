<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\PasswordChangedNotification;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class UsernameTest extends TestCase
{
    use RefreshDatabase;

    private function register(array $over = [])
    {
        return $this->post('/register', $over + ['username' => 'dj_kate', 'email' => 'kate@example.com', 'password' => 'password-123', 'password_confirmation' => 'password-123', 'terms' => true]);
    }

    public function test_registration_needs_a_valid_unique_username_and_display_name_is_optional(): void
    {
        $this->register()->assertRedirect('/dashboard');
        $user = User::where('email', 'kate@example.com')->first();
        $this->assertSame('dj_kate', $user->username);
        $this->assertSame('dj_kate', $user->name); // no display name given: falls back to the username

        $this->post('/logout');
        $this->register(['email' => 'b@example.com', 'username' => 'DJ_KATE'])->assertSessionHasErrors('username');
    }

    public function test_bad_usernames_are_rejected_and_display_names_may_repeat(): void
    {
        $this->register(['username' => 'ab'])->assertSessionHasErrors('username');
        $this->register(['username' => 'has space'])->assertSessionHasErrors('username');
        $this->register(['username' => str_repeat('a', 21)])->assertSessionHasErrors('username');

        $this->register(['name' => 'Kate'])->assertRedirect('/dashboard');
        $this->post('/logout');
        $this->register(['name' => 'Kate', 'username' => 'kate_two', 'email' => 'k2@example.com'])->assertRedirect('/dashboard');
        $this->assertSame(2, User::where('name', 'Kate')->count());
    }

    public function test_profile_edits_username_and_display_name(): void
    {
        $me = User::factory()->create(['username' => 'old_handle', 'name' => 'Old']);
        $other = User::factory()->create(['username' => 'taken_one']);

        $this->actingAs($me)->patch('/profile', ['username' => 'taken_one', 'name' => 'New', 'email' => $me->email])->assertSessionHasErrors('username');
        $this->actingAs($me)->patch('/profile', ['username' => 'new_handle', 'name' => 'Fancy Name', 'email' => $me->email])->assertSessionHasNoErrors();

        $me->refresh();
        $this->assertSame(['new_handle', 'Fancy Name'], [$me->username, $me->name]);
        $this->assertSame($other->id, User::where('username', 'taken_one')->first()->id);
    }

    public function test_friends_are_found_by_username(): void
    {
        $me = User::factory()->create();
        $kate = User::factory()->create(['username' => 'dj_kate', 'name' => 'Kate']);
        User::factory()->create(['name' => 'Kate']); // same display name, different person

        $this->actingAs($me)->post('/friends', ['name' => 'DJ_Kate'])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('friendships', ['user_id' => $me->id, 'friend_id' => $kate->id]);
    }

    public function test_login_works_with_email_or_username(): void
    {
        $user = User::factory()->create(['username' => 'dj_kate', 'email' => 'kate@example.com', 'password' => 'password-123']);

        foreach (['kate@example.com', 'KATE@example.com', 'dj_kate', 'DJ_Kate', ' dj_kate '] as $login) {
            $this->post('/login', ['email' => $login, 'password' => 'password-123'])->assertRedirect('/dashboard');
            $this->assertAuthenticatedAs($user);
            $this->post('/logout');
        }

        $this->post('/login', ['email' => 'dj_kate', 'password' => 'wrong'])->assertSessionHasErrors('email');
        $this->post('/login', ['email' => 'nobody', 'password' => 'password-123'])->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_password_emails_name_the_account_but_never_contain_the_password(): void
    {
        Notification::fake();
        $user = User::factory()->create(['username' => 'dj_kate', 'name' => 'Kate', 'email' => 'kate@example.com', 'password' => 'old-secret-1']);

        $this->post('/forgot-password', ['email' => 'kate@example.com'])->assertSessionHasNoErrors();

        Notification::assertSentTo($user, ResetPasswordNotification::class, function ($n) use ($user) {
            $text = $n->toMail($user)->render()->toHtml();
            $this->assertStringContainsString('dj_kate', $text);
            $this->assertStringContainsString('kate@example.com', $text);
            $this->assertStringContainsString('Account created', $text);
            $this->assertStringNotContainsString('old-secret-1', $text);

            return true;
        });

        // finishing the reset sends the "was changed" mail, again without any password
        $token = Password::createToken($user);
        $this->post('/reset-password', ['token' => $token, 'email' => 'kate@example.com', 'password' => 'brand-new-pass-9', 'password_confirmation' => 'brand-new-pass-9'])->assertRedirect('/login');

        Notification::assertSentTo($user, PasswordChangedNotification::class, function ($n) use ($user) {
            $text = $n->toMail($user)->render()->toHtml();
            $this->assertStringContainsString('dj_kate', $text);
            $this->assertStringNotContainsString('brand-new-pass-9', $text);

            return true;
        });
    }

    public function test_forgot_password_takes_a_username_and_shows_a_dev_link_only_on_your_own_computer_without_mail(): void
    {
        Notification::fake();
        $user = User::factory()->create(['username' => 'dj_kate']);

        // local + mail "log" + this computer: the link is shown on the page
        $this->app['env'] = 'local';
        config(['mail.default' => 'log']);
        $this->withoutMiddleware(PreventRequestForgery::class); // "local" turns the CSRF check on
        $this->from('/forgot-password')->post('/forgot-password', ['email' => 'DJ_Kate'])->assertSessionHas('dev_reset_link');
        Notification::assertSentTo($user, ResetPasswordNotification::class);
        $this->assertStringContainsString('/reset-password/', session('dev_reset_link'));

        // a real mailer: never shown
        $user->refresh();
        DB::table('password_reset_tokens')->delete();
        config(['mail.default' => 'smtp']);
        $this->post('/forgot-password', ['email' => $user->email])->assertSessionMissing('dev_reset_link')->assertSessionHas('status');

        // someone else's computer: never shown
        DB::table('password_reset_tokens')->delete();
        config(['mail.default' => 'log']);
        $this->withServerVariables(['REMOTE_ADDR' => '8.8.8.8'])->post('/forgot-password', ['email' => $user->email])->assertSessionMissing('dev_reset_link');
    }
}
