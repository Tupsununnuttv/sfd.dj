// Two baby dragons from one drawing, each with its own colours, horns, tail tip and breath:
//   - Ember Dragon: red scales and a golden belly, charcoal horns, a flame at the tip of the tail, smoke from the nose and embers rising round him
//   - Frost Dragon: ice-blue scales and a pale belly, crystal horns, an ice crystal at the tip of the tail, frosty breath and snowflakes falling
// Both have big slit-pupil eyes, a smile with two small fangs, finned cheeks, bat wings, short arms with claws and a long tail in three parts.
// Wings flap from the shoulder, and the tail is a chain (each part swings a moment after the one before it), so it whips and curls like a real one.
// Everybody can wear them: Ember from level 30, Frost from level 35.
import { kf, lin, mirror, origins, picture, play, pose, rad, shadow } from './kit.mjs';
import { blob, capsule, r1 } from './shapes.mjs';

const THEMES = {
    ember: {
        label: 'Ember Dragon',
        scale: ['#ff8a4c', '#e2452f', '#a8211b'], belly: ['#fff1b8', '#ffd27a', '#f0a335'], ink: '#4a0d08',
        membrane: ['#ffb066', '#ff7a33', '#c2321f'], bone: '#8f1d18',
        eye: ['#fff6c2', '#ffd34d', '#ff8a00'], pupil: '#2b0a00',
        horn: ['#6b5555', '#3a2a2a', '#1a1212'], hornLine: '#8a7070',
        led: '#ffb347', cup: ['#7a3b1a', '#3d1a0c', '#1a0a04'],
        puff: '#cfc7c2', puffOpacity: 0.55,
    },
    frost: {
        label: 'Frost Dragon',
        scale: ['#a8dcff', '#4fa8e8', '#1f5f9e'], belly: ['#ffffff', '#e2f6ff', '#a9dcf7'], ink: '#0b2a4a',
        membrane: ['#e6f8ff', '#a5dcff', '#5fb3e6'], bone: '#2b6ea8',
        eye: ['#ecffff', '#7cf0ff', '#16a6d6'], pupil: '#06233a',
        horn: ['#ffffff', '#c2f2ff', '#6ccaf0'], hornLine: '#ffffff',
        led: '#7cf0ff', cup: ['#3a6e9e', '#1a3a5c', '#0a1a2e'],
        puff: '#e8fbff', puffOpacity: 0.75,
    },
};

const both = (part) => part + mirror(part);

// ---------- the head ----------
const HEAD = blob(80, 50, 45, 39, [[90, 0.07, 34], [150, 0.04, 20], [30, 0.04, 20]]);
const HORN = 'M57 21C50 10 42 1 30 -8C27 -10 24 -9 25 -6C31 3 39 14 47 27Z';
const CREST = 'M68 16L72 4L77 14ZM75.5 13L80 -2L84.5 13ZM83 14L88 4L92 16Z';
const FRILL = 'M39 57L17 49L26 59L12 66L27 68L20 79L38 72Z';

const horn = (t, theme) => theme === 'frost'
    ? `<path d="${HORN}" fill="url(#horn)" stroke="${t.ink}" stroke-width=".9" stroke-linejoin="round"/><path d="M52 22L36 0M45 24L31 4" stroke="#fff" stroke-opacity=".8" stroke-width="1.1" stroke-linecap="round"/><path d="M33 -2L40 1L38 -6Z" fill="#fff" opacity=".7"/>`
    : `<path d="${HORN}" fill="url(#horn)" stroke="${t.ink}" stroke-width=".9" stroke-linejoin="round"/><path d="M49 22.4C46 20 45 17 46.4 15.4M43.6 14.6C40.6 12.6 39.6 10 40.8 8.4M38 7.6C35.4 6 34.4 3.6 35.4 2" fill="none" stroke="${t.hornLine}" stroke-width="1.2" stroke-linecap="round"/>`;

const eye = (t) => `<g class="blink"><ellipse cx="60" cy="49" rx="9.6" ry="11.2" fill="url(#eye)" stroke="${t.ink}" stroke-width="1.1"/><ellipse cx="60.6" cy="50" rx="2.4" ry="8" fill="${t.pupil}"/><circle cx="63" cy="45" r="2.6" fill="#fff"/><circle cx="57.6" cy="53.6" r="1.1" fill="#fff"/></g>`;

