import { PlaylistInfo } from '@/lib/playlists';
import { getJson, sendJson } from '@/lib/post';
import { Heart, ListMusic, Plus, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

export interface Grabbed {
    playlist: { id: number; name: string };
    added: boolean; // false: it was in that playlist already
    songs: number;
}

/**
 * What Grab does: the song goes into one of your playlists, and you say which. With no playlist yet you make one right here (the song goes into it), so a grab is never lost
 * in a list you cannot see. `song.id` is the song you saw: if it has changed by the time you pick, the server says so and nothing is saved.
 */
export default function GrabDialog({ slug, song, onClose, onGrabbed }: {
    slug: string;
    song: { id: number; title: string; thumbnail: string | null; added_by: string };
    onClose: () => void;
    onGrabbed: (result: Grabbed) => void;
}) {
    const [lists, setLists] = useState<PlaylistInfo[] | null>(null);
    const [name, setName] = useState('');
    const [busy, setBusy] = useState<number | 'new' | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        getJson<PlaylistInfo[]>(route('api.playlists.list')).then((l) => { setLists(l); setName(l.length === 0 ? 'My playlist' : ''); }).catch((e: Error) => setError(e.message));
        const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', key);

        return () => window.removeEventListener('keydown', key);
    }, [onClose]);

    const grab = async (target: { playlist_id: number } | { new_playlist: string }, who: number | 'new') => {
        setBusy(who);
        setError('');

        try {
            onGrabbed(await sendJson<Grabbed>('POST', route('rooms.vote', slug), { type: 'grab', item_id: song.id, ...target }));
        } catch (e) {
            setError((e as Error).message);
            setBusy(null);
        }
    };
    const make = (e: FormEvent) => {
        e.preventDefault();
        name.trim() && grab({ new_playlist: name.trim() }, 'new');
    };

    const none = lists !== null && lists.length === 0;
    const form = (
        <form onSubmit={make} className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Name of the new playlist" aria-label="Name of the new playlist" autoFocus={none} className="min-w-0 flex-1 rounded-lg border-white/10 bg-white/5 text-sm text-white placeholder-neutral-500 focus:border-violet-500 focus:ring-violet-500" />
            <button disabled={busy !== null || !name.trim()} data-make className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
                <Plus size={15} /> {busy === 'new' ? 'Working…' : none ? 'Make it and grab' : 'Make and grab'}
            </button>
        </form>
    );

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose} data-grab-dialog>
            <div role="dialog" aria-modal="true" aria-label="Grab this song" className="w-full max-w-md animate-menu overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 text-white shadow-2xl shadow-black/60" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-violet-600/25 via-fuchsia-600/10 to-transparent p-4">
                    {song.thumbnail ? <img src={song.thumbnail} alt="" className="h-12 w-20 shrink-0 rounded-lg object-cover" /> : <span className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xl">🎵</span>}
                    <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-violet-300"><Heart size={12} fill="currentColor" /> Grab this song</p>
                        <p className="truncate text-sm font-semibold" title={song.title}>{song.title}</p>
                        <p className="truncate text-xs text-neutral-400">played by {song.added_by}</p>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="shrink-0 rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white"><X size={18} /></button>
                </div>

                <div className="space-y-3 p-4">
                    {lists === null && !error && <p className="py-6 text-center text-sm text-neutral-400">Loading your playlists…</p>}

                    {none && (
                        <div className="space-y-3" data-no-playlist>
                            <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-3 text-sm">
                                <p className="font-semibold text-amber-200">You have no playlist yet</p>
                                <p className="mt-0.5 text-neutral-300">A grabbed song goes into one of your playlists. Make your first one now: the song goes right into it.</p>
                            </div>
                            {form}
                        </div>
                    )}

                    {lists !== null && lists.length > 0 && (
                        <>
                            <p className="text-sm text-neutral-300">Which playlist should it go in?</p>
                            <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1" data-playlists>
                                {lists.map((l) => (
                                    <li key={l.id}>
                                        <button onClick={() => grab({ playlist_id: l.id }, l.id)} disabled={busy !== null} data-pick={l.id} className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left transition hover:border-violet-400/50 hover:bg-violet-500/10 disabled:opacity-60">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-violet-200"><ListMusic size={16} /></span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-semibold">{l.name}</span>
                                                <span className="block text-xs text-neutral-400">{l.songs_count} {l.songs_count === 1 ? 'song' : 'songs'}{l.is_active && ' · the one you play from'}</span>
                                            </span>
                                            <span className="shrink-0 text-xs font-semibold text-violet-300">{busy === l.id ? 'Working…' : 'Add here'}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <div className="border-t border-white/10 pt-3">
                                <p className="mb-2 text-xs text-neutral-400">Or make a new playlist for it</p>
                                {form}
                            </div>
                        </>
                    )}

                    {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert" data-grab-error>{error}</p>}
                </div>
            </div>
        </div>
    );
}
