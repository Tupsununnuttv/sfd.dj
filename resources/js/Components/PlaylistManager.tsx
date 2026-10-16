import ContextMenu, { MenuAnchor } from '@/Components/ContextMenu';
import AddBar from '@/Components/playlists/AddBar';
import TrackList from '@/Components/playlists/TrackList';
import { PlaylistInfo, playtime, Song, watchUrl } from '@/lib/playlists';
import { getJson, post, sendJson } from '@/lib/post';
import { isSoundCloud } from '@/lib/soundcloud';
import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { ArrowUpDown, CircleDot, ClipboardPaste, Download, ListMusic, Music2, Pencil, Plus, Search, Shuffle, Trash2, X } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';

type Sort = 'name' | 'size' | 'time';

const SORTS: [Sort, string][] = [['name', 'Name (A to Z)'], ['size', 'Most tracks'], ['time', 'Longest']];
const SORT_KEY = 'sfddj.playlistSort';

const storedSort = (): Sort => {
    try {
        const s = localStorage.getItem(SORT_KEY);
        return s === 'size' || s === 'time' ? s : 'name';
    } catch {
        return 'name';
    }
};

const iconBtn = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-neutral-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40';

/**
 * The playlists: my lists on the left, and on the right the one I picked with its tracks in play order.
 * Build lists from YouTube, SoundCloud and Spotify (search, links, a bulk import), drag the tracks into the order they should play in,
 * and mark one list as the active one: its first track is my next track, and "Join Waitlist" in a room queues it.
 * `onClose` adds a title bar with a close button (the overlay in a room); `roomSlug` adds Queue buttons (they put songs into that room's waitlist);
 * `onChanged` is called after anything changed, so the footbar of the room can read the lists again.
 */
