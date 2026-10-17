<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\AccountSecurity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
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
        $request->validate(['password' => ['required', 'current_password']]);
        $user = $request->user();

        if (! $user->two_factor_enabled) {
            $user->forceFill(['two_factor_secret' => $this->google2fa->generateSecretKey(), 'two_factor_last_used_at' => null])->save();
        }

        return back();
    }

    public function confirm(Request $request): RedirectResponse
    {
        $user = $request->user();
        $code = $request->validate(['code' => ['required', 'string', 'regex:/^\d{6}$/']])['code'];
        abort_if($user->two_factor_enabled, 422, 'Two-factor authentication is already enabled.');

        $step = $user->two_factor_secret ? $this->google2fa->verifyKeyNewer($user->two_factor_secret, $code, 0, 1, (int) floor(now()->timestamp / 30)) : false;
        if ($step === false) {
            throw ValidationException::withMessages(['code' => 'That code is not valid.']);
        }

        $codes = collect(range(1, 8))->map(fn () => Str::lower(Str::random(5).'-'.Str::random(5)))->all();
        $user->forceFill(['two_factor_confirmed_at' => now(), 'two_factor_recovery_codes' => $codes, 'two_factor_last_used_at' => $step])->save();
        AccountSecurity::revoke($user, $request, false);

        return back()->with('recovery_codes', $codes);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $data = $request->validate(['password' => ['required', 'current_password'], 'code' => ['required', 'string', 'max:64']]);
        DB::transaction(function () use ($request, $data) {
            $user = User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            if (! $this->consumeCode($user, $data['code'], $data['code'])) {
                throw ValidationException::withMessages(['code' => 'Enter a valid authenticator or unused recovery code.']);
            }
            $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
            'two_factor_last_used_at' => null,
        ])->save();
        });
        AccountSecurity::revoke($request->user()->refresh(), $request, false);

        return back();
    }

    public function challenge(Request $request): Response|RedirectResponse
    {
        return $request->session()->has('two_factor.id') && $request->session()->get('two_factor.started_at', 0) >= now()->subMinutes(5)->timestamp
            ? Inertia::render('Auth/TwoFactorChallenge')
            : to_route('login');
    }

    public function verify(Request $request): RedirectResponse
    {
        $data = $request->validate(['code' => ['nullable', 'string', 'max:6'], 'recovery_code' => ['nullable', 'string', 'max:64']]);
        if ($request->session()->get('two_factor.started_at', 0) < now()->subMinutes(5)->timestamp) {
            $request->session()->forget('two_factor');
            return to_route('login')->withErrors(['email' => 'Your login attempt expired. Please sign in again.']);
        }
        $key = 'two-factor:'.$request->session()->get('two_factor.id');
        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw ValidationException::withMessages(['code' => 'Too many attempts. Please wait a minute and try again.']);
        }
        $user = DB::transaction(function () use ($request, $data) {
            $user = User::whereKey($request->session()->get('two_factor.id'))->lockForUpdate()->first();
            if (! $user || ! $user->two_factor_enabled || $user->is_bot || (int) $user->auth_version !== (int) $request->session()->get('two_factor.auth_version', -1)) return null;
            return $this->consumeCode($user, $data['code'] ?? '', $data['recovery_code'] ?? '') ? $user : null;
        });
        if (! $user) {
            RateLimiter::hit($key, 60);
            throw ValidationException::withMessages(['code' => 'That code is not valid.']);
        }
        RateLimiter::clear($key);
        Auth::login($user, (bool) $request->session()->pull('two_factor.remember'));
        $request->session()->forget('two_factor');
        $request->session()->put('auth_version', (int) $user->auth_version);
        $request->session()->regenerate(true);

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /** Called while holding the user row lock: both TOTP and recovery codes are single use. */
    private function consumeCode(User $user, string $code, string $recoveryCode): bool
    {
        if ($user->two_factor_secret && preg_match('/^\d{6}$/', $code)) {
            $step = $this->google2fa->verifyKeyNewer($user->two_factor_secret, $code, $user->two_factor_last_used_at ?? 0, 1, (int) floor(now()->timestamp / 30));
            if ($step !== false) {
                $user->forceFill(['two_factor_last_used_at' => $step])->save();
                return true;
            }
        }
        foreach ($user->two_factor_recovery_codes ?? [] as $index => $recovery) {
            if ($recoveryCode !== '' && hash_equals($recovery, $recoveryCode)) {
                $remaining = $user->two_factor_recovery_codes;
                unset($remaining[$index]);
                $user->forceFill(['two_factor_recovery_codes' => array_values($remaining)])->save();
                return true;
            }
        }
        return false;
    }
}
