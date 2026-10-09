import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { floorLineX as lineX, floorRowY as rowY, floorTile as tile, SCENE, ScenePalette } from '@/lib/scenes';
import { after, r1, rand } from '@/Components/scene/util';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const font = 'Figtree, system-ui, sans-serif';

// the stars, the leaves on the floor and the little trees on the far hills: the same every time
const rs = rand(11);
const STARS = Array.from({ length: 130 }, () => ({ x: rs() * 1600, y: rs() ** 1.7 * 480, r: 0.5 + rs() * 1.2, o: 0.3 + rs() * 0.7 }));
const rl = rand(5);
const LEAVES = Array.from({ length: 70 }, () => ({ x: rl() * 1600, y: 646 + rl() ** 0.8 * 640, s: 0.7 + rl() * 0.9, a: rl() * 360, c: Math.floor(rl() * 5) }));
const LEAF_COLORS = ['#c2410c', '#9a3412', '#b45309', '#7c2d12', '#d97706'];
const STONES = ['#4b3a73', '#3a2a5c', '#5a3f7d', '#2d2048', '#44345f'];
const CLOUDS: [number, number, number, number, number][] = [[1180, 300, 330, 28, 1], [1450, 330, 260, 24, 0.75], [300, 150, 330, 30, 0.7], [620, 104, 300, 24, 0.55], [150, 340, 300, 28, 0.75], [1450, 372, 310, 28, 0.8], [1000, 470, 360, 26, 0.5]];
const WING = 'M-3 -1C-9 -9 -21 -11 -34 -5C-30 -3 -28 0 -27 4C-23 1 -20 1 -17 5C-14 2 -11 2 -8 6C-6 3 -4 3 -2 5Z';

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * The Halloween scenery on a 1600 x 900 canvas: a full moon over a haunted house, a graveyard behind an iron gate and a floor of old flagstones with a magic circle.
 * The video hangs in a frame in the sky, so everything that matters (the house, the moon, the gate) stands beside it or below it.
 * Like the club, it only moves while a song plays (`live`): bats, ghosts, flames, lanterns, fog, smoke and spiders.
 */
