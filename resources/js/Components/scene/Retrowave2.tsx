import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { after, floorGrid, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const font = 'Figtree, system-ui, sans-serif';
const HORIZON = 512; // where the sea meets the sky

const rs = rand(1987);
const STARS = Array.from({ length: 90 }, () => ({ x: rs() * 1600, y: rs() ** 2 * 300, r: 0.4 + rs() * 1.2, o: 0.25 + rs() * 0.6 }));
// long thin clouds lit from below by the sun: [x, y, width, delay]
const CLOUDS: [number, number, number, number][] = [[60, 120, 380, 0], [1180, 92, 420, -3], [180, 300, 300, -5], [1220, 268, 330, -1.5], [40, 420, 260, -7], [1330, 404, 250, -2.6]];
const SUN_BARS = [4, 6, 8, 11, 14, 17];
const GULLS: [number, number, number][] = [[640, 300, 1], [700, 322, 0.75], [960, 280, 0.9]];

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * Retrowave V2 on a 1600 x 900 canvas: an 80s beach at sunset. A striped sun goes down into the sea and lays a road of light on the water, long clouds
 * glow pink and gold, gulls glide past. On the left a beach with palms and a neon flamingo sign, on the right a pier with lamps and a neon Ferris wheel.
 * The video hangs in a chrome and teal frame with the name in chrome under it, the dance floor is a teal and pink grid, and faint VHS lines lie over it all.
 * While a song plays (`live`) the wheel turns, the clouds and gulls drift, the water shimmers, the sun's stripes slide and the floor tiles flash.
 */
export default function Retrowave2Backdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h);

    const palm = (x: number, y: number, s: number, flip: number, k: string) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s * flip} ${s})`}>
            <g className="sc-palm" style={after(-k.length * 0.8)}>
                <path d="M0 0C-16 -90 18 -170 -6 -250" fill="none" stroke="#14052b" strokeWidth="16" strokeLinecap="round" />
                {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${-9 + (i % 2) * 4} ${-24 - i * 28}l16 -5`} stroke="#ff8fb8" strokeOpacity=".35" strokeWidth="1.4" />)}
                <g transform="translate(-6 -250)" fill="#14052b" stroke="#ff6ac1" strokeOpacity=".7" strokeWidth="1.6" strokeLinejoin="round">
                    {[-206, -170, -136, -104, -76, -44, -10, 26].map((a, i) => (
                        <path key={a} transform={`rotate(${a})${a < -90 ? ' scale(1 -1)' : ''}`} d={`M0 0C${38 + (i % 2) * 7} -46 ${92 + (i % 3) * 9} -42 ${130 + (i % 3) * 10} 14C${96} -14 ${44} -10 0 0Z`} />
                    ))}
                    <circle cx="4" cy="6" r="6" fill="#2a0c3f" /><circle cx="-6" cy="9" r="5" fill="#2a0c3f" />
                </g>
            </g>
        </g>
    );

    const wheel = { x: 1446, y: 360, r: 118 };
    const left = tv.x - 18;
    const right = tv.x + tv.w + 18;
    const bottom = tv.y + tv.h + 14;

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('sky')} x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#0f0530" /><stop offset=".22" stopColor="#2c0b5c" /><stop offset=".45" stopColor="#6a1a86" /><stop offset=".66" stopColor="#c62f7e" /><stop offset=".84" stopColor="#ff6b5c" /><stop offset="1" stopColor="#ffb85c" />
                </linearGradient>
                <linearGradient id={u('sun')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff6b0" /><stop offset=".4" stopColor="#ffbb4a" /><stop offset=".72" stopColor="#ff5f7a" /><stop offset="1" stopColor="#e01f7c" /></linearGradient>
                <radialGradient id={u('sunGlow')} cx="800" cy={HORIZON} r="560" gradientUnits="userSpaceOnUse"><stop stopColor="#ffb06b" stopOpacity=".7" /><stop offset=".4" stopColor="#ff5f9e" stopOpacity=".28" /><stop offset="1" stopColor="#ff5f9e" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('cloud')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#5b1d7a" /><stop offset=".6" stopColor="#d9467e" /><stop offset="1" stopColor="#ffb36b" /></linearGradient>
                <linearGradient id={u('sea')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#3a1366" /><stop offset=".5" stopColor="#1c1150" /><stop offset="1" stopColor="#0a1636" /></linearGradient>
                <linearGradient id={u('land')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#240a42" /><stop offset="1" stopColor="#0c0320" /></linearGradient>
                <linearGradient id={u('pier')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#1e0838" /><stop offset="1" stopColor="#0a0319" /></linearGradient>
                <linearGradient id={u('chrome')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffffff" /><stop offset=".42" stopColor="#a8f5ff" /><stop offset=".5" stopColor="#24124f" /><stop offset=".72" stopColor="#ff8fc8" /><stop offset="1" stopColor="#fff0f8" /></linearGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <radialGradient id={u('mirror')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffb06b" stopOpacity=".5" /><stop offset=".5" stopColor="#ff5f9e" stopOpacity=".16" /><stop offset="1" stopColor="#ff5f9e" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#2de2c8" stopOpacity=".42" /><stop offset=".6" stopColor="#ff6ac1" stopOpacity=".16" /><stop offset="1" stopColor="#ff6ac1" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('lamp')} cx=".5" cy=".5" r=".5"><stop stopColor="#fff7d6" stopOpacity=".95" /><stop offset=".35" stopColor="#ffb85c" stopOpacity=".6" /><stop offset="1" stopColor="#ffb85c" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('horizonGlow')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#2de2c8" stopOpacity="0" /><stop offset=".45" stopColor="#2de2c8" stopOpacity=".42" /><stop offset="1" stopColor="#2de2c8" stopOpacity="0" /></linearGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#6a1a86" stopOpacity="0" /><stop offset="1" stopColor="#050a18" stopOpacity=".7" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".6" /></radialGradient>
                <pattern id={u('vhs')} width="8" height="4" patternUnits="userSpaceOnUse"><rect width="8" height="1.2" fill="#000" opacity=".22" /></pattern>
                <clipPath id={u('sunClip')}><path d={`M555 ${HORIZON}A245 245 0 0 1 1045 ${HORIZON}Z`} /></clipPath>
            </defs>

            {/* the sky: stars, clouds lit from below, the sun, gulls */}
            <rect width="1600" height="640" fill={f('sky')} />
            {STARS.map((s, k) => <circle key={k} className={k % 8 === 0 ? 'sc-star' : undefined} style={k % 8 === 0 ? after((k * 0.29) % 2.6) : undefined} cx={r1(s.x)} cy={r1(s.y)} r={r1(s.r)} fill="#fff" opacity={r1(s.o)} />)}
            <circle cx="800" cy={HORIZON} r="560" fill={f('sunGlow')} />
            {CLOUDS.map(([x, y, w, d]) => (
                <g key={`${x}-${y}`} className="sc-drift" style={after(d)}>
                    <rect x={x} y={y} width={w} height="16" rx="8" fill={f('cloud')} opacity=".85" />
                    <rect x={x + w * 0.18} y={y - 11} width={w * 0.5} height="14" rx="7" fill={f('cloud')} opacity=".8" />
                    <rect x={x + w * 0.1} y={y + 13} width={w * 0.7} height="6" rx="3" fill="#ffd38a" opacity=".55" />
                </g>
            ))}
            <g clipPath={f('sunClip')}>
                <rect x="555" y={HORIZON - 245} width="490" height="245" fill={f('sun')} />
                <g className="sc-stripes">
                    {SUN_BARS.map((h, i) => <rect key={i} x="555" y={HORIZON - 132 + i * 23 - h / 2} width="490" height={h} fill="#4a1270" />)}
                </g>
            </g>
            {GULLS.map(([x, y, s], i) => (
                <g key={x} className="sc-drift" style={after(-i * 2.2)}>
                    <path d={`M${x} ${y}q${10 * s} ${-9 * s} ${20 * s} 0q${10 * s} ${-9 * s} ${20 * s} 0`} fill="none" stroke="#2a0b44" strokeWidth={2.6 * s} strokeLinecap="round" />
                </g>
            ))}

            {/* the sea, the road of light the sun lays on it */}
            <rect y={HORIZON} width="1600" height={FLOOR - HORIZON + 4} fill={f('sea')} />
            <rect y={HORIZON - 2} width="1600" height="3" fill="#ffd38a" opacity=".85" />
            {Array.from({ length: 9 }, (_, i) => {
                const y = HORIZON + 8 + i * 12;
                const w = 470 - i * 34;
                return (
                    <g key={i} className="sc-wave" style={after(-i * 0.6)}>
                        <rect className="sc-shimmer" style={after(-i * 0.5)} x={800 - w / 2} y={y} width={w} height={3 + i * 0.4} rx="2" fill={i % 2 ? '#ff7a8f' : '#ffcf7a'} opacity={r1(0.85 - i * 0.06)} />
                    </g>
                );
            })}
            {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${(i * 237) % 1600 - 40} ${HORIZON + 18 + i * 14}h${90 + (i % 3) * 40}`} stroke="#9b7dff" strokeOpacity=".35" strokeWidth="1.4" strokeLinecap="round" />)}

            {/* the beach on the left: palms and the neon flamingo */}
            <path d={`M-20 ${HORIZON + 10}C140 ${HORIZON + 4} 300 ${HORIZON + 30} 430 ${HORIZON + 70}C480 ${HORIZON + 86} 520 ${FLOOR - 10} 560 ${FLOOR + 6}H-20Z`} fill={f('land')} />
            <path d={`M-20 ${HORIZON + 10}C140 ${HORIZON + 4} 300 ${HORIZON + 30} 430 ${HORIZON + 70}C480 ${HORIZON + 86} 520 ${FLOOR - 10} 560 ${FLOOR + 6}`} fill="none" stroke="#ff8fb8" strokeOpacity=".6" strokeWidth="2" />
            {palm(70, HORIZON + 26, 0.86, 1, 'p')}{palm(196, HORIZON + 22, 1.04, -1, 'pp')}{palm(318, HORIZON + 46, 0.7, 1, 'ppp')}
            <g transform="translate(412 512) scale(1.15)">
                <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                    {[9, 3].map((w) => (
                        <g key={w} strokeWidth={w} opacity={w > 3 ? 0.25 : 1} className={w > 3 ? undefined : 'sc-flame'}>
                            <path stroke="#ff4fa8" d="M-24 -2C-22 -18 6 -22 24 -14C36 -8 44 0 34 6C20 14 -10 16 -20 8C-24 5 -25 1 -24 -2ZM-6 -6C8 -12 20 -8 28 -2M-20 -8C-34 -18 -38 -36 -26 -48C-16 -58 -14 -72 -24 -80C-32 -86 -42 -82 -42 -74M2 12L5 38L2 64H-10M10 11L15 36L-2 30" />
                            <path stroke="#ffd38a" d="M-42 -74C-46 -70 -50 -64 -52 -58" />
                        </g>
                    ))}
                    <circle cx="-32" cy="-78" r="1.6" fill="#ffd38a" />
                </g>
            </g>

            {/* the pier on the right, its lamps and the neon Ferris wheel */}
            <g>
                {[wheel.x - 70, wheel.x + 70].map((x) => <path key={x} d={`M${x} 548L${wheel.x} ${wheel.y}`} stroke="#14052b" strokeWidth="8" />)}
                <g className="sc-wheel" style={{ transformOrigin: `${wheel.x}px ${wheel.y}px` }}>
                    <circle cx={wheel.x} cy={wheel.y} r={wheel.r} fill="none" stroke="#ff4fa8" strokeWidth="10" opacity=".2" />
                    <circle cx={wheel.x} cy={wheel.y} r={wheel.r} fill="none" stroke="#ff8fc8" strokeWidth="3" />
                    <circle cx={wheel.x} cy={wheel.y} r={wheel.r - 16} fill="none" stroke="#2de2c8" strokeWidth="1.6" opacity=".8" />
                    {Array.from({ length: 16 }, (_, i) => {
                        const a = (i * Math.PI) / 8;
                        const x = wheel.x + Math.cos(a) * wheel.r;
                        const y = wheel.y + Math.sin(a) * wheel.r;
                        return (
                            <g key={i}>
                                <path d={`M${wheel.x} ${wheel.y}L${r1(x)} ${r1(y)}`} stroke="#2de2c8" strokeWidth="1.4" opacity=".75" />
                                <circle cx={r1(x)} cy={r1(y)} r="5" fill={i % 2 ? '#ffd38a' : '#ff6ac1'} />
                            </g>
                        );
                    })}
                    <circle cx={wheel.x} cy={wheel.y} r="12" fill="#14052b" stroke="#2de2c8" strokeWidth="2" />
                </g>
                <rect x="1100" y="540" width="520" height="16" fill={f('pier')} />
                <path d="M1100 540H1620" stroke="#2de2c8" strokeWidth="2" opacity=".8" />
                {Array.from({ length: 11 }, (_, i) => 1112 + i * 50).map((x) => <path key={x} d={`M${x} 556V${FLOOR}`} stroke="#12041f" strokeWidth="7" />)}
                <path d="M1100 522H1620M1100 540" stroke="#14052b" strokeWidth="3" />
                {Array.from({ length: 27 }, (_, i) => 1104 + i * 20).map((x) => <path key={x} d={`M${x} 522V540`} stroke="#14052b" strokeWidth="2" />)}
                {[1130, 1260, 1580].map((x, i) => (
                    <g key={x}>
                        <path d={`M${x} 540V476`} stroke="#14052b" strokeWidth="4" />
                        <circle className="sc-twinkle" style={after(-i * 0.5)} cx={x} cy="472" r="16" fill={f('lamp')} />
                        <circle cx={x} cy="472" r="4" fill="#fff7d6" />
                    </g>
                ))}
            </g>

            {/* the frame the video hangs in: chrome and teal */}
            {[26, 16].map((g, i) => <rect key={g} x={tv.x - g - 18} y={tv.y - g - 22} width={tv.w + 36 + g * 2} height={tv.h + 36 + g * 2} rx={18 + g} fill="#2de2c8" opacity={0.06 + i * 0.05} />)}
            <rect x={tv.x - 18} y={tv.y - 22} width={tv.w + 36} height={tv.h + 36} rx="16" fill="#060313" stroke={f('chrome')} strokeWidth="5" />
            <rect x={tv.x - 9} y={tv.y - 13} width={tv.w + 18} height={tv.h + 18} rx="10" fill="none" stroke="#2de2c8" strokeWidth="2" />
            {[[left, bottom, 1, 1], [right, bottom, -1, 1], [left, 30, 1, -1], [right, 30, -1, -1]].map(([x, y, sx, sy], i) => (
                <path key={i} d={`M${x} ${y}h${30 * sx}M${x} ${y}v${-30 * sy}`} stroke="#ff8fc8" strokeWidth="3" strokeLinecap="round" opacity=".9" />
            ))}

            {/* the name in chrome over the sea of light */}
            <g className="sc-flame">
                <text x="800" y="436" textAnchor="middle" fontFamily={font} fontWeight="900" fontStyle="italic" fontSize="58" letterSpacing="3" fill="none" stroke="#2a0b44" strokeWidth="13" opacity=".55">SFD-DJ.EU</text>
                <text x="800" y="436" textAnchor="middle" fontFamily={font} fontWeight="900" fontStyle="italic" fontSize="58" letterSpacing="3" fill="none" stroke="#2de2c8" strokeWidth="7" opacity=".35">SFD-DJ.EU</text>
                <text x="800" y="436" textAnchor="middle" fontFamily={font} fontWeight="900" fontStyle="italic" fontSize="58" letterSpacing="3" fill={f('chrome')} stroke="#fff" strokeWidth="1.3">SFD-DJ.EU</text>
                <path d="M666 454Q800 470 934 454" fill="none" stroke="#ff6ac1" strokeWidth="3" strokeLinecap="round" />
            </g>

            {/* the floor: a teal and pink grid, the sun's glow on it */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            <ellipse cx="800" cy={FLOOR + 30} rx="520" ry="80" fill={f('mirror')} />
            <rect y={FLOOR - 30} width="1600" height="90" fill={f('horizonGlow')} />
            {floorGrid(height).map(({ i, j }) => ((i * 3 + j * 5 + 100) % 10 === 0 ? <polygon key={`${i}-${j}`} className="sc-tile" style={after(((i + 20) * 11 + j * 7) % 24 / 10)} points={`${lineX(i, rowY(j))},${rowY(j)} ${lineX(i + 1, rowY(j))},${rowY(j)} ${lineX(i + 1, rowY(j + 1))},${rowY(j + 1)} ${lineX(i, rowY(j + 1))},${rowY(j + 1)}`} fill={(i + j) % 2 ? '#2de2c8' : '#ff6ac1'} opacity=".15" /> : null))}
            <g stroke="#2de2c8" strokeOpacity=".28" strokeWidth="7">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
            </g>
            <g strokeWidth="1.7">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} stroke="#7ff5e6" strokeOpacity=".9" />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} stroke="#ff8fc8" strokeOpacity=".9" />)}
            </g>

            {/* the glow under the booth */}
            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="410" ry="76" fill={f('pool')} />
                <g transform={`translate(800 ${SCENE.booth.y + 100}) scale(340 58)`} fill="none">
                    <circle r="1" stroke="#2de2c8" strokeWidth="9" vectorEffect="non-scaling-stroke" opacity=".3" />
                    <circle r="1" stroke="#a7fff3" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
                    <circle r=".72" stroke="#ff8fc8" strokeWidth="1.8" vectorEffect="non-scaling-stroke" opacity=".8" />
                </g>
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 4} rx="184" ry="15" fill="#000" opacity=".55" />
            </g>

            {withBooth && (
                <svg x={SCENE.booth.x} y={SCENE.booth.y + ext} width={SCENE.booth.w} height={SCENE.booth.h} viewBox="0 0 300 150" overflow="visible">
                    <BoothFrontArt u={(n) => `${uid}-b-${n}`} p={p} plate />
                </svg>
            )}

            <rect y="520" width="1600" height={height - 520} fill={f('haze')} />
            <rect width="1600" height={height} fill={f('vhs')} opacity=".5" />
            <rect width="1600" height={height} fill={f('vig')} />
        </svg>
    );
}
