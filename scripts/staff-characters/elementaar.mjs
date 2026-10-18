// Elementary ("the elemental"): a red pixel-art figure in a cap with the Cancer sign on it, aviator goggles, a gas mask with three filters and a zip hoodie, lit by a red aura.
// It is drawn on a 54 x 80 grid of 3-unit pixels by the painting code below (shapes, the lit edge, speckle, a black outline), so the picture stays crisp at any size and
// the animation moves whole pixels in steps. Standing, it breathes, looks about and the lenses glint. Dancing, it hops, throws its arms about and kicks. At the decks
// (seen from behind) it pumps one fist and scratches with the other arm. Everybody can wear it from level 12.
import { kf, picture, rad, shadow } from './kit.mjs';

const GW = 54, GH = 80, MID = 27; // the grid: the figure is centred on the line between columns 26 and 27, the feet end on the bottom row
const flip = (x) => GW - 1 - x;

// ---------- colours: five steps from dark to light for each material, `base` is the usual one; a flat material is one colour. Pixels of one group do not light each other's edges.
const ramp = (...c) => c;
const FABRIC = ramp('#2c0303', '#620707', '#a10c0c', '#d11515', '#f33f34');
const FABRIC_SHADE = ramp('#3c0404', '#700909', '#98100f', '#c01818', '#e03a32'); // the same red in the shade: it does not go as black
const MAT = {
    cap: { ramp: ramp('#2a0404', '#5c0808', '#8e0c0c', '#bd1212', '#e53a30') },
    band: { ramp: ramp('#1f0303', '#3f0606', '#690a0a', '#8f1010', '#b53228') },
    patch: { ramp: ramp('#140101', '#2b0404', '#430707', '#620c0c', '#8a1e1a'), grain: 0.06 },
    edge: { flat: '#b51818' },
    brim: { flat: '#180202', group: 'band' },
    hood: { ramp: ramp('#050000', '#100101', '#1f0303', '#340606', '#4d0b0b'), grain: 0.1, base: 2 },
    strap: { flat: '#3f0909', group: 'hood' },
    frame: { flat: '#090101' },
    rim: { ramp: ramp('#120202', '#2e0606', '#531010', '#7e1a1a', '#b02a28'), grain: 0.06 },
    lens: { ramp: ramp('#100202', '#280505', '#4a0a0a', '#721414', '#a02a26'), grain: 0.06 },
    glint: { flat: '#ffc2b8', group: 'lens' },
    glow: { flat: '#ff5a4a', group: 'lens' },
    mask: { ramp: ramp('#060000', '#120202', '#220505', '#380a0a', '#541414'), grain: 0.1 },
    metal: { ramp: ramp('#160303', '#3a0c0c', '#6a1616', '#9c2a26', '#d0524a'), grain: 0.1, group: 'metal', base: 3 },
    metalDark: { ramp: ramp('#060000', '#130202', '#260606', '#3e0e0e', '#5c1a1a'), grain: 0.08, group: 'metal', base: 1 },
    hoodie: { ramp: FABRIC, grain: 0.1, dark: 0.03 },
    hoodDark: { ramp: FABRIC, group: 'hoodie', base: 0, grain: 0.1 },
    rib: { ramp: FABRIC_SHADE, group: 'hoodie', base: 1, grain: 0.08, dark: 0 },
    hoodieDark: { ramp: FABRIC_SHADE, group: 'hoodie', base: 1, grain: 0.08, dark: 0 },
    cuff: { ramp: FABRIC, group: 'hoodie', base: 0, grain: 0.05 },
    seam: { flat: '#4a0707', group: 'hoodie' },
    zip: { flat: '#150101', group: 'hoodie' },
    zipHi: { flat: '#8a1818', group: 'hoodie' },
    pull: { flat: '#d8665a', group: 'hoodie' },
    string: { flat: '#c0463a', group: 'hoodie' },
    tooth: { flat: '#b32424', group: 'hoodie' },
    aglet: { flat: '#2a0505', group: 'hoodie' },
    glove: { ramp: ramp('#120101', '#2e0404', '#500808', '#741010', '#a02420'), grain: 0.1, dark: 0.03 },
    gloveSeam: { flat: '#2a0404', group: 'glove' },
    pants: { ramp: ramp('#260202', '#520606', '#850b0b', '#b21010', '#d82e28'), grain: 0.1, dark: 0.03 },
    pantsSeam: { flat: '#400606', group: 'pants' },
    boot: { ramp: ramp('#140101', '#300404', '#520808', '#781010', '#a42622'), grain: 0.1 },
    bootTop: { ramp: ramp('#140101', '#300404', '#520808', '#781010', '#a42622'), group: 'boot', base: 1 },
    sole: { flat: '#0a0000', group: 'boot' },
    lace: { flat: '#c23a30', group: 'boot' },
};
const OUTLINE = '#070000';

