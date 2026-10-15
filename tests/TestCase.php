<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Http;

abstract class TestCase extends BaseTestCase
{
    /**
     * Before RefreshDatabase empties anything: the tests run on the in-memory database from phpunit.xml and nowhere else. Anything else (a cached
     * config, a DB_DATABASE that leaked in) would be a real database, so stop at once.
     */
    protected function setUpTraits()
    {
        $connection = config('database.default');
        $database = config("database.connections.{$connection}.database");

        if ($connection !== 'sqlite' || $database !== ':memory:') {
            throw new \RuntimeException("The tests refuse to run on {$connection}:{$database}. Run php artisan config:clear and try again.");
        }

        return parent::setUpTraits();
    }

    /** A test that reaches the real Stripe, YouTube, Discord ... is a bug (one once made a live Stripe checkout page): every call a test makes has to be faked. */
    protected function setUp(): void
    {
        parent::setUp();

        Http::preventStrayRequests();
    }

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
