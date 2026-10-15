// Panda Bear: a round, fluffy giant panda with black ears, eye patches and limbs, shiny eyes, a pink blush and a stick of bamboo with leaves. He stands
// munching it (every so often he lifts it to his mouth and chews), dances with both paws in the air and the bamboo waved like a glow stick, and at the
// decks he wears mint headphones and pumps a paw. Brand Ambassadors and the roles above them can wear him.
// Arms are chains (shoulder, elbow, paw, the bamboo in the paw) and the ears wobble a moment after the head, so the round body bounces softly.
import { kf, lin, mirror, origins, picture, play, pose, rad, shadow } from './kit.mjs';
import { blob, capsule, furStrokes, line } from './shapes.mjs';

const INK = '#15141b';
const both = (part) => part + mirror(part);

// ---------- head ----------
const HEAD = blob(80, 60, 51, 46, [[160, 0.07, 16], [182, 0.05, 10], [20, 0.07, 16], [-2, 0.05, 10], [270, 0.035, 9], [252, 0.02, 7], [288, 0.02, 7]]);
const ear = (side) => `<g class="ear${side}"><circle cx="37" cy="20" r="17.5" fill="url(#black)" stroke="${INK}" stroke-width="1"/><path d="M26 14C29 7 38 4 44 6" fill="none" stroke="#5b5a6c" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/></g>`;
const ears = () => ear('L') + mirror(ear('R'));
const PATCH = '<ellipse cx="57" cy="57" rx="12.5" ry="17.5" transform="rotate(32 57 57)" fill="url(#black)"/>';
const EYE = '<g class="blink"><circle cx="58.6" cy="55" r="7.4" fill="#fff"/><circle cx="58.8" cy="55.6" r="5.9" fill="url(#iris)"/><circle cx="59" cy="56" r="3.3" fill="#0b0605"/><circle cx="61.2" cy="52.4" r="2.5" fill="#fff"/><circle cx="56.4" cy="58.6" r="1.1" fill="#fff"/></g>';
const HAPPY_EYE = '<path d="M51.6 57C54 51 63.4 51 65.8 57" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>';
const FUR_EDGE = furStrokes([[31, 68], [30, 76], [32, 84], [36, 91]], 4);

const face = (happy) => `
    ${both(PATCH)}
    ${happy ? both(HAPPY_EYE) : both(EYE)}
    <ellipse cx="80" cy="79" rx="16.5" ry="12" fill="url(#muzzle)"/>
    ${both('<ellipse cx="46.5" cy="80" rx="7.4" ry="4.4" fill="#f6a5c4" opacity=".55"/>')}
    <path d="M72.8 70.6C72.8 66.8 87.2 66.8 87.2 70.6C87.2 73.6 83.2 77 80 77C76.8 77 72.8 73.6 72.8 70.6Z" fill="${INK}"/>
    <ellipse cx="77.4" cy="69.6" rx="2.6" ry="1.3" fill="#fff" opacity=".6"/>
    ${happy
        ? `<path d="M72.4 80.6C74 89.6 86 89.6 87.6 80.6Z" fill="#5b1d2e" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/><path d="M75.4 85.6C77.6 83.6 82.4 83.6 84.6 85.6C83 88.2 77 88.2 75.4 85.6Z" fill="#f47ca0"/>`
        : `<g class="mouth"><path d="M80 77V80.8M72.6 80.4C75.4 84.8 79 84.2 80 80.8C81 84.2 84.6 84.8 87.4 80.4" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/></g>`}`;

/** Mint headphones, worn at the decks (seen from behind). */
const cup = () => `<g transform="translate(29.6 64)"><ellipse rx="9" ry="13.4" fill="url(#cup)" stroke="#0b2a22" stroke-width=".9"/><ellipse cx="-.8" rx="5.8" ry="9.2" fill="#0f3b30"/><ellipse class="led" cx="-.8" rx="5.8" ry="9.2" fill="none" stroke="#6ee7b7" stroke-width="1.3" filter="url(#glow)"/></g>`;
const phones = () => `<path d="M31 56C27 26 50 10 80 10C110 10 133 26 129 56" fill="none" stroke="#0e3a2f" stroke-width="6" stroke-linecap="round"/><path d="M34 48C32 26 52 14 80 14C108 14 128 26 126 48" fill="none" stroke="#6ee7b7" stroke-opacity=".55" stroke-width="1.3"/>${both(cup())}`;

