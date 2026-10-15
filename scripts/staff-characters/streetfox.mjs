// Fox: a sly street fox. Orange fur with a cream muzzle and cheek tufts, big black-tipped ears, amber eyes and a crooked smirk, a gold hoop in one
// ear; an olive bomber jacket with an orange lining, a red bandana, a white tee with a paw print, black joggers with a white stripe and orange
// high-tops, and a big brush of a tail with a white tip. Standing, he winks and his ears twitch while the tail sways; dancing, he swings his arms
// and the tail wags fast while sparks fly; at the decks (seen from behind, a fox head on the back of the jacket) he pumps a fist and scratches.
// For the Owner only. (He is not Zoo S02, the Owner's mascot fox, nor Foxy, the starter kid with fox ears.)
import { kf, lin, mirror, origins, picture, play, pose, rad, shadow } from './kit.mjs';
import { capsule } from './shapes.mjs';

const INK = '#2a1a10';
const OLIVE = '#2f4419';
const both = (part) => part + mirror(part);

// ---------- head ----------
const HEAD = 'M46 62C46 40 61 28 80 28C99 28 114 40 114 62C114 70 112 76 108 81C102 90 92 95 80 95C68 95 58 90 52 81C48 76 46 70 46 62Z';
const TUFT = '<path d="M49 64L37 70L46 73L38 79L51 80Z" fill="url(#fur)" stroke="#7c2d12" stroke-width="1" stroke-linejoin="round"/>';
const EAR = (inner) => `<path d="M51 44C47 32 44 20 44 10C54 16 64 24 70 32Z" fill="url(#fur)" stroke="#7c2d12" stroke-width="1" stroke-linejoin="round"/>
    <path d="M44 10C45 15 46 19 47.6 22.6L53.6 18.4C50.6 15 47.4 12.4 44 10Z" fill="#292524"/>
    ${inner ? '<path d="M53 40C51 32 49.6 25 49.6 19C55 23 60 27 64 32Z" fill="#fde7d4"/><path d="M52.6 37C51.4 31 50.6 26 51 22" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.2" stroke-linecap="round"/>' : ''}`;

const eye = (cls) => `<g class="${cls}">
    <ellipse cx="66.6" cy="62.6" rx="5.8" ry="6.2" fill="#fff"/>
    <ellipse cx="67" cy="63.2" rx="4.4" ry="5" fill="url(#iris)"/>
    <ellipse cx="67.2" cy="63.4" rx="1.3" ry="3.6" fill="#1c1209"/>
    <circle cx="68.8" cy="60.8" r="1.5" fill="#fff"/>
    <path d="M60.4 59.6C63 56.2 70.6 55.8 73.4 58.4L72.6 61C69.6 58.8 64 59 61 61.6Z" fill="url(#fur)"/>
    <path d="M60.6 60.4C63.4 57.4 70.4 57 73.4 59.2" fill="none" stroke="${INK}" stroke-width="1.9" stroke-linecap="round"/>
</g>`;

const face = (happy) => `
    ${happy
        ? both(`<path d="M61 64C63.4 59.4 70.6 59.4 73 64" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`)
        : `${eye('blink')}${mirror(eye('wink'))}`}
    ${both('<path d="M61 52.6C64 50.8 69 50.6 72 52" fill="none" stroke="#fde7d4" stroke-width="2.2" stroke-linecap="round"/>')}
    <path d="M58 74C62 84 70 92 80 92C90 92 98 84 102 74C96 79 88 80 80 76C72 80 64 79 58 74Z" fill="url(#cream)"/>
    ${both('<path d="M50 70C54 78 60 82 66 82C60 78 56 74 54 68Z" fill="url(#cream)"/>')}
    <path d="M75.6 71.6C75.6 69.4 84.4 69.4 84.4 71.6C84.4 74 81.4 76 80 76C78.6 76 75.6 74 75.6 71.6Z" fill="#1c1917"/><ellipse cx="78.4" cy="71" rx="1.6" ry=".8" fill="#fff" fill-opacity=".7"/>
    ${happy
        ? '<path d="M71 78C73 88 87 88 89 78C86 81 74 81 71 78Z" fill="#7a1f12" stroke="#4a1208" stroke-width="1"/><path d="M75.4 84.4C77.6 82.8 82.4 82.8 84.6 84.4C82.6 86.2 77.4 86.2 75.4 84.4Z" fill="#f47272"/>'
        : '<path d="M80 76V78.4M80 78.4C78 80.6 75.4 80.6 74 79M80 78.4C83 82 87.6 81.4 89.4 77.6" fill="none" stroke="#1c1917" stroke-width="1.6" stroke-linecap="round"/>'}
    ${both('<g fill="#7c2d12" opacity=".55"><circle cx="70" cy="80.4" r=".7"/><circle cx="67.6" cy="78.6" r=".7"/></g>')}`;

