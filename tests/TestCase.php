<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /** Pretend a mail server is set up in .env (nothing is sent in a test): only then does the site ask people to confirm their email. */
    protected function mailWorks(): void
    {
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => 'smtp.example.test',
            'mail.mailers.smtp.username' => 'sender@example.test',
            'mail.mailers.smtp.password' => 'test-app-password',
        ]);
    }
}