// ---------- noise that does not change with the order things are painted in (the same place always gets the same speckle)
const hash = (x, y, k = 0) => {
    let h = Math.imul(x + 374761393, 668265263) ^ Math.imul(y + 1274126177, 2246822519) ^ Math.imul(k + 97, 3266489917);
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);

    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const smooth = (t) => t * t * (3 - 2 * t);
const blotch = (x, y) => {
    const [gx, gy] = [Math.floor(x), Math.floor(y)], [fx, fy] = [smooth(x - gx), smooth(y - gy)];
    const top = hash(gx, gy, 7) * (1 - fx) + hash(gx + 1, gy, 7) * fx, bottom = hash(gx, gy + 1, 7) * (1 - fx) + hash(gx + 1, gy + 1, 7) * fx;

    return top * (1 - fy) + bottom * fy;
};

// ---------- a sprite: the grid of materials. `mode` 'sym' also paints the mirror image, 'flip' paints only the mirror image (the right-hand version of a left-hand drawing).
class Sprite {
    constructor(mode = '') { this.cells = new Array(GW * GH).fill(null); this.mode = mode; }
    get(x, y) { return x < 0 || y < 0 || x >= GW || y >= GH ? null : this.cells[y * GW + x]; }
    set(x, y, m) { if (x >= 0 && y >= 0 && x < GW && y < GH) this.cells[y * GW + x] = m; }
    put(x, y, m) {
        if (this.mode !== 'flip') this.set(x, y, m);
        if (this.mode) this.set(flip(x), y, m);
    }
    rect(x0, y0, x1, y1, m) { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) this.put(x, y, m); }
    rows(y0, spans, m) { spans.forEach(([l, r], i) => this.rect(l, y0 + i, r, y0 + i + 1, m)); }
    half(y0, widths, m) { widths.forEach((h, i) => this.rect(MID - h, y0 + i, MID + h, y0 + i + 1, m)); }
    ellipse(cx, cy, rx, ry, m) {
        for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) this.put(x, y, m);
    }
    capsule(ax, ay, bx, by, ra, rb, m) {
        const [dx, dy] = [bx - ax, by - ay], len2 = dx * dx + dy * dy || 1, r = Math.max(ra, rb);
        for (let y = Math.floor(Math.min(ay, by) - r); y <= Math.ceil(Math.max(ay, by) + r); y++) for (let x = Math.floor(Math.min(ax, bx) - r); x <= Math.ceil(Math.max(ax, bx) + r); x++) {
            const t = Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / len2));
            if (Math.hypot(x + 0.5 - (ax + dx * t), y + 0.5 - (ay + dy * t)) <= ra + (rb - ra) * t) this.put(x, y, m);
        }
    }
    /** A one-pixel line through the points (cell coordinates). */
    path(points, m) {
        for (let i = 1; i < points.length; i++) {
            const [ax, ay] = points[i - 1], [bx, by] = points[i], n = Math.max(Math.abs(bx - ax), Math.abs(by - ay), 1);
            for (let k = 0; k <= n; k++) this.put(Math.round(ax + ((bx - ax) * k) / n), Math.round(ay + ((by - ay) * k) / n), m);
        }
    }
    /** A filled polygon through the points (a cell is in when its middle is). */
    poly(points, m) {
        for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
            let inside = false;
            for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
                const [xi, yi] = points[i], [xj, yj] = points[j];
                if (yi > y + 0.5 !== yj > y + 0.5 && x + 0.5 < ((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi) inside = !inside;
            }
            if (inside) this.put(x, y, m);
        }
    }
}

