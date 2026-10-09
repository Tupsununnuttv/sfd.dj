import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { after, r1, rand } from '@/Components/scene/util';
import { sparkle } from '@/lib/art/kit';
import { floorLineX as lineX, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const font = 'Figtree, system-ui, sans-serif';
const FRAME = { x: tv.x - 34, y: tv.y - 40, w: tv.w + 68, h: tv.h + 78 }; // the frame of birch logs round the video
const SHORE = 452; // where the far shore meets the lake
const LAKE = 548; // where the lake meets the near bank
const INK = '#0d1626'; // the far forest and the swing against the evening sky

// the far forest: spruce tops along the shore (the same every time)
const rf = rand(19);
let forest = `M0 ${SHORE}`;
for (let x = 0; x <= 1610; ) {
    const h = 18 + rf() * 46;
    const w = 12 + rf() * 16;
    forest += `L${r1(x + w * 0.5)} ${r1(SHORE - h)}L${r1(x + w)} ${r1(SHORE - h * 0.25)}`;
    x += w * 0.8;
}
forest += `L1610 ${SHORE}Z`;

// stars that are still out, fireflies over the bank and the meadow
const rs = rand(7);
const STARS = Array.from({ length: 26 }, () => ({ x: r1(rs() * 1600), y: r1(rs() ** 1.6 * 200), r: r1(0.5 + rs() * 0.9) }));
const FIREFLIES = Array.from({ length: 30 }, () => ({ x: r1(rs() * 1600), y: r1(470 + rs() * 230) })).filter((p) => p.x < 660 || p.x > 940 || p.y < 420);

// wild flowers in the meadow: x, y, kind (0 daisy, 1 cornflower, 2 buttercup), size
const rm = rand(43);
const MEADOW = Array.from({ length: 80 }, () => {
    const y = FLOOR + 8 + rm() ** 1.4 * 270;

    return { x: r1(rm() * 1600), y: r1(y), k: Math.floor(rm() * 3), s: r1(0.55 + ((y - FLOOR) / 270) * 0.9) };
});

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * Midsummer (Jaanipäev) on a 1600 x 900 canvas: Midsummer Eve in Estonia, the white night when the sun hardly sets. A sky going from deep blue to a
 * glowing sunset, a lake with a far shore of spruce, a little sauna with smoke from its chimney and a rowboat. The video hangs in a frame of birch logs
 * dressed with young birch branches, a wreath of wild flowers with the sign under it, and a big bonfire burns below. Birches on the left with the moon
 * between them, the big village swing on the right against the sunset, string lights. The floor is a meadow of daisies, cornflowers and buttercups with
 * a flower wreath under the booth; in the front corners the magic fern flower that blooms only on this night, and a stump with an axe, sauna whisks and firewood.
 * Like the others it only moves while a song plays (`live`): the fire burns, the swing swings, the lights and fireflies twinkle, the lake shimmers, the boat
 * bobs, smoke rises and the fern flower glows. Fireflies rise over the whole room (RoomScene, Snow.tsx).
 */
export default function MidsummerBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down

    // ----- the little pieces -----
    const daisy = (k: string, x: number, y: number, s: number) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
            {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => <ellipse key={a} cx="0" cy="-4.6" rx="1.9" ry="3.8" fill="#fbfaf2" transform={`rotate(${a})`} />)}
            <circle r="2.4" fill="#facc15" />
        </g>
    );
    const cornflower = (k: string, x: number, y: number, s: number) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <path key={a} d="M0 -1L-2.4 -7L-1 -6L0 -9L1 -6L2.4 -7Z" fill="#3b82f6" transform={`rotate(${a})`} />)}
            <circle r="2.2" fill="#1e3a8a" />
        </g>
    );
    const buttercup = (k: string, x: number, y: number, s: number) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
            {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx="0" cy="-3" r="2.8" fill="#fde047" transform={`rotate(${a})`} />)}
            <circle r="1.6" fill="#ca8a04" />
        </g>
    );
    const flower = (k: string, x: number, y: number, kind: number, s: number) => (kind === 0 ? daisy(k, x, y, s) : kind === 1 ? cornflower(k, x, y, s) : buttercup(k, x, y, s));

    /** A warm bulb on a string light; one in three twinkles. */
    const bulb = (k: string, x: number, y: number, i: number) => (
        <g key={k}>
            <circle className={i % 3 ? undefined : 'sc-twinkle'} style={i % 3 ? undefined : after(-(i % 7) * 0.3)} cx={r1(x)} cy={r1(y + 6)} r="13" fill={f('warmGlow')} />
            <rect x={r1(x - 2.4)} y={r1(y - 2)} width="4.8" height="4" fill="#3a3326" />
            <ellipse cx={r1(x)} cy={r1(y + 6)} rx="4" ry="5.4" fill="#fff0c2" />
        </g>
    );
    const lights = (k: string, x0: number, y0: number, x1: number, y1: number, sag: number, n: number) => (
        <g key={k}>
            <path d={`M${x0} ${y0}Q${(x0 + x1) / 2} ${(y0 + y1) / 2 + 2 * sag} ${x1} ${y1}`} fill="none" stroke="#1d1a14" strokeWidth="1.6" />
            {Array.from({ length: n }, (_, i) => {
                const t = (i + 0.5) / n;
                const x = x0 + (x1 - x0) * t;
                const y = y0 + (y1 - y0) * t + 4 * sag * t * (1 - t);

                return bulb(`${k}${i}`, x, y, i);
            })}
        </g>
    );

    /** A birch trunk from (x0, y0) at the ground up to (x1, y1), `w` wide: white bark with black marks. */
    const birch = (k: string, x0: number, y0: number, x1: number, y1: number, w: number) => {
        const mx = (x0 + x1) / 2 + (x1 - x0) * 0.3;
        const n = Math.floor((y0 - y1) / 34);

        return (
            <g key={k}>
                <path d={`M${x0 - w / 2} ${y0}Q${mx - w * 0.45} ${(y0 + y1) / 2} ${x1 - w * 0.3} ${y1}H${x1 + w * 0.3}Q${mx + w * 0.45} ${(y0 + y1) / 2} ${x0 + w / 2} ${y0}Z`} fill={f('bark')} />
                {Array.from({ length: n }, (_, i) => {
                    const t = (i + 0.5) / n;
                    const y = y0 + (y1 - y0) * t;
                    const cx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1;
                    const ww = w * (1 - t * 0.4);
                    const side = (i * 7) % 3 - 1;

                    return <path key={i} d={`M${r1(cx + side * ww * 0.18 - ww * 0.22)} ${r1(y)}h${r1(ww * 0.44)}l-3 3h${r1(-ww * 0.38)}Z`} fill="#22201c" />;
                })}
            </g>
        );
    };

    /** A crown of birch leaves: soft clusters round (x, y), `r` across. */
    const crown = (k: string, x: number, y: number, r: number) => (
        <g key={k}>
            {[[0, 0, 1], [-0.5, 0.25, 0.7], [0.5, 0.2, 0.75], [-0.25, -0.35, 0.65], [0.3, -0.3, 0.6], [0, 0.5, 0.6]].map(([dx, dy, s], i) => (
                <g key={i}>
                    <circle cx={r1(x + dx * r)} cy={r1(y + dy * r)} r={r1(s * r * 0.6)} fill={i % 2 ? '#2f6b34' : '#3a7d3f'} />
                    <circle cx={r1(x + dx * r - s * r * 0.15)} cy={r1(y + dy * r - s * r * 0.18)} r={r1(s * r * 0.32)} fill="#5aa55a" opacity=".55" />
                </g>
            ))}
        </g>
    );

    /** A wreath of leaves and wild flowers round (x, y), `r` across. */
    const wreath = (k: string, x: number, y: number, r: number, n = 22) => (
        <g key={k}>
            <circle cx={x} cy={y} r={r} fill="none" stroke="#2f6b34" strokeWidth={r * 0.32} />
            {Array.from({ length: n }, (_, i) => {
                const a = (i / n) * 360;
                const rad = (a * Math.PI) / 180;

                return <ellipse key={i} cx={r1(x + Math.cos(rad) * r)} cy={r1(y + Math.sin(rad) * r)} rx={r * 0.2} ry={r * 0.09} fill={i % 2 ? '#4f9a4a' : '#6cbf5c'} transform={`rotate(${r1(a + 60)} ${r1(x + Math.cos(rad) * r)} ${r1(y + Math.sin(rad) * r)})`} />;
            })}
            {Array.from({ length: Math.round(n * 0.55) }, (_, i) => {
                const rad = ((i / Math.round(n * 0.55)) * 360 * Math.PI) / 180 + 0.2;

                return flower(`${k}f${i}`, r1(x + Math.cos(rad) * r), r1(y + Math.sin(rad) * r), i % 3, r * 0.055);
            })}
        </g>
    );

    // ----- the frame of birch logs: four logs crossing at the corners, cut ends showing their rings, tied with rope -----
    const log = (k: string, x: number, y: number, len: number, w: number, vertical: boolean) => (
        <g key={k} transform={vertical ? `translate(${x} ${y}) rotate(90)` : `translate(${x} ${y})`}>
            <rect x="0" y={-w / 2} width={len} height={w} rx={w / 2} fill={f(vertical ? 'logV' : 'logH')} />
            {Array.from({ length: Math.floor(len / 46) }, (_, i) => <path key={i} d={`M${18 + i * 46 + (i % 3) * 6} ${-w * 0.18 + ((i * 5) % 3) * 4}h${10 + (i % 4) * 4}l-2 2.6h${-(8 + (i % 4) * 4)}Z`} fill="#24211d" />)}
            {[0, len].map((ex) => (
                <g key={ex}>
                    <ellipse cx={ex} cy="0" rx={w * 0.3} ry={w / 2} fill="#d9b98a" stroke="#a37a4a" strokeWidth="1.4" />
                    <ellipse cx={ex} cy="0" rx={w * 0.17} ry={w * 0.3} fill="none" stroke="#a37a4a" strokeWidth="1" />
                    <ellipse cx={ex} cy="0" rx={w * 0.06} ry={w * 0.1} fill="#a37a4a" />
                </g>
            ))}
        </g>
    );
    const sprig = (k: string, x0: number, y0: number, x1: number, y1: number, s: number) => {
        const n = 7;

        return (
            <g key={k}>
                <path d={`M${x0} ${y0}Q${(x0 + x1) / 2 + (x1 > x0 ? -20 : 20)} ${(y0 + y1) / 2} ${x1} ${y1}`} stroke="#6b4a2f" strokeWidth={3 * s} fill="none" strokeLinecap="round" />
                {Array.from({ length: n }, (_, i) => {
                    const t = (i + 1) / (n + 1);
                    const x = x0 + (x1 - x0) * t + (x1 > x0 ? -20 : 20) * 2 * t * (1 - t);
                    const y = y0 + (y1 - y0) * t;
                    const side = i % 2 ? 1 : -1;

                    return (
                        <g key={i} transform={`translate(${r1(x)} ${r1(y)}) rotate(${side * 50 + (y1 < y0 ? 0 : 180)}) scale(${s})`}>
                            <path d="M0 0Q-7 -8 0 -20Q7 -8 0 0Z" fill={i % 3 ? '#5bb04e' : '#7ccd62'} />
                            <path d="M0 0V-16" stroke="#3f8a3a" strokeWidth=".8" />
                        </g>
                    );
                })}
            </g>
        );
    };

    // ----- the village swing on the right, against the sunset -----
    const swing = (
        <g>
            {[[1188, 1252], [1448, 1512]].map(([a, b], i) => (
                <g key={i} stroke={INK} strokeLinecap="round">
                    <path d={`M${a} ${FLOOR - 4}L${(a + b) / 2} 196M${b} ${FLOOR - 4}L${(a + b) / 2} 196`} strokeWidth="13" />
                    <path d={`M${a + 14} 470H${b - 14}`} strokeWidth="7" />
                </g>
            ))}
            <path d="M1204 196H1496" stroke={INK} strokeWidth="16" strokeLinecap="round" />
            <path d="M1204 192H1496" stroke="#3a3f52" strokeWidth="3" strokeLinecap="round" />
            <g className="sc-swing" style={{ transformOrigin: '1350px 196px', animationDuration: '4.2s' }}>
                <path d="M1282 200V474M1418 200V474M1296 200V474M1404 200V474" stroke={INK} strokeWidth="6" />
                <path d="M1282 240H1296M1404 240H1418M1282 360H1296M1404 360H1418" stroke={INK} strokeWidth="5" />
                <rect x="1262" y="470" width="176" height="14" rx="3" fill={INK} />
            </g>
        </g>
    );

    // ----- the bonfire: logs stood together in a cone, the fire in and round it, sparks -----
    const LOGS: [number, number][] = [[708, 470], [736, 466], [760, 462], [784, 460], [816, 460], [840, 462], [864, 466], [892, 470], [800, 458]];
    const bonfire = (
        <g>
            <ellipse className="sc-flame" cx="800" cy="520" rx="230" ry="180" fill={f('fireGlow')} />
            <ellipse cx="800" cy="626" rx="150" ry="18" fill="#000" opacity=".45" />
            {LOGS.map(([x, top], i) => (
                <g key={i}>
                    <path d={`M${x} 626L${r1(800 + (x - 800) * 0.12)} ${top}`} stroke={i % 2 ? '#4a2e1a' : '#5e3a20'} strokeWidth="15" strokeLinecap="round" />
                    <path d={`M${x - 3} 622L${r1(800 + (x - 800) * 0.12 - 2)} ${top + 6}`} stroke="#8a6440" strokeWidth="3" strokeLinecap="round" opacity=".6" />
                </g>
            ))}
            {[[742, 108, 0], [770, 150, 0.3], [800, 176, 0.6], [830, 146, 0.15], [858, 104, 0.45], [714, 60, 0.7], [886, 64, 0.2]].map(([x, h, d]) => (
                <path key={x} className="sc-blaze" style={after(-d)} d={`M${x} 628C${x - 30} ${628 - h * 0.35} ${x - 14} ${628 - h * 0.7} ${x} ${628 - h}C${x + 14} ${628 - h * 0.7} ${x + 30} ${628 - h * 0.35} ${x} 628Z`} fill={f('fire')} />
            ))}
            {[[778, 96, 0.2], [800, 122, 0.5], [822, 92, 0.1]].map(([x, h, d]) => (
                <path key={x} className="sc-blaze" style={after(-d - 0.4)} d={`M${x} 628C${x - 16} ${628 - h * 0.35} ${x - 7} ${628 - h * 0.7} ${x} ${628 - h}C${x + 7} ${628 - h * 0.7} ${x + 16} ${628 - h * 0.35} ${x} 628Z`} fill={f('fireCore')} />
            ))}
            {[[760, 430], [812, 404], [846, 440], [784, 380], [830, 362], [800, 340]].map(([x, y], i) => <circle key={i} className="sc-twinkle" style={after(-i * 0.4)} cx={x} cy={y} r={2.4 - i * 0.2} fill="#ffd27a" />)}
            {[0, 1, 2].map((k) => <circle key={k} className="sc-smoke" style={after(-k * 2.3)} cx={790 + k * 10} cy="440" r="22" fill="#a8a2b8" opacity="0" />)}
        </g>
    );

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('sky')} x1="0" y1="0" x2="0" y2={SHORE} gradientUnits="userSpaceOnUse"><stop stopColor="#13204a" /><stop offset=".35" stopColor="#3f3a7a" /><stop offset=".62" stopColor="#c8749a" /><stop offset=".84" stopColor="#ffa877" /><stop offset="1" stopColor="#ffd9a0" /></linearGradient>
                <radialGradient id={u('sunset')} cx="1240" cy={SHORE + 20} r="620" gradientUnits="userSpaceOnUse"><stop stopColor="#fff1c2" stopOpacity=".9" /><stop offset=".25" stopColor="#ffbe7a" stopOpacity=".5" /><stop offset=".6" stopColor="#ff8a6a" stopOpacity=".15" /><stop offset="1" stopColor="#ff8a6a" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('moonGlow')} cx=".5" cy=".5" r=".5"><stop stopColor="#fff8e0" stopOpacity=".5" /><stop offset="1" stopColor="#fff8e0" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('lake')} x1="0" y1={SHORE} x2="0" y2={LAKE} gradientUnits="userSpaceOnUse"><stop stopColor="#f5b98e" /><stop offset=".35" stopColor="#b9789a" /><stop offset="1" stopColor="#2e3466" /></linearGradient>
                <linearGradient id={u('bank')} x1="0" y1={LAKE} x2="0" y2={FLOOR} gradientUnits="userSpaceOnUse"><stop stopColor="#2f4a2a" /><stop offset="1" stopColor="#3b5a2a" /></linearGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <linearGradient id={u('bark')} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#cfc8bb" /><stop offset=".4" stopColor="#f6f2ea" /><stop offset="1" stopColor="#b8b0a2" /></linearGradient>
                <linearGradient id={u('logH')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f6f2ea" /><stop offset=".55" stopColor="#e2dbcd" /><stop offset="1" stopColor="#a8a092" /></linearGradient>
                <linearGradient id={u('logV')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a8a092" /><stop offset=".45" stopColor="#f6f2ea" /><stop offset="1" stopColor="#cfc8bb" /></linearGradient>
                <linearGradient id={u('fire')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff1a8" stopOpacity="0" /><stop offset=".25" stopColor="#ffd24a" /><stop offset=".65" stopColor="#ff8a1f" /><stop offset="1" stopColor="#e2380f" /></linearGradient>
                <linearGradient id={u('fireCore')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fffbe0" stopOpacity="0" /><stop offset=".4" stopColor="#fff2a8" /><stop offset="1" stopColor="#ffc23a" /></linearGradient>
                <radialGradient id={u('fireGlow')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffb347" stopOpacity=".55" /><stop offset=".45" stopColor="#ff7a1a" stopOpacity=".18" /><stop offset="1" stopColor="#ff7a1a" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('warmGlow')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffe08a" stopOpacity=".85" /><stop offset=".5" stopColor="#ffb347" stopOpacity=".22" /><stop offset="1" stopColor="#ffb347" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('flyGlow')} cx=".5" cy=".5" r=".5"><stop stopColor="#f7ff9a" stopOpacity=".9" /><stop offset=".4" stopColor="#d9f99d" stopOpacity=".3" /><stop offset="1" stopColor="#d9f99d" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('fernGlow')} cx=".5" cy=".5" r=".5"><stop stopColor="#fff7c2" stopOpacity=".95" /><stop offset=".3" stopColor="#fde047" stopOpacity=".45" /><stop offset=".7" stopColor="#a3e635" stopOpacity=".12" /><stop offset="1" stopColor="#a3e635" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('floorFire')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffb347" stopOpacity=".34" /><stop offset=".5" stopColor="#ff8a3c" stopOpacity=".1" /><stop offset="1" stopColor="#ff8a3c" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('plank')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8a5a2e" /><stop offset="1" stopColor="#5e3a1a" /></linearGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#1a2a4a" stopOpacity="0" /><stop offset="1" stopColor={p.floorBottom} stopOpacity=".55" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".55" /></radialGradient>
                <filter id={u('soft')} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8" /></filter>
            </defs>

            {/* the evening sky: deep blue above, the glow of the sun that hardly sets, a few stars still out, the moon */}
            <rect width="1600" height={SHORE + 4} fill={f('sky')} />
            <rect width="1600" height={SHORE + 4} fill={f('sunset')} />
            {STARS.map((s, i) => <circle key={i} className={i % 3 ? undefined : 'sc-star'} style={i % 3 ? undefined : after(-i * 0.3)} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity=".7" />)}
            <circle cx="1420" cy="86" r="80" fill={f('moonGlow')} />
            <path d="M1434 56A32 32 0 1 0 1434 116A26 26 0 1 1 1434 56Z" fill="#fff6dc" />

            {/* the far shore, the lake, the sauna on the bank, a rowboat */}
            <path d={forest} fill={INK} />
            <rect y={SHORE} width="1600" height={LAKE - SHORE} fill={f('lake')} />
            <g className="sc-shimmer">
                {[[1180, 462, 120], [1250, 476, 160], [1200, 492, 90], [1300, 506, 130], [980, 470, 70], [420, 474, 80], [300, 498, 60], [1100, 520, 100]].map(([x, y, w], i) => <path key={i} d={`M${x - w / 2} ${y}H${x + w / 2}`} stroke="#fff1c2" strokeOpacity=".55" strokeWidth="2.4" strokeLinecap="round" />)}
            </g>
            <g className="sc-bob" style={{ animationDuration: '2.4s' }}>
                <path d="M1028 506H1100L1090 518H1040Z" fill="#3a2414" />
                <path d="M1046 506V494M1046 494L1080 506" stroke="#3a2414" strokeWidth="2" />
                <path d="M1032 520H1096" stroke="#fff1c2" strokeOpacity=".35" strokeWidth="2" />
            </g>
            <path d={`M0 ${LAKE + 6}Q200 ${LAKE - 8} 420 ${LAKE + 2}T900 ${LAKE}T1300 ${LAKE + 4}T1600 ${LAKE - 2}V${FLOOR}H0Z`} fill={f('bank')} />
            <g transform="translate(560 552)">
                <path d="M-58 0V-46H58V0Z" fill="#5a3a22" />
                {[-40, -30, -20, -10].map((y) => <path key={y} d={`M-58 ${y}H58`} stroke="#3a2414" strokeWidth="2" />)}
                <path d="M-70 -44L0 -82L70 -44Z" fill="#3a2f2a" />
                <path d="M-70 -44L0 -82L70 -44" stroke="#22191a" strokeWidth="4" fill="none" />
                <rect x="24" y="-90" width="12" height="26" fill="#4a4040" />
                <rect x="-16" y="-34" width="18" height="34" fill="#2a1a10" />
                <rect x="20" y="-34" width="16" height="12" fill="#ffd27a" />
                <circle cx="28" cy="-28" r="16" fill={f('warmGlow')} opacity=".7" />
                {[0, 1, 2].map((k) => <circle key={k} className="sc-smoke" style={after(-k * 2.3)} cx="30" cy="-96" r="10" fill="#c8c2d6" opacity="0" />)}
                <path d="M30 -96C24 -114 40 -126 32 -146C26 -160 36 -170 44 -176" stroke="#c8c2d6" strokeOpacity=".35" strokeWidth="10" strokeLinecap="round" fill="none" />
                <path d="M58 -6H120V0H58Z" fill="#6b4a2f" />
                <path d="M72 0V8M110 0V8" stroke="#6b4a2f" strokeWidth="4" />
            </g>

            {/* the birches on the left, the swing on the right */}
            {birch('b1', 92, FLOOR, 128, -10, 30)}
            {birch('b2', 392, FLOOR, 360, 40, 24)}
            {birch('b3', 196, FLOOR, 214, 160, 16)}
            {crown('cr1', 120, 40, 170)}
            {crown('cr2', 370, 70, 140)}
            {crown('cr3', 230, 150, 90)}
            {swing}

            {/* string lights from the frame to the birches and the swing */}
            {lights('lt1', FRAME.x + 6, 30, 372, 118, 26, 8)}
            {lights('lt2', 372, 118, 118, 96, 20, 6)}
            {lights('lt3', FRAME.x + FRAME.w - 6, 30, 1250, 196, 24, 8)}
            {lights('lt4', 1450, 196, 1610, 120, 18, 5)}

            {/* the frame of birch logs, young birch branches up both sides, a wreath and the sign under it */}
            <rect x={FRAME.x - 12} y={FRAME.y - 8} width={FRAME.w + 24} height={FRAME.h + 24} rx="18" fill="#ffd27a" opacity=".18" filter={`url(#${u('soft')})`} />
            <rect x={tv.x - 14} y={tv.y - 14} width={tv.w + 28} height={tv.h + 28} rx="3" fill="#1d150d" />
            {log('lv1', FRAME.x + 18, FRAME.y - 6, FRAME.h + 6, 30, true)}
            {log('lv2', FRAME.x + FRAME.w - 18, FRAME.y - 6, FRAME.h + 6, 30, true)}
            {log('lh1', FRAME.x - 8, FRAME.y + 14, FRAME.w + 16, 30, false)}
            {log('lh2', FRAME.x - 8, FRAME.y + FRAME.h - 16, FRAME.w + 16, 30, false)}
            {[[FRAME.x + 18, FRAME.y + FRAME.h - 16], [FRAME.x + FRAME.w - 18, FRAME.y + FRAME.h - 16], [FRAME.x + 18, FRAME.y + 14], [FRAME.x + FRAME.w - 18, FRAME.y + 14]].map(([x, y], i) => (
                <g key={i} stroke="#c9a46a" strokeWidth="3.4" strokeLinecap="round">
                    <path d={`M${x - 16} ${y - 12}L${x + 16} ${y + 12}M${x - 16} ${y + 12}L${x + 16} ${y - 12}`} />
                </g>
            ))}
            {sprig('sl1', FRAME.x + 4, FRAME.y + FRAME.h + 10, FRAME.x - 26, FRAME.y + 120, 1.1)}
            {sprig('sl2', FRAME.x + 26, FRAME.y + FRAME.h + 14, FRAME.x - 6, FRAME.y + 40, 1)}
            {sprig('sr1', FRAME.x + FRAME.w - 4, FRAME.y + FRAME.h + 10, FRAME.x + FRAME.w + 26, FRAME.y + 120, 1.1)}
            {sprig('sr2', FRAME.x + FRAME.w - 26, FRAME.y + FRAME.h + 14, FRAME.x + FRAME.w + 6, FRAME.y + 40, 1)}
            {[560, 1040].map((x, i) => (
                <g key={x} className="sc-dangle" style={after(-i * 1.3)}>
                    <path d={`M${x} ${FRAME.y + FRAME.h - 4}V${FRAME.y + FRAME.h + 12}`} stroke="#3b82f6" strokeWidth="2.4" />
                    {wreath(`fw${i}`, x, FRAME.y + FRAME.h + 42, 28, 18)}
                </g>
            ))}
            <path d="M762 374L758 388M838 374L842 388" stroke="#6b4a2f" strokeWidth="2.4" />
            <rect x="684" y="386" width="232" height="34" rx="6" fill={f('plank')} stroke="#3a2414" strokeWidth="2" />
            <text x="800" y="409" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize="17" letterSpacing=".5" fill="#ffe7a8">Happy Midsummer</text>
            {[[699, 403], [901, 403]].map(([x, y], i) => cornflower(`sc${i}`, x, y, 1.1))}

            {/* the bonfire */}
            {bonfire}

            {/* fireflies over the bank */}
            {FIREFLIES.filter((ff) => ff.y < FLOOR).map((ff, i) => (
                <g key={i} className={i % 2 ? 'sc-twinkle' : undefined} style={i % 2 ? after(-i * 0.37) : undefined}>
                    <circle cx={ff.x} cy={ff.y} r="9" fill={f('flyGlow')} />
                    <circle cx={ff.x} cy={ff.y} r="1.6" fill="#fbffd0" />
                </g>
            ))}

            {/* the meadow: grass in the light of the fire, wild flowers */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            <g stroke="#2a4422" strokeOpacity=".5" strokeWidth="1.6">
                {Array.from({ length: 25 }, (_, k) => k - 12).map((k) => <line key={k} x1={r1(lineX(k, FLOOR))} y1={FLOOR} x2={r1(lineX(k, height))} y2={height} />)}
            </g>
            <ellipse cx="800" cy="664" rx="520" ry="78" fill={f('floorFire')} />
            <g stroke="#4f7a3a" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".6">
                {MEADOW.map((m, i) => <path key={i} d={`M${m.x - 3} ${m.y + 4}l-3 -8M${m.x + 3} ${m.y + 4}l3 -8`} />)}
            </g>
            {MEADOW.map((m, i) => flower(`m${i}`, m.x, m.y, m.k, m.s))}

            {/* a wreath of flowers on the grass under the booth */}
            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="800" cy={SCENE.booth.y + 98} rx="372" ry="64" fill="none" stroke="#2f6b34" strokeWidth="18" />
                {Array.from({ length: 84 }, (_, i) => {
                    const t = (i / 84) * Math.PI * 2;
                    const x = 800 + Math.cos(t) * (372 + ((i % 3) - 1) * 6);
                    const y = SCENE.booth.y + 98 + Math.sin(t) * (64 + ((i % 3) - 1) * 2);
                    const a = (Math.atan2(64 * Math.cos(t), -372 * Math.sin(t)) * 180) / Math.PI + (i % 2 ? 24 : -24);

                    return <ellipse key={i} cx={r1(x)} cy={r1(y)} rx="15" ry="5.4" fill={i % 2 ? '#4f9a4a' : '#6cbf5c'} transform={`rotate(${r1(a)} ${r1(x)} ${r1(y)})`} />;
                })}
                {Array.from({ length: 36 }, (_, i) => {
                    const t = (i / 36) * Math.PI * 2 + 0.05;

                    return <g key={i} transform={`translate(${r1(800 + Math.cos(t) * 372)} ${r1(SCENE.booth.y + 98 + Math.sin(t) * 64)}) scale(1 .7)`}>{flower(`rw${i}`, 0, 0, i % 3, 1.9)}</g>;
                })}
                <ellipse cx="800" cy={SCENE.booth.y + 98} rx="392" ry="70" fill={f('floorFire')} />
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 4} rx="184" ry="15" fill="#000" opacity=".45" />
            </g>

            {withBooth && (
                <svg x={SCENE.booth.x} y={SCENE.booth.y + ext} width={SCENE.booth.w} height={SCENE.booth.h} viewBox="0 0 300 150" overflow="visible">
                    <BoothFrontArt u={(n) => `${uid}-b-${n}`} p={p} plate />
                </svg>
            )}
            <rect y="540" width="1600" height={height - 540} fill={f('haze')} />

            {/* the front corners: the magic fern flower on the left, a stump with an axe, sauna whisks and firewood on the right */}
            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="180" cy="884" rx="200" ry="14" fill="#000" opacity=".4" />
                {[[-70, 1.15], [-40, 1], [-10, 1.2], [20, 0.95], [50, 1.1], [-100, 0.85], [80, 0.8]].map(([a, s], i) => (
                    <g key={i} transform={`translate(180 884) rotate(${a}) scale(${s})`}>
                        <path d="M0 0C-6 -60 4 -120 -4 -170" stroke="#2f6b34" strokeWidth="3" fill="none" />
                        {Array.from({ length: 12 }, (_, j) => {
                            const y = -18 - j * 13;
                            const w = 30 - j * 2.2;

                            return (
                                <g key={j}>
                                    <path d={`M${r1(-1 + j * 0.1)} ${y}Q${r1(-w * 0.6)} ${y - 8} ${-w} ${y - 2}Q${r1(-w * 0.5)} ${y + 2} ${r1(-1 + j * 0.1)} ${y}Z`} fill={j % 2 ? '#3f8a3a' : '#4fa047'} />
                                    <path d={`M${r1(-1 + j * 0.1)} ${y}Q${r1(w * 0.6)} ${y - 8} ${w} ${y - 2}Q${r1(w * 0.5)} ${y + 2} ${r1(-1 + j * 0.1)} ${y}Z`} fill={j % 2 ? '#4fa047' : '#3f8a3a'} />
                                </g>
                            );
                        })}
                    </g>
                ))}
                <g transform="translate(176 742)">
                    <circle className="sc-pulse" r="90" fill={f('fernGlow')} />
                    {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-12" rx="7" ry="14" fill="#fffbe6" transform={`rotate(${a})`} />)}
                    {[36, 108, 180, 252, 324].map((a) => <ellipse key={a} cx="0" cy="-9" rx="4.4" ry="10" fill="#fde68a" transform={`rotate(${a})`} />)}
                    <circle r="6" fill="#fbbf24" /><circle r="3" fill="#fff" />
                    <path className="sc-twinkle" d={sparkle(1.2)} transform="translate(-40 -30)" fill="#fff7c2" />
                    <path className="sc-twinkle" style={after(-0.6)} d={sparkle(0.9)} transform="translate(44 -16)" fill="#fff7c2" />
                    <path className="sc-twinkle" style={after(-1.1)} d={sparkle(0.7)} transform="translate(10 -56)" fill="#fff7c2" />
                </g>
                {[[40, 860], [330, 872], [372, 880], [300, 846]].map(([x, y], i) => flower(`lf${i}`, x, y, i % 3, 2.2))}
            </g>
            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="1470" cy="886" rx="150" ry="14" fill="#000" opacity=".45" />
                {/* the firewood, stacked */}
                {[[1500, 852], [1540, 852], [1580, 852], [1520, 818], [1560, 818], [1600, 818], [1540, 784], [1580, 784]].map(([x, y], i) => (
                    <g key={i}>
                        <circle cx={x} cy={y} r="18" fill="#7a5230" stroke="#4a2e1a" strokeWidth="2" />
                        <circle cx={x} cy={y} r="11" fill="none" stroke="#a37a4a" strokeWidth="1.4" />
                        <circle cx={x} cy={y} r="4" fill="#a37a4a" />
                    </g>
                ))}
                {/* the stump, the axe in it, two sauna whisks leaning on it */}
                <path d="M1366 886V830Q1400 820 1434 830V886Z" fill="#6b4a2f" />
                <ellipse cx="1400" cy="830" rx="34" ry="10" fill="#d9b98a" stroke="#8a6440" strokeWidth="2" />
                <ellipse cx="1400" cy="830" rx="20" ry="6" fill="none" stroke="#a37a4a" strokeWidth="1.2" />
                <path d="M1388 828L1420 760" stroke="#8a5a2e" strokeWidth="7" strokeLinecap="round" />
                <path d="M1380 826L1372 806L1396 798L1402 818Z" fill="#9aa3ad" stroke="#5a636d" strokeWidth="1.4" />
                {[[1350, 884, -14], [1448, 886, 16]].map(([x, y, a], i) => (
                    <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
                        <path d="M0 0V-34" stroke="#6b4a2f" strokeWidth="6" strokeLinecap="round" />
                        <path d="M-6 -30H6" stroke="#c9a46a" strokeWidth="3" />
                        {Array.from({ length: 14 }, (_, j) => <ellipse key={j} cx={r1(Math.sin(j * 1.7) * 14)} cy={r1(-44 - (j % 7) * 9)} rx="6" ry="9" fill={j % 2 ? '#3f8a3a' : '#5bb04e'} transform={`rotate(${(j % 5) * 20 - 40} ${r1(Math.sin(j * 1.7) * 14)} ${r1(-44 - (j % 7) * 9)})`} />)}
                    </g>
                ))}
            </g>
            <rect width="1600" height={height} fill={f('vig')} />
        </svg>
    );
}
