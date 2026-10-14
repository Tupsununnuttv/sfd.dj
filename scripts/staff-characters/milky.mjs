// Milky: a cheerful milk carton. A white carton with a gable top (its spout open on one side, where a drop of milk hangs), cow spots, a big blue
// MILK label, shiny eyes and a blush, stubby arms with round mittens, and blue sneakers. From behind: a barcode and a best-before date.
// The carton is soft: it squashes and stretches as it bounces, and the gable top wobbles a moment after the box, so it jiggles like a full carton.
// Everybody can wear it from level 6.
import { kf, lin, mirror, origins, picture, play, pose, rad, shadow } from './kit.mjs';
import { capsule } from './shapes.mjs';

const INK = '#1e3a5f';
const both = (part) => part + mirror(part);

const SPOTS_FRONT = 'M47 94C52 90 60 92 61 98C62 104 55 106 51 104C48 108 46 104 47 94ZM103 102C108 98 113 101 113 107C113 114 107 116 104 112C99 112 99 105 103 102ZM48 138C50 135 54 136 54 140C54 143 50 144 48 142Z';
const SPOTS_ROOF = 'M60 66C64 63 70 65 69 70C68 74 63 75 61 72C58 73 57 68 60 66Z';

const carton = (back, happy) => `<g class="carton">
    <rect x="46" y="86" width="68" height="122" rx="8" fill="url(#carton)" stroke="${INK}" stroke-width="1.3"/>
    <path d="M108 92V202" stroke="#c7d5e8" stroke-width="3" stroke-linecap="round"/>
    <path d="M52 94V196" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>
    <path d="${SPOTS_FRONT}" fill="#22283a"/>
    ${back
        ? `<text x="80" y="108" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="7.4" font-weight="700" fill="${INK}" letter-spacing=".4">NUTRITION</text>
           <path d="M56 114H104M56 121H96M56 128H100M56 135H90" stroke="#9fb3cc" stroke-width="2" stroke-linecap="round"/>
           <text x="80" y="146" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="6" font-weight="700" fill="${INK}">BEST BEFORE</text>
           <text x="80" y="154" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="6" font-weight="700" fill="${INK}">06.2027</text>
           <rect x="58" y="160" width="44" height="30" rx="2" fill="#fff" stroke="#9fb3cc" stroke-width=".8"/>
           <path d="${Array.from({ length: 19 }, (_, i) => `M${62 + i * 2} 163V${i % 4 === 0 ? 186 : 183}`).join('')}" stroke="#111827" stroke-width="${[1.2, 0.6, 0.9, 0.5, 1.3, 0.7, 0.6, 1.1, 0.5, 0.9, 1.2, 0.6, 0.8, 0.5, 1.2, 0.7, 0.9, 0.6, 1.1][0]}"/>
           <text x="80" y="193" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="4" fill="#111827">4 750001 060123</text>`
        : `<rect x="51" y="150" width="58" height="46" rx="8" fill="url(#label)" stroke="${INK}" stroke-width="1"/>
           <path d="M51 160C58 155 64 163 71 158C78 153 84 161 91 156C98 151 103 158 109 155" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".85"/>
           <text x="80" y="183" text-anchor="middle" font-family="'Arial Black', Arial, Helvetica, sans-serif" font-size="16" font-weight="900" fill="#fff" letter-spacing="1">MILK</text>
           <path d="M80 186.6C82 189 82.4 190.6 80 192C77.6 190.6 78 189 80 186.6Z" fill="#fff"/>
           ${face(happy)}`}
</g>`;

