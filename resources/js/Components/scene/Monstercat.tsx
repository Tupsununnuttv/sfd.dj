import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { after, floorGrid, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, floorTile as tile, SCENE, ScenePalette } from '@/lib/scenes';
import { ReactNode, useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const font = 'Figtree, system-ui, sans-serif';
const GREEN = '#7cff4f';
const VIOLET = '#a855f7';
const PINK = '#f0abfc';

// the equalizer along the foot of the wall, the stars and the floating cat heads: the same every time
const rs = rand(31);
const BARS = Array.from({ length: 64 }, (_, k) => ({ k, x: 12 + k * 24.8, h: r1(26 + rs() * 74) }));
const STARS = Array.from({ length: 40 }, (_, k) => ({ k, x: r1(rs() * 1600), y: r1(rs() * 420), r: r1(0.7 + rs() * 1.3) })).filter((s) => !(s.x > 380 && s.x < 1220 && s.y < 420));

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * The Monstercat scenery on a 1600 x 900 canvas: a neon arena at night with two huge monster cats that sit on pedestals either side of the video and watch the floor, glowing eyes and fangs
 * and a chest that lights up with a paw. A ring of runes turns behind the video, lasers sweep the room, an equalizer pumps along the foot of the wall, and the dance floor is a grid of
 * green light with a paw ring under the booth. Like the others it only moves while a song plays (`live`).
 */
export default function MonstercatBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down
    const ring = SCENE.booth.y + 100;

    /** Draw something for the right half of the cat and get it twice: once as it is and once mirrored, so the cat is the same on both sides. */
    const both = (k: string, node: ReactNode) => (
        <g key={k}>
            <g>{node}</g>
            <g transform="scale(-1 1)">{node}</g>
        </g>
    );

    /** A paw print: a pad and four toes, with its middle at (0, 0). */
    const paw = (k: string, x: number, y: number, r: number, c: string, o: number, s = 0.9) => (
        <g key={k} transform={`translate(${r1(x)} ${r1(y)}) rotate(${r}) scale(${s})`} fill={c} opacity={o}>
            <ellipse cy="5" rx="9" ry="7.4" /><ellipse cx="-11" cy="-4" rx="3.6" ry="4.6" /><ellipse cx="-4" cy="-10" rx="3.6" ry="4.6" /><ellipse cx="4" cy="-10" rx="3.6" ry="4.6" /><ellipse cx="11" cy="-4" rx="3.6" ry="4.6" />
        </g>
    );

    /**
     * One monster cat, seen from the front, sitting with its paws on (0, 0): about 460 tall and 250 wide with the ears. `tail` is the side its tail goes (1 right, -1 left).
     * It is drawn dark, with the edges lit in green on the outside and violet on the inside, and the eyes and the paw on its chest are the light.
     */
    const monster = (k: string, x: number, y: number, tail: number, delay: number) => (
        <g key={k} transform={`translate(${x} ${y})`}>
            <ellipse cx="0" cy="-230" rx="250" ry="260" fill={f('aura')} />
            <ellipse cx="0" cy="6" rx="170" ry="16" fill="#000" opacity=".5" />

            {/* the tail, behind everything */}
            <g transform={`scale(${tail} 1)`}>
                <g className="sc-kick" style={after(delay - 0.6)}>
                    <path d="M104 -26C190 -22 236 -80 224 -160C214 -224 168 -246 150 -282C176 -262 214 -250 236 -190C260 -118 226 -14 112 -6Z" fill={f('fur')} />
                    <path d="M104 -26C190 -22 236 -80 224 -160C214 -224 168 -246 150 -282" fill="none" stroke={GREEN} strokeOpacity=".75" strokeWidth="2.4" strokeLinecap="round" />
                    <path d="M150 -282L132 -318L170 -296L180 -334L194 -292Z" fill={f('fur')} stroke={VIOLET} strokeWidth="1.6" strokeLinejoin="round" />
                    <circle className="sc-twinkle" style={after(delay)} cx="176" cy="-300" r="16" fill={GREEN} opacity=".4" /><circle cx="176" cy="-300" r="5.5" fill="#eaffd6" />
                </g>
            </g>

            {/* the body */}
            {both('body', (
                <>
                    <path d="M0 -246L30 -242C60 -234 76 -210 84 -182C94 -152 116 -130 122 -94C126 -58 122 -26 108 -8L0 -4Z" fill={f('fur')} />
                    <path d="M30 -242C60 -234 76 -210 84 -182C94 -152 116 -130 122 -94C126 -58 122 -26 108 -8" fill="none" stroke={GREEN} strokeOpacity=".8" strokeWidth="2.4" strokeLinecap="round" />
                    <path d="M26 -214L56 -208L52 -26L14 -26Z" fill="#0b0720" />
                    <path d="M56 -208L52 -26" stroke={VIOLET} strokeOpacity=".8" strokeWidth="2" strokeLinecap="round" />
                    <path d="M8 -26H62Q70 -4 54 2H8Z" fill="#0b0720" stroke={GREEN} strokeOpacity=".7" strokeWidth="1.8" strokeLinejoin="round" />
                    <path d="M30 -16V-4M42 -16V-4" stroke={VIOLET} strokeOpacity=".7" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M92 -128C106 -110 108 -80 98 -50" fill="none" stroke={VIOLET} strokeOpacity=".5" strokeWidth="2.4" strokeLinecap="round" />
                    <path d="M12 -230L22 -196L34 -226ZM36 -224L48 -190L60 -214Z" fill="#150c34" stroke={VIOLET} strokeOpacity=".6" strokeWidth="1.2" strokeLinejoin="round" />
                </>
            ))}
            <path d="M-14 -226L0 -176L14 -226Z" fill="#150c34" stroke={VIOLET} strokeOpacity=".6" strokeWidth="1.2" strokeLinejoin="round" />
            <circle className="sc-twinkle" style={after(delay)} cx="0" cy="-150" r="44" fill={f('chest')} />
            {paw('chestpaw', 0, -148, 0, GREEN, 1, 1.5)}

            {/* the head: cheeks that bristle, ears, brows, eyes that glow */}
            {both('ear', (
                <>
                    <path d="M30 -388L98 -466L124 -350Z" fill={f('fur')} />
                    <path d="M30 -388L98 -466L124 -350" fill="none" stroke={GREEN} strokeOpacity=".85" strokeWidth="2.4" strokeLinejoin="round" />
                    <path d="M56 -390L100 -442L110 -366Z" fill="#2b0a52" stroke={VIOLET} strokeWidth="1.6" strokeLinejoin="round" />
                </>
            ))}
            {both('head', (
                <>
                    <path d="M0 -396C52 -396 92 -370 98 -334L124 -318L100 -306L116 -286L92 -282L102 -256L62 -264C44 -240 22 -232 0 -232Z" fill={f('fur')} />
                    <path d="M0 -396C52 -396 92 -370 98 -334L124 -318L100 -306L116 -286L92 -282L102 -256L62 -264C44 -240 22 -232 0 -232" fill="none" stroke={GREEN} strokeOpacity=".85" strokeWidth="2.4" strokeLinejoin="round" />
                    <path d="M4 -362L100 -388L104 -372L10 -346Z" fill="#0a0618" />
                    <path d="M4 -362L100 -388" stroke={VIOLET} strokeOpacity=".8" strokeWidth="1.8" />
                    <ellipse className="sc-flame" style={after(delay - 0.3)} cx="50" cy="-334" rx="52" ry="30" fill={GREEN} opacity=".3" />
                    <path d="M12 -332Q42 -364 86 -346Q64 -312 12 -332Z" fill={f('eye')} stroke="#eaffd6" strokeOpacity=".8" strokeWidth="1.2" strokeLinejoin="round" />
                    <ellipse cx="50" cy="-332" rx="5.4" ry="15" transform="rotate(8 50 -332)" fill="#06120a" />
                    <circle cx="43" cy="-340" r="3.2" fill="#fff" />
                    <path d="M98 -302L168 -314M100 -290L172 -290M98 -278L164 -266" stroke={GREEN} strokeOpacity=".55" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M0 -274L40 -266Q56 -266 74 -290Q56 -230 0 -230Z" fill="#14001f" />
                    <path d="M16 -270L38 -268L27 -234Z" fill="#f4f1ff" stroke={VIOLET} strokeWidth="1.2" strokeLinejoin="round" />
                    <path d="M44 -268L58 -272L51 -254ZM62 -276L74 -286L69 -266Z" fill="#f4f1ff" />
                    <path d="M6 -232L20 -236L13 -252Z" fill="#f4f1ff" />
                    <ellipse cx="14" cy="-240" rx="14" ry="5" fill="#f472b6" opacity=".85" />
                </>
            ))}
            <path d="M-12 -304L12 -304L0 -286Z" fill={PINK} stroke={VIOLET} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M0 -286V-274" stroke={PINK} strokeWidth="2" strokeLinecap="round" />
        </g>
    );

    const pedestal = (k: string, x: number) => (
        <g key={k} transform={`translate(${x} 0)`}>
            <path d="M-146 560H146L164 634H-164Z" fill={f('stone')} />
            <path d="M-146 560H146" stroke={GREEN} strokeWidth="3" /><path d="M-146 560H146" stroke={GREEN} strokeOpacity=".3" strokeWidth="11" />
            <path d="M-146 560L-164 634M146 560L164 634" stroke={VIOLET} strokeOpacity=".7" strokeWidth="2.4" />
            <rect x="-56" y="578" width="112" height="34" rx="6" fill="#06040f" stroke={VIOLET} strokeOpacity=".7" strokeWidth="1.6" />
            {paw(`pp${k}`, 0, 596, 0, GREEN, 0.9, 0.9)}
            {[-100, -74, 74, 100].map((dx) => <path key={dx} d={`M${dx} 572V620`} stroke={VIOLET} strokeOpacity=".4" strokeWidth="2" strokeLinecap="round" />)}
        </g>
    );

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('wall')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#02010a" /><stop offset=".6" stopColor="#0f0726" /><stop offset="1" stopColor="#24104a" /></linearGradient>
                <pattern id={u('hex')} width="56" height="97" patternUnits="userSpaceOnUse" patternTransform="scale(1.1)"><path d="M28 0L56 16V48L28 64L0 48V16ZM28 64V97M0 48L-28 64M56 48L84 64" fill="none" stroke={VIOLET} strokeOpacity=".16" strokeWidth="1.2" /></pattern>
                <radialGradient id={u('halo')} cx="800" cy="172" r="640" gradientUnits="userSpaceOnUse"><stop stopColor={GREEN} stopOpacity=".26" /><stop offset=".45" stopColor={VIOLET} stopOpacity=".2" /><stop offset="1" stopColor={VIOLET} stopOpacity="0" /></radialGradient>
                <linearGradient id={u('fur')} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#2a1658" /><stop offset=".5" stopColor="#120a2c" /><stop offset="1" stopColor="#05030f" /></linearGradient>
                <linearGradient id={u('stone')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#1c1238" /><stop offset="1" stopColor="#07040f" /></linearGradient>
                <radialGradient id={u('aura')} cx=".5" cy=".5" r=".5"><stop stopColor={VIOLET} stopOpacity=".34" /><stop offset=".55" stopColor={VIOLET} stopOpacity=".1" /><stop offset="1" stopColor={VIOLET} stopOpacity="0" /></radialGradient>
                <radialGradient id={u('chest')} cx=".5" cy=".5" r=".5"><stop stopColor={GREEN} stopOpacity=".6" /><stop offset=".5" stopColor={GREEN} stopOpacity=".16" /><stop offset="1" stopColor={GREEN} stopOpacity="0" /></radialGradient>
                <linearGradient id={u('eye')} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#b8ff8a" /><stop offset=".6" stopColor={GREEN} /><stop offset="1" stopColor="#25c24a" /></linearGradient>
                <linearGradient id={u('beamG')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={GREEN} stopOpacity=".5" /><stop offset="1" stopColor={GREEN} stopOpacity="0" /></linearGradient>
                <linearGradient id={u('beamV')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={VIOLET} stopOpacity=".55" /><stop offset="1" stopColor={VIOLET} stopOpacity="0" /></linearGradient>
                <linearGradient id={u('bar')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={GREEN} /><stop offset="1" stopColor={VIOLET} /></linearGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#0d0a22" /><stop offset="1" stopColor="#020208" /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor={GREEN} stopOpacity=".42" /><stop offset=".6" stopColor={VIOLET} stopOpacity=".16" /><stop offset="1" stopColor={VIOLET} stopOpacity="0" /></radialGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={VIOLET} stopOpacity="0" /><stop offset="1" stopColor="#02010a" stopOpacity=".62" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".68" /></radialGradient>
                <filter id={u('soft')} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" /></filter>
            </defs>

            {/* the night: the wall, a net of hexagons, stars, a halo behind the video */}
            <rect width="1600" height={FLOOR + 24} fill={f('wall')} />
            <rect width="1600" height={FLOOR} fill={f('hex')} />
            {STARS.map((s) => <circle key={s.k} className={s.k % 3 === 0 ? 'sc-twinkle' : undefined} style={s.k % 3 === 0 ? after(-s.k * 0.31) : undefined} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity=".7" />)}
            <rect width="1600" height="900" fill={f('halo')} />

            {/* the ring of runes that turns behind the video */}
            <g transform="translate(800 172)">
                <g className="sc-rays"><circle r="392" fill="none" stroke={GREEN} strokeOpacity=".4" strokeWidth="2" strokeDasharray="3 15" /><circle r="360" fill="none" stroke={VIOLET} strokeOpacity=".35" strokeWidth="14" strokeDasharray="2 34" /></g>
                <g className="sc-blades"><circle r="330" fill="none" stroke={VIOLET} strokeOpacity=".55" strokeWidth="2.4" strokeDasharray="46 24" /></g>
                <circle r="304" fill="none" stroke={GREEN} strokeOpacity=".3" strokeWidth="1.4" />
                {Array.from({ length: 36 }, (_, k) => { const a = (k * Math.PI) / 18; return <path key={k} d={`M${r1(Math.cos(a) * 304)} ${r1(Math.sin(a) * 304)}L${r1(Math.cos(a) * (k % 3 ? 316 : 330))} ${r1(Math.sin(a) * (k % 3 ? 316 : 330))}`} stroke={GREEN} strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" />; })}
            </g>

            {/* the lasers: they sweep over the room from the roof */}
            <g style={{ mixBlendMode: 'screen' }}>
                {([[140, 520, 'beamG', 0], [470, 760, 'beamV', -1.8], [1130, 840, 'beamG', -3.2], [1460, 1090, 'beamV', -0.9]] as const).map(([x, to, c, d]) => (
                    <path key={x} className="sc-beam" style={{ transformOrigin: `${x}px 18px`, animationDelay: `${d}s` }} d={`M${x - 5} 18H${x + 5}L${to + 54} 700H${to - 54}Z`} fill={f(c)} />
                ))}
            </g>
            <rect width="1600" height="14" fill="#04020c" /><rect y="12" width="1600" height="2.4" fill={GREEN} opacity=".6" />
            {[140, 470, 1130, 1460].map((x, i) => <g key={x}><rect x={x - 12} y="10" width="24" height="12" rx="3" fill="#120a2c" stroke={VIOLET} strokeOpacity=".6" /><circle cx={x} cy="25" r="6" fill={i % 2 ? VIOLET : GREEN} /><circle cx={x} cy="25" r="13" fill={i % 2 ? VIOLET : GREEN} opacity=".35" filter={`url(#${u('soft')})`} /></g>)}

            {/* the equalizer along the foot of the wall */}
            <g opacity=".5">
                {BARS.map((b) => <rect key={b.k} className="av av-bottom sc-bar" style={{ animationDelay: `${(b.k % 9) * 0.1}s`, animationDuration: `${0.55 + (b.k % 4) * 0.12}s` }} x={b.x} y={FLOOR - b.h} width="14" height={b.h} rx="3" fill={f('bar')} />)}
            </g>
            <rect y={FLOOR - 3} width="1600" height="3" fill={GREEN} opacity=".7" />

            {/* the video: a black frame that bristles like a mane, and a plate with the name under it */}
            <rect x={tv.x - 30} y="-30" width={tv.w + 60} height={tv.y + tv.h + 64} rx="14" fill="#06040f" stroke={GREEN} strokeWidth="2.6" />
            <rect x={tv.x - 30} y="-30" width={tv.w + 60} height={tv.y + tv.h + 64} rx="14" fill="none" stroke={GREEN} strokeOpacity=".25" strokeWidth="12" />
            {[-1, 1].map((s) => {
                const x0 = s < 0 ? tv.x - 30 : tv.x + tv.w + 30;
                let d = `M${x0} -10`;
                for (let y = -10; y < tv.y + tv.h + 24; y += 30) d += `L${x0 + s * 16} ${y + 15}L${x0} ${y + 30}`;

                return <path key={s} d={d} fill="#150c34" stroke={VIOLET} strokeWidth="2" strokeLinejoin="round" />;
            })}
            {[[tv.x - 16, tv.y - 14, 1, 1], [tv.x + tv.w + 16, tv.y - 14, -1, 1], [tv.x - 16, tv.y + tv.h + 14, 1, -1], [tv.x + tv.w + 16, tv.y + tv.h + 14, -1, -1]].map(([x, y, sx, sy], i) => <path key={i} d={`M${x} ${y + sy * 26}V${y}H${x + sx * 26}`} fill="none" stroke={GREEN} strokeWidth="3.4" strokeLinecap="round" />)}
            <rect x={tv.x - 9} y={tv.y - 9} width={tv.w + 18} height={tv.h + 18} rx="3" fill="#000" />
            <path d="M706 372V396M894 372V396" stroke="#2a1658" strokeWidth="5" strokeLinecap="round" />
            <rect x="596" y="394" width="408" height="56" rx="10" fill="#080512" stroke={GREEN} strokeWidth="2.2" />
            <rect x="596" y="394" width="408" height="56" rx="10" fill="none" stroke={GREEN} strokeOpacity=".25" strokeWidth="9" />
            {[[628, 1], [972, -1]].map(([x, s]) => (
                <g key={x} transform={`translate(${x} 422) scale(${s} 1)`}>
                    <path d="M-16 8L-18 -12L-6 -4L0 -6L6 -4L18 -12L16 8Q0 18 -16 8Z" fill="#150c34" stroke={VIOLET} strokeWidth="1.6" strokeLinejoin="round" />
                    <path d="M-12 -1Q-8 -7 -3 -2Q-8 2 -12 -1ZM12 -1Q8 -7 3 -2Q8 2 12 -1Z" fill={GREEN} /><path d="M-5 8L0 3L5 8" fill="none" stroke="#f4f1ff" strokeWidth="1.6" />
                </g>
            ))}
            <g fontFamily={font} fontWeight="900" textAnchor="middle" letterSpacing="6"><text x="800" y="432" fontSize="30" fill="none" stroke={GREEN} strokeOpacity=".4" strokeWidth="8">MONSTERCAT</text><text x="800" y="432" fontSize="30" fill="#eaffd6" stroke={GREEN} strokeWidth="1.2" paintOrder="stroke">MONSTERCAT</text></g>

            {/* floating cat heads: neon outlines on the wall */}
            {[[210, 110, 0.9, -8], [1390, 110, 0.9, 8], [560, 500, 0.55, 0], [1040, 500, 0.55, 0]].map(([x, y, s, r], i) => (
                <g key={i} className="sc-float" style={after(-i * 0.8)}>
                    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} fill="none" stroke={i % 2 ? VIOLET : GREEN} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" opacity=".8">
                        <path d="M-34 14L-38 -26L-14 -12L0 -15L14 -12L38 -26L34 14Q0 40 -34 14Z" />
                        <path d="M-20 0Q-14 -8 -8 0M8 0Q14 -8 20 0M-4 16L0 11L4 16" />
                    </g>
                </g>
            ))}

            {/* the monster cats, one each side of the video */}
            {pedestal('pl', 250)}{pedestal('pr', 1350)}
            {monster('ml', 250, 560, -1, 0)}{monster('mr', 1350, 560, 1, -0.8)}

            {/* the dance floor: a grid of light, a paw ring under the booth */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            <rect y={FLOOR - 4} width="1600" height="8" fill={GREEN} opacity=".3" filter={`url(#${u('soft')})`} />
            {floorGrid(height).map(({ i, j }) => <polygon key={`${i}-${j}`} className={(i * 7 + j * 3 + 100) % 5 === 0 ? 'sc-tile' : undefined} style={{ animationDelay: `${(((i + 20) * 13 + j * 7) % 24) / 10}s` }} points={tile(i, j)} fill={(i + j) % 2 ? GREEN : VIOLET} opacity={(i * 7 + j * 3 + 100) % 5 === 0 ? 0.16 : 0.04} />)}
            <g stroke={GREEN} strokeOpacity=".28" strokeWidth="1.3">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>
            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="400" ry="74" fill={f('pool')} />
                <ellipse cx="800" cy={ring} rx="340" ry="58" fill="#07040f" opacity=".85" />
                <ellipse cx="800" cy={ring} rx="340" ry="58" fill="none" stroke={GREEN} strokeWidth="2.4" />
                <ellipse cx="800" cy={ring} rx="300" ry="50" fill="none" stroke={VIOLET} strokeOpacity=".8" strokeWidth="2" strokeDasharray="4 8" />
                {Array.from({ length: 10 }, (_, k) => { const a = (k * Math.PI * 2) / 10 + 0.3; return paw(`rp${k}`, 800 + Math.cos(a) * 320, ring + Math.sin(a) * 54, r1((Math.atan2(Math.cos(a) * 54, -Math.sin(a) * 320) * 180) / Math.PI), k % 2 ? VIOLET : GREEN, 0.7, 0.8); })}
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