/** Colours the cells: a lit edge on the top and left, a shaded one at the bottom and right, speckle and dark patches, then the black outline round the whole thing. */
function paint(sprite) {
    const colours = new Map(); // colour -> cells
    const add = (colour, x, y) => { if (!colours.has(colour)) colours.set(colour, new Set()); colours.get(colour).add(y * GW + x); };
    const group = (x, y) => { const m = sprite.get(x, y); return m ? MAT[m].group ?? m : null; };
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
        const m = sprite.get(x, y);
        if (!m) {
            if (sprite.get(x - 1, y) || sprite.get(x + 1, y) || sprite.get(x, y - 1) || sprite.get(x, y + 1)) add(OUTLINE, x, y);
            continue;
        }
        const mat = MAT[m];
        if (mat.flat) { add(mat.flat, x, y); continue; }
        const g = mat.group ?? m;
        let i = mat.base ?? 2;
        if (group(x, y - 1) !== g || group(x - 1, y) !== g) i += 1;
        else if (group(x + 1, y) !== g || group(x, y + 1) !== g || group(x + 1, y + 1) !== g) i -= 1;
        const r = hash(x, y), b = blotch(x / 3.2, y / 3.2);
        if (b > 0.76) i -= 1; else if (b < 0.2) i += 1;
        if (r < (mat.grain ?? 0.08)) i += hash(x, y, 1) < 0.65 ? -1 : 1;
        else if (r > 1 - (mat.dark ?? 0.025)) i -= 2;
        add(mat.ramp[Math.max(0, Math.min(4, i))], x, y);
    }

    return colours;
}

/** The cells of one colour as few rectangles as possible: runs along the rows, joined to the run above when it is exactly as wide. */
function rects(cells) {
    const out = [];
    let open = new Map();
    for (let y = 0; y < GH; y++) {
        const next = new Map();
        for (let x = 0; x < GW;) {
            if (!cells.has(y * GW + x)) { x++; continue; }
            let x1 = x;
            while (x1 < GW && cells.has(y * GW + x1)) x1++;
            const key = `${x},${x1}`, above = open.get(key);
            if (above) { above.h++; next.set(key, above); } else { const r = { x, y, w: x1 - x, h: 1 }; out.push(r); next.set(key, r); }
            x = x1;
        }
        open = next;
    }

    return out;
}

const draw = (sprite) => [...paint(sprite)].map(([colour, cells]) => `<path fill="${colour}" d="${rects(cells).map((r) => `M${r.x} ${r.y}h${r.w}v${r.h}h-${r.w}z`).join('')}"/>`).join('');
/** Single pixels of one flat colour (a glint, a light): no outline. */
const dots = (colour, cells) => `<path fill="${colour}" d="${cells.map(([x, y]) => `M${x} ${y}h1v1h-1z`).join('')}"/>`;

// ---------- the parts
const HEAD_ROWS = [12, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 12, 12, 12, 11, 11, 11, 10, 10, 9, 8, 7, 6, 4]; // the dark hood round the head, rows 14 to 37
const DOME = [6, 8, 9, 10, 10, 11, 11, 11, 11, 11, 11, 11, 11, 11]; // the cap, rows 0 to 13

function cap(s) {
    s.half(0, DOME, 'cap');
    s.half(14, [12, 12, 12], 'band');
    s.half(17, [12], 'brim');
}

