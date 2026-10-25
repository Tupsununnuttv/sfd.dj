import { Disc3, Info, Users, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

/**
 * The card to the left of the DJ booth. Not in the waitlist: "Join Waitlist" (blue). In the waitlist or at the decks: "Leave Waitlist" (orange).
 * The second line is how long it is until your song plays. A locked waitlist cannot be joined, and neither can a full one (67 people).
 */
export function WaitlistCard({ inList, etaSeconds, etaSince, locked, full = false, busy, onClick }: { inList: boolean; etaSeconds: number; etaSince: number; locked: boolean; full?: boolean; busy: boolean; onClick: () => void }) {
    const closed = (locked || full) && !inList;
    const box = useRef<HTMLDivElement>(null);
    const id = useId();
    const [menu, setMenu] = useState(false);
    const [hovered, setHovered] = useState(false);
    const open = menu || hovered;
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        if (!open) return;
        const close = () => { setMenu(false); setHovered(false); };
        const away = (event: PointerEvent) => { if (!box.current?.contains(event.target as Node)) close(); };
        const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
        document.addEventListener('pointerdown', away);
        document.addEventListener('keydown', escape);
        return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', escape); };
    }, [open]);
    useEffect(() => {
        if (closed || etaSeconds < 1) return;
        const timer = window.setInterval(() => {
            const currentTime = Date.now();
            setNow(currentTime);
            if (etaSeconds - (currentTime - etaSince) / 1000 < 1) window.clearInterval(timer);
        }, 1000);
        return () => window.clearInterval(timer);
    }, [closed, etaSeconds, etaSince]);
    const eta = Math.max(0, etaSeconds - (now - etaSince) / 1000);
    const etaLabel = eta < 1 ? 'now' : eta >= 3600 ? `${Math.floor(eta / 3600)}h ${String(Math.floor((eta % 3600) / 60)).padStart(2, '0')}m` : `${Math.floor(eta / 60)}:${String(Math.floor(eta % 60)).padStart(2, '0')}`;
    // full class names so Tailwind keeps them
    const tone = inList
        ? { icon: 'from-[#f57b55] to-[#f46c41]', text: 'text-[#f57b55]', edge: 'border-[#f57b55]/25' }
        : { icon: 'from-[#58b0e0] to-[#43a5dc]', text: 'text-[#58b0e0]', edge: 'border-[#58b0e0]/25' };

    return (
        <div ref={box} className="relative"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocusCapture={(event) => { if (event.target.matches(':focus-visible')) setMenu(true); }}
            onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setMenu(false); }}
        >
            <button
                type="button"
                onClick={onClick}
                disabled={closed || busy}
                aria-describedby={`${id}-description`}
                className={`sfd-join flex h-14.5 w-full items-stretch overflow-hidden rounded-lg border bg-[#0f0f0f] text-left shadow-lg shadow-black/50 transition enabled:hover:-translate-y-0.5 enabled:hover:brightness-110 enabled:active:translate-y-0 disabled:opacity-60 ${tone.edge}`}
            >
                <span className={`flex w-11.5 shrink-0 items-center justify-center bg-linear-to-b text-white ${tone.icon}`}>
                    {inList ? <X size={22} strokeWidth={2.6} /> : <Users size={22} strokeWidth={2.2} />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col justify-center py-1 pl-3 pr-7">
                    <span className="truncate text-[15px] font-bold leading-tight text-white">{inList ? 'Leave Waitlist' : 'Join Waitlist'}</span>
                    <span className={`truncate text-[11px] font-semibold leading-tight ${closed ? 'text-amber-300' : tone.text}`}>{closed ? (locked ? 'Waitlist locked' : 'Waitlist full') : `ETA: ${etaLabel}`}</span>
                </span>
            </button>
            <button type="button" aria-label="Waitlist information" aria-controls={`${id}-help`} aria-expanded={open}
                onClick={() => { setMenu(value => !value); setHovered(false); }}
                className="absolute right-1 top-1 z-10 rounded p-1 text-neutral-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-violet-400"
            >
                <Info size={14} />
            </button>
            <div id={`${id}-help`} role="tooltip" className={`absolute bottom-full left-0 z-20 w-64 pb-2 ${open ? 'block' : 'hidden'}`}>
                <div className="rounded-xl border border-white/10 bg-neutral-950/95 px-3 py-2.5 shadow-xl shadow-black/60 backdrop-blur">
                    <p className={`text-sm font-bold ${tone.text}`}>{inList ? 'Leave Waitlist' : 'Join Waitlist'}</p>
                    <div id={`${id}-description`} className="mt-1 space-y-2 text-[11px] leading-snug text-neutral-300">
                        <p>{inList
                            ? 'Leave the DJ waitlist and remove your queued songs. If your song is playing, it will be skipped.'
                            : 'Join the DJ waitlist to play the next song from your active playlist when it is your turn. If your playlist is missing or empty, your playlists will open.'}</p>
                        <p>ETA is the estimated time until your song plays.</p>
                        {closed && <p className="text-amber-300">{locked ? 'The waitlist is locked. A moderator needs to unlock it before you can join.' : 'The waitlist is full. Try again when someone leaves.'}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

/** On the front of an empty booth: a button to take the decks, and a tag that says nobody is playing. */
export function SeatButton({ locked, onClick }: { locked: boolean; onClick: () => void }) {
    return (
        <div className="flex flex-col items-center gap-1.5">
            <button
                onClick={onClick}
                disabled={locked}
                aria-label="Join the waitlist"
                className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#58b0e0]/25 bg-[#0f0f0f] text-[#58b0e0] shadow-lg shadow-black/50 transition enabled:hover:-translate-y-0.5 enabled:hover:brightness-125 disabled:opacity-60"
            >
                <Disc3 size={24} strokeWidth={2} />
            </button>
            <span className="whitespace-nowrap rounded-md border border-white/10 bg-[#0f0f0f] px-2.5 py-1 text-[11px] font-semibold leading-none text-neutral-200 shadow">Waiting for DJ</span>
        </div>
    );
}
