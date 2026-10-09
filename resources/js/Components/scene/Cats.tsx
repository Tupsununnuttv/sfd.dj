import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { after, floorGrid, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, floorTile as tile, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const font = 'Figtree, system-ui, sans-serif';
const SPINES = ['#ef4444', '#3b82f6', '#facc15', '#22c55e', '#a855f7', '#fb923c', '#14b8a6', '#f472b6'];

// the paws on the wall and the books: the same every time
const rs = rand(7);
const PAWS = Array.from({ length: 34 }, (_, k) => ({ x: 40 + (k % 9) * 190 + (Math.floor(k / 9) % 2) * 95 + rs() * 20, y: 40 + Math.floor(k / 9) * 130 + rs() * 20, r: -30 + rs() * 60 }));
const BOOKS = Array.from({ length: 22 }, (_, k) => ({ w: 8 + rs() * 8, h: 34 + rs() * 22, c: SPINES[Math.floor(rs() * 8)], k }));

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * The cat café scenery on a 1600 x 900 canvas: a cosy room full of cats. The video is a window with curtains, and under it a shelf where four cats sit and watch. A cat tree with
 * a cat on top, a bookcase where two cats sleep, a mouse in its hole, a cat flap, a wooden floor with a round rug of paw prints under the booth. Like the others it only moves
 * while a song plays (`live`): tails swish, a ball of yarn rolls by, a red dot dances over the floor, the mouse peeks out and the lamp glows.
 */
export default function CatsBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down
    const left = tv.x - 18;
    const right = tv.x + tv.w + 18;
    const ring = SCENE.booth.y + 100;

    /** A cat sitting up, facing us, its feet on (x, y); `s` its size, `flip` which way the tail curls. */
    const cat = (k: string, x: number, y: number, s: number, fur: string, belly: string, eye: string, stripes: boolean, flip = 1) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s * flip} ${s})`}>
            <ellipse cx="0" cy="3" rx="34" ry="6" fill="#000" opacity=".28" />
            <path className="sc-kick" style={after(-x / 90)} d="M20 -3C56 -2 62 -42 42 -62C38 -52 46 -38 36 -22C31 -14 25 -12 18 -9Z" fill={fur} />
            <path d="M-27 0C-31 -30 -23 -54 0 -56C23 -54 31 -30 27 0Z" fill={fur} />
            <ellipse cx="0" cy="-20" rx="13" ry="20" fill={belly} />
            {stripes && <path d="M-26 -34L-17 -32M-27 -22L-17 -22M26 -34L17 -32M27 -22L17 -22" stroke="#00000040" strokeWidth="3" strokeLinecap="round" />}
            <ellipse cx="-9" cy="-1" rx="7" ry="4.4" fill={belly} /><ellipse cx="9" cy="-1" rx="7" ry="4.4" fill={belly} />
            <path d="M-21 -78L-24 -101L-4 -88ZM21 -78L24 -101L4 -88Z" fill={fur} /><path d="M-19 -82L-21 -95L-9 -87ZM19 -82L21 -95L9 -87Z" fill="#f9a8d4" />
            <ellipse cx="0" cy="-67" rx="24" ry="21" fill={fur} />
            {stripes && <path d="M-4 -86V-77M0 -87V-76M4 -86V-77" stroke="#00000040" strokeWidth="2.4" strokeLinecap="round" />}
            <ellipse cx="0" cy="-60" rx="11" ry="8" fill={belly} opacity=".9" />
            <ellipse className="sc-flame" cx="-9" cy="-70" rx="5" ry="5.8" fill={eye} /><ellipse className="sc-flame" cx="9" cy="-70" rx="5" ry="5.8" fill={eye} />
            <ellipse cx="-9" cy="-70" rx="1.8" ry="4.6" fill="#0b0b10" /><ellipse cx="9" cy="-70" rx="1.8" ry="4.6" fill="#0b0b10" />
            <circle cx="-7.6" cy="-72.4" r="1.2" fill="#fff" /><circle cx="10.4" cy="-72.4" r="1.2" fill="#fff" />
            <path d="M-3 -63L3 -63L0 -59Z" fill="#f472b6" /><path d="M0 -59Q-4 -54 -8 -57M0 -59Q4 -54 8 -57" stroke="#3a2418" strokeWidth="1.3" fill="none" strokeLinecap="round" />
            <path d="M-12 -61L-34 -64M-12 -58L-34 -56M12 -61L34 -64M12 -58L34 -56" stroke="#fff" strokeWidth="1.1" opacity=".8" />
        </g>
    );

    /** A cat asleep as a loaf. */
    const sleeper = (k: string, x: number, y: number, s: number, fur: string, belly: string) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse cx="0" cy="2" rx="40" ry="5" fill="#000" opacity=".25" />
            <path className="sc-kick" style={after(-x / 70)} d="M32 -4C54 -4 56 -22 44 -26C48 -18 42 -12 30 -10Z" fill={fur} />
            <path d="M-36 0C-40 -26 -20 -36 0 -36C22 -36 40 -26 36 0Z" fill={fur} />
            <path d="M-6 -4C-8 -16 6 -16 4 -4Z" fill={belly} opacity=".6" />
            <ellipse cx="-24" cy="-14" rx="15" ry="13" fill={fur} /><path d="M-36 -22L-38 -36L-27 -27ZM-14 -22L-12 -36L-23 -27Z" fill={fur} />
            <path d="M-31 -15Q-27 -11 -23 -15M-21 -15Q-17 -11 -13 -15" stroke="#1a1a22" strokeWidth="1.8" fill="none" strokeLinecap="round" /><path d="M-26 -9L-22 -9L-24 -7Z" fill="#f472b6" />
            <text x="-6" y="-42" fontFamily={font} fontWeight="900" fontSize="13" fill="#fff" opacity=".7" className="sc-twinkle">z</text>
        </g>
    );

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('wall')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#5b3a5a" /><stop offset=".55" stopColor="#b8725a" /><stop offset="1" stopColor="#e6a06a" /></linearGradient>
                <linearGradient id={u('wood')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a56b3a" /><stop offset="1" stopColor="#6e3f1d" /></linearGradient>
                <linearGradient id={u('curtain')} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#c44569" /><stop offset=".35" stopColor="#e86a8c" /><stop offset=".7" stopColor="#b03a5c" /><stop offset="1" stopColor="#e86a8c" /></linearGradient>
                <radialGradient id={u('lamp')} cx=".5" cy=".5" r=".5"><stop stopColor="#fff0b0" stopOpacity=".9" /><stop offset=".5" stopColor="#ffc060" stopOpacity=".3" /><stop offset="1" stopColor="#ff9a1f" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('night')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#1b2250" /><stop offset="1" stopColor="#3a4a8a" /></linearGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffe0a0" stopOpacity=".5" /><stop offset=".6" stopColor="#ff9a5a" stopOpacity=".18" /><stop offset="1" stopColor="#ff9a5a" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffb070" stopOpacity="0" /><stop offset="1" stopColor="#1e0f08" stopOpacity=".55" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#1e0f08" stopOpacity=".5" /></radialGradient>
                <g id={u('paw')} fill="currentColor"><ellipse cx="0" cy="4" rx="7" ry="6" /><ellipse cx="-9" cy="-4" rx="3.2" ry="4" /><ellipse cx="-3.4" cy="-9" rx="3.2" ry="4" /><ellipse cx="3.4" cy="-9" rx="3.2" ry="4" /><ellipse cx="9" cy="-4" rx="3.2" ry="4" /></g>
            </defs>

            {/* the wall with paws on it, the wood panel under it */}
            <rect width="1600" height="650" fill={f('wall')} />
            <g color="#ffffff" opacity=".1">{PAWS.map((w, k) => <use key={k} href={`#${u('paw')}`} transform={`translate(${r1(w.x)} ${r1(w.y)}) rotate(${r1(w.r)}) scale(1.4)`} />)}</g>
            <rect y="540" width="1600" height="90" fill={f('wood')} /><rect y="536" width="1600" height="8" fill="#c28a52" />
            {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${i * 100 + 50} 546V628`} stroke="#00000030" strokeWidth="2" />)}
            <circle cx="1210" cy="150" r="170" fill={f('lamp')} />

            {/* the window the video hangs in: wood, curtains with ties, a shelf of cats under it */}
            {[22, 14, 8].map((g, i) => <rect key={g} x={tv.x - g - 18} y={tv.y - g - 22} width={tv.w + 36 + g * 2} height={tv.h + 36 + g * 2} rx={10 + g} fill="#ffd9a0" opacity={0.05 + i * 0.04} />)}
            <rect x={tv.x - 22} y={tv.y - 26} width={tv.w + 44} height={tv.h + 44} rx="8" fill="#8a5a2b" /><rect x={tv.x - 18} y={tv.y - 22} width={tv.w + 36} height={tv.h + 36} rx="6" fill="#0a0612" stroke="#c28a52" strokeWidth="3" />
            {[0, 1].map((s) => (
                <g key={s} transform={s ? 'translate(1600 0) scale(-1 1)' : undefined}>
                    <path d={`M${left - 70} -10H${left + 6}C${left + 20} 120 ${left - 6} 260 ${left + 8} 380C${left - 20} 400 ${left - 60} 400 ${left - 74} 380C${left - 60} 250 ${left - 84} 120 ${left - 70} -10Z`} fill={f('curtain')} />
                    <path d={`M${left - 48} 0C${left - 40} 130 ${left - 56} 260 ${left - 46} 390M${left - 22} 0C${left - 12} 130 ${left - 28} 260 ${left - 18} 385`} stroke="#00000030" strokeWidth="3" fill="none" />
                    <path d={`M${left - 74} 250Q${left - 30} 270 ${left + 8} 248`} stroke="#fcd34d" strokeWidth="6" fill="none" strokeLinecap="round" /><circle cx={left + 8} cy="250" r="7" fill="#fcd34d" />
                </g>
            ))}
            <rect x={left - 44} y="500" width={right - left + 88} height="16" rx="4" fill="#a56b3a" /><rect x={left - 44} y="496" width={right - left + 88} height="6" fill="#c28a52" />
            {[left + 20, right - 20].map((x) => <path key={x} d={`M${x} 516V548L${x + (x < 800 ? 24 : -24)} 516`} stroke="#8a5a2b" strokeWidth="5" fill="none" />)}
            {cat('c1', 560, 496, 0.95, '#f59e42', '#fde6c4', '#a3e635', true)}{cat('c2', 710, 496, 0.9, '#9aa3b2', '#e8ecf3', '#fbbf24', false, -1)}{cat('c3', 890, 496, 0.95, '#2a2a34', '#4a4a58', '#fde047', false)}{cat('c4', 1040, 496, 0.9, '#f8f4ee', '#ffffff', '#38bdf8', false, -1)}
            <g transform="translate(626 496)"><ellipse cx="0" cy="0" rx="22" ry="5" fill="#000" opacity=".2" /><path d="M-14 0V-20H14V0Z" fill="#5eead4" opacity=".5" stroke="#99f6e4" strokeWidth="2" /><path d="M-9 -8Q0 -2 9 -8" stroke="#fb923c" strokeWidth="3" fill="none" /><ellipse cx="0" cy="-20" rx="14" ry="3" fill="#99f6e4" opacity=".5" /></g>
            <g transform="translate(968 496)"><path d="M-10 0L-8 -16H8L10 0Z" fill="#c2410c" /><path d="M-6 -16C-14 -34 -2 -40 0 -24C2 -40 14 -34 6 -16Z" fill="#22c55e" /><path d="M0 -16C-2 -34 4 -42 10 -36" stroke="#16a34a" strokeWidth="3" fill="none" /></g>

            {/* a cat flap, a mouse in its hole */}
            <g transform="translate(800 628)"><rect x="-34" y="-72" width="68" height="72" rx="6" fill="#6e3f1d" stroke="#c28a52" strokeWidth="3" /><rect x="-22" y="-52" width="44" height="46" rx="22" fill="#2a1a10" /><path d="M-22 -30A22 22 0 0 1 22 -30" fill="#8a5a2b" stroke="#c28a52" strokeWidth="2" /><path d="M-14 -62L-10 -72L-6 -62ZM6 -62L10 -72L14 -62Z" fill="#f9a8d4" /></g>
            <g transform="translate(330 626)">
                <path d="M-26 0A26 28 0 0 1 26 0Z" fill="#1a0f08" />
                <g className="sc-bob"><ellipse cx="0" cy="-14" rx="11" ry="9" fill="#cbd5e1" /><circle cx="-9" cy="-24" r="6" fill="#cbd5e1" /><circle cx="9" cy="-24" r="6" fill="#cbd5e1" /><circle cx="-9" cy="-24" r="3.4" fill="#f9a8d4" /><circle cx="9" cy="-24" r="3.4" fill="#f9a8d4" /><circle cx="-4" cy="-17" r="1.5" fill="#111" /><circle cx="4" cy="-17" r="1.5" fill="#111" /><circle cx="0" cy="-12" r="1.8" fill="#f472b6" /></g>
                <path d="M-26 0A26 28 0 0 1 -14 -22L-14 0Z" fill="#6e3f1d" /><path d="M26 0A26 28 0 0 0 14 -22L14 0Z" fill="#6e3f1d" /><path d="M-30 0H30" stroke="#c28a52" strokeWidth="4" />
            </g>

            {/* the cat tree on the left, the bookcase on the right */}
            <g transform="translate(120 632)">
                <ellipse cx="0" cy="4" rx="96" ry="10" fill="#000" opacity=".3" />
                <rect x="-92" y="-18" width="184" height="20" rx="6" fill="#8a6a4a" /><rect x="-92" y="-18" width="184" height="7" rx="3" fill="#b8946a" />
                <rect x="-12" y="-300" width="24" height="284" fill="#d9c08a" />{Array.from({ length: 28 }, (_, i) => <path key={i} d={`M-12 ${-296 + i * 10}H12`} stroke="#a58a52" strokeWidth="2" />)}
                <rect x="-84" y="-190" width="168" height="16" rx="6" fill="#8a6a4a" /><rect x="-84" y="-190" width="168" height="6" rx="3" fill="#b8946a" />
                <rect x="-70" y="-330" width="140" height="16" rx="6" fill="#8a6a4a" /><rect x="-70" y="-330" width="140" height="6" rx="3" fill="#b8946a" />
                <g transform="translate(-60 -18)"><rect x="-28" y="-62" width="56" height="62" rx="6" fill="#c69a6a" /><path d="M-30 -62L0 -88L30 -62Z" fill="#a67a4a" /><ellipse cx="0" cy="-28" rx="16" ry="20" fill="#2a1a10" /></g>
                <path d="M50 -190V-130" stroke="#6b4423" strokeWidth="2.4" /><circle className="sc-bob" cx="50" cy="-118" r="12" fill="#ef4444" /><path d="M42 -122Q50 -128 58 -122M42 -114Q50 -108 58 -114" stroke="#fff" strokeWidth="1.6" fill="none" />
            </g>
            <g transform="translate(120 450)">{cat('t1', 0, -4, 0.75, '#c8b8a8', '#f4ece4', '#a3e635', true)}</g>
            <g transform="translate(1428 628)">
                <rect x="-130" y="-420" width="260" height="420" rx="4" fill="#6e3f1d" stroke="#8a5a2b" strokeWidth="4" /><rect x="-120" y="-410" width="240" height="400" fill="#4a2a14" />
                {[-300, -190, -80].map((y) => <g key={y}><rect x="-122" y={y} width="244" height="10" fill="#a56b3a" />{BOOKS.slice(0, 7).map((b, i) => <rect key={i} x={-116 + i * 14 + (y % 3)} y={y - b.h + (y === -300 ? 0 : 0)} width={b.w} height={b.h} fill={SPINES[(i + (-y / 10)) % 8 | 0]} opacity={0.9} />)}</g>)}
                {sleeper('s1', 40, -300, 0.9, '#f59e42', '#fde6c4')}{sleeper('s2', -50, -80, 0.9, '#7c7c8a', '#d4d8e0')}
                <g transform="translate(40 -190)"><ellipse cx="0" cy="-16" rx="22" ry="18" fill="#bae6fd" opacity=".55" stroke="#7dd3fc" strokeWidth="2" /><path d="M-8 -16Q-2 -22 4 -16Q-2 -10 -8 -16ZM4 -16L10 -20V-12Z" fill="#fb923c" /><rect x="-18" y="-2" width="36" height="4" fill="#7dd3fc" opacity=".6" /></g>
            </g>
            <g transform="translate(1250 90)"><rect x="-44" y="-34" width="88" height="68" rx="3" fill="#8a5a2b" /><rect x="-38" y="-28" width="76" height="56" fill="#fde6c4" />{cat('pic', 0, 22, 0.42, '#f59e42', '#fde6c4', '#a3e635', true)}</g>

            {/* the floor: wood, a rug of paws under the booth, a ball of yarn and a red dot */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            {floorGrid(height).map(({ i, j }) => <polygon key={`${i}-${j}`} points={tile(i, j)} fill={(i + j) % 2 ? '#ffd9a0' : '#2a1408'} opacity={(i * 5 + j * 11 + 100) % 7 < 3 ? 0.1 : 0.06} />)}
            <g stroke="#2a1408" strokeOpacity=".4" strokeWidth="1.4">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>
            <g className="sc-roll"><g transform="translate(300 722)">
                <ellipse cx="0" cy="22" rx="24" ry="5" fill="#000" opacity=".3" />
                <g className="sc-blades"><circle r="22" fill="#f472b6" /><path d="M-22 0Q0 -12 22 0M-18 -12Q0 -2 18 -12M-18 12Q0 2 18 12M0 -22Q-12 0 0 22M10 -20Q2 0 10 20" stroke="#be185d" strokeWidth="2" fill="none" /></g>
                <path d="M20 8C50 16 70 4 96 14" stroke="#f472b6" strokeWidth="3" fill="none" strokeLinecap="round" />
            </g></g>
            <g className="sc-dot"><g transform="translate(1000 680)"><circle r="16" fill="#ff2a2a" opacity=".3" /><circle r="6" fill="#ff4a4a" /><circle r="2.4" fill="#fff" /></g></g>

            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="400" ry="74" fill={f('pool')} />
                <g transform={`translate(800 ${ring}) scale(340 58)`}>
                    <circle r="1" fill="#c44569" opacity=".85" /><circle r="1" fill="none" stroke="#fcd34d" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                    <circle r="0.9" fill="none" stroke="#fde6c4" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeDasharray="4 7" />
                    <circle r="0.78" fill="#e86a8c" opacity=".7" />
                    {Array.from({ length: 8 }, (_, k) => { const a = (k * Math.PI) / 4; return <g key={k} transform={`translate(${r1(Math.cos(a) * 0.62 * 100) / 100} ${r1(Math.sin(a) * 0.62 * 100) / 100}) scale(.0062 .036) rotate(${k * 45 + 90})`} fill="#fde6c4" opacity=".85"><ellipse cy="4" rx="7" ry="6" /><ellipse cx="-9" cy="-4" rx="3.2" ry="4" /><ellipse cx="-3.4" cy="-9" rx="3.2" ry="4" /><ellipse cx="3.4" cy="-9" rx="3.2" ry="4" /><ellipse cx="9" cy="-4" rx="3.2" ry="4" /></g>; })}
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
