import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { after, floorGrid, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, floorTile as tile, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const font = 'Figtree, system-ui, sans-serif';
const ORANGE = '#ff6b2c';
const YELLOW = '#ffd23f';
const RED = '#ff3b4a';
const TEAL = '#2de2c8';
const BULB = ['#ffd23f', '#fff4c2', '#ff9a3c', '#fff4c2'];

// the skyline behind the stalls, the stars and the paving: the same every time
const rs = rand(44);
const STARS = Array.from({ length: 46 }, (_, k) => ({ k, x: r1(rs() * 1600), y: r1(rs() * 280), r: r1(0.7 + rs() * 1.2) }));
const SKYLINE = (() => {
    const out: { k: number; x: number; w: number; h: number; c: string; win: { x: number; y: number; on: boolean }[] }[] = [];

    for (let x = -10, k = 0; x < 1610; k++) {
        const w = 60 + Math.floor(rs() * 90);
        const h = 110 + Math.floor(rs() * 190);
        const win = Array.from({ length: Math.floor((w - 16) / 16) * Math.floor((h - 20) / 22) }, (_, i) => {
            const cols = Math.floor((w - 16) / 16);

            return { x: 12 + (i % cols) * 16, y: 14 + Math.floor(i / cols) * 22, on: rs() > 0.55 };
        });
        out.push({ k, x, w, h, c: k % 2 ? '#151a45' : '#1b1b52', win });
        x += w + 4 + Math.floor(rs() * 10);
    }

    return out;
})();

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * The Tasty scenery on a 1600 x 900 canvas: a night food market. Two stalls with striped awnings and glowing signs (burgers on the left, noodles on the right), a skyline with lit windows, string lights
 * and paper lanterns, the video in a frame of marquee bulbs with a big neon TASTY under it, a diner floor of black and brown squares and a pizza under the booth. Like the others it only moves
 * while a song plays (`live`): steam rises, bulbs and signs flicker.
 */
export default function TastyBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down
    const ring = SCENE.booth.y + 100;

    /** A burger, its bottom bun resting on (x, y); `s` times its size (about 116 wide and 110 tall). */
    const burger = (k: string, x: number, y: number, s: number) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse cy="1" rx="62" ry="6" fill="#000" opacity=".3" />
            <path d="M-56 -18H56Q56 0 28 0H-28Q-56 0 -56 -18Z" fill="#e8a24a" stroke="#7c3f0e" strokeWidth="1.6" strokeLinejoin="round" />
            <rect x="-58" y="-38" width="116" height="21" rx="10.5" fill="#5a2d14" stroke="#2e1408" strokeWidth="1.4" />
            <path d="M-56 -38H56L42 -22L30 -36L12 -20L-4 -36L-22 -22L-40 -36Z" fill={YELLOW} stroke="#b88a00" strokeWidth="1.2" strokeLinejoin="round" />
            <rect x="-55" y="-51" width="110" height="13" rx="6.5" fill="#e63946" stroke="#8a1a22" strokeWidth="1.2" />
            <path d="M-58 -52Q-50 -64 -42 -54Q-34 -64 -26 -54Q-18 -64 -10 -54Q-2 -64 6 -54Q14 -64 22 -54Q30 -64 38 -54Q46 -64 58 -52Z" fill="#5ccf5a" stroke="#2d7a2c" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M-58 -56C-58 -112 58 -112 58 -56Z" fill="#e8a24a" stroke="#7c3f0e" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M-44 -72C-38 -90 -18 -98 0 -98" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="4" strokeLinecap="round" />
            {[[-22, -84, 20], [6, -92, -10], [26, -82, 30], [-6, -72, 0], [38, -68, -20], [-36, -68, 14]].map(([sx, sy, r], i) => <ellipse key={i} cx={sx} cy={sy} rx="4.6" ry="2.4" transform={`rotate(${r} ${sx} ${sy})`} fill="#fff7d6" />)}
        </g>
    );

    /** A bowl of noodles with an egg and chopsticks, its foot on (x, y). */
    const bowl = (k: string, x: number, y: number, s: number, c: string) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse cy="2" rx="56" ry="6" fill="#000" opacity=".3" />
            <path d="M-26 0H26L22 -6H-22Z" fill="#f4e8d4" />
            <path d="M-56 -46H56Q56 2 0 2Q-56 2 -56 -46Z" fill="#fff8ee" stroke="#cdbfa8" strokeWidth="1.4" />
            <path d="M-56 -36H56" stroke={c} strokeWidth="6" /><path d="M-52 -18H52" stroke={c} strokeWidth="3" strokeOpacity=".7" />
            <ellipse cy="-48" rx="56" ry="9" fill="#a8541a" /><ellipse cy="-48" rx="52" ry="7" fill="#d98a3a" />
            {[-34, -18, -2, 14, 30].map((nx, i) => <path key={nx} d={`M${nx} -50Q${nx + 6} -62 ${nx + 12} -52`} stroke="#ffe08a" strokeWidth="4" fill="none" strokeLinecap="round" opacity={i % 2 ? 0.9 : 1} />)}
            <ellipse cx="-20" cy="-52" rx="14" ry="9" fill="#fff" stroke="#e6d9c2" /><circle cx="-20" cy="-52" r="5.4" fill="#ffb02e" />
            <rect x="12" y="-64" width="22" height="16" rx="2" fill="#0f3a2a" transform="rotate(12 23 -56)" />
            <circle cx="-2" cy="-56" r="3.4" fill="#5ccf5a" /><circle cx="4" cy="-54" r="3" fill="#5ccf5a" />
            <path d="M30 -56L62 -100M40 -54L72 -96" stroke="#e8c27a" strokeWidth="3.2" strokeLinecap="round" />
        </g>
    );

    const fries = (k: string, x: number, y: number, s: number) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
            {[-14, -7, 0, 7, 14].map((fx, i) => <rect key={fx} x={fx - 2.6} y={-62 - (i % 2) * 8} width="5.2" height="42" rx="2.4" transform={`rotate(${(i - 2) * 7} ${fx} -20)`} fill={i % 2 ? '#ffd966' : '#ffc233'} stroke="#c88a00" strokeWidth=".8" />)}
            <path d="M-20 -28H20L14 0H-14Z" fill="#e63946" stroke="#8a1a22" strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M-17 -28L-12 0M-6 -28L-4 0M6 -28L4 0M17 -28L12 0" stroke="#fff" strokeOpacity=".7" strokeWidth="3" />
        </g>
    );

    const bottle = (k: string, x: number, y: number, c: string, cap: string) => (
        <g key={k} transform={`translate(${x} ${y})`}>
            <path d="M-9 0V-30Q-9 -40 -4 -44V-52H4V-44Q9 -40 9 -30V0Z" fill={c} stroke="#00000055" strokeWidth="1.2" strokeLinejoin="round" />
            <rect x="-5" y="-60" width="10" height="9" rx="2" fill={cap} /><rect x="-7" y="-26" width="14" height="16" rx="3" fill="#fff" opacity=".85" />
            <path d="M-5 -34V-8" stroke="#fff" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
        </g>
    );

    /** A paper lantern that glows. */
    const lantern = (k: string, x: number, y: number, c: string, delay: number) => (
        <g key={k}>
            <path d={`M${x} ${y - 70}V${y - 34}`} stroke="#1a0a0f" strokeWidth="2" />
            <ellipse className="sc-flame" style={after(delay)} cx={x} cy={y} rx="46" ry="52" fill={f('glow')} />
            <rect x={x - 11} y={y - 36} width="22" height="8" rx="2" fill="#c8941a" />
            <ellipse cx={x} cy={y} rx="26" ry="32" fill={c} stroke="#7a1018" strokeWidth="1.6" />
            <path d={`M${x - 14} ${y - 28}Q${x - 8} ${y} ${x - 14} ${y + 28}M${x} ${y - 32}V${y + 32}M${x + 14} ${y - 28}Q${x + 8} ${y} ${x + 14} ${y + 28}`} stroke="#7a1018" strokeOpacity=".5" strokeWidth="1.6" fill="none" />
            <rect x={x - 11} y={y + 28} width="22" height="8" rx="2" fill="#c8941a" /><path d={`M${x - 4} ${y + 36}V${y + 52}M${x + 4} ${y + 36}V${y + 50}`} stroke="#ffd27a" strokeWidth="2" strokeLinecap="round" />
        </g>
    );

    /** A string of bulbs between two points, sagging. */
    const garland = (k: string, x0: number, y0: number, x1: number, y1: number, sag: number, bulbs: number) => (
        <g key={k}>
            <path d={`M${x0} ${y0}Q${(x0 + x1) / 2} ${(y0 + y1) / 2 + sag} ${x1} ${y1}`} fill="none" stroke="#0a0610" strokeWidth="2.4" />
            {Array.from({ length: bulbs }, (_, i) => {
                const t = (i + 0.5) / bulbs;
                const bx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * ((x0 + x1) / 2) + t * t * x1;
                const by = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * ((y0 + y1) / 2 + sag) + t * t * y1;

                return <g key={i}><circle className="sc-twinkle" style={after(-i * 0.33)} cx={r1(bx)} cy={r1(by + 7)} r="10" fill={BULB[i % 4]} opacity=".35" /><circle cx={r1(bx)} cy={r1(by + 7)} r="3.6" fill={BULB[(i + 1) % 4]} /></g>;
            })}
        </g>
    );

    /** An awning of stripes with a pointed edge. */
    const awning = (k: string, x: number, y: number, w: number, c1: string, c2: string) => {
        const n = Math.round(w / 40);
        const sw = w / n;

        return (
            <g key={k}>
                <rect x={x - 6} y={y + 62} width={w + 12} height="14" fill="#000" opacity=".25" filter={`url(#${u('soft')})`} />
                {Array.from({ length: n }, (_, i) => <path key={i} d={`M${r1(x + i * sw)} ${y}H${r1(x + (i + 1) * sw)}V${y + 52}L${r1(x + (i + 0.5) * sw)} ${y + 70}L${r1(x + i * sw)} ${y + 52}Z`} fill={i % 2 ? c2 : c1} stroke="#00000040" strokeWidth="1.4" strokeLinejoin="round" />)}
                <rect x={x - 6} y={y - 8} width={w + 12} height="12" rx="3" fill="#2a1a12" stroke="#00000066" />
            </g>
        );
    };

    const post = (x: number) => <g key={x}><rect x={x - 8} y="262" width="16" height="370" fill="#6b3a1e" stroke="#2e1408" strokeWidth="2" /><path d={`M${x - 3} 270V620`} stroke="#a56b3a" strokeOpacity=".5" strokeWidth="3" strokeLinecap="round" /></g>;

    const counter = (x: number, w: number) => (
        <g>
            <rect x={x} y="476" width={w} height="92" fill={f('wood')} stroke="#2e1408" strokeWidth="2" />
            {Array.from({ length: Math.floor(w / 46) }, (_, i) => <path key={i} d={`M${x + 46 * (i + 1)} 480V564`} stroke="#2e1408" strokeOpacity=".5" strokeWidth="2" />)}
            <rect x={x - 8} y="462" width={w + 16} height="16" rx="3" fill="#a56b3a" stroke="#2e1408" strokeWidth="2" /><rect x={x - 8} y="462" width={w + 16} height="5" rx="2" fill="#d9a066" opacity=".6" />
        </g>
    );

    const neon = (text: string, x: number, y: number, size: number, c: string, spacing = 8) => (
        <g fontFamily={font} fontWeight="900" textAnchor="middle" letterSpacing={spacing}>
            <text x={x} y={y} fontSize={size} fill="none" stroke={c} strokeOpacity=".3" strokeWidth="14" strokeLinejoin="round">{text}</text>
            <text x={x} y={y} fontSize={size} fill="none" stroke={c} strokeOpacity=".5" strokeWidth="7" strokeLinejoin="round">{text}</text>
            <text x={x} y={y} fontSize={size} fill="#fff6dc" stroke={c} strokeWidth="2.4" paintOrder="stroke" strokeLinejoin="round">{text}</text>
        </g>
    );

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('sky')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#070a24" /><stop offset=".5" stopColor="#24103c" /><stop offset="1" stopColor="#6a2236" /></linearGradient>
                <linearGradient id={u('wood')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8a5a2b" /><stop offset="1" stopColor="#4a2a12" /></linearGradient>
                <radialGradient id={u('glow')} cx=".5" cy=".5" r=".5"><stop stopColor="#ff9a3c" stopOpacity=".6" /><stop offset=".5" stopColor="#ff6b2c" stopOpacity=".2" /><stop offset="1" stopColor="#ff6b2c" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('moon')} cx=".4" cy=".35" r=".8"><stop stopColor="#fffbe8" /><stop offset="1" stopColor="#f4d98a" /></radialGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#2e180e" /><stop offset="1" stopColor="#0d0705" /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffb870" stopOpacity=".5" /><stop offset=".6" stopColor={ORANGE} stopOpacity=".18" /><stop offset="1" stopColor={ORANGE} stopOpacity="0" /></radialGradient>
                <radialGradient id={u('sauce')} cx=".5" cy=".5" r=".5"><stop stopColor="#e24a35" /><stop offset="1" stopColor="#b3281d" /></radialGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ff8a3d" stopOpacity="0" /><stop offset="1" stopColor="#0a0408" stopOpacity=".6" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".56" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#0a0408" stopOpacity=".66" /></radialGradient>
                <filter id={u('soft')} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8" /></filter>
            </defs>

            {/* the night: a sky that warms towards the street, stars, a moon, a skyline with lit windows */}
            <rect width="1600" height={FLOOR + 24} fill={f('sky')} />
            {STARS.map((s) => <circle key={s.k} className={s.k % 4 === 0 ? 'sc-twinkle' : undefined} style={s.k % 4 === 0 ? after(-s.k * 0.27) : undefined} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity=".7" />)}
            <circle cx="1390" cy="126" r="90" fill={f('glow')} opacity=".5" /><circle cx="1390" cy="126" r="40" fill={f('moon')} />
            <circle cx="1378" cy="116" r="7" fill="#e6c86e" opacity=".5" /><circle cx="1402" cy="138" r="5" fill="#e6c86e" opacity=".5" />
            {SKYLINE.map((b) => (
                <g key={b.k}>
                    <rect x={b.x} y={FLOOR - 68 - b.h} width={b.w} height={b.h + 70} fill={b.c} />
                    <rect x={b.x} y={FLOOR - 68 - b.h} width={b.w} height="4" fill="#fff" opacity=".06" />
                    {b.win.map((w, i) => <rect key={i} className={w.on && i % 5 === 0 ? 'sc-twinkle' : undefined} style={w.on && i % 5 === 0 ? after(-i * 0.7) : undefined} x={b.x + w.x} y={FLOOR - 68 - b.h + w.y} width="8" height="11" fill={w.on ? '#ffd27a' : '#0a0c26'} opacity={w.on ? 0.85 : 0.7} />)}
                </g>
            ))}
            <rect y={FLOOR - 70} width="1600" height="100" fill="#0e0a1c" /><rect y={FLOOR - 72} width="1600" height="4" fill={ORANGE} opacity=".35" />

            {/* string lights from the stalls to the frame of the video, and lanterns */}
            {garland('g1', 40, 120, 478, 20, 70, 10)}{garland('g2', 1560, 120, 1122, 20, 70, 10)}{garland('g3', 0, 70, 40, 120, 10, 2)}{garland('g4', 1600, 70, 1560, 120, 10, 2)}

            {/* the left stall: burgers */}
            {post(44)}{post(416)}
            <rect x="52" y="274" width="356" height="196" fill="#1a1020" opacity=".92" />
            <g>
                <rect x="64" y="340" width="118" height="50" rx="4" fill="#1d2b24" stroke="#8a5a2b" strokeWidth="5" />
                <g fontFamily={font} fontWeight="800" fill="#f4f1e6" opacity=".9"><text x="123" y="358" fontSize="12" textAnchor="middle" letterSpacing="3">TODAY</text><text x="76" y="378" fontSize="14">Burger</text><text x="170" y="378" fontSize="14" textAnchor="end">$5</text></g>
                <path d="M74 363H172" stroke="#f4f1e6" strokeOpacity=".4" strokeWidth="1.4" strokeDasharray="3 4" />
            </g>
            {awning('aw1', 40, 262, 392, RED, '#fff')}
            <rect x="74" y="178" width="324" height="58" rx="8" fill="#14070b" stroke={RED} strokeWidth="2.4" /><rect x="74" y="178" width="324" height="58" rx="8" fill="none" stroke={RED} strokeOpacity=".3" strokeWidth="10" />
            <path d="M120 236V262M352 236V262" stroke="#2a1a12" strokeWidth="4" />
            {neon('BURGERS', 252, 222, 40, RED, 6)}
            <g transform="translate(112 218) scale(.34)" opacity=".95">{burger('sg', 0, 0, 1)}</g>
            {counter(52, 356)}
            {burger('b1', 140, 462, 0.62)}{burger('b2', 226, 462, 0.5)}{fries('f1', 304, 462, 0.9)}{bottle('k1', 352, 462, '#d62828', '#fff')}{bottle('k2', 376, 462, '#f2c200', '#d62828')}
            {[[146, 380, 0], [232, 396, 1.4]].map(([x, y, d]) => <g key={x} transform={`translate(${x} ${y})`}>{[0, 1].map((n) => <ellipse key={n} className="sc-steam" style={after(Number(d) - n * 2.2)} rx="9" ry="12" fill="#fff" opacity=".4" />)}</g>)}

            {/* the right stall: noodles */}
            {post(1184)}{post(1556)}
            <rect x="1192" y="274" width="356" height="196" fill="#0c1824" opacity=".92" />
            {awning('aw2', 1170, 262, 408, '#14b8a6', YELLOW)}
            <rect x="1202" y="178" width="324" height="58" rx="8" fill="#06141a" stroke={TEAL} strokeWidth="2.4" /><rect x="1202" y="178" width="324" height="58" rx="8" fill="none" stroke={TEAL} strokeOpacity=".3" strokeWidth="10" />
            <path d="M1248 236V262M1480 236V262" stroke="#2a1a12" strokeWidth="4" />
            {neon('NOODLES', 1402, 222, 40, TEAL, 6)}
            <g transform="translate(1240 232) scale(.34)">{bowl('sb', 0, 0, 1, TEAL)}</g>
            {lantern('ln1', 1236, 366, '#e63946', 0)}{lantern('ln2', 1500, 366, '#e63946', -1.1)}
            <g transform="translate(1368 318)">
                <rect x="-120" y="0" width="240" height="5" fill="#8a5a2b" /><path d="M-100 5V30M100 5V30" stroke="#6b3a1e" strokeWidth="4" />
                {[[-84, '#fff'], [-30, YELLOW], [24, '#fff'], [78, YELLOW]].map(([x, c], i) => <g key={i} transform={`translate(${x} 0)`}><path d="M-22 0L-16 -24H16L22 0Z" fill={c as string} stroke="#00000044" strokeWidth="1.2" strokeLinejoin="round" /><path d="M-14 -12H14" stroke="#e63946" strokeWidth="3" /></g>)}
            </g>
            {counter(1192, 356)}
            <g transform="translate(1248 462)">
                <ellipse cy="2" rx="52" ry="6" fill="#000" opacity=".3" />
                <path d="M-46 0V-62Q-46 -70 -38 -70H38Q46 -70 46 -62V0Z" fill="#9ca3af" stroke="#4b5563" strokeWidth="2" /><rect x="-50" y="-76" width="100" height="10" rx="4" fill="#d1d5db" stroke="#4b5563" strokeWidth="1.6" />
                <path d="M-36 -56V-8" stroke="#fff" strokeOpacity=".4" strokeWidth="5" strokeLinecap="round" /><path d="M-46 -40Q-62 -40 -62 -26M46 -40Q62 -40 62 -26" fill="none" stroke="#4b5563" strokeWidth="5" strokeLinecap="round" />
            </g>
            {bowl('r1', 1340, 462, 0.56, '#e63946')}{bowl('r2', 1414, 462, 0.5, '#2563eb')}{bowl('r3', 1480, 462, 0.46, '#e63946')}
            {[[1240, 380, 0], [1346, 392, 1.6], [1416, 398, 3.2]].map(([x, y, d]) => <g key={x} transform={`translate(${x} ${y})`}>{[0, 1].map((n) => <ellipse key={n} className="sc-steam" style={after(Number(d) - n * 2.4)} rx="10" ry="13" fill="#fff" opacity=".4" />)}</g>)}

            {/* the video: a frame of marquee bulbs, and a big neon sign under it */}
            <rect x={tv.x - 34} y="-30" width={tv.w + 68} height={tv.y + tv.h + 68} rx="12" fill="#12081a" stroke="#2a1a12" strokeWidth="4" />
            <rect x={tv.x - 34} y="-30" width={tv.w + 68} height={tv.y + tv.h + 68} rx="12" fill="none" stroke={ORANGE} strokeOpacity=".3" strokeWidth="9" />
            {Array.from({ length: 28 }, (_, k) => k).map((k) => <g key={`bt${k}`}><circle className={k % 2 ? 'sc-twinkle' : undefined} style={k % 2 ? after(-k * 0.21) : undefined} cx={r1(tv.x - 22 + (k * (tv.w + 44)) / 27)} cy={tv.y + tv.h + 22} r="9" fill={BULB[k % 4]} opacity=".35" /><circle cx={r1(tv.x - 22 + (k * (tv.w + 44)) / 27)} cy={tv.y + tv.h + 22} r="4" fill={BULB[(k + 1) % 4]} /></g>)}
            {Array.from({ length: 13 }, (_, k) => k).flatMap((k) => [tv.x - 22, tv.x + tv.w + 22].map((x, i) => <g key={`bs${k}${i}`}><circle className={(k + i) % 2 ? 'sc-twinkle' : undefined} style={(k + i) % 2 ? after(-k * 0.3) : undefined} cx={x} cy={4 + k * 26} r="9" fill={BULB[(k + i) % 4]} opacity=".35" /><circle cx={x} cy={4 + k * 26} r="4" fill={BULB[(k + i + 1) % 4]} /></g>))}
            <rect x={tv.x - 9} y={tv.y - 9} width={tv.w + 18} height={tv.h + 18} rx="4" fill="#000" />
            <path d="M716 372V396M884 372V396" stroke="#2a1a12" strokeWidth="4" />
            <rect x="574" y="388" width="452" height="104" rx="16" fill="#12060a" stroke={ORANGE} strokeWidth="2.4" /><rect x="574" y="388" width="452" height="104" rx="16" fill="none" stroke={ORANGE} strokeOpacity=".28" strokeWidth="11" />
            {neon('TASTY', 800, 456, 70, YELLOW, 12)}
            <g fontFamily={font} fontWeight="800" fontSize="15" textAnchor="middle" letterSpacing="7" fill={ORANGE}><text x="800" y="480" opacity=".95">OPEN TILL LATE</text></g>
            {[[612, 1], [988, -1]].map(([x, s]) => (
                <g key={x} transform={`translate(${x} 440) scale(${s} 1)`} fill="none" stroke={YELLOW} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M-8 -24V-6Q-8 0 0 0Q8 0 8 -6V-24M0 -24V24" /><path d="M0 -24V24" strokeOpacity=".5" strokeWidth="9" />
                </g>
            ))}

            {/* the street: black and brown squares, warm light on some of them */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            <rect y={FLOOR - 4} width="1600" height="8" fill={ORANGE} opacity=".3" filter={`url(#${u('soft')})`} />
            {floorGrid(height).map(({ i, j }) => <polygon key={`${i}-${j}`} points={tile(i, j)} fill={(i + j) % 2 ? '#4a2a18' : '#090404'} opacity=".7" />)}
            {floorGrid(height).filter(({ i, j }) => (i * 7 + j * 3 + 100) % 5 === 0).map(({ i, j }) => <polygon key={`g${i}-${j}`} className="sc-tile" style={{ animationDelay: `${(((i + 20) * 13 + j * 7) % 24) / 10}s` }} points={tile(i, j)} fill={(i + j) % 2 ? ORANGE : YELLOW} opacity=".16" />)}
            <g stroke="#000" strokeOpacity=".5" strokeWidth="1.4">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>

            {/* a pizza under the booth */}
            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="420" ry="78" fill={f('pool')} />
                <ellipse cx="800" cy={ring + 10} rx="372" ry="66" fill="#000" opacity=".4" />
                <ellipse cx="800" cy={ring} rx="368" ry="64" fill="#e0a050" stroke="#a8641e" strokeWidth="3" />
                <ellipse cx="800" cy={ring - 3} rx="346" ry="57" fill={f('sauce')} />
                <ellipse cx="800" cy={ring - 3} rx="330" ry="52" fill="#ffd166" opacity=".85" />
                {Array.from({ length: 24 }, (_, k) => { const a = (k * Math.PI * 2) / 24 + 0.2; const rr = k % 2 ? 256 : 170; const cx = 800 + Math.cos(a) * rr; const cy = ring - 3 + Math.sin(a) * rr * 0.157; return <g key={k}><ellipse cx={r1(cx)} cy={r1(cy)} rx="21" ry="5.6" fill="#a51e26" /><ellipse cx={r1(cx - 4)} cy={r1(cy - 1)} rx="12" ry="2.6" fill="#d6404a" opacity=".7" /></g>; })}
                {Array.from({ length: 14 }, (_, k) => { const a = (k * Math.PI * 2) / 14 + 0.5; return <ellipse key={k} cx={r1(800 + Math.cos(a) * 300)} cy={r1(ring - 3 + Math.sin(a) * 300 * 0.157)} rx="11" ry="3.4" transform={`rotate(${(k * 40) % 180} ${r1(800 + Math.cos(a) * 300)} ${r1(ring - 3 + Math.sin(a) * 300 * 0.157)})`} fill="#3e9b3c" />; })}
                <ellipse cx="800" cy={ring - 3} rx="226" ry="38" fill="none" stroke="#fff6dc" strokeOpacity=".28" strokeWidth="2" strokeDasharray="4 10" />
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
