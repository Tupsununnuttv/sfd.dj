import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { cloud } from '@/Components/scene/shapes';
import { after, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const font = 'Figtree, system-ui, sans-serif';
const FRAME = { x: tv.x - 30, y: tv.y - 36, w: tv.w + 60, h: tv.h + 70 }; // the willow frame round the video
const PASTEL = ['#f9a8d4', '#c4b5fd', '#93c5fd', '#86efac', '#fde68a', '#fdba74'];
const DEEP = ['#db2777', '#7c3aed', '#2563eb', '#16a34a', '#d97706', '#ea580c']; // the painted pattern on an egg of the same index
const EGG = 'M0 -50C24 -50 38 -14 38 12C38 36 22 50 0 50C-22 50 -38 36 -38 12C-38 -14 -24 -50 0 -50Z'; // an egg 100 tall round (0, 0)

// the eggs that hang from the tree on the left: x, y of the twig, string length, colour, pattern, size
const TREE_EGGS: [number, number, number, number, number, number][] = [
    [104, 252, 26, 0, 0, 40], [150, 300, 18, 2, 1, 34], [196, 170, 30, 4, 2, 38], [254, 112, 22, 1, 3, 34], [300, 168, 34, 3, 0, 40],
    [348, 232, 22, 5, 1, 36], [404, 252, 30, 0, 2, 38], [226, 248, 20, 3, 3, 32], [78, 340, 22, 1, 2, 34], [376, 330, 18, 4, 0, 32],
    [160, 206, 16, 5, 3, 30], [300, 282, 24, 2, 1, 34],
];

// little flowers in the grass: x, y, kind (0 daisy, 1 blue, 2 pink), size
const rg = rand(31);
const MEADOW = Array.from({ length: 70 }, () => {
    const y = FLOOR + 8 + rg() ** 1.4 * 270;

    return { x: r1(rg() * 1600), y: r1(y), k: Math.floor(rg() * 3), s: r1(0.6 + ((y - FLOOR) / 270) * 0.9) };
});
const TUFTS = Array.from({ length: 90 }, () => ({ x: r1(rg() * 1600), y: r1(FLOOR + 6 + rg() ** 1.3 * 280) }));

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * Easter on a 1600 x 900 canvas: a sunny Easter morning in the garden, in pastel colours. Rays of light behind the video, which hangs in a frame of woven
 * willow with ribbons, tulips and eggs and a "Happy Easter" sign under it; a giant painted egg in a straw nest below, with a bunny peeking out from behind it.
 * On the left an egg tree, its bare branches with catkins hung with painted eggs; on the right a birch in fresh leaf with a bird house. Far off a white chapel
 * and lambs on green hills, a white picket fence with tulips, bunting of eggs along the top. The floor is a meadow with flowers and eggs hidden in the grass,
 * and a big straw nest ring of eggs under the booth; in the front corners a basket full of eggs with chicks (one still hatching) and a big white bunny holding an egg.
 * Like the others it only moves while a song plays (`live`): the light turns, clouds drift, the eggs and the bunting swing, butterflies flutter and the chicks
 * bob. Pastel confetti falls over the whole room (RoomScene, Snow.tsx).
 */
export default function EasterBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down

    // ----- the little pieces -----
    /** A painted egg with its middle at (x, y), `h` tall, in pastel colour `c` with pattern `kind`: 0 stripes, 1 dots, 2 zigzag, 3 two colours. */
    const egg = (k: string, x: number, y: number, h: number, c: number, kind: number, rot = 0) => {
        const base = PASTEL[c % PASTEL.length];
        const deep = DEEP[c % DEEP.length];
        const other = PASTEL[(c + 2) % PASTEL.length];

        return (
            <g key={k} transform={`translate(${r1(x)} ${r1(y)}) rotate(${rot}) scale(${r1(h) / 100})`}>
                <path d={EGG} fill={base} />
                <g clipPath={`url(#${u('egg')})`}>
                    {kind === 0 && (
                        <>
                            <rect x="-40" y="-24" width="80" height="8" fill={deep} opacity=".85" />
                            <path d="M-40 -2Q-30 -9 -20 -2T0 -2T20 -2T40 -2" fill="none" stroke="#fff" strokeWidth="5" />
                            <rect x="-40" y="14" width="80" height="11" fill={other} />
                            <path d="M-40 14H40M-40 25H40" stroke={deep} strokeWidth="2" />
                        </>
                    )}
                    {kind === 1 && (
                        <>
                            {[[-18, -26], [8, -32], [-4, -10], [22, -8], [-24, 6], [4, 14], [26, 22], [-14, 30], [12, 38]].map(([dx, dy]) => <circle key={`${dx}${dy}`} cx={dx} cy={dy} r="5.4" fill={(dx + dy) % 3 ? '#fff' : deep} />)}
                        </>
                    )}
                    {kind === 2 && (
                        <>
                            <rect x="-40" y="-8" width="80" height="18" fill={other} />
                            <path d="M-40 1L-30 -8L-20 1L-10 -8L0 1L10 -8L20 1L30 -8L40 1L40 10L30 1L20 10L10 1L0 10L-10 1L-20 10L-30 1L-40 10Z" fill={deep} />
                            <path d="M-40 -26H40M-40 28H40" stroke="#fff" strokeWidth="4" strokeDasharray="1 5" strokeLinecap="round" />
                        </>
                    )}
                    {kind === 3 && (
                        <>
                            <path d="M-40 8Q-30 0 -20 8T0 8T20 8T40 8V60H-40Z" fill={other} />
                            <path d="M-40 8Q-30 0 -20 8T0 8T20 8T40 8" fill="none" stroke="#fff" strokeWidth="3.4" />
                            <path d="M0 -36l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill={deep} />
                        </>
                    )}
                    <path d={EGG} fill={f('eggShade')} />
                </g>
                <ellipse cx="-14" cy="-24" rx="5.4" ry="11" fill="#fff" opacity=".5" transform="rotate(18 -14 -24)" />
            </g>
        );
    };

    /** An egg hanging from a twig at (x, y) on a ribbon `len` long; it swings while a song plays. */
    const hanging = (k: string, x: number, y: number, len: number, c: number, kind: number, h: number, i: number) => (
        <g key={k} className="sc-dangle" style={after(-i * 0.47)}>
            <path d={`M${x} ${y}V${y + len}`} stroke={DEEP[c]} strokeWidth="1.6" />
            <path d={`M${x} ${y + 2}l-5 -4 1 6Zm0 0l5 -4 -1 6Z`} fill={DEEP[c]} />
            {egg(`${k}e`, x, y + len + h / 2, h, c, kind)}
        </g>
    );

    /** A tulip whose flower is at (x, y), growing from the ground at `base`. */
    const tulip = (k: string, x: number, y: number, base: number, c: string, s = 1, lean = 0) => (
        <g key={k}>
            <path d={`M${x} ${y + 6 * s}Q${x - lean * 0.5} ${(y + base) / 2} ${x - lean} ${base}`} stroke="#3f9142" strokeWidth={3 * s} fill="none" />
            <path d={`M${x - lean} ${base}Q${x - lean - 16 * s} ${base - 26 * s} ${x - lean - 6 * s} ${base - 52 * s}Q${x - lean + 2 * s} ${base - 24 * s} ${x - lean} ${base}Z`} fill="#4caf50" />
            <path d={`M${x - 11 * s} ${y - 8 * s}Q${x - 12 * s} ${y + 10 * s} ${x} ${y + 10 * s}Q${x + 12 * s} ${y + 10 * s} ${x + 11 * s} ${y - 8 * s}L${x + 5 * s} ${y - 2 * s}L${x} ${y - 12 * s}L${x - 5 * s} ${y - 2 * s}Z`} fill={c} />
            <path d={`M${x - 5 * s} ${y - 2 * s}L${x} ${y - 12 * s}L${x + 5 * s} ${y - 2 * s}Q${x} ${y + 6 * s} ${x - 5 * s} ${y - 2 * s}Z`} fill="#fff" opacity=".28" />
        </g>
    );

    /** A daffodil: a ring of pale petals with an orange trumpet, at (x, y) on a stem from `base`. */
    const daffodil = (k: string, x: number, y: number, base: number, s = 1) => (
        <g key={k}>
            <path d={`M${x} ${y}Q${x + 3} ${(y + base) / 2} ${x} ${base}`} stroke="#3f9142" strokeWidth={2.6 * s} fill="none" />
            <g transform={`translate(${x} ${y}) scale(${s})`}>
                {[0, 60, 120, 180, 240, 300].map((a) => <ellipse key={a} cx="0" cy="-8" rx="5" ry="8.4" fill="#fef3a0" transform={`rotate(${a})`} />)}
                <circle r="5.4" fill="#fb923c" /><circle r="3" fill="#fdba74" />
            </g>
        </g>
    );

    const daisy = (k: string, x: number, y: number, s: number) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <ellipse key={a} cx="0" cy="-4.4" rx="1.9" ry="3.6" fill="#fff" transform={`rotate(${a})`} />)}
            <circle r="2.2" fill="#facc15" />
        </g>
    );

    /** A chick, 40 tall with its feet at (x, y); `hatch` puts it in the bottom of its shell. */
    const chick = (k: string, x: number, y: number, s: number, d: number, hatch = false) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse cx="0" cy="1" rx="18" ry="4" fill="#000" opacity=".18" />
            <g className="sc-bob" style={{ ...after(d), animationDuration: '0.9s' }}>
                <ellipse cx="0" cy="-16" rx="17" ry="15" fill={f('chick')} />
                <circle cx="2" cy="-36" r="12" fill={f('chick')} />
                <path d="M0 -48Q4 -56 8 -50Q6 -54 2 -54" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 -38L21 -35L12 -32Z" fill="#fb923c" />
                <circle cx="6" cy="-40" r="2.2" fill="#1f2937" /><circle cx="6.8" cy="-40.8" r=".8" fill="#fff" />
                <ellipse cx="0" cy="-33" rx="3" ry="2" fill="#fda4af" opacity=".7" />
                <path d="M-12 -20Q-4 -10 6 -18Q-2 -24 -12 -20Z" fill="#fbbf24" />
            </g>
            {hatch ? (
                <path d="M-22 -14L-15 -20L-9 -13L-2 -21L5 -13L12 -20L18 -13L22 -16Q24 2 0 3Q-24 2 -22 -14Z" fill="#fdf4e6" stroke="#e7d7bf" strokeWidth="1.2" />
            ) : (
                <path d="M-6 0V3M-6 3L-10 5M-6 3L-3 5M6 0V3M6 3L2 5M6 3L9 5" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
            )}
        </g>
    );

    const butterfly = (k: string, x: number, y: number, c: string, d: number) => (
        <g key={k} className="sc-flutter" style={after(d)}>
            <g transform={`translate(${x} ${y})`}>
                <g className="sc-flap" style={after(d)}>
                    <path d="M0 0C-6 -14 -20 -16 -20 -6C-20 2 -8 4 0 0ZM0 0C6 -14 20 -16 20 -6C20 2 8 4 0 0Z" fill={c} />
                    <path d="M0 0C-4 8 -14 12 -14 6C-14 2 -6 0 0 0ZM0 0C4 8 14 12 14 6C14 2 6 0 0 0Z" fill={c} opacity=".8" />
                </g>
                <path d="M0 -6V6" stroke="#3f2a1a" strokeWidth="2" strokeLinecap="round" />
            </g>
        </g>
    );

    // ----- the far landscape: hills, a white chapel, lambs -----
    const lamb = (k: string, x: number, y: number, s: number, flip = 1) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s * flip} ${s})`}>
            <path d="M-10 0V8M-4 0V9M6 0V9M11 0V8" stroke="#3a3a3a" strokeWidth="2.4" strokeLinecap="round" />
            {[[-10, -6], [-2, -10], [7, -8], [12, -2], [-12, 0], [0, -2], [8, 1]].map(([cx, cy]) => <circle key={`${cx}${cy}`} cx={cx} cy={cy} r="7" fill="#fbfaf6" />)}
            <ellipse cx="18" cy="-8" rx="5" ry="6" fill="#3a3a3a" />
            <path d="M14 -12l-5 -2M21 -12l4 -3" stroke="#3a3a3a" strokeWidth="2.4" strokeLinecap="round" />
        </g>
    );

    // ----- the egg tree on the left: bare branches with catkins and fresh leaves, hung with eggs -----
    const limbs: [string, number][] = [
        ['M250 640C248 560 242 500 250 430', 30],
        ['M250 446C226 390 168 340 98 306', 16], ['M250 436C262 370 300 304 362 250', 15], ['M248 428C238 336 232 246 222 150', 13],
        ['M178 350C150 320 120 290 104 248', 7], ['M150 330C120 330 96 336 70 346', 6], ['M304 300C320 266 332 232 336 196', 7], ['M334 268C364 262 392 256 420 250', 7],
        ['M228 222C210 196 188 180 166 160', 6], ['M224 196C246 166 266 140 286 120', 6], ['M222 160C214 130 206 108 196 88', 5], ['M290 312C308 300 330 296 350 300', 5],
        ['M362 250C376 232 396 216 412 206', 5], ['M98 306C84 296 72 280 66 262', 5],
    ];
    const catkins: [number, number, number][] = [[96, 240, -30], [72, 260, 20], [336, 188, 15], [420, 244, -20], [164, 154, -40], [288, 114, 30], [196, 84, -10], [412, 200, 40], [66, 340, -60], [350, 296, 70], [240, 180, -20], [130, 300, 50], [312, 238, -30], [270, 140, 50]];
    const eggTree = (
        <g>
            <ellipse cx="250" cy="640" rx="140" ry="12" fill="#2f6b2c" opacity=".35" />
            {limbs.map(([d, w], i) => (
                <g key={i}>
                    <path d={d} fill="none" stroke="#6b4a2f" strokeWidth={w} strokeLinecap="round" />
                    <path d={d} fill="none" stroke="#8a6440" strokeWidth={w * 0.35} strokeLinecap="round" transform="translate(-2 -1)" opacity=".7" />
                </g>
            ))}
            {catkins.map(([x, y, a], i) => (
                <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
                    <path d="M0 0V-9" stroke="#6b4a2f" strokeWidth="1.4" />
                    <ellipse cx="0" cy="-13" rx="4.4" ry="7" fill="#f4f1ea" />
                    <ellipse cx="-1.2" cy="-15" rx="1.6" ry="3.4" fill="#fff" />
                    <path d="M2 -4Q8 -8 10 -2Q6 0 2 -4Z" fill="#86c95a" />
                </g>
            ))}
            {TREE_EGGS.map(([x, y, len, c, kind, h], i) => hanging(`te${i}`, x, y, len, c, kind, h, i))}
        </g>
    );

    // ----- the birch on the right, in fresh leaf, with a bird house -----
    const birch = (
        <g>
            <ellipse cx="1452" cy="640" rx="120" ry="10" fill="#2f6b2c" opacity=".35" />
            <path d="M1438 640C1442 520 1436 380 1446 230C1450 170 1446 110 1452 40H1474C1470 110 1472 170 1468 230C1462 380 1466 520 1470 640Z" fill="#f4f1ea" />
            <path d="M1462 640C1466 520 1460 380 1466 230C1468 170 1468 110 1472 40" stroke="#d6d0c4" strokeWidth="6" fill="none" />
            {[[1440, 600, 14], [1446, 540, 10], [1452, 470, 16], [1448, 410, 9], [1454, 350, 14], [1450, 290, 11], [1456, 220, 13], [1452, 160, 8], [1458, 100, 11]].map(([x, y, w], i) => <path key={i} d={`M${x} ${y}h${w}l-3 3h-${w - 4}Z`} fill="#2b2b2b" />)}
            <path d="M1456 250C1410 230 1380 200 1350 160M1462 190C1500 170 1530 140 1560 100M1454 140C1420 120 1400 90 1384 60" stroke="#e7e2d6" strokeWidth="7" strokeLinecap="round" fill="none" />
            {[[1350, 150, 70], [1300, 110, 54], [1400, 80, 64], [1470, 50, 74], [1550, 90, 70], [1590, 150, 56], [1520, 170, 52], [1420, 150, 50], [1380, 210, 46], [1500, 230, 40]].map(([x, y, r], i) => (
                <g key={i}>
                    <circle cx={x} cy={y} r={r} fill={i % 2 ? '#8fd16a' : '#a3dc7c'} />
                    <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.45} fill="#c4ec9c" opacity=".7" />
                </g>
            ))}
            {[[1330, 160], [1410, 120], [1500, 90], [1560, 160], [1380, 70], [1460, 200]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill={PASTEL[i % PASTEL.length]} stroke="#fff" strokeWidth="1.6" />)}
            {/* the bird house and its bird */}
            <g transform="translate(1456 352)">
                <path d="M-30 -6L0 -36L30 -6Z" fill="#e85d75" />
                <path d="M-34 -4L0 -40L34 -4" fill="none" stroke="#b83b55" strokeWidth="5" strokeLinecap="round" />
                <rect x="-24" y="-6" width="48" height="50" rx="3" fill="#a5e3f5" stroke="#5ba8c6" strokeWidth="2" />
                <circle cx="0" cy="12" r="9" fill="#2a3a48" />
                <rect x="-2" y="26" width="4" height="12" fill="#8a6440" />
                <g transform="translate(18 -46)">
                    <ellipse cx="0" cy="0" rx="13" ry="10" fill="#60a5fa" />
                    <circle cx="9" cy="-8" r="7" fill="#60a5fa" />
                    <path d="M15 -9L22 -7L15 -5Z" fill="#f59e0b" />
                    <circle cx="10" cy="-10" r="1.6" fill="#111" />
                    <path d="M-12 -2L-22 -8L-20 2Z" fill="#3b82f6" />
                    <ellipse cx="2" cy="3" rx="7" ry="5" fill="#fde68a" />
                </g>
            </g>
        </g>
    );

    // ----- the bunting of eggs along the top -----
    const bunting = (k: string, x0: number, x1: number, y: number, sag: number, n: number) => (
        <g key={k}>
            <path d={`M${x0} ${y}Q${(x0 + x1) / 2} ${y + 2 * sag} ${x1} ${y}`} fill="none" stroke="#e2a05a" strokeWidth="2" />
            {Array.from({ length: n }, (_, i) => {
                const t = (i + 0.5) / n;
                const x = x0 + (x1 - x0) * t;
                const yy = y + 4 * sag * t * (1 - t);

                return (
                    <g key={i} className="sc-bunting" style={after(-i * 0.3)}>
                        {egg(`${k}${i}`, x, yy + 18, 32, i % PASTEL.length, (i + 1) % 4)}
                    </g>
                );
            })}
        </g>
    );

    // ----- the bunny that peeks out from behind the big egg, and the big one in the front corner -----
    const ear = (x: number, y: number, a: number, s = 1) => (
        <g transform={`rotate(${a} ${x} ${y})`}>
            <ellipse cx={x} cy={y - 46 * s} rx={15 * s} ry={50 * s} fill={f('fur')} />
            <ellipse cx={x} cy={y - 44 * s} rx={8 * s} ry={38 * s} fill="#f9b4c6" />
        </g>
    );
    const face = (x: number, y: number, s: number) => (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse cx="-17" cy="-4" rx="5" ry="6.4" fill="#2b2233" /><ellipse cx="17" cy="-4" rx="5" ry="6.4" fill="#2b2233" />
            <circle cx="-15.4" cy="-6.4" r="1.9" fill="#fff" /><circle cx="18.6" cy="-6.4" r="1.9" fill="#fff" />
            <ellipse cx="-26" cy="9" rx="7" ry="4.4" fill="#fbb6c8" opacity=".75" /><ellipse cx="26" cy="9" rx="7" ry="4.4" fill="#fbb6c8" opacity=".75" />
            <path d="M-5 6H5L0 11Z" fill="#f472b6" />
            <path d="M0 11V15M0 15Q-5 19 -9 16M0 15Q5 19 9 16" stroke="#7a4a5a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M-12 12L-34 8M-12 15L-33 17M12 12L34 8M12 15L33 17" stroke="#a8a0b0" strokeWidth="1" />
        </g>
    );
    const bigBunny = (
        <g transform="translate(1466 892)">
            <ellipse cx="0" cy="-2" rx="110" ry="14" fill="#2f6b2c" opacity=".45" />
            {ear(-22, -170, -12, 0.95)}
            {ear(24, -170, 16, 0.95)}
            <ellipse cx="0" cy="-70" rx="68" ry="72" fill={f('fur')} />
            <ellipse cx="0" cy="-54" rx="42" ry="46" fill="#ffffff" opacity=".7" />
            <ellipse cx="-44" cy="-14" rx="34" ry="14" fill={f('fur')} /><ellipse cx="44" cy="-14" rx="34" ry="14" fill={f('fur')} />
            <ellipse cx="-50" cy="-12" rx="12" ry="6" fill="#f9b4c6" opacity=".6" /><ellipse cx="50" cy="-12" rx="12" ry="6" fill="#f9b4c6" opacity=".6" />
            <circle cx="0" cy="-158" r="48" fill={f('fur')} />
            {face(0, -152, 1)}
            {egg('bb', 0, -76, 64, 0, 2, -8)}
            <ellipse cx="-30" cy="-70" rx="14" ry="11" fill={f('fur')} transform="rotate(30 -30 -70)" />
            <ellipse cx="30" cy="-70" rx="14" ry="11" fill={f('fur')} transform="rotate(-30 30 -70)" />
            <g transform="translate(-30 -196) rotate(-18)">
                <path d="M0 0C-12 -14 -26 -4 -16 6C-8 12 -2 4 0 0ZM0 0C12 -14 26 -4 16 6C8 12 2 4 0 0Z" fill="#a78bfa" />
                <circle r="5" fill="#8b5cf6" />
            </g>
        </g>
    );

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('sky')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#7cc6f2" /><stop offset=".5" stopColor="#c4e8fb" /><stop offset="1" stopColor="#ffe1ec" /></linearGradient>
                <radialGradient id={u('sun')} cx="800" cy="170" r="560" gradientUnits="userSpaceOnUse"><stop stopColor="#fffbe0" stopOpacity=".95" /><stop offset=".35" stopColor="#fff3b8" stopOpacity=".45" /><stop offset="1" stopColor="#fff3b8" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('hillFar')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#c6ebb0" /><stop offset="1" stopColor="#a2d98a" /></linearGradient>
                <linearGradient id={u('hillNear')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a8de8e" /><stop offset="1" stopColor="#7cc464" /></linearGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <pattern id={u('weave')} width="18" height="18" patternUnits="userSpaceOnUse">
                    <rect width="18" height="18" fill="#a8743f" />
                    <rect x="0" y="1" width="9" height="3" rx="1.5" fill="#d9a466" /><rect x="0" y="5" width="9" height="3" rx="1.5" fill="#c8925a" />
                    <rect x="10" y="0" width="3" height="9" rx="1.5" fill="#d9a466" /><rect x="14" y="0" width="3" height="9" rx="1.5" fill="#c8925a" />
                    <rect x="9" y="10" width="9" height="3" rx="1.5" fill="#d9a466" /><rect x="9" y="14" width="9" height="3" rx="1.5" fill="#c8925a" />
                    <rect x="1" y="9" width="3" height="9" rx="1.5" fill="#d9a466" /><rect x="5" y="9" width="3" height="9" rx="1.5" fill="#c8925a" />
                </pattern>
                <pattern id={u('straw')} width="26" height="10" patternUnits="userSpaceOnUse">
                    <rect width="26" height="10" fill="#d8a85a" />
                    <path d="M0 3Q7 0 13 3T26 3M0 8Q7 5 13 8T26 8" stroke="#f3cf86" strokeWidth="1.6" fill="none" />
                    <path d="M4 0L10 10M17 0L22 10" stroke="#a87a35" strokeWidth="1" opacity=".6" />
                </pattern>
                <radialGradient id={u('eggShade')} cx=".35" cy=".3" r=".9"><stop offset=".5" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#5b3a6a" stopOpacity=".28" /></radialGradient>
                <radialGradient id={u('bigEgg')} cx=".38" cy=".3" r=".85"><stop stopColor="#fff0f7" /><stop offset=".45" stopColor="#fbcfe8" /><stop offset="1" stopColor="#d8b4fe" /></radialGradient>
                <radialGradient id={u('fur')} cx=".4" cy=".3" r=".9"><stop stopColor="#ffffff" /><stop offset=".65" stopColor="#f1edf4" /><stop offset="1" stopColor="#cfc6d8" /></radialGradient>
                <radialGradient id={u('chick')} cx=".4" cy=".3" r=".8"><stop stopColor="#fff7b0" /><stop offset=".6" stopColor="#fde047" /><stop offset="1" stopColor="#f5b20b" /></radialGradient>
                <linearGradient id={u('plank')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fffaf0" /><stop offset="1" stopColor="#f3e3c6" /></linearGradient>
                <linearGradient id={u('picket')} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#ffffff" /><stop offset="1" stopColor="#e6e0ee" /></linearGradient>
                <radialGradient id={u('lawnLight')} cx=".5" cy=".5" r=".5"><stop stopColor="#fff9c4" stopOpacity=".42" /><stop offset="1" stopColor="#fff9c4" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffffff" stopOpacity="0" /><stop offset="1" stopColor={p.floorBottom} stopOpacity=".35" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1060" gradientUnits="userSpaceOnUse"><stop offset=".6" stopColor="#3a2a4a" stopOpacity="0" /><stop offset="1" stopColor="#3a2a4a" stopOpacity=".35" /></radialGradient>
                <filter id={u('soft')} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8" /></filter>
                <clipPath id={u('egg')}><path d={EGG} /></clipPath>
            </defs>

            {/* the sky, rays of morning light behind the video, clouds */}
            <rect width="1600" height={FLOOR} fill={f('sky')} />
            <g className="sc-rays">
                {Array.from({ length: 18 }, (_, i) => {
                    const a0 = (i * 20 * Math.PI) / 180;
                    const a1 = ((i * 20 + 9) * Math.PI) / 180;

                    return <path key={i} d={`M800 170L${r1(800 + Math.cos(a0) * 1100)} ${r1(170 + Math.sin(a0) * 1100)}L${r1(800 + Math.cos(a1) * 1100)} ${r1(170 + Math.sin(a1) * 1100)}Z`} fill="#fffbe6" opacity=".28" />;
                })}
            </g>
            <rect width="1600" height={FLOOR} fill={f('sun')} />
            <g className="sc-drift">{cloud('c1', 610, 70, 0.5)}{cloud('c2', 1170, 380, 0.42)}</g>
            <g className="sc-drift" style={after(-4)}>{cloud('c3', 470, 300, 0.38)}{cloud('c4', 1250, 250, 0.36)}</g>

            {/* far off: hills, a white chapel, lambs */}
            <path d="M0 470Q140 420 300 452T620 440T940 452T1260 430T1600 456V640H0Z" fill={f('hillFar')} />
            <g transform="translate(604 444)">
                <path d="M-30 0V-34H30V0Z" fill="#fbfaf6" />
                <path d="M-36 -32L0 -56L36 -32Z" fill="#e2586e" />
                <rect x="-48" y="-62" width="22" height="62" fill="#fbfaf6" />
                <path d="M-52 -60L-37 -88L-22 -60Z" fill="#e2586e" />
                <path d="M-37 -88V-100M-41 -95H-33" stroke="#c9a227" strokeWidth="2.4" />
                <path d="M-41 -46A4 4 0 0 1 -33 -46V-38H-41Z" fill="#7cc6f2" />
                <path d="M-6 0V-16A6 6 0 0 1 6 -16V0Z" fill="#8a6440" />
                <path d="M14 -22A4 4 0 0 1 22 -22V-14H14Z" fill="#7cc6f2" />
            </g>
            <path d="M0 528Q180 480 380 506T760 500T1140 508T1600 490V640H0Z" fill={f('hillNear')} />
            {lamb('l1', 1124, 496, 0.9)}{lamb('l2', 1172, 504, 0.75, -1)}{lamb('l3', 1214, 494, 0.82)}{lamb('l4', 520, 512, 0.7, -1)}

            {/* the white picket fence, tulips and daffodils along it */}
            <g>
                <rect x="0" y="574" width="1600" height="8" fill={f('picket')} />
                <rect x="0" y="600" width="1600" height="8" fill={f('picket')} />
                {Array.from({ length: 54 }, (_, i) => <path key={i} d={`M${6 + i * 30} 626V560L${16 + i * 30} 548L${26 + i * 30} 560V626Z`} fill={f('picket')} stroke="#d8d0e2" strokeWidth="1" />)}
                {Array.from({ length: 22 }, (_, i) => (i % 3 === 2 ? daffodil(`fd${i}`, 20 + i * 74, 596, 630, 0.9) : tulip(`ft${i}`, 20 + i * 74, 600, 630, ['#f472b6', '#f87171', '#c084fc', '#fbbf24'][i % 4], 0.8, (i % 2) * 6 - 3)))}
            </g>

            {/* the trees */}
            {eggTree}
            {birch}

            {/* bunting of eggs along the top */}
            {bunting('bl', -10, 478, 22, 22, 7)}
            {bunting('br', 1122, 1610, 22, 22, 7)}

            {/* the willow frame round the video: ribbon bows at the top, tulips and eggs at the foot */}
            <rect x={FRAME.x - 10} y={FRAME.y - 6} width={FRAME.w + 20} height={FRAME.h + 20} rx="22" fill="#fff" opacity=".35" filter={`url(#${u('soft')})`} />
            <rect x={FRAME.x} y={FRAME.y} width={FRAME.w} height={FRAME.h} rx="16" fill={f('weave')} />
            <rect x={FRAME.x} y={FRAME.y} width={FRAME.w} height={FRAME.h} rx="16" fill="none" stroke="#7a5230" strokeWidth="3" />
            <rect x={FRAME.x + 7} y={FRAME.y + 7} width={FRAME.w - 14} height={FRAME.h - 14} rx="12" fill="none" stroke="#e8bb7c" strokeWidth="2.4" />
            <rect x={tv.x - 12} y={tv.y - 12} width={tv.w + 24} height={tv.h + 24} rx="6" fill="#fff8ee" stroke="#f9a8d4" strokeWidth="3" />
            {[[FRAME.x + 26, FRAME.y + 66, '#f472b6', -14], [FRAME.x + FRAME.w - 26, FRAME.y + 66, '#a78bfa', 14]].map(([x, y, c, a]) => (
                <g key={String(x)} transform={`translate(${x} ${y}) rotate(${a})`}>
                    <path d="M-4 4L-14 40L-6 34L-2 44ZM4 4L14 40L6 34L2 44Z" fill={String(c)} />
                    <path d="M0 0C-22 -24 -42 -6 -32 6C-24 15 -8 10 0 0ZM0 0C22 -24 42 -6 32 6C24 15 8 10 0 0Z" fill={String(c)} />
                    <path d="M-26 -2C-20 -10 -12 -8 -8 -3M26 -2C20 -10 12 -8 8 -3" stroke="#fff" strokeOpacity=".55" strokeWidth="2" fill="none" />
                    <circle r="7" fill={String(c)} stroke="#fff" strokeOpacity=".5" />
                </g>
            ))}
            {[FRAME.x + 6, FRAME.x + FRAME.w - 6].map((x, side) => (
                <g key={x}>
                    {tulip(`frt${side}a`, x + (side ? -30 : 30), FRAME.y + FRAME.h - 34, FRAME.y + FRAME.h + 6, '#f472b6', 1, side ? 8 : -8)}
                    {tulip(`frt${side}b`, x + (side ? -6 : 6), FRAME.y + FRAME.h - 52, FRAME.y + FRAME.h + 6, '#fbbf24', 1.1, 0)}
                    {daffodil(`frd${side}`, x + (side ? 14 : -14), FRAME.y + FRAME.h - 22, FRAME.y + FRAME.h + 6, 1)}
                    {egg(`fre${side}a`, x + (side ? -52 : 52), FRAME.y + FRAME.h - 6, 30, side ? 2 : 3, 1, side ? 14 : -14)}
                    {egg(`fre${side}b`, x + (side ? -26 : 26), FRAME.y + FRAME.h + 2, 34, side ? 5 : 1, 2, side ? -8 : 8)}
                </g>
            ))}
            {/* the sign under it */}
            <path d="M748 370L742 384M852 370L858 384" stroke="#c48a4a" strokeWidth="2.4" />
            <rect x="716" y="382" width="168" height="34" rx="10" fill={f('plank')} stroke="#e2a05a" strokeWidth="2.4" />
            <text x="800" y="405" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize="17" letterSpacing=".5" fill="#db2777">Happy Easter</text>
            {[724, 876].map((x, i) => <circle key={x} cx={x} cy="399" r="4" fill={PASTEL[i + 2]} />)}

            {/* the giant egg in its straw nest, a bunny peeking out from behind it */}
            <g>
                <ellipse cx="800" cy="626" rx="150" ry="16" fill="#2f6b2c" opacity=".35" />
                {ear(884, 450, 16, 0.62)}
                {ear(910, 456, 32, 0.6)}
                <circle cx="906" cy="500" r="30" fill={f('fur')} />
                {face(912, 502, 0.62)}
                <ellipse cx="800" cy="604" rx="128" ry="26" fill={f('straw')} />
                <path d="M800 422C846 422 876 486 876 536C876 584 842 612 800 612C758 612 724 584 724 536C724 486 754 422 800 422Z" fill={f('bigEgg')} />
                <g clipPath={`url(#${u('bigClip')})`}>
                    <path d="M720 470H880V484H720Z" fill="#a78bfa" />
                    <path d="M720 500L736 486L752 500L768 486L784 500L800 486L816 500L832 486L848 500L864 486L880 500V516L864 502L848 516L832 502L816 516L800 502L784 516L768 502L752 516L736 502L720 516Z" fill="#f472b6" />
                    <path d="M720 532H880V544H720Z" fill="#93c5fd" />
                    {[740, 768, 796, 824, 852].map((x, i) => <circle key={x} cx={x + 6} cy="566" r="6" fill={['#fde68a', '#86efac', '#fff', '#fdba74', '#c4b5fd'][i]} />)}
                    <path d="M720 586Q760 576 800 586T880 586V620H720Z" fill="#c4b5fd" />
                    <path d="M800 432l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1Z" fill="#fde68a" stroke="#f59e0b" strokeWidth="1" />
                </g>
                <ellipse cx="776" cy="466" rx="10" ry="22" fill="#fff" opacity=".55" transform="rotate(18 776 466)" />
                <path d="M676 604Q800 652 924 604Q912 630 800 636Q688 630 676 604Z" fill={f('straw')} />
                <path d="M680 606Q800 646 920 606" stroke="#a87a35" strokeWidth="2" fill="none" />
                {egg('ne1', 700, 610, 30, 2, 0, -24)}{egg('ne2', 902, 612, 28, 4, 1, 20)}
            </g>

            {/* the meadow: grass, little flowers, eggs hidden in it */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            <g stroke="#5ea94a" strokeOpacity=".35" strokeWidth="2">
                {Array.from({ length: 25 }, (_, k) => k - 12).map((k) => <line key={k} x1={r1(lineX(k, FLOOR))} y1={FLOOR} x2={r1(lineX(k, height))} y2={height} />)}
            </g>
            <ellipse cx="800" cy="700" rx="620" ry="110" fill={f('lawnLight')} />
            <g stroke="#3f8f3a" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".75">
                {TUFTS.map((t, i) => <path key={i} d={`M${t.x - 4} ${t.y}l-3 -8M${t.x} ${t.y}l0 -10M${t.x + 4} ${t.y}l4 -8`} />)}
            </g>
            {MEADOW.map((m, i) => (m.k === 0 ? daisy(`m${i}`, m.x, m.y, m.s) : <circle key={i} cx={m.x} cy={m.y} r={2.6 * m.s} fill={m.k === 1 ? '#93c5fd' : '#f9a8d4'} stroke="#fff" strokeWidth=".8" />))}
            {[[60, 676, 22, 0, 0], [530, 668, 20, 3, 2], [1080, 672, 22, 5, 1], [1560, 664, 18, 1, 3], [372, 700, 24, 4, 2], [1240, 694, 22, 2, 0]].map(([x, y, h, c, kind], i) => egg(`ge${i}`, x, y, h, c, kind, (i % 2 ? 1 : -1) * 70))}

            {/* the straw nest ring under the booth, eggs round it */}
            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="800" cy={SCENE.booth.y + 102} rx="396" ry="70" fill="#a87a35" />
                <ellipse cx="800" cy={SCENE.booth.y + 98} rx="392" ry="66" fill={f('straw')} />
                <ellipse cx="800" cy={SCENE.booth.y + 98} rx="340" ry="52" fill="#86c96a" />
                <ellipse cx="800" cy={SCENE.booth.y + 98} rx="340" ry="52" fill="none" stroke="#a87a35" strokeWidth="3" />
                <ellipse cx="800" cy={SCENE.booth.y + 98} rx="366" ry="60" fill="none" stroke="#f3cf86" strokeWidth="2" strokeDasharray="8 6" />
                {Array.from({ length: 14 }, (_, i) => {
                    const a = (i / 14) * Math.PI * 2 + 0.2;
                    const x = 800 + Math.cos(a) * 366;
                    const y = SCENE.booth.y + 96 + Math.sin(a) * 60;

                    return Math.sin(a) > 0.55 && Math.abs(Math.cos(a)) < 0.5 ? null : egg(`ring${i}`, x, y - 8, 26, i % PASTEL.length, i % 4, Math.cos(a) * 30);
                })}
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 4} rx="184" ry="15" fill="#1f4d1c" opacity=".35" />
            </g>

            {withBooth && (
                <svg x={SCENE.booth.x} y={SCENE.booth.y + ext} width={SCENE.booth.w} height={SCENE.booth.h} viewBox="0 0 300 150" overflow="visible">
                    <BoothFrontArt u={(n) => `${uid}-b-${n}`} p={p} plate />
                </svg>
            )}

            {/* butterflies */}
            {butterfly('bf1', 470, 380, '#f9a8d4', 0)}
            {butterfly('bf2', 1180, 330, '#c4b5fd', -3)}
            {butterfly('bf3', 980, 470, '#fde68a', -6)}
            <rect y="560" width="1600" height={height - 560} fill={f('haze')} />

            {/* the front corners: a basket full of eggs with chicks on the left, a big bunny holding an egg on the right */}
            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="190" cy="884" rx="200" ry="14" fill="#1f4d1c" opacity=".35" />
                {tulip('lt1', 28, 760, 890, '#f87171', 1.3, -6)}{tulip('lt2', 60, 790, 890, '#f472b6', 1.1, 4)}{daffodil('ld1', 14, 812, 890, 1.2)}
                <path d="M110 790C110 720 300 720 300 790" fill="none" stroke="#a8743f" strokeWidth="12" strokeLinecap="round" />
                <path d="M110 790C110 720 300 720 300 790" fill="none" stroke="#d9a466" strokeWidth="5" strokeLinecap="round" strokeDasharray="6 5" />
                {egg('k1', 150, 790, 54, 0, 2, -18)}{egg('k2', 200, 778, 58, 2, 0, 4)}{egg('k3', 250, 790, 54, 4, 1, 20)}{egg('k4', 176, 808, 46, 1, 3, -6)}{egg('k5', 228, 810, 48, 3, 2, 10)}
                <path d="M92 804H318L300 884H110Z" fill={f('weave')} />
                <path d="M92 804H318L300 884H110Z" fill="none" stroke="#7a5230" strokeWidth="3" />
                <rect x="86" y="798" width="238" height="14" rx="7" fill="#c8925a" stroke="#7a5230" strokeWidth="2" />
                <g transform="translate(205 736)">
                    <path d="M0 0C-20 -20 -40 -4 -30 8C-22 16 -8 10 0 0ZM0 0C20 -20 40 -4 30 8C22 16 8 10 0 0Z" fill="#f472b6" />
                    <path d="M-4 4L-14 34L-6 28L-2 38ZM4 4L14 34L6 28L2 38Z" fill="#f472b6" />
                    <circle r="6.4" fill="#db2777" />
                </g>
                {chick('ch1', 352, 884, 1.15, 0)}
                {chick('ch2', 66, 892, 1, -0.45, true)}
                {egg('le', 398, 884, 30, 5, 0, 70)}
            </g>
            <g transform={`translate(0 ${ext})`}>
                {tulip('rt1', 1586, 760, 892, '#c084fc', 1.3, 6)}{tulip('rt2', 1352, 800, 892, '#f87171', 1.1, -4)}{daffodil('rd1', 1572, 820, 892, 1.2)}
                {bigBunny}
                {egg('re1', 1370, 880, 30, 1, 1, -60)}{egg('re2', 1574, 888, 28, 3, 2, 60)}
                {chick('ch3', 1340, 888, 0.9, -0.2)}
            </g>
            <rect width="1600" height={height} fill={f('vig')} />
            <defs><clipPath id={u('bigClip')}><path d="M800 422C846 422 876 486 876 536C876 584 842 612 800 612C758 612 724 584 724 536C724 486 754 422 800 422Z" /></clipPath></defs>
        </svg>
    );
}
