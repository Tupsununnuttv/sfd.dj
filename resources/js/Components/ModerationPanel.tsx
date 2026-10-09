import Avatar from '@/Components/Avatar';
import Toggle from '@/Components/Toggle';
import { send } from '@/lib/post';
import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { FormEvent, ReactNode, useState } from 'react';

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

const input = 'w-full rounded border-neutral-700 bg-neutral-900 text-sm text-white placeholder-neutral-500 focus:border-violet-500 focus:ring-0';
const bare = input.replace('w-full ', '');
const btn = 'w-full rounded bg-neutral-800 px-4 py-2 text-left text-sm hover:bg-neutral-700';

const actionText: Record<string, string> = {
    kick: 'kicked', ban: 'banned', unban: 'unbanned', mute: 'muted', unmute: 'unmuted', role: 'changed the role of',
    clear_chat: 'cleared the chat', delete_message: 'deleted a message by', skip: 'skipped a song of', remove_song: 'removed a song of',
    settings: 'changed', waitlist: 'changed', automod: 'blocked a message by',
};

const when = (iso: string) => new Date(iso).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
const reload = () => router.reload({ only: ['mod', 'bans'] });

function LogList({ lines, empty, onDelete }: { lines: ModLine[]; empty: string; onDelete?: (l: ModLine) => void }) {
    if (lines.length === 0) return <p className="text-sm text-neutral-500">{empty}</p>;

    return (
        <ul className="divide-y divide-neutral-800 rounded border border-neutral-800 text-sm">
            {lines.map((l) => (
                <li key={l.id} className="group relative p-2 pr-9" data-log-line>
                    {onDelete && (
                        <button onClick={() => onDelete(l)} title="Delete this line" aria-label="Delete this line" className="absolute right-2 top-2 rounded p-1 text-neutral-600 hover:bg-red-500/15 hover:text-red-300">
                            <Trash2 size={14} />
                        </button>
                    )}
                    <p>
                        <span className="font-semibold text-violet-300">{l.action === 'automod' ? 'AutoMod' : l.actor ?? 'Someone'}</span> {actionText[l.action] ?? l.action}
                        {l.target && <> <span className="font-semibold">{l.target}</span></>}
                    </p>
                    {l.details && <p className="truncate text-xs text-neutral-400">{l.details}</p>}
                    <p className="text-[11px] text-neutral-600">{when(l.at)}</p>
                </li>
            ))}
        </ul>
    );
}

