<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** For pages guests may open: anyone logged in must still have a verified email, while the site asks for one (Setting::verificationRequired). */
class VerifiedIfLoggedIn
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->hasVerifiedEmail() && Setting::verificationRequired()) {
            return redirect()->route('verification.notice');
        }

        return $next($request);
    }
}
