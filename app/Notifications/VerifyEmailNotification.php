<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

/** The "confirm your email" message: one button, and what to do if the button does not work. */
class VerifyEmailNotification extends VerifyEmail
{
    public function toMail($notifiable): MailMessage
    {
        $url = $this->verificationUrl($notifiable);
        $minutes = config('auth.verification.expire', 60);

        return (new MailMessage)
            ->subject('Confirm your SFD-DJ.EU email address')
            ->greeting("Hi {$notifiable->name},")
            ->line("Welcome to SFD-DJ.EU! Please confirm that **{$notifiable->email}** is your email address.")
            ->action('Confirm my email', $url)
            ->line("The link works for {$minutes} minutes and only for this account. You can ask for a new one on the confirm page of the site.")
            ->line('If you did not make an account, ignore this email: nothing happens until somebody opens the link.');
    }
}
