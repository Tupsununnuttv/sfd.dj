import SocialIcon from '@/Components/SocialIcon';
import { SettingsSection } from '@/Components/ui';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head, router } from '@inertiajs/react';
import { Music2 } from 'lucide-react';

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
}

interface YouTubeState {
    configured: boolean;
    connected: boolean;
    channel_title: string | null;
    channel_url: string | null;
    notice: string | null;
}

function DiscordConnection({ discord }: { discord: DiscordState }) {
    return (
        <SettingsSection title="Discord" text="Link your Discord account to sync your SFD-DJ.EU server roles. We do not read your messages.">
            <div className="space-y-3">
                {discord.notice && <p className="rounded-lg bg-violet-500/10 px-3 py-2 text-sm text-violet-200">{discord.notice}</p>}
                {discord.username ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                        <p className="flex items-center gap-2 text-sm"><SocialIcon name="discord" size={18} /> Connected as <span className="font-semibold text-indigo-300">{discord.username}</span></p>
                        <div className="flex items-center gap-2">
                            {discord.configured && <a href={route('discord.connect')} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#5865F2] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">Sync server roles</a>}
                            <button onClick={() => confirm('Unlink Discord and remove SFD-DJ.EU server roles?') && router.delete(route('discord.disconnect'), { preserveScroll: true })} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20">Disconnect</button>
                        </div>
                    </div>
                ) : discord.configured ? (
                    <a href={route('discord.connect')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#5865F2] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"><SocialIcon name="discord" /> Connect Discord</a>
                ) : (
                    <p className="text-sm text-neutral-500">Discord linking is not configured on this site yet.</p>
                )}
                {discord.username && <p className="text-xs text-neutral-500">{discord.role_sync_configured ? 'Your SFD-DJ.EU roles sync to the SFD-DJ.EU Discord server.' : 'Automatic Discord server roles are not configured yet.'}</p>}
            </div>
        </SettingsSection>
    );
}

function SpotifyConnection({ spotify }: { spotify: SpotifyState }) {
    return (
        <SettingsSection title="Spotify" text="Connect Spotify to import playlists that account owns or collaborates on. Public visibility alone does not guarantee API access.">
            <div className="space-y-3">
                {spotify.notice && <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-200">{spotify.notice}</p>}
                {spotify.connected ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                        <p className="flex items-center gap-2 text-sm"><Music2 size={18} className="text-green-400" /> Connected as <span className="font-semibold text-green-300">{spotify.display_name || 'Spotify user'}</span></p>
                        <button onClick={() => confirm('Disconnect Spotify from SFD-DJ.EU?') && router.delete(route('spotify.disconnect'), { preserveScroll: true })} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20">Disconnect</button>
                    </div>
                ) : spotify.configured ? (
                    <a href={route('spotify.connect')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-500"><Music2 size={17} /> Connect Spotify</a>
                ) : (
                    <p className="text-sm text-neutral-500">Spotify linking is not configured on this site yet.</p>
                )}
                {spotify.connected && <p className="text-xs text-neutral-500">Tokens are encrypted and used only for playlist imports.</p>}
            </div>
        </SettingsSection>
    );
}
function YouTubeConnection({ youtube }: { youtube: YouTubeState }) {
    return (
        <SettingsSection title="YouTube" text="Connect your channel to import playlists available to your account and show the channel on your public SFD-DJ.EU profile. We only request read-only access.">
            <div className="space-y-3">
                {youtube.notice && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">{youtube.notice}</p>}
                {youtube.connected ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                        <p className="flex min-w-0 items-center gap-2 text-sm"><SocialIcon name="youtube" size={18} /> <span className="truncate">Connected as <span className="font-semibold text-red-300">{youtube.channel_title || 'YouTube channel'}</span></span></p>
                        <div className="flex items-center gap-2">
                            {youtube.channel_url && <a href={youtube.channel_url} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20">View channel</a>}
                            <button onClick={() => confirm('Disconnect YouTube from SFD-DJ.EU and remove it from your profile?') && router.delete(route('youtube.disconnect'), { preserveScroll: true })} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20">Disconnect</button>
                        </div>
                    </div>
                ) : youtube.configured ? (
                    <a href={route('youtube.connect')} target="_top" className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500"><SocialIcon name="youtube" size={17} /> Connect YouTube</a>
                ) : (
                    <p className="text-sm text-neutral-500">YouTube account linking is not configured on this site yet.</p>
                )}
                {youtube.connected && <p className="text-xs text-neutral-500">Your OAuth token is encrypted. SFD-DJ.EU uses read-only access to list playlists and channel information.</p>}
            </div>
        </SettingsSection>
    );
}

export default function Connections({ discord, spotify, youtube }: { discord: DiscordState; spotify: SpotifyState; youtube: YouTubeState }) {
    return (
        <SettingsLayout title="Connections" subtitle="Connect the accounts you use with SFD-DJ.EU. Disconnect them whenever you like.">
            <Head title="Connections" />
            <DiscordConnection discord={discord} />
            <SpotifyConnection spotify={spotify} />
            <YouTubeConnection youtube={youtube} />
            <p className="text-xs text-neutral-500">Only connected account names and your YouTube channel link can appear on your public profile. OAuth tokens are private and never sent to the browser.</p>
        </SettingsLayout>
    );
}
