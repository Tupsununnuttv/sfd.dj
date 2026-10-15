// Boomer: a chill turtle whose shell is a boombox. Bright green skin, a cream belly with scutes, a pink bucket hat, round shades, a gold record on a chain,
// pink wristbands and white sneakers. On his back the shell is a green boombox with two woofers, a tape deck with turning reels, a bouncing equalizer
// and an antenna; the woofers thump and sound waves ring out of them. Standing, he waves hello; dancing, the arms swing and the bass shakes the
// whole box; at the decks (seen from behind, so the whole boombox shows) he pumps a fist and scratches. Everybody can wear him from level 20.
import { kf, lin, mirror, origins, picture, play, pose, rad, shadow } from './kit.mjs';
import { capsule } from './shapes.mjs';

const LINE = '#052e16';
const SHADE = '#0f172a';
const both = (part) => part + mirror(part);

const HEAD = 'M45 70C45 50 60 36 80 36C100 36 115 50 115 70C115 90 100 104 80 104C60 104 45 90 45 70Z';
const TORSO = 'M56 104C65 99 95 99 104 104C113 109 118 123 118 143C118 168 110 192 80 194C50 192 42 168 42 143C42 123 47 109 56 104Z';
const PLASTRON = 'M80 112C99 112 108 130 108 148C108 172 98 190 80 190C62 190 52 172 52 148C52 130 61 112 80 112Z';
const BOX = 'M34 108H126A24 24 0 0 1 150 132V176A24 24 0 0 1 126 200H34A24 24 0 0 1 10 176V132A24 24 0 0 1 34 108Z';

// ---------- head ----------
const shades = () => `<g class="shades">
    ${both(`<circle cx="66" cy="72" r="11.4" fill="url(#lens)" stroke="${SHADE}" stroke-width="2.6"/><path d="M58.6 66.6Q62 62.4 67 62.4" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="1.8" stroke-linecap="round"/><circle cx="72.4" cy="78.4" r="1.2" fill="#fff" fill-opacity=".6"/><path d="M54.8 70L46 67" stroke="${SHADE}" stroke-width="2.6" stroke-linecap="round"/>`)}
    <path d="M77.2 71Q80 68 82.8 71" fill="none" stroke="${SHADE}" stroke-width="2.6" stroke-linecap="round"/>
</g>`;

const face = (open) => `
    <ellipse cx="80" cy="93" rx="19" ry="11" fill="#bbf7d0" opacity=".7"/>
    ${both('<ellipse cx="54" cy="92" rx="6" ry="3.6" fill="#fb7185" opacity=".38"/>')}
    ${both('<circle cx="76.4" cy="86.4" r="1.1" fill="#14532d"/>')}
    ${open
        ? '<path d="M67 90Q80 108 93 90Z" fill="#7f1d1d" stroke="#450a0a" stroke-width="1" stroke-linejoin="round"/><path d="M73.6 99Q80 104 86.4 99Q80 96.4 73.6 99Z" fill="#fb7185"/>'
        : '<path d="M68 91Q80 100 92 91" fill="none" stroke="#14532d" stroke-width="2.2" stroke-linecap="round"/>'}
    ${shades()}`;

/** The bucket hat: it sits a little behind the head, so it swings after it. */
const hat = () => `<g class="hat">
    <path d="M56 44C56 28 66 20 80 20C94 20 104 28 104 44Z" fill="url(#hat)" stroke="#831843" stroke-width="1"/>
    <path d="M55.6 36Q80 41 104.4 36L104 44Q80 49 56 44Z" fill="#fdf2f8" stroke="#831843" stroke-width=".8"/>
    <path d="M38 50C48 42 62 44 80 44C98 44 112 42 122 50C120 57 102 58 80 58C58 58 40 57 38 50Z" fill="url(#hat)" stroke="#831843" stroke-width="1"/>
    <path d="M50 52Q80 56 110 52" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.4" stroke-linecap="round"/>
</g>`;

