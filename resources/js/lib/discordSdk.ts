import type { DiscordSDK } from '@discord/embedded-app-sdk';
import { discordActivity, discordProxy } from './discordActivity';

export interface DiscordSettings {
    applicationId: string;
    siteUrl: string;
    signInAvailable: boolean;
    guestOnly?: boolean;
    urlMappings: { prefix: string; target: string }[];
}

let settings: DiscordSettings | null = null;
let instance: DiscordSDK | null = null;
let starting: Promise<DiscordSDK> | null = null;
let networking: Promise<void> | null = null;
const LAUNCH_KEY = 'sfd.discord.launch';
const LAUNCH_PARAMS = ['frame_id', 'instance_id', 'platform', 'guild_id', 'channel_id', 'location_id', 'custom_id', 'referrer_id', 'mobile_app_version'];

/** Preserve only SDK launch context across a hard refresh after SPA navigation. */
export function restoreDiscordLaunch(): void {
    if (!discordActivity) return;
    const url = new URL(window.location.href);
    let saved: Record<string, string> = {};
    try { saved = JSON.parse(sessionStorage.getItem(LAUNCH_KEY) || '{}'); } catch { /* storage may be unavailable */ }
    if (url.searchParams.get('frame_id') && url.searchParams.get('instance_id') && url.searchParams.get('platform')) {
        saved = Object.fromEntries(LAUNCH_PARAMS.flatMap(key => url.searchParams.has(key) ? [[key, url.searchParams.get(key)!]] : []));
        try { sessionStorage.setItem(LAUNCH_KEY, JSON.stringify(saved)); } catch { /* the current launch still works */ }
    } else if (saved && typeof saved === 'object') {
        for (const key of LAUNCH_PARAMS) if (typeof saved[key] === 'string') url.searchParams.set(key, saved[key]);
        window.history.replaceState(window.history.state, '', url);
    }
}

export function startDiscordSdk(applicationId = settings?.applicationId): Promise<DiscordSDK> {
    if (!discordActivity || !applicationId) return Promise.reject(new Error('Open this Activity from Discord to connect.'));
    return starting ??= import('@discord/embedded-app-sdk').then(async ({ DiscordSDK }) => {
        restoreDiscordLaunch();
        const discord = instance ??= new DiscordSDK(applicationId);
        let timer: number | undefined;
        try {
            await Promise.race([discord.ready(), new Promise<never>((_, reject) => {
                timer = window.setTimeout(() => reject(new Error('Discord did not answer. Please try again.')), 15000);
            })]);
        } finally { window.clearTimeout(timer); }
        return discord;
    }).catch(error => { starting = null; throw error; });
}

/** Exact host matching, including Discord's named subdomain mapping syntax. */
export function discordResourceUrl(raw: string): string {
    if (!discordProxy || !settings) return raw;
    const url = new URL(raw, window.location.href);
    if (!['https:', 'http:'].includes(url.protocol)) return raw;
    for (const { prefix, target } of settings.urlMappings ?? []) {
        const pattern = target.split('{subdomain}').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('([a-z0-9-]+)');
        const match = url.host.match(new RegExp(`^${pattern}$`, 'i'));
        if (match) return `${window.location.origin}${prefix.replace('{subdomain}', match[1] || '')}${url.pathname}${url.search}${url.hash}`;
    }
    return raw;
}

export function configureDiscordNetworking(value: DiscordSettings | null | undefined): Promise<void> {
    settings = value ?? null;
    if (!discordProxy || !settings) return Promise.resolve();
    return networking ??= import('@discord/embedded-app-sdk').then(({ patchUrlMappings }) => {
        patchUrlMappings(settings!.urlMappings ?? [], { patchSrcAttributes: true });
    });
}

export async function openDiscordExternal(url: string): Promise<void> {
    const target = new URL(url, window.location.href);
    if (!['https:', 'http:'].includes(target.protocol)) return;
    if (discordProxy && !discordActivity) {
        window.parent.postMessage({ type: 'sfd:discord-external', url: target.href }, window.location.origin);
        return;
    }
    const result = await (await startDiscordSdk()).commands.openExternalLink({ url: target.href });
    if (result.opened === false) throw new Error('The link was not opened.');
}

/** Standard anchors to external sites use Discord's link dialog. App routes stay in this iframe. */
export function installDiscordLinks(): void {
    if (!discordProxy) return;
    document.addEventListener('click', event => {
        if (event.defaultPrevented || event.button !== 0) return;
        const anchor = (event.target as Element | null)?.closest?.('a[href]');
        if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute('download')) return;
        const url = new URL(anchor.href, window.location.href);
        if (!['http:', 'https:'].includes(url.protocol) || url.origin === window.location.origin) return;
        event.preventDefault();
        void openDiscordExternal(url.href).catch(error => window.dispatchEvent(new CustomEvent('sfd:discord-error', { detail: error.message })));
    });
    if (discordActivity) window.addEventListener('message', event => {
        if (event.origin !== window.location.origin || event.source === window || event.data?.type !== 'sfd:discord-external' || typeof event.data.url !== 'string') return;
        void openDiscordExternal(event.data.url).catch(() => {});
    });
}
