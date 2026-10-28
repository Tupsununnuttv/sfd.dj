<?php

namespace App\Support;

use App\Models\StaffApplication;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Staff applications in Discord: one message per application in the private staff channel, kept up to date as the review goes on.
 * The application itself lives in the database; the message is the staff team's way to see and decide on it without opening the website,
 * and the bot's buttons under it go through the website, so the website and Discord never disagree.
 */
class DiscordStaffApplications
{
    private const API = 'https://discord.com/api/v10/';

    /** Discord messages always link to the public site, including submissions from local development. */
    private const SITE = 'https://sfd-dj.eu';

    private const COLORS = ['pending' => 0x5865F2, 'under_review' => 0xF59E0B, 'accepted' => 0x22C55E, 'rejected' => 0xEF4444];

    /** Characters of each long answer shown in the message (Discord allows 6000 in all); the full text is one button away. */
    private const PREVIEW = 340;

    public static function configured(): bool
    {
        return filled(config('services.discord.bot_token')) && filled(config('services.discord.staff_applications_channel_id'));
    }

    /** Post a new application to the staff channel and remember the message. Returns false (and logs why) when that did not work: the application is saved anyway. */
    public static function announce(StaffApplication $application): bool
    {
        if (! self::configured()) {
            return false;
        }

        $response = self::send(fn () => self::api()->post(self::API.'channels/'.config('services.discord.staff_applications_channel_id').'/messages', self::payload($application)), "post staff application #{$application->id}");
        if (! $response?->successful()) {
            return false;
        }

        $application->update(['discord_message_id' => $response->json('id')]);

        return true;
    }

    /** Show the application's current status in its message. */
    public static function refresh(StaffApplication $application): bool
    {
        if (! self::configured() || ! $application->discord_message_id) {
            return false;
        }

        return self::send(fn () => self::api()->patch(self::API.'channels/'.config('services.discord.staff_applications_channel_id').'/messages/'.$application->discord_message_id, self::payload($application)), "update staff application #{$application->id}")?->successful() ?? false;
    }

    /**
     * After the status changed: give an accepted applicant the staff role in Discord and update the message.
     * Returns something staff should know (no role was given, and why), or null.
     */
    public static function afterStatusChange(StaffApplication $application): ?string
    {
        $note = $application->status === 'accepted' ? self::giveRole($application) : null;
        self::refresh($application);

        return $note;
    }