const headFront = (open) => `<g class="head"><path d="${HEAD}" fill="url(#skin)" stroke="${LINE}" stroke-width="1.1"/>${face(open)}${hat()}</g>`;
const headBack = () => `<g class="head"><path d="${HEAD}" fill="url(#skin)" stroke="${LINE}" stroke-width="1.1"/>
    <path d="M80 60V102M63 62C60 76 62 92 67 102M97 62C100 76 98 92 93 102" fill="none" stroke="#14532d" stroke-opacity=".28" stroke-width="1.3" stroke-linecap="round"/>
    ${hat()}</g>`;

// ---------- body ----------
const torso = () => `<path d="${TORSO}" fill="url(#limb)" stroke="${LINE}" stroke-width="1.1"/>`;

const plastron = () => `<path d="${PLASTRON}" fill="url(#belly)" stroke="#a16207" stroke-opacity=".6" stroke-width="1.2"/>
    <path d="M80 114V188M57 130Q80 137 103 130M53 150Q80 157 107 150M57 170Q80 177 103 170" fill="none" stroke="#b45309" stroke-opacity=".38" stroke-width="1.6" stroke-linecap="round"/>`;

/** The gold record on its chain: it swings. */
const chain = () => `<g class="chain"><path d="M60 104Q80 136 100 104" fill="none" stroke="url(#gold)" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="80" cy="124" r="7.4" fill="url(#gold)" stroke="#92400e" stroke-width="1"/><circle cx="80" cy="124" r="4.2" fill="none" stroke="#92400e" stroke-width=".9"/><circle cx="80" cy="124" r="1.6" fill="#92400e"/></g>`;

const arm = (side) => `<g class="arm${side}">
    <path d="${capsule([52, 114], [44, 142], 9.6, 8.4)}" fill="url(#limb)" stroke="${LINE}" stroke-width="1"/>
    <g class="fore${side}">
        <path d="${capsule([44, 140], [42, 163], 8.4, 7.6)}" fill="url(#limb)" stroke="${LINE}" stroke-width="1"/>
        <rect x="34.4" y="155" width="15.2" height="6.4" rx="3" fill="#ec4899" stroke="#831843" stroke-width=".8"/>
        <g class="hand${side}"><circle cx="42" cy="170" r="8.4" fill="url(#limb)" stroke="${LINE}" stroke-width="1"/><ellipse cx="48.6" cy="166.6" rx="3" ry="4.4" transform="rotate(-24 48.6 166.6)" fill="url(#limb)" stroke="${LINE}" stroke-opacity=".5" stroke-width=".8"/><path d="M38 174.6Q42 178 46 174.6" fill="none" stroke="#14532d" stroke-opacity=".5" stroke-width="1" stroke-linecap="round"/></g>
    </g>
</g>`;

const leg = (side) => `<g class="leg${side}">
    <path d="${capsule([66, 188], [66, 224], 10.4, 9.4)}" fill="url(#limb)" stroke="${LINE}" stroke-width="1"/>
    <path d="M52 236C52 228 58 223 67 223.6C76 224.2 83 228.6 83 234C83 238 81 240 77 240H56C54 240 52 238.6 52 236Z" fill="url(#shoe)" stroke="${LINE}" stroke-width="1"/>
    <path d="M52.4 236.6H82.6" stroke="#f9a8d4" stroke-width="2.8"/>
    <path d="M68 227Q76 227 82 233" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round"/>
    <path d="M62 227L68 226M63 230L69 229" stroke="#94a3b8" stroke-width="1.2" stroke-linecap="round"/>
</g>`;

/** A small tail: only the view from behind has it (it is behind the boombox from the front). */
const tail = () => `<g class="tail"><path d="M71 199Q80 223 89 199Z" fill="url(#limb)" stroke="${LINE}" stroke-width="1" stroke-linejoin="round"/></g>`;

// ---------- the boombox shell ----------
const cone = () => `<circle cx="30" cy="154" r="17.4" fill="url(#chrome)" stroke="${SHADE}" stroke-width="1.1"/>
    <circle cx="30" cy="154" r="14.6" fill="#050b16"/>
    <g class="woof"><circle cx="30" cy="154" r="13" fill="url(#cone)"/><circle cx="30" cy="154" r="8.4" fill="none" stroke="#64748b" stroke-width="1.4"/><circle cx="30" cy="154" r="4.8" fill="url(#dust)"/><circle class="led" cx="30" cy="154" r="4.8" fill="none" stroke="#fbcfe8" stroke-width="1" filter="url(#glow)"/></g>`;

