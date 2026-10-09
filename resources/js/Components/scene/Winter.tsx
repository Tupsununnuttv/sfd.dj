import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { cloud, pineTier } from '@/Components/scene/shapes';
import { after, floorGrid, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, floorTile as tile, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;

// the stars that are out already, glints on the ice and the cracks in it: the same every time
const rs = rand(77);
const STARS = Array.from({ length: 50 }, () => ({ x: rs() * 1600, y: rs() ** 1.8 * 300, r: 0.5 + rs() * 1.1, o: 0.3 + rs() * 0.6 }));
const GLINTS = Array.from({ length: 26 }, () => ({ x: rs() * 1600, y: 650 + rs() * 240, s: 4 + rs() * 6 }));
const CRACKS = Array.from({ length: 8 }, () => {
    let x = 80 + rs() * 1440;
    let y = 650 + rs() * 200;
    let d = `M${r1(x)} ${r1(y)}`;
    for (let i = 0; i < 5; i++) {
        x += (rs() - 0.5) * 110;
        y += (rs() - 0.4) * 26;
        d += `L${r1(x)} ${r1(y)}`;
    }

    return d;
});
const FAR: [number, number][] = [[0, 430], [110, 360], [190, 400], [300, 300], [400, 380], [520, 330], [640, 410], [760, 360], [900, 420], [1040, 340], [1160, 400], [1260, 330], [1370, 390], [1480, 310], [1600, 380]];
const MID: [number, number][] = [[0, 470], [140, 420], [260, 455], [380, 400], [500, 450], [640, 430], [800, 470], [960, 436], [1100, 462], [1240, 414], [1380, 452], [1500, 420], [1600, 450]];
const ridge = (pts: [number, number][]) => `M0 600${pts.map(([x, y]) => `L${x} ${y}`).join('')}L1600 600Z`;
const rt = rand(12);
const PINES = Array.from({ length: 52 }, (_, k) => ({ x: 6 + k * 31 + rt() * 18, y: 556 + rt() * 34, s: 0.5 + rt() * 0.45, v: k % 3 === 0 ? 'B' : 'A' })).filter((p) => p.x < 190 || (p.x > 330 && p.x < 1210) || p.x > 1400);
const TOWER = (x: number) => 262 - (x + 20) * 0.0915; // the cable of the gondola runs from (-20, 262) to (1620, 112)

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * The winter scenery on a 1600 x 900 canvas: the hour after sunset in the mountains. A low sun going down behind pink ridges, a pale moon, a
 * gondola across the sky, pine forest, an igloo and an ice-fishing hut on the bank, a fox on the run, the video in a frame of frost, and a frozen lake for a floor.
 * Like the others it only moves while a song plays (`live`); the snow that falls over everything is drawn by RoomScene (Snow.tsx).
 */
export default function WinterBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down
    const use = (id: string, x: number, y: number, s: number, k: string | number) => <use key={k} href={`#${u(id)}`} transform={`translate(${r1(x)} ${r1(y)}) scale(${r1(s)})`} />;

    const tower = (x: number) => {
        const top = TOWER(x);

        return (
            <g key={x} stroke="#262b57" strokeWidth="2.4" strokeLinecap="round" fill="none">
                <path d={`M${x} ${top}L${x - 15} ${top + 130}M${x} ${top}L${x + 15} ${top + 130}M${x - 12} ${top + 90}H${x + 12}M${x - 8} ${top + 50}H${x + 8}M${x - 12} ${top + 90}L${x + 8} ${top + 50}M${x + 12} ${top + 90}L${x - 8} ${top + 50}`} />
                <path d={`M${x - 16} ${top}H${x + 16}`} strokeWidth="3.4" />
            </g>
        );
    };

    const igloo = (
        <g transform="translate(262 616)">
            <ellipse cx="0" cy="4" rx="96" ry="9" fill="#5b5fa8" opacity=".35" />
            <path d="M-72 0A72 62 0 0 1 72 0Z" fill={f('ice')} />
            <path d="M-72 0A72 62 0 0 1 72 0" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" />
            <g fill="none" stroke="#9aa6dc" strokeWidth="1.6" opacity=".8">
                <path d="M-66 -20H66M-50 -40H50M-26 -56H26" /><path d="M-30 -20V0M30 -20V0M0 -20V-40M-52 -20V-40M52 -20V-40M-16 -40V-56M16 -40V-56" />
            </g>
            <path d="M-26 6V-14A26 22 0 0 1 26 -14V6Z" fill="#ffe3b0" />
            <path d="M-20 6V-12A20 17 0 0 1 20 -12V6Z" fill="#8a4b22" />
            <ellipse cx="0" cy="-6" rx="52" ry="40" fill={f('glowWarm')} opacity=".4" />
            <path d="M-34 6Q0 -2 34 6" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>
    );

    const hut = (
        <g transform="translate(1296 612)">
            <ellipse cx="0" cy="4" rx="76" ry="8" fill="#5b5fa8" opacity=".35" />
            <ellipse cx="0" cy="-26" rx="90" ry="46" fill={f('glowWarm')} opacity=".22" />
            {[0, 1, 2].map((k) => <circle key={k} className="sc-smoke" style={after(-k * 2.3)} cx="30" cy="-84" r="9" fill={f('smoke')} opacity=".55" />)}
            <rect x="24" y="-86" width="9" height="30" fill="#4a4f66" /><rect x="22" y="-90" width="13" height="6" fill="#33374a" />
            <rect x="-40" y="-46" width="80" height="46" fill="#7a4a26" />
            <g stroke="#4a2a12" strokeWidth="1.6" opacity=".8">{[-32, -18, -4, 10, 24, 38].map((y) => <path key={y} d={`M-40 ${y + 0}H40`} />)}</g>
            <path d="M-50 -44L0 -82L50 -44Z" fill="#3b2a22" />
            <path d="M-56 -42L0 -88L56 -42Q40 -48 28 -42Q14 -50 0 -42Q-14 -50 -28 -42Q-40 -48 -56 -42Z" fill="#f4eaf6" />
            <rect x="-30" y="-34" width="22" height="20" fill="#2a1608" /><rect className="sc-flame" x="-27" y="-31" width="16" height="14" fill="#ffd27a" />
            <rect x="8" y="-30" width="22" height="30" fill="#4a2a12" /><circle cx="25" cy="-14" r="1.8" fill="#fbbf24" />
            <path d="M52 0V-38M52 -38l14 6" stroke="#5a3418" strokeWidth="3" strokeLinecap="round" fill="none" /><path d="M66 -32V-4" stroke="#e9d5ff" strokeWidth=".9" /><ellipse cx="66" cy="2" rx="9" ry="3" fill="#6d7fc0" />
        </g>
    );

    const fox = (
        <g className="sc-fox">
            <g transform="translate(610 600)">
                <g className="sc-bob">
                    <path d="M-34 -2C-52 -4 -58 -22 -48 -34C-44 -22 -36 -14 -26 -12Z" fill="#e8702a" />
                    <path d="M-48 -34C-54 -30 -56 -24 -54 -18C-50 -22 -46 -28 -48 -34Z" fill="#fff" />
                    <ellipse cx="-4" cy="-12" rx="30" ry="13" fill="#e8702a" />
                    <path d="M-30 -8Q-4 -2 22 -8Q10 0 -4 0Q-20 0 -30 -8Z" fill="#fff4e6" />
                    <path d="M18 -18C24 -30 34 -30 40 -24L52 -18L40 -12C32 -10 22 -10 18 -18Z" fill="#e8702a" />
                    <path d="M40 -24L52 -18L48 -15L40 -17Z" fill="#fff4e6" /><circle cx="53" cy="-18" r="2" fill="#111827" />
                    <path d="M24 -26L26 -38L32 -28ZM33 -27L38 -37L40 -25Z" fill="#e8702a" /><path d="M26 -38L28 -33L25 -31ZM38 -37L38 -32L35 -30Z" fill="#111827" />
                    <g stroke="#e8702a" strokeWidth="5" strokeLinecap="round" fill="none"><path d="M14 -6L30 4M22 -4L38 2M-18 -4L-34 6M-26 -6L-42 0" /></g>
                    <g stroke="#111827" strokeWidth="5" strokeLinecap="round" fill="none"><path d="M32 3L38 2M-36 5L-42 0M24 -4L28 -2" /></g>
                </g>
            </g>
        </g>
    );

    const gondola = (
        <g className="sc-gondola">
            <g transform={`translate(160 ${r1(TOWER(160))})`}>
                <path d="M0 0V20" stroke="#262b57" strokeWidth="2.4" />
                <rect x="-19" y="18" width="38" height="28" rx="6" fill="#e11d48" />
                <rect x="-19" y="18" width="38" height="8" rx="4" fill="#be123c" />
                <rect x="-14" y="29" width="28" height="12" rx="2" fill="#ffe3a0" />
                <path d="M0 29V41" stroke="#be123c" strokeWidth="2" />
                <ellipse cx="0" cy="34" rx="30" ry="22" fill={f('glowWarm')} opacity=".35" />
            </g>
        </g>
    );

    // a crystal for the corners of the frame, and the one under the booth's floor ring
    const crystal = (x: number, y: number, s: number, k: string) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`} stroke="#eaf7ff" strokeWidth="2.6" strokeLinecap="round" fill="none">
            {[0, 60, 120].map((a) => <g key={a} transform={`rotate(${a})`}><path d="M0 -22V22M0 -14l-6 -6M0 -14l6 -6M0 14l-6 6M0 14l6 6" /></g>)}
            <circle r="3.4" fill="#eaf7ff" stroke="none" />
        </g>
    );

    const left = tv.x - 18;
    const right = tv.x + tv.w + 18;
    const bottom = tv.y + tv.h + 14;
    const icicles = Array.from({ length: 22 }, (_, i) => {
        const x = left + 22 + i * 34.4;
        const l = 16 + ((i * 53) % 31);

        return <path key={i} d={`M${r1(x - 5)} ${bottom + 4}L${r1(x + 0.5)} ${bottom + 4 + l}L${r1(x + 5)} ${bottom + 4}Z`} fill={f('icicle')} />;
    });

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('sky')} x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#2c2f7a" /><stop offset=".3" stopColor="#5d4a9e" /><stop offset=".55" stopColor="#c7689f" /><stop offset=".8" stopColor="#f6a98f" /><stop offset="1" stopColor="#ffd9a8" />
                </linearGradient>
                <radialGradient id={u('sunGlow')} cx="1340" cy="345" r="520" gradientUnits="userSpaceOnUse"><stop stopColor="#ffe2a6" stopOpacity=".85" /><stop offset=".3" stopColor="#ff9f7a" stopOpacity=".4" /><stop offset="1" stopColor="#ff7a9a" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('sun')} cx=".4" cy=".35" r=".8"><stop stopColor="#fffbe0" /><stop offset=".6" stopColor="#ffd28a" /><stop offset="1" stopColor="#ff9a62" /></radialGradient>
                <radialGradient id={u('moonGlow')} cx="260" cy="150" r="140" gradientUnits="userSpaceOnUse"><stop stopColor="#f3e8ff" stopOpacity=".5" /><stop offset="1" stopColor="#f3e8ff" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('far')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f1b6d2" /><stop offset=".45" stopColor="#a98ad0" /><stop offset="1" stopColor="#6d68b8" /></linearGradient>
                <linearGradient id={u('mid')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#e3a9d0" /><stop offset=".4" stopColor="#8670c0" /><stop offset="1" stopColor="#4f5aa8" /></linearGradient>
                <linearGradient id={u('bank')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fbe9f1" /><stop offset=".6" stopColor="#c6c9ee" /><stop offset="1" stopColor="#8a9fd6" /></linearGradient>
                <linearGradient id={u('ice')} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffffff" /><stop offset=".6" stopColor="#e8e2f8" /><stop offset="1" stopColor="#b9bde8" /></linearGradient>
                <radialGradient id={u('glowWarm')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffd27a" stopOpacity=".9" /><stop offset=".45" stopColor="#ffa940" stopOpacity=".35" /><stop offset="1" stopColor="#ff9a1f" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('smoke')} cx=".5" cy=".5" r=".5"><stop stopColor="#f1e9fa" stopOpacity=".8" /><stop offset="1" stopColor="#f1e9fa" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('icicle')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffffff" stopOpacity=".95" /><stop offset="1" stopColor="#a8dcff" stopOpacity=".35" /></linearGradient>
                <radialGradient id={u('fog')} cx=".5" cy=".5" r=".5"><stop stopColor="#f3e9fb" stopOpacity=".55" /><stop offset=".55" stopColor="#d3cdf3" stopOpacity=".2" /><stop offset="1" stopColor="#d3cdf3" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('drift')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffffff" stopOpacity=".95" /><stop offset=".7" stopColor="#e6e2f8" stopOpacity=".7" /><stop offset="1" stopColor="#d3cdf3" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <linearGradient id={u('horizon')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffb2a0" stopOpacity="0" /><stop offset=".5" stopColor="#ffb2a0" stopOpacity=".3" /><stop offset="1" stopColor="#ffb2a0" stopOpacity="0" /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#bfe6ff" stopOpacity=".55" /><stop offset=".6" stopColor="#8fb8f0" stopOpacity=".2" /><stop offset="1" stopColor="#8fb8f0" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#9a8ad8" stopOpacity="0" /><stop offset="1" stopColor={p.floorBottom} stopOpacity=".65" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".5" /></radialGradient>
                <g id={u('pineA')}><rect x="-4" y="-10" width="8" height="12" fill="#2b2140" />{pineTier(-54, -8, 34, '#2c3b78', '#f3c9e0')}{pineTier(-86, -34, 28, '#2c3b78', '#f3c9e0')}{pineTier(-114, -62, 22, '#2c3b78', '#f3c9e0')}{pineTier(-134, -88, 15, '#2c3b78', '#f3c9e0')}</g>
                <g id={u('pineB')}><rect x="-4" y="-10" width="8" height="12" fill="#2b2140" />{pineTier(-64, -8, 40, '#24336b', '#f6d4e6')}{pineTier(-104, -40, 32, '#24336b', '#f6d4e6')}{pineTier(-136, -76, 22, '#24336b', '#f6d4e6')}</g>
            </defs>

            {/* the sky: the first stars, a pale moon, the sun going down, pink streaks of cloud */}
            <rect width="1600" height="650" fill={f('sky')} />
            {STARS.map((s, k) => <circle key={k} className={k % 10 === 0 ? 'sc-star' : undefined} style={k % 10 === 0 ? after((k * 0.37) % 2.6) : undefined} cx={r1(s.x)} cy={r1(s.y)} r={r1(s.r)} fill="#fff" opacity={r1(s.o)} />)}
            <circle cx="260" cy="150" r="140" fill={f('moonGlow')} />
            <circle cx="260" cy="150" r="32" fill="#f6eefc" />
            <g fill="#c9b6e6" opacity=".5"><circle cx="250" cy="142" r="7" /><circle cx="272" cy="162" r="5" /><circle cx="258" cy="168" r="3" /></g>
            <circle cx="1340" cy="345" r="520" fill={f('sunGlow')} />
            <circle cx="1340" cy="345" r="64" fill={f('sun')} />
            <g fill="#ffb8cf" opacity=".5">
                <g className="sc-drift"><ellipse cx="120" cy="250" rx="130" ry="9" /><ellipse cx="170" cy="274" rx="90" ry="6" /></g>
                <g className="sc-drift" style={after(-4)}><ellipse cx="1460" cy="190" rx="140" ry="10" /><ellipse cx="1400" cy="218" rx="100" ry="7" /></g>
                <ellipse cx="380" cy="320" rx="100" ry="7" /><ellipse cx="1220" cy="286" rx="110" ry="8" opacity=".6" />
            </g>
            {cloud('c1', 330, 232, 0.5, '#ffd9e6', '#e9a6c6')}{cloud('c2', 1240, 140, 0.44, '#ffe3c9', '#f1a79a')}

            {/* the gondola: a cable over the mountains, two pylons, and the cabin on its way */}
            <path d="M-20 262L1620 112" stroke="#262b57" strokeWidth="2.4" />
            {tower(110)}{tower(1500)}
            {gondola}

            {/* the ridges, and the forest on the bank */}
            <path d={ridge(FAR)} fill={f('far')} />
            <path d={ridge(MID)} fill={f('mid')} />
            <path d="M0 548C140 524 300 536 440 544S700 556 860 552S1140 530 1300 536S1520 540 1600 530V650H0Z" fill={f('bank')} />
            {PINES.map((pn, k) => use(`pine${pn.v}`, pn.x, pn.y, pn.s, `p${k}`))}
            <path d="M0 586C120 566 260 572 400 580S640 604 800 600S1100 580 1260 576S1480 574 1600 588V650H0Z" fill={f('bank')} />
            {igloo}
            {hut}
            {fox}

            {/* the frame the video hangs in: frost */}
            {[26, 18, 11].map((g, i) => <rect key={g} x={tv.x - g - 18} y={tv.y - g - 22} width={tv.w + 36 + g * 2} height={tv.h + 36 + g * 2} rx={18 + g} fill="#bfe6ff" opacity={0.05 + i * 0.05} />)}
            <rect x={tv.x - 18} y={tv.y - 22} width={tv.w + 36} height={tv.h + 36} rx="18" fill="#08122b" stroke="#cfeaff" strokeWidth="3.4" />
            <rect x={tv.x - 10} y={tv.y - 14} width={tv.w + 20} height={tv.h + 20} rx="12" fill="none" stroke="#fff" strokeOpacity=".28" />
            <path d={`M${left + 20} ${bottom - 12}H${right - 20}`} stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".8" />
            {icicles}
            {crystal(left + 4, bottom - 4, 1.1, 'k1')}{crystal(right - 4, bottom - 4, 1.1, 'k2')}{crystal(left + 2, 40, 0.8, 'k3')}{crystal(right - 2, 40, 0.8, 'k4')}

            {/* the floor: a frozen lake */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            <rect y={FLOOR - 26} width="1600" height="84" fill={f('horizon')} />
            {floorGrid(height).map(({ i, j }) => {
                const v = (i * 5 + j * 11 + 100) % 7;

                return <polygon key={`${i}-${j}`} points={tile(i, j)} fill={v % 2 ? '#ffffff' : '#9fc4f2'} opacity={r1(0.05 + (v / 7) * 0.1)} />;
            })}
            <g stroke="#cfe6ff" strokeOpacity=".2" strokeWidth="1.2">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>
            <g fill="none" stroke="#f1faff" strokeOpacity=".5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{CRACKS.map((d, k) => <path key={k} d={d} />)}</g>
            {GLINTS.filter((s) => s.y < height - 20).map((s, k) => <path key={k} className={k % 3 ? undefined : 'sc-star'} style={k % 3 ? undefined : after((k * 0.43) % 2.6)} d={`M${r1(s.x)} ${r1(s.y - s.s)}L${r1(s.x + s.s * 0.22)} ${r1(s.y - s.s * 0.22)}L${r1(s.x + s.s)} ${r1(s.y)}L${r1(s.x + s.s * 0.22)} ${r1(s.y + s.s * 0.22)}L${r1(s.x)} ${r1(s.y + s.s)}L${r1(s.x - s.s * 0.22)} ${r1(s.y + s.s * 0.22)}L${r1(s.x - s.s)} ${r1(s.y)}L${r1(s.x - s.s * 0.22)} ${r1(s.y - s.s * 0.22)}Z`} fill="#fff" opacity=".85" />)}

            {/* the big pines on the edges, a sled and a pair of skis in the snow */}
            {use('pineB', 56, 712, 2.5, 'e1')}{use('pineB', 1548, 722, 2.9, 'e2')}
            <g transform="translate(1432 770) rotate(-6)">
                <ellipse cx="0" cy="8" rx="70" ry="9" fill="#2b2f66" opacity=".4" />
                <path d="M-58 4C-66 4 -66 -8 -56 -8M58 4C66 4 66 -8 56 -8M-58 4H58" stroke="#b91c1c" strokeWidth="5" strokeLinecap="round" fill="none" />
                <rect x="-50" y="-20" width="100" height="14" rx="4" fill="#e11d48" /><path d="M-44 -20V-6M-20 -20V-6M4 -20V-6M28 -20V-6" stroke="#fda4af" strokeWidth="2" />
                <path d="M-58 -8Q-90 -22 -96 -40" stroke="#f4eaf6" strokeWidth="2" fill="none" />
            </g>
            <g transform="translate(176 778)">
                <ellipse cx="0" cy="10" rx="40" ry="6" fill="#2b2f66" opacity=".4" />
                <g transform="rotate(-12)"><rect x="-8" y="-84" width="9" height="92" rx="4" fill="#38bdf8" /><path d="M-8 -84Q-3 -96 1 -84" fill="#38bdf8" /></g>
                <g transform="rotate(8)"><rect x="6" y="-80" width="9" height="88" rx="4" fill="#f97316" /><path d="M6 -80Q10 -92 15 -80" fill="#f97316" /></g>
                <ellipse cx="0" cy="4" rx="28" ry="7" fill="#f4eaf6" />
            </g>

            {/* the ice rose under the booth */}
            <g transform={`translate(0 ${ext})`}>
            <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="400" ry="74" fill={f('pool')} />
            <g transform={`translate(800 ${SCENE.booth.y + 100}) scale(340 58)`} fill="none" stroke="#e6f6ff" strokeLinecap="round" strokeLinejoin="round">
                <circle r="1" strokeWidth="2.6" vectorEffect="non-scaling-stroke" stroke="#bfe6ff" />
                <circle r="0.88" strokeWidth="1.4" vectorEffect="non-scaling-stroke" strokeDasharray="3 8" opacity=".8" />
                <path d={Array.from({ length: 48 }, (_, k) => { const a = (k * Math.PI) / 24; const r0 = k % 4 === 0 ? 0.8 : 0.92; return `M${r1(Math.cos(a) * r0 * 100) / 100} ${r1(Math.sin(a) * r0 * 100) / 100}L${r1(Math.cos(a) * 100) / 100} ${r1(Math.sin(a) * 100) / 100}`; }).join('')} strokeWidth="2" vectorEffect="non-scaling-stroke" opacity=".85" />
                <path d={Array.from({ length: 8 }, (_, k) => { const a = (k * Math.PI) / 4; const c = Math.cos(a) * 0.66; const s = Math.sin(a) * 0.66; return `M${r1(c * 100) / 100} ${r1((s - 0.09) * 100) / 100}L${r1((c + 0.05) * 100) / 100} ${r1(s * 100) / 100}L${r1(c * 100) / 100} ${r1((s + 0.09) * 100) / 100}L${r1((c - 0.05) * 100) / 100} ${r1(s * 100) / 100}Z`; }).join('')} strokeWidth="2.2" vectorEffect="non-scaling-stroke" stroke="#fff" />
            </g>
            <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 4} rx="184" ry="15" fill="#000" opacity=".5" />
            </g>

            {/* drifts and mist */}
            {([[150, 616, 340, 40, 0.5], [560, 622, 380, 34, 0.4], [1100, 620, 380, 36, 0.42], [1470, 612, 360, 42, 0.5]] as const).map(([x, y, rx, ry, o], k) => <ellipse key={k} className={k % 2 ? 'sc-drift' : undefined} style={k % 2 ? after(-k * 1.5) : undefined} cx={x} cy={y} rx={rx} ry={ry} fill={f('fog')} opacity={o} />)}
            <ellipse cx="0" cy={height - 6} rx="520" ry="70" fill={f('drift')} /><ellipse cx="1600" cy={height - 6} rx="520" ry="70" fill={f('drift')} />

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