/** A gold hoop in his left ear (on the right of the picture). */
const hoop = '<ellipse cx="111.4" cy="76" rx="3.2" ry="4" fill="none" stroke="#fbbf24" stroke-width="1.6"/><circle cx="110" cy="72.6" r=".8" fill="#fff7d6"/>';

const headPhones = () => `<path d="M47 58C45 34 60 22 80 22C100 22 115 34 113 58" fill="none" stroke="#1f2937" stroke-width="5.4" stroke-linecap="round"/>
    <path d="M50 50C50 34 62 26 80 26C98 26 110 34 110 50" fill="none" stroke="#fb923c" stroke-opacity=".8" stroke-width="1.4" stroke-linecap="round"/>
    ${both(`<g transform="translate(46.4 64)"><ellipse rx="7" ry="10.4" fill="url(#cup)" stroke="${INK}" stroke-width=".9"/><ellipse cx="-.8" rx="4.2" ry="7" fill="#111827"/><ellipse class="led" cx="-.8" rx="4.2" ry="7" fill="none" stroke="#fdba74" stroke-width="1.3" filter="url(#glow)"/></g>`)}`;

const head = (back, happy) => `<g class="head">
    <g class="earL">${EAR(!back)}</g>${mirror(`<g class="earR">${EAR(!back)}</g>`)}
    ${both(TUFT)}
    <path d="${HEAD}" fill="url(#fur)" stroke="#7c2d12" stroke-width="1"/>
    ${back
        ? `<path d="M80 30C76 46 84 62 80 92M62 36C58 52 62 72 60 88M98 36C102 52 98 72 100 88" fill="none" stroke="#fdba74" stroke-opacity=".5" stroke-width="1.4" stroke-linecap="round"/>${headPhones()}`
        : `<path d="M70 30C72 22 78 18 84 20C82 23 82 26 84 28C80 26 76 28 74 32Z" fill="url(#fur)" stroke="#7c2d12" stroke-width=".8"/>${face(happy)}${hoop}`}
</g>`;

// ---------- body ----------
const NECK = 'M70 86H90V104C86 107 74 107 70 104Z';
const JACKET = 'M56 100C64 96 96 96 104 100C116 104 121 116 121 132L122 182C110 189 50 189 38 182L39 132C39 116 44 104 56 100Z';
const ribs = (d, width) => `<path d="${d}" fill="none" stroke="${OLIVE}" stroke-width="${width}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fb923c" stroke-width="1.4" stroke-linecap="round" transform="translate(0 -1.4)"/>`;

