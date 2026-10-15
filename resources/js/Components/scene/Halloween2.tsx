import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { skullGlyph } from '@/Components/scene/shapes';
import { after, r1, rand } from '@/Components/scene/util';
import { sparkle } from '@/lib/art/kit';
import { floorLineX as lineX, floorRowY as rowY, SCENE, ScenePalette } from '@/lib/scenes';
import { type JSX, useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const font = 'Figtree, system-ui, sans-serif';
const INK = '#0b0612'; // everything that is only a shape against the sky
const STONE = ['#2c1f42', '#33254c', '#271b3a', '#2f2246', '#3a2b55'];
const WOOD = ['#33201a', '#2a1914', '#3d261c', '#241510'];
const GLASS = { x: 96, y: 104, w: 228, h: 332 }; // the window on the left wall, from the point of its arch to the sill
const CAB = { x: 1204, y: 92, w: 364 }; // the witch's cabinet on the right wall: shelves at the top, drawers down to the floor
const FRAME = { x: tv.x - 32, y: tv.y - 40, w: tv.w + 64, h: tv.h + 78 }; // the black frame round the video

// the stones of the wall, row by row (the same every time)
const rs = rand(77);
const STONES: { x: number; y: number; w: number; h: number; c: number }[] = [];
for (let y = 26, row = 0; y < FLOOR; row++) {
    const h = 34 + Math.floor(rs() * 10);
    for (let x = -30 - (row % 2) * 40 - Math.floor(rs() * 20); x < 1600; ) {
        const w = 66 + Math.floor(rs() * 58);
        STONES.push({ x, y, w, h, c: Math.floor(rs() * STONE.length) });
        x += w + 4;
    }
    y += h + 4;
}

// outside the window: stars, and the leaded panes of the glass
const rw = rand(23);
const WSTARS = Array.from({ length: 24 }, () => ({ x: r1(GLASS.x + rw() * GLASS.w), y: r1(GLASS.y + 30 + rw() * 190), r: r1(0.6 + rw()) }));

// candles that float in the air on both sides of the video: x, y, height
const FLOATING: [number, number, number][] = [[392, 128, 34], [452, 214, 44], [384, 318, 30], [1150, 120, 40], [1184, 236, 30], [1144, 338, 46]];

// the bottles on the cabinet's shelves: x, shelf, kind, colour, height
const POTION = ['#a3e635', '#c084fc', '#fb923c', '#22d3ee', '#f472b6'];
const BOTTLES: [number, number, number, number, number][] = [
    [1236, 0, 0, 0, 46], [1282, 0, 1, 1, 62], [1404, 0, 2, 3, 40], [1436, 0, 1, 2, 54],
    [1240, 1, 2, 4, 44], [1404, 1, 0, 2, 50], [1446, 1, 1, 0, 58],
    [1238, 2, 1, 3, 52], [1288, 2, 0, 1, 42], [1474, 2, 2, 0, 38], [1508, 2, 1, 4, 50], [1540, 2, 0, 2, 36],
];
const SHELF = [208, 320, 432]; // the top of each shelf

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * Halloween V2 on a 1600 x 900 canvas: midnight in a witch's lair. A stone room where the video hangs in a black frame with a skull at each corner and the
 * name on a sign under it, and a cauldron bubbles green over a green fire below. On the left a pointed window looks out on a green moon with a witch on
 * her broom, bats, lightning and a graveyard, between torn purple curtains; on the right a tall cabinet full of glowing potions, a crystal ball and books,
 * with a raven on top. Candles float in the air, little jack-o'-lanterns hang along the ceiling, spiders hang from cobwebs, and in the front corners lie a
 * heap of jack-o'-lanterns with a black cat and an open spell book on a stand. A floor of dark boards with a spider-web rug under the booth.
 * Like the others it only moves while a song plays (`live`): flames flicker, candles float, the cauldron bubbles and steams, the witch flies across the moon,
 * lightning flashes, the lanterns swing and the spiders drop. Green and purple sparks rise over the whole room (RoomScene, Snow.tsx).
 */
export default function Halloween2Backdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down

    // ----- the little pieces -----
    /** A jack-o'-lantern with its middle at (x, y), `s` times its size (about 84 x 56). */
    const pumpkin = (k: string, x: number, y: number, s: number, d = 0, lit = true) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
            {lit && <ellipse className="sc-flame" style={after(d)} rx="74" ry="58" fill={f('orangeGlow')} />}
            <ellipse cx="-19" cy="1" rx="23" ry="26" fill={f('pumpkin')} />
            <ellipse cx="19" cy="1" rx="23" ry="26" fill={f('pumpkin')} />
            <ellipse rx="25" ry="28" fill={f('pumpkin')} />
            <path d="M-9 -26C-14 -8 -14 10 -9 27M9 -26C14 -8 14 10 9 27M-27 -18C-33 -4 -33 8 -27 20M27 -18C33 -4 33 8 27 20" stroke="#8a2f0a" strokeOpacity=".55" strokeWidth="1.8" fill="none" />
            <path d="M-3 -26Q-2 -37 6 -42L10 -37Q3 -34 3 -26Z" fill="#3f4a16" />
            {lit ? (
                <g className="sc-flame" style={after(d)}>
                    <path d="M-17 -2H-5L-11 -14ZM5 -2H17L11 -14Z" fill="#ffe08a" />
                    <path d="M0 1L-3 7H3Z" fill="#ffe08a" />
                    <path d="M-19 10Q0 26 19 10L14 19L9 14L4 21H-4L-9 14L-14 19Z" fill="#ffd25a" />
                </g>
            ) : (
                <path d="M-6 -24Q0 -20 6 -24" stroke="#ffb15c" strokeOpacity=".5" strokeWidth="2" fill="none" />
            )}
        </g>
    );

    /** A candle standing on (x, y), `h` tall; `lime` gives it a green witch's flame. */
    const candle = (k: string, x: number, y: number, h: number, i: number, lime = false, w = 12) => (
        <g key={k}>
            <circle className="sc-flame" style={after(-i * 0.37)} cx={x} cy={y - h - 10} r="30" fill={f(lime ? 'limeGlow' : 'flameGlow')} />
            <rect x={x - w / 2} y={y - h} width={w} height={h} rx="2" fill={f('wax')} />
            <path d={`M${x - w / 2} ${y - h + 1}q2 7 3.4 0q1.6 11 3.2 0q1.4 5 2.6 0q1.6 8 ${w - 9.2} 0`} fill="none" stroke="#f2ead8" strokeWidth="2" />
            <path d={`M${x} ${y - h}v-4`} stroke="#1a1010" strokeWidth="1.2" />
            <path className="sc-blaze" style={after(-i * 0.29)} d={`M${x} ${y - h - 17}Q${x + 5.6} ${y - h - 8} ${x + 3.4} ${y - h - 4}Q${x} ${y - h - 1.6} ${x - 3.4} ${y - h - 4}Q${x - 5.6} ${y - h - 8} ${x} ${y - h - 17}Z`} fill={f(lime ? 'limeFlame' : 'flame')} />
            <ellipse cx={x} cy={y - h - 5.6} rx="1.6" ry="2.6" fill="#fff" opacity=".85" />
        </g>
    );

    /** A bottle standing on (x, y): 0 round flask, 1 tall bottle, 2 squat jar. The liquid in it glows. */
    const bottle = (k: string, x: number, y: number, kind: number, ci: number, h: number, i: number) => {
        const c = POTION[ci];
        const glow = <circle className="sc-flame" style={after(-i * 0.45)} cx={x} cy={y - h * 0.4} r={h * 0.62} fill={f(`pg${ci}`)} />;
        if (kind === 0) {
            const r = h * 0.36;
            return (
                <g key={k}>
                    {glow}
                    <rect x={x - 4} y={y - h} width="8" height={h - r * 1.6} fill="#c9d6ff" opacity=".35" />
                    <circle cx={x} cy={y - r} r={r} fill="#d9e3ff" opacity=".22" />
                    <path d={`M${x - r * 0.92} ${y - r * 0.6}A${r} ${r} 0 0 0 ${x + r * 0.92} ${y - r * 0.6}Z`} fill={c} />
                    <circle cx={x} cy={y - r} r={r} fill="none" stroke="#e7ecff" strokeOpacity=".5" strokeWidth="1.4" />
                    <rect x={x - 5} y={y - h - 6} width="10" height="7" rx="1.5" fill="#8a5a2b" />
                    <circle cx={x - r * 0.4} cy={y - r * 1.3} r={r * 0.18} fill="#fff" opacity=".55" />
                </g>
            );
        }
        if (kind === 1) {
            return (
                <g key={k}>
                    {glow}
                    <path d={`M${x - 10} ${y}V${y - h * 0.58}Q${x - 10} ${y - h * 0.7} ${x - 4} ${y - h * 0.76}V${y - h}H${x + 4}V${y - h * 0.76}Q${x + 10} ${y - h * 0.7} ${x + 10} ${y - h * 0.58}V${y}Z`} fill="#d9e3ff" opacity=".2" stroke="#e7ecff" strokeOpacity=".45" strokeWidth="1.3" />
                    <rect x={x - 9} y={y - h * 0.52} width="18" height={h * 0.52 - 1} rx="1.5" fill={c} />
                    <rect x={x - 9} y={y - h * 0.4} width="18" height="9" fill="#e9dcc0" />
                    <path d={`M${x - 5} ${y - h * 0.36}h10M${x - 5} ${y - h * 0.32}h7`} stroke="#5a3a1a" strokeWidth="1" />
                    <rect x={x - 4.4} y={y - h - 5} width="8.8" height="6" rx="1.5" fill="#5a3418" />
                    <path d={`M${x - 6} ${y - h * 0.5}V${y - 4}`} stroke="#fff" strokeOpacity=".35" strokeWidth="2" />
                </g>
            );
        }

        return (
            <g key={k}>
                {glow}
                <rect x={x - 14} y={y - h} width="28" height={h} rx="5" fill="#d9e3ff" opacity=".18" stroke="#e7ecff" strokeOpacity=".45" strokeWidth="1.3" />
                <rect x={x - 13} y={y - h * 0.7} width="26" height={h * 0.7 - 1} rx="4" fill={c} opacity=".85" />
                <circle cx={x - 4} cy={y - h * 0.4} r="4" fill="#f8fafc" /><circle cx={x - 3} cy={y - h * 0.4} r="1.8" fill="#1e1b4b" />
                <circle cx={x + 5} cy={y - h * 0.22} r="3.4" fill="#f8fafc" /><circle cx={x + 6} cy={y - h * 0.22} r="1.5" fill="#1e1b4b" />
                <rect x={x - 15} y={y - h - 5} width="30" height="7" rx="2" fill="#4a2a14" />
            </g>
        );
    };

    /** A little bat hanging upside down from (x, y), asleep. */
    const sleeper = (k: string, x: number, y: number) => (
        <g key={k} fill={INK}>
            <path d={`M${x} ${y}V${y + 6}`} stroke={INK} strokeWidth="1.4" />
            <path d={`M${x - 7} ${y + 8}Q${x - 9} ${y + 22} ${x} ${y + 30}Q${x + 9} ${y + 22} ${x + 7} ${y + 8}Q${x} ${y + 4} ${x - 7} ${y + 8}Z`} />
            <path d={`M${x - 3} ${y + 30}l-2 4M${x + 3} ${y + 30}l2 4`} stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
        </g>
    );

    /** A cobweb in a corner at (x, y), reaching `r` along both walls; `sx`/`sy` turn it to the corner it sits in. */
    const web = (k: string, x: number, y: number, r: number, sx: number, sy: number) => {
        const spokes = [0, 22, 45, 68, 90].map((a) => [Math.cos((a * Math.PI) / 180) * r, Math.sin((a * Math.PI) / 180) * r]);
        const rings = [0.32, 0.58, 0.84].map((t) => spokes.map(([px, py], i) => `${i ? 'Q' + r1(((spokes[i - 1][0] + px) / 2) * t * 0.82) + ' ' + r1(((spokes[i - 1][1] + py) / 2) * t * 0.82) + ' ' : 'M'}${r1(px * t)} ${r1(py * t)}`).join(''));

        return (
            <g key={k} transform={`translate(${x} ${y}) scale(${sx} ${sy})`} fill="none" stroke="#d8d0ee" strokeOpacity=".4" strokeWidth="1.1">
                {spokes.map(([px, py], i) => <path key={i} d={`M0 0L${r1(px)} ${r1(py)}`} />)}
                {rings.map((d, i) => <path key={`r${i}`} d={d} />)}
            </g>
        );
    };

    /** A spider on a thread from (x, y); it lets itself down and climbs back while a song plays. */
    const spider = (k: string, x: number, y: number, len: number, d: number) => (
        <g key={k}>
            <path d={`M${x} ${y}V${y + len + 36}`} stroke="#d8d0ee" strokeOpacity=".35" strokeWidth=".9" />
            <g className="sc-drop" style={after(d)}>
                <path d={`M${x} ${y}V${y + len}`} stroke="#d8d0ee" strokeOpacity=".5" strokeWidth="1" />
                <g transform={`translate(${x} ${y + len + 8})`} fill={INK} stroke={INK} strokeLinecap="round">
                    <path d="M-4 -2L-11 -9L-15 -3M-4 0L-13 -2L-17 4M-4 2L-12 6L-14 13M-3 4L-8 11L-8 17M4 -2L11 -9L15 -3M4 0L13 -2L17 4M4 2L12 6L14 13M3 4L8 11L8 17" strokeWidth="1.6" fill="none" />
                    <ellipse cx="0" cy="3" rx="6" ry="7.4" />
                    <circle cx="0" cy="-5" r="4" />
                    <circle cx="-1.6" cy="-5.6" r="1" fill="#a3e635" stroke="none" /><circle cx="1.6" cy="-5.6" r="1" fill="#a3e635" stroke="none" />
                </g>
            </g>
        </g>
    );

    // ----- the window: a green moon, a witch on her broom, bats, lightning and a graveyard on the hill -----
    const glassPath = `M${GLASS.x} ${GLASS.y + GLASS.h}V250C${GLASS.x} 186 150 136 210 ${GLASS.y}C270 136 ${GLASS.x + GLASS.w} 186 ${GLASS.x + GLASS.w} 250V${GLASS.y + GLASS.h}Z`;
    const outside = (
        <g clipPath={`url(#${u('glass')})`}>
            <rect x={GLASS.x} y={GLASS.y - 4} width={GLASS.w} height={GLASS.h + 8} fill={f('night')} />
            {WSTARS.map((s, k) => <circle key={k} className={k % 3 ? undefined : 'sc-star'} style={k % 3 ? undefined : after(-k * 0.37)} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity=".8" />)}
            <circle cx="236" cy="214" r="104" fill={f('moonGlow')} />
            <circle cx="236" cy="214" r="44" fill={f('moon')} />
            <g fill="#7ea35a" opacity=".3"><circle cx="222" cy="200" r="9" /><circle cx="250" cy="226" r="6" /><circle cx="244" cy="196" r="3.4" /><circle cx="224" cy="234" r="4" /></g>
            <path d="M150 230Q200 214 250 230T340 226" stroke="#2a1440" strokeWidth="10" strokeLinecap="round" opacity=".7" fill="none" />
            <path d="M120 176Q170 166 214 178" stroke="#2a1440" strokeWidth="7" strokeLinecap="round" opacity=".55" fill="none" />
            {/* lightning: only while a song plays, and only now and then */}
            <path className="sc-flash" d="M146 112L132 176L150 178L126 262L170 162L150 160L166 112Z" fill="#f4ffd6" />
            <rect className="sc-flash" x={GLASS.x} y={GLASS.y} width={GLASS.w} height={GLASS.h} fill="#e9ffc8" opacity=".25" />
            {/* the witch on her broom, across the moon */}
            <g className="sc-witch">
                <g transform="translate(196 222) rotate(-10)" fill={INK}>
                    <path d="M-40 6L36 -2" stroke={INK} strokeWidth="3" strokeLinecap="round" />
                    <path d="M-38 6L-60 -3L-64 7L-60 17Z" />
                    <path d="M-42 4L-58 -1M-42 7L-62 7M-42 9L-58 14" stroke="#2a1440" strokeWidth="1" />
                    <path d="M-6 4C-6 -8 -2 -16 6 -18C14 -16 16 -6 14 2L20 8H-10Z" />
                    <path d="M-4 -6C-18 -12 -28 -6 -34 2C-24 0 -14 2 -6 4Z" />
                    <circle cx="8" cy="-22" r="5.4" />
                    <path d="M14 -21L22 -18" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
                    <path d="M-4 -24L20 -26L4 -50Q2 -38 -4 -24Z" />
                    <path d="M-6 -24H22" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
                    <path d="M12 4L22 12L26 10" stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
                    <circle cx="-8" cy="-2" r="4" />
                </g>
            </g>
            {/* bats */}
            {[[136, 150, 0.9, 0], [300, 136, 0.7, 1], [170, 300, 0.6, 2]].map(([x, y, s, k]) => (
                <g key={k} className="sc-bat" style={{ animationDelay: `${-k * 3.1}s`, animationDuration: '14s' }}>
                    <g transform={`translate(${x} ${y}) scale(${s})`} fill={INK}>
                        <g className="sc-flap" style={after(-k * 0.13)}>
                            <path d="M-3 -1C-9 -9 -21 -11 -32 -5C-28 -3 -27 0 -26 4C-22 1 -19 1 -16 5C-13 2 -10 2 -8 6C-6 3 -4 3 -2 5Z" />
                            <path d="M3 -1C9 -9 21 -11 32 -5C28 -3 27 0 26 4C22 1 19 1 16 5C13 2 10 2 8 6C6 3 4 3 2 5Z" />
                        </g>
                        <ellipse cx="0" cy="1.5" rx="3.4" ry="6" />
                        <circle cx="0" cy="-5" r="3" />
                    </g>
                </g>
            ))}
            {/* the hill, the graveyard and a crooked tower */}
            <path d="M96 386Q150 350 214 372T324 360V440H96Z" fill="#1a0f2a" />
            <path d="M150 368V332L160 318L170 332V368Z" fill="#120a1e" /><path d="M146 334L160 304L174 334Z" fill="#120a1e" />
            <rect x="156" y="340" width="5" height="7" fill="#c6f25a" opacity=".8" />
            <path d="M96 416Q170 396 240 410T324 404V440H96Z" fill={INK} />
            <g fill={INK}>
                <path d="M120 414V398A8 8 0 0 1 136 398V414Z" /><path d="M146 412V394H142V390H146V384H150V390H154V394H150V412Z" />
                <path d="M196 412V400A6 6 0 0 1 208 400V412Z" /><path d="M222 410V392H218V388H222V382H226V388H230V392H226V410Z" />
            </g>
            <path d="M298 440C300 410 296 380 290 352C284 336 272 330 262 324M292 368C304 356 318 352 330 352M288 350C284 330 288 316 296 306M296 306C300 300 308 298 314 300" stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M262 324L252 320M296 306L292 296M314 300L322 296" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
            <rect x={GLASS.x} y={GLASS.y} width={GLASS.w} height={GLASS.h} fill={f('lead')} />
            <rect x={GLASS.x} y={GLASS.y} width={GLASS.w} height={GLASS.h} fill={f('pane')} />
        </g>
    );

    // a torn purple curtain from the rod down to the floor, gathered by a rope halfway
    const drape = (
        <g>
            <path d="M24 92H118C116 190 106 270 98 318C112 410 120 500 126 576L114 600L104 582L92 610L80 586L66 604L54 584L40 606L30 586L20 598C22 500 34 410 50 318C38 270 30 190 24 92Z" fill={f('velvet')} />
            <path d="M50 96C52 196 62 270 68 318C64 410 54 500 48 590M84 96C84 196 82 270 78 318C84 410 94 500 100 590" fill="none" stroke="#12051c" strokeWidth="4" opacity=".55" />
            <path d="M38 96C40 196 48 270 56 318M106 96C102 196 94 270 90 318" fill="none" stroke="#b77be0" strokeWidth="2" opacity=".3" />
            <path d="M46 314Q73 330 100 314" fill="none" stroke="#9a7b2c" strokeWidth="4" strokeLinecap="round" />
            <path d="M96 318Q106 332 102 348" fill="none" stroke="#9a7b2c" strokeWidth="2" />
            <path d="M97 346H107L109 366H95Z" fill="#8a6a22" />
        </g>
    );

    // ----- the cabinet on the right: shelves with potions, a crystal ball and books, drawers under them, a raven on top -----
    const book = (k: string, x: number, y: number, w: number, h: number, c: string, lean = 0) => (
        <g key={k} transform={lean ? `rotate(${lean} ${x + w / 2} ${y})` : undefined}>
            <rect x={x} y={y - h} width={w} height={h} rx="1.5" fill={c} />
            <path d={`M${x + 2} ${y - h + 6}H${x + w - 2}M${x + 2} ${y - 6}H${x + w - 2}`} stroke="#e8c87a" strokeWidth="1.4" opacity=".7" />
            <rect x={x} y={y - h} width={w * 0.25} height={h} fill="#000" opacity=".18" />
        </g>
    );
    const cabinet = (
        <g>
            <rect x={CAB.x - 10} y={CAB.y - 14} width={CAB.w + 20} height="20" rx="3" fill="#2a1712" />
            <rect x={CAB.x - 10} y={CAB.y - 14} width={CAB.w + 20} height="4" fill="#5a3a26" opacity=".7" />
            <rect x={CAB.x} y={CAB.y} width={CAB.w} height={FLOOR - CAB.y} fill="#1b0f0c" />
            <rect x={CAB.x + 14} y={CAB.y + 6} width={CAB.w - 28} height={SHELF[2] - CAB.y - 2} fill={f('cabBack')} />
            <rect x={CAB.x} y={CAB.y} width="14" height={FLOOR - CAB.y} fill="#2d1a12" />
            <rect x={CAB.x + CAB.w - 14} y={CAB.y} width="14" height={FLOOR - CAB.y} fill="#2d1a12" />
            {SHELF.map((y) => (
                <g key={y}>
                    <rect x={CAB.x + 10} y={y} width={CAB.w - 20} height="12" fill="#3d2418" />
                    <rect x={CAB.x + 10} y={y} width={CAB.w - 20} height="3" fill="#6a4630" opacity=".7" />
                    <rect x={CAB.x + 10} y={y + 12} width={CAB.w - 20} height="10" fill="#000" opacity=".35" />
                </g>
            ))}
            {/* the drawers, with brass handles */}
            {[0, 1].map((r) => [0, 1, 2].map((c) => (
                <g key={`${r}${c}`}>
                    <rect x={CAB.x + 18 + c * 112} y={SHELF[2] + 26 + r * 84} width="104" height="74" rx="3" fill="#2e1b13" stroke="#120806" strokeWidth="2" />
                    <rect x={CAB.x + 22 + c * 112} y={SHELF[2] + 30 + r * 84} width="96" height="66" rx="2" fill="none" stroke="#5a3a26" strokeOpacity=".5" />
                    <path d={`M${CAB.x + 58 + c * 112} ${SHELF[2] + 62 + r * 84}Q${CAB.x + 70 + c * 112} ${SHELF[2] + 72 + r * 84} ${CAB.x + 82 + c * 112} ${SHELF[2] + 62 + r * 84}`} fill="none" stroke={f('brass')} strokeWidth="3.4" strokeLinecap="round" />
                </g>
            )))}
            {/* shelf one: a flask, a tall bottle, a jar of eyes and a row of books */}
            {BOTTLES.map(([x, s, kind, c, h], i) => bottle(`b${i}`, x, SHELF[s], kind, c, h, i))}
            {book('k1', 1468, SHELF[0], 16, 64, '#4c1d95')}{book('k2', 1486, SHELF[0], 13, 56, '#14532d')}{book('k3', 1501, SHELF[0], 18, 70, '#7f1d1d')}
            {book('k4', 1520, SHELF[0], 14, 60, '#1e3a8a', 12)}
            {/* shelf two: the crystal ball on its stand, books lying flat */}
            <g>
                <circle className="sc-pulse" cx="1322" cy={SHELF[1] - 40} r="54" fill={f('ballGlow')} />
                <path d={`M1300 ${SHELF[1]}L1306 ${SHELF[1] - 14}H1338L1344 ${SHELF[1]}Z`} fill={f('brass')} />
                <circle cx="1322" cy={SHELF[1] - 40} r="27" fill={f('ball')} />
                <path d={sparkle(0.9)} transform={`translate(1313 ${SHELF[1] - 49})`} fill="#f5e8ff" />
                <circle cx="1330" cy={SHELF[1] - 34} r="7" fill="#f0abfc" opacity=".35" />
            </g>
            {[[1476, 76, '#7c2d12'], [1482, 64, '#3b0764'], [1472, 70, '#164e63']].map(([x, w, c], i) => <rect key={i} x={Number(x)} y={SHELF[1] - 12 - i * 11} width={Number(w)} height="11" rx="2" fill={String(c)} stroke="#e8c87a" strokeOpacity=".4" />)}
            {candle('cc1', 1360, SHELF[1], 26, 3, true, 10)}
            {/* shelf three: an hourglass and a little pumpkin */}
            <g transform={`translate(1360 ${SHELF[2]})`}>
                <rect x="-16" y="-6" width="32" height="6" rx="1.5" fill="#3d2418" /><rect x="-16" y="-52" width="32" height="6" rx="1.5" fill="#3d2418" />
                <path d="M-12 -46H12Q12 -32 2 -26Q12 -20 12 -6H-12Q-12 -20 -2 -26Q-12 -32 -12 -46Z" fill="#d9e3ff" opacity=".25" stroke="#e7ecff" strokeOpacity=".5" />
                <path d="M-8 -6Q-6 -14 0 -16Q6 -14 8 -6Z" fill="#e8c87a" /><path d="M-5 -40H5L0 -30Z" fill="#e8c87a" />
                <path d="M-14 -46V-6M14 -46V-6" stroke="#3d2418" strokeWidth="3" />
            </g>
            {pumpkin('cp', 1420, SHELF[2] - 16, 0.42, -1.2)}
            {/* on top: a skull with a candle, and a raven */}
            <g transform={`translate(1252 ${CAB.y - 30}) scale(.36)`}><use href={`#${u('skull')}`} /></g>
            {candle('cc2', 1252, CAB.y - 50, 22, 5, true, 9)}
            <g transform={`translate(1500 ${CAB.y - 14})`} fill={INK}>
                <path d="M-26 0Q-30 -26 -8 -36Q8 -42 16 -30L30 -26L16 -22Q20 -8 10 0Z" />
                <path d="M-24 -10L-46 -2L-30 -2Z" />
                <circle cx="8" cy="-31" r="2.2" fill="#a3e635" />
                <path d="M-6 0V8M4 0V8" stroke={INK} strokeWidth="2.4" />
            </g>
            {web('cw', CAB.x + CAB.w - 14, CAB.y + 6, 64, -1, 1)}
        </g>
    );

    // ----- the floor: dark boards that run away from us -----
    const boards: JSX.Element[] = [];
    const ends: string[] = [];
    for (let j = 0; j < 14 && rowY(j) < height; j++) {
        const y0 = rowY(j);
        const y1 = rowY(j + 1);
        for (let k = -16; k < 16; k++) {
            const v = (((k * 5 + Math.floor((j + (k & 1)) / 2) * 11) % 4) + 4) % 4;
            boards.push(<polygon key={`${k}-${j}`} points={`${r1(lineX(k / 2, y0))},${r1(y0)} ${r1(lineX((k + 1) / 2, y0))},${r1(y0)} ${r1(lineX((k + 1) / 2, y1))},${r1(y1)} ${r1(lineX(k / 2, y1))},${r1(y1)}`} fill={WOOD[v]} />);
            if (j > 0 && (j + (k & 1)) % 2 === 0) ends.push(`M${r1(lineX(k / 2, y0))} ${r1(y0)}H${r1(lineX((k + 1) / 2, y0))}`);
        }
    }

    // the spider-web rug under the booth: twelve spokes and rings that sag between them, squashed flat on the floor
    const spokes = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6 + Math.PI / 12);
    const ring = (r: number) => spokes.map((a, i) => {
        const [x, y] = [r1(Math.cos(a) * r), r1(Math.sin(a) * r)];
        const m = a - Math.PI / 12;

        return `${i ? `Q${r1(Math.cos(m) * r * 0.86)} ${r1(Math.sin(m) * r * 0.86)} ` : 'M'}${x} ${y}`;
    }).join('') + `Q${r1(Math.cos(spokes[0] - Math.PI / 12) * r * 0.86)} ${r1(Math.sin(spokes[0] - Math.PI / 12) * r * 0.86)} ${r1(Math.cos(spokes[0]) * r)} ${r1(Math.sin(spokes[0]) * r)}`;

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('wall')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#0d0618" /><stop offset=".55" stopColor="#1d0c2c" /><stop offset="1" stopColor="#2a0f3d" /></linearGradient>
                <linearGradient id={u('stoneShade')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#000" stopOpacity=".55" /><stop offset=".6" stopColor="#000" stopOpacity=".15" /><stop offset="1" stopColor="#000" stopOpacity=".3" /></linearGradient>
                <radialGradient id={u('cauldronLight')} cx="800" cy="540" r="520" gradientUnits="userSpaceOnUse"><stop stopColor="#a3e635" stopOpacity=".34" /><stop offset=".4" stopColor="#65a30d" stopOpacity=".12" /><stop offset="1" stopColor="#65a30d" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('purpleHaze')} cx="800" cy="170" r="760" gradientUnits="userSpaceOnUse"><stop stopColor="#a855f7" stopOpacity=".2" /><stop offset=".6" stopColor="#7e22ce" stopOpacity=".06" /><stop offset="1" stopColor="#7e22ce" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('beam')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#2a1712" /><stop offset="1" stopColor="#140a08" /></linearGradient>
                <linearGradient id={u('night')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#070316" /><stop offset=".55" stopColor="#241047" /><stop offset="1" stopColor="#3f5a2a" /></linearGradient>
                <radialGradient id={u('moonGlow')} cx=".5" cy=".5" r=".5"><stop stopColor="#e6ffb0" stopOpacity=".55" /><stop offset=".45" stopColor="#a3e635" stopOpacity=".16" /><stop offset="1" stopColor="#84cc16" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('moon')} cx=".38" cy=".34" r=".8"><stop stopColor="#fbffe8" /><stop offset=".6" stopColor="#e2f7b4" /><stop offset="1" stopColor="#a8cf6a" /></radialGradient>
                <pattern id={u('lead')} width="28" height="40" patternUnits="userSpaceOnUse" x={GLASS.x + 2} y={GLASS.y}>
                    <path d="M0 20L14 0L28 20L14 40Z" fill="none" stroke="#120a1e" strokeWidth="2" opacity=".75" />
                </pattern>
                <linearGradient id={u('pane')} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" stopOpacity="0" /><stop offset=".45" stopColor="#fff" stopOpacity=".06" /><stop offset=".5" stopColor="#fff" stopOpacity="0" /></linearGradient>
                <linearGradient id={u('stoneFrame')} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#4a3d5e" /><stop offset=".5" stopColor="#5d4d74" /><stop offset="1" stopColor="#3d314f" /></linearGradient>
                <linearGradient id={u('velvet')} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#1e0733" /><stop offset=".35" stopColor="#4c1478" /><stop offset=".6" stopColor="#5b1a8a" /><stop offset="1" stopColor="#24093d" /></linearGradient>
                <linearGradient id={u('brass')} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e9cf7a" /><stop offset="1" stopColor="#7a5a14" /></linearGradient>
                <linearGradient id={u('frameWood')} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#2a1838" /><stop offset=".5" stopColor="#140a1e" /><stop offset="1" stopColor="#0a0510" /></linearGradient>
                <linearGradient id={u('wax')} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#f6f0e2" /><stop offset=".55" stopColor="#ddd2b8" /><stop offset="1" stopColor="#a89c80" /></linearGradient>
                <linearGradient id={u('flame')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff7c2" /><stop offset=".45" stopColor="#ffd24a" /><stop offset="1" stopColor="#ff7a1a" /></linearGradient>
                <linearGradient id={u('limeFlame')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f7ffd6" /><stop offset=".45" stopColor="#bef264" /><stop offset="1" stopColor="#4d7c0f" /></linearGradient>
                <linearGradient id={u('fire')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ecffb8" stopOpacity="0" /><stop offset=".25" stopColor="#bef264" /><stop offset=".65" stopColor="#65a30d" /><stop offset="1" stopColor="#1a4d0a" /></linearGradient>
                <radialGradient id={u('flameGlow')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffd27a" stopOpacity=".55" /><stop offset=".45" stopColor="#ffa940" stopOpacity=".16" /><stop offset="1" stopColor="#ff9a1f" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('limeGlow')} cx=".5" cy=".5" r=".5"><stop stopColor="#d9f99d" stopOpacity=".6" /><stop offset=".45" stopColor="#a3e635" stopOpacity=".16" /><stop offset="1" stopColor="#84cc16" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('orangeGlow')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffb347" stopOpacity=".55" /><stop offset=".5" stopColor="#ff7a1a" stopOpacity=".14" /><stop offset="1" stopColor="#ff7a1a" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('pumpkin')} cx=".38" cy=".3" r=".85"><stop stopColor="#ffb15c" /><stop offset=".5" stopColor="#f2711c" /><stop offset="1" stopColor="#a33a0a" /></radialGradient>
                <radialGradient id={u('ball')} cx=".36" cy=".32" r=".8"><stop stopColor="#fbe8ff" /><stop offset=".35" stopColor="#d8b4fe" /><stop offset=".75" stopColor="#7e22ce" /><stop offset="1" stopColor="#3b0764" /></radialGradient>
                <radialGradient id={u('ballGlow')} cx=".5" cy=".5" r=".5"><stop stopColor="#d8b4fe" stopOpacity=".55" /><stop offset=".5" stopColor="#a855f7" stopOpacity=".15" /><stop offset="1" stopColor="#a855f7" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('cabBack')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#140a0a" /><stop offset="1" stopColor="#24120e" /></linearGradient>
                <radialGradient id={u('pot')} cx=".36" cy=".3" r=".9"><stop stopColor="#4a4458" /><stop offset=".45" stopColor="#221d2c" /><stop offset="1" stopColor="#09070d" /></radialGradient>
                <radialGradient id={u('brew')} cx=".5" cy=".5" r=".6"><stop stopColor="#f2ffc2" /><stop offset=".4" stopColor="#bef264" /><stop offset="1" stopColor="#4d7c0f" /></radialGradient>
                <radialGradient id={u('vapour')} cx=".5" cy=".5" r=".5"><stop stopColor="#d9f99d" stopOpacity=".5" /><stop offset=".6" stopColor="#a3e635" stopOpacity=".14" /><stop offset="1" stopColor="#a3e635" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <radialGradient id={u('floorGlow')} cx=".5" cy=".5" r=".5"><stop stopColor="#a3e635" stopOpacity=".3" /><stop offset=".5" stopColor="#65a30d" stopOpacity=".1" /><stop offset="1" stopColor="#65a30d" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('rug')} cx=".5" cy=".5" r=".5"><stop stopColor="#3b1260" /><stop offset=".75" stopColor="#24093d" /><stop offset="1" stopColor="#14051f" /></radialGradient>
                <linearGradient id={u('fog')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#c4b5fd" stopOpacity="0" /><stop offset=".5" stopColor="#c4b5fd" stopOpacity=".16" /><stop offset="1" stopColor="#c4b5fd" stopOpacity="0" /></linearGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#7e22ce" stopOpacity="0" /><stop offset="1" stopColor={p.floorBottom} stopOpacity=".6" /></linearGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".62" /></radialGradient>
                <filter id={u('soft')} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" /></filter>
                <clipPath id={u('glass')}><path d={glassPath} /></clipPath>
                {skullGlyph(u('skull'))}
                {POTION.map((c, i) => <radialGradient key={i} id={u(`pg${i}`)} cx=".5" cy=".5" r=".5"><stop stopColor={c} stopOpacity=".42" /><stop offset=".5" stopColor={c} stopOpacity=".12" /><stop offset="1" stopColor={c} stopOpacity="0" /></radialGradient>)}
            </defs>

            {/* the walls: big purple stones, a timber beam along the ceiling, the light of the cauldron on them */}
            <rect width="1600" height={FLOOR} fill={f('wall')} />
            <g>
                {STONES.map((s, k) => <rect key={k} x={s.x} y={s.y} width={s.w} height={s.h} rx="7" fill={STONE[s.c]} />)}
                <path d={STONES.map((s) => `M${s.x + 8} ${s.y + 3}H${s.x + s.w - 10}`).join('')} stroke="#fff" strokeOpacity=".07" strokeWidth="2" strokeLinecap="round" />
            </g>
            <rect width="1600" height={FLOOR} fill={f('stoneShade')} />
            <rect width="1600" height={FLOOR} fill={f('purpleHaze')} />
            <rect width="1600" height={FLOOR} fill={f('cauldronLight')} />
            <rect width="1600" height="26" fill={f('beam')} />
            <rect y="24" width="1600" height="3" fill="#000" opacity=".55" />
            {[60, 300, 1300, 1540].map((x) => <circle key={x} cx={x} cy="13" r="3" fill="#6b5a4a" />)}
            <rect y={FLOOR - 14} width="1600" height="14" fill="#140a1c" />

            {/* the window on the left: a stone surround, the night outside, the iron bars, a sill with candles and a skull */}
            <path d={`M72 452V250C72 172 140 112 210 82C280 112 348 172 348 250V452Z`} fill={f('stoneFrame')} />
            <path d={`M72 452V250C72 172 140 112 210 82C280 112 348 172 348 250V452`} fill="none" stroke="#1a1226" strokeWidth="2" />
            {[[92, 452], [112, 452], [132, 452]].map(([x], i) => <path key={i} d={`M72 ${300 + i * 50}H96M324 ${300 + i * 50}H348`} stroke="#2a2038" strokeWidth="2" />)}
            {outside}
            <g stroke="#1a1226" strokeWidth="6">
                <path d={`M210 ${GLASS.y + 4}V${GLASS.y + GLASS.h}`} />
                <path d={`M${GLASS.x} 250H${GLASS.x + GLASS.w}M${GLASS.x} 344H${GLASS.x + GLASS.w}`} />
            </g>
            <path d={glassPath} fill="none" stroke="#1a1226" strokeWidth="4" />
            <rect x="58" y="436" width="304" height="16" rx="2" fill="#5d4d74" />
            <rect x="62" y="452" width="296" height="8" fill="#3d314f" />
            <ellipse cx="210" cy="464" rx="150" ry="6" fill="#000" opacity=".35" />
            {candle('wc1', 112, 436, 30, 1)}
            {candle('wc2', 132, 436, 18, 4)}
            <g transform="translate(300 418) scale(.3)"><use href={`#${u('skull')}`} /></g>
            {pumpkin('wp', 220, 424, 0.36, -0.8)}
            {web('ww', 72, 26, 92, 1, 1)}
            {drape}
            <g transform="translate(420 0) scale(-1 1)">{drape}</g>
            <path d="M20 88H400V108Q306 146 210 118Q114 146 20 108Z" fill={f('velvet')} />
            <path d="M20 108Q114 146 210 118Q306 146 400 108" fill="none" stroke="#9a7b2c" strokeWidth="3" strokeDasharray="1.6 2.6" />
            <rect x="16" y="83" width="388" height="7" rx="3.4" fill="#1a1226" />
            <circle cx="16" cy="86.5" r="8" fill="#1a1226" /><circle cx="404" cy="86.5" r="8" fill="#1a1226" />

            {/* the cabinet on the right */}
            {cabinet}

            {/* the frame the video hangs in: black wood, a brass bead, a skull at each corner, a sign on chains under it */}
            <rect x={FRAME.x - 16} y={FRAME.y - 10} width={FRAME.w + 32} height={FRAME.h + 28} rx="18" fill="#a3e635" opacity=".16" filter={`url(#${u('soft')})`} />
            <rect x={FRAME.x} y={FRAME.y} width={FRAME.w} height={FRAME.h} rx="6" fill={f('frameWood')} />
            <rect x={FRAME.x} y={FRAME.y} width={FRAME.w} height={FRAME.h} rx="6" fill="none" stroke="#000" strokeWidth="2" />
            <rect x={FRAME.x + 9} y={FRAME.y + 9} width={FRAME.w - 18} height={FRAME.h - 18} rx="4" fill="none" stroke={f('brass')} strokeWidth="2.4" />
            <rect x={FRAME.x + 15} y={FRAME.y + 15} width={FRAME.w - 30} height={FRAME.h - 30} rx="3" fill="none" stroke="#a855f7" strokeOpacity=".35" strokeWidth="1.6" strokeDasharray="2 5" />
            <rect x={tv.x - 12} y={tv.y - 12} width={tv.w + 24} height={tv.h + 24} rx="2" fill="#07040b" stroke="#3b1d52" strokeWidth="2" />
            {[[FRAME.x + 4, FRAME.y + 62], [FRAME.x + FRAME.w - 4, FRAME.y + 62], [FRAME.x + 4, FRAME.y + FRAME.h - 6], [FRAME.x + FRAME.w - 4, FRAME.y + FRAME.h - 6]].map(([x, y], i) => (
                <g key={i}>
                    <circle className="sc-flame" style={after(-i * 0.6)} cx={x} cy={y} r="26" fill={f('limeGlow')} opacity=".7" />
                    <g transform={`translate(${x} ${y}) scale(.3)`}><use href={`#${u('skull')}`} /></g>
                    <circle cx={x - 4.8} cy={y - 3} r="1.8" fill="#bef264" /><circle cx={x + 4.8} cy={y - 3} r="1.8" fill="#bef264" />
                </g>
            ))}
            {web('fw', FRAME.x + 6, FRAME.y + FRAME.h - 6, 70, 1, -1)}
            {spider('fs', FRAME.x + FRAME.w - 40, FRAME.y + FRAME.h, 26, -1.4)}
            {/* the sign */}
            <path d="M752 374L746 392M848 374L854 392" stroke="#3a3346" strokeWidth="3" strokeDasharray="4 2.4" />
            <rect x="722" y="390" width="156" height="36" rx="5" fill="#2a1712" stroke="#120806" strokeWidth="2" />
            <rect x="727" y="395" width="146" height="26" rx="3" fill="none" stroke="#5a3a26" strokeOpacity=".7" />
            <text x="800" y="416" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize="19" letterSpacing="2" fill="#d9f99d">SFD-DJ.EU</text>
            <text className="sc-flame" x="800" y="416" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize="19" letterSpacing="2" fill="#a3e635" opacity=".45" filter={`url(#${u('soft')})`}>SFD-DJ.EU</text>

            {/* candles that float in the air */}
            {FLOATING.map(([x, y, h], i) => (
                <g key={i} className="sc-float" style={{ animationDelay: `${-i * 0.7}s`, animationDuration: `${3.4 + (i % 3) * 0.6}s` }}>
                    {candle(`fc${i}`, x, y + h, h, i + 2, false, 13)}
                </g>
            ))}

            {/* little jack-o'-lanterns on a wire over the window, bats asleep from the beam, cobwebs in the corners */}
            {[[-12, 476, 22, 26]].map(([x0, x1, y, sag], g) => (
                <g key={g}>
                    <path d={`M${x0} ${y}Q${(x0 + x1) / 2} ${y + 2 * sag} ${x1} ${y}`} fill="none" stroke="#120a18" strokeWidth="2" />
                    {Array.from({ length: 6 }, (_, i) => {
                        const t = (i + 0.5) / 6;
                        const x = x0 + (x1 - x0) * t;
                        const yy = y + 4 * sag * t * (1 - t);

                        return (
                            <g key={i} className="sc-dangle" style={after(-(i + g * 3) * 0.6)}>
                                <path d={`M${r1(x)} ${r1(yy)}V${r1(yy + 14)}`} stroke="#120a18" strokeWidth="1.4" />
                                {pumpkin(`gl${g}${i}`, r1(x), r1(yy + 26), 0.3, -(i + g) * 0.4)}
                            </g>
                        );
                    })}
                </g>
            ))}
            {sleeper('sb1', 1318, 26)}{sleeper('sb2', 1350, 26)}{sleeper('sb3', 560, 26)}
            {web('cw1', 0, 26, 120, 1, 1)}
            {web('cw2', 1600, 26, 120, -1, 1)}
            {spider('cs1', 120, 26, 70, 0)}
            {spider('cs2', 1110, 26, 40, -2.6)}

            {/* the cauldron on its green fire, bubbling, the brew dripping over the rim, steam going up */}
            <g>
                <ellipse cx="800" cy="460" rx="170" ry="120" fill={f('vapour')} />
                <ellipse cx="770" cy="452" rx="62" ry="30" fill="#d9f99d" opacity=".14" filter={`url(#${u('soft')})`} />
                <ellipse cx="836" cy="436" rx="52" ry="24" fill="#d9f99d" opacity=".12" filter={`url(#${u('soft')})`} />
                {[0, 1, 2, 3].map((k) => <circle key={k} className="sc-steam" style={{ ...after(-k * 1.2), animationDuration: '4.8s' }} cx={760 + k * 26} cy="488" r="16" fill="#d9f99d" />)}
                <ellipse cx="800" cy="626" rx="160" ry="16" fill="#000" opacity=".5" />
                {[[738, 46, 0], [770, 62, 0.3], [800, 74, 0.6], [830, 60, 0.15], [862, 44, 0.45]].map(([x, h, d]) => (
                    <path key={x} className="sc-blaze" style={after(-d)} d={`M${x} 632C${x - 22} ${632 - h * 0.35} ${x - 10} ${632 - h * 0.7} ${x} ${632 - h}C${x + 10} ${632 - h * 0.7} ${x + 22} ${632 - h * 0.35} ${x} 632Z`} fill={f('fire')} />
                ))}
                <path d="M708 506C694 560 724 614 800 616C876 614 906 560 892 506Z" fill={f('pot')} />
                <path d="M720 520C716 560 736 598 778 610" fill="none" stroke="#7a7290" strokeOpacity=".35" strokeWidth="5" strokeLinecap="round" />
                {[[730, 612], [870, 612]].map(([x, y]) => <path key={x} d={`M${x - 8} ${y - 6}L${x - 12} ${y + 14}H${x + 4}L${x + 6} ${y - 4}Z`} fill="#0d0a12" />)}
                <ellipse cx="800" cy="506" rx="100" ry="20" fill="#1a1622" stroke="#4a4458" strokeWidth="5" />
                <ellipse cx="800" cy="506" rx="88" ry="14" fill={f('brew')} />
                <ellipse className="sc-flame" cx="800" cy="506" rx="88" ry="14" fill="#f2ffc2" opacity=".3" />
                {[[770, 504, 7], [806, 508, 9], [836, 502, 5], [752, 509, 4], [822, 498, 4]].map(([x, y, r], k) => (
                    <g key={k} className="sc-bubble" style={after(-k * 0.5)}>
                        <circle cx={x} cy={y - r * 0.4} r={r} fill="#d9f99d" stroke="#4d7c0f" strokeWidth="1" />
                        <circle cx={x - r * 0.35} cy={y - r * 0.75} r={r * 0.28} fill="#fff" opacity=".8" />
                    </g>
                ))}
                <path d="M712 512Q710 530 716 538Q722 530 720 516ZM880 514Q884 534 890 540Q896 530 888 512ZM846 524Q846 540 850 546Q855 540 853 525Z" fill="#a3e635" />
                {/* the logs under it */}
                <g transform="rotate(-6 760 630)"><rect x="706" y="622" width="110" height="16" rx="8" fill="#3a2214" /><ellipse cx="815" cy="630" rx="5" ry="8" fill="#a37a4a" /></g>
                <g transform="rotate(7 840 630)"><rect x="786" y="622" width="110" height="16" rx="8" fill="#2e1b10" /><ellipse cx="787" cy="630" rx="5" ry="8" fill="#8a6238" /></g>
            </g>

            {/* the floor: dark boards, the green light of the fire on them */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            <g opacity=".7">{boards}</g>
            <g stroke="#0a0508" strokeOpacity=".7" strokeWidth="1.2">
                {Array.from({ length: 33 }, (_, k) => k - 16).map((k) => <line key={k} x1={r1(lineX(k / 2, FLOOR))} y1={FLOOR} x2={r1(lineX(k / 2, height))} y2={height} />)}
                <path d={ends.join('')} fill="none" />
            </g>
            <ellipse cx="800" cy="660" rx="420" ry="60" fill={f('floorGlow')} />
            <ellipse cx="210" cy="660" rx="200" ry="28" fill="#c4b5fd" opacity=".06" />

            {/* the spider-web rug under the booth */}
            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="800" cy={SCENE.booth.y + 100} rx="392" ry="68" fill={f('rug')} />
                <ellipse cx="800" cy={SCENE.booth.y + 100} rx="392" ry="68" fill="none" stroke="#84cc16" strokeOpacity=".55" strokeWidth="3" />
                <ellipse cx="800" cy={SCENE.booth.y + 100} rx="380" ry="65" fill="none" stroke="#a855f7" strokeOpacity=".5" strokeWidth="1.6" strokeDasharray="6 5" />
                <g transform={`translate(800 ${SCENE.booth.y + 100}) scale(1 .17)`} fill="none" stroke="#c4b5fd" strokeOpacity=".5" strokeWidth="9">
                    {spokes.map((a, i) => <path key={i} d={`M0 0L${r1(Math.cos(a) * 372)} ${r1(Math.sin(a) * 372)}`} />)}
                    {[110, 190, 270, 350].map((r) => <path key={r} d={ring(r)} />)}
                </g>
                <ellipse cx="800" cy={SCENE.booth.y + 100} rx="392" ry="68" fill={f('floorGlow')} />
                <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 4} rx="184" ry="15" fill="#000" opacity=".5" />
            </g>

            {withBooth && (
                <svg x={SCENE.booth.x} y={SCENE.booth.y + ext} width={SCENE.booth.w} height={SCENE.booth.h} viewBox="0 0 300 150" overflow="visible">
                    <BoothFrontArt u={(n) => `${uid}-b-${n}`} p={p} plate />
                </svg>
            )}

            {/* fog along the floor, a haze over the far end of the room */}
            <g className="sc-drift">
                <ellipse cx="380" cy="640" rx="320" ry="26" fill={f('fog')} />
                <ellipse cx="1220" cy="650" rx="340" ry="28" fill={f('fog')} />
            </g>
            <rect y="520" width="1600" height={height - 520} fill={f('haze')} />

            {/* the front corners: a heap of jack-o'-lanterns and a black cat on the left, an open spell book on a stand on the right */}
            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="190" cy="880" rx="200" ry="16" fill="#000" opacity=".45" />
                {pumpkin('p1', 92, 842, 1, -0.3)}
                {pumpkin('p2', 204, 852, 1.16, -1.1)}
                {pumpkin('p3', 150, 796, 0.84, -2)}
                {pumpkin('p4', 30, 872, 0.66, 0, false)}
                {candle('fc1', 290, 884, 46, 6)}
                {candle('fc2', 312, 886, 30, 7)}
                {candle('fc3', 6, 888, 34, 8)}
                <g transform="translate(372 882)" fill={INK}>
                    <path d="M14 -6C40 -8 46 -30 34 -44C28 -50 22 -44 28 -38C36 -30 30 -18 12 -18Z" />
                    <path d="M-24 0C-28 -26 -22 -52 -10 -64H10C22 -52 28 -26 24 0Z" />
                    <circle cx="0" cy="-74" r="19" />
                    <path d="M-17 -82L-15 -102L-4 -90ZM17 -82L15 -102L4 -90Z" />
                    <path d="M-14 -86L-13 -96L-7 -89Z" fill="#3b2140" />
                    <ellipse cx="-7.4" cy="-76" rx="4.4" ry="5.4" fill="#bef264" /><ellipse cx="7.4" cy="-76" rx="4.4" ry="5.4" fill="#bef264" />
                    <ellipse cx="-7.4" cy="-76" rx="1.3" ry="4.4" fill={INK} /><ellipse cx="7.4" cy="-76" rx="1.3" ry="4.4" fill={INK} />
                    <path d="M-2 -68L0 -66L2 -68Z" fill="#e88aa0" />
                    <path d="M-6 -66L-22 -70M-6 -64L-21 -63M6 -66L22 -70M6 -64L21 -63" stroke="#4a3a5a" strokeWidth=".8" />
                    <path d="M-14 -2V2M-4 -2V2M4 -2V2M14 -2V2" stroke={INK} strokeWidth="5" strokeLinecap="round" />
                </g>
            </g>
            <g transform={`translate(0 ${ext})`}>
                <ellipse cx="1480" cy="884" rx="150" ry="14" fill="#000" opacity=".45" />
                <path d="M1472 884V800H1488V884Z" fill="#2a1712" />
                <path d="M1446 884H1514" stroke="#2a1712" strokeWidth="8" strokeLinecap="round" />
                <path d="M1414 806L1546 794L1550 806L1418 820Z" fill="#3d2418" />
                <circle className="sc-flame" cx="1482" cy="770" r="80" fill={f('limeGlow')} />
                <path d="M1420 800Q1450 776 1480 792Q1512 774 1544 790L1544 798Q1512 784 1480 802Q1450 786 1420 808Z" fill="#e9dcc0" />
                <path d="M1424 798Q1450 778 1478 792L1478 800Q1450 786 1424 806Z" fill="#f6ecd4" />
                <path d="M1482 792Q1512 776 1540 790L1540 796Q1512 784 1482 800Z" fill="#f6ecd4" />
                <path d="M1434 794q6 -6 12 -2t12 -4M1436 800q6 -5 12 -2t14 -5M1488 788q6 -5 12 -2t12 -4M1490 794q6 -5 12 -2t14 -4" stroke="#65a30d" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                <path d={sparkle(0.8)} transform="translate(1462 768)" fill="#d9f99d" className="sc-twinkle" />
                <path d={sparkle(0.6)} transform="translate(1508 760)" fill="#d9f99d" className="sc-twinkle" style={after(-0.7)} />
                <g transform="translate(1372 858) scale(.42)"><use href={`#${u('skull')}`} /></g>
                {candle('rc1', 1372, 834, 22, 9, true, 10)}
                <g transform="translate(1562 884)">
                    <rect x="-12" y="-44" width="24" height="44" rx="5" fill="#d9e3ff" opacity=".2" stroke="#e7ecff" strokeOpacity=".45" />
                    <rect x="-11" y="-30" width="22" height="29" rx="4" fill="#a855f7" />
                    <rect x="-6" y="-52" width="12" height="9" rx="2" fill="#4a2a14" />
                </g>
                {bottle('rb', 1588, 886, 0, 0, 34, 11)}
            </g>
            <rect width="1600" height={height} fill={f('vig')} />
        </svg>
    );
}
