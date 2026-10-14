<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use App\Support\MailStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** The "confirm your email" message: it goes out when somebody signs up and when they press Send, a broken mail server never breaks the site, and while the site cannot send mail nobody has to confirm. */
class EmailConfirmationTest extends TestCase
{
    use RefreshDatabase;

    private function signUp(string $name = 'newbie')
    {
        return $this->post('/register', ['username' => $name, 'name' => $name, 'email' => "{$name}@example.com", 'password' => 'secret-pass-123', 'password_confirmation' => 'secret-pass-123', 'terms' => true]);
    }

    /** A mail server that is set up but nobody answers on its port: the way a real server being down looks. */
    private function mailIsDown(): void
    {
        config(['mail.default' => 'smtp', 'mail.mailers.smtp.host' => '127.0.0.1', 'mail.mailers.smtp.port' => 1, 'mail.mailers.smtp.username' => 'sender', 'mail.mailers.smtp.password' => 'secret', 'mail.mailers.smtp.timeout' => 2]);
    }

    private function owner(): User
    {
        $owner = User::factory()->create();
        $owner->forceFill(['roles' => ['owner']])->save();

        return $owner;
    }

    // ---------------------------------------------------------------- the message

    public function test_signing_up_sends_the_confirm_email_and_lands_on_the_confirm_page_when_it_is_asked_for(): void
    {
        Notification::fake();
        $this->mailWorks();

        $this->signUp()->assertRedirect(route('verification.notice', absolute: false));

        $user = User::where('email', 'newbie@example.com')->firstOrFail();
        $this->assertAuthenticatedAs($user);
        $this->assertNull($user->email_verified_at);
        Notification::assertSentToTimes($user, VerifyEmailNotification::class, 1);
        $this->assertSame('sent', session('verification_mail'));
        $this->get('/verify-email')->assertInertia(fn (Assert $p) => $p->component('Auth/VerifyEmail')->where('mail', 'sent')->where('required', true)->where('configured', true));
    }

    public function test_while_the_site_cannot_send_mail_a_new_member_just_gets_in(): void
    {
        // a test runs with the "array" mailer: no mail server is set up
        $this->assertFalse(MailStatus::configured());

        $this->signUp()->assertRedirect(route('dashboard', absolute: false));

        $user = User::where('email', 'newbie@example.com')->firstOrFail();
        $this->assertSame('not-set-up', session('verification_mail'));
        $this->get('/dashboard')->assertOk()->assertInertia(fn (Assert $p) => $p->where('verification.required', false)->where('verification.mail', false));
        $this->assertCount(1, app('mailer')->getSymfonyTransport()->messages(), 'the message still lands where this site writes its mail');
        $this->assertSame('Confirm your SFD-DJ.EU email address', app('mailer')->getSymfonyTransport()->messages()->first()->getOriginalMessage()->getSubject());
        $this->assertNull($user->refresh()->email_verified_at);
    }

    public function test_a_mail_server_that_is_down_does_not_break_signing_up_or_the_send_button(): void
    {
        $this->mailIsDown();

        $this->signUp()->assertRedirect(route('verification.notice', absolute: false)); // no error page: the account is made
        $user = User::where('email', 'newbie@example.com')->firstOrFail();
        $this->assertAuthenticatedAs($user);
        $this->assertSame('failed', session('verification_mail'));
        $this->get('/verify-email')->assertInertia(fn (Assert $p) => $p->where('mail', 'failed'));

        $this->post('/email/verification-notification')->assertRedirect()->assertSessionHas('status', 'verification-link-failed');
        $this->assertSame('failed', $user->sendEmailVerificationNotification());
    }

