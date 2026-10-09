import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { floorLineX as lineX, floorRowY as rowY, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string; image?: string | null }

/**
 * A room whose host has uploaded a picture of their own: the picture fills the whole room, with a soft frame round the video, a darker floor so the
 * crowd can be seen, and the stage at the bottom as in the other rooms. Nothing in it moves.
 */
export default function CustomBackdrop({ palette: p, withBooth = false, height = 900, className = '', image = null }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down
    const ring = SCENE.booth.y + 100;

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={className} aria-hidden>
            <defs>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#000" stopOpacity=".15" /><stop offset="1" stopColor="#000" stopOpacity=".62" /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#fff" stopOpacity=".4" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".5" /></radialGradient>
            </defs>
            <rect width="1600" height={height} fill="#0b0b14" />
            {image && <image href={image} x="0" y="0" width="1600" height={height} preserveAspectRatio="xMidYMid slice" />}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            <g stroke="#fff" strokeOpacity=".07" strokeWidth="1.2">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>
            {[22, 14, 8].map((g, i) => <rect key={g} x={tv.x - g - 18} y={tv.y - g - 22} width={tv.w + 36 + g * 2} height={tv.h + 36 + g * 2} rx={14 + g} fill="#fff" opacity={0.03 + i * 0.03} />)}
            <rect x={tv.x - 18} y={tv.y - 22} width={tv.w + 36} height={tv.h + 36} rx="12" fill="#05050a" stroke="#fff" strokeOpacity=".85" strokeWidth="3" />
            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="400" ry="74" fill={f('pool')} />
                <ellipse cx="800" cy={ring} rx="340" ry="58" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2" />
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 4} rx="184" ry="15" fill="#000" opacity=".5" />
            </g>
            {withBooth && (
                <svg x={SCENE.booth.x} y={SCENE.booth.y + ext} width={SCENE.booth.w} height={SCENE.booth.h} viewBox="0 0 300 150" overflow="visible">
                    <BoothFrontArt u={(n) => `${uid}-b-${n}`} p={p} plate />
                </svg>
            )}
            <rect width="1600" height={height} fill={f('vig')} />
        </svg>
    );
}
