<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class DiscordStaffApplications
{
    public static function configured(): bool
    {
        return filled(config('services.discord.bot_token')) && filled(config('services.discord.staff_applications_channel_id'));
    }

    public static function send(User $user, array $answers): bool
    {
        if (! self::configured() || ! $user->discord_id) {
            return false;
        }

        $applicationId = (string) Str::uuid();
        $discordName = $user->discord_username ?: 'Discord user';
        $requirements = array_filter(array_map('trim', explode('|', (string) config('services.discord.staff_application_requirements'))));
        $questions = (array) config('services.discord.staff_application_questions');
        $description = 'Submitted via the SFD.DJ website.';
        if ($requirements !== []) {
            $description .= "\n\nRequirements: ".implode('; ', $requirements);
        }
        $payload = [
            'embeds' => [[
                'title' => 'Staff application',
                'description' => $description,
                'color' => 5793266,
                'fields' => [
                    ['name' => 'SFD.DJ account', 'value' => $user->username, 'inline' => true],
                    ['name' => 'Discord account', 'value' => $discordName.' (`'.$user->discord_id.')', 'inline' => true],
                    ['name' => $questions['motivation'], 'value' => $answers['motivation']],
                    ['name' => $questions['experience'], 'value' => $answers['experience']],
                    ['name' => $questions['availability'], 'value' => $answers['availability']],
                ],
                'timestamp' => now()->toIso8601String(),
            ]],
            'components' => [[
                'type' => 1,
                'components' => [
                    ['type' => 2, 'style' => 3, 'label' => 'Approve', 'custom_id' => "staff-application:approve:{$applicationId}:{$user->discord_id}"],
                    ['type' => 2, 'style' => 4, 'label' => 'Reject', 'custom_id' => "staff-application:reject:{$applicationId}:{$user->discord_id}"],
                ],
            ]],
        ];

        try {
            return Http::withHeaders(['Authorization' => 'Bot '.config('services.discord.bot_token')])
                ->acceptJson()
                ->connectTimeout(3)
                ->timeout(8)
                ->post('https://discord.com/api/v10/channels/'.config('services.discord.staff_applications_channel_id').'/messages', $payload)
                ->successful();
        } catch (ConnectionException) {
            return false;
        }
    }
}