export default function HalloweenBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down
    const INK = '#07030f'; // the colour of everything that is only a shape against the sky

    // ----- the little pieces -----
    const bat = (x: number, y: number, s: number, k: number, dur = 12) => (
        <g key={`bat${k}`} className="sc-bat" style={{ animationDelay: `${-k * 2.7}s`, animationDuration: `${dur}s` }}>
            <g transform={`translate(${x} ${y}) scale(${s})`} fill={INK}>
                <g className="sc-flap" style={after(-k * 0.11)}>
                    <path d={WING} />
                    <path d={WING} transform="scale(-1 1)" />
                </g>
                <ellipse cx="0" cy="1.5" rx="3.4" ry="6" />
                <circle cx="0" cy="-5.2" r="3.1" />
                <path d="M-3 -7 -2.4 -12.5 -0.6 -7.4ZM3 -7 2.4 -12.5 0.6 -7.4Z" />
                <circle cx="-1.3" cy="-5.6" r=".7" fill="#ffb347" />
                <circle cx="1.3" cy="-5.6" r=".7" fill="#ffb347" />
            </g>
        </g>
    );

    const ghost = (x: number, y: number, s: number, k: number, o = 0.82) => (
        <g key={`ghost${k}`} className="sc-float" style={{ animationDelay: `${-k * 1.3}s`, animationDuration: `${3.2 + k * 0.5}s` }}>
            <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
                <ellipse cx="0" cy="2" rx="40" ry="46" fill={f('ghostGlow')} />
                <path d="M-19 5Q-33 6 -34 17Q-27 13 -19 13ZM19 5Q33 6 34 17Q27 13 19 13Z" fill={f('ghost')} />
                <path d="M-20 26L-20 -3C-20 -21 -11 -29 0 -29C11 -29 20 -21 20 -3L20 26Q15 19 10 26Q5 33 0 26Q-5 19 -10 26Q-15 33 -20 26Z" fill={f('ghost')} />
                <ellipse cx="-7" cy="-8" rx="3.2" ry="4.8" fill="#170a2a" />
                <ellipse cx="7" cy="-8" rx="3.2" ry="4.8" fill="#170a2a" />
                <ellipse cx="0" cy="4" rx="3.4" ry="5" fill="#170a2a" />
            </g>
        </g>
    );

    /** A pumpkin sitting at (x, y) on the ground, `w` wide. A lit face makes it a jack-o'-lantern. */
    const pumpkin = (k: string, x: number, y: number, w: number, face = false, d = 0) => {
        const h = w * 0.78;
        const cy = y - h / 2;
        const px = (a: number) => r1(x + a * w);
        const py = (a: number) => r1(cy + a * h);

        return (
            <g key={k}>
                <ellipse cx={x} cy={cy} rx={w * 0.95} ry={h * 0.85} fill={f('glow')} opacity={face ? 0.6 : 0.28} className={face ? 'sc-flame' : undefined} style={after(d)} />
                <ellipse cx={x} cy={y - 1} rx={w * 0.56} ry={h * 0.1} fill="#000" opacity=".5" />
                <ellipse cx={px(-0.23)} cy={cy} rx={w * 0.3} ry={h * 0.5} fill={f('pumpkin')} />
                <ellipse cx={px(0.23)} cy={cy} rx={w * 0.3} ry={h * 0.5} fill={f('pumpkin')} />
                <ellipse cx={x} cy={cy} rx={w * 0.33} ry={h * 0.52} fill={f('pumpkin')} />
                <g fill="none" stroke="#7c2d12" strokeOpacity=".55" strokeWidth={Math.max(1, w * 0.018)} strokeLinecap="round">
                    <path d={`M${px(-0.1)} ${py(-0.48)}C${px(-0.19)} ${py(-0.2)} ${px(-0.19)} ${py(0.2)} ${px(-0.1)} ${py(0.48)}`} />
                    <path d={`M${px(0.1)} ${py(-0.48)}C${px(0.19)} ${py(-0.2)} ${px(0.19)} ${py(0.2)} ${px(0.1)} ${py(0.48)}`} />
                    <path d={`M${px(-0.32)} ${py(-0.36)}C${px(-0.43)} ${py(-0.15)} ${px(-0.43)} ${py(0.15)} ${px(-0.32)} ${py(0.36)}`} />
                    <path d={`M${px(0.32)} ${py(-0.36)}C${px(0.43)} ${py(-0.15)} ${px(0.43)} ${py(0.15)} ${px(0.32)} ${py(0.36)}`} />
                </g>
                <path d={`M${px(-0.06)} ${py(-0.5)}Q${px(-0.04)} ${py(-0.7)} ${px(0.05)} ${py(-0.8)}L${px(0.12)} ${py(-0.74)}Q${px(0.06)} ${py(-0.62)} ${px(0.07)} ${py(-0.48)}Z`} fill="#3f2b13" />
                <path d={`M${px(0.1)} ${py(-0.74)}Q${px(0.2)} ${py(-0.7)} ${px(0.18)} ${py(-0.58)}`} fill="none" stroke="#4d7c0f" strokeWidth={Math.max(1, w * 0.02)} strokeLinecap="round" />
                {face && (
                    <g className="sc-flame" style={after(d)}>
                        <path d={`M${px(-0.29)} ${py(-0.02)}L${px(-0.11)} ${py(-0.02)}L${px(-0.2)} ${py(-0.26)}ZM${px(0.11)} ${py(-0.02)}L${px(0.29)} ${py(-0.02)}L${px(0.2)} ${py(-0.26)}Z`} fill="#ffe08a" />
                        <path d={`M${px(0)} ${py(0.04)}L${px(-0.045)} ${py(0.14)}L${px(0.045)} ${py(0.14)}Z`} fill="#ffe08a" />
                        <path d={`M${px(-0.32)} ${py(0.2)}Q${px(0)} ${py(0.5)} ${px(0.32)} ${py(0.2)}L${px(0.24)} ${py(0.4)}L${px(0.15)} ${py(0.3)}L${px(0.06)} ${py(0.44)}L${px(-0.06)} ${py(0.44)}L${px(-0.15)} ${py(0.3)}L${px(-0.24)} ${py(0.4)}Z`} fill="#ffd25a" />
                    </g>
                )}
            </g>
        );
    };

    const candle = (k: string, x: number, y: number, h: number, d: number) => (
        <g key={k}>
            <ellipse cx={x + 4.5} cy={y - h - 8} rx="26" ry="26" fill={f('glow')} opacity=".55" className="sc-flame" style={after(d)} />
            <rect x={x} y={y - h} width="9" height={h} rx="2" fill="#f1e5c8" />
            <rect x={x + 1.5} y={y - h} width="2.2" height={h} fill="#fff" opacity=".5" />
            <path d={`M${x + 1} ${y - h}Q${x + 4.5} ${y - h + 4} ${x + 8} ${y - h}`} fill="#e7d3a6" />
            <g className="sc-flame" style={after(d)}>
                <path d={`M${x + 4.5} ${y - h - 15}C${x + 9.5} ${y - h - 8} ${x + 8.5} ${y - h - 2} ${x + 4.5} ${y - h - 1}C${x + 0.5} ${y - h - 2} ${x - 0.5} ${y - h - 8} ${x + 4.5} ${y - h - 15}Z`} fill="#ffa21f" />
                <path d={`M${x + 4.5} ${y - h - 10}C${x + 7} ${y - h - 6} ${x + 6.5} ${y - h - 3} ${x + 4.5} ${y - h - 2.5}C${x + 2.5} ${y - h - 3} ${x + 2} ${y - h - 6} ${x + 4.5} ${y - h - 10}Z`} fill="#fff3b0" />
            </g>
        </g>
    );

    /** A lantern on a chain from (ax, ay); it swings from the top of the chain. */
    const lantern = (k: string, ax: number, ay: number, len: number, d: number) => (
        <g key={k} className="sc-swing" style={{ transformOrigin: `${ax}px ${ay}px`, animationDelay: `${d}s` }}>
            <path d={`M${ax} ${ay}V${ay + len}`} stroke={INK} strokeWidth="2.2" strokeDasharray="3 2" />
            <ellipse cx={ax} cy={ay + len + 20} rx="40" ry="40" fill={f('glow')} opacity=".6" className="sc-flame" style={after(d)} />
            <path d={`M${ax - 9} ${ay + len + 8}L${ax - 5} ${ay + len}H${ax + 5}L${ax + 9} ${ay + len + 8}Z`} fill={INK} />
            <rect x={ax - 10} y={ay + len + 8} width="20" height="26" rx="3" fill={f('win')} stroke={INK} strokeWidth="2.6" />
            <path d={`M${ax} ${ay + len + 8}V${ay + len + 34}M${ax - 10} ${ay + len + 21}H${ax + 10}`} stroke={INK} strokeWidth="1.8" />
            <rect x={ax - 12} y={ay + len + 33} width="24" height="5" rx="2" fill={INK} />
        </g>
    );

    const tomb = (k: string, x: number, yb: number, w: number, h: number, kind: 'round' | 'cross' | 'slant' | 'obelisk', tilt = 0, rip = false) => {
        const a = w * 0.15;
        const d = {
            round: `M${x - w / 2} ${yb}V${yb - h + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w / 2} ${yb - h + w / 2}V${yb}Z`,
            slant: `M${x - w / 2} ${yb}V${yb - h + 6}L${x - w * 0.1} ${yb - h}L${x + w / 2} ${yb - h + 10}V${yb}Z`,
            cross: `M${x - a} ${yb}V${yb - h * 0.62}H${x - w / 2}V${yb - h * 0.84}H${x - a}V${yb - h}H${x + a}V${yb - h * 0.84}H${x + w / 2}V${yb - h * 0.62}H${x + a}V${yb}Z`,
            obelisk: `M${x - w / 2} ${yb}L${x - w * 0.28} ${yb - h * 0.86}L${x} ${yb - h}L${x + w * 0.28} ${yb - h * 0.86}L${x + w / 2} ${yb}Z`,
        }[kind];

        return (
            <g key={k} transform={`rotate(${tilt} ${x} ${yb})`}>
                <path d={d} fill="#1d0f38" stroke="#4a2c80" strokeOpacity=".7" strokeWidth="1.3" strokeLinejoin="round" />
                <path d={d} fill="none" stroke="#7c5bc0" strokeOpacity=".28" strokeWidth="1.1" strokeLinejoin="round" transform="translate(-1.2 -1.2)" />
                {rip && <text x={x} y={yb - h * 0.55} textAnchor="middle" fontFamily={font} fontWeight="900" fontSize={w * 0.26} fill="#07030f" opacity=".55">R.I.P</text>}
                <ellipse cx={x} cy={yb} rx={w * 0.6} ry={3.4} fill="#3f6212" opacity=".5" />
            </g>
        );
    };

    /** A cobweb pinned at (cx, cy) that spreads towards (dx, dy) = (+-1, +-1). `a0` to `a1` is the fan of threads in degrees from the horizontal. */
    const web = (k: string, cx: number, cy: number, dx: number, dy: number, R: number, a0 = 6, a1 = 84, o = 0.34) => {
        const n = 7;
        const ang = (i: number) => ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
        const at = (i: number, r: number) => `${r1(cx + dx * r * Math.cos(ang(i)))} ${r1(cy + dy * r * Math.sin(ang(i)))}`;

        return (
            <g key={k} fill="none" stroke="#efe9ff" strokeOpacity={o} strokeWidth="1.1" strokeLinecap="round">
                {Array.from({ length: n + 1 }, (_, i) => <path key={i} d={`M${cx} ${cy}L${at(i, R)}`} />)}
                {[0.2, 0.38, 0.58, 0.78, 1].map((r) => (
                    <path key={r} d={Array.from({ length: n }, (_, i) => `${i ? '' : `M${at(0, R * r)}`}Q${at(i + 0.5, R * r * 0.86)} ${at(i + 1, R * r)}`).join('')} />
                ))}
            </g>
        );
    };

    /** A spider on a thread from (x, y - thread) down to (x, y). */
    const spider = (k: string, x: number, y: number, s: number, thread: number, d: number) => {
        const legs = [0, 1, 2, 3].flatMap((i) => [-1, 1].map((sd) => `M${x + sd * 3.5 * s} ${y + (i * 2.2 - 1) * s}Q${x + sd * (10 + i) * s} ${y + (i * 4 - 9) * s} ${x + sd * (15 + i * 1.5) * s} ${y + (i * 5.5 - 3) * s}`)).join('');

        return (
            <g key={k} className="sc-drop" style={{ animationDelay: `${d}s`, animationDuration: `${4.6 + d * 0.3}s` }}>
                <path d={`M${x} ${y - thread}V${y}`} stroke="#efe9ff" strokeOpacity=".55" strokeWidth="1.2" />
                <path d={legs} fill="none" stroke={INK} strokeWidth={1.7 * s} strokeLinecap="round" />
                <ellipse cx={x} cy={y + 9 * s} rx={7.2 * s} ry={9 * s} fill={INK} />
                <path d={`M${x - 2.4 * s} ${y + 6 * s}L${x} ${y + 9 * s}L${x - 2.4 * s} ${y + 12 * s}ZM${x + 2.4 * s} ${y + 6 * s}L${x} ${y + 9 * s}L${x + 2.4 * s} ${y + 12 * s}Z`} fill="#ff7a1a" opacity=".85" />
                <circle cx={x} cy={y} r={4.6 * s} fill={INK} />
                <circle cx={x - 1.7 * s} cy={y - 0.8 * s} r={0.9 * s} fill="#ff4d4d" />
                <circle cx={x + 1.7 * s} cy={y - 0.8 * s} r={0.9 * s} fill="#ff4d4d" />
            </g>
        );
    };

    const win = (k: string, x: number, y: number, w: number, h: number, flick = false, d = 0) => (
        <g key={k}>
            <ellipse cx={x + w / 2} cy={y + h / 2} rx={w * 1.7} ry={h * 1.2} fill={f('glow')} opacity=".5" className={flick ? 'sc-flame' : undefined} style={after(d)} />
            <path d={`M${x} ${y + h}V${y + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2}V${y + h}Z`} fill={f('win')} className={flick ? 'sc-flame' : undefined} style={after(d)} />
            <path d={`M${x + w / 2} ${y}V${y + h}M${x} ${y + h * 0.58}H${x + w}`} stroke="#1b0a24" strokeWidth="1.8" />
        </g>
    );

    const tree = (d: string, w: number) => <path d={d} fill="none" stroke={INK} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;

    // the trees on the near edges: a trunk and bare branches
    const bareTree = (
        <g>
            <path d="M2 660C14 590 22 510 20 440C19 390 34 340 58 304L76 308C58 346 48 384 50 436C52 506 50 586 50 660Z" fill={INK} />
            {tree('M24 452C60 436 92 410 122 366', 9)}
            {tree('M122 366C132 350 138 338 150 326', 5)}
            {tree('M96 402C100 380 98 366 104 346', 4)}
            {tree('M50 372C84 346 108 318 116 280', 8)}
            {tree('M116 280C118 262 126 250 140 242', 4.5)}
            {tree('M100 322C114 318 126 308 138 292', 3.5)}
            {tree('M62 308C66 280 56 256 70 226', 7)}
            {tree('M70 226C78 210 90 202 102 202', 3.5)}
            {tree('M20 476C-6 458 -14 436 -24 410', 7)}
            {tree('M38 420C14 400 8 376 -6 360', 5)}
        </g>
    );

    // ----- the pieces of the picture, back to front -----
    const lowHills = Array.from({ length: 16 }, (_, k) => {
        const x = 40 + k * 100 + ((k * 37) % 41);
        const baseY = k % 2 ? 534 : 548;
        const h = 18 + ((k * 13) % 17);

        return (
            <g key={k} stroke="#1c0b36" strokeWidth="2" strokeLinecap="round" fill="none">
                <path d={`M${x} ${baseY}L${x} ${baseY - h}M${x} ${baseY - h * 0.55}L${x - 7} ${baseY - h * 0.9}M${x} ${baseY - h * 0.7}L${x + 8} ${baseY - h * 1.05}`} />
            </g>
        );
    });

    const house = (
        <g transform="translate(290 492) scale(.92) translate(-262 -492)">
            {[0, 1, 2].map((k) => <circle key={k} className="sc-smoke" style={{ animationDelay: `${-k * 2.4}s` }} cx="328" cy="318" r="12" fill={f('smoke')} opacity=".4" />)}
            <g fill="#09040f">
                <rect x="318" y="320" width="20" height="50" />
                <rect x="314" y="316" width="28" height="7" />
                <path d="M150 392L262 296L374 392Z" />
                <rect x="172" y="386" width="180" height="110" />
                <rect x="132" y="298" width="66" height="198" />
                <path d="M124 302C144 280 154 254 160 230C164 214 172 206 186 194C180 212 180 228 184 246C190 270 200 286 208 302Z" />
                <rect x="332" y="346" width="52" height="150" />
                <path d="M322 350L358 284L394 350Z" />
                <path d="M358 284V258" stroke="#09040f" strokeWidth="2.4" />
                <path d="M358 258L376 264L358 270Z" />
                <path d="M165 394H359V402H165Z" />
                <path d="M126 304H206V312H126ZM326 352H390V360H326Z" />
            </g>
            <g fill="none" stroke="#3a1d66" strokeOpacity=".7" strokeWidth="1.4" strokeLinejoin="round">
                <path d="M150 392L262 296L374 392" />
                <path d="M322 350L358 284L394 350" />
            </g>
            {win('w1', 156, 330, 22, 38, true, -0.4)}
            {win('w2', 192, 400, 24, 40)}
            {win('w3', 250, 400, 24, 40, true, -1.1)}
            {win('w4', 308, 400, 24, 40, true, -2)}
            {win('w5', 206, 452, 22, 34)}
            {win('w6', 304, 452, 22, 34, true, -0.7)}
            {win('w7', 349, 384, 18, 30, true, -1.6)}
            <circle cx="262" cy="350" r="12" fill={f('win')} />
            <path d="M250 350H274M262 338V362" stroke="#1b0a24" strokeWidth="1.8" />
            <path d="M247 496V470A15 15 0 0 1 277 470V496Z" fill={f('win')} opacity=".9" />
            <path d="M262 455V496" stroke="#1b0a24" strokeWidth="1.8" />
        </g>
    );

    const crypt = (
        <g>
            <ellipse cx="1300" cy="498" rx="96" ry="64" fill={f('glowG')} opacity=".5" />
            <g fill="#09040f">
                <rect x="1244" y="470" width="112" height="56" />
                <path d="M1234 474L1300 434L1366 474Z" />
                <rect x="1241" y="466" width="118" height="8" />
                <rect x="1297" y="408" width="6" height="30" />
                <rect x="1289" y="416" width="22" height="6" />
            </g>
            <path d="M1234 474L1300 434L1366 474" fill="none" stroke="#3a1d66" strokeOpacity=".7" strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M1283 526V496A17 17 0 0 1 1317 496V526Z" fill={f('doorG')} />
            <path d="M1300 479V526" stroke="#041a0c" strokeWidth="1.8" />
            <rect x="1252" y="480" width="9" height="46" fill="#150a2a" />
            <rect x="1339" y="480" width="9" height="46" fill="#150a2a" />
        </g>
    );

    const gate = (
        <g>
            <ellipse cx="800" cy="540" rx="150" ry="80" fill={f('glowG')} opacity=".34" />
            {/* the bars, the arch and the sign */}
            <g fill="none" stroke="#06020c" strokeWidth="3.4" strokeLinecap="round">
                <path d="M718 592V528Q718 476 800 468Q882 476 882 528V592" />
                <path d="M718 536Q760 516 800 536Q840 516 882 536" strokeWidth="2.6" />
                {[734, 750, 766, 784, 816, 834, 850, 866].map((x) => <path key={x} d={`M${x} 592V${510 + Math.abs(x - 800) * 0.22}`} strokeWidth="2.8" />)}
                <path d="M800 592V540" strokeWidth="2.8" />
            </g>
            <g fill="#06020c">
                {[734, 750, 766, 784, 800, 816, 834, 850, 866].map((x) => <path key={x} d={`M${x} ${502 + Math.abs(x - 800) * 0.22}l-3 8h6z`} />)}
            </g>
            <circle cx="800" cy="466" r="9" fill="none" stroke="#06020c" strokeWidth="3" />
            <rect x="754" y="540" width="92" height="26" rx="5" fill="#0a0414" stroke="#ff7a1a" strokeOpacity=".7" strokeWidth="1.6" />
            <text x="800" y="559" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize="17" letterSpacing="1" fill="#ff9a3c" opacity=".95">SFD.DJ</text>
            {/* the pillars, each with a jack-o'-lantern on top */}
            {[700, 900].map((x) => (
                <g key={x}>
                    <rect x={x - 19} y="494" width="38" height="102" fill="#12082a" stroke="#4a2c80" strokeOpacity=".7" strokeWidth="1.3" />
                    <rect x={x - 25} y="486" width="50" height="12" fill="#1b0d38" stroke="#4a2c80" strokeOpacity=".7" strokeWidth="1.3" />
                    <rect x={x - 22} y="588" width="44" height="10" fill="#1b0d38" />
                    <path d={`M${x - 11} 510H${x + 11}M${x - 11} 530H${x + 11}M${x - 11} 550H${x + 11}`} stroke="#07030f" strokeOpacity=".5" />
                </g>
            ))}
            {pumpkin('gp1', 700, 487, 50, true, -0.5)}
            {pumpkin('gp2', 900, 487, 50, true, -1.4)}
        </g>
    );

    // the iron fence: bars with spear tips between two rails
    const fenceBars = (k: string, x0: number, x1: number) => (
        <g key={k}>
            <rect x={x0} y="552" width={x1 - x0} height="44" fill={f('fence')} />
            <rect x={x0} y="563" width={x1 - x0} height="3.4" fill="#06020c" />
            <rect x={x0} y="584" width={x1 - x0} height="3.4" fill="#06020c" />
        </g>
    );

    // the floor: flagstones in perspective, some lit from underneath
    const floorTiles = Array.from({ length: 12 }, (_, j) => Array.from({ length: 16 }, (_, k) => k - 8).map((i) => ({ i, j }))).flat().filter(({ j }) => rowY(j + 1) < height + 120);
    const ring = (kx: number) => {
        const cx = 800, cy = SCENE.booth.y + 100, rx = 340 * kx, ry = 58 * kx;

        return { cx, cy, rx, ry, at: (a: number, k = 1): [number, number] => [r1(cx + rx * k * Math.cos(a)), r1(cy + ry * k * Math.sin(a))] };
    };
    const outer = ring(1);
    const star = Array.from({ length: 8 }, (_, i) => outer.at((i * Math.PI) / 4 - Math.PI / 2, 0.62));
    const starPath = [0, 3, 6, 1, 4, 7, 2, 5].map((i, n) => `${n ? 'L' : 'M'}${star[i][0]} ${star[i][1]}`).join('') + 'Z';

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('sky')} x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#03010f" /><stop offset=".22" stopColor="#0c0530" /><stop offset=".46" stopColor="#240a45" /><stop offset=".66" stopColor="#4f1658" /><stop offset=".78" stopColor="#9b2c47" /><stop offset=".86" stopColor="#e2561b" /><stop offset="1" stopColor="#f7a02c" />
                </linearGradient>
                <radialGradient id={u('moonGlow')} cx="1290" cy="172" r="340" gradientUnits="userSpaceOnUse"><stop stopColor="#ffd9a0" stopOpacity=".6" /><stop offset=".35" stopColor="#ff9a3c" stopOpacity=".24" /><stop offset="1" stopColor="#ff7a1a" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('moon')} cx=".38" cy=".34" r=".8"><stop stopColor="#fffaf0" /><stop offset=".55" stopColor="#ffe6b3" /><stop offset="1" stopColor="#e9b873" /></radialGradient>
                <radialGradient id={u('halo')} cx="800" cy={tv.y + tv.h / 2} r="640" gradientUnits="userSpaceOnUse"><stop stopColor={p.accent} stopOpacity=".3" /><stop offset=".5" stopColor="#a855f7" stopOpacity=".12" /><stop offset="1" stopColor="#a855f7" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('glow')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffb347" stopOpacity=".85" /><stop offset=".45" stopColor="#ff8a1f" stopOpacity=".35" /><stop offset="1" stopColor="#ff7a1a" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('glowG')} cx=".5" cy=".5" r=".5"><stop stopColor="#86efac" stopOpacity=".8" /><stop offset=".45" stopColor="#22c55e" stopOpacity=".3" /><stop offset="1" stopColor="#16a34a" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('doorG')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#bbf7d0" /><stop offset="1" stopColor="#22c55e" /></linearGradient>
                <radialGradient id={u('fog')} cx=".5" cy=".5" r=".5"><stop stopColor="#d9c8ff" stopOpacity=".5" /><stop offset=".55" stopColor="#a78bfa" stopOpacity=".2" /><stop offset="1" stopColor="#a78bfa" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('cloud')} cx=".5" cy=".5" r=".5"><stop stopColor="#2a0f4d" stopOpacity=".85" /><stop offset=".6" stopColor="#2a0f4d" stopOpacity=".42" /><stop offset="1" stopColor="#2a0f4d" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('cloudLit')} cx=".5" cy=".5" r=".5"><stop stopColor="#ff9a3c" stopOpacity=".34" /><stop offset="1" stopColor="#ff9a3c" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('smoke')} cx=".5" cy=".5" r=".5"><stop stopColor="#8b7aa8" stopOpacity=".8" /><stop offset="1" stopColor="#8b7aa8" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('ghostGlow')} cx=".5" cy=".5" r=".5"><stop stopColor="#c4b5fd" stopOpacity=".5" /><stop offset="1" stopColor="#c4b5fd" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('ghost')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffffff" /><stop offset="1" stopColor="#c7b8f5" /></linearGradient>
                <radialGradient id={u('pumpkin')} cx=".4" cy=".3" r=".85"><stop stopColor="#ffc15e" /><stop offset=".5" stopColor="#ff8a1f" /><stop offset="1" stopColor="#b93d0a" /></radialGradient>
                <linearGradient id={u('win')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffe08a" /><stop offset="1" stopColor="#ff8a1f" /></linearGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <linearGradient id={u('horizon')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ff7a1a" stopOpacity="0" /><stop offset=".5" stopColor="#ff7a1a" stopOpacity=".2" /><stop offset="1" stopColor="#ff7a1a" stopOpacity="0" /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#ff7a1a" stopOpacity=".5" /><stop offset=".6" stopColor="#a855f7" stopOpacity=".16" /><stop offset="1" stopColor="#a855f7" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.glow} stopOpacity="0" /><stop offset="1" stopColor={p.floorBottom} stopOpacity=".7" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".62" /></radialGradient>
                <pattern id={u('fence')} width="16" height="44" patternUnits="userSpaceOnUse" x="0" y="552">
                    <rect x="6.6" y="9" width="2.8" height="35" fill="#06020c" />
                    <path d="M8 0L11.2 10H4.8Z" fill="#06020c" />
                </pattern>
                <filter id={u('soft')} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" /></filter>
            </defs>

            {/* the sky, the stars, the moon and its clouds */}
            <rect width="1600" height="650" fill={f('sky')} />
            {STARS.map((s, k) => <circle key={k} className={k % 6 === 0 ? 'sc-star' : undefined} style={k % 6 === 0 ? after((k * 0.37) % 2.6) : undefined} cx={r1(s.x)} cy={r1(s.y)} r={r1(s.r)} fill="#fff" opacity={r1(s.o)} />)}
            <circle cx="1290" cy="172" r="340" fill={f('moonGlow')} />
            <circle cx="1290" cy="172" r="86" fill={f('moon')} />
            <g fill="#d9a85f" opacity=".45">
                <circle cx="1262" cy="148" r="17" /><circle cx="1318" cy="198" r="12" /><circle cx="1284" cy="214" r="8" /><circle cx="1330" cy="140" r="9" /><circle cx="1248" cy="190" r="7" /><circle cx="1304" cy="120" r="6" />
            </g>
            <circle cx="1290" cy="172" r="86" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1.6" />
            {CLOUDS.map(([x, y, rx, ry, o], k) => (
                <g key={k} opacity={o}>
                    <ellipse cx={x} cy={y + 6} rx={rx * 0.9} ry={ry * 1.1} fill={f('cloudLit')} />
                    <ellipse cx={x - rx * 0.3} cy={y} rx={rx * 0.6} ry={ry} fill={f('cloud')} />
                    <ellipse cx={x + rx * 0.25} cy={y - 4} rx={rx * 0.7} ry={ry * 1.1} fill={f('cloud')} />
                    <ellipse cx={x} cy={y + 4} rx={rx} ry={ry * 0.8} fill={f('cloud')} />
                </g>
            ))}
            <rect width="1600" height="650" fill={f('halo')} />
            {bat(1228, 120, 1.15, 0, 12)}
            {bat(1352, 92, 0.85, 1, 14)}
            {bat(1336, 252, 0.95, 2, 10)}
            {bat(330, 120, 1.05, 3, 13)}
            {bat(170, 214, 0.8, 4, 11)}
            {bat(1480, 430, 1.25, 5, 15)}
            {bat(640, 474, 0.75, 6, 12)}
            {bat(1010, 490, 0.85, 7, 14)}
            {ghost(1478, 330, 1.2, 0)}
            {ghost(520, 500, 0.8, 1, 0.7)}
            {ghost(1090, 520, 0.9, 2, 0.75)}

            {/* the hills, the little trees, the house and the crypt */}
            <path d="M0 530C80 505 170 520 260 508S430 486 520 506S700 530 800 516S980 492 1080 508S1260 530 1350 510S1520 498 1600 514V650H0Z" fill="#4a1a5c" />
            <path d="M0 548C70 526 140 514 220 512S360 520 430 540S560 566 680 570L920 570S1040 566 1170 548S1320 520 1420 524S1550 540 1600 548V650H0Z" fill="#240d3f" />
            {lowHills}
            {house}
            {crypt}
            <path d="M0 566C40 528 100 494 190 488S330 486 400 520S470 566 560 580L1040 580C1130 566 1190 534 1270 510S1400 484 1480 498S1570 540 1600 556V650H0Z" fill="#12072a" />
            <path d="M232 492C226 520 270 540 244 580" fill="none" stroke="#3a2a5a" strokeWidth="9" strokeLinecap="round" opacity=".55" />

            {/* the graveyard: the gate, the fence and the stones */}
            {gate}
            {fenceBars('fl', 0, 678)}
            {fenceBars('fr', 922, 1600)}
            {tomb('t1', 86, 590, 40, 58, 'round', -4, true)}
            {tomb('t2', 158, 584, 34, 54, 'cross', 3)}
            {tomb('t3', 236, 592, 46, 64, 'round', 2, true)}
            {tomb('t4', 322, 582, 32, 46, 'slant', -6)}
            {tomb('t5', 408, 590, 38, 56, 'obelisk', 2)}
            {tomb('t6', 506, 584, 40, 52, 'round', -3)}
            {tomb('t7', 1104, 584, 36, 50, 'cross', -3)}
            {tomb('t8', 1190, 592, 44, 62, 'round', 3, true)}
            {tomb('t9', 1394, 584, 34, 48, 'slant', 5)}
            {tomb('t10', 1470, 592, 42, 60, 'round', -2, true)}
            {tomb('t11', 1548, 586, 34, 56, 'cross', 4)}

            {/* the trees at the edges, with lanterns on the branches */}
            {bareTree}
            <g transform="translate(1600 0) scale(-1 1)">{bareTree}</g>
            {lantern('l1', 112, 372, 38, 0)}
            {lantern('l2', 1488, 372, 38, -1.4)}
            {lantern('l3', 150, 330, 26, -2.2)}
            {bat(26, 360, 0.9, 8, 13)}
            {bat(1574, 372, 0.9, 9, 12)}

            {/* the frame the video hangs in */}
            <rect x={tv.x - 34} y={tv.y - 30} width={tv.w + 68} height={tv.h + 76} rx="30" fill={p.accent} opacity=".3" filter={`url(#${u('soft')})`} />
            <rect x={tv.x - 18} y={tv.y - 22} width={tv.w + 36} height={tv.h + 36} rx="18" fill="#0a0410" stroke={p.accent} strokeWidth="3" />
            <rect x={tv.x - 10} y={tv.y - 14} width={tv.w + 20} height={tv.h + 20} rx="12" fill="none" stroke="#ffd29a" strokeOpacity=".22" />
            <rect x={tv.x + 40} y={tv.y + tv.h + 8} width={tv.w - 80} height="3" rx="1.5" fill={p.accent} opacity=".7" />
            {[[tv.x - 12, tv.y + tv.h + 8], [tv.x + tv.w + 12, tv.y + tv.h + 8]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="4" fill="#ff9a3c" />)}
            {lantern('f1', tv.x + 36, tv.y + tv.h + 14, 34, -0.6)}
            {lantern('f2', tv.x + tv.w - 36, tv.y + tv.h + 14, 34, -2.6)}
            {web('wf1', tv.x - 18, tv.y + tv.h + 14, -1, 1, 84, 8, 82, 0.4)}
            {web('wf2', tv.x + tv.w + 18, tv.y + tv.h + 14, 1, 1, 84, 8, 82, 0.4)}
            {spider('s1', 392, 196, 1.15, 220, 0)}
            {spider('s2', 1214, 150, 1, 170, -1.6)}

            {/* the floor */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            <rect y={FLOOR - 26} width="1600" height="84" fill={f('horizon')} />
            {floorTiles.map(({ i, j }) => {
                const lit = (i * 5 + j * 11 + 100) % 13 === 0;

                return <polygon key={`${i}-${j}`} className={lit ? 'sc-tile' : undefined} style={lit ? after(((i + 20) * 13 + j * 7) % 24 / 10) : undefined} points={tile(i, j)} fill={lit ? '#ff7a1a' : STONES[(i * 7 + j * 3 + 100) % STONES.length]} opacity={lit ? 0.18 : r1(0.2 + (((i * 5 + j * 11 + 100) % 7) / 7) * 0.22)} />;
            })}
            <g stroke="#9a6bdc" strokeOpacity=".2" strokeWidth="1.2">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>
            {LEAVES.filter((l) => l.y < height - 14).map((l, k) => <ellipse key={k} cx={r1(l.x)} cy={r1(l.y)} rx={r1(6 * l.s)} ry={r1(3 * l.s)} transform={`rotate(${r1(l.a)} ${r1(l.x)} ${r1(l.y)})`} fill={LEAF_COLORS[l.c]} opacity=".7" />)}

            {/* the magic circle under the booth */}
            <g transform={`translate(0 ${ext})`}>
            <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="400" ry="74" fill={f('pool')} />
            <ellipse cx="800" cy={SCENE.booth.y + 100} rx="340" ry="58" fill="none" stroke="#ff7a1a" strokeOpacity=".2" strokeWidth="9" />
            <ellipse cx="800" cy={SCENE.booth.y + 100} rx="340" ry="58" fill="none" stroke="#ff9a3c" strokeOpacity=".85" strokeWidth="2.4" />
            <ellipse cx="800" cy={SCENE.booth.y + 100} rx="298" ry="50.6" fill="none" stroke="#a855f7" strokeOpacity=".6" strokeWidth="1.6" strokeDasharray="3 7" />
            <ellipse cx="800" cy={SCENE.booth.y + 100} rx="102" ry="17.4" fill="none" stroke="#ff9a3c" strokeOpacity=".5" strokeWidth="1.6" />
            <path d={starPath} fill="none" stroke="#c084fc" strokeOpacity=".6" strokeWidth="1.6" strokeLinejoin="round" />
            {Array.from({ length: 24 }, (_, k) => {
                const a = (k * Math.PI) / 12;
                const [x1, y1] = outer.at(a, 0.84);
                const [x2, y2] = outer.at(a, k % 3 ? 0.93 : 0.96);
                const [cx, cy] = outer.at(a, 0.89);

                return (
                    <g key={k} stroke="#ff9a3c" strokeOpacity=".7" strokeWidth="1.6" strokeLinecap="round">
                        <path d={`M${x1} ${y1}L${x2} ${y2}`} />
                        {k % 3 === 0 && <circle cx={cx} cy={cy} r="2.2" fill="#ffc15e" stroke="none" />}
                    </g>
                );
            })}
            <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 4} rx="184" ry="15" fill="#000" opacity=".55" />
            </g>

            {/* ground fog over the edge of the floor */}
            {([[150, 616, 340, 40, 0.6], [560, 622, 380, 34, 0.5], [820, 604, 420, 40, 0.42], [1100, 620, 380, 36, 0.5], [1470, 612, 360, 42, 0.6]] as const).map(([x, y, rx, ry, o], k) => (
                <ellipse key={k} className={k % 2 ? 'sc-drift' : undefined} style={k % 2 ? after(-k * 1.5) : undefined} cx={x} cy={y} rx={rx} ry={ry} fill={f('fog')} opacity={o} />
            ))}

            {/* pumpkins, candles and wisps at the edges of the floor */}
            {pumpkin('p1', 64, 690, 96, true, 0)}
            {pumpkin('p2', 138, 702, 56, false)}
            {pumpkin('p3', 1540, 688, 92, true, -0.9)}
            {pumpkin('p4', 1466, 704, 54, true, -1.7)}
            {pumpkin('p5', 624, 632, 44, true, -0.4)}
            {pumpkin('p6', 982, 632, 44, true, -1.2)}
            {candle('c1', 34, 726, 28, 0)}
            {candle('c2', 100, 724, 18, -0.9)}
            {candle('c3', 1500, 724, 24, -0.5)}
            {candle('c4', 1566, 722, 32, -1.3)}
            {candle('c5', 654, 640, 16, -0.2)}
            {candle('c6', 940, 640, 20, -1.1)}
            {[[300, 640], [470, 660], [690, 650], [900, 656], [1130, 646], [1300, 664], [200, 690], [1400, 684], [800, 612], [610, 700], [1000, 704], [360, 600]].map(([x, y], k) => (
                <g key={k} className="sc-wisp" style={after(-k * 0.7)}>
                    <circle cx={x} cy={y} r="11" fill={f('glowG')} opacity=".55" />
                    <circle cx={x} cy={y} r="2.1" fill="#d9f99d" />
                </g>
            ))}

            {web('w1', 0, 0, 1, 1, 230, 4, 86, 0.4)}
            {web('w2', 1600, 0, -1, 1, 230, 4, 86, 0.4)}

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
