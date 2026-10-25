<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * The website as a Discord Activity: Discord opens the site's root in an iframe through its proxy (<application id>.discordsays.com) and adds
 * frame_id to the address; the page is the same Laravel app, answered by DiscordActivityController. See docs/discord-activity.md.
 */
class DiscordActivity
{
    /** Is this request made by an Activity (its first page, or a call the page makes to /discord/...)? The normal site never matches. */
    public static function request(Request $request): bool
    {
        return $request->is('discord/*') || ($request->is('/', 'discord') && $request->query->has('frame_id'));
    }

    /** Where "Open Full Website" and the room buttons lead: the configured site address, never anything the browser sends. */
    public static function siteUrl(): string
    {
        $url = rtrim((string) config('app.url'), '/');

        return in_array(parse_url($url, PHP_URL_SCHEME), ['http', 'https'], true) ? $url : '';
    }
}
