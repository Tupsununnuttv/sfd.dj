import { Ids, lin, r1, ref, sparkle, star } from '@/lib/art/kit';
import { ReactNode } from 'react';

/**
 * The badges of the Avatar shop, each on a 32 x 32 canvas: a medal in metal (round for the first, a hexagon, a shield and a starburst as they get rarer),
 * a darker plate in it and a white sign on the plate. The same keys as AvatarController::BADGES.
 */
const TONE = {
    bronze: ['#ffdcae', '#cd7f32', '#5e320f'],
    silver: ['#ffffff', '#b9c1ce', '#566070'],
    gold: ['#fff2b8', '#f5b82e', '#855407'],
    teal: ['#d2fff6', '#2dd4bf', '#0b4f48'],
    ember: ['#ffe0b8', '#f97316', '#7a2205'],
    indigo: ['#e0e4ff', '#818cf8', '#2b2a78'],
    volt: ['#fffbc2', '#facc15', '#7a5200'],
    aqua: ['#e0fbff', '#22d3ee', '#0a4f66'],
    violet: ['#f3e3ff', '#a855f7', '#44168a'],
    ruby: ['#ffd9d9', '#ef4444', '#6b0f0f'],
    platinum: ['#ffffff', '#cfd8e6', '#5d6a82'],
} as const;
type Tone = keyof typeof TONE;

const BURST = `M${Array.from({ length: 24 }, (_, i) => { const a = (i * Math.PI) / 12 - Math.PI / 2; const r = i % 2 ? 12.8 : 15; return `${r1(16 + Math.cos(a) * r)} ${r1(16 + Math.sin(a) * r)}`; }).join('L')}Z`;
const SHAPE = {
    round: 'M16 2C23.7 2 30 8.3 30 16S23.7 30 16 30 2 23.7 2 16 8.3 2 16 2Z',
    hex: 'M16 1.6 28.5 8.8V23.2L16 30.4 3.5 23.2V8.8Z',
    shield: 'M16 1.8 28 5.6V15.6C28 22.6 22.6 27.6 16 30.4 9.4 27.6 4 22.6 4 15.6V5.6Z',
    burst: BURST,
};
type Shape = keyof typeof SHAPE;
const shrink = (k: number) => `translate(16 16) scale(${k}) translate(-16 -16)`;

/** The medal: a rim in metal, a plate inside it that is darker so the sign stands out, a shine on the top left. */
const medal = (u: Ids, shape: Shape, tone: Tone) => {
    const [hi, mid, lo] = TONE[tone];
    const d = SHAPE[shape];

    return (
        <>
            <defs>
                {lin(u('r'), [[0, hi], [0.5, mid], [1, lo]], [0, 0, 1, 1])}
                {lin(u('p'), [[0, mid], [1, lo]], [0, 0, 0, 1])}
            </defs>
            <path d={d} fill={ref(u, 'r')} stroke={lo} strokeWidth=".7" strokeLinejoin="round" />
            <path d={d} fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth=".6" transform={shrink(0.93)} />
            <path d={d} fill={ref(u, 'p')} transform={shrink(0.76)} />
            <path d={d} fill="none" stroke={hi} strokeOpacity=".6" strokeWidth=".7" transform={shrink(0.76)} />
            <path d="M7 11.4C8.8 6.8 12.6 4.6 17 4.2" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.4" strokeLinecap="round" />
        </>
    );
};

