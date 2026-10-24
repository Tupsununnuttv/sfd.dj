<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Controllers\DiscordController;
use App\Http\Requests\Auth\LoginRequest;
use App\Support\AccountSecurity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'discordLoginEnabled' => DiscordController::configured(),
            'discordError' => session('discord_error'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $remember = $request->boolean('remember', true);

        // 2FA users finish logging in on the challenge page.
        if ($request->user()->two_factor_enabled) {
            $user = $request->user();
            Auth::logout();
            AccountSecurity::challenge($request, $user, $remember);

            return to_route('two-factor.challenge');
        }

        Auth::login($request->user(), $remember);
        $request->session()->forget('two_factor');
        $request->session()->put('auth_version', (int) $request->user()->auth_version);
        $request->session()->regenerate(true);

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
