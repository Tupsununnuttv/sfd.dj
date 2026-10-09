import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { pineTier } from '@/Components/scene/shapes';
import { after, floorGrid, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, floorTile as tile, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const font = 'Figtree, system-ui, sans-serif';
const LEAF = ['#b8431a', '#e2631a', '#f59e0b', '#fbbf24', '#c2410c', '#9a3412'];
const GREEN = '#9dff4a';

// the stars, the two canopies, the fallen leaves, the grass, the fireflies: the same every time
const rs = rand(83);
const STARS = Array.from({ length: 44 }, (_, k) => ({ k, x: rs() * 1600, y: rs() * 300, r: r1(0.7 + rs() * 1.4) }));
const canopy = (cx: number, cy: number, rx: number, ry: number, n: number) => Array.from({ length: n }, (_, k) => ({ k, x: r1(cx + (rs() - 0.5) * 2 * rx), y: r1(cy + (rs() - 0.5) * 2 * ry), r: r1(34 + rs() * 40), c: LEAF[Math.floor(rs() * LEAF.length)] })).sort((a, b) => a.y - b.y);
const LEFT = canopy(160, 230, 150, 130, 30);
const RIGHT = canopy(1440, 190, 150, 100, 28);
const FALLEN = Array.from({ length: 34 }, (_, k) => ({ k, x: r1(rs() * 1600), y: r1(656 + rs() * 220), s: r1(0.6 + rs() * 0.9), r: r1(rs() * 360), c: LEAF[Math.floor(rs() * LEAF.length)] }));
const GRASS = Array.from({ length: 70 }, (_, k) => ({ k, x: r1(rs() * 1600), h: r1(10 + rs() * 16), lean: r1((rs() - 0.5) * 10) }));
const FIREFLIES = Array.from({ length: 22 }, (_, k) => ({ k, x: r1(100 + rs() * 1400), y: r1(220 + rs() * 400), r: r1(1.6 + rs() * 1.8), d: -rs() * 4, g: k % 3 !== 0 })).filter((d) => !(d.x > tv.x - 40 && d.x < tv.x + tv.w + 40 && d.y < tv.y + tv.h + 40));
const RIDGE = (seed: number, base: number, amp: number, step: number) => {
    const rr = rand(seed);
    let d = `M-20 700L-20 ${base}`;

    for (let x = -20; x <= 1620; x += step) d += `Q${x + step / 2} ${r1(base - rr() * amp)} ${x + step} ${r1(base - rr() * amp * 0.4)}`;

    return `${d}L1620 700Z`;
};

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * The Foxy scenery on a 1600 x 900 canvas: an autumn forest at dusk, in the colours of the Foxy character (orange, black and a bright green). A low harvest moon over rolling hills,
 * two maples in full colour, a big fox that sits and watches with a cub across from it, string lights, a sign over a den in a mossy mound, glowing mushrooms, pumpkins and fireflies,
 * and a floor of fallen leaves with a wreath of leaves and paw prints under the booth. Leaves fall over the room (Snow.tsx). Like the others it only moves while a song plays (`live`).
 */
export default function FoxyBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down
    const ring = SCENE.booth.y + 100;

    /** A fox sitting and looking to the left (flip = -1 to look to the right), its seat on (x, y), `s` times its size (about 310 tall). */
    const fox = (k: string, x: number, y: number, s: number, flip: number, delay: number) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s * flip} ${s})`}>
            <ellipse cx="30" cy="4" rx="130" ry="14" fill="#000" opacity=".35" />
            <g className="sc-palm" style={after(delay)}>
                <path d="M96 -34C196 -22 262 -120 212 -236C192 -176 160 -128 96 -96Z" fill={f('fur')} />
                <path d="M212 -236C232 -204 224 -168 204 -146C178 -164 190 -204 212 -236Z" fill="#fff7ed" />
                <path d="M110 -50C176 -50 224 -110 204 -176" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="5" strokeLinecap="round" />
            </g>
            <path d="M-44 -4C-76 -100 -44 -208 14 -218C74 -222 120 -152 104 -58C100 -26 80 -6 40 -4Z" fill={f('fur')} />
            <ellipse cx="44" cy="-62" rx="58" ry="62" fill="#ea580c" opacity=".55" />
            <ellipse cx="-34" cy="-118" rx="26" ry="64" transform="rotate(-8 -34 -118)" fill="#fff7ed" />
            <path d="M-50 -2C-52 -50 -46 -80 -40 -108L-22 -104C-22 -70 -20 -30 -12 -2Z" fill="#1c1917" /><path d="M-52 -2H-6Q-4 8 -28 8Q-52 8 -52 -2Z" fill="#1c1917" />
            <ellipse cx="86" cy="-6" rx="32" ry="12" fill="#1c1917" />
            <path d="M-72 -226C-42 -268 22 -274 54 -240C44 -204 2 -182 -22 -180C-54 -184 -86 -200 -72 -226Z" fill={f('fur')} />
            <path d="M-72 -226L-120 -212Q-128 -205 -118 -199L-62 -204Z" fill={f('fur')} /><path d="M-62 -204L-118 -199Q-112 -190 -92 -188L-48 -190Z" fill="#fff7ed" />
            <circle cx="-122" cy="-207" r="6.4" fill="#0c0a09" /><circle cx="-124" cy="-209.4" r="2" fill="#fff" opacity=".8" />
            <path d="M-64 -204L-34 -176L-14 -198L10 -176L30 -204L22 -214Z" fill="#fff7ed" />
            <path d="M-34 -258L-44 -318L4 -272Z" fill={f('fur')} /><path d="M-30 -266L-38 -302L-8 -274Z" fill="#1c1917" />
            <path d="M12 -266L34 -320L52 -258Z" fill={f('fur')} /><path d="M18 -268L34 -304L44 -264Z" fill="#1c1917" />
            <path d="M-84 -238Q-70 -250 -54 -240Q-66 -226 -84 -238Z" fill="#fff" /><ellipse cx="-68" cy="-238" rx="9" ry="7.6" fill={GREEN} /><ellipse cx="-68" cy="-238" rx="2.8" ry="6.4" fill="#0c0a09" /><circle cx="-71" cy="-241" r="2" fill="#fff" />
            <ellipse className="sc-flame" style={after(delay - 0.5)} cx="-68" cy="-238" rx="16" ry="14" fill={GREEN} opacity=".3" />
            <path d="M-112 -204L-150 -214M-112 -200L-152 -198M-110 -196L-146 -184" stroke="#fff" strokeWidth="1.4" opacity=".75" strokeLinecap="round" />
        </g>
    );

    /** A maple: a trunk with its roots and branches, and a canopy of leaves in three tones that catches the light on its upper left. */
    const maple = (k: string, x: number, list: typeof LEFT, flip: number) => (
        <g key={k}>
            <g transform={`translate(${x} 0) scale(${flip} 1)`}>
                <path d="M-34 640C-30 580 -44 520 -26 450C-20 400 -30 360 -18 300H18C30 360 20 400 28 450C46 520 36 580 44 640Z" fill={f('bark')} />
                <path d="M-30 640C-60 650 -74 640 -86 632M34 640C70 650 84 642 96 632" stroke="#2a150c" strokeWidth="14" strokeLinecap="round" fill="none" />
                <path d="M-8 620C-12 540 -4 460 -10 380" stroke="#7a4a2a" strokeOpacity=".5" strokeWidth="7" strokeLinecap="round" fill="none" />
                <path d="M-14 340C-60 300 -90 270 -110 220M16 330C60 290 96 262 120 214" stroke="#3a1f12" strokeWidth="14" strokeLinecap="round" fill="none" />
            </g>
            {list.map((c) => (
                <g key={c.k}>
                    <circle cx={c.x} cy={c.y} r={c.r} fill={c.c} stroke="#5a1a06" strokeOpacity=".35" strokeWidth="2.4" />
                    <path d={`M${r1(c.x - c.r * 0.7)} ${r1(c.y + c.r * 0.1)}A${r1(c.r * 0.72)} ${r1(c.r * 0.72)} 0 0 1 ${r1(c.x - c.r * 0.05)} ${r1(c.y - c.r * 0.72)}`} fill="none" stroke="#fff3c4" strokeOpacity=".4" strokeWidth="3.4" strokeLinecap="round" />
                </g>
            ))}
        </g>
    );

    /** A mushroom with a cap that glows green. */
    const shroom = (k: string, x: number, y: number, s: number, delay: number) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
            <circle className="sc-twinkle" style={after(delay)} cy="-18" r="34" fill={f('green')} />
            <path d="M-5 0C-6 -10 -4 -16 -3 -22H5C5 -16 7 -10 6 0Z" fill="#e9e0c8" />
            <path d="M-24 -20C-24 -44 24 -44 24 -20Q0 -14 -24 -20Z" fill={f('cap')} />
            <path d="M-24 -20Q0 -14 24 -20" stroke="#14532d" strokeWidth="2" fill="none" />
            <circle cx="-9" cy="-30" r="3.2" fill="#fff" opacity=".85" /><circle cx="7" cy="-33" r="2.4" fill="#fff" opacity=".85" /><circle cx="14" cy="-25" r="2" fill="#fff" opacity=".8" />
        </g>
    );

    const pumpkin = (k: string, x: number, y: number, s: number) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse cy="2" rx="34" ry="6" fill="#000" opacity=".3" />
            <ellipse cx="-14" cy="-18" rx="18" ry="20" fill="#ea580c" /><ellipse cx="14" cy="-18" rx="18" ry="20" fill="#ea580c" /><ellipse cx="0" cy="-18" rx="19" ry="21" fill="#fb923c" />
            <path d="M0 -38V-2M-10 -36Q-16 -18 -10 -2M10 -36Q16 -18 10 -2" stroke="#9a3412" strokeWidth="1.8" fill="none" />
            <path d="M-2 -38Q0 -46 6 -48" stroke="#3f6212" strokeWidth="4" fill="none" strokeLinecap="round" />
            <ellipse cx="-6" cy="-26" rx="6" ry="9" fill="#fff" opacity=".18" />
        </g>
    );

    /** A string of lights between two points, sagging, with warm bulbs that twinkle. */
    const garland = (k: string, x0: number, y0: number, x1: number, y1: number, sag: number, bulbs: number) => (
        <g key={k}>
            <path d={`M${x0} ${y0}Q${(x0 + x1) / 2} ${(y0 + y1) / 2 + sag} ${x1} ${y1}`} fill="none" stroke="#1c1310" strokeWidth="2.4" />
            {Array.from({ length: bulbs }, (_, i) => {
                const t = (i + 0.5) / bulbs;
                const bx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * ((x0 + x1) / 2) + t * t * x1;
                const by = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * ((y0 + y1) / 2 + sag) + t * t * y1;

                return <g key={i}><circle className="sc-twinkle" style={after(-i * 0.37)} cx={r1(bx)} cy={r1(by + 6)} r="9" fill="#ffd27a" opacity=".4" /><circle cx={r1(bx)} cy={r1(by + 6)} r="3.4" fill="#fff0b0" /></g>;
            })}
        </g>
    );

    /** A paw print: a pad and four toes, with its middle at (0, 0). */
    const paw = (k: string, x: number, y: number, r: number, c: string, o: number) => (
        <g key={k} transform={`translate(${r1(x)} ${r1(y)}) rotate(${r}) scale(.9)`} fill={c} opacity={o}>
            <ellipse cy="5" rx="9" ry="7.4" /><ellipse cx="-11" cy="-4" rx="3.6" ry="4.6" /><ellipse cx="-4" cy="-10" rx="3.6" ry="4.6" /><ellipse cx="4" cy="-10" rx="3.6" ry="4.6" /><ellipse cx="11" cy="-4" rx="3.6" ry="4.6" />
        </g>
    );

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('sky')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#12082e" /><stop offset=".38" stopColor="#3a1260" /><stop offset=".7" stopColor="#c0481c" /><stop offset="1" stopColor="#ffb347" /></linearGradient>
                <radialGradient id={u('sun')} cx=".4" cy=".35" r=".8"><stop stopColor="#fff3b8" /><stop offset=".5" stopColor="#ffb347" /><stop offset="1" stopColor="#f0661a" /></radialGradient>
                <radialGradient id={u('sunglow')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffb347" stopOpacity=".5" /><stop offset="1" stopColor="#ffb347" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('h1')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#7a2f6a" /><stop offset="1" stopColor="#4a1d5a" /></linearGradient>
                <linearGradient id={u('h2')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#3a1a58" /><stop offset="1" stopColor="#1e1238" /></linearGradient>
                <linearGradient id={u('h3')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#1f1d3c" /><stop offset="1" stopColor="#0c0a1c" /></linearGradient>
                <linearGradient id={u('fur')} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffa24a" /><stop offset=".55" stopColor="#f97316" /><stop offset="1" stopColor="#c2410c" /></linearGradient>
                <linearGradient id={u('bark')} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#2a150c" /><stop offset=".35" stopColor="#6a3b20" /><stop offset="1" stopColor="#2a150c" /></linearGradient>
                <linearGradient id={u('wood')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8a5a2b" /><stop offset="1" stopColor="#4a2a12" /></linearGradient>
                <linearGradient id={u('moss')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#3f7a3a" /><stop offset="1" stopColor="#1f4a2a" /></linearGradient>
                <radialGradient id={u('shadow')} cx=".5" cy=".5" r=".5"><stop stopColor="#1a0a2a" stopOpacity=".5" /><stop offset=".6" stopColor="#1a0a2a" stopOpacity=".25" /><stop offset="1" stopColor="#1a0a2a" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('cap')} cx=".4" cy=".3" r=".9"><stop stopColor="#d9ff9a" /><stop offset=".6" stopColor="#7ee02a" /><stop offset="1" stopColor="#2f8a1a" /></radialGradient>
                <radialGradient id={u('green')} cx=".5" cy=".5" r=".5"><stop stopColor={GREEN} stopOpacity=".5" /><stop offset=".5" stopColor="#4ade80" stopOpacity=".16" /><stop offset="1" stopColor="#4ade80" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('lamp')} cx=".5" cy=".5" r=".5"><stop stopColor="#fff0b0" stopOpacity=".7" /><stop offset=".45" stopColor="#ffc060" stopOpacity=".24" /><stop offset="1" stopColor="#ff9a1f" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('den')} cx=".5" cy=".7" r=".6"><stop stopColor="#ffd27a" /><stop offset=".5" stopColor="#f97316" /><stop offset="1" stopColor="#4a1a08" /></radialGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#2a4a30" /><stop offset=".5" stopColor="#1e3626" /><stop offset="1" stopColor="#0a1610" /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffd27a" stopOpacity=".5" /><stop offset=".6" stopColor="#f97316" stopOpacity=".18" /><stop offset="1" stopColor="#f97316" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffb070" stopOpacity="0" /><stop offset="1" stopColor="#0a0a14" stopOpacity=".6" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".58" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#0a0612" stopOpacity=".62" /></radialGradient>
            </defs>

            {/* the evening: a sky that runs from purple to orange, stars, a big low moon, a few streaks of cloud, hills */}
            <rect width="1600" height="660" fill={f('sky')} />
            {STARS.map((s) => <circle key={s.k} className={s.k % 4 === 0 ? 'sc-twinkle' : undefined} style={s.k % 4 === 0 ? after(-s.k * 0.23) : undefined} cx={r1(s.x)} cy={r1(s.y)} r={s.r} fill="#fff" opacity=".75" />)}
            <circle cx="300" cy="360" r="280" fill={f('sunglow')} />
            <circle cx="300" cy="360" r="124" fill={f('sun')} />
            {[[262, 330, 18], [338, 392, 12], [296, 410, 9], [350, 330, 8]].map(([x, y, r]) => <circle key={`${x}${y}`} cx={x} cy={y} r={r} fill="#e8741c" opacity=".3" />)}
            <ellipse className="sc-drift" cx="500" cy="300" rx="220" ry="10" fill="#ff9a5a" opacity=".35" /><ellipse className="sc-drift" style={after(-5)} cx="1180" cy="240" rx="260" ry="12" fill="#ff7a8a" opacity=".3" /><ellipse className="sc-drift" style={after(-2)} cx="900" cy="420" rx="200" ry="9" fill="#ffb070" opacity=".35" />
            <path d={RIDGE(3, 470, 70, 120)} fill={f('h1')} /><path d={RIDGE(8, 520, 60, 150)} fill={f('h2')} /><path d={RIDGE(14, 570, 40, 190)} fill={f('h3')} />
            {[[430, 572, 1], [520, 578, 0.8], [660, 574, 0.9], [940, 572, 0.95], [1060, 578, 0.8], [1180, 574, 1.05]].map(([x, y, s], k) => <g key={k} transform={`translate(${x} ${y}) scale(${s})`}><path d="M-3 0V-8H3V0Z" fill="#0c0a1c" />{pineTier(-92, -52, 18, '#120e26', '#120e26')}{pineTier(-76, -26, 26, '#120e26', '#120e26')}{pineTier(-58, -2, 34, '#120e26', '#120e26')}</g>)}

            {/* the maples on both sides, string lights from them to the frame of the video */}
            {maple('mL', 170, LEFT, 1)}{maple('mR', 1430, RIGHT, -1)}
            {garland('gl1', 150, 380, 478, 20, 90, 8)}{garland('gl2', 1450, 380, 1122, 20, 90, 8)}{garland('gl3', 478, 360, 150, 430, 70, 7)}{garland('gl4', 1122, 360, 1450, 430, 70, 7)}

            {/* the video: a frame of dark wood hung with a garland of leaves, and a sign that lights green */}
            <rect x={tv.x - 34} y="-30" width={tv.w + 68} height={tv.y + tv.h + 64} rx="8" fill={f('wood')} stroke="#1c0f08" strokeWidth="3" />
            {[[tv.x - 34, 24], [tv.x + tv.w + 8, 24]].flatMap(([x, w]) => [40, 100, 160, 220, 280].map((y) => <path key={`${x}${y}`} d={`M${x + 4} ${y}H${Number(x) + Number(w) + 2}`} stroke="#2a150c" strokeOpacity=".5" strokeWidth="1.6" />))}
            <rect x={tv.x - 9} y={tv.y - 9} width={tv.w + 18} height={tv.h + 18} rx="4" fill="#070410" />
            <rect x={tv.x - 12} y={tv.y - 12} width={tv.w + 24} height={tv.h + 24} rx="6" fill="none" stroke={GREEN} strokeOpacity=".18" strokeWidth="9" />
            <rect x={tv.x - 9} y={tv.y - 9} width={tv.w + 18} height={tv.h + 18} rx="4" fill="none" stroke={GREEN} strokeWidth="2.2" />
            {Array.from({ length: 26 }, (_, i) => i).map((i) => <ellipse key={i} cx={r1(tv.x - 22 + (i * (tv.w + 44)) / 25)} cy={tv.y + tv.h + 22 + ((i * 7) % 5) - 2} rx="9" ry="5.4" transform={`rotate(${(i * 37) % 60 - 30} ${r1(tv.x - 22 + (i * (tv.w + 44)) / 25)} ${tv.y + tv.h + 22})`} fill={LEAF[i % 6]} />)}
            {[[tv.x - 22, 40], [tv.x + tv.w + 22, 70], [tv.x - 22, 130], [tv.x + tv.w + 22, 190], [tv.x - 22, 240], [tv.x + tv.w + 22, 290]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="8" ry="5" transform={`rotate(${i * 50} ${x} ${y})`} fill={LEAF[(i + 2) % 6]} />)}
            <path d="M690 368V384M910 368V384" stroke="#4a2a12" strokeWidth="3" />
            <rect x="636" y="382" width="328" height="52" rx="6" fill={f('wood')} stroke="#1c0f08" strokeWidth="3" />
            <path d="M636 398H964M636 418H964" stroke="#2a150c" strokeOpacity=".45" strokeWidth="1.6" />
            <g transform="translate(690 408)">
                <path d="M-22 6L-24 -16L-10 -6L0 -8L10 -6L24 -16L22 6Q0 22 -22 6Z" fill={f('fur')} stroke="#1c0f08" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M-14 6Q0 -2 14 6Q0 18 -14 6Z" fill="#fff7ed" /><circle cy="9" r="2.6" fill="#0c0a09" /><circle cx="-9" cy="-1" r="2" fill={GREEN} /><circle cx="9" cy="-1" r="2" fill={GREEN} />
            </g>
            <g fontFamily={font} fontWeight="900" textAnchor="middle" letterSpacing="9"><text x="830" y="420" fontSize="36" fill="none" stroke={GREEN} strokeOpacity=".4" strokeWidth="8">FOXY</text><text x="830" y="420" fontSize="36" fill="#eaffd0" stroke={GREEN} strokeWidth="1.4" paintOrder="stroke">FOXY</text></g>

            {/* the den in a mossy mound under the sign */}
            <path d="M560 628C570 520 660 470 800 470C940 470 1030 520 1040 628Z" fill={f('moss')} />
            <path d="M600 628C612 540 690 500 800 500" fill="none" stroke="#7ac36a" strokeOpacity=".4" strokeWidth="5" strokeLinecap="round" />
            {[[610, 560], [980, 570], [700, 506], [900, 504], [760, 480]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="12" ry="8" fill="#9ad47a" opacity=".35" />)}
            <path d="M720 628V572A80 80 0 0 1 880 572V628Z" fill="#1a0d06" stroke="#3a2012" strokeWidth="6" />
            <path d="M728 628V574A72 72 0 0 1 872 574V628Z" fill={f('den')} />
            {[760, 800, 840].map((x) => <path key={x} d={`M${x} 520V628`} stroke="#3a1a08" strokeOpacity=".5" strokeWidth="2.4" />)}
            <ellipse className="sc-flame" cx="800" cy="600" rx="120" ry="60" fill={f('lamp')} />
            {[[744, 606], [858, 612], [800, 580]].map(([x, y], i) => paw(`dp${i}`, x, y, i * 24 - 20, '#3a1a08', 0.45))}
            {[[590, 628, 0.9], [1010, 628, 1.1], [660, 628, 0.7]].map(([x, y, s], i) => shroom(`sh${i}`, x, y, s, -i * 0.9))}

            {/* the foxes: a big one on the right, a cub on the left, pumpkins by them */}
            <ellipse cx="1310" cy="490" rx="250" ry="220" fill={f('shadow')} />
            {fox('fx1', 1296, 636, 0.98, 1, 0)}{fox('fx2', 350, 636, 0.5, -1, -1.6)}
            {pumpkin('pk1', 1180, 634, 1)}{pumpkin('pk2', 1224, 638, 0.62)}{pumpkin('pk3', 470, 636, 0.8)}
            {FIREFLIES.map((d) => <g key={d.k} className="sc-wisp" style={after(d.d)}><circle cx={d.x} cy={d.y} r={d.r * 5} fill={d.g ? GREEN : '#ffd27a'} opacity=".22" /><circle cx={d.x} cy={d.y} r={d.r} fill={d.g ? '#eaffc0' : '#fff0b0'} /></g>)}

            {/* the forest floor: grass at the foot of the wall, then moss and fallen leaves */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            {floorGrid(height).map(({ i, j }) => <polygon key={`${i}-${j}`} points={tile(i, j)} fill={(i + j) % 2 ? '#9ad47a' : '#0a1610'} opacity={(i * 5 + j * 11 + 100) % 7 < 3 ? 0.1 : 0.05} />)}
            <g stroke="#0a1610" strokeOpacity=".45" strokeWidth="1.4">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>
            <g stroke="#3f7a3a" strokeWidth="2.6" strokeLinecap="round">{GRASS.map((g) => <path key={g.k} d={`M${g.x} 636Q${g.x + g.lean / 2} ${636 - g.h / 2} ${r1(g.x + g.lean)} ${r1(636 - g.h)}`} fill="none" />)}</g>
            {FALLEN.map((l) => <g key={l.k} transform={`translate(${l.x} ${l.y}) rotate(${l.r}) scale(${l.s})`}><path d="M-10 0Q0 -9 10 0Q0 9 -10 0Z" fill={l.c} /><path d="M-10 0H10" stroke="#3a1206" strokeOpacity=".5" strokeWidth="1.2" /></g>)}

            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="400" ry="74" fill={f('pool')} />
                <ellipse cx="800" cy={ring} rx="340" ry="58" fill="#14281c" opacity=".85" />
                {Array.from({ length: 40 }, (_, k) => { const a = (k * Math.PI * 2) / 40; return <ellipse key={k} cx={r1(800 + Math.cos(a) * 330)} cy={r1(ring + Math.sin(a) * 56)} rx="13" ry="5.6" transform={`rotate(${r1((Math.atan2(Math.cos(a) * 56, -Math.sin(a) * 330) * 180) / Math.PI)} ${r1(800 + Math.cos(a) * 330)} ${r1(ring + Math.sin(a) * 56)})`} fill={LEAF[k % 6]} />; })}
                <ellipse cx="800" cy={ring} rx="296" ry="49" fill="none" stroke={GREEN} strokeOpacity=".5" strokeWidth="2" strokeDasharray="3 9" />
                {[[540, -14, 0], [1060, 14, 1]].map(([x, r, i]) => paw(`rp${i}`, x, ring, r, '#ffd27a', 0.55))}
                {[[596, 24, 8], [1004, -24, 10]].map(([x, r, y], i) => paw(`rq${i}`, x, ring + y * 2, r, '#ffd27a', 0.4))}
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 4} rx="184" ry="15" fill="#000" opacity=".55" />
            </g>

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