const body = (back) => `<g class="body">
    <path d="${JACKET}" fill="url(#jacket)" stroke="${INK}" stroke-width="1.1"/>
    ${back
        ? `<path d="M80 102V182" stroke="${OLIVE}" stroke-opacity=".4" stroke-width="1.4"/>
           <g transform="translate(80 150)"><path d="M-14 -10L-11 -24L-4 -14H4L11 -24L14 -10L0 10Z" fill="#f97316" stroke="${OLIVE}" stroke-width="1.6" stroke-linejoin="round"/><path d="M-11 -24L-9 -16L-6 -18ZM11 -24L9 -16L6 -18Z" fill="#292524"/><path d="M-14 -10L0 10L-5 -4ZM14 -10L0 10L5 -4Z" fill="#fff7ed"/><circle cx="-5" cy="-8" r="1.4" fill="#292524"/><circle cx="5" cy="-8" r="1.4" fill="#292524"/><path d="M-1.6 2H1.6L0 4.6Z" fill="#292524"/></g>
           ${ribs('M58 101C64 97 96 97 102 101', 6)}`
        : `<path d="M69 100C74 104 86 104 91 100L93 184C86 187 74 187 67 184Z" fill="url(#tee)" stroke="${INK}" stroke-width=".9"/>
           <g fill="#f97316" opacity=".9"><ellipse cx="80" cy="146" rx="4.6" ry="4"/><circle cx="74.8" cy="139.6" r="1.8"/><circle cx="78.2" cy="137.2" r="1.8"/><circle cx="81.8" cy="137.2" r="1.8"/><circle cx="85.2" cy="139.6" r="1.8"/></g>
           <path d="M69.6 101L67.6 184M90.4 101L92.4 184" stroke="#fb923c" stroke-width="3"/>
           <path d="M68 101L66 184M92 101L94 184" stroke="${OLIVE}" stroke-width="1.2"/>
           ${both('<path d="M42 140H56V152H42Z" fill="none" stroke="#2f4419" stroke-opacity=".55" stroke-width="1.2" stroke-linejoin="round"/><path d="M42 140H56" stroke="#2f4419" stroke-opacity=".7" stroke-width="2"/>')}
           ${ribs('M58 101C64 94 96 94 102 101', 6.4)}
           <path d="M64 100C70 105 90 105 96 100L80 119Z" fill="url(#bandana)" stroke="#7f1d1d" stroke-width=".9" stroke-linejoin="round"/>
           <g fill="#fff" opacity=".85"><circle cx="72" cy="104" r=".9"/><circle cx="80" cy="106" r=".9"/><circle cx="88" cy="104" r=".9"/><circle cx="76" cy="110" r=".9"/><circle cx="84" cy="110" r=".9"/><circle cx="80" cy="114.6" r=".9"/></g>`}
    ${ribs('M39 181C52 188.6 108 188.6 121 181', 7)}
    <path d="M45 122C43.6 142 43 160 43.6 176" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2.4" stroke-linecap="round"/>
</g>`;

const arm = (side) => `<g class="arm${side}">
    <path d="${capsule([52, 108], [43, 137], 9, 8)}" fill="url(#jacket)" stroke="${INK}" stroke-width="1"/>
    <g class="fore${side}">
        <path d="${capsule([43, 135], [43, 156], 8, 7.4)}" fill="url(#jacket)" stroke="${INK}" stroke-width="1"/>
        <path d="M35.4 157.2H50.6" stroke="${OLIVE}" stroke-width="4" stroke-linecap="round"/><path d="M35.8 155.8H50.2" stroke="#fb923c" stroke-width="1" stroke-linecap="round"/>
        <g class="hand${side}"><circle cx="43" cy="164.4" r="6.2" fill="url(#paw)" stroke="#120a05" stroke-width="1"/><ellipse cx="41" cy="162" rx="2" ry="1.2" fill="#fff" fill-opacity=".25"/></g>
    </g>
</g>`;

const leg = (side) => `<g class="leg${side}">
    <path d="${capsule([66, 184], [66, 220], 7.4, 6.6)}" fill="url(#jogger)" stroke="${INK}" stroke-width="1"/>
    <path d="M59.2 188L59.6 216" stroke="#f8fafc" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M59.6 217.6H72.4" stroke="#18181b" stroke-width="4.6" stroke-linecap="round"/>
    <path d="M54 235C54 226 59 220 67 220.6C75 221.2 80 226 81 233C81.6 238 79 240 75 240H57C55 240 54 238.6 54 235Z" fill="url(#shoe)" stroke="${INK}" stroke-width="1"/>
    <path d="M54.4 236.6H80.8" stroke="#fff7ed" stroke-width="2.8"/>
    <circle cx="61.4" cy="228" r="2.4" fill="#fff7ed" stroke="#9a3412" stroke-width=".8"/>
    <path d="M65 224.4L69.4 223.8M65.6 227L70 226.4M66.4 229.6L70.8 229" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>
</g>`;

