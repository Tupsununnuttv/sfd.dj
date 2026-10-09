<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // on the live site Vercel stands in front of the app (it sets VERCEL=1): trust what it says about the visitor (https, their IP). Here nobody stands in front, so nobody is trusted
        if (getenv('VERCEL')) {
            $middleware->trustProxies(at: '*');
        }

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\BlockBannedIps::class,
            \App\Http\Middleware\MaintenanceMode::class,
            \App\Http\Middleware\TrackLastSeen::class,
        ]);

        // Stripe calls the webhook from its own servers: it signs the call instead (SubscriptionController::webhook)
        $middleware->validateCsrfTokens(except: ['stripe/webhook']);

        // "verified" only asks for a confirmed email while the site can send one (see Setting::verificationRequired)
        $middleware->alias(['verified' => \App\Http\Middleware\EnsureEmailIsVerified::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