function headFront() {
    const s = new Sprite();
    s.half(14, HEAD_ROWS, 'hood');
    // the mask: nose, cheeks and chin, with the filter in the middle and one on each cheek
    s.half(21, [3, 4, 5, 6, 7, 7, 7, 8, 8, 8, 8, 7, 7, 7, 6, 5, 3], 'mask');
    s.rect(25, 22, 26, 27, 'metalDark');
    s.ellipse(27, 31.5, 5.2, 6.0, 'metalDark');
    s.ellipse(27, 31.5, 4.2, 5.0, 'metal');
    s.ellipse(27, 31.5, 2.8, 3.5, 'metalDark');
    s.ellipse(27, 31.5, 1.5, 2.0, 'metal');
    s.mode = 'sym';
    s.rect(17, 30, 21, 35, 'mask');
    s.ellipse(12.5, 32.5, 5.2, 6.3, 'metalDark');
    s.ellipse(12.5, 32.5, 4.2, 5.3, 'metal');
    s.ellipse(12.5, 32.5, 2.8, 3.8, 'metalDark');
    s.ellipse(12.5, 32.5, 1.5, 2.1, 'metal');
    // the goggles: a strap round the head, two lenses and the bridge
    s.rect(14, 19, 16, 23, 'strap');
    s.rows(17, [[17, 24], [16, 25], [15, 26], [15, 26], [15, 26], [15, 26], [15, 26], [16, 25], [17, 24]], 'rim');
    s.rows(18, [[17, 24], [16, 25], [16, 25], [16, 25], [16, 25], [16, 25], [17, 24]], 'lens');
    s.mode = '';
    s.rect(25, 18, 29, 20, 'rim');
    cap(s);
    // the plate on the front of the cap, with its corners cut
    s.rect(21, 4, 33, 11, 'edge');
    s.rect(22, 5, 32, 10, 'patch');
    for (const [x, y] of [[21, 4], [32, 4], [21, 10], [32, 10]]) s.put(x, y, 'cap');

    return s;
}

function headBack() {
    const s = new Sprite();
    s.half(14, HEAD_ROWS, 'hood');
    s.mode = 'sym';
    // the side filters, seen from behind as barrels on the cheeks
    s.ellipse(10.5, 31.5, 3.2, 5.8, 'metalDark');
    s.ellipse(10.5, 31.5, 2.3, 4.8, 'metal');
    s.ellipse(10.5, 31.5, 1.2, 2.8, 'metalDark');
    // the straps of the mask meet at the back of the head
    s.path([[15, 33], [19, 28], [24, 25], [27, 24]], 'strap');
    s.path([[15, 29], [20, 25], [27, 23]], 'strap');
    s.mode = '';
    s.rect(26, 24, 28, 37, 'strap');
    // the goggle strap round the head, with its buckle
    s.rect(14, 18, 40, 22, 'strap');
    s.rect(14, 19, 40, 20, 'hood');
    s.rect(34, 18, 38, 22, 'metalDark');
    cap(s);
    s.rect(24, 14, 30, 17, 'brim'); // the gap of the cap's strap
    s.rect(25, 15, 29, 16, 'frame');

    return s;
}

function torso(back) {
    const s = new Sprite();
    s.half(38, [8, 9, ...Array(22).fill(10)], 'hoodie');
    s.half(37, back ? [6, 6] : [6, 6, 5, 5, 4, 3, 2, 1], back ? 'hoodieDark' : 'hoodDark'); // the neck, where the hood folds down
    // the hem
    for (let x = 17; x < 37; x++) for (const y of [60, 61]) s.put(x, y, x % 2 ? 'rib' : 'seam');
    if (!back) {
        s.poly([[18, 57], [20, 52], [23, 50], [31, 50], [34, 52], [36, 57], [36, 60], [18, 60]], 'hoodieDark'); // the pocket
        s.path([[18, 57], [20, 52], [23, 50], [26, 50]], 'seam');
        s.path([[35, 57], [33, 52], [30, 50], [27, 50]], 'seam');
        s.rect(26, 45, 27, 60, 'zip');
        s.rect(27, 45, 28, 60, 'zipHi');
        for (let y = 46; y < 60; y += 2) s.put(27, y, 'tooth');
        s.rect(26, 45, 28, 48, 'pull');
        s.rect(26, 47, 28, 48, 'zip');
        s.rect(23, 42, 24, 49, 'string');
        s.rect(30, 42, 31, 49, 'string');
        s.rect(23, 49, 24, 51, 'aglet');
        s.rect(30, 49, 31, 51, 'aglet');
    } else {
        s.ellipse(27, 46, 9.5, 8.2, 'hoodieDark'); // the hood lying on the back
        s.path([[18, 42], [19, 46], [22, 51], [27, 53]], 'seam');
        s.path([[36, 42], [35, 46], [32, 51], [27, 53]], 'seam');
        s.rect(26, 40, 27, 52, 'seam');
    }

    return s;
}

