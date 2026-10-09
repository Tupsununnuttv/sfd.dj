<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationNotificationController extends Controller
{
    /**
     * Send a new email verification notification.
     */
    public function store(Request $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        $result = $request->user()->sendEmailVerificationNotification();
        $request->session()->put('verification_mail', $result);

        return back()->with('status', "verification-link-{$result}"); // -sent, -not-set-up or -failed
    }
}
