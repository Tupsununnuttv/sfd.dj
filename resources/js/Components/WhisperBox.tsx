import Avatar from '@/Components/Avatar';
import { fieldClass } from '@/Components/ui';
import { getJson, sendJson } from '@/lib/post';
import { ago } from '@/lib/time';
import { PageProps } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { ArrowLeft, MessageCirclePlus, Search, Send, UserRound } from 'lucide-react';
import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface Person {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
}
interface Line {
    id: number;
    mine: boolean;
    from_id: number;
    to_id: number;
    body: string;
    at: string;
}
interface Conversation {
    user: Person;
    last: Line;
    unread: number;
}
interface Incoming extends Omit<Line, 'mine'> {
    sender: Person;
}

const clock = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString();
const dayLabel = (iso: string) => {
    const d = new Date(iso);
    const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
    return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
};

/**
 * Whispers: your conversations on the left, the open one on the right. Updates live.
 * `start` opens a person straight away; `friends` fills the "new whisper" picker; `openProfile` replaces going to their page.
 */
export default function WhisperBox({ start, friends = [], openProfile, className = 'h-[calc(100vh-15rem)] min-h-120' }: {
    start?: number | null;
    friends?: Person[];
    openProfile?: (id: number, name: string) => void;
    className?: string;
}) {
    const me = usePage<PageProps>().props.auth.user.id;
    const [list, setList] = useState<Conversation[]>([]);
    const [other, setOther] = useState<Person | null>(null);
    const [composing, setComposing] = useState(false); // the "new whisper" picker is open
    const [lines, setLines] = useState<Line[]>([]);
    const [text, setText] = useState('');
    const [to, setTo] = useState('');
    const [find, setFind] = useState('');
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [error, setError] = useState('');
    const otherRef = useRef<Person | null>(null);
    otherRef.current = other;
    const end = useRef<HTMLDivElement>(null);
    const box = useRef<HTMLTextAreaElement>(null);

    const loadList = useCallback(() => getJson<Conversation[]>(route('api.whispers')).then(setList).catch(() => {}), []);
    const open = useCallback((id: number) => {
        getJson<{ user: Person; messages: Line[] }>(route('api.whispers.thread', id))
            .then((t) => { setOther(t.user); setComposing(false); setLines(t.messages); setError(''); loadList(); })
            .catch((e: Error) => setError(e.message));
    }, [loadList]);

    useEffect(() => {
        loadList();
        if (start) open(start);

        const ch = echo<'reverb'>().private(`App.Models.User.${me}`);
        const onWhisper = (w: Incoming) => {
            const mine = w.from_id === me;
            const partner = mine ? w.to_id : w.from_id;
            if (partner === otherRef.current?.id) {
                setLines((p) => (p.some((x) => x.id === w.id) ? p : [...p, { ...w, mine }]));
                if (!mine) getJson(route('api.whispers.thread', partner)).catch(() => {}); // it is on screen: mark read
            }
            loadList();
        };
        ch.listen('.whisper', onWhisper);

        return () => { ch.stopListening('.whisper', onWhisper); };
    }, [me, start, open, loadList]);

    useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [lines, other]);
    useEffect(() => {
        const el = box.current;
        if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 120)}px`; }
    }, [text]);

    const send = (e?: FormEvent) => {
        e?.preventDefault();
        const body = text.trim();
        if (!body) return;
        const payload = other ? { user_id: other.id, body } : { username: to.trim().replace(/^@/, ''), body };
        setText('');
        sendJson<{ message: Line; user: Person }>('POST', route('api.whispers.send'), payload)
            .then((r) => {
                setError('');
                if (!other) { setOther(r.user); setComposing(false); setTo(''); setLines([r.message]); } else setLines((p) => (p.some((x) => x.id === r.message.id) ? p : [...p, r.message]));
                loadList();
            })
            .catch((er: Error) => { setText(body); setError(er.message); });
    };

    const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    };

    const startNew = () => { setOther(null); setComposing(true); setLines([]); setError(''); setTo(''); };
    const unreadTotal = list.reduce((n, c) => n + c.unread, 0);
    const shown = list.filter((c) => (!unreadOnly || c.unread > 0) && (!find.trim() || `${c.user.name} ${c.user.username}`.toLowerCase().includes(find.trim().toLowerCase())));

    // people offered in the picker: earlier conversations and friends, narrowed by what is typed
    const suggestions = useMemo(() => {
        const seen = new Set<number>();
        const all = [...list.map((c) => c.user), ...friends].filter((p) => !seen.has(p.id) && seen.add(p.id));
        const n = to.trim().replace(/^@/, '').toLowerCase();

        return all.filter((p) => !n || `${p.name} ${p.username}`.toLowerCase().includes(n)).slice(0, 8);
    }, [list, friends, to]);

    // consecutive messages from the same person are grouped; a new day gets a heading
    const rows = lines.map((m, i) => {
        const prev = lines[i - 1];
        const next = lines[i + 1];
        const newDay = !prev || !sameDay(prev.at, m.at);

        return {
            m,
            heading: newDay ? dayLabel(m.at) : null,
            first: newDay || prev.mine !== m.mine,
            last: !next || next.mine !== m.mine || !sameDay(next.at, m.at),
        };
    });

    const chatOpen = !!other || composing;

    return (
        <div className={`grid gap-4 md:grid-cols-[19rem_1fr] ${className}`}>
            {/* conversations */}
            <section className={`${chatOpen ? 'hidden md:flex' : 'flex'} min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/4`}>
                <div className="space-y-2 border-b border-white/10 p-3">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                            <input value={find} onChange={(e) => setFind(e.target.value)} placeholder="Search whispers" className={`${fieldClass} py-1.5 pl-8`} />
                        </div>
                        <button onClick={startNew} title="New whisper" className="rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 p-2 text-white hover:opacity-90"><MessageCirclePlus size={17} /></button>
                    </div>
                    <div className="flex gap-1.5 text-xs">
                        <button onClick={() => setUnreadOnly(false)} className={`rounded-full px-3 py-1 font-semibold ${!unreadOnly ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'}`}>All</button>
                        <button onClick={() => setUnreadOnly(true)} className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold ${unreadOnly ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'}`}>Unread {unreadTotal > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{unreadTotal}</span>}</button>
                    </div>
                </div>

                <ul className="min-h-0 flex-1 divide-y divide-white/5 overflow-y-auto">
                    {shown.length === 0 && (
                        <li className="p-6 text-center text-sm text-neutral-500">
                            {list.length === 0 ? <>No whispers yet.<br /><button onClick={startNew} className="mt-2 text-violet-400 hover:underline">Start one</button></> : 'Nothing matches.'}
                        </li>
                    )}
                    {shown.map((c) => (
                        <li key={c.user.id}>
                            <button onClick={() => open(c.user.id)} className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5 ${other?.id === c.user.id ? 'bg-violet-500/10' : ''}`}>
                                <Avatar name={c.user.name} avatar={c.user.avatar} className="h-10 w-10 text-base" />
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-baseline justify-between gap-2">
                                        <span className={`truncate text-sm ${c.unread ? 'font-bold text-white' : 'font-medium'}`}>{c.user.name}</span>
                                        <span className="shrink-0 text-[11px] text-neutral-500">{ago(c.last.at)}</span>
                                    </span>
                                    <span className="flex items-center justify-between gap-2">
                                        <span className={`truncate text-xs ${c.unread ? 'text-neutral-200' : 'text-neutral-500'}`}>{c.last.mine ? 'You: ' : ''}{c.last.body}</span>
                                        {c.unread > 0 && <span className="shrink-0 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{c.unread}</span>}
                                    </span>
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            </section>

            {/* the open conversation */}
            <section className={`${chatOpen ? 'flex' : 'hidden md:flex'} min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/4`}>
                {!chatOpen ? (
                    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                        <p className="text-5xl">💬</p>
                        <p className="mt-3 font-semibold">Your whispers</p>
                        <p className="mt-1 max-w-xs text-sm text-neutral-400">Private messages between you and one other person. Pick a conversation, or start a new one.</p>
                        <button onClick={startNew} className="mt-4 rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 px-4 py-2 text-sm font-semibold">New whisper</button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                            <button onClick={() => { setOther(null); setComposing(false); }} className="rounded-lg p-1 text-neutral-400 hover:bg-white/10 md:hidden" aria-label="Back"><ArrowLeft size={18} /></button>
                            {other ? (
                                <>
                                    <Avatar name={other.name} avatar={other.avatar} className="h-9 w-9" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold">{other.name}</p>
                                        <p className="truncate text-xs text-neutral-500">@{other.username}</p>
                                    </div>
                                    <button onClick={() => (openProfile ? openProfile(other.id, other.name) : router.visit(route('users.show', other.id)))} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20"><UserRound size={14} /> Profile</button>
                                </>
                            ) : (
                                <div className="flex flex-1 items-center gap-2">
                                    <span className="text-sm text-neutral-400">To:</span>
                                    <input autoFocus value={to} onChange={(e) => setTo(e.target.value)} placeholder="username, or pick below" className={`${fieldClass} py-1.5`} />
                                </div>
                            )}
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                            {!other && (
                                <div className="mb-4">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Friends and recent</p>
                                    {suggestions.length === 0 ? <p className="text-sm text-neutral-500">No suggestions. Type the exact username above.</p> : (
                                        <div className="flex flex-wrap gap-2">
                                            {suggestions.map((p) => (
                                                <button key={p.id} onClick={() => open(p.id)} className="flex items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-3 text-sm hover:bg-white/10">
                                                    <Avatar name={p.name} avatar={p.avatar} className="h-6 w-6 text-xs" /> {p.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            {other && lines.length === 0 && <p className="py-10 text-center text-sm text-neutral-500">No messages yet. Say hi 👋</p>}
                            {rows.map(({ m, heading, first, last }) => (
                                <div key={m.id}>
                                    {heading && <p className="my-4 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{heading}</p>}
                                    <div className={`flex ${m.mine ? 'justify-end' : 'justify-start'} ${first ? 'mt-3' : 'mt-0.5'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${m.mine ? 'rounded-br-md bg-linear-to-br from-fuchsia-600 to-violet-600 text-white' : 'rounded-bl-md bg-white/10'}`}>
                                            <p className="whitespace-pre-wrap wrap-break-word">{m.body}</p>
                                            {last && <p className={`mt-0.5 text-[10px] ${m.mine ? 'text-white/60' : 'text-neutral-500'}`}>{clock(m.at)}</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={end} />
                        </div>

                        {error && <p className="px-4 pb-1 text-xs text-red-400">{error}</p>}
                        <form onSubmit={send} className="flex items-end gap-2 border-t border-white/10 p-3">
                            <textarea ref={box} rows={1} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} placeholder={other ? `Whisper to ${other.name}…` : 'Write a whisper…'} maxLength={500} className={`${fieldClass} max-h-28 resize-none`} />
                            {text.length > 400 && <span className="pb-2 text-[11px] text-neutral-500">{500 - text.length}</span>}
                            <button disabled={!text.trim()} aria-label="Send" className="rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 p-2.5 text-white transition hover:opacity-90 disabled:opacity-40"><Send size={17} /></button>
                        </form>
                    </>
                )}
            </section>
        </div>
    );
}