/** The arms: where the shoulder is, then the segments of the sleeve (to, radius) and where the glove sits. Drawn for the left; the right one is the mirror image. */
const SHOULDER = [13.6, 42.4];
const ARMS = {
    down: { sleeve: [[12.8, 56.0, 3.2]], glove: [12.6, 59.8] },
    side: { sleeve: [[5.2, 46.2, 3.4], [4.0, 37.6, 3.1]], glove: [3.8, 33.8] },
    up: { sleeve: [[7.2, 31.0, 3.1]], glove: [5.8, 27.2] },
    high: { sleeve: [[8.4, 29.0, 3.1]], glove: [7.4, 25.2] },
    low: { sleeve: [[7.6, 33.0, 3.1]], glove: [6.2, 29.2] },
    // at the decks the forearm reaches forward, past the edge of the body, so only the upper arm and the elbow are in view
    rest: { sleeve: [[10.2, 51.2, 3.5], [15.4, 54.6, 3.1]], glove: [18.4, 56.0] },
    scratchL: { sleeve: [[9.4, 50.8, 3.5], [14.2, 55.0, 3.1]], glove: [17.0, 56.8] },
    scratchR: { sleeve: [[11.2, 51.6, 3.5], [16.4, 54.0, 3.1]], glove: [19.6, 55.0] },
};

function arm(name, right) {
    const s = new Sprite(right ? 'flip' : '');
    const { sleeve, glove } = ARMS[name];
    let [px, py, pr] = [...SHOULDER, 3.8];
    for (const [x, y, r] of sleeve) { s.capsule(px, py, x, y, pr, r, 'hoodie'); [px, py, pr] = [x, y, r]; }
    const [wx, wy] = [px, py], [gx, gy] = glove, len = Math.hypot(gx - wx, gy - wy) || 1, [ux, uy] = [(gx - wx) / len, (gy - wy) / len];
    s.capsule(wx - ux * 2.2, wy - uy * 2.2, wx + ux * 0.4, wy + uy * 0.4, pr + 0.3, pr + 0.3, 'cuff'); // the cuff
    s.ellipse(gx, gy, 3.3, 3.9, 'glove');
    s.ellipse(gx + 2.7, gy - 1.2, 1.3, 2, 'glove'); // the thumb, on the side of the body
    s.path([[Math.round(gx) - 1, Math.round(gy) + 1], [Math.round(gx) - 1, Math.round(gy) + 3]], 'gloveSeam');
    s.path([[Math.round(gx) + 1, Math.round(gy) + 1], [Math.round(gx) + 1, Math.round(gy) + 3]], 'gloveSeam');

    return s;
}

function leg(right, back) {
    const s = new Sprite(right ? 'flip' : '');
    s.rect(17, 59, 26, 74, 'pants');
    s.path([[22, 64], [22, 66]], 'pantsSeam');
    s.path([[20, 68], [21, 70]], 'pantsSeam');
    s.path([[24, 66], [23, 68]], 'pantsSeam');
    if (back) { s.rect(18, 63, 23, 64, 'pantsSeam'); s.rect(18, 63, 19, 67, 'pantsSeam'); s.rect(22, 63, 23, 67, 'pantsSeam'); s.rect(18, 66, 23, 67, 'pantsSeam'); }
    s.rect(16, 74, 26, 76, 'bootTop');
    s.rect(17, 73, 26, 74, 'seam');
    s.rows(76, [[15, 26], [15, 26], [14, 26], [14, 26]], 'boot');
    if (!back) { s.rect(14, 78, 19, 79, 'lace'); s.path([[18, 76], [22, 76]], 'lace'); } else s.rect(16, 77, 26, 78, 'bootTop');
    s.rect(14, 79, 26, 80, 'sole');

    return s;
}

