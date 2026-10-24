import ConnectionCards, { ConnectionCard } from '@/Components/ConnectionCards';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { embedded } from '@/lib/embed';
import { browserChannel } from '@/lib/browserChannel';
import { Head, router } from '@inertiajs/react';
import { MouseEvent, ReactNode, useEffect, useState } from 'react';

/** Where each sign-in with another site starts. */
const START = { spotify: 'spotify.connect', discord: 'discord.connect', youtube: 'youtube.connect', twitch: 'twitch.connect', tiktok: 'tiktok.connect', reddit: 'reddit.connect', instagram: 'instagram.connect', facebook: 'facebook.connect', x: 'x.connect' } as const;
type Service = keyof typeof START;
type SocialService = 'reddit' | 'instagram' | 'facebook' | 'x';
const socialLabels = { reddit: 'Reddit', instagram: 'Instagram', facebook: 'Facebook', x: 'X / Twitter' };
const POPUP = 'sfd-connect';

/**
 * A Connect button. Inside a room's page overlay the sign-in happens in a small window of its own, so the room underneath (and its music) stays;
 * anywhere else it takes the page, as usual.
 */
function ConnectLink({ service, className, children }: { service: Service; className: string; children: ReactNode }) {
    const open = (e: MouseEvent) => {
        if (!embedded) return;
        e.preventDefault();
        const popup = window.open(`${route('settings.connections')}?connect=${service}`, POPUP, 'popup,width=540,height=720');
        if (!popup) window.top!.location.href = route(START[service]);
    };

    return <a href={route(START[service])} onClick={open} className={className}>{children}</a>;
}

type Notices = { discord: string | null; spotify: string | null; spotifyOk: boolean; youtube: string | null; twitch: string | null; tiktok: string | null; twitchOk: boolean; tiktokOk: boolean } & Record<SocialService, string | null> & { socialOk: Partial<Record<SocialService, boolean>> };

/**
 * The small sign-in window runs through this page twice: first (?connect=spotify) it goes on to the other site; back from it, it hands what the site
 * said to the overlay in the room through a browser channel, with storage and same-origin window fallbacks, and closes.
 * The overlay reloads to show the new connection, with that message. Returns the message the overlay got, if any.
 */
