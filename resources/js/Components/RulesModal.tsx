import { ChevronDown, EyeOff, ScrollText } from 'lucide-react';
import { useEffect, useState } from 'react';

export type RoomRule = { title: string; text: string };

/** A short number for a list of rules: when the host changes them, the number changes and everybody reads them again. */
export const rulesKey = (rules: RoomRule[]) => {
    let h = 0;
    for (const c of JSON.stringify(rules)) h = (h * 31 + c.charCodeAt(0)) | 0;

    return String(h);
};

const storageKey = (roomId: number) => `sfddj.rules.${roomId}`;

/** Has this person already agreed to exactly these rules (this visit, or for good)? */
export function rulesSeen(roomId: number, rules: RoomRule[]) {
    try {
        return localStorage.getItem(storageKey(roomId)) === rulesKey(rules) || sessionStorage.getItem(storageKey(roomId)) === rulesKey(rules);
    } catch {
        return false;
    }
}

/** "I agree": do not ask again until this tab is closed. `always` is "do not show again in this room". */
export function agreeToRules(roomId: number, rules: RoomRule[], always: boolean) {
    try {
        (always ? localStorage : sessionStorage).setItem(storageKey(roomId), rulesKey(rules));
    } catch {
        /* private mode: it will ask again next time */
    }
}

/** What people read when they come into a room that has rules: the rules the host wrote, one under the other, and two ways to go on. */
export default function RulesModal({ roomName, rules, onAgree, onAlways, preview = false }: { roomName: string; rules: RoomRule[]; onAgree: () => void; onAlways: () => void; preview?: boolean }) {
    const [open, setOpen] = useState<number[]>(() => (rules.length <= 4 ? rules.map((_, i) => i) : [0]));

    useEffect(() => {
        const key = (e: KeyboardEvent) => e.key === 'Escape' && onAgree();
        window.addEventListener('keydown', key);
        return () => window.removeEventListener('keydown', key);
    }, [onAgree]);

    const toggle = (i: number) => setOpen((o) => (o.includes(i) ? o.filter((x) => x !== i) : [...o, i]));

    return (
        <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" data-rules-modal>
            <div role="dialog" aria-modal="true" aria-label="Room rules" className="flex max-h-[90vh] w-full max-w-lg animate-menu flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 text-white shadow-2xl shadow-black/70">
                <div className="relative overflow-hidden border-b border-white/10 px-6 py-5">
                    <div className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full bg-fuchsia-600/25 blur-3xl" />
                    <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-violet-600/25 blur-3xl" />
                    <div className="relative flex items-center gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-fuchsia-500 to-violet-600 shadow-lg shadow-violet-900/40"><ScrollText size={22} /></span>
                        <div className="min-w-0">
                            <h2 className="text-xl font-black tracking-tight">Room rules</h2>
                            <p className="truncate text-sm text-neutral-400">Read the rules of <span className="font-semibold text-neutral-200">{roomName}</span> before you go in.</p>
                        </div>
                    </div>
                </div>

                <ol className="min-h-0 flex-1 divide-y divide-white/5 overflow-y-auto px-2 py-1">
                    {rules.map((rule, i) => {
                        const expandable = rule.text !== '';
                        const shown = !expandable || open.includes(i);

                        return (
                            <li key={i} className="px-4 py-3">
                                <button type="button" onClick={() => expandable && toggle(i)} aria-expanded={shown} disabled={!expandable} className={`flex w-full items-center gap-3 text-left ${expandable ? '' : 'cursor-default'}`}>
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-200">{i + 1}</span>
                                    <span className="min-w-0 flex-1 wrap-break-word text-sm font-bold uppercase tracking-wide text-sky-300">{rule.title}</span>
                                    {expandable && <ChevronDown size={16} className={`shrink-0 text-neutral-500 transition-transform ${shown ? 'rotate-180' : ''}`} />}
                                </button>
                                {expandable && shown && <p className="mt-2 whitespace-pre-line wrap-break-word pl-9 text-sm leading-relaxed text-neutral-300">{rule.text}</p>}
                            </li>
                        );
                    })}
                </ol>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-black/30 px-6 py-4">
                    <button type="button" onClick={onAlways} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-neutral-300 transition hover:bg-white/10 hover:text-white">
                        <EyeOff size={14} /> {preview ? 'Close the preview' : 'Do not show again in this room'}
                    </button>
                    <button type="button" onClick={onAgree} autoFocus className="rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-violet-900/40 transition hover:opacity-90">
                        {preview ? 'Done' : 'I agree'}
                    </button>
                </div>
            </div>
        </div>
    );
}