const head = (back, happy) => `<g class="head">
    ${ears()}
    <path d="${HEAD}" fill="url(#fur)" stroke="#a9a3bb" stroke-width="1"/>
    <path d="${FUR_EDGE}" stroke="#c9c4d6" stroke-width="1.2" stroke-linecap="round"/>${mirror(`<path d="${FUR_EDGE}" stroke="#c9c4d6" stroke-width="1.2" stroke-linecap="round"/>`)}
    ${back
        ? `<path d="M58 92C66 98 94 98 102 92" fill="none" stroke="#c9c4d6" stroke-width="1.4" stroke-linecap="round"/><path d="${line([[40, 34], [60, 22], [80, 18], [100, 22], [120, 34]])}" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2"/>${phones()}`
        : face(happy)}
</g>`;

// ---------- body ----------
const BODY = blob(80, 160, 44, 54, [[180, 0.03, 14], [0, 0.03, 14]]);
const BAND = 'M36.6 142C37.4 116 56 102 80 102C104 102 122.6 116 123.4 142C110 134 96 130.6 80 130.6C64 130.6 50 134 36.6 142Z';
const BAND_BACK = 'M36.6 152C36 120 54 102 80 102C106 102 124 120 123.4 152C110 140 96 136 80 140C64 136 50 140 36.6 152Z';
const LEG = 'M47.6 196C44.4 210 44.6 226 47.8 233.4C52 240.4 70.4 240.4 74 234C77 226 76.4 210 72.2 197Z';

const body = (back) => `<g class="body">
    <path d="${BODY}" fill="url(#furBody)" stroke="#a9a3bb" stroke-width="1"/>
    <path d="${back ? BAND_BACK : BAND}" fill="url(#black)"/>
    ${back
        ? '<circle cx="80" cy="198" r="9.4" fill="url(#fur)" stroke="#a9a3bb" stroke-width=".9"/><path d="M75 194C77 192 83 192 85 194" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>'
        : '<ellipse cx="80" cy="172" rx="27" ry="31" fill="url(#belly)"/><path d="M70 150C74 147 86 147 90 150" fill="none" stroke="#d9d4e4" stroke-width="1.3" stroke-linecap="round"/>'}
</g>`;

const leg = (side) => `<g class="leg${side}">
    <path d="${LEG}" fill="url(#black)" stroke="${INK}" stroke-width="1"/>
    <path d="M52 231.6C56 229 66 229 70 231.6" fill="none" stroke="#4b4a5a" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M55.4 234.4V237.6M61 235V238.4M66.6 234.4V237.6" stroke="#4b4a5a" stroke-width="1.2" stroke-linecap="round"/>
