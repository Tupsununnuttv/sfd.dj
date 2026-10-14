// Skully: a skeleton DJ, drawn bone by bone. The skull has deep eye sockets with a cold blue spark in each, the nose opening, cheekbones, sutures, a crack
// over one brow and a full row of teeth, and the jaw hangs on its own so it can chatter. Below it: the neck, collarbones, a rib cage (cartilage at the front
// of each rib, the back ribs seen through the gaps), the breastbone, the spine, a pelvis, and arms and legs in separate bones (two in each forearm and
// shin, every finger and toe). At the decks he wears headphones. For the Owner only.
// Every limb is a chain of joints (shoulder, elbow, wrist; hip, knee, ankle) and each joint moves a beat after the one before it, so the bones swing and settle.
import { kf, lin, mirror, origins, picture, play, pose, rad, shadow } from './kit.mjs';

const r1 = (n) => Math.round(n * 10) / 10;
const INK = '#2c2214';

/** A shape that is the same on both sides of x = 80: `half` runs from `start` (on the middle line) down the left side to the middle line again, as cubic steps [c1x, c1y, c2x, c2y, x, y]. */
const symmetric = (start, half) => {
    const ends = [start, ...half.map((step) => [step[4], step[5]])];
    const left = half.map(([a, b, c, d, x, y]) => `C${a} ${b} ${c} ${d} ${x} ${y}`).join('');
    const right = half.map(([a, b, c, d], i) => `C${r1(160 - c)} ${d} ${r1(160 - a)} ${b} ${r1(160 - ends[i][0])} ${ends[i][1]}`).reverse().join('');

    return `M${start[0]} ${start[1]}${left}${right}Z`;
};

/** A suture: a zigzag of `n` teeth, `amp` either side of the curve from p0 to p1 that bends towards c. */
const zigzag = ([x0, y0], [cx, cy], [x1, y1], n, amp) => Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, u = 1 - t;
    const x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
    const tx = 2 * u * (cx - x0) + 2 * t * (x1 - cx), ty = 2 * u * (cy - y0) + 2 * t * (y1 - cy), len = Math.hypot(tx, ty), o = i % 2 ? amp : -amp;
    return `${i ? 'L' : 'M'}${r1(x - (ty / len) * o)} ${r1(y + (tx / len) * o)}`;
}).join('');

/** A long bone from joint a to joint b: round ends `ea` and `eb` wide (half widths) and a narrower shaft `w`, shaded like a cylinder, with a shine down one side. */
const longBone = ([ax, ay], [bx, by], ea, w, eb) => {
    const len = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / len, uy = (by - ay) / len, k = len * 0.3;
    const P = (s, o) => `${r1(ax + ux * s - uy * o)} ${r1(ay + uy * s + ux * o)}`;
    const d = `M${P(0, ea)}C${P(ea * 0.8, ea)} ${P(k - 2, w)} ${P(k, w)}L${P(len - k, w)}C${P(len - k + 2, w)} ${P(len - eb * 0.8, eb)} ${P(len, eb)}`
        + `C${P(len + eb * 1.3, eb)} ${P(len + eb * 1.3, -eb)} ${P(len, -eb)}`
        + `C${P(len - eb * 0.8, -eb)} ${P(len - k + 2, -w)} ${P(len - k, -w)}L${P(k, -w)}C${P(k - 2, -w)} ${P(ea * 0.8, -ea)} ${P(0, -ea)}`
        + `C${P(-ea * 1.3, -ea)} ${P(-ea * 1.3, ea)} ${P(0, ea)}Z`;

    return `<path d="${d}" fill="url(#bone)" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"/><path d="M${P(k, w * 0.4)}L${P(len - k, w * 0.4)}" stroke="#fffaf0" stroke-opacity=".6" stroke-width="${r1(Math.max(0.6, w * 0.45))}" stroke-linecap="round"/>`;
};

