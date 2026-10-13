<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** "Your password was changed": which account, when and from where, so a stranger's change does not go unnoticed. Never contains the password. */
class PasswordChangedNotification extends Notification
{
    public function __construct(public string $ip) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your SFD-DJ.EU password was changed')
            ->greeting("Hi {$notifiable->name},")
            ->line('The password of this SFD-DJ.EU account was just changed:')
            ->line("**Username:** {$notifiable->username}")
            ->line("**Email:** {$notifiable->email}")
            ->line('**Changed:** '.now()->format('j M Y, H:i').' (UTC), from IP '.$this->ip)
            ->line('If this was you, nothing more to do. If it was not, reset your password right away.')
            ->action('Reset password', route('password.request'))
            ->line('For your safety we never send passwords by email.');
    }
}
