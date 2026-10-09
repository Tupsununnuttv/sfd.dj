<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Auth\Middleware\EnsureEmailIsVerified as Base;

/**
 * Laravel's "verified" check, but only while the site asks for it: staff can leave the confirming optional (Admin panel → Email),
 * and it is never asked for while the site cannot send email, so nobody is stuck waiting for a message that cannot come (Setting::verificationRequired).
 */
class EnsureEmailIsVerified extends Base
{
    public function handle($request, Closure $next, $redirectToRoute = null)
    {
        return Setting::verificationRequired() ? parent::handle($request, $next, $redirectToRoute) : $next($request);
    }
}
