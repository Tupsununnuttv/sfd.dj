import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { pineTier } from '@/Components/scene/shapes';
import { after, r1, rand } from '@/Components/scene/util';
import { sparkle, star } from '@/lib/art/kit';
import { floorLineX as lineX, floorRowY as rowY, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const font = 'Figtree, system-ui, sans-serif';
const CH = { x: 410, w: 780 }; // the stone chimney breast in the middle of the wall: the video hangs on it like a painting, the fireplace is under it
const STONE = ['#6e5c50', '#7b6858', '#86705f', '#5f4d43', '#917b69'];
const WOOD = ['#7a4626', '#6a3b1f', '#86512c', '#5e3319'];
const WARM = '#fff0c2'; // the warm white of the fairy lights
const BALLS = ['#c81e1e', '#e8b923', '#f8fafc', '#9b1c31', '#e8b923', '#c81e1e', '#15803d'];
const GLASS = { x: 96, y: 124, w: 228, h: 312 }; // the window on the left wall, its arch included: the snow outside falls through all of it

// the stones of the chimney breast, row by row (the same every time)
const rs = rand(41);
const STONES: { x: number; y: number; w: number; h: number; c: number }[] = [];
for (let y = -8, row = 0; y < FLOOR; row++) {
    const h = 30 + Math.floor(rs() * 12);
    for (let x = CH.x - 20 - (row % 2) * 36 - Math.floor(rs() * 18); x < CH.x + CH.w; ) {
        const w = 56 + Math.floor(rs() * 54);
        STONES.push({ x, y, w, h, c: Math.floor(rs() * STONE.length) });
        x += w + 5;
    }
    y += h + 5;
}

// outside the window: stars and two layers of snow (each flake twice, one window-height apart, so the fall loops without a seam)
const rw = rand(13);
const WSTARS = Array.from({ length: 18 }, () => ({ x: GLASS.x + rw() * GLASS.w, y: GLASS.y + rw() * 170, r: r1(0.5 + rw() * 0.9) }));
const WSNOW = Array.from({ length: 34 }, (_, k) => ({ x: r1(GLASS.x + rw() * GLASS.w), y: r1(GLASS.y + rw() * GLASS.h), r: r1(k < 22 ? 1 + rw() * 0.8 : 1.9 + rw()), near: k >= 22 }));

// the tree in the right corner: tiers from the top down, `a` the tip, `b` the bottom and `w` half the width (x is from the trunk)
const TREE = { x: 1400, base: 646 };
const TIERS = [{ a: 112, b: 196, w: 44 }, { a: 150, b: 262, w: 74 }, { a: 202, b: 336, w: 102 }, { a: 262, b: 414, w: 128 }, { a: 326, b: 500, w: 152 }, { a: 396, b: 600, w: 174 }];
const halfAt = (y: number) => Math.max(0, ...TIERS.filter((t) => y >= t.a && y <= t.b).map((t) => (t.w * (y - t.a)) / (t.b - t.a)));
const rt = rand(57);
const TLIGHTS = Array.from({ length: 76 }, () => {
    const y = 132 + rt() * 458;

    return { x: r1((rt() * 2 - 1) * halfAt(y) * 0.86), y: r1(y) };
});
const TBALLS = Array.from({ length: 30 }, (_, k) => {
    const y = 156 + rt() * 424;

    return { x: r1((rt() * 2 - 1) * halfAt(y) * 0.8), y: r1(y), r: r1(5 + rt() * 3.4), c: BALLS[k % BALLS.length] };
});

/** One tier of the big tree: branch tips stick out of its sides and hang from its bottom edge. */
const tierPath = ({ a, b, w }: { a: number; b: number; w: number }) => {
    const n = Math.max(4, Math.round(w / 15));
    let d = `M0 ${a}`;
    for (let k = 1; k <= 3; k++) {
        const t = k / 3.4;
        d += `L${r1(-w * t - 7)} ${r1(a + (b - a) * t + 5)}L${r1(-w * t + 3)} ${r1(a + (b - a) * t - 3)}`;
    }
    d += `L${-w} ${b}`;
    for (let k = 0; k < n; k++) d += `L${r1(-w + (2 * w * (k + 0.5)) / n)} ${b + 9}L${r1(-w + (2 * w * (k + 1)) / n)} ${b}`;
    for (let k = 3; k >= 1; k--) {
        const t = k / 3.4;
        d += `L${r1(w * t - 3)} ${r1(a + (b - a) * t - 3)}L${r1(w * t + 7)} ${r1(a + (b - a) * t + 5)}`;
    }

    return `${d}Z`;
};

/** A point on the curve from (x0, y) to (x1, y) that sags `sag` in the middle, `t` of the way along. */
const onSwag = (x0: number, x1: number, y: number, sag: number, t: number) => [x0 + (x1 - x0) * t, y + 4 * sag * t * (1 - t)] as const;

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * Christmas V2 on a 1600 x 900 canvas: Christmas Eve inside a warm lodge. The video hangs in a gold frame on a stone chimney breast; under it a mantel with
 * candles, two nutcrackers and a garland, stockings, a wooden SFD.DJ sign and a fire in the hearth. On the left a tall window looks out on a snowy night
 * (snow falling, Santa's sleigh across the moon) between red velvet curtains, with milk and cookies left out for Santa; on the right a big tree with warm
 * lights, red and gold baubles, a ribbon and presents. A wooden floor with a round braided rug under the booth, Santa's sack and a sleeping cat in a
 * Santa hat in one front corner, a toy train coming out of a snowy tunnel in the other.
 * Like the others it only moves while a song plays (`live`): the fire and the candles flicker, the lights twinkle, it snows outside, the sleigh crosses the moon,
 * the stockings sway and the train runs. Gold glitter drifts down over the whole room, the crowd too (RoomScene, Snow.tsx).
 */
export default function Christmas2Backdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down

    // ----- the little pieces -----
    const bulb = (k: string, x: number, y: number, i: number, r = 3.4, glow = 12) => (
        <g key={k}>
            <circle className={i % 3 ? undefined : 'sc-twinkle'} style={i % 3 ? undefined : after(-(i % 7) * 0.23)} cx={r1(x)} cy={r1(y)} r={glow} fill={f('warmGlow')} />
            <circle cx={r1(x)} cy={r1(y)} r={r} fill={WARM} />
            <circle cx={r1(x - r * 0.3)} cy={r1(y - r * 0.3)} r={r1(r * 0.38)} fill="#fff" />
        </g>
    );

    const berries = (k: string, x: number, y: number) => (
        <g key={k}>
            <path d={`M${x} ${y}c-9 -6 -16 -1 -19 -5c2 7 10 9 19 5ZM${x} ${y}c9 -6 16 -1 19 -5c-2 7 -10 9 -19 5Z`} fill="#166534" />
            {[[-3, 1], [2.6, 0], [0, 3.4]].map(([dx, dy]) => <circle key={dx} cx={x + dx} cy={y + dy} r="3" fill="#dc2626" stroke="#7f1d1d" strokeWidth=".6" />)}
            <circle cx={x - 3.8} cy={y} r=".9" fill="#fff" opacity=".7" />
        </g>
    );

    const cone = (k: string, x: number, y: number, a: number) => (
        <g key={k} transform={`translate(${r1(x)} ${r1(y)}) rotate(${a})`}>
            <ellipse rx="5.4" ry="8.6" fill="#6b4226" />
            <path d="M-4.4 -4.4h8.8M-5 0h10M-4 4.4h8" stroke="#3b2414" strokeWidth="1.3" />
        </g>
    );

    const bow = (k: string, x: number, y: number, s = 1) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
            <path d="M-3 3L-16 32L-8 27L-4 36ZM3 3L16 32L8 27L4 36Z" fill="#a51616" stroke="#5c0b0b" strokeWidth="1" />
            <path d="M0 0C-20 -22 -40 -6 -30 6C-22 15 -8 10 0 0ZM0 0C20 -22 40 -6 30 6C22 15 8 10 0 0Z" fill="#c81e1e" stroke="#5c0b0b" strokeWidth="1.2" />
            <path d="M-24 -2C-18 -10 -10 -8 -6 -3M24 -2C18 -10 10 -8 6 -3" stroke="#fca5a5" strokeWidth="1.6" fill="none" opacity=".6" />
            <circle r="6.5" fill="#dc2626" stroke="#5c0b0b" strokeWidth="1.2" />
        </g>
    );

    /** A bauble on a string from (x, y); it swings from the top of the string. */
    const ornament = (k: string, x: number, y: number, len: number, r: number, c: string, d: number) => (
        <g key={k} className="sc-dangle" style={after(d)}>
            <path d={`M${x} ${y}V${y + len}`} stroke="#d6c7a1" strokeWidth="1.3" />
            <rect x={r1(x - r * 0.34)} y={y + len - 1} width={r1(r * 0.68)} height="5" rx="1" fill="#d4a017" />
            <circle cx={x} cy={y + len + 4 + r} r={r} fill={c} />
            <circle cx={x} cy={y + len + 4 + r} r={r} fill={f('shine')} />
        </g>
    );

    const gift = (k: string, x: number, y: number, w: number, h: number, body: string, ribbon: string, tilt = 0) => (
        <g key={k} transform={tilt ? `rotate(${tilt} ${x + w / 2} ${y + h})` : undefined}>
            <rect x={x} y={y} width={w} height={h} rx="2.5" fill={body} />
            <rect x={x} y={y} width={w * 0.3} height={h} rx="2.5" fill="#000" opacity=".16" />
            <rect x={x - 2} y={y - h * 0.16} width={w + 4} height={h * 0.2} rx="2.5" fill={body} />
            <rect x={x - 2} y={y - h * 0.16} width={w + 4} height={h * 0.2} rx="2.5" fill="#fff" opacity=".18" />
            <rect x={x + w / 2 - 3.5} y={y - h * 0.16} width="7" height={h * 1.16} fill={ribbon} />
            <path d={`M${x + w / 2} ${y - h * 0.16}C${x + w * 0.14} ${y - h * 0.62} ${x + w * 0.08} ${y - h * 0.16} ${x + w / 2} ${y - h * 0.16}C${x + w * 0.86} ${y - h * 0.62} ${x + w * 0.92} ${y - h * 0.16} ${x + w / 2} ${y - h * 0.16}Z`} fill={ribbon} stroke="#00000033" strokeWidth=".8" />
        </g>
    );

    /** A pine garland from (x0, y) to (x1, y), sagging `sag` in the middle, with warm lights, berries and cones. */
    const garland = (k: string, x0: number, x1: number, y: number, sag: number, n = 7) => {
        const d = `M${x0} ${y}Q${(x0 + x1) / 2} ${y + 2 * sag} ${x1} ${y}`;

        return (
            <g key={k}>
                <path d={d} fill="none" stroke="#0d3a20" strokeWidth="22" strokeLinecap="round" />
                <path d={d} fill="none" stroke="#166534" strokeWidth="18" strokeLinecap="round" strokeDasharray="2.4 3.2" />
                <path d={d} fill="none" stroke="#2fae63" strokeWidth="8" strokeLinecap="round" strokeDasharray="3 5" opacity=".7" transform="translate(0 -3)" />
                {Array.from({ length: n }, (_, i) => {
                    const [x, yy] = onSwag(x0, x1, y, sag, (i + 0.5) / n);

                    return i % 2 ? cone(`${k}c${i}`, x - 6, yy + 9, -20 + i * 9) : berries(`${k}b${i}`, x, yy + 4);
                })}
                {Array.from({ length: n + 1 }, (_, i) => {
                    const [x, yy] = onSwag(x0, x1, y, sag, (i + 0.15) / (n + 0.3));

                    return bulb(`${k}l${i}`, x, yy + 8, i + k.length);
                })}
            </g>
        );
    };

    // ----- the mantel: nutcrackers and candles stand on it -----
    const nutcracker = (k: string, x: number, y: number) => (
        <g key={k} transform={`translate(${x} ${y}) scale(.86)`}>
            <ellipse cx="0" cy="-2" rx="15" ry="4" fill="#9a6f0b" />
            <rect x="-14" y="-7" width="28" height="6" rx="2" fill="#d4a017" />
            <rect x="-9" y="-18" width="7.5" height="12" rx="1.5" fill="#111" /><rect x="1.5" y="-18" width="7.5" height="12" rx="1.5" fill="#111" />
            <rect x="-9" y="-32" width="18" height="15" fill="#f1ede4" /><path d="M0 -32V-18" stroke="#c9c1b0" strokeWidth="1.2" />
            <path d="M-11 -56H11L12 -32H-12Z" fill="#c81e1e" />
            <rect x="-12" y="-36" width="24" height="4.4" fill="#111" /><rect x="-2.2" y="-36.6" width="4.4" height="5.6" fill="#e8b923" />
            {[-50, -45, -40].map((yy) => <circle key={yy} cx="0" cy={yy} r="1.3" fill="#e8b923" />)}
            <path d="M-11 -54L-15 -37M11 -54L15 -37" stroke="#a51616" strokeWidth="5.4" strokeLinecap="round" />
            <circle cx="-15" cy="-35" r="2.8" fill="#f1c9a5" /><circle cx="15" cy="-35" r="2.8" fill="#f1c9a5" />
            <path d="M-13 -56H13" stroke="#e8b923" strokeWidth="3.4" strokeLinecap="round" />
            <rect x="-8" y="-69" width="16" height="14" rx="3" fill="#f1c9a5" />
            <path d="M-8 -59Q0 -53 8 -59L7 -54Q0 -48 -7 -54Z" fill="#f8fafc" />
            <path d="M-5.4 -61.6Q0 -58.6 5.4 -61.6" stroke="#f8fafc" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <circle cx="-3.4" cy="-64.6" r="1.1" fill="#111" /><circle cx="3.4" cy="-64.6" r="1.1" fill="#111" /><circle cx="0" cy="-62" r="1.3" fill="#e08a8a" />
            <path d="M-9 -68H9L8 -90H-8Z" fill="#111" /><rect x="-9.4" y="-73" width="18.8" height="3.6" fill="#e8b923" />
            <path d="M1 -90Q7 -101 3 -108Q-3 -99 1 -90Z" fill="#c81e1e" />
        </g>
    );

    const candle = (k: string, x: number, y: number, h: number, i: number) => (
        <g key={k}>
            <circle className="sc-flame" style={after(-i * 0.37)} cx={x} cy={y - h - 10} r="36" fill={f('flameGlow')} />
            <rect x={x - 9} y={y - h} width="18" height={h} rx="2.5" fill={f('wax')} />
            <path d={`M${x - 9} ${y - h + 2}q2.4 6 4.6 0q2 8 4.4 0q2 5 4 0q2 7 5 0`} fill="none" stroke="#fffaf0" strokeWidth="1.8" strokeOpacity=".85" />
            <ellipse cx={x} cy={y - h} rx="9" ry="2.4" fill="#fff8e8" />
            <path d={`M${x} ${y - h}v-4`} stroke="#2a1a10" strokeWidth="1.2" />
            <path className="sc-blaze" style={after(-i * 0.29)} d={`M${x} ${y - h - 19}Q${x + 6.4} ${y - h - 9} ${x + 3.8} ${y - h - 4.6}Q${x} ${y - h - 1.8} ${x - 3.8} ${y - h - 4.6}Q${x - 6.4} ${y - h - 9} ${x} ${y - h - 19}Z`} fill={f('flame')} />
            <ellipse cx={x} cy={y - h - 6.4} rx="1.8" ry="3" fill="#fff" opacity=".85" />
        </g>
    );

    // a stocking on a hook under the mantel: red or green, with a white fur cuff; `toe` is the way its foot points
    const stocking = (k: string, x: number, i: number, toe: number, body: string, trim: string, mark: number) => (
        <g key={k} className="sc-dangle" style={after(-i * 0.9)}>
            <path d={`M${x} 434V446`} stroke="#d4a017" strokeWidth="1.8" />
            <g transform={`translate(${x} 446) scale(${toe} 1)`}>
                <path d="M-12 8V40Q-12 57 3 58H18Q29 58 29 48Q29 39 18 38H12V8Z" fill={body} stroke="#00000055" strokeWidth="1" />
                <path d="M-12 42Q-12 57 3 58H9Q-1 52 -1 42Z" fill={trim} />
                <path d="M19 38Q29 39 29 48Q29 58 19 58Q24 49 19 38Z" fill={trim} />
                {mark === 0 && [[-6, 17], [5, 23], [-4, 31], [6, 13], [1, 37]].map(([cx, cy]) => <circle key={cx * cy} cx={cx} cy={cy} r="1.9" fill="#fff" opacity=".9" />)}
                {mark === 1 && [15, 24, 33].map((yy) => <rect key={yy} x="-12" y={yy} width="24" height="4" fill="#f8fafc" opacity=".9" />)}
                {mark === 2 && <path d={star(5, 8, 3.4)} transform="translate(0 25)" fill="#e8b923" stroke="#8a5a00" strokeWidth=".8" />}
                {mark === 3 && <path d="M0 15V35M-8.7 20L8.7 30M-8.7 30L8.7 20" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" />}
                <rect x="-15" y="-2" width="30" height="13" rx="5" fill="#f6f1e7" />
                <path d="M-15 9q3.75 4 7.5 0t7.5 0t7.5 0t7.5 0" fill="#f6f1e7" stroke="#d8cfbf" strokeWidth=".8" />
            </g>
        </g>
    );

    const sconce = (k: string, x: number, y: number, i: number) => (
        <g key={k}>
            <circle className="sc-flame" style={after(-i * 0.5)} cx={x} cy={y - 30} r="72" fill={f('flameGlow')} opacity=".75" />
            <ellipse cx={x} cy={y + 8} rx="8" ry="19" fill={f('brass')} stroke="#6b4a10" strokeWidth="1" />
            <path d={`M${x} ${y + 18}Q${x + 16} ${y + 10} ${x} ${y - 2}`} fill="none" stroke="#b8860b" strokeWidth="3" />
            <ellipse cx={x} cy={y - 4} rx="12" ry="3.4" fill={f('brass')} />
            <rect x={x - 5} y={y - 34} width="10" height="30" rx="1.5" fill={f('wax')} />
            <path className="sc-blaze" style={after(-i * 0.41)} d={`M${x} ${y - 51}Q${x + 5} ${y - 42} ${x + 3} ${y - 38}Q${x} ${y - 35.6} ${x - 3} ${y - 38}Q${x - 5} ${y - 42} ${x} ${y - 51}Z`} fill={f('flame')} />
        </g>
    );

    // ----- the window: a snowy night outside, Santa's sleigh across the moon -----
    const glassPath = `M${GLASS.x} ${GLASS.y + GLASS.h}V238A114 114 0 0 1 ${GLASS.x + GLASS.w} 238V${GLASS.y + GLASS.h}Z`;
    const deer = (k: string, x: number) => (
        <g key={k} transform={`translate(${x} 0)`}>
            <ellipse cx="0" cy="0" rx="9" ry="4" />
            <path d="M6 -2L11 -9L14 -8L10 0Z" /><circle cx="13" cy="-9.4" r="2.6" />
            <path d="M12 -12L10 -18M12 -15L8 -16M14 -12L17 -17M15 -15L18 -14" strokeWidth="1.1" stroke="currentColor" fill="none" />
            <path d="M-6 2L-10 8M-3 3L-2 9M4 3L7 8M7 2L11 6" strokeWidth="1.6" stroke="currentColor" strokeLinecap="round" fill="none" />
        </g>
    );
    const outside = (
        <g clipPath={`url(#${u('glass')})`}>
            <rect x={GLASS.x} y={GLASS.y - 4} width={GLASS.w} height={GLASS.h + 8} fill={f('night')} />
            {WSTARS.map((s, k) => <circle key={k} className={k % 4 ? undefined : 'sc-star'} style={k % 4 ? undefined : after(-k * 0.31)} cx={r1(s.x)} cy={r1(s.y)} r={s.r} fill="#fff" opacity=".85" />)}
            <circle cx="262" cy="196" r="78" fill={f('moonGlow')} />
            <circle cx="262" cy="196" r="25" fill={f('moon')} />
            <g fill="#9dc4e0" opacity=".35"><circle cx="255" cy="189" r="5" /><circle cx="270" cy="204" r="3.4" /><circle cx="266" cy="186" r="2" /></g>
            <g className="sc-xsleigh">
                <g transform="translate(232 204) rotate(-8)" fill="#0d1d38" color="#0d1d38">
                    {deer('d1', 30)}{deer('d2', 52)}{deer('d3', 74)}
                    <path d="M18 -1L88 -6" stroke="#0d1d38" strokeWidth=".8" />
                    <path d="M-12 -4H12Q16 -4 14 2L11 6H-10Q-15 6 -16 0Q-16 -4 -12 -4Z" />
                    <path d="M-16 9H12Q16 9 17 6" stroke="#0d1d38" strokeWidth="1.4" fill="none" />
                    <circle cx="-3" cy="-8" r="4.4" /><path d="M-7 -10L-2 -19L2 -10Z" /><path d="M2 -6L8 -4" stroke="#0d1d38" strokeWidth="2.2" />
                    <path d="M-14 -4Q-18 -14 -10 -14Q-8 -10 -8 -4Z" />
                </g>
            </g>
            <path d="M96 404Q150 376 210 392T324 380V440H96Z" fill={f('hillFar')} />
            <path d="M96 424Q170 400 236 416T324 410V440H96Z" fill={f('hillNear')} />
            <g transform="translate(176 414)">
                <rect x="-16" y="-14" width="32" height="14" fill="#2a3a55" /><path d="M-20 -14L0 -28L20 -14Z" fill="#e8f1fa" />
                <rect x="-9" y="-10" width="8" height="7" fill="#ffd27a" /><rect x="4" y="-10" width="6" height="10" fill="#1a2438" />
                <circle cx="-5" cy="-6.5" r="12" fill={f('warmGlow')} opacity=".5" />
            </g>
            {[[118, 430, 0.5], [146, 434, 0.66], [292, 430, 0.56], [316, 436, 0.78], [222, 430, 0.42]].map(([x, y, s]) => (
                <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
                    <rect x="-4" y="-10" width="8" height="12" fill="#2b2016" />
                    {pineTier(-54, -8, 34, '#123049', '#e8f1fa')}{pineTier(-86, -34, 28, '#123049', '#e8f1fa')}{pineTier(-114, -62, 22, '#123049', '#e8f1fa')}{pineTier(-134, -88, 15, '#123049', '#e8f1fa')}
                </g>
            ))}
            {[false, true].map((near) => (
                <g key={String(near)} className={`sc-wsnow ${near ? 'sc-wsnow-b' : ''}`}>
                    {[0, -GLASS.h].map((dy) => WSNOW.filter((s) => s.near === near).map((s, k) => <circle key={`${dy}-${k}`} cx={s.x} cy={r1(s.y + dy)} r={s.r} fill="#fff" opacity={near ? 0.95 : 0.7} />))}
                </g>
            ))}
            <rect x={GLASS.x} y={GLASS.y} width={GLASS.w} height={GLASS.h} fill={f('frost')} />
            <path d={`M${GLASS.x + 40} ${GLASS.y + GLASS.h}L${GLASS.x + 150} ${GLASS.y}H${GLASS.x + 176}L${GLASS.x + 66} ${GLASS.y + GLASS.h}Z`} fill="#fff" opacity=".05" />
        </g>
    );

    const wreath = (cx: number, cy: number, r: number) => (
        <g>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#0d3a20" strokeWidth="15" />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1f7a3e" strokeWidth="12" strokeDasharray="2.4 3" />
            <circle cx={cx} cy={cy} r={r - 2} fill="none" stroke="#3cc06e" strokeWidth="4" strokeDasharray="2 6" opacity=".7" />
            {Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4 + 0.3; return <circle key={i} cx={r1(cx + Math.cos(a) * r)} cy={r1(cy + Math.sin(a) * r)} r="3" fill="#dc2626" />; })}
            {bow('wb', cx, cy + r - 2, 0.62)}
        </g>
    );

    // a velvet curtain from the rod to the floor, gathered by a gold rope halfway
    const drape = (
        <g>
            <path d="M28 92H122C118 196 108 282 98 330C112 420 124 520 130 628H18C22 520 36 420 52 330C40 282 32 196 28 92Z" fill={f('velvet')} />
            <path d="M52 96C54 200 66 280 70 330C66 420 54 520 48 624M86 96C86 200 84 280 80 330C86 420 98 520 104 624" fill="none" stroke="#4a0710" strokeWidth="4" opacity=".55" />
            <path d="M40 96C42 200 50 280 58 330M108 96C104 200 96 280 92 330" fill="none" stroke="#e35a68" strokeWidth="2" opacity=".35" />
            <path d="M48 326Q75 342 102 326" fill="none" stroke="#d4a017" strokeWidth="5" strokeLinecap="round" />
            <path d="M98 330Q110 344 106 360" fill="none" stroke="#d4a017" strokeWidth="2.4" />
            <path d="M100 358H112L114 382H98Z" fill="#c9a227" /><circle cx="106" cy="358" r="4.4" fill="#e8b923" />
            <path d="M100 382V390M104 382V392M108 382V391M112 382V389" stroke="#c9a227" strokeWidth="1.4" />
        </g>
    );

    // ----- the tree -----
    const tree = (
        <g transform={`translate(${TREE.x} 0)`}>
            <ellipse cx="0" cy="360" rx="240" ry="320" fill={f('treeGlow')} />
            <rect x="-16" y="590" width="32" height={TREE.base - 588} fill="#5b3418" />
            {TIERS.map((t, i) => {
                const d = tierPath(t);
                const y0 = t.a + (t.b - t.a) * 0.38;
                const y1 = t.a + (t.b - t.a) * 0.8;
                const hw0 = (t.w * (y0 - t.a)) / (t.b - t.a);
                const hw1 = (t.w * (y1 - t.a)) / (t.b - t.a);
                const rib = `M${r1(-hw0 - 4)} ${r1(y0)}Q${r1((hw1 - hw0) / 2)} ${r1((y0 + y1) / 2 + 16)} ${r1(hw1 + 4)} ${r1(y1)}`;

                return (
                    <g key={i}>
                        <path d={d} fill={f('treeG')} />
                        <path d={d} fill={f('treeShade')} />
                        {[0.42, 0.72].map((v) => {
                            const yy = t.a + (t.b - t.a) * v;
                            const hw = (t.w * (yy - t.a)) / (t.b - t.a);

                            return <path key={v} d={`M${r1(-hw * 0.15)} ${r1(yy - 10)}Q${r1(-hw * 0.5)} ${r1(yy)} ${r1(-hw * 0.92)} ${r1(yy + 12)}M${r1(hw * 0.15)} ${r1(yy - 10)}Q${r1(hw * 0.5)} ${r1(yy)} ${r1(hw * 0.92)} ${r1(yy + 12)}`} stroke="#0a3320" strokeWidth="2.4" strokeOpacity=".55" fill="none" />;
                        })}
                        <path d={`M0 ${t.a + 4}L${r1(-t.w * 0.6)} ${r1(t.a + (t.b - t.a) * 0.62)}`} stroke="#5be08a" strokeOpacity=".35" strokeWidth="3" fill="none" />
                        <path d={rib} fill="none" stroke="#a37b12" strokeWidth="10" strokeLinecap="round" />
                        <path d={rib} fill="none" stroke="#b91c1c" strokeWidth="7" strokeLinecap="round" />
                        <path d={rib} fill="none" stroke="#fca5a5" strokeOpacity=".45" strokeWidth="1.6" strokeLinecap="round" transform="translate(0 -1.6)" />
                    </g>
                );
            })}
            {TLIGHTS.map((l, i) => bulb(`tl${i}`, l.x, l.y, i, 2.6, 9))}
            {TBALLS.map((o, i) => (
                <g key={i}>
                    <rect x={r1(o.x - 2.2)} y={r1(o.y - o.r - 3.6)} width="4.4" height="4.4" rx="1" fill="#d4a017" />
                    <circle cx={o.x} cy={o.y} r={o.r} fill={o.c} />
                    <circle cx={o.x} cy={o.y} r={o.r} fill={f('shine')} />
                </g>
            ))}
            {[[-58, 284, 1], [52, 360, -1], [-96, 452, 1], [104, 520, -1], [-20, 556, 1]].map(([x, y, s]) => (
                <g key={x} fill="none" strokeLinecap="round" transform={`translate(${x} ${y}) scale(${s} 1)`}>
                    <path d="M0 0V-16Q0 -22 5 -22Q10 -22 10 -17" stroke="#b91c1c" strokeWidth="3.6" />
                    <path d="M0 0V-16Q0 -22 5 -22Q10 -22 10 -17" stroke="#fff" strokeWidth="3.6" strokeDasharray="2.4 2.4" />
                </g>
            ))}
            <g className="sc-pulse">
                <circle cx="0" cy="100" r="58" fill={f('starGlow')} />
                {[0, 45, 90, 135].map((a) => <path key={a} d="M0 52V148" stroke="#fde68a" strokeWidth="1.6" opacity=".5" transform={`rotate(${a} 0 100)`} />)}
                <path d={star(5, 24, 10)} transform="translate(0 100)" fill={f('gold')} stroke="#fff3b0" strokeWidth="1.6" strokeLinejoin="round" />
            </g>
            <ellipse cx="0" cy={TREE.base - 4} rx="150" ry="20" fill="#9b1220" />
            <ellipse cx="0" cy={TREE.base - 4} rx="150" ry="20" fill="none" stroke="#f6f1e7" strokeWidth="6" strokeDasharray="5 3" />
            {gift('tg1', -150, 606, 52, 40, '#c81e1e', '#e8b923')}
            {gift('tg2', -96, 618, 42, 32, '#166534', '#f8fafc')}
            {gift('tg3', 44, 602, 56, 44, '#e8b923', '#b91c1c')}
            {gift('tg4', 104, 620, 40, 30, '#f8fafc', '#c81e1e')}
            {gift('tg5', -44, 626, 34, 24, '#9b1c31', '#e8b923')}
        </g>
    );

    // ----- the floor: boards that run away from us, two to each column of the floor's grid, the ends staggered -----
    const boards: JSX.Element[] = [];
    const ends: string[] = [];
    for (let j = 0; j < 14 && rowY(j) < height; j++) {
        const y0 = rowY(j);
        const y1 = rowY(j + 1);
        for (let k = -16; k < 16; k++) {
            const v = (((k * 7 + Math.floor((j + (k & 1)) / 2) * 13) % 4) + 4) % 4;
            boards.push(<polygon key={`${k}-${j}`} points={`${r1(lineX(k / 2, y0))},${r1(y0)} ${r1(lineX((k + 1) / 2, y0))},${r1(y0)} ${r1(lineX((k + 1) / 2, y1))},${r1(y1)} ${r1(lineX(k / 2, y1))},${r1(y1)}`} fill={WOOD[v]} />);
            if (j > 0 && (j + (k & 1)) % 2 === 0) ends.push(`M${r1(lineX(k / 2, y0))} ${r1(y0)}H${r1(lineX((k + 1) / 2, y0))}`);
        }
    }

    // ----- the toy train: it comes out of a snowy tunnel and runs off to the right -----
    const train = (
        <g>
            <rect x="-42" y="-20" width="48" height="14" rx="2" fill="#b91c1c" stroke="#5c0b12" />
            <rect x="-42" y="-20" width="48" height="3" fill="#e8b923" />
            <rect x="-36" y="-31" width="14" height="12" fill="#166534" /><rect x="-30.4" y="-31" width="2.8" height="12" fill="#e8b923" />
            <rect x="-19" y="-27" width="12" height="8" fill="#e8b923" /><rect x="-14" y="-27" width="2.4" height="8" fill="#b91c1c" />
            <path d="M-4 -20L-2 -34L0 -20Z" fill="#15803d" />
            <path d="M6 -9H14" stroke="#333" strokeWidth="2" />
            <rect x="14" y="-22" width="26" height="16" rx="2" fill="#1f2937" />
            <path d="M16 -22Q21 -30 27 -24Q33 -31 38 -22Z" fill="#0b0b0b" />
            <rect x="14" y="-13" width="26" height="2.4" fill="#e8b923" />
            <path d="M40 -9H44" stroke="#333" strokeWidth="2" />
            <rect x="44" y="-10" width="58" height="5" fill="#111" />
            <rect x="44" y="-41" width="20" height="32" rx="2" fill="#b91c1c" />
            <rect x="41" y="-45" width="26" height="5" rx="2" fill="#111" />
            <rect x="49" y="-36" width="10" height="9" rx="1.5" fill="#ffd27a" />
            <rect x="62" y="-31" width="36" height="21" rx="9" fill="#c81e1e" />
            <path d="M74 -31V-10M86 -31V-10" stroke="#e8b923" strokeWidth="2.4" />
            <path d="M86 -31V-42H82L84 -49H96L98 -42H94V-31Z" fill="#111" />
            <path d="M68 -31Q72 -39 76 -31Z" fill="#e8b923" />
            <rect x="96" y="-30" width="6" height="21" rx="2" fill="#111" />
            <circle cx="101" cy="-24" r="8" fill={f('warmGlow')} /><circle cx="101" cy="-24" r="3.2" fill="#fff3b0" />
            <path d="M100 -10L110 -2H100Z" fill="#e8b923" />
            {[[-32, 4.6], [-6, 4.6], [20, 4.6], [34, 4.6], [56, 7], [76, 7], [94, 4.4]].map(([x, r]) => (
                <g key={x}>
                    <circle cx={x} cy={-r} r={r} fill="#1a1a1a" stroke="#e8b923" strokeWidth="1.4" />
                    <circle cx={x} cy={-r} r="1.4" fill="#e8b923" />
                </g>
            ))}
            <path d="M56 -6H76" stroke="#d4d4d4" strokeWidth="1.6" />
            {[0, 1].map((k) => <circle key={k} className="sc-steam" style={after(-k * 2.4)} cx="90" cy="-56" r="7" fill="#f8fafc" />)}
        </g>
    );

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('wall')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#1e0709" /><stop offset=".45" stopColor="#3e0e13" /><stop offset="1" stopColor="#5a171c" /></linearGradient>
                <pattern id={u('paper')} width="48" height="64" patternUnits="userSpaceOnUse">
                    <rect width="24" height="64" fill="#000" opacity=".08" />
                    <path d="M36 26l3.4 6l-3.4 6l-3.4 -6Z" fill="#e8b923" opacity=".22" />
                    <circle cx="12" cy="0" r="1.6" fill="#e8b923" opacity=".16" /><circle cx="12" cy="64" r="1.6" fill="#e8b923" opacity=".16" />
                </pattern>
                <linearGradient id={u('beam')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#3a1f0e" /><stop offset=".7" stopColor="#24120a" /><stop offset="1" stopColor="#140a05" /></linearGradient>
                <linearGradient id={u('panel')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#5a3218" /><stop offset="1" stopColor="#3a1e0e" /></linearGradient>
                <linearGradient id={u('stoneLight')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#000" stopOpacity=".45" /><stop offset=".55" stopColor="#000" stopOpacity=".1" /><stop offset="1" stopColor="#ff9a3c" stopOpacity=".18" /></linearGradient>
                <linearGradient id={u('chimSide')} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#000" stopOpacity=".5" /><stop offset=".08" stopColor="#000" stopOpacity="0" /><stop offset=".92" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".5" /></linearGradient>
                <linearGradient id={u('ao')} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".45" /></linearGradient>
                <linearGradient id={u('gold')} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff1b8" /><stop offset=".45" stopColor="#e2b13c" /><stop offset="1" stopColor="#8a5a10" /></linearGradient>
                <linearGradient id={u('goldV')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f7d774" /><stop offset=".5" stopColor="#c99a2e" /><stop offset="1" stopColor="#7a4f0c" /></linearGradient>
                <linearGradient id={u('brass')} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f5d77a" /><stop offset="1" stopColor="#8a6410" /></linearGradient>
                <linearGradient id={u('mantel')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8a5530" /><stop offset=".25" stopColor="#6a3c1e" /><stop offset="1" stopColor="#3a1e0c" /></linearGradient>
                <linearGradient id={u('wax')} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#fff6e4" /><stop offset=".55" stopColor="#f2e0bf" /><stop offset="1" stopColor="#c7a87e" /></linearGradient>
                <linearGradient id={u('flame')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff7c2" /><stop offset=".45" stopColor="#ffd24a" /><stop offset="1" stopColor="#ff7a1a" /></linearGradient>
                <linearGradient id={u('fire')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff1a8" stopOpacity="0" /><stop offset=".25" stopColor="#ffd24a" /><stop offset=".65" stopColor="#ff8a1f" /><stop offset="1" stopColor="#e2380f" /></linearGradient>
                <linearGradient id={u('fireCore')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fffbe0" stopOpacity="0" /><stop offset=".4" stopColor="#fff2a8" /><stop offset="1" stopColor="#ffc23a" /></linearGradient>
                <radialGradient id={u('flameGlow')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffd27a" stopOpacity=".55" /><stop offset=".45" stopColor="#ffa940" stopOpacity=".18" /><stop offset="1" stopColor="#ff9a1f" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('warmGlow')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffe08a" stopOpacity=".85" /><stop offset=".5" stopColor="#ffb347" stopOpacity=".25" /><stop offset="1" stopColor="#ffb347" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('hearthGlow')} cx="800" cy="560" r="560" gradientUnits="userSpaceOnUse"><stop stopColor="#ff9a3c" stopOpacity=".42" /><stop offset=".4" stopColor="#ff6a1a" stopOpacity=".14" /><stop offset="1" stopColor="#ff6a1a" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('firebox')} cx="800" cy="610" r="190" gradientUnits="userSpaceOnUse"><stop stopColor="#ff8a2a" stopOpacity=".9" /><stop offset=".35" stopColor="#8a2a0c" /><stop offset="1" stopColor="#140504" /></radialGradient>
                <radialGradient id={u('treeGlow')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffd27a" stopOpacity=".22" /><stop offset=".6" stopColor="#ffb347" stopOpacity=".06" /><stop offset="1" stopColor="#ffb347" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('starGlow')} cx=".5" cy=".5" r=".5"><stop stopColor="#fde68a" stopOpacity=".9" /><stop offset=".4" stopColor="#fbbf24" stopOpacity=".3" /><stop offset="1" stopColor="#fbbf24" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('shine')} cx=".34" cy=".3" r=".7"><stop stopColor="#fff" stopOpacity=".9" /><stop offset=".35" stopColor="#fff" stopOpacity=".15" /><stop offset="1" stopColor="#000" stopOpacity=".3" /></radialGradient>
                <linearGradient id={u('treeG')} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#2f9a52" /><stop offset=".5" stopColor="#17693c" /><stop offset="1" stopColor="#0a3d23" /></linearGradient>
                <linearGradient id={u('treeShade')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#000" stopOpacity="0" /><stop offset=".65" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".34" /></linearGradient>
                <linearGradient id={u('velvet')} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#5e0a14" /><stop offset=".35" stopColor="#a8172a" /><stop offset=".6" stopColor="#c21f33" /><stop offset="1" stopColor="#6e0c18" /></linearGradient>
                <linearGradient id={u('night')} x1="0" y1="0" x2="0" y2="1"><stop offset=".0" stopColor="#040b20" /><stop offset=".5" stopColor="#0f2a52" /><stop offset="1" stopColor="#3a6c98" /></linearGradient>
                <radialGradient id={u('moonGlow')} cx=".5" cy=".5" r=".5"><stop stopColor="#e0f4ff" stopOpacity=".5" /><stop offset=".45" stopColor="#7cc4f0" stopOpacity=".14" /><stop offset="1" stopColor="#4aa7e0" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('moon')} cx=".38" cy=".34" r=".8"><stop stopColor="#ffffff" /><stop offset=".6" stopColor="#e9f5ff" /><stop offset="1" stopColor="#b4d6ee" /></radialGradient>
                <linearGradient id={u('hillFar')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#b9d3ea" /><stop offset="1" stopColor="#6f93ba" /></linearGradient>
                <linearGradient id={u('hillNear')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f4faff" /><stop offset="1" stopColor="#b6cfe6" /></linearGradient>
                <radialGradient id={u('frost')} cx=".5" cy=".42" r=".75"><stop offset=".62" stopColor="#ffffff" stopOpacity="0" /><stop offset="1" stopColor="#eaf6ff" stopOpacity=".62" /></radialGradient>
                <linearGradient id={u('paint')} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#f3ece0" /><stop offset="1" stopColor="#cdbfa8" /></linearGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <linearGradient id={u('gloss')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffd9a0" stopOpacity=".16" /><stop offset="1" stopColor="#ffd9a0" stopOpacity="0" /></linearGradient>
                <radialGradient id={u('floorFire')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffb347" stopOpacity=".38" /><stop offset=".5" stopColor="#ff8a3c" stopOpacity=".12" /><stop offset="1" stopColor="#ff8a3c" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('sack')} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#6e0c14" /><stop offset=".45" stopColor="#b51d2a" /><stop offset="1" stopColor="#5c0a12" /></linearGradient>
                <pattern id={u('plaid')} width="18" height="18" patternUnits="userSpaceOnUse">
                    <rect width="18" height="18" fill="#a3141f" /><rect y="6" width="18" height="6" fill="#14532d" opacity=".75" /><rect x="6" width="6" height="18" fill="#14532d" opacity=".55" />
                    <path d="M0 9H18M9 0V18" stroke="#e8b923" strokeWidth=".8" opacity=".6" />
                </pattern>
                <linearGradient id={u('snowMound')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffffff" /><stop offset="1" stopColor="#bcd4ea" /></linearGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ff9a3c" stopOpacity="0" /><stop offset="1" stopColor={p.floorBottom} stopOpacity=".62" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".6" /></radialGradient>
                <filter id={u('soft')} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" /></filter>
                <clipPath id={u('glass')}><path d={glassPath} /></clipPath>
                <clipPath id={u('chim')}><rect x={CH.x} y="0" width={CH.w} height={FLOOR} /></clipPath>
                <clipPath id={u('opening')}><path d="M650 616V544Q650 486 800 486Q950 486 950 544V616Z" /></clipPath>
            </defs>

            {/* the walls: red wallpaper with a little gold, a timber beam along the ceiling, wood panelling below a rail */}
            <rect width="1600" height={FLOOR} fill={f('wall')} />
            <rect width="1600" height={FLOOR} fill={f('paper')} />
            <rect width="1600" height="30" fill={f('beam')} />
            <rect y="27" width="1600" height="3" fill="#000" opacity=".5" />
            <rect y="2" width="1600" height="2" fill="#c08a52" opacity=".25" />
            {[[0, CH.x], [CH.x + CH.w, 1600]].map(([x0, x1]) => {
                const n = Math.max(1, Math.round((x1 - x0) / 140));
                const w = (x1 - x0) / n;

                return (
                    <g key={x0}>
                        <rect x={x0} y="468" width={x1 - x0} height={FLOOR - 468} fill={f('panel')} />
                        {Array.from({ length: n }, (_, k) => (
                            <g key={k}>
                                <rect x={r1(x0 + k * w + 16)} y="490" width={r1(w - 32)} height="106" rx="3" fill="#000" opacity=".12" stroke="#22110a" strokeWidth="3" />
                                <rect x={r1(x0 + k * w + 19)} y="493" width={r1(w - 38)} height="100" rx="2" fill="none" stroke="#b07440" strokeOpacity=".3" strokeWidth="1.4" />
                            </g>
                        ))}
                        <rect x={x0} y="460" width={x1 - x0} height="12" fill="#5a3418" />
                        <rect x={x0} y="460" width={x1 - x0} height="3" fill="#c48d55" opacity=".5" />
                        <rect x={x0} y={FLOOR - 16} width={x1 - x0} height="16" fill="#22110a" />
                    </g>
                );
            })}
            <rect x={CH.x - 46} width="46" height={FLOOR} fill={f('ao')} />
            <rect x={CH.x + CH.w} width="46" height={FLOOR} fill={f('ao')} transform={`translate(${2 * (CH.x + CH.w) + 46} 0) scale(-1 1)`} />

            {/* the window on the left: the night outside, the white frame, a wreath, the sill with candles and a poinsettia */}
            <path d="M78 450V238A132 132 0 0 1 342 238V450Z" fill={f('paint')} />
            <path d="M78 450V238A132 132 0 0 1 342 238V450Z" fill="none" stroke="#9a8a72" strokeWidth="1.4" />
            {outside}
            <g fill={f('paint')}>
                <rect x="205" y={GLASS.y} width="10" height={GLASS.h} />
                <rect x={GLASS.x} y="233" width={GLASS.w} height="10" />
                <rect x={GLASS.x} y="333" width={GLASS.w} height="10" />
            </g>
            <path d="M210 238L129 157M210 238L291 157" stroke="#ece4d6" strokeWidth="6" />
            <path d={glassPath} fill="none" stroke="#b8a68a" strokeWidth="3" />
            {wreath(210, 288, 30)}
            <rect x="62" y="436" width="296" height="14" rx="2" fill="#f4eee3" />
            <rect x="66" y="450" width="288" height="10" fill="#cfc2ac" />
            <ellipse cx="210" cy="464" rx="150" ry="6" fill="#000" opacity=".3" />
            {candle('wc1', 142, 436, 26, 1)}
            {candle('wc2', 278, 436, 26, 4)}
            <g transform="translate(210 436)">
                <path d="M-15 0L-18 -20H18L15 0Z" fill={f('goldV')} />
                {Array.from({ length: 7 }, (_, i) => <path key={i} d="M0 -22L-6 -40L0 -50L6 -40Z" fill={i % 2 ? '#b91c1c' : '#dc2626'} transform={`rotate(${-75 + i * 25} 0 -22)`} />)}
                <circle cx="0" cy="-23" r="3.4" fill="#e8b923" />
            </g>
            {/* the curtains */}
            {drape}
            <g transform="translate(420 0) scale(-1 1)">{drape}</g>
            <path d="M24 90H396V114Q302 154 210 124Q118 154 24 114Z" fill={f('velvet')} />
            <path d="M24 114Q118 154 210 124Q302 154 396 114" fill="none" stroke="#d4a017" strokeWidth="5" strokeDasharray="1.6 2.2" />
            <circle cx="210" cy="126" r="7" fill="#e8b923" stroke="#8a5a00" />
            <rect x="20" y="85" width="380" height="7" rx="3.4" fill={f('brass')} />
            <circle cx="20" cy="88.5" r="8.5" fill={f('brass')} /><circle cx="400" cy="88.5" r="8.5" fill={f('brass')} />

            {/* milk and cookies for Santa, on a little table under the window */}
            <g transform="translate(236 0)">
                <ellipse cx="0" cy="616" rx="30" ry="5" fill="#000" opacity=".35" />
                <path d="M-5 548H5L8 612H-8Z" fill="#5a3418" />
                <ellipse cx="0" cy="613" rx="20" ry="4" fill="#4a2a12" />
                <ellipse cx="0" cy="550" rx="50" ry="10" fill="#6e4122" />
                <ellipse cx="0" cy="547" rx="50" ry="10" fill="#8a5530" />
                <ellipse cx="-12" cy="543" rx="22" ry="5.4" fill="#f4f1ea" stroke="#c9c1b0" />
                {[[-22, 540], [-12, 537], [-3, 541], [-14, 543]].map(([x, y], k) => (
                    <g key={k}>
                        <ellipse cx={x} cy={y} rx="8" ry="3.2" fill="#c9893f" stroke="#8a5a28" strokeWidth=".8" />
                        <circle cx={x - 2} cy={y - 0.6} r=".9" fill="#3a1f0e" /><circle cx={x + 2.4} cy={y + 0.4} r=".9" fill="#3a1f0e" />
                    </g>
                ))}
                <path d="M16 520H30L29 546H17Z" fill="#fafafa" opacity=".95" stroke="#d4d4d4" />
                <path d="M18 524H28" stroke="#fff" strokeWidth="2" />
            </g>

            {/* the chimney breast: stones, the light of the fire on them, a sconce either side of the picture */}
            <g clipPath={`url(#${u('chim')})`}>
                <rect x={CH.x} width={CH.w} height={FLOOR} fill="#2c2019" />
                {STONES.map((s, k) => (
                    <g key={k}>
                        <rect x={s.x} y={s.y + 2} width={s.w} height={s.h} rx="11" fill="#1b130e" opacity=".7" />
                        <rect x={s.x} y={s.y} width={s.w} height={s.h - 1} rx="11" fill={STONE[s.c]} />
                        <path d={`M${s.x + 9} ${s.y + 3}H${s.x + s.w - 12}`} stroke="#fff" strokeOpacity=".12" strokeWidth="2" strokeLinecap="round" />
                    </g>
                ))}
                <rect x={CH.x} width={CH.w} height={FLOOR} fill={f('stoneLight')} />
                <rect x={CH.x} width={CH.w} height={FLOOR} fill={f('chimSide')} />
            </g>
            {sconce('sc1', 442, 200, 0)}
            {sconce('sc2', 1158, 200, 2)}

            {/* the gold frame the video hangs in, with a garland down each side */}
            <rect x={tv.x - 44} y={tv.y - 40} width={tv.w + 88} height={tv.h + 84} rx="16" fill="#ffcf6b" opacity=".2" filter={`url(#${u('soft')})`} />
            <rect x={tv.x - 34} y={tv.y - 34} width={tv.w + 68} height={tv.h + 64} rx="5" fill={f('gold')} />
            <rect x={tv.x - 34} y={tv.y - 34} width={tv.w + 68} height={tv.h + 64} rx="5" fill="none" stroke="#6b4508" strokeWidth="2" />
            <rect x={tv.x - 22} y={tv.y - 22} width={tv.w + 44} height={tv.h + 40} rx="3" fill="none" stroke="#fff3c4" strokeOpacity=".7" strokeWidth="2.4" strokeDasharray="1.4 4" />
            <rect x={tv.x - 14} y={tv.y - 14} width={tv.w + 28} height={tv.h + 26} rx="2" fill="#2a170a" stroke="#8a5a10" strokeWidth="2" />
            {[tv.x - 17, tv.x + tv.w + 17].map((x) => (
                <g key={x}>
                    <circle cx={x} cy={tv.y + tv.h + 13} r="11" fill={f('gold')} stroke="#6b4508" />
                    {Array.from({ length: 6 }, (_, i) => <circle key={i} cx={r1(x + Math.cos((i * Math.PI) / 3) * 7)} cy={r1(tv.y + tv.h + 13 + Math.sin((i * Math.PI) / 3) * 7)} r="3" fill="#fff1b8" opacity=".75" />)}
                </g>
            ))}
            {[1, -1].map((s) => (
                <g key={s} transform={s < 0 ? 'translate(1600 0) scale(-1 1)' : undefined}>
                    <path d="M482 -6C462 50 498 104 474 158S468 230 488 262" fill="none" stroke="#0d3a20" strokeWidth="18" strokeLinecap="round" />
                    <path d="M482 -6C462 50 498 104 474 158S468 230 488 262" fill="none" stroke="#166534" strokeWidth="15" strokeLinecap="round" strokeDasharray="2.2 3" />
                    <path d="M482 -6C462 50 498 104 474 158S468 230 488 262" fill="none" stroke="#2fae63" strokeWidth="6" strokeLinecap="round" strokeDasharray="3 5" opacity=".7" />
                    {[[478, 40], [480, 98], [476, 150], [474, 206]].map(([x, y], i) => bulb(`fg${s}${i}`, x + (i % 2 ? 9 : -8), y, i + 1))}
                    {berries(`fb${s}`, 478, 124)}
                    {cone(`fc${s}`, 484, 268, 8)}
                    {ornament(`fo${s}`, 488, 262, 12, 9, s > 0 ? '#c81e1e' : '#e8b923', s > 0 ? 0 : -1.4)}
                    {bow(`fw${s}`, 490, 18, 0.8)}
                </g>
            ))}

            {/* the mantel: a heavy beam on two brackets, a garland along it, candles and a nutcracker at each end */}
            <rect x="462" y="396" width="676" height="28" rx="3" fill={f('mantel')} />
            <rect x="462" y="396" width="676" height="5" rx="2" fill="#a26a3c" />
            <rect x="476" y="424" width="648" height="10" fill="#2e170a" />
            {[506, 1094].map((x) => <path key={x} d={`M${x - 15} 434H${x + 15}V452Q${x + 15} 474 ${x} 478Q${x - 15} 474 ${x - 15} 452Z`} fill="#4a2810" stroke="#22110a" strokeWidth="1.4" />)}
            {nutcracker('nl', 492, 397)}
            {nutcracker('nr', 1108, 397)}
            {candle('mc1', 548, 397, 40, 0)}
            {candle('mc2', 575, 397, 27, 2)}
            {candle('mc3', 1052, 397, 40, 3)}
            {candle('mc4', 1025, 397, 27, 5)}
            <path d="M470 394C560 388 650 400 800 394S1040 388 1130 394" fill="none" stroke="#0d3a20" strokeWidth="16" strokeLinecap="round" />
            <path d="M470 394C560 388 650 400 800 394S1040 388 1130 394" fill="none" stroke="#166534" strokeWidth="13" strokeLinecap="round" strokeDasharray="2.2 3" />
            <path d="M470 392C560 386 650 398 800 392S1040 386 1130 392" fill="none" stroke="#2fae63" strokeWidth="5" strokeLinecap="round" strokeDasharray="3 5" opacity=".7" />
            {Array.from({ length: 15 }, (_, i) => bulb(`ml${i}`, 488 + i * 44.6, 398 + (i % 2 ? 2 : -2), i + 2, 3, 11))}
            {[600, 690, 910, 1000].map((x, i) => (i % 2 ? cone(`mcn${i}`, x + 22, 400, 70) : berries(`mb${i}`, x + 22, 398)))}
            {[470, 1130].map((x, i) => (
                <g key={x}>
                    <path d={`M${x} 394C${x + (i ? 8 : -8)} 420 ${x + (i ? -4 : 4)} 444 ${x + (i ? 6 : -6)} 466`} fill="none" stroke="#0d3a20" strokeWidth="13" strokeLinecap="round" />
                    <path d={`M${x} 394C${x + (i ? 8 : -8)} 420 ${x + (i ? -4 : 4)} 444 ${x + (i ? 6 : -6)} 466`} fill="none" stroke="#1f7a3e" strokeWidth="10" strokeLinecap="round" strokeDasharray="2 3" />
                    {bulb(`me${i}`, x + (i ? 4 : -4), 432, i + 5, 3, 11)}
                    {cone(`mec${i}`, x + (i ? 6 : -6), 474, 0)}
                </g>
            ))}

            {/* the fireplace: an arch of stones, firebricks, the logs and the fire */}
            <ellipse cx="800" cy="560" rx="300" ry="170" fill={f('flameGlow')} opacity=".8" />
            <path d="M622 618V540Q622 460 800 460Q978 460 978 540V618Z" fill="#6b5a4e" />
            <path d="M636 618V542Q636 473 800 473Q964 473 964 542V618" fill="none" stroke="#86705f" strokeWidth="24" strokeDasharray="30 4" />
            <path d="M622 618V540Q622 460 800 460Q978 460 978 540V618" fill="none" stroke="#2c2019" strokeWidth="2" />
            <path d="M784 452H816L812 490H788Z" fill="#9a8574" stroke="#2c2019" strokeWidth="1.6" />
            <g clipPath={`url(#${u('opening')})`}>
                <rect x="640" y="480" width="320" height="140" fill={f('firebox')} />
                {Array.from({ length: 9 }, (_, r) => Array.from({ length: 10 }, (_, c) => <rect key={`${r}-${c}`} x={642 + c * 34 - (r % 2) * 17} y={490 + r * 14} width="31" height="11" rx="1.5" fill="#5a2210" opacity={r1(0.3 + (r / 9) * 0.25)} />))}
                <path d="M650 486L700 506V600L650 616Z" fill="#000" opacity=".4" />
                <path d="M950 486L900 506V600L950 616Z" fill="#000" opacity=".4" />
            </g>
            <path d="M650 616V544Q650 486 800 486Q950 486 950 544V616" fill="none" stroke="#1a0f0a" strokeWidth="3" />
            <ellipse cx="800" cy="606" rx="120" ry="16" fill="#ff8a2a" opacity=".55" filter={`url(#${u('soft')})`} />
            {/* the logs and the andirons */}
            <g>
                {[[-10, 772], [12, 828]].map(([a, x]) => (
                    <g key={x} transform={`rotate(${a} ${x} 592)`}>
                        <rect x={x - 62} y="582" width="124" height="20" rx="10" fill="#5a3418" />
                        <path d={`M${x - 52} 588H${x + 20}M${x - 30} 596H${x + 44}`} stroke="#3a1f0e" strokeWidth="2" />
                        <ellipse cx={x + 61} cy="592" rx="6" ry="10" fill="#c8955a" stroke="#6b4226" />
                    </g>
                ))}
                <rect x="712" y="598" width="176" height="18" rx="9" fill="#4a2a14" />
                <ellipse cx="712" cy="607" rx="6" ry="9" fill="#b4834c" stroke="#6b4226" />
                {[700, 900].map((x) => (
                    <g key={x}>
                        <path d={`M${x} 616V578`} stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round" />
                        <circle cx={x} cy="574" r="7" fill={f('brass')} stroke="#6b4a10" />
                        <path d={`M${x - 12} 616H${x + 12}`} stroke="#1a1a1a" strokeWidth="5" strokeLinecap="round" />
                    </g>
                ))}
            </g>
            <g>
                {[[742, 56, 0], [772, 84, 0.3], [800, 102, 0.6], [830, 80, 0.15], [858, 60, 0.45]].map(([x, h, d]) => (
                    <path key={x} className="sc-blaze" style={after(-d)} d={`M${x} 600C${x - 26} ${600 - h * 0.35} ${x - 12} ${600 - h * 0.7} ${x} ${600 - h}C${x + 12} ${600 - h * 0.7} ${x + 26} ${600 - h * 0.35} ${x} 600Z`} fill={f('fire')} />
                ))}
                {[[770, 52, 0.2], [800, 74, 0.5], [830, 50, 0.1]].map(([x, h, d]) => (
                    <path key={x} className="sc-blaze" style={after(-d - 0.4)} d={`M${x} 600C${x - 14} ${600 - h * 0.35} ${x - 6} ${600 - h * 0.7} ${x} ${600 - h}C${x + 6} ${600 - h * 0.7} ${x + 14} ${600 - h * 0.35} ${x} 600Z`} fill={f('fireCore')} />
                ))}
                {[[748, 604], [790, 608], [826, 603], [866, 607], [810, 612]].map(([x, y], k) => <circle key={x} className="sc-twinkle" style={after(-k * 0.4)} cx={x} cy={y} r="2.4" fill="#ffd24a" />)}
            </g>

            {/* the stockings and the sign under the mantel */}
            {stocking('st1', 600, 0, -1, '#b91c1c', '#f6f1e7', 0)}
            {stocking('st2', 690, 1, -1, '#166534', '#b91c1c', 1)}
            {stocking('st3', 910, 2, 1, '#b91c1c', '#166534', 2)}
            {stocking('st4', 1000, 3, 1, '#14532d', '#f6f1e7', 3)}
            <path d="M774 434L770 448M826 434L830 448" stroke="#d6c7a1" strokeWidth="1.6" />
            <rect x="746" y="446" width="108" height="28" rx="5" fill="#6b3f20" stroke="#2e170a" strokeWidth="2" />
            <rect x="750" y="450" width="100" height="20" rx="3" fill="none" stroke="#a26a3c" strokeOpacity=".6" />
            <text x="800" y="466.4" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize="16" letterSpacing="1" fill="#f7d774">SFD.DJ</text>
            {berries('sb', 754, 448)}

            {/* the tree */}
            {tree}

            {/* the garlands along the beam */}
            {garland('gl1', -12, 205, 24, 28)}
            {garland('gl2', 205, CH.x + 4, 24, 26)}
            {garland('gr1', CH.x + CH.w - 4, 1395, 24, 26)}
            {garland('gr2', 1395, 1612, 24, 28)}
            {[[205, 30], [1395, 30]].map(([x, y]) => bow(`gb${x}`, x, y, 0.9))}
            {ornament('go1', 96, 58, 16, 10, '#e8b923', -0.6)}
            {ornament('go2', 310, 56, 14, 9, '#c81e1e', -2.1)}
            {ornament('go3', 1290, 56, 14, 9, '#e8b923', -1.2)}
            {ornament('go4', 1504, 58, 16, 10, '#c81e1e', -2.8)}

            {/* the floor: warm boards, a shine where the fire lights them */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            <g opacity=".62">{boards}</g>
            <g stroke="#1c0d05" strokeOpacity=".6" strokeWidth="1.2">
                {Array.from({ length: 33 }, (_, k) => k - 16).map((k) => <line key={k} x1={r1(lineX(k / 2, FLOOR))} y1={FLOOR} x2={r1(lineX(k / 2, height))} y2={height} />)}
                <path d={ends.join('')} fill="none" />
            </g>
            <rect y={FLOOR} width="1600" height="80" fill={f('gloss')} />
            <ellipse cx="800" cy="668" rx="460" ry="74" fill={f('floorFire')} />
            <ellipse cx="210" cy="660" rx="200" ry="30" fill="#9fc8ff" opacity=".07" />

            {/* the hearth stone, a basket of logs and the fire irons */}
            <path d="M592 612H1008L1016 622H584Z" fill="#a08a78" />
            <rect x="584" y="622" width="432" height="18" fill="#6b584c" />
            <path d="M584 640H1016" stroke="#000" strokeOpacity=".4" strokeWidth="3" />
            <g transform="translate(626 0)">
                <path d="M-26 600H26L22 628H-22Z" fill="#8a5a2b" stroke="#4a2a12" />
                <path d="M-24 608H24M-23 616H23M-22 624H22" stroke="#4a2a12" strokeWidth="1.2" opacity=".6" />
                {[[-12, 596], [4, 592], [16, 598]].map(([x, y]) => <g key={x}><circle cx={x} cy={y} r="8" fill="#c8955a" stroke="#6b4226" strokeWidth="1.4" /><circle cx={x} cy={y} r="3.6" fill="none" stroke="#8a5a2b" /></g>)}
            </g>
            <g transform="translate(978 0)" stroke="#1a1a1a" strokeLinecap="round" fill="none">
                <path d="M0 626V560" strokeWidth="3.4" /><ellipse cx="0" cy="627" rx="13" ry="3.4" fill="#1a1a1a" />
                <circle cx="0" cy="556" r="4.4" strokeWidth="2.4" stroke="#b8860b" />
                <path d="M-8 566V612M8 566V606" strokeWidth="2.4" /><path d="M-11 612H-5M5 606Q8 614 12 608" strokeWidth="2.4" />
            </g>

            {/* the rug under the booth: braided rings in red, cream and green */}
            <g transform={`translate(0 ${ext})`}>
                {([[384, 66, '#6e1218'], [366, 62, '#e9dcc2'], [346, 58, '#14532d'], [324, 54, '#b91c1c'], [298, 50, '#e9dcc2'], [270, 45, '#7f1d1d'], [240, 40, '#14532d'], [204, 34, '#e9dcc2']] as const).map(([rx, ry, c], k) => (
                    <g key={k}>
                        <ellipse cx="800" cy={SCENE.booth.y + 100} rx={rx} ry={ry} fill={c} />
                        <ellipse cx="800" cy={SCENE.booth.y + 100} rx={rx - 3} ry={ry - 1.4} fill="none" stroke="#000" strokeOpacity=".22" strokeWidth="2" strokeDasharray="5 4" />
                    </g>
                ))}
                <path d={star(8, 120, 50)} transform={`translate(800 ${SCENE.booth.y + 100}) scale(1 .17)`} fill="#e8b923" opacity=".85" />
                <ellipse cx="800" cy={SCENE.booth.y + 100} rx="384" ry="66" fill={f('floorFire')} />
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 4} rx="184" ry="15" fill="#000" opacity=".5" />
            </g>

            {withBooth && (
                <svg x={SCENE.booth.x} y={SCENE.booth.y + ext} width={SCENE.booth.w} height={SCENE.booth.h} viewBox="0 0 300 150" overflow="visible">
                    <BoothFrontArt u={(n) => `${uid}-b-${n}`} p={p} plate />
                </svg>
            )}

            <rect width="1600" height={height} fill={f('hearthGlow')} />
            <rect y="520" width="1600" height={height - 520} fill={f('haze')} />
            {/* the front corners: Santa's sack and a sleeping cat on the left, a toy train out of a snowy tunnel on the right */}
            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="160" cy="878" rx="150" ry="14" fill="#000" opacity=".42" />
                {gift('sk1', 84, 744, 40, 34, '#166534', '#e8b923', -14)}
                {gift('sk2', 128, 736, 36, 32, '#e8b923', '#b91c1c', 9)}
                <path d="M152 744L166 716L172 746Z" fill="#15803d" /><path d={sparkle(0.9)} transform="translate(166 714)" fill="#fde68a" />
                <path d="M58 872C28 840 32 790 70 764C86 754 104 752 128 754C152 752 172 756 186 766C222 792 224 842 196 872Z" fill={f('sack')} stroke="#4a0a0e" strokeWidth="2" />
                <path d="M92 776C86 804 88 838 98 866M150 772C160 804 160 838 152 868M122 764C118 804 120 840 124 870" stroke="#4a0710" strokeOpacity=".55" strokeWidth="3" fill="none" />
                <path d="M74 772Q128 790 184 772" fill="none" stroke="#e8b923" strokeWidth="4.4" strokeLinecap="round" />
                <path d="M182 774Q194 790 188 806" fill="none" stroke="#e8b923" strokeWidth="2.4" /><circle cx="188" cy="808" r="4.4" fill="#e8b923" />
                {gift('sk3', 214, 834, 46, 38, '#c81e1e', '#f8fafc')}
                {gift('sk4', 196, 852, 26, 20, '#f8fafc', '#166534', -6)}
                <g transform="translate(330 870)">
                    <ellipse cx="0" cy="6" rx="62" ry="9" fill="#000" opacity=".4" />
                    <path d="M-60 4Q-64 -18 -42 -22H42Q64 -18 60 4Q30 13 0 13Q-30 13 -60 4Z" fill={f('plaid')} stroke="#4a0a0e" strokeWidth="1.6" />
                    <ellipse cx="6" cy="-30" rx="40" ry="20" fill="#e2903e" />
                    <path d="M-12 -46Q-8 -32 -14 -16M4 -50Q8 -34 2 -14M20 -47Q24 -33 18 -17" stroke="#b8642a" strokeWidth="4" fill="none" strokeLinecap="round" />
                    <path d="M42 -24Q48 -8 20 -10Q-8 -12 -24 -15" stroke="#e2903e" strokeWidth="10" fill="none" strokeLinecap="round" />
                    <path d="M-16 -14Q-26 -16 -30 -18" stroke="#b8642a" strokeWidth="10" fill="none" strokeLinecap="round" />
                    <circle cx="-30" cy="-34" r="16" fill="#e8994a" />
                    <path d="M-44 -40L-47 -57L-34 -48ZM-24 -48L-14 -57L-16 -42Z" fill="#e8994a" />
                    <path d="M-42 -44L-44 -52L-37 -47Z" fill="#f4a3a3" />
                    <path d="M-38 -33q3 3 6 0M-27 -33q3 3 6 0" stroke="#5a2a10" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                    <path d="M-30 -28.4L-28 -26.4L-26 -28.4Z" fill="#e88a8a" />
                    <path d="M-30 -24Q-34 -20 -38 -22M-26 -24Q-22 -20 -18 -22" stroke="#5a2a10" strokeWidth="1" fill="none" opacity=".5" />
                    <path d="M-36 -47Q-28 -70 -6 -58L-14 -47Z" fill="#c81e1e" />
                    <path d="M-40 -46Q-26 -52 -12 -45" stroke="#f6f1e7" strokeWidth="6" strokeLinecap="round" fill="none" />
                    <circle cx="-5" cy="-58" r="5" fill="#f6f1e7" />
                    <text x="-2" y="-70" fontFamily={font} fontWeight="800" fontSize="12" fill="#fff" opacity=".7">z</text>
                    <text x="8" y="-82" fontFamily={font} fontWeight="800" fontSize="9" fill="#fff" opacity=".55">z</text>
                </g>
            </g>
            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="1470" cy="866" rx="190" ry="14" fill="#000" opacity=".35" />
                {gift('pp1', 1462, 806, 50, 40, '#c81e1e', '#e8b923')}
                {gift('pp2', 1516, 794, 42, 52, '#166534', '#f8fafc')}
                {gift('pp3', 1471, 776, 30, 24, '#e8b923', '#b91c1c')}
                {gift('pp4', 1562, 816, 34, 30, '#f8fafc', '#c81e1e')}
                <g>
                    {Array.from({ length: 24 }, (_, i) => <rect key={i} x={1300 + i * 13} y="849" width="5" height="12" rx="1" fill="#5a341c" />)}
                    <path d="M1296 852H1610M1296 859H1610" stroke="#a8a29e" strokeWidth="2" />
                </g>
                <g transform="translate(1438 856)">
                    <g className="sc-toytrain">{train}</g>
                </g>
                <path d="M1236 862C1250 812 1290 770 1338 764C1388 760 1424 800 1442 862Z" fill={f('snowMound')} />
                <path d="M1338 764C1388 760 1424 800 1442 862H1384C1394 822 1374 786 1338 764Z" fill="#9fbcd8" opacity=".45" />
                <path d="M1252 846C1290 830 1360 826 1430 840" fill="none" stroke="#9fbcd8" strokeWidth="3" opacity=".5" />
                {[[1278, 826], [1322, 800], [1362, 836]].map(([x, y]) => <path key={x} d={sparkle(0.5)} transform={`translate(${x} ${y})`} fill="#fff" />)}
                {[[1296, 788, 0.32], [1338, 776, 0.38], [1380, 790, 0.3]].map(([x, y, s]) => (
                    <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
                        <rect x="-4" y="-10" width="8" height="12" fill="#3b2412" />
                        {pineTier(-54, -8, 34, '#14532d')}{pineTier(-86, -34, 28, '#14532d')}{pineTier(-114, -62, 22, '#14532d')}
                    </g>
                ))}
                <path d="M1414 862V842Q1414 826 1425 824Q1437 826 1440 842V862Z" fill="#1a2433" stroke="#8aa0b8" strokeWidth="2" />
            </g>
            <rect width="1600" height={height} fill={f('vig')} />
        </svg>
    );
}