/** Room moderation in tabs: tools, moderation logs, banned / kicked / muted users and the AutoMod filters. */
export default function ModerationPanel({ slug, can, mod, bans, online, currentSongId, announcement, setAnnouncement, announce }: Props) {
    const tabs = ['Tools', can.moderate_users && 'Banned users', can.moderate_users && 'Kicked users', can.moderate_users && 'Muted users', can.moderate_chat && 'AutoMod', 'Moderation logs'].filter(Boolean) as string[];
    const [tab, setTab] = useState(tabs[0]);
    // the host and staff may delete lines of the log, one at a time or all of them
    const deleteLine = mod?.can_clear_logs ? (l: ModLine) => { send('DELETE', route('rooms.logs.destroy', [slug, l.id])).then(reload).catch(() => {}); } : undefined;
    const clearLogs = () => confirm('Delete every line of the moderation log of this room? This cannot be undone.') && send('DELETE', route('rooms.logs.clear', slug)).then(reload).catch(() => {});

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-1 border-b border-neutral-800">
                {tabs.map((t) => (
                    <button key={t} onClick={() => setTab(t)} className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === t ? 'border-violet-500 text-white' : 'border-transparent text-neutral-400 hover:text-white'}`}>{t}</button>
                ))}
            </div>

            {tab === 'Tools' && (
                <div className="space-y-3">
                    {can.moderate_chat && (
                        <form onSubmit={announce} className="flex gap-2">
                            <input value={announcement} onChange={(e) => setAnnouncement(e.target.value)} maxLength={200} placeholder="System announcement for this room" className={`${bare} min-w-0 flex-1`} />
                            <button className="rounded bg-amber-500 px-3 text-sm font-semibold text-black">Send</button>
                        </form>
                    )}
                    <p className="text-xs text-neutral-500">Clear the chat with 🧹 Clear under the chat box. Skip a song with the Skip button in the bar at the bottom of the room, or take a person out of the line with ✕ in the Waitlist tab. Kick, ban or mute people from their quick profile (click a name) or with 🥾 🔨 🔇 in the Users tab. Delete a message from its ⋯ menu in chat.</p>
                </div>
            )}

            {tab === 'Banned users' && (
                <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-neutral-500">Banned ({bans.length})</p>
                    {bans.length === 0 && <p className="text-sm text-neutral-500">Nobody is banned.</p>}
                    <ul className="space-y-2">
                        {bans.map((b) => (
                            <li key={b.id} className="flex items-center gap-2 text-sm">
                                <Avatar name={b.name} avatar={b.avatar} />
                                <span className="flex-1">{b.name}</span>
                                <button onClick={() => send('DELETE', route('rooms.unban', [slug, b.id])).then(reload)} className="text-xs text-violet-400 hover:underline">Unban</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {tab === 'Kicked users' && (
                <div className="space-y-2">
                    <p className="text-xs text-neutral-500">The latest people who were kicked from this room. A kick only removes them for now; they can come back.</p>
                    <LogList lines={mod?.kicked ?? []} empty="Nobody has been kicked yet." onDelete={deleteLine} />
                </div>
            )}

            {tab === 'Muted users' && <Muted slug={slug} mod={mod} online={online} />}
            {tab === 'AutoMod' && mod && <AutoMod slug={slug} initial={mod.automod} />}
            {tab === 'Moderation logs' && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-neutral-500">The latest 100 moderation actions in this room.{deleteLine && ' You can delete a line with its bin, or the whole log.'}</p>
                        {deleteLine && (mod?.logs.length ?? 0) > 0 && (
                            <button onClick={clearLogs} className="flex shrink-0 items-center gap-1.5 rounded bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/25" data-clear-logs>
                                <Trash2 size={13} /> Clear all logs
                            </button>
                        )}
                    </div>
                    <LogList lines={mod?.logs ?? []} empty="Nothing has happened yet." onDelete={deleteLine} />
                </div>
            )}
        </div>
    );
}

function Muted({ slug, mod, online }: { slug: string; mod: ModData | null; online: { id: number; name: string }[] }) {
    const [who, setWho] = useState('');
    const [length, setLength] = useState('1h');
    const [error, setError] = useState('');
    const muted = mod?.muted ?? [];

    const run = (p: Promise<void>) => p.then(() => { setError(''); reload(); }).catch((e: Error) => setError(e.message));

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <select value={who} onChange={(e) => setWho(e.target.value)} className={`${bare} min-w-0 flex-1`}>
                    <option value="">Pick someone who is here…</option>
                    {online.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <select value={length} onChange={(e) => setLength(e.target.value)} className={`${bare} w-32`}>
                    <option value="10m">10 minutes</option>
                    <option value="1h">1 hour</option>
                    <option value="24h">24 hours</option>
                    <option value="forever">Until unmuted</option>
                </select>
                <button disabled={!who} onClick={() => run(send('POST', route('rooms.mute', [slug, who]), { for: length }))} className="rounded bg-amber-500 px-3 text-sm font-semibold text-black disabled:opacity-50">Mute</button>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}

            <p className="text-xs uppercase tracking-wider text-neutral-500">Muted ({muted.length})</p>
            {muted.length === 0 && <p className="text-sm text-neutral-500">Nobody is muted.</p>}
            <ul className="space-y-2">
                {muted.map((m) => (
                    <li key={m.id} className="flex items-center gap-2 text-sm">
                        <Avatar name={m.name} avatar={m.avatar} />
                        <span className="flex-1">{m.name} <span className="text-xs text-neutral-500">{m.until ? `until ${when(m.until)}` : 'until unmuted'}</span></span>
                        <button onClick={() => run(send('DELETE', route('rooms.unmute', [slug, m.id])))} className="text-xs text-violet-400 hover:underline">Unmute</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function AutoMod({ slug, initial }: { slug: string; initial: ModData['automod'] }) {
    const [s, setS] = useState(initial);
    const [msg, setMsg] = useState('');
    const set = (patch: Partial<typeof s>) => setS({ ...s, ...patch });

    const save = (e: FormEvent): void => {
        e.preventDefault();
        send('PUT', route('rooms.automod', slug), s).then(() => { setMsg('Saved.'); reload(); }).catch((er: Error) => setMsg(er.message));
    };

    const row = (children: ReactNode) => <div className="divide-y divide-neutral-800">{children}</div>;

    return (
        <form onSubmit={save} className="space-y-3">
            {row(
                <>
                    <Toggle label="AutoMod on" hint="Checks every chat message before it is sent. People who can moderate chat are never blocked." checked={s.enabled} onChange={(v) => set({ enabled: v })} />
                    <Toggle label="Block links" hint="http:// and www. links and web addresses" checked={s.links} onChange={(v) => set({ links: v })} />
                    <Toggle label="Block shouting" hint="Messages that are mostly CAPITAL LETTERS" checked={s.caps} onChange={(v) => set({ caps: v })} />
                    <Toggle label="Block repeats" hint="The same message again within 30 seconds" checked={s.repeat} onChange={(v) => set({ repeat: v })} />
                </>,
            )}
            <div>
                <label className="mb-1 block text-xs text-neutral-400">Word filter <span className="text-neutral-600">(separate words with commas)</span></label>
                <textarea value={s.words_text} onChange={(e) => set({ words_text: e.target.value })} rows={3} placeholder="badword, another word" className={input} />
            </div>
            <div className="flex items-center gap-3">
                <button className="rounded bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-2 text-sm font-semibold">Save AutoMod</button>
                {msg && <span className="text-xs text-neutral-300">{msg}</span>}
            </div>
        </form>
    );
}
