import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { after, floorGrid, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const font = 'Figtree, system-ui, sans-serif';
const HORIZON = 600; // where the sun goes down

const rs = rand(84);
const STARS = Array.from({ length: 130 }, () => ({ x: rs() * 1600, y: rs() ** 1.5 * 470, r: 0.5 + rs() * 1.3, o: 0.3 + rs() * 0.7 }));
const LEFT: [number, number][] = [[-20, HORIZON], [50, 478], [120, 548], [200, 372], [280, 528], [350, 452], [420, 566], [480, HORIZON]];
const RIGHT: [number, number][] = [[1110, HORIZON], [1190, 530], [1262, 408], [1336, 528], [1420, 352], [1500, 506], [1560, 440], [1620, 560], [1620, HORIZON]];
const poly = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${x} ${y}`).join('L')}Z`;
const BARS = [4, 6, 9, 13, 18]; // the cuts across the sun get thicker towards the horizon

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * The synthwave scenery on a 1600 x 900 canvas: an outrun night. A huge striped sun going down behind the screen, a ringed planet, stars, two neon
 * wireframe mountain ranges, searchlights, a sports car on the horizon, palms in silhouette, the video in a neon frame, and a glowing grid for a floor with a triangle under the booth.
 * Like the others it only moves while a song plays (`live`): the stripes in the sun slide down, the searchlights sweep, the car drives by, the neon flickers and the palms sway.
 */
export default function SynthwaveBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down

    const mountain = (pts: [number, number][], k: string) => (
        <g key={k}>
            <clipPath id={u(`mc${k}`)}><path d={poly(pts)} /></clipPath>
            <path d={poly(pts)} fill={f('mtn')} />
            <g clipPath={f(`mc${k}`)} stroke="#ff2fd0" strokeWidth="1" opacity=".38">
                {Array.from({ length: 30 }, (_, i) => <path key={`v${i}`} d={`M${-20 + i * 56} 300V${HORIZON}`} />)}
                {Array.from({ length: 12 }, (_, i) => <path key={`h${i}`} d={`M-20 ${340 + i * 26}H1620`} />)}
            </g>
            <path d={poly(pts).replace(/L-?\d+ 600Z|Z/g, '')} fill="none" stroke="#ff2fd0" strokeWidth="6" opacity=".25" strokeLinejoin="round" />
            <path d={poly(pts).replace(/L-?\d+ 600Z|Z/g, '')} fill="none" stroke="#ff8af0" strokeWidth="2.2" strokeLinejoin="round" />
        </g>
    );

    const silhouettePalm = (x: number, y: number, s: number, flip: number, k: string) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s * flip} ${s})`}>
            <g className="sc-palm">
                <path d="M0 0C20 -100 -10 -200 26 -290" fill="none" stroke="#10031f" strokeWidth="18" strokeLinecap="round" />
                <g transform="translate(26 -290)" fill="#10031f" stroke="#ff2fd0" strokeOpacity=".7" strokeWidth="1.6">
                    {[-176, -140, -104, -70, -36, -4, 24].map((a, i) => (
                        <path key={a} transform={`rotate(${a})`} d={`M0 0C${40 + (i % 2) * 6} -44 ${96 + (i % 3) * 8} -40 ${132 + (i % 3) * 10} 14C${96} -16 ${40} -12 0 0Z`} />
                    ))}
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
                    <stop stopColor="#07011a" /><stop offset=".32" stopColor="#25095a" /><stop offset=".58" stopColor="#7a1fa2" /><stop offset=".82" stopColor="#ff3ea5" /><stop offset="1" stopColor="#ffb36b" />
                </linearGradient>
                <linearGradient id={u('sun')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff36b" /><stop offset=".5" stopColor="#ff9a3c" /><stop offset="1" stopColor="#ff2f9a" /></linearGradient>
                <radialGradient id={u('sunGlow')} cx="800" cy={HORIZON} r="520" gradientUnits="userSpaceOnUse"><stop stopColor="#ff6ac1" stopOpacity=".7" /><stop offset=".5" stopColor="#ff2fd0" stopOpacity=".22" /><stop offset="1" stopColor="#ff2fd0" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('mtn')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#2a0a52" /><stop offset="1" stopColor="#0d0220" /></linearGradient>
                <linearGradient id={u('beamA')} x1="0" y1="1" x2="0" y2="0"><stop stopColor="#ff2fd0" stopOpacity=".5" /><stop offset="1" stopColor="#ff2fd0" stopOpacity="0" /></linearGradient>
                <linearGradient id={u('beamB')} x1="0" y1="1" x2="0" y2="0"><stop stopColor="#22d3ee" stopOpacity=".5" /><stop offset="1" stopColor="#22d3ee" stopOpacity="0" /></linearGradient>
                <radialGradient id={u('planet')} cx=".34" cy=".3" r=".85"><stop stopColor="#ffd2f4" /><stop offset=".4" stopColor="#d946ef" /><stop offset="1" stopColor="#3b0a6a" /></radialGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <linearGradient id={u('horizon')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ff2fd0" stopOpacity="0" /><stop offset=".4" stopColor="#ff2fd0" stopOpacity=".55" /><stop offset="1" stopColor="#ff2fd0" stopOpacity="0" /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#ff6ac1" stopOpacity=".5" /><stop offset=".6" stopColor="#7c3aed" stopOpacity=".2" /><stop offset="1" stopColor="#7c3aed" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#7c3aed" stopOpacity="0" /><stop offset="1" stopColor="#07010f" stopOpacity=".7" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".6" /></radialGradient>
                <radialGradient id={u('glowCyan')} cx=".5" cy=".5" r=".5"><stop stopColor="#67e8f9" stopOpacity=".9" /><stop offset="1" stopColor="#22d3ee" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('glowRed')} cx=".5" cy=".5" r=".5"><stop stopColor="#ff4060" stopOpacity=".9" /><stop offset="1" stopColor="#ff4060" stopOpacity="0" /></radialGradient>
                <clipPath id={u('sunClip')}><path d={`M500 ${HORIZON}A300 300 0 0 1 1100 ${HORIZON}Z`} /></clipPath>
            </defs>

            {/* the sky: stars, a ringed planet, searchlights, the sun */}
            <rect width="1600" height="650" fill={f('sky')} />
            {STARS.map((s, k) => <circle key={k} className={k % 11 === 0 ? 'sc-star' : undefined} style={k % 11 === 0 ? after((k * 0.37) % 2.6) : undefined} cx={r1(s.x)} cy={r1(s.y)} r={r1(s.r)} fill="#fff" opacity={r1(s.o)} />)}
            <g transform="translate(250 190) rotate(-18)">
                <ellipse cx="0" cy="0" rx="110" ry="22" fill="none" stroke="#ff8af0" strokeWidth="5" opacity=".5" />
                <circle r="58" fill={f('planet')} />
                <path d="M-58 8Q0 22 58 8" stroke="#fff" strokeOpacity=".25" strokeWidth="3" fill="none" /><path d="M-52 -18Q0 -6 52 -18" stroke="#fff" strokeOpacity=".18" strokeWidth="3" fill="none" />
                <path d="M-110 0A110 22 0 0 0 110 0" fill="none" stroke="#ff8af0" strokeWidth="5" />
            </g>
            <g className="sc-sweep"><path d={`M780 ${HORIZON}L560 -120L680 -120L820 ${HORIZON}Z`} fill={f('beamA')} /></g>
            <g className="sc-sweep" style={after(-3.5)}><path d={`M780 ${HORIZON}L560 -120L680 -120L820 ${HORIZON}Z`} fill={f('beamB')} transform="translate(1600 0) scale(-1 1)" /></g>
            <circle cx="800" cy={HORIZON} r="520" fill={f('sunGlow')} />
            <g clipPath={f('sunClip')}>
                <rect x="500" y={HORIZON - 300} width="600" height="300" fill={f('sun')} />
                <g className="sc-stripes">
                    {BARS.map((h, i) => <rect key={i} x="500" y={HORIZON - 150 + i * 30 - h / 2} width="600" height={h + i * 1.4} fill="#25095a" />)}
                </g>
            </g>

            {/* the wireframe mountains, and the road with the car on it */}
            {mountain(LEFT, 'L')}{mountain(RIGHT, 'R')}
            <rect y={HORIZON - 1} width="1600" height="30" fill="#0d0220" />
            <rect y={HORIZON - 1} width="1600" height="3" fill="#ff2fd0" opacity=".9" /><rect y={HORIZON - 3} width="1600" height="8" fill="#ff2fd0" opacity=".25" />
            <g className="sc-car">
                <g transform={`translate(1010 ${HORIZON - 4})`}>
                    <ellipse cx="0" cy="3" rx="46" ry="5" fill="#ff2fd0" opacity=".45" />
                    <path d="M-44 -2L-40 -10L-20 -14L-8 -24L18 -24L30 -14L44 -10L46 -2Z" fill="#14052e" stroke="#22d3ee" strokeWidth="2" strokeLinejoin="round" />
                    <path d="M-6 -22L-12 -14H26L16 -22Z" fill="#22d3ee" opacity=".55" />
                    <circle cx="-26" cy="-1" r="7" fill="#07010f" stroke="#ff8af0" strokeWidth="2" /><circle cx="28" cy="-1" r="7" fill="#07010f" stroke="#ff8af0" strokeWidth="2" />
                    <circle cx="-44" cy="-8" r="14" fill={f('glowRed')} /><circle cx="-44" cy="-8" r="2.6" fill="#ff4060" />
                    <path d="M-44 -8L-120 -8" stroke="#ff4060" strokeWidth="2.4" opacity=".4" />
                </g>
            </g>

            {/* the frame the video hangs in: neon */}
            {[26, 18, 11].map((g, i) => <rect key={g} x={tv.x - g - 18} y={tv.y - g - 22} width={tv.w + 36 + g * 2} height={tv.h + 36 + g * 2} rx={16 + g} fill="#ff2fd0" opacity={0.05 + i * 0.05} />)}
            <rect x={tv.x - 18} y={tv.y - 22} width={tv.w + 36} height={tv.h + 36} rx="14" fill="#05010d" stroke="#ff2fd0" strokeWidth="4" />
            <rect x={tv.x - 10} y={tv.y - 14} width={tv.w + 20} height={tv.h + 20} rx="9" fill="none" stroke="#22d3ee" strokeWidth="2" />
            {[[left, bottom, 1, 1], [right, bottom, -1, 1], [left, 30, 1, -1], [right, 30, -1, -1]].map(([x, y, sx, sy], i) => (
                <path key={i} d={`M${x} ${y}h${34 * sx}M${x} ${y}v${-34 * sy}`} stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".85" />
            ))}
            <g className="sc-flame">
                <text x="800" y="526" textAnchor="middle" fontFamily={font} fontWeight="900" fontStyle="italic" fontSize="38" letterSpacing="3" fill="none" stroke="#ff2fd0" strokeWidth="9" opacity=".35">SFD-DJ.EU</text>
                <text x="800" y="526" textAnchor="middle" fontFamily={font} fontWeight="900" fontStyle="italic" fontSize="38" letterSpacing="3" fill="#fff0fb" stroke="#ff2fd0" strokeWidth="1.6">SFD-DJ.EU</text>
                <path d="M708 540H892" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" /><path d="M708 540H892" stroke="#22d3ee" strokeWidth="9" strokeLinecap="round" opacity=".3" />
            </g>

            {/* the floor: a glowing grid */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            <rect y={FLOOR - 40} width="1600" height="110" fill={f('horizon')} />
            {floorGrid(height).map(({ i, j }) => ((i * 7 + j * 3 + 100) % 11 === 0 ? <polygon key={`${i}-${j}`} className="sc-tile" style={after(((i + 20) * 13 + j * 7) % 24 / 10)} points={`${lineX(i, rowY(j))},${rowY(j)} ${lineX(i + 1, rowY(j))},${rowY(j)} ${lineX(i + 1, rowY(j + 1))},${rowY(j + 1)} ${lineX(i, rowY(j + 1))},${rowY(j + 1)}`} fill="#22d3ee" opacity=".14" /> : null))}
            <g stroke="#ff2fd0" strokeOpacity=".28" strokeWidth="6">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>
            <g stroke="#ff8af0" strokeOpacity=".95" strokeWidth="1.6">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} stroke="#67e8f9" />)}
            </g>

            {/* palms in silhouette */}
            {silhouettePalm(96, 770, 0.9, 1, 'pl')}{silhouettePalm(1512, 786, 0.95, -1, 'pr')}

            {/* the triangle under the booth */}
            <g transform={`translate(0 ${ext})`}>
            <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="400" ry="74" fill={f('pool')} />
            <g transform={`translate(800 ${SCENE.booth.y + 100}) scale(340 58)`} fill="none" strokeLinejoin="round">
                <circle r="1" stroke="#ff2fd0" strokeWidth="9" vectorEffect="non-scaling-stroke" opacity=".3" />
                <circle r="1" stroke="#ff8af0" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
                <path d="M0 -0.86L0.78 0.55L-0.78 0.55Z" stroke="#22d3ee" strokeWidth="8" vectorEffect="non-scaling-stroke" opacity=".3" />
                <path d="M0 -0.86L0.78 0.55L-0.78 0.55Z" stroke="#a5f3fc" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
                <path d="M0 -0.4L0.34 0.2L-0.34 0.2Z" stroke="#ff8af0" strokeWidth="1.6" vectorEffect="non-scaling-stroke" opacity=".8" />
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
