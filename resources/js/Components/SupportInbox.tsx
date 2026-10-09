import { getJson, sendJson } from '@/lib/post';
import { echo } from '@laravel/echo-react';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

interface Ticket {
    id: number;
    name: string;
    email: string | null;
    status: 'open' | 'closed';
    last_message_at: string | null;
    preview: string;
    waiting: boolean;
}

interface Line {
    id: number;
    sender: 'visitor' | 'staff';
    who: string | null;
    body: string;
    at: string;
}

const field = 'w-full rounded-md border-neutral-700 bg-neutral-800 text-sm text-neutral-100 placeholder-neutral-500 focus:border-violet-500 focus:ring-violet-500';
const time = (iso: string) => new Date(iso).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

/** Admin panel → Support: every visitor conversation, live. Click one to read it and answer. */
export default function SupportInbox() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [openId, setOpenId] = useState<number | null>(null);
    const [lines, setLines] = useState<Line[]>([]);
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const openRef = useRef<number | null>(null);
    openRef.current = openId;
    const end = useRef<HTMLDivElement>(null);

    const loadInbox = useCallback(() => getJson<Ticket[]>(route('admin.support.inbox')).then(setTickets).catch((e: Error) => setError(e.message)), []);
    const select = (id: number) => {
        setOpenId(id);
        getJson<{ messages: Line[] }>(route('admin.support.show', id)).then((t) => setLines(t.messages));
    };

    useEffect(() => {
        loadInbox();
        // new chats and new messages arrive live
        echo<'reverb'>().private('support-staff').listen('.support-message', (e: { ticket_id: number; message: Line }) => {
            loadInbox();
            if (e.ticket_id === openRef.current) setLines((p) => (p.some((x) => x.id === e.message.id) ? p : [...p, e.message]));
        });

        return () => { echo().leave('support-staff'); };
    }, [loadInbox]);

    useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [lines]);

    const reply = (e: FormEvent) => {
        e.preventDefault();
        const body = text.trim();
        if (!body || openId === null) return;
        setText('');
        sendJson<{ message: Line }>('POST', route('admin.support.reply', openId), { body })
            .then((r) => setLines((p) => (p.some((x) => x.id === r.message.id) ? p : [...p, r.message])))
            .catch((er: Error) => { setText(body); setError(er.message); });
    };

    const setStatus = (status: 'open' | 'closed') =>
        openId !== null && sendJson('PATCH', route('admin.support.status', openId), { status }).then(loadInbox);

    const current = tickets.find((t) => t.id === openId);
    const waiting = tickets.filter((t) => t.waiting).length;

    return (
        <div className="grid min-h-[28rem] gap-4 lg:grid-cols-[18rem_1fr]">
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                <p className="border-b border-neutral-800 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Conversations {waiting > 0 && <span className="ml-1 rounded-full bg-red-500 px-1.5 text-white">{waiting} waiting</span>}
                </p>
                {tickets.length === 0 && <p className="p-4 text-sm text-neutral-500">Nobody has written yet.</p>}
                <ul className="max-h-[32rem] divide-y divide-neutral-800 overflow-y-auto">
                    {tickets.map((t) => (
                        <li key={t.id}>
                            <button onClick={() => select(t.id)} className={`w-full px-4 py-3 text-left hover:bg-neutral-800 ${openId === t.id ? 'bg-neutral-800' : ''}`}>
                                <p className="flex items-center gap-2 text-sm font-medium">
                                    {t.waiting && <span className="h-2 w-2 rounded-full bg-red-500" />}
                                    <span className="truncate">{t.name}</span>
                                    {t.status === 'closed' && <span className="ml-auto text-[10px] text-neutral-500">solved</span>}
                                </p>
                                <p className="truncate text-xs text-neutral-400">{t.preview}</p>
                                {t.last_message_at && <p className="text-[10px] text-neutral-600">{time(t.last_message_at)}</p>}
                            </button>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="flex min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                {!current ? (
                    <p className="m-auto text-sm text-neutral-500">Pick a conversation.</p>
                ) : (
                    <>
                        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
                            <div>
                                <p className="font-semibold">{current.name}</p>
                                <p className="text-xs text-neutral-500">{current.email ?? 'No email left'}</p>
                            </div>
                            <button onClick={() => setStatus(current.status === 'open' ? 'closed' : 'open')} className="rounded-md bg-neutral-800 px-3 py-1.5 text-xs hover:bg-neutral-700">
                                {current.status === 'open' ? 'Mark solved' : 'Reopen'}
                            </button>
                        </div>
                        <div className="flex-1 space-y-2 overflow-y-auto p-4">
                            {lines.map((m) => (
                                <div key={m.id} className={`flex ${m.sender === 'staff' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.sender === 'staff' ? 'bg-violet-600' : 'bg-neutral-800'}`}>
                                        <p className="text-[11px] font-semibold text-fuchsia-300">{m.sender === 'staff' ? m.who : current.name}</p>
                                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                                        <p className="text-[10px] text-white/50">{time(m.at)}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={end} />
                        </div>
                        {error && <p className="px-4 text-xs text-red-400">{error}</p>}
                        <form onSubmit={reply} className="flex gap-2 border-t border-neutral-800 p-3">
                            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Answer…" maxLength={1000} className={field} />
                            <button className="rounded-md bg-violet-600 px-4 text-sm font-semibold hover:bg-violet-500">Send</button>
                        </form>
                    </>
                )}
            </section>
        </div>
    );
}
