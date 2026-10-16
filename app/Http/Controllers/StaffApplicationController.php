<?php

namespace App\Http\Controllers;

use App\Support\DiscordStaffApplications;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class StaffApplicationController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('StaffApplication', [
            'discord' => [
                'username' => $request->user()->discord_username,
                'connected' => filled($request->user()->discord_id),
            ],
            'configured' => DiscordStaffApplications::configured(),
            'questions' => config('services.discord.staff_application_questions'),
            'links' => config('services.discord.staff_application_links'),
            'notice' => session('staff_application_notice'),
            'error' => session('staff_application_error'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $answers = $request->validate([
            'motivation' => ['required', 'string', 'max:900'],
            'experience' => ['required', 'string', 'max:900'],
            'availability' => ['required', 'string', 'max:900'],
        ]);

        // a linked Discord account is not needed: the application goes to the staff channel with the SFD-DJ.EU account on it
        if (! DiscordStaffApplications::send($request->user(), $answers)) {
            return Redirect::route('staff-application.create')->with('staff_application_error', 'Your application could not be sent. Please try again later.');
        }

        return to_route('staff-application.create')->with('staff_application_notice', 'Your application was sent to the SFD-DJ.EU staff team.');
    }
}
