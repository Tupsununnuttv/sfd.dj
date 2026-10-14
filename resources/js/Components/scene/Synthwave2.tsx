import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { after, floorGrid, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const font = 'Figtree, system-ui, sans-serif';
const HORIZON = 560; // where the sun goes down behind the city

const rs = rand(2084);
const STARS = Array.from({ length: 170 }, () => ({ x: rs() * 1600, y: rs() ** 1.6 * 430, r: 0.4 + rs() * 1.4, o: 0.25 + rs() * 0.75 }));

/** A row of tall buildings in silhouette: [x, width, height], with their lit windows. */
const city = (seed: number, x0: number, x1: number, tall: number) => {
    const r = rand(seed);
    const out: { x: number; w: number; h: number; windows: [number, number, number][]; edge: string }[] = [];

    for (let x = x0; x < x1;) {
        const w = 34 + Math.round(r() * 46);
        const h = Math.round(50 + r() ** 1.4 * tall);
        const windows: [number, number, number][] = [];
        for (let wy = HORIZON - h + 12; wy < HORIZON - 10; wy += 13) {
            for (let wx = x + 6; wx < x + w - 8; wx += 10) {
                const lit = r();
                if (lit > 0.52) windows.push([wx, wy, lit]);
            }
        }
        out.push({ x, w, h, windows, edge: r() > 0.5 ? '#22d3ee' : '#ff2fd0' });
        x += w + Math.round(r() * 6);
    }

    return out;
};
const LEFT_CITY = city(7, -10, 500, 210);
const RIGHT_CITY = city(31, 1100, 1620, 230);
const FAR_CITY = city(53, 470, 1130, 70); // small and far away, in front of the bottom of the sun
const RIDGE_L: [number, number][] = [[-20, HORIZON], [60, 430], [150, 470], [250, 380], [350, 450], [440, 410], [540, HORIZON]];
const RIDGE_R: [number, number][] = [[1060, HORIZON], [1150, 420], [1240, 460], [1330, 360], [1430, 440], [1520, 400], [1620, 450], [1620, HORIZON]];
const poly = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${x} ${y}`).join('L')}Z`;
const ridge = (pts: [number, number][]) => `M${pts.slice(1, -1).map(([x, y]) => `${x} ${y}`).join('L')}`;
const SUN_BARS = [3, 5, 7, 9, 12, 15, 18]; // the cuts across the sun get thicker towards the horizon

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * Synthwave V2 on a 1600 x 900 canvas: a neon city at night. A giant striped sun sets behind a skyline of towers with lit windows, wireframe mountains
 * glow behind the city, searchlights and lasers cut the sky, shooting stars fall, and a highway full of light trails runs along the horizon in front of
 * the city. The video hangs in a double neon tube with the chrome SFD-DJ.EU name on the sun under it, palms frame the front corners, and the dance floor
 * is a glowing grid that mirrors the sun. While a song plays (`live`) the sun's stripes slide, the trails race, the lasers sweep, windows and stars twinkle,
 * the floor tiles flash and the palms sway; standing still, it is a finished picture.
 */
export default function Synthwave2Backdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h);

    const mountains = (pts: [number, number][], k: string) => (
        <g key={k}>
            <clipPath id={u(`mc${k}`)}><path d={poly(pts)} /></clipPath>
            <path d={poly(pts)} fill={f('mtn')} />
            <g clipPath={f(`mc${k}`)} stroke="#a855f7" strokeWidth="1" opacity=".35">
                {Array.from({ length: 34 }, (_, i) => <path key={`v${i}`} d={`M${-20 + i * 50} 340L${800 + (-20 + i * 50 - 800) * 1.35} ${HORIZON}`} />)}
                {Array.from({ length: 8 }, (_, i) => <path key={`h${i}`} d={`M-20 ${380 + i * 24}H1620`} />)}
            </g>
            <path d={ridge(pts)} fill="none" stroke="#ff2fd0" strokeWidth="7" opacity=".22" strokeLinejoin="round" />
            <path d={ridge(pts)} fill="none" stroke="#ff9cf2" strokeWidth="2" strokeLinejoin="round" />
        </g>
    );

    const buildings = (list: ReturnType<typeof city>, k: string, dark: string, twinkleEvery: number) => (
        <g key={k}>
            {list.map((b, i) => (
                <g key={i}>
                    <rect x={b.x} y={HORIZON - b.h} width={b.w} height={b.h} fill={dark} />
                    <path d={`M${b.x} ${HORIZON - b.h}H${b.x + b.w}`} stroke={b.edge} strokeWidth="2" opacity=".85" />
                    <path d={`M${b.x + b.w} ${HORIZON - b.h}V${HORIZON}`} stroke={b.edge} strokeWidth="1" opacity=".25" />
                    {b.windows.map(([wx, wy, lit], j) => (
                        <rect
                            key={j}
                            className={(i * 7 + j) % twinkleEvery === 0 ? 'sc-twinkle' : undefined}
                            style={(i * 7 + j) % twinkleEvery === 0 ? after(((i * 13 + j * 7) % 30) / 10) : undefined}
                            x={wx} y={wy} width="4" height="6" fill={lit > 0.85 ? '#ffe9a8' : lit > 0.68 ? '#ff9cf2' : '#7df3ff'} opacity={r1(0.45 + lit * 0.5)}
                        />
                    ))}
                </g>
            ))}
        </g>
    );

    const palm = (x: number, y: number, s: number, flip: number, k: string) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s * flip} ${s})`}>
            <g className="sc-palm" style={after(-k.length * 0.7)}>
                <path d="M0 0C24 -110 -14 -210 30 -300" fill="none" stroke="#0b0219" strokeWidth="20" strokeLinecap="round" />
                <path d="M0 0C24 -110 -14 -210 30 -300" fill="none" stroke="#22d3ee" strokeOpacity=".55" strokeWidth="2" strokeLinecap="round" transform="translate(9 0)" />
                {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${-8 + (i % 2) * 3} ${-28 - i * 30}l18 -6`} stroke="#22d3ee" strokeOpacity=".35" strokeWidth="1.6" />)}
                <g transform="translate(30 -300)" fill="#0b0219" stroke="#ff2fd0" strokeOpacity=".85" strokeWidth="1.8" strokeLinejoin="round">
                    {[-204, -168, -134, -104, -76, -46, -12, 24].map((a, i) => (
                        <path key={a} transform={`rotate(${a})${a < -90 ? ' scale(1 -1)' : ''}`} d={`M0 0C${44 + (i % 2) * 8} -50 ${104 + (i % 3) * 10} -46 ${146 + (i % 3) * 12} 16C${110} -14 ${52} -12 0 0Z`} />
                    ))}
                    <circle r="9" fill="#170531" />
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
                    <stop stopColor="#04000f" /><stop offset=".25" stopColor="#170536" /><stop offset=".5" stopColor="#3f0b6e" /><stop offset=".7" stopColor="#8e157f" /><stop offset=".86" stopColor="#ff3d7f" /><stop offset="1" stopColor="#ffa35a" />
                </linearGradient>
                <linearGradient id={u('sun')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff7a1" /><stop offset=".35" stopColor="#ffd25a" /><stop offset=".62" stopColor="#ff7a45" /><stop offset="1" stopColor="#ff1f8e" /></linearGradient>
                <radialGradient id={u('sunGlow')} cx="800" cy={HORIZON} r="640" gradientUnits="userSpaceOnUse"><stop stopColor="#ff7ab8" stopOpacity=".75" /><stop offset=".35" stopColor="#ff2fd0" stopOpacity=".3" /><stop offset="1" stopColor="#ff2fd0" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('ray')} x1="0" y1="1" x2="0" y2="0"><stop stopColor="#ffd25a" stopOpacity=".16" /><stop offset="1" stopColor="#ffd25a" stopOpacity="0" /></linearGradient>
                <linearGradient id={u('mtn')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#2b0a57" /><stop offset="1" stopColor="#11032a" /></linearGradient>
                <linearGradient id={u('laserA')} x1="0" y1="1" x2="0" y2="0"><stop stopColor="#22d3ee" stopOpacity=".55" /><stop offset="1" stopColor="#22d3ee" stopOpacity="0" /></linearGradient>
                <linearGradient id={u('laserB')} x1="0" y1="1" x2="0" y2="0"><stop stopColor="#ff2fd0" stopOpacity=".55" /><stop offset="1" stopColor="#ff2fd0" stopOpacity="0" /></linearGradient>
                <linearGradient id={u('road')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#14052e" /><stop offset="1" stopColor="#070112" /></linearGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <linearGradient id={u('chrome')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffffff" /><stop offset=".45" stopColor="#bfefff" /><stop offset=".5" stopColor="#3b1a70" /><stop offset=".75" stopColor="#ff7ad9" /><stop offset="1" stopColor="#ffe3f6" /></linearGradient>
                <radialGradient id={u('mirror')} cx=".5" cy=".5" r=".5"><stop stopColor="#ff7ab8" stopOpacity=".55" /><stop offset=".55" stopColor="#ff2fd0" stopOpacity=".16" /><stop offset="1" stopColor="#ff2fd0" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#ff6ac1" stopOpacity=".5" /><stop offset=".6" stopColor="#7c3aed" stopOpacity=".2" /><stop offset="1" stopColor="#7c3aed" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('horizonGlow')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ff2fd0" stopOpacity="0" /><stop offset=".45" stopColor="#ff2fd0" stopOpacity=".5" /><stop offset="1" stopColor="#ff2fd0" stopOpacity="0" /></linearGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#7c3aed" stopOpacity="0" /><stop offset="1" stopColor="#06010f" stopOpacity=".72" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".62" /></radialGradient>
                <radialGradient id={u('lamp')} cx=".5" cy=".5" r=".5"><stop stopColor="#fff" stopOpacity=".95" /><stop offset=".3" stopColor="#ff4d6d" stopOpacity=".8" /><stop offset="1" stopColor="#ff4d6d" stopOpacity="0" /></radialGradient>
                <clipPath id={u('sunClip')}><path d={`M510 ${HORIZON}A290 290 0 0 1 1090 ${HORIZON}Z`} /></clipPath>
            </defs>

            {/* the sky: stars, shooting stars, the sun's rays, the sun */}
            <rect width="1600" height="640" fill={f('sky')} />
            {STARS.map((s, k) => <circle key={k} className={k % 9 === 0 ? 'sc-star' : undefined} style={k % 9 === 0 ? after((k * 0.31) % 2.6) : undefined} cx={r1(s.x)} cy={r1(s.y)} r={r1(s.r)} fill="#fff" opacity={r1(s.o)} />)}
            {[[1340, 70, 0], [420, 120, -5.5]].map(([x, y, d]) => (
                <g key={x} className="sc-shoot" style={after(d)}>
                    <path d={`M${x} ${y}l70 -26`} stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity=".9" />
                    <path d={`M${x} ${y}l150 -56`} stroke="#ff9cf2" strokeWidth="1.2" strokeLinecap="round" opacity=".45" />
                </g>
            ))}
            {Array.from({ length: 13 }, (_, i) => -78 + i * 13).map((a) => (
                <path key={a} d={`M800 ${HORIZON}L${r1(800 + Math.sin((a - 3) * Math.PI / 180) * 1200)} ${r1(HORIZON - Math.cos((a - 3) * Math.PI / 180) * 1200)}L${r1(800 + Math.sin((a + 3) * Math.PI / 180) * 1200)} ${r1(HORIZON - Math.cos((a + 3) * Math.PI / 180) * 1200)}Z`} fill={f('ray')} />
            ))}
            <circle cx="800" cy={HORIZON} r="640" fill={f('sunGlow')} />
            <g className="sc-sweep"><path d={`M780 ${HORIZON}L520 -140L640 -140L820 ${HORIZON}Z`} fill={f('laserA')} opacity=".7" /></g>
            <g className="sc-sweep" style={after(-3.5)}><path d={`M780 ${HORIZON}L520 -140L640 -140L820 ${HORIZON}Z`} fill={f('laserB')} opacity=".7" transform="translate(1600 0) scale(-1 1)" /></g>
            <g clipPath={f('sunClip')}>
                <rect x="510" y={HORIZON - 290} width="580" height="290" fill={f('sun')} />
                <g className="sc-stripes">
                    {SUN_BARS.map((h, i) => <rect key={i} x="510" y={HORIZON - 170 + i * 25 - h / 2} width="580" height={h} fill="#2a0750" />)}
                </g>
            </g>

            {/* mountains, then the city in front of them, the far small city in front of the bottom of the sun */}
            {mountains(RIDGE_L, 'L')}{mountains(RIDGE_R, 'R')}
            {buildings(FAR_CITY, 'far', '#1d0640', 999)}
            {buildings(LEFT_CITY, 'left', '#0d0222', 9)}
            {buildings(RIGHT_CITY, 'right', '#0d0222', 9)}
            {/* the tallest tower, with its blinking light */}
            <g>
                <path d="M1368 560V228L1384 196L1400 228V560Z" fill="#0b021d" stroke="#22d3ee" strokeOpacity=".6" strokeWidth="1.6" />
                <path d="M1384 196V150" stroke="#7df3ff" strokeWidth="2" />
                <circle className="sc-led" cx="1384" cy="148" r="12" fill={f('lamp')} />
                <circle cx="1384" cy="148" r="3" fill="#ff4d6d" />
                {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M1372 ${250 + i * 25}H1396`} stroke={i % 3 ? '#7df3ff' : '#ff9cf2'} strokeOpacity=".5" strokeWidth="2" />)}
            </g>

            {/* the highway in front of the city, full of light trails */}
            <rect y={HORIZON} width="1600" height="68" fill={f('road')} />
            <rect y={HORIZON - 2} width="1600" height="4" fill="#ff2fd0" opacity=".95" /><rect y={HORIZON - 5} width="1600" height="10" fill="#ff2fd0" opacity=".22" />
            <rect y={HORIZON + 30} width="1600" height="2" fill="#22d3ee" opacity=".55" />
            <path d={`M0 ${HORIZON + 46}H1600`} stroke="#ffe9a8" strokeWidth="2" strokeDasharray="26 22" opacity=".35" />
            {[[200, 14, '#ff4d6d', 0, 'sc-streak'], [900, 14, '#ff4d6d', -2.4, 'sc-streak'], [1400, 22, '#ff8a3d', -4.1, 'sc-streak'], [500, 40, '#e0faff', -1.2, 'sc-streak-back'], [1150, 40, '#fff6c8', -3.3, 'sc-streak-back'], [60, 52, '#e0faff', -5.2, 'sc-streak-back']].map(([x, dy, c, d, cls]) => (
                <g key={`${x}-${dy}`} className={String(cls)} style={after(Number(d))}>
                    <path d={`M${x} ${HORIZON + Number(dy)}h140`} stroke={String(c)} strokeWidth="7" strokeLinecap="round" opacity=".22" />
                    <path d={`M${x} ${HORIZON + Number(dy)}h140`} stroke={String(c)} strokeWidth="2.2" strokeLinecap="round" />
                </g>
            ))}
            <g className="sc-car">
                <g transform={`translate(1010 ${HORIZON + 26})`}>
                    <ellipse cx="0" cy="4" rx="50" ry="6" fill="#ff2fd0" opacity=".45" />
                    <path d="M-48 0L-44 -9L-22 -14L-9 -25L19 -25L32 -14L48 -10L50 0Z" fill="#15052f" stroke="#22d3ee" strokeWidth="2" strokeLinejoin="round" />
                    <path d="M-7 -23L-13 -14H27L17 -23Z" fill="#22d3ee" opacity=".55" />
                    <circle cx="-28" cy="0" r="7.5" fill="#07010f" stroke="#ff9cf2" strokeWidth="2" /><circle cx="30" cy="0" r="7.5" fill="#07010f" stroke="#ff9cf2" strokeWidth="2" />
                    <circle cx="-47" cy="-7" r="15" fill={f('lamp')} /><path d="M-47 -7L-150 -7" stroke="#ff4d6d" strokeWidth="2.6" opacity=".45" />
                </g>
            </g>

            {/* the frame the video hangs in: a double neon tube with corner brackets */}
            {[30, 20, 12].map((g, i) => <rect key={g} x={tv.x - g - 18} y={tv.y - g - 22} width={tv.w + 36 + g * 2} height={tv.h + 36 + g * 2} rx={16 + g} fill="#ff2fd0" opacity={0.05 + i * 0.05} />)}
            <rect x={tv.x - 18} y={tv.y - 22} width={tv.w + 36} height={tv.h + 36} rx="14" fill="#05010d" stroke="#ff2fd0" strokeWidth="4.5" />
            <rect x={tv.x - 10} y={tv.y - 14} width={tv.w + 20} height={tv.h + 20} rx="9" fill="none" stroke="#22d3ee" strokeWidth="2.2" />
            <rect x={tv.x - 18} y={tv.y - 22} width={tv.w + 36} height={tv.h + 36} rx="14" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1" />
            {[[left, bottom, 1, 1], [right, bottom, -1, 1], [left, 30, 1, -1], [right, 30, -1, -1]].map(([x, y, sx, sy], i) => (
                <path key={i} d={`M${x} ${y}h${38 * sx}M${x} ${y}v${-38 * sy}`} stroke="#fff" strokeWidth="3.2" strokeLinecap="round" opacity=".9" />
            ))}

            {/* the name, chrome on the sun */}
            <g className="sc-flame">
                <text x="800" y="470" textAnchor="middle" fontFamily={font} fontWeight="900" fontStyle="italic" fontSize="64" letterSpacing="4" fill="none" stroke="#1a0438" strokeWidth="14" opacity=".55">SFD-DJ.EU</text>
                <text x="800" y="470" textAnchor="middle" fontFamily={font} fontWeight="900" fontStyle="italic" fontSize="64" letterSpacing="4" fill="none" stroke="#ff2fd0" strokeWidth="8" opacity=".35">SFD-DJ.EU</text>
                <text x="800" y="470" textAnchor="middle" fontFamily={font} fontWeight="900" fontStyle="italic" fontSize="64" letterSpacing="4" fill={f('chrome')} stroke="#fff" strokeWidth="1.4">SFD-DJ.EU</text>
                <path d="M640 488H960" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" /><path d="M640 488H960" stroke="#22d3ee" strokeWidth="10" strokeLinecap="round" opacity=".3" />
            </g>

            {/* the floor: a glowing grid that mirrors the sun */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            <ellipse cx="800" cy={FLOOR + 40} rx="560" ry="90" fill={f('mirror')} />
            {[0, 1, 2, 3, 4].map((i) => <rect key={i} className="sc-shimmer" style={after(-i * 0.9)} x={800 - 260 + i * 18} y={FLOOR + 8 + i * 14} width={520 - i * 36} height="3" rx="1.5" fill="#ffd25a" opacity={0.35 - i * 0.05} />)}
            <rect y={FLOOR - 30} width="1600" height="90" fill={f('horizonGlow')} />
            {floorGrid(height).map(({ i, j }) => ((i * 5 + j * 3 + 100) % 9 === 0 ? <polygon key={`${i}-${j}`} className="sc-tile" style={after(((i + 20) * 13 + j * 7) % 24 / 10)} points={`${lineX(i, rowY(j))},${rowY(j)} ${lineX(i + 1, rowY(j))},${rowY(j)} ${lineX(i + 1, rowY(j + 1))},${rowY(j + 1)} ${lineX(i, rowY(j + 1))},${rowY(j + 1)}`} fill={(i + j) % 2 ? '#22d3ee' : '#ff2fd0'} opacity=".16" /> : null))}
            <g stroke="#ff2fd0" strokeOpacity=".3" strokeWidth="7">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>
            <g strokeWidth="1.7">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} stroke="#ff9cf2" strokeOpacity=".95" />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} stroke="#7df3ff" strokeOpacity=".9" />)}
            </g>

            {/* palms in the front corners */}
            {palm(70, 812, 0.95, 1, 'a')}{palm(214, 846, 0.72, 1, 'bb')}{palm(1530, 818, 1, -1, 'ccc')}{palm(1392, 850, 0.7, -1, 'dddd')}

            {/* the glow and the triangle under the booth */}
            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="420" ry="78" fill={f('pool')} />
                <g transform={`translate(800 ${SCENE.booth.y + 100}) scale(350 60)`} fill="none" strokeLinejoin="round">
                    <circle r="1" stroke="#ff2fd0" strokeWidth="10" vectorEffect="non-scaling-stroke" opacity=".3" />
                    <circle r="1" stroke="#ff9cf2" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
                    <circle r=".78" stroke="#22d3ee" strokeWidth="1.6" vectorEffect="non-scaling-stroke" opacity=".7" />
                    <path d="M0 -0.86L0.78 0.55L-0.78 0.55Z" stroke="#22d3ee" strokeWidth="8" vectorEffect="non-scaling-stroke" opacity=".3" />
                    <path d="M0 -0.86L0.78 0.55L-0.78 0.55Z" stroke="#a5f3fc" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
                </g>
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
