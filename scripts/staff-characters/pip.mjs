// Pip: a chill penguin DJ. A round black-and-white penguin with an orange beak and feet, a crimson knitted beanie, cyan headphones with glowing
// cups and a violet bow tie. Standing, Pip waves a flipper hello. Dancing, the flippers flap and snowflakes drift down around him. At the decks
// (seen from behind) he pumps one flipper and scratches with the other. Everybody can wear him from level 7.
import { kf, lin, mirror, origins, picture, play, pose, shadow } from './kit.mjs';
import { capsule } from './shapes.mjs';

const INK = '#0f172a';
const both = (part) => part + mirror(part);

const BODY = 'M80 40C114 40 128 72 128 124C128 184 116 236 80 236C44 236 32 184 32 124C32 72 46 40 80 40Z';
const BELLY = 'M80 58C100 58 110 88 110 136C110 192 100 234 80 234C60 234 50 192 50 136C50 88 60 58 80 58Z';
const BOW = 'M80 114L66 106V122ZM80 114L94 106V122Z';
const FOOT = '<ellipse cx="64" cy="234" rx="13" ry="4.6" fill="url(#foot)" stroke="#9a3412" stroke-width=".9"/>';

const eye = () => `<g class="blink">
    <ellipse cx="68" cy="84" rx="7.2" ry="8.4" fill="#fff"/>
    <ellipse cx="68.6" cy="85" rx="4.8" ry="5.6" fill="${INK}"/>
    <circle cx="70.2" cy="82.4" r="1.8" fill="#fff"/><circle cx="66.6" cy="87.4" r=".8" fill="#fff"/>
</g>`;

const face = (happy) => `
    ${happy
        ? both(`<path d="M61 86C63.4 81 72.6 81 75 86" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`)
        : both(eye())}
    ${both('<ellipse cx="60" cy="99" rx="5.4" ry="3.2" fill="#f9a8d4" opacity=".6"/>')}
    <path d="M72 96Q80 90 88 96Q86 110 80 112Q74 110 72 96Z" fill="url(#beak)" stroke="#9a3412" stroke-width=".9" stroke-linejoin="round"/>
    ${happy ? '<path d="M76 104Q80 108 84 104" fill="none" stroke="#9a3412" stroke-width="1.2" stroke-linecap="round"/>' : ''}`;

const beanie = () => `<path d="M51 70C51 45 63 33 80 33C97 33 109 45 109 70Z" fill="url(#knit)" stroke="#7f1d1d" stroke-width="1"/>
    <path d="M50 62Q80 67 110 62V74Q80 79 50 74Z" fill="url(#band)" stroke="#7f1d1d" stroke-width=".9"/>
    <path d="M58 65V75M66 66V77M74 66.6V77.4M82 66.6V77.4M90 66V77M98 65V75" stroke="#dc2626" stroke-opacity=".5" stroke-width="1"/>`;

const headphones = () => `<path d="M44 78C40 40 58 20 80 20C102 20 120 40 116 78" fill="none" stroke="#0e7490" stroke-width="6" stroke-linecap="round"/>
    <path d="M48 68C46 42 60 25 80 25C100 25 114 42 112 68" fill="none" stroke="#a5f3fc" stroke-opacity=".7" stroke-width="1.3" stroke-linecap="round"/>
    ${both(`<g transform="translate(43 82)"><rect x="-8" y="-11" width="16" height="22" rx="7" fill="url(#cup)" stroke="${INK}" stroke-width="1"/><rect class="led" x="-4.4" y="-6.4" width="8.8" height="12.8" rx="3.6" fill="none" stroke="#a5f3fc" stroke-width="1.4" filter="url(#glow)"/></g>`)}`;

/** A flipper (drawn for the left, mirrored for the right): it hangs from the shoulder, and the mirror image turns with the same numbers. */
const flipper = (side) => `<g class="arm${side}">
    <path d="${capsule([42, 124], [30, 170], 9, 6.6)}" fill="url(#back)" stroke="#475569" stroke-width="1"/>
    <path d="M37 132Q34 150 31.8 162" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="2" stroke-linecap="round"/>
</g>`;

