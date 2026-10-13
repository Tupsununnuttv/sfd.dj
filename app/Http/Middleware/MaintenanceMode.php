<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/** Site switch from the admin panel. Staff keep full access; login stays open so they can get in. */
class MaintenanceMode
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Setting::get('maintenance') === '1'
            && ! $request->user()?->hasPermission('admin.access')
            && ! $request->is('login', 'logout', 'two-factor-challenge', 'forgot-password', 'reset-password/*', 'up')) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'SFD-DJ.EU is in maintenance mode.'], 503);
            }

            return Inertia::render('Maintenance')->toResponse($request)->setStatusCode(503);
        }

        return $next($request);
    }
}
