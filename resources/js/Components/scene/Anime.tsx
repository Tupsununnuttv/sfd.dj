import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { cloud } from '@/Components/scene/shapes';
import { after, floorGrid, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, floorTile as tile, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const BASE = 596; // where the city stands
const BURST = ['#ffd1e8', '#a5f3fc', '#fde68a', '#c4b5fd'];

// the stars, the city with its lit windows and the sparks of the fireworks: the same every time
const rs = rand(88);
const STARS = Array.from({ length: 90 }, () => ({ x: rs() * 1600, y: rs() ** 1.8 * 260, r: 0.5 + rs() * 1.2, o: 0.3 + rs() * 0.7 }));
const TOWERS = Array.from({ length: 40 }, (_, k) => {
    const x = k * 42 - 12 + rs() * 12;
    const side = x < 450 || x > 1130;

    return { x, w: 26 + rs() * 34, h: side ? 90 + rs() * 190 : 40 + rs() * 80, tank: rs() > 0.8, k };
});
const WINDOWS = TOWERS.flatMap((t) => Array.from({ length: Math.floor(t.h / 16) * 2 }, (_, i) => ({ x: t.x + 4 + (i % 2) * (t.w / 2 - 1), y: BASE - 10 - Math.floor(i / 2) * 16 - 8, lit: rs() > 0.5, c: rs() > 0.6 ? '#ffd9a0' : '#ffeaa8', blink: rs() > 0.95 }))).filter((w) => w.lit);
const BURSTS = [{ x: 190, y: 170, c: 0, s: 1, d: 0 }, { x: 360, y: 300, c: 1, s: 0.75, d: -1.8 }, { x: 1390, y: 190, c: 2, s: 1.05, d: -0.9 }, { x: 1230, y: 330, c: 3, s: 0.7, d: -3.2 }];
const LANTERNS = ['#ef4444', '#fb923c', '#f472b6', '#ef4444', '#fbbf24', '#fb923c'];

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * The anime scenery on a 1600 x 900 canvas, in the way of the films: a summer evening on a rooftop in the city. A sky that runs from deep blue to pink and gold
 * with towering clouds, a comet and fireworks, the skyline with a tower, a train that crosses on the viaduct, paper lanterns, a chain-link fence with a cat on it,
 * a glowing vending machine, and a magic circle under the booth. Cherry blossom falls over the room (Snow.tsx). Like the others it only moves while a song plays (`live`).
 */
export default function AnimeBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down
    const left = tv.x - 18;
    const right = tv.x + tv.w + 18;
    const ring = SCENE.booth.y + 100;

    const burst = (b: (typeof BURSTS)[number], i: number) => (
        <g key={i} transform={`translate(${b.x} ${b.y}) scale(${b.s})`}>
            <g className="sc-burst" style={after(b.d)}>
                {Array.from({ length: 20 }, (_, k) => {
                    const a = (k * Math.PI * 2) / 20;
                    const l = k % 2 ? 54 : 78;

                    return <g key={k}><path d={`M${r1(Math.cos(a) * 18)} ${r1(Math.sin(a) * 18)}L${r1(Math.cos(a) * l)} ${r1(Math.sin(a) * l)}`} stroke={BURST[b.c]} strokeWidth="3" strokeLinecap="round" /><circle cx={r1(Math.cos(a) * (l + 8))} cy={r1(Math.sin(a) * (l + 8))} r="2.6" fill="#fff" /></g>;
                })}
                <circle r="10" fill="#fff" opacity=".9" /><circle r="34" fill={BURST[b.c]} opacity=".18" />
            </g>
        </g>
    );

    const lanternString = (x0: number, y0: number, x1: number, y1: number, sag: number, k: string, seed: number) => (
        <g key={k}>
            <path d={`M${x0} ${y0}Q${(x0 + x1) / 2} ${(y0 + y1) / 2 + sag} ${x1} ${y1}`} fill="none" stroke="#3a2a4a" strokeWidth="2" />
            {Array.from({ length: 6 }, (_, i) => {
                const t = (i + 0.5) / 6;
                const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * ((x0 + x1) / 2) + t * t * x1;
                const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * ((y0 + y1) / 2 + sag) + t * t * y1;

                return (
                    <g key={i} className={i % 2 ? undefined : 'sc-dangle'} style={i % 2 ? undefined : after(-(i + seed) * 0.6)}>
                        <path d={`M${r1(x)} ${r1(y)}V${r1(y + 8)}`} stroke="#3a2a4a" strokeWidth="1.6" />
                        <ellipse cx={r1(x)} cy={r1(y + 24)} rx="20" ry="22" fill={f('glowWarm')} opacity=".7" />
                        <ellipse cx={r1(x)} cy={r1(y + 24)} rx="11" ry="14" fill={LANTERNS[(i + seed) % 6]} stroke="#7f1d1d" strokeWidth="1" />
                        <path d={`M${r1(x - 7)} ${r1(y + 14)}Q${r1(x)} ${r1(y + 24)} ${r1(x - 7)} ${r1(y + 34)}M${r1(x + 7)} ${r1(y + 14)}Q${r1(x)} ${r1(y + 24)} ${r1(x + 7)} ${r1(y + 34)}`} stroke="#7f1d1d" strokeWidth=".8" fill="none" opacity=".6" />
                        <rect x={r1(x - 5)} y={r1(y + 8)} width="10" height="3.4" fill="#3a2a4a" /><rect x={r1(x - 5)} y={r1(y + 36)} width="10" height="3.4" fill="#3a2a4a" />
                    </g>
                );
            })}
        </g>
    );

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('sky')} x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#1b2a6b" /><stop offset=".22" stopColor="#4256b4" /><stop offset=".45" stopColor="#b567b9" /><stop offset=".68" stopColor="#ff8fa3" /><stop offset=".86" stopColor="#ffc89a" /><stop offset="1" stopColor="#fff0cf" />
                </linearGradient>
                <radialGradient id={u('glowWarm')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffd27a" stopOpacity=".9" /><stop offset=".5" stopColor="#ffa940" stopOpacity=".3" /><stop offset="1" stopColor="#ff9a1f" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('horizonGlow')} cx="800" cy={BASE} r="700" gradientUnits="userSpaceOnUse"><stop stopColor="#fff3c8" stopOpacity=".85" /><stop offset=".4" stopColor="#ffb089" stopOpacity=".3" /><stop offset="1" stopColor="#ff8fa3" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('tail')} x1="1" y1="0" x2="0" y2="1"><stop stopColor="#e0f7ff" stopOpacity="0" /><stop offset="1" stopColor="#e0f7ff" stopOpacity=".95" /></linearGradient>
                <linearGradient id={u('far')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8a5fb0" /><stop offset="1" stopColor="#5a3d8a" /></linearGradient>
                <linearGradient id={u('near')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#2f2a66" /><stop offset="1" stopColor="#15123a" /></linearGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <linearGradient id={u('horizon')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffb089" stopOpacity="0" /><stop offset=".5" stopColor="#ffb089" stopOpacity=".35" /><stop offset="1" stopColor="#ffb089" stopOpacity="0" /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffd1e8" stopOpacity=".55" /><stop offset=".6" stopColor="#a5b4fc" stopOpacity=".2" /><stop offset="1" stopColor="#a5b4fc" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#b567b9" stopOpacity="0" /><stop offset="1" stopColor="#0a0820" stopOpacity=".6" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#10082a" stopOpacity=".5" /></radialGradient>
                <pattern id={u('mesh')} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0H14M0 0V14" stroke="#cbd5f0" strokeWidth="1.2" opacity=".6" fill="none" /></pattern>
            </defs>

            {/* the sky: stars, clouds with a lit edge, a comet, fireworks */}
            <rect width="1600" height="650" fill={f('sky')} />
            {STARS.map((s, k) => <circle key={k} className={k % 12 === 0 ? 'sc-star' : undefined} style={k % 12 === 0 ? after((k * 0.37) % 2.6) : undefined} cx={r1(s.x)} cy={r1(s.y)} r={r1(s.r)} fill="#fff" opacity={r1(s.o)} />)}
            <circle cx="800" cy={BASE} r="700" fill={f('horizonGlow')} />
            <g className="sc-drift">{cloud('c1', 150, 420, 1.5, '#ffd2e0', '#d08ac0')}{cloud('c3', 1330, 440, 1.6, '#ffe0c8', '#e08aa8')}</g>
            <g className="sc-drift" style={after(-5)}>{cloud('c2', 380, 250, 1.0, '#e9d6ff', '#9a79c9')}{cloud('c4', 1500, 300, 1.2, '#ffd9e6', '#c47fb4')}</g>
            <g className="sc-comet"><g transform="translate(1320 90) rotate(34)">
                <path d="M0 0L330 -10L330 10Z" fill={f('tail')} /><path d="M0 0L220 -26L220 -12Z" fill={f('tail')} opacity=".6" />
                <circle r="22" fill="#bfeeff" opacity=".4" /><circle r="9" fill="#fff" />
            </g></g>
            {BURSTS.map(burst)}

            {/* the city: a tower, the skyline with its windows, the viaduct and the train that crosses it */}
            {TOWERS.filter((t) => t.k % 2 === 0).map((t) => <rect key={t.k} x={r1(t.x - 6)} y={r1(BASE - t.h * 1.25)} width={r1(t.w + 12)} height={r1(t.h * 1.25)} fill={f('far')} />)}
            {TOWERS.map((t) => (
                <g key={t.k}>
                    <rect x={r1(t.x)} y={r1(BASE - t.h)} width={r1(t.w)} height={r1(t.h)} fill={f('near')} />
                    {t.tank && <g><rect x={r1(t.x + t.w * 0.3)} y={r1(BASE - t.h - 18)} width={r1(t.w * 0.4)} height="18" rx="3" fill="#1d1950" /><path d={`M${r1(t.x + t.w * 0.4)} ${r1(BASE - t.h)}V${r1(BASE - t.h - 18)}`} stroke="#1d1950" strokeWidth="2" /></g>}
                    {t.k % 3 === 0 && <path d={`M${r1(t.x + t.w / 2)} ${r1(BASE - t.h)}V${r1(BASE - t.h - 24)}`} stroke="#2f2a66" strokeWidth="2" />}
                    <path d={`M${r1(t.x)} ${r1(BASE - t.h)}H${r1(t.x + t.w)}`} stroke="#ffb7d5" strokeOpacity=".5" strokeWidth="1.6" />
                </g>
            ))}
            <g transform="translate(372 600)">
                <path d="M-34 0L-6 -230L6 -230L34 0M-22 -80H22M-14 -150H14M-9 -200H9" stroke="#e8523a" strokeWidth="5" strokeLinejoin="round" fill="none" />
                <path d="M-28 -60H28M-18 -118H18" stroke="#fff" strokeWidth="4" /><path d="M0 -230V-262" stroke="#e8523a" strokeWidth="3" /><circle className="sc-flame" cx="0" cy="-264" r="5" fill="#ff5a5a" />
            </g>
            {WINDOWS.map((w, k) => <rect key={k} className={w.blink ? 'sc-twinkle' : undefined} style={w.blink ? after(-k * 0.13) : undefined} x={r1(w.x)} y={r1(w.y)} width="5" height="8" fill={w.c} opacity=".9" />)}
            <rect y={BASE - 4} width="1600" height="8" fill="#1d1950" />
            <g stroke="#1d1950" strokeWidth="7">{Array.from({ length: 17 }, (_, i) => <path key={i} d={`M${i * 100 + 20} ${BASE + 4}V${BASE + 32}`} />)}</g>
            <rect y={BASE + 2} width="1600" height="6" fill="#4a4590" />
            <g className="sc-train"><g transform={`translate(220 ${BASE - 18})`}>
                {Array.from({ length: 6 }, (_, i) => (
                    <g key={i} transform={`translate(${i * 98} 0)`}>
                        <rect width="92" height="22" rx="5" fill="#e8ecf8" /><rect y="14" width="92" height="4" fill="#38bdf8" /><rect y="19" width="92" height="3" fill="#6366f1" />
                        {[8, 30, 52, 74].map((x) => <rect key={x} x={x} y="4" width="12" height="9" rx="1.5" fill="#ffe9a0" />)}
                    </g>
                ))}
                <ellipse cx="300" cy="8" rx="380" ry="20" fill={f('glowWarm')} opacity=".22" />
            </g></g>
            <g transform="translate(116 540)">
                <path d="M0 56V0M-26 6H26" stroke="#2f2a66" strokeWidth="3" /><rect x="-18" y="0" width="36" height="8" rx="3" fill="#1d1950" />
                <circle className="sc-twinkle" cx="-12" cy="14" r="6" fill="#ff3a4a" /><circle className="sc-twinkle" style={after(-0.75)} cx="12" cy="14" r="6" fill="#ff3a4a" />
                <circle cx="-12" cy="14" r="14" fill="#ff3a4a" opacity=".2" /><circle cx="12" cy="14" r="14" fill="#ff3a4a" opacity=".2" />
            </g>

            {/* the frame the video hangs in: paper lanterns on strings, a soft white frame */}
            {[24, 16, 9].map((g, i) => <rect key={g} x={tv.x - g - 18} y={tv.y - g - 22} width={tv.w + 36 + g * 2} height={tv.h + 36 + g * 2} rx={18 + g} fill="#ffd1e8" opacity={0.05 + i * 0.04} />)}
            <rect x={tv.x - 18} y={tv.y - 22} width={tv.w + 36} height={tv.h + 36} rx="16" fill="#0c0a26" stroke="#fff" strokeWidth="5" />
            <rect x={tv.x - 18} y={tv.y - 22} width={tv.w + 36} height={tv.h + 36} rx="16" fill="none" stroke="#ffb7d5" strokeWidth="1.6" strokeOpacity=".8" transform="translate(0 0)" />
            {lanternString(-10, 70, left - 4, 40, 70, 'ls1', 0)}{lanternString(right + 4, 40, 1610, 70, 70, 'ls2', 2)}
            {[left + 4, right - 4].map((x, i) => <g key={x} transform={`translate(${x} ${tv.y + tv.h + 14})`}><path d="M0 0C-24 -18 -36 -4 -26 8C-18 18 -6 12 0 0ZM0 0C24 -18 36 -4 26 8C18 18 6 12 0 0Z" fill="#ff7aa8" stroke="#a02050" strokeWidth="1.2" /><circle r="5.5" fill="#ff4f8a" stroke="#a02050" strokeWidth="1.2" /><path d={i ? 'M3 4L18 34' : 'M-3 4L-18 34'} stroke="#ff7aa8" strokeWidth="5" strokeLinecap="round" /></g>)}

            {/* the rooftop: concrete, a fence with a cat on it, a vending machine */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            <rect y={FLOOR - 26} width="1600" height="84" fill={f('horizon')} />
            {floorGrid(height).map(({ i, j }) => ((i * 5 + j * 11 + 100) % 7 < 3 ? <polygon key={`${i}-${j}`} points={tile(i, j)} fill={(i + j) % 2 ? '#ffffff' : '#7a6aa8'} opacity=".07" /> : null))}
            <g stroke="#e6dcff" strokeOpacity=".16" strokeWidth="1.2">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>
            <g>
                <rect x="0" y="560" width="1600" height="64" fill={f('mesh')} opacity=".55" />
                <rect x="0" y="558" width="1600" height="5" fill="#cbd5f0" /><rect x="0" y="620" width="1600" height="5" fill="#cbd5f0" />
                {Array.from({ length: 15 }, (_, i) => <rect key={i} x={i * 114 + 10} y="556" width="6" height="72" rx="3" fill="#b8c2e0" />)}
            </g>
            <g transform="translate(560 560)">
                <path d="M-18 0C-24 -22 -18 -44 -4 -48C6 -64 -8 -72 -10 -80L-4 -74L0 -86L4 -74L10 -80C8 -72 18 -64 8 -48C22 -44 26 -22 18 0Z" fill="#1c1738" />
                <path className="sc-kick" style={{ transformOrigin: '0% 100%' }} d="M16 -4C34 -4 44 -18 40 -34C38 -40 32 -38 34 -32C36 -22 30 -14 16 -12Z" fill="#1c1738" />
                <ellipse cx="-3" cy="-56" rx="3" ry="4" fill="#a7f3d0" className="sc-flame" /><ellipse cx="7" cy="-56" rx="3" ry="4" fill="#a7f3d0" className="sc-flame" />
            </g>
            <g transform="translate(1456 668)">
                <ellipse cx="0" cy="8" rx="60" ry="9" fill="#000" opacity=".35" />
                <rect x="-44" y="-132" width="88" height="138" rx="9" fill="#d9304a" stroke="#8a1830" strokeWidth="2.4" />
                <rect x="-36" y="-122" width="56" height="86" rx="4" fill="#fff6d6" /><ellipse cx="0" cy="-80" rx="90" ry="100" fill={f('glowWarm')} opacity=".25" />
                {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={-32 + c * 18} y={-116 + r * 26} width="12" height="20" rx="3" fill={['#38bdf8', '#f472b6', '#a3e635', '#fbbf24', '#fb7185', '#34d399', '#c084fc', '#f97316', '#22d3ee'][r * 3 + c]} />))}
                <rect x="24" y="-122" width="14" height="52" rx="3" fill="#2a1430" /><circle className="sc-twinkle" cx="31" cy="-112" r="3" fill="#a3e635" /><rect x="-30" y="-24" width="60" height="22" rx="4" fill="#2a1430" />
            </g>

            {/* a magic circle under the booth */}
            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="400" ry="74" fill={f('pool')} />
                <g transform={`translate(800 ${ring}) scale(340 58)`} fill="none" stroke="#fff" strokeLinejoin="round" strokeLinecap="round">
                    <circle r="1" strokeWidth="2.6" vectorEffect="non-scaling-stroke" stroke="#ffd1e8" /><circle r="1" strokeWidth="9" vectorEffect="non-scaling-stroke" stroke="#ffd1e8" opacity=".25" />
                    <circle r="0.84" strokeWidth="1.4" vectorEffect="non-scaling-stroke" strokeDasharray="3 8" opacity=".85" />
                    <path d="M0 -0.8L0.69 0.4L-0.69 0.4ZM0 0.8L0.69 -0.4L-0.69 -0.4Z" strokeWidth="2" vectorEffect="non-scaling-stroke" stroke="#a5f3fc" />
                    <path d={Array.from({ length: 5 }, (_, k) => { const a = (k * Math.PI * 2) / 5 - Math.PI / 2; return `M0 0C${r1(Math.cos(a - 0.4) * 0.3 * 100) / 100} ${r1(Math.sin(a - 0.4) * 0.3 * 100) / 100} ${r1(Math.cos(a - 0.22) * 0.55 * 100) / 100} ${r1(Math.sin(a - 0.22) * 0.55 * 100) / 100} ${r1(Math.cos(a) * 0.6 * 100) / 100} ${r1(Math.sin(a) * 0.6 * 100) / 100}C${r1(Math.cos(a + 0.22) * 0.55 * 100) / 100} ${r1(Math.sin(a + 0.22) * 0.55 * 100) / 100} ${r1(Math.cos(a + 0.4) * 0.3 * 100) / 100} ${r1(Math.sin(a + 0.4) * 0.3 * 100) / 100} 0 0Z`; }).join('')} strokeWidth="2" vectorEffect="non-scaling-stroke" stroke="#ff9ec8" />
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
