<?php

namespace App\Http\Middleware;

use App\Support\DiscordActivity;
use Closure;
use Illuminate\Http\Request;
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

        $normal = config()->getMany(self::KEYS);
        config(['session.same_site' => 'none', 'session.partitioned' => true, 'session.secure' => true, 'session.domain' => null]);

        try {
            return $next($request);
        } finally {
            config($normal); // the cookies are already on the response; this only keeps one request from changing the next in a long-running process or test
        }
    }
}
