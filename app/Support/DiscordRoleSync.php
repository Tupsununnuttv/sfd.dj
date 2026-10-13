<?php

namespace App\Support;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

final class DiscordRoleSync
{
    private const API = 'https://discord.com/api/v10/';

    public static function configured(): bool
    {
        return filled(config('services.discord.bot_token')) && filled(config('services.discord.guild_id'));
    }

    /** Return a user-safe error, or null after the SFD.DJ roles have been synchronized. */
    public static function sync(User $user, ?string $oauthAccessToken = null, bool $clear = false): ?string
    {
        if (! $user->discord_id) {
            return 'No Discord account is linked.';
        }

        if (! self::configured()) {
            return 'Discord role sync is not configured. Ask site staff to set up the Discord bot.';
        }

        $guildId = (string) config('services.discord.guild_id');
        $prefix = (string) config('services.discord.role_prefix', 'SFD.DJ | ');
        $memberUrl = self::API."guilds/{$guildId}/members/{$user->discord_id}";
        $api = Http::withToken((string) config('services.discord.bot_token'))->acceptJson()->connectTimeout(3)->timeout(8);

        try {
            $discordRoles = $api->get(self::API."guilds/{$guildId}/roles");
            if (! $discordRoles->successful()) {
                return self::apiError($discordRoles->status(), 'read server roles');
            }

            $siteRoles = collect(Role::assignable())->mapWithKeys(fn (Role $role) => [$role->value => $prefix.$role->label()]);
            $assignedNames = $clear
                ? collect()
                : collect($user->roles ?? [])->filter(fn (string $role) => $siteRoles->has($role))->map(fn (string $role) => $siteRoles[$role])->values();
            $rolesByName = collect($discordRoles->json())->filter(fn (array $role) => isset($role['name'], $role['id']))->mapWithKeys(fn (array $role) => [$role['name'] => (string) $role['id']]);
            $missingNames = $assignedNames->reject(fn (string $name) => $rolesByName->has($name));

            if ($missingNames->isNotEmpty()) {
                return 'Create these roles in the Discord server first: '.$missingNames->implode(', ').'.';
            }

            $desiredIds = $assignedNames->map(fn (string $name) => $rolesByName[$name])->all();
            $managedNames = $siteRoles->values()->all();
            $managedIds = $rolesByName->filter(fn (string $id, string $name) => in_array($name, $managedNames, true))->values()->all();
            $member = $api->get($memberUrl);

            if ($member->status() === 404 && $oauthAccessToken) {
                $joined = $api->put($memberUrl, ['access_token' => $oauthAccessToken, 'roles' => $desiredIds]);

                return $joined->successful() ? null : self::apiError($joined->status(), 'join the Discord server');
            }

            if ($member->status() === 404) {
                return 'You are not in the Discord server yet. Reconnect Discord to join it and sync your roles.';
            }

            if (! $member->successful()) {
                return self::apiError($member->status(), 'read your Discord server membership');
            }

            $currentIds = array_map('strval', $member->json('roles', []));
            $keptIds = array_values(array_filter($currentIds, fn (string $id) => ! in_array($id, $managedIds, true)));
            $targetIds = array_values(array_unique([...$keptIds, ...$desiredIds]));
            $currentSorted = $currentIds;
            $targetSorted = $targetIds;
            sort($currentSorted);
            sort($targetSorted);

            if ($currentSorted === $targetSorted) {
                return null;
            }

            $updated = $api->patch($memberUrl, ['roles' => $targetIds]);

            return $updated->successful() ? null : self::apiError($updated->status(), 'update your Discord roles');
        } catch (ConnectionException) {
            return 'Discord could not be reached. Please try again later.';
        }
    }

    private static function apiError(int $status, string $action): string
    {
        return match ($status) {
            401 => 'The Discord bot token is invalid. Ask site staff to check the bot configuration.',
            403 => $action === 'join the Discord server'
                ? 'The Discord bot needs Create Instant Invite and Manage Roles, with its highest role above the SFD.DJ roles.'
                : 'The Discord bot needs Manage Roles and must be ranked above the SFD.DJ roles.',
            404 => 'The Discord server or bot membership could not be found. Ask site staff to check the server setup.',
            429 => 'Discord is rate limiting role updates. Please try again shortly.',
            default => "Discord could not {$action} (HTTP {$status}). Please try again later.",
        };
    }
}
