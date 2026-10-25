<?php

namespace App\Http\Middleware;

use App\Support\DiscordActivity;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AllowSameOriginFrames
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        // a Discord Activity is this site inside an iframe of discord.com (X-Frame-Options cannot name another site, so it is left off there)
        $activity = DiscordActivity::request($request);
        if ($activity) {
            $response->headers->remove('X-Frame-Options');
        } else {
            $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        }
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(self), geolocation=(), microphone=(self)');
        $response->headers->set('Content-Security-Policy', "base-uri 'self'; object-src 'none'; frame-ancestors 'self'".($activity ? ' https://discord.com https://*.discord.com https://*.discordsays.com' : '')."; form-action 'self'");
        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=15552000');
        }
        if ($request->user() || $request->is('api/whispers*', 'api/whisper-groups*', 'two-factor*', 'reset-password*', 'confirm-password*', 'forgot-password*', 'login')) {
            $response->headers->set('Cache-Control', 'private, no-store');
        }

        return $response;
    }
}
