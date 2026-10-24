import ContextMenu, { MenuAnchor, MenuItem } from '@/Components/ContextMenu';
import SocialIcon, { socialLabels } from '@/Components/SocialIcon';
import { Deck, mmss, originLabel } from '@/lib/playlists';
import { getJson, sendJson } from '@/lib/post';
import { useNewVersion } from '@/lib/version';
import { DISCORD_INVITE } from '@/lib/community';
import { Community } from '@/types';
import { router } from '@inertiajs/react';
import { Bot, Gavel, CalendarDays, Check, ChevronUp, CircleHelp, HandCoins, Info, LifeBuoy, ListMusic, Monitor, MonitorOff, MoreHorizontal, Music2, RefreshCw, ScrollText, SkipForward, X } from 'lucide-react';
import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';

const iconBtn = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-neutral-300 transition hover:bg-white/10 hover:text-white';
const money = (currency: string, amount: number) => `${currency}${amount.toFixed(2)}`;

/** Closes a popover on a click outside `box` or on Esc. */
function useDismiss(open: boolean, box: React.RefObject<HTMLElement | null>, close: () => void) {
    useEffect(() => {
        if (!open) return;
        const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && close();
        const esc = (e: KeyboardEvent) => e.key === 'Escape' && (e.preventDefault(), close());
        document.addEventListener('mousedown', away);
        document.addEventListener('keydown', esc);

        return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * The donation panel: the goal (when staff set one) and a Donate form for any amount from €1, named or anonymous. The payment page opens in this
 * window: Stripe's, which comes back to the room, or without Stripe the donation page set by staff (Ko-fi, PayPal ...).
 */
function DonatePanel({ community, slug, onClose }: { community: Community; slug: string; onClose: () => void }) {
    const goal = community.donation;
    const [amount, setAmount] = useState('');
    const [anonymous, setAnonymous] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const donate = (e: FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        sendJson<{ url: string }>('POST', route('donations.store'), { amount: Number(amount.replace(',', '.')), anonymous, room: slug })
            .then(({ url }) => window.location.assign(url)) // in this window, not a new one: Stripe's payment page (it comes back to the room) or the donation page staff set
            .catch((err: Error) => { setError(err.message); setBusy(false); });
    };

    return (
        <div role="dialog" aria-label="Donation goal" className="absolute bottom-full right-0 z-40 mb-3 w-88 max-w-[calc(100vw-1.5rem)] animate-menu rounded-2xl border border-white/10 bg-neutral-900/95 p-3 shadow-2xl shadow-black/60 backdrop-blur-md">
            <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/6 text-sky-300"><HandCoins size={18} /></span>
                <p className="flex-1 text-[15px] font-bold text-white">Donation Goal</p>
                <button onClick={onClose} aria-label="Close" className="rounded-lg border border-white/10 p-1.5 text-neutral-400 transition hover:bg-white/10 hover:text-white"><X size={16} /></button>
            </div>

            <form onSubmit={donate} className="mt-3 space-y-3 rounded-xl border border-white/10 bg-white/3 p-3">
                {goal && (
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="rounded-md border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-300">Global goal</span>
                            <span className="rounded-md border border-white/10 bg-white/6 px-2 py-0.5 text-[11px] font-bold tabular-nums text-neutral-200">{goal.percent}%</span>
                        </div>
                        <p className="mt-2 text-[13px] font-extrabold uppercase tracking-wide text-white">{goal.title}</p>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-linear-to-r from-sky-400 to-cyan-300" style={{ width: `${goal.percent}%` }} /></div>
                        <p className="mt-1.5 text-xs tabular-nums text-neutral-400">{money(goal.currency, goal.current)} of {money(goal.currency, goal.goal)}</p>
                    </div>
                )}
                {!goal && <p className="text-[13px] text-neutral-300">Help the project grow &lt;3 Every euro keeps the music going.</p>}

                <div className="flex gap-2">
                    <label className="flex h-11 min-w-0 flex-1 items-center rounded-xl border border-white/10 bg-black/30 focus-within:border-sky-400/60">
                        <span className="pl-3 pr-1 text-sm font-bold text-neutral-400">€</span>
                        <input
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            inputMode="decimal"
                            placeholder="Enter donation amount"
                            aria-label="Donation amount in euro"
                            className="min-w-0 flex-1 border-0 bg-transparent px-1 text-sm text-white placeholder-neutral-500 focus:ring-0"
                        />
                    </label>
                    <button disabled={busy || !community.donate || !(Number(amount.replace(',', '.')) >= 1)} className="h-11 shrink-0 rounded-xl bg-sky-500 px-5 text-sm font-bold text-white transition hover:bg-sky-400 disabled:opacity-40">{busy ? '…' : 'Donate'}</button>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/3 p-3">
                    <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-white/30 bg-transparent text-sky-500 focus:ring-sky-400" />
                    <span>
                        <span className="block text-[13px] font-bold text-white">Donate anonymously</span>
                        <span className="block text-xs text-neutral-400">Your name will not appear in the donation announcement.</span>
                    </span>
                </label>

                {error && <p className="text-xs text-red-400">{error}</p>}
                {!community.donate && <p className="text-xs text-amber-300">Donations open soon. Thank you for wanting to help!</p>}
                {community.donate && <p className="text-[11px] text-neutral-500">Any amount from €1 to €1,000. Payments are handled securely by Stripe.</p>}
            </form>
        </div>
    );
}

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
 * The bar under the room. On the left the playlist I play from and the next track of it, on the right the buttons ("New update available" when the
 * site has a newer build, Donate, the video on or off, skip, and More). The volume and how far the song is are in the bar at the top (RoomHeader);
 * the playlists open from the menu, or from the two cards here. It leaves things out step by step as it gets narrower.
 */
export default function RoomFootbar({ guest, slug, playbackOn, onPlayback, canSkip, onSkip, onPlaylists, onRoomInfo, onUpdates, canModerate = false, onModeration, onOpenPage, community, refreshKey }: {
    guest: boolean;
    slug: string;
    playbackOn: boolean;
    onPlayback: () => void;
    canSkip: boolean;
    onSkip: () => void;
    onPlaylists: () => void;
    onRoomInfo: () => void;
    onUpdates?: () => void;
    canModerate?: boolean;
    onModeration?: () => void;
    onOpenPage: (url: string, title: string) => void; // a page of the site in the room's overlay (Events, FAQ, Patch notes)
    community: Community;
    refreshKey: string | number; // when this changes the playlists are read again
}) {
    const [bar, width] = useWidth();
    const tier = width >= 720 ? 3 : width >= 520 ? 2 : width >= 300 ? 1 : 0;
    const [deck, setDeck] = useState<Deck | null>(null);
    const [pick, setPick] = useState(false);
    const [more, setMore] = useState<MenuAnchor | null>(null);
    const [giving, setGiving] = useState(false);
    const picker = useRef<HTMLDivElement>(null);
    const giver = useRef<HTMLDivElement>(null);
    const update = useNewVersion();

    useDismiss(giving, giver, () => setGiving(false));

    useEffect(() => {
        if (guest) return;
        let alive = true;
        getJson<Deck>(route('api.playlists.deck')).then((d) => alive && setDeck(d)).catch(() => {});

        return () => { alive = false; };
    }, [guest, refreshKey]);

    useDismiss(pick, picker, () => setPick(false));

    const activate = (id: number) => {
        setPick(false);
        sendJson<Deck>('POST', route('api.playlists.activate', id)).then(setDeck).catch(() => {});
    };

    const active = deck?.lists.find((l) => l.is_active) ?? null;
    const next = deck?.next ?? null;
    const goal = community.donation;

    // More: the room, then the community (events, our Discord and the other links staff set in Community settings), then help
    const socials = Object.entries({ ...community.social, discord: DISCORD_INVITE }).map(([key, url]): MenuItem => ({
        label: socialLabels[key] ?? key,
        icon: ({ size, className }: { size?: number; className?: string }) => <span className={className}><SocialIcon name={key} size={size} /></span>,
        onSelect: () => window.open(url, '_blank', 'noopener,noreferrer'),
    }));
    const moreItems: MenuItem[][] = [
        [
            { label: 'Room info', icon: Info, onSelect: onRoomInfo },
            ...(onUpdates ? [{ label: 'Room updates', icon: ScrollText, onSelect: onUpdates }] : []),
            ...(!guest && canModerate && onModeration ? [{ label: 'Room moderation', icon: Gavel, onSelect: onModeration }] : []),
            ...(!guest ? [{ label: 'Selfbots', icon: Bot, onSelect: () => onOpenPage(route('selfbots'), 'Selfbots') }] : []),
        ],
        [{ label: 'Events', icon: CalendarDays, onSelect: () => onOpenPage(route('events'), 'Events') }, ...socials],
        [
            { label: 'FAQ', icon: CircleHelp, onSelect: () => onOpenPage(route('faq'), 'FAQ') },
            { label: 'Contact support', icon: LifeBuoy, onSelect: () => window.dispatchEvent(new Event('sfd:support')) },
            { label: 'Patch notes', icon: ScrollText, onSelect: () => onOpenPage(route('patch-notes'), 'Patch notes') },
        ],
    ];
    const giveTip = goal ? `Donation Goal\n${goal.title}\n${goal.percent}%` : 'Donate\nHelp the project grow <3';

    return (
        <footer ref={bar} className="sfd-footbar relative flex h-17 shrink-0 items-center gap-3 border-t border-white/10 bg-linear-to-b from-neutral-950/95 to-black px-3 text-sm sm:px-4">
            <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-violet-500/50 to-transparent" />

            {/* the playlist I play from, and what comes next */}
            {!guest && tier >= 1 && (
                <>
                    <div ref={picker} className="relative shrink-0">
                        <button
                            onClick={() => setPick(!pick)}
                            aria-haspopup="listbox"
                            aria-expanded={pick}
                            title="The playlist you play from"
                            className={`flex h-11 items-center gap-2.5 rounded-xl border px-2.5 text-left transition ${pick ? 'border-violet-400/50 bg-violet-500/15' : 'border-white/10 bg-white/4 hover:bg-white/10'} ${tier === 1 ? 'w-12 justify-center px-0' : tier === 2 ? 'w-40' : 'w-52'}`}
                        >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-fuchsia-500/40 to-violet-500/40 text-violet-100"><ListMusic size={15} /></span>
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
                        <button onClick={onPlaylists} title="Your next track: open the playlists" className={`flex h-11 min-w-0 items-center gap-2.5 rounded-xl border border-white/10 bg-white/4 px-2.5 text-left transition hover:bg-white/10 ${tier === 3 ? 'w-64' : 'w-40'}`}>
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
                {update && (
                    <button
                        onClick={() => window.location.reload()}
                        title="A new version of SFD-DJ.EU is out. Click to reload the page and get it."
                        className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3 text-[13px] font-semibold text-emerald-100 transition hover:bg-emerald-500/25"
                    >
                        <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span>
                        <RefreshCw size={15} />
                        {tier >= 2 && 'New update available'}
                    </button>
                )}
                {!guest && (
                    <div ref={giver} className="group/give relative shrink-0">
                        <button
                            onClick={() => { setGiving(!giving); !giving && router.reload({ only: ['community'] }); /* the newest total */ }}
                            aria-label="Donation goal"
                            aria-expanded={giving}
                            className={`${iconBtn} relative ${giving ? 'border-sky-400/50! bg-sky-500/20! text-sky-200!' : 'hover:text-sky-300!'}`}
                        >
                            <HandCoins size={18} />
                            {goal && <span className="absolute inset-x-1.5 bottom-1 h-0.5 overflow-hidden rounded-full bg-white/15"><span className="block h-full bg-sky-400" style={{ width: `${goal.percent}%` }} /></span>}
                        </button>
                        {!giving && <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-pre rounded-lg border border-white/10 bg-neutral-950/95 px-3 py-2 text-center text-xs font-semibold leading-5 text-neutral-100 shadow-xl group-hover/give:block">{giveTip}</span>}
                        {giving && <DonatePanel community={community} slug={slug} onClose={() => setGiving(false)} />}
                    </div>
                )}
                <button
                    onClick={onPlayback}
                    aria-label={playbackOn ? 'Turn the video off' : 'Turn the video on'}
                    aria-pressed={playbackOn}
                    title={playbackOn ? 'Playback is on. Click to turn the video and sound off here.' : 'Playback is off. Click to turn it on.'}
                    className={`sfd-playback ${iconBtn} ${playbackOn ? 'sfd-playbackon ' : 'sfd-playbackoff border-red-400/40! bg-red-500/20! text-red-200!'}`}
                >
                    {playbackOn ? <Monitor size={18} /> : <MonitorOff size={18} />}
                </button>
                {canSkip && <button onClick={onSkip} aria-label="Skip song" title="Skip song" className={`${iconBtn} border-violet-400/30! bg-violet-500/15! text-violet-100! hover:bg-violet-500/30!`}><SkipForward size={18} /></button>}
                <button
                    data-menu-trigger
                    aria-label="More"
                    title="More"
                    onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setMore(more ? null : { x: r.right, y: window.innerHeight, right: true, flipTo: r.top - 8 }); /* y at the bottom of the window: it never fits below, so it opens above */ }}
                    aria-haspopup="menu"
                    className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-[13px] font-semibold text-neutral-200 transition hover:bg-white/10"
                >
                    <MoreHorizontal size={17} /> {tier >= 2 && 'More'}
                </button>
            </div>

            {more && <ContextMenu roomScoped anchor={more} label="More" groups={moreItems} titles={[undefined, 'Community', 'Help']} onClose={() => setMore(null)} />}
        </footer>
    );
}