</g>`;

// ---------- arms, paws and the bamboo (drawn for the left; the right is the mirror image) ----------
const paw = (pads) => `<ellipse cx="40" cy="177.4" rx="10.4" ry="9.4" fill="url(#black)" stroke="${INK}" stroke-width="1"/>
    ${pads ? '<ellipse cx="40" cy="179.4" rx="5" ry="3.9" fill="#f3a6c3" opacity=".9"/><g fill="#f3a6c3" opacity=".9"><circle cx="34.8" cy="173.6" r="1.7"/><circle cx="40" cy="171.8" r="1.8"/><circle cx="45.2" cy="173.6" r="1.7"/></g>' : '<path d="M33.6 172.6C37 170.4 43 170.4 46.4 172.6" fill="none" stroke="#4b4a5a" stroke-width="1.3" stroke-linecap="round"/>'}`;

/** Bamboo through the fist at (40, 177): the stalk with rings at its joints and a sprig of leaves at the top. It turns round the fist on its own. */
const bamboo = () => `<g class="bamboo">
    <path d="M38.4 124H41.8L42.6 200H37.6Z" fill="url(#bamboo)" stroke="#2c5e1d" stroke-width=".8" stroke-linejoin="round"/>
    ${[136, 152, 190].map((y) => `<path d="M37.6 ${y}H42.4" stroke="#2c5e1d" stroke-width="2.2" stroke-linecap="round"/><path d="M38.4 ${y + 1.6}H41.6" stroke="#c4f08f" stroke-opacity=".6" stroke-width=".8"/>`).join('')}
    <path d="M40 126C34 118 26 116 20 119C26 122 32 125 39.6 127Z" fill="url(#leaf)" stroke="#2c5e1d" stroke-width=".7" stroke-linejoin="round"/>
    <path d="M40.4 125C46 115 54 111 61 112C55 117 48 122 41 127Z" fill="url(#leaf)" stroke="#2c5e1d" stroke-width=".7" stroke-linejoin="round"/>
    <path d="M40 124C38 114 40 104 45 98C45 107 44 116 41.6 125Z" fill="url(#leaf)" stroke="#2c5e1d" stroke-width=".7" stroke-linejoin="round"/>
    <path d="M38.6 126C33 121 27 119.4 23 120M41.6 125.4C47 118 53 114.4 58 113.6M41 123.4C41 115 42 107 44.4 101" fill="none" stroke="#c4f08f" stroke-opacity=".55" stroke-width=".7"/>
</g>`;

const arm = (side, { withBamboo = false, pads = true } = {}) => `<g class="arm${side}">
    <path d="${capsule([45, 128], [37.4, 152], 11, 10)}" fill="url(#black)" stroke="${INK}" stroke-width="1"/>
    <path d="M41 124C37.6 132 35 141 33.6 150" fill="none" stroke="#4b4a5a" stroke-width="1.6" stroke-linecap="round"/>
    <g class="fore${side}">
        <path d="${capsule([37.4, 150], [40, 172], 10, 9.4)}" fill="url(#black)" stroke="${INK}" stroke-width="1"/>
        <g class="hand${side}">${withBamboo ? bamboo() : ''}${paw(pads)}</g>
    </g>
</g>`;

const defs = () => [
    rad('fur', [0.42, 0.34, 0.72], [[0, '#ffffff'], [0.62, '#f4f2f8'], [1, '#d3cede']]),
    rad('furBody', [0.44, 0.3, 0.75], [[0, '#ffffff'], [0.6, '#efedf4'], [1, '#c7c1d4']]),
    lin('black', [0.1, 0, 0.9, 1], [[0, '#43424f'], [0.45, '#22212a'], [1, '#0e0d13']]),
    rad('muzzle', [0.5, 0.4, 0.6], [[0, '#ffffff'], [1, '#f3ede6']]),
    rad('belly', [0.5, 0.42, 0.55], [[0, '#ffffff', 0.95], [1, '#ffffff', 0]]),
    rad('iris', [0.4, 0.35, 0.7], [[0, '#7a4a2c'], [0.6, '#3b2416'], [1, '#1a0f08']]),
    lin('bamboo', [0, 0, 1, 0], [[0, '#b6ea7c'], [0.5, '#6cb646'], [1, '#2f6f22']]),
    lin('leaf', [0, 0, 1, 1], [[0, '#a3e46e'], [1, '#3f8f2f']]),
    lin('cup', [0, 0, 1, 1], [[0, '#3b9e82'], [0.55, '#14614f'], [1, '#08302a']]),
    `<filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
].join('');