const face = (t, happy) => `
    ${both(`<path d="M47.6 37.6C54 32.6 64 32.4 71 36.6" fill="none" stroke="${t.ink}" stroke-width="3" stroke-linecap="round"/>`)}
    ${happy ? both(`<path d="M51 51C54 44 66 44 69 51" fill="none" stroke="${t.ink}" stroke-width="3.4" stroke-linecap="round"/>`) : both(eye(t))}
    <ellipse cx="80" cy="74" rx="23" ry="16" fill="url(#belly)"/>
    ${both(`<ellipse cx="73.4" cy="70" rx="2.4" ry="1.6" transform="rotate(-20 73.4 70)" fill="${t.ink}"/>`)}
    ${happy
        ? `<path d="M64 79C68 93 92 93 96 79Z" fill="#5b1020" stroke="${t.ink}" stroke-width="1.4" stroke-linejoin="round"/><path d="M71 86.6C75 83.6 85 83.6 89 86.6C86 90.4 74 90.4 71 86.6Z" fill="#ff7a9a"/>${both('<path d="M68.6 80.2L70.8 85L72.8 81Z" fill="#fff"/>')}`
        : `<path d="M64 80C70 86.4 90 86.4 96 80" fill="none" stroke="${t.ink}" stroke-width="2" stroke-linecap="round"/>${both(`<path d="M70 83.2L72 88.4L74 84.4Z" fill="#fff" stroke="${t.ink}" stroke-width=".6" stroke-linejoin="round"/>`)}`}
    ${both(`<ellipse cx="47" cy="68" rx="5.6" ry="3.2" fill="${t.membrane[1]}" opacity=".45"/>`)}
    <path d="M72 26c2-2 4-2 6 0M82 26c2-2 4-2 6 0M77 31c2-2 4-2 6 0" fill="none" stroke="${t.scale[0]}" stroke-width="1.2" stroke-linecap="round"/>`;

/** Breath from the nose: smoke for Ember, frost for Frost. Two puffs that rise and fade, inside the head so they follow it. */
const puffs = (t) => [0, 1].map((i) => `<circle class="puff" style="animation-delay:${-i * 1.2}s" cx="${i ? 86.6 : 73.4}" cy="66" r="4" fill="${t.puff}" opacity="${t.puffOpacity}"/>`).join('');

/** Headphones at the decks, in the dragon's colours (from behind). */
const phones = (t) => `<path d="M38 54C34 24 54 8 80 8C106 8 126 24 122 54" fill="none" stroke="${t.cup[2]}" stroke-width="5.6" stroke-linecap="round"/>${both(`<g transform="translate(36 60)"><ellipse rx="8.6" ry="12.6" fill="url(#cup)" stroke="#000" stroke-opacity=".5" stroke-width=".9"/><ellipse class="led" cx="-.8" rx="5.6" ry="8.6" fill="none" stroke="${t.led}" stroke-width="1.3" filter="url(#glow)"/></g>`)}`;

const head = (t, theme, back, happy) => `<g class="head">
    ${both(horn(t, theme))}
    ${both(`<path d="${FRILL}" fill="url(#membrane)" stroke="${t.ink}" stroke-width=".9" stroke-linejoin="round"/><path d="M38 60L22 52M37 66L18 66M37 70L25 76" stroke="${t.bone}" stroke-opacity=".6" stroke-width="1"/>`)}
    <path d="${CREST}" fill="url(#horn)" stroke="${t.ink}" stroke-width=".8" stroke-linejoin="round"/>
    <path d="${HEAD}" fill="url(#scale)" stroke="${t.ink}" stroke-width="1.2"/>
    <path d="M44 34C50 22 62 15 76 13" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2.4" stroke-linecap="round"/>
    ${back
        ? `<path d="M76 30L80 22L84 30ZM76 46L80 38L84 46ZM76 62L80 54L84 62ZM76 78L80 70L84 78Z" fill="url(#horn)" stroke="${t.ink}" stroke-width=".7" stroke-linejoin="round"/>${phones(t)}`
        : `${face(t, happy)}${puffs(t)}`}
</g>`;

