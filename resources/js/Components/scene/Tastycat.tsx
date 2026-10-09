import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { after, floorGrid, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, floorTile as tile, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const font = 'Figtree, system-ui, sans-serif';
const PINK = '#ff5fa2';
const MINT = '#4fe0c0';
const CANDY = ['#ff5fa2', '#4fe0c0', '#ffd23f', '#a78bfa', '#ff8a3d'];

// the dots of piping round the video, the sparkles on the wall and the sprinkles on the floor: the same every time
const rs = rand(57);
const SPARKS = Array.from({ length: 22 }, (_, k) => ({ k, x: r1(rs() * 1600), y: r1(110 + rs() * 420), s: r1(0.5 + rs() * 0.8) })).filter((s) => !(s.x > 440 && s.x < 1160 && s.y < 450) && !(s.x < 320 && s.y > 240) && !(s.x > 1170 && s.y > 320));
const SPRINKLES = Array.from({ length: 70 }, (_, k) => ({ k, x: r1(rs() * 1600), y: r1(648 + rs() * 240), r: r1(rs() * 180), c: CANDY[k % 5] }));

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * The Tastycat scenery on a 1600 x 900 canvas: a bakery for cats, all pastel. A striped awning over the wall of polka dots, the video in a frame piped like a cake, a glass cabinet of cupcakes,
 * macarons and donuts with a chef cat on top, a three-tier cake on a table with a baker cat beside it, cupcake lamps, and a checkered floor with a donut under the booth. Sprinkles fall over
 * the room (Snow.tsx). Like the others it only moves while a song plays (`live`): tails swish, candles flicker and the lamps glow.
 */
export default function TastycatBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down
    const ring = SCENE.booth.y + 100;

    /** A cat sitting up and looking at us, its feet on (x, y), `s` times its size (about 140 tall). `hat` is what it wears. */
    const kitty = (k: string, x: number, y: number, s: number, fur: string, belly: string, hat: 'chef' | 'bow' | 'beret', flip = 1, delay = 0) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s * flip} ${s})`}>
            <ellipse cx="0" cy="3" rx="50" ry="7" fill="#7a2a55" opacity=".18" />
            <g className="sc-kick" style={after(delay)}><path d="M26 -6C76 -2 80 -54 56 -80C54 -64 60 -54 50 -38C44 -28 34 -22 22 -20Z" fill={fur} /></g>
            <path d="M-35 0C-45 -36 -32 -70 0 -72C32 -70 45 -36 35 0Z" fill={fur} />
            <ellipse cx="0" cy="-26" rx="18" ry="25" fill={belly} />
            <ellipse cx="-15" cy="-3" rx="12" ry="6.4" fill={belly} /><ellipse cx="15" cy="-3" rx="12" ry="6.4" fill={belly} />
            <path d="M-29 -88L-33 -116L-9 -101ZM29 -88L33 -116L9 -101Z" fill={fur} /><path d="M-26 -93L-28 -108L-15 -99ZM26 -93L28 -108L15 -99Z" fill="#ffb3d1" />
            <ellipse cx="0" cy="-82" rx="36" ry="30" fill={fur} />
            <ellipse cx="-12.5" cy="-84" rx="4.4" ry="5.4" fill="#2a1a2e" /><ellipse cx="12.5" cy="-84" rx="4.4" ry="5.4" fill="#2a1a2e" />
            <circle cx="-11" cy="-86.2" r="1.6" fill="#fff" /><circle cx="14" cy="-86.2" r="1.6" fill="#fff" />
            <ellipse cx="-23" cy="-73" rx="6.4" ry="3.8" fill="#ff8fb8" opacity=".6" /><ellipse cx="23" cy="-73" rx="6.4" ry="3.8" fill="#ff8fb8" opacity=".6" />
            <path d="M-3.4 -76L3.4 -76L0 -72Z" fill="#ff7aa8" /><path d="M0 -72Q-4 -66 -8 -69M0 -72Q4 -66 8 -69" stroke="#7a3a55" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M-26 -76L-46 -79M-26 -73L-46 -71M26 -76L46 -79M26 -73L46 -71" stroke="#fff" strokeWidth="1.2" opacity=".9" strokeLinecap="round" />
            {hat === 'chef' && (
                <g>
                    <rect x="-22" y="-118" width="44" height="14" rx="3" fill="#fff" stroke="#e5d6e0" strokeWidth="1.4" />
                    {[[-17, -129, 14], [0, -137, 17], [17, -129, 14]].map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill="#fff" stroke="#e5d6e0" strokeWidth="1.4" />)}
                    <rect x="-22" y="-118" width="44" height="14" rx="3" fill="#fff" /><path d="M-12 -116V-106M0 -116V-106M12 -116V-106" stroke="#e5d6e0" strokeWidth="1.2" />
                </g>
            )}
            {hat === 'bow' && <g transform="translate(0 -56)"><path d="M0 0L-16 -9V9ZM0 0L16 -9V9Z" fill={PINK} stroke="#be185d" strokeWidth="1" strokeLinejoin="round" /><circle r="4" fill="#ff8fc0" stroke="#be185d" strokeWidth="1" /></g>}
            {hat === 'beret' && <g><path d="M-30 -104C-30 -122 28 -126 34 -108C26 -100 -20 -98 -30 -104Z" fill="#a78bfa" stroke="#6d28d9" strokeWidth="1.2" strokeLinejoin="round" /><circle cx="2" cy="-123" r="3.4" fill="#6d28d9" /></g>}
        </g>
    );

    const cupcake = (k: string, x: number, y: number, s: number, frosting: string, wrapper: string) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
            <path d="M-13 0L-11 -15H11L13 0Z" fill={wrapper} stroke="#b45309" strokeOpacity=".5" strokeWidth="1" strokeLinejoin="round" /><path d="M-6 -15V0M0 -15V0M6 -15V0" stroke="#b45309" strokeOpacity=".3" strokeWidth="1" />
            <path d="M-15 -14C-18 -26 -8 -30 -4 -34C-2 -42 6 -42 6 -34C14 -32 18 -24 15 -14Z" fill={frosting} stroke="#be185d" strokeOpacity=".4" strokeWidth="1" strokeLinejoin="round" />
            <circle cx="1" cy="-43" r="4.4" fill="#ef4444" /><path d="M1 -47Q3 -51 7 -50" stroke="#166534" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            {[[-8, -22], [4, -26], [8, -19]].map(([dx, dy], i) => <rect key={i} x={dx - 2} y={dy} width="4" height="1.8" rx=".9" transform={`rotate(${i * 50 - 30} ${dx} ${dy})`} fill={CANDY[(i + 2) % 5]} />)}
        </g>
    );

    const macaron = (k: string, x: number, y: number, a: string, b: string) => (
        <g key={k} transform={`translate(${x} ${y})`}>
            <ellipse cy="-9" rx="13" ry="6.4" fill={a} /><rect x="-12" y="-9" width="24" height="3.4" rx="1.7" fill="#fff7e8" /><ellipse cy="-5.4" rx="13" ry="6.4" fill={b} />
            <path d="M-8 -12Q-3 -15 2 -14" stroke="#fff" strokeOpacity=".6" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
    );

    const donut = (k: string, x: number, y: number, s: number, glaze: string) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse cy="-1" rx="20" ry="4" fill="#7a2a55" opacity=".16" />
            <ellipse cy="-12" rx="20" ry="13" fill="#e8b068" /><ellipse cy="-14" rx="18.4" ry="11.6" fill={glaze} /><ellipse cy="-14" rx="6.4" ry="3.6" fill="#f4fffb" opacity=".95" />
            {[[-12, -16], [-6, -9], [9, -10], [13, -17], [3, -22], [-14, -11]].map(([dx, dy], i) => <rect key={i} x={dx - 2} y={dy} width="4" height="1.8" rx=".9" transform={`rotate(${i * 55} ${dx} ${dy})`} fill={CANDY[(i + 1) % 5]} />)}
        </g>
    );

    /** A candle with a flame that flickers. */
    const candle = (k: string, x: number, y: number, c: string, delay: number) => (
        <g key={k}><rect x={x - 2.4} y={y - 22} width="4.8" height="22" rx="1.4" fill={c} /><path d={`M${x - 2.4} ${y - 14}L${x + 2.4} ${y - 18}M${x - 2.4} ${y - 8}L${x + 2.4} ${y - 12}`} stroke="#fff" strokeOpacity=".7" strokeWidth="1.2" /><path className="sc-flame" style={after(delay)} d={`M${x} ${y - 24}C${x - 6} ${y - 32} ${x - 1} ${y - 36} ${x} ${y - 42}C${x + 1} ${y - 36} ${x + 6} ${y - 32} ${x} ${y - 24}Z`} fill="#ffd23f" /><circle cx={x} cy={y - 28} r="9" fill="#ffd23f" opacity=".25" /></g>
    );

    /** A cupcake lamp that hangs from the awning. */
    const lamp = (k: string, x: number, delay: number) => (
        <g key={k}>
            <path d={`M${x} 96V162`} stroke="#c0407f" strokeWidth="2.4" />
            <circle className="sc-flame" style={after(delay)} cx={x} cy="196" r="62" fill={f('lamp')} />
            <path d={`M${x - 24} 218L${x - 20} 192H${x + 20}L${x + 24} 218Z`} fill="#fde68a" stroke="#b45309" strokeOpacity=".5" strokeWidth="1.2" strokeLinejoin="round" />
            <path d={`M${x - 26} 194C${x - 30} 172 ${x - 12} 164 ${x} 166C${x + 12} 164 ${x + 30} 172 ${x + 26} 194Z`} fill="#ffd1e8" stroke="#be185d" strokeOpacity=".55" strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx={x} cy="163" r="5.4" fill="#ef4444" />
            <ellipse cx={x} cy="205" rx="10" ry="5" fill="#fff7c2" />
        </g>
    );

    /** The white icing on top of a tier of cake, with drips along its lower edge: the tier starts at x0, is w wide and its top is at y. */
    const icing = (x0: number, w: number, y: number) => {
        const n = Math.round(w / 26);
        const seg = w / n;
        let d = `M${x0} ${y + 14}Q${x0} ${y} ${x0 + 14} ${y}H${x0 + w - 14}Q${x0 + w} ${y} ${x0 + w} ${y + 14}V${y + 20}`;
        for (let i = 0; i < n; i++) d += `Q${r1(x0 + w - seg * (i + 0.5))} ${y + 20 + (i % 2 ? 22 : 10)} ${r1(x0 + w - seg * (i + 1))} ${y + 20}`;

        return `${d}Z`;
    };

    /** A zigzag of white icing round the donut under the booth. */
    const drizzle = `M${Array.from({ length: 56 }, (_, k) => { const a = (k * Math.PI * 2) / 56; const rr = k % 2 ? 318 : 336; return `${r1(800 + Math.cos(a) * rr)} ${r1(ring - 6 + Math.sin(a) * rr * 0.163)}`; }).join('L')}Z`;

    const awningStripes = Array.from({ length: 20 }, (_, k) => k);

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('wall')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffb3d4" /><stop offset=".55" stopColor="#ffd3e6" /><stop offset="1" stopColor="#fff0f6" /></linearGradient>
                <pattern id={u('dots')} width="70" height="70" patternUnits="userSpaceOnUse"><circle cx="17" cy="17" r="7" fill="#fff" opacity=".5" /><circle cx="52" cy="52" r="7" fill="#fff" opacity=".5" /></pattern>
                <pattern id={u('gingham')} width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#fff" /><rect width="12" height="24" fill="#ff8fc0" opacity=".5" /><rect width="24" height="12" fill="#ff8fc0" opacity=".5" /></pattern>
                <linearGradient id={u('mintwall')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a9efdc" /><stop offset="1" stopColor="#7fdcc4" /></linearGradient>
                <linearGradient id={u('glass')} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffffff" stopOpacity=".85" /><stop offset=".5" stopColor="#e6fbf5" stopOpacity=".55" /><stop offset="1" stopColor="#ffffff" stopOpacity=".8" /></linearGradient>
                <radialGradient id={u('lamp')} cx=".5" cy=".5" r=".5"><stop stopColor="#fff7c2" stopOpacity=".85" /><stop offset=".5" stopColor="#ffd1e8" stopOpacity=".3" /><stop offset="1" stopColor="#ffd1e8" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffd9e8" /><stop offset="1" stopColor="#c76a97" /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#fff" stopOpacity=".7" /><stop offset=".6" stopColor="#ffc2dd" stopOpacity=".3" /><stop offset="1" stopColor="#ffc2dd" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('glaze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffb3d4" /><stop offset="1" stopColor="#ff7ab5" /></linearGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffd1e8" stopOpacity="0" /><stop offset="1" stopColor="#7a2a55" stopOpacity=".28" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".62" stopColor="#7a2a55" stopOpacity="0" /><stop offset="1" stopColor="#7a2a55" stopOpacity=".34" /></radialGradient>
                <filter id={u('soft')} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8" /></filter>
            </defs>

            {/* the wall: pink, polka dots, a mint panel at the foot of it */}
            <rect width="1600" height={FLOOR + 24} fill={f('wall')} />
            <rect width="1600" height={FLOOR} fill={f('dots')} />
            <rect y="540" width="1600" height="90" fill={f('mintwall')} /><rect y="536" width="1600" height="8" fill="#fff" />
            {Array.from({ length: 32 }, (_, k) => <path key={k} d={`M${k * 50 + 25} 548V628`} stroke="#fff" strokeOpacity=".45" strokeWidth="3" />)}
            {SPARKS.map((s) => <path key={s.k} className="sc-twinkle" style={after(-s.k * 0.4)} transform={`translate(${s.x} ${s.y}) scale(${s.s})`} d="M0 -8L2 -2L8 0L2 2L0 8L-2 2L-8 0L-2 -2Z" fill="#fff" opacity=".9" />)}

            {/* the awning over the whole wall: stripes with a scalloped edge, and bunting */}
            <g>
                {awningStripes.map((k) => <path key={k} d={`M${k * 80} -4H${k * 80 + 80}V84A40 40 0 0 1 ${k * 80} 84Z`} fill={k % 2 ? '#fff' : PINK} />)}
                {awningStripes.map((k) => <path key={`e${k}`} d={`M${k * 80} 84A40 40 0 0 0 ${k * 80 + 80} 84`} fill="none" stroke="#b02a6a" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" />)}
                <rect y="-4" width="1600" height="12" fill="#c0407f" opacity=".5" />
                <rect y="120" width="1600" height="16" fill="#7a2a55" opacity=".1" filter={`url(#${u('soft')})`} />
            </g>
            {lamp('l1', 372, 0)}{lamp('l2', 1228, -1.2)}

            {/* the video: a frame piped like a cake, a board with the name hanging under it */}
            <rect x={tv.x - 34} y="-30" width={tv.w + 68} height={tv.y + tv.h + 70} rx="26" fill="#fff6ea" stroke={PINK} strokeWidth="6" />
            {Array.from({ length: 34 }, (_, k) => k).map((k) => <circle key={`t${k}`} cx={r1(tv.x - 22 + (k * (tv.w + 44)) / 33)} cy={tv.y + tv.h + 26} r="5.2" fill={CANDY[k % 5]} stroke="#fff" strokeWidth="1.6" />)}
            {Array.from({ length: 14 }, (_, k) => k).flatMap((k) => [[tv.x - 22, 6 + k * 24], [tv.x + tv.w + 22, 6 + k * 24]].map(([x, y], i) => <circle key={`s${k}${i}`} cx={x} cy={y} r="5.2" fill={CANDY[(k + i * 2) % 5]} stroke="#fff" strokeWidth="1.6" />))}
            <rect x={tv.x - 12} y={tv.y - 12} width={tv.w + 24} height={tv.h + 24} rx="12" fill="#fff" stroke={PINK} strokeWidth="3" strokeDasharray="1 9" strokeLinecap="round" />
            <rect x={tv.x - 9} y={tv.y - 9} width={tv.w + 18} height={tv.h + 18} rx="8" fill="#2a0f24" />
            <path d="M706 372V402M894 372V402" stroke={PINK} strokeWidth="5" strokeLinecap="round" />
            <path d="M606 402H994V452Q970 468 946 452Q922 468 898 452Q874 468 850 452Q826 468 802 452Q778 468 754 452Q730 468 706 452Q682 468 658 452Q634 468 606 452Z" fill="#fff" stroke={PINK} strokeWidth="3.4" strokeLinejoin="round" />
            <g transform="translate(646 428)"><path d="M-18 12L-20 -12L-7 -3L0 -5L7 -3L20 -12L18 12Q0 22 -18 12Z" fill="#ffb3d1" stroke="#be185d" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="-7" cy="1" r="2.2" fill="#2a1a2e" /><circle cx="7" cy="1" r="2.2" fill="#2a1a2e" /><path d="M-3 7Q0 10 3 7" fill="none" stroke="#7a3a55" strokeWidth="1.4" strokeLinecap="round" /></g>
            <g transform="translate(954 438) scale(.7)">{cupcake('hc', 0, 0, 1, '#ffd1e8', '#fde68a')}</g>
            <g fontFamily={font} fontWeight="900" textAnchor="middle" letterSpacing="5"><text x="800" y="436" fontSize="34" fill="#fff" stroke="#be185d" strokeOpacity=".5" strokeWidth="8" strokeLinejoin="round">TASTYCAT</text><text x="800" y="436" fontSize="34" fill={PINK}>TASTYCAT</text></g>

            {/* the glass cabinet on the left, with a chef cat on top of it */}
            <g>
                <rect x="60" y="270" width="244" height="296" rx="14" fill="#7fdcc4" stroke="#2fb594" strokeWidth="3" />
                <rect x="74" y="284" width="216" height="268" rx="8" fill="#fffdfb" />
                {[372, 464].map((y) => <g key={y}><rect x="74" y={y} width="216" height="8" fill="#bff0e3" /><rect x="74" y={y + 8} width="216" height="3" fill="#2fb594" opacity=".3" /></g>)}
                {cupcake('c1', 112, 372, 1.05, '#ffd1e8', '#fde68a')}{cupcake('c2', 182, 372, 1.05, '#bff5e6', '#fbcfe8')}{cupcake('c3', 252, 372, 1.05, '#fff1a8', '#c7d2fe')}
                {[[98, 0], [128, 1], [158, 2], [188, 3], [218, 4], [248, 5]].map(([x, i]) => macaron(`m${i}`, Number(x), 464, CANDY[Number(i) % 5], CANDY[(Number(i) + 2) % 5]))}
                {donut('d1', 112, 552, 1, f('glaze'))}{donut('d2', 182, 552, 1, '#9ff0d8')}{donut('d3', 252, 552, 1, '#ffe28a')}
                <rect x="74" y="284" width="216" height="268" rx="8" fill={f('glass')} opacity=".5" />
                <path d="M96 290L130 290L84 340ZM150 290L168 290L96 400Z" fill="#fff" opacity=".35" />
                <path d="M54 270Q54 252 78 252H286Q310 252 310 270Z" fill={PINK} stroke="#c0407f" strokeWidth="2.4" strokeLinejoin="round" />
                {Array.from({ length: 9 }, (_, k) => <circle key={k} cx={86 + k * 26.4} cy="270" r="13" fill={k % 2 ? '#fff' : PINK} />)}
                <rect x="84" y="566" width="14" height="62" fill="#e8b87a" /><rect x="266" y="566" width="14" height="62" fill="#e8b87a" />
            </g>
            {kitty('chef', 182, 252, 1, '#fffaf5', '#ffe9f2', 'chef', 1, 0)}

            {/* a clock like a donut between the cabinet and the video */}
            <g transform="translate(380 340)">
                <circle r="46" fill="#e8b068" /><circle r="42" fill="#ff9ec8" /><circle r="30" fill="#fffaf5" stroke="#ffb3d4" strokeWidth="2" />
                {Array.from({ length: 12 }, (_, k) => { const a = (k * Math.PI) / 6; return <path key={k} d={`M${r1(Math.sin(a) * 25)} ${r1(-Math.cos(a) * 25)}L${r1(Math.sin(a) * 28)} ${r1(-Math.cos(a) * 28)}`} stroke="#be185d" strokeWidth="2" strokeLinecap="round" />; })}
                <path d="M0 0V-18" stroke="#7a2a55" strokeWidth="3" strokeLinecap="round" /><path d="M0 0L13 7" stroke="#7a2a55" strokeWidth="3" strokeLinecap="round" /><circle r="3" fill={PINK} />
                {[[-36, -22], [30, -30], [38, 20], [-30, 30], [4, -38], [-4, 40]].map(([x, y], i) => <rect key={i} x={x - 3} y={y - 1} width="6" height="2.4" rx="1.2" transform={`rotate(${i * 61} ${x} ${y})`} fill={CANDY[(i + 1) % 5]} />)}
            </g>

            {/* the cake on its table on the right, with a baker cat beside it */}
            <g>
                <rect x="1170" y="500" width="360" height="16" rx="5" fill="#ffe9c7" stroke="#d9a066" strokeWidth="2" />
                <path d="M1180 516H1520V556Q1500 572 1480 556Q1460 572 1440 556Q1420 572 1400 556Q1380 572 1360 556Q1340 572 1320 556Q1300 572 1280 556Q1260 572 1240 556Q1220 572 1200 556Q1190 566 1180 556Z" fill={f('gingham')} stroke="#ff8fc0" strokeWidth="2" strokeLinejoin="round" />
                <rect x="1194" y="566" width="12" height="62" fill="#e8b87a" /><rect x="1494" y="566" width="12" height="62" fill="#e8b87a" />
                <g transform="translate(1290 500)">
                    <ellipse cy="0" rx="126" ry="9" fill="#fff" stroke="#f0c2d8" strokeWidth="2" /><rect x="-8" y="-12" width="16" height="14" fill="#f0c2d8" />
                    <rect x="-110" y="-84" width="220" height="74" rx="12" fill="#ff9ec8" /><rect x="-80" y="-148" width="160" height="66" rx="12" fill="#8fe6cf" /><rect x="-52" y="-196" width="104" height="50" rx="12" fill="#ffe28a" />
                    {[[-110, 220, -84], [-80, 160, -148], [-52, 104, -196]].map(([x, w, y]) => <path key={y} d={icing(x, w, y)} fill="#fff" />)}
                    {Array.from({ length: 11 }, (_, k) => <circle key={k} cx={-96 + k * 19.2} cy="-22" r="4.4" fill={CANDY[k % 5]} />)}
                    {Array.from({ length: 8 }, (_, k) => <circle key={`b${k}`} cx={-66 + k * 18.8} cy="-98" r="4" fill={CANDY[(k + 2) % 5]} />)}
                    {Array.from({ length: 5 }, (_, k) => <circle key={`c${k}`} cx={-34 + k * 17} cy="-160" r="3.6" fill={CANDY[(k + 4) % 5]} />)}
                    <circle cx="0" cy="-204" r="9" fill="#ef4444" /><path d="M0 -212Q4 -224 12 -222" stroke="#166534" strokeWidth="2.4" fill="none" strokeLinecap="round" /><circle cx="-3" cy="-207" r="2.4" fill="#fff" opacity=".7" />
                    {candle('k1', -30, -194, '#4fe0c0', 0)}{candle('k2', 30, -194, '#a78bfa', -0.7)}
                </g>
            </g>
            {kitty('baker', 1470, 500, 0.92, '#ffa24a', '#ffe9c7', 'bow', -1, -1.2)}

            {/* the floor: pink and cream squares, a donut under the booth, sprinkles */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            {floorGrid(height).map(({ i, j }) => <polygon key={`${i}-${j}`} points={tile(i, j)} fill={(i + j) % 2 ? '#fff6fa' : '#ff9ec8'} opacity=".55" />)}
            <g stroke="#fff" strokeOpacity=".5" strokeWidth="1.4">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>
            <rect y={FLOOR - 4} width="1600" height="10" fill="#fff" opacity=".7" />
            {SPRINKLES.map((s) => <rect key={s.k} x={s.x - 5} y={s.y - 1.6} width="10" height="3.2" rx="1.6" transform={`rotate(${s.r} ${s.x} ${s.y})`} fill={s.c} />)}
            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="420" ry="78" fill={f('pool')} />
                <ellipse cx="800" cy={ring + 10} rx="374" ry="68" fill="#b5527f" opacity=".35" />
                <ellipse cx="800" cy={ring} rx="370" ry="64" fill="#e8b068" />
                <ellipse cx="800" cy={ring - 6} rx="356" ry="58" fill={f('glaze')} />
                <path d={drizzle} fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" opacity=".85" />
                <ellipse cx="800" cy={ring} rx="236" ry="40" fill="#7a2a55" opacity=".5" />
                {Array.from({ length: 54 }, (_, k) => { const a = (k * Math.PI * 2) / 54; const rr = k % 2 ? 340 : 296; return <rect key={k} x={r1(800 + Math.cos(a) * rr * 0.98) - 5.5} y={r1(ring - 6 + Math.sin(a) * (rr / 370) * 54) - 1.8} width="11" height="3.6" rx="1.8" transform={`rotate(${(k * 53) % 180} ${r1(800 + Math.cos(a) * rr * 0.98)} ${r1(ring - 6 + Math.sin(a) * (rr / 370) * 54)})`} fill={CANDY[k % 5]} />; })}
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 4} rx="184" ry="15" fill="#000" opacity=".4" />
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
