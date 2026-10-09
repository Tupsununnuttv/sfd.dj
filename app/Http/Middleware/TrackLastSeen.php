<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/** Remembers when somebody was last active, at most once every two minutes, for "online" dots and the admin overview. */
class TrackLastSeen
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && (! $user->last_seen_at || $user->last_seen_at->lt(now()->subMinutes(2)))) {
            DB::table('users')->where('id', $user->id)->update(['last_seen_at' => now()]); // query builder: leaves updated_at alone
            $user->forceFill(['last_seen_at' => now()])->syncOriginalAttribute('last_seen_at');
        }

        return $next($request);
    }
}
