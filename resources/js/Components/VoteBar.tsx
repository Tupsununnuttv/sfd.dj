import { Heart, MoreHorizontal, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

export interface Votes {
    woot: number;
    meh: number;
    grab: number;
}

export interface MyVotes {
    woot: boolean;
    meh: boolean;
    grab: boolean;
}

// full class names so Tailwind keeps them: the colour of the body, and the colour the name takes when you have pressed it
const kinds: [keyof Votes, string, typeof ThumbsUp, string, string][] = [
    ['woot', 'Woot', ThumbsUp, 'from-[#8da241] to-[#73862a]', 'text-lime-300'],
    ['grab', 'Grab', Heart, 'from-[#a577e8] to-[#8458c5]', 'text-violet-300'],
    ['meh', 'Meh', ThumbsDown, 'from-[#b83342] to-[#96232f]', 'text-rose-300'],
];

const descriptions: Record<keyof Votes, string> = {
    woot: 'Like this song and support the DJ. Click again to remove your woot.',
    grab: 'Save this song to one of your playlists. Choose an existing playlist or create a new one.',
    meh: 'Not your taste? Give the song a meh. Click again to remove it. A meh does not skip the song.',
};

/**
 * Woot, Grab and Meh for the song that is playing: three cards in a row, each with a dark head (the icon and the name) and a coloured body with the total.
 * They stand to the right of the DJ booth in the room scene. The ones you pressed are lit up. On your own song, and while nothing is playing, they look the same but cannot be pressed.
 * Hover, keyboard focus or the options button opens help. Woot also keeps its Autowoot control.
 */
export default function VoteBar({
    votes,
    mine,
    disabled,
    ownSong = false,
    autowoot = false,
    onVote,
    onAutowoot,
}: {
    votes: Votes;
    mine: MyVotes;
    disabled: boolean;
    ownSong?: boolean; // it is your own song: nobody votes for themselves
    autowoot?: boolean;
    onVote: (type: keyof Votes) => void;
    onAutowoot?: (on: boolean) => void;
}) {
    const [menu, setMenu] = useState<keyof Votes | null>(null);
    const [hovered, setHovered] = useState<keyof Votes | null>(null);
    const box = useRef<HTMLDivElement>(null);
    const id = useId();
    const open = menu ?? hovered;

    useEffect(() => {
        if (!open) return;
        const close = () => { setMenu(null); setHovered(null); };
        const away = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) close(); };
        const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
        document.addEventListener('pointerdown', away);
        document.addEventListener('keydown', escape);

        return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', escape); };
    }, [open]);

    return (
        <div ref={box} className="sfd-votes w-full">
            <div className="grid grid-cols-3 gap-2.5">
                {kinds.map(([type, label, Icon, body, lit]) => (
                    <div key={type} className="relative"
                        onMouseEnter={() => { setHovered(type); if (menu !== type) setMenu(null); }}
                        onMouseLeave={() => setHovered(null)}
                        onFocusCapture={(e) => { if (e.target.matches(':focus-visible')) setMenu(type); }}
                        onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setMenu(null); }}
                    >
                        <button
                            disabled={disabled}
                            onClick={() => onVote(type)}
                            aria-pressed={mine[type]}
                            aria-label={`${label}: ${votes[type]}`}
                            aria-describedby={`${id}-${type}-description`}
                            className={`${type === 'woot' ? 'sfd-woot ' : type === 'grab' ? 'sfd-grab ' : 'sfd-meh '}flex w-full flex-col overflow-hidden rounded-lg text-center shadow-lg shadow-black/50 transition duration-150 enabled:hover:-translate-y-0.5 enabled:hover:brightness-110 enabled:active:translate-y-0 disabled:cursor-not-allowed ${mine[type] ? 'ring-2 ring-white/80' : 'ring-1 ring-white/10'}`}
                        >
                            <span className={`flex h-8 items-center justify-center gap-1.5 bg-[#131014] text-[12px] font-bold uppercase tracking-wider ${mine[type] ? lit : 'text-neutral-200'}`}>
                                <Icon size={15} strokeWidth={2.2} fill={mine[type] ? 'currentColor' : 'none'} />
                                {label}
                                {type === 'woot' && autowoot && <span className="rounded bg-lime-400/20 px-1 text-[9px] leading-4 tracking-normal text-lime-300">AUTO</span>}
                            </span>
                            <span className={`flex h-7 items-center justify-center bg-linear-to-b text-[17px] font-bold tabular-nums text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] ${body}`}>{votes[type]}</span>
                        </button>
                        <button type="button" onClick={() => { setMenu(menu === type ? null : type); setHovered(null); }} aria-label={`${label} options`} aria-controls={`${id}-${type}-help`} aria-expanded={open === type} className="absolute right-0.5 top-0.5 z-10 rounded p-0.5 text-neutral-500 transition hover:bg-white/10 hover:text-white">
                            <MoreHorizontal size={14} />
                        </button>
                        {/* Padding bridges the gap so the help stays open while moving up to it. */}
                        <div id={`${id}-${type}-help`} role={type === 'woot' && onAutowoot ? 'group' : 'tooltip'} aria-label={`${label} options`} className={`absolute bottom-full z-20 w-56 pb-2 ${type === 'meh' ? 'right-0' : type === 'grab' ? 'left-1/2 -translate-x-1/2' : 'left-0'} ${open === type ? 'block' : 'hidden'}`}>
                            <div className="rounded-xl border border-white/10 bg-neutral-950/95 px-3 py-2.5 shadow-xl shadow-black/60 backdrop-blur">
                                <p className={`text-sm font-bold ${lit}`}>{label}</p>
                                <p id={`${id}-${type}-description`} className="mt-1 text-[11px] leading-snug text-neutral-300">{descriptions[type]}</p>
                                {(ownSong || disabled) && <p className="mt-2 text-[11px] leading-snug text-neutral-400">{ownSong ? 'You cannot woot, meh or grab your own song' : 'Nothing is playing yet'}</p>}
                                {type === 'woot' && onAutowoot && (
                                    <label className="mt-2.5 flex cursor-pointer items-center justify-between gap-3 border-t border-white/10 pt-2.5">
                                        <span className="min-w-0">
                                            <span className="block text-sm font-bold text-lime-300">Autowoot</span>
                                            <span className="block text-[11px] leading-snug text-neutral-400">Woot every new song for me, a moment after it starts.</span>
                                        </span>
                                        <input type="checkbox" checked={autowoot} onChange={(e) => onAutowoot(e.target.checked)} className="h-4 w-4 shrink-0 rounded border-white/30 bg-transparent text-lime-500 focus:ring-lime-400" />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {ownSong && <p className="mt-1.5 px-1 text-[11px] leading-tight text-neutral-300 drop-shadow">Your song: the others vote on it.</p>}
        </div>
    );
}
