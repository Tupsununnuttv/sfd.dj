import VideoPreview from '@/Components/playlists/VideoPreview';
import { getJson } from '@/lib/post';
import { isLink } from '@/lib/playlists';
import { Info, Loader2, Play, Plus, Search, X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

interface Result {
    id: string;
    title: string;
    channel: string;
    thumbnail: string;
}

/**
 * The bar above the tracks: paste a YouTube, SoundCloud or Spotify link to add it at once, or type something to search YouTube.
 * The results drop down under the bar, each with Watch (the video, before deciding), Add (to this playlist) and, inside a room, Queue (into the waitlist).
 */
export default function AddBar({ disabled, roomSlug, onAdd, onQueue, onNotice }: {
    disabled: boolean;
    roomSlug?: string;
    onAdd: (body: { url: string } | { video_id: string }) => Promise<void>;
    onQueue: (videoId: string) => Promise<void>;
    onNotice: (text: string) => void;
}) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Result[] | null>(null);
    const [searching, setSearching] = useState(false);
    const [watching, setWatching] = useState<Result | null>(null);
    const box = useRef<HTMLFormElement>(null);

    useEffect(() => {
        // a click outside closes the results, but not one in the video window opened from them
        const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && !(e.target as Element).closest?.('[data-video-preview]') && setResults(null);
        document.addEventListener('mousedown', away);

        return () => document.removeEventListener('mousedown', away);
    }, []);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        const q = query.trim();
        if (!q || disabled) return;

        if (isLink(q)) {
            await onAdd({ url: q });
            setQuery('');
            return;
        }

        setSearching(true);
        try {
            const found = await getJson<Result[]>(`${route('youtube.search')}?q=${encodeURIComponent(q)}`);
            setResults(found);
            if (!found.length) onNotice('No songs found.');
        } catch (err) {
            onNotice((err as Error).message);
        } finally {
            setSearching(false);
        }
    };

    return (
        <form ref={box} onSubmit={submit} className="relative">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 transition focus-within:border-violet-400/60 focus-within:ring-2 focus-within:ring-violet-500/20">
                {searching ? <Loader2 size={16} className="shrink-0 animate-spin text-violet-300" /> : <Search size={16} className="shrink-0 text-neutral-500" />}
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={disabled}
                    placeholder="Search songs by name, or paste a YouTube, SoundCloud or Spotify link"
                    aria-label="Add a song"
                    className="min-w-0 flex-1 border-0 bg-transparent px-1 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:ring-0"
                />
                <span title="Songs always play from YouTube. A SoundCloud or Spotify link is matched to the same song on YouTube, so check the result." className="hidden shrink-0 text-neutral-600 sm:block"><Info size={15} /></span>
                {query && (
                    <button type="button" onClick={() => { setQuery(''); setResults(null); }} aria-label="Clear" className="shrink-0 rounded-lg p-1 text-neutral-500 hover:bg-white/10 hover:text-white"><X size={15} /></button>
                )}
                <button disabled={disabled || searching || !query.trim()} className="shrink-0 rounded-xl bg-linear-to-r from-fuchsia-500 to-violet-500 px-4 py-1.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-40">
                    {isLink(query) ? 'Add' : 'Search'}
                </button>
            </div>

            {results && results.length > 0 && (
                <ul className="absolute inset-x-0 top-full z-30 mt-2 max-h-88 overflow-y-auto rounded-2xl border border-white/10 bg-neutral-900/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-md">
                    {results.map((r) => (
                        <li key={r.id} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-white/6">
                            <button type="button" onClick={() => setWatching(r)} title="Watch the video" aria-label={`Watch ${r.title}`} className="group/thumb relative h-10 w-18 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10 transition hover:ring-violet-400/70">
                                <img src={r.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
                                <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition group-hover/thumb:opacity-100"><Play size={15} fill="currentColor" /></span>
                            </button>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate font-semibold text-neutral-100">{r.title}</span>
                                <span className="block truncate text-xs text-neutral-500">{r.channel}</span>
                            </span>
                            <button type="button" onClick={() => setWatching(r)} className="flex shrink-0 items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-neutral-100 transition hover:bg-white/20"><Play size={12} fill="currentColor" /> Watch</button>
                            <button type="button" onClick={() => onAdd({ video_id: r.id })} disabled={disabled} className="flex shrink-0 items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-neutral-100 transition hover:bg-white/20 disabled:opacity-40"><Plus size={13} /> Add</button>
                            {roomSlug && <button type="button" onClick={() => onQueue(r.id)} disabled={disabled} className="shrink-0 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-violet-500 disabled:opacity-40">Queue</button>}
                        </li>
                    ))}
                </ul>
            )}

            {watching && (
                <VideoPreview id={watching.id} title={watching.title} channel={watching.channel} onClose={() => setWatching(null)}>
                    <button type="button" onClick={() => { onAdd({ video_id: watching.id }); setWatching(null); }} disabled={disabled} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-neutral-100 transition hover:bg-white/20 disabled:opacity-40"><Plus size={15} /> Add to this playlist</button>
                    {roomSlug && <button type="button" onClick={() => { onQueue(watching.id); setWatching(null); }} disabled={disabled} className="rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40">Queue in this room</button>}
                </VideoPreview>
            )}
        </form>
    );
}
