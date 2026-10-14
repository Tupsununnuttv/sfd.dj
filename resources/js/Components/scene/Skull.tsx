import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { femur, skullGlyph } from '@/Components/scene/shapes';
import { after, floorGrid, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, floorTile as tile, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;

// the stars, the two ridges of rock, the embers and the lit tiles of the floor: the same every time
const rs = rand(71);
const STARS = Array.from({ length: 46 }, (_, k) => ({ k, x: rs() * 1600, y: rs() * 420, r: r1(0.7 + rs() * 1.5), red: k % 5 === 0 }));
const ridge = (seed: number, base: number, amp: number, step: number) => {
    const rr = rand(seed);
    let d = `M-20 ${base + 40}`;

    for (let x = -20; x <= 1620; x += step) d += `L${x} ${r1(base - rr() * amp)}`;

    return `${d}L1620 700L-20 700Z`;
};
const FAR = ridge(5, 470, 120, 46);
const NEAR = ridge(9, 540, 90, 38);
const EMBERS = Array.from({ length: 16 }, (_, k) => ({ k, x: (k % 2 ? 300 : 1300) + (rs() - 0.5) * 120, y: 400 + rs() * 140, r: r1(1.4 + rs() * 1.6), d: -rs() * 4 }));
const LIT = Array.from({ length: 70 }, () => [Math.floor(rs() * 16) - 8, Math.floor(rs() * 7)] as const).filter((_, k) => k % 3 === 0);

const HEAD = 'M800 -170C1070 -170 1218 30 1204 290C1198 372 1172 418 1150 466C1140 494 1126 520 1116 552V660H484V552C474 520 460 494 450 466C428 418 402 372 396 290C382 30 530 -170 800 -170Z';

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * The skull scenery on a 1600 x 900 canvas: a red night with a blood moon over jagged rock, and in the middle a giant skull whose eyes burn. The video is set in its forehead in a
 * frame of black iron with spikes, and the crowd stands in front of its open jaw. Braziers burn on both sides, skulls with red eyes are piled by the edges, cracks glow in the floor
 * and a ring of spikes lies under the booth. Like the others it only moves while a song plays (`live`): the eyes and the fires flicker, embers rise and the cracks pulse.
 */
export default function SkullBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down
    const ring = SCENE.booth.y + 100;
    const sk = (g: number | string) => `#${u(`sk${g}`)}`;

    /** A tree with no leaves, its foot at (x, y). */
    const tree = (k: string, x: number, y: number, s: number, flip = 1) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s * flip} ${s})`} stroke="#050109" strokeLinecap="round" fill="none">
            <path d="M0 0C-5 -60 7 -120 0 -196" strokeWidth="15" />
            <path d="M0 -92C-26 -112 -46 -138 -58 -176M-58 -176L-80 -184M-58 -176L-64 -204" strokeWidth="7" />
            <path d="M2 -128C26 -146 44 -170 52 -206M52 -206L72 -216M52 -206L50 -232" strokeWidth="6.4" />
            <path d="M0 -190C-10 -214 -6 -232 -14 -252" strokeWidth="5.4" />
        </g>
    );

    /** A brazier on the floor at (x, y), its fire and the light it throws. */
    const brazier = (k: string, x: number, y: number, delay: number) => (
        <g key={k}>
            <circle className="sc-flame" style={after(delay)} cx={x} cy={y - 120} r="210" fill={f('fire')} />
            <ellipse cx={x} cy={y + 2} rx="44" ry="7" fill="#000" opacity=".5" />
            <path d={`M${x - 20} ${y}L${x - 11} ${y - 78}H${x + 11}L${x + 20} ${y}Z`} fill="#2a2630" stroke="#0a070d" strokeWidth="2" />
            <path d={`M${x - 16} ${y - 28}H${x + 16}M${x - 13} ${y - 54}H${x + 13}`} stroke="#4a4452" strokeWidth="4" />
            <path d={`M${x - 50} ${y - 84}Q${x - 44} ${y - 46} ${x} ${y - 46}Q${x + 44} ${y - 46} ${x + 50} ${y - 84}Z`} fill="#2a2630" stroke="#0a070d" strokeWidth="2.4" />
            <ellipse cx={x} cy={y - 84} rx="50" ry="10" fill="#1a0a06" stroke="#5a5266" strokeWidth="3" />
            <ellipse cx={x} cy={y - 84} rx="40" ry="6" fill="#ff7a1a" opacity=".9" />
            <g className="sc-flame" style={after(delay - 0.3)}><path d={`M${x - 36} ${y - 84}C${x - 44} ${y - 130} ${x - 12} ${y - 150} ${x - 14} ${y - 196}C${x + 6} ${y - 160} ${x + 20} ${y - 176} ${x + 14} ${y - 132}C${x + 40} ${y - 150} ${x + 40} ${y - 108} ${x + 36} ${y - 84}Z`} fill="#e11d1d" /></g>
            <g className="sc-flame" style={after(delay - 0.9)}><path d={`M${x - 26} ${y - 84}C${x - 32} ${y - 116} ${x - 6} ${y - 128} ${x - 6} ${y - 162}C${x + 8} ${y - 134} ${x + 16} ${y - 142} ${x + 10} ${y - 114}C${x + 28} ${y - 120} ${x + 28} ${y - 100} ${x + 26} ${y - 84}Z`} fill="#fb923c" /></g>
            <g className="sc-flame" style={after(delay - 1.5)}><path d={`M${x - 14} ${y - 84}C${x - 18} ${y - 104} ${x - 2} ${y - 108} ${x} ${y - 128}C${x + 6} ${y - 110} ${x + 14} ${y - 104} ${x + 14} ${y - 84}Z`} fill="#fde68a" /></g>
        </g>
    );

    /** A heap of skulls with burning eyes on the floor at (x, y), the way it is turned says which edge it is by. */
    const heap = (k: string, x: number, y: number, flip: number) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${flip} 1)`}>
            <ellipse cy="6" rx="92" ry="12" fill="#000" opacity=".5" />
            <g transform="translate(-6 -6) rotate(-14)">{femur('a', 120, '#d8cdb0', '#8b7e63')}</g>
            {[[-60, -34, 0, 0.62], [4, -34, 1, 0.62], [64, -30, 2, 0.58], [-30, -76, 2, 0.6], [34, -76, 0, 0.6], [2, -118, 1, 0.64]].map(([sx, sy, g, s], i) => (
                <g key={i} transform={`translate(${sx} ${sy}) rotate(${(i % 3 - 1) * 9}) scale(${s})`}>
                    <use href={sk(g)} />
                    {i > 2 && [-16, 16].map((ex) => <g key={ex}><circle className="sc-flame" style={after(-i * 0.4 - ex / 30)} cx={ex} cy="-10" r="9" fill="#ff3a1c" opacity=".55" /><circle className="sc-flame" style={after(-i * 0.3 - ex / 20)} cx={ex} cy="-10" r="5" fill="#ffb347" /></g>)}
                </g>
            ))}
        </g>
    );

    /** An eye of the skull: a dark socket with a fire burning in it. */
    const eye = (k: 'L' | 'R') => {
        const cx = k === 'L' ? 612 : 988;
        const rot = k === 'L' ? -10 : 10;

        return (
            <g key={k}>
                <clipPath id={u(`e${k}`)}><ellipse cx={cx} cy="446" rx="104" ry="70" transform={`rotate(${rot} ${cx} 446)`} /></clipPath>
                <ellipse cx={cx} cy="446" rx="104" ry="70" transform={`rotate(${rot} ${cx} 446)`} fill="#0b0306" />
                <g clipPath={f(`e${k}`)}>
                    <rect x={cx - 120} y="370" width="240" height="170" fill={f(`g${k}`)} />
                    <g className="sc-flame" style={after(k === 'L' ? 0 : -0.8)}><path d={`M${cx} 516C${cx - 36} 486 ${cx - 20} 454 ${cx} 400C${cx + 20} 454 ${cx + 36} 486 ${cx} 516Z`} fill="#ffb347" /></g>
                    <g className="sc-flame" style={after(k === 'L' ? -0.5 : -1.3)}><path d={`M${cx} 508C${cx - 20} 486 ${cx - 12} 462 ${cx} 432C${cx + 12} 462 ${cx + 20} 486 ${cx} 508Z`} fill="#fff3c4" /></g>
                    <ellipse cx={cx} cy="400" rx="130" ry="26" fill="#000" opacity=".55" />
                </g>
                <ellipse cx={cx} cy="446" rx="104" ry="70" transform={`rotate(${rot} ${cx} 446)`} fill="none" stroke="#2a1410" strokeWidth="9" />
                <ellipse cx={cx} cy="446" rx="109" ry="75" transform={`rotate(${rot} ${cx} 446)`} fill="none" stroke="#ff6a50" strokeOpacity=".35" strokeWidth="2" />
            </g>
        );
    };

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                {skullGlyph(u('sk0'))}
                {skullGlyph(u('sk1'), '#d8cba8', '#9c8e6c')}
                {skullGlyph(u('sk2'), '#bfae86', '#7e6f52')}
                <clipPath id={u('head')}><path d={HEAD} /></clipPath>
                <linearGradient id={u('sky')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#05000b" /><stop offset=".45" stopColor="#17031c" /><stop offset=".82" stopColor="#4a0a1c" /><stop offset="1" stopColor="#7a1020" /></linearGradient>
                <radialGradient id={u('moon')} cx=".4" cy=".35" r=".75"><stop stopColor="#ffb08a" /><stop offset=".55" stopColor="#e0402c" /><stop offset="1" stopColor="#7a0f12" /></radialGradient>
                <radialGradient id={u('glow')} cx="800" cy="300" r="760" gradientUnits="userSpaceOnUse"><stop stopColor="#ff2a2a" stopOpacity=".42" /><stop offset=".55" stopColor="#c01020" stopOpacity=".16" /><stop offset="1" stopColor="#c01020" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('bone')} cx="800" cy="170" r="640" gradientUnits="userSpaceOnUse"><stop stopColor="#f7f0dd" /><stop offset=".5" stopColor="#d8cdb0" /><stop offset="1" stopColor="#7e7158" /></radialGradient>
                <radialGradient id={u('gL')} cx="612" cy="490" r="120" gradientUnits="userSpaceOnUse"><stop stopColor="#ffd45a" /><stop offset=".3" stopColor="#ff4a1c" /><stop offset=".65" stopColor="#8a0c14" /><stop offset="1" stopColor="#14030a" /></radialGradient>
                <radialGradient id={u('gR')} cx="988" cy="490" r="120" gradientUnits="userSpaceOnUse"><stop stopColor="#ffd45a" /><stop offset=".3" stopColor="#ff4a1c" /><stop offset=".65" stopColor="#8a0c14" /><stop offset="1" stopColor="#14030a" /></radialGradient>
                <linearGradient id={u('tooth')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f6efdc" /><stop offset=".7" stopColor="#d4c8aa" /><stop offset="1" stopColor="#a69a7c" /></linearGradient>
                <linearGradient id={u('goldtooth')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fde68a" /><stop offset=".5" stopColor="#fbbf24" /><stop offset="1" stopColor="#b45309" /></linearGradient>
                <linearGradient id={u('iron')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#3a3442" /><stop offset=".5" stopColor="#1c1822" /><stop offset="1" stopColor="#0b090f" /></linearGradient>
                <linearGradient id={u('brow')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#000" stopOpacity="0" /><stop offset=".3" stopColor="#000" stopOpacity=".5" /><stop offset="1" stopColor="#000" stopOpacity="0" /></linearGradient>
                <linearGradient id={u('shade')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#000" stopOpacity=".6" /><stop offset="1" stopColor="#000" stopOpacity="0" /></linearGradient>
                <radialGradient id={u('fire')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffb347" stopOpacity=".6" /><stop offset=".45" stopColor="#ff5a1a" stopOpacity=".2" /><stop offset="1" stopColor="#ff3a1a" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('fog')} cx=".5" cy=".5" r=".5"><stop stopColor="#8a2a3a" stopOpacity=".32" /><stop offset="1" stopColor="#8a2a3a" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <radialGradient id={u('spill')} cx="800" cy="720" r="560" gradientUnits="userSpaceOnUse"><stop stopColor="#ff3a2a" stopOpacity=".3" /><stop offset="1" stopColor="#ff3a2a" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#ff6a50" stopOpacity=".5" /><stop offset=".6" stopColor="#c01020" stopOpacity=".2" /><stop offset="1" stopColor="#c01020" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#c01020" stopOpacity="0" /><stop offset="1" stopColor="#060102" stopOpacity=".66" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#060102" stopOpacity=".7" /></radialGradient>
            </defs>

            {/* the night: a red sky, stars, a blood moon behind thin clouds, a bolt of lightning, rock and dead trees */}
            <rect width="1600" height="660" fill={f('sky')} />
            {STARS.map((s) => <circle key={s.k} className={s.k % 4 === 0 ? 'sc-twinkle' : undefined} style={s.k % 4 === 0 ? after(-s.k * 0.23) : undefined} cx={r1(s.x)} cy={r1(s.y)} r={s.r} fill={s.red ? '#ff8a8a' : '#fff'} opacity=".75" />)}
            <circle cx="1380" cy="170" r="230" fill="#ff3a2a" opacity=".16" />
            <circle cx="1380" cy="170" r="96" fill={f('moon')} />
            {[[1350, 140, 14], [1410, 190, 10], [1368, 204, 8], [1404, 130, 7]].map(([x, y, r]) => <circle key={`${x}${y}`} cx={x} cy={y} r={r} fill="#7a0f12" opacity=".35" />)}
            <ellipse className="sc-drift" cx="1340" cy="150" rx="190" ry="14" fill="#12020f" opacity=".8" /><ellipse className="sc-drift" style={after(-4)} cx="1430" cy="198" rx="150" ry="10" fill="#12020f" opacity=".7" />
            <ellipse className="sc-drift" style={after(-2)} cx="220" cy="230" rx="200" ry="12" fill="#12020f" opacity=".7" />
            <g className="sc-twinkle" fill="none" stroke="#e0d4ff" strokeLinecap="round" strokeLinejoin="round" opacity=".55">
                <path d="M210 0L176 96L204 102L150 236L184 242L128 360" strokeWidth="12" strokeOpacity=".2" /><path d="M210 0L176 96L204 102L150 236L184 242L128 360" strokeWidth="3" />
            </g>
            <path d={FAR} fill="#1a0614" /><path d={NEAR} fill="#0e0310" />
            {tree('t1', 120, 640, 1.2)}{tree('t2', 1490, 640, 1.1, -1)}{tree('t3', 330, 612, 0.7)}{tree('t4', 1270, 612, 0.75, -1)}
            <rect width="1600" height={height} fill={f('glow')} />

            {/* the giant skull: the dome behind the video, the brow, the burning eyes, the nose, the open jaw with its teeth */}
            <path d={HEAD} fill={f('bone')} stroke="#2a1a16" strokeWidth="5" />
            <path d="M1204 290C1198 372 1172 418 1150 466C1140 494 1126 520 1116 552" fill="none" stroke="#ff6a50" strokeOpacity=".5" strokeWidth="6" />
            <g clipPath={f('head')}>
                {[[432, 250, 34, 100], [1168, 250, 34, 100], [490, 540, 22, 40], [1110, 540, 22, 40]].map(([x, y, rx, ry]) => <ellipse key={`${x}${y}`} cx={x} cy={y} rx={rx} ry={ry} fill="#7e7158" opacity=".3" />)}
                <rect x="380" y="330" width="840" height="130" fill={f('brow')} />
            </g>
            <g fill="none" stroke="#2a1a14" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity=".75">
                <path d="M452 120L468 168L444 210L464 262L440 304" /><path d="M1148 100L1132 150L1156 196L1136 250L1160 300" />
                <path d="M520 560L544 520L530 490" /><path d="M1080 560L1056 520L1070 490" /><path d="M744 380L758 408L740 432" /><path d="M870 372L858 398L874 424" />
            </g>
            <path d="M800 372Q795 420 800 468" fill="none" stroke="#7e7158" strokeWidth="2" opacity=".7" />
            {eye('L')}{eye('R')}
            <path d="M800 468L754 540Q778 560 800 546Q822 560 846 540Z" fill="#0b0306" stroke="#2a1410" strokeWidth="5" strokeLinejoin="round" />
            <rect x="488" y="556" width="624" height="110" fill="#0b0306" />
            {[58, 62, 0, 60, 56, 62, 46, 60, 58, 56].map((h, i) => {
                const x = 500 + i * 60;

                return h === 0 ? null : (
                    <g key={i}>
                        <path d={`M${x} 566H${x + 56}L${x + 53} ${566 + h - 16}Q${x + 52} ${566 + h} ${x + 38} ${566 + h}H${x + 18}Q${x + 4} ${566 + h} ${x + 3} ${566 + h - 16}Z`} fill={f(i === 3 ? 'goldtooth' : 'tooth')} stroke="#2a1a14" strokeWidth="3" strokeLinejoin="round" />
                        <path d={`M${x + 12} 576V${566 + h - 22}`} stroke="#fff" strokeOpacity=".45" strokeWidth="4" strokeLinecap="round" />
                    </g>
                );
            })}
            <path d="M488 566H1112" stroke="#2a1a14" strokeWidth="5" />

            {/* the video, set in the forehead: black iron, rivets, a red thread of light and spikes */}
            <rect x={tv.x - 34} y="-30" width={tv.w + 68} height={tv.y + tv.h + 64} rx="6" fill={f('iron')} stroke="#000" strokeWidth="3" />
            <rect x={tv.x - 34} y={tv.y + tv.h + 34} width={tv.w + 68} height="40" fill={f('shade')} />
            <rect x={tv.x - 9} y={tv.y - 9} width={tv.w + 18} height={tv.h + 18} rx="3" fill="#050204" />
            <rect x={tv.x - 12} y={tv.y - 12} width={tv.w + 24} height={tv.h + 24} rx="5" fill="none" stroke="#ef4444" strokeOpacity=".25" strokeWidth="9" />
            <rect x={tv.x - 9} y={tv.y - 9} width={tv.w + 18} height={tv.h + 18} rx="3" fill="none" stroke="#ef4444" strokeWidth="2.4" />
            {Array.from({ length: 9 }, (_, i) => 24 + i * 38).flatMap((y) => [tv.x - 21, tv.x + tv.w + 21].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.4" fill="#5a5266" stroke="#000" strokeWidth="1" />))}
            {Array.from({ length: 17 }, (_, i) => tv.x - 4 + i * 36).map((x) => <circle key={x} cx={x} cy={tv.y + tv.h + 22} r="3.4" fill="#5a5266" stroke="#000" strokeWidth="1" />)}
            {Array.from({ length: 8 }, (_, i) => 30 + i * 44).flatMap((y) => [
                <path key={`l${y}`} d={`M${tv.x - 34} ${y}L${tv.x - 62} ${y + 11}L${tv.x - 34} ${y + 22}Z`} fill="#1c1822" stroke="#000" strokeWidth="2" strokeLinejoin="round" />,
                <path key={`r${y}`} d={`M${tv.x + tv.w + 34} ${y}L${tv.x + tv.w + 62} ${y + 11}L${tv.x + tv.w + 34} ${y + 22}Z`} fill="#1c1822" stroke="#000" strokeWidth="2" strokeLinejoin="round" />,
            ])}
            {Array.from({ length: 9 }, (_, i) => tv.x + 6 + i * 70).map((x) => <path key={x} d={`M${x} ${tv.y + tv.h + 34}L${x + 17} ${tv.y + tv.h + 64}L${x + 34} ${tv.y + tv.h + 34}Z`} fill="#1c1822" stroke="#000" strokeWidth="2" strokeLinejoin="round" />)}

            {/* the fires, the heaps of skulls, the dust of the embers */}
            {brazier('b1', 296, 628, 0)}{brazier('b2', 1304, 628, -1.1)}
            {heap('h1', 96, 640, 1)}{heap('h2', 1504, 640, -1)}
            {EMBERS.map((e) => <circle key={e.k} className="sc-wisp" style={after(e.d)} cx={r1(e.x)} cy={r1(e.y)} r={e.r} fill="#ffb347" />)}

            {/* the floor: black stone with cracks that glow */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            {floorGrid(height).map(({ i, j }) => <polygon key={`${i}-${j}`} points={tile(i, j)} fill={(i + j) % 2 ? '#7a1a22' : '#000'} opacity={(i * 5 + j * 11 + 100) % 7 < 3 ? 0.1 : 0.05} />)}
            {LIT.filter(([, j]) => rowY(j + 1) < height + 120).map(([i, j], k) => <polygon key={`lit${k}`} className="sc-tile" style={after((((i + 20) * 13 + j * 7) % 24) / 10)} points={tile(i, j)} fill={(i + j) % 2 ? '#ef4444' : '#f97316'} opacity=".34" />)}
            <g className="sc-shimmer" stroke="#ef4444" strokeOpacity=".4" strokeWidth="1.6">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('spill')} />
            {[[420, 664, 300, 30, 0], [1180, 660, 320, 30, -4]].map(([x, y, rx, ry, d]) => <ellipse key={`${x}${y}`} className="sc-drift" style={after(d)} cx={x} cy={y} rx={rx} ry={ry} fill={f('fog')} />)}

            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="400" ry="74" fill={f('pool')} />
                {Array.from({ length: 28 }, (_, k) => {
                    const a0 = (k * 2 * Math.PI) / 28;
                    const a1 = a0 + Math.PI / 28;
                    const a2 = a0 + (2 * Math.PI) / 28;
                    const pt = (a: number, rx: number, ry: number) => `${r1(800 + Math.cos(a) * rx)} ${r1(ring + Math.sin(a) * ry)}`;

                    return <path key={k} d={`M${pt(a0, 340, 58)}L${pt(a1, 366, 66)}L${pt(a2, 340, 58)}Z`} fill="#1c1822" stroke="#ef4444" strokeOpacity=".7" strokeWidth="1.6" strokeLinejoin="round" />;
                })}
                <ellipse cx="800" cy={ring} rx="340" ry="58" fill="#0a0509" stroke="#ef4444" strokeWidth="3" />
                <ellipse cx="800" cy={ring} rx="340" ry="58" fill="none" stroke="#ef4444" strokeOpacity=".3" strokeWidth="12" />
                <ellipse cx="800" cy={ring} rx="296" ry="49" fill="none" stroke="#f97316" strokeOpacity=".6" strokeWidth="2" strokeDasharray="4 8" />
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 4} rx="184" ry="15" fill="#000" opacity=".6" />
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
