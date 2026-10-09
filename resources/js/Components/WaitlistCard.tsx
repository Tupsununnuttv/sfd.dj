import { Disc3, Users, X } from 'lucide-react';

/**
 * The card to the left of the DJ booth. Not in the waitlist: "Join Waitlist" (blue). In the waitlist or at the decks: "Leave Waitlist" (orange).
 * The second line is how long it is until your song plays. A locked waitlist cannot be joined, and neither can a full one (67 people).
 */
export function WaitlistCard({ inList, eta, locked, full = false, busy, onClick }: { inList: boolean; eta: string; locked: boolean; full?: boolean; busy: boolean; onClick: () => void }) {
    const closed = (locked || full) && !inList;
    // full class names so Tailwind keeps them
    const tone = inList
        ? { icon: 'from-[#f57b55] to-[#f46c41]', text: 'text-[#f57b55]', edge: 'border-[#f57b55]/25' }
        : { icon: 'from-[#58b0e0] to-[#43a5dc]', text: 'text-[#58b0e0]', edge: 'border-[#58b0e0]/25' };

    return (
        <button
            onClick={onClick}
            disabled={closed || busy}
            className={`sfd-join flex h-[58px] w-full items-stretch overflow-hidden rounded-lg border bg-[#0f0f0f] text-left shadow-lg shadow-black/50 transition enabled:hover:-translate-y-0.5 enabled:hover:brightness-110 enabled:active:translate-y-0 disabled:opacity-60 ${tone.edge}`}
        >
            <span className={`flex w-[46px] shrink-0 items-center justify-center bg-gradient-to-b text-white ${tone.icon}`}>
                {inList ? <X size={22} strokeWidth={2.6} /> : <Users size={22} strokeWidth={2.2} />}
            </span>
            <span className="flex min-w-0 flex-1 flex-col justify-center px-3">
                <span className="truncate text-[15px] font-bold leading-tight text-white">{inList ? 'Leave Waitlist' : 'Join Waitlist'}</span>
                <span className={`truncate text-[11px] font-semibold leading-tight ${closed ? 'text-amber-300' : tone.text}`}>{closed ? (locked ? 'Waitlist locked' : 'Waitlist full') : `ETA: ${eta}`}</span>
            </span>
        </button>
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
