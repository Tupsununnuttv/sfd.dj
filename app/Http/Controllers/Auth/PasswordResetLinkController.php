<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PasswordResetLinkController extends Controller
{
    /**
     * Display the password reset link request view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
            'devLink' => session('dev_reset_link'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|string|max:255', // an email address or a username
        ]);

        $login = trim($request->input('email'));
        $email = str_contains($login, '@') ? $login : (User::whereRaw('lower(username) = ?', [mb_strtolower($login)])->value('email') ?? $login);

        // We will send the password reset link to this user. Once we have attempted
        // to send the link, we will examine the response then see the message we
        // need to show to the user. Finally, we'll send out a proper response.
        $devLink = null;

        try {
            $status = Password::sendResetLink(['email' => $email], function ($user, $token) use ($request, &$devLink) {
                $user->sendPasswordResetNotification($token);

                // Only on your own computer with mail still set to "log": no email can arrive, so show the link here instead.
                if (app()->isLocal() && config('mail.default') === 'log' && in_array($request->ip(), ['127.0.0.1', '::1'], true)) {
                    $devLink = route('password.reset', ['token' => $token, 'email' => $user->email]);
                }
            });
        } catch (Throwable $e) {
            report($e); // the mail server said no (a wrong login in .env, or it is down): say so instead of showing an error page

            throw ValidationException::withMessages([
                'email' => ['We could not send the email right now. Try again in a few minutes, or ask a staff member to help you.'],
            ]);
        }

        if ($status == Password::RESET_LINK_SENT) {
            return back()->with('status', __($status))->with('dev_reset_link', $devLink);
        }

        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }
}
