import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { cloud } from '@/Components/scene/shapes';
import { after, floorGrid, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, floorTile as tile, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const font = 'Figtree, system-ui, sans-serif';
const GOLD = '#fcbf49';

// the stars, the peaks and the body of the dragon: the same every time
const rs = rand(131);
const STARS = Array.from({ length: 56 }, (_, k) => ({ k, x: rs() * 1600, y: rs() * 360, r: r1(0.7 + rs() * 1.4) }));
const peaks = (seed: number, base: number, amp: number, step: number) => {
    const rr = rand(seed);
    let d = `M-20 700L-20 ${base}`;

    for (let x = -20; x <= 1620; x += step) d += `L${x + step * 0.5} ${r1(base - amp * (0.4 + rr() * 0.6))}L${x + step} ${r1(base - rr() * amp * 0.25)}`;

    return `${d}L1620 700Z`;
};

/** A smooth line through the points (Catmull-Rom), then `n` points an even distance apart along it. */
const spline = (pts: [number, number][], n: number) => {
    const raw: [number, number][] = [];
    const last = pts.length - 1;

    for (let i = 0; i < last; i++) {
        const [p0, p1, p2, p3] = [pts[Math.max(0, i - 1)], pts[i], pts[i + 1], pts[Math.min(last, i + 2)]];

        for (let j = 0; j < 40; j++) {
            const t = j / 40;
            const c = (a: number, b: number, c2: number, d: number) => 0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t * t + (-a + 3 * b - 3 * c2 + d) * t * t * t);
            raw.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
        }
    }

    raw.push(pts[last]);
    const dist = [0];
    for (let i = 1; i < raw.length; i++) dist.push(dist[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
    const out: [number, number][] = [];

    for (let i = 0, k = 0; i < n; i++) {
        const want = (i / (n - 1)) * dist[dist.length - 1];

        while (k < dist.length - 2 && dist[k + 1] < want) k++;
        const f = (want - dist[k]) / (dist[k + 1] - dist[k] || 1);
        out.push([raw[k][0] + (raw[k + 1][0] - raw[k][0]) * f, raw[k][1] + (raw[k + 1][1] - raw[k][1]) * f]);
    }

    return out;
};

// from the tip of the tail, along the right, over the top behind the video, down the left side to the head, which looks to the right
const SPINE = spline([[1420, 620], [1500, 610], [1556, 520], [1520, 400], [1470, 290], [1400, 170], [1250, 70], [1050, 34], [800, 28], [560, 48], [380, 110], [276, 230], [250, 350], [300, 436], [404, 478]], 300);
const N = SPINE.length;
const BODY = SPINE.map(([x, y], i) => {
    const [ax, ay] = SPINE[Math.max(0, i - 1)];
    const [bx, by] = SPINE[Math.min(N - 1, i + 1)];
    const m = Math.hypot(bx - ax, by - ay) || 1;
    const t = i / (N - 1);
    const r = (5 + 22 * Math.sin(Math.min(1, t / 0.55) * (Math.PI / 2))) * (t > 0.9 ? 1 - (t - 0.9) * 1.9 : 1);

    return { i, x: r1(x), y: r1(y), tx: (bx - ax) / m, ty: (by - ay) / m, r: r1(r) };
});
const HEAD = BODY[N - 1];
const HEAD_ANGLE = r1((Math.atan2(HEAD.ty, HEAD.tx) * 180) / Math.PI);
const LEGS = [58, 150, 190, 232];

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * The dragon scenery on a 1600 x 900 canvas: a long eastern dragon in red and gold that coils round the video, from the tip of its tail on the right, over the top and down the
 * left side to its head, which looks at the stage with its mouth open and a glowing pearl in front of it. Behind it a stormy night with a pale moon, lightning, clouds
 * and ink-dark peaks with a pagoda; the video is in a red lacquer frame with gold, under it hangs a sign, red lanterns swing at its sides, and a red carpet runs over a dark courtyard to a
 * golden ring under the booth. Embers rise over the room (Snow.tsx). Like the others it only moves while a song plays (`live`).
 */
export default function DragonBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down
    const ring = SCENE.booth.y + 100;

    /** A red paper lantern with gold bands and a tassel, hanging from a chain `chain` long. It swings while a song plays. */
    const lantern = (k: string, x: number, y: number, chain: number, s: number, delay: number) => (
        <g key={k}>
            <circle className="sc-flame" style={after(delay)} cx={x} cy={y + 34 * s} r={150 * s} fill={f('lamp')} />
            <g className="sc-dangle" style={after(delay)}>
                <path d={`M${x} ${y - chain}V${y}`} stroke="#3a0a0a" strokeWidth="3" strokeDasharray="5 3" />
                <g transform={`translate(${x} ${y}) scale(${s})`}>
                    <rect x="-9" y="-2" width="18" height="8" rx="2" fill={GOLD} stroke="#7a3a08" strokeWidth="1" />
                    <ellipse cy="36" rx="30" ry="32" fill={f('paper')} stroke="#5a0a0a" strokeWidth="2" />
                    <path d="M-30 36Q0 52 30 36M-26 20Q0 32 26 20M-26 52Q0 64 26 52" fill="none" stroke="#5a0a0a" strokeOpacity=".5" strokeWidth="1.6" />
                    <path d="M-22 6H22M-22 66H22" stroke={GOLD} strokeWidth="5" strokeLinecap="round" />
                    <path d="M0 68V96" stroke={GOLD} strokeWidth="2.4" /><path d="M-6 96H6L8 112H-8Z" fill="#dc2626" />
                    <ellipse cx="-9" cy="26" rx="8" ry="12" fill="#fff" opacity=".18" />
                </g>
            </g>
        </g>
    );

    /** A claw: three gold talons on the end of a leg. */
    const claw = (x: number, y: number, a: number) => <g transform={`translate(${r1(x)} ${r1(y)}) rotate(${a}) scale(1.6)`} fill={GOLD} stroke="#7a3a08" strokeWidth="0.7"><path d="M0 -4L16 -8L2 2Z" /><path d="M0 0L18 2L2 6Z" /><path d="M0 4L14 12L0 9Z" /></g>;

    /** A pagoda on a peak: stacked roofs that curl up at the corners, windows lit. */
    const pagoda = (x: number, y: number, s: number) => (
        <g transform={`translate(${x} ${y}) scale(${s})`} fill="#0a0a24">
            {[[0, 74], [-62, 58], [-116, 44]].map(([dy, w], i) => (
                <g key={i}>
                    <rect x={-w * 0.62} y={dy - 50} width={w * 1.24} height="34" />
                    <path d={`M${-w - 16} ${dy - 50}Q${-w * 0.6} ${dy - 52} 0 ${dy - 76}Q${w * 0.6} ${dy - 52} ${w + 16} ${dy - 50}Q${w * 0.5} ${dy - 40} 0 ${dy - 42}Q${-w * 0.5} ${dy - 40} ${-w - 16} ${dy - 50}Z`} />
                    {[-0.3, 0.3].map((q) => <rect key={q} x={w * q - 5} y={dy - 42} width="10" height="14" fill="#fbbf24" opacity=".75" />)}
                </g>
            ))}
            <path d="M0 -192V-218" stroke="#0a0a24" strokeWidth="3" />
        </g>
    );

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('sky')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#04060f" /><stop offset=".35" stopColor="#0c1233" /><stop offset=".65" stopColor="#231a4a" /><stop offset=".9" stopColor="#5a2a5a" /><stop offset="1" stopColor="#8a3a4a" /></linearGradient>
                <radialGradient id={u('moon')} cx=".4" cy=".35" r=".8"><stop stopColor="#fffbe8" /><stop offset=".6" stopColor="#f6e7b4" /><stop offset="1" stopColor="#d9c27a" /></radialGradient>
                <radialGradient id={u('moonglow')} cx=".5" cy=".5" r=".5"><stop stopColor="#f6e7b4" stopOpacity=".4" /><stop offset="1" stopColor="#f6e7b4" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('m1')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#3a3a78" /><stop offset="1" stopColor="#2a2a60" /></linearGradient>
                <linearGradient id={u('m2')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#20204c" /><stop offset="1" stopColor="#14143a" /></linearGradient>
                <linearGradient id={u('m3')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#10102c" /><stop offset="1" stopColor="#07071a" /></linearGradient>
                <radialGradient id={u('scale')} cx=".36" cy=".3" r=".85"><stop stopColor="#ff7a66" /><stop offset=".45" stopColor="#d62828" /><stop offset="1" stopColor="#7a1010" /></radialGradient>
                <radialGradient id={u('belly')} cx=".4" cy=".3" r=".8"><stop stopColor="#fff0b8" /><stop offset=".6" stopColor="#fcbf49" /><stop offset="1" stopColor="#b8741a" /></radialGradient>
                <linearGradient id={u('horn')} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff2c8" /><stop offset=".6" stopColor="#e9c46a" /><stop offset="1" stopColor="#a8741a" /></linearGradient>
                <radialGradient id={u('pearl')} cx=".38" cy=".32" r=".8"><stop stopColor="#fff" /><stop offset=".35" stopColor="#ffe9a0" /><stop offset=".8" stopColor="#ffb347" /><stop offset="1" stopColor="#e8741c" /></radialGradient>
                <radialGradient id={u('pearlglow')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffd27a" stopOpacity=".7" /><stop offset=".5" stopColor="#ff9a1f" stopOpacity=".24" /><stop offset="1" stopColor="#ff9a1f" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('lacquer')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a31515" /><stop offset=".5" stopColor="#7a0e0e" /><stop offset="1" stopColor="#4a0808" /></linearGradient>
                <radialGradient id={u('paper')} cx=".4" cy=".35" r=".8"><stop stopColor="#ff7a66" /><stop offset=".6" stopColor="#dc2626" /><stop offset="1" stopColor="#8a1010" /></radialGradient>
                <radialGradient id={u('lamp')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffb08a" stopOpacity=".6" /><stop offset=".45" stopColor="#ff6a3a" stopOpacity=".2" /><stop offset="1" stopColor="#ff4a1a" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('gold')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff0b8" /><stop offset=".45" stopColor="#fcbf49" /><stop offset="1" stopColor="#b8741a" /></linearGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffd27a" stopOpacity=".5" /><stop offset=".6" stopColor="#dc2626" stopOpacity=".2" /><stop offset="1" stopColor="#dc2626" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('fog')} cx=".5" cy=".5" r=".5"><stop stopColor="#8a8ad0" stopOpacity=".32" /><stop offset="1" stopColor="#8a8ad0" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8a3a4a" stopOpacity="0" /><stop offset="1" stopColor="#07040c" stopOpacity=".66" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#07040c" stopOpacity=".66" /></radialGradient>
            </defs>

            {/* the night: stars, a pale moon, ink-dark peaks with a pagoda, mist between them, storm clouds, lightning */}
            <rect width="1600" height="660" fill={f('sky')} />
            {STARS.map((s) => <circle key={s.k} className={s.k % 4 === 0 ? 'sc-twinkle' : undefined} style={s.k % 4 === 0 ? after(-s.k * 0.23) : undefined} cx={r1(s.x)} cy={r1(s.y)} r={s.r} fill="#fff" opacity=".75" />)}
            <circle cx="1290" cy="200" r="250" fill={f('moonglow')} /><circle cx="1290" cy="200" r="96" fill={f('moon')} />
            {[[1262, 176, 14], [1320, 230, 10], [1300, 168, 7], [1256, 226, 8]].map(([x, y, r]) => <circle key={`${x}${y}`} cx={x} cy={y} r={r} fill="#c9b36a" opacity=".3" />)}
            <path d={peaks(4, 500, 220, 150)} fill={f('m1')} />
            <ellipse className="sc-drift" cx="360" cy="520" rx="300" ry="26" fill={f('fog')} /><ellipse className="sc-drift" style={after(-4)} cx="1200" cy="510" rx="320" ry="26" fill={f('fog')} />
            <path d={peaks(9, 560, 170, 130)} fill={f('m2')} />
            {pagoda(1070, 556, 0.78)}
            <path d={peaks(15, 612, 100, 110)} fill={f('m3')} />
            {cloud('c1', 190, 150, 1.7, '#1c1a42', '#10102c')}{cloud('c2', 560, 260, 1.2, '#1c1a42', '#10102c')}{cloud('c3', 1120, 250, 1.4, '#1c1a42', '#10102c')}{cloud('c4', 1500, 470, 1.2, '#1c1a42', '#10102c')}
            <g className="sc-twinkle" fill="none" stroke="#d9d0ff" strokeLinecap="round" strokeLinejoin="round" opacity=".55">
                <path d="M520 290L492 360L518 366L476 450" strokeWidth="9" strokeOpacity=".22" /><path d="M520 290L492 360L518 366L476 450" strokeWidth="2.6" />
                <path d="M1150 300L1124 372L1148 378L1108 456" strokeWidth="9" strokeOpacity=".22" /><path d="M1150 300L1124 372L1148 378L1108 456" strokeWidth="2.6" />
            </g>

            {/* the dragon: the body from the tip of the tail, spikes along its back, legs with claws, then the head */}
            {BODY.map((b) => <circle key={b.i} cx={b.x} cy={b.y} r={b.r} fill={f('scale')} stroke="#5a0a0a" strokeOpacity=".5" strokeWidth="1.2" />)}
            {BODY.filter((b) => b.i > 12).map((b) => <circle key={`b${b.i}`} cx={r1(b.x + b.ty * b.r * 0.6)} cy={r1(b.y - b.tx * b.r * 0.6)} r={r1(b.r * 0.3)} fill={f('belly')} opacity=".95" />)}
            {BODY.filter((b) => b.i % 5 === 0 && b.i > 14).map((b) => {
                const nx = -b.ty; // the way the back faces: out of the big loop, a quarter turn from the way it is going
                const ny = b.tx;
                const h = 8 + b.r * 0.55 + (b.i > N - 50 ? 12 : 0);

                return <path key={`s${b.i}`} d={`M${r1(b.x + nx * b.r * 0.85 - b.tx * 7)} ${r1(b.y + ny * b.r * 0.85 - b.ty * 7)}L${r1(b.x + nx * (b.r + h) - b.tx * 14)} ${r1(b.y + ny * (b.r + h) - b.ty * 14)}L${r1(b.x + nx * b.r * 0.85 + b.tx * 7)} ${r1(b.y + ny * b.r * 0.85 + b.ty * 7)}Z`} fill={b.i > N - 50 ? '#ff8a3c' : GOLD} stroke="#7a3a08" strokeWidth="1" strokeLinejoin="round" />;
            })}
            {LEGS.map((i) => {
                const b = BODY[i];
                const nx = b.ty; // the belly side: into the loop
                const ny = -b.tx;
                const ex = b.x + nx * (b.r + 20) + b.tx * 14; // the elbow
                const ey = b.y + ny * (b.r + 20) + b.ty * 14;
                const fx = ex + nx * 24 - b.tx * 8; // the foot
                const fy = ey + ny * 24 - b.ty * 8;
                const leg = `M${b.x} ${b.y}L${r1(ex)} ${r1(ey)}L${r1(fx)} ${r1(fy)}`;

                return (
                    <g key={`l${i}`}>
                        <path d={leg} fill="none" stroke="#7a1010" strokeWidth={r1(b.r * 0.85 + 5)} strokeLinecap="round" strokeLinejoin="round" />
                        <path d={leg} fill="none" stroke="#d62828" strokeWidth={r1(b.r * 0.62 + 2)} strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx={r1(ex)} cy={r1(ey)} r={r1(b.r * 0.34)} fill="#ff7a66" opacity=".5" />
                        {claw(fx, fy, r1((Math.atan2(fy - ey, fx - ex) * 180) / Math.PI))}
                    </g>
                );
            })}
            <g transform={`translate(${HEAD.x} ${HEAD.y}) rotate(${HEAD_ANGLE}) scale(1.4)`}>
                <g className="sc-dangle">
                    {[[-4, 14, 74, 112, 3.4], [-8, 8, 88, 70, 2.8], [-12, -6, 72, 28, 2.4]].map(([x0, y0, x1, y1, w], i) => <path key={i} d={`M${x0} ${y0}C${x0 - 40} ${y0 + 30} ${x1 - 120} ${y1} ${x1 - 150} ${y1 + 30}`} fill="none" stroke="#ff8a3c" strokeWidth={w * 2.4} strokeLinecap="round" opacity=".8" />)}
                    {[[-4, -16, -80, -52], [-8, -22, -96, -22], [0, -26, -72, -78]].map(([x0, y0, x1, y1], i) => <path key={`m${i}`} d={`M${x0} ${y0}Q${(x0 + x1) / 2} ${y0 - 24} ${x1} ${y1}`} fill="none" stroke={GOLD} strokeWidth="5" strokeLinecap="round" />)}
                </g>
                <path d="M20 -34C8 -62 -22 -84 -58 -86C-36 -72 -14 -56 -6 -30Z" fill={f('horn')} stroke="#7a3a08" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M-8 -54C-22 -70 -40 -78 -62 -70" fill="none" stroke="#a8741a" strokeWidth="5" strokeLinecap="round" />
                <path d="M6 -30Q-14 -48 -42 -40Q-18 -34 -8 -18Z" fill="#ff8a3c" />
                <path d="M-6 -20C0 -34 34 -38 74 -32C102 -28 124 -20 134 -8C136 -2 130 2 122 2L-2 4Z" fill={f('scale')} stroke="#5a0a0a" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M-2 10C0 6 34 4 82 4C106 4 124 4 126 6L118 12L-4 16Z" fill="#7a1010" />
                <path d="M2 14C6 32 40 52 84 54C108 56 122 52 128 46C130 42 124 40 118 40L4 24Z" fill={f('scale')} stroke="#5a0a0a" strokeWidth="1.6" strokeLinejoin="round" transform="rotate(5 4 12)" />
                <path d="M10 24C40 34 84 36 118 34L112 22C80 22 30 18 10 12Z" fill="#e8587a" transform="rotate(5 4 12)" />
                {[26, 46, 66, 86, 106].map((x, i) => <path key={x} d={`M${x} 3L${x + 6} ${12 + (i % 2) * 3}L${x + 12} 3Z`} fill="#fff" stroke="#c9b9a0" strokeWidth=".6" />)}
                {[40, 62, 84, 104].map((x, i) => <path key={`d${x}`} d={`M${x} 26L${x + 5} ${17 - (i % 2) * 3}L${x + 10} 24Z`} fill="#fff" stroke="#c9b9a0" strokeWidth=".6" transform="rotate(5 4 12)" />)}
                <ellipse cx="124" cy="-14" rx="4.4" ry="3" fill="#2a0404" /><path d="M126 -22Q134 -26 140 -20" fill="none" stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" />
                <path d="M30 -28Q54 -40 84 -26" fill="none" stroke="#5a0a0a" strokeWidth="6" strokeLinecap="round" />
                <path d="M34 -22C40 -34 62 -34 70 -22C60 -14 44 -14 34 -22Z" fill="#ffd23f" stroke="#7a3a08" strokeWidth="1.2" />
                <ellipse className="sc-flame" cx="52" cy="-23" rx="6" ry="6" fill="#fff6c0" opacity=".5" /><ellipse cx="52" cy="-23" rx="2" ry="5.2" fill="#1a0404" /><circle cx="56" cy="-26" r="1.6" fill="#fff" />
                <path d="M126 -2C150 14 138 66 96 90M122 4C168 8 182 44 160 84" fill="none" stroke={GOLD} strokeWidth="3.4" strokeLinecap="round" className="sc-dangle" />
                <path d="M40 50Q60 62 52 82Q40 68 40 50Z" fill={GOLD} stroke="#7a3a08" strokeWidth="1" />
                <g transform="translate(176 22)">
                    <circle className="sc-pulse" r="52" fill={f('pearlglow')} />
                    <path className="sc-flame" d="M-4 -16C-24 -40 -12 -58 -6 -76C0 -56 18 -44 8 -18Z" fill="#ff9a1f" opacity=".8" />
                    <circle r="16" fill={f('pearl')} /><circle cx="-5" cy="-6" r="4.4" fill="#fff" opacity=".85" />
                </g>
            </g>
            {cloud('c5', 330, 600, 1.1, '#1c1a42', '#10102c')}
            <rect width="1600" height="660" fill="#000" opacity=".0" />

            {/* the video, in a frame of red lacquer with gold */}
            <rect x={tv.x - 34} y="-30" width={tv.w + 68} height={tv.y + tv.h + 64} rx="8" fill={f('lacquer')} stroke="#2a0404" strokeWidth="3" />
            {[[tv.x - 22, 2], [tv.x + tv.w + 22, 2]].flatMap(([x]) => Array.from({ length: 9 }, (_, i) => <circle key={`${x}${i}`} cx={x} cy={26 + i * 38} r="4.4" fill={f('gold')} stroke="#7a3a08" strokeWidth=".8" />))}
            {Array.from({ length: 17 }, (_, i) => <circle key={i} cx={tv.x - 4 + i * 36} cy={tv.y + tv.h + 22} r="4.4" fill={f('gold')} stroke="#7a3a08" strokeWidth=".8" />)}
            <rect x={tv.x - 9} y={tv.y - 9} width={tv.w + 18} height={tv.h + 18} rx="4" fill="#070308" />
            <rect x={tv.x - 12} y={tv.y - 12} width={tv.w + 24} height={tv.h + 24} rx="6" fill="none" stroke={GOLD} strokeOpacity=".22" strokeWidth="9" />
            <rect x={tv.x - 9} y={tv.y - 9} width={tv.w + 18} height={tv.h + 18} rx="4" fill="none" stroke={f('gold')} strokeWidth="2.6" />
            {[[tv.x - 34, tv.y + tv.h + 34], [tv.x + tv.w + 34, tv.y + tv.h + 34]].map(([x, y], i) => (
                <g key={i} transform={`translate(${x} ${y}) scale(${i ? -1 : 1} 1)`}>
                    <path d="M0 0L46 0L46 -10L10 -10L10 -46L0 -46Z" fill={f('gold')} stroke="#7a3a08" strokeWidth="1.6" strokeLinejoin="round" />
                    <circle cx="23" cy="-23" r="7" fill="#a31515" stroke="#7a3a08" strokeWidth="1.4" />
                </g>
            ))}
            <path d="M690 368V384M910 368V384" stroke="#7a3a08" strokeWidth="3" />
            <rect x="636" y="382" width="328" height="52" rx="6" fill={f('lacquer')} stroke={f('gold')} strokeWidth="3.4" />
            <rect x="644" y="390" width="312" height="36" rx="3" fill="none" stroke={GOLD} strokeOpacity=".5" strokeWidth="1.4" />
            <g transform="translate(682 408)"><circle r="14" fill={f('pearlglow')} /><circle r="8" fill={f('pearl')} /><path d="M-16 6Q-26 -4 -14 -14M16 6Q26 -4 14 -14" fill="none" stroke={GOLD} strokeWidth="2.6" strokeLinecap="round" /></g>
            <g fontFamily={font} fontWeight="900" textAnchor="middle" letterSpacing="9"><text x="826" y="420" fontSize="32" fill="none" stroke={GOLD} strokeOpacity=".4" strokeWidth="8">DRAGON</text><text x="826" y="420" fontSize="32" fill="#ffe9a0" stroke="#7a3a08" strokeWidth="1.2" paintOrder="stroke">DRAGON</text></g>

            {lantern('l1', 434, 168, 168, 1, 0)}{lantern('l2', 1166, 168, 168, 1, -1.4)}

            {/* the courtyard: dark stone, a red carpet with gold edges, mist */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            {floorGrid(height).map(({ i, j }) => <polygon key={`${i}-${j}`} points={tile(i, j)} fill={(i + j) % 2 ? '#8a6a8a' : '#000'} opacity={(i * 5 + j * 11 + 100) % 7 < 3 ? 0.1 : 0.05} />)}
            <path d={`M${lineX(-2.5, FLOOR)} ${FLOOR}L${lineX(2.5, FLOOR)} ${FLOOR}L${lineX(2.5, height)} ${height}L${lineX(-2.5, height)} ${height}Z`} fill="#8a1010" opacity=".55" />
            <path d={`M${lineX(-2.5, FLOOR)} ${FLOOR}L${lineX(-2.5, height)} ${height}M${lineX(2.5, FLOOR)} ${FLOOR}L${lineX(2.5, height)} ${height}`} stroke={GOLD} strokeWidth="3" strokeOpacity=".8" fill="none" />
            <path d={`M${lineX(-2.2, FLOOR)} ${FLOOR}L${lineX(-2.2, height)} ${height}M${lineX(2.2, FLOOR)} ${FLOOR}L${lineX(2.2, height)} ${height}`} stroke={GOLD} strokeWidth="1.2" strokeOpacity=".5" fill="none" />
            <g stroke="#07040c" strokeOpacity=".5" strokeWidth="1.4">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>
            {[[300, 660, 380, 36, 0], [1300, 650, 400, 36, -4]].map(([x, y, rx, ry, d]) => <ellipse key={`${x}${y}`} className="sc-drift" style={after(d)} cx={x} cy={y} rx={rx} ry={ry} fill={f('fog')} />)}

            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="400" ry="74" fill={f('pool')} />
                <ellipse cx="800" cy={ring} rx="340" ry="58" fill="#2a0808" stroke={f('gold')} strokeWidth="6" />
                <ellipse cx="800" cy={ring} rx="340" ry="58" fill="none" stroke={GOLD} strokeOpacity=".3" strokeWidth="14" />
                <ellipse cx="800" cy={ring} rx="304" ry="51" fill="none" stroke={GOLD} strokeOpacity=".7" strokeWidth="1.8" />
                {Array.from({ length: 36 }, (_, k) => { const a = (k * Math.PI * 2) / 36; return <circle key={k} cx={r1(800 + Math.cos(a) * 322)} cy={r1(ring + Math.sin(a) * 54.4)} r="3.6" fill={f('gold')} />; })}
                <ellipse cx="800" cy={ring} rx="270" ry="45" fill="none" stroke="#ff6a3a" strokeOpacity=".5" strokeWidth="1.6" strokeDasharray="3 9" />
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
