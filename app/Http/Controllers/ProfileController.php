<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\Room;
use App\Models\User;
use App\Support\AccountSecurity;
use App\Support\Countries;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'genres' => Room::GENRES,
            'countries' => Countries::ALL,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->safe()->except('current_password'));

        $changed = $request->user()->isDirty('email');

        if ($changed) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();
        $request->user()->announce();

        // a new address has to be confirmed again: the message goes to it now
        if ($changed) {
            AccountSecurity::revoke($request->user(), $request);
            $result = $request->user()->sendEmailVerificationNotification();
            $request->session()->put('verification_mail', $result);

            return Redirect::route('profile.edit')->with('status', "verification-link-{$result}");
        }

        return Redirect::route('profile.edit');
    }

    /** Online, busy, away or offline: how you show yourself (the little dot next to your picture). */
    public function status(Request $request): RedirectResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(User::STATUSES)]]);

        $request->user()->update($data);
        $request->user()->announce();

        return back();
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
