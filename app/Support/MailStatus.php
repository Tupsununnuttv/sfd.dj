<?php

namespace App\Support;

/** Can this site really send email? It can once a mail server is set up in .env (MAIL_MAILER=smtp and its login); until then a message is only written to storage/logs/laravel.log. */
final class MailStatus
{
    /** Mailers that never leave this computer: the message goes to the log or is thrown away. */
    private const LOCAL = ['log', 'array', 'null'];

    /** SMTP servers that run on this computer (a test inbox such as Mailpit): they need no login. */
    private const LOCAL_HOSTS = ['127.0.0.1', 'localhost', '::1', 'mailpit', 'mailhog'];

    public static function configured(): bool
    {
        $mailer = (string) config('mail.default');

        if (in_array($mailer, self::LOCAL, true)) {
            return false;
        }

        if ($mailer !== 'smtp') {
            return true; // ses, postmark, resend ...: their keys are checked when a message is sent
        }

        $host = (string) config('mail.mailers.smtp.host');

        return $host !== '' && ((filled(config('mail.mailers.smtp.username')) && filled(config('mail.mailers.smtp.password'))) || in_array($host, self::LOCAL_HOSTS, true));
    }

    /** What the admin panel shows. The login and the password are never part of it. */
    public static function describe(): array
    {
        $mailer = (string) config('mail.default');

        return [
            'mailer' => $mailer,
            'host' => $mailer === 'smtp' ? (string) config('mail.mailers.smtp.host') : null,
            'port' => $mailer === 'smtp' ? (int) config('mail.mailers.smtp.port') : null,
            'login_set' => filled(config('mail.mailers.smtp.username')) && filled(config('mail.mailers.smtp.password')),
            'from' => (string) config('mail.from.address'),
            'configured' => self::configured(),
        ];
    }
}
