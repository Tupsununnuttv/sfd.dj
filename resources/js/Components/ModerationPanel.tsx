import { formatDateTime } from '@/lib/regional';
import Avatar from '@/Components/Avatar';
import Toggle from '@/Components/Toggle';
import { send } from '@/lib/post';
import { router } from '@inertiajs/react';
import { Ban, CheckCircle2, Clock3, History, Loader2, Megaphone, RefreshCw, Search, ShieldCheck, ShieldOff, SkipForward, Trash2, UserMinus, VolumeX, X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

export interface ModLine {
    id: number;
    action: string;
    actor: string | null;
    target: string | null;
    target_id: number | null;
    details: string | null;
    at: string;
}

export interface ModData {
    logs: ModLine[];
    kicked: ModLine[];
    muted: { id: number; name: string; avatar: string | null; until: string | null }[];
    automod: { enabled: boolean; links: boolean; caps: boolean; repeat: boolean; words_text: string };
    can_clear_logs?: boolean; // the host and staff may delete lines of the log
}

interface Props {
    slug: string;
    can: Record<string, boolean>;
    mod: ModData | null;
    bans: { id: number; name: string; avatar: string | null }[];
    online: { id: number; name: string }[];
    currentSongId: number | null;
    announcement: string;
    setAnnouncement: (v: string) => void;
    announce: (e: FormEvent) => void;
}


const input = 'w-full rounded-xl border-white/10 bg-black/25 text-sm text-white placeholder-neutral-600 focus:border-violet-400 focus:ring-violet-400/20 disabled:opacity-50';
const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-200 transition hover:bg-white/10 disabled:opacity-40';
const card = 'rounded-2xl border border-white/10 bg-white/3 p-4 sm:p-5';
const when = (iso: string) => formatDateTime(iso, { dateStyle: 'short', timeStyle: 'short' });
const verbs: Record<string, string> = { kick: 'kicked', ban: 'banned', unban: 'unbanned', mute: 'muted', unmute: 'unmuted', role: 'changed the role of', clear_chat: 'cleared the chat', delete_message: 'deleted a message by', skip: 'skipped a song by', remove_song: 'removed a song by', settings: 'changed settings', waitlist: 'changed the queue', automod: 'blocked a message by', live: 'started a live stream', live_end: 'ended a live stream' };
type Operation = () => Promise<void>;

export default function ModerationPanel({ slug, can, mod, bans, online, currentSongId, announcement, setAnnouncement }: Props) {
    const [tab, setTab] = useState('Tools');
    const [query, setQuery] = useState('');
    const [action, setAction] = useState('');
    const [who, setWho] = useState('');
    const [duration, setDuration] = useState('1h');
    const [busy, setBusy] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [syncError, setSyncError] = useState(false);
    const [confirming, setConfirming] = useState<{ text: string; operation: Operation; success: string } | null>(null);
    const pending = useRef(false);
    const confirmation = useRef<HTMLDivElement>(null);
    useEffect(() => { if (confirming) { confirmation.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); confirmation.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true }); } }, [confirming]);
    const tabs = ['Tools', ...(can.moderate_users ? ['Banned', 'Muted', 'Kicks'] : []), ...(can.moderate_chat ? ['AutoMod'] : []), 'Activity'];
    const activeTab = tabs.includes(tab) ? tab : 'Tools';
    const selected = online.find((user) => String(user.id) === who);
    const needle = query.trim().toLowerCase();
    const matches = (text: string) => !needle || text.toLowerCase().includes(needle);
    const refresh = () => {
        if (pending.current || document.hidden) return;
        pending.current = true; setRefreshing(true);
        router.reload({ only: ['mod', 'bans', 'can'],
            onSuccess: () => setSyncError(false),
            onHttpException: () => { setSyncError(true); return false; },
            onNetworkError: () => { setSyncError(true); return false; },
            onFinish: () => { pending.current = false; setRefreshing(false); },
        });
    };
    useEffect(() => {
        const timer = window.setInterval(refresh, 5000);
        document.addEventListener('visibilitychange', refresh);
        return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
    }, [slug]);
    const run = async (operation: Operation, success: string) => {
        if (busy) return;
        setBusy(true); setError(''); setNotice('');
        try { await operation(); setNotice(success); setConfirming(null); refresh(); }
        catch (problem) { setError(problem instanceof Error ? problem.message : 'The action could not be completed. Please try again.'); }
        finally { setBusy(false); }
    };
    const ask = (text: string, operation: Operation, success: string) => { setError(''); setNotice(''); setConfirming({ text, operation, success }); };
    const mute = () => selected && run(() => send('POST', route('rooms.mute', [slug, selected.id]), { for: duration }), `${selected.name} muted.`);
    const muted = mod?.muted ?? [];
    const logs = (activeTab === 'Kicks' ? mod?.kicked : mod?.logs) ?? [];
    const filteredLogs = logs.filter((line) => (!action || line.action === action) && matches(`${line.actor ?? ''} ${line.target ?? ''} ${verbs[line.action] ?? line.action} ${line.details ?? ''}`));

    return <div className="space-y-5">
        <header className="rounded-2xl border border-violet-400/20 bg-linear-to-br from-violet-500/15 via-fuchsia-500/5 to-transparent p-5">
            <div className="flex items-start justify-between gap-3"><div className="flex gap-3"><span className="h-fit rounded-xl bg-violet-400/15 p-2.5 text-violet-300"><ShieldCheck size={23} /></span><div><h2 className="text-lg font-bold">Keep the room welcoming</h2><p className="mt-1 text-xs leading-relaxed text-neutral-400">Manage people, protect the chat and see what changed.</p></div></div><button type="button" disabled={refreshing} onClick={refresh} className={button} aria-label="Refresh moderation data"><RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /></button></div>
            <div className="mt-5 grid grid-cols-3 gap-3">{[[bans.length, 'Banned', can.moderate_users], [muted.length, 'Muted', can.moderate_users], [mod?.automod.enabled ? 'On' : 'Off', 'AutoMod', can.moderate_chat]].filter(([, , allowed]) => allowed).map(([value, label]) => <div key={String(label)} className="rounded-xl border border-white/5 bg-black/20 p-3"><p className="text-xl font-bold tabular-nums">{value}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-neutral-500">{label}</p></div>)}</div>
            <p className={`mt-3 text-[10px] ${syncError ? 'text-amber-300' : 'text-neutral-500'}`}>{syncError ? 'Live refresh interrupted. Retrying automatically.' : 'Activity and restrictions refresh every 5 seconds.'}</p>
        </header>
        {(notice || error) && <div role={error ? 'alert' : 'status'} className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${error ? 'border-red-400/20 bg-red-500/10 text-red-200' : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'}`}>{!error && <CheckCircle2 size={16} />}<span className="flex-1">{error || notice}</span><button onClick={() => { setError(''); setNotice(''); }} aria-label="Dismiss message"><X size={15} /></button></div>}
        {confirming && <div ref={confirmation} role="alertdialog" aria-label="Confirm moderation action" className="space-y-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4"><p className="text-sm text-amber-100">{confirming.text}</p><div className="flex gap-2"><button disabled={busy} onClick={() => run(confirming.operation, confirming.success)} className={`${button} border-red-400/30 bg-red-500/20 text-red-200`}>{busy ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={14} />} Confirm action</button><button disabled={busy} onClick={() => setConfirming(null)} className={button}>Cancel</button></div></div>}
        <nav aria-label="Moderation sections" className="flex gap-1 overflow-x-auto rounded-xl bg-black/25 p-1">{tabs.map((name) => <button key={name} type="button" aria-pressed={activeTab === name} onClick={() => { setTab(name); setQuery(''); setAction(''); }} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${activeTab === name ? 'bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/20' : 'text-neutral-500 hover:bg-white/5 hover:text-white'}`}>{name}</button>)}</nav>
        {activeTab === 'Tools' && <div className="space-y-4">
            {can.moderate_users && <section className={card}><h3 className="mb-1 flex items-center gap-2 text-sm font-bold"><VolumeX size={16} className="text-violet-300" /> Member actions</h3><p className="mb-4 text-xs text-neutral-500">A mute stops chat. A kick allows them to return. A ban blocks entry until removed.</p><label htmlFor="moderation-person" className="mb-2 block text-xs text-neutral-400">Choose someone in the room</label><select id="moderation-person" value={who} onChange={(e) => setWho(e.target.value)} className={input}><option value="">Select a member?</option>{online.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select><div className="mt-3 flex flex-wrap gap-2"><select aria-label="Mute duration" value={duration} onChange={(e) => setDuration(e.target.value)} className={`${input} w-auto text-xs`}><option value="10m">10 minutes</option><option value="1h">1 hour</option><option value="24h">24 hours</option><option value="forever">Until unmuted</option></select><button disabled={busy || !selected} onClick={mute} className={button}><VolumeX size={14} />Mute</button><button disabled={busy || !selected} onClick={() => selected && ask(`Kick ${selected.name}? They will leave the room and DJ queue, but can return.`, () => send('POST', route('rooms.kick', [slug, selected.id])), `${selected.name} kicked.`)} className={button}><UserMinus size={14} />Kick</button><button disabled={busy || !selected} onClick={() => selected && ask(`Ban ${selected.name}? They cannot return until a moderator removes the ban.`, () => send('POST', route('rooms.ban', [slug, selected.id])), `${selected.name} banned.`)} className={`${button} text-red-300`}><Ban size={14} />Ban</button></div>{!online.length && <p className="mt-3 text-xs text-neutral-500">There are no other members to select.</p>}</section>}
            {can.moderate_chat && <section className={card}><h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Megaphone size={16} className="text-amber-300" /> Room announcement</h3><form onSubmit={(event) => { event.preventDefault(); if (announcement.trim()) void run(async () => { await send('POST', route('rooms.announce', slug), { message: announcement.trim() }); setAnnouncement(''); }, 'Announcement sent.'); }}><label htmlFor="room-announcement" className="sr-only">Announcement</label><textarea id="room-announcement" disabled={busy} rows={2} value={announcement} onChange={(event) => setAnnouncement(event.target.value)} maxLength={200} placeholder="Let everyone know what is happening?" className={input} /><div className="mt-2 flex items-center justify-between"><span className="text-xs text-neutral-500">{announcement.length}/200 ? Visible to the whole room</span><button disabled={busy || !announcement.trim()} className={button}>Send announcement</button></div></form></section>}
            {(can.skip || can.moderate_chat) && <section className={card}><h3 className="text-sm font-bold">Room controls</h3><p className="mt-1 text-xs text-neutral-500">These actions affect everyone in the room.</p><div className="mt-3 flex flex-wrap gap-2">{can.skip && <button disabled={busy || !currentSongId} onClick={() => currentSongId && ask('Skip the current track for everyone? No playback XP or coins are awarded.', () => send('POST', route('rooms.skip', slug), { item_id: currentSongId }), 'Track skipped.')} className={button}><SkipForward size={14} />Skip current track</button>}{can.moderate_chat && <button disabled={busy} onClick={() => ask('Delete all chat messages in this room? This cannot be undone.', () => send('DELETE', route('rooms.clear', slug)), 'Room chat cleared.')} className={`${button} text-red-300`}><Trash2 size={14} />Clear room chat</button>}</div></section>}
        </div>}
        {['Banned', 'Muted', 'Kicks', 'Activity'].includes(activeTab) && <div className="flex flex-wrap gap-2"><div className="relative min-w-40 flex-1"><Search size={15} className="absolute left-3 top-3 text-neutral-500" /><input aria-label="Search moderation records" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people or details?" className={`${input} pl-9`} /></div>{activeTab === 'Activity' && <select aria-label="Filter action" value={action} onChange={(event) => setAction(event.target.value)} className={`${input} w-auto`}><option value="">All actions</option>{Array.from(new Set(logs.map((line) => line.action))).sort().map((name) => <option key={name} value={name}>{name.replaceAll('_', ' ')}</option>)}</select>}</div>}
        {activeTab === 'Banned' && <section className={card}><h3 className="mb-3 text-sm font-bold">Active bans ? {bans.length}</h3>{bans.filter((person) => matches(person.name)).map((person) => <div key={person.id} className="flex items-center gap-3 border-b border-white/5 py-3 last:border-0"><Avatar name={person.name} avatar={person.avatar} className="h-9 w-9" /><span className="min-w-0 flex-1 truncate text-sm">{person.name}</span><button disabled={busy} onClick={() => ask(`Allow ${person.name} to enter this room again?`, () => send('DELETE', route('rooms.unban', [slug, person.id])), `${person.name} unbanned.`)} className={button}>Remove ban</button></div>)}{!bans.some((person) => matches(person.name)) && <Empty text={query ? 'No bans match your search.' : 'No active bans. Everyone is welcome here.'} />}</section>}
        {activeTab === 'Muted' && <section className={card}><h3 className="mb-3 text-sm font-bold">Active mutes ? {muted.length}</h3>{muted.filter((person) => matches(person.name)).map((person) => <div key={person.id} className="flex items-center gap-3 border-b border-white/5 py-3 last:border-0"><Avatar name={person.name} avatar={person.avatar} className="h-9 w-9" /><div className="min-w-0 flex-1"><p className="truncate text-sm">{person.name}</p><p className="mt-1 text-[11px] text-neutral-500">{person.until ? `Ends ${when(person.until)}` : 'Until a moderator unmutes them'}</p></div><button disabled={busy} onClick={() => run(() => send('DELETE', route('rooms.unmute', [slug, person.id])), `${person.name} unmuted.`)} className={button}>Unmute</button></div>)}{!muted.some((person) => matches(person.name)) && <Empty text={query ? 'No mutes match your search.' : 'No active mutes. The conversation is open.'} />}</section>}
        {['Kicks', 'Activity'].includes(activeTab) && <section className="space-y-3"><div className="flex items-center justify-between gap-3"><p className="text-xs text-neutral-500">{activeTab === 'Kicks' ? 'Recent kicks. These members may return.' : 'Latest 100 moderation actions.'}</p>{activeTab === 'Activity' && mod?.can_clear_logs && !!mod.logs.length && <button data-clear-logs disabled={busy} onClick={() => ask('Permanently delete every moderation log entry for this room?', () => send('DELETE', route('rooms.logs.clear', slug)), 'Moderation log cleared.')} className={`${button} text-red-300`}><Trash2 size={13} />Clear logs</button>}</div><ul className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10">{filteredLogs.map((line) => <li key={line.id} data-log-line className="flex items-start gap-3 bg-white/2 p-4"><span className="rounded-lg bg-violet-500/10 p-2 text-violet-300"><History size={15} /></span><div className="min-w-0 flex-1"><p className="text-sm"><b>{line.action === 'automod' ? 'AutoMod' : line.actor ?? 'Former member'}</b> {verbs[line.action] ?? line.action}{line.target && <> <b className="text-violet-200">{line.target}</b></>}</p>{line.details && <p className="mt-1 break-words text-xs leading-relaxed text-neutral-400">{line.details}</p>}<time dateTime={line.at} className="mt-2 flex items-center gap-1 text-[10px] text-neutral-600"><Clock3 size={11} />{when(line.at)}</time></div>{mod?.can_clear_logs && <button disabled={busy} aria-label="Delete this log entry" onClick={() => ask('Delete this moderation log entry? This cannot be undone.', () => send('DELETE', route('rooms.logs.destroy', [slug, line.id])), 'Log entry deleted.')} className="rounded-lg p-2 text-neutral-600 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={14} /></button>}</li>)}</ul>{!filteredLogs.length && <Empty text={query || action ? 'No actions match these filters.' : 'No moderation activity yet.'} />}</section>}
        {activeTab === 'AutoMod' && mod && <AutoMod slug={slug} initial={mod.automod} onSaved={refresh} />}
    </div>;
}

function Empty({ text }: { text: string }) {
    return <div className="rounded-xl border border-dashed border-white/10 p-6 text-center"><ShieldCheck size={24} className="mx-auto mb-3 text-neutral-600" /><p className="text-sm text-neutral-500">{text}</p></div>;
}

function AutoMod({ slug, initial, onSaved }: { slug: string; initial: ModData['automod']; onSaved: () => void }) {
    const [settings, setSettings] = useState(initial);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const dirty = useRef(false);
    useEffect(() => { if (!dirty.current) setSettings(initial); }, [initial]);
    const change = (patch: Partial<typeof settings>) => { dirty.current = true; setSaved(false); setSettings((current) => ({ ...current, ...patch })); };
    const save = async (event: FormEvent) => {
        event.preventDefault(); if (busy) return;
        setBusy(true); setError(''); setSaved(false);
        try { await send('PUT', route('rooms.automod', slug), settings); dirty.current = false; setSaved(true); onSaved(); }
        catch (problem) { setError(problem instanceof Error ? problem.message : 'AutoMod could not be saved.'); }
        finally { setBusy(false); }
    };
    return <form onSubmit={save} className={card}><h3 className="flex items-center gap-2 font-bold"><ShieldCheck size={18} className="text-violet-300" /> Automatic chat protection</h3><p className="mt-2 text-xs leading-relaxed text-neutral-500">Filter messages before they reach the room. Members with chat moderation permission are exempt from these room filters.</p><fieldset disabled={busy} className="mt-4 divide-y divide-white/5"><Toggle label="Enable AutoMod" hint="Apply the room filters below to incoming chat messages." checked={settings.enabled} onChange={(enabled) => change({ enabled })} /><Toggle label="Block links" hint="Prevent web addresses and promotional links." checked={settings.links} onChange={(links) => change({ links })} /><Toggle label="Reduce shouting" hint="Block messages written mostly in capital letters." checked={settings.caps} onChange={(caps) => change({ caps })} /><Toggle label="Block repeated messages" hint="Block the same message repeated within 30 seconds." checked={settings.repeat} onChange={(repeat) => change({ repeat })} /><div className="pt-4"><label htmlFor="automod-words" className="mb-2 block text-sm font-semibold">Custom word filter</label><textarea id="automod-words" maxLength={1000} rows={4} value={settings.words_text} onChange={(event) => change({ words_text: event.target.value })} placeholder="One word per line, or separate words with commas" className={input} /><p className="mt-1 text-xs text-neutral-500">{settings.words_text.length}/1000 characters ? Up to 100 words</p></div></fieldset>{error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}<div className="mt-5 flex items-center justify-between"><p role="status" className="text-xs text-neutral-400">{saved ? 'Protection settings saved.' : dirty.current ? 'You have unsaved changes.' : 'Your current protection settings.'}</p><button disabled={busy} className={`${button} bg-violet-600/30 text-violet-100`}>{busy && <Loader2 size={14} className="animate-spin" />}Save AutoMod</button></div></form>;
}
