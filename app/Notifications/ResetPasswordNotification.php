<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * The "forgot your password" email. It says which account it is (username, email, created) so people with
 * several accounts know which one to reset. It can never contain the password: those are stored only as a hash.
 */
class ResetPasswordNotification extends ResetPassword
{
    public function toMail($notifiable): MailMessage
    {
        $minutes = config('auth.passwords.'.config('auth.defaults.passwords').'.expire');

        return (new MailMessage)
            ->subject('Reset your SFD.DJ password')
            ->greeting("Hi {$notifiable->name},")
            ->line('Someone asked to reset the password of this SFD.DJ account:')
            ->line("**Username:** {$notifiable->username}")
            ->line("**Email:** {$notifiable->email}")
            ->line('**Account created:** '.$notifiable->created_at->format('j M Y'))
            ->action('Choose a new password', $this->resetUrl($notifiable))
            ->line("The link works for {$minutes} minutes.")
            ->line('If this was not you, ignore this email and your password stays as it is. For your safety we never send passwords by email, and nobody, including us, can read yours.');
    }
}
