<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\StaffApplication;
use App\Models\User;
use App\Support\DiscordStaffApplications;
use App\Support\StaffApplicationForm;
use App\Support\UserAchievements;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class DiscordBotController extends Controller
{
    public function member(Request $request, string $discordId): JsonResponse
    {
        $this->authorizeBot($request);

        $user = User::where('discord_id', $discordId)->firstOrFail();
        $summary = UserAchievements::forUser($user);

        return response()->json([
            'user' => [
                'username' => $user->username,
                'name' => $user->name,
                'level' => $summary['stats']['level'],
                'xp' => $summary['stats']['xp'],
            ],
            'achievements' => $summary['achievements'],
        ]);
    }

    public function announcements(Request $request): JsonResponse
    {
        $this->authorizeBot($request);
        $after = $request->query('after');
        $announcements = $after === null
            ? collect()
            : Announcement::where('id', '>', max(0, (int) $after))->orderBy('id')->limit(10)->get(['id', 'message', 'level', 'created_at']);

        return response()->json([
            'latest_id' => (int) (Announcement::max('id') ?? 0),
            'announcements' => $announcements,
        ]);
    }

    // ---- staff applications: the bot's /apply forms and the buttons under the application in the staff channel ----

    /** The questions, so the bot's forms always match the website's. */
    public function staffApplicationForm(Request $request): JsonResponse
    {
        $this->authorizeBot($request);

        return response()->json(StaffApplicationForm::definition());
    }

    /** An application sent from Discord. It is checked like the website's, and belongs to the account the Discord user linked, if any. */
    public function submitStaffApplication(Request $request): JsonResponse
    {
        $this->authorizeBot($request);
        $data = $request->validate([
            'discord_id' => ['required', 'string', 'regex:/^[0-9]{17,20}$/'],
            'answers' => ['required', 'array'],
        ] + StaffApplicationForm::rules('answers.'), StaffApplicationForm::messages('answers.'));

        $user = User::where('discord_id', $data['discord_id'])->first();
        if ($user && StaffApplication::openFor($user)) {
            throw ValidationException::withMessages(['application' => 'You already have an application waiting for a decision.']);
        }

        $application = StaffApplication::submit($data['answers'], 'discord', $user, $data['discord_id']);
        DiscordStaffApplications::announce($application);

        return response()->json(['id' => $application->id], 201);
    }

    /** The whole application as text (the "Full answers" button). */
    public function showStaffApplication(Request $request, int $id): JsonResponse
    {
        $this->authorizeBot($request);
        $application = StaffApplication::findOrFail($id);

        return response()->json(['id' => $application->id, 'text' => "Staff application #{$application->id} — {$application->applicantName()}, {$application->position}\n\n".StaffApplicationForm::text($application->answers)]);
    }

    /** Approve, Under review or Reject under the message. The bot has checked that the person may; the website records who it was and updates the message. */
    public function decideStaffApplication(Request $request, int $id): JsonResponse
    {
        $this->authorizeBot($request);
        $data = $request->validate([
            'status' => ['required', Rule::in(['under_review', 'accepted', 'rejected'])],
            'reviewer_discord_id' => ['required', 'string', 'regex:/^[0-9]{17,20}$/'],
            'reviewer_name' => ['nullable', 'string', 'max:64'],
        ]);
        $application = StaffApplication::findOrFail($id);

        $reviewer = User::where('discord_id', $data['reviewer_discord_id'])->first();
        $changed = $application->setStatus($data['status'], $reviewer, $data['reviewer_name'] ?? 'Discord staff');

        return response()->json([
            'changed' => $changed,
            'notice' => $changed ? DiscordStaffApplications::afterStatusChange($application) : null,
            'message' => DiscordStaffApplications::payload($application),
        ]);
    }

    private function authorizeBot(Request $request): void
    {
        $expected = (string) config('services.discord.bot_token');
        $provided = (string) $request->header('Authorization');
        abort_unless($expected !== '' && hash_equals('Bot '.$expected, $provided), 401);
    }
}
