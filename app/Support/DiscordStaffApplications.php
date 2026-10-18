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
        if (! self::configured()) {
            return false;
        }

        $applicationId = (string) Str::uuid();
        // Somebody without a linked Discord account can apply too: the buttons then carry "none" and the bot only records the decision (no Discord role to give).
        $discordId = $user->discord_id ?: 'none';
        $discordAccount = $user->discord_id ? ($user->discord_username ?: 'Discord user').' (`'.$user->discord_id.')' : 'Not connected';
        $links = array_map(fn (array $link) => "[{$link['label']}]({$link['url']})", (array) config('services.discord.staff_application_links'));
        $questions = (array) config('services.discord.staff_application_questions');
        $description = 'Submitted via the SFD-DJ.EU website.';
        if ($links !== []) {
            $description .= "\n\nRequirements: ".implode('; ', $links);
        }
        $payload = [
            'embeds' => [[
                'title' => 'Staff application',
                'description' => $description,
                'color' => 5793266,
                'fields' => [
                    // Discord messages always link to the public site, including submissions from local development.
                    ['name' => 'SFD-DJ.EU account', 'value' => ($user->username ?: $user->name)."\nhttps://sfd-dj.eu/", 'inline' => true],
                    ['name' => 'Discord account', 'value' => $discordAccount, 'inline' => true],
                    ['name' => $questions['motivation'], 'value' => $answers['motivation']],
                    ['name' => $questions['experience'], 'value' => $answers['experience']],
                    ['name' => $questions['availability'], 'value' => $answers['availability']],
                ],
                'timestamp' => now()->toIso8601String(),
            ]],
            'components' => [[
                'type' => 1,
                'components' => [
                    ['type' => 2, 'style' => 3, 'label' => 'Approve', 'custom_id' => "staff-application:approve:{$applicationId}:{$discordId}"],
                    ['type' => 2, 'style' => 4, 'label' => 'Reject', 'custom_id' => "staff-application:reject:{$applicationId}:{$discordId}"],
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
