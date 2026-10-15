import ContextMenu, { MenuAnchor, MenuItem } from '@/Components/ContextMenu';
import VideoPreview from '@/Components/playlists/VideoPreview';
import { mmss, originLabel, Song, watchUrl } from '@/lib/playlists';
import { ArrowDownToLine, ArrowUpToLine, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, GripVertical, Link2, ListPlus, MoreVertical, Music2, Play, Trash2 } from 'lucide-react';
import { DragEvent, useEffect, useMemo, useRef, useState } from 'react';

export const PAGE = 50;

/** The tracks of one playlist in play order: drag one to move it, the menu moves it to the top or the bottom, 50 to a page. */
export default function TrackList({ songs, availability, filter, isActive, roomSlug, busy, checkingAvailability, onReorder, onQueue, onRemove, onCheckAvailability, onNotice, empty }: {
    songs: Song[];
    availability: Record<number, boolean>;
    filter: string;
    isActive: boolean; // the first track of the active playlist is the next track
    roomSlug?: string;
    busy: boolean;
    checkingAvailability: boolean;
    onReorder: (ids: number[]) => void;
    onQueue: (song: Song) => void;
    onRemove: (song: Song) => void;
    onCheckAvailability: (songs: Song[]) => void;
    onNotice: (text: string) => void;
    empty: string;
}) {
    const [page, setPage] = useState(1);
    const [drag, setDrag] = useState<number | null>(null);
    const [over, setOver] = useState<{ id: number; after: boolean } | null>(null);
    const [menu, setMenu] = useState<{ song: Song; anchor: MenuAnchor } | null>(null);
    const [watching, setWatching] = useState<Song | null>(null);
    const top = useRef<HTMLDivElement>(null);

    const q = filter.trim().toLowerCase();
    const shown = useMemo(() => (q ? songs.filter((s) => `${s.title} ${s.channel ?? ''}`.toLowerCase().includes(q)) : songs), [songs, q]);
    const pages = Math.max(1, Math.ceil(shown.length / PAGE));
    const at = Math.min(page, pages);
    const rows = shown.slice((at - 1) * PAGE, at * PAGE);
    const canDrag = !q && !busy;

    useEffect(() => { setPage(1); }, [q]);
    useEffect(() => { top.current?.scrollTo({ top: 0 }); }, [at]);

    const move = (song: Song, to: 'top' | 'bottom') => {
        const rest = songs.filter((s) => s.id !== song.id).map((s) => s.id);
        onReorder(to === 'top' ? [song.id, ...rest] : [...rest, song.id]);
    };

    const drop = (e: DragEvent) => {
        e.preventDefault();
        if (drag !== null && over && over.id !== drag) {
            const rest = songs.filter((s) => s.id !== drag).map((s) => s.id);
            const to = rest.indexOf(over.id) + (over.after ? 1 : 0);
            onReorder([...rest.slice(0, to), drag, ...rest.slice(to)]);
        }
        setDrag(null);
        setOver(null);
    };

    const openMenu = (song: Song, el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        setMenu({ song, anchor: { x: r.right, y: r.bottom + 4, right: true, flipTo: r.top - 4 } });
    };

    const itemsFor = (song: Song): MenuItem[][] => {
        const index = songs.findIndex((s) => s.id === song.id);

        return [
            ...(roomSlug ? [[{ label: 'Queue in this room', icon: ListPlus, onSelect: () => onQueue(song) }]] : []),
            [
                ...(index > 0 ? [{ label: 'Move to the top', icon: ArrowUpToLine, onSelect: () => move(song, 'top') }] : []),
                ...(index < songs.length - 1 ? [{ label: 'Move to the bottom', icon: ArrowDownToLine, onSelect: () => move(song, 'bottom') }] : []),
            ],
            [
                { label: 'Watch video', icon: Play, onSelect: () => setWatching(song) },
                { label: 'Open on YouTube', icon: ExternalLink, onSelect: () => window.open(watchUrl(song.youtube_id), '_blank', 'noopener,noreferrer') },
                { label: 'Copy link', icon: Link2, onSelect: () => navigator.clipboard?.writeText(watchUrl(song.youtube_id)).then(() => onNotice('Link copied.'), () => onNotice('Could not copy the link.')) },
            ],
            [{ label: 'Remove from playlist', icon: Trash2, danger: true, onSelect: () => onRemove(song) }],
        ].filter((g) => g.length);
    };

    // 1 2 3 … 9: the first, the last and the ones around where you are
    const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - at) <= 1);

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            {rows.length > 0 && (
                <div className="flex shrink-0 justify-end pb-2">
                    <button onClick={() => onCheckAvailability(rows)} disabled={busy || checkingAvailability} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-neutral-300 transition hover:bg-white/5 hover:text-white disabled:opacity-50">
                        <CheckCircle2 size={14} /> {checkingAvailability ? 'Checking…' : `Check ${rows.length} visible`}
                    </button>
                </div>
            )}
            <div ref={top} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
                {rows.length === 0 ? (
                    <p className="px-3 py-10 text-center text-sm text-neutral-500">{q ? 'No track here matches that.' : empty}</p>
                ) : (
                    <ul data-tracks onDragOver={(e) => canDrag && drag !== null && e.preventDefault()} onDrop={drop}>
                        {rows.map((s) => {
                            const index = songs.indexOf(s);
                            const next = isActive && index === 0;
                            const line = over?.id === s.id && drag !== s.id ? (over.after ? 'after:opacity-100' : 'before:opacity-100') : '';

                            return (
                                <li
                                    key={s.id}
                                    draggable={canDrag}
                                    onDragStart={(e) => { setDrag(s.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(s.id)); }}
                                    onDragOver={(e) => {
                                        if (drag === null) return;
                                        e.preventDefault();
                                        const r = e.currentTarget.getBoundingClientRect();
                                        setOver({ id: s.id, after: e.clientY > r.top + r.height / 2 });
                                    }}
                                    onDragEnd={() => { setDrag(null); setOver(null); }}
                                    className={`group relative flex items-center gap-3 rounded-xl px-2 py-1.5 transition before:pointer-events-none before:absolute before:inset-x-2 before:-top-px before:h-0.5 before:rounded-full before:bg-violet-400 before:opacity-0 before:shadow-[0_0_8px_#a78bfa] after:pointer-events-none after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-violet-400 after:opacity-0 after:shadow-[0_0_8px_#a78bfa] hover:bg-white/5 ${drag === s.id ? 'opacity-40' : ''} ${line} ${next ? 'bg-violet-500/[0.07]' : ''}`}
                                >
                                    <span title={canDrag ? 'Drag to move' : q ? 'Clear the search to drag tracks' : undefined} className={`flex w-5 shrink-0 items-center justify-center ${canDrag ? 'cursor-grab text-neutral-600 group-hover:text-neutral-300 active:cursor-grabbing' : 'text-neutral-800'}`}>
                                        <GripVertical size={16} />
                                    </span>
                                    <span className="w-7 shrink-0 text-center text-xs font-semibold tabular-nums text-neutral-500">{index + 1}</span>
                                    <button type="button" onClick={() => setWatching(s)} title="Watch the video" aria-label={`Watch ${s.title}`} className="group/thumb relative h-10 w-18 shrink-0 overflow-hidden rounded-lg bg-neutral-800 ring-1 ring-white/10 transition hover:ring-violet-400/70">
                                        {s.thumbnail ? <img src={s.thumbnail} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover" /> : <Music2 size={18} className="m-auto mt-3 text-neutral-600" />}
                                        {s.duration > 0 && <span className="absolute bottom-0.5 right-0.5 rounded bg-black/75 px-1 text-[10px] font-semibold leading-4 tabular-nums text-white">{mmss(s.duration)}</span>}
                                        <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition group-hover/thumb:opacity-100 group-focus-visible/thumb:opacity-100"><Play size={16} fill="currentColor" /></span>
                                    </button>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center gap-2">
                                            <span className="truncate font-semibold text-neutral-100" title={s.title}>{s.title}</span>
                                            {next && <span className="shrink-0 rounded bg-violet-500/25 px-1.5 text-[10px] font-bold uppercase leading-4 tracking-wider text-violet-200">Next</span>}
                                        </span>
                                        <span className="flex min-w-0 items-center gap-2 text-xs">
                                            <span className="min-w-0 truncate text-neutral-500">{s.channel || originLabel[s.origin]}{s.channel && s.origin !== 'youtube' ? ` · ${originLabel[s.origin]}` : ''}</span>
                                            {availability[s.id] !== undefined && <span className={`shrink-0 font-semibold ${availability[s.id] ? 'text-emerald-400' : 'text-rose-400'}`}>{availability[s.id] ? 'Available' : 'Unavailable Song'}</span>}
                                        </span>
                                    </span>
                                    {roomSlug && (
                                        <button onClick={() => onQueue(s)} disabled={busy} className="hidden shrink-0 rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 px-3 py-1.5 text-xs font-bold text-white opacity-0 transition hover:opacity-90 focus:opacity-100 group-hover:opacity-100 disabled:opacity-40 lg:block">
                                            Queue
                                        </button>
                                    )}
                                    <button
                                        data-menu-trigger
                                        onClick={(e) => (menu?.song.id === s.id ? setMenu(null) : openMenu(s, e.currentTarget))}
                                        aria-label={`Actions for ${s.title}`}
                                        aria-haspopup="menu"
                                        className="shrink-0 rounded-lg p-1.5 text-neutral-500 transition hover:bg-white/10 hover:text-white focus:bg-white/10"
                                    >
                                        <MoreVertical size={17} />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {pages > 1 && (
                <nav aria-label="Pages" className="mt-3 flex shrink-0 items-center justify-between gap-3 border-t border-white/10 pt-3">
                    <button onClick={() => setPage(at - 1)} disabled={at === 1} aria-label="Previous page" className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-white/10 disabled:opacity-35">
                        <ChevronLeft size={16} /> <span className="hidden whitespace-nowrap xl:inline">Previous page</span>
                    </button>
                    <span className="flex items-center gap-1">
                        {numbers.map((n, i) => (
                            <span key={n} className="flex items-center gap-1">
                                {i > 0 && n - numbers[i - 1] > 1 && <span className="px-1 text-neutral-600">…</span>}
                                <button onClick={() => setPage(n)} aria-current={n === at ? 'page' : undefined} className={`h-9 min-w-9 rounded-xl px-2 text-sm font-bold tabular-nums transition ${n === at ? 'bg-linear-to-r from-fuchsia-500 to-violet-500 text-white shadow-lg shadow-violet-900/40' : 'text-neutral-400 hover:bg-white/10 hover:text-white'}`}>{n}</button>
                            </span>
                        ))}
                    </span>
                    <button onClick={() => setPage(at + 1)} disabled={at === pages} aria-label="Next page" className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-white/10 disabled:opacity-35">
                        <span className="hidden whitespace-nowrap xl:inline">Next page</span> <ChevronRight size={16} />
                    </button>
                </nav>
            )}

            {menu && <ContextMenu anchor={menu.anchor} label={`Actions for ${menu.song.title}`} groups={itemsFor(menu.song)} onClose={() => setMenu(null)} />}
            {watching && (
                <VideoPreview id={watching.youtube_id} title={watching.title} channel={watching.channel} onClose={() => setWatching(null)}>
                    {roomSlug && <button type="button" onClick={() => { onQueue(watching); setWatching(null); }} disabled={busy} className="rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40">Queue in this room</button>}
                </VideoPreview>
            )}
        </div>
    );
}