/** The signs, drawn round (0, 0) in about 18 units. `c` is the colour of the sign, `a` a second colour for its details. */
const SIGN: Record<string, (c: string, a: string) => ReactNode> = {
    rookie: (c, a) => <><circle r="7.6" fill={c} /><circle r="5.4" fill="none" stroke={a} strokeOpacity=".5" strokeWidth=".8" /><circle r="2.7" fill={a} /><circle r=".9" fill={c} /><path d="M-5.2 -2.6A5.8 5.8 0 0 1 -2.4 -5" fill="none" stroke={a} strokeWidth="1" strokeLinecap="round" /></>,
    selector: (c) => <><path d="M-6.6 2.6V-1A6.6 6.6 0 0 1 6.6 -1V2.6" fill="none" stroke={c} strokeWidth="1.9" strokeLinecap="round" /><rect x="-8.6" y="0.6" width="4.6" height="8.4" rx="2" fill={c} /><rect x="4" y="0.6" width="4.6" height="8.4" rx="2" fill={c} /></>,
    digger: (c, a) => <><g transform="rotate(-14 -4 2)"><rect x="-6.2" y="-8.6" width="3.4" height="11.4" rx="1.2" fill={c} /></g><rect x="-1.8" y="-9.8" width="3.6" height="12.4" rx="1.2" fill={c} /><g transform="rotate(14 4 2)"><rect x="2.8" y="-8.6" width="3.4" height="11.4" rx="1.2" fill={c} /></g><path d="M-8.6 0.2H8.6L7.4 9H-7.4Z" fill={c} /><path d="M-5.6 3.6H5.6M-5.2 6.4H5.2" stroke={a} strokeOpacity=".7" strokeWidth="1.1" strokeLinecap="round" /><circle cy="-4" r="1.1" fill={a} /></>,
    bassline: (c) => <>{[5, 9, 15, 10, 13, 7, 4].map((h, i) => <rect key={i} x={-8.4 + i * 2.5} y={-h / 2} width="1.7" height={h} rx=".85" fill={c} />)}</>,
    streak: (c, a) => <><path d="M0 -9.4C2.6 -5.2 7.2 -3.2 6.6 2.6C6 7 3 9.4 0 9.4C-3 9.4 -6.6 7 -6.6 2.6C-6.6 -1.6 -2.4 -3.2 0 -9.4Z" fill={c} /><path d="M0 0.4C2 2.4 3.4 4.4 2.4 6.2C1.6 7.4 -1.6 7.4 -2.4 6.2C-3.4 4.4 -1.8 2.4 0 0.4Z" fill={a} /></>,
    nightowl: (c, a) => <><path d="M2.6 -8.6A8.8 8.8 0 1 0 7.2 6.4A7.2 7.2 0 0 1 2.6 -8.6Z" fill={c} /><path d={sparkle(0.62)} transform="translate(5.6 -3.6)" fill={c} /><circle cx="-1.4" cy="-3" r=".9" fill={a} /><circle cx="-3.4" cy="2.6" r="1.2" fill={a} /></>,
    voltage: (c) => <path d="M2.6 -9.6L-5.8 1.2H-0.8L-2.8 9.6L6.2 -2H1.2Z" fill={c} stroke={c} strokeWidth=".8" strokeLinejoin="round" />,
    goldenear: (c) => <><path d="M-5.2 5.8V-5.6L5.2 -7.6V4.2" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round" /><path d="M-5.2 -4.2L5.2 -6.2" stroke={c} strokeWidth="2.6" /><ellipse cx="-6.6" cy="6.2" rx="3.1" ry="2.4" transform="rotate(-18 -6.6 6.2)" fill={c} /><ellipse cx="3.8" cy="4.4" rx="3.1" ry="2.4" transform="rotate(-18 3.8 4.4)" fill={c} /></>,
    diamond: (c, a) => <><path d="M-7.6 -3.4L-3.9 -7.8H3.9L7.6 -3.4L0 8.8Z" fill={c} /><path d="M-7.6 -3.4H7.6M-3.9 -7.8L-1.9 -3.4L0 8.8M3.9 -7.8L1.9 -3.4L0 8.8" fill="none" stroke={a} strokeOpacity=".75" strokeWidth=".9" strokeLinejoin="round" /></>,
    spotlight: (c) => <><path d="M-2.6 -9H2.6L8.4 9H-8.4Z" fill={c} opacity=".38" /><path d={star(5, 5.8, 2.5)} transform="translate(0 -1)" fill={c} /></>,
    platinum: (c, a) => <><circle r="8" fill={c} /><circle r="5.6" fill="none" stroke={a} strokeOpacity=".45" strokeWidth=".8" /><circle r="2.3" fill={a} /><path d="M-6 -3.2A6.8 6.8 0 0 1 -2 -6.4M6 3.2A6.8 6.8 0 0 1 2 6.4" fill="none" stroke={a} strokeWidth="1.3" strokeLinecap="round" /><path d={sparkle(0.5)} transform="translate(6.6 -6.6)" fill={c} /></>,
    laureate: (c, a) => (
        <>
            {[0, 1].flatMap((side) => Array.from({ length: 6 }, (_, i) => {
                const th = 118 + i * 25;
                const x = Math.cos((th * Math.PI) / 180) * 8.2 * (side ? -1 : 1);
                const y = Math.sin((th * Math.PI) / 180) * 8.2;

                return <ellipse key={`${side}${i}`} cx={r1(x)} cy={r1(y)} rx="3.2" ry="1.3" transform={`rotate(${side ? 180 - (th + 90) : th + 90} ${r1(x)} ${r1(y)})`} fill={c} />;
            }))}
            <path d={star(5, 3.6, 1.6)} fill={a} stroke={c} strokeWidth=".6" />
        </>
    ),
    royal: (c, a) => <><path d="M-8 5.6V-3.4L-4 0.6L0 -6.6L4 0.6L8 -3.4V5.6Z" fill={c} /><rect x="-8" y="6.6" width="16" height="2.4" rx="1" fill={c} /><circle cx="-4.6" cy="3" r="1.1" fill={a} /><circle cy="2.2" r="1.4" fill={a} /><circle cx="4.6" cy="3" r="1.1" fill={a} /></>,
    cosmic: (c, a) => <><g transform="rotate(-22)"><ellipse rx="9.8" ry="3.4" fill="none" stroke={c} strokeOpacity=".7" strokeWidth="1.4" /></g><circle r="4.8" fill={c} /><path d="M-4.4 -1.2Q0 1.4 4.4 -1.2M-3.6 1.6Q0 3.8 3.6 1.6" fill="none" stroke={a} strokeOpacity=".55" strokeWidth=".9" /><g transform="rotate(-22)"><path d="M-9.8 0A9.8 3.4 0 0 0 9.8 0" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" /></g><circle cx="6.6" cy="-6.4" r=".9" fill={c} /><circle cx="-7.4" cy="5.8" r=".7" fill={c} /></>,
    dragonseal: (c, a) => <g transform="scale(.9)"><path d="M-7.4 -7.2C-4.8 -4.2 -2.6 -3.2 0 -3.2C2.6 -3.2 4.8 -4.2 7.4 -7.2C8.2 -2.2 5.8 3.8 0 9C-5.8 3.8 -8.2 -2.2 -7.4 -7.2Z" fill={c} /><path d="M-5.4 -2.2L-1.6 -0.6L-5.6 0.6ZM5.4 -2.2L1.6 -0.6L5.6 0.6Z" fill={a} /><circle cx="-1.3" cy="4.8" r=".8" fill={a} /><circle cx="1.3" cy="4.8" r=".8" fill={a} /><path d="M-6.4 -6.6C-8.6 -8.4 -9.2 -10.4 -8 -12M6.4 -6.6C8.6 -8.4 9.2 -10.4 8 -12" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" /></g>,
    legend: (c, a) => <g transform="scale(.82)"><path d="M-3.8 -1C-7.6 -5.2 -11 -4.4 -14 -8M-3.8 1.6C-7.8 -1.2 -11.4 -0.4 -14.4 -2.4M-3.8 4.2C-7 2.8 -10 3.6 -12.4 3" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" /><path d="M3.8 -1C7.6 -5.2 11 -4.4 14 -8M3.8 1.6C7.8 -1.2 11.4 -0.4 14.4 -2.4M3.8 4.2C7 2.8 10 3.6 12.4 3" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" /><path d={star(5, 6.2, 2.8)} fill={c} /><circle r="1.5" fill={a} /></g>,
};

/** Which medal each badge sits on. */
const MEDAL: Record<string, [Shape, Tone]> = {
    rookie: ['round', 'bronze'], selector: ['round', 'bronze'], digger: ['round', 'silver'], bassline: ['round', 'silver'],
    streak: ['hex', 'ember'], nightowl: ['hex', 'indigo'], voltage: ['hex', 'volt'],
    goldenear: ['shield', 'gold'], diamond: ['shield', 'aqua'], spotlight: ['shield', 'violet'], platinum: ['shield', 'platinum'], laureate: ['shield', 'teal'],
    royal: ['burst', 'gold'], cosmic: ['burst', 'violet'], dragonseal: ['burst', 'ruby'], legend: ['burst', 'gold'],
};

export const badgeArt: Record<string, (u: Ids) => ReactNode> = Object.fromEntries(
    Object.entries(MEDAL).map(([key, [shape, tone]]) => [
        key,
        (u: Ids) => (
            <>
                {medal(u, shape, tone)}
                <g transform="translate(16 16.8)" opacity=".4">{SIGN[key]('#000', '#000')}</g>
                <g transform="translate(16 16)">{SIGN[key]('#fff', TONE[tone][1])}</g>
            </>
        ),
    ]),
);
