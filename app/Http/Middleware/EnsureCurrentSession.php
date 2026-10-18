<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureCurrentSession
{
    public function handle(Request $request, Closure $next): Response
    {
        // Token-authenticated API requests use Sanctum's RequestGuard, not browser sessions.
        $guard = Auth::guard('web');
        if ($user = $guard->user()) {
            // A fresh remember-me login has already verified the rotated remember token.
            if ($guard->viaRemember()) {
                $request->session()->put('auth_version', (int) $user->auth_version);
            }
            if ((int) $request->session()->get('auth_version', 0) !== (int) $user->auth_version) {
                $guard->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return $request->expectsJson() ? response()->json(['message' => 'Your session has expired. Please log in again.'], 401) : redirect()->route('login');
            }
        }

        return $next($request);
    }
}