    public function test_a_mail_server_that_is_down_does_not_break_the_password_pages(): void
    {
        $user = User::factory()->create(['email' => 'kate@example.com', 'password' => Hash::make('old-pass-123')]);
        $this->mailIsDown();

        // Forgot password: no error page, the person is told the email could not go out
        $this->from('/forgot-password')->post('/forgot-password', ['email' => 'kate@example.com'])
            ->assertRedirect('/forgot-password')
            ->assertSessionHasErrors(['email' => 'We could not send the email right now. Try again in a few minutes, or ask a staff member to help you.']);

        // A new password from a reset link is saved, even though the "your password was changed" email cannot go out
        $this->post('/reset-password', ['token' => Password::createToken($user), 'email' => 'kate@example.com', 'password' => 'new-pass-456', 'password_confirmation' => 'new-pass-456'])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('login', absolute: false));
        $this->assertTrue(Hash::check('new-pass-456', $user->refresh()->password));

        // and so is a new password chosen in the profile
        $this->actingAs($user)->from('/profile')->put('/password', ['current_password' => 'new-pass-456', 'password' => 'third-pass-789', 'password_confirmation' => 'third-pass-789'])
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');
        $this->assertTrue(Hash::check('third-pass-789', $user->refresh()->password));
    }

    public function test_the_send_button_sends_again_and_says_what_became_of_it(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create();

        $this->mailWorks();
        $this->actingAs($user)->post('/email/verification-notification')->assertSessionHas('status', 'verification-link-sent');
        Notification::assertSentToTimes($user, VerifyEmailNotification::class, 1);

        config(['mail.default' => 'array']); // no mail server
        $this->actingAs($user)->post('/email/verification-notification')->assertSessionHas('status', 'verification-link-not-set-up');
        Notification::assertSentToTimes($user, VerifyEmailNotification::class, 2);

        // somebody who has confirmed has nothing to send
        $done = User::factory()->create();
        $this->actingAs($done)->post('/email/verification-notification')->assertRedirect(route('dashboard', absolute: false));
        Notification::assertNotSentTo($done, VerifyEmailNotification::class);

        // not too often
        $this->mailWorks();
        for ($i = 0; $i < 6; $i++) {
            $this->actingAs($user)->post('/email/verification-notification');
        }
        $this->actingAs($user)->post('/email/verification-notification')->assertStatus(429);
    }

    public function test_the_message_has_the_link_that_really_confirms_the_account(): void
    {
        $user = User::factory()->unverified()->create(['name' => 'Kati', 'email' => 'kati@example.com']);
        $mail = (new VerifyEmailNotification)->toMail($user);

        $this->assertSame('Confirm your SFD-DJ.EU email address', $mail->subject);
        $this->assertSame('Confirm my email', $mail->actionText);
        $html = (string) $mail->render();
        $this->assertStringContainsString('Hi Kati,', $html);
        $this->assertStringContainsString('kati@example.com', $html);
        $this->assertStringContainsString('Confirm my email', $html);
        $this->assertStringContainsString('ignore this email', $html);

        $this->actingAs($user)->get($mail->actionUrl)->assertRedirect(route('dashboard', absolute: false).'?verified=1');
        $this->assertTrue($user->refresh()->hasVerifiedEmail());
    }

    public function test_a_new_address_in_the_profile_gets_its_message_at_once(): void
    {
        Notification::fake();
        $this->mailWorks();
        $user = User::factory()->create();

        $this->actingAs($user)->patch('/profile', ['username' => $user->username, 'name' => $user->name, 'email' => 'fresh@example.com'])->assertRedirect(route('profile.edit'))->assertSessionHas('status', 'verification-link-sent');

        $this->assertNull($user->refresh()->email_verified_at);
        Notification::assertSentTo($user, VerifyEmailNotification::class);

        // the same address again changes nothing and sends nothing
        $this->actingAs($user)->patch('/profile', ['username' => $user->username, 'name' => 'Other name', 'email' => 'fresh@example.com']);
        Notification::assertSentToTimes($user, VerifyEmailNotification::class, 1);
    }

    // ---------------------------------------------------------------- who has to confirm

    public function test_confirming_is_asked_for_only_while_the_site_can_send_mail_and_staff_have_not_left_it_optional(): void
    {
        $user = User::factory()->unverified()->create();

        // the site cannot send mail: nobody is stuck, whatever the switch says
        $this->assertFalse(Setting::verificationRequired());
        Setting::put('email_verification', 'required');
        $this->assertFalse(Setting::verificationRequired());
        $this->actingAs($user)->get('/dashboard')->assertOk();
        $this->actingAs($user)->get('/shop')->assertOk();
        $this->actingAs($user)->post('/rooms', ['name' => 'Mine'])->assertRedirect(); // a room is made: the "verified" group lets them in

        // the site can send mail
        $this->mailWorks();
        $this->assertTrue(Setting::verificationRequired());
        $this->actingAs($user)->get('/dashboard')->assertRedirect(route('verification.notice'));
        $this->actingAs($user)->get('/shop')->assertRedirect(route('verification.notice'));
        $this->actingAs($user)->postJson('/rooms', ['name' => 'Again'])->assertForbidden();

        // and staff leave it optional
        Setting::put('email_verification', 'optional');
        $this->assertFalse(Setting::verificationRequired());
        $this->actingAs($user)->get('/dashboard')->assertOk();
        $this->actingAs($user)->get('/shop')->assertOk();

        // nothing chosen yet means required (and the migration put "required" in the database for this site)
        Setting::query()->where('key', 'email_verification')->delete();
        $this->assertTrue(Setting::verificationRequired());
    }

    public function test_the_page_knows_who_has_not_confirmed_and_whether_the_site_asks_for_it(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create();
        $this->actingAs($user)->get('/dashboard')->assertInertia(fn (Assert $p) => $p->where('verification', ['required' => false, 'mail' => false, 'status' => null]));

        $this->mailWorks();
        Setting::put('email_verification', 'optional');
        $this->actingAs($user)->get('/dashboard')->assertInertia(fn (Assert $p) => $p->where('verification', ['required' => false, 'mail' => true, 'status' => null]));

        $this->actingAs($user)->post('/email/verification-notification');
        $this->actingAs($user)->get('/dashboard')->assertInertia(fn (Assert $p) => $p->where('verification.status', 'verification-link-sent'));

        $this->actingAs(User::factory()->create())->get('/dashboard')->assertInertia(fn (Assert $p) => $p->where('verification', null)); // confirmed: nothing to show
    }

    public function test_the_mail_setup_is_judged_from_what_is_in_env(): void
    {
        foreach (['log', 'array', 'null'] as $mailer) {
            config(['mail.default' => $mailer]);
            $this->assertFalse(MailStatus::configured(), $mailer);
        }

        config(['mail.default' => 'smtp', 'mail.mailers.smtp.host' => 'smtp.gmail.com', 'mail.mailers.smtp.username' => null, 'mail.mailers.smtp.password' => null]); // not whatever .env on this computer holds
        $this->assertFalse(MailStatus::configured(), 'Gmail with no login');
        config(['mail.mailers.smtp.username' => 'me@gmail.com']);
        $this->assertFalse(MailStatus::configured(), 'Gmail with no password');
        config(['mail.mailers.smtp.password' => 'topsecret']);
        $this->assertTrue(MailStatus::configured());
        config(['mail.mailers.smtp.host' => '127.0.0.1', 'mail.mailers.smtp.username' => null]);
        $this->assertTrue(MailStatus::configured(), 'a test inbox on this computer needs no login');
        config(['mail.mailers.smtp.host' => '']);
        $this->assertFalse(MailStatus::configured());
        config(['mail.default' => 'resend']);
        $this->assertTrue(MailStatus::configured());

        config(['mail.default' => 'smtp', 'mail.mailers.smtp.host' => 'smtp.gmail.com', 'mail.mailers.smtp.username' => 'me@gmail.com', 'mail.mailers.smtp.password' => 'topsecret']);
        $described = MailStatus::describe();
        $this->assertTrue($described['login_set']);
        $this->assertStringNotContainsString('topsecret', json_encode($described), 'the password is never shown');
    }

    // ---------------------------------------------------------------- the admin panel

    public function test_staff_choose_who_must_confirm_and_can_confirm_somebody_by_hand(): void
    {
        $owner = $this->owner();
        $person = User::factory()->unverified()->create();

        $this->actingAs($person)->put('/admin/email', ['verification' => 'optional'])->assertForbidden();
        $this->actingAs($owner)->put('/admin/email', ['verification' => 'nonsense'])->assertSessionHasErrors('verification');
        $this->actingAs($owner)->put('/admin/email', ['verification' => 'optional'])->assertSessionHasNoErrors();
        $this->assertSame('optional', Setting::get('email_verification'));
        $this->actingAs($owner)->put('/admin/email', ['verification' => 'required']);
        $this->assertSame('required', Setting::get('email_verification'));

        $this->actingAs($person)->patch("/admin/users/{$person->id}/email")->assertForbidden();
        $this->assertNull($person->refresh()->email_verified_at);
        $this->actingAs($owner)->patch("/admin/users/{$person->id}/email")->assertRedirect();
        $this->assertTrue($person->refresh()->hasVerifiedEmail());

        $this->actingAs($owner)->get('/admin')->assertInertia(fn (Assert $p) => $p
            ->where('email.mailer', 'array')->where('email.configured', false)->where('email.choice', 'required')->where('email.enforced', false)->where('email.unverified', 0)->where('email.test', null)->has('users.data.0.email_verified'));
    }

    public function test_the_test_email_goes_to_the_staff_member_and_tells_what_happened(): void
    {
        $owner = $this->owner();

        $this->actingAs(User::factory()->create())->post('/admin/email/test')->assertForbidden();

        // no mail server: it is only written to the log, and the page says so
        $this->actingAs($owner)->post('/admin/email/test')->assertSessionHas('mail_test.ok', true)->assertSessionHas('mail_test.configured', false);
        $sent = app('mailer')->getSymfonyTransport()->messages()->first()->getOriginalMessage();
        $this->assertSame($owner->email, $sent->getTo()[0]->getAddress());
        $this->assertSame('SFD-DJ.EU test email', $sent->getSubject());
        $this->actingAs($owner)->get('/admin')->assertInertia(fn (Assert $p) => $p->where('email.test.ok', true)->where('email.test.to', $owner->email));

        // a mail server that is down: the answer is the reason, not an error page
        $this->mailIsDown();
        $this->actingAs($owner)->post('/admin/email/test')->assertSessionHas('mail_test.ok', false)->assertSessionHas('mail_test.configured', true);
        $this->assertNotSame('', session('mail_test.message'));
        $this->assertStringNotContainsString('secret', session('mail_test.message'));
    }

    // ---------------------------------------------------------------- the database and the pages

    public function test_the_database_starts_with_the_switch_set(): void
    {
        $this->assertSame('required', Setting::get('email_verification'));
    }

    public function test_the_pages_have_the_buttons_and_the_words(): void
    {
        $page = file_get_contents(base_path('resources/js/Pages/Auth/VerifyEmail.tsx'));
        foreach (['Send the confirm email', 'Send the email again', 'Continue to SFD-DJ.EU', 'data-mail-state'] as $piece) {
            $this->assertStringContainsString($piece, $page);
        }
        $this->assertStringContainsString('VerifyBanner', file_get_contents(base_path('resources/js/Layouts/AppLayout.tsx')));
        $this->assertStringContainsString('Send a test email to me', file_get_contents(base_path('resources/js/Components/admin/EmailTab.tsx')));
        $this->assertStringContainsString("'Email'", file_get_contents(base_path('resources/js/Pages/Admin.tsx')));
        $this->assertStringContainsString('Confirm email', file_get_contents(base_path('resources/js/Components/admin/UsersTab.tsx')));
        $this->assertStringContainsString('MAIL_PASSWORD', file_get_contents(base_path('.env.example')));
        $this->assertStringContainsString("version: '1.31'", file_get_contents(base_path('resources/js/lib/patchNotes.ts')));
        $this->assertStringContainsString('Do I have to confirm my email?', file_get_contents(base_path('resources/js/Pages/Faq.tsx')));
    }
}