// ---------- vector bits: the Cancer sign (two rings, each with a tail that curls round the other) and the aura
const CANCER = (extra = '') => `<g fill="none" stroke-linecap="round" shape-rendering="geometricPrecision" ${extra}><circle cx="-2.9" cy="1" r="1.1"/><circle cx="2.9" cy="-1" r="1.1"/><path d="M-3.9 0.5C-4.2 -2.2 1 -3 4.4 -1.8"/><path d="M3.9 -0.5C4.2 2.2 -1 3 -4.4 1.8"/></g>`;

// ---------- motion: whole pixels, in steps
const STEP = 'steps(1,end)';
const run = (sel, name, seconds) => `${sel}{animation:${name} ${seconds}s ${STEP} infinite}`;
const pct = (i, n) => String(Math.round((i / n) * 10000) / 100);
/** `values` is one value for each equal slice of the loop: the keyframes that hold each one for its slice. */
const track = (name, prop, values) => kf(name, Object.fromEntries(values.map((v, i) => [pct(i, values.length), `${prop}:${v}`]).filter(([, d], i, all) => i === 0 || d !== all[i - 1][1])));
const move = (sel, name, seconds, xs, ys) => track(name, 'transform', xs.map((x, i) => `translate(${x}px,${ys[i]}px)`)) + run(sel, name, seconds);
/** Which look of a part shows in each slice of the loop (0 is the first, which is also the pose when nothing moves): the opacity of every look. */
const looks = (part, count, seq, seconds) => Array.from({ length: count }, (_, k) => track(`${part}${k}`, 'opacity', seq.map((v) => (v === k ? 1 : 0))) + run(`.${part}${k}`, `${part}${k}`, seconds)).join('');
const hideOthers = (part, count) => Array.from({ length: count - 1 }, (_, k) => `.${part}${k + 1}`).join(',') + '{opacity:0}';
const zero = (n) => Array(n).fill(0);

const GLINT_SEQ = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 0, 0, 0, 0, 0]; // 4 s: the lenses catch the light once

const motion = (state) => {
    const common = '.shadow,.floor{transform-box:fill-box;transform-origin:center}' + kf('aura', { 0: 'opacity:.78', 50: 'opacity:1', 100: 'opacity:.78' });
    if (state === 'Standing') {
        return common + `.aura{animation:aura 3.2s ease-in-out infinite}` +
            move('.up', 'breathe', 3.2, [0, 0], [0, 1]) +
            move('.hd', 'look', 8, [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, -1, -1, 0, 0, 0, 0], zero(16)) +
            looks('gl', 4, GLINT_SEQ, 4) + hideOthers('gl', 4) +
            track('led', 'opacity', [1, 0.35]) + run('.led', 'led', 1.6);
    }
    if (state === 'Dancing') {
        const hop = [0, -1, -2, -1, 0, -1, -2, -1];
        return common + `.aura{animation:aura 1.2s ease-in-out infinite}` +
            move('.all', 'hop', 1.2, zero(8), hop) +
            move('.hd', 'nod', 1.2, [-1, -1, -1, -1, 1, 1, 1, 1], [1, 0, 0, 0, 1, 0, 0, 0]) +
            move('.lgL', 'kickL', 1.2, zero(8), [0, 0, -1, 0, 0, 0, 0, 0]) + move('.lgR', 'kickR', 1.2, zero(8), [0, 0, 0, 0, 0, 0, -1, 0]) +
            track('shrink', 'transform', hop.map((h) => `scale(${1 + h * 0.07})`)) + run('.shadow,.floor', 'shrink', 1.2) +
            looks('aL', 3, [0, 0, 1, 1, 2, 2, 1, 1], 1.2) + looks('aR', 3, [0, 0, 1, 1, 2, 2, 0, 0], 1.2) + hideOthers('aL', 3) + hideOthers('aR', 3) +
            looks('gl', 4, [0, 1, 2, 3, 0, 0, 0, 0], 1.2) + hideOthers('gl', 4) +
            track('led', 'opacity', [1, 0.35, 1, 0.35]) + run('.led', 'led', 0.6);
    }

    return common + `.aura{animation:aura 1s ease-in-out infinite}` +
        move('.all', 'groove', 1, zero(8), [0, -1, -1, 0, 0, -1, -1, 0]) +
        move('.hd', 'nod', 1, zero(8), [1, 0, 0, 1, 1, 0, 0, 1]) +
        track('shrink', 'transform', [1, 0.93, 0.93, 1, 1, 0.93, 0.93, 1].map((s) => `scale(${s})`)) + run('.shadow,.floor', 'shrink', 1) +
        looks('aR', 2, [0, 0, 0, 0, 1, 1, 1, 1], 1) + looks('aL', 3, [0, 1, 0, 2, 0, 1, 0, 2], 1) + hideOthers('aR', 2) + hideOthers('aL', 3);
};