// ---------- body, belly, legs ----------
const BODY = blob(80, 158, 36, 52);
const BELLY = 'M80 108C94 108 102 130 102 160C102 188 92 206 80 206C68 206 58 188 58 160C58 130 66 108 80 108Z';
const plate = (y) => {
    const w = r1(22 * Math.sqrt(Math.max(0, 1 - ((y - 157) / 50) ** 2)));
    return `M${r1(80 - w)} ${y}Q80 ${y + 3.4} ${r1(80 + w)} ${y}`;
};

const body = (t, back) => `<g class="body">
    <path d="${BODY}" fill="url(#scale)" stroke="${t.ink}" stroke-width="1.2"/>
    ${back
        ? `<path d="M75 116L80 106L85 116ZM75 132L80 122L85 132ZM75 148L80 138L85 148ZM75 164L80 154L85 164ZM75 180L80 170L85 180Z" fill="url(#horn)" stroke="${t.ink}" stroke-width=".7" stroke-linejoin="round"/>${both(`<path d="M52 136c2.4-2 4.8-2 7.2 0M50 152c2.4-2 4.8-2 7.2 0M52 168c2.4-2 4.8-2 7.2 0M58 184c2.4-2 4.8-2 7.2 0" fill="none" stroke="${t.scale[2]}" stroke-opacity=".6" stroke-width="1.2" stroke-linecap="round"/>`)}`
        : `<path d="${BELLY}" fill="url(#belly)" stroke="${t.ink}" stroke-opacity=".5" stroke-width=".8"/><path d="${[122, 132, 142, 152, 162, 172, 182, 192].map(plate).join('')}" fill="none" stroke="${t.belly[2]}" stroke-width="1.3" stroke-linecap="round"/>${both(`<path d="M49 140c2.4-2 4.8-2 7.2 0M47.6 158c2.4-2 4.8-2 7.2 0M49.6 176c2.4-2 4.8-2 7.2 0" fill="none" stroke="${t.scale[2]}" stroke-opacity=".6" stroke-width="1.2" stroke-linecap="round"/>`)}`}
    <path d="M50 126C48 140 47 160 50 178" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2.4" stroke-linecap="round"/>
</g>`;

const leg = (t, side, back) => `<g class="leg${side}">
    <ellipse cx="60" cy="198" rx="15" ry="17" fill="url(#scale)" stroke="${t.ink}" stroke-width="1.1"/>
    <path d="M44 236C44 226 50 220 60 220C70 220 76 226 76 236C76 239 74 240 70 240H50C46 240 44 239 44 236Z" fill="url(#scaleDark)" stroke="${t.ink}" stroke-width="1.1"/>
    ${back ? '' : `<path d="M47.6 238.4L50 243L52.6 238.6ZM57.4 239.2L60 244L62.6 239.2ZM67.4 238.6L70 243L72.4 238.4Z" fill="#fff" stroke="${t.ink}" stroke-width=".6" stroke-linejoin="round"/>`}
    <path d="M48 228C52 224 58 223 62 224" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.6" stroke-linecap="round"/>
</g>`;

// ---------- wings (the left; the right is its mirror image), arms and claws ----------
const MEMBRANE = 'M60 120L28 82L-6 64Q6 82 -12 96Q8 104 0 126Q26 120 52 140Z';
const wing = (t, side) => `<g class="wing${side}">
    <path d="${MEMBRANE}" fill="url(#membrane)" stroke="${t.ink}" stroke-width="1" stroke-linejoin="round"/>
    <path d="M28 82L-6 64M28 82L-12 96M28 82L0 126" stroke="${t.bone}" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M24 86L-2 74M22 92L-6 100M24 96L6 116" stroke="#fff" stroke-opacity=".3" stroke-width="1" stroke-linecap="round"/>
    <path d="M60 120L28 82" stroke="${t.bone}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="28" cy="82" r="3.4" fill="${t.bone}"/><path d="M27 79L22 72L30 77Z" fill="#fff"/>
</g>`;

