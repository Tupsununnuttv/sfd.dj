import ApplicationLogo from '@/Components/ApplicationLogo';
import RoomBadge from '@/Components/RoomBadge';
import { Equalizer } from '@/Components/ui';
import { discordActivity } from '@/lib/discordActivity';
import { poll } from '@/lib/polling';
import { sendJson } from '@/lib/post';
import { PageProps } from '@/types';
import type { DiscordSDK } from '@discord/embedded-app-sdk';
import { Head, router, usePage } from '@inertiajs/react';
import { ExternalLink, Lock, LogIn } from 'lucide-react';
import { type MouseEvent, useEffect, useState } from 'react';

interface ActivityRoom {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    badges: string[] | null;
    genre: string | null;
    is_private: boolean;
    is_featured: boolean;
    items_count: number;
    user: { name: string };
    listening: number;
    now_playing: string | null;
    live_title: string | null;
    url: string;
}

/**
 * The website inside Discord (Discord Activity): the live rooms and a button to the full website. Discord's proxy only lets an Activity
 * reach its own address, so rooms (video, sockets, pictures from other sites) open on the full website and this page stays text only.
 * Outside Discord the same page works as a plain preview: no SDK is started and the links are normal links.
 */

// one SDK per page: its constructor reads frame_id from the address and throws without it; ready() never answers outside Discord, so it times out
let sdk: Promise<DiscordSDK> | null = null;
let sdkInstance: DiscordSDK | null = null;
function startSdk(applicationId: string): Promise<DiscordSDK> {
    sdk ??= import('@discord/embedded-app-sdk')
        .then(async ({ DiscordSDK }) => {
            const discord = sdkInstance ??= new DiscordSDK(applicationId);
            let timeout: number | undefined;
            try {
                await Promise.race([discord.ready(), new Promise<never>((_, reject) => {
                    timeout = window.setTimeout(() => reject(new Error('Discord did not answer.')), 15000);
                })]);
            } finally {
                window.clearTimeout(timeout);
            }
            return discord;
        })
        .catch((error) => {
            sdk = null; // retry the same handshake without registering another SDK message listener
            throw error;
        });
    return sdk;
}

const messageOf = (error: unknown, fallback: string) => (error as { message?: string } | null)?.message || fallback;

const signInNotes: Record<string, string> = {
    unlinked: 'This Discord account is not linked to an SFD-DJ.EU account yet. Link it in Settings > Connections on the full website to sign in here.',
    'two-factor': 'Your account uses two-factor login. Sign in on the full website.',
    unverified: 'Confirm your email address on the full website first.',
};

