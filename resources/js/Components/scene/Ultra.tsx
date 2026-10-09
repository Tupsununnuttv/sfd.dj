import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { after, floorGrid, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, floorTile as tile, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const font = 'Figtree, system-ui, sans-serif';
const CYAN = '#22d3ee';
const MAGENTA = '#e879f9';
const BURST = [CYAN, MAGENTA, '#fde68a', '#ffffff'];
const BURSTS = [{ x: 150, y: 150, c: 0, s: 1, d: 0 }, { x: 372, y: 292, c: 1, s: 0.72, d: -1.8 }, { x: 1450, y: 130, c: 2, s: 1.05, d: -0.9 }, { x: 1250, y: 282, c: 3, s: 0.7, d: -3.2 }];
// the searchlights that stand on the ground (where, which way they lean, how fast they sweep, their colour) and the moving heads on the truss up in the corners
const LIGHTS = [{ x: 96, a: -10, d: 7.2, c: 'W' }, { x: 396, a: 12, d: 6.1, c: 'C' }, { x: 1204, a: -12, d: 6.6, c: 'M' }, { x: 1504, a: 10, d: 7.8, c: 'W' }];
const HEADS = [{ x: 36, a: 16, c: 'C', d: 5.1 }, { x: 108, a: 4, c: 'M', d: 6.3 }, { x: 180, a: -8, c: 'W', d: 4.7 }, { x: 1420, a: 8, c: 'W', d: 5.6 }, { x: 1492, a: -4, c: 'M', d: 6.8 }, { x: 1564, a: -16, c: 'C', d: 4.9 }];

// the stars, the skyline with its lit windows and the crowd that stands in front of the stage: the same every time
const rs = rand(97);
const STARS = Array.from({ length: 70 }, (_, k) => ({ k, x: rs() * 1600, y: rs() * 470, r: r1(0.6 + rs() * 1.4) }));
const TOWERS: { k: number; x: number; w: number; h: number; far: boolean; wins: { x: number; y: number; c: string }[] }[] = [];

for (let x = -20, k = 0; x < 1620; k++) {
    const w = 26 + rs() * 40;
    const h = x > 500 && x < 1100 ? 50 + rs() * 90 : 80 + rs() * 190;
    const wins = Array.from({ length: 3 + Math.floor(rs() * 4) }, () => ({ x: r1(x + 5 + Math.floor(rs() * Math.max(1, (w - 14) / 8)) * 8), y: r1(628 - h + 12 + Math.floor(rs() * Math.max(1, (h - 30) / 12)) * 12), c: ['#ffd87a', '#7ee7ff', '#ff9ad5'][Math.floor(rs() * 3)] }));

    TOWERS.push({ k, x: r1(x), w: r1(w), h: r1(h), far: k % 3 === 0, wins });
    x += w + 2 + rs() * 8;
}

/** One person in the crowd, seen from behind: a head, shoulders and arms in the air; some hold a phone or a glow stick up. */
const people = (seed: number, base: number, scale: number, n: number) => {
    const rr = rand(seed);

    return Array.from({ length: n }, (_, k) => {
        const x = r1((k + 0.5) * (1600 / n) + (rr() - 0.5) * 22);
        const h = r1((58 + rr() * 26) * scale);
        const top = base - h;
        const arm = (side: number) => { const up = 22 + rr() * 26; const out = (8 + rr() * 16) * side; return `M${r1(x + side * 10)} ${r1(top + 22)}L${r1(x + side * 10 + out)} ${r1(top + 22 - up)}`; };
        const both = rr() > 0.4;
        const glow = rr() > 0.62 ? { x: r1(x + 14 + rr() * 8), y: r1(top - 14 - rr() * 14), c: [CYAN, MAGENTA, '#fde68a'][Math.floor(rr() * 3)] } : null;

        return { k, x, top, base, d: `M${r1(x - 12)} ${base}V${r1(top + 22)}Q${r1(x - 12)} ${r1(top + 12)} ${r1(x)} ${r1(top + 12)}Q${r1(x + 12)} ${r1(top + 12)} ${r1(x + 12)} ${r1(top + 22)}V${base}Z${arm(-1)}${both ? arm(1) : ''}`, glow, r: r1(9 * scale) };
    });
};
const FAR_CROWD = people(11, 628, 0.78, 58);
const NEAR_CROWD = people(23, 640, 1, 46);

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * The Ultra Music Festival scenery on a 1600 x 900 canvas: a main stage at night in front of a skyline with palm trees. The video is the middle of a big LED wall with
 * wings on both sides, LED frames, searchlights stand on the ground and moving heads hang on the truss, fireworks over the city, a sign says ULTRA MUSIC FESTIVAL over the
 * deck, where flames shoot and CO2 jets blow, speaker stacks stand at the edges and a crowd with its arms in the air fills the field. Like the others it only moves
 * while a song plays (`live`): the lights sweep, the LEDs flash, the fires flicker, the fireworks burst and the speakers pump.
 */
export default function UltraBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down
    const ring = SCENE.booth.y + 100;

    const burst = (b: (typeof BURSTS)[number], i: number) => (
        <g key={i} transform={`translate(${b.x} ${b.y}) scale(${b.s})`}>
            <g className="sc-burst" style={after(b.d)}>
                {Array.from({ length: 20 }, (_, k) => {
                    const a = (k * Math.PI * 2) / 20;
                    const l = k % 2 ? 54 : 78;

                    return <g key={k}><path d={`M${r1(Math.cos(a) * 18)} ${r1(Math.sin(a) * 18)}L${r1(Math.cos(a) * l)} ${r1(Math.sin(a) * l)}`} stroke={BURST[b.c]} strokeWidth="3" strokeLinecap="round" /><circle cx={r1(Math.cos(a) * (l + 8))} cy={r1(Math.sin(a) * (l + 8))} r="2.6" fill="#fff" /></g>;
                })}
                <circle r="10" fill="#fff" opacity=".9" /><circle r="34" fill={BURST[b.c]} opacity=".2" />
            </g>
        </g>
    );

    /** One of the LED wings of the stage on the left (s = 0) or on the right (s = 1): a wall of pixels with colour running down it. */
    const wing = (s: number) => (
        <g key={s} transform={s ? 'translate(1600 0) scale(-1 1)' : undefined}>
            <clipPath id={u(`wc${s}`)}><path d="M250 -10H478V470L250 560Z" /></clipPath>
            <path d="M250 -10H478V470L250 560Z" fill="#05051c" />
            <g clipPath={f(`wc${s}`)}>
                <rect x="240" y="-10" width="250" height="580" fill={f('led')} opacity=".78" />
                <g className="sc-stripes" fill="#fff" opacity=".16">{Array.from({ length: 9 }, (_, i) => <rect key={i} x="240" y={-4 + i * 66 + (s ? 20 : 0)} width="250" height="22" />)}</g>
                {Array.from({ length: 12 }, (_, i) => <rect key={`c${i}`} className="sc-tile" style={after(-i * 0.37 - s)} x={256 + ((i * 53) % 190)} y={20 + ((i * 97) % 470)} width="36" height="36" fill={i % 2 ? '#fff' : MAGENTA} opacity=".4" />)}
                <rect x="240" y="-10" width="250" height="580" fill={f('pixels')} opacity=".7" />
                <rect x="240" y="-10" width="250" height="580" fill={f('sheen')} />
            </g>
            <path d="M250 -10H478V470L250 560Z" fill="none" stroke="#2c2c66" strokeWidth="7" strokeLinejoin="round" />
            <path d="M250 -10H478V470L250 560Z" fill="none" stroke={CYAN} strokeOpacity=".55" strokeWidth="1.6" strokeLinejoin="round" />
        </g>
    );

    /** A truss standing up from the ground (a lattice between two rails) with its lights on top. */
    const mast = (x: number, k: string) => (
        <g key={k}>
            <path d={`M${x - 12} -10V610M${x + 12} -10V610${Array.from({ length: 17 }, (_, i) => `M${x - 12} ${-10 + i * 36}L${x + 12} ${-10 + (i + 1) * 36}L${x - 12} ${-10 + (i + 2) * 36}`).join('')}`} fill="none" stroke="#3a3a7a" strokeWidth="2.4" />
            {[-10, 0, 10].map((d) => <g key={d}><rect x={x + d - 4} y="14" width="8" height="12" rx="2" fill="#161628" stroke="#5a5a8a" strokeWidth="1.2" /><circle cx={x + d} cy="28" r="4" fill={d ? CYAN : MAGENTA} /><circle cx={x + d} cy="28" r="10" fill={d ? CYAN : MAGENTA} opacity=".3" /></g>)}
        </g>
    );

    /** A hanging array of speakers at the edge of the stage, centred on x. */
    const array = (x: number, k: string) => (
        <g key={k}>
            <path d={`M${x - 40} -4V132M${x + 40} -4V132`} stroke="#4a4a7a" strokeWidth="2.4" strokeDasharray="6 3" />
            {Array.from({ length: 6 }, (_, i) => (
                <g key={i}>
                    <rect x={x - 62 + i * 1.5} y={130 + i * 52} width="124" height="48" rx="5" fill="#090919" stroke="#34346a" strokeWidth="2" />
                    <rect x={x - 56 + i * 1.5} y={134 + i * 52} width="112" height="3" rx="1.5" fill={i % 2 ? MAGENTA : CYAN} opacity=".6" />
                    {[-30, 30].map((dx) => <g key={dx}><circle cx={x + dx + i * 1.5} cy={158 + i * 52} r="14" fill="#04040c" stroke="#3a3a6a" strokeWidth="1.6" /><circle cx={x + dx + i * 1.5} cy={158 + i * 52} r="5" fill="#16162c" /></g>)}
                </g>
            ))}
        </g>
    );

    /** A stack of subwoofers on the ground, left edge at x. */
    const subs = (x: number, k: string) => (
        <g key={k}>
            {[0, 1].flatMap((row) => [0, 1].map((col) => (
                <g key={`${row}${col}`}>
                    <rect x={x + col * 86} y={546 + row * 42} width="84" height="40" rx="4" fill="#090919" stroke="#34346a" strokeWidth="2" />
                    <circle className="av sc-woofer" cx={x + col * 86 + 42} cy={566 + row * 42} r="15" fill="#04040c" stroke="#3a3a6a" strokeWidth="1.6" />
                    <circle cx={x + col * 86 + 42} cy={566 + row * 42} r="5" fill="#16162c" />
                </g>
            )))}
        </g>
    );

    /** A jet of fire standing on (x, 548): three flames, one in another, and the light on the air round it. */
    const pyro = (x: number, delay: number, k: string) => (
        <g key={k}>
            <circle className="sc-flame" style={after(delay)} cx={x} cy={470} r="160" fill={f('fire')} />
            <g className="sc-flame" style={after(delay - 0.2)}><path d={`M${x - 20} 548C${x - 30} 500 ${x - 10} 470 ${x - 8} 410C${x + 4} 440 ${x + 14} 430 ${x + 12} 400C${x + 28} 450 ${x + 34} 500 ${x + 20} 548Z`} fill="#ff4a1a" /></g>
            <g className="sc-flame" style={after(delay - 0.7)}><path d={`M${x - 14} 548C${x - 20} 510 ${x - 4} 490 ${x - 2} 450C${x + 8} 470 ${x + 12} 480 ${x + 10} 456C${x + 20} 490 ${x + 22} 520 ${x + 14} 548Z`} fill="#ffb347" /></g>
            <g className="sc-flame" style={after(delay - 1.2)}><path d={`M${x - 8} 548C${x - 10} 524 ${x - 2} 514 ${x} 494C${x + 6} 514 ${x + 10} 526 ${x + 8} 548Z`} fill="#fff3c4" /></g>
            <rect x={x - 14} y="546" width="28" height="22" rx="3" fill="#1c1c38" stroke="#4a4a7a" strokeWidth="1.6" />
        </g>
    );

    /** A jet of CO2: a white cloud that rises from (x, 548). */
    const co2 = (x: number, delay: number, k: string) => (
        <g key={k}>
            {[[0, 0, 26, 34], [8, -38, 34, 38], [-6, -82, 44, 44], [8, -128, 54, 50]].map(([dx, dy, rx, ry], i) => <ellipse key={i} className={i > 1 ? 'sc-smoke' : undefined} style={i > 1 ? after(delay - i) : undefined} cx={x + dx} cy={540 + dy} rx={rx} ry={ry} fill={f('cloud')} />)}
            <rect x={x - 10} y="546" width="20" height="18" rx="3" fill="#1c1c38" stroke="#4a4a7a" strokeWidth="1.6" />
        </g>
    );

    /** A palm tree's leaves hanging in from a top corner, close to us, so they are dark against the sky. */
    const palm = (flip: boolean) => {
        const fronds: [number, number][] = [[8, 262], [26, 290], [44, 300], [62, 262], [80, 210]];

        return (
            <g key={String(flip)} transform={flip ? 'translate(1600 0) scale(-1 1)' : undefined} stroke="#03031a" fill="none" strokeLinecap="round">
                {fronds.map(([deg, len], i) => {
                    const a = (deg * Math.PI) / 180;
                    const P1 = [Math.cos(a) * len * 0.55, Math.sin(a) * len * 0.55 - 26];
                    const P2 = [Math.cos(a) * len, Math.sin(a) * len + 22];
                    const at = (t: number) => [2 * (1 - t) * t * P1[0] + t * t * P2[0], 2 * (1 - t) * t * P1[1] + t * t * P2[1]];
                    const tan = (t: number) => [2 * (1 - t) * P1[0] + 2 * t * (P2[0] - P1[0]), 2 * (1 - t) * P1[1] + 2 * t * (P2[1] - P1[1])];

                    return (
                        <g key={i}>
                            <path d={`M0 0Q${r1(P1[0])} ${r1(P1[1])} ${r1(P2[0])} ${r1(P2[1])}`} strokeWidth="8" />
                            {Array.from({ length: 22 }, (_, j) => {
                                const t = 0.08 + j * 0.042;
                                const [bx, by] = at(t);
                                const [tx, ty] = tan(t);
                                const m = Math.hypot(tx, ty);
                                const l = 40 * (1 - t * 0.72);

                                return [-1, 1].map((sd) => <path key={`${j}${sd}`} d={`M${r1(bx)} ${r1(by)}L${r1(bx + (-ty / m) * l * sd + (tx / m) * 10)} ${r1(by + (tx / m) * l * sd + (ty / m) * 10 + l * 0.35)}`} strokeWidth="5.4" />);
                            })}
                        </g>
                    );
                })}
            </g>
        );
    };

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('sky')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#01020c" /><stop offset=".4" stopColor="#0a0a38" /><stop offset=".72" stopColor="#2a1170" /><stop offset=".92" stopColor="#8a2a9a" /><stop offset="1" stopColor="#d9468f" /></linearGradient>
                <linearGradient id={u('horizon')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ff4fa0" stopOpacity="0" /><stop offset="1" stopColor="#ff4fa0" stopOpacity=".5" /></linearGradient>
                <linearGradient id={u('led')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={CYAN} /><stop offset=".35" stopColor="#7c3aed" /><stop offset=".7" stopColor={MAGENTA} /><stop offset="1" stopColor="#fb923c" /></linearGradient>
                <linearGradient id={u('sheen')} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#000" stopOpacity=".5" /><stop offset=".5" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".3" /></linearGradient>
                <linearGradient id={u('rim')} x1="0" y1="0" x2="1" y2="0"><stop stopColor={CYAN} /><stop offset=".5" stopColor="#a78bfa" /><stop offset="1" stopColor={MAGENTA} /></linearGradient>
                <linearGradient id={u('bW')} x1="0" y1="1" x2="0" y2="0"><stop stopColor="#fff" stopOpacity=".6" /><stop offset=".7" stopColor="#fff" stopOpacity=".12" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
                <linearGradient id={u('bC')} x1="0" y1="1" x2="0" y2="0"><stop stopColor={CYAN} stopOpacity=".65" /><stop offset=".7" stopColor={CYAN} stopOpacity=".14" /><stop offset="1" stopColor={CYAN} stopOpacity="0" /></linearGradient>
                <linearGradient id={u('bM')} x1="0" y1="1" x2="0" y2="0"><stop stopColor={MAGENTA} stopOpacity=".65" /><stop offset=".7" stopColor={MAGENTA} stopOpacity=".14" /><stop offset="1" stopColor={MAGENTA} stopOpacity="0" /></linearGradient>
                <linearGradient id={u('hW')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff" stopOpacity=".7" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
                <linearGradient id={u('hC')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={CYAN} stopOpacity=".7" /><stop offset="1" stopColor={CYAN} stopOpacity="0" /></linearGradient>
                <linearGradient id={u('hM')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={MAGENTA} stopOpacity=".7" /><stop offset="1" stopColor={MAGENTA} stopOpacity="0" /></linearGradient>
                <radialGradient id={u('fire')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffb347" stopOpacity=".55" /><stop offset=".45" stopColor="#ff5a1a" stopOpacity=".18" /><stop offset="1" stopColor="#ff3a1a" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('spot')} cx=".5" cy=".5" r=".5"><stop stopColor="#fff" stopOpacity=".35" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#c4f1ff" stopOpacity=".45" /><stop offset=".6" stopColor="#7c3aed" stopOpacity=".18" /><stop offset="1" stopColor="#7c3aed" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#7c3aed" stopOpacity="0" /><stop offset="1" stopColor="#02020a" stopOpacity=".66" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".66" /></radialGradient>
                <clipPath id={u('clear')}><path clipRule="evenodd" d={`M-200 -200H1800V1100H-200ZM${tv.x - 20} ${tv.y - 24}H${tv.x + tv.w + 20}V${tv.y + tv.h + 16}H${tv.x - 20}Z`} /></clipPath>
                <radialGradient id={u('sC')} cx=".5" cy=".5" r=".5"><stop stopColor={CYAN} stopOpacity=".5" /><stop offset="1" stopColor={CYAN} stopOpacity="0" /></radialGradient>
                <radialGradient id={u('sM')} cx=".5" cy=".5" r=".5"><stop stopColor={MAGENTA} stopOpacity=".5" /><stop offset="1" stopColor={MAGENTA} stopOpacity="0" /></radialGradient>
                <radialGradient id={u('sW')} cx=".5" cy=".5" r=".5"><stop stopColor="#fff" stopOpacity=".4" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('cloud')} cx=".5" cy=".5" r=".5"><stop stopColor="#fff" stopOpacity=".85" /><stop offset=".6" stopColor="#e8e4ff" stopOpacity=".4" /><stop offset="1" stopColor="#e8e4ff" stopOpacity="0" /></radialGradient>
                <pattern id={u('pixels')} width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="none" stroke="#05051c" strokeWidth="2.4" /></pattern>
                <filter id={u('neon')} x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>

            {/* the night: a sky that goes from black to the pink of the city, stars, fireworks over the skyline */}
            <rect width="1600" height="660" fill={f('sky')} />
            {STARS.map((s) => <circle key={s.k} className={s.k % 5 === 0 ? 'sc-twinkle' : undefined} style={s.k % 5 === 0 ? after(-s.k * 0.21) : undefined} cx={r1(s.x)} cy={r1(s.y)} r={s.r} fill="#fff" opacity=".7" />)}
            <rect y="440" width="1600" height="200" fill={f('horizon')} />
            {TOWERS.filter((t) => t.far).map((t) => <rect key={`f${t.k}`} x={t.x - 4} y={r1(628 - t.h * 1.3)} width={r1(t.w + 8)} height={r1(t.h * 1.3 + 12)} fill="#1d1670" opacity=".6" />)}
            {TOWERS.map((t) => (
                <g key={t.k}>
                    <rect x={t.x} y={r1(628 - t.h)} width={t.w} height={r1(t.h + 12)} fill="#0a0836" />
                    <path d={`M${t.x} ${r1(628 - t.h)}H${r1(t.x + t.w)}`} stroke="#ff8ad0" strokeOpacity=".45" strokeWidth="1.6" />
                    {t.k % 4 === 0 && <g><path d={`M${r1(t.x + t.w / 2)} ${r1(628 - t.h)}V${r1(628 - t.h - 22)}`} stroke="#1d1670" strokeWidth="2" /><circle className="sc-twinkle" style={after(-t.k * 0.3)} cx={r1(t.x + t.w / 2)} cy={r1(628 - t.h - 24)} r="2.6" fill="#ff3a4a" /></g>}
                    {t.wins.map((w, i) => <rect key={i} className={i % 3 === 0 ? 'sc-twinkle' : undefined} style={i % 3 === 0 ? after(-t.k * 0.17 - i) : undefined} x={w.x} y={w.y} width="4" height="6" fill={w.c} opacity=".85" />)}
                </g>
            ))}

            {/* the stage: the LED wings and the screen between them, masts with lights, speaker stacks */}
            {array(110, 'aL')}{array(1490, 'aR')}
            {mast(236, 'mL')}{mast(1364, 'mR')}
            {wing(0)}{wing(1)}
            {[26, 17, 10].map((g, i) => <rect key={g} x={tv.x - g - 20} y={tv.y - g - 24} width={tv.w + 40 + g * 2} height={tv.h + 40 + g * 2} rx={14 + g} fill={MAGENTA} opacity={0.04 + i * 0.04} />)}
            <rect x={tv.x - 20} y={tv.y - 24} width={tv.w + 40} height={tv.h + 40} rx="12" fill="#02020a" stroke={f('rim')} strokeWidth="7" />
            <rect x={tv.x - 20} y={tv.y - 24} width={tv.w + 40} height={tv.h + 40} rx="12" fill="none" stroke={f('rim')} strokeWidth="20" opacity=".2" />
            <rect x={tv.x - 10} y={tv.y - 14} width={tv.w + 20} height={tv.h + 20} rx="6" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="1.4" />

            {/* fireworks over the stage, then the beams: searchlights from the ground, moving heads from the truss in the corners. The video is kept clear of both. */}
            <g style={{ mixBlendMode: 'screen' }} clipPath={f('clear')}>
                {BURSTS.map(burst)}
                {LIGHTS.map((l, i) => (
                    <g key={l.x} transform={`rotate(${l.a} ${l.x} 628)`}>
                        <g className="sc-sweep" style={{ transformOrigin: `${l.x}px 628px`, animationDuration: `${l.d}s`, animationDelay: `-${i * 1.3}s` }}>
                            <path d={`M${l.x - 6} 628L${l.x - 70} -120H${l.x + 70}L${l.x + 6} 628Z`} fill={f(`b${l.c}`)} />
                        </g>
                    </g>
                ))}
                {HEADS.map((h, i) => (
                    <g key={h.x} transform={`rotate(${h.a} ${h.x} 36)`}>
                        <g className="sc-sweep" style={{ transformOrigin: `${h.x}px 36px`, animationDuration: `${h.d}s`, animationDelay: `-${i * 0.8}s` }}>
                            <path d={`M${h.x - 4} 36L${h.x - 78} 640H${h.x + 78}L${h.x + 4} 36Z`} fill={f(`h${h.c}`)} />
                        </g>
                    </g>
                ))}
            </g>
            <g fill="none" stroke="#3a3a7a" strokeWidth="2.4">
                {[[0, 250], [1350, 1600]].map(([x0, x1]) => <path key={x0} d={`M${x0} 8H${x1}M${x0} 36H${x1}${Array.from({ length: 10 }, (_, i) => `M${r1(x0 + ((x1 - x0) * i) / 10)} 8L${r1(x0 + ((x1 - x0) * (i + 0.5)) / 10)} 36L${r1(x0 + ((x1 - x0) * (i + 1)) / 10)} 8`).join('')}`} />)}
            </g>
            {HEADS.map((h) => <g key={`h${h.x}`}><rect x={h.x - 10} y="32" width="20" height="16" rx="4" fill="#161628" stroke="#5a5a8a" strokeWidth="1.4" /><circle cx={h.x} cy="48" r="6" fill={h.c === 'C' ? CYAN : h.c === 'M' ? MAGENTA : '#fff'} /><circle cx={h.x} cy="48" r="14" fill={h.c === 'C' ? CYAN : h.c === 'M' ? MAGENTA : '#fff'} opacity=".35" /></g>)}

            {/* the sign over the deck */}
            <rect x="584" y="386" width="432" height="168" rx="14" fill="#04041a" stroke={f('rim')} strokeWidth="4" />
            <rect x="584" y="386" width="432" height="168" rx="14" fill="none" stroke={f('rim')} strokeWidth="16" opacity=".2" />
            <g filter={f('neon')} fontFamily={font} fontWeight="900" textAnchor="middle">
                <text x="800" y="486" fontSize="104" letterSpacing="8" fill="none" stroke={CYAN} strokeWidth="3.4">ULTRA</text>
            </g>
            <text x="800" y="486" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize="104" letterSpacing="8" fill="#fff">ULTRA</text>
            <g filter={f('neon')} fontFamily={font} fontWeight="800" textAnchor="middle"><text x="800" y="530" fontSize="25" letterSpacing="12" fill="none" stroke={MAGENTA} strokeWidth="1.6">MUSIC FESTIVAL</text></g>
            <text x="800" y="530" textAnchor="middle" fontFamily={font} fontWeight="800" fontSize="25" letterSpacing="12" fill="#f5d0fe">MUSIC FESTIVAL</text>

            {/* the deck of the stage: LED panels along its front, a jet of fire at each end and a jet of CO2 either side of the sign */}
            <rect x="250" y="566" width="1100" height="70" fill="#07071c" />
            <rect x="250" y="566" width="1100" height="3" fill={CYAN} opacity=".7" />
            {Array.from({ length: 22 }, (_, i) => <rect key={i} className={i % 3 === 0 ? 'sc-tile' : undefined} style={i % 3 === 0 ? after(-i * 0.31) : undefined} x={256 + i * 49.6} y="576" width="44" height="46" rx="3" fill={i % 2 ? MAGENTA : CYAN} opacity={i % 3 === 0 ? 0.5 : 0.22} />)}
            {pyro(338, 0, 'pL')}{pyro(1262, -1.1, 'pR')}{co2(526, 0, 'cL')}{co2(1074, -2, 'cR')}
            {subs(24, 'sL')}{subs(1404, 'sR')}

            {/* the crowd: two rows of people with their arms in the air, dark against the stage */}
            {[FAR_CROWD, NEAR_CROWD].map((row, r) => (
                <g key={r} fill={r ? '#02020c' : '#060620'} stroke={r ? '#02020c' : '#060620'} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                    {row.map((q) => (
                        <g key={q.k}>
                            <circle cx={q.x} cy={r1(q.top + 2)} r={q.r} />
                            <path d={q.d} />
                            {q.glow && <g stroke="none"><circle className="sc-twinkle" style={after(-q.k * 0.4)} cx={q.glow.x} cy={q.glow.y} r="3.4" fill={q.glow.c} /><circle cx={q.glow.x} cy={q.glow.y} r="11" fill={q.glow.c} opacity=".22" /></g>}
                        </g>
                    ))}
                </g>
            ))}

            {/* the field in front of the stage: dark, with lines of light, pools of colour and a ring under the booth */}
            <rect y={FLOOR + 12} width="1600" height={height - FLOOR} fill={f('floor')} />
            <rect y={FLOOR + 12} width="1600" height="60" fill={f('haze')} opacity=".0" />
            {floorGrid(height).map(({ i, j }) => {
                const lit = (i * 7 + j * 3 + 100) % 9 === 0;

                return <polygon key={`${i}-${j}`} className={lit ? 'sc-tile' : undefined} style={lit ? after((((i + 20) * 13 + j * 7) % 24) / 10) : undefined} points={tile(i, j)} fill={lit ? ((i + j) % 2 ? CYAN : MAGENTA) : '#ffffff'} opacity={lit ? 0.26 : 0.025} />;
            })}
            <g stroke={CYAN} strokeOpacity=".16" strokeWidth="1.2">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>
            {[[300, 720, 0], [1300, 740, 1], [800, 700, 2]].map(([x, y, c], k) => <ellipse key={k} className="sc-drift" style={after(-k * 2.2)} cx={x} cy={y} rx="260" ry="56" fill={f(c === 1 ? 'sM' : c === 0 ? 'sC' : 'sW')} />)}

            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="400" ry="74" fill={f('pool')} />
                <ellipse cx="800" cy={ring} rx="340" ry="58" fill="none" stroke={f('rim')} strokeWidth="12" opacity=".3" />
                <ellipse cx="800" cy={ring} rx="340" ry="58" fill="none" stroke={f('rim')} strokeWidth="3" />
                <ellipse className="sc-dash" cx="800" cy={ring} rx="304" ry="51.6" fill="none" stroke="#fff" strokeWidth="3.4" strokeDasharray="60 1010" />
                <ellipse cx="800" cy={ring} rx="270" ry="45" fill="none" stroke={MAGENTA} strokeOpacity=".5" strokeWidth="1.6" strokeDasharray="3 9" />
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 4} rx="184" ry="15" fill="#000" opacity=".6" />
            </g>

            {withBooth && (
                <svg x={SCENE.booth.x} y={SCENE.booth.y + ext} width={SCENE.booth.w} height={SCENE.booth.h} viewBox="0 0 300 150" overflow="visible">
                    <BoothFrontArt u={(n) => `${uid}-b-${n}`} p={p} plate />
                </svg>
            )}

            {/* palm leaves hanging in over the top corners, close to us */}
            {palm(false)}{palm(true)}

            <rect y="520" width="1600" height={height - 520} fill={f('haze')} />
            <rect width="1600" height={height} fill={f('vig')} />
        </svg>
    );
}
