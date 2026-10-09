import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { after, floorGrid, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, floorTile as tile, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const COLORS = ['#ff2fd0', '#22d3ee', '#facc15', '#4ade80', '#a78bfa'];

// the moving heads on the truss (where they hang, the way they point, the colour, how fast they sweep), the glints and the dust: the same every time
const HEADS = [
    { x: 40, a: -14, c: 0, d: 5.2 }, { x: 130, a: 6, c: 1, d: 6.4 }, { x: 220, a: -6, c: 2, d: 4.6 }, { x: 310, a: 12, c: 3, d: 7.1 }, { x: 395, a: -10, c: 4, d: 5.8 },
    { x: 1205, a: 10, c: 4, d: 6.0 }, { x: 1290, a: -12, c: 3, d: 4.8 }, { x: 1380, a: 6, c: 2, d: 7.3 }, { x: 1470, a: -6, c: 1, d: 5.4 }, { x: 1560, a: 14, c: 0, d: 6.6 },
];
const rs = rand(61);
const DUST = Array.from({ length: 60 }, () => ({ x: rs() * 1600, y: rs() * 640, r: 0.6 + rs() * 1.4, o: 0.2 + rs() * 0.5 }));
const TRUSS = (x0: number, x1: number) => `M${x0} 8H${x1}M${x0} 30H${x1}${Array.from({ length: 10 }, (_, i) => `M${r1(x0 + ((x1 - x0) * i) / 10)} 8L${r1(x0 + ((x1 - x0) * (i + 0.5)) / 10)} 30L${r1(x0 + ((x1 - x0) * (i + 1)) / 10)} 8`).join('')}`;

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * The lightshow scenery on a 1600 x 900 canvas: a dark club that is all lights. Moving heads on a truss sweep beams across the room, laser fans, two mirror balls
 * with glints, LED columns by the booth, spots that drift over a black floor of tiles that flash, and a ring of colour under the booth, with the video in an LED frame.
 * Like the others it only moves while a song plays (`live`).
 */
export default function LightshowBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down
    const left = tv.x - 18;
    const right = tv.x + tv.w + 18;
    const bottom = tv.y + tv.h + 14;
    const ring = SCENE.booth.y + 100;

    const ball = (cx: number, cy: number, r: number, k: string) => (
        <g key={k}>
            <path d={`M${cx} 0V${cy - r}`} stroke="#6b7280" strokeWidth="2" />
            <clipPath id={u(`ball${k}`)}><circle cx={cx} cy={cy} r={r} /></clipPath>
            <circle cx={cx} cy={cy} r={r} fill="#3b4256" />
            <g clipPath={f(`ball${k}`)}>
                <g className="sc-facets">
                    {Array.from({ length: 16 }, (_, i) => <path key={`v${i}`} d={`M${cx - r - 24 + i * 12} ${cy - r}V${cy + r}`} stroke="#0b0d16" strokeWidth="1.4" />)}
                    {Array.from({ length: 11 }, (_, i) => <path key={`h${i}`} d={`M${cx - r - 24} ${cy - r + i * (r / 5)}H${cx + r + 24}`} stroke="#0b0d16" strokeWidth="1.4" />)}
                    {Array.from({ length: 22 }, (_, i) => <rect key={`f${i}`} x={cx - r + ((i * 37) % (r * 2 - 10))} y={cy - r + ((i * 53) % (r * 2 - 10))} width="10" height="10" fill={COLORS[i % 5]} opacity=".55" />)}
                </g>
                <circle cx={cx - r * 0.35} cy={cy - r * 0.35} r={r * 0.9} fill={f('ballShade')} />
            </g>
            {[[-1.5, -0.5], [1.6, -0.2], [0.2, 1.7], [-1.1, 1.2], [1.2, 1.3]].map(([dx, dy], i) => (
                <path key={i} className={i % 2 ? undefined : 'sc-twinkle'} style={i % 2 ? undefined : after(-i * 0.4)} d={`M${r1(cx + dx * r)} ${r1(cy + dy * r - 9)}L${r1(cx + dx * r + 2)} ${r1(cy + dy * r - 2)}L${r1(cx + dx * r + 9)} ${r1(cy + dy * r)}L${r1(cx + dx * r + 2)} ${r1(cy + dy * r + 2)}L${r1(cx + dx * r)} ${r1(cy + dy * r + 9)}L${r1(cx + dx * r - 2)} ${r1(cy + dy * r + 2)}L${r1(cx + dx * r - 9)} ${r1(cy + dy * r)}L${r1(cx + dx * r - 2)} ${r1(cy + dy * r - 2)}Z`} fill="#fff" />
            ))}
        </g>
    );

    const pillar = (x: number, k: string) => (
        <g key={k}>
            <rect x={x - 26} y="470" width="52" height="170" rx="6" fill="#07070f" stroke="#2a2a46" strokeWidth="2" />
            {Array.from({ length: 10 }, (_, i) => <rect key={i} className={(i + k.length) % 3 ? undefined : 'sc-twinkle'} style={(i + k.length) % 3 ? undefined : after(-i * 0.17)} x={x - 19} y={478 + i * 15.6} width="38" height="11" rx="2" fill={i < 3 ? '#ef4444' : i < 6 ? '#facc15' : '#4ade80'} opacity=".9" />)}
        </g>
    );

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                {COLORS.map((c, i) => <linearGradient key={c} id={u(`beam${i}`)} x1="0" y1="0" x2="0" y2="1"><stop stopColor={c} stopOpacity=".7" /><stop offset=".6" stopColor={c} stopOpacity=".2" /><stop offset="1" stopColor={c} stopOpacity="0" /></linearGradient>)}
                {COLORS.map((c, i) => <radialGradient key={`s${c}`} id={u(`spot${i}`)} cx=".5" cy=".5" r=".5"><stop stopColor={c} stopOpacity=".6" /><stop offset="1" stopColor={c} stopOpacity="0" /></radialGradient>)}
                <linearGradient id={u('bg')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#03030a" /><stop offset=".6" stopColor="#0a0820" /><stop offset="1" stopColor="#12082a" /></linearGradient>
                <radialGradient id={u('ballShade')} cx=".35" cy=".3" r=".8"><stop stopColor="#fff" stopOpacity=".7" /><stop offset=".4" stopColor="#fff" stopOpacity=".08" /><stop offset="1" stopColor="#000" stopOpacity=".6" /></radialGradient>
                <linearGradient id={u('rainbow')} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#ff2fd0" /><stop offset=".25" stopColor="#facc15" /><stop offset=".5" stopColor="#4ade80" /><stop offset=".75" stopColor="#22d3ee" /><stop offset="1" stopColor="#a78bfa" /></linearGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <linearGradient id={u('horizon')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a78bfa" stopOpacity="0" /><stop offset=".5" stopColor="#a78bfa" stopOpacity=".28" /><stop offset="1" stopColor="#a78bfa" stopOpacity="0" /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#e9d5ff" stopOpacity=".45" /><stop offset=".6" stopColor="#7c3aed" stopOpacity=".18" /><stop offset="1" stopColor="#7c3aed" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('fog')} cx=".5" cy=".5" r=".5"><stop stopColor="#c4b5fd" stopOpacity=".28" /><stop offset="1" stopColor="#c4b5fd" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#7c3aed" stopOpacity="0" /><stop offset="1" stopColor="#02020a" stopOpacity=".7" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".5" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".7" /></radialGradient>
            </defs>

            {/* the dark room, dust in the light, the truss with the moving heads and the beams they sweep */}
            <rect width="1600" height="650" fill={f('bg')} />
            {DUST.map((s, k) => <circle key={k} cx={r1(s.x)} cy={r1(s.y)} r={r1(s.r)} fill="#c4b5fd" opacity={r1(s.o * 0.5)} />)}
            {HEADS.map((h, i) => (
                <g key={i} transform={`rotate(${h.a} ${h.x} 30)`}>
                    <g className="sc-sweep" style={{ transformOrigin: `${h.x}px 30px`, animationDuration: `${h.d}s`, animationDelay: `-${i * 0.9}s` }}>
                        <path d={`M${h.x - 4} 30L${h.x - 70} 760L${h.x + 70} 760L${h.x + 4} 30Z`} fill={f(`beam${h.c}`)} />
                    </g>
                </g>
            ))}
            <g fill="none" stroke="#3a3a5a" strokeWidth="2.4">
                <path d={TRUSS(0, 440)} /><path d={TRUSS(1160, 1600)} />
            </g>
            {HEADS.map((h, i) => <g key={`h${i}`}><rect x={h.x - 10} y="26" width="20" height="16" rx="4" fill="#161628" stroke="#5a5a8a" strokeWidth="1.4" /><circle cx={h.x} cy="42" r="6" fill={COLORS[h.c]} /><circle cx={h.x} cy="42" r="14" fill={COLORS[h.c]} opacity=".35" /></g>)}
            <g className="sc-sweep" style={{ transformOrigin: '170px 70px', animationDuration: '3.4s' }}>{Array.from({ length: 8 }, (_, i) => <path key={i} d={`M170 70L${r1(170 + (i - 3.5) * 120)} 700`} stroke="#4ade80" strokeWidth="1.6" opacity=".75" />)}</g>
            <g className="sc-sweep" style={{ transformOrigin: '1430px 70px', animationDuration: '4.1s', animationDelay: '-1.7s' }}>{Array.from({ length: 8 }, (_, i) => <path key={i} d={`M1430 70L${r1(1430 + (i - 3.5) * 120)} 700`} stroke="#f43f5e" strokeWidth="1.6" opacity=".75" />)}</g>
            {ball(300, 190, 58, 'A')}{ball(1310, 150, 40, 'B')}

            {/* the LED frame the video hangs in */}
            {[24, 16, 9].map((g, i) => <rect key={g} x={tv.x - g - 18} y={tv.y - g - 22} width={tv.w + 36 + g * 2} height={tv.h + 36 + g * 2} rx={14 + g} fill="#a78bfa" opacity={0.04 + i * 0.04} />)}
            <rect x={tv.x - 18} y={tv.y - 22} width={tv.w + 36} height={tv.h + 36} rx="12" fill="#02020a" stroke={f('rainbow')} strokeWidth="7" />
            <rect x={tv.x - 18} y={tv.y - 22} width={tv.w + 36} height={tv.h + 36} rx="12" fill="none" stroke={f('rainbow')} strokeWidth="20" opacity=".18" />
            <rect x={tv.x - 9} y={tv.y - 13} width={tv.w + 18} height={tv.h + 18} rx="6" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="1.4" />
            {[[left, bottom, 0], [right, bottom, 1], [left, 24, 2], [right, 24, 3]].map(([x, y, i]) => <path key={`${x}${y}`} className="sc-twinkle" style={after(-Number(i) * 0.6)} d={`M${x} ${Number(y) - 30}L${Number(x) + 4} ${Number(y) - 4}L${Number(x) + 30} ${y}L${Number(x) + 4} ${Number(y) + 4}L${x} ${Number(y) + 30}L${Number(x) - 4} ${Number(y) + 4}L${Number(x) - 30} ${y}L${Number(x) - 4} ${Number(y) - 4}Z`} fill="#fff" />)}

            {pillar(520, 'pl')}{pillar(1080, 'pr')}

            {/* the floor: black tiles that flash, spots that drift */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            <rect y={FLOOR - 30} width="1600" height="90" fill={f('horizon')} />
            {floorGrid(height).map(({ i, j }) => {
                const lit = (i * 7 + j * 3 + 100) % 6 === 0;

                return <polygon key={`${i}-${j}`} className={lit ? 'sc-tile' : undefined} style={lit ? after(((i + 20) * 13 + j * 7) % 24 / 10) : undefined} points={tile(i, j)} fill={lit ? COLORS[(i * 3 + j + 100) % 5] : '#ffffff'} opacity={lit ? 0.3 : 0.03} />;
            })}
            <g stroke="#c4b5fd" strokeOpacity=".16" strokeWidth="1.2">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>
            {[[300, 720, 0], [800, 700, 1], [1300, 740, 2], [560, 800, 3]].map(([x, y, c], k) => <ellipse key={k} className="sc-drift" style={after(-k * 2.2)} cx={x} cy={y} rx="240" ry="46" fill={f(`spot${c}`)} />)}

            {/* a ring of colour under the booth */}
            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="400" ry="74" fill={f('pool')} />
                <ellipse cx="800" cy={ring} rx="340" ry="58" fill="none" stroke={f('rainbow')} strokeWidth="10" opacity=".3" />
                <ellipse cx="800" cy={ring} rx="340" ry="58" fill="none" stroke={f('rainbow')} strokeWidth="2.6" />
                <ellipse className="sc-dash" cx="800" cy={ring} rx="304" ry="51.6" fill="none" stroke="#fff" strokeWidth="3.4" strokeDasharray="60 1010" />
                <ellipse cx="800" cy={ring} rx="270" ry="45" fill="none" stroke="#22d3ee" strokeOpacity=".5" strokeWidth="1.6" strokeDasharray="3 9" />
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 4} rx="184" ry="15" fill="#000" opacity=".6" />
            </g>
            <ellipse className="sc-drift" cx="300" cy="650" rx="360" ry="40" fill={f('fog')} /><ellipse className="sc-drift" style={after(-4)} cx="1300" cy="640" rx="380" ry="40" fill={f('fog')} />

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
