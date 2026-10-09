import { Heart, ThumbsDown, ThumbsUp } from 'lucide-react';

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

/**
 * Woot, Grab and Meh for the song that is playing: three cards in a row, each with a dark head (the icon and the name) and a coloured body with the total.
 * They stand to the right of the DJ booth in the room scene. The ones you pressed are lit up. On your own song, and while nothing is playing, they look the same but cannot be pressed.
 */
export default function VoteBar({
    votes,
    mine,
    disabled,
    ownSong = false,
    onVote,
}: {
    votes: Votes;
    mine: MyVotes;
    disabled: boolean;
    ownSong?: boolean; // it is your own song: nobody votes for themselves
    onVote: (type: keyof Votes) => void;
}) {
    return (
        <div className="sfd-votes w-full" title={ownSong ? 'You cannot woot, meh or grab your own song' : disabled ? 'Nothing is playing yet' : undefined}>
            <div className="grid grid-cols-3 gap-2.5">
                {kinds.map(([type, label, Icon, body, lit]) => (
                    <button
                        key={type}
                        disabled={disabled}
                        onClick={() => onVote(type)}
                        aria-pressed={mine[type]}
                        aria-label={`${label}: ${votes[type]}`}
                        className={`flex flex-col overflow-hidden rounded-lg text-center shadow-lg shadow-black/50 transition duration-150 enabled:hover:-translate-y-0.5 enabled:hover:brightness-110 enabled:active:translate-y-0 disabled:cursor-not-allowed ${mine[type] ? 'ring-2 ring-white/80' : 'ring-1 ring-white/10'}`}
                    >
                        <span className={`flex h-8 items-center justify-center gap-1.5 bg-[#131014] text-[12px] font-bold uppercase tracking-wider ${mine[type] ? lit : 'text-neutral-200'}`}>
                            <Icon size={15} strokeWidth={2.2} fill={mine[type] ? 'currentColor' : 'none'} />
                            {label}
                        </span>
                        <span className={`flex h-7 items-center justify-center bg-gradient-to-b text-[17px] font-bold tabular-nums text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] ${body}`}>{votes[type]}</span>
                    </button>
                ))}
            </div>
            {ownSong && <p className="mt-1.5 px-1 text-[11px] leading-tight text-neutral-300 drop-shadow">Your song: the others vote on it.</p>}
        </div>
    );
}