const snow = () => [[24, 58, 1, 0], [138, 50, 0.85, -0.6], [30, 118, 0.7, -1.2], [134, 126, 0.9, -1.8]]
    .map(([x, y, s, d]) => `<g class="flake" style="animation-delay:${d}s"><path transform="translate(${x} ${y}) scale(${s})" d="M0 -6V6M-5.2 -3L5.2 3M-5.2 3L5.2 -3" fill="none" stroke="#e0f2fe" stroke-width="1.6" stroke-linecap="round"/></g>`)
    .join('');

const defs = () => [
    lin('back', [0.1, 0, 0.9, 1], [[0, '#334155'], [0.5, '#1e293b'], [1, '#0f172a']]),
    lin('belly', [0, 0, 0, 1], [[0, '#ffffff'], [1, '#e2e8f0']]),
    lin('knit', [0, 0, 1, 1], [[0, '#f87171'], [0.5, '#dc2626'], [1, '#991b1b']]),
    lin('band', [0, 0, 0, 1], [[0, '#fef2f2'], [1, '#fecaca']]),
    lin('cup', [0, 0, 1, 1], [[0, '#67e8f9'], [0.5, '#0891b2'], [1, '#155e75']]),
    lin('beak', [0, 0, 0, 1], [[0, '#fdba74'], [1, '#ea580c']]),
    lin('foot', [0, 0, 1, 1], [[0, '#fdba74'], [1, '#c2410c']]),
    lin('bow', [0, 0, 1, 1], [[0, '#c4b5fd'], [1, '#7c3aed']]),
    `<filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
].join('');

const motion = (state) => {
    const base = origins({ all: '80px 236px', head: '80px 110px', armL: '42px 124px', armR: '42px 124px' }, ['shadow', 'blink', 'led', 'flake']);
    const always = `
        ${kf('blink', { 0: 'transform:scaleY(1)', 92: 'transform:scaleY(1)', 95: 'transform:scaleY(.1)', 98: 'transform:scaleY(1)', 100: 'transform:scaleY(1)' })}
        ${kf('led', { 0: 'opacity:.45', 50: 'opacity:1', 100: 'opacity:.45' })}
        ${play('.blink', 'blink', 4.2)}${play('.led', 'led', 1.2)}`;
    const rules = {
        Standing: `
            ${kf('breathe', { 0: 'transform:scale(1,1)', 50: 'transform:scale(1.012,.988)', 100: 'transform:scale(1,1)' })}
            ${kf('tilt', { 0: 'transform:rotate(-2.5deg)', 50: 'transform:rotate(2.5deg)', 100: 'transform:rotate(-2.5deg)' })}
            ${kf('rest', { 0: 'transform:rotate(3deg)', 50: 'transform:rotate(-2deg)', 100: 'transform:rotate(3deg)' })}
            ${kf('wave', { 0: 'transform:rotate(6deg)', 56: 'transform:rotate(6deg)', 62: 'transform:rotate(150deg)', 68: 'transform:rotate(118deg)', 74: 'transform:rotate(150deg)', 80: 'transform:rotate(118deg)', 88: 'transform:rotate(150deg)', 94: 'transform:rotate(6deg)', 100: 'transform:rotate(6deg)' })}
            ${play('.all', 'breathe', 3.2)}${play('.head', 'tilt', 4.4)}${play('.armL', 'rest', 3.2)}${play('.armR', 'wave', 5)}
            ${pose('.armL', 'rotate(3deg)')}${pose('.armR', 'rotate(120deg)')}`,
        Dancing: `
            ${kf('hop', { 0: 'transform:translateY(0) scale(1.04,.96)', 45: 'transform:translateY(-11px) scale(.98,1.03)', 100: 'transform:translateY(0) scale(1.04,.96)' })}
            ${kf('bob', { 0: 'transform:rotate(-6deg)', 50: 'transform:rotate(6deg) translateY(2px)', 100: 'transform:rotate(-6deg)' })}
            ${kf('flap', { 0: 'transform:rotate(24deg)', 50: 'transform:rotate(112deg)', 100: 'transform:rotate(24deg)' })}
            ${kf('snow', { 0: 'transform:translateY(-30px) rotate(0);opacity:0', 20: 'opacity:1', 100: 'transform:translateY(70px) rotate(90deg);opacity:0' })}
            ${kf('shadowHop', { 0: 'transform:scale(1.04)', 45: 'transform:scale(.84)', 100: 'transform:scale(1.04)' })}
            ${play('.all', 'hop', 0.6)}${play('.head', 'bob', 1.2, '-1.1s')}${play('.armL', 'flap', 0.6)}${play('.armR', 'flap', 0.6, '-.3s')}${play('.flake', 'snow', 1.8)}${play('.shadow', 'shadowHop', 0.6)}
            ${pose('.armL', 'rotate(60deg)')}${pose('.armR', 'rotate(60deg)')}${pose('.head', 'rotate(-4deg)')}`,
        DJing: `
            ${kf('jump', { 0: 'transform:translateY(0) scale(1.04,.96)', 40: 'transform:translateY(-10px) scale(.98,1.03)', 80: 'transform:translateY(0) scale(1.04,.96)', 100: 'transform:translateY(0) scale(1.04,.96)' })}
            ${kf('nod', { 0: 'transform:rotate(-4deg)', 40: 'transform:rotate(4deg) translateY(2px)', 100: 'transform:rotate(-4deg)' })}
            ${kf('pump', { 0: 'transform:rotate(132deg)', 40: 'transform:rotate(158deg)', 100: 'transform:rotate(132deg)' })}
            ${kf('scratch', { 0: 'transform:rotate(18deg)', 50: 'transform:rotate(34deg)', 100: 'transform:rotate(18deg)' })}
            ${kf('shadowJump', { 0: 'transform:scale(1.04)', 40: 'transform:scale(.8)', 80: 'transform:scale(1.04)', 100: 'transform:scale(1.04)' })}
            ${play('.all', 'jump', 0.6)}${play('.head', 'nod', 0.6, '-.54s')}${play('.armL', 'scratch', 0.3)}${play('.armR', 'pump', 0.6)}${play('.shadow', 'shadowJump', 0.6)}
            ${pose('.armL', 'rotate(24deg)')}${pose('.armR', 'rotate(144deg)')}${pose('.head', 'rotate(-3deg)')}`,
    };

    return base + always + rules[state];
};

export function pip(state) {
    const back = state === 'DJing';
    const dancing = state === 'Dancing';
    const penguin = back
        ? `<path d="${BODY}" fill="url(#back)" stroke="${INK}" stroke-width="1.1"/><path d="M78 64C72 100 72 170 80 224" fill="none" stroke="#fff" stroke-opacity=".07" stroke-width="5" stroke-linecap="round"/>${both(FOOT)}`
        : `<path d="${BODY}" fill="url(#back)" stroke="${INK}" stroke-width="1.1"/><path d="${BELLY}" fill="url(#belly)"/><path d="${BOW}" fill="url(#bow)" stroke="#4c1d95" stroke-width=".8" stroke-linejoin="round"/><circle cx="80" cy="114" r="3" fill="#5b21b6"/>${both(FOOT)}`;
    const head = back ? `${beanie()}${headphones()}` : `${beanie()}${face(dancing)}${headphones()}`;

    return picture({
        label: 'Pip',
        state,
        defs: defs(),
        body: `${shadow()}<g class="all">${penguin}${flipper('L')}${mirror(flipper('R'))}<g class="head">${head}</g></g>${dancing ? snow() : ''}`,
        css: motion(state),
    });
}
