/**
 * Discord's proxy host and launch parameter identify the Activity. Ordinary browser tabs and the site's room overlays never start the SDK.
 */
export function isDiscordActivity(location: Pick<Location, 'hostname' | 'search'>, framed: boolean): boolean {
    return framed && location.hostname.endsWith('.discordsays.com') && !new URLSearchParams(location.search).has('sfd_overlay');
}

export const discordActivity = typeof window !== 'undefined' && isDiscordActivity(window.location, window.self !== window.top);
export const discordProxy = typeof window !== 'undefined' && window.self !== window.top && window.location.hostname.endsWith('.discordsays.com');
