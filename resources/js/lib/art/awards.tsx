import { Ids, lin, rad, ref, sparkle, star } from '@/lib/art/kit';
import { ReactNode } from 'react';

/**
 * The special badges staff give out (Beta Tester, Bug Hunter ...), each on a 32 x 32 canvas. They are drawn as seals: a scalloped edge in the colour of the badge,
 * a dark plate in it and a white sign on the plate, so they never look like the metal medals of the Avatar shop. The same keys as App\Support\Awards.
 */
const TONE: Record<string, [string, string]> = {
    beta: ['#2dd4bf', '#0b4f48'],
    founder: ['#facc15', '#7a5200'],
    bughunter: ['#f87171', '#6b0f0f'],
    contributor: ['#60a5fa', '#173a8a'],
    champion: ['#fbbf24', '#7a4a05'],
    tastemaker: ['#c084fc', '#44168a'],
    hero: ['#fb7185', '#7a1230'],
};

/** The signs, drawn round (0, 0) in about 16 units. `c` is the colour of the sign, `a` the colour of the badge for its details. */
const SIGN: Record<string, (c: string, a: string) => ReactNode> = {
    // a flask with something bubbling in it
    beta: (c, a) => <><path d="M-1.9 -7.6H1.9V-2.6L6.8 5.4C7.6 6.8 6.6 8.2 5 8.2H-5C-6.6 8.2 -7.6 6.8 -6.8 5.4L-1.9 -2.6Z" fill={c} /><rect x="-3.1" y="-8.8" width="6.2" height="1.8" rx=".9" fill={c} /><path d="M-5.2 3H5.2L6.4 5.2C6.8 6 6.2 6.8 5.2 6.8H-5.2C-6.2 6.8 -6.8 6 -6.4 5.2Z" fill={a} /><circle cx="-1.2" cy="1" r="1" fill={a} /><circle cx="1.6" cy="-1.2" r=".7" fill={a} /></>,
    // a banner on a pole, with a star on it
    founder: (c, a) => <><rect x="-6" y="-8.6" width="1.6" height="17.4" rx=".8" fill={c} /><path d="M-4.4 -8C-1.2 -9.6 2 -6.4 6.8 -8V1.2C2 2.8 -1.2 -.4 -4.4 1.2Z" fill={c} /><path d={star(5, 2.5, 1.1)} transform="translate(1.2 -3.2)" fill={a} /><ellipse cx="-5.2" cy="8.8" rx="3.4" ry="1.1" fill={c} /></>,
    // a beetle
    bughunter: (c, a) => <><ellipse cy="2" rx="4.6" ry="5.6" fill={c} /><circle cy="-4.4" r="2.3" fill={c} /><path d="M0 -3.2V7.6" stroke={a} strokeWidth="1" /><circle cx="-2.1" cy="1.4" r="1" fill={a} /><circle cx="2.1" cy="1.4" r="1" fill={a} /><circle cx="-1.9" cy="4.6" r=".9" fill={a} /><circle cx="1.9" cy="4.6" r=".9" fill={a} /><path d="M-1.2 -6.4L-3.4 -8.6M1.2 -6.4L3.4 -8.6M-4.6 -.4L-8 -1.8M4.6 -.4L8 -1.8M-4.6 2.4L-8 3M4.6 2.4L8 3M-4.2 5.2L-7.4 7.4M4.2 5.2L7.4 7.4" stroke={c} strokeWidth="1.2" strokeLinecap="round" /></>,
    // < / >
    contributor: (c, a) => <><path d="M-3 -5.8L-8.2 0L-3 5.8" fill="none" stroke={c} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M3 -5.8L8.2 0L3 5.8" fill="none" stroke={c} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M1.6 -7.4L-1.6 7.4" stroke={a} strokeWidth="2.1" strokeLinecap="round" /></>,
    // a trophy
    champion: (c, a) => <><path d="M-4.8 -7.4H4.8V-1.4C4.8 2 2.8 4 0 4C-2.8 4 -4.8 2 -4.8 -1.4Z" fill={c} /><path d="M-4.8 -5.6H-7.8C-7.8 -2.2 -6.4 -.4 -4.2 .2M4.8 -5.6H7.8C7.8 -2.2 6.4 -.4 4.2 .2" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" /><rect x="-1.1" y="4" width="2.2" height="2.8" fill={c} /><rect x="-3.8" y="6.6" width="7.6" height="2.2" rx=".9" fill={c} /><path d={star(5, 2.6, 1.1)} transform="translate(0 -2.4)" fill={a} /></>,
    // a record with a sparkle
    tastemaker: (c, a) => <><circle r="7.8" fill={c} /><circle r="5.7" fill="none" stroke={a} strokeOpacity=".5" strokeWidth=".8" /><circle r="4.1" fill="none" stroke={a} strokeOpacity=".4" strokeWidth=".7" /><circle r="2.4" fill={a} /><circle r=".8" fill={c} /><path d="M-5.9 -3.6A6.9 6.9 0 0 1 -3 -6.2" fill="none" stroke={a} strokeWidth="1" strokeLinecap="round" /><path d={sparkle(0.6)} transform="translate(6.4 -6.4)" fill={c} /></>,
    // a shield with a star
    hero: (c, a) => <><path d="M0 -8.8L7.6 -6.2V.2C7.6 4.8 4.3 7.8 0 9.2C-4.3 7.8 -7.6 4.8 -7.6 .2V-6.2Z" fill={c} /><path d={star(5, 4, 1.8)} transform="translate(0 .4)" fill={a} /></>,
};

const SCALLOPS = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;

    return [Math.round(Math.cos(a) * 12.6 * 10) / 10, Math.round(Math.sin(a) * 12.6 * 10) / 10] as const;
});

export const awardArt: Record<string, (u: Ids) => ReactNode> = Object.fromEntries(
    Object.entries(TONE).map(([key, [tone, deep]]) => [
        key,
        (u: Ids) => (
            <>
                <defs>
                    {rad(u('p'), [[0, deep], [1, '#09090f']], [0.4, 0.3, 0.95])}
                    {lin(u('r'), [[0, '#ffffff'], [0.45, tone], [1, deep]], [0, 0, 1, 1])}
                </defs>
                <g transform="translate(16 16)">
                    {SCALLOPS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill={tone} stroke={deep} strokeWidth=".5" />)}
                    <circle r="13.4" fill={ref(u, 'r')} stroke={deep} strokeWidth=".6" />
                    <circle r="10.8" fill={ref(u, 'p')} />
                    <circle r="10.8" fill="none" stroke={tone} strokeOpacity=".7" strokeWidth=".8" />
                    <path d="M-8.6 -5.4C-7 -8.8 -4 -10.6 -.6 -10.8" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1.2" strokeLinecap="round" />
                    <g transform="translate(0 .7)" opacity=".4">{SIGN[key]('#000', '#000')}</g>
                    {SIGN[key]('#fff', tone)}
                </g>
            </>
        ),
    ]),
);
