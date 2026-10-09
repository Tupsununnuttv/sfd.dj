import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { after, floorGrid, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, floorTile as tile, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const font = 'Figtree, system-ui, sans-serif';
const BASE = 604; // the waterfront the city stands on
const NEON = ['#ff6ac1', '#2de2c8', '#ffd24a', '#8b5cf6'];

// the skyline, its lit windows, the stars and the shapes that float in the sky: the same every time
const rs = rand(19);
const TOWERS = Array.from({ length: 34 }, (_, k) => {
    const x = k * 50 - 10 + rs() * 14;
    const side = x < 460 || x > 1140;

    return { x, w: 34 + rs() * 30, h: (side ? 120 + rs() * 190 : 50 + rs() * 90), step: rs() > 0.5, k };
});
const WINDOWS = TOWERS.flatMap((t) => Array.from({ length: Math.floor(t.h / 22) * 2 }, (_, i) => ({ x: t.x + 6 + (i % 2) * (t.w / 2 - 2), y: BASE - 10 - Math.floor(i / 2) * 22 - 10, lit: rs() > 0.55, c: NEON[Math.floor(rs() * 4)], blink: rs() > 0.93 }))).filter((w) => w.lit);
const STARS = Array.from({ length: 70 }, () => ({ x: rs() * 1600, y: rs() ** 1.5 * 330, r: 0.5 + rs() * 1.2, o: 0.3 + rs() * 0.6 }));
const SHAPES = [
    { x: 120, y: 120, k: 'tri', c: '#2de2c8', s: 1, r: -12 }, { x: 330, y: 240, k: 'ring', c: '#ffd24a', s: 1, r: 0 }, { x: 70, y: 330, k: 'zig', c: '#ff6ac1', s: 1, r: 0 },
    { x: 360, y: 90, k: 'plus', c: '#ff6ac1', s: 1, r: 0 }, { x: 1250, y: 110, k: 'ring', c: '#2de2c8', s: 1, r: 0 }, { x: 1480, y: 190, k: 'tri', c: '#ffd24a', s: 1.1, r: 14 },
    { x: 1340, y: 300, k: 'zig', c: '#8b5cf6', s: 1, r: 0 }, { x: 1540, y: 60, k: 'plus', c: '#2de2c8', s: 1, r: 0 }, { x: 1220, y: 230, k: 'dots', c: '#ff6ac1', s: 1, r: 0 }, { x: 200, y: 230, k: 'dots', c: '#ffd24a', s: 1, r: 0 },
];

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * The retrowave scenery on a 1600 x 900 canvas: a hot 80s evening on the waterfront. A huge sun going down behind an art deco skyline with lit windows,
 * shapes from the 80s floating in the sky, palms in silhouette, a boombox and an arcade machine, the video in a TV with a console under it, and a
 * dance floor of light-up tiles with a vinyl record under the booth. Like the others it only moves while a song plays (`live`): windows and tiles blink,
 * the shapes float, the speakers of the boombox pump, the arcade machine plays and the palms sway.
 */
export default function RetrowaveBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down

    const shape = (s: (typeof SHAPES)[number], i: number) => (
        <g key={i} className={i % 2 ? undefined : 'sc-bob'} style={i % 2 ? undefined : after(-i * 0.3)}>
            <g transform={`translate(${s.x} ${s.y}) rotate(${s.r}) scale(${s.s})`} fill="none" stroke={s.c} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                {s.k === 'tri' && <path d="M0 -24L24 18H-24Z" />}
                {s.k === 'ring' && <circle r="18" />}
                {s.k === 'zig' && <path d="M-34 8L-17 -8L0 8L17 -8L34 8" />}
                {s.k === 'plus' && <path d="M0 -16V16M-16 0H16" />}
                {s.k === 'dots' && <g fill={s.c} stroke="none">{[0, 1, 2, 3].map((a) => <g key={a}>{[0, 1, 2, 3].map((b) => <circle key={b} cx={a * 12 - 18} cy={b * 12 - 18} r="2.6" />)}</g>)}</g>}
            </g>
        </g>
    );

    const palm = (x: number, y: number, sc: number, flip: number, k: string) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${sc * flip} ${sc})`}>
            <g className="sc-palm">
                <path d="M0 0C20 -100 -10 -200 26 -290" fill="none" stroke="#0c0424" strokeWidth="18" strokeLinecap="round" />
                <g transform="translate(26 -290)" fill="#0c0424" stroke="#ffa24a" strokeOpacity=".75" strokeWidth="1.6">
                    {[-176, -140, -104, -70, -36, -4, 24].map((a, i) => <path key={a} transform={`rotate(${a})`} d={`M0 0C${40 + (i % 2) * 6} -44 ${96 + (i % 3) * 8} -40 ${132 + (i % 3) * 10} 14C96 -16 40 -12 0 0Z`} />)}
                </g>
            </g>
        </g>
    );

    const left = tv.x - 18;
    const right = tv.x + tv.w + 18;
    const bottom = tv.y + tv.h + 14;

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('sky')} x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#150836" /><stop offset=".28" stopColor="#5a1a8f" /><stop offset=".55" stopColor="#ff4f8b" /><stop offset=".78" stopColor="#ff9a4a" /><stop offset="1" stopColor="#ffd86a" />
                </linearGradient>
                <linearGradient id={u('sun')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff09a" /><stop offset=".45" stopColor="#ffb347" /><stop offset="1" stopColor="#ff4f8b" /></linearGradient>
                <radialGradient id={u('sunGlow')} cx="800" cy={BASE} r="560" gradientUnits="userSpaceOnUse"><stop stopColor="#ffe08a" stopOpacity=".75" /><stop offset=".45" stopColor="#ff8a5a" stopOpacity=".25" /><stop offset="1" stopColor="#ff4f8b" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('far')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#5b2397" /><stop offset="1" stopColor="#2d0f5e" /></linearGradient>
                <linearGradient id={u('near')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#25104d" /><stop offset="1" stopColor="#0e0524" /></linearGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <linearGradient id={u('quay')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ff9a4a" stopOpacity=".7" /><stop offset="1" stopColor="#1a0b3d" /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#ff9ad5" stopOpacity=".5" /><stop offset=".6" stopColor="#2de2c8" stopOpacity=".16" /><stop offset="1" stopColor="#2de2c8" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8b5cf6" stopOpacity="0" /><stop offset="1" stopColor="#050b1a" stopOpacity=".65" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".55" /></radialGradient>
                <radialGradient id={u('glow')} cx=".5" cy=".5" r=".5"><stop stopColor="#fff" stopOpacity=".8" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('chrome')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f5f5f7" /><stop offset=".5" stopColor="#b8bcc8" /><stop offset="1" stopColor="#6b7080" /></linearGradient>
                <clipPath id={u('sunClip')}><path d={`M560 ${BASE}A240 240 0 0 1 1040 ${BASE}Z`} /></clipPath>
            </defs>

            {/* the sky: stars, floating shapes, the sun */}
            <rect width="1600" height="650" fill={f('sky')} />
            {STARS.map((s, k) => <circle key={k} className={k % 10 === 0 ? 'sc-star' : undefined} style={k % 10 === 0 ? after((k * 0.37) % 2.6) : undefined} cx={r1(s.x)} cy={r1(s.y)} r={r1(s.r)} fill="#fff" opacity={r1(s.o)} />)}
            <circle cx="800" cy={BASE} r="560" fill={f('sunGlow')} />
            <g clipPath={f('sunClip')}>
                <rect x="560" y={BASE - 240} width="480" height="240" fill={f('sun')} />
                {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x="560" y={BASE - 150 + i * 24} width="480" height={3 + i * 1.4} fill="#5a1a8f" opacity=".75" />)}
            </g>
            {SHAPES.map(shape)}

            {/* the skyline on the waterfront */}
            {TOWERS.filter((t) => t.k % 2 === 0).map((t) => <path key={t.k} d={`M${r1(t.x - 8)} ${BASE}V${r1(BASE - t.h * 1.15)}H${r1(t.x + t.w * 0.6)}V${BASE}Z`} fill={f('far')} />)}
            {TOWERS.map((t) => (
                <g key={t.k}>
                    <path d={t.step
                        ? `M${r1(t.x)} ${BASE}V${r1(BASE - t.h)}H${r1(t.x + t.w * 0.2)}V${r1(BASE - t.h - 18)}H${r1(t.x + t.w * 0.8)}V${r1(BASE - t.h)}H${r1(t.x + t.w)}V${BASE}Z`
                        : `M${r1(t.x)} ${BASE}V${r1(BASE - t.h)}L${r1(t.x + t.w / 2)} ${r1(BASE - t.h - 14)}L${r1(t.x + t.w)} ${r1(BASE - t.h)}V${BASE}Z`} fill={f('near')} />
                    {t.k % 3 === 0 && <path d={`M${r1(t.x + t.w / 2)} ${r1(BASE - t.h - 14)}V${r1(BASE - t.h - 40)}`} stroke="#ff6ac1" strokeWidth="2.4" />}
                    <path d={`M${r1(t.x)} ${r1(BASE - t.h)}H${r1(t.x + t.w)}`} stroke={NEON[t.k % 4]} strokeWidth="2" opacity=".8" />
                </g>
            ))}
            {WINDOWS.map((w, k) => <rect key={k} className={w.blink ? 'sc-twinkle' : undefined} style={w.blink ? after(-k * 0.13) : undefined} x={r1(w.x)} y={r1(w.y)} width="7" height="10" fill={w.c} opacity=".85" />)}
            <rect y={BASE} width="1600" height="30" fill={f('quay')} />
            {Array.from({ length: 16 }, (_, i) => <rect key={i} x={560 + i * 30 - (i % 2) * 8} y={BASE + 4 + (i % 4) * 5} width={34 - (i % 3) * 8} height="3" rx="1.5" fill="#ffe08a" opacity=".55" />)}

            {/* the frame the video hangs in: a TV with a console under it */}
            {[22, 14, 8].map((g, i) => <rect key={g} x={tv.x - g - 18} y={tv.y - g - 22} width={tv.w + 36 + g * 2} height={tv.h + 36 + g * 2 + 34} rx={22 + g} fill="#ff6ac1" opacity={0.04 + i * 0.04} />)}
            <rect x={tv.x - 24} y={tv.y - 28} width={tv.w + 48} height={tv.h + 82} rx="22" fill="#e9dfc6" stroke="#a89c7c" strokeWidth="2" />
            <rect x={tv.x - 24} y={tv.y - 28} width={tv.w + 48} height={tv.h + 82} rx="22" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1.2" transform="translate(1 1)" />
            {['#ff6ac1', '#ffd24a', '#2de2c8'].map((c, i) => <rect key={c} x={tv.x - 16} y={bottom + 8 + i * 8} width={tv.w + 32} height="3.2" fill={c} />)}
            <rect x={tv.x - 18} y={tv.y - 22} width={tv.w + 36} height={tv.h + 36} rx="14" fill="#07030f" stroke="#3a3a46" strokeWidth="5" />
            <g>
                {Array.from({ length: 10 }, (_, i) => <rect key={i} x={left + 24 + i * 9} y={bottom + 30} width="4" height="14" rx="2" fill="#8c8068" />)}
                {Array.from({ length: 10 }, (_, i) => <rect key={i} x={right - 24 - 90 + i * 9 - 80} y={bottom + 30} width="4" height="14" rx="2" fill="#8c8068" />)}
                <rect x={(left + right) / 2 - 52} y={bottom + 28} width="104" height="18" rx="9" fill="#1a1030" stroke="#8c8068" strokeWidth="1.6" />
                <text x="800" y={bottom + 41} textAnchor="middle" fontFamily={font} fontWeight="900" fontStyle="italic" fontSize="12" letterSpacing="2" fill="#ff9ad5">SFD.DJ</text>
                {[right - 66, right - 36].map((x, i) => <g key={x}><circle cx={x} cy={bottom + 37} r="11" fill={f('chrome')} stroke="#5a5e6e" strokeWidth="1.4" /><path d={`M${x} ${bottom + 37}l${i ? 6 : -4} ${i ? -6 : -8}`} stroke="#2a2d3a" strokeWidth="2.4" strokeLinecap="round" /></g>)}
                <circle className="sc-flame" cx={right - 98} cy={bottom + 37} r="3.4" fill="#ff3a5a" />
            </g>

            {/* the floor: light-up tiles */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            {floorGrid(height).map(({ i, j }) => {
                const lit = (i * 7 + j * 3 + 100) % 11 === 0;

                return <polygon key={`${i}-${j}`} className={lit ? 'sc-tile' : undefined} style={lit ? after(((i + 20) * 13 + j * 7) % 24 / 10) : undefined} points={tile(i, j)} fill={lit ? '#ffffff' : (i + j) % 2 ? '#ff6ac1' : '#2de2c8'} opacity={lit ? 0.2 : 0.15} />;
            })}
            <g stroke="#ffffff" strokeOpacity=".16" strokeWidth="1.2">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>

            {/* a boombox, an arcade machine, palms */}
            <g transform="translate(150 806)">
                <ellipse cx="0" cy="6" rx="108" ry="10" fill="#000" opacity=".4" />
                <path d="M-60 -92Q0 -118 60 -92" fill="none" stroke="#9aa0b0" strokeWidth="6" strokeLinecap="round" />
                <rect x="-96" y="-92" width="192" height="92" rx="14" fill="#22252f" stroke="#9aa0b0" strokeWidth="3" />
                <rect x="-90" y="-86" width="180" height="14" rx="6" fill={f('chrome')} opacity=".6" />
                <rect x="-26" y="-70" width="52" height="30" rx="4" fill="#0c0f16" stroke="#6b7080" strokeWidth="1.6" /><rect x="-20" y="-64" width="40" height="18" rx="3" fill="#ffe08a" opacity=".85" /><circle cx="-8" cy="-55" r="5" fill="#3a2410" /><circle cx="8" cy="-55" r="5" fill="#3a2410" />
                {[-60, 60].map((x, i) => (
                    <g key={x}>
                        <circle cx={x} cy="-38" r="26" fill="#0c0f16" stroke="#9aa0b0" strokeWidth="2.4" />
                        <circle className="sc-pulse" style={after(-i * 0.4)} cx={x} cy="-38" r="17" fill="#2d3040" stroke="#ff6ac1" strokeWidth="2" /><circle cx={x} cy="-38" r="6" fill="#ff6ac1" />
                    </g>
                ))}
                {[-14, 0, 14].map((x, i) => <rect key={x} x={x - 4} y="-30" width="8" height="12" rx="2" fill={NEON[i]} />)}
                <path d="M70 -92L96 -150" stroke="#9aa0b0" strokeWidth="3" strokeLinecap="round" /><circle cx="96" cy="-152" r="4" fill="#ff6ac1" />
            </g>
            <g transform="translate(1530 852)">
                <ellipse cx="0" cy="4" rx="70" ry="9" fill="#000" opacity=".4" />
                <path d="M-48 0L-44 -150L-30 -176H30L44 -150L48 0Z" fill="#161a3a" stroke="#2de2c8" strokeWidth="2.4" strokeLinejoin="round" />
                <path d="M-40 -6L-37 -146M40 -6L37 -146" stroke="#ff6ac1" strokeWidth="4" opacity=".9" />
                <rect x="-30" y="-150" width="60" height="50" rx="5" fill="#03040c" stroke="#8b5cf6" strokeWidth="2" />
                <g className="sc-flame" fill="#2de2c8">
                    {[[-18, -140], [-6, -140], [6, -140], [18, -140], [-12, -130], [12, -130], [-18, -120], [-6, -120], [6, -120], [18, -120], [-12, -110], [12, -110]].map(([x, y]) => <rect key={`${x}${y}`} x={x - 4} y={y - 4} width="7" height="7" />)}
                </g>
                <path d="M-36 -92H36L40 -80H-40Z" fill="#0e1130" stroke="#8b5cf6" strokeWidth="1.6" />
                <circle cx="-14" cy="-86" r="4" fill="#ffd24a" /><path d="M14 -90V-84" stroke="#ff6ac1" strokeWidth="5" strokeLinecap="round" /><circle cx="22" cy="-86" r="3.4" fill="#2de2c8" />
                <path d="M-30 -176H30L26 -190H-26Z" fill="#ff6ac1" /><text x="0" y="-179" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize="9" fill="#150836">ARCADE</text>
            </g>
            {palm(60, 790, 0.78, 1, 'pl')}{palm(1560, 800, 0.8, -1, 'pr')}

            {/* a vinyl record under the booth */}
            <g transform={`translate(0 ${ext})`}>
            <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="400" ry="74" fill={f('pool')} />
            <g transform={`translate(800 ${SCENE.booth.y + 100}) scale(340 58)`}>
                <circle r="1" fill="#0a0818" stroke="#ff6ac1" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
                {[0.9, 0.8, 0.7, 0.6].map((r) => <circle key={r} r={r} fill="none" stroke="#fff" strokeOpacity=".08" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />)}
                <path d="M0 0L-0.7 -0.7A1 1 0 0 1 0.7 -0.7Z" fill="#fff" opacity=".07" /><path d="M0 0L0.7 0.7A1 1 0 0 1 -0.7 0.7Z" fill="#fff" opacity=".07" />
                <circle r="0.34" fill="#ff6ac1" /><circle r="0.34" fill="none" stroke="#ffd24a" strokeWidth="2" vectorEffect="non-scaling-stroke" /><circle r="0.05" fill="#0a0818" />
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
