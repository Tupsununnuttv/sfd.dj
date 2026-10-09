<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use PragmaRX\Google2FA\Google2FA;

/** TOTP two-factor auth: setup/disable from the profile, and the login challenge. */
class TwoFactorController extends Controller
{
    public function __construct(private Google2FA $google2fa) {}

    public function enable(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->two_factor_enabled) {
            $user->forceFill(['two_factor_secret' => $this->google2fa->generateSecretKey()])->save();
        }

        return back();
    }

    public function confirm(Request $request): RedirectResponse
    {
        $user = $request->user();
        $code = $request->validate(['code' => ['required', 'string']])['code'];

        if (! $user->two_factor_secret || ! $this->google2fa->verifyKey($user->two_factor_secret, $code)) {
            throw ValidationException::withMessages(['code' => 'That code is not valid.']);
        }

        $codes = collect(range(1, 8))->map(fn () => Str::lower(Str::random(5).'-'.Str::random(5)))->all();
        $user->forceFill(['two_factor_confirmed_at' => now(), 'two_factor_recovery_codes' => $codes])->save();

        return back()->with('recovery_codes', $codes);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->validate(['password' => ['required', 'current_password']]);

        $request->user()->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        return back();
    }

    public function challenge(Request $request): Response|RedirectResponse
    {
        return $request->session()->has('two_factor.id')
            ? Inertia::render('Auth/TwoFactorChallenge')
            : to_route('login');
    }

    public function verify(Request $request): RedirectResponse
    {
        $user = User::find($request->session()->get('two_factor.id'));
        abort_unless($user, 403);

        $data = $request->validate(['code' => ['nullable', 'string'], 'recovery_code' => ['nullable', 'string']]);
        $recovery = $user->two_factor_recovery_codes ?? [];

        // ponytail: a valid TOTP code can be replayed inside its 30s window; store the last-used timestamp to stop that
        if (! empty($data['code']) && $this->google2fa->verifyKey($user->two_factor_secret, $data['code'])) {
            // code accepted
        } elseif (! empty($data['recovery_code']) && in_array($data['recovery_code'], $recovery, true)) {
            $user->forceFill(['two_factor_recovery_codes' => array_values(array_diff($recovery, [$data['recovery_code']]))])->save();
        } else {
            throw ValidationException::withMessages(['code' => 'That code is not valid.']);
        }

        Auth::login($user, (bool) $request->session()->pull('two_factor.remember'));
        $request->session()->forget('two_factor.id');
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