const arm = (t, side, back) => `<g class="arm${side}">
    <path d="${capsule([54, 124], [46, 146], 8, 7)}" fill="url(#scale)" stroke="${t.ink}" stroke-width="1"/>
    <g class="fore${side}">
        <path d="${capsule([46, 145], [49, 162], 7, 6.4)}" fill="url(#scale)" stroke="${t.ink}" stroke-width="1"/>
        <g class="hand${side}">
            <ellipse cx="49" cy="166" rx="7.2" ry="6.2" fill="url(#scale)" stroke="${t.ink}" stroke-width="1"/>
            ${back ? '' : `<ellipse cx="49" cy="167" rx="3.6" ry="2.8" fill="url(#belly)"/>`}
            <path d="M43 170L43.6 176L46.4 171.6ZM47.6 172L49 178L51 172.2ZM52.4 171.6L54.6 176L55.4 170Z" fill="#fff" stroke="${t.ink}" stroke-width=".6" stroke-linejoin="round"/>
        </g>
    </g>
</g>`;

// ---------- the tail: three parts, each turning at the joint with the one before ----------
const SEGS = [[26, 12, 10, 8], [22, -10, 8, 6], [10, -20, 6, 4]]; // [dx, dy, thickness at the start, at the end]

/** The tail from `anchor`: returns the drawing and the joints (where each part turns). */
const tail = (t, theme, [ax, ay]) => {
    const joints = [[ax, ay]];
    SEGS.forEach(([dx, dy]) => { const [x, y] = joints[joints.length - 1]; joints.push([x + dx, y + dy]); });
    const tip = joints[3];
    const tipDrawing = theme === 'frost'
        ? `<g class="tip"><path d="M${tip[0]} ${tip[1] + 2}L${tip[0] - 6} ${tip[1] - 8}L${tip[0]} ${tip[1] - 22}L${tip[0] + 6} ${tip[1] - 8}Z" fill="url(#horn)" stroke="${t.ink}" stroke-width=".8" stroke-linejoin="round"/><path d="M${tip[0] - 3} ${tip[1] - 2}L${tip[0] - 11} ${tip[1] - 9}L${tip[0] - 5} ${tip[1] - 6}ZM${tip[0] + 3} ${tip[1] - 2}L${tip[0] + 11} ${tip[1] - 10}L${tip[0] + 5} ${tip[1] - 6}Z" fill="url(#horn)" stroke="${t.ink}" stroke-width=".7" stroke-linejoin="round"/><path d="M${tip[0]} ${tip[1] - 2}V${tip[1] - 19}" stroke="#fff" stroke-width="1"/></g>`
        : `<g class="tip"><path class="flame" d="M${tip[0]} ${tip[1] + 3}C${tip[0] + 9} ${tip[1] - 3} ${tip[0] + 8} ${tip[1] - 14} ${tip[0] + 1} ${tip[1] - 24}C${tip[0] + 1} ${tip[1] - 16} ${tip[0] - 4} ${tip[1] - 14} ${tip[0] - 4} ${tip[1] - 9}C${tip[0] - 8} ${tip[1] - 12} ${tip[0] - 9} ${tip[1] - 3} ${tip[0]} ${tip[1] + 3}Z" fill="url(#fire)" filter="url(#glow)"/><path d="M${tip[0]} ${tip[1] + 1}C${tip[0] + 4} ${tip[1] - 3} ${tip[0] + 4} ${tip[1] - 8} ${tip[0] + 1} ${tip[1] - 13}C${tip[0] - 2} ${tip[1] - 8} ${tip[0] - 4} ${tip[1] - 4} ${tip[0]} ${tip[1] + 1}Z" fill="#fff8d6"/></g>`;
    const part = (i, inner) => {
        const [x1, y1] = joints[i], [x2, y2] = joints[i + 1], [, , ra, rb] = SEGS[i];
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, len = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / len, ny = (x2 - x1) / len;
        const spike = `M${r1(mx - nx * (ra - 1) - (x2 - x1) * 0.12)} ${r1(my - ny * (ra - 1) - (y2 - y1) * 0.12)}L${r1(mx - nx * (ra + 6))} ${r1(my - ny * (ra + 6))}L${r1(mx - nx * (ra - 1) + (x2 - x1) * 0.12)} ${r1(my - ny * (ra - 1) + (y2 - y1) * 0.12)}Z`;
        return `<g class="tail${i + 1}"><path d="${spike}" fill="url(#horn)" stroke="${t.ink}" stroke-width=".7" stroke-linejoin="round"/><path d="${capsule([x1, y1], [x2, y2], ra, rb)}" fill="url(#scale)" stroke="${t.ink}" stroke-width="1"/>${inner}</g>`;
    };

    return { drawing: part(0, part(1, part(2, tipDrawing))), joints };
};