function useSignInWindow(mine: Notices): Notices | null {
    const [handed, setHanded] = useState<Notices | null>(null);

    useEffect(() => {
        const service = new URLSearchParams(window.location.search).get('connect');
        if (service && Object.hasOwn(START, service)) {
            try { sessionStorage.setItem(POPUP, '1'); } catch { /* popup name is the fallback */ }
            window.name = POPUP;
            window.location.replace(route(START[service as Service]));
            return;
        }

        let popup = window.name === POPUP;
        try { popup ||= !!sessionStorage.getItem(POPUP); sessionStorage.removeItem(POPUP); } catch { /* storage disabled */ }
        if (popup) {
            window.name = '';
            const channel = browserChannel<Notices>(POPUP, () => {});
            channel.postMessage(mine);
            channel.close();
            window.close();
            return;
        }

        if (!embedded) return;
        const channel = browserChannel<Notices>(POPUP, (data) => {
            if (!data || !Object.keys(START).every((key) => data[key as keyof Notices] === null || typeof data[key as keyof Notices] === 'string') || typeof data.spotifyOk !== 'boolean') return;
            setHanded(data);
            router.reload();
        });

        return () => channel.close();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return handed;
}

interface DiscordState {
    configured: boolean;
    role_sync_configured: boolean;
    username: string | null;
    notice: string | null;
}

interface SpotifyState {
    configured: boolean;
    connected: boolean;
    display_name: string | null;
    notice: string | null;
    notice_ok: boolean;
    redirect: string | null;
}

interface YouTubeState {
    configured: boolean;
    connected: boolean;
    channel_title: string | null;
    channel_url: string | null;
    notice: string | null;
}

interface StreamState {
    configured: boolean;
    connected: boolean;
    display_name: string | null;
    notice: string | null;
    notice_ok: boolean;
    redirect: string | null;
}

const actionClass = 'inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-neutral-200 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400';

function AppSetup({ label, redirect }: { label: string; redirect: string | null }) {
    if (!redirect) return null;
    return <details className="text-xs text-neutral-500"><summary className="cursor-pointer hover:text-neutral-300">{label} app setup</summary><p className="mt-2 leading-relaxed">Register this callback URL in the developer app:</p><code className="mt-1 block select-all break-all rounded-lg bg-black/25 p-2 text-neutral-400">{redirect}</code></details>;
}

export default function Connections({ discord, spotify, youtube, twitch, tiktok, social = {} }: { discord: DiscordState; spotify: SpotifyState; youtube: YouTubeState; twitch: StreamState; tiktok: StreamState; social?: Partial<Record<SocialService, StreamState & { username?: string | null }>> }) {
    const handed = useSignInWindow({ discord: discord.notice, spotify: spotify.notice, spotifyOk: spotify.notice_ok, youtube: youtube.notice, twitch: twitch.notice, tiktok: tiktok.notice, twitchOk: twitch.notice_ok, tiktokOk: tiktok.notice_ok, reddit: social.reddit?.notice ?? null, instagram: social.instagram?.notice ?? null, facebook: social.facebook?.notice ?? null, x: social.x?.notice ?? null, socialOk: Object.fromEntries(Object.entries(social).map(([key, state]) => [key, state.notice_ok])) });
    const connect = (service: Service) => (className: string, children: ReactNode) => <ConnectLink service={service} className={className}>{children}</ConnectLink>;
    const disconnect = (service: Service, message = `Disconnect ${service === 'tiktok' ? 'TikTok' : service.charAt(0).toUpperCase() + service.slice(1)} from SFD-DJ.EU?`) => () => {
        if (confirm(message)) router.delete(route(`${service}.disconnect`), { preserveScroll: true });
    };
    const connections: ConnectionCard[] = [
        {
            id: 'discord', label: 'Discord', color: '#7785ff', configured: discord.configured, connected: !!discord.username,
            account: discord.username || 'Discord user', description: discord.role_sync_configured ? 'Your SFD-DJ.EU server roles sync with your Discord account. We do not read your messages.' : 'Link your Discord account. Automatic server role sync is not configured yet. We do not read your messages.',
            notice: discord.notice ?? handed?.discord ?? null, connect: connect('discord'),
            disconnect: disconnect('discord', 'Unlink Discord and remove SFD-DJ.EU server roles?'),
            actions: discord.configured ? <ConnectLink service="discord" className={actionClass}>Sync server roles</ConnectLink> : null,
        },
        {
            id: 'spotify', label: 'Spotify', color: '#1ed760', configured: spotify.configured, connected: spotify.connected,
            account: spotify.display_name || 'Spotify user', description: 'Import your private playlists and playlists with more than 100 songs. Public playlist and album links can be imported without connecting.',
            notice: spotify.notice ?? handed?.spotify ?? null, noticeOk: spotify.notice ? spotify.notice_ok : handed?.spotifyOk,
            connect: connect('spotify'), disconnect: disconnect('spotify'), details: <AppSetup label="Spotify" redirect={spotify.redirect} />,
        },
        {
            id: 'youtube', label: 'YouTube', color: '#ff4545', configured: youtube.configured, connected: youtube.connected,
            account: youtube.channel_title || 'YouTube channel', description: 'Import playlists available to your account and show your channel on your public SFD-DJ.EU profile. Access is read-only.',
            notice: youtube.notice ?? handed?.youtube ?? null, connect: connect('youtube'),
            disconnect: disconnect('youtube', 'Disconnect YouTube from SFD-DJ.EU and remove it from your profile?'),
            actions: youtube.channel_url ? <a href={youtube.channel_url} target="_blank" rel="noopener noreferrer" className={actionClass}>View channel</a> : null,
        },
        ...(['twitch', 'tiktok'] as const).map((service): ConnectionCard => {
            const state = service === 'twitch' ? twitch : tiktok;
            const label = service === 'twitch' ? 'Twitch' : 'TikTok';
            return {
                id: service, label, color: service === 'twitch' ? '#a970ff' : '#25f4ee', configured: state.configured, connected: state.connected,
                account: state.display_name || `${label} user`,
                description: service === 'twitch' ? 'In a room, use Go live and paste your Twitch channel link to show its live player.' : 'Use Go live in a room with tiktok.com/@yourname/live. Viewers watch the LIVE on TikTok in a new tab.',
                notice: state.notice ?? handed?.[service] ?? null,
                noticeOk: state.notice ? state.notice_ok : (service === 'twitch' ? handed?.twitchOk : handed?.tiktokOk),
                connect: connect(service), disconnect: disconnect(service), details: <AppSetup label={label} redirect={state.redirect} />,
            };
        }),
        ...(['reddit', 'instagram', 'facebook', 'x'] as const).map((service): ConnectionCard => {
            const state = social[service];
            const label = socialLabels[service];
            return {
                id: service, label, color: { reddit: '#ff4500', instagram: '#e668a0', facebook: '#1877f2', x: '#f5f5f5' }[service],
                configured: state?.configured ?? false, connected: state?.connected ?? false, account: state?.display_name || `${label} account`,
                description: service === 'instagram' ? 'Connect your Instagram Business or Creator account. Personal accounts are not supported by the Instagram API.' : `Connect your ${label} account. Linking does not publish posts or send messages.`,
                notice: state?.notice ?? handed?.[service] ?? null, noticeOk: state?.notice ? state.notice_ok : handed?.socialOk?.[service],
                connect: connect(service), disconnect: disconnect(service, `Disconnect ${label} from SFD-DJ.EU?`),
                details: <AppSetup label={label} redirect={state?.redirect ?? null} />,
            };
        }),
    ];

    return <SettingsLayout title="Connections" subtitle="Connect your accounts to import music, sync community roles and share your streams.">
        <Head title="Connections" />
        <ConnectionCards connections={connections} />
    </SettingsLayout>;
}
