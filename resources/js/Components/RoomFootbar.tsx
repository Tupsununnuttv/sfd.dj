import ContextMenu, { MenuAnchor, MenuItem } from '@/Components/ContextMenu';
import { socialLabels } from '@/Components/SocialIcon';
import { Deck, mmss, originLabel } from '@/lib/playlists';
import { getJson, sendJson } from '@/lib/post';
import { Community } from '@/types';
import { Check, ChevronUp, ExternalLink, Heart, Info, ListMusic, Monitor, MonitorOff, MoreHorizontal, Music2, SkipForward } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const iconBtn = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-neutral-300 transition hover:bg-white/10 hover:text-white';

/** How wide the footbar is, so it can leave things out when there is no room (the room is narrower when the window is small or the menu is open). */
function useWidth() {
    const ref = useRef<HTMLElement>(null);
    const [width, setWidth] = useState(1200);

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const watch = new ResizeObserver(() => setWidth(el.getBoundingClientRect().width));
        watch.observe(el);
        setWidth(el.getBoundingClientRect().width);

        return () => watch.disconnect();
    }, []);

    return [ref, width] as const;
}

/**
 * The bar under the room. On the left the playlist I play from and the next track of it, on the right the buttons (the video on or off, skip, and More).
 * The volume and how far the song is are in the bar at the top (RoomHeader); the playlists open from the menu, or from the two cards here.
 * It leaves things out step by step as it gets narrower.
 */
