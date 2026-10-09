import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { cloud } from '@/Components/scene/shapes';
import { after, floorGrid, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, floorTile as tile, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const HOUSE = ['#ff5d8f', '#22b8cf', '#ffd43b', '#ff922b', '#94d82d', '#9775fa', '#ff6b6b', '#38d9a9', '#4dabf7', '#f783ac'];
const TILE = ['#22b8cf', '#ffd43b', '#ff5d8f', '#ffffff', '#ff922b'];
const FLAG = ['#ff5d8f', '#ffd43b', '#22b8cf', '#94d82d', '#ff922b', '#9775fa', '#f783ac'];

// the colourful houses on the hills, in the street under the video and the stars: the same every time
const rs = rand(33);
const house = (x: number, y: number, k: number) => ({ x, y, w: 30 + rs() * 12, h: 34 + rs() * 22, c: HOUSE[Math.floor(rs() * 10)], roof: rs() > 0.45, k });
const HOUSES = [
    ...Array.from({ length: 22 }, (_, k) => house(10 + (k % 11) * 38 + rs() * 8, 470 + Math.floor(k / 11) * 54 - (k % 11) * 4.5 + rs() * 8, k)),
    ...Array.from({ length: 22 }, (_, k) => house(1190 + (k % 11) * 38 + rs() * 8, 440 + Math.floor(k / 11) * 54 + (k % 11) * 4.5 + rs() * 8, k + 40)),
    ...Array.from({ length: 16 }, (_, k) => house(430 + k * 46 + rs() * 8, 590 + (k % 3) * 3, k + 80)),
];
const STARS = Array.from({ length: 50 }, () => ({ x: rs() * 1600, y: rs() * 200, r: 0.5 + rs() * 0.9, o: 0.3 + rs() * 0.5 }));
const FAR: [number, number][] = [[0, 420], [100, 360], [190, 400], [300, 320], [420, 410], [560, 380], [700, 430], [860, 396], [1000, 430], [1140, 380], [1250, 350], [1330, 400], [1420, 300], [1500, 390], [1600, 340]];
const ridge = (pts: [number, number][]) => `M0 620${pts.map(([x, y]) => `L${x} ${y}`).join('')}L1600 620Z`;

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * The LATAM scenery on a 1600 x 900 canvas: a warm evening in a Latin American town. A big sun with turning rays, mountains with a volcano, hillsides of colourful houses
 * and a church with two towers, paper flags on strings, a piñata, a macaw across the sky, a llama in the street, agave and cactus, the video in a frame of tiles, and a
 * floor of painted tiles with a sun under the booth. Like the others it only moves while a song plays (`live`): flags sway, the piñata swings, the llama walks, the macaw flies.
 */
export default function LatamBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down
    const left = tv.x - 18;
    const right = tv.x + tv.w + 18;
    const bottom = tv.y + tv.h + 14;
    const ring = SCENE.booth.y + 100;

    const home = (h: ReturnType<typeof house>) => (
        <g key={h.k}>
            <rect x={r1(h.x)} y={r1(h.y - h.h)} width={r1(h.w)} height={r1(h.h)} fill={h.c} />
            <rect x={r1(h.x + h.w * 0.62)} y={r1(h.y - h.h)} width={r1(h.w * 0.38)} height={r1(h.h)} fill="#000" opacity=".14" />
            {h.roof ? <path d={`M${r1(h.x - 3)} ${r1(h.y - h.h)}L${r1(h.x + h.w / 2)} ${r1(h.y - h.h - 11)}L${r1(h.x + h.w + 3)} ${r1(h.y - h.h)}Z`} fill="#c2410c" /> : <rect x={r1(h.x - 2)} y={r1(h.y - h.h - 4)} width={r1(h.w + 4)} height="5" fill="#fff4dd" />}
            <rect x={r1(h.x + 5)} y={r1(h.y - h.h + 8)} width="7" height="9" fill="#fff0b8" /><rect x={r1(h.x + h.w - 13)} y={r1(h.y - h.h + 8)} width="7" height="9" fill="#2a1430" />
            <rect x={r1(h.x + h.w / 2 - 4)} y={r1(h.y - 14)} width="8" height="14" rx="3" fill="#4a2a18" />
        </g>
    );

    const flags = (x0: number, y0: number, x1: number, y1: number, sag: number, k: string, seed: number) => (
        <g key={k} className="sc-bunting" style={after(-seed)}>
            <path d={`M${x0} ${y0}Q${(x0 + x1) / 2} ${(y0 + y1) / 2 + sag} ${x1} ${y1}`} fill="none" stroke="#3a1c2e" strokeWidth="2" />
            {Array.from({ length: Math.round(Math.abs(x1 - x0) / 34) }, (_, i) => {
                const t = (i + 0.5) / Math.round(Math.abs(x1 - x0) / 34);
                const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * ((x0 + x1) / 2) + t * t * x1;
                const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * ((y0 + y1) / 2 + sag) + t * t * y1;
                const c = FLAG[(i + seed) % 7];

                return (
                    <g key={i} transform={`translate(${r1(x - 13)} ${r1(y)})`}>
                        <path d="M0 0H26V32L22 28L17.3 32L13 28L8.7 32L4 28L0 32Z" fill={c} stroke="#00000030" strokeWidth=".8" />
                        <circle cx="13" cy="11" r="4.4" fill="#fff" opacity=".85" /><path d="M4 22L8 18L12 22L8 26ZM14 22L18 18L22 22L18 26Z" fill="#fff" opacity=".6" /><path d="M4 3H8M18 3H22" stroke="#fff" strokeWidth="2" opacity=".7" />
                    </g>
                );
            })}
        </g>
    );

    const tiles: JSX.Element[] = [];
    for (let i = 0; i < 32; i++) {
        tiles.push(<rect key={`l${i}`} x={left - 7} y={-8 + i * 14.4} width="14" height="14" fill={TILE[i % 5]} opacity=".95" />);
        tiles.push(<rect key={`r${i}`} x={right - 7} y={-8 + i * 14.4} width="14" height="14" fill={TILE[(i + 2) % 5]} opacity=".95" />);
    }
    for (let i = 0; i < 53; i++) tiles.push(<rect key={`b${i}`} x={left - 7 + i * 14.4} y={bottom - 7} width="14" height="14" fill={TILE[(i + 1) % 5]} opacity=".95" />);

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('sky')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#2a1060" /><stop offset=".3" stopColor="#8a2a8a" /><stop offset=".55" stopColor="#e6477c" /><stop offset=".78" stopColor="#ff9a3c" /><stop offset="1" stopColor="#ffd86b" /></linearGradient>
                <radialGradient id={u('sunGlow')} cx="250" cy="300" r="420" gradientUnits="userSpaceOnUse"><stop stopColor="#fff2b0" stopOpacity=".9" /><stop offset=".35" stopColor="#ffb347" stopOpacity=".4" /><stop offset="1" stopColor="#ff7a3c" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('far')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a8476b" /><stop offset="1" stopColor="#5c2a5a" /></linearGradient>
                <linearGradient id={u('near')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#c9603c" /><stop offset="1" stopColor="#7a2f3a" /></linearGradient>
                <linearGradient id={u('street')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f0b070" /><stop offset="1" stopColor="#b8683c" /></linearGradient>
                <radialGradient id={u('glowWarm')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffd27a" stopOpacity=".9" /><stop offset=".5" stopColor="#ffa940" stopOpacity=".3" /><stop offset="1" stopColor="#ff9a1f" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('smoke')} cx=".5" cy=".5" r=".5"><stop stopColor="#f1d9d0" stopOpacity=".8" /><stop offset="1" stopColor="#f1d9d0" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <linearGradient id={u('horizon')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffb347" stopOpacity="0" /><stop offset=".5" stopColor="#ffb347" stopOpacity=".3" /><stop offset="1" stopColor="#ffb347" stopOpacity="0" /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffd86b" stopOpacity=".55" /><stop offset=".6" stopColor="#ff7a3c" stopOpacity=".2" /><stop offset="1" stopColor="#ff7a3c" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ff7a3c" stopOpacity="0" /><stop offset="1" stopColor="#1a0a14" stopOpacity=".6" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#2a0a1a" stopOpacity=".5" /></radialGradient>
            </defs>

            {/* the sky: a sun with turning rays, clouds, a macaw */}
            <rect width="1600" height="650" fill={f('sky')} />
            {STARS.map((s, k) => <circle key={k} cx={r1(s.x)} cy={r1(s.y)} r={r1(s.r)} fill="#fff" opacity={r1(s.o)} />)}
            <circle cx="250" cy="300" r="420" fill={f('sunGlow')} />
            <g className="sc-rays" opacity=".6"><g transform="translate(250 300)" fill="#ffe08a">{Array.from({ length: 24 }, (_, k) => <path key={k} d={k % 2 ? 'M-9 -112L0 -150L9 -112Z' : 'M-14 -112L0 -176L14 -112Z'} transform={`rotate(${k * 15})`} />)}</g></g>
            <circle cx="250" cy="300" r="94" fill="#ffe9a0" /><circle cx="250" cy="300" r="80" fill="#ffc83a" /><circle cx="250" cy="300" r="62" fill="none" stroke="#ff8a1c" strokeWidth="3" strokeDasharray="2 7" />
            <g className="sc-drift">{cloud('c1', 200, 150, 0.9, '#ffd0d8', '#e07a9a')}{cloud('c3', 1330, 250, 0.7, '#ffe0c0', '#e89a7a')}</g>
            <g className="sc-drift" style={after(-5)}>{cloud('c2', 470, 70, 0.55, '#ffc9d6', '#d46a8c')}</g>
            <g className="sc-gulls"><g transform="translate(330 200)">
                <path d="M-40 6C-60 4 -78 14 -90 28L-60 16Z" fill="#ef4444" /><ellipse cx="0" cy="0" rx="22" ry="9" fill="#ef4444" /><path d="M-6 -4C-4 -26 14 -34 32 -26C20 -22 14 -10 12 -2Z" fill="#facc15" /><path d="M4 -2C10 -20 26 -28 40 -22C30 -16 24 -8 20 0Z" fill="#2563eb" />
                <circle cx="20" cy="-4" r="8" fill="#ef4444" /><path d="M26 -6L38 -2L28 4Z" fill="#fff3d0" stroke="#7a5a2a" strokeWidth="1" /><circle cx="22" cy="-6" r="2.4" fill="#111827" />
            </g></g>

            {/* the mountains, a volcano with smoke, and a statue on a peak */}
            <path d={ridge(FAR)} fill={f('far')} />
            <path d="M1330 400L1420 300L1500 390Z" fill="#f4eef0" opacity=".85" />
            <path d="M1380 340L1420 300L1460 340Q1440 332 1420 340Q1400 332 1380 340Z" fill="#fff" />
            {[0, 1, 2].map((k) => <circle key={k} className="sc-smoke" style={after(-k * 2.4)} cx="1420" cy="296" r="14" fill={f('smoke')} opacity=".6" />)}
            <g transform="translate(300 322)" fill="#fff0e8"><rect x="-2" y="-30" width="4" height="30" /><path d="M-18 -22H18L16 -17H-16Z" /><circle cy="-34" r="3.6" /></g>
            <path d="M0 520C140 480 300 500 460 508S720 524 900 512S1160 480 1320 494S1520 500 1600 484V650H0Z" fill={f('near')} />

            {/* the town: houses on the hills and in the street, a church */}
            {HOUSES.filter((h) => h.k < 80).map(home)}
            <g transform="translate(1010 598)">
                <ellipse cx="0" cy="2" rx="70" ry="5" fill="#3a1c2e" opacity=".35" />
                <rect x="-48" y="-96" width="96" height="96" fill="#fff0d6" /><rect x="26" y="-96" width="22" height="96" fill="#000" opacity=".1" />
                {[-34, 34].map((x) => <g key={x}><rect x={x - 13} y="-150" width="26" height="60" fill="#fff0d6" /><path d={`M${x - 16} -150L${x} -178L${x + 16} -150Z`} fill="#c2410c" /><path d={`M${x - 6} -138h12v22a6 6 0 0 1 -12 0z`} fill="#4a2a18" /><circle cx={x} cy="-128" r="3" fill="#ffd43b" /></g>)}
                <path d="M-20 0V-30A20 20 0 0 1 20 -30V0Z" fill="#7a3a1a" /><circle cx="0" cy="-66" r="13" fill="#ffd9a0" stroke="#c2410c" strokeWidth="2" /><path d="M0 -76V-56M-10 -66H10" stroke="#c2410c" strokeWidth="1.6" />
                <rect x="-48" y="-100" width="96" height="6" fill="#c2410c" />
            </g>
            {HOUSES.filter((h) => h.k >= 80).map(home)}
            <ellipse cx="800" cy="600" rx="800" ry="22" fill={f('street')} />
            <path d="M0 600C200 590 400 598 800 600S1400 590 1600 598V650H0Z" fill={f('street')} />
            <g className="sc-fox"><g transform="translate(520 624)">
                <g className="sc-bob">
                    <path d="M-22 -22C-24 -40 -18 -62 -10 -78L-2 -74C-6 -58 -4 -40 0 -26Z" fill="#f6ead2" /><ellipse cx="-2" cy="-24" rx="30" ry="15" fill="#f6ead2" />
                    <path d="M-12 -86C-8 -96 6 -98 12 -92L16 -82C10 -80 -4 -78 -12 -76Z" fill="#f6ead2" /><path d="M-6 -96L-8 -108L-1 -97ZM6 -97L10 -108L11 -95Z" fill="#f6ead2" /><circle cx="6" cy="-88" r="2.2" fill="#2a1430" />
                    <path d="M-20 -34H14L10 -16H-16Z" fill="#e6477c" /><path d="M-18 -30H12M-17 -24H10" stroke="#ffd43b" strokeWidth="3" /><path d="M-14 -34L-10 -16M-2 -34L0 -16M8 -34L6 -16" stroke="#22b8cf" strokeWidth="2" />
                    <path d="M-20 -12L-24 8M-8 -10L-10 8M12 -10L14 8M24 -14L28 6" stroke="#f6ead2" strokeWidth="5" strokeLinecap="round" />
                    <path d="M26 -28C34 -30 38 -24 34 -18" fill="#f6ead2" />
                </g>
            </g></g>

            {/* paper flags on strings, and a piñata */}
            {flags(-10, 120, left - 6, 84, 34, 'f1', 0)}{flags(right + 6, 84, 1610, 120, 34, 'f2', 3)}{flags(-10, 318, left - 6, 286, 34, 'f3', 1)}{flags(right + 6, 286, 1610, 318, 34, 'f4', 5)}{flags(left + 6, 500, right - 6, 500, 30, 'f5', 2)}
            <g className="sc-dangle" style={{ transformOrigin: '50% 0' }}>
                <path d="M1380 0V86" stroke="#6b4423" strokeWidth="3" />
                <g transform="translate(1380 138)">
                    {Array.from({ length: 7 }, (_, k) => { const a = (k * Math.PI * 2) / 7 - Math.PI / 2; return <path key={k} d={`M${r1(Math.cos(a - 0.3) * 30)} ${r1(Math.sin(a - 0.3) * 30)}L${r1(Math.cos(a) * 66)} ${r1(Math.sin(a) * 66)}L${r1(Math.cos(a + 0.3) * 30)} ${r1(Math.sin(a + 0.3) * 30)}Z`} fill={FLAG[k]} stroke="#00000030" strokeWidth="1.2" />; })}
                    <circle r="34" fill="#ffd43b" stroke="#00000030" strokeWidth="1.2" /><circle r="34" fill="none" stroke="#ff5d8f" strokeWidth="6" strokeDasharray="6 5" /><circle cx="-8" cy="-4" r="4" fill="#111827" /><circle cx="8" cy="-4" r="4" fill="#111827" /><path d="M-10 10Q0 18 10 10" stroke="#111827" strokeWidth="3" fill="none" strokeLinecap="round" />
                </g>
            </g>

            {/* the frame the video hangs in: tiles */}
            {[22, 14, 8].map((g, i) => <rect key={g} x={tv.x - g - 18} y={tv.y - g - 22} width={tv.w + 36 + g * 2} height={tv.h + 36 + g * 2} rx={14 + g} fill="#ffb347" opacity={0.05 + i * 0.04} />)}
            <rect x={tv.x - 18} y={tv.y - 22} width={tv.w + 36} height={tv.h + 36} rx="10" fill="#1a0a14" />
            {tiles}
            <rect x={tv.x - 12} y={tv.y - 16} width={tv.w + 24} height={tv.h + 24} rx="6" fill="#120610" stroke="#fff" strokeOpacity=".4" strokeWidth="1.4" />

            {/* the floor: painted tiles */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            <rect y={FLOOR - 26} width="1600" height="84" fill={f('horizon')} />
            {floorGrid(height).map(({ i, j }) => <polygon key={`${i}-${j}`} className={(i * 7 + j * 3 + 100) % 17 === 0 ? 'sc-tile' : undefined} style={(i * 7 + j * 3 + 100) % 17 === 0 ? after(((i + 20) * 13 + j * 7) % 24 / 10) : undefined} points={tile(i, j)} fill={TILE[(i * 3 + j * 2 + 100) % 5]} opacity={(i * 7 + j * 3 + 100) % 17 === 0 ? 0.3 : 0.2} />)}
            <g stroke="#fff" strokeOpacity=".16" strokeWidth="1.2">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>

            {/* agave and cactus */}
            <g transform="translate(96 782)">
                <ellipse cx="0" cy="6" rx="70" ry="9" fill="#000" opacity=".35" />
                {[-70, -48, -26, -6, 14, 36, 58].map((a, i) => <path key={a} transform={`rotate(${a})`} d={`M0 0C-14 -30 -10 -80 0 -${96 - Math.abs(a) * 0.3}C10 -80 14 -30 0 0Z`} fill={i % 2 ? '#2f9e8a' : '#3cb89a'} stroke="#17695a" strokeWidth="1.4" />)}
            </g>
            <g transform="translate(1520 790)">
                <ellipse cx="0" cy="6" rx="64" ry="8" fill="#000" opacity=".35" />
                <path d="M-14 0V-120Q0 -134 14 -120V0Z" fill="#37a05a" stroke="#1d6a38" strokeWidth="2" /><path d="M-14 -50H-40Q-52 -50 -52 -64V-92Q-52 -102 -42 -102Q-32 -102 -32 -92V-66H-14Z" fill="#37a05a" stroke="#1d6a38" strokeWidth="2" /><path d="M14 -70H38Q50 -70 50 -84V-104Q50 -114 40 -114Q30 -114 30 -104V-86H14Z" fill="#37a05a" stroke="#1d6a38" strokeWidth="2" />
                <path d="M0 -118V-6M-7 -110V-8M7 -110V-8" stroke="#1d6a38" strokeWidth="1" opacity=".6" /><circle cx="0" cy="-130" r="9" fill="#ff5d8f" /><circle cx="0" cy="-130" r="4" fill="#ffd43b" />
            </g>

            {/* the sun under the booth */}
            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="400" ry="74" fill={f('pool')} />
                <g transform={`translate(800 ${ring}) scale(340 58)`}>
                    {Array.from({ length: 36 }, (_, k) => { const a = (k * Math.PI) / 18; const w = 0.045; return <path key={k} d={`M${r1(Math.cos(a - w) * 80) / 100} ${r1(Math.sin(a - w) * 80) / 100}L${r1(Math.cos(a) * 99) / 100} ${r1(Math.sin(a) * 99) / 100}L${r1(Math.cos(a + w) * 80) / 100} ${r1(Math.sin(a + w) * 80) / 100}Z`} fill={k % 2 ? '#ff5d8f' : '#ffd43b'} opacity=".85" />; })}
                    <circle r="0.78" fill="none" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" opacity=".8" /><circle r="0.62" fill="none" stroke="#22b8cf" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeDasharray="5 6" />
                    <path d="M0 -0.5L0.12 -0.12L0.5 0L0.12 0.12L0 0.5L-0.12 0.12L-0.5 0L-0.12 -0.12Z" fill="#ffd43b" opacity=".7" />
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
