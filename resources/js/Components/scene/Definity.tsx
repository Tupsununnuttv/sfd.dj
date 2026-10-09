import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { after, floorGrid, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, floorTile as tile, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;

// the stars, the Milky Way and the stars that are mirrored in the floor: the same every time
const rs = rand(2718);
const STARS = Array.from({ length: 220 }, () => ({ x: rs() * 1600, y: rs() ** 1.4 * 600, r: 0.4 + rs() * 1.4, o: 0.25 + rs() * 0.75 }));
const MILKY = Array.from({ length: 360 }, () => {
    const t = rs() * 2 - 1;

    return { x: 800 + t * 1000, y: 250 + (rs() + rs() - 1) * 80, r: 0.3 + rs() * 0.9, o: 0.2 + rs() * 0.5 };
});
const MIRROR = Array.from({ length: 70 }, () => ({ x: rs() * 1600, y: 650 + rs() * 240, h: 6 + rs() * 22, o: 0.1 + rs() * 0.3 }));

/** An infinity sign (a lemniscate) centred on (0, 0): `a` wide, as a path. */
const infinity = (a: number, k = 1) => Array.from({ length: 121 }, (_, i) => {
    const t = (i / 120) * Math.PI * 2;
    const d = 1 + Math.sin(t) ** 2;

    return `${i ? 'L' : 'M'}${r1((a * Math.cos(t)) / d)} ${r1((a * k * Math.sin(t) * Math.cos(t)) / d)}`;
}).join('') + 'Z';

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * Midnight Definity, on a 1600 x 900 canvas: a deep midnight sky with the Milky Way, a crescent moon, shooting stars and a satellite, a glowing infinity sign
 * that a pulse of light runs along, the video in a glass frame, and a black mirror of a floor that reflects the stars, with an infinity ring under the booth.
 * Like the others it only moves while a song plays (`live`).
 */
export default function DefinityBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down
    const left = tv.x - 18;
    const right = tv.x + tv.w + 18;
    const bottom = tv.y + tv.h + 14;
    const ring = SCENE.booth.y + 100;

    const shoot = (x: number, y: number, d: number, k: string) => (
        <g key={k} className="sc-shoot" style={after(d)}>
            <path d={`M${x + 120} ${y - 62}L${x} ${y}L${x + 124} ${y - 56}Z`} fill={f('streak')} />
            <circle cx={x} cy={y} r="2.4" fill="#fff" /><circle cx={x} cy={y} r="8" fill="#a5b4fc" opacity=".25" />
        </g>
    );

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <mask id={u('crescent')} maskUnits="userSpaceOnUse" x="-90" y="-90" width="180" height="180"><rect x="-90" y="-90" width="180" height="180" fill="#fff" /><circle cx="30" cy="-12" r="64" fill="#000" /></mask>
                <linearGradient id={u('sky')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#01020a" /><stop offset=".4" stopColor="#060a26" /><stop offset=".75" stopColor="#101a52" /><stop offset="1" stopColor="#2a2f8a" /></linearGradient>
                <linearGradient id={u('band')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a5b4fc" stopOpacity="0" /><stop offset=".5" stopColor="#c7d2fe" stopOpacity=".28" /><stop offset="1" stopColor="#a5b4fc" stopOpacity="0" /></linearGradient>
                <radialGradient id={u('neb1')} cx=".5" cy=".5" r=".5"><stop stopColor="#7c3aed" stopOpacity=".5" /><stop offset="1" stopColor="#7c3aed" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('neb2')} cx=".5" cy=".5" r=".5"><stop stopColor="#06b6d4" stopOpacity=".4" /><stop offset="1" stopColor="#06b6d4" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('moonGlow')} cx=".5" cy=".5" r=".5"><stop stopColor="#e0e7ff" stopOpacity=".5" /><stop offset="1" stopColor="#e0e7ff" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('streak')} x1="1" y1="0" x2="0" y2="1"><stop stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" stopOpacity=".95" /></linearGradient>
                <linearGradient id={u('inf')} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#22d3ee" /><stop offset=".5" stopColor="#a78bfa" /><stop offset="1" stopColor="#f0abfc" /></linearGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <linearGradient id={u('horizon')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#6366f1" stopOpacity="0" /><stop offset=".5" stopColor="#6366f1" stopOpacity=".4" /><stop offset="1" stopColor="#6366f1" stopOpacity="0" /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#a5b4fc" stopOpacity=".5" /><stop offset=".6" stopColor="#6366f1" stopOpacity=".18" /><stop offset="1" stopColor="#6366f1" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#312e81" stopOpacity="0" /><stop offset="1" stopColor="#01010a" stopOpacity=".7" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".6" /></radialGradient>
            </defs>

            {/* the sky: the Milky Way, two nebulae, the stars, a crescent moon, shooting stars, a satellite */}
            <rect width="1600" height="650" fill={f('sky')} />
            <g transform="rotate(-22 800 250)"><ellipse cx="800" cy="250" rx="1150" ry="110" fill={f('band')} /></g>
            <ellipse cx="330" cy="330" rx="260" ry="150" fill={f('neb1')} /><ellipse cx="1330" cy="200" rx="300" ry="160" fill={f('neb2')} /><ellipse cx="1500" cy="420" rx="220" ry="120" fill={f('neb1')} />
            {MILKY.map((s, k) => <circle key={`m${k}`} cx={r1(s.x)} cy={r1(s.y)} r={r1(s.r)} fill="#e0e7ff" opacity={r1(s.o)} />)}
            {STARS.map((s, k) => <circle key={k} className={k % 14 === 0 ? 'sc-star' : undefined} style={k % 14 === 0 ? after((k * 0.37) % 2.6) : undefined} cx={r1(s.x)} cy={r1(s.y)} r={r1(s.r)} fill="#fff" opacity={r1(s.o)} />)}
            <g transform="translate(250 190) rotate(-18)">
                <circle r="150" fill={f('moonGlow')} />
                <circle r="74" fill="#eef2ff" mask={f('crescent')} />
            </g>
            {shoot(1380, 150, 0, 's1')}{shoot(1180, 260, -4, 's2')}{shoot(330, 90, -8, 's3')}
            <g className="sc-gulls"><g transform="translate(1300 80)">
                <rect x="-6" y="-4" width="12" height="8" rx="2" fill="#cbd5e1" /><rect x="-26" y="-3" width="16" height="6" fill="#38bdf8" /><rect x="10" y="-3" width="16" height="6" fill="#38bdf8" /><circle cx="0" cy="-8" r="1.8" className="sc-flame" fill="#fca5a5" />
            </g></g>

            {/* the infinity sign over the horizon, with a pulse of light running along it */}
            <g transform="translate(800 540)" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d={infinity(470, 1.05)} stroke="#6366f1" strokeWidth="26" opacity=".14" />
                <path d={infinity(470, 1.05)} stroke={f('inf')} strokeWidth="6" opacity=".75" />
                <path d={infinity(470, 1.05)} stroke="#fff" strokeWidth="1.8" opacity=".9" />
                <path className="sc-dash" d={infinity(470, 1.05)} stroke="#ffffff" strokeWidth="9" strokeDasharray="70 1000" opacity=".95" />
            </g>

            {/* the frame the video hangs in: glass */}
            {[24, 16, 9].map((g, i) => <rect key={g} x={tv.x - g - 18} y={tv.y - g - 22} width={tv.w + 36 + g * 2} height={tv.h + 36 + g * 2} rx={16 + g} fill="#818cf8" opacity={0.04 + i * 0.04} />)}
            <rect x={tv.x - 18} y={tv.y - 22} width={tv.w + 36} height={tv.h + 36} rx="14" fill="#02030c" stroke="#a5b4fc" strokeWidth="3" />
            <rect x={tv.x - 10} y={tv.y - 14} width={tv.w + 20} height={tv.h + 20} rx="9" fill="none" stroke="#67e8f9" strokeOpacity=".5" strokeWidth="1.4" />
            {[[left, bottom], [right, bottom], [left, 30], [right, 30]].map(([x, y]) => (
                <g key={`${x}${y}`} transform={`translate(${x} ${y})`}><path d="M0 -14V14M-14 0H14" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".9" /><circle r="12" fill="#a5b4fc" opacity=".25" /></g>
            ))}

            {/* the floor: a black mirror that holds the stars */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            <rect y={FLOOR - 30} width="1600" height="90" fill={f('horizon')} />
            {floorGrid(height).map(({ i, j }) => ((i * 7 + j * 3 + 100) % 13 === 0 ? <polygon key={`${i}-${j}`} className="sc-tile" style={after(((i + 20) * 13 + j * 7) % 24 / 10)} points={tile(i, j)} fill="#818cf8" opacity=".16" /> : null))}
            <g stroke="#818cf8" strokeOpacity=".22" strokeWidth="1.2">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>
            {MIRROR.filter((s) => s.y < height - 20).map((s, k) => <path key={k} className={k % 5 ? undefined : 'sc-star'} style={k % 5 ? undefined : after((k * 0.43) % 2.6)} d={`M${r1(s.x)} ${r1(s.y - s.h)}V${r1(s.y + s.h)}`} stroke="#c7d2fe" strokeWidth="1.6" strokeLinecap="round" opacity={r1(s.o)} />)}

            {/* the infinity ring under the booth */}
            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="400" ry="74" fill={f('pool')} />
                <g transform={`translate(800 ${ring}) scale(1 .17)`} fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d={infinity(350, 1.25)} stroke="#6366f1" strokeWidth="26" opacity=".25" />
                    <path d={infinity(350, 1.25)} stroke={f('inf')} strokeWidth="6" />
                    <path d={infinity(350, 1.25)} stroke="#fff" strokeWidth="1.8" opacity=".9" />
                </g>
                <ellipse cx="800" cy={ring} rx="372" ry="62" fill="none" stroke="#a5b4fc" strokeOpacity=".5" strokeWidth="1.6" strokeDasharray="2 9" />
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
