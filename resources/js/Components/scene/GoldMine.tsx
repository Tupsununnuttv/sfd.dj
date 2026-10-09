import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { after, floorGrid, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, floorTile as tile, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const font = 'Figtree, system-ui, sans-serif';
const TONES = ['#2a190d', '#33200f', '#3a2412', '#4a2e18', '#5a3a1e', '#6a4526'];

// the rock of the wall, its layers, the veins of gold and the specks of dust: the same every time
const rs = rand(31);
const ROCKS = Array.from({ length: 58 }, () => {
    const cx = rs() * 1600;
    const cy = 20 + rs() * 600;
    const r = 30 + rs() * 64;
    const pts = Array.from({ length: 7 }, (_, i): [number, number] => {
        const a = (i / 7) * Math.PI * 2 + rs() * 0.6;
        const d = r * (0.6 + rs() * 0.55);

        return [r1(cx + Math.cos(a) * d), r1(cy + Math.sin(a) * d * 0.75)];
    });
    const top = [...pts].sort((a, b) => a[1] - b[1]).slice(0, 3).sort((a, b) => a[0] - b[0]);

    return { pts: pts.join(' '), edge: `M${top.join('L')}`, tone: TONES[Math.floor(rs() * TONES.length)], o: r1(0.3 + rs() * 0.3) };
});
const STRATA = ([[96, '#6a4526'], [210, '#1c1008'], [318, '#6a4526'], [430, '#24150b'], [524, '#7a5230']] as [number, string][]).map(([y, c]) => {
    const ph = rs() * 6;

    return { c, d: `M${Array.from({ length: 41 }, (_, i) => `${i * 40} ${r1(y + Math.sin(i / 3.1 + ph) * 16 + (rs() - 0.5) * 8)}`).join('L')}V660H0Z` };
});
const VEINS: [number, number][][] = [
    [[-10, 560], [60, 505], [104, 516], [170, 452], [214, 466], [262, 392], [312, 402], [352, 330], [408, 338], [452, 262]],
    [[262, 392], [300, 432], [340, 424], [372, 472]],
    [[20, 250], [70, 214], [126, 226], [170, 170], [232, 180], [270, 120], [330, 126]],
    [[1610, 540], [1540, 498], [1500, 508], [1440, 448], [1398, 458], [1346, 390], [1300, 398], [1262, 330], [1210, 340], [1176, 270]],
    [[1346, 390], [1318, 440], [1270, 436], [1246, 486]],
    [[1590, 230], [1540, 196], [1490, 206], [1450, 150], [1390, 160], [1356, 104]],
    [[470, 526], [520, 474], [548, 484], [592, 430]],
    [[1130, 526], [1080, 474], [1052, 484], [1008, 430]],
];
const veinPath = (v: [number, number][]) => `M${v.map((q) => q.join(' ')).join('L')}`;
const NUGGETS = VEINS.flatMap((v, a) => v.filter((_, i) => i % 3 === 1).map(([x, y], i) => ({ k: `${a}-${i}`, x: x + 7, y: y - 3, s: 0.8 + rs() * 0.6, r: rs() * 90, glint: (a + i) % 2 === 0 })));
const SCATTER = Array.from({ length: 14 }, (_, k) => ({ k, x: k % 2 ? 40 + rs() * 560 : 1000 + rs() * 560, y: 662 + rs() * 200, s: 0.55 + rs() * 0.7, r: rs() * 360, gold: k % 3 !== 0 }));
const DUST = Array.from({ length: 16 }, (_, k) => ({ k, x: 120 + rs() * 1360, y: 110 + rs() * 440, r: r1(1.4 + rs() * 1.6), d: -rs() * 4 })).filter((d) => !(d.x > tv.x - 50 && d.x < tv.x + tv.w + 50 && d.y < tv.y + tv.h + 50));
const HEAP = Array.from({ length: 15 }, (_, k) => {
    const x = -52 + (k % 8) * 14.5 + (k < 8 ? 0 : 7);
    const arc = Math.sin(((x + 58) / 116) * Math.PI);

    return { x: r1(x), y: r1(-64 - arc * (k < 8 ? 14 : 28) - rs() * 3), r: r1(9 + rs() * 3.5) };
});

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * The gold mine scenery on a 1600 x 900 canvas: a timbered cavern with veins of gold in the rock. The video hangs in a heavy timber frame, and under it a door leads into the
 * mine (rails going in, a light far inside) with a sign over it. Crossed pickaxes and a cluster of crystals on one side, a hard hat with its lamp on, a ladder, barrels, a
 * crate of TNT and a chest running over with gold on the other, a pyramid of gold bars, rails along the foot of the wall and a floor with a big golden coin under the booth.
 * Like the others it only moves while a song plays (`live`): the lanterns swing and flicker, the gold glints, dust drifts and a cart of gold rolls along the rails.
 */
export default function GoldMineBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down
    const ring = SCENE.booth.y + 100;

    /** The grain of a timber: thin dark lines along it. */
    const grain = (x: number, y: number, w: number, h: number) => {
        const along = w >= h;
        const n = Math.max(2, Math.round((along ? h : w) / 9));

        return <path d={Array.from({ length: n }, (_, i) => { const t = (i + 0.7) / (n + 0.4); return along ? `M${x} ${r1(y + h * t)}H${x + w}` : `M${r1(x + w * t)} ${y}V${y + h}`; }).join('')} stroke="#2e1a0b" strokeOpacity=".3" strokeWidth="1.4" />;
    };

    /** An iron strap round a timber, with its rivets. */
    const strap = (k: string, x: number, y: number, w: number, h: number) => (
        <g key={k}>
            <rect x={x} y={y} width={w} height={h} rx="2" fill="#2b2d36" stroke="#14151a" strokeWidth="1.4" />
            <rect x={x + 2} y={y + 2} width={w - 4} height="2" rx="1" fill="#6b7280" opacity=".5" />
            {[x + 6, x + w - 6].map((cx) => <circle key={cx} cx={cx} cy={y + h / 2 + 1} r="2.2" fill="#9ca3af" />)}
        </g>
    );

    /** A hanging oil lantern: its glow, its chain from `chain` above and the flame. It swings and flickers while a song plays. */
    const lantern = (k: string, x: number, y: number, chain: number, s: number, delay: number) => (
        <g key={k}>
            <circle className="sc-flame" style={after(delay)} cx={x} cy={y + 28 * s} r={170 * s} fill={f('lamp')} />
            <g className="sc-dangle" style={after(delay)}>
                <path d={`M${x} ${y - chain}V${y}`} stroke="#2b2d36" strokeWidth="3" strokeDasharray="5 3" />
                <g transform={`translate(${x} ${y}) scale(${s})`}>
                    <path d="M-5 -4H5L12 8H-12Z" fill="#2b2d36" />
                    <rect x="-13" y="8" width="26" height="40" rx="4" fill={f('glass')} stroke="#2b2d36" strokeWidth="3" />
                    <path className="sc-flame" style={after(delay - 0.6)} d="M0 42C-8 34 -3 26 0 17C3 26 8 34 0 42Z" fill="#fff3c4" />
                    <path d="M-4.4 8V48M4.4 8V48" stroke="#2b2d36" strokeWidth="1.6" opacity=".6" />
                    <rect x="-15" y="48" width="30" height="6" rx="2" fill="#2b2d36" />
                </g>
            </g>
        </g>
    );

    /** A lump of gold. */
    const nugget = (k: string, x: number, y: number, s: number, r: number) => (
        <g key={k} transform={`translate(${r1(x)} ${r1(y)}) rotate(${r1(r)}) scale(${r1(s)})`}>
            <path d="M-8 3L-5 -5L3 -8L9 -2L6 5L-3 7Z" fill={f('gold')} stroke="#92400e" strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M-4 -2L0 -5L4 -3" stroke="#fff7c2" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>
    );

    /** A glint of light on the gold: a four-pointed star that twinkles. */
    const glint = (k: string, x: number, y: number, s: number, d: number) => (
        <path key={k} className="sc-twinkle" style={after(d)} transform={`translate(${r1(x)} ${r1(y)}) scale(${r1(s)})`} d="M0 -10L2.2 -2.2L10 0L2.2 2.2L0 10L-2.2 2.2L-10 0L-2.2 -2.2Z" fill="#fff8cf" />
    );

    /** A gold coin lying flat. */
    const coin = (k: string, x: number, y: number, s = 1) => (
        <g key={k} transform={`translate(${r1(x)} ${r1(y)}) scale(${s})`}>
            <ellipse cy="3" rx="13" ry="5.6" fill="#b45309" />
            <ellipse rx="13" ry="5.6" fill={f('gold')} stroke="#92400e" strokeWidth="1" />
            <ellipse rx="8" ry="3.2" fill="none" stroke="#b45309" strokeWidth="1.2" opacity=".7" />
            <path d="M-6 -1.4Q0 -4 6 -1.4" stroke="#fff7c2" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </g>
    );

    /** A bar of gold, its front face at (x, y - 24) to (x + 64, y). */
    const bar = (k: string, x: number, y: number) => (
        <g key={k}>
            <path d={`M${x} ${y - 24}L${x + 10} ${y - 33}H${x + 74}L${x + 64} ${y - 24}Z`} fill="#fde68a" />
            <path d={`M${x + 64} ${y - 24}L${x + 74} ${y - 33}V${y - 9}L${x + 64} ${y}Z`} fill="#b45309" />
            <rect x={x} y={y - 24} width="64" height="24" rx="1.5" fill={f('gold')} />
            <rect x={x + 8} y={y - 18} width="48" height="12" rx="2" fill="none" stroke="#92400e" strokeOpacity=".55" strokeWidth="1.4" />
            <path d={`M${x + 4} ${y - 21}H${x + 30}`} stroke="#fff7c2" strokeWidth="1.6" strokeLinecap="round" opacity=".85" />
        </g>
    );

    /** A pickaxe standing up on (x, y), turned by `rot` degrees. */
    const pick = (k: string, x: number, y: number, rot: number) => (
        <g key={k} transform={`translate(${x} ${y}) rotate(${rot})`}>
            <rect x="-5.5" y="-70" width="11" height="188" rx="4" fill={f('woodV')} stroke="#2e1a0b" strokeWidth="1.8" />
            <path d="M-58 -50Q-32 -84 0 -74Q32 -84 58 -50Q30 -64 10 -60V-44H-10V-60Q-30 -64 -58 -50Z" fill="#7b8494" stroke="#1f2937" strokeWidth="2.4" strokeLinejoin="round" />
            <path d="M-44 -62Q-24 -77 -6 -72" stroke="#e5e7eb" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <rect x="-13" y="-64" width="26" height="13" rx="3" fill="#2b2d36" stroke="#14151a" strokeWidth="1.4" />
        </g>
    );

    /** A crystal standing on (x, y), `h` tall. */
    const crystal = (k: string, x: number, y: number, rot: number, h: number, a: string, b: string) => (
        <g key={k} transform={`translate(${x} ${y}) rotate(${rot})`}>
            <path d={`M-10 0L-13 ${-h * 0.72}L0 ${-h}L13 ${-h * 0.72}L10 0Z`} fill={a} />
            <path d={`M0 0V${-h}L13 ${-h * 0.72}L10 0Z`} fill={b} />
            <path d={`M-13 ${-h * 0.72}L0 ${-h}`} stroke="#fff" strokeOpacity=".55" strokeWidth="1.8" strokeLinecap="round" />
        </g>
    );

    /** A barrel with iron hoops. */
    const barrel = (k: string, x: number, y: number, s: number) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse cy="3" rx="36" ry="7" fill="#000" opacity=".3" />
            <path d="M-28 -84C-39 -58 -39 -26 -28 0H28C39 -26 39 -58 28 -84Z" fill={f('woodV')} stroke="#2e1a0b" strokeWidth="2.4" />
            <path d="M-12 -84C-14 -56 -14 -26 -12 0M12 -84C14 -56 14 -26 12 0" fill="none" stroke="#2e1a0b" strokeOpacity=".4" strokeWidth="2" />
            {[[-68, 33], [-42, 37], [-16, 34]].map(([hy, w]) => <path key={hy} d={`M${-w} ${hy}Q0 ${hy + 8} ${w} ${hy}`} fill="none" stroke="#2b2d36" strokeWidth="5.5" />)}
            <ellipse cy="-84" rx="28" ry="7" fill="#8a5a2b" stroke="#2e1a0b" strokeWidth="2.2" />
        </g>
    );

    const lampPool = (cx: number) => <ellipse key={cx} cx={cx} cy="540" rx="200" ry="150" fill={f('lamp')} opacity=".5" />;

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('wall')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#0d0704" /><stop offset=".35" stopColor="#24150b" /><stop offset=".78" stopColor="#4a2e18" /><stop offset="1" stopColor="#6a4526" /></linearGradient>
                <linearGradient id={u('wood')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#b07a40" /><stop offset=".5" stopColor="#8a5a2b" /><stop offset="1" stopColor="#5e3718" /></linearGradient>
                <linearGradient id={u('woodV')} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#5e3718" /><stop offset=".3" stopColor="#b07a40" /><stop offset=".7" stopColor="#8a5a2b" /><stop offset="1" stopColor="#4a2a12" /></linearGradient>
                <linearGradient id={u('gold')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fde68a" /><stop offset=".45" stopColor="#fbbf24" /><stop offset="1" stopColor="#b45309" /></linearGradient>
                <linearGradient id={u('steel')} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#4b5563" /><stop offset=".35" stopColor="#9ca3af" /><stop offset="1" stopColor="#374151" /></linearGradient>
                <linearGradient id={u('shade')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#000" stopOpacity=".5" /><stop offset="1" stopColor="#000" stopOpacity="0" /></linearGradient>
                <linearGradient id={u('glass')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff0b0" /><stop offset="1" stopColor="#ffa43a" /></linearGradient>
                <radialGradient id={u('lamp')} cx=".5" cy=".5" r=".5"><stop stopColor="#fff0b0" stopOpacity=".7" /><stop offset=".45" stopColor="#ffc060" stopOpacity=".24" /><stop offset="1" stopColor="#ff9a1f" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('halo')} cx="800" cy={tv.y + tv.h / 2} r="720" gradientUnits="userSpaceOnUse"><stop stopColor="#ffb454" stopOpacity=".34" /><stop offset=".55" stopColor="#d97706" stopOpacity=".12" /><stop offset="1" stopColor="#d97706" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('deep')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffd27a" stopOpacity=".95" /><stop offset=".45" stopColor="#ff9a1f" stopOpacity=".45" /><stop offset="1" stopColor="#ff9a1f" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('gem')} cx=".5" cy=".5" r=".5"><stop stopColor="#c4b5fd" stopOpacity=".7" /><stop offset=".5" stopColor="#7c3aed" stopOpacity=".25" /><stop offset="1" stopColor="#7c3aed" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('beam')} x1="1" y1="0" x2="0" y2="0"><stop stopColor="#fff8cf" stopOpacity=".5" /><stop offset="1" stopColor="#fff8cf" stopOpacity="0" /></linearGradient>
                <radialGradient id={u('coinface')} cx=".5" cy=".4" r=".7"><stop stopColor="#fde68a" /><stop offset=".6" stopColor="#fbbf24" /><stop offset="1" stopColor="#b45309" /></radialGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffd45a" stopOpacity=".55" /><stop offset=".6" stopColor="#f59e0b" stopOpacity=".2" /><stop offset="1" stopColor="#f59e0b" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffb070" stopOpacity="0" /><stop offset="1" stopColor="#1a0e07" stopOpacity=".6" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".58" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#120a05" stopOpacity=".6" /></radialGradient>
            </defs>

            {/* the wall of the mine: layers of rock, chunks of stone, veins of gold with their nuggets */}
            <rect width="1600" height="660" fill={f('wall')} />
            {STRATA.map((s, k) => <path key={k} d={s.d} fill={s.c} opacity=".2" />)}
            {ROCKS.map((r, k) => (
                <g key={k}>
                    <polygon points={r.pts} fill={r.tone} opacity={r.o} stroke="#000" strokeOpacity=".22" strokeWidth="2" strokeLinejoin="round" />
                    <path d={r.edge} fill="none" stroke="#d9a566" strokeOpacity=".22" strokeWidth="2" strokeLinecap="round" />
                </g>
            ))}
            <g className="sc-shimmer" fill="none" stroke="#fbbf24" strokeOpacity=".2" strokeWidth="20" strokeLinejoin="round" strokeLinecap="round">{VEINS.map((v, k) => <path key={k} d={veinPath(v)} />)}</g>
            <g fill="none" strokeLinejoin="round" strokeLinecap="round">
                {VEINS.map((v, k) => <path key={k} d={veinPath(v)} stroke="#c98a0a" strokeWidth="6" />)}
                {VEINS.map((v, k) => <path key={`h${k}`} d={veinPath(v)} stroke="#ffe27a" strokeWidth="2.4" />)}
            </g>
            {NUGGETS.flatMap((n) => [nugget(n.k, n.x, n.y, n.s, n.r), ...(n.glint ? [glint(`g${n.k}`, n.x + 8, n.y - 8, 0.8, -n.s * 3)] : [])])}
            <rect width="1600" height={height} fill={f('halo')} />

            {/* the timber of the mine on both sides: a post, a beam over the top and a brace */}
            {[0, 1].map((s) => (
                <g key={s} transform={s ? 'translate(1600 0) scale(-1 1)' : undefined}>
                    <rect x="-10" y="40" width="500" height="84" fill={f('shade')} />
                    <path d="M58 188V240L218 40H166Z" fill={f('wood')} stroke="#2e1a0b" strokeWidth="3" strokeLinejoin="round" />
                    <rect x="-10" y="-6" width="486" height="46" fill={f('wood')} stroke="#2e1a0b" strokeWidth="3" />{grain(-10, -6, 486, 46)}
                    <rect x="-6" y="-6" width="64" height="646" fill={f('woodV')} stroke="#2e1a0b" strokeWidth="3" />{grain(-6, -6, 64, 646)}
                    {[110, 300, 470].map((y) => strap(`p${y}`, -8, y, 68, 22))}
                    {[100, 280, 400].map((x) => strap(`l${x}`, x, -8, 22, 50))}
                    <path d="M-10 640V598Q2 588 22 592L42 586Q62 590 68 602V640Z" fill="#5b5148" stroke="#2e1a0b" strokeWidth="3" />
                    <path d="M0 614H60M22 592V614M44 614V640" stroke="#2e1a0b" strokeOpacity=".5" strokeWidth="2" />
                </g>
            ))}

            {/* the left wall: crossed pickaxes, a cluster of crystals, a pyramid of gold bars */}
            <g transform="translate(214 244) scale(.96)">{pick('a', 0, 0, -46)}{pick('b', 0, 0, 46)}<circle r="9" fill="#2b2d36" stroke="#14151a" strokeWidth="2" /></g>
            <ellipse className="sc-pulse" cx="190" cy="438" rx="120" ry="96" fill={f('gem')} />
            <g transform="translate(190 506)">
                <path d="M-70 4C-60 -28 -30 -34 -6 -26C20 -38 54 -30 70 4Z" fill="#2a190d" stroke="#14100a" strokeWidth="2.4" />
                {[[-36, -22, -26, 82, '#7c3aed', '#a78bfa'], [-4, -30, -4, 118, '#6d28d9', '#c4b5fd'], [30, -24, 22, 90, '#7c3aed', '#a78bfa'], [-16, -22, 40, 56, '#0e7490', '#67e8f9'], [50, -16, 46, 50, '#0e7490', '#67e8f9']].map(([x, y, r, h, a, b], k) => crystal(`c${k}`, x as number, y as number, r as number, h as number, a as string, b as string))}
                {glint('cg1', -16, -96, 1, -0.4)}{glint('cg2', 34, -72, 0.8, -1.7)}
            </g>

            {/* the right wall: a hard hat with its lamp on, a ladder */}
            <g transform="translate(1296 640) rotate(7)">
                <rect x="-36" y="-372" width="9" height="376" rx="2" fill={f('woodV')} stroke="#2e1a0b" strokeWidth="2" /><rect x="27" y="-372" width="9" height="376" rx="2" fill={f('woodV')} stroke="#2e1a0b" strokeWidth="2" />
                {Array.from({ length: 10 }, (_, i) => <rect key={i} x="-36" y={-346 + i * 36} width="72" height="8" rx="2" fill="#a56b3a" stroke="#2e1a0b" strokeWidth="1.6" />)}
            </g>
            <g transform="translate(1420 232)">
                <path d="M-170 -22L0 -32V-6Z" fill={f('beam')} className="sc-flame" />
                <path d="M0 -62V-52" stroke="#2b2d36" strokeWidth="3" /><circle cy="-64" r="3.4" fill="#2b2d36" />
                <path d="M-46 0C-46 -40 -20 -52 0 -52C20 -52 46 -40 46 0Z" fill="#facc15" stroke="#a16207" strokeWidth="2.4" />
                <path d="M-6 -52V-6M6 -52V-6" stroke="#a16207" strokeOpacity=".55" strokeWidth="2.2" />
                <rect x="-57" y="-3" width="114" height="10" rx="5" fill="#eab308" stroke="#a16207" strokeWidth="2.2" />
                <circle cx="-28" cy="-26" r="11" fill="#fff" stroke="#6b7280" strokeWidth="3" /><circle cx="-28" cy="-26" r="22" fill="#fff8cf" opacity=".3" />
            </g>

            {/* the way into the mine, under the screen: a timber door, rails going in, a light far inside, and the sign over it */}
            <rect x="688" y="454" width="224" height="174" fill="#0a0503" />
            <ellipse cx="800" cy="520" rx="96" ry="64" fill={f('deep')} />
            <path d="M688 628L772 514H828L912 628Z" fill="#3a2412" opacity=".9" />
            <path d="M742 628L773 514M858 628L827 514" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />
            {[606, 588, 572, 558, 546, 536, 527].map((y, k) => { const t = (628 - y) / 114; const l = 742 + 31 * t; const w = 14 - k * 1.3; return <path key={y} d={`M${r1(l - w)} ${y}H${r1(1600 - l + w)}`} stroke="#6e3f1d" strokeWidth={Math.max(2, 5 - k * 0.5)} />; })}
            {[[724, 876, 474, 580], [752, 848, 498, 546]].map(([l, r, y, b]) => <g key={l}><path d={`M${l} ${y}V${b}M${r} ${y}V${b}`} stroke="#6e3f1d" strokeWidth="8" /><path d={`M${l - 5} ${y}H${r + 5}`} stroke="#8a5a2b" strokeWidth="9" /></g>)}
            {nugget('d1', 764, 604, 0.7, 20)}{nugget('d2', 826, 612, 0.8, -30)}{nugget('d3', 796, 590, 0.6, 50)}{glint('dg1', 770, 592, 0.7, -0.5)}{glint('dg2', 832, 600, 0.6, -1.6)}
            <rect x="664" y="424" width="24" height="204" fill={f('woodV')} stroke="#2e1a0b" strokeWidth="2.4" />{grain(664, 424, 24, 204)}
            <rect x="912" y="424" width="24" height="204" fill={f('woodV')} stroke="#2e1a0b" strokeWidth="2.4" />{grain(912, 424, 24, 204)}
            <path d="M688 454V496L730 454Z" fill={f('wood')} stroke="#2e1a0b" strokeWidth="2.4" strokeLinejoin="round" /><path d="M912 454V496L870 454Z" fill={f('wood')} stroke="#2e1a0b" strokeWidth="2.4" strokeLinejoin="round" />
            <rect x="652" y="424" width="296" height="30" rx="3" fill={f('wood')} stroke="#2e1a0b" strokeWidth="2.6" />{grain(652, 424, 296, 30)}
            {strap('d-l', 662, 470, 28, 18)}{strap('d-r', 910, 470, 28, 18)}
            <rect x="640" y="374" width="320" height="48" rx="5" fill={f('wood')} stroke="#2e1a0b" strokeWidth="3" />{grain(640, 374, 320, 48)}
            <text x="800" y="410" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize="32" letterSpacing="5" fill="#fcd34d" stroke="#3a1f0a" strokeWidth="1.6" paintOrder="stroke">GOLD MINE</text>
            {[652, 948].map((x) => <g key={x}><circle cx={x} cy="386" r="3" fill="#2b2d36" /><circle cx={x} cy="410" r="3" fill="#2b2d36" /></g>)}

            {/* the screen: a heavy timber frame with iron corners and a thread of gold light */}
            <rect x={tv.x - 34} y="-30" width={tv.w + 68} height={tv.y + tv.h + 34 + 30} rx="6" fill={f('wood')} stroke="#2e1a0b" strokeWidth="3" />
            {grain(tv.x - 34, -30, 26, tv.y + tv.h + 64)}{grain(tv.x + tv.w + 8, -30, 26, tv.y + tv.h + 64)}{grain(tv.x - 34, tv.y + tv.h + 10, tv.w + 68, 24)}
            <rect x={tv.x - 9} y={tv.y - 9} width={tv.w + 18} height={tv.h + 18} rx="3" fill="#080402" />
            <rect x={tv.x - 12} y={tv.y - 12} width={tv.w + 24} height={tv.h + 24} rx="5" fill="none" stroke="#fbbf24" strokeOpacity=".2" strokeWidth="9" />
            <rect x={tv.x - 9} y={tv.y - 9} width={tv.w + 18} height={tv.h + 18} rx="3" fill="none" stroke="#fbbf24" strokeWidth="2.4" />
            {[tv.x - 34, tv.x + tv.w + 8].flatMap((x) => [90, 220].map((y) => strap(`s${x}-${y}`, x, y, 26, 24)))}
            {[tv.x + 40, tv.x + tv.w / 2 - 14, tv.x + tv.w - 68].map((x) => strap(`b${x}`, x, tv.y + tv.h + 10, 28, 24))}
            <rect x={tv.x - 34} y={tv.y + tv.h + 34} width={tv.w + 68} height="40" fill={f('shade')} />
            {[tv.x - 22, tv.x + tv.w + 22].map((x) => <path key={x} d={`M${x} ${tv.y + tv.h + 36}V${tv.y + tv.h + 62}`} stroke="#2b2d36" strokeWidth="3" strokeDasharray="5 3" />)}

            {/* lanterns: two on long chains from the beams, two on the door, and the pools of light they throw */}
            {lampPool(350)}{lampPool(1250)}
            {lantern('l1', 358, 150, 110, 1.1, 0)}{lantern('l2', 1250, 150, 110, 1.1, -1.4)}
            {lantern('l3', 652, 484, 0, 0.8, -0.7)}{lantern('l4', 948, 484, 0, 0.8, -2.1)}
            {DUST.map((d) => <circle key={d.k} className="sc-wisp" style={after(d.d)} cx={d.x} cy={d.y} r={d.r} fill="#ffe9b0" opacity=".55" />)}

            {/* the floor: packed earth */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            {floorGrid(height).map(({ i, j }) => <polygon key={`${i}-${j}`} points={tile(i, j)} fill={(i + j) % 2 ? '#ffcf85' : '#1a0e07'} opacity={(i * 5 + j * 11 + 100) % 7 < 3 ? 0.1 : 0.05} />)}
            <g stroke="#1a0e07" strokeOpacity=".4" strokeWidth="1.4">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>

            {/* rails along the foot of the wall, and the cart of gold that rolls along them */}
            {Array.from({ length: 31 }, (_, i) => <path key={i} d={`M${i * 54 - 6} 608H${i * 54 + 40}L${i * 54 + 46} 631H${i * 54 - 12}Z`} fill="#4a2a14" stroke="#2e1a0b" strokeWidth="1.4" />)}
            <rect y="606" width="1600" height="4" fill="#9ca3af" /><rect y="606" width="1600" height="1.4" fill="#e5e7eb" />
            <rect y="621" width="1600" height="7" fill="#aeb4bf" /><rect y="621" width="1600" height="2.2" fill="#f3f4f6" /><rect y="628" width="1600" height="3" fill="#000" opacity=".35" />
            <g className="sc-train"><g transform="translate(440 626)">
                <ellipse cy="3" rx="82" ry="5" fill="#000" opacity=".35" />
                {HEAP.map((h, k) => <circle key={k} cx={h.x} cy={h.y} r={h.r} fill={f('gold')} stroke="#92400e" strokeWidth="1" />)}
                {HEAP.filter((_, k) => k % 2 === 0).map((h, k) => <circle key={k} cx={h.x - 3} cy={h.y - 3} r="2.6" fill="#fff7c2" opacity=".85" />)}
                {glint('cart1', -22, -92, 0.9, -0.3)}{glint('cart2', 24, -84, 0.75, -1.5)}
                <path d="M-66 -66H66L54 -16H-54Z" fill={f('steel')} stroke="#1f2937" strokeWidth="2.4" strokeLinejoin="round" />
                <path d="M-33 -64L-27 -17M33 -64L27 -17" stroke="#1f2937" strokeWidth="5" />
                <rect x="-71" y="-73" width="142" height="11" rx="3" fill="#b4bcc9" stroke="#1f2937" strokeWidth="2" />
                {[-56, -18, 18, 56].map((x) => <circle key={x} cx={x} cy="-56" r="2.2" fill="#e5e7eb" />)}
                <rect x="-56" y="-19" width="112" height="6" rx="2" fill="#1f2937" />
                {[-38, 38].map((x) => <g key={x}><circle cx={x} cy="-8" r="12.5" fill="#1f2937" /><circle cx={x} cy="-8" r="8.6" fill="#7b8494" stroke="#d1d5db" strokeWidth="1.4" /><circle cx={x} cy="-8" r="2.8" fill="#1f2937" /></g>)}
            </g></g>

            {/* on the floor: a pyramid of gold bars, barrels, a crate of TNT, a chest running over with gold, and gold and stones lying about */}
            {SCATTER.map((s) => s.gold
                ? <g key={s.k}>{nugget(`n${s.k}`, s.x, s.y, s.s, s.r)}{s.k % 2 ? glint(`n${s.k}g`, s.x + 8, s.y - 8, s.s * 0.8, -s.k * 0.4) : null}</g>
                : <polygon key={s.k} points="-12,5 -7,-6 4,-8 13,-1 9,6" transform={`translate(${r1(s.x)} ${r1(s.y)}) rotate(${r1(s.r)}) scale(${r1(s.s)})`} fill="#6a5a4a" stroke="#2a1a0e" strokeWidth="1.6" />)}
            {[0, 1, 2].map((i) => bar(`b0${i}`, 36 + i * 70, 628))}{[0, 1].map((i) => bar(`b1${i}`, 71 + i * 70, 604))}{bar('b2', 106, 580)}{glint('bg1', 150, 556, 1, -0.2)}{glint('bg2', 52, 596, 0.8, -1.3)}
            {barrel('br1', 1318, 632, 1)}{barrel('br2', 1384, 634, 0.88)}
            <g transform="translate(1262 630)">
                <ellipse cy="3" rx="50" ry="6" fill="#000" opacity=".3" />
                {[-16, 0, 16].map((x) => <g key={x}><rect x={x - 6} y="-72" width="12" height="26" rx="2" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1.4" /><rect x={x - 6} y="-62" width="12" height="4" fill="#fef2f2" opacity=".6" /></g>)}
                <path d="M0 -72Q6 -88 18 -90" stroke="#6b4423" strokeWidth="2.4" fill="none" /><circle className="sc-twinkle" cx="18" cy="-90" r="3.6" fill="#ffd45a" />
                <rect x="-44" y="-52" width="88" height="52" rx="3" fill={f('wood')} stroke="#2e1a0b" strokeWidth="2.6" />
                <path d="M-44 -34H44M-44 -17H44" stroke="#2e1a0b" strokeOpacity=".5" strokeWidth="2" />
                <rect x="-44" y="-40" width="88" height="22" fill="#b91c1c" /><text y="-23" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize="17" letterSpacing="3" fill="#fff">TNT</text>
            </g>
            <g transform="translate(1484 642)">
                <ellipse cy="5" rx="104" ry="12" fill="#000" opacity=".35" />
                <path d="M-76 -60C-80 -128 -42 -152 0 -152C42 -152 80 -128 76 -60Z" fill="#5e3718" stroke="#2e1a0b" strokeWidth="3" />
                <path d="M-64 -64C-66 -120 -36 -140 0 -140C36 -140 66 -120 64 -64Z" fill="#7f1d1d" />
                <path d="M-64 -64C-66 -120 -36 -140 0 -140C36 -140 66 -120 64 -64" fill="none" stroke="#fbbf24" strokeWidth="3" strokeOpacity=".8" />
                {[7, 6, 4, 3].flatMap((n, row) => Array.from({ length: n }, (_, i) => coin(`h${row}-${i}`, (i - (n - 1) / 2) * 20 + ((row * 7 + i * 3) % 5) - 2, -66 - row * 9)))}
                {nugget('cn1', -30, -108, 1.1, 15)}{nugget('cn2', 24, -104, 1, -35)}{glint('cg-1', -8, -118, 1.1, -0.6)}{glint('cg-2', 44, -96, 0.8, -1.9)}{glint('cg-3', -52, -92, 0.8, -1.1)}
                <rect x="-82" y="-64" width="164" height="68" rx="6" fill={f('wood')} stroke="#2e1a0b" strokeWidth="3" />
                <path d="M-82 -42H82M-82 -21H82" stroke="#2e1a0b" strokeOpacity=".5" strokeWidth="2" />
                {strap('c1', -64, -64, 16, 68)}{strap('c2', 48, -64, 16, 68)}
                <rect x="-15" y="-52" width="30" height="32" rx="5" fill={f('gold')} stroke="#92400e" strokeWidth="2" /><circle cy="-40" r="4" fill="#3a1f0a" /><path d="M0 -40V-30" stroke="#3a1f0a" strokeWidth="3" strokeLinecap="round" />
                {coin('s1', -98, 12)}{coin('s2', -70, 20)}{coin('s3', 96, 14)}{coin('s4', 122, 6, 0.9)}{coin('s5', 62, 22)}
                <ellipse cx="-118" cy="2" rx="4.5" ry="12" fill="#fbbf24" stroke="#92400e" strokeWidth="1.2" />
            </g>

            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="400" ry="74" fill={f('pool')} />
                <g transform={`translate(800 ${ring}) scale(340 58)`}>
                    <circle r="1" fill={f('coinface')} /><circle r="1" fill="none" stroke="#92400e" strokeWidth="4" vectorEffect="non-scaling-stroke" />
                    <circle r="0.93" fill="none" stroke="#fff3b0" strokeWidth="5" strokeDasharray="2 5" strokeOpacity=".7" vectorEffect="non-scaling-stroke" />
                    <circle r="0.8" fill="#d99a14" stroke="#92400e" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
                    <circle r="0.64" fill="none" stroke="#fff3b0" strokeWidth="1.8" strokeDasharray="6 8" strokeOpacity=".6" vectorEffect="non-scaling-stroke" />
                </g>
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 4} rx="184" ry="15" fill="#000" opacity=".5" />
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
