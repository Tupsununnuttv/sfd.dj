<?php

namespace App\Http\Controllers\Auth;

use App\Enums\Role;
use App\Http\Controllers\AvatarController;
use App\Http\Controllers\CommunityController;
use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\User;
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
    public function create(Request $request): Response
    {
        if ($request->filled('ref')) {
            $request->session()->put('ref', $request->query('ref'));
        }

        return Inertia::render('Auth/Register', [
            // "Alex invited you": only the name and picture of the person behind the link
            'inviter' => User::where('referral_code', $request->session()->get('ref'))->first()?->only('name', 'avatar'),
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
        ], ['terms.accepted' => 'Please accept the terms and the community rules to join.']);

        $user = User::create([
            'username' => $request->username,
            'name' => $request->name ?: $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'avatar' => AvatarController::starterCharacter(), // somebody new walks into the room as a character, not as a letter
        ]);
        $user->forceFill(['roles' => [Role::BetaTester->value]])->save(); // everybody who signs up while the site is in beta is a Beta Tester

        if ($referrer = User::where('referral_code', $request->session()->pull('ref'))->first()) {
            $user->forceFill(['referred_by' => $referrer->id])->save();
            $referrer->addXp(CommunityController::REFERRAL_XP);
            $referrer->referrals()->count() <= 20 && $referrer->award(User::REFERRAL_COINS, 'referral', $user->name); // the first 20 friends pay coins
        }

        // the Registered event sends the "confirm your email" message; it cannot fail the sign-up, and the confirm page says what became of it
        event(new Registered($user));
        $request->session()->put('verification_mail', $user->verificationMail ?: 'sent');

        Auth::login($user);

        // where the confirming is asked for the new member lands on the confirm page, otherwise they are in (a banner invites them to confirm later)
        return redirect(route(Setting::verificationRequired() ? 'verification.notice' : 'dashboard', absolute: false));
    }
}
