import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { pineTier } from '@/Components/scene/shapes';
import { after, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, floorTile as tile, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const font = 'Figtree, system-ui, sans-serif';
const OUT = '#2a1608'; // the dark line round the reindeer and the sleigh, so they read against the moon and against the night
const GOLD = '#e8b923';
const TONES = [['#9a6a3b', '#6b4526'], ['#8a5a30', '#5b3a20'], ['#a47445', '#704a2a']]; // a reindeer's coat, and the darker far legs
// a reindeer facing right, round its middle: the body, the neck, the head and an ear in one path (drawn dark first, then the coat, so no seams show)
const DEER = 'M-36 -4C-38 -20 -16 -27 6 -25C24 -24 36 -17 36 -4C36 9 22 15 2 15C-20 15 -35 10 -36 -4ZM20 -18L38 -50L50 -44L38 -2ZM45 -53C52 -58 62 -53 67 -46C66 -42 60 -41 55 -42C49 -43 44 -47 45 -53ZM44 -54L40 -64L51 -56Z';
const BULBS = ['#ef4444', '#fbbf24', '#22c55e', '#38bdf8', '#f472b6'];
const BALLS = ['#ef4444', '#fbbf24', '#38bdf8', '#a78bfa', '#f8fafc', '#22c55e'];

// stars, the aurora's rays, flakes in the picture, sparkles on the ice and the baubles on the tree: the same every time
const rs = rand(23);
const STARS = Array.from({ length: 150 }, () => ({ x: rs() * 1600, y: rs() ** 1.6 * 470, r: 0.5 + rs() * 1.3, o: 0.3 + rs() * 0.7 }));
const rk = rand(31);
// the northern lights: thin rays that overlap into a curtain, hanging from a wavy lower edge; green fades to teal to violet along the sky (the video hides the middle)
const RAYS = Array.from({ length: 235 }, (_, i) => {
    const x = -24 + i * 7;

    return { x, base: 205 + Math.sin(x * 0.011) * 52 + Math.sin(x * 0.0043 + 1) * 40, h: 100 + rk() * 60 + Math.sin(x * 0.023) * 36, o: r1(0.45 + rk() * 0.55), c: Math.min(2, Math.floor(((Math.sin(x * 0.0075) + 1) * 3) / 2)) };
}).filter(({ x }) => x < 440 || x > 1160);
const rf = rand(9);
const FLAKES = Array.from({ length: 44 }, () => ({ x: rf() * 1600, y: rf() * 880, r: 0.9 + rf() * 2.2, o: 0.35 + rf() * 0.5 }));
const SPARKS = Array.from({ length: 24 }, () => ({ x: rf() * 1600, y: 650 + rf() * 640, s: 4 + rf() * 6 }));
const rt = rand(5);
const HILL_A: [number, number][] = [[0, 540], [60, 520], [120, 508], [200, 512], [300, 514], [380, 506], [440, 516], [500, 528], [560, 536], [620, 538], [700, 536], [800, 530], [880, 520], [960, 510], [1040, 503], [1100, 503], [1170, 510], [1240, 520], [1300, 514], [1360, 508], [1440, 506], [1500, 508], [1560, 514], [1600, 520]];
const hillY = (x: number) => {
    const i = Math.max(1, HILL_A.findIndex(([px]) => px >= x));
    const [x0, y0] = HILL_A[i - 1];
    const [x1, y1] = HILL_A[i];

    return y0 + ((y1 - y0) * (x - x0)) / Math.max(1, x1 - x0);
};
const PINES = Array.from({ length: 46 }, (_, k) => ({ x: 8 + k * 35 + rt() * 20, s: 0.5 + rt() * 0.34, v: k % 3 === 0 ? 'B' : 'A' })).filter((p) => p.x < 1170 || p.x > 1490);
const TIERS = [{ a: -225, b: -40, w: 156 }, { a: -335, b: -175, w: 126 }, { a: -425, b: -285, w: 96 }, { a: -500, b: -375, w: 66 }, { a: -548, b: -455, w: 40 }];
const ORNAMENTS = TIERS.flatMap((t, ti) => Array.from({ length: 5 }, (_, k) => {
    const y = t.a + (t.b - t.a) * (0.3 + rt() * 0.6);
    const range = ((t.w * (y - t.a)) / (t.b - t.a)) * 0.8;

    return { x: (rt() * 2 - 1) * range, y, r: 6.5 + rt() * 4, c: BALLS[(ti * 5 + k) % BALLS.length] };
}));
const LIGHTS = TIERS.flatMap((t) => Array.from({ length: 8 }, () => {
    const y = t.a + (t.b - t.a) * (0.18 + rt() * 0.74);
    const range = ((t.w * (y - t.a)) / (t.b - t.a)) * 0.9;

    return { x: (rt() * 2 - 1) * range, y };
}));

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/** A five-pointed star around (0, 0). */
const star = (outer: number, inner: number) => Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? inner : outer;

    return `${i ? 'L' : 'M'}${r1(Math.cos(a) * r)} ${r1(Math.sin(a) * r)}`;
}).join('') + 'Z';

/**
 * The Christmas scenery on a 1600 x 900 canvas: a snowy night with northern lights, a full moon with Santa's sleigh across it, a village and a log cabin
 * (Santa is stuck in its chimney), a big decorated tree, a candy cane gate, the video in a frame of fairy lights, and a frozen floor with a snowflake under the booth.
 * Like the others it only moves while a song plays (`live`): lights chase round the frame, the sleigh flies across, Santa kicks, the aurora shimmers.
 * The snow that falls over everything, even the crowd, is drawn by RoomScene (Snow.tsx).
 */