const face = (happy) => `
    ${happy
        ? both('<path d="M60 126C62 119 70 119 72 126" fill="none" stroke="#1b2433" stroke-width="3" stroke-linecap="round"/>')
        : both('<g class="blink"><ellipse cx="66" cy="124" rx="6.4" ry="7.8" fill="#1b2433"/><circle cx="68.2" cy="120.8" r="2.4" fill="#fff"/><circle cx="64.4" cy="127.4" r="1.1" fill="#fff"/></g>')}
    ${both('<ellipse cx="58" cy="135" rx="5.4" ry="3" fill="#f9a8c7" opacity=".7"/>')}
    ${happy
        ? '<path d="M73 131C74 140 86 140 87 131Z" fill="#7a1f3d" stroke="#1b2433" stroke-width="1.3" stroke-linejoin="round"/><path d="M76 135.6C78 134 82 134 84 135.6C83 138 77 138 76 135.6Z" fill="#ff8fb1"/>'
        : '<path d="M75.6 132Q80 137 84.4 132" fill="none" stroke="#1b2433" stroke-width="1.9" stroke-linecap="round"/>'}`;

/** The gable top: the front slope, the sealed fin along the top, the open spout with its drop of milk; it wobbles on its own. */
const roof = (back) => `<g class="roof">
    <path d="M46 88L54 60H106L114 88Z" fill="url(#roof)" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M54 60L46 88M106 60L114 88" stroke="#c7d5e8" stroke-width="1.2"/>
    <path d="${SPOTS_ROOF}" fill="#22283a"/>
    <rect x="52" y="51" width="56" height="10" rx="2.4" fill="url(#carton)" stroke="${INK}" stroke-width="1.2"/>
    <path d="M55 55H105" stroke="#c7d5e8" stroke-width="1"/>
    ${back
        ? phones()
        : `<path d="M100 60L112 46L118 62Z" fill="url(#carton)" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/><path d="M103 60L112 49.6L114.6 60.8Z" fill="#d6e3f2"/>
           <path class="drip" d="M116 64C118 67 118.6 69 116 70.8C113.4 69 114 67 116 64Z" fill="#fff" stroke="#c7d5e8" stroke-width=".7"/>`}
</g>`;

/** Blue headphones worn over the gable top at the decks (from behind). */
const phones = () => `<path d="M44 104C40 60 56 42 80 42C104 42 120 60 116 104" fill="none" stroke="#1e3a8a" stroke-width="5.4" stroke-linecap="round"/>${both('<g transform="translate(42.4 108)"><ellipse rx="8" ry="12" fill="url(#cup)" stroke="#0f1d4a" stroke-width=".9"/><ellipse class="led" cx="-.6" rx="5.2" ry="8.2" fill="none" stroke="#93c5fd" stroke-width="1.3" filter="url(#glow)"/></g>')}`;

const arm = (side) => `<g class="arm${side}">
    <path d="${capsule([46.5, 132], [36, 150], 5.6, 5)}" fill="url(#carton)" stroke="${INK}" stroke-width="1.1"/>
    <g class="fore${side}">
        <path d="${capsule([36, 149], [34, 165], 5, 4.6)}" fill="url(#carton)" stroke="${INK}" stroke-width="1.1"/>
        <g class="hand${side}"><circle cx="34" cy="169.4" r="6.4" fill="url(#carton)" stroke="${INK}" stroke-width="1.1"/><path d="M29.4 166.4C29 169 30 171.6 32 173" fill="none" stroke="#c7d5e8" stroke-width="1.2" stroke-linecap="round"/></g>
    </g>
</g>`;

const leg = (side) => `<g class="leg${side}">
    <path d="${capsule([66, 204], [66, 226], 6, 5.6)}" fill="url(#jeans)" stroke="${INK}" stroke-width="1.1"/>
    <path d="M55 236C55 228 61 224 69 225C75 226 78 229.6 78 234C78 238 76 239.4 72 239.4H58C56 239.4 55 238.4 55 236Z" fill="url(#shoe)" stroke="${INK}" stroke-width="1.1"/>
    <path d="M55.6 236.4H77.6" stroke="#fff" stroke-width="2.2"/>
    <path d="M63 228.6L67 227.4M64.6 231.4L68.6 230.2" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>
</g>`;

/** Splashes of milk round it: drops that jump and fall. */
const drops = () => [[18, 120, 1, 0], [146, 100, 0.8, -0.6], [20, 60, 0.7, -1.3], [142, 168, 0.9, -1.9]].map(([x, y, s, d]) => `<g class="splash" style="animation-delay:${d}s"><path transform="translate(${x} ${y}) scale(${s})" d="M0 -5C3 -1 3.6 1.6 0 4C-3.6 1.6 -3 -1 0 -5Z" fill="#fff" stroke="#c7d5e8" stroke-width=".8"/></g>`).join('');