/** The tail: out from behind his right hip (from behind, it hangs in front of the jacket). */
const tail = () => `<g class="tail">
    <path d="M98 176C112 188 138 184 150 164C160 146 158 124 146 108C146 126 140 142 126 150C116 156 106 160 98 164Z" fill="url(#fur)" stroke="#7c2d12" stroke-width="1.1" stroke-linejoin="round"/>
    <path d="M146 108C160 124 162 146 152 162C150 150 146 140 141 132C145 124 147 116 146 108Z" fill="url(#cream)" stroke="#7c2d12" stroke-width="1" stroke-linejoin="round"/>
    <path d="M108 172C122 176 138 170 146 156" fill="none" stroke="#fdba74" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>
    <path d="M112 166C124 166 134 158 138 148" fill="none" stroke="#9a3412" stroke-opacity=".35" stroke-width="1.4" stroke-linecap="round"/>
</g>`;

/** Sparks that fly while he dances. */
const sparks = () => [[30, 118, 1, 0], [128, 92, 0.85, -0.6], [34, 82, 0.7, -1.2]].map(([x, y, s, d]) => `<g class="spark" style="animation-delay:${d}s"><path transform="translate(${x} ${y}) scale(${s})" d="M0 -7L1.8 -1.8L7 0L1.8 1.8L0 7L-1.8 1.8L-7 0L-1.8 -1.8Z" fill="#fdba74" stroke="#ea580c" stroke-width=".8" stroke-linejoin="round"/></g>`).join('');