export default function Activity({ applicationId, signInAvailable, siteUrl, rooms }: { applicationId: string | null; signInAvailable: boolean; siteUrl: string; rooms: ActivityRoom[] }) {
    const { auth } = usePage<PageProps>().props;
    const [phase, setPhase] = useState<'outside' | 'starting' | 'ready' | 'failed'>(discordActivity ? 'starting' : 'outside');
    const [attempt, setAttempt] = useState(0);
    const [problem, setProblem] = useState<string | null>(null);
    const [note, setNote] = useState<string | null>(null);
    const [signingIn, setSigningIn] = useState(false);

    useEffect(() => {
        if (!discordActivity) return;
        if (!applicationId) {
            setPhase('failed');
            setProblem('Discord is not set up on this site yet.');
            return;
        }
        let live = true;
        setProblem(null);
        setPhase('starting');
        startSdk(applicationId)
            .then(() => live && setPhase('ready'))
            .catch((error) => {
                if (!live) return;
                setPhase('failed');
                setProblem(messageOf(error, 'The Activity could not start.'));
            });
        return () => {
            live = false;
        };
    }, [applicationId, attempt]);

    // no sockets here (see app.tsx): the room list is refreshed every 20 seconds while the Activity is in view
    useEffect(() => {
        const job = poll(() => new Promise<void>((resolve) => router.reload({ only: ['rooms'], onFinish: () => resolve() })), { interval: 20000, immediate: false });
        return () => job.stop();
    }, []);

    const open = (url: string) => (event: MouseEvent) => {
        if (!discordActivity || !applicationId || !url) return;
        event.preventDefault();
        setNote(null);
        startSdk(applicationId)
            .then((discord) => discord.commands.openExternalLink({ url }))
            .catch(() => setNote(`Could not open the link from Discord. Open this address in your browser: ${url}`));
    };

    const signIn = async () => {
        if (!applicationId || !signInAvailable) return;
        setSigningIn(true);
        setNote(null);
        try {
            const discord = await startSdk(applicationId);
            // identify only: who you are on Discord. The code is exchanged on the server, which keeps the client secret.
            const { code } = await discord.commands.authorize({ client_id: applicationId, response_type: 'code', state: '', prompt: 'none', scope: ['identify'] });
            const { status } = await sendJson<{ status: string }>('POST', '/discord/token', { code });
            if (status === 'signed-in') router.reload({ only: ['auth', 'rooms'] });
            else setNote(signInNotes[status] ?? 'Sign in did not work.');
        } catch (error) {
            setNote(messageOf(error, 'Sign in did not work.'));
        } finally {
            setSigningIn(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            <Head title="Discord Activity" />

            <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-neutral-950/90 px-4 py-3 backdrop-blur">
                <ApplicationLogo className="text-base" />
                <a
                    href={siteUrl || '/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={open(siteUrl)}
                    className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                    <ExternalLink size={15} aria-hidden /> Open Full Website
                </a>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-5">
                {phase === 'starting' && <p className="mb-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-300" role="status">Connecting to Discord…</p>}
                {phase === 'failed' && (
                    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
                        <span>{problem}</span>
                        {applicationId && <button type="button" onClick={() => setAttempt((n) => n + 1)} className="rounded-full border border-red-300/40 px-3 py-1 font-semibold hover:bg-red-500/20">Try again</button>}
                    </div>
                )}
                {phase === 'outside' && <p className="mb-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-300">This is the page Discord opens as an Activity. Outside Discord it is only a preview.</p>}
                {note && <p className="mb-4 wrap-break-word rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100" role="status">{note}</p>}

                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-black">Live rooms</h1>
                    {auth?.guest ? (
                        phase === 'ready' && signInAvailable && (
                            <button type="button" onClick={signIn} disabled={signingIn} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-60">
                                <LogIn size={15} aria-hidden /> {signingIn ? 'Signing in…' : 'Sign in with Discord'}
                            </button>
                        )
                    ) : (
                        <p className="text-sm text-neutral-300">Signed in as <span className="font-bold text-white">{auth.user.name}</span></p>
                    )}
                </div>

                {rooms.length === 0 ? (
                    <p className="rounded-2xl border border-white/10 bg-white/4 p-8 text-center text-neutral-400">No rooms are open yet. Start one on the full website.</p>
                ) : (
                    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {rooms.map((room) => (
                            <li key={room.id} data-room-name={room.name} className="flex min-w-0 flex-col rounded-2xl border border-white/10 bg-white/4 p-4">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <h2 className="max-w-full truncate font-bold">{room.name}</h2>
                                    <RoomBadge badges={room.badges} />
                                    {room.is_private && <Lock size={13} className="text-neutral-400" aria-label="Private room" />}
                                </div>
                                <p className={`mt-1 flex items-center gap-1.5 text-xs font-semibold ${room.listening > 0 ? 'text-green-400' : 'text-neutral-500'}`}>
                                    {room.listening > 0 && <Equalizer />} {room.listening} {room.listening === 1 ? 'listener' : 'listening'}
                                    {room.genre && <span className="font-normal text-violet-200">· {room.genre}</span>}
                                </p>
                                {room.live_title ? (
                                    <p className="mt-2 truncate text-sm text-neutral-200">🔴 {room.live_title}</p>
                                ) : room.now_playing ? (
                                    <p className="mt-2 truncate text-sm text-neutral-200">▶ {room.now_playing}</p>
                                ) : (
                                    <p className="mt-2 line-clamp-2 text-sm text-neutral-400">{room.description || 'Waiting for the next DJ…'}</p>
                                )}
                                <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-neutral-500">
                                    <span className="truncate">{room.user.name} · {room.items_count} in queue</span>
                                    <a href={room.url} target="_blank" rel="noopener noreferrer" onClick={open(room.url)} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 font-semibold text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
                                        Open room <ExternalLink size={12} aria-hidden />
                                    </a>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </main>
        </div>
    );
}