const defs = () => [
    lin('carton', [0, 0, 1, 0], [[0, '#ffffff'], [0.7, '#f3f7fc'], [1, '#d7e2f0']]),
    lin('roof', [0, 0, 0, 1], [[0, '#eef4fb'], [1, '#ffffff']]),
    lin('label', [0, 0, 0, 1], [[0, '#60a5fa'], [0.5, '#3b82f6'], [1, '#1d4ed8']]),
    lin('jeans', [0, 0, 1, 0], [[0, '#bfdbfe'], [1, '#7aa7e0']]),
    lin('shoe', [0, 0, 0, 1], [[0, '#60a5fa'], [1, '#1d4ed8']]),
    lin('cup', [0, 0, 1, 1], [[0, '#3b5bdb'], [0.55, '#1e3a8a'], [1, '#0f1d4a']]),
    `<filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
].join('');

const motion = (state) => {
    const joints = { arm: '46.5px 132px', fore: '36px 149.5px', hand: '34px 166px', leg: '66px 204px' };
    const base = origins({
        all: '80px 238px', carton: '80px 208px', roof: '80px 88px',
        ...Object.fromEntries(Object.entries(joints).flatMap(([part, o]) => [[`${part}L`, o], [`${part}R`, o]])),
    }, ['shadow', 'blink', 'drip', 'splash']);
    const always = `
        ${kf('blink', { 0: 'transform:scaleY(1)', 92: 'transform:scaleY(1)', 95: 'transform:scaleY(.1)', 98: 'transform:scaleY(1)', 100: 'transform:scaleY(1)' })}
        ${kf('drip', { 0: 'transform:translateY(0) scale(.4);opacity:0', 30: 'transform:translateY(0) scale(1);opacity:1', 60: 'transform:translateY(0) scale(1);opacity:1', 100: 'transform:translateY(34px) scale(.8);opacity:0' })}
        ${kf('led', { 0: 'opacity:.45', 50: 'opacity:1', 100: 'opacity:.45' })}
        ${play('.blink', 'blink', 4)}${play('.drip', 'drip', 3)}${play('.led', 'led', 1.2)}`;
    const rules = {
        Standing: `
            ${kf('squish', { 0: 'transform:scale(1,1)', 50: 'transform:scale(1.02,.98)', 100: 'transform:scale(1,1)' })}
            ${kf('jiggle', { 0: 'transform:rotate(-2deg)', 50: 'transform:rotate(2.4deg)', 100: 'transform:rotate(-2deg)' })}
            ${kf('swing', { 0: 'transform:rotate(-4deg)', 50: 'transform:rotate(6deg)', 100: 'transform:rotate(-4deg)' })}
            ${play('.carton', 'squish', 2.8)}${play('.roof', 'jiggle', 2.8, '-2.5s')}
            ${play('.armL', 'swing', 2.8)}${play('.foreL', 'swing', 2.8, '-2.5s')}${play('.armR', 'swing', 2.8, '-1.4s')}${play('.foreR', 'swing', 2.8, '-1.1s')}`,
        Dancing: `
            ${kf('bounce', { 0: 'transform:translateY(0) scale(1.08,.92)', 45: 'transform:translateY(-12px) scale(.95,1.06)', 100: 'transform:translateY(0) scale(1.08,.92)' })}
            ${kf('jiggle', { 0: 'transform:rotate(-7deg)', 50: 'transform:rotate(7deg)', 100: 'transform:rotate(-7deg)' })}
            ${kf('wave', { 0: 'transform:rotate(120deg)', 50: 'transform:rotate(150deg)', 100: 'transform:rotate(120deg)' })}
            ${kf('waveFore', { 0: 'transform:rotate(26deg)', 50: 'transform:rotate(-12deg)', 100: 'transform:rotate(26deg)' })}
            ${kf('step', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-7px)', 100: 'transform:translateY(0)' })}
            ${kf('splash', { 0: 'transform:translateY(8px) scale(.3);opacity:0', 30: 'transform:translateY(-14px) scale(1);opacity:1', 100: 'transform:translateY(16px) scale(.7);opacity:0' })}
            ${kf('shadowHop', { 0: 'transform:scale(1.06)', 45: 'transform:scale(.8)', 100: 'transform:scale(1.06)' })}
            ${play('.all', 'bounce', 0.6)}${play('.roof', 'jiggle', 0.6, '-.48s')}
            ${play('.armL', 'wave', 1.2)}${play('.foreL', 'waveFore', 1.2, '-1.1s')}${play('.armR', 'wave', 1.2, '-.6s')}${play('.foreR', 'waveFore', 1.2, '-.5s')}
            ${play('.legL', 'step', 0.6)}${play('.legR', 'step', 0.6, '-.3s')}${play('.splash', 'splash', 1.2)}${play('.shadow', 'shadowHop', 0.6)}
            ${pose('.armL', 'rotate(128deg)')}${pose('.foreL', 'rotate(14deg)')}${pose('.armR', 'rotate(144deg)')}${pose('.foreR', 'rotate(-4deg)')}${pose('.roof', 'rotate(-5deg)')}${pose('.legL', 'translateY(-5px)')}`,
        DJing: `
            ${kf('jump', { 0: 'transform:translateY(0) scale(1.07,.93)', 40: 'transform:translateY(-11px) scale(.96,1.05)', 80: 'transform:translateY(0) scale(1.07,.93)', 100: 'transform:translateY(0) scale(1.07,.93)' })}
            ${kf('jiggle', { 0: 'transform:rotate(-5deg)', 40: 'transform:rotate(5deg)', 100: 'transform:rotate(-5deg)' })}
            ${kf('pump', { 0: 'transform:rotate(138deg)', 40: 'transform:rotate(160deg)', 100: 'transform:rotate(138deg)' })}
            ${kf('pumpFore', { 0: 'transform:rotate(30deg)', 40: 'transform:rotate(6deg)', 100: 'transform:rotate(30deg)' })}
            ${kf('scratch', { 0: 'transform:rotate(16deg)', 50: 'transform:rotate(34deg)', 100: 'transform:rotate(16deg)' })}
            ${kf('kick', { 0: 'transform:translateY(0)', 40: 'transform:translateY(-6px)', 80: 'transform:translateY(0)', 100: 'transform:translateY(0)' })}
            ${kf('shadowJump', { 0: 'transform:scale(1.05)', 40: 'transform:scale(.76)', 80: 'transform:scale(1.05)', 100: 'transform:scale(1.05)' })}
            ${play('.all', 'jump', 0.6)}${play('.roof', 'jiggle', 0.6, '-.5s')}${play('.armL', 'pump', 0.6)}${play('.foreL', 'pumpFore', 0.6, '-.52s')}${play('.foreR', 'scratch', 0.3)}
            ${play('.legL', 'kick', 0.6)}${play('.legR', 'kick', 0.6, '-.3s')}${play('.shadow', 'shadowJump', 0.6)}
            ${pose('.armL', 'rotate(146deg)')}${pose('.foreL', 'rotate(20deg)')}${pose('.armR', 'rotate(14deg)')}${pose('.foreR', 'rotate(24deg)')}`,
    };

    return base + always + rules[state];
};

export function milky(state) {
    const back = state === 'DJing';
    const figure = `${leg('L')}${mirror(leg('R'))}${back ? mirror(arm('R')) : ''}${carton(back, state === 'Dancing')}${roof(back)}${back ? arm('L') : arm('L') + mirror(arm('R'))}`;

    return picture({
        label: 'Milky',
        state,
        defs: defs(),
        body: `${shadow()}<g class="all"><g transform="translate(80 238) scale(1.2) translate(-80 -238)">${figure}</g></g>${drops()}`, // a carton is short: drawn a size up, from the feet
        css: motion(state),
    });
}
