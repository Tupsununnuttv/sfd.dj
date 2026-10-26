<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * The website as a Discord Activity: Discord opens the site's root in an iframe through its proxy (<application id>.discordsays.com) and adds
 * frame_id to the address; a partitioned context marker keeps the same site's routes in Activity mode. See docs/discord-activity.md.
 */
class DiscordActivity
{
    public const COOKIE = 'sfd_discord_activity';

    public const ATTRIBUTE = 'sfd_discord_activity';

    /** Display context only: this never grants an account, a permission or room access. */
    public static function request(Request $request): bool
    {
        return $request->attributes->get(self::ATTRIBUTE) === true
            || $request->cookies->get(self::COOKIE) === '1'
            || $request->is('discord', 'discord/*')
            || filled($request->query('frame_id'));
    }

    public static function proxyOrigin(): ?string
    {
        $id = (string) config('services.discord_activity.client_id');

        return preg_match('/\A[0-9]{17,20}\z/D', $id) ? "https://{$id}.discordsays.com" : null;
    }

    public static function settings(): array
    {
        return [
            'applicationId' => (string) config('services.discord_activity.client_id'),
            'siteUrl' => self::siteUrl(),
            'signInAvailable' => false,
            'guestOnly' => true,
            'urlMappings' => config('discord-activity.url_mappings', []),
        ];
    }

    /** Where "Open Full Website" and the room buttons lead: the configured site address, never anything the browser sends. */
    public static function siteUrl(): string
    {
        $url = rtrim((string) config('app.url'), '/');

        return in_array(parse_url($url, PHP_URL_SCHEME), ['http', 'https'], true) ? $url : '';
    }
}
