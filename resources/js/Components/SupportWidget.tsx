import { getJson, sendJson } from '@/lib/post';
import { echo } from '@laravel/echo-react';
import { LifeBuoy, Send, X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

interface Line {
    id: number;
    sender: 'visitor' | 'staff';
    who: string | null;
    body: string;
    at: string;
}

const KEY = 'sfd.support';
const field = 'w-full rounded-md border-neutral-700 bg-neutral-800 text-sm text-neutral-100 placeholder-neutral-500 focus:border-violet-500 focus:ring-violet-500';
const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const write = (v: string | null) => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch { /* private mode */ } };

/**
 * "Live support" bubble for visitors, no account needed. The first message starts a conversation; the secret token
 * that identifies it stays in this browser, so closing the page does not lose it. Staff answer from the admin panel.
 */
export default function SupportWidget({ launcher = true }: { launcher?: boolean }) {
    const [open, setOpen] = useState(false);

    // anything on the page can open it: window.dispatchEvent(new Event('sfd:support')) (the room's More → Contact support, which has no bubble)
    useEffect(() => {
        const show = () => setOpen(true);
        window.addEventListener('sfd:support', show);

        return () => window.removeEventListener('sfd:support', show);
    }, []);
    const [token, setToken] = useState<string | null>(read);
    const [lines, setLines] = useState<Line[]>([]);
    const [closed, setClosed] = useState(false);
    const [unread, setUnread] = useState(0);
    const [text, setText] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const end = useRef<HTMLDivElement>(null);
    const openRef = useRef(open);
    openRef.current = open;

    const add = (m: Line) => setLines((p) => (p.some((x) => x.id === m.id) ? p : [...p, m]));

    // load the saved conversation and listen for answers
    useEffect(() => {
        if (!token) return;
        getJson<{ status: string; messages: Line[] }>(route('support.show', token))
            .then((t) => { setLines(t.messages); setClosed(t.status === 'closed'); })
            .catch(() => { write(null); setToken(null); }); // unknown token: start fresh

        const name = `support.${token}`;
        echo<'reverb'>().channel(name).listen('.support-message', (e: { message: Line }) => {
            add(e.message);
            setClosed(false);
            if (e.message.sender === 'staff' && !openRef.current) setUnread((n) => n + 1);
        });

        return () => { echo().leave(name); };
    }, [token]);

    useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [lines, open]);

    const start = (e: FormEvent) => {
        e.preventDefault();
        setBusy(true);
        sendJson<{ token: string; messages: Line[] }>('POST', route('support.open'), { name, email: email || null, body: text })
            .then((t) => { write(t.token); setLines(t.messages); setToken(t.token); setText(''); setError(''); })
            .catch((er: Error) => setError(er.message))
            .finally(() => setBusy(false));
    };

    const send = (e: FormEvent) => {
        e.preventDefault();
        const body = text.trim();
        if (!body || !token) return;
        setText('');
        sendJson<{ message: Line }>('POST', route('support.send', token), { body })
            .then((r) => { add(r.message); setClosed(false); setError(''); })
            .catch((er: Error) => { setText(body); setError(er.message); });
    };

    const fresh = () => { write(null); setToken(null); setLines([]); setClosed(false); };

    return (
        <div className="fixed bottom-4 right-4 z-40 text-sm">
            {open && (
                <div className="mb-3 flex h-112 w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl">
                    <div className="flex items-center justify-between bg-linear-to-r from-fuchsia-600 to-violet-600 px-4 py-3">
                        <div>
                            <p className="font-semibold">Live support</p>
                            <p className="text-xs text-white/80">Problem with your account? Tell us.</p>
                        </div>
                        <button onClick={() => setOpen(false)} aria-label="Close" className="text-white/80 hover:text-white"><X size={18} /></button>
                    </div>

                    {!token ? (
                        <form onSubmit={start} className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
                            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={40} required className={field} />
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (so we can reach you later, optional)" className={field} />
                            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="What is going wrong?" rows={4} maxLength={1000} required className={`${field} flex-1`} />
                            {error && <p className="text-xs text-red-400">{error}</p>}
                            <button disabled={busy} className="rounded-md bg-violet-600 py-2 font-semibold hover:bg-violet-500 disabled:opacity-50">Start chat</button>
                            <p className="text-center text-[11px] text-neutral-500">Never write your password in this chat. We will never ask for it.</p>
                        </form>
                    ) : (
                        <>
                            <div className="flex-1 space-y-2 overflow-y-auto p-3">
                                {lines.map((m) => (
                                    <div key={m.id} className={`flex ${m.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-lg px-3 py-2 ${m.sender === 'visitor' ? 'bg-violet-600' : 'bg-neutral-800'}`}>
                                            {m.sender === 'staff' && <p className="text-[11px] font-semibold text-fuchsia-300">{m.who}</p>}
                                            <p className="whitespace-pre-wrap wrap-break-word">{m.body}</p>
                                        </div>
                                    </div>
                                ))}
                                {lines.length > 0 && lines[lines.length - 1].sender === 'visitor' && (
                                    <p className="text-center text-[11px] text-neutral-500">Thanks! A team member will answer here as soon as they can. You can close this window; your chat stays saved in this browser.</p>
                                )}
                                {closed && <p className="text-center text-[11px] text-neutral-500">Support marked this chat as solved. Write again to reopen it.</p>}
                                <div ref={end} />
                            </div>
                            {error && <p className="px-3 text-xs text-red-400">{error}</p>}
                            <form onSubmit={send} className="flex gap-2 border-t border-neutral-800 p-3">
                                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" maxLength={1000} className={field} />
                                <button aria-label="Send" className="rounded-md bg-violet-600 px-3 hover:bg-violet-500"><Send size={16} /></button>
                            </form>
                            <button onClick={fresh} className="border-t border-neutral-800 py-1.5 text-[11px] text-neutral-500 hover:text-white">Start a new conversation</button>
                        </>
                    )}
                </div>
            )}

            {launcher && (
                <button
                    onClick={() => { setOpen(!open); setUnread(0); }}
                    aria-label="Live support"
                    title="Live support"
                    className="relative ml-auto flex items-center gap-2 rounded-full bg-linear-to-r from-fuchsia-600 to-violet-600 p-3 font-semibold shadow-lg hover:opacity-90 sm:px-4"
                >
                    <LifeBuoy size={18} /> <span className="hidden sm:inline">Live support</span>{/* only the buoy on phones, so it hides less of the page */}
                    {unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold">{unread}</span>}
                </button>
            )}
        </div>
    );
}
