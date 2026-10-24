<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\AvatarController;
use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\User;
use App\Support\Referrals;
use Closure;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(Request $request): Response|RedirectResponse
    {
        $request->validate(['ref' => ['nullable', 'string', 'max:64']]);
        if ($request->user()) {
            return to_route($request->filled('ref') ? 'referral' : 'dashboard', $request->filled('ref') ? ['ref' => $request->query('ref')] : []);
        }
        if ($request->filled('ref')) {
            $request->session()->put('ref', $request->query('ref'));
            $request->session()->put('url.intended', route('referral', ['ref' => $request->query('ref')]));
        }

        $ref = $request->session()->get('ref');

        return Inertia::render('Auth/Register', [
            'referralCode' => is_string($ref) ? $ref : '',
            // "Alex invited you": only the name and picture of the person behind the link (no link: nobody, not the first account without a code)
            'inviter' => $ref ? User::where('referral_code', $ref)->first()?->only('name', 'avatar') : null,
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'username' => ['required', 'string', 'min:3', 'max:20', 'regex:/^[A-Za-z0-9_]+$/', function (string $attribute, mixed $value, Closure $fail) {
                if (User::whereRaw('lower(username) = ?', [mb_strtolower($value)])->exists()) {
                    $fail('That username is taken.');
                }
            }],
            'name' => ['nullable', 'string', 'max:30'],
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'terms' => ['accepted'],
            'referral_code' => ['nullable', 'string', 'max:64', function (string $attribute, mixed $value, Closure $fail) {
                if (! User::where('referral_code', $value)->where('is_bot', false)->exists()) {
                    $fail('This invite code was not found. Check it or leave the field empty.');
                }
            }],
        ], ['terms.accepted' => 'Please accept the terms and the community rules to join.']);

        $user = User::create([
            'username' => $request->username,
            'name' => $request->name ?: $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'avatar' => AvatarController::starterCharacter(), // somebody new walks into the room as a character, not as a letter
        ]);
        $user->forceFill(['awards' => ['beta']])->save(); // everybody who signs up while the site is in beta gets the Beta Tester badge

        $ref = $request->exists('referral_code') ? $request->input('referral_code') : $request->session()->get('ref');
        $request->session()->forget('ref');

        if (is_string($ref) && User::where('referral_code', $ref)->where('is_bot', false)->exists()) {
            Referrals::claim($user, $ref);
        }

        // the Registered event sends the "confirm your email" message; it cannot fail the sign-up, and the confirm page says what became of it
        event(new Registered($user));
        $request->session()->put('verification_mail', $user->verificationMail ?: 'sent');

        Auth::login($user, true);
        $request->session()->put('auth_version', (int) $user->auth_version);

        // where the confirming is asked for the new member lands on the confirm page, otherwise they are in (a banner invites them to confirm later)
        return redirect(route(Setting::verificationRequired() ? 'verification.notice' : 'dashboard', absolute: false));
    }
}
