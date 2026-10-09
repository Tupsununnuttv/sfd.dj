import { BoothFrontArt } from '@/Components/scene/DjBooth';
import AnimeBackdrop from '@/Components/scene/Anime';
import CatsBackdrop from '@/Components/scene/Cats';
import ChristmasBackdrop from '@/Components/scene/Christmas';
import Christmas2Backdrop from '@/Components/scene/Christmas2';
import CustomBackdrop from '@/Components/scene/Custom';
import DefinityBackdrop from '@/Components/scene/Definity';
import EasterBackdrop from '@/Components/scene/Easter';
import GoldMineBackdrop from '@/Components/scene/GoldMine';
import DragonBackdrop from '@/Components/scene/Dragon';
import FoxyBackdrop from '@/Components/scene/Foxy';
import HalloweenBackdrop from '@/Components/scene/Halloween';
import Halloween2Backdrop from '@/Components/scene/Halloween2';
import LatamBackdrop from '@/Components/scene/Latam';
import LightshowBackdrop from '@/Components/scene/Lightshow';
import MidsummerBackdrop from '@/Components/scene/Midsummer';
import MonstercatBackdrop from '@/Components/scene/Monstercat';
import RetrowaveBackdrop from '@/Components/scene/Retrowave';
import SkullBackdrop from '@/Components/scene/Skull';
import SkullsBackdrop from '@/Components/scene/Skulls';
import SpringBackdrop from '@/Components/scene/Spring';
import SummerBackdrop from '@/Components/scene/Summer';
import SynthwaveBackdrop from '@/Components/scene/Synthwave';
import TastyBackdrop from '@/Components/scene/Tasty';
import TastycatBackdrop from '@/Components/scene/Tastycat';
import UltraBackdrop from '@/Components/scene/Ultra';
import WinterBackdrop from '@/Components/scene/Winter';
import { floorLineX as lineX, floorRowY as rowY, floorTile as tile, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const font = 'Figtree, system-ui, sans-serif';

const tiles = Array.from({ length: 12 }, (_, j) => Array.from({ length: 16 }, (_, k) => k - 8).map((i) => ({ i, j }))).flat().filter(({ i, j }) => (i * 7 + j * 3 + 100) % 5 === 0 || (i + j) % 6 === 0);

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string; image?: string | null }

/** The room's scenery: the club, or the scenery a palette asks for (Halloween, Halloween V2, Christmas, Christmas V2, Winter, Spring, Easter, Summer, Midsummer, Synthwave, Retrowave, Midnight Definity, Anime, LATAM, Lightshow, Cats, Gold Mine, Skull, Skulls, Ultra, Foxy, Dragon, Tastycat, Tasty, Monstercat), or the host's own picture. It is a different component, so a room that changes its background starts a fresh one. */
export default function SceneBackdrop(props: Props) {
    switch (props.palette.theme) {
        case 'halloween':
            return <HalloweenBackdrop {...props} />;
        case 'halloween2':
            return <Halloween2Backdrop {...props} />;
        case 'christmas':
            return <ChristmasBackdrop {...props} />;
        case 'christmas2':
            return <Christmas2Backdrop {...props} />;
        case 'winter':
            return <WinterBackdrop {...props} />;
        case 'spring':
            return <SpringBackdrop {...props} />;
        case 'easter':
            return <EasterBackdrop {...props} />;
        case 'summer':
            return <SummerBackdrop {...props} />;
        case 'midsummer':
            return <MidsummerBackdrop {...props} />;
        case 'synthwave':
            return <SynthwaveBackdrop {...props} />;
        case 'retrowave':
            return <RetrowaveBackdrop {...props} />;
        case 'definity':
            return <DefinityBackdrop {...props} />;
        case 'anime':
            return <AnimeBackdrop {...props} />;
        case 'latam':
            return <LatamBackdrop {...props} />;
        case 'lightshow':
            return <LightshowBackdrop {...props} />;
        case 'cats':
            return <CatsBackdrop {...props} />;
        case 'goldmine':
            return <GoldMineBackdrop {...props} />;
        case 'skull':
            return <SkullBackdrop {...props} />;
        case 'skulls':
            return <SkullsBackdrop {...props} />;
        case 'ultra':
            return <UltraBackdrop {...props} />;
        case 'foxy':
            return <FoxyBackdrop {...props} />;
        case 'dragon':
            return <DragonBackdrop {...props} />;
        case 'tasty':
            return <TastyBackdrop {...props} />;
        case 'tastycat':
            return <TastycatBackdrop {...props} />;
        case 'monstercat':
            return <MonstercatBackdrop {...props} />;
        case 'custom':
            return <CustomBackdrop {...props} />;
        default:
            return <ClubBackdrop {...props} />;
    }
}

