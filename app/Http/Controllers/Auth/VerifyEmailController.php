<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VerifyEmailController extends Controller
{
    /**
     * The link in the "confirm your email" message. Its signature is the proof, so it works in any browser: logged in as that account, as somebody
     * else, or not at all (it used to need that account's session and ended on a bare 403 page otherwise). It only confirms the address the message
     * went to, never one the account has changed to since.
     */
    public function __invoke(Request $request, string $id, string $hash): RedirectResponse|Response
    {
        $user = $request->hasValidSignature() ? User::find($id) : null;

        if (! $user || ! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return Inertia::render('Auth/EmailConfirmed', ['confirmed' => false, 'name' => null]);
        }

        if (! $user->hasVerifiedEmail() && $user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        if ($request->user()?->is($user)) {
            return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
        }

        return Inertia::render('Auth/EmailConfirmed', ['confirmed' => true, 'name' => $user->name]);
    }
}
