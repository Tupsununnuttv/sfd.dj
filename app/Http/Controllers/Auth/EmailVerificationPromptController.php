<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Support\MailStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    /**
     * Display the email verification prompt.
     */
    public function __invoke(Request $request): RedirectResponse|Response
    {
        return $request->user()->hasVerifiedEmail()
                    ? redirect()->intended(route('dashboard', absolute: false))
                    : Inertia::render('Auth/VerifyEmail', [
                        'status' => session('status'),
                        'mail' => session('verification_mail'), // sent, not-set-up or failed: what became of the message, or null if nobody asked for one yet
                        'required' => Setting::verificationRequired(), // false: they may carry on without confirming
                        'configured' => MailStatus::configured(),
                    ]);
    }
}