/**
 * The club on a 1600 x 900 canvas: a club wall with a big screen and spotlights, speakers and neon signs, and a dance floor.
 * The 300 x 150 DJ booth is drawn on top by the scene (so the DJ can stand between the two); `withBooth` draws it here too, for the previews and the picture files.
 * The lights, speakers and floor only move in a `live` scene (a song is playing).
 */
function ClubBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down

    const speaker = (x: number, y: number) => (
        <g key={`${x}-${y}`}>
            <rect x={x} y={y} width="140" height="128" rx="10" fill="#0d0a1c" stroke="#2c2556" strokeWidth="2" />
            <rect x={x + 6} y={y + 5} width="128" height="3" rx="1.5" fill={p.accent} opacity=".55" />
            <circle cx={x + 70} cy={y + 33} r="11" fill="#07050f" stroke="#3a3168" strokeWidth="1.6" />
            <circle cx={x + 70} cy={y + 86} r="37" fill="#07050f" stroke="#3a3168" strokeWidth="2.4" />
            <circle className="av sc-woofer" cx={x + 70} cy={y + 86} r="27" fill={f('cone')} />
            <circle cx={x + 70} cy={y + 86} r="9" fill="#05040b" />
        </g>
    );

    const ball = (cx: number, cy: number, delay: number) => (
        <g key={cx}>
            <path d={`M${cx} 16V${cy - 33}`} stroke="#6b6490" strokeWidth="2" />
            <circle cx={cx} cy={cy} r="33" fill={f('ball')} />
            <g stroke="#fff" strokeOpacity=".22" strokeWidth="1" fill="none" clipPath={`url(#${u('clipball' + cx)})`}>
                {[-24, -12, 0, 12, 24].map((d) => <path key={d} d={`M${cx + d} ${cy - 33}V${cy + 33}`} />)}
                {[-24, -12, 0, 12, 24].map((d) => <path key={`h${d}`} d={`M${cx - 33} ${cy + d}H${cx + 33}`} />)}
            </g>
            <circle cx={cx - 11} cy={cy - 12} r="6" fill="#fff" opacity=".7" />
            <path className="av sc-star" style={{ animationDelay: `${delay}s` }} d={`M${cx + 40} ${cy - 20}l2.4 7 7 2.4-7 2.4-2.4 7-2.4-7-7-2.4 7-2.4Z`} fill="#fff" />
            <path className="av sc-star" style={{ animationDelay: `${delay + 0.8}s` }} d={`M${cx - 44} ${cy + 18}l1.8 5 5 1.8-5 1.8-1.8 5-1.8-5-5-1.8 5-1.8Z`} fill={p.accent2} />
            <clipPath id={u('clipball' + cx)}><circle cx={cx} cy={cy} r="33" /></clipPath>
        </g>
    );

    const lamps = [
        [110, 'a'], [250, 'b'], [350, 'a'], [1250, 'b'], [1350, 'a'], [1490, 'b'],
    ] as const;
    const beams = [
        [110, 470, 'a', 0], [250, 640, 'b', -1.6], [350, 780, 'a', -3.2], [1250, 820, 'b', -0.8], [1350, 960, 'a', -2.4], [1490, 1130, 'b', -4],
    ] as const;
    const stars = [[620, 520], [980, 540], [250, 520], [1350, 500], [470, 590], [1130, 580], [90, 330], [1510, 300], [760, 540], [880, 520]];

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('wall')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.wallTop} /><stop offset="1" stopColor={p.wallBottom} /></linearGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <radialGradient id={u('halo')} cx="800" cy={tv.y + tv.h / 2} r="640" gradientUnits="userSpaceOnUse"><stop stopColor={p.accent} stopOpacity=".38" /><stop offset=".5" stopColor={p.glow} stopOpacity=".16" /><stop offset="1" stopColor={p.glow} stopOpacity="0" /></radialGradient>
                <linearGradient id={u('beamA')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.accent} stopOpacity=".5" /><stop offset="1" stopColor={p.accent} stopOpacity="0" /></linearGradient>
                <linearGradient id={u('beamB')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.accent2} stopOpacity=".5" /><stop offset="1" stopColor={p.accent2} stopOpacity="0" /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor={p.accent} stopOpacity=".55" /><stop offset="1" stopColor={p.accent} stopOpacity="0" /></radialGradient>
                <radialGradient id={u('cone')} cx=".4" cy=".35" r=".8"><stop stopColor="#3a3168" /><stop offset="1" stopColor="#0d0a1c" /></radialGradient>
                <radialGradient id={u('ball')} cx=".35" cy=".3" r=".85"><stop stopColor="#f5f3ff" /><stop offset=".5" stopColor="#9a93c9" /><stop offset="1" stopColor="#2b2550" /></radialGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".6" /></radialGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.glow} stopOpacity="0" /><stop offset="1" stopColor={p.floorBottom} stopOpacity=".7" /></linearGradient>
                <filter id={u('neon')} x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                <filter id={u('soft')} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" /></filter>
            </defs>

            {/* the wall */}
            <rect width="1600" height={FLOOR + 24} fill={f('wall')} />
            {Array.from({ length: 21 }, (_, k) => <rect key={k} x={k * 80 - 1} width="2" height={FLOOR} fill={p.accent2} opacity=".06" />)}
            <rect width="1600" height="900" fill={f('halo')} />

            {/* the big screen: the video is shown inside this frame */}
            <rect x={tv.x - 30} y={tv.y - 22} width={tv.w + 60} height={tv.h + 56} rx="28" fill={p.accent} opacity=".4" filter={`url(#${u('soft')})`} />
            <rect x={tv.x - 16} y={tv.y - 20} width={tv.w + 32} height={tv.h + 32} rx="20" fill="#04020a" stroke={p.accent2} strokeWidth="2.6" />
            <rect x={tv.x - 8} y={tv.y - 12} width={tv.w + 16} height={tv.h + 16} rx="14" fill="none" stroke="#fff" strokeOpacity=".08" />
            <rect x={tv.x + 30} y={tv.y + tv.h + 15} width={tv.w - 60} height="4" rx="2" fill={p.accent} opacity=".75" />
            <path d={`M${tv.x + 40} ${tv.y + tv.h + 12}v60M${tv.x + tv.w - 40} ${tv.y + tv.h + 12}v60`} stroke="#2c2556" strokeWidth="6" strokeLinecap="round" />

            {/* the dance floor */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            <rect y={FLOOR - 4} width="1600" height="8" fill={p.accent} opacity=".3" filter={`url(#${u('soft')})`} />
            <g stroke={p.accent2} strokeOpacity=".2" strokeWidth="1.2">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>
            {tiles.filter(({ j }) => rowY(j + 1) < height + 120).map(({ i, j }) => (
                <polygon key={`${i}-${j}`} className="sc-tile" style={{ animationDelay: `${(((i + 20) * 13 + j * 7) % 24) / 10}s` }} points={tile(i, j)} fill={(i + j) % 2 ? p.accent : p.accent2} opacity=".16" />
            ))}
            <g transform={`translate(0 ${ext})`}>
            <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 18} rx="370" ry="64" fill={f('pool')} />
            <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 4} rx="184" ry="15" fill="#000" opacity=".55" />
            </g>

            {/* truss, lamps and the beams that sweep over the room */}
            <g style={{ mixBlendMode: 'screen' }}>
                {beams.map(([x, to, c, delay]) => (
                    <path
                        key={x}
                        className="sc-beam"
                        style={{ transformOrigin: `${x}px 18px`, animationDelay: `${delay}s` }}
                        d={`M${x - 7} 18H${x + 7}L${to + 78} 760H${to - 78}Z`}
                        fill={f(c === 'a' ? 'beamA' : 'beamB')}
                    />
                ))}
            </g>
            <rect width="1600" height="16" fill="#09060f" />
            <rect y="14" width="1600" height="2.4" fill={p.accent} opacity=".7" />
            {lamps.map(([x, c]) => (
                <g key={x}>
                    <rect x={x - 13} y="12" width="26" height="14" rx="4" fill="#150f2a" stroke="#2c2556" />
                    <circle cx={x} cy="27" r="7" fill={c === 'a' ? p.accent : p.accent2} />
                    <circle cx={x} cy="27" r="14" fill={c === 'a' ? p.accent : p.accent2} opacity=".35" filter={`url(#${u('soft')})`} />
                </g>
            ))}
            {ball(98, 118, 0)}
            {ball(1502, 118, 1.2)}

            {/* speakers and neon */}
            {speaker(30, 372)}
            {speaker(30, 504)}
            {speaker(1430, 372)}
            {speaker(1430, 504)}
            <g filter={`url(#${u('neon')})`} fontFamily={font} fontWeight="900" textAnchor="middle">
                <text x="278" y="300" fontSize="46" fill="none" stroke={p.accent} strokeWidth="2.6">SFD.DJ</text>
                <text x="1322" y="300" fontSize="46" fill="none" stroke={p.accent2} strokeWidth="2.6">LIVE</text>
            </g>
            <g fill="none" strokeWidth="2.6" filter={`url(#${u('neon')})`}>
                <circle cx="278" cy="228" r="26" stroke={p.accent} /><circle cx="278" cy="228" r="9" stroke={p.accent} />
                <path d="M1322 252V204M1304 244V212M1340 244V212M1286 236V220M1358 236V220" stroke={p.accent2} strokeLinecap="round" />
            </g>
            {stars.map(([x, y], k) => <circle key={k} className="sc-star" style={{ animationDelay: `${(k * 0.37) % 2.4}s` }} cx={x} cy={y} r="2.2" fill="#fff" />)}

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