const reel = (cx) => `<g class="reel"><circle cx="${cx}" cy="139" r="8" fill="none" stroke="#94a3b8" stroke-width="1.6"/><path d="M${cx} 131V147M${cx - 6.9} 135L${cx + 6.9} 143M${cx - 6.9} 143L${cx + 6.9} 135" stroke="#cbd5e1" stroke-width="1.3" stroke-linecap="round"/><circle cx="${cx}" cy="139" r="2" fill="#f472b6"/></g>`;

const eqBars = () => Array.from({ length: 7 }, (_, i) => `<rect class="bar" x="${(56.1 + i * 7.2).toFixed(1)}" y="170" width="4.6" height="22" rx="1.6" fill="url(#eq)" style="animation-delay:${[-0.1, -0.5, -0.25, -0.65, -0.35, -0.55, -0.05][i]}s"/>`).join('');

const box = () => `<g class="box">
    <path d="${BOX}" fill="url(#shell)" stroke="${LINE}" stroke-width="1.2"/>
    <path d="${BOX}" fill="url(#scutes)"/>
    <path d="M30 112H130" stroke="#fff" stroke-opacity=".14" stroke-width="2" stroke-linecap="round"/>
    ${cone()}${mirror(cone())}
    <rect x="52" y="120" width="56" height="38" rx="6" fill="#0b1220" stroke="url(#chrome)" stroke-width="2"/>
    <rect x="57" y="125" width="46" height="28" rx="4" fill="#111c2e"/>
    ${reel(68.4)}${reel(91.6)}
    <path d="M68.4 147Q80 152 91.6 147" fill="none" stroke="#475569" stroke-width="1.2"/>
    <path d="M60 126H73L62 152H57Z" fill="#fff" fill-opacity=".08"/>
    <rect x="52" y="164" width="56" height="32" rx="5" fill="#0b1220" stroke="url(#chrome)" stroke-width="1.6"/>
    ${eqBars()}
    ${both('<circle cx="62" cy="114" r="3" fill="url(#chrome)" stroke="#0f172a" stroke-width=".8"/>')}
    <circle class="led" cx="80" cy="114" r="2.2" fill="#f472b6" filter="url(#glow)"/>
</g>`;

const antenna = () => `<g class="antenna"><path d="M134 110L151 60" stroke="${SHADE}" stroke-width="5" stroke-linecap="round"/><path d="M134 110L151 60" stroke="url(#chrome)" stroke-width="3" stroke-linecap="round"/>
    <path d="M142 86L145 78" stroke="#475569" stroke-width="3" stroke-linecap="round"/><circle cx="151.5" cy="58.4" r="4.4" fill="url(#dust)" stroke="#831843" stroke-width=".9"/></g>`;

/** Two arcs ringing out of a woofer (drawn for the left one, mirrored for the right). */
const waves = () => `<g class="wv"><path d="M7 171A27 27 0 0 1 7 137" fill="none" stroke="#f472b6" stroke-width="2.4" stroke-linecap="round"/></g>
    <g class="wv" style="animation-delay:-.45s"><path d="M-1 176A36 36 0 0 1 -1 132" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round"/></g>`;

// ---------- paint ----------
const hex = (cx, cy) => `<path d="M${cx + 8} ${cy}L${cx + 4} ${cy + 6.93}L${cx - 4} ${cy + 6.93}L${cx - 8} ${cy}L${cx - 4} ${cy - 6.93}L${cx + 4} ${cy - 6.93}Z"/>`;