/** Small bones (fingers and toes): sticks [x1, y1, x2, y2, width] with round ends; each one's outline cuts across the end of the one before, so every joint shows. */
const sticks = (list) => list.map(([x1, y1, x2, y2, w]) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${INK}" stroke-width="${r1(w + 0.9)}" stroke-linecap="round"/><path d="M${x1} ${y1}L${x2} ${y2}" stroke="#eadcbc" stroke-width="${w}" stroke-linecap="round"/>`).join('');

const knobs = (list, width = 0.7) => `<g fill="url(#bone)" stroke="${INK}" stroke-width="${width}">${list.map(([x, y, rx, ry = rx]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('')}</g>`;

// ---------- the skull ----------
const CRANIUM = symmetric([80, 6], [[60, 6, 43, 20, 43, 40], [43, 49, 45, 55, 48, 59], [45.4, 61, 44.4, 64, 45.2, 66.4], [47, 70, 50, 73, 52.4, 75], [55, 75.6, 58, 75.6, 60, 76.4], [62, 77, 70, 77.6, 80, 77.6]]);
const MANDIBLE = symmetric([80, 84], [[74, 84, 66, 84, 62, 84.4], [58.4, 82, 57.2, 77, 56.2, 72], [54.6, 69.6, 51.6, 68.4, 50.2, 69.4], [49, 77, 50, 86, 52.4, 91.4], [55, 95.6, 59, 98.4, 64, 100.2], [69, 102.6, 75, 104, 80, 104]]);
const SKULL_BACK = symmetric([80, 6], [[60, 6, 43, 20, 43, 40], [43, 50, 43.4, 58, 45.4, 64.4], [46.6, 69.6, 49.4, 74, 52.6, 77.2], [56.6, 80.6, 61.6, 83.2, 67, 84.6], [71, 85.6, 75.6, 86, 80, 86]]);
const JAW_BACK = 'M56.4 75C53 80 52 88 53.2 93C55.6 97.6 60.6 99.4 66 100C66.6 96.6 64 94.4 61 93C58.6 88 58.4 81 58.6 76Z';
const SOCKET = 'M52 47C54 41.5 63 40 70.6 43C75 45 76.6 50 75.6 55.6C74.6 61.6 69 64 63 63.6C56.6 63 52.6 58.6 51.6 53.6C51.2 51 51.3 48.8 52 47Z';
const NOSE = 'M80 61C77.8 62.6 74.6 67 74.6 71C74.7 73.6 77 74.6 79 73.2L80 72.4L81 73.2C83 74.6 85.3 73.6 85.4 71C85.4 67 82.2 62.6 80 61Z';

/** A tooth from x0 to x1, rooted at `root` with its edge at `edge` (above the root for the lower teeth). */
const tooth = (x0, x1, root, edge) => {
    const r = r1(Math.min(1.2, (x1 - x0) / 2.6)), s = edge > root ? -1 : 1;
    return `M${x0} ${root}L${x0} ${r1(edge + s * r)}Q${x0} ${edge} ${r1(x0 + r)} ${edge}H${r1(x1 - r)}Q${x1} ${edge} ${x1} ${r1(edge + s * r)}L${x1} ${root}Z`;
};

/** A row of teeth either side of the middle: [from, to (distance from x = 80), edge]. */
const teeth = (row, root) => `<path d="${row.flatMap(([a, b, edge]) => [tooth(r1(80 - b), r1(80 - a), root, edge), tooth(r1(80 + a), r1(80 + b), root, edge)]).join('')}" fill="url(#tooth)" stroke="${INK}" stroke-width=".6" stroke-linejoin="round"/>`;
const UPPER = [[0, 4.6, 85.6], [4.6, 8.6, 85.2], [8.6, 12.4, 85.8], [12.4, 15.8, 84.8], [15.8, 18.6, 84.2]];
const LOWER = [[0, 4, 84.8], [4, 7.6, 85], [7.6, 11, 84.4], [11, 14.2, 85.2], [14.2, 17, 85.8]];

/** Old stains on the bone. */
const stains = (list) => list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#stain)"/>`).join('');

const skullFront = () => `
    <path d="${CRANIUM}" fill="url(#skull)"/>
    ${stains([[62, 24, 10], [100, 46, 7], [56, 64, 5], [88, 14, 6]])}
    <path d="${CRANIUM}" fill="url(#skullShade)"/>
    <path d="${zigzag([50, 30], [80, 6], [110, 30], 24, 0.9)}" fill="none" stroke="#6f5c3c" stroke-opacity=".7" stroke-width=".75" stroke-linejoin="round"/>
    <path d="M100.6 13L98.4 19.6L101.8 24L99 30.8L101 34.4" fill="none" stroke="${INK}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M101.7 13.4L99.6 19.6L103 24L100.2 30.8" fill="none" stroke="#fffaf0" stroke-opacity=".5" stroke-width=".7" stroke-linecap="round" stroke-linejoin="round"/>
    ${['<path d="M46.6 64.4C50 63 55.4 63.6 59 66C55.4 67.6 50.2 68.2 47 67.2Z" fill="#fffaf0" fill-opacity=".35"/>',
        '<path d="M47.4 67.6C49.6 71 52 74 56 75.6L59.6 76.4C58.6 80 56 82 53.4 81C50.4 78.6 48.6 73.6 47.4 67.6Z" fill="#2a2014" fill-opacity=".55"/>',
        `<path d="${SOCKET}" fill="url(#socket)" stroke="${INK}" stroke-width=".9"/>`,
        '<path d="M51.6 46.4C54.5 40 64 38 72.6 42.4" fill="none" stroke="#fffaf0" stroke-opacity=".55" stroke-width="1.4" stroke-linecap="round"/>',
        '<path d="M54 61.6C58 64.6 66 65.2 72.4 62.8" fill="none" stroke="#fffaf0" stroke-opacity=".4" stroke-width="1" stroke-linecap="round"/>',
    ].map((part) => part + mirror(part)).join('')}
    <path d="${NOSE}" fill="url(#socket)" stroke="${INK}" stroke-width=".8"/>
    <path d="M80 65.6V72.4" stroke="#8c7856" stroke-width=".9"/>
    <path d="M77.6 56C78.4 58.4 79.2 60 80 61C80.8 60 81.6 58.4 82.4 56" fill="none" stroke="#fffaf0" stroke-opacity=".5" stroke-width=".9" stroke-linecap="round"/>
    ${teeth(UPPER, 77)}
    <path d="${CRANIUM}" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;

const jawFront = () => `
    <path d="${MANDIBLE}" fill="url(#skull)" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/>
    <path d="${MANDIBLE}" fill="url(#skullShade)"/>
    ${teeth(LOWER, 91.6)}
    <path d="M73.6 100.6C77 102.4 83 102.4 86.4 100.6" fill="none" stroke="#fffaf0" stroke-opacity=".6" stroke-width="1" stroke-linecap="round"/>
    <circle cx="67" cy="96" r=".8" fill="${INK}"/><circle cx="93" cy="96" r=".8" fill="${INK}"/>`;

/** The sparks in the eye sockets. */
const eyes = () => `<g class="eyes">${[64, 96].map((x) => `<circle class="ember" cx="${x}" cy="54.6" r="7.4" fill="url(#ember)"/><circle cx="${x}" cy="54.6" r="1.7" fill="#dcfbff"/>`).join('')}</g>`;

const skullBack = () => `
    ${both(`<path d="${JAW_BACK}" fill="url(#skull)" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/>`)}
    <path d="${SKULL_BACK}" fill="url(#skull)"/>
    ${stains([[96, 26, 10], [60, 50, 8], [84, 74, 5]])}
    <path d="${SKULL_BACK}" fill="url(#skullShade)"/>
    <path d="${zigzag([80, 8], [78.6, 24], [80, 40], 14, 0.9)}${zigzag([80, 40], [64, 46], [50, 62], 14, 0.9).replace('M', 'L')}" fill="none" stroke="#6f5c3c" stroke-opacity=".7" stroke-width=".75" stroke-linejoin="round"/>
    <path d="${zigzag([80, 40], [96, 46], [110, 62], 14, 0.9)}" fill="none" stroke="#6f5c3c" stroke-opacity=".7" stroke-width=".75" stroke-linejoin="round"/>
    <path d="M60 72C68 68.4 74 67.6 80 70.4C86 67.6 92 68.4 100 72" fill="none" stroke="#6f5c3c" stroke-opacity=".6" stroke-width=".9" stroke-linecap="round"/>
    <ellipse cx="80" cy="68.6" rx="3.4" ry="2" fill="#fffaf0" fill-opacity=".45"/>
    <path d="M49 30C52 20 60 13 70 10" fill="none" stroke="#fffaf0" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/>
    <path d="${SKULL_BACK}" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;

// ---------- the headphones he wears at the decks ----------
const cupBack = () => `<g transform="translate(39.6 64)">
    <ellipse cx="2.6" rx="5.4" ry="11.4" fill="#141620"/>
    <ellipse rx="8.6" ry="13" fill="url(#cup)" stroke="#07080c" stroke-width=".9"/>
    <ellipse cx="-.6" rx="5.6" ry="9" fill="#1d2130"/>
    <ellipse class="led" cx="-.6" rx="5.6" ry="9" fill="none" stroke="#3ee6ff" stroke-width="1.2" filter="url(#glow)"/>
    <path d="M-6.4 -6C-5.6 -9.6 -3.4 -11.6 -.6 -12" fill="none" stroke="#8a93b4" stroke-opacity=".7" stroke-width=".9" stroke-linecap="round"/>
</g>`;
const phonesOn = () => `
    <path d="M41.4 58C36.6 20 54 1.6 80 1.6C106 1.6 123.4 20 118.6 58" fill="none" stroke="#1a1c27" stroke-width="5.4" stroke-linecap="round"/>
    <path d="M43.4 50C41.4 22 56 5 80 5C104 5 118.6 22 116.6 50" fill="none" stroke="#596079" stroke-opacity=".7" stroke-width="1.2"/>
    <path d="M64 3.6C69 1 91 1 96 3.6" stroke="#2c3040" stroke-width="7.4" stroke-linecap="round"/>
    <path d="M66 1.8C71 .2 89 .2 94 1.8" stroke="#6a7190" stroke-opacity=".6" stroke-width="1" stroke-linecap="round"/>
    ${cupBack()}${mirror(cupBack())}`;

// ---------- neck, collarbones, rib cage, breastbone ----------
const neckFront = () => `<rect x="76.6" y="97" width="6.8" height="14" fill="${INK}"/><g fill="url(#bone)" stroke="${INK}" stroke-width=".7">
    <path d="M75.6 101.4L71.2 102.4L71.6 104.2L75.6 103.6ZM84.4 101.4L88.8 102.4L88.4 104.2L84.4 103.6Z"/>
    <rect x="75.4" y="99.4" width="9.2" height="4.8" rx="1.6"/>
    <path d="M75.8 106.6L72 107.4L72.4 109L75.8 108.6ZM84.2 106.6L88 107.4L87.6 109L84.2 108.6Z"/>
    <rect x="75.6" y="105" width="8.8" height="4.8" rx="1.6"/>
</g>`;
const neckBack = () => `<rect x="77.2" y="84" width="5.6" height="24" fill="${INK}"/><g fill="url(#bone)" stroke="${INK}" stroke-width=".6">${[88.6, 94, 99.4, 104.6].map((y) => `<rect x="74.6" y="${y}" width="10.8" height="3" rx="1.2"/><path d="M78.2 ${y}C78.2 ${r1(y - 1)} 81.8 ${r1(y - 1)} 81.8 ${y}L80.6 ${r1(y + 4.4)}H79.4Z"/>`).join('')}</g>`;

const CLAVICLE = 'M77.4 110.2C70.6 112.6 63 107.4 52.4 108.4C50 108.6 48.8 110.2 49.4 111.8C50.2 113.2 51.8 113.4 53.6 112.8C63 111.2 70.6 116 77.4 113.8Z';
const ACROMION = `<ellipse cx="49.8" cy="109.8" rx="3.4" ry="2.3" fill="url(#bone)" stroke="${INK}" stroke-width=".8"/>`;

/** A rib from the breastbone (or the spine) at (x0, y) out to the side at xl, `drop` lower, `t` thick. */
const rib = (y, xl, drop, t, x0 = 76.6) => `M${x0} ${r1(y)}C70 ${r1(y - 0.6)} ${r1(xl + 7)} ${r1(y + drop * 0.25)} ${r1(xl + 1.2)} ${r1(y + drop)}C${r1(xl - 0.6)} ${r1(y + drop + 0.8)} ${r1(xl - 0.2)} ${r1(y + drop + t + 0.4)} ${r1(xl + 1.8)} ${r1(y + drop + t)}C${r1(xl + 8)} ${r1(y + drop * 0.3 + t)} 70 ${r1(y + t - 0.2)} ${x0} ${r1(y + t * 0.75)}Z`;
const ribShine = (y, xl, drop, x0 = 75) => `M${x0} ${r1(y + 0.9)}C70 ${r1(y + 0.3)} ${r1(xl + 7)} ${r1(y + drop * 0.25 + 0.9)} ${r1(xl + 2.4)} ${r1(y + drop + 0.9)}`;
const RIBS = [[113.6, 60, 3.6, 3], [119, 54.6, 5.6, 3.3], [124.4, 51.6, 7, 3.5], [129.8, 49.6, 8, 3.6], [135.2, 48.6, 8.6, 3.6], [140.6, 48.6, 9, 3.4]];
const RIBS_BACK = [[110.6, 60.4, 3.6, 2.8], [115.6, 55, 5, 3], [120.6, 52, 6.4, 3.2], [125.6, 50, 7.4, 3.3], [130.6, 49, 8.2, 3.4], [135.6, 48.6, 8.8, 3.4], [140.6, 48.8, 9.2, 3.3], [145.6, 49.8, 9.4, 3.1], [150.6, 52, 8.8, 2.8], [155.4, 55.6, 7, 2.4]];
const CAVITY = symmetric([80, 108], [[70, 108, 60, 110, 55, 114], [50, 120, 47.6, 130, 47.6, 140], [47.6, 150, 50.6, 158, 56, 161], [64, 160, 74, 154, 80, 152]]);
const COSTAL = 'M77.6 145C72 149 64 154 56 158C53 159.6 51 159 50.6 157.6C50.2 156 51.2 154.6 53 153.6C61 150 70 146 76.2 142.6Z';

const ribcageFront = () => {
    const side = `<path d="${RIBS.map(([y, xl, drop, t]) => rib(y - 7, xl + 1, drop + 7, t * 0.85, 80)).join('')}" fill="#7a6644" fill-opacity=".8" stroke="${INK}" stroke-width=".6"/>
        <path d="${RIBS.map(([y, xl, drop, t]) => rib(y, xl, drop, t)).join('')}" fill="url(#rib)" stroke="${INK}" stroke-width=".85" stroke-linejoin="round"/>
        <path d="${RIBS.map(([y, xl, drop]) => ribShine(y, xl, drop)).join('')}" fill="none" stroke="#fffaf0" stroke-opacity=".55" stroke-width=".8" stroke-linecap="round"/>
        <path d="${COSTAL}" fill="url(#rib)" stroke="${INK}" stroke-width=".85" stroke-linejoin="round"/>
        ${sticks([[49.8, 160.6, 54.8, 164.8, 2.4]])}`;

    return `<path d="${CAVITY}" fill="#0b0805" fill-opacity=".55"/>${side}${mirror(side)}
    <g fill="url(#bone)" stroke="${INK}" stroke-width=".8" stroke-linejoin="round">
        <path d="M73.4 110.4C75 109.2 77.6 110.6 80 110.6C82.4 110.6 85 109.2 86.6 110.4L85.2 117.6C82.6 118.6 77.4 118.6 74.8 117.6Z"/>
        <path d="M75.6 118.8H84.4L84 140.6C82.6 142.8 77.4 142.8 76 140.6Z"/>
        <path d="M77.6 142.6H82.4L80 150Z"/>
    </g>
    <path d="M76.4 125.2H83.6M76.2 131.4H83.8M76.2 137H83.8" stroke="#8d7752" stroke-opacity=".6" stroke-width=".7"/>
    <path d="${CLAVICLE}" fill="url(#bone)" stroke="${INK}" stroke-width=".85" stroke-linejoin="round"/>${mirror(`<path d="${CLAVICLE}" fill="url(#bone)" stroke="${INK}" stroke-width=".85" stroke-linejoin="round"/>`)}`;
};

const SCAPULA = 'M71.4 112.6L52.6 110.8C49.8 110.6 48.6 113.2 50 115.2C55 124 61 134 66.6 143C68.2 145.2 70.6 144.8 70.8 142.2C71.2 133 71.6 122 71.4 112.6Z';
const SCAPULA_SPINE = 'M71 118.4C64 116.4 56 113.4 49.4 110.8C48.2 112.4 48.8 114 50.2 114.6C57 117.2 64 120.2 70.6 121.8Z';

const ribcageBack = () => {
    const side = `<path d="${RIBS_BACK.map(([y, xl, drop, t]) => rib(y, xl, drop, t, 77)).join('')}" fill="url(#rib)" stroke="${INK}" stroke-width=".85" stroke-linejoin="round"/>
        <path d="${RIBS_BACK.map(([y, xl, drop]) => ribShine(y, xl, drop, 76)).join('')}" fill="none" stroke="#fffaf0" stroke-opacity=".5" stroke-width=".8" stroke-linecap="round"/>`;
    const blade = `<path d="${SCAPULA}" fill="url(#bone)" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"/>
        <path d="M70.6 122C66 128 64 134 66.6 142" fill="none" stroke="#8d7752" stroke-opacity=".5" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M70.6 123.4C64 122 57 119 51 116" fill="none" stroke="#3a2a14" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>
        <path d="${SCAPULA_SPINE}" fill="url(#bone)" stroke="${INK}" stroke-width=".8" stroke-linejoin="round"/>`;

    return `<path d="${CAVITY}" fill="#0b0805" fill-opacity=".6"/>${side}${mirror(side)}${spineBack()}${blade}${mirror(blade)}`;
};

const spineBack = () => `<rect x="77.4" y="106" width="5.2" height="62" fill="${INK}"/>
    <g fill="url(#bone)" stroke="${INK}" stroke-width=".6">
        ${Array.from({ length: 10 }, (_, i) => r1(108.6 + i * 4.3)).map((y) => `<rect x="74.4" y="${y}" width="11.2" height="3.2" rx="1.2"/><path d="M78 ${r1(y + 0.4)}C78 ${r1(y - 1)} 82 ${r1(y - 1)} 82 ${r1(y + 0.4)}L80.6 ${r1(y + 4.8)}H79.4Z"/>`).join('')}
        ${[152, 157.6, 163.2].map((y) => `<rect x="71.6" y="${r1(y + 1)}" width="16.8" height="2.6" rx="1.2"/><rect x="74.6" y="${y}" width="10.8" height="4.6" rx="1.6"/><path d="M77.6 ${y}H82.4L82 ${r1(y + 5)}H78Z"/>`).join('')}
    </g>`;

const lumbarFront = () => `<rect x="75.6" y="145" width="8.8" height="24" fill="${INK}"/>
    <g fill="url(#bone)" stroke="${INK}" stroke-width=".7">${[146, 152.2, 158.4, 164.6].map((y, i) => `<path d="M73.6 ${r1(y + 1.4)}L69.6 ${r1(y + 2)}L69.8 ${r1(y + 3.4)}L73.6 ${y + 3}ZM86.4 ${r1(y + 1.4)}L90.4 ${r1(y + 2)}L90.2 ${r1(y + 3.4)}L86.4 ${y + 3}Z"/><rect x="${r1(74 - i * 0.3)}" y="${y}" width="${r1(12 + i * 0.6)}" height="5" rx="1.8"/>`).join('')}</g>`;

// ---------- the pelvis ----------
const ILIUM = 'M75.6 169C70 163.6 59 160.6 51.6 163.6C47.6 165.4 47.6 170.6 50 175C52.6 179.6 57 182 61 183.6L65.6 186C68.6 180.6 72 175.6 76.4 172.6Z';
const SACRUM = 'M72.6 167.6C76 166.4 84 166.4 87.4 167.6C87.4 176 85 184 80 190.6C75 184 72.6 176 72.6 167.6Z';
const PUBIS = 'M64 187.6C68 189 74 190 79.2 190.6L79.2 197.4C75 198.4 71 200.4 67 199.6C62.6 198.6 61 193 64 187.6ZM66.8 194.4A3.8 2.6 0 1 0 74.4 194.4A3.8 2.6 0 1 0 66.8 194.4Z';
const both = (part) => part + mirror(part);

const pelvis = (back = false) => `<g fill="url(#bone)" stroke="${INK}" stroke-width=".9" stroke-linejoin="round">${both(`<path d="${ILIUM}"/>`)}<path d="${SACRUM}"/></g>
    ${back
        ? both('<path d="M51 168C54 164.6 62 163.4 70 166" fill="none" stroke="#fffaf0" stroke-opacity=".6" stroke-width="1.1" stroke-linecap="round"/><path d="M56 170C60 172 64 176 66 181" fill="none" stroke="#8d7752" stroke-opacity=".45" stroke-width="1" stroke-linecap="round"/>')
            + `<g fill="${INK}">${[171, 175.4, 179.6, 183.6].map((y, i) => `<circle cx="${r1(76 + i * 0.6)}" cy="${y}" r=".95"/><circle cx="${r1(84 - i * 0.6)}" cy="${y}" r=".95"/>`).join('')}</g>`
            + knobs([[80, 170.4, 1.3], [80, 174.8, 1.2], [80, 179, 1.1]], 0.5)
        : both('<path d="M73 170.4C68 166.4 60 165 54 166.8C58 170.4 62 175 63.6 181C67 177 70 173.6 73 170.4Z" fill="#3a2a14" fill-opacity=".35"/><path d="M50.4 168C52.4 164.2 60 162.2 69 164.8" fill="none" stroke="#fffaf0" stroke-opacity=".6" stroke-width="1.1" stroke-linecap="round"/>')
            + `<g fill="#3a2a14">${[[76.4, 172], [76.8, 176.6], [77.6, 181]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9"/><circle cx="${r1(160 - x)}" cy="${y}" r=".9"/>`).join('')}</g>`}
    <path d="M78.6 190L80 195.4L81.4 190Z" fill="url(#bone)" stroke="${INK}" stroke-width=".6"/>`;

const pubis = (back = false) => back
    ? both(`<path d="M66 190C64 192.6 64.4 196.6 67.4 197.6C70.4 198.4 72.6 196 72 193Z" fill="url(#bone)" stroke="${INK}" stroke-width=".8"/>`)
    : both(`<path d="${PUBIS}" fill="url(#bone)" fill-rule="evenodd" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"/>`);

// ---------- arms and hands (the left; the right is its mirror image) ----------
const FINGERS = [[-2.7, -4.1, 13.2, [4, 2.6, 2]], [-0.9, -1.4, 14.2, [4.6, 3, 2.3]], [0.9, 1.3, 14, [4.4, 2.9, 2.2]], [2.6, 3.9, 12.8, [3.6, 2.4, 1.9]]];

/** A hand from the wrist at (0, 0), the fingers down along +y and the thumb outward (-x); `fist` curls the fingers in. */
const hand = (fist = false) => {
    const list = [[-3.6, 3.6, -6.6, 9, 1.6], ...(fist ? [[-6.6, 9, -4.8, 12.6, 1.4], [-4.8, 12.6, -1.4, 13.4, 1.2]] : [[-6.6, 9, -8.2, 12.6, 1.4], [-8.2, 12.6, -9, 15.4, 1.2]])];
    for (const [x0, x1, y1, lens] of FINGERS) {
        list.push([x0, 6.4, x1, y1, 1.5]);
        if (fist) {
            list.push([x1, y1, r1(x1 * 0.9), r1(y1 - 3.4), 1.6]);
            continue;
        }
        const l0 = Math.hypot(x1 - x0, y1 - 6.4), dx = (x1 - x0) / l0, dy = (y1 - 6.4) / l0;
        let x = x1, y = y1;
        lens.forEach((l, i) => {
            list.push([r1(x), r1(y), r1(x + dx * l), r1(y + dy * l), [1.35, 1.2, 1.05][i]]);
            x += dx * l;
            y += dy * l;
        });
    }

    return `${sticks(list)}${knobs([[-2.9, 2.2, 2, 1.7], [0, 1.6, 1.9, 1.6], [2.9, 2.2, 1.9, 1.6], [-1.9, 4.9, 2, 1.6], [1.5, 5, 2, 1.6]], 0.55)}${fist ? knobs(FINGERS.map(([, x1, y1]) => [x1, y1, 1.5]), 0.5) : ''}`;
};

const arm = (side, fist = false) => `<g class="arm${side}">
    ${longBone([47.4, 116], [42.6, 145.4], 4.4, 2.5, 4)}
    ${knobs([[40.4, 145.6, 2.3], [45, 146, 2.5]])}
    <g class="fore${side}">
        ${longBone([44.4, 147], [43.8, 169.6], 2.3, 1.2, 1.5)}${longBone([40.8, 147.4], [40.4, 169.8], 1.5, 1.1, 2.4)}
        <g class="hand${side}"><g transform="translate(42.2 171)">${hand(fist)}</g></g>
    </g>
    <circle cx="47.6" cy="113.6" r="5.2" fill="url(#bone)" stroke="${INK}" stroke-width=".9"/>
</g>`;

// ---------- legs and feet ----------
const TOES = [[58.4, 53.8, 1.2], [60, 57, 1.25], [61.6, 60.2, 1.3], [63.2, 63.6, 1.45], [65.4, 67.6, 2]];
const foot = () => `${sticks(TOES.flatMap(([b, t, w]) => {
    const m = r1(b + (t - b) * 0.62);
    return [[b, 233.2, m, 236.8, w], [m, 236.8, t, 239, r1(w * 0.85)]];
}))}${knobs([[59.6, 232.6, 2.4, 1.7], [64.4, 232.8, 2.7, 1.8], [63.4, 229.8, 4.2, 2.5]], 0.6)}`;
const heel = () => `${sticks([[56.4, 234.6, 54.8, 238.4, 1.3], [70.2, 234.8, 71.8, 238.6, 1.6]])}${knobs([[63.4, 229.6, 3.8, 2.4]], 0.6)}
    <path d="M59 231.4C59 228.6 67.8 228.6 67.8 231.4C68.4 235 67 239.4 63.4 239.4C59.8 239.4 58.4 235 59 231.4Z" fill="url(#bone)" stroke="${INK}" stroke-width=".7"/>`;

const leg = (side, back = false) => `<g class="leg${side}">
    ${longBone([59.6, 188], [63.8, 209], 4, 2.7, 4.4)}
    <path d="M65.5 183.5L59.6 187.6" stroke="${INK}" stroke-width="6.4" stroke-linecap="round"/><path d="M65.5 183.5L59.6 187.6" stroke="#e6d6b4" stroke-width="5.4" stroke-linecap="round"/>
    ${knobs([[58.6, 187.6, 3.4], [65.5, 183.5, 3.9], [61.3, 209.6, 2.7], [66.2, 209.8, 2.7]], 0.85)}
    <g class="shin${side}">
        ${longBone([59.2, 213.4], [59.4, 229.6], 1.7, 0.9, 1.8)}${longBone([64.2, 212.4], [63.6, 229.4], 4.3, 2.3, 3.1)}
        <g class="foot${side}">${back ? heel() : foot()}</g>
    </g>
    ${back ? '' : `<ellipse cx="63.8" cy="208.8" rx="2.7" ry="3.3" fill="url(#bone)" stroke="${INK}" stroke-width=".8"/>`}
</g>`;

const defs = () => [
    rad('skull', [70, 34, 74], [[0, '#fffaf0'], [0.35, '#f0e4c8'], [0.7, '#d4c09a'], [1, '#9c865e']], true),
    rad('skullShade', [0.5, 0.42, 0.62], [[0.6, '#3b2a12', 0], [1, '#3b2a12', 0.55]]),
    rad('socket', [0.5, 0.62, 0.62], [[0, '#000'], [0.55, '#0f0b07'], [0.85, '#2f2416'], [1, '#5a4a30']]),
    lin('bone', [0, 0, 1, 0], [[0, '#fbf3df'], [0.4, '#eadcbc'], [0.78, '#c4ae84'], [1, '#8d7752']]),
    lin('rib', [77, 0, 66, 0], [[0, '#c3b79c'], [0.45, '#d8caa8'], [1, '#eadcbc']], true),
    lin('tooth', [0, 0, 0, 1], [[0, '#c8b48a'], [0.25, '#f2e8cf'], [1, '#fffaf0']]),
    rad('stain', [0.5, 0.5, 0.5], [[0, '#7a5a2a', 0.2], [1, '#7a5a2a', 0]]),
    rad('ember', [0.5, 0.5, 0.5], [[0, '#a8f6ff', 0.95], [0.35, '#2bc8ff', 0.5], [1, '#0a6cff', 0]]),
    lin('cup', [0, 0, 1, 1], [[0, '#4a5068'], [0.5, '#232634'], [1, '#0d0f16']]),
    `<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
].join('');

const motion = (state) => {
    const joints = { arm: '47.6px 113.6px', fore: '42.6px 146px', hand: '42.2px 171px', leg: '65.5px 183.5px', shin: '63.8px 209.6px', foot: '63.6px 229.6px' };
    const base = origins({
        all: '80px 238px', chest: '80px 170px', head: '80px 102px',
        ...Object.fromEntries(Object.entries(joints).flatMap(([part, o]) => [[`${part}L`, o], [`${part}R`, o]])),
    }, ['shadow', 'ember']);
    const always = `
        ${kf('ember', { 0: 'opacity:.6;transform:scale(.85)', 50: 'opacity:1;transform:scale(1.12)', 100: 'opacity:.6;transform:scale(.85)' })}
        ${kf('led', { 0: 'opacity:.45', 50: 'opacity:1', 100: 'opacity:.45' })}
        ${play('.ember', 'ember', 2.4)}${play('.led', 'led', 1.2)}`;
    const rules = {
        Standing: `
            ${kf('sway', { 0: 'transform:rotate(-.7deg)', 50: 'transform:rotate(.7deg)', 100: 'transform:rotate(-.7deg)' })}
            ${kf('rise', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-1.2px)', 100: 'transform:translateY(0)' })}
            ${kf('look', { 0: 'transform:rotate(-2deg)', 28: 'transform:rotate(-2deg)', 38: 'transform:rotate(4deg) translateY(.6px)', 66: 'transform:rotate(4deg) translateY(.6px)', 76: 'transform:rotate(-2deg)', 100: 'transform:rotate(-2deg)' })}
            ${kf('peek', { 0: 'transform:translateX(-1px)', 28: 'transform:translateX(-1px)', 36: 'transform:translateX(1.4px)', 66: 'transform:translateX(1.4px)', 74: 'transform:translateX(-1px)', 100: 'transform:translateX(-1px)' })}
            ${kf('clack', { 0: 'transform:translateY(0)', 80: 'transform:translateY(0)', 83: 'transform:translateY(3px)', 86: 'transform:translateY(0)', 89: 'transform:translateY(3px)', 92: 'transform:translateY(0)', 100: 'transform:translateY(0)' })}
            ${kf('hip', { 0: 'transform:rotate(28deg)', 50: 'transform:rotate(30deg)', 100: 'transform:rotate(28deg)' })}
            ${kf('hipFore', { 0: 'transform:rotate(-78deg)', 50: 'transform:rotate(-81deg)', 100: 'transform:rotate(-78deg)' })}
            ${kf('hang', { 0: 'transform:rotate(4deg)', 50: 'transform:rotate(8deg)', 100: 'transform:rotate(4deg)' })}
            ${kf('hangFore', { 0: 'transform:rotate(-2deg)', 50: 'transform:rotate(3deg)', 100: 'transform:rotate(-2deg)' })}
            ${kf('tap', { 0: 'transform:rotate(0)', 70: 'transform:rotate(0)', 75: 'transform:rotate(-10deg)', 80: 'transform:rotate(0)', 85: 'transform:rotate(-10deg)', 90: 'transform:rotate(0)', 100: 'transform:rotate(0)' })}
            ${play('.all', 'sway', 4.8)}${play('.chest', 'rise', 3.6)}${play('.head', 'look', 6.4)}${play('.eyes', 'peek', 6.4)}${play('.jaw', 'clack', 6.4)}
            ${play('.armL', 'hip', 3.6)}${play('.foreL', 'hipFore', 3.6, '-3.3s')}
            ${play('.armR', 'hang', 4.8)}${play('.foreR', 'hangFore', 4.8, '-4.4s')}${play('.handR', 'tap', 3.2)}
            ${pose('.armL', 'rotate(28deg)')}${pose('.foreL', 'rotate(-78deg)')}${pose('.handL', 'rotate(-18deg)')}${pose('.armR', 'rotate(6deg)')}${pose('.head', 'rotate(-2deg)')}`,
        Dancing: `
            ${kf('hop', { 0: 'transform:translateY(1.5px) scale(1.02,.98)', 50: 'transform:translateY(-4px) scale(.99,1.02)', 100: 'transform:translateY(1.5px) scale(1.02,.98)' })}
            ${kf('lean', { 0: 'transform:rotate(4deg)', 50: 'transform:rotate(-4deg)', 100: 'transform:rotate(4deg)' })}
            ${kf('bob', { 0: 'transform:rotate(-7deg)', 25: 'transform:rotate(0) translateY(2.4px)', 50: 'transform:rotate(7deg)', 75: 'transform:rotate(0) translateY(2.4px)', 100: 'transform:rotate(-7deg)' })}
            ${kf('chatter', { 0: 'transform:translateY(0)', 45: 'transform:translateY(3.4px)', 100: 'transform:translateY(0)' })}
            ${kf('swing', { 0: 'transform:rotate(125deg)', 50: 'transform:rotate(18deg)', 100: 'transform:rotate(125deg)' })}
            ${kf('elbow', { 0: 'transform:rotate(38deg)', 50: 'transform:rotate(-34deg)', 100: 'transform:rotate(38deg)' })}
            ${kf('flop', { 0: 'transform:rotate(26deg)', 50: 'transform:rotate(-24deg)', 100: 'transform:rotate(26deg)' })}
            ${kf('knee', { 0: 'transform:rotate(-9deg)', 50: 'transform:rotate(7deg)', 100: 'transform:rotate(-9deg)' })}
            ${kf('shin', { 0: 'transform:rotate(20deg)', 50: 'transform:rotate(-16deg)', 100: 'transform:rotate(20deg)' })}
            ${kf('heel', { 0: 'transform:rotate(-11deg)', 50: 'transform:rotate(9deg)', 100: 'transform:rotate(-11deg)' })}
            ${kf('shadowHop', { 0: 'transform:scale(1.04)', 50: 'transform:scale(.86)', 100: 'transform:scale(1.04)' })}
            ${play('.all', 'hop', 0.6)}${play('.chest', 'lean', 1.2)}${play('.head', 'bob', 1.2, '-1.08s')}${play('.jaw', 'chatter', 0.3)}${play('.ember', 'ember', 0.6)}
            ${play('.armL', 'swing', 1.2)}${play('.foreL', 'elbow', 1.2, '-1.1s')}${play('.handL', 'flop', 1.2, '-1.02s')}
            ${play('.armR', 'swing', 1.2, '-.6s')}${play('.foreR', 'elbow', 1.2, '-.5s')}${play('.handR', 'flop', 1.2, '-.42s')}
            ${['L', 'R'].map((s) => `${play(`.leg${s}`, 'knee', 0.6)}${play(`.shin${s}`, 'shin', 0.6)}${play(`.foot${s}`, 'heel', 0.6)}`).join('')}${play('.shadow', 'shadowHop', 0.6)}
            ${pose('.armL', 'rotate(125deg)')}${pose('.foreL', 'rotate(38deg)')}${pose('.handL', 'rotate(26deg)')}
            ${pose('.armR', 'rotate(18deg)')}${pose('.foreR', 'rotate(-34deg)')}${pose('.handR', 'rotate(-24deg)')}
            ${pose('.chest', 'rotate(4deg)')}${pose('.head', 'rotate(-7deg)')}
            ${pose('.legL', 'rotate(-9deg)')}${pose('.shinL', 'rotate(20deg)')}${pose('.footL', 'rotate(-11deg)')}${pose('.legR', 'rotate(7deg)')}${pose('.shinR', 'rotate(-16deg)')}${pose('.footR', 'rotate(9deg)')}`,
        DJing: `
            ${kf('jump', { 0: 'transform:translateY(0) scale(1.03,.97)', 40: 'transform:translateY(-9px) scale(.98,1.03)', 80: 'transform:translateY(0) scale(1.03,.97)', 100: 'transform:translateY(0) scale(1.03,.97)' })}
            ${kf('nod', { 0: 'transform:rotate(-4deg)', 40: 'transform:rotate(4deg) translateY(2.6px)', 100: 'transform:rotate(-4deg)' })}
            ${kf('rock', { 0: 'transform:rotate(-1.5deg)', 50: 'transform:rotate(1.5deg)', 100: 'transform:rotate(-1.5deg)' })}
            ${kf('pump', { 0: 'transform:rotate(138deg)', 40: 'transform:rotate(160deg)', 100: 'transform:rotate(138deg)' })}
            ${kf('pumpFore', { 0: 'transform:rotate(40deg)', 40: 'transform:rotate(12deg)', 100: 'transform:rotate(40deg)' })}
            ${kf('scratch', { 0: 'transform:rotate(14deg)', 50: 'transform:rotate(34deg)', 100: 'transform:rotate(14deg)' })}
            ${kf('kick', { 0: 'transform:rotate(0)', 40: 'transform:rotate(-7deg)', 80: 'transform:rotate(0)', 100: 'transform:rotate(0)' })}
            ${kf('kickShin', { 0: 'transform:rotate(0)', 40: 'transform:rotate(16deg)', 80: 'transform:rotate(0)', 100: 'transform:rotate(0)' })}
            ${kf('shadowJump', { 0: 'transform:scale(1.05)', 40: 'transform:scale(.74)', 80: 'transform:scale(1.05)', 100: 'transform:scale(1.05)' })}
            ${play('.all', 'jump', 0.6)}${play('.chest', 'rock', 1.2)}${play('.head', 'nod', 0.6, '-.54s')}
            ${play('.armL', 'pump', 0.6)}${play('.foreL', 'pumpFore', 0.6, '-.52s')}${play('.foreR', 'scratch', 0.3)}
            ${play('.legL', 'kick', 0.6)}${play('.shinL', 'kickShin', 0.6)}${play('.legR', 'kick', 0.6, '-.3s')}${play('.shinR', 'kickShin', 0.6, '-.3s')}${play('.shadow', 'shadowJump', 0.6)}
            ${pose('.armL', 'rotate(146deg)')}${pose('.foreL', 'rotate(28deg)')}${pose('.handL', 'rotate(10deg)')}
            ${pose('.armR', 'rotate(16deg)')}${pose('.foreR', 'rotate(24deg)')}${pose('.handR', 'rotate(10deg)')}
            ${pose('.head', 'rotate(-3deg)')}${pose('.legR', 'rotate(-6deg)')}${pose('.shinR', 'rotate(14deg)')}`,
    };

    return base + always + rules[state];
};

export function skully(state) {
    const back = state === 'DJing';
    const body = back
        ? `${leg('L', true)}${mirror(leg('R', true))}${pelvis(true)}${pubis(true)}
            <g class="chest">
                ${ribcageBack()}
                ${mirror(arm('R'))}
                ${neckBack()}
                <g class="head">${skullBack()}${phonesOn()}</g>
                ${arm('L', true)}
            </g>`
        : `${lumbarFront()}${pelvis()}${leg('L')}${mirror(leg('R'))}${pubis()}
            <g class="chest">
                ${ribcageFront()}
                ${neckFront()}
                <g class="head">
                    <path d="M62 78H98V92C92 96 68 96 62 92Z" fill="#120d08"/>
                    <g class="jaw">${jawFront()}</g>
                    ${skullFront()}${eyes()}
                </g>
                ${arm('L')}${mirror(arm('R'))}
                ${ACROMION}${mirror(ACROMION)}
            </g>`;

    return picture({
        label: 'Skully',
        state,
        defs: defs(),
        body: `${shadow()}<g class="all">${body}</g>`,
        css: motion(state),
    });
}
