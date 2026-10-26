<?php

namespace App\Http\Middleware;

use App\Support\DiscordActivity;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Inside Discord the site is an iframe of discord.com, so a cookie is only kept when it is SameSite=None, Secure and Partitioned
 * (Discord's networking guide). Only Activity requests get that; the normal site keeps its Lax cookies, and the two never share a cookie.
 */
class DiscordActivityCookies
{
    private const KEYS = ['session.same_site', 'session.partitioned', 'session.secure', 'session.domain'];

    public function handle(Request $request, Closure $next): Response
    {
        if (! DiscordActivity::request($request)) {
            return $next($request);
        }

        // Read the marker before EncryptCookies runs. It is a plain, HttpOnly
        // display-context cookie, never an authentication or authorization token.
        $request->attributes->set(DiscordActivity::ATTRIBUTE, true);
        $normalGuard = Auth::getDefaultDriver();
        Auth::shouldUse('discord_guest');

        $normal = config()->getMany(self::KEYS);
        config(['session.same_site' => 'none', 'session.partitioned' => true, 'session.secure' => true, 'session.domain' => null]);
        $origin = DiscordActivity::proxyOrigin();
        if ($origin) {
            URL::forceRootUrl($origin);
            URL::forceScheme('https');
        }

        try {
            if ($request->is('login', 'register', 'logout', 'auth/*', 'two-factor*', 'discord/token', 'api/v1/*')
                || (! $request->isMethodSafe() && ! ($request->is('rooms/*/watchers') && in_array($request->method(), ['POST', 'DELETE'], true)))) {
                return response()->json(['message' => 'This Activity is for watching rooms as a guest.'], 403);
            }
            $response = $next($request);
            // Survives SPA navigation, redirects and refreshes without frame_id.
            $response->headers->setCookie(cookie(DiscordActivity::COOKIE, '1', (int) config('session.lifetime', 120), '/', null, true, true, false, 'none')->withPartitioned(true));

            return $response;
        } finally {
            Auth::shouldUse($normalGuard);
            if ($origin) {
                URL::forceRootUrl(null);
                URL::forceScheme(null);
            }
            config($normal); // the cookies are already on the response; this only keeps one request from changing the next in a long-running process or test
        }
    }
}
