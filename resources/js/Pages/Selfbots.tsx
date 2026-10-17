import AppLayout from '@/Layouts/AppLayout';
import { embedded } from '@/lib/embed';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowUpRight, AudioLines, Bot, Check, CircleHelp, Disc3, DoorOpen, ListMusic, LoaderCircle, Pause, Pencil, Play, Plus, Radio, RefreshCw, Sparkles, Trash2, X } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';

interface Playlist { id: number; name: string; songs_count: number }
interface Room { id: number; name: string; slug: string }
interface Selfbot {
    id: number; name: string; room: Room; playlist: Playlist | null; enabled: boolean;
    status: 'playing' | 'standby' | 'paused' | 'needs_playlist' | 'live_stream'; track: string | null;
}
interface Props { bots: Selfbot[]; rooms: Room[]; playlists: Playlist[]; selectedRoom: string; limit: number; ownedCount: number }

const field = 'w-full rounded-xl border border-white/10 bg-black/25 px-3.5 py-3 text-sm text-white placeholder-neutral-600 transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15 disabled:opacity-50';
const smallButton = 'inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/4 px-3 py-2 text-xs font-semibold text-neutral-300 transition hover:border-white/20 hover:bg-white/8 hover:text-white disabled:opacity-40';
const statusStyle = {
    playing: ['Playing', 'bg-emerald-400/10 text-emerald-300'],
    standby: ['Waiting for DJs', 'bg-sky-400/10 text-sky-300'],
    paused: ['Paused', 'bg-white/5 text-neutral-400'],
    needs_playlist: ['Playlist needed', 'bg-amber-400/10 text-amber-300'],
    live_stream: ['Live stream on', 'bg-sky-400/10 text-sky-300'],
};

