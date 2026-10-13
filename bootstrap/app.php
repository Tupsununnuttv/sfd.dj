<?php

use App\Http\Middleware\BlockBannedIps;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\MaintenanceMode;
use App\Http\Middleware\TrackLastSeen;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
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
        $middleware->trustProxies(at: '*', headers: Request::HEADER_X_FORWARDED_PROTO);

        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            BlockBannedIps::class,
            MaintenanceMode::class,
            TrackLastSeen::class,
        ]);

        // Stripe calls the webhook from its own servers: it signs the call instead (SubscriptionController::webhook)
        $middleware->validateCsrfTokens(except: ['stripe/webhook']);

        // "verified" only asks for a confirmed email while the site can send one (see Setting::verificationRequired)
        $middleware->alias(['verified' => EnsureEmailIsVerified::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