const motion = (state) => {
    const joints = { arm: '45px 128px', fore: '37.4px 151px', hand: '40px 172px', leg: '61px 198px', ear: '37px 34px' };
    const base = origins({
        all: '80px 238px', head: '80px 104px', body: '80px 214px', bamboo: '40px 177px',
        ...Object.fromEntries(Object.entries(joints).flatMap(([part, o]) => [[`${part}L`, o], [`${part}R`, o]])),
    }, ['shadow', 'blink', 'mouth']);
    const always = `${kf('led', { 0: 'opacity:.45', 50: 'opacity:1', 100: 'opacity:.45' })}${play('.led', 'led', 1.2)}
        ${kf('blink', { 0: 'transform:scaleY(1)', 92: 'transform:scaleY(1)', 95: 'transform:scaleY(.1)', 98: 'transform:scaleY(1)', 100: 'transform:scaleY(1)' })}${play('.blink', 'blink', 4.2)}`;
    // the right paw holds the bamboo before the belly and, every five seconds, lifts it to the mouth; the bamboo turns with it so the leaves stay up
    const munch = (rest, lift) => ({ 0: `transform:rotate(${rest}deg)`, 60: `transform:rotate(${rest}deg)`, 68: `transform:rotate(${lift}deg)`, 86: `transform:rotate(${lift}deg)`, 94: `transform:rotate(${rest}deg)`, 100: `transform:rotate(${rest}deg)` });
    const rules = {
        Standing: `
            ${kf('breathe', { 0: 'transform:scale(1,1)', 50: 'transform:scale(1.015,.985) translateY(.6px)', 100: 'transform:scale(1,1)' })}
            ${kf('nod', { 0: 'transform:rotate(-2deg)', 62: 'transform:rotate(-2deg)', 70: 'transform:rotate(3deg) translateY(1px)', 86: 'transform:rotate(3deg) translateY(1px)', 94: 'transform:rotate(-2deg)', 100: 'transform:rotate(-2deg)' })}
            ${kf('flick', { 0: 'transform:rotate(0)', 40: 'transform:rotate(0)', 43: 'transform:rotate(-14deg)', 47: 'transform:rotate(4deg)', 51: 'transform:rotate(0)', 100: 'transform:rotate(0)' })}
            ${kf('munch', munch(-8, -26))}${kf('munchFore', munch(-58, -70))}${kf('munchBamboo', munch(48, 106))}
            ${kf('chew', { 0: 'transform:scale(1,1)', 70: 'transform:scale(1,1)', 73: 'transform:scale(.8,1.5)', 76: 'transform:scale(1,1)', 79: 'transform:scale(.8,1.5)', 82: 'transform:scale(1,1)', 85: 'transform:scale(.8,1.5)', 88: 'transform:scale(1,1)', 100: 'transform:scale(1,1)' })}
            ${kf('hang', { 0: 'transform:rotate(2deg)', 50: 'transform:rotate(5deg)', 100: 'transform:rotate(2deg)' })}
            ${play('.body', 'breathe', 3.4)}${play('.head', 'nod', 5)}${play('.earL', 'flick', 5)}${play('.mouth', 'chew', 5)}
            ${play('.armR', 'munch', 5)}${play('.foreR', 'munchFore', 5, '-4.94s')}${play('.bamboo', 'munchBamboo', 5, '-4.94s')}${play('.armL', 'hang', 3.4)}
            ${pose('.armR', 'rotate(-8deg)')}${pose('.foreR', 'rotate(-58deg)')}${pose('.bamboo', 'rotate(48deg)')}${pose('.armL', 'rotate(3deg)')}`,
        Dancing: `
            ${kf('hop', { 0: 'transform:translateY(0) scale(1.05,.95)', 45: 'transform:translateY(-11px) scale(.97,1.04)', 100: 'transform:translateY(0) scale(1.05,.95)' })}
            ${kf('bob', { 0: 'transform:rotate(-8deg)', 50: 'transform:rotate(8deg) translateY(2px)', 100: 'transform:rotate(-8deg)' })}
            ${kf('wobble', { 0: 'transform:rotate(10deg)', 50: 'transform:rotate(-12deg)', 100: 'transform:rotate(10deg)' })}
            ${kf('wave', { 0: 'transform:rotate(128deg)', 50: 'transform:rotate(154deg)', 100: 'transform:rotate(128deg)' })}
            ${kf('waveFore', { 0: 'transform:rotate(18deg)', 50: 'transform:rotate(-14deg)', 100: 'transform:rotate(18deg)' })}
            ${kf('glowstick', { 0: 'transform:rotate(-176deg)', 50: 'transform:rotate(-112deg)', 100: 'transform:rotate(-176deg)' })}
            ${kf('step', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-7px)', 100: 'transform:translateY(0)' })}
            ${kf('shadowHop', { 0: 'transform:scale(1.05)', 45: 'transform:scale(.8)', 100: 'transform:scale(1.05)' })}
            ${play('.all', 'hop', 0.6)}${play('.head', 'bob', 1.2, '-1.1s')}${play('.earL', 'wobble', 0.6, '-.5s')}${play('.earR', 'wobble', 0.6, '-.2s')}
            ${play('.armL', 'wave', 1.2)}${play('.foreL', 'waveFore', 1.2, '-1.1s')}${play('.armR', 'wave', 1.2, '-.6s')}${play('.foreR', 'waveFore', 1.2, '-.5s')}${play('.bamboo', 'glowstick', 1.2, '-.4s')}
            ${play('.legL', 'step', 0.6)}${play('.legR', 'step', 0.6, '-.3s')}${play('.shadow', 'shadowHop', 0.6)}
            ${pose('.armL', 'rotate(132deg)')}${pose('.foreL', 'rotate(12deg)')}${pose('.armR', 'rotate(150deg)')}${pose('.foreR', 'rotate(-10deg)')}${pose('.bamboo', 'rotate(-150deg)')}
            ${pose('.head', 'rotate(-6deg)')}${pose('.legL', 'translateY(-5px)')}`,
        DJing: `
            ${kf('jump', { 0: 'transform:translateY(0) scale(1.05,.95)', 40: 'transform:translateY(-10px) scale(.97,1.04)', 80: 'transform:translateY(0) scale(1.05,.95)', 100: 'transform:translateY(0) scale(1.05,.95)' })}
            ${kf('nodBack', { 0: 'transform:rotate(-4deg)', 40: 'transform:rotate(4deg) translateY(2.4px)', 100: 'transform:rotate(-4deg)' })}
            ${kf('wobble', { 0: 'transform:rotate(8deg)', 50: 'transform:rotate(-10deg)', 100: 'transform:rotate(8deg)' })}
            ${kf('pump', { 0: 'transform:rotate(140deg)', 40: 'transform:rotate(162deg)', 100: 'transform:rotate(140deg)' })}
            ${kf('pumpFore', { 0: 'transform:rotate(30deg)', 40: 'transform:rotate(6deg)', 100: 'transform:rotate(30deg)' })}
            ${kf('scratch', { 0: 'transform:rotate(16deg)', 50: 'transform:rotate(32deg)', 100: 'transform:rotate(16deg)' })}
            ${kf('kick', { 0: 'transform:translateY(0)', 40: 'transform:translateY(-6px)', 80: 'transform:translateY(0)', 100: 'transform:translateY(0)' })}
            ${kf('shadowJump', { 0: 'transform:scale(1.05)', 40: 'transform:scale(.76)', 80: 'transform:scale(1.05)', 100: 'transform:scale(1.05)' })}
            ${play('.all', 'jump', 0.6)}${play('.head', 'nodBack', 0.6, '-.54s')}${play('.earL', 'wobble', 0.6, '-.4s')}${play('.earR', 'wobble', 0.6, '-.1s')}
            ${play('.armL', 'pump', 0.6)}${play('.foreL', 'pumpFore', 0.6, '-.52s')}${play('.foreR', 'scratch', 0.3)}
            ${play('.legL', 'kick', 0.6)}${play('.legR', 'kick', 0.6, '-.3s')}${play('.shadow', 'shadowJump', 0.6)}
            ${pose('.armL', 'rotate(148deg)')}${pose('.foreL', 'rotate(20deg)')}${pose('.armR', 'rotate(14deg)')}${pose('.foreR', 'rotate(22deg)')}${pose('.head', 'rotate(-3deg)')}`,
    };

    return base + always + rules[state];
};

export function panda(state) {
    const back = state === 'DJing';
    const figure = back
        ? `${leg('L')}${mirror(leg('R'))}${body(true)}${mirror(arm('R', { pads: false }))}${head(true, false)}${arm('L', { pads: false })}`
        : `${leg('L')}${mirror(leg('R'))}${body(false)}${head(false, state === 'Dancing')}${arm('L')}${mirror(arm('R', { withBamboo: true }))}`;

    return picture({
        label: 'Panda Bear',
        state,
        defs: defs(),
        body: `${shadow()}<g class="all">${figure}</g>`,
        css: motion(state),
    });
}