export default function RoomFootbar({ guest, playbackOn, onPlayback, canSkip, onSkip, onPlaylists, onRoomInfo, community, refreshKey }: {
    guest: boolean;
    playbackOn: boolean;
    onPlayback: () => void;
    canSkip: boolean;
    onSkip: () => void;
    onPlaylists: () => void;
    onRoomInfo: () => void;
    community: Community;
    refreshKey: string | number; // when this changes the playlists are read again
}) {
    const [bar, width] = useWidth();
    const tier = width >= 720 ? 3 : width >= 520 ? 2 : width >= 300 ? 1 : 0;
    const [deck, setDeck] = useState<Deck | null>(null);
    const [pick, setPick] = useState(false);
    const [more, setMore] = useState<MenuAnchor | null>(null);
    const picker = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (guest) return;
        let alive = true;
        getJson<Deck>(route('api.playlists.deck')).then((d) => alive && setDeck(d)).catch(() => {});

        return () => { alive = false; };
    }, [guest, refreshKey]);

    useEffect(() => {
        if (!pick) return;
        const away = (e: MouseEvent) => !picker.current?.contains(e.target as Node) && setPick(false);
        const esc = (e: KeyboardEvent) => e.key === 'Escape' && (e.preventDefault(), setPick(false));
        document.addEventListener('mousedown', away);
        document.addEventListener('keydown', esc);

        return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
    }, [pick]);

    const activate = (id: number) => {
        setPick(false);
        sendJson<Deck>('POST', route('api.playlists.activate', id)).then(setDeck).catch(() => {});
    };

    const active = deck?.lists.find((l) => l.is_active) ?? null;
    const next = deck?.next ?? null;
    const goal = community.donation;

    const moreItems: MenuItem[][] = [
        [{ label: 'Room info', icon: Info, onSelect: onRoomInfo }],
        ...(Object.keys(community.social).length ? [Object.entries(community.social).map(([key, url]): MenuItem => ({ label: socialLabels[key] ?? key, icon: ExternalLink, onSelect: () => window.open(url, '_blank', 'noopener,noreferrer') }))] : []),
        ...(goal ? [[{ label: `${goal.title}: ${goal.percent}%`, icon: Heart, onSelect: () => goal.url && window.open(goal.url, '_blank', 'noopener,noreferrer') }]] : []),
    ];

    return (
        <footer ref={bar} className="sfd-footbar relative flex h-[68px] shrink-0 items-center gap-3 border-t border-white/10 bg-gradient-to-b from-neutral-950/95 to-black px-3 text-sm sm:px-4">
            <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

            {/* the playlist I play from, and what comes next */}
            {!guest && tier >= 1 && (
                <>
                    <div ref={picker} className="relative shrink-0">
                        <button
                            onClick={() => setPick(!pick)}
                            aria-haspopup="listbox"
                            aria-expanded={pick}
                            title="The playlist you play from"
                            className={`flex h-11 items-center gap-2.5 rounded-xl border px-2.5 text-left transition ${pick ? 'border-violet-400/50 bg-violet-500/15' : 'border-white/10 bg-white/[0.04] hover:bg-white/10'} ${tier === 1 ? 'w-12 justify-center px-0' : tier === 2 ? 'w-40' : 'w-52'}`}
                        >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500/40 to-violet-500/40 text-violet-100"><ListMusic size={15} /></span>
                            {tier >= 2 && (
                                <>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate whitespace-nowrap text-[9px] font-bold uppercase leading-3 tracking-[0.14em] text-neutral-500">{tier === 3 ? 'Active playlist' : 'Playlist'}</span>
                                        <span className="block truncate text-[13px] font-bold leading-4 text-neutral-100">{active ? active.name : deck ? 'None yet' : '…'}</span>
                                    </span>
                                    <ChevronUp size={15} className={`shrink-0 text-neutral-500 transition ${pick ? 'rotate-180' : ''}`} />
                                </>
                            )}
                        </button>
                        {pick && (
                            <div role="listbox" aria-label="Active playlist" className="absolute bottom-full left-0 z-40 mb-3 w-72 animate-menu rounded-2xl border border-white/10 bg-neutral-900/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-md">
                                <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">Play from</p>
                                <ul className="max-h-64 overflow-y-auto">
                                    {deck?.lists.length === 0 && <li className="px-2.5 py-3 text-sm text-neutral-500">You have no playlist yet.</li>}
                                    {deck?.lists.map((l) => (
                                        <li key={l.id}>
                                            <button role="option" aria-selected={l.is_active} onClick={() => activate(l.id)} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/10">
                                                <span className={`min-w-0 flex-1 truncate font-semibold ${l.is_active ? 'text-white' : 'text-neutral-300'}`}>{l.name}</span>
                                                <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-neutral-300">{l.songs_count}</span>
                                                <Check size={15} className={l.is_active ? 'text-emerald-300' : 'invisible'} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-1 border-t border-white/10 pt-1">
                                    <button onClick={() => { setPick(false); onPlaylists(); }} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] font-semibold text-violet-200 transition hover:bg-white/10"><ListMusic size={15} /> Manage playlists</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {tier >= 2 && (
                        <button onClick={onPlaylists} title="Your next track: open the playlists" className={`flex h-11 min-w-0 items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 text-left transition hover:bg-white/10 ${tier === 3 ? 'w-64' : 'w-40'}`}>
                            <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-neutral-800 ring-1 ring-white/10">
                                {next?.thumbnail ? <img src={next.thumbnail} alt="" className="h-full w-full object-cover" /> : <Music2 size={15} className="m-auto mt-2 text-neutral-600" />}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate whitespace-nowrap text-[9px] font-bold uppercase leading-3 tracking-[0.14em] text-neutral-500">Next track</span>
                                <span className="block truncate text-[13px] font-bold leading-4 text-neutral-100" title={next?.title}>{next ? next.title : !deck ? '…' : active ? 'This playlist is empty' : 'Make a playlist'}</span>
                                {tier === 3 && next && <span className="block truncate text-[10px] leading-3 text-neutral-500">{next.channel || originLabel[next.origin]}{next.duration > 0 ? ` · ${mmss(next.duration)}` : ''}</span>}
                            </span>
                        </button>
                    )}
                </>
            )}

            <div className="flex-1" />

            {/* the buttons */}
            <div className="flex shrink-0 items-center gap-2">
                <button
                    onClick={onPlayback}
                    aria-label={playbackOn ? 'Turn the video off' : 'Turn the video on'}
                    aria-pressed={playbackOn}
                    title={playbackOn ? 'Playback is on. Click to turn the video and sound off here.' : 'Playback is off. Click to turn it on.'}
                    className={`${iconBtn} ${playbackOn ? '' : '!border-red-400/40 !bg-red-500/20 !text-red-200'}`}
                >
                    {playbackOn ? <Monitor size={18} /> : <MonitorOff size={18} />}
                </button>
                {canSkip && <button onClick={onSkip} aria-label="Skip song" title="Skip song" className={`${iconBtn} !border-violet-400/30 !bg-violet-500/15 !text-violet-100 hover:!bg-violet-500/30`}><SkipForward size={18} /></button>}
                <button
                    data-menu-trigger
                    onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setMore(more ? null : { x: r.right, y: window.innerHeight, right: true, flipTo: r.top - 8 }); /* y at the bottom of the window: it never fits below, so it opens above */ }}
                    aria-haspopup="menu"
                    className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-[13px] font-semibold text-neutral-200 transition hover:bg-white/10"
                >
                    <MoreHorizontal size={17} /> {tier >= 2 && 'More'}
                </button>
            </div>

            {more && <ContextMenu anchor={more} label="More" groups={moreItems} onClose={() => setMore(null)} />}
        </footer>
    );
}
