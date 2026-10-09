import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { femur, skullGlyph } from '@/Components/scene/shapes';
import { after, floorGrid, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, floorTile as tile, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;

// the skulls piled in the two niches, row on row from the ledge up, each a little off from the one below: the same every time
const rs = rand(53);
const pile = (x0: number, x1: number, top: number, bottom: number) => {
    const out: { x: number; y: number; r: number; g: number; o: number; s: number }[] = [];

    for (let row = 0, y = bottom - 26; y > top - 30; row++, y -= 44) {
        for (let x = x0 + (row % 2 ? 0 : 25) - 25; x < x1 + 25; x += 50) out.push({ x: r1(x + (rs() - 0.5) * 8), y: r1(y + (rs() - 0.5) * 6), r: r1((rs() - 0.5) * 22), g: Math.floor(rs() * 3), o: r1(0.62 + rs() * 0.38), s: r1(0.5 + rs() * 0.08) });
    }

    return out;
};
const NICHES = [{ k: 'L', x: 36, list: pile(36, 420, 60, 520) }, { k: 'R', x: 1180, list: pile(1180, 1564, 60, 520) }];
const DUST = Array.from({ length: 18 }, (_, k) => ({ k, x: 80 + rs() * 1440, y: 100 + rs() * 460, r: r1(1.2 + rs() * 1.6), d: -rs() * 4 })).filter((d) => !(d.x > tv.x - 50 && d.x < tv.x + tv.w + 50 && d.y < tv.y + tv.h + 50));
/** A cobweb in the top corner: spokes from the corner and threads between them that sag a little. */
const web = (flip: boolean) => {
    const spokes = [0, 15, 30, 45, 60, 75, 90].map((a) => (a * Math.PI) / 180);
    const at = (a: number, r: number): [number, number] => [r1(Math.cos(a) * r), r1(Math.sin(a) * r)];

    return (
        <g key={String(flip)} transform={flip ? 'translate(1600 0) scale(-1 1)' : undefined} fill="none" stroke="#e4dfd2" strokeOpacity=".3" strokeWidth="1.2">
            {spokes.map((a, i) => <path key={i} d={`M0 0L${at(a, 240).join(' ')}`} />)}
            {[70, 120, 170, 220].map((r) => <path key={r} d={`M${at(spokes[0], r).join(' ')}${spokes.slice(1).map((a, i) => { const [x0, y0] = at(spokes[i], r); const [x1, y1] = at(a, r); return `Q${r1((x0 + x1) * 0.43)} ${r1((y0 + y1) * 0.43)} ${x1} ${y1}`; }).join('')}`} />)}
        </g>
    );
};

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * The skulls scenery on a 1600 x 900 canvas: a candlelit catacomb. Two arched niches stacked with skulls and the ends of bones, a crypt door with an iron gate under the
 * video and an arch of skulls round it, the video in a stone frame with a frieze of little skulls, skull lanterns that burn green, candelabra, mist over the flagstones and a ring of
 * skulls under the booth. Like the others it only moves while a song plays (`live`): the candles and the lanterns flicker and swing, and the mist and the wisps drift.
 */
export default function SkullsBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down
    const ring = SCENE.booth.y + 100;
    const sk = (g: number | string) => `#${u(`sk${g}`)}`;

    /** A candle standing on (x, y), `h` tall, with its flame and the light it throws. */
    const candle = (k: string, x: number, y: number, h: number, delay: number) => (
        <g key={k}>
            <circle className="sc-flame" style={after(delay)} cx={x} cy={y - h - 10} r="42" fill={f('lamp')} />
            <rect x={x - 4} y={y - h} width="8" height={h} rx="1.6" fill="#efe6cf" />
            <rect x={x - 4} y={y - h} width="2.6" height={h} fill="#fff" opacity=".4" />
            <path d={`M${x + 4} ${y - h}V${y - h + 9}Q${x + 2.6} ${y - h + 11} ${x + 1.4} ${y - h + 8}V${y - h}Z`} fill="#fffaf0" />
            <path className="sc-flame" style={after(delay - 0.4)} d={`M${x} ${y - h - 2}C${x - 6} ${y - h - 10} ${x - 2} ${y - h - 16} ${x} ${y - h - 23}C${x + 2} ${y - h - 16} ${x + 6} ${y - h - 10} ${x} ${y - h - 2}Z`} fill="#ffd36b" />
            <path d={`M${x} ${y - h - 3}C${x - 3} ${y - h - 8} ${x - 1} ${y - h - 11} ${x} ${y - h - 15}C${x + 1} ${y - h - 11} ${x + 3} ${y - h - 8} ${x} ${y - h - 3}Z`} fill="#fff6d0" />
        </g>
    );

    /** An iron candelabra with three candles, standing on the floor at (x, y). */
    const candelabra = (k: string, x: number, y: number) => (
        <g key={k}>
            <ellipse cx={x} cy={y + 2} rx="28" ry="5" fill="#000" opacity=".4" />
            <path d={`M${x - 20} ${y}Q${x} ${y - 16} ${x + 20} ${y}Z`} fill="#2b2b33" />
            <path d={`M${x} ${y - 6}V${y - 100}`} stroke="#3a3a46" strokeWidth="6" strokeLinecap="round" />
            <path d={`M${x} ${y - 62}Q${x - 32} ${y - 62} ${x - 36} ${y - 88}M${x} ${y - 62}Q${x + 32} ${y - 62} ${x + 36} ${y - 88}`} fill="none" stroke="#3a3a46" strokeWidth="5" strokeLinecap="round" />
            {([[-36, 88, 0], [0, 104, -0.7], [36, 88, -1.4]] as const).map(([dx, h, d]) => candle(`${k}${dx}`, x + dx, y - h, 24, d))}
        </g>
    );

    /** A skull that burns green from within, hanging on a chain from the roof. It swings and flickers while a song plays. */
    const lantern = (k: string, x: number, chain: number, delay: number) => (
        <g key={k}>
            <circle className="sc-flame" style={after(delay)} cx={x} cy={chain + 40} r="150" fill={f('green')} />
            <g className="sc-dangle" style={after(delay)}>
                <path d={`M${x} -10V${chain}`} stroke="#2b2b33" strokeWidth="3" strokeDasharray="5 3" />
                <g transform={`translate(${x} ${chain + 44}) scale(.62)`}>
                    <path d="M-16 -62H16L22 -50H-22Z" fill="#2b2b33" /><path d="M0 -62V-74" stroke="#2b2b33" strokeWidth="4" />
                    <use href={sk('L')} />
                    {[-16, 16].map((ex) => <g key={ex}><ellipse className="sc-flame" style={after(delay - ex / 40)} cx={ex} cy="-10" rx="8.5" ry="10.5" fill="#b8ff9a" /><ellipse cx={ex} cy="-10" rx="3.8" ry="5.4" fill="#fff" opacity=".9" /></g>)}
                </g>
            </g>
        </g>
    );

    /** One of the two niches in the wall: an arch full of skulls with a ledge and a wall of bone ends under it. */
    const niche = (n: (typeof NICHES)[number]) => {
        const x1 = n.x + 384;
        const d = `M${n.x} 628V252A192 192 0 0 1 ${x1} 252V628Z`;

        return (
            <g key={n.k}>
                <clipPath id={u(`nc${n.k}`)}><path d={d} /></clipPath>
                <path d={d} fill="#0a0604" />
                <g clipPath={f(`nc${n.k}`)}>
                    {n.list.map((s, i) => <use key={i} href={sk(s.g)} opacity={s.o} transform={`translate(${s.x} ${s.y}) rotate(${s.r}) scale(${s.s})`} />)}
                    <rect x={n.x} y="520" width="384" height="108" fill={f('ends')} />
                    <rect x={n.x} y="514" width="384" height="12" fill="#6b5a47" /><rect x={n.x} y="514" width="384" height="3" fill="#a08a6a" />
                    <rect x={n.x} y="526" width="384" height="14" fill="#000" opacity=".35" />
                    <rect x={n.x} y="40" width="384" height="600" fill={f(`ns${n.k}`)} />
                </g>
                <path d={d} fill="none" stroke="#4a3b2c" strokeWidth="16" />
                <path d={d} fill="none" stroke="#8a7358" strokeWidth="3" strokeOpacity=".7" />
                <path d={`M${n.x + 168} 56H${n.x + 216}L${n.x + 206} 86H${n.x + 178}Z`} fill="#7a6650" stroke="#2e241a" strokeWidth="2" />
                {candle(`${n.k}c1`, n.x + 70, 516, 30, n.k === 'L' ? 0 : -0.8)}{candle(`${n.k}c2`, n.x + 318, 516, 22, n.k === 'L' ? -1.3 : -2.1)}
                <use href={sk(0)} transform={`translate(${n.x + 160} 490) scale(.5)`} />
            </g>
        );
    };

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                {skullGlyph(u('sk0'))}
                {skullGlyph(u('sk1'), '#d8cba8', '#9c8e6c')}
                {skullGlyph(u('sk2'), '#bfae86', '#7e6f52')}
                {skullGlyph(u('skL'), '#dfe9d0', '#8ea887', '#06140a')}
                <linearGradient id={u('wall')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#0b0806" /><stop offset=".5" stopColor="#1f1610" /><stop offset="1" stopColor="#3a2a1a" /></linearGradient>
                <linearGradient id={u('stone')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#7a6650" /><stop offset=".5" stopColor="#4a3b2c" /><stop offset="1" stopColor="#2e241a" /></linearGradient>
                <radialGradient id={u('nsL')} cx="228" cy="430" r="330" gradientUnits="userSpaceOnUse"><stop offset=".25" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".78" /></radialGradient>
                <radialGradient id={u('nsR')} cx="1372" cy="430" r="330" gradientUnits="userSpaceOnUse"><stop offset=".25" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".78" /></radialGradient>
                <radialGradient id={u('lamp')} cx=".5" cy=".5" r=".5"><stop stopColor="#fff0b0" stopOpacity=".75" /><stop offset=".45" stopColor="#ffc060" stopOpacity=".26" /><stop offset="1" stopColor="#ff9a1f" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('green')} cx=".5" cy=".5" r=".5"><stop stopColor="#b8ff9a" stopOpacity=".5" /><stop offset=".45" stopColor="#34d399" stopOpacity=".16" /><stop offset="1" stopColor="#34d399" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('crypt')} cx="800" cy="600" r="170" gradientUnits="userSpaceOnUse"><stop stopColor="#8dffb0" stopOpacity=".55" /><stop offset=".6" stopColor="#2dd4a0" stopOpacity=".16" /><stop offset="1" stopColor="#2dd4a0" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('fog')} cx=".5" cy=".5" r=".5"><stop stopColor="#a8b8a0" stopOpacity=".3" /><stop offset="1" stopColor="#a8b8a0" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffd27a" stopOpacity=".5" /><stop offset=".6" stopColor="#f59e0b" stopOpacity=".18" /><stop offset="1" stopColor="#f59e0b" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8a7a60" stopOpacity="0" /><stop offset="1" stopColor="#0a0705" stopOpacity=".62" /></linearGradient>
                <linearGradient id={u('top')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#000" stopOpacity=".7" /><stop offset="1" stopColor="#000" stopOpacity="0" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#050302" stopOpacity=".66" /></radialGradient>
                <pattern id={u('brick')} width="220" height="92" patternUnits="userSpaceOnUse">
                    <rect width="220" height="92" fill="#120d09" />
                    <rect x="3" y="3" width="104" height="40" fill="#2d241b" /><rect x="113" y="3" width="104" height="40" fill="#34291f" />
                    <rect x="-52" y="49" width="104" height="40" fill="#382c21" /><rect x="58" y="49" width="104" height="40" fill="#2a2118" /><rect x="168" y="49" width="104" height="40" fill="#31261c" />
                </pattern>
                <pattern id={u('ends')} width="24" height="22" patternUnits="userSpaceOnUse">
                    <rect width="24" height="22" fill="#120b07" />
                    <circle cx="6" cy="6" r="6" fill="#e3d9bd" /><circle cx="6" cy="6" r="3" fill="#b9ad8d" />
                    <circle cx="18" cy="6" r="6" fill="#d8ccac" /><circle cx="18" cy="6" r="3" fill="#a99d7e" />
                    <circle cx="12" cy="17" r="6" fill="#e9dfc4" /><circle cx="12" cy="17" r="3" fill="#bdb192" />
                    <circle cx="0" cy="17" r="6" fill="#d8ccac" /><circle cx="24" cy="17" r="6" fill="#d8ccac" />
                </pattern>
                <clipPath id={u('door')}><path d="M700 628V540A100 100 0 0 1 900 540V628Z" /></clipPath>
            </defs>

            {/* the wall of the catacomb: old stone, dark towards the roof */}
            <rect width="1600" height="660" fill={f('wall')} />
            <rect width="1600" height="660" fill={f('brick')} opacity=".7" />
            <rect width="1600" height="300" fill={f('top')} />

            {NICHES.map(niche)}
            {web(false)}{web(true)}

            {/* the screen: a frame of stone with a frieze of little skulls, a big skull for a keystone */}
            <rect x={tv.x - 34} y="-30" width={tv.w + 68} height={tv.y + tv.h + 64} rx="6" fill={f('stone')} stroke="#0d0906" strokeWidth="3" />
            <rect x={tv.x - 34} y="-30" width={tv.w + 68} height={tv.y + tv.h + 64} rx="6" fill={f('brick')} opacity=".25" />
            <rect x={tv.x - 9} y={tv.y - 9} width={tv.w + 18} height={tv.h + 18} rx="3" fill="#050302" />
            <rect x={tv.x - 12} y={tv.y - 12} width={tv.w + 24} height={tv.h + 24} rx="5" fill="none" stroke="#7cffa0" strokeOpacity=".16" strokeWidth="9" />
            <rect x={tv.x - 9} y={tv.y - 9} width={tv.w + 18} height={tv.h + 18} rx="3" fill="none" stroke="#d9cfae" strokeOpacity=".85" strokeWidth="2.2" />
            {Array.from({ length: 9 }, (_, i) => 20 + i * 38).flatMap((y) => [tv.x - 21, tv.x + tv.w + 21].map((x) => <use key={`${x}-${y}`} href={sk(1)} transform={`translate(${x} ${y}) scale(.27)`} />))}
            {Array.from({ length: 17 }, (_, i) => tv.x - 4 + i * 36).map((x) => <use key={x} href={sk(2)} transform={`translate(${x} ${tv.y + tv.h + 22}) scale(.27)`} />)}
            <g transform="translate(800 388)">
                <g transform="rotate(28)">{femur('a', 110)}</g><g transform="rotate(-28)">{femur('b', 110)}</g>
            </g>
            <use href={sk(0)} transform="translate(800 386) scale(.66)" />

            {/* the crypt: an arch of skulls, the dark inside with a green glow, an iron gate */}
            <path d="M700 628V540A100 100 0 0 1 900 540V628Z" fill="#040206" />
            <g clipPath={f('door')}>
                <rect x="680" y="420" width="240" height="220" fill={f('crypt')} />
                {[0, 1, 2, 3].map((i) => <rect key={i} x={724 + i * 4} y={600 - i * 16} width={152 - i * 8} height="16" fill="#0a1410" opacity={0.7 - i * 0.12} />)}
                <path className="sc-drift" d="M720 612Q800 590 880 612Q800 626 720 612Z" fill={f('fog')} opacity=".7" />
                <g stroke="#1a1a22" strokeWidth="5">{Array.from({ length: 11 }, (_, i) => <path key={i} d={`M${706 + i * 19} 420V628`} />)}</g>
                <g stroke="#3a3a48" strokeWidth="1.6">{Array.from({ length: 11 }, (_, i) => <path key={i} d={`M${704.4 + i * 19} 430V628`} />)}</g>
                <path d="M700 470H900M700 575H900" stroke="#1a1a22" strokeWidth="7" /><path d="M700 468H900M700 573H900" stroke="#3a3a48" strokeWidth="1.8" />
            </g>
            {Array.from({ length: 13 }, (_, i) => {
                const a = Math.PI + (i * Math.PI) / 12;

                return i === 6 ? null : <use key={i} href={sk(i % 3)} transform={`translate(${r1(800 + Math.cos(a) * 128)} ${r1(540 + Math.sin(a) * 128)}) rotate(${r1(((a - Math.PI * 1.5) * 180) / Math.PI)}) scale(.5)`} />;
            })}
            {[560, 600].flatMap((y) => [672, 928].map((x) => <use key={`${x}-${y}`} href={sk(((x + y) / 4) % 3 | 0)} transform={`translate(${x} ${y}) rotate(${x < 800 ? -8 : 8}) scale(.5)`} />))}

            {/* skull lanterns, candelabra, candles */}
            {lantern('k1', 446, 150, 0)}{lantern('k2', 1154, 150, -1.5)}
            {candelabra('cl', 566, 628)}{candelabra('cr', 1034, 628)}
            {DUST.map((d) => <circle key={d.k} className="sc-wisp" style={after(d.d)} cx={d.x} cy={d.y} r={d.r} fill="#ffe9b0" opacity=".5" />)}

            {/* the floor: flagstones, and the mist that lies on them */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            {floorGrid(height).map(({ i, j }) => <polygon key={`${i}-${j}`} points={tile(i, j)} fill={(i + j) % 2 ? '#8a7a60' : '#0a0705'} opacity={(i * 5 + j * 11 + 100) % 7 < 3 ? 0.12 : 0.06} />)}
            <g stroke="#0a0705" strokeOpacity=".55" strokeWidth="1.5">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>
            {[[150, 668, 18, 0], [1470, 672, -16, 0.9], [452, 646, -10, 0.7]].map(([x, y, r, g], k) => <g key={`fl${k}`}><ellipse cx={x} cy={Number(y) + 30} rx="30" ry="6" fill="#000" opacity=".4" /><use href={sk(Number(g) > 0.8 ? 2 : k % 2)} transform={`translate(${x} ${Number(y) + 4}) rotate(${r}) scale(.46)`} /></g>)}
            {[[240, 700, 12], [1370, 706, -20]].map(([x, y, r]) => <g key={`bn${x}`} transform={`translate(${x} ${y}) rotate(${r})`}>{femur('a', 80)}<g transform="rotate(-62)">{femur('b', 70)}</g></g>)}
            {[[300, 660, 380, 40, 0], [1300, 650, 400, 40, -4], [800, 612, 320, 28, -2]].map(([x, y, rx, ry, d]) => <ellipse key={`${x}${y}`} className="sc-drift" style={after(d)} cx={x} cy={y} rx={rx} ry={ry} fill={f('fog')} />)}

            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="400" ry="74" fill={f('pool')} />
                <ellipse cx="800" cy={ring} rx="340" ry="58" fill="#1b140e" stroke="#6b5a47" strokeWidth="7" />
                <ellipse cx="800" cy={ring} rx="340" ry="58" fill="none" stroke="#a08a6a" strokeWidth="1.6" strokeOpacity=".7" />
                <ellipse cx="800" cy={ring} rx="296" ry="49" fill="none" stroke="#d9cfae" strokeOpacity=".5" strokeWidth="2" strokeDasharray="3 9" />
                {[0, 1, 3, 4, 5, 7].map((k) => { const a = (k * Math.PI) / 4; return <use key={k} href={sk(k % 3)} transform={`translate(${r1(800 + Math.cos(a) * 318)} ${r1(ring + Math.sin(a) * 53)}) scale(.3)`} />; })}
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
