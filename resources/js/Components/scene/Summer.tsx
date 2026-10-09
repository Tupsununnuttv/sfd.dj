import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { cloud } from '@/Components/scene/shapes';
import { after, floorGrid, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, floorTile as tile, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const font = 'Figtree, system-ui, sans-serif';
const LANTERNS = ['#ef4444', '#fb923c', '#facc15', '#f472b6', '#14b8a6'];

// glitter on the sea and the sand, the same every time
const rs = rand(58);
const GLITTER = Array.from({ length: 16 }, (_, k) => ({ x: 1390 + (rs() - 0.5) * (30 + k * 12), y: 506 + k * 8.4, w: 8 + rs() * 16 }));
const SPARKS = Array.from({ length: 10 }, () => ({ x: rs() * 1600, y: 510 + rs() * 110, s: 4 + rs() * 5 }));
const WAVE = (y: number, amp: number) => `M-120 ${y}${Array.from({ length: 18 }, (_, i) => `Q${-120 + i * 100 + 50} ${y - amp} ${-120 + (i + 1) * 100} ${y}`).join('')}`;

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * The summer scenery on a 1600 x 900 canvas: a day at the beach. A big sun, gulls, a sailboat on the sea and a lighthouse on a rock, a lifeguard
 * tower and a beach umbrella on the sand, a sign of two crossed surfboards, palm trees at the edges, the video in a bamboo frame with lanterns and
 * hibiscus, and a boardwalk for a floor with a sun painted under the booth. Like the others it only moves while a song plays (`live`): the sun's rays turn,
 * the waves roll, the boat sails, gulls fly over, the palms sway and a crab runs along the sand.
 */
export default function SummerBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down

    const frond = (a: number, len: number, k: string) => (
        <g key={k} transform={`rotate(${a})`}>
            <path d={`M0 0C${len * 0.3} ${-len * 0.34} ${len * 0.72} ${-len * 0.34} ${len} ${len * 0.12}C${len * 0.72} ${-len * 0.1} ${len * 0.3} ${-len * 0.1} 0 0Z`} fill="#1f9a4a" stroke="#0f5a2a" strokeWidth="1.6" />
            <path d={`M0 0C${len * 0.4} ${-len * 0.2} ${len * 0.7} ${-len * 0.2} ${len} ${len * 0.12}`} fill="none" stroke="#0f5a2a" strokeWidth="2" />
            <path d={`M0 -1C${len * 0.34} ${-len * 0.26} ${len * 0.66} ${-len * 0.26} ${len * 0.9} ${len * 0.06}`} fill="none" stroke="#7bdc6a" strokeWidth="3" opacity=".5" />
        </g>
    );

    const palm = (x: number, y: number, s: number, flip: number, k: string) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s * flip} ${s})`}>
            <ellipse cx="10" cy="4" rx="80" ry="9" fill="#5a3a12" opacity=".4" />
            <g className="sc-palm">
                <path d="M0 0C26 -110 -14 -230 34 -340" fill="none" stroke="#6b4423" strokeWidth="26" strokeLinecap="round" />
                <path d="M0 0C26 -110 -14 -230 34 -340" fill="none" stroke="#a9733a" strokeWidth="18" strokeLinecap="round" />
                <path d="M-3 0C21 -110 -19 -230 29 -340" fill="none" stroke="#c99560" strokeWidth="4" strokeLinecap="round" opacity=".6" />
                {Array.from({ length: 13 }, (_, i) => {
                    const t = (i + 0.6) / 13.4;
                    const cx = 26 * 3 * t * (1 - t) ** 2 + (-14) * 3 * t * t * (1 - t) + 34 * t ** 3;
                    const cy = -110 * 3 * t * (1 - t) ** 2 - 230 * 3 * t * t * (1 - t) - 340 * t ** 3;

                    return <path key={i} d={`M${r1(cx - 12)} ${r1(cy)}Q${r1(cx)} ${r1(cy + 5)} ${r1(cx + 12)} ${r1(cy)}`} stroke="#6b4423" strokeWidth="2.4" fill="none" />;
                })}
                <g transform="translate(34 -340)">
                    {[-175, -140, -108, -76, -44, -12, 18, 46].map((a, i) => frond(a, 150 + (i % 3) * 18, `f${i}`))}
                    {[[-6, 6], [10, 8], [2, 16]].map(([cx, cy]) => <circle key={cx} cx={cx} cy={cy} r="9" fill="#5a3a18" stroke="#3a2410" strokeWidth="1.4" />)}
                </g>
            </g>
        </g>
    );

    const board = (a: number, c1: string, c2: string, k: string) => (
        <g key={k} transform={`rotate(${a})`}>
            <path d="M0 -112C26 -92 30 -30 24 20C22 36 14 44 0 44C-14 44 -22 36 -24 20C-30 -30 -26 -92 0 -112Z" fill={c1} stroke="#00000040" strokeWidth="2" />
            <path d="M0 -108V42" stroke="#fff" strokeWidth="3" opacity=".7" /><path d="M-24 -30H24M-26 -4H26" stroke={c2} strokeWidth="9" />
            <path d="M0 44L-7 58L7 58Z" fill="#334155" />
        </g>
    );

    const gull = (x: number, y: number, s: number, k: number) => <path key={k} d={`M${x - 16 * s} ${y + 2 * s}Q${x - 8 * s} ${y - 10 * s} ${x} ${y}Q${x + 8 * s} ${y - 10 * s} ${x + 16 * s} ${y + 2 * s}`} fill="none" stroke="#ffffff" strokeWidth={2.8 * s} strokeLinecap="round" strokeLinejoin="round" />;

    const left = tv.x - 18;
    const right = tv.x + tv.w + 18;
    const bottom = tv.y + tv.h + 14;
    const hibiscus = (x: number, y: number, s: number, k: string) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
            {[0, 72, 144, 216, 288].map((a) => <path key={a} d="M0 0C-12 -10 -12 -28 0 -30C12 -28 12 -10 0 0Z" fill="#f43f5e" stroke="#be123c" strokeWidth="1" transform={`rotate(${a})`} />)}
            <path d="M0 0L2 -22" stroke="#fde047" strokeWidth="2.6" strokeLinecap="round" /><circle cx="2" cy="-23" r="3" fill="#f59e0b" />
        </g>
    );

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('sky')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#1a7fdc" /><stop offset=".4" stopColor="#47b5f0" /><stop offset=".72" stopColor="#a5defa" /><stop offset="1" stopColor="#fff1c2" /></linearGradient>
                <radialGradient id={u('sunGlow')} cx="1390" cy="130" r="360" gradientUnits="userSpaceOnUse"><stop stopColor="#fffbd0" stopOpacity=".95" /><stop offset=".3" stopColor="#ffe36a" stopOpacity=".4" /><stop offset="1" stopColor="#ffe36a" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('sea')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#5bd6e6" /><stop offset=".5" stopColor="#1fa5d8" /><stop offset="1" stopColor="#0a63b0" /></linearGradient>
                <linearGradient id={u('sand')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fbe6a8" /><stop offset="1" stopColor="#dfb470" /></linearGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffe9a8" stopOpacity="0" /><stop offset="1" stopColor={p.floorBottom} stopOpacity=".5" /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#fff0a8" stopOpacity=".55" /><stop offset=".6" stopColor="#ffb85a" stopOpacity=".2" /><stop offset="1" stopColor="#ffb85a" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#3a1a00" stopOpacity=".42" /></radialGradient>
                <radialGradient id={u('glowWarm')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffe08a" stopOpacity=".9" /><stop offset=".45" stopColor="#ffa940" stopOpacity=".35" /><stop offset="1" stopColor="#ff9a1f" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('drift')} cx=".5" cy=".5" r=".5"><stop stopColor="#fff6d6" stopOpacity=".95" /><stop offset=".7" stopColor="#f6dca0" stopOpacity=".7" /><stop offset="1" stopColor="#f6dca0" stopOpacity="0" /></radialGradient>
            </defs>

            {/* the sky: a big sun with turning rays, clouds, gulls */}
            <rect width="1600" height="650" fill={f('sky')} />
            <circle cx="1390" cy="130" r="360" fill={f('sunGlow')} />
            <g className="sc-rays" opacity=".55"><g transform="translate(1390 130)" fill="#fff3a0">{Array.from({ length: 16 }, (_, k) => <path key={k} d="M-8 -76L0 -134L8 -76Z" transform={`rotate(${k * 22.5})`} />)}</g></g>
            <circle cx="1390" cy="130" r="58" fill="#fff6b0" /><circle cx="1390" cy="130" r="48" fill="#ffd93a" />
            <g className="sc-drift">{cloud('c1', 190, 150, 0.75)}{cloud('c3', 1130, 250, 0.5)}</g>
            <g className="sc-drift" style={after(-5)}>{cloud('c2', 470, 80, 0.5)}{cloud('c4', 1500, 330, 0.62)}</g>
            <g className="sc-gulls"><g transform="translate(250 270)">{gull(0, 0, 1, 0)}{gull(46, -20, 0.8, 1)}{gull(-40, -26, 0.7, 2)}{gull(90, 8, 0.6, 3)}</g></g>

            {/* the sea: waves that roll, a boat, an island and a lighthouse */}
            <rect y="500" width="1600" height="150" fill={f('sea')} />
            <rect y="498" width="1600" height="4" fill="#d6f7ff" opacity=".7" />
            <g fill="none" strokeLinecap="round">
                <path className="sc-wave" d={WAVE(528, 7)} stroke="#d6f7ff" strokeWidth="3" opacity=".55" />
                <path className="sc-wave" style={after(-2.5)} d={WAVE(556, 9)} stroke="#d6f7ff" strokeWidth="3.4" opacity=".5" />
                <path className="sc-wave" style={after(-1.2)} d={WAVE(588, 11)} stroke="#ffffff" strokeWidth="4" opacity=".55" />
            </g>
            {GLITTER.map((g, k) => <path key={k} d={`M${r1(g.x - g.w / 2)} ${r1(g.y)}H${r1(g.x + g.w / 2)}`} stroke="#fffbd0" strokeWidth="2.6" strokeLinecap="round" opacity=".8" />)}
            {SPARKS.map((s, k) => <path key={k} className={k % 2 ? undefined : 'sc-star'} style={k % 2 ? undefined : after(k * 0.4)} d={`M${r1(s.x)} ${r1(s.y - s.s)}L${r1(s.x + s.s * 0.22)} ${r1(s.y - s.s * 0.22)}L${r1(s.x + s.s)} ${r1(s.y)}L${r1(s.x + s.s * 0.22)} ${r1(s.y + s.s * 0.22)}L${r1(s.x)} ${r1(s.y + s.s)}L${r1(s.x - s.s * 0.22)} ${r1(s.y + s.s * 0.22)}L${r1(s.x - s.s)} ${r1(s.y)}L${r1(s.x - s.s * 0.22)} ${r1(s.y - s.s * 0.22)}Z`} fill="#fff" opacity=".9" />)}
            <path d="M70 502C100 470 190 466 232 502Z" fill="#2f9a5a" /><path d="M70 502C100 482 190 480 232 502Z" fill="#46b86c" opacity=".7" />
            <path d="M150 484L146 456M146 456C132 452 124 458 120 466M146 456C158 448 170 452 176 462M146 456C140 444 150 438 160 440" stroke="#14532d" strokeWidth="3" strokeLinecap="round" fill="none" />
            <g transform="translate(1222 500)">
                <path d="M-60 2C-50 -26 -26 -34 -4 -30C20 -34 44 -22 56 2Z" fill="#7a6a5a" /><path d="M-24 -28L-18 -88H18L24 -28Z" fill="#fafafa" />
                <path d="M-21 -46L-19 -60H19L21 -46ZM-17 -74L-15 -86H15L17 -74Z" fill="#dc2626" /><rect x="-14" y="-104" width="28" height="16" fill="#334155" /><path d="M-18 -104H18L0 -122Z" fill="#dc2626" />
                <circle className="sc-flame" cx="0" cy="-96" r="16" fill={f('glowWarm')} /><circle cx="0" cy="-96" r="5" fill="#fff6b0" />
            </g>
            <g className="sc-sail">
                <g transform="translate(980 498)">
                    <path d="M-36 -4H40L28 12H-24Z" fill="#fff" stroke="#9aa6b8" strokeWidth="1.4" /><path d="M-36 -4H40" stroke="#dc2626" strokeWidth="4" />
                    <path d="M2 -6V-84" stroke="#6b4423" strokeWidth="2.6" /><path d="M6 -82C30 -50 30 -26 28 -8L6 -8Z" fill="#fff" stroke="#9aa6b8" strokeWidth="1.2" />
                    <path d="M-2 -76C-22 -46 -26 -26 -28 -8L-2 -8Z" fill="#fde68a" stroke="#d6a840" strokeWidth="1.2" /><path d="M2 -84L16 -90L2 -96Z" fill="#dc2626" />
                </g>
            </g>

            {/* the beach: sand, foam, a lifeguard tower, an umbrella, crossed surfboards with the name */}
            <path d="M0 596C120 586 260 592 400 598S640 606 800 602S1100 592 1260 596S1480 600 1600 592V650H0Z" fill={f('sand')} />
            <path d="M0 592C120 582 260 588 400 594S640 602 800 598S1100 588 1260 592S1480 596 1600 588" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".85" />
            <g transform="translate(250 606)">
                <ellipse cx="0" cy="2" rx="52" ry="6" fill="#8a5a12" opacity=".3" />
                <path d="M-30 0L-24 -46M30 0L24 -46M-26 -24H26" stroke="#8a5a2b" strokeWidth="4" fill="none" />
                <rect x="-34" y="-84" width="68" height="40" fill="#fafafa" stroke="#9aa6b8" strokeWidth="1.4" /><rect x="-34" y="-72" width="68" height="9" fill="#dc2626" />
                <rect x="-22" y="-80" width="16" height="12" fill="#7cc3f2" /><rect x="6" y="-80" width="16" height="12" fill="#7cc3f2" />
                <path d="M-42 -84L0 -112L42 -84Z" fill="#dc2626" /><path d="M0 -112V-134" stroke="#6b4423" strokeWidth="2.4" /><path d="M0 -134L22 -128L0 -122Z" fill="#facc15" />
                <path d="M-14 -44L-18 0M14 -44L18 0" stroke="#8a5a2b" strokeWidth="3" /><path d="M-34 -22H34" stroke="#8a5a2b" strokeWidth="2.4" />
            </g>
            <g transform="translate(1346 612)">
                <ellipse cx="0" cy="2" rx="70" ry="7" fill="#8a5a12" opacity=".3" />
                <path d="M0 4V-96" stroke="#6b4423" strokeWidth="5" strokeLinecap="round" />
                <path d="M-76 -66C-66 -110 -26 -124 0 -124C26 -124 66 -110 76 -66Q56 -78 38 -66Q19 -78 0 -66Q-19 -78 -38 -66Q-56 -78 -76 -66Z" fill="#fff" />
                <path d="M-76 -66C-68 -104 -36 -120 -14 -123L-12 -68Q-26 -80 -38 -66Q-56 -78 -76 -66Z" fill="#ef4444" /><path d="M14 -123C40 -118 68 -102 76 -66Q56 -78 38 -66Q26 -78 12 -68Z" fill="#ef4444" />
                <path d="M-40 -2C-20 -12 20 -12 40 -2L34 6C14 -2 -14 -2 -34 6Z" fill="#38bdf8" /><path d="M-30 4C-10 0 10 0 30 4" stroke="#fff" strokeWidth="3" fill="none" />
            </g>
            <ellipse cx="800" cy="540" rx="180" ry="96" fill={f('glowWarm')} opacity=".22" />
            <g transform="translate(800 606)">
                <ellipse cx="0" cy="0" rx="76" ry="8" fill="#8a5a12" opacity=".35" />
                {board(-16, '#f97316', '#fde047', 'sb1')}{board(16, '#14b8a6', '#ffffff', 'sb2')}
            </g>
            <rect x="752" y="542" width="96" height="30" rx="6" fill="#fff3d0" stroke="#a9733a" strokeWidth="2.4" />
            <text x="800" y="563" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize="18" letterSpacing="1" fill="#0e7490">SFD.DJ</text>
            <g className="sc-crab"><g transform="translate(560 610)">
                <ellipse cx="0" cy="10" rx="22" ry="3.4" fill="#8a5a12" opacity=".35" />
                <path d="M-18 4L-30 12M-12 7L-22 18M12 7L22 18M18 4L30 12" stroke="#b91c1c" strokeWidth="2.6" strokeLinecap="round" />
                <ellipse cx="0" cy="0" rx="19" ry="12" fill="#ef4444" stroke="#991b1b" strokeWidth="1.4" /><ellipse cx="-4" cy="-4" rx="9" ry="4" fill="#fff" opacity=".35" />
                <path d="M-18 -4C-30 -6 -34 -18 -26 -22C-22 -14 -20 -12 -14 -8ZM18 -4C30 -6 34 -18 26 -22C22 -14 20 -12 14 -8Z" fill="#ef4444" stroke="#991b1b" strokeWidth="1.4" />
                <path d="M-6 -10V-18M6 -10V-18" stroke="#991b1b" strokeWidth="2" /><circle cx="-6" cy="-19" r="3" fill="#fff" stroke="#111827" strokeWidth="1" /><circle cx="6" cy="-19" r="3" fill="#fff" stroke="#111827" strokeWidth="1" />
            </g></g>

            {/* the frame the video hangs in: bamboo, lights, lanterns and hibiscus */}
            <rect x={tv.x - 30} y={tv.y - 30} width={tv.w + 60} height={tv.h + 56} rx="26" fill="#ffd27a" opacity=".16" />
            <rect x={tv.x - 18} y={tv.y - 22} width={tv.w + 36} height={tv.h + 36} rx="14" fill="#1a1006" stroke="#c9a24b" strokeWidth="8" />
            <rect x={tv.x - 18} y={tv.y - 22} width={tv.w + 36} height={tv.h + 36} rx="14" fill="none" stroke="#f1d58a" strokeWidth="1.6" strokeOpacity=".6" />
            {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${left - 4} ${30 + i * 32}H${left + 4}M${right - 4} ${30 + i * 32}H${right + 4}`} stroke="#7a5a1a" strokeWidth="2.4" />)}
            {Array.from({ length: 22 }, (_, i) => <path key={i} d={`M${left + 14 + i * 33.4} ${bottom - 4}V${bottom + 4}`} stroke="#7a5a1a" strokeWidth="2.4" />)}
            <path d={`M${left + 20} ${bottom + 8}Q${(left + right) / 2} ${bottom + 30} ${right - 20} ${bottom + 8}`} stroke="#3a2a10" strokeWidth="2" fill="none" />
            {Array.from({ length: 18 }, (_, i) => {
                const t = (i + 0.5) / 18;
                const x = left + 20 + t * (right - left - 40);
                const y = bottom + 8 + 11 * 4 * t * (1 - t);

                return (
                    <g key={i}>
                        <circle className={i % 3 ? undefined : 'sc-twinkle'} style={i % 3 ? undefined : after(-i * 0.2)} cx={r1(x)} cy={r1(y + 4)} r="10" fill={f('glowWarm')} />
                        <ellipse cx={r1(x)} cy={r1(y + 4)} rx="3.2" ry="4.2" fill="#fff0a8" stroke="#a9741a" strokeWidth=".8" />
                    </g>
                );
            })}
            {[left + 110, left + 250, right - 250, right - 110].map((x, i) => (
                <g key={x} className={i % 2 ? undefined : 'sc-dangle'} style={i % 2 ? undefined : after(-i)}>
                    <path d={`M${x} ${bottom + 20}V${bottom + 36}`} stroke="#3a2a10" strokeWidth="1.6" />
                    <rect x={x - 6} y={bottom + 34} width="12" height="4" fill="#3a2a10" />
                    <ellipse cx={x} cy={bottom + 56} rx="15" ry="19" fill={LANTERNS[i + (i > 1 ? 1 : 0)]} stroke="#00000040" strokeWidth="1.2" />
                    <path d={`M${x - 8} ${bottom + 40}Q${x} ${bottom + 56} ${x - 8} ${bottom + 72}M${x + 8} ${bottom + 40}Q${x} ${bottom + 56} ${x + 8} ${bottom + 72}`} stroke="#00000030" strokeWidth="1.2" fill="none" />
                    <ellipse cx={x - 4} cy={bottom + 50} rx="3.6" ry="6" fill="#fff" opacity=".4" />
                    <rect x={x - 6} y={bottom + 73} width="12" height="4" fill="#3a2a10" />
                </g>
            ))}
            {hibiscus(left + 6, bottom - 10, 0.9, 'h1')}{hibiscus(right - 6, bottom - 10, 0.9, 'h2')}{hibiscus(left + 4, 70, 0.7, 'h3')}{hibiscus(right - 4, 70, 0.7, 'h4')}{hibiscus(left + 3, 190, 0.6, 'h5')}{hibiscus(right - 3, 190, 0.6, 'h6')}

            {/* the floor: a boardwalk */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            {floorGrid(height).map(({ i, j }) => <polygon key={`${i}-${j}`} points={tile(i, j)} fill={(i + j) % 2 ? '#ffd9a0' : '#3a1c08'} opacity={(i * 5 + j * 11 + 100) % 7 < 3 ? 0.12 : 0.07} />)}
            <g stroke="#2a1404" strokeOpacity=".4" strokeWidth="1.4">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>

            {/* the palms at the edges */}
            {palm(110, 760, 0.95, 1, 'pl')}{palm(1548, 780, 0.95, -1, 'pr')}

            {/* the sun on the floor under the booth */}
            <g transform={`translate(0 ${ext})`}>
            <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="400" ry="74" fill={f('pool')} />
            <g transform={`translate(800 ${SCENE.booth.y + 100}) scale(340 58)`}>
                <circle r="1" fill="none" stroke="#fde68a" strokeWidth="2.6" vectorEffect="non-scaling-stroke" />
                <path d={Array.from({ length: 24 }, (_, k) => { const a = (k * Math.PI) / 12; const tip = k % 2 ? 0.86 : 0.97; const w = 0.07; return `M${r1(Math.cos(a - w) * 62) / 100} ${r1(Math.sin(a - w) * 62) / 100}L${r1(Math.cos(a) * tip * 100) / 100} ${r1(Math.sin(a) * tip * 100) / 100}L${r1(Math.cos(a + w) * 62) / 100} ${r1(Math.sin(a + w) * 62) / 100}Z`; }).join('')} fill="#fbbf24" opacity=".7" />
                <circle r="0.56" fill="none" stroke="#fed7aa" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
                <circle r="0.4" fill="#f59e0b" opacity=".35" />
            </g>
            <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 4} rx="184" ry="15" fill="#000" opacity=".45" />
            </g>

            {/* a beach ball, and sand drifting in at the corners */}
            <g transform="translate(1390 800)">
                <ellipse cx="0" cy="24" rx="26" ry="5" fill="#3a1c08" opacity=".35" />
                <circle r="24" fill="#fff" />
                <path d="M0 -24A24 24 0 0 1 24 0L0 0Z" fill="#ef4444" /><path d="M24 0A24 24 0 0 1 0 24L0 0Z" fill="#facc15" /><path d="M0 24A24 24 0 0 1 -24 0L0 0Z" fill="#38bdf8" /><path d="M-24 0A24 24 0 0 1 0 -24L0 0Z" fill="#22c55e" />
                <circle r="24" fill="none" stroke="#00000030" strokeWidth="1.4" /><ellipse cx="-8" cy="-10" rx="7" ry="4" fill="#fff" opacity=".5" transform="rotate(-30 -8 -10)" />
            </g>
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