const defs = () => [
    rad('fur', [0.42, 0.32, 0.8], [[0, '#fdba74'], [0.5, '#f97316'], [1, '#c2410c']]),
    lin('cream', [0, 0, 0, 1], [[0, '#fffbf5'], [1, '#fde7d4']]),
    rad('iris', [0.45, 0.3, 0.75], [[0, '#fef3c7'], [0.5, '#f59e0b'], [1, '#92400e']]),
    lin('jacket', [0.1, 0, 0.9, 1], [[0, '#a3b86c'], [0.5, '#6b8a3a'], [1, '#3f5a1f']]),
    lin('tee', [0, 0, 0, 1], [[0, '#ffffff'], [1, '#ece8e1']]),
    lin('bandana', [0, 0, 1, 1], [[0, '#f87171'], [1, '#b91c1c']]),
    rad('paw', [0.4, 0.35, 0.7], [[0, '#57382a'], [1, '#1c120c']]),
    lin('jogger', [0, 0, 1, 0], [[0, '#3f3f46'], [0.5, '#27272a'], [1, '#09090b']]),
    lin('shoe', [0, 0, 0, 1], [[0, '#fdba74'], [0.6, '#f97316'], [1, '#c2410c']]),
    lin('cup', [0, 0, 1, 1], [[0, '#4b5563'], [0.5, '#1f2937'], [1, '#030712']]),
    `<filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
].join('');

const motion = (state) => {
    const joints = { arm: '52px 108px', fore: '43px 136px', hand: '43px 162px', leg: '66px 186px', ear: '60px 38px' };
    const base = origins({
        all: '80px 238px', head: '80px 98px', body: '80px 188px', tail: '100px 168px',
        ...Object.fromEntries(Object.entries(joints).flatMap(([part, o]) => [[`${part}L`, o], [`${part}R`, o]])),
    }, ['shadow', 'blink', 'wink', 'spark', 'led']);
    const always = `
        ${kf('blink', { 0: 'transform:scaleY(1)', 92: 'transform:scaleY(1)', 95: 'transform:scaleY(.1)', 98: 'transform:scaleY(1)', 100: 'transform:scaleY(1)' })}
        ${kf('wink', { 0: 'transform:scaleY(1)', 40: 'transform:scaleY(1)', 44: 'transform:scaleY(.1)', 56: 'transform:scaleY(.1)', 60: 'transform:scaleY(1)', 92: 'transform:scaleY(1)', 95: 'transform:scaleY(.1)', 98: 'transform:scaleY(1)', 100: 'transform:scaleY(1)' })}
        ${kf('led', { 0: 'opacity:.45', 50: 'opacity:1', 100: 'opacity:.45' })}
        ${play('.blink', 'blink', 4.2)}${play('.wink', 'wink', 4.2)}${play('.led', 'led', 1.2)}`;
    const rules = {
        Standing: `
            ${kf('breathe', { 0: 'transform:scale(1,1)', 50: 'transform:scale(1.012,.988)', 100: 'transform:scale(1,1)' })}
            ${kf('tilt', { 0: 'transform:rotate(-3deg)', 50: 'transform:rotate(2deg)', 100: 'transform:rotate(-3deg)' })}
            ${kf('sway', { 0: 'transform:rotate(-6deg)', 50: 'transform:rotate(8deg)', 100: 'transform:rotate(-6deg)' })}
            ${kf('twitch', { 0: 'transform:rotate(0)', 70: 'transform:rotate(0)', 73: 'transform:rotate(-12deg)', 76: 'transform:rotate(0)', 79: 'transform:rotate(-8deg)', 82: 'transform:rotate(0)', 100: 'transform:rotate(0)' })}
            ${kf('rest', { 0: 'transform:rotate(4deg)', 50: 'transform:rotate(1deg)', 100: 'transform:rotate(4deg)' })}
            ${play('.body', 'breathe', 3.2)}${play('.head', 'tilt', 4.2)}${play('.tail', 'sway', 2.6)}${play('.earL', 'twitch', 4.2)}
            ${play('.armL', 'rest', 3.2)}${play('.armR', 'rest', 3.2, '-1.6s')}
            ${pose('.head', 'rotate(-3deg)')}${pose('.tail', 'rotate(4deg)')}`,
        Dancing: `
            ${kf('hop', { 0: 'transform:translateY(0) scale(1.04,.96)', 45: 'transform:translateY(-11px) scale(.98,1.03)', 100: 'transform:translateY(0) scale(1.04,.96)' })}
            ${kf('bob', { 0: 'transform:rotate(-7deg)', 50: 'transform:rotate(7deg) translateY(2px)', 100: 'transform:rotate(-7deg)' })}
            ${kf('wag', { 0: 'transform:rotate(-14deg)', 50: 'transform:rotate(16deg)', 100: 'transform:rotate(-14deg)' })}
            ${kf('flop', { 0: 'transform:rotate(-6deg)', 50: 'transform:rotate(8deg)', 100: 'transform:rotate(-6deg)' })}
            ${kf('swing', { 0: 'transform:rotate(30deg)', 50: 'transform:rotate(96deg)', 100: 'transform:rotate(30deg)' })}
            ${kf('swingFore', { 0: 'transform:rotate(40deg)', 50: 'transform:rotate(70deg)', 100: 'transform:rotate(40deg)' })}
            ${kf('step', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-6px)', 100: 'transform:translateY(0)' })}
            ${kf('spark', { 0: 'transform:scale(.3) rotate(0);opacity:0', 30: 'opacity:1', 100: 'transform:scale(1.1) rotate(90deg) translateY(-14px);opacity:0' })}
            ${kf('shadowHop', { 0: 'transform:scale(1.04)', 45: 'transform:scale(.84)', 100: 'transform:scale(1.04)' })}
            ${play('.all', 'hop', 0.6)}${play('.head', 'bob', 1.2, '-1.1s')}${play('.tail', 'wag', 0.3)}${play('.earL', 'flop', 0.6, '-.5s')}${play('.earR', 'flop', 0.6, '-.2s')}
            ${play('.armL', 'swing', 0.6)}${play('.foreL', 'swingFore', 0.6, '-.55s')}${play('.armR', 'swing', 0.6, '-.3s')}${play('.foreR', 'swingFore', 0.6, '-.25s')}
            ${play('.legL', 'step', 0.6)}${play('.legR', 'step', 0.6, '-.3s')}${play('.spark', 'spark', 1.6)}${play('.shadow', 'shadowHop', 0.6)}
            ${pose('.armL', 'rotate(92deg)')}${pose('.foreL', 'rotate(66deg)')}${pose('.armR', 'rotate(34deg)')}${pose('.foreR', 'rotate(44deg)')}
            ${pose('.head', 'rotate(-5deg)')}${pose('.tail', 'rotate(14deg)')}${pose('.legL', 'translateY(-5px)')}`,
        DJing: `
            ${kf('jump', { 0: 'transform:translateY(0) scale(1.04,.96)', 40: 'transform:translateY(-10px) scale(.98,1.03)', 80: 'transform:translateY(0) scale(1.04,.96)', 100: 'transform:translateY(0) scale(1.04,.96)' })}
            ${kf('nodBack', { 0: 'transform:rotate(-4deg)', 40: 'transform:rotate(4deg) translateY(2.4px)', 100: 'transform:rotate(-4deg)' })}
            ${kf('wag', { 0: 'transform:rotate(-12deg)', 50: 'transform:rotate(14deg)', 100: 'transform:rotate(-12deg)' })}
            ${kf('pump', { 0: 'transform:rotate(140deg)', 40: 'transform:rotate(164deg)', 100: 'transform:rotate(140deg)' })}
            ${kf('pumpFore', { 0: 'transform:rotate(30deg)', 40: 'transform:rotate(6deg)', 100: 'transform:rotate(30deg)' })}
            ${kf('scratch', { 0: 'transform:rotate(16deg)', 50: 'transform:rotate(32deg)', 100: 'transform:rotate(16deg)' })}
            ${kf('kick', { 0: 'transform:translateY(0)', 40: 'transform:translateY(-6px)', 80: 'transform:translateY(0)', 100: 'transform:translateY(0)' })}
            ${kf('shadowJump', { 0: 'transform:scale(1.04)', 40: 'transform:scale(.8)', 80: 'transform:scale(1.04)', 100: 'transform:scale(1.04)' })}
            ${play('.all', 'jump', 0.6)}${play('.head', 'nodBack', 0.6, '-.54s')}${play('.tail', 'wag', 0.4)}
            ${play('.armL', 'pump', 0.6)}${play('.foreL', 'pumpFore', 0.6, '-.52s')}${play('.foreR', 'scratch', 0.3)}
            ${play('.legL', 'kick', 0.6)}${play('.legR', 'kick', 0.6, '-.3s')}${play('.shadow', 'shadowJump', 0.6)}
            ${pose('.armL', 'rotate(150deg)')}${pose('.foreL', 'rotate(18deg)')}${pose('.armR', 'rotate(14deg)')}${pose('.foreR', 'rotate(24deg)')}${pose('.head', 'rotate(-3deg)')}${pose('.tail', 'rotate(10deg)')}`,
    };

    return base + always + rules[state];
};

export function streetFox(state) {
    const back = state === 'DJing';
    const dancing = state === 'Dancing';
    const neck = `<path d="${NECK}" fill="url(#fur)"/><path d="M70 92C76 97 84 97 90 92V96C84 100 76 100 70 96Z" fill="#000" fill-opacity=".12"/>`;
    const fox = back
        ? `${leg('L')}${mirror(leg('R'))}${mirror(arm('R'))}${neck}${body(true)}${tail()}${head(true, false)}${arm('L')}`
        : `${tail()}${leg('L')}${mirror(leg('R'))}${neck}${body(false)}${arm('L')}${mirror(arm('R'))}${head(false, dancing)}`;

    return picture({
        label: 'Fox',
        state,
        defs: defs(),
        body: `${shadow()}<g class="all">${fox}</g>${dancing ? sparks() : ''}`,
        css: motion(state),
    });
}