export default function Selfbots({ bots, rooms, playlists, selectedRoom, limit, ownedCount }: Props) {
    const [editing, setEditing] = useState<Selfbot | null>(null);
    const [busy, setBusy] = useState<number | 'refresh' | null>(null);
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<'all' | 'enabled' | 'paused'>('all');
    const formRef = useRef<HTMLFormElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const form = useForm({ name: '', room: selectedRoom || '', playlist_id: '', enabled: true });
    const enabled = bots.filter((b) => b.enabled).length;
    const playing = bots.filter((b) => b.status === 'playing').length;
    const visible = bots.filter((b) => filter === 'all' || (filter === 'enabled' ? b.enabled : !b.enabled));
    const choices = editing?.playlist && !playlists.some((p) => p.id === editing.playlist?.id) ? [...playlists, editing.playlist] : playlists;
    const picked = choices.find((p) => String(p.id) === form.data.playlist_id);
    const atLimit = !editing && ownedCount >= limit;
    const unavailable = form.processing || busy !== null;

    const reset = () => {
        setEditing(null);
        form.setData({ name: '', room: selectedRoom || '', playlist_id: '', enabled: true });
        form.clearErrors();
    };
    const edit = (bot: Selfbot) => {
        setEditing(bot);
        form.setData({ name: bot.name, room: bot.room.slug, playlist_id: String(bot.playlist?.id ?? ''), enabled: bot.enabled });
        form.clearErrors();
        setError('');
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        nameRef.current?.focus({ preventScroll: true });
    };
    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (unavailable) return;
        setNotice(''); setError('');
        const options = { preserveScroll: true, onSuccess: () => { setNotice(editing ? 'Bot updated.' : 'Your self DJ bot is ready.'); reset(); } };
        if (editing) form.put(route('selfbots.update', editing.id), options);
        else form.post(route('selfbots.store'), options);
    };
    const toggle = (bot: Selfbot) => {
        setBusy(bot.id); setError(''); setNotice('');
        router.patch(route('selfbots.toggle', bot.id), { enabled: !bot.enabled }, {
            preserveScroll: true,
            onSuccess: () => { setNotice(`${bot.name} ${bot.enabled ? 'paused' : 'enabled'}.`); if (editing?.id === bot.id) form.setData('enabled', !bot.enabled); },
            onError: (errors) => setError(Object.values(errors)[0] ?? 'Could not change the bot. Try again.'),
            onFinish: () => setBusy(null),
        });
    };
    const remove = (bot: Selfbot) => {
        if (!confirm(`Delete "${bot.name}" from ${bot.room.name}? The bot will stop playing. Your room and playlist will be kept.`)) return;
        setBusy(bot.id); setError(''); setNotice('');
        router.delete(route('selfbots.destroy', bot.id), {
            preserveScroll: true,
            onSuccess: () => { setNotice(`${bot.name} deleted.`); if (editing?.id === bot.id) reset(); },
            onError: (errors) => setError(Object.values(errors)[0] ?? 'Could not delete the bot. Try again.'),
            onFinish: () => setBusy(null),
        });
    };

    return <AppLayout title={<span className="flex items-center gap-3"><span className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-2 text-violet-300"><Bot size={24} /></span>Self DJ Bots</span>} subtitle="Your rooms. Your playlists. Music that keeps going." actions={
        <button className={smallButton} disabled={unavailable} onClick={() => { setBusy('refresh'); router.reload({ only: ['bots', 'rooms', 'playlists', 'ownedCount'], onFinish: () => setBusy(null) }); }}><RefreshCw size={14} className={busy === 'refresh' ? 'animate-spin' : ''} /> Refresh</button>
    }>
        <Head title="Self DJ Bots" />
        <section className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-linear-to-br from-violet-500/12 via-neutral-900 to-neutral-900 p-5 sm:p-7">
            <div aria-hidden className="pointer-events-none absolute -right-8 -top-14 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                <div className="max-w-lg">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300"><Sparkles size={12} /> Keep the room alive</span>
                    <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">An empty queue. Never an empty room.</h2>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-400">Your bot takes the decks when nobody is queued. When a DJ joins, it finishes the current track and steps aside. When the queue clears, it returns.</p>
                </div>
                <div className="grid shrink-0 grid-cols-3 gap-5 border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
                    {[[bots.length, 'Configured', 'text-white'], [enabled, 'Enabled', 'text-violet-300'], [playing, 'Playing now', 'text-emerald-300']].map(([value, label, color]) => <div key={label} className="min-w-16"><p className={`text-3xl font-semibold tabular-nums ${color}`}>{value}</p><p className="mt-1 text-[11px] text-neutral-500">{label}</p></div>)}
                </div>
            </div>
        </section>

        {(notice || error) && <div role={error ? 'alert' : 'status'} className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-400/20 bg-red-400/5 text-red-300' : 'border-emerald-400/20 bg-emerald-400/5 text-emerald-300'}`}>
            {!error && <Check size={16} />}<span className="flex-1">{error || notice}</span><button aria-label="Dismiss message" onClick={() => { setNotice(''); setError(''); }}><X size={15} /></button>
        </div>}

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <form ref={formRef} onSubmit={submit} className="scroll-mt-5 rounded-2xl border border-white/10 bg-neutral-900/70 p-5 sm:p-6">
                <div className="mb-6 flex items-start justify-between gap-3">
                    <div><h2 className="flex items-center gap-2 font-bold"><span className="rounded-lg bg-violet-500/15 p-1.5 text-violet-300">{editing ? <Pencil size={16} /> : <Plus size={16} />}</span>{editing ? 'Edit selfbot' : 'Create a selfbot'}</h2><p className="mt-2 text-xs text-neutral-500">Give your next resident DJ a name and a home.</p></div>
                    {editing && <button type="button" disabled={form.processing} onClick={reset} className={smallButton}>Cancel</button>}
                </div>
                {atLimit && <p role="status" className="mb-4 rounded-xl bg-amber-400/10 p-3 text-xs text-amber-200">You have reached the {limit}-bot limit. You can still edit your existing bots.</p>}
                {!rooms.length && <p className="mb-4 rounded-xl bg-violet-400/10 p-3 text-xs text-violet-200">You need a room to get started. <Link href={route('dashboard')} className="font-semibold underline">Create a room</Link>.</p>}
                <fieldset disabled={unavailable || atLimit} className="space-y-5 disabled:opacity-60">
                    <div><label htmlFor="selfbot-name" className="mb-2 flex justify-between text-xs font-medium text-neutral-300">Nickname<span className="text-neutral-600">{form.data.name.length}/30</span></label>
                        <input id="selfbot-name" ref={nameRef} autoComplete="off" required minLength={2} maxLength={30} value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className={field} placeholder="e.g. Midnight Radio" aria-invalid={!!form.errors.name} />
                        {form.errors.name && <p className="mt-1.5 text-xs text-red-300">{form.errors.name}</p>}
                    </div>
                    <div><label htmlFor="selfbot-room" className="mb-2 flex items-center gap-1.5 text-xs font-medium text-neutral-300"><DoorOpen size={13} /> Room</label>
                        <input id="selfbot-room" list="selfbot-rooms" autoComplete="off" required value={form.data.room} onChange={(e) => form.setData('room', e.target.value)} className={field} placeholder="Choose a room or enter its slug" aria-invalid={!!form.errors.room} />
                        <datalist id="selfbot-rooms">{rooms.map((r) => <option key={r.id} value={r.slug}>{r.name}</option>)}</datalist>
                        <p className="mt-1.5 text-[11px] text-neutral-500">One selfbot per room. You can also use the exact room name.</p>
                        {form.errors.room && <p className="mt-1.5 text-xs text-red-300">{form.errors.room}</p>}
                    </div>
                    <div><label htmlFor="selfbot-playlist" className="mb-2 flex items-center gap-1.5 text-xs font-medium text-neutral-300"><ListMusic size={13} /> Playlist</label>
                        <select id="selfbot-playlist" required value={form.data.playlist_id} onChange={(e) => form.setData('playlist_id', e.target.value)} className={field} aria-invalid={!!form.errors.playlist_id}>
                            <option value="">Select a playlist</option>
                            {choices.map((p) => <option key={p.id} value={p.id} disabled={!p.songs_count}>{p.name} · {p.songs_count} tracks{!p.songs_count ? ' (empty)' : ''}</option>)}
                        </select>
                        {form.errors.playlist_id && <p className="mt-1.5 text-xs text-red-300">{form.errors.playlist_id}</p>}
                        {!choices.some((p) => p.songs_count > 0) ? <p className="mt-2 text-xs text-amber-200">Add some tracks first. <Link href={route('playlists')} className="font-semibold underline">Open playlists</Link></p> : <p className="mt-1.5 text-[11px] text-neutral-500">{picked ? `${picked.songs_count} tracks, played in order and repeated.` : 'The bot plays your tracks in order, then loops.'}</p>}
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/3 p-3.5">
                        <div><p id="selfbot-enabled-label" className="text-sm font-medium">Enable bot</p><p className="mt-0.5 text-[11px] text-neutral-500">{form.data.enabled ? 'Ready to play when the queue is empty.' : 'Save the setup and enable it later.'}</p></div>
                        <button type="button" role="switch" aria-labelledby="selfbot-enabled-label" aria-checked={form.data.enabled} onClick={() => form.setData('enabled', !form.data.enabled)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${form.data.enabled ? 'bg-violet-500' : 'bg-neutral-700'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${form.data.enabled ? 'left-6' : 'left-1'}`} /></button>
                    </div>
                    <button type="submit" disabled={!form.data.name.trim() || !form.data.room.trim() || !form.data.playlist_id} className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-900/20 transition hover:brightness-110 disabled:opacity-40">{form.processing ? <LoaderCircle size={16} className="animate-spin" /> : editing ? <Check size={16} /> : <Plus size={16} />}{form.processing ? 'Saving…' : editing ? 'Save changes' : 'Create bot'}</button>
                </fieldset>
                <p className="mt-4 text-center text-[11px] text-neutral-600">Runs automatically. Your room and playlists stay yours.</p>
            </form>

            <section className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-bold">Your selfbots<span className="rounded-md bg-white/5 px-2 py-0.5 text-xs font-medium text-neutral-500">{bots.length}</span></h2>
                    <div className="flex gap-1 rounded-lg bg-white/3 p-1" aria-label="Filter bots">{(['all', 'enabled', 'paused'] as const).map((key) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)} className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition ${filter === key ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>{key}</button>)}</div>
                </div>
                {!visible.length && <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/2 px-6 py-10 text-center">
                    <span className="mb-4 rounded-2xl border border-violet-400/15 bg-violet-500/10 p-4 text-violet-300"><Bot size={30} strokeWidth={1.5} /></span>
                    <h3 className="text-sm font-semibold">{bots.length ? 'No bots in this view' : 'Your next resident DJ starts here'}</h3>
                    <p className="mt-2 max-w-xs text-xs leading-relaxed text-neutral-500">{bots.length ? 'Try another filter to see your configured bots.' : 'Create your first selfbot. It will keep your room playing while the DJs take a break.'}</p>
                </div>}
                {visible.map((bot) => <article key={bot.id} className={`overflow-hidden rounded-2xl border bg-neutral-900/60 transition ${editing?.id === bot.id ? 'border-violet-400/50 ring-1 ring-violet-400/20' : bot.status === 'playing' ? 'border-emerald-400/20' : 'border-white/10'}`}>
                    <div className="p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className={`rounded-xl border p-3 ${bot.enabled ? 'border-violet-400/20 bg-violet-400/10 text-violet-300' : 'border-white/5 bg-white/3 text-neutral-500'}`}><Bot size={22} /></span><div className="min-w-0"><h3 className="break-words text-sm font-bold text-white">{bot.name}</h3><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">Self DJ</p></div></div>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyle[bot.status][1]}`}><span className={`h-1.5 w-1.5 rounded-full ${bot.status === 'playing' ? 'animate-pulse motion-reduce:animate-none bg-emerald-300' : 'bg-current'}`} />{statusStyle[bot.status][0]}</span>
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-black/15 p-3 sm:grid-cols-2">
                            <div className="min-w-0"><p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-neutral-600"><DoorOpen size={12} /> Room</p><a href={route('rooms.show', bot.room.slug)} target={embedded ? '_top' : undefined} className="mt-1 flex items-center gap-1 text-xs text-neutral-300 hover:text-violet-300"><span className="truncate">{bot.room.name}</span><ArrowUpRight size={12} className="shrink-0" /></a></div>
                            <div className="min-w-0"><p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-neutral-600"><ListMusic size={12} /> Playlist</p><p className="mt-1 truncate text-xs text-neutral-300">{bot.playlist?.name ?? 'Choose a playlist'}</p><p className="mt-0.5 text-[10px] text-neutral-600">{bot.playlist?.songs_count ?? 0} tracks</p></div>
                        </div>
                        {bot.track && <p className="mt-3 flex items-center gap-2 text-xs text-emerald-300/80"><AudioLines size={14} className="shrink-0" /><span className="truncate">{bot.track}</span></p>}
                        {bot.status === 'standby' && <p className="mt-3 text-xs text-sky-200/60">Standing by while the DJs play.</p>}
                        {bot.status === 'needs_playlist' && <p className="mt-3 text-xs text-amber-200/80">Choose a playlist with tracks to get this bot playing.</p>}
                    </div>
                    <div className="flex items-center gap-2 border-t border-white/5 bg-white/2 px-5 py-3">
                        <button disabled={unavailable || (!bot.enabled && bot.status === 'needs_playlist')} onClick={() => toggle(bot)} className={smallButton}>{busy === bot.id ? <LoaderCircle size={13} className="animate-spin" /> : bot.enabled ? <Pause size={13} /> : <Play size={13} />}{bot.enabled ? 'Pause' : 'Enable'}</button>
                        <button disabled={unavailable} onClick={() => edit(bot)} className={smallButton}><Pencil size={13} /> Edit</button>
                        <button disabled={unavailable} onClick={() => remove(bot)} aria-label={`Delete ${bot.name}`} title="Delete bot" className="ml-auto rounded-lg p-2 text-neutral-600 transition hover:bg-red-400/10 hover:text-red-300 disabled:opacity-40"><Trash2 size={15} /></button>
                    </div>
                </article>)}
                <div className="rounded-2xl border border-white/5 p-5"><p className="flex items-center gap-2 text-xs font-medium text-neutral-400"><CircleHelp size={14} /> How it works</p><div className="mt-4 grid grid-cols-3 gap-3 text-center">{[[ListMusic, 'Queue empties'], [Disc3, 'Bot takes over'], [Radio, 'DJs come first']].map(([Icon, text]) => { const Glyph = Icon as typeof Bot; return <div key={String(text)} className="flex flex-col items-center gap-2"><Glyph size={18} className="text-violet-300/60" /><span className="text-[10px] text-neutral-500">{String(text)}</span></div>; })}</div></div>
            </section>
        </div>
    </AppLayout>;
}