// ---------- put it together
const DEFS = rad('aura', [0.5, 0.5, 0.5], [[0, '#ff2a1a', 0.6], [0.55, '#ff2a1a', 0.5], [0.8, '#ff2a1a', 0.2], [1, '#ff2a1a', 0]]) +
    rad('floor', [0.5, 0.5, 0.5], [[0, '#ff2a1a', 0.5], [0.6, '#ff2a1a', 0.2], [1, '#ff2a1a', 0]]);

const layer = (cls, sprite, extra = '') => `<g class="${cls}">${draw(sprite)}${extra}</g>`;
const GRID = (inner) => `<g shape-rendering="crispEdges"><g transform="translate(-1 -2) scale(3)">${inner}</g></g>`;

export function elementaar(state) {
    const dancing = state === 'Dancing', back = state === 'DJing';
    const glint = [[[17, 23], [18, 22], [19, 21]], [[19, 23], [20, 22], [21, 21]], [[21, 23], [22, 22], [23, 21]]];
    const lenses = `<path fill="#ffc2b8" d="M17 19h2v1h-2zM30 19h2v1h-2zM17 20h1v1h-1zM30 20h1v1h-1z"/>` + glint.map((cells, i) => `<g class="gl${i + 1}">${dots('#ffc2b8', cells)}${dots('#ffc2b8', cells.map(([x, y]) => [x + 13, y]))}</g>`).join('');
    const led = `<g class="led">${dots('#ff6a5a', [[26, 31], [27, 31], [26, 32], [27, 32]])}</g>`;
    const glyph = `<g transform="translate(27 7.5) scale(.9)">${CANCER('stroke="#ffe9e4" stroke-width=".55"')}</g>`;
    const backGlyph = `<g transform="translate(27 57) scale(.9)" opacity=".8">${CANCER('stroke="#ff8a7a" stroke-width=".6"')}</g>`;

    let figure;
    if (!back) {
        const armsFor = dancing ? { L: ['up', 'side', 'down'], R: ['side', 'down', 'up'] } : { L: ['down'], R: ['down'] };
        const arms = (side) => armsFor[side].map((name, i) => layer(armsFor[side].length > 1 ? `a${side}${i}` : `a${side}`, arm(name, side === 'R'))).join('');
        figure = `<g class="all"><g class="lgL">${draw(leg(false))}</g><g class="lgR">${draw(leg(true))}</g><g class="up">${draw(torso(false))}<g class="hd">${draw(headFront())}${lenses}${glyph}${led}</g>${arms('L')}${arms('R')}</g></g>`;
    } else {
        const arms = (side, names) => names.map((name, i) => layer(`a${side}${i}`, arm(name, side === 'R'))).join('');
        figure = `<g class="all"><g class="lgL">${draw(leg(false, true))}</g><g class="lgR">${draw(leg(true, true))}</g><g class="up">${arms('L', ['rest', 'scratchL', 'scratchR'])}${draw(torso(true))}${backGlyph}<g class="hd">${draw(headBack())}</g>${arms('R', ['high', 'low'])}</g></g>`;
    }

    return picture({
        label: 'Elementary',
        state,
        defs: DEFS,
        body: `<g class="aura"><ellipse cx="80" cy="54" rx="74" ry="66" fill="url(#aura)"/><ellipse cx="80" cy="152" rx="90" ry="82" fill="url(#aura)"/><ellipse cx="80" cy="198" rx="64" ry="46" fill="url(#aura)"/></g>${shadow()}<ellipse class="floor" cx="80" cy="236" rx="60" ry="10" fill="url(#floor)"/>${GRID(figure)}`,
        css: motion(state),
    });
}
