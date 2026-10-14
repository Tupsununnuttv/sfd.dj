// Rift: a raven mage. A deep violet hood with a gold arch and a glowing diamond on the brow, purple glowing eyes and a big grey beak, a feather mantle
// with cyan tips, a galaxy amulet with a ring, a robe stitched with glowing runes, a feather cape that turns to starlight at the bottom, raven feet with
// gold cuffs, and a twisted staff whose crescent holds a galaxy orb. Crystals and sparks float around him. Everybody can wear him from level 25.
import { kf, lin, mirror, origins, picture, play, pose, rad, shadow } from './kit.mjs';

const r1 = (n) => Math.round(n * 10) / 10;

/** A feather: a pointed leaf from its root (x0, y0) to its tip (x1, y1), about `w` wide, bowed sideways by `bow` (a share of its length). */
const quill = (x0, y0, x1, y1, w, bow = 0) => {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
    const nx = -dy / len, ny = dx / len;
    const cx = x0 + dx * 0.42 + nx * bow * len, cy = y0 + dy * 0.42 + ny * bow * len;
    const a = `${r1(cx + nx * w)} ${r1(cy + ny * w)}`, b = `${r1(cx - nx * w)} ${r1(cy - ny * w)}`;

    return { d: `M${x0} ${y0}Q${a} ${x1} ${y1}Q${b} ${x0} ${y0}Z`, edge: `M${x0} ${y0}Q${a} ${x1} ${y1}`, vein: `M${x0} ${y0}Q${r1(cx)} ${r1(cy)} ${x1} ${y1}` };
};

const feathers = (list, fill) => list.map((f) => `<path d="${quill(...f).d}" fill="${fill}" stroke="#0b0824" stroke-width=".8" stroke-linejoin="round"/>`).join('');
const veins = (list, color, opacity) => `<path d="${list.map((f) => quill(...f).vein).join('')}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width=".9" stroke-linecap="round"/>`;
const edges = (list, color, opacity, width = 1) => `<path d="${list.map((f) => quill(...f).edge).join('')}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${width}" stroke-linecap="round"/>`;

/** A star with `n` points, `big` and `small` long in turn, around (cx, cy). */
const star = (cx, cy, n, big, small, inner) =>
    Array.from({ length: n * 2 }, (_, i) => {
        const a = (Math.PI * i) / n - Math.PI / 2;
        const r = i % 2 ? inner : (i / 2) % 2 ? small : big;
        return `${i ? 'L' : 'M'}${r1(cx + r * Math.cos(a))} ${r1(cy + r * Math.sin(a))}`;
    }).join('') + 'Z';

/** A four-pointed spark. */
const spark = (x, y, r, color, delay) => {
    const k = r * 0.2;
    return `<path class="spark" style="animation-delay:${delay}s" d="M${x} ${r1(y - r)}Q${r1(x + k)} ${r1(y - k)} ${r1(x + r)} ${y}Q${r1(x + k)} ${r1(y + k)} ${x} ${r1(y + r)}Q${r1(x - k)} ${r1(y + k)} ${r1(x - r)} ${y}Q${r1(x - k)} ${r1(y - k)} ${x} ${r1(y - r)}Z" fill="${color}"/>`;
};

/** A tilted ring around (cx, cy): 'back' is the arc behind what it circles, 'front' the arc before it, with a bright dash running round. */
const ring = (cx, cy, rx, ry, tilt, half) => `<g transform="rotate(${tilt} ${cx} ${cy})">${half === 'back'
    ? `<path d="M${cx - rx} ${cy}A${rx} ${ry} 0 0 1 ${cx + rx} ${cy}" fill="none" stroke="#7cf3ff" stroke-opacity=".5" stroke-width="1.2"/>`
    : `<g filter="url(#glow)"><path d="M${cx - rx} ${cy}A${rx} ${ry} 0 0 0 ${cx + rx} ${cy}" fill="none" stroke="#8ff6ff" stroke-width="1.5"/><ellipse class="orbit" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" pathLength="100" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="9 91"/></g>`}</g>`;

/** A floating crystal, `w` wide and `h` tall from its middle, with a soft light around it and, if asked, a ring. */
const crystal = (x, y, w, h, delay, ringed = false) => `<g class="crystal" style="animation-delay:${delay}s">
    <ellipse cx="${x}" cy="${y}" rx="${r1(w * 2.6)}" ry="${r1(h * 1.35)}" fill="url(#halo)"/>
    ${ringed ? ring(x, y, r1(w * 2.4), r1(w * 0.75), -20, 'back') : ''}
    <path d="M${x} ${r1(y - h)}L${r1(x + w)} ${r1(y - h * 0.3)}L${r1(x + w * 0.75)} ${r1(y + h * 0.5)}L${x} ${r1(y + h)}L${r1(x - w * 0.75)} ${r1(y + h * 0.5)}L${r1(x - w)} ${r1(y - h * 0.3)}Z" fill="url(#crystal)" stroke="#dbe4ff" stroke-width=".5" stroke-linejoin="round"/>
    <path d="M${x} ${r1(y - h)}L${r1(x - w)} ${r1(y - h * 0.3)}L${r1(x - w * 0.75)} ${r1(y + h * 0.5)}L${x} ${r1(y + h)}Z" fill="#fff" fill-opacity=".24"/>
    <path d="M${x} ${r1(y - h)}V${r1(y + h)}M${r1(x - w)} ${r1(y - h * 0.3)}L${x} ${r1(y - h * 0.05)}L${r1(x + w)} ${r1(y - h * 0.3)}" fill="none" stroke="#eef2ff" stroke-opacity=".6" stroke-width=".5"/>
    ${ringed ? ring(x, y, r1(w * 2.4), r1(w * 0.75), -20, 'front') : ''}
</g>`;

