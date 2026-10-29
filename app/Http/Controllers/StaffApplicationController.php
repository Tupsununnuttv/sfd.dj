<?php

namespace App\Http\Controllers;

use App\Models\StaffApplication;
use App\Support\DiscordStaffApplications;
use App\Support\StaffApplicationForm;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/** The Staff application page: the 15 questions for a logged-in account, and the status of the application once it is sent. */
class StaffApplicationController extends Controller
{
    public function create(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('StaffApplication', StaffApplicationForm::definition() + [
            'application' => StaffApplication::where('user_id', $user->id)->latest('id')->first()?->forApplicant(),
            // Discord is optional: a linked account only saves typing the username and lets the team give the staff role there
            'discord' => ['username' => $user->discord_username, 'connected' => filled($user->discord_id)],
            'links' => config('services.discord.staff_application_links'),
            'notice' => session('staff_application_notice'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $answers = $request->validate(StaffApplicationForm::rules(), StaffApplicationForm::messages());

        if (StaffApplication::openFor($user)) {
            throw ValidationException::withMessages(['application' => 'You already have an application waiting for a decision.']);
        }

        $application = StaffApplication::submit($answers, 'website', $user);
        // the staff channel is told, but the application does not depend on it: staff also see it in Admin → Applications
        DiscordStaffApplications::announce($application);

        return to_route('staff-application.create')->with('staff_application_notice', 'Your application was sent to the SFD-DJ.EU staff team.');
    }

    /** The applicant answers the staff under their latest application. */
    public function reply(Request $request): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validate(['body' => ['required', 'string', 'max:2000']]);
        $application = StaffApplication::where('user_id', $user->id)->latest('id')->first();
        if (! $application) {
            throw ValidationException::withMessages(['body' => 'Send an application first.']);
        }

        $application->reply($user, trim($data['body']), false);

        return to_route('staff-application.create');
    }
}