export default function ChristmasBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down
    const use = (id: string, x: number, y: number, s: number, k: string | number) => <use key={k} href={`#${u(id)}`} transform={`translate(${r1(x)} ${r1(y)}) scale(${s})`} />;

    // ----- the little pieces -----
    const bulb = (k: string, x: number, y: number, i: number, r = 4.2, glow = 15) => (
        <g key={k}>
            <circle className={i % 3 ? undefined : 'sc-twinkle'} style={i % 3 ? undefined : after(-(i % 9) * 0.19)} cx={r1(x)} cy={r1(y)} r={glow} fill={f(`bulb${i % 5}`)} />
            <ellipse cx={r1(x)} cy={r1(y)} rx={r1(r * 0.78)} ry={r} fill={BULBS[i % 5]} />
            <ellipse cx={r1(x - r * 0.25)} cy={r1(y - r * 0.35)} rx={r1(r * 0.24)} ry={r1(r * 0.34)} fill="#fff" opacity=".85" />
            <rect x={r1(x - r * 0.35)} y={r1(y - r - 2.4)} width={r1(r * 0.7)} height="2.8" rx=".6" fill="#16221d" />
        </g>
    );

    const gift = (k: string, x: number, y: number, w: number, h: number, body: string, ribbon: string) => (
        <g key={k}>
            <ellipse cx={x + w / 2} cy={y + h} rx={w * 0.62} ry={h * 0.12} fill="#04101e" opacity=".4" />
            <rect x={x} y={y} width={w} height={h} rx="2.5" fill={body} />
            <rect x={x} y={y} width={w * 0.34} height={h} rx="2.5" fill="#000" opacity=".16" />
            <rect x={x - 2} y={y - h * 0.18} width={w + 4} height={h * 0.22} rx="2.5" fill={body} />
            <rect x={x - 2} y={y - h * 0.18} width={w + 4} height={h * 0.22} rx="2.5" fill="#fff" opacity=".2" />
            <rect x={x + w / 2 - 3.5} y={y - h * 0.18} width="7" height={h * 1.18} fill={ribbon} />
            <path d={`M${x + w / 2} ${y - h * 0.18}C${x + w / 2 - w * 0.34} ${y - h * 0.62} ${x + w / 2 - w * 0.4} ${y - h * 0.2} ${x + w / 2} ${y - h * 0.18}C${x + w / 2 + w * 0.34} ${y - h * 0.62} ${x + w / 2 + w * 0.4} ${y - h * 0.2} ${x + w / 2} ${y - h * 0.18}Z`} fill={ribbon} stroke="#00000033" strokeWidth=".8" />
            <circle cx={x + w / 2} cy={y - h * 0.18} r="3.4" fill={ribbon} stroke="#00000033" strokeWidth=".8" />
        </g>
    );

    /** A bauble on a string from (ax, ay); it swings from the top of the string. */
    const bauble = (k: string, ax: number, ay: number, len: number, r: number, c: string, d: number) => (
        <g key={k} className="sc-dangle" style={after(d)}>
            <path d={`M${ax} ${ay}V${ay + len}`} stroke="#c7d2dc" strokeWidth="1.4" />
            <rect x={ax - r * 0.34} y={ay + len - 1} width={r * 0.68} height="5" rx="1" fill="#e6c200" />
            <circle cx={ax} cy={ay + len + 4 + r} r={r} fill={c} />
            <circle cx={ax} cy={ay + len + 4 + r} r={r} fill={f('shine')} />
            <path d={`M${ax - r * 0.55} ${ay + len + 4 + r}Q${ax} ${ay + len + 4 + r + r * 0.6} ${ax + r * 0.55} ${ay + len + 4 + r}`} stroke="#ffffff" strokeOpacity=".5" strokeWidth="1.4" fill="none" />
        </g>
    );

    const snowman = (cx: number, cy: number, s: number) => (
        <g transform={`translate(${cx} ${cy}) scale(${s})`}>
            <ellipse cx="0" cy="2" rx="62" ry="9" fill="#04101e" opacity=".45" />
            <path d="M-44 -80L-82 -120M-82 -120L-88 -134M-82 -120L-96 -118M44 -80L84 -106M84 -106L92 -120M84 -106L98 -104" stroke="#5a3418" strokeWidth="5" strokeLinecap="round" fill="none" />
            <circle cx="0" cy="-46" r="46" fill={f('snowman')} />
            <circle cx="0" cy="-108" r="34" fill={f('snowman')} />
            <circle cx="0" cy="-158" r="25" fill={f('snowman')} />
            {[-96, -80, -64].map((y) => <circle key={y} cx="0" cy={y} r="3.2" fill="#1f2937" />)}
            <circle cx="-8.5" cy="-163" r="3" fill="#111827" /><circle cx="8.5" cy="-163" r="3" fill="#111827" />
            <path d="M0 -158L26 -153L0 -149Z" fill="#f97316" /><path d="M0 -158L26 -153L12 -155Z" fill="#fdba74" opacity=".6" />
            {[-12, -6, 0, 6, 12].map((x, i) => <circle key={x} cx={x} cy={-146 + Math.abs(x) * 0.22 - 0.8 + (i === 2 ? 1 : 0)} r="1.7" fill="#111827" />)}
            <path d="M-26 -137Q0 -126 26 -137L24 -127Q0 -116 -24 -127Z" fill="#dc2626" />
            <path d="M-26 -137Q0 -126 26 -137" stroke="#fff" strokeOpacity=".4" strokeWidth="1.6" fill="none" />
            <path d="M18 -130Q38 -118 30 -96L40 -99L36 -112Q44 -122 28 -134Z" fill="#16a34a" />
            <rect x="-24" y="-196" width="48" height="8" rx="2" fill="#111827" />
            <rect x="-15" y="-226" width="30" height="34" rx="3" fill="#111827" />
            <rect x="-15" y="-206" width="30" height="7" fill="#dc2626" />
            <path d="M-4 -208l3 -6l3 6zM3 -208l3 -5l3 5z" fill="#16a34a" />
            <circle cx="9" cy="-208" r="2.4" fill="#ef4444" />
            <ellipse cx="-14" cy="-60" rx="14" ry="22" fill="#fff" opacity=".22" />
        </g>
    );

    const smallHouse = (k: string, x: number, y: number, w: number, d: number) => {
        const h = w * 0.62;

        return (
            <g key={k}>
                <ellipse cx={x} cy={y + 2} rx={w * 0.85} ry="3" fill="#0a1a2c" opacity=".35" />
                <rect x={x - w / 2} y={y - h} width={w} height={h} fill="#1b3556" />
                <path d={`M${x - w * 0.62} ${y - h}L${x} ${y - h - w * 0.42}L${x + w * 0.62} ${y - h}Z`} fill="#22456f" />
                <path d={`M${x - w * 0.66} ${y - h + 1}L${x} ${y - h - w * 0.47}L${x + w * 0.66} ${y - h + 1}Q${x + w * 0.5} ${y - h - 4} ${x + w * 0.36} ${y - h + 2}Q${x + w * 0.2} ${y - h - 5} ${x} ${y - h + 2}Q${x - w * 0.2} ${y - h - 5} ${x - w * 0.36} ${y - h + 2}Q${x - w * 0.5} ${y - h - 4} ${x - w * 0.66} ${y - h + 1}Z`} fill="#f4faff" />
                <rect x={x - w * 0.34} y={y - h * 0.8} width={w * 0.26} height={h * 0.42} fill={f('glowWarm')} opacity=".7" />
                <rect className="sc-flame" style={after(d)} x={x - w * 0.3} y={y - h * 0.74} width={w * 0.2} height={h * 0.32} fill="#ffd27a" />
                <rect x={x + w * 0.12} y={y - h * 0.6} width={w * 0.2} height={h * 0.6} fill="#2b1b10" />
                <rect x={x + w * 0.26} y={y - h - w * 0.4} width={w * 0.1} height={w * 0.22} fill="#4a3a30" />
            </g>
        );
    };

    // ----- Santa's sleigh: it crosses the moon, and flies across the sky while a song plays (a line of dark round the colours, so it reads on the moon and on the night) -----
    const outlined = (d: string, tone: string, w: number) => (
        <>
            <path d={d} stroke={OUT} strokeWidth={w + 2.8} />
            <path d={d} stroke={tone} strokeWidth={w} />
        </>
    );

    const deer = (k: string, x: number, y: number, [tone, shade]: string[], d: number, lead = false) => (
        <g key={k} transform={`translate(${x} ${y})`}>
            <g className="sc-bob" style={after(d)}>
                <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                    {outlined('M14 10L30 22L44 20', shade, 4)}{outlined('M-14 10L-30 24L-46 24', shade, 4)}
                </g>
                <path d={DEER} fill={OUT} stroke={OUT} strokeWidth="3.2" strokeLinejoin="round" />
                <path d={DEER} fill={tone} />
                <path d="M-33 3C-14 15 18 15 33 0C26 11 8 16 -2 16C-18 16 -31 11 -33 3Z" fill="#ecd2a4" opacity=".7" />
                <path d="M-34 -14L-47 -23L-41 -8Z" fill="#f4e4c1" stroke={OUT} strokeWidth="1.2" strokeLinejoin="round" />
                <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                    {outlined('M22 8L40 14L54 6', tone, 4.4)}{outlined('M-22 8L-40 16L-56 12', tone, 4.4)}
                    {outlined('M47 -54C42 -70 33 -80 20 -85M43 -66L50 -77M37 -75L41 -87M30 -80L21 -76', '#f1dfb4', 2.6)}
                </g>
                {[[54, 6], [-56, 12], [44, 20], [-46, 24]].map(([hx, hy]) => <circle key={hx} cx={hx} cy={hy} r="2.6" fill={OUT} />)}
                <path d="M26 -20L40 -12M30 -8C12 0 -10 0 -30 -6" fill="none" stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" />
                <circle cx="35" cy="-10" r="3.2" fill={GOLD} stroke={OUT} strokeWidth="1" />
                {lead ? (
                    <>
                        <circle className="sc-flame" cx="67" cy="-45" r="20" fill={f('glowRed')} />
                        <circle cx="66" cy="-45.5" r="3.8" fill="#ff3b3b" stroke="#7f1d1d" strokeWidth=".8" />
                    </>
                ) : (
                    <circle cx="66.5" cy="-45.5" r="2.2" fill={OUT} />
                )}
            </g>
        </g>
    );

    const sleigh = (
        <g className="sc-sleigh">
            <g transform="translate(220 226) rotate(-6) scale(.47)" strokeLinejoin="round">
                <ellipse cx="150" cy="-10" rx="300" ry="70" fill={f('glowGold')} opacity=".14" />
                <path d="M-330 8L-92 -2L-92 14Z" fill={f('trail')} />
                {[[-300, -2, 5], [-262, 10, 3.6], [-226, -12, 5.4], [-192, 6, 3.4], [-160, -8, 4.4], [-128, 12, 3]].map(([x, y, s]) => <path key={x} className="sc-twinkle" style={after(-x / 90)} d={`M${x} ${y - s}L${x + s * 0.28} ${y - s * 0.28}L${x + s} ${y}L${x + s * 0.28} ${y + s * 0.28}L${x} ${y + s}L${x - s * 0.28} ${y + s * 0.28}L${x - s} ${y}L${x - s * 0.28} ${y - s * 0.28}Z`} fill="#ffe9a8" />)}
                <path d="M74 -8C150 -18 240 -6 340 -26" fill="none" stroke={GOLD} strokeWidth="1.8" />
                {deer('d3', 322, -18, TONES[2], -0.5, true)}{deer('d2', 222, -6, TONES[1], -0.25)}{deer('d1', 122, 4, TONES[0], 0)}
                <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                    {outlined('M-68 28C-30 38 38 38 66 28C82 23 88 8 80 -4', GOLD, 3.6)}{outlined('M-36 16V31M22 16V31', GOLD, 3)}
                </g>
                <path d="M-66 -6C-84 -22 -78 -54 -54 -58C-32 -60 -24 -30 -32 -6Z" fill="#b98a52" stroke={OUT} strokeWidth="1.6" />
                <path d="M-64 -50C-52 -44 -42 -44 -34 -50" fill="none" stroke="#dc2626" strokeWidth="3.6" strokeLinecap="round" />
                <rect x="-66" y="-70" width="15" height="13" rx="1.6" fill="#2563eb" stroke={OUT} strokeWidth="1.2" /><path d="M-58.5 -70V-57M-66 -63.5H-51" stroke="#fde68a" strokeWidth="2.4" />
                <circle cx="-40" cy="-64" r="8" fill="#22c55e" stroke={OUT} strokeWidth="1.2" /><path d="M-48 -64H-32" stroke="#ef4444" strokeWidth="2.4" />
                <ellipse cx="-4" cy="-22" rx="18" ry="17" fill="#c81e1e" stroke={OUT} strokeWidth="1.6" />
                <rect x="-22" y="-20" width="36" height="5" fill="#111827" opacity=".85" />
                <circle cx="2" cy="-48" r="9.6" fill="#f1c9a5" stroke={OUT} strokeWidth="1.4" />
                <ellipse cx="8" cy="-43" rx="8.4" ry="7.4" fill="#f8fafc" stroke={OUT} strokeWidth="1.2" />
                <path d="M-8 -52L2 -78L18 -53Z" fill="#dc2626" stroke={OUT} strokeWidth="1.4" /><path d="M-9 -52H19" stroke="#f8fafc" strokeWidth="5" strokeLinecap="round" /><circle cx="2" cy="-80" r="5" fill="#f8fafc" stroke={OUT} strokeWidth="1.2" />
                <path d="M8 -30L30 -26" stroke="#dc2626" strokeWidth="7" strokeLinecap="round" /><circle cx="32" cy="-26" r="3.8" fill="#f8fafc" stroke={OUT} strokeWidth="1.2" />
                <path d="M-62 -24C-66 -2 -46 18 -14 20L48 20C64 20 74 6 80 -22C70 -12 60 -8 50 -8L-44 -8C-54 -8 -58 -16 -62 -24Z" fill="#c81e1e" stroke="#3b0a0a" strokeWidth="1.8" />
                <path d="M-60 -20C-54 -12 -50 -8 -42 -8L50 -8C62 -8 72 -14 80 -22" fill="none" stroke={GOLD} strokeWidth="2.8" strokeLinecap="round" />
                <path d="M80 -22C88 -34 78 -42 66 -38" fill="none" stroke={GOLD} strokeWidth="3.4" strokeLinecap="round" />
                <path d="M-50 6C-20 13 20 13 52 6" fill="none" stroke="#7f1d1d" strokeWidth="2" opacity=".7" />
                <circle cx="70" cy="-30" r="20" fill={f('glowWarm')} /><circle cx="68" cy="-26" r="4" fill="#ffe08a" stroke={OUT} strokeWidth="1" />
            </g>
        </g>
    );

    // ----- the cabin on the hill: Santa is stuck in the chimney -----
    const cabin = (cx: number, cy: number, s: number) => {
        const logs = Array.from({ length: 7 }, (_, i) => -96 + i * 14.8);
        const eaves = Array.from({ length: 10 }, (_, i) => -118 + i * 26.2);

        return (
            <g transform={`translate(${cx} ${cy}) scale(${s})`}>
                <ellipse cx="0" cy="3" rx="150" ry="10" fill="#0a1a2c" opacity=".4" />
                <ellipse cx="0" cy="-40" rx="170" ry="120" fill={f('glowWarm')} opacity=".16" />
                {[0, 1, 2].map((k) => <circle key={k} className="sc-smoke" style={after(-k * 2.4)} cx="64" cy="-232" r="12" fill={f('smoke')} opacity=".5" />)}
                {/* the chimney, and Santa's legs sticking out of it */}
                <rect x="44" y="-206" width="38" height="70" fill="#7a5a48" />
                {[-196, -178, -160, -142].map((y) => <path key={y} d={`M44 ${y}H82M${y % 36 === 0 ? 58 : 66} ${y}v-18`} stroke="#4b3328" strokeWidth="1.4" opacity=".7" />)}
                <path d="M40 -206H86L84 -214H42Z" fill="#f4faff" />
                <g className="sc-kick" style={after(0)}>
                    <path d="M52 -212L50 -250" stroke="#dc2626" strokeWidth="9" strokeLinecap="round" />
                    <rect x="44" y="-262" width="13" height="8" rx="2.4" fill="#f8fafc" /><path d="M43.5 -262H57.5L58 -276Q50 -282 43 -276Z" fill="#111827" />
                </g>
                <g className="sc-kick" style={after(-0.45)}>
                    <path d="M72 -212L76 -248" stroke="#dc2626" strokeWidth="9" strokeLinecap="round" />
                    <rect x="69" y="-260" width="13" height="8" rx="2.4" fill="#f8fafc" /><path d="M68.5 -260H82.5L83 -274Q75 -280 68 -274Z" fill="#111827" />
                </g>
                {/* the walls: logs */}
                <rect x="-98" y="-108" width="196" height="108" fill={f('logs')} />
                {logs.map((y) => (
                    <g key={y}>
                        <path d={`M-98 ${y + 14.8}H98`} stroke="#3a1f0e" strokeWidth="1.6" opacity=".8" />
                        <ellipse cx="-98" cy={y + 7.4} rx="5" ry="7.4" fill="#9a6a40" stroke="#3a1f0e" strokeWidth="1.2" /><ellipse cx="98" cy={y + 7.4} rx="5" ry="7.4" fill="#9a6a40" stroke="#3a1f0e" strokeWidth="1.2" />
                    </g>
                ))}
                {/* the roof, snow on it, and the lights along the eaves */}
                <path d="M-124 -100L0 -190L124 -100Z" fill="#3a2214" />
                <path d={`M-134 -96L0 -200L134 -96${eaves.map((x) => `Q${r1(134 - (x + 118) - 13)} ${-78 + ((x * 7) % 5)} ${r1(134 - (x + 118) - 26.2)} -96`).join('')}Z`} fill="#f7fbff" />
                <path d="M-134 -96L0 -200" stroke="#bcd8ee" strokeWidth="3" opacity=".8" fill="none" />
                {[-100, -66, -34, 18, 52, 90].map((x, i) => <path key={x} d={`M${x} -88l4 ${12 + (i % 3) * 7}l4 ${-(12 + (i % 3) * 7)}z`} fill={f('icicle')} />)}
                {Array.from({ length: 11 }, (_, i) => bulb(`e${i}`, -120 + i * 24, -92 + Math.sin(i * 1.7) * 3, i, 3.2, 11))}
                {/* two windows and a door with a wreath */}
                {[-68, 26].map((x) => (
                    <g key={x}>
                        <rect x={x} y={-86} width="42" height="40" fill="#2b1608" />
                        <rect className="sc-flame" style={after(-x / 40)} x={x + 3} y={-83} width="36" height="34" fill={f('win')} />
                        <path d={`M${x + 21} -83V-49M${x + 3} -66H${x + 39}`} stroke="#2b1608" strokeWidth="2.4" />
                        <path d={`M${x - 3} -46H${x + 45}L${x + 43} -50H${x - 1}Z`} fill="#f4faff" />
                        <ellipse cx={x + 21} cy={-66} rx="34" ry="30" fill={f('glowWarm')} opacity=".45" />
                    </g>
                ))}
                <path d="M-16 0V-52A16 16 0 0 1 16 -52V0Z" fill="#5a2d12" /><circle cx="9" cy="-26" r="2" fill="#fbbf24" />
                <circle cx="0" cy="-48" r="15" fill="none" stroke="#15803d" strokeWidth="7.5" />
                <circle cx="0" cy="-48" r="15" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="2 4" />
                {[[-9, -58], [7, -60], [12, -45], [-12, -38]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="2" fill="#ef4444" />)}
                <path d="M-1 -34l-9 12l6 -3l4 -7l4 7l6 3z" fill="#dc2626" />
                <ellipse cx="0" cy="1" rx="26" ry="5" fill="#f4faff" />
            </g>
        );
    };

    // ----- the tree: the one thing in the picture that is all about Christmas -----
    const tree = (
        <g>
            <ellipse cx="0" cy="4" rx="190" ry="14" fill="#04101e" opacity=".45" />
            <ellipse cx="0" cy="-260" rx="230" ry="300" fill={f('glowGold')} opacity=".16" />
            <rect x="-22" y="-44" width="44" height="46" fill="#5b3418" /><path d="M-10 -40V0M6 -40V0" stroke="#3a210f" strokeWidth="2.4" />
            {TIERS.map((t, i) => {
                const n = Math.max(3, Math.round(t.w / 26));
                let d = `M0 ${t.a}L${-t.w} ${t.b}`;
                for (let k = 0; k < n; k++) d += `Q${r1(-t.w + ((2 * t.w * (k + 0.5)) / n))} ${t.b + 20} ${r1(-t.w + (2 * t.w * (k + 1)) / n)} ${t.b}`;

                return (
                    <g key={i}>
                        <path d={`${d}Z`} fill={f('treeG')} />
                        <path d={`${d}Z`} fill={f('treeShade')} />
                        <path d={`M0 ${t.a}L${-t.w} ${t.b}`} stroke="#5be08a" strokeOpacity=".5" strokeWidth="3" fill="none" />
                        <path d={`M0 ${t.a + 2}L${-t.w + 4} ${t.b - 2}M0 ${t.a + 2}L${t.w - 4} ${t.b - 2}`} stroke="#f4faff" strokeWidth="5" strokeLinecap="round" strokeDasharray="28 11 9 21" opacity=".92" fill="none" />
                        {[0.62, 0.88].map((v, j) => {
                            const y0 = t.a + (t.b - t.a) * v;
                            const hw = ((t.w * (y0 - t.a)) / (t.b - t.a)) * 0.94;

                            return (
                                <g key={j} fill="none" strokeLinecap="round">
                                    <path d={`M${r1(-hw)} ${r1(y0)}Q0 ${r1(y0 + 38)} ${r1(hw)} ${r1(y0)}`} stroke="#8a5a00" strokeWidth="6.4" />
                                    <path d={`M${r1(-hw)} ${r1(y0)}Q0 ${r1(y0 + 38)} ${r1(hw)} ${r1(y0)}`} stroke="#fbbf24" strokeWidth="4.6" strokeDasharray="1 8.5" />
                                </g>
                            );
                        })}
                    </g>
                );
            })}
            {LIGHTS.map((l, i) => bulb(`tl${i}`, l.x, l.y, i, 3.2, 13))}
            {ORNAMENTS.map((o, i) => (
                <g key={i}>
                    <rect x={r1(o.x - 2.2)} y={r1(o.y - o.r - 3.6)} width="4.4" height="4.4" rx="1" fill="#d4a017" />
                    <circle cx={r1(o.x)} cy={r1(o.y)} r={r1(o.r)} fill={o.c} />
                    <circle cx={r1(o.x)} cy={r1(o.y)} r={r1(o.r)} fill={f('shine')} />
                </g>
            ))}
            <g className="sc-pulse">
                <circle cx="0" cy="-574" r="72" fill={f('glowGold')} />
                {[0, 45, 90, 135].map((a) => <path key={a} d="M0 -574V-640M0 -574V-508" stroke="#fde68a" strokeWidth="2" opacity=".6" transform={`rotate(${a} 0 -574)`} />)}
                <path d={star(28, 12)} transform="translate(0 -574)" fill={f('gold')} stroke="#fff3b0" strokeWidth="1.6" strokeLinejoin="round" />
            </g>
            {gift('g1', -128, -52, 76, 54, '#dc2626', '#fde68a')}
            {gift('g2', -52, -38, 56, 40, '#16a34a', '#ef4444')}
            {gift('g3', 24, -58, 62, 60, '#2563eb', '#e2e8f0')}
            {gift('g4', 96, -34, 46, 36, '#a855f7', '#fbbf24')}
            {gift('g5', -170, -30, 40, 32, '#fbbf24', '#dc2626')}
        </g>
    );

    // ----- the fairy lights round the frame, and the icicles under it -----
    const frameBulbs: JSX.Element[] = [];
    const left = tv.x - 18;
    const right = tv.x + tv.w + 18;
    const bottom = tv.y + tv.h + 14;
    for (let i = 0; i < 12; i++) {
        frameBulbs.push(bulb(`fl${i}`, left, 16 + i * 35, i));
        frameBulbs.push(bulb(`fr${i}`, right, 16 + i * 35 + 14, i + 2));
    }
    for (let i = 0; i < 21; i++) frameBulbs.push(bulb(`fb${i}`, left + 18 + i * 35.6, bottom + (i % 2 ? 0 : 3), i + 1, 4.4, 17));

    const icicles = Array.from({ length: 22 }, (_, i) => {
        const x = left + 30 + i * 33.5;
        const l = 18 + ((i * 53) % 29);

        return <path key={i} d={`M${r1(x - 5)} ${bottom + 6}L${r1(x + 0.5)} ${bottom + 6 + l}L${r1(x + 5)} ${bottom + 6}Z`} fill={f('icicle')} />;
    });

    const bow = (x: number, y: number, flip: number) => (
        <g transform={`translate(${x} ${y}) scale(${flip} 1)`}>
            <path d="M0 4C-26 -26 -52 -8 -40 8C-30 20 -10 14 0 4ZM0 4C26 -26 52 -8 40 8C30 20 10 14 0 4Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1.4" />
            <path d="M-4 4C-24 -10 -36 -2 -32 6" fill="none" stroke="#fca5a5" strokeWidth="2" opacity=".7" /><path d="M4 4C24 -10 36 -2 32 6" fill="none" stroke="#fca5a5" strokeWidth="2" opacity=".7" />
            <path d="M-4 8L-24 46L-12 40L-6 52ZM4 8L24 46L12 40L6 52Z" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1.2" />
            <circle cx="0" cy="5" r="8.5" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.4" />
            <path d="M-10 -10L-4 -2L-14 -2ZM8 -12L14 -4L4 -4Z" fill="#16a34a" />
            {[[-14, -6], [-9, 1], [16, -6]].map(([bx, by]) => <circle key={bx} cx={bx} cy={by} r="2.4" fill="#ef4444" stroke="#7f1d1d" strokeWidth=".8" />)}
        </g>
    );

    // a garland of pine along the top edge, from a corner: needles, berries, lights and baubles
    const garland = (k: string) => (
        <g key={k}>
            <path d="M-10 54C60 126 150 116 230 64S340 4 400 38" fill="none" stroke="#0f3d22" strokeWidth="26" strokeLinecap="round" />
            <path d="M-10 54C60 126 150 116 230 64S340 4 400 38" fill="none" stroke="#166534" strokeWidth="22" strokeLinecap="round" strokeDasharray="2.4 3.2" />
            <path d="M-10 50C60 120 150 110 230 58S340 -2 400 32" fill="none" stroke="#22c55e" strokeWidth="9" strokeLinecap="round" strokeDasharray="3 5" opacity=".75" />
            {[[40, 92], [100, 112], [160, 104], [220, 70], [290, 32], [350, 28]].map(([x, y], i) => <g key={x}><circle cx={x} cy={y} r="4.6" fill="#ef4444" /><circle cx={x - 1.4} cy={y - 1.6} r="1.4" fill="#fff" opacity=".7" /><path d={`M${x + 4} ${y - 2}l10 -6l-2 9z`} fill="#15803d" />{i % 2 === 0 && <ellipse cx={x + 12} cy={y + 8} rx="3.2" ry="5" fill="#8b5a2b" transform={`rotate(-20 ${x + 12} ${y + 8})`} />}</g>)}
            {[[24, 84], [80, 118], [140, 116], [200, 86], [262, 40], [330, 14], [384, 38]].map(([x, y], i) => bulb(`${k}${i}`, x, y + 16, i + 3, 3.6, 13))}
            {bauble(`${k}b1`, 122, 120, 26, 14, '#ef4444', 0)}
            {bauble(`${k}b2`, 252, 62, 20, 12, '#fbbf24', -1.2)}
            <g transform="translate(18 40)"><circle r="20" fill="#dc2626" /><circle r="20" fill={f('shine')} /><path d="M-6 -26L0 -6L6 -26" stroke="#dc2626" strokeWidth="6" fill="none" /></g>
        </g>
    );

    // ----- the floor: ice, with a snowflake under the booth -----
    const floorTiles = Array.from({ length: 12 }, (_, j) => Array.from({ length: 16 }, (_, k) => k - 8).map((i) => ({ i, j }))).flat().filter(({ j }) => rowY(j + 1) < height + 120);
    // six bold arms, each with two V-shaped pairs of branches: it is squashed flat on the floor, so it needs few, thick lines to still read as a snowflake
    const flake = Array.from({ length: 6 }, (_, k) => {
        const a = (k * Math.PI) / 3;
        const at = (r: number) => `${r1(Math.cos(a) * r)} ${r1(Math.sin(a) * r)}`;
        const side = (r: number, len: number, da: number) => `${r1(Math.cos(a) * r + Math.cos(a + da) * len)} ${r1(Math.sin(a) * r + Math.sin(a + da) * len)}`;
        const fork = (r: number, len: number) => `M${at(r)}L${side(r, len, -0.85)}M${at(r)}L${side(r, len, 0.85)}`;

        return `M${at(0.14)}L${at(0.96)}${fork(0.5, 0.24)}${fork(0.74, 0.18)}`;
    }).join('');

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('sky')} x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#020716" /><stop offset=".25" stopColor="#07163d" /><stop offset=".5" stopColor="#0d3563" /><stop offset=".72" stopColor="#17628a" /><stop offset=".9" stopColor="#4aa7bf" /><stop offset="1" stopColor="#9ddbe6" />
                </linearGradient>
                <radialGradient id={u('moonGlow')} cx="296" cy="214" r="300" gradientUnits="userSpaceOnUse"><stop stopColor="#e0f4ff" stopOpacity=".55" /><stop offset=".4" stopColor="#7cc4f0" stopOpacity=".2" /><stop offset="1" stopColor="#4aa7e0" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('moon')} cx=".38" cy=".34" r=".8"><stop stopColor="#ffffff" /><stop offset=".6" stopColor="#e3f3ff" /><stop offset="1" stopColor="#b4d6ee" /></radialGradient>
                <radialGradient id={u('halo')} cx="800" cy={tv.y + tv.h / 2} r="640" gradientUnits="userSpaceOnUse"><stop stopColor="#fbbf24" stopOpacity=".2" /><stop offset=".5" stopColor="#ef4444" stopOpacity=".07" /><stop offset="1" stopColor="#ef4444" stopOpacity="0" /></radialGradient>
                {[['#34d399', '#86efac'], ['#2dd4bf', '#99f6e4'], ['#a78bfa', '#e9d5ff']].map(([c, hi], i) => (
                    <linearGradient key={c} id={u(`aur${i}`)} x1="0" y1="0" x2="0" y2="1">
                        <stop stopColor={c} stopOpacity="0" /><stop offset=".6" stopColor={c} stopOpacity=".3" /><stop offset=".92" stopColor={hi} stopOpacity=".72" /><stop offset="1" stopColor={hi} stopOpacity=".1" />
                    </linearGradient>
                ))}
                <linearGradient id={u('streak')} x1="1" y1="0" x2="0" y2="1"><stop stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" stopOpacity=".95" /></linearGradient>
                <linearGradient id={u('mtn')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#5f86b8" /><stop offset="1" stopColor="#27487a" /></linearGradient>
                <linearGradient id={u('hillA')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a6cde8" /><stop offset="1" stopColor="#4f7fae" /></linearGradient>
                <linearGradient id={u('hillB')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f4faff" /><stop offset=".6" stopColor="#bfdcf0" /><stop offset="1" stopColor="#7fa9cc" /></linearGradient>
                <radialGradient id={u('glowWarm')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffd27a" stopOpacity=".9" /><stop offset=".45" stopColor="#ffa940" stopOpacity=".35" /><stop offset="1" stopColor="#ff9a1f" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('glowGold')} cx=".5" cy=".5" r=".5"><stop stopColor="#fde68a" stopOpacity=".9" /><stop offset=".4" stopColor="#fbbf24" stopOpacity=".3" /><stop offset="1" stopColor="#fbbf24" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('glowRed')} cx=".5" cy=".5" r=".5"><stop stopColor="#ff5a5a" stopOpacity=".9" /><stop offset=".45" stopColor="#ef4444" stopOpacity=".35" /><stop offset="1" stopColor="#ef4444" stopOpacity="0" /></radialGradient>
                {BULBS.map((c, i) => <radialGradient key={c} id={u(`bulb${i}`)} cx=".5" cy=".5" r=".5"><stop stopColor={c} stopOpacity=".85" /><stop offset=".5" stopColor={c} stopOpacity=".28" /><stop offset="1" stopColor={c} stopOpacity="0" /></radialGradient>)}
                <radialGradient id={u('shine')} cx=".34" cy=".3" r=".7"><stop stopColor="#fff" stopOpacity=".9" /><stop offset=".35" stopColor="#fff" stopOpacity=".15" /><stop offset="1" stopColor="#000" stopOpacity=".28" /></radialGradient>
                <linearGradient id={u('gold')} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff3b0" /><stop offset=".5" stopColor="#fbbf24" /><stop offset="1" stopColor="#b7791f" /></linearGradient>
                <linearGradient id={u('treeG')} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#2fae63" /><stop offset=".55" stopColor="#14783f" /><stop offset="1" stopColor="#0b4a2a" /></linearGradient>
                <linearGradient id={u('treeShade')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#000" stopOpacity="0" /><stop offset=".7" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".32" /></linearGradient>
                <linearGradient id={u('logs')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8a5a36" /><stop offset="1" stopColor="#5a3418" /></linearGradient>
                <linearGradient id={u('win')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff0b8" /><stop offset="1" stopColor="#ffa940" /></linearGradient>
                <linearGradient id={u('icicle')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffffff" stopOpacity=".95" /><stop offset="1" stopColor="#9fd8ff" stopOpacity=".35" /></linearGradient>
                <radialGradient id={u('snowman')} cx=".38" cy=".32" r=".8"><stop stopColor="#ffffff" /><stop offset=".6" stopColor="#e6f2fb" /><stop offset="1" stopColor="#a8c8e4" /></radialGradient>
                <radialGradient id={u('smoke')} cx=".5" cy=".5" r=".5"><stop stopColor="#e5eef8" stopOpacity=".8" /><stop offset="1" stopColor="#e5eef8" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('trail')} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#fde68a" stopOpacity="0" /><stop offset="1" stopColor="#fde68a" stopOpacity=".7" /></linearGradient>
                <radialGradient id={u('fog')} cx=".5" cy=".5" r=".5"><stop stopColor="#e8f4ff" stopOpacity=".55" /><stop offset=".55" stopColor="#bfe0f7" stopOpacity=".2" /><stop offset="1" stopColor="#bfe0f7" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <linearGradient id={u('horizon')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffd27a" stopOpacity="0" /><stop offset=".5" stopColor="#ffd27a" stopOpacity=".22" /><stop offset="1" stopColor="#ffd27a" stopOpacity="0" /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#fde68a" stopOpacity=".5" /><stop offset=".55" stopColor="#7cc4f0" stopOpacity=".2" /><stop offset="1" stopColor="#7cc4f0" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#7cc4f0" stopOpacity="0" /><stop offset="1" stopColor={p.floorBottom} stopOpacity=".7" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".58" /></radialGradient>
                <radialGradient id={u('drift')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffffff" stopOpacity=".95" /><stop offset=".7" stopColor="#dbeefb" stopOpacity=".7" /><stop offset="1" stopColor="#bfe0f7" stopOpacity="0" /></radialGradient>
                <pattern id={u('candy')} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="16" height="16" fill="#f8fafc" /><rect width="8" height="16" fill="#dc2626" /></pattern>
                <pattern id={u('fence')} width="16" height="40" patternUnits="userSpaceOnUse" x="0" y="556">
                    <rect x="2.5" y="8" width="11" height="32" rx="2.4" fill="#e6f0f8" /><rect x="9" y="8" width="4.5" height="32" rx="2" fill="#b9d0e2" />
                    <path d="M2.5 11C2.5 3 13.5 3 13.5 11Z" fill="#f8fcff" /><rect x="5" y="22" width="6" height="4" fill="#dc2626" opacity=".85" />
                </pattern>
                <filter id={u('soft')} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" /></filter>
                {/* two kinds of pine, for the hills and the edges */}
                <g id={u('pineA')}>
                    <rect x="-4" y="-10" width="8" height="12" fill="#3b2412" />
                    {pineTier(-54, -8, 34, '#0e3b36')}{pineTier(-86, -34, 28, '#0e3b36')}{pineTier(-114, -62, 22, '#0e3b36')}{pineTier(-134, -88, 15, '#0e3b36')}
                </g>
                <g id={u('pineB')}>
                    <rect x="-4" y="-10" width="8" height="12" fill="#3b2412" />
                    {pineTier(-64, -8, 40, '#134e3a')}{pineTier(-104, -40, 32, '#134e3a')}{pineTier(-136, -76, 22, '#134e3a')}
                </g>
            </defs>

            {/* the sky: stars, northern lights, the moon and the sleigh */}
            <rect width="1600" height="650" fill={f('sky')} />
            {STARS.map((s, k) => <circle key={k} className={k % 12 === 0 ? 'sc-star' : undefined} style={k % 12 === 0 ? after((k * 0.37) % 2.6) : undefined} cx={r1(s.x)} cy={r1(s.y)} r={r1(s.r)} fill="#fff" opacity={r1(s.o)} />)}
            <g className="sc-aurora">
                {[0, 1, 2].map((c) => (
                    <g key={c} className="sc-shimmer" style={after(-c * 1.6)}>
                        {RAYS.filter((r) => r.c === c).map((r, i) => <rect key={i} x={r1(r.x)} y={r1(r.base - r.h)} width="11" height={r1(r.h)} fill={f(`aur${c}`)} opacity={r.o} />)}
                    </g>
                ))}
            </g>
            <circle cx="296" cy="214" r="300" fill={f('moonGlow')} />
            <circle cx="296" cy="214" r="100" fill={f('moon')} />
            <g fill="#9dc4e0" opacity=".34"><circle cx="268" cy="182" r="18" /><circle cx="326" cy="238" r="13" /><circle cx="290" cy="260" r="7" /><circle cx="334" cy="176" r="8" /><circle cx="260" cy="232" r="6" /><circle cx="308" cy="208" r="5" /></g>
            <circle cx="296" cy="214" r="100" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="1.6" />
            <rect width="1600" height="650" fill={f('halo')} />
            {sleigh}
            <g className="sc-shoot"><path d="M1510 114L1400 170L1512 122Z" fill={f('streak')} /><circle cx="1400" cy="170" r="2.6" fill="#fff" /><circle cx="1400" cy="170" r="9" fill="#fff" opacity=".18" /></g>

            {/* the mountains, the hills with the pine forest, the village, the cabin */}
            <path d="M0 520V398L70 350L120 392L200 300L275 380L330 345L420 440L520 472L640 458L760 480L880 464L1000 472L1100 442L1190 392L1260 340L1330 410L1400 360L1480 300L1560 380L1600 352V520Z" fill={f('mtn')} />
            {[[200, 300], [1480, 300], [1260, 340], [70, 350], [330, 345], [1400, 360]].map(([x, y]) => <path key={x} d={`M${x} ${y}L${x - 28} ${y + 36}L${x - 13} ${y + 28}L${x - 5} ${y + 42}L${x + 11} ${y + 30}L${x + 22} ${y + 40}L${x + 31} ${y + 34}Z`} fill="#f4faff" />)}
            <path d="M0 540C120 500 260 520 380 506S620 540 800 530S1080 500 1240 520S1500 500 1600 520V650H0Z" fill={f('hillA')} />
            {PINES.map((pn, k) => use(`pine${pn.v}`, pn.x, hillY(pn.x) + 8, pn.s, `p${k}`))}
            {[[520, 534, 30, 0], [572, 530, 24, -1.1], [640, 538, 34, -2.2], [1010, 520, 28, -0.5], [1070, 514, 34, -1.6], [1130, 520, 24, -2.6]].map(([x, y, w, d], k) => smallHouse(`h${k}`, x, y, w, d))}
            {cabin(1330, 540, 1.1)}
            <path d="M0 570C100 540 220 548 340 556S560 590 700 586L900 586S1100 560 1260 548S1480 540 1600 560V650H0Z" fill={f('hillB')} />
            <ellipse cx="1330" cy="588" rx="190" ry="20" fill={f('glowWarm')} opacity=".28" />

            {/* the gate: two candy canes and an arch, with a wreath, lights and the name */}
            <ellipse cx="800" cy="540" rx="170" ry="90" fill={f('glowWarm')} opacity=".3" />
            <g fill="none" strokeLinecap="round">
                <path d="M700 600V520Q700 442 800 442Q900 442 900 520V600" stroke="#7a1313" strokeWidth="22" />
                <path d="M700 600V520Q700 442 800 442Q900 442 900 520V600" stroke={f('candy')} strokeWidth="18" />
                <path d="M700 600V520Q700 442 800 442Q900 442 900 520V600" stroke="#fff" strokeOpacity=".28" strokeWidth="4" transform="translate(-4 -1)" />
            </g>
            <g>
                <circle cx="800" cy="446" r="25" fill="none" stroke="#0e5a2c" strokeWidth="14" />
                <circle cx="800" cy="446" r="25" fill="none" stroke="#22c55e" strokeWidth="5" strokeDasharray="3 4" />
                {[[780, 430], [820, 430], [826, 458], [774, 460], [800, 424]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3.4" fill="#ef4444" />)}
                {bow(800, 476, 0.62)}
            </g>
            <path d="M714 470Q756 508 800 486Q844 508 886 470" fill="none" stroke="#1c2b22" strokeWidth="1.6" />
            {Array.from({ length: 9 }, (_, i) => { const t = (i + 0.5) / 9; const x = 714 + t * 172; const y = 470 + 4 * 25 * t * (1 - t) + (t < 0.5 ? 0 : 0); return bulb(`gate${i}`, x, y + 6, i, 3.4, 12); })}
            <rect x="754" y="528" width="92" height="28" rx="6" fill="#102a1d" stroke="#fbbf24" strokeWidth="1.8" />
            <path d="M776 528V512M824 528V512" stroke="#c7d2dc" strokeWidth="1.4" />
            <text x="800" y="548" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize="17" letterSpacing="1" fill="#fde68a">SFD-DJ.EU</text>
            {[700, 900].map((x) => <ellipse key={x} cx={x} cy="601" rx="26" ry="8" fill="#f8fcff" />)}
            {use('pineB', 650, 606, 0.78, 'gl')}{use('pineB', 950, 606, 0.78, 'gr')}

            {/* the fence, snow on the posts */}
            <rect x="0" y="556" width="640" height="40" fill={f('fence')} /><rect x="960" y="556" width="640" height="40" fill={f('fence')} />
            <rect x="0" y="566" width="640" height="3.4" fill="#c4d9e8" /><rect x="960" y="566" width="640" height="3.4" fill="#c4d9e8" />
            <rect x="0" y="584" width="640" height="3.4" fill="#c4d9e8" /><rect x="960" y="584" width="640" height="3.4" fill="#c4d9e8" />
            {[560, 1040].map((x) => (
                <g key={x}>
                    <rect x={x - 2.5} y="560" width="5" height="46" fill="#1f2937" /><path d={`M${x - 10} 560h20l-4 -10h-12z`} fill="#111827" />
                    <circle cx={x} cy="540" r="48" fill={f('glowWarm')} opacity=".6" />
                    <rect x={x - 7} y="534" width="14" height="16" rx="2" fill="#fff0b8" stroke="#111827" strokeWidth="2.4" />
                    <ellipse cx={x} cy="531" rx="9" ry="4" fill="#f8fcff" />
                    <ellipse cx={x} cy="607" rx="16" ry="5" fill="#f8fcff" />
                </g>
            ))}

            {/* the frame the video hangs in, in fairy lights */}
            <rect x={tv.x - 34} y={tv.y - 30} width={tv.w + 68} height={tv.h + 76} rx="30" fill="#fbbf24" opacity=".2" filter={`url(#${u('soft')})`} />
            <rect x={tv.x - 18} y={tv.y - 22} width={tv.w + 36} height={tv.h + 36} rx="18" fill="#06130e" stroke="#fbbf24" strokeWidth="3" />
            <rect x={tv.x - 10} y={tv.y - 14} width={tv.w + 20} height={tv.h + 20} rx="12" fill="none" stroke="#fde68a" strokeOpacity=".25" />
            <path d={`M${left + 18} ${bottom}${Array.from({ length: 21 }, (_, i) => `Q${r1(left + 36 + i * 35.6)} ${bottom + 12} ${r1(left + 18 + (i + 1) * 35.6)} ${bottom + (i % 2 ? 0 : 3)}`).join('')}`} fill="none" stroke="#10241a" strokeWidth="1.8" />
            {icicles}
            {frameBulbs}
            {bow(left + 6, bottom - 4, 1)}{bow(right - 6, bottom - 4, -1)}
            {bauble('fb1', tv.x + 80, bottom + 20, 36, 14, '#ef4444', -0.3)}
            {bauble('fb2', tv.x + tv.w - 80, bottom + 20, 36, 14, '#38bdf8', -1.6)}
            {bauble('fb3', tv.x + 170, bottom + 20, 24, 10, '#fbbf24', -2.4)}
            {bauble('fb4', tv.x + tv.w - 170, bottom + 20, 24, 10, '#22c55e', -0.9)}

            {/* the floor */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            <rect y={FLOOR - 26} width="1600" height="84" fill={f('horizon')} />
            {floorTiles.map(({ i, j }) => {
                const v = (i * 5 + j * 11 + 100) % 7;
                const lit = (i * 7 + j * 3 + 100) % 19 === 0;

                return <polygon key={`${i}-${j}`} className={lit ? 'sc-tile' : undefined} style={lit ? after(((i + 20) * 13 + j * 7) % 24 / 10) : undefined} points={tile(i, j)} fill={lit ? '#fde68a' : v % 2 ? '#ffffff' : '#9fd4f2'} opacity={lit ? 0.16 : r1(0.05 + (v / 7) * 0.1)} />;
            })}
            <g stroke="#bfe6ff" strokeOpacity=".22" strokeWidth="1.2">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>
            {SPARKS.filter((s) => s.y < height - 20).map((s, k) => <path key={k} className={k % 2 ? undefined : 'sc-star'} style={k % 2 ? undefined : after((k * 0.43) % 2.6)} d={`M${r1(s.x)} ${r1(s.y - s.s)}L${r1(s.x + s.s * 0.22)} ${r1(s.y - s.s * 0.22)}L${r1(s.x + s.s)} ${r1(s.y)}L${r1(s.x + s.s * 0.22)} ${r1(s.y + s.s * 0.22)}L${r1(s.x)} ${r1(s.y + s.s)}L${r1(s.x - s.s * 0.22)} ${r1(s.y + s.s * 0.22)}L${r1(s.x - s.s)} ${r1(s.y)}L${r1(s.x - s.s * 0.22)} ${r1(s.y - s.s * 0.22)}Z`} fill="#fff" opacity=".85" />)}

            {/* the big tree on the left and a pine on the right stand on the ice */}
            <g transform="translate(160 692) scale(.9)">{tree}</g>
            {use('pineB', 1578, 690, 2.6, 'e1')}
            {[1536, 1600].map((x, i) => <ellipse key={x} cx={x} cy={694 + i * 4} rx={48 - i * 6} ry="9" fill="#f4faff" opacity=".9" />)}

            {/* the snowflake under the booth */}
            <g transform={`translate(0 ${ext})`}>
            <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="400" ry="74" fill={f('pool')} />
            <ellipse cx="800" cy={SCENE.booth.y + 100} rx="340" ry="58" fill="none" stroke="#fbbf24" strokeOpacity=".2" strokeWidth="9" />
            <ellipse cx="800" cy={SCENE.booth.y + 100} rx="340" ry="58" fill="none" stroke="#fde68a" strokeOpacity=".85" strokeWidth="2.4" />
            <g transform={`translate(800 ${SCENE.booth.y + 100}) scale(300 51)`} fill="none" stroke="#e6f6ff" strokeLinecap="round" strokeLinejoin="round">
                <path d={flake} strokeWidth="4.6" vectorEffect="non-scaling-stroke" strokeOpacity=".92" />
                <path d="M0.2 0L0.1 0.17L-0.1 0.17L-0.2 0L-0.1 -0.17L0.1 -0.17Z" strokeWidth="2.4" vectorEffect="non-scaling-stroke" stroke="#fde68a" strokeOpacity=".9" />
            </g>
            <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 4} rx="184" ry="15" fill="#000" opacity=".5" />
            </g>

            {/* snow drifts and the mist over the edge of the floor */}
            {([[150, 616, 340, 40, 0.55], [560, 622, 380, 34, 0.45], [820, 604, 420, 40, 0.38], [1100, 620, 380, 36, 0.45], [1470, 612, 360, 42, 0.55]] as const).map(([x, y, rx, ry, o], k) => <ellipse key={k} className={k % 2 ? 'sc-drift' : undefined} style={k % 2 ? after(-k * 1.5) : undefined} cx={x} cy={y} rx={rx} ry={ry} fill={f('fog')} opacity={o} />)}
            <ellipse cx="0" cy={height - 6} rx="520" ry="70" fill={f('drift')} /><ellipse cx="1600" cy={height - 6} rx="520" ry="70" fill={f('drift')} />
            <ellipse cx="-30" cy="760" rx="150" ry="52" fill={f('drift')} opacity=".8" /><ellipse cx="1630" cy="740" rx="170" ry="56" fill={f('drift')} opacity=".8" />

            {/* the snowman, the gifts, the candy canes */}
            {snowman(1516, 772, 0.8)}
            {gift('r1', 1384, 744, 54, 40, '#dc2626', '#fde68a')}{gift('r2', 1440, 758, 40, 30, '#2563eb', '#e2e8f0')}{gift('r3', 1348, 766, 34, 26, '#16a34a', '#fbbf24')}
            {[[612, 636, -12], [646, 640, 8], [962, 638, -6], [998, 634, 14]].map(([x, y, a]) => (
                <g key={x} transform={`rotate(${a} ${x} ${y})`} fill="none" strokeLinecap="round">
                    <path d={`M${x} ${y}V${y - 34}Q${x} ${y - 50} ${x + 12} ${y - 50}Q${x + 22} ${y - 50} ${x + 22} ${y - 40}`} stroke="#7a1313" strokeWidth="9" />
                    <path d={`M${x} ${y}V${y - 34}Q${x} ${y - 50} ${x + 12} ${y - 50}Q${x + 22} ${y - 50} ${x + 22} ${y - 40}`} stroke={f('candy')} strokeWidth="7" />
                </g>
            ))}

            {/* the corners: garlands of pine with lights and baubles */}
            {garland('gl')}
            <g transform="translate(1600 0) scale(-1 1)">{garland('gr')}</g>

            {FLAKES.filter((s) => s.y < height).map((s, k) => <circle key={k} cx={r1(s.x)} cy={r1(s.y)} r={r1(s.r)} fill="#fff" opacity={r1(s.o)} />)}

            {withBooth && (
                <svg x={SCENE.booth.x} y={SCENE.booth.y + ext} width={SCENE.booth.w} height={SCENE.booth.h} viewBox="0 0 300 150" overflow="visible">
                    <BoothFrontArt u={(n) => `${uid}-b-${n}`} p={p} plate />
                </svg>
            )}

            <rect y="520" width="1600" height={height - 520} fill={f('haze')} />
            <rect width="1600" height={height} fill={f('vig')} />
        </svg>
    );
}