/** A galaxy in a ball: a violet glow with two spiral arms (they turn) and a few stars. */
const galaxy = (cx, cy, r) => {
    const p = (x, y) => `${r1(cx + x * r)} ${r1(cy + y * r)}`;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#orb)"/>
    <g class="swirl">
        <path d="M${p(-0.8, 0.12)}Q${p(-0.35, -0.62)} ${p(0.22, -0.3)}Q${p(0.42, 0.04)} ${p(0.02, 0.14)}" fill="none" stroke="#d8c8ff" stroke-opacity=".85" stroke-width="${r1(r * 0.13)}" stroke-linecap="round"/>
        <path d="M${p(0.8, -0.12)}Q${p(0.35, 0.62)} ${p(-0.22, 0.3)}Q${p(-0.42, -0.04)} ${p(-0.02, -0.14)}" fill="none" stroke="#93c5fd" stroke-opacity=".8" stroke-width="${r1(r * 0.13)}" stroke-linecap="round"/>
        <circle cx="${cx}" cy="${cy}" r="${r1(r * 0.2)}" fill="#fff"/>
        <circle cx="${r1(cx - r * 0.5)}" cy="${r1(cy + r * 0.45)}" r="${r1(r * 0.06)}" fill="#fff"/><circle cx="${r1(cx + r * 0.55)}" cy="${r1(cy - r * 0.5)}" r="${r1(r * 0.05)}" fill="#fff"/><circle cx="${r1(cx + r * 0.3)}" cy="${r1(cy + r * 0.62)}" r="${r1(r * 0.05)}" fill="#e0e7ff"/>
    </g>
    <ellipse cx="${r1(cx - r * 0.38)}" cy="${r1(cy - r * 0.45)}" rx="${r1(r * 0.32)}" ry="${r1(r * 0.18)}" transform="rotate(-35 ${r1(cx - r * 0.38)} ${r1(cy - r * 0.45)})" fill="#fff" fill-opacity=".7"/>`;
};

// ---------- the cape: long feathers from each shoulder (drawn for the left, the right is the mirror image) and, seen from behind, three down the back ----------
const WING = [[44, 104, -4, 188, 21, 0.09], [46, 108, 5, 201, 21, 0.06], [48, 112, 19, 207, 19, 0.04], [50, 116, 34, 208, 17, 0.02]];
const COVERT = [[46, 102, 18, 148, 15, 0.05], [48, 106, 26, 156, 13, 0.03]];
const CAPE = [[66, 100, 50, 206, 32, 0.02], [94, 100, 110, 206, 32, -0.02], [80, 100, 80, 212, 32, 0]];

/** Stars caught in the feathers: [x, y, r, colour, twinkles]. */
const WING_STARS = [[0, 181, 1.2, '#fff', 1], [6, 191, 0.8, '#bfe9ff', 0], [10, 173, 1, '#e3d7ff', 1], [13, 198, 1.3, '#fff', 0], [20, 187, 0.7, '#bfe9ff', 1], [26, 201, 1, '#fff', 0], [30, 181, 0.8, '#e3d7ff', 0], [7, 163, 0.7, '#fff', 0], [17, 169, 1.1, '#bfe9ff', 1], [34, 198, 0.7, '#fff', 1], [3, 171, 0.6, '#fff', 0], [22, 159, 0.6, '#e3d7ff', 0], [38, 191, 0.9, '#bfe9ff', 0], [17, 204, 0.8, '#fff', 1], [2, 187, 0.5, '#fff', 0], [28, 193, 0.5, '#fff', 0]];
const CAPE_STARS = [[58, 184, 1.1, '#fff', 1], [68, 198, 0.8, '#bfe9ff', 0], [76, 172, 0.7, '#e3d7ff', 0], [86, 192, 1.3, '#fff', 1], [96, 180, 0.8, '#bfe9ff', 1], [102, 198, 1, '#fff', 0], [64, 166, 0.6, '#fff', 0], [92, 162, 0.6, '#e3d7ff', 0], [80, 206, 0.9, '#fff', 1], [72, 186, 0.5, '#fff', 0], [88, 204, 0.6, '#bfe9ff', 0], [56, 200, 0.7, '#e3d7ff', 1], [84, 154, 0.5, '#fff', 0], [70, 144, 0.6, '#bfe9ff', 1]];
const stars = (list, clip) => `<g clip-path="url(#${clip})">${list.map(([x, y, r, c, t], i) => `<circle${t ? ` class="glint" style="animation-delay:${r1((i * 0.37) % 2)}s"` : ''} cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('')}</g>`;

const wing = (cls) => `<g class="${cls}">
    ${feathers(WING, 'url(#wing)')}
    ${stars(WING_STARS, 'wingClip')}
    ${veins(WING, '#a5b4fc', 0.22)}
    ${edges(WING.slice(0, 1), '#7af5ff', 0.6, 1.1)}
    ${feathers(COVERT, 'url(#feather)')}
    ${veins(COVERT, '#8b7dff', 0.3)}
</g>`;

const cape = () => `${feathers(CAPE, 'url(#wing)')}${stars(CAPE_STARS, 'capeClip')}${veins(CAPE, '#a5b4fc', 0.22)}`;

// ---------- legs and feet: chunky raven toes with claws under a gold cuff (the left one; the right is its mirror image) ----------
const foot = (cls, back = false) => `<g class="${cls}">
    <path d="M53.6 194H66.4V218H53.6Z" fill="url(#talon)"/>
    ${back
        ? `<ellipse cx="60" cy="228" rx="9" ry="8.4" fill="url(#talon)" stroke="#06060a" stroke-width=".7"/>
    <path d="M45.6 232Q47.6 225 53 227.4L51.6 237Q46.2 237.2 45.6 232ZM74.4 232Q72.4 225 67 227.4L68.4 237Q73.8 237.2 74.4 232Z" fill="url(#talon)" stroke="#06060a" stroke-width=".6"/>
    <path d="M56.4 233Q60 236.6 63.6 233L60.6 241.6H59.4Z" fill="#0a0a0f"/>
    <path d="M54.4 223.6Q60 221 65.6 223.6" fill="none" stroke="#9998b0" stroke-opacity=".45" stroke-width=".9" stroke-linecap="round"/>`
        : `<path d="M53.4 217Q44.6 219.6 42 230.4Q42.6 236.4 48.4 235.4Q52.6 230 56.4 223.6Z" fill="url(#talon)" stroke="#06060a" stroke-width=".7"/>
    <path d="M66.6 217Q75.4 219.6 78 230.4Q77.4 236.4 71.6 235.4Q67.4 230 63.6 223.6Z" fill="url(#talon)" stroke="#06060a" stroke-width=".7"/>
    <path d="M54.6 217Q53 231 60 238.6Q67 231 65.4 217Z" fill="url(#talon)" stroke="#06060a" stroke-width=".7"/>
    <path d="M58.4 237.4L60 241.8L61.6 237.4ZM42.4 231.2L40.6 236.4L45 234.4ZM77.6 231.2L79.4 236.4L75 234.4Z" fill="#0a0a0f"/>
    <path d="M57.6 222Q58.2 229 60 233M46 229Q48.6 225.6 52.6 222.6M74 229Q71.4 225.6 67.4 222.6" fill="none" stroke="#a3a2bb" stroke-opacity=".5" stroke-width=".9" stroke-linecap="round"/>`}
    <rect x="50.4" y="209.6" width="19.2" height="7.8" rx="3.4" fill="url(#gold)" stroke="#5a3510" stroke-width=".6"/>
    <path d="M53.4 212.2H66.6" stroke="#fff6d8" stroke-opacity=".6" stroke-width=".8" stroke-linecap="round"/>
</g>`;

// ---------- the robe ----------
const ROBE = 'M48 100C43 132 38 170 35 198Q57 208 80 208Q103 208 125 198C122 170 117 132 112 100Z';
const PANEL = 'M48 100C43 132 38 170 35 198Q48 202 63 202L70 108Z';
const TRIM = 'M70 108L63 202Q48 202 35 198';
const runeDisc = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/><path d="M${x} ${r1(y - r * 0.62)}L${r1(x + r * 0.46)} ${y}L${x} ${r1(y + r * 0.62)}L${r1(x - r * 0.46)} ${y}Z"/>`;

const robe = (back = false) => back
    ? `<path d="${ROBE}" fill="url(#robe)" stroke="#090720" stroke-width="1"/>
    <path d="M35 198Q57 208 80 208Q103 208 125 198" fill="none" stroke="url(#goldV)" stroke-width="3" stroke-linecap="round"/>`
    : `<path d="${ROBE}" fill="url(#robe)" stroke="#090720" stroke-width="1"/>
    <path d="M70 108H90L97 202L91 208L85.6 203L80 209L74.4 203L69 208L63 202Z" fill="url(#tunic)" stroke="#090720" stroke-width=".8" stroke-linejoin="round"/>
    <path d="${PANEL}" fill="url(#panel)"/>${mirror(`<path d="${PANEL}" fill="url(#panel)"/>`)}
    <path d="${TRIM}" fill="none" stroke="url(#goldV)" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/>
    ${mirror(`<path d="${TRIM}" fill="none" stroke="url(#goldV)" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/>`)}
    <path d="M66.6 120L60.4 196M93.4 120L99.6 196" fill="none" stroke="#5446b8" stroke-opacity=".45" stroke-width="1"/>
    <g class="rune" fill="none" stroke="#3ff0ff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)">
        <path d="M55 126V139M51 129.6L55 133.4L59 129.6M105 126V139M101 130.4L105 126L109 130.4"/>
        ${runeDisc(52.5, 152, 5.2)}${runeDisc(50, 179, 5.2)}${runeDisc(107.5, 152, 5.2)}
        <circle cx="110" cy="179" r="5.2"/><path d="M110 175.4L113.4 181.2H106.6Z"/>
    </g>`;

// ---------- the hood and the raven inside it ----------
const HOOD = 'M80 -6C72 4 58 10 46 20C32 32 24 46 22.6 64C21.6 78 24 87 28 93L132 93C136 87 138.4 78 137.4 64C136 46 128 32 114 20C102 10 88 4 80 -6Z';
const CREST = [[42, 32, 22, 12, 8, 0.06], [50, 22, 34, 2, 8, 0.05]];
const BAND = 'M29.6 50C33 38 40 28 50 20L51.8 22.4C42.6 30 36.4 39.6 32.4 51.4Z';

const crest = () => `${feathers(CREST, 'url(#feather)')}${edges(CREST, '#7af5ff', 0.5, 0.9)}`;

const hoodShell = () => `<path d="${HOOD}" fill="url(#hood)" stroke="#0b0824" stroke-width="1.1" stroke-linejoin="round"/>
    <path d="${HOOD}" fill="url(#hoodShade)"/>
    <path d="M25.8 62C27 46 36 32 48 22C56 15.6 66 9.6 75.6 1" fill="none" stroke="#a798ff" stroke-opacity=".55" stroke-width="1.8" stroke-linecap="round"/>
    <g filter="url(#glow)"><path d="${BAND}" fill="#34e7f8" fill-opacity=".9"/>${mirror(`<path d="${BAND}" fill="#34e7f8" fill-opacity=".9"/>`)}</g>`;

const eye = (happy) => happy
    ? `<path d="M50 62.6Q60 49 71 61.6" fill="none" stroke="#a855f7" stroke-width="6.4" stroke-linecap="round" filter="url(#blur)"/>
    <path d="M50 62.6Q60 49 71 61.6" fill="none" stroke="#f3edff" stroke-width="3.6" stroke-linecap="round"/>`
    : `<ellipse class="eyeglow" cx="60" cy="60" rx="16" ry="10.6" fill="url(#eyeHalo)"/>
    <g class="blink">
        <path d="M48.6 53L71.4 60.4Q69.4 67.8 60.8 67.8Q51 66.8 48.6 53Z" fill="#a855f7" filter="url(#blur)"/>
        <path d="M48.6 53L71.4 60.4Q69.4 67.8 60.8 67.8Q51 66.8 48.6 53Z" fill="url(#eye)"/>
        <ellipse cx="61.4" cy="63.6" rx="4.4" ry="2" fill="#fff"/>
    </g>`;

const face = (happy) => `
    <path d="M33 93C31 54 52 33 80 31C108 33 129 54 127 93L120 93C122 60 104 40 80 38C56 40 38 60 40 93Z" fill="url(#gold)" stroke="#4a2c0e" stroke-width=".6" stroke-linejoin="round"/>
    <path d="M35.6 84C35 56 54 36.6 80 34.4" fill="none" stroke="#fff6d8" stroke-opacity=".65" stroke-width=".8" stroke-linecap="round"/>
    <path d="M40 93C38 60 56 40 80 38C104 40 122 60 120 93Z" fill="url(#face)"/>
    <path d="M40 93C38 60 56 40 80 38C104 40 122 60 120 93L117 93C117 66 101 47 80 46C59 47 43 66 43 93Z" fill="#000" fill-opacity=".45"/>
    <path d="M47 79Q52.6 74.6 58 77.4M102 77.4Q107.4 74.6 113 79M49 88Q55 84 61 87M99 87Q105 84 111 88M71 46Q74 49.6 72.6 54M89 46Q86 49.6 87.4 54" fill="none" stroke="#3a3070" stroke-opacity=".75" stroke-width="1.2" stroke-linecap="round"/>
    ${eye(happy)}${mirror(eye(happy))}
    <path d="M80 8L90 19L80 30L70 19Z" fill="url(#gold)" stroke="#4a2c0e" stroke-width=".6" stroke-linejoin="round"/>
    <path d="M80 11.4L86.8 19L80 26.6L73.2 19Z" fill="#161241"/>
    <path d="M80 12.4Q81.2 17.8 86.4 19Q81.2 20.2 80 25.6Q78.8 20.2 73.6 19Q78.8 17.8 80 12.4Z" fill="#67f0ff" filter="url(#glow)"/>`;

const beak = () => `<g class="head">
    <path d="M80 55C87.4 56 93 61.4 92.4 68.6C91.8 78.6 87 88.6 80 98C73 88.6 68.2 78.6 67.6 68.6C67 61.4 72.6 56 80 55Z" fill="url(#beak)" stroke="#07070b" stroke-width=".9" stroke-linejoin="round"/>
    <path d="M80 58C82 68 82 82 80 95" fill="none" stroke="#b4b4cc" stroke-opacity=".45" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M73.6 63Q75.8 61.4 78 63.6M86.4 63Q84.2 61.4 82 63.6" fill="none" stroke="#050508" stroke-width="1.1" stroke-linecap="round"/>
    <ellipse cx="74.6" cy="69" rx="2" ry="4.2" transform="rotate(12 74.6 69)" fill="#fff" fill-opacity=".2"/>
</g>`;

const hoodBack = () => `
    <path d="M80 -4C81.6 28 80.6 62 80 93" fill="none" stroke="#0d0a2a" stroke-opacity=".8" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M77.4 2C79 32 78 62 77.6 90" fill="none" stroke="#7a68e0" stroke-opacity=".3" stroke-width="1"/>
    <path d="M80 34L87.6 44L80 54L72.4 44Z" fill="url(#gold)" stroke="#4a2c0e" stroke-width=".6" stroke-linejoin="round"/>
    <path d="M80 37.4L84.8 44L80 50.6L75.2 44Z" fill="#161241"/>
    <path d="M80 38.2Q81 43 85 44Q81 45 80 49.8Q79 45 75 44Q79 43 80 38.2Z" fill="#67f0ff" filter="url(#glow)"/>
    <path d="M28.6 91Q80 104 131.4 91" fill="none" stroke="url(#gold)" stroke-width="3.4" stroke-linecap="round"/>`;

// ---------- the mantle of feathers on the shoulders, with the gold collar and its two gems ----------
const MANTLE_BACK = [[60, 90, 10, 108, 19, 0.05], [60, 92, 13, 120, 19, 0.04], [61, 94, 22, 128, 18, 0.03], [62, 96, 34, 132, 17, 0.02], [64, 98, 48, 131, 15, 0]];
const MANTLE_TOP = [[61, 88, 15, 99, 15, 0.05], [62, 90, 18, 110, 15, 0.04], [63, 92, 27, 117, 14, 0.03], [64, 94, 39, 120, 12, 0.01]];
const MANTLE_NAPE = [[80, 90, 64, 120, 15, -0.02], [80, 90, 96, 120, 15, 0.02], [80, 90, 80, 124, 16, 0]];

const mantleSide = () => `${feathers(MANTLE_BACK, 'url(#feather)')}${veins(MANTLE_BACK, '#8b7dff', 0.3)}
    ${feathers(MANTLE_TOP, 'url(#mantle)')}${veins(MANTLE_TOP, '#c7f9ff', 0.35)}
    <g filter="url(#glow)">${edges(MANTLE_TOP.slice(0, 2), '#8ff6ff', 0.85, 1.1)}${edges(MANTLE_BACK.slice(0, 1), '#5eead4', 0.55, 1)}</g>`;

const gemPlate = (x, y) => `<path d="M${x} ${y - 6.4}L${x + 5.6} ${y}L${x} ${y + 6.4}L${x - 5.6} ${y}Z" fill="url(#gold)" stroke="#4a2c0e" stroke-width=".6"/><path d="M${x} ${y - 3.8}L${x + 3.2} ${y}L${x} ${y + 3.8}L${x - 3.2} ${y}Z" fill="url(#gem)" filter="url(#glow)"/>`;

const mantle = (back = false) => `
    <path d="M50 88H110L102 112H58Z" fill="#120e2c"/>
    ${mantleSide()}${mirror(mantleSide())}
    ${back
        ? `${feathers(MANTLE_NAPE, 'url(#feather)')}${veins(MANTLE_NAPE, '#8b7dff', 0.3)}`
        : `<path d="M53 93Q80 107 107 93" fill="none" stroke="url(#goldV)" stroke-width="2.6" stroke-linecap="round"/>${gemPlate(64, 98)}${gemPlate(96, 98)}`}`;

// ---------- the galaxy amulet and the chevron pendant under it ----------
const amulet = () => `
    <circle class="pulse" cx="80" cy="124" r="22" fill="url(#halo)"/>
    ${ring(80, 124, 20, 5.5, -14, 'back')}
    <path d="${star(80, 124, 8, 15.5, 11.5, 8.6)}" fill="url(#gold)" stroke="#4a2c0e" stroke-width=".6" stroke-linejoin="round"/>
    <circle cx="80" cy="124" r="9.8" fill="#120d33" stroke="#ffe7a3" stroke-width=".7"/>
    ${galaxy(80, 124, 8.4)}
    ${ring(80, 124, 20, 5.5, -14, 'front')}
    <path d="M75.5 140H84.5L83.5 176L80 186L76.5 176Z" fill="url(#goldV)" stroke="#4a2c0e" stroke-width=".6" stroke-linejoin="round"/>
    <path d="M77 145L80 148.5L83 145M77 152.6L80 156.1L83 152.6" fill="none" stroke="#6e4219" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M80 162L84 168.4L80 176L76 168.4Z" fill="url(#gem)" stroke="#0c2a6b" stroke-width=".5" filter="url(#glow)"/>`;

// ---------- the staff, held in the hand on the right ----------
const SHAFT_X = (y, right) => r1((right ? 143.8 : 135.4) + (3.6 * (241 - y)) / 197);

const staff = () => {
    const grooves = Array.from({ length: 21 }, (_, i) => 54 + i * 9).map((y) => `M${SHAFT_X(y, 0)} ${y}L${SHAFT_X(y, 1)} ${y - 5}`).join('');
    const bands = Array.from({ length: 9 }, (_, i) => 58 + i * 19).map((y) => `<path d="M${SHAFT_X(y, 0)} ${y}L${SHAFT_X(y, 1)} ${y - 6}V${r1(y - 3)}L${SHAFT_X(y, 0)} ${y + 3}Z" fill="url(#gold)" stroke="#4a2c0e" stroke-width=".3"/>`).join('');

    return `
    <path d="M135.4 241L139 44H147.4L143.8 241Z" fill="url(#wood)" stroke="#0a0604" stroke-width=".8" stroke-linejoin="round"/>
    <path d="${grooves}" stroke="#0d0805" stroke-opacity=".5" stroke-width="1.1"/>
    ${bands}
    <path d="M135.4 222H144.1L144 229H135.5Z" fill="url(#gold)" stroke="#4a2c0e" stroke-width=".5"/>
    <path d="M135.5 229H144L139.7 242Z" fill="#1a120c" stroke="#0a0604" stroke-width=".6"/>
    <circle class="pulse" cx="157" cy="18" r="29" fill="url(#halo)"/>
    ${ring(157, 18, 23, 6.6, -22, 'back')}
    <path d="M139.6 46C128.6 32 129.6 6 144 -6C152.6 -12.6 163.6 -13.4 172 -10C162 -8.6 151.4 -4 146 4C140.2 13 139.8 30 146.6 44Z" fill="url(#wood)" stroke="#0a0604" stroke-width=".8" stroke-linejoin="round"/>
    <path d="M132.4 16C132.2 6 136 -2 142 -7M132.6 27C133.8 33 136 38 139 42" fill="none" stroke="#7a5a40" stroke-opacity=".65" stroke-width="1" stroke-linecap="round"/>
    <path d="M171.4 -9.8C162 -8.6 151.4 -4 146 4C140.2 13 139.8 30 146.4 43.6" fill="none" stroke="url(#gold)" stroke-width="1.8" stroke-linecap="round"/>
    <rect x="138.4" y="41" width="9.6" height="5.6" rx="1.6" fill="url(#gold)" stroke="#4a2c0e" stroke-width=".5"/>
    ${galaxy(157, 18, 16)}
    ${ring(157, 18, 23, 6.6, -22, 'front')}`;
};

const sleeve = () => `<path d="M100 100C116 104 128 120 135 134L129 149C121 138 110 130 98 124Z" fill="url(#sleeve)" stroke="#090720" stroke-width="1" stroke-linejoin="round"/>
    <path d="M104 102C117 107 127 119 132.6 129" fill="none" stroke="#8b7dff" stroke-opacity=".45" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M132.4 131.6L126 147" stroke="url(#gold)" stroke-width="3.6" stroke-linecap="round"/>`;

/** The hand round the staff: four curled fingers and a thumb over them. */
const hand = () => `${[130.6, 135.8, 141, 146.2].map((y) => `<rect x="132.6" y="${y}" width="16.4" height="5.6" rx="2.8" fill="url(#talon)" stroke="#06060a" stroke-width=".7"/><path d="M134.6 ${r1(y + 1.5)}H146.8" stroke="#a3a2bb" stroke-opacity=".35" stroke-width=".8" stroke-linecap="round"/>`).join('')}
    <path d="M131.6 137Q130.4 128.6 138 128.6Q143.4 129 142.4 133.4Z" fill="url(#talon)" stroke="#06060a" stroke-width=".7"/>`;

/** The other arm, raised in a fist (seen from behind, on the stage, on the left): a wide mage's sleeve that falls open at the wrist. */
const fist = () => `<g class="raise">
    <rect x="6.4" y="32" width="16.4" height="18.4" rx="6" transform="rotate(-20 14.6 41.2)" fill="url(#talon)" stroke="#06060a" stroke-width=".8"/>
    <path d="M7.4 37.4Q13 33.4 20 34.8M8.6 42.2Q14.4 38.2 21.4 39.6M10 47Q15.8 43 22.8 44.4" fill="none" stroke="#000" stroke-opacity=".5" stroke-width=".8"/>
    <path d="M9.6 34.4Q14.6 31.4 19.4 32.2" fill="none" stroke="#a3a2bb" stroke-opacity=".55" stroke-width="1" stroke-linecap="round"/>
    <path d="M28 110C22 94 14 76 5 60Q14 51 25 50C32 66 40 86 47 104Z" fill="url(#sleeve)" stroke="#090720" stroke-width="1" stroke-linejoin="round"/>
    <path d="M8 62C16 76 23 92 29 106" fill="none" stroke="#8b7dff" stroke-opacity=".55" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M5 60Q14 51 25 50" fill="none" stroke="url(#gold)" stroke-width="3.4" stroke-linecap="round"/>
</g>`;

// ---------- crystals and sparks floating around him ----------
const extras = (back) => [
    back ? '' : crystal(8, 56, 5.5, 13, 0),
    crystal(-8, 116, 4, 9, 0.8, true),
    crystal(173, 62, 3.6, 8, 1.4),
    crystal(170, 108, 5, 11, 0.4),
    crystal(126, -12, 3, 6.5, 1.1),
    spark(-12, 86, 3.2, '#7af5ff', 0.2), spark(-14, 152, 2.6, '#c4b5fd', 1), spark(14, 20, 2.6, '#7af5ff', 0.6), spark(177, 86, 2.4, '#c4b5fd', 1.3),
    spark(174, 142, 3, '#7af5ff', 0.4), spark(112, -10, 2.2, '#e9d5ff', 0.9), spark(-4, 34, 2, '#c4b5fd', 1.6), spark(-14, 196, 2, '#7af5ff', 0.7), spark(170, 190, 2.2, '#c4b5fd', 1.9),
].join('');

const defs = () => [
    lin('hood', [0.15, 0, 0.85, 1], [[0, '#5241ad'], [0.35, '#30267c'], [0.75, '#1b1652'], [1, '#100c31']]),
    rad('hoodShade', [0.5, 0.42, 0.62], [[0.55, '#07051a', 0], [1, '#07051a', 0.7]]),
    lin('gold', [0, 0, 1, 1], [[0, '#fff3c4'], [0.3, '#f2c66b'], [0.62, '#c58a37'], [1, '#6e4219']]),
    lin('goldV', [0, 0, 0, 1], [[0, '#fff3c4'], [0.35, '#eab95c'], [1, '#7a4a1c']]),
    rad('face', [0.5, 0.62, 0.62], [[0, '#2a2150'], [0.55, '#151029'], [1, '#05040b']]),
    rad('eye', [0.5, 0.62, 0.62], [[0, '#ffffff'], [0.32, '#efe6ff'], [0.68, '#bb98ff'], [1, '#8b5cf6']]),
    rad('eyeHalo', [0.5, 0.5, 0.5], [[0, '#b388ff', 0.9], [0.45, '#8b5cf6', 0.45], [1, '#7c3aed', 0]]),
    lin('beak', [0, 0, 1, 0], [[0, '#17171e'], [0.32, '#3d3d4c'], [0.5, '#737389'], [0.64, '#3a3a48'], [1, '#111117']]),
    lin('feather', [0, 0, 0, 1], [[0, '#3d3096'], [0.55, '#261e6e'], [1, '#141040']]),
    lin('mantle', [62, 0, 12, 0], [[0, '#2a2068'], [0.45, '#3a2f9c'], [0.78, '#3c7ef2'], [1, '#7af5ff']], true),
    lin('wing', [0, 110, 0, 208], [[0, '#15123b'], [0.48, '#1d1755'], [0.72, '#4a2fb6'], [0.88, '#7b6cff'], [1, '#6fe9ff']], true),
    lin('robe', [0.1, 0, 0.9, 1], [[0, '#241e58'], [0.5, '#14113b'], [1, '#08071c']]),
    lin('sleeve', [0, 0, 1, 1], [[0, '#3a2f86'], [0.55, '#1d1850'], [1, '#0d0b28']]),
    lin('panel', [0, 0, 1, 0], [[0, '#141139'], [0.6, '#211c58'], [1, '#2a2370']]),
    lin('tunic', [0, 0, 0, 1], [[0, '#110e28'], [1, '#060515']]),
    lin('wood', [0, 0, 1, 0], [[0, '#6a4a33'], [0.4, '#3d2a1d'], [1, '#140d08']]),
    rad('orb', [0.4, 0.38, 0.72], [[0, '#ffffff'], [0.14, '#e4d8ff'], [0.42, '#8f62ff'], [0.72, '#3b2aa6'], [1, '#0e0b36']]),
    rad('halo', [0.5, 0.5, 0.5], [[0, '#7dd3fc', 0.5], [0.45, '#8b5cf6', 0.2], [1, '#8b5cf6', 0]]),
    lin('crystal', [0.2, 0, 0.8, 1], [[0, '#e0e7ff'], [0.3, '#93a4ff'], [0.65, '#5b52f0'], [1, '#2a2392']]),
    lin('gem', [0, 0, 1, 1], [[0, '#e0faff'], [0.4, '#4fd1ff'], [1, '#1d4ed8']]),
    lin('talon', [0, 0, 0, 1], [[0, '#5f5e70'], [0.5, '#2c2b38'], [1, '#121118']]),
    `<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
    `<filter id="blur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.4"/></filter>`,
    `<clipPath id="wingClip">${WING.map((f) => `<path d="${quill(...f).d}"/>`).join('')}</clipPath>`,
    `<clipPath id="capeClip">${CAPE.map((f) => `<path d="${quill(...f).d}"/>`).join('')}</clipPath>`,
].join('');

const motion = (state) => {
    const base = origins({ all: '80px 238px', head: '80px 92px', wingL: '46px 104px', wingR: '46px 104px', arm: '104px 104px', raise: '38px 108px', legL: '60px 216px', legR: '60px 216px' }, ['shadow', 'blink', 'crystal', 'spark', 'swirl', 'pulse']);
    const always = `
        ${kf('spin', { 0: 'transform:rotate(0)', 100: 'transform:rotate(360deg)' })}
        ${kf('orbit', { 0: 'stroke-dashoffset:100', 100: 'stroke-dashoffset:0' })}
        ${kf('twinkle', { 0: 'opacity:.3;transform:scale(.45)', 50: 'opacity:1;transform:scale(1)', 100: 'opacity:.3;transform:scale(.45)' })}
        ${kf('glint', { 0: 'opacity:.2', 50: 'opacity:1', 100: 'opacity:.2' })}
        ${kf('glow', { 0: 'opacity:.55', 50: 'opacity:1', 100: 'opacity:.55' })}
        ${kf('pulse', { 0: 'transform:scale(.9);opacity:.75', 50: 'transform:scale(1.08);opacity:1', 100: 'transform:scale(.9);opacity:.75' })}
        ${kf('bounce', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-6px)', 100: 'transform:translateY(0)' })}
        .swirl{animation:spin 7s linear infinite}.orbit{animation:orbit 2.8s linear infinite}
        ${play('.spark', 'twinkle', 1.9)}${play('.glint', 'glint', 2.2)}${play('.rune', 'glow', 2.8)}${play('.eyeglow', 'glow', 2.4)}${play('.pulse', 'pulse', 2.6)}`;
    const rules = {
        Standing: `
            ${kf('breathe', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-1.6px)', 100: 'transform:translateY(0)' })}
            ${kf('sway', { 0: 'transform:rotate(-1.2deg)', 50: 'transform:rotate(1.2deg)', 100: 'transform:rotate(-1.2deg)' })}
            ${kf('cape', { 0: 'transform:rotate(0)', 50: 'transform:rotate(2.4deg)', 100: 'transform:rotate(0)' })}
            ${kf('float', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-4px)', 100: 'transform:translateY(0)' })}
            ${kf('blink', { 0: 'transform:scaleY(1)', 90: 'transform:scaleY(1)', 94: 'transform:scaleY(.1)', 98: 'transform:scaleY(1)', 100: 'transform:scaleY(1)' })}
            ${play('.all', 'breathe', 3.2)}${play('.head', 'sway', 4.6)}${play('.wingL', 'cape', 3.2)}${play('.wingR', 'cape', 3.2, '1.6s')}${play('.blink', 'blink', 4.4)}${play('.crystal', 'float', 3)}`,
        Dancing: `
            ${kf('hop', { 0: 'transform:translateY(0) scale(1.03,.97)', 45: 'transform:translateY(-10px) scale(.98,1.03)', 100: 'transform:translateY(0) scale(1.03,.97)' })}
            ${kf('nod', { 0: 'transform:rotate(-6deg)', 50: 'transform:rotate(6deg) translateY(2px)', 100: 'transform:rotate(-6deg)' })}
            ${kf('flap', { 0: 'transform:rotate(3deg)', 50: 'transform:rotate(22deg)', 100: 'transform:rotate(3deg)' })}
            ${kf('pump', { 0: 'transform:rotate(0) translateY(0)', 45: 'transform:rotate(-7deg) translateY(-10px)', 100: 'transform:rotate(0) translateY(0)' })}
            ${kf('step', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-7px)', 100: 'transform:translateY(0)' })}
            ${kf('shadowHop', { 0: 'transform:scale(1.04)', 45: 'transform:scale(.82)', 100: 'transform:scale(1.04)' })}
            ${play('.all', 'hop', 0.6)}${play('.head', 'nod', 1.2)}${play('.wingL', 'flap', 0.6)}${play('.wingR', 'flap', 0.6, '.3s')}${play('.arm', 'pump', 0.6)}
            ${play('.legL', 'step', 0.6)}${play('.legR', 'step', 0.6, '.3s')}${play('.crystal', 'bounce', 0.6)}${play('.shadow', 'shadowHop', 0.6)}
            ${pose('.wingL', 'rotate(18deg)')}${pose('.wingR', 'rotate(14deg)')}${pose('.arm', 'rotate(-6deg) translateY(-8px)')}${pose('.legL', 'translateY(-6px)')}${pose('.head', 'rotate(-5deg)')}`,
        DJing: `
            ${kf('jump', { 0: 'transform:translateY(0) scale(1.04,.95)', 38: 'transform:translateY(-14px) scale(.98,1.03)', 76: 'transform:translateY(0) scale(1.04,.95)', 100: 'transform:translateY(0) scale(1.04,.95)' })}
            ${kf('bob', { 0: 'transform:rotate(-6deg)', 50: 'transform:rotate(6deg) translateY(2px)', 100: 'transform:rotate(-6deg)' })}
            ${kf('fist', { 0: 'transform:rotate(0)', 38: 'transform:rotate(14deg)', 76: 'transform:rotate(0)', 100: 'transform:rotate(0)' })}
            ${kf('flap', { 0: 'transform:rotate(2deg)', 50: 'transform:rotate(14deg)', 100: 'transform:rotate(2deg)' })}
            ${kf('pump', { 0: 'transform:translateY(0)', 38: 'transform:translateY(-8px)', 76: 'transform:translateY(0)', 100: 'transform:translateY(0)' })}
            ${kf('kick', { 0: 'transform:translateY(0)', 38: 'transform:translateY(-8px)', 76: 'transform:translateY(0)', 100: 'transform:translateY(0)' })}
            ${kf('shadowJump', { 0: 'transform:scale(1.05)', 38: 'transform:scale(.72)', 76: 'transform:scale(1.05)', 100: 'transform:scale(1.05)' })}
            ${play('.all', 'jump', 0.7)}${play('.head', 'bob', 0.7)}${play('.raise', 'fist', 0.7)}${play('.wingL', 'flap', 0.7)}${play('.wingR', 'flap', 0.7, '.35s')}${play('.arm', 'pump', 0.7, '.1s')}
            ${play('.legL', 'kick', 0.7)}${play('.legR', 'kick', 0.7, '.35s')}${play('.crystal', 'bounce', 0.7)}${play('.shadow', 'shadowJump', 0.7)}
            ${pose('.raise', 'rotate(8deg)')}${pose('.wingL', 'rotate(10deg)')}${pose('.wingR', 'rotate(10deg)')}${pose('.head', 'rotate(-4deg)')}${pose('.legR', 'translateY(-8px)')}`,
    };

    return base + always + rules[state];
};

export function rift(state) {
    const back = state === 'DJing';
    const body = back
        ? `${foot('legL', true)}${mirror(foot('legR', true))}${robe(true)}
            <g class="arm">${sleeve()}</g>
            ${wing('wingL')}${mirror(wing('wingR'))}${cape()}
            ${mantle(true)}
            <g class="head">${mirror(crest())}${hoodShell()}${hoodBack()}</g>
            ${fist()}
            <g class="arm">${staff()}${hand()}</g>`
        : `${wing('wingL')}${mirror(wing('wingR'))}
            ${foot('legL')}${mirror(foot('legR'))}${robe()}
            <g class="arm">${sleeve()}</g>
            <g class="head">${crest()}${hoodShell()}${face(state === 'Dancing')}</g>
            ${mantle()}${beak()}${amulet()}
            <g class="arm">${staff()}${hand()}</g>`;

    return picture({
        label: 'Rift',
        state,
        defs: defs(),
        body: `${shadow()}<g class="all">${body}</g>${extras(back)}`,
        css: motion(state),
    });
}