// ---------- what floats round them: embers rising, or snow falling ----------
const sparks = (theme) => theme === 'frost'
    ? [[-6, 40, 1], [168, 20, 0.8], [-10, 150, 0.9], [170, 130, 1.1], [14, -18, 0.7], [150, -10, 0.9]].map(([x, y, s], i) => `<g class="flake" style="animation-delay:${-i * 0.9}s"><path transform="translate(${x} ${y}) scale(${s})" d="M0 -6V6M-5.2 -3L5.2 3M-5.2 3L5.2 -3M-1.6 -4.4L0 -6L1.6 -4.4M-1.6 4.4L0 6L1.6 4.4" stroke="#e8fbff" stroke-width="1.3" stroke-linecap="round" fill="none"/></g>`).join('')
    : [[-4, 200, 2.2], [166, 186, 1.8], [-10, 120, 1.6], [172, 100, 2.4], [10, 60, 1.4], [156, 40, 1.8]].map(([x, y, r], i) => `<circle class="ember" style="animation-delay:${-i * 0.7}s" cx="${x}" cy="${y}" r="${r}" fill="#ffcf5a" filter="url(#glow)"/>`).join('');

const defs = (t) => [
    rad('scale', [0.4, 0.3, 0.8], [[0, t.scale[0]], [0.55, t.scale[1]], [1, t.scale[2]]]),
    lin('scaleDark', [0, 0, 0, 1], [[0, t.scale[1]], [1, t.scale[2]]]),
    rad('belly', [0.5, 0.35, 0.7], [[0, t.belly[0]], [0.6, t.belly[1]], [1, t.belly[2]]]),
    lin('membrane', [0, 0, 1, 1], [[0, t.membrane[0]], [0.5, t.membrane[1]], [1, t.membrane[2]]]),
    rad('eye', [0.45, 0.35, 0.7], [[0, t.eye[0]], [0.55, t.eye[1]], [1, t.eye[2]]]),
    lin('horn', [0, 0, 1, 1], [[0, t.horn[0]], [0.5, t.horn[1]], [1, t.horn[2]]]),
    lin('fire', [0, 1, 0, 0], [[0, '#ff4d00'], [0.45, '#ffb020'], [1, '#fff3b0']]),
    lin('cup', [0, 0, 1, 1], [[0, t.cup[0]], [0.55, t.cup[1]], [1, t.cup[2]]]),
    `<filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
].join('');

const motion = (state, joints) => {
    const px = ([x, y]) => `${r1(x)}px ${r1(y)}px`;
    const limbs = { wing: '60px 118px', arm: '54px 124px', fore: '46px 145px', hand: '49px 166px', leg: '60px 192px' };
    const base = origins({
        all: '80px 238px', head: '80px 100px', body: '80px 210px',
        tail1: px(joints[0]), tail2: px(joints[1]), tail3: px(joints[2]), tip: px(joints[3]),
        ...Object.fromEntries(Object.entries(limbs).flatMap(([part, o]) => [[`${part}L`, o], [`${part}R`, o]])),
    }, ['shadow', 'blink', 'puff', 'flame', 'ember', 'flake']);
    const always = `
        ${kf('blink', { 0: 'transform:scaleY(1)', 92: 'transform:scaleY(1)', 95: 'transform:scaleY(.1)', 98: 'transform:scaleY(1)', 100: 'transform:scaleY(1)' })}
        ${kf('puff', { 0: 'transform:translateY(2px) scale(.3);opacity:0', 20: 'opacity:.8', 100: 'transform:translateY(-24px) scale(1.5);opacity:0' })}
        ${kf('flame', { 0: 'transform:scale(1,1)', 30: 'transform:scale(.88,1.12)', 60: 'transform:scale(1.08,.92)', 100: 'transform:scale(1,1)' })}
        ${kf('ember', { 0: 'transform:translateY(0);opacity:0', 25: 'opacity:1', 100: 'transform:translateY(-46px);opacity:0' })}
        ${kf('flake', { 0: 'transform:translate(0,-10px) rotate(0);opacity:0', 20: 'opacity:1', 100: 'transform:translate(6px,40px) rotate(180deg);opacity:0' })}
        ${kf('led', { 0: 'opacity:.45', 50: 'opacity:1', 100: 'opacity:.45' })}
        ${play('.blink', 'blink', 4.6)}${play('.puff', 'puff', 2.4)}${play('.flame', 'flame', 0.6)}${play('.ember', 'ember', 3.2)}${play('.flake', 'flake', 4.4)}${play('.led', 'led', 1.2)}`;
    /** The tail swings as a chain: the same swing, each part a little later and a little more. */
    const tail = (name, amp, period) => `
        ${kf(name, { 0: `transform:rotate(${-amp}deg)`, 50: `transform:rotate(${amp}deg)`, 100: `transform:rotate(${-amp}deg)` })}
        ${play('.tail1', name, period)}${play('.tail2', name, period, `-${r1(period * 0.88)}s`)}${play('.tail3', name, period, `-${r1(period * 0.76)}s`)}${play('.tip', name, period, `-${r1(period * 0.64)}s`)}`;
    const rules = {
        Standing: `
            ${kf('breathe', { 0: 'transform:scale(1,1)', 50: 'transform:scale(1.02,.98)', 100: 'transform:scale(1,1)' })}
            ${kf('tilt', { 0: 'transform:rotate(-2deg)', 50: 'transform:rotate(3deg)', 100: 'transform:rotate(-2deg)' })}
            ${kf('flutter', { 0: 'transform:rotate(0)', 50: 'transform:rotate(-7deg)', 100: 'transform:rotate(0)' })}
            ${kf('hang', { 0: 'transform:rotate(-3deg)', 50: 'transform:rotate(3deg)', 100: 'transform:rotate(-3deg)' })}
            ${play('.body', 'breathe', 3.2)}${play('.head', 'tilt', 4.8)}${play('.wingL', 'flutter', 3.2)}${play('.wingR', 'flutter', 3.2, '-1.6s')}
            ${play('.foreL', 'hang', 3.2)}${play('.foreR', 'hang', 3.2, '-1.6s')}${tail('swish', 6, 3.6)}`,
        Dancing: `
            ${kf('hop', { 0: 'transform:translateY(0) scale(1.05,.95)', 45: 'transform:translateY(-12px) scale(.97,1.04)', 100: 'transform:translateY(0) scale(1.05,.95)' })}
            ${kf('bob', { 0: 'transform:rotate(-7deg)', 50: 'transform:rotate(7deg) translateY(2px)', 100: 'transform:rotate(-7deg)' })}
            ${kf('flap', { 0: 'transform:rotate(6deg)', 50: 'transform:rotate(-24deg)', 100: 'transform:rotate(6deg)' })}
            ${kf('claws', { 0: 'transform:rotate(112deg)', 50: 'transform:rotate(140deg)', 100: 'transform:rotate(112deg)' })}
            ${kf('clawsFore', { 0: 'transform:rotate(30deg)', 50: 'transform:rotate(-4deg)', 100: 'transform:rotate(30deg)' })}
            ${kf('step', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-7px)', 100: 'transform:translateY(0)' })}
            ${kf('shadowHop', { 0: 'transform:scale(1.05)', 45: 'transform:scale(.8)', 100: 'transform:scale(1.05)' })}
            ${play('.all', 'hop', 0.6)}${play('.head', 'bob', 1.2, '-1.1s')}${play('.wingL', 'flap', 0.6)}${play('.wingR', 'flap', 0.6, '-.1s')}
            ${play('.armL', 'claws', 1.2)}${play('.foreL', 'clawsFore', 1.2, '-1.1s')}${play('.armR', 'claws', 1.2, '-.6s')}${play('.foreR', 'clawsFore', 1.2, '-.5s')}
            ${play('.legL', 'step', 0.6)}${play('.legR', 'step', 0.6, '-.3s')}${play('.shadow', 'shadowHop', 0.6)}${tail('whip', 16, 1.2)}
            ${pose('.armL', 'rotate(120deg)')}${pose('.foreL', 'rotate(20deg)')}${pose('.armR', 'rotate(132deg)')}${pose('.foreR', 'rotate(8deg)')}
            ${pose('.wingL', 'rotate(-14deg)')}${pose('.wingR', 'rotate(-6deg)')}${pose('.head', 'rotate(-5deg)')}${pose('.tail2', 'rotate(10deg)')}${pose('.tail3', 'rotate(14deg)')}`,
        DJing: `
            ${kf('jump', { 0: 'transform:translateY(0) scale(1.05,.95)', 40: 'transform:translateY(-11px) scale(.97,1.04)', 80: 'transform:translateY(0) scale(1.05,.95)', 100: 'transform:translateY(0) scale(1.05,.95)' })}
            ${kf('nodBack', { 0: 'transform:rotate(-4deg)', 40: 'transform:rotate(4deg) translateY(2.4px)', 100: 'transform:rotate(-4deg)' })}
            ${kf('flap', { 0: 'transform:rotate(4deg)', 40: 'transform:rotate(-20deg)', 100: 'transform:rotate(4deg)' })}
            ${kf('pump', { 0: 'transform:rotate(138deg)', 40: 'transform:rotate(160deg)', 100: 'transform:rotate(138deg)' })}
            ${kf('pumpFore', { 0: 'transform:rotate(30deg)', 40: 'transform:rotate(6deg)', 100: 'transform:rotate(30deg)' })}
            ${kf('scratch', { 0: 'transform:rotate(16deg)', 50: 'transform:rotate(32deg)', 100: 'transform:rotate(16deg)' })}
            ${kf('kick', { 0: 'transform:translateY(0)', 40: 'transform:translateY(-6px)', 80: 'transform:translateY(0)', 100: 'transform:translateY(0)' })}
            ${kf('shadowJump', { 0: 'transform:scale(1.05)', 40: 'transform:scale(.76)', 80: 'transform:scale(1.05)', 100: 'transform:scale(1.05)' })}
            ${play('.all', 'jump', 0.6)}${play('.head', 'nodBack', 0.6, '-.54s')}${play('.wingL', 'flap', 0.6)}${play('.wingR', 'flap', 0.6, '-.08s')}
            ${play('.armL', 'pump', 0.6)}${play('.foreL', 'pumpFore', 0.6, '-.52s')}${play('.foreR', 'scratch', 0.3)}
            ${play('.legL', 'kick', 0.6)}${play('.legR', 'kick', 0.6, '-.3s')}${play('.shadow', 'shadowJump', 0.6)}${tail('wag', 12, 0.6)}
            ${pose('.armL', 'rotate(146deg)')}${pose('.foreL', 'rotate(20deg)')}${pose('.armR', 'rotate(14deg)')}${pose('.foreR', 'rotate(22deg)')}${pose('.wingL', 'rotate(-10deg)')}${pose('.wingR', 'rotate(-10deg)')}`,
    };

    return base + always + rules[state];
};

export function dragon(theme, state) {
    const t = THEMES[theme];
    const back = state === 'DJing';
    const { drawing: tailDrawing, joints } = tail(t, theme, back ? [86, 200] : [98, 196]);
    const wings = wing(t, 'L') + mirror(wing(t, 'R'));
    const figure = back
        ? `${leg(t, 'L', true)}${mirror(leg(t, 'R', true))}${body(t, true)}${tailDrawing}${mirror(arm(t, 'R', true))}${wings}${head(t, theme, true, false)}${arm(t, 'L', true)}`
        : `${wings}${tailDrawing}${leg(t, 'L', false)}${mirror(leg(t, 'R', false))}${body(t, false)}${arm(t, 'L', false)}${mirror(arm(t, 'R', false))}${head(t, theme, false, state === 'Dancing')}`;

    return picture({
        label: t.label,
        state,
        defs: defs(t),
        body: `${shadow()}<g class="all">${figure}</g>${sparks(theme)}`,
        css: motion(state, joints),
    });
}