const defs = () => [
    rad('skin', [0.42, 0.32, 0.8], [[0, '#bbf7d0'], [0.45, '#4ade80'], [1, '#15803d']]),
    lin('limb', [0.1, 0, 0.9, 1], [[0, '#86efac'], [0.5, '#22c55e'], [1, '#15803d']]),
    lin('belly', [0, 0, 0, 1], [[0, '#fef9c3'], [1, '#fcd34d']]),
    lin('shell', [0, 0, 1, 1], [[0, '#4d7c0f'], [0.5, '#365314'], [1, '#1a2e05']]),
    `<pattern id="scutes" width="24" height="13.86" patternUnits="userSpaceOnUse"><g fill="none" stroke="#d9f99d" stroke-opacity=".28" stroke-width="1.1" stroke-linejoin="round">${[[0, 0], [24, 0], [0, 13.86], [24, 13.86], [12, 6.93]].map(([x, y]) => hex(x, y)).join('')}</g></pattern>`,
    lin('chrome', [0, 0, 0, 1], [[0, '#f1f5f9'], [0.5, '#94a3b8'], [1, '#475569']]),
    rad('cone', [0.4, 0.35, 0.7], [[0, '#334155'], [0.6, '#0f172a'], [1, '#020617']]),
    rad('dust', [0.4, 0.3, 0.7], [[0, '#fbcfe8'], [1, '#db2777']]),
    lin('eq', [0, 1, 0, 0], [[0, '#22d3ee'], [1, '#f472b6']]),
    lin('hat', [0, 0, 1, 1], [[0, '#f9a8d4'], [0.5, '#ec4899'], [1, '#be185d']]),
    lin('lens', [0, 0, 1, 1], [[0, '#67e8f9'], [0.5, '#0e7490'], [1, '#0c1c2c']]),
    lin('shoe', [0, 0, 0, 1], [[0, '#ffffff'], [1, '#e2e8f0']]),
    lin('gold', [0, 0, 1, 1], [[0, '#fde68a'], [0.5, '#f59e0b'], [1, '#b45309']]),
    `<filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
].join('');

const motion = (state) => {
    const joints = { arm: '52px 114px', fore: '44px 141px', hand: '42px 166px', leg: '66px 190px' };
    const base = origins({
        all: '80px 238px', head: '80px 100px', hat: '80px 46px', antenna: '134px 110px', chain: '80px 106px', wv: '30px 154px', tail: '80px 200px',
        ...Object.fromEntries(Object.entries(joints).flatMap(([part, o]) => [[`${part}L`, o], [`${part}R`, o]])),
    }, ['shadow', 'woof', 'reel', 'led']);
    const spin = { Standing: 4, Dancing: 1.2, DJing: 1 }[state];
    const bars = { Standing: 1.2, Dancing: 0.45, DJing: 0.4 }[state];
    const always = `
        .bar{transform-box:fill-box;transform-origin:50% 100%}
        ${kf('spin', { 0: 'transform:rotate(0)', 100: 'transform:rotate(360deg)' })}
        ${kf('eqbar', { 0: 'transform:scaleY(.22)', 50: 'transform:scaleY(1)', 100: 'transform:scaleY(.22)' })}
        ${kf('led', { 0: 'opacity:.45', 50: 'opacity:1', 100: 'opacity:.45' })}
        .reel{animation:spin ${spin}s linear infinite}
        ${play('.bar', 'eqbar', bars)}${play('.led', 'led', 1.2)}`;
    const rules = {
        Standing: `
            ${kf('breathe', { 0: 'transform:scale(1,1)', 50: 'transform:scale(1.012,.988)', 100: 'transform:scale(1,1)' })}
            ${kf('sway', { 0: 'transform:rotate(-2.5deg)', 50: 'transform:rotate(2.5deg)', 100: 'transform:rotate(-2.5deg)' })}
            ${kf('hatLag', { 0: 'transform:rotate(2deg)', 50: 'transform:rotate(-2deg)', 100: 'transform:rotate(2deg)' })}
            ${kf('rest', { 0: 'transform:rotate(4deg)', 50: 'transform:rotate(-2deg)', 100: 'transform:rotate(4deg)' })}
            ${kf('wave', { 0: 'transform:rotate(6deg)', 55: 'transform:rotate(6deg)', 62: 'transform:rotate(150deg)', 86: 'transform:rotate(150deg)', 94: 'transform:rotate(6deg)', 100: 'transform:rotate(6deg)' })}
            ${kf('waveFore', { 0: 'transform:rotate(0)', 55: 'transform:rotate(0)', 62: 'transform:rotate(-22deg)', 67: 'transform:rotate(20deg)', 72: 'transform:rotate(-22deg)', 77: 'transform:rotate(20deg)', 82: 'transform:rotate(-12deg)', 94: 'transform:rotate(0)', 100: 'transform:rotate(0)' })}
            ${kf('tap', { 0: 'transform:rotate(0)', 8: 'transform:rotate(-3deg)', 16: 'transform:rotate(0)', 100: 'transform:rotate(0)' })}
            ${kf('swing', { 0: 'transform:rotate(-4deg)', 50: 'transform:rotate(4deg)', 100: 'transform:rotate(-4deg)' })}
            ${kf('thump', { 0: 'transform:scale(1)', 50: 'transform:scale(1.05)', 100: 'transform:scale(1)' })}
            ${kf('wiggle', { 0: 'transform:rotate(-3deg)', 50: 'transform:rotate(4deg)', 100: 'transform:rotate(-3deg)' })}
            ${play('.all', 'breathe', 3.2)}${play('.head', 'sway', 4.4)}${play('.hat', 'hatLag', 4.4, '-.4s')}${play('.armL', 'rest', 3.2)}${play('.armR', 'wave', 5)}${play('.foreR', 'waveFore', 5)}
            ${play('.legR', 'tap', 2.6)}${play('.chain', 'swing', 4.4)}${play('.woof', 'thump', 1.2)}${play('.antenna', 'wiggle', 2.4)}
            ${pose('.armL', 'rotate(4deg)')}${pose('.armR', 'rotate(150deg)')}${pose('.foreR', 'rotate(-12deg)')}`,
        Dancing: `
            ${kf('hop', { 0: 'transform:translateY(0) scale(1.04,.96)', 45: 'transform:translateY(-11px) scale(.98,1.03)', 100: 'transform:translateY(0) scale(1.04,.96)' })}
            ${kf('bob', { 0: 'transform:rotate(-7deg)', 50: 'transform:rotate(7deg) translateY(2px)', 100: 'transform:rotate(-7deg)' })}
            ${kf('hatLag', { 0: 'transform:rotate(5deg) translateY(-1px)', 50: 'transform:rotate(-5deg)', 100: 'transform:rotate(5deg) translateY(-1px)' })}
            ${kf('swing', { 0: 'transform:rotate(26deg)', 50: 'transform:rotate(100deg)', 100: 'transform:rotate(26deg)' })}
            ${kf('swingFore', { 0: 'transform:rotate(36deg)', 50: 'transform:rotate(66deg)', 100: 'transform:rotate(36deg)' })}
            ${kf('step', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-6px)', 100: 'transform:translateY(0)' })}
            ${kf('swingChain', { 0: 'transform:rotate(-14deg)', 50: 'transform:rotate(14deg)', 100: 'transform:rotate(-14deg)' })}
            ${kf('bass', { 0: 'transform:scale(1)', 35: 'transform:scale(1.16)', 100: 'transform:scale(1)' })}
            ${kf('whip', { 0: 'transform:rotate(-9deg)', 50: 'transform:rotate(11deg)', 100: 'transform:rotate(-9deg)' })}
            ${kf('ping', { 0: 'transform:scale(.82);opacity:0', 25: 'opacity:.9', 100: 'transform:scale(1.18);opacity:0' })}
            ${kf('shadowHop', { 0: 'transform:scale(1.04)', 45: 'transform:scale(.84)', 100: 'transform:scale(1.04)' })}
            ${play('.all', 'hop', 0.6)}${play('.head', 'bob', 1.2, '-1.1s')}${play('.hat', 'hatLag', 1.2, '-.9s')}
            ${play('.armL', 'swing', 1.2)}${play('.foreL', 'swingFore', 1.2, '-1.1s')}${play('.armR', 'swing', 1.2, '-.6s')}${play('.foreR', 'swingFore', 1.2, '-.5s')}
            ${play('.legL', 'step', 0.6)}${play('.legR', 'step', 0.6, '-.3s')}${play('.chain', 'swingChain', 0.6)}${play('.woof', 'bass', 0.3)}${play('.antenna', 'whip', 0.3)}${play('.wv', 'ping', 0.9)}${play('.shadow', 'shadowHop', 0.6)}
            ${pose('.armL', 'rotate(96deg)')}${pose('.foreL', 'rotate(60deg)')}${pose('.armR', 'rotate(30deg)')}${pose('.foreR', 'rotate(40deg)')}${pose('.head', 'rotate(-5deg)')}${pose('.legL', 'translateY(-5px)')}`,
        DJing: `
            ${kf('jump', { 0: 'transform:translateY(0) scale(1.04,.96)', 40: 'transform:translateY(-10px) scale(.98,1.03)', 80: 'transform:translateY(0) scale(1.04,.96)', 100: 'transform:translateY(0) scale(1.04,.96)' })}
            ${kf('nod', { 0: 'transform:rotate(-4deg)', 40: 'transform:rotate(4deg) translateY(2px)', 100: 'transform:rotate(-4deg)' })}
            ${kf('hatLag', { 0: 'transform:rotate(4deg)', 50: 'transform:rotate(-4deg)', 100: 'transform:rotate(4deg)' })}
            ${kf('pump', { 0: 'transform:rotate(140deg)', 40: 'transform:rotate(164deg)', 100: 'transform:rotate(140deg)' })}
            ${kf('pumpFore', { 0: 'transform:rotate(30deg)', 40: 'transform:rotate(6deg)', 100: 'transform:rotate(30deg)' })}
            ${kf('scratch', { 0: 'transform:rotate(14deg)', 50: 'transform:rotate(30deg)', 100: 'transform:rotate(14deg)' })}
            ${kf('scratchFore', { 0: 'transform:rotate(18deg)', 50: 'transform:rotate(42deg)', 100: 'transform:rotate(18deg)' })}
            ${kf('kick', { 0: 'transform:translateY(0)', 40: 'transform:translateY(-6px)', 80: 'transform:translateY(0)', 100: 'transform:translateY(0)' })}
            ${kf('bass', { 0: 'transform:scale(1)', 35: 'transform:scale(1.16)', 100: 'transform:scale(1)' })}
            ${kf('whip', { 0: 'transform:rotate(-9deg)', 50: 'transform:rotate(11deg)', 100: 'transform:rotate(-9deg)' })}
            ${kf('tailWag', { 0: 'transform:rotate(-12deg)', 50: 'transform:rotate(12deg)', 100: 'transform:rotate(-12deg)' })}
            ${kf('ping', { 0: 'transform:scale(.82);opacity:0', 25: 'opacity:.9', 100: 'transform:scale(1.18);opacity:0' })}
            ${kf('shadowJump', { 0: 'transform:scale(1.04)', 40: 'transform:scale(.8)', 80: 'transform:scale(1.04)', 100: 'transform:scale(1.04)' })}
            ${play('.all', 'jump', 0.6)}${play('.head', 'nod', 0.6, '-.54s')}${play('.hat', 'hatLag', 0.6, '-.4s')}
            ${play('.armR', 'pump', 0.6)}${play('.foreR', 'pumpFore', 0.6, '-.52s')}${play('.armL', 'scratch', 0.3)}${play('.foreL', 'scratchFore', 0.3, '-.1s')}
            ${play('.legL', 'kick', 0.6)}${play('.legR', 'kick', 0.6, '-.3s')}${play('.woof', 'bass', 0.3)}${play('.antenna', 'whip', 0.3)}${play('.tail', 'tailWag', 0.4)}${play('.wv', 'ping', 0.9)}${play('.shadow', 'shadowJump', 0.6)}
            ${pose('.armR', 'rotate(148deg)')}${pose('.foreR', 'rotate(18deg)')}${pose('.armL', 'rotate(20deg)')}${pose('.foreL', 'rotate(24deg)')}${pose('.head', 'rotate(-3deg)')}`,
    };

    return base + always + rules[state];
};

export function boomer(state) {
    const back = state === 'DJing';
    const legs = `${leg('L')}${mirror(leg('R'))}`;
    const arms = `${arm('L')}${mirror(arm('R'))}`;
    const sound = state === 'Standing' ? '' : `${waves()}${mirror(waves())}`;
    const turtle = back
        ? `${legs}${torso()}${box()}${antenna()}${tail()}${sound}${arms}${headBack()}`
        : `${antenna()}${box()}${sound}${legs}${torso()}${plastron()}${chain()}${arms}${headFront(state === 'Dancing')}`;

    return picture({
        label: 'Boomer',
        state,
        defs: defs(),
        body: `${shadow()}<g class="all">${turtle}</g>`,
        css: motion(state),
    });
}