export default function PlaylistManager({ roomSlug, onClose, onChanged, className = '' }: { roomSlug?: string; onClose?: () => void; onChanged?: () => void; className?: string }) {
    const { auth } = usePage<PageProps>().props;
    const maxSongs = auth.limits?.songs ?? 5000; // more with a plan
    const maxLists = auth.limits?.playlists ?? 100; // more with a plan
    const [lists, setLists] = useState<PlaylistInfo[]>([]);
    const full = lists.length >= maxLists;
    const [loaded, setLoaded] = useState(false);
    const [selected, setSelected] = useState<number | null>(null);
    const [songs, setSongs] = useState<Song[]>([]);
    const [availability, setAvailability] = useState<Record<number, boolean>>({});
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [notice, setNotice] = useState<{ text: string; n: number } | null>(null);
    const [busy, setBusy] = useState(false);
    const [sort, setSort] = useState<Sort>(storedSort);
    const [sortMenu, setSortMenu] = useState<MenuAnchor | null>(null);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [renaming, setRenaming] = useState<string | null>(null);
    const [armed, setArmed] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [filter, setFilter] = useState('');
    const [importOpen, setImportOpen] = useState(false);
    const [importText, setImportText] = useState('');
    const [importErrors, setImportErrors] = useState<string[]>([]);

    const current = lists.find((l) => l.id === selected) ?? null;
    const say = (text: string) => setNotice({ text, n: Date.now() });
    const touch = () => onChanged?.();

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(null), 4500);

        return () => clearTimeout(t);
    }, [notice]);

    // delete asks twice, but only for a few seconds
    useEffect(() => {
        if (!armed) return;
        const t = setTimeout(() => setArmed(false), 4000);

        return () => clearTimeout(t);
    }, [armed]);

    const loadLists = useCallback(async (keep?: number | null) => {
        const data = await getJson<PlaylistInfo[]>(route('api.playlists.list'));
        setLists(data);
        setSelected((cur) => keep ?? (cur && data.some((l) => l.id === cur) ? cur : (data.find((l) => l.is_active) ?? data[0])?.id ?? null));
        setLoaded(true);
    }, []);

    const loadSongs = useCallback(async (id: number) => {
        setSongs(await getJson<Song[]>(route('api.playlists.show', id)));
        setAvailability({});
    }, []);

    useEffect(() => {
        loadLists().catch((e) => say(e.message));
    }, [loadLists]);

    useEffect(() => {
        setFilter('');
        setFilterOpen(false);
        setImportOpen(false);
        setImportErrors([]);
        setRenaming(null);
        setArmed(false);
        if (selected !== null) loadSongs(selected).catch((e) => say(e.message));
        else setSongs([]);
    }, [selected, loadSongs]);

    const run = async (fn: () => Promise<void>) => {
        setBusy(true);
        try {
            await fn();
        } catch (e) {
            say((e as Error).message);
        } finally {
            setBusy(false);
        }
    };

    const refresh = async () => {
        await loadLists(selected);
        if (selected !== null) await loadSongs(selected);
        touch();
    };

    const pickSort = (s: Sort) => {
        setSort(s);
        try { localStorage.setItem(SORT_KEY, s); } catch { /* private mode */ }
    };

    const ordered = [...lists].sort((a, b) => {
        const byName = a.name.localeCompare(b.name);

        return sort === 'size' ? b.songs_count - a.songs_count || byName : sort === 'time' ? Number(b.songs_sum_duration ?? 0) - Number(a.songs_sum_duration ?? 0) || byName : byName;
    });

    const create = (e: FormEvent) => {
        e.preventDefault();
        const name = newName.trim();
        if (!name) return;
        run(async () => {
            const made = await sendJson<PlaylistInfo>('POST', route('api.playlists.store'), { name });
            setNewName('');
            setCreating(false);
            await loadLists(made.id);
            touch();
        });
    };

    const commitRename = () => {
        const name = renaming?.trim();
        setRenaming(null);
        if (!name || !current || name === current.name) return;
        run(async () => {
            await sendJson('PATCH', route('api.playlists.update', current.id), { name });
            await loadLists(current.id);
            touch();
        });
    };

    const remove = () => {
        if (!current) return;
        if (!armed) return setArmed(true);
        setArmed(false);
        run(async () => {
            await sendJson('DELETE', route('api.playlists.destroy', current.id));
            await loadLists(null);
            touch();
        });
    };

    const activate = (id: number) =>
        run(async () => {
            await sendJson('POST', route('api.playlists.activate', id));
            setLists((all) => all.map((l) => ({ ...l, is_active: l.id === id })));
            touch();
            say('This is your active playlist now. Its first track is your next track.');
        });

    const addSong = (body: { url: string } | { video_id: string }) =>
        selected === null
            ? Promise.resolve(say('Create or pick a playlist first.'))
            : run(async () => {
                  const r = await sendJson<{ added: number; found: number }>('POST', route('api.playlists.songs.add', selected), body);
                  say(r.added ? `Added ${r.added} song${r.added === 1 ? '' : 's'} to the end of the list.` : 'That song is already in the playlist.');
                  await refresh();
              });

    const submitImport = (e: FormEvent) => {
        e.preventDefault();
        if (selected === null || !importText.trim()) return;
        run(async () => {
            const r = await sendJson<{ added: number; found: number; errors: string[] }>('POST', route('api.playlists.import', selected), { text: importText });
            setImportErrors(r.errors);
            say(`Found ${r.found} song${r.found === 1 ? '' : 's'}, added ${r.added} new.`);
            if (r.added) setImportText('');
            await refresh();
        });
    };

    const reorder = (ids: number[]) => {
        if (selected === null) return;
        const by = new Map(songs.map((s) => [s.id, s]));
        setSongs(ids.map((id) => by.get(id)).filter((s): s is Song => !!s)); // it moves at once; the server catches up
        sendJson('PUT', route('api.playlists.order', selected), { ids })
            .then(touch)
            .catch((e: Error) => { say(e.message); loadSongs(selected); });
    };

    const shuffle = () =>
        selected !== null &&
        run(async () => {
            setSongs(await sendJson<Song[]>('POST', route('api.playlists.shuffle', selected)));
            say('Shuffled.');
            touch();
        });

    const removeSong = (song: Song) =>
        current &&
        run(async () => {
            await sendJson('DELETE', route('api.playlists.songs.remove', [current.id, song.id]));
            await refresh();
        });

    const checkAvailability = (visibleSongs: Song[]) => current && visibleSongs.length > 0 && run(async () => {
        setCheckingAvailability(true);
        try {
            const result = await sendJson<{ availability: Record<number, boolean> }>('POST', route('api.playlists.availability', current.id), { song_ids: visibleSongs.map((song) => song.id) });
            setAvailability((currentAvailability) => ({ ...currentAvailability, ...result.availability }));
            const unavailable = Object.values(result.availability).filter((isAvailable) => !isAvailable).length;
            say(unavailable === 0 ? `All ${visibleSongs.length} visible songs are available.` : `${unavailable} of ${visibleSongs.length} visible songs are unavailable.`);
        } finally {
            setCheckingAvailability(false);
        }
    });

    const queueId = (videoId: string) =>
        run(async () => {
            await post(route('rooms.enqueue', roomSlug!), { video_id: videoId });
            say('Added to the waitlist.');
        });

    // a song from one of my lists: a SoundCloud one has no YouTube video to look up, so the server takes what the list saved
    const queueSong = (song: Song) =>
        run(async () => {
            await post(route('rooms.enqueue', roomSlug!), isSoundCloud(song.youtube_id) ? { song_id: song.id } : { video_id: song.youtube_id });
            say('Added to the waitlist.');
        });

    const queueAll = () =>
        current &&
        run(async () => {
            await post(route('rooms.queue.playlist', roomSlug!), { playlist_id: current.id });
            say(`"${current.name}" was added to the waitlist.`);
        });

    const exportList = () => {
        if (!current) return;
        const links = songs.map(watchUrl).filter((link): link is string => !!link);
        const url = URL.createObjectURL(new Blob([`${links.join('\n')}\n`], { type: 'text/plain' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${current.name.replace(/[^\w\- ]+/g, '').trim() || 'playlist'}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        say(`Saved ${links.length} links. Paste them into Import to bring the list back.`);
    };

    const seconds = songs.length || !current ? songs.reduce((n, s) => n + s.duration, 0) : Number(current.songs_sum_duration ?? 0);
    const count = songs.length || current?.songs_count || 0;

    return (
        <div className={`relative flex min-h-0 flex-col overflow-hidden bg-neutral-950 text-sm text-neutral-100 ${className}`}>
            {onClose && (
                <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-fuchsia-500/30 to-violet-500/30 text-violet-200 ring-1 ring-white/10"><ListMusic size={19} /></span>
                        <h2 className="text-lg font-black tracking-tight">Playlists</h2>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="rounded-xl p-2 text-neutral-400 transition hover:bg-white/10 hover:text-white"><X size={20} /></button>
                </header>
            )}

            <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,12rem)_minmax(0,1fr)] gap-4 p-4 md:grid-cols-[15rem_minmax(0,1fr)] md:grid-rows-1 xl:grid-cols-[19rem_minmax(0,1fr)]">
                {/* my playlists */}
                <aside className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/3 p-3">
                    <div className="mb-3 flex items-center justify-between px-1">
                        <h3 className="font-bold">My Playlists</h3>
                        <span className="rounded-lg bg-white/10 px-2 py-0.5 text-xs font-bold tabular-nums text-neutral-300">{lists.length}</span>
                    </div>
                    <div className="mb-3 flex gap-2">
                        <button
                            data-menu-trigger
                            onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setSortMenu(sortMenu ? null : { x: r.left, y: r.bottom + 6, flipTo: r.top - 6 }); }}
                            aria-label="Sort the playlists"
                            title="Sort the playlists"
                            className={iconBtn}
                        >
                            <ArrowUpDown size={16} />
                        </button>
                        <button onClick={() => setCreating(!creating)} disabled={full} aria-label="New playlist" title={full ? 'You have reached the playlist limit' : 'New playlist'} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-fuchsia-500 to-violet-500 text-white shadow-lg shadow-violet-900/40 transition hover:opacity-90 disabled:opacity-40">
                            <Plus size={18} strokeWidth={2.6} />
                        </button>
                    </div>

                    {creating && (
                        <form onSubmit={create} className="mb-2 flex gap-2">
                            <input
                                autoFocus
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Escape' && (e.preventDefault(), setCreating(false))}
                                maxLength={60}
                                placeholder="Name of the playlist"
                                className="min-w-0 flex-1 rounded-xl border-white/10 bg-black/40 text-sm text-neutral-100 placeholder-neutral-600 focus:border-violet-400 focus:ring-violet-500/30"
                            />
                            <button disabled={busy || !newName.trim()} className="rounded-xl bg-violet-600 px-3 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-40">Create</button>
                        </form>
                    )}

                    <ul className="-mr-1 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
                        {!loaded && <li className="px-3 py-6 text-center text-neutral-500">Loading…</li>}
                        {loaded && lists.length === 0 && !creating && <li className="px-3 py-6 text-center text-neutral-500">No playlists yet.</li>}
                        {ordered.map((l) => (
                            <li key={l.id}>
                                <button
                                    onClick={() => setSelected(l.id)}
                                    aria-current={selected === l.id}
                                    className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${selected === l.id ? 'bg-linear-to-r from-violet-500/25 via-violet-500/10 to-transparent ring-1 ring-violet-400/30' : 'hover:bg-white/5'}`}
                                >
                                    {selected === l.id && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-violet-400" />}
                                    <span className={`min-w-0 flex-1 truncate ${selected === l.id ? 'font-bold text-white' : 'font-semibold text-neutral-300'}`}>{l.name}</span>
                                    {l.is_active && <span title="Your active playlist" className="shrink-0 text-emerald-300"><CircleDot size={15} /></span>}
                                    <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-neutral-300">{l.songs_count}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-3 shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5" data-playlist-count>
                        <p className={`text-sm font-semibold tabular-nums ${full ? 'text-rose-300' : 'text-neutral-100'}`}>{lists.length} <span className="font-medium text-neutral-400">of {maxLists} playlists</span></p>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Playlists used" aria-valuemin={0} aria-valuemax={maxLists} aria-valuenow={lists.length}>
                            <div className={`h-full rounded-full ${full ? 'bg-rose-400' : lists.length >= maxLists * 0.8 ? 'bg-amber-400' : 'bg-violet-400'}`} style={{ width: `${Math.min(100, (lists.length / maxLists) * 100)}%` }} />
                        </div>
                        {full && <p className="mt-1.5 text-xs text-rose-300">You have reached the limit.</p>}
                    </div>
                </aside>

                {/* the one I picked */}
                <section className="flex min-h-0 min-w-0 flex-col rounded-2xl border border-white/10 bg-white/3 p-4 sm:p-5">
                    {current ? (
                        <>
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between xl:gap-4">
                                <div className="min-w-0 xl:flex-1">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Selected playlist</p>
                                    {renaming !== null ? (
                                        <input
                                            autoFocus
                                            value={renaming}
                                            maxLength={60}
                                            onChange={(e) => setRenaming(e.target.value)}
                                            onBlur={commitRename}
                                            onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); else if (e.key === 'Escape') { e.preventDefault(); setRenaming(null); } }}
                                            aria-label="Name of the playlist"
                                            className="mt-1 w-full max-w-md rounded-xl border-violet-400/50 bg-black/40 py-1 text-2xl font-black tracking-tight focus:border-violet-400 focus:ring-violet-500/30"
                                        />
                                    ) : (
                                        <h3 className="mt-1 truncate text-2xl font-black tracking-tight" title={current.name}>{current.name}</h3>
                                    )}
                                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-neutral-400">
                                        <span className="tabular-nums">{count} track(s) · {playtime(seconds)}</span>
                                        {current.is_active ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-300"><CircleDot size={12} /> Active playlist</span>
                                        ) : (
                                            <button onClick={() => activate(current.id)} disabled={busy} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-neutral-200 transition hover:bg-emerald-500/20 hover:text-emerald-200 disabled:opacity-40">Set as active</button>
                                        )}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {roomSlug && songs.length > 0 && (
                                        <button onClick={queueAll} disabled={busy} className="h-9 rounded-xl bg-linear-to-r from-fuchsia-500 to-violet-500 px-4 text-xs font-bold text-white shadow-lg shadow-violet-900/40 transition hover:opacity-90 disabled:opacity-40">Queue all</button>
                                    )}
                                    <button onClick={() => setFilterOpen(!filterOpen)} aria-label="Search in this playlist" title="Search in this playlist" aria-pressed={filterOpen} className={`${iconBtn} ${filterOpen ? 'border-violet-400/50! bg-violet-500/20! text-white!' : ''}`}><Search size={16} /></button>
                                    <button onClick={() => setRenaming(current.name)} aria-label="Rename" title="Rename" className={iconBtn}><Pencil size={16} /></button>
                                    <button onClick={shuffle} disabled={busy || songs.length < 2} aria-label="Shuffle the order" title="Shuffle the order" className={iconBtn}><Shuffle size={16} /></button>
                                    <button onClick={() => setImportOpen(!importOpen)} aria-label="Import links" title="Import links" aria-pressed={importOpen} className={`${iconBtn} ${importOpen ? 'border-violet-400/50! bg-violet-500/20! text-white!' : ''}`}><ClipboardPaste size={16} /></button>
                                    <button onClick={exportList} disabled={songs.length === 0} aria-label="Download the links" title="Download the links" className={iconBtn}><Download size={16} /></button>
                                    <button
                                        onClick={remove}
                                        disabled={busy}
                                        aria-label={armed ? 'Click again to delete' : 'Delete the playlist'}
                                        title={armed ? 'Click again to delete it' : 'Delete the playlist'}
                                        className={`flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border text-red-300 transition disabled:opacity-40 ${armed ? 'border-red-400/60 bg-red-500/30 px-3 text-xs font-bold text-white' : 'w-9 border-red-500/30 bg-red-500/10 hover:bg-red-500/20'}`}
                                    >
                                        <Trash2 size={16} /> {armed && 'Delete it?'}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4">
                                <AddBar disabled={busy} roomSlug={roomSlug} onAdd={addSong} onQueue={queueId} onNotice={say} />
                            </div>

                            {importOpen && (
                                <form onSubmit={submitImport} className="mt-3 space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4">
                                    <textarea
                                        value={importText}
                                        onChange={(e) => setImportText(e.target.value)}
                                        rows={5}
                                        placeholder={'One link per line:\nhttps://www.youtube.com/playlist?list=...\nhttps://soundcloud.com/artist/track\nhttps://open.spotify.com/track/...'}
                                        className="w-full rounded-xl border-white/10 bg-black/40 font-mono text-xs text-neutral-100 placeholder-neutral-600 focus:border-violet-400 focus:ring-violet-500/30"
                                    />
                                    <p className="text-xs text-neutral-500">YouTube playlists import up to 1,000 songs. Anybody's public Spotify playlist or album works, with no Spotify account needed (the first 100 songs, each matched to YouTube).</p>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button disabled={busy || !importText.trim()} className="rounded-xl bg-linear-to-r from-fuchsia-500 to-violet-500 px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-40">{busy ? 'Importing…' : 'Import'}</button>
                                        <button type="button" onClick={() => setImportOpen(false)} className="text-xs font-semibold text-neutral-400 hover:text-white">Close</button>
                                    </div>
                                    {importErrors.length > 0 && <ul className="space-y-1 text-xs text-red-400">{importErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
                                </form>
                            )}

                            <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <p className="flex items-center gap-2 font-bold"><Music2 size={16} className="text-sky-400" /> <span className="tabular-nums">{songs.length} / {maxSongs}</span> tracks</p>
                                    <p className="mt-0.5 text-xs text-neutral-500">{filter.trim() ? 'Clear the search to drag tracks.' : 'Drag tracks to define the play order.'}</p>
                                </div>
                                {filterOpen && (
                                    <div className="flex w-full max-w-xs items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 focus-within:border-violet-400/60 sm:w-72">
                                        <Search size={14} className="shrink-0 text-neutral-500" />
                                        <input
                                            autoFocus
                                            value={filter}
                                            onChange={(e) => setFilter(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Escape' && (e.preventDefault(), setFilter(''), setFilterOpen(false))}
                                            placeholder="Find a track in this playlist"
                                            aria-label="Find a track in this playlist"
                                            className="min-w-0 flex-1 border-0 bg-transparent px-0 py-2 text-sm placeholder-neutral-600 focus:ring-0"
                                        />
                                        {filter && <button onClick={() => setFilter('')} aria-label="Clear" className="text-neutral-500 hover:text-white"><X size={14} /></button>}
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 flex min-h-0 flex-1 flex-col">
                                <TrackList
                                    songs={songs}
                                    availability={availability}
                                    filter={filter}
                                    isActive={current.is_active}
                                    roomSlug={roomSlug}
                                    busy={busy}
                                    onReorder={reorder}
                                    onQueue={queueSong}
                                    onRemove={removeSong}
                                    onCheckAvailability={checkAvailability}
                                    checkingAvailability={checkingAvailability}
                                    onNotice={say}
                                    empty="No tracks yet. Search above, paste a link, or import a list of links."
                                />
                            </div>
                        </>
                    ) : (
                        <div className="m-auto max-w-sm text-center">
                            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-fuchsia-500/25 to-violet-500/25 text-violet-200 ring-1 ring-white/10"><ListMusic size={26} /></span>
                            <h3 className="mt-4 text-xl font-black tracking-tight">{loaded ? 'Make your first playlist' : 'Loading…'}</h3>
                            {loaded && (
                                <>
                                    <p className="mt-1 text-neutral-400">Add songs from YouTube, SoundCloud and Spotify, drag them into the order you want, and press Join Waitlist in a room to play them.</p>
                                    <form onSubmit={create} className="mt-5 flex gap-2">
                                        <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={60} placeholder="Name of the playlist" aria-label="Name of the playlist" className="min-w-0 flex-1 rounded-xl border-white/10 bg-black/40 text-sm placeholder-neutral-600 focus:border-violet-400 focus:ring-violet-500/30" />
                                        <button disabled={busy || !newName.trim()} className="rounded-xl bg-linear-to-r from-fuchsia-500 to-violet-500 px-4 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40">Create</button>
                                    </form>
                                </>
                            )}
                        </div>
                    )}
                </section>
            </div>

            {sortMenu && (
                <ContextMenu
                    anchor={sortMenu}
                    label="Sort the playlists"
                    groups={[SORTS.map(([key, label]) => ({ label: `${sort === key ? '✓ ' : ''}${label}`, icon: ArrowUpDown, onSelect: () => pickSort(key) }))]}
                    onClose={() => setSortMenu(null)}
                />
            )}

            {notice && (
                <p key={notice.n} role="status" className="pointer-events-none absolute bottom-20 left-1/2 z-40 max-w-[90%] -translate-x-1/2 animate-menu rounded-xl border border-white/10 bg-neutral-800/95 px-4 py-2.5 text-center text-sm font-medium text-neutral-100 shadow-2xl shadow-black/60 backdrop-blur">{notice.text}</p>
            )}
        </div>
    );
}