    /** The message: who applied, the short answers, a preview of the long ones, the decision, and the buttons the bot answers. */
    public static function payload(StaffApplication $application): array
    {
        $application->loadMissing('user', 'reviewer');
        $answers = $application->answers;
        $links = array_map(fn (array $link) => "[{$link['label']}]({$link['url']})", (array) config('services.discord.staff_application_links'));
        $description = 'Submitted via '.($application->source === 'discord' ? 'Discord' : 'the SFD-DJ.EU website').".\nStatus: **{$application->statusLabel()}**";
        if ($links !== []) {
            $description .= "\n\nRequirements: ".implode('; ', $links);
        }

        $fields = [
            ['name' => 'SFD-DJ.EU account', 'value' => $application->user ? ($application->user->username ?: $application->user->name) : 'No SFD-DJ.EU account', 'inline' => true],
            ['name' => 'Discord', 'value' => $application->discord_id ? "<@{$application->discord_id}> ({$answers['discord_username']})" : "{$answers['discord_username']} (not linked)", 'inline' => true],
            ['name' => 'Position', 'value' => $application->position, 'inline' => true],
        ];
        foreach (StaffApplicationForm::fields() as $number => $field) {
            $value = (string) ($answers[$field['key']] ?? '');
            if ($value === '' || in_array($field['key'], ['discord_username', 'position'], true)) {
                continue;
            }
            $fields[] = $field['type'] === 'textarea'
                ? ['name' => Str::limit(($number + 1).'. '.$field['label'], 250, '…'), 'value' => Str::limit($value, self::PREVIEW, '…')]
                : ['name' => $field['short'], 'value' => $value, 'inline' => true];
        }

        if ($application->status !== 'pending') {
            $by = $application->reviewerName() ?? 'staff';
            $decision = "{$application->statusLabel()} by {$by}".($application->reviewed_at ? ' <t:'.$application->reviewed_at->timestamp.':R>' : '');
            if ($application->status === 'accepted' && ($problem = self::roleProblem($application))) {
                $decision .= "\n{$problem}";
            }
            $fields[] = ['name' => 'Decision', 'value' => $decision];
        }

        $decided = in_array($application->status, ['accepted', 'rejected'], true);

        return [
            'embeds' => [[
                'title' => "Staff application #{$application->id}",
                'url' => self::SITE.'/admin?application='.$application->id.'#Applications',
                'description' => $description,
                'color' => self::COLORS[$application->status] ?? self::COLORS['pending'],
                'fields' => $fields,
                'timestamp' => $application->created_at->toIso8601String(),
            ]],
            'components' => [[
                'type' => 1,
                'components' => [
                    ['type' => 2, 'style' => 3, 'label' => 'Approve', 'custom_id' => "staff-application:approve:{$application->id}", 'disabled' => $decided],
                    ['type' => 2, 'style' => 2, 'label' => 'Under review', 'custom_id' => "staff-application:review:{$application->id}", 'disabled' => $decided || $application->status === 'under_review'],
                    ['type' => 2, 'style' => 4, 'label' => 'Reject', 'custom_id' => "staff-application:reject:{$application->id}", 'disabled' => $decided],
                    ['type' => 2, 'style' => 2, 'label' => 'Full answers', 'custom_id' => "staff-application:full:{$application->id}"],
                    ['type' => 2, 'style' => 5, 'label' => 'Open on website', 'url' => self::SITE.'/admin?application='.$application->id.'#Applications'],
                ],
            ]],
        ];
    }

    /** Why an accepted applicant gets no Discord role from the website, or null when the role can be given. */
    private static function roleProblem(StaffApplication $application): ?string
    {
        if (! $application->discord_id) {
            return 'No Discord account is linked, so no Discord role was given: give them a role in the Admin panel.';
        }
        if (blank(config('services.discord.approved_staff_role_id')) || blank(config('services.discord.guild_id')) || blank(config('services.discord.bot_token'))) {
            return 'DISCORD_APPROVED_STAFF_ROLE_ID and DISCORD_GUILD_ID are not both set, so no Discord role was given.';
        }

        return null;
    }

    private static function giveRole(StaffApplication $application): ?string
    {
        if ($problem = self::roleProblem($application)) {
            return $problem;
        }

        $guild = config('services.discord.guild_id');
        $response = self::send(fn () => self::api()->withHeaders(['X-Audit-Log-Reason' => "Staff application #{$application->id} accepted"])
            ->put(self::API."guilds/{$guild}/members/{$application->discord_id}/roles/".config('services.discord.approved_staff_role_id')), "give the staff role for application #{$application->id}");

        return $response?->successful()
            ? null
            : 'Discord did not give the staff role'.($response ? " (HTTP {$response->status()})" : '').': is the person in the server, and is the bot\'s role above the staff role?';
    }

    private static function api(): PendingRequest
    {
        return Http::withHeaders(['Authorization' => 'Bot '.config('services.discord.bot_token')])->acceptJson()->connectTimeout(3)->timeout(8);
    }

    /** Run one Discord request; a failure is logged, never thrown (Discord being down must not undo an application). */
    private static function send(callable $request, string $what)
    {
        try {
            $response = $request();
        } catch (ConnectionException $e) {
            Log::warning("Discord could not be reached to {$what}: {$e->getMessage()}");

            return null;
        }
        if (! $response->successful()) {
            Log::warning("Discord refused to {$what} (HTTP {$response->status()}): ".Str::limit($response->body(), 300));
        }

        return $response;
    }
}
