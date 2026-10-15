// Wilmer (Vilmar in Estonian): a friend of the site. Honey-blond messy hair with a big quiff, freckles, teal-green eyes and a wide grin; a teal varsity
// jacket with cream sleeves, striped cuffs, collar and hem and a big W on the chest, a white tee with a little record on it, rolled light jeans and
// white sneakers. His headphones hang round his neck, and go on his head at the decks, where the back of the jacket says WILMER. Standing, he waves
// hello; dancing, he pumps his fists in turn while notes rise around him; at the decks he pumps a fist and scratches. Everybody can wear him from level 4.
import { kf, lin, mirror, origins, picture, play, pose, rad, shadow } from './kit.mjs';
import { capsule } from './shapes.mjs';

const INK = '#1e293b';
const NAVY = '#0f2b45';
const both = (part) => part + mirror(part);

// ---------- head ----------
const HAIR_BACK = 'M45 66C41 40 57 20 80 20C103 20 119 40 115 66L113 76C109 66 106 58 100 54H60C54 58 51 66 47 76Z';
const FACE = 'M48.6 61C48.6 40 62 29 80 29C98 29 111.4 40 111.4 61C111.4 82 99 95 80 95C61 95 48.6 82 48.6 61Z';
const FRINGE = 'M46.6 60C44.6 38 60 22 82 22C104 22 118 36 114.6 60C112 50 107 44 100 42C101 48 99 52 95.6 54C93 46 87 42 79 42C81 48 79 52 75 54C71.6 47 65 44.6 58.4 46C57 51 53 55.6 46.6 60Z';
const QUIFF = 'M50 36C48 18 62 6 80 6C96 6 110 12 117 22C109 20 101 20 95 23C99 26 99 31 96 34C89 26 77 23 67 28C61 30 55 33 50 36Z';
const HEAD_BACK = 'M47 62C45 39 60 22 80 22C100 22 115 39 113 62C113 84 101 97 80 97C59 97 47 84 47 62Z';
const EAR = '<ellipse cx="47.6" cy="66" rx="5.2" ry="7.6" fill="url(#skin)" stroke="#d9987a" stroke-width="1"/><path d="M46.4 61.6C44.6 64 44.8 68.4 46.8 70.6" fill="none" stroke="#d9987a" stroke-width="1.1" stroke-linecap="round"/>';

const eye = () => `<g class="blink">
    <ellipse cx="67.4" cy="64.6" rx="5.8" ry="6.8" fill="#fff"/>
    <ellipse cx="67.8" cy="65.4" rx="4.4" ry="5.6" fill="url(#iris)"/>
    <circle cx="68" cy="65.8" r="2.4" fill="#0b2e2b"/>
    <circle cx="69.6" cy="62.8" r="1.8" fill="#fff"/><circle cx="66.2" cy="68.4" r=".8" fill="#fff"/>
    <path d="M61 61C63.6 58.2 71 57.8 74.4 60.6" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
</g>`;

const face = (happy) => `
    ${happy ? both(`<path d="M61.6 66C64 61 71.4 61 73.8 66" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`) : both(eye())}
    ${both('<path d="M60.4 55.2C63.6 51.8 70.4 51 74.6 53.2" fill="none" stroke="#a0631f" stroke-width="2.8" stroke-linecap="round"/>')}
    ${both('<ellipse cx="60" cy="78" rx="5" ry="2.8" fill="#ff9a85" opacity=".45"/>')}
    ${both('<g fill="#d08b5b" opacity=".75"><circle cx="63" cy="75.6" r=".95"/><circle cx="66.4" cy="77.4" r=".85"/><circle cx="69.6" cy="75.4" r=".9"/><circle cx="72.6" cy="77" r=".8"/><circle cx="76.6" cy="71.6" r=".7"/></g>')}
    <path d="M78.4 71.4C79.2 73.4 80.8 73.4 81.6 71.4" fill="none" stroke="#c98468" stroke-width="1.4" stroke-linecap="round"/>
    ${happy
        ? '<path d="M69 78.6C71 92.4 89 92.4 91 78.6Z" fill="#7a2e1e" stroke="#4a1a10" stroke-width="1.1" stroke-linejoin="round"/><path d="M70.4 79.4C75 81.6 85 81.6 89.6 79.4C89.2 81.8 70.8 81.8 70.4 79.4Z" fill="#fff"/><path d="M74.4 87.4C77.4 85.2 82.6 85.2 85.6 87.4C83.4 89.6 76.6 89.6 74.4 87.4Z" fill="#f07a7a"/>'
        : '<path d="M70.4 79.4C72.6 88.6 87.4 88.6 89.6 79.4Z" fill="#7a2e1e" stroke="#4a1a10" stroke-width="1.1" stroke-linejoin="round"/><path d="M71.6 80.2C76 82.2 84 82.2 88.4 80.2C88 82.2 72 82.2 71.6 80.2Z" fill="#fff"/><path d="M75 85.4C77.6 84 82.4 84 85 85.4C83 86.8 77 86.8 75 85.4Z" fill="#f07a7a"/>'}`;

/** The quiff: the big swoop of hair on top that bounces. */
const quiff = () => `<g class="quiff"><path d="${QUIFF}" fill="url(#hair)" stroke="#8a4f17" stroke-width="1" stroke-linejoin="round"/><path d="M58 22C66 12 82 9 98 13M66 28C74 22 86 21 94 24" fill="none" stroke="#fff7d6" stroke-opacity=".8" stroke-width="1.8" stroke-linecap="round"/><path d="M104 17C108 18 112 19.4 115 21" fill="none" stroke="#8a4f17" stroke-opacity=".5" stroke-width="1.2" stroke-linecap="round"/></g>`;

/** Dark headphones with a teal light: round his neck (from the front), on his head at the decks (seen from behind). */
const neckPhones = () => both(`<g transform="translate(60 108) rotate(-18)"><ellipse rx="7.6" ry="9.6" fill="url(#cup)" stroke="${INK}" stroke-width="1"/><ellipse cx="1" rx="4.4" ry="6.2" fill="#0f172a"/><ellipse class="led" cx="1" rx="4.4" ry="6.2" fill="none" stroke="#5eead4" stroke-width="1.3" filter="url(#glow)"/></g>`);
const headPhones = () => `<path d="M44 70C40 34 58 16 80 16C102 16 120 34 116 70" fill="none" stroke="#334155" stroke-width="5.4" stroke-linecap="round"/>
    <path d="M47 60C45 36 60 21 80 21C100 21 115 36 113 60" fill="none" stroke="#5eead4" stroke-opacity=".7" stroke-width="1.4" stroke-linecap="round"/>
    ${both(`<g transform="translate(44.4 72)"><ellipse rx="7.4" ry="11" fill="url(#cup)" stroke="${INK}" stroke-width=".9"/><ellipse cx="-.8" rx="4.4" ry="7.4" fill="#0f172a"/><ellipse class="led" cx="-.8" rx="4.4" ry="7.4" fill="none" stroke="#5eead4" stroke-width="1.3" filter="url(#glow)"/></g>`)}`;

const head = (back, happy) => `<g class="head">
    ${back
        ? `${quiff()}<path d="${HEAD_BACK}" fill="url(#hairB)" stroke="#8a4f17" stroke-width="1"/>
           <path d="M80 24V92M64 28C60 48 60 72 64 92M96 28C100 48 100 72 96 92" fill="none" stroke="#fff3c4" stroke-opacity=".4" stroke-width="1.3" stroke-linecap="round"/>
           <path d="M60 90C66 98 94 98 100 90L98 97C92 101 68 101 62 97Z" fill="url(#hairB)"/>
           ${both(EAR)}${headPhones()}`
        : `<path d="${HAIR_BACK}" fill="url(#hairB)" stroke="#8a4f17" stroke-width="1"/>${quiff()}${both(EAR)}
           <path d="${FACE}" fill="url(#skin)" stroke="#d9987a" stroke-width="1"/>${face(happy)}
           <path d="${FRINGE}" fill="url(#hair)" stroke="#8a4f17" stroke-width="1" stroke-linejoin="round"/>
           <path d="M58 30C66 25 76 23.6 86 24" fill="none" stroke="#fff7d6" stroke-opacity=".8" stroke-width="2" stroke-linecap="round"/>`}
</g>`;

// ---------- body ----------
const NECK = 'M71 86H89V104C86 107 74 107 71 104Z';
const JACKET = 'M56 100C64 96 96 96 104 100C116 104 121 116 121 132L122 182C110 189 50 189 38 182L39 132C39 116 44 104 56 100Z';
const W = (d, wide) => `<path d="${d}" fill="none" stroke="${NAVY}" stroke-width="${wide + 2.6}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fef3c7" stroke-width="${wide}" stroke-linecap="round" stroke-linejoin="round"/>`;
const ribs = (d, width) => `<path d="${d}" fill="none" stroke="${NAVY}" stroke-width="${width}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#f8fafc" stroke-width="1.4" stroke-linecap="round" transform="translate(0 -1.6)"/>`;

const body = (back) => `<g class="body">
    <path d="${JACKET}" fill="url(#jacket)" stroke="${INK}" stroke-width="1.1"/>
    ${back
        ? `<path d="M80 102V182" stroke="#0b4d47" stroke-opacity=".35" stroke-width="1.4"/>
           <path id="wilmerArc" d="M51 140Q80 117 109 140" fill="none"/>
           <text font-family="'Arial Black','Segoe UI Black',Impact,sans-serif" font-weight="900" font-size="11.5" fill="#fef3c7" stroke="${NAVY}" stroke-width="2.6" paint-order="stroke" letter-spacing=".6"><textPath href="#wilmerArc" startOffset="50%" text-anchor="middle">WILMER</textPath></text>
           ${W('M68 146L72.6 166L80 152L87.4 166L92 146', 4.2)}
           ${ribs('M58 101C64 97 96 97 102 101', 6)}`
        : `<path d="M69 100C74 104 86 104 91 100L93 184C86 187 74 187 67 184Z" fill="url(#tee)" stroke="${INK}" stroke-width=".9"/>
           <circle cx="80" cy="140" r="7" fill="#1e293b"/><circle cx="80" cy="140" r="2.4" fill="#f59e0b"/><path d="M75 135A7 7 0 0 1 84.4 134.4" fill="none" stroke="#94a3b8" stroke-width=".8"/>
           <path d="M69 101L67 184M91 101L93 184" stroke="#0b4d47" stroke-width="2"/>
           ${both('<g fill="#e2e8f0" stroke="#0b4d47" stroke-width=".7"><circle cx="64.6" cy="118" r="1.5"/><circle cx="64.4" cy="136" r="1.5"/><circle cx="64.2" cy="154" r="1.5"/><circle cx="64" cy="170" r="1.5"/></g>')}
           ${W('M98.6 121L102.2 135L105.8 126L109.4 135L113 121', 3.4)}
           ${ribs('M58 101C64 94 96 94 102 101', 6.4)}`}
    ${ribs('M39 181C52 188.6 108 188.6 121 181', 7)}
    <path d="M45 122C43.6 142 43 160 43.6 176" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="2.4" stroke-linecap="round"/>
</g>`;

const arm = (side) => `<g class="arm${side}">
    <path d="${capsule([52, 108], [43, 137], 9, 8)}" fill="url(#sleeve)" stroke="${INK}" stroke-width="1"/>
    <g class="fore${side}">
        <path d="${capsule([43, 135], [43, 156], 8, 7.4)}" fill="url(#sleeve)" stroke="${INK}" stroke-width="1"/>
        <path d="M35.4 157.2H50.6" stroke="${NAVY}" stroke-width="4" stroke-linecap="round"/><path d="M35.8 155.8H50.2" stroke="#f8fafc" stroke-width="1" stroke-linecap="round"/>
        <g class="hand${side}"><circle cx="43" cy="164.4" r="6.2" fill="url(#skin)" stroke="#d9987a" stroke-width="1"/><path d="M39.4 168C41 169.2 44 169.4 46 168.2" fill="none" stroke="#d9987a" stroke-width="1" stroke-linecap="round"/></g>
    </g>
</g>`;

const leg = (side) => `<g class="leg${side}">
    <path d="${capsule([66, 184], [66, 222], 7.2, 6.6)}" fill="url(#denim)" stroke="${INK}" stroke-width="1"/>
    <path d="M59 219.6H73" stroke="#dbeafe" stroke-width="4.4" stroke-linecap="round"/><path d="M59.4 217.6H72.6" stroke="#93c5fd" stroke-width="1"/>
    <path d="M54 235C54 227 60 222.6 68 223.4C76 224.2 81 228.6 81 234C81 238 79 240 75 240H57C55 240 54 238.6 54 235Z" fill="url(#shoe)" stroke="${INK}" stroke-width="1"/>
    <path d="M54.4 236.4H80.6" stroke="#d9a066" stroke-width="2.6"/>
    <path d="M60 230.6L72 227.4" stroke="#14b8a6" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M64.6 226.2L68 225.4M65.8 228.6L69.2 227.8" stroke="#f43f5e" stroke-width="1.1" stroke-linecap="round"/>
</g>`;

/** Notes that rise around him while he dances. */
const notes = () => [[124, 140, 1, 0], [32, 122, 0.85, -0.7], [130, 104, 0.75, -1.4]].map(([x, y, s, d]) => `<g class="note" style="animation-delay:${d}s"><g transform="translate(${x} ${y}) scale(${s})"><ellipse rx="3.6" ry="2.7" transform="rotate(-22)" fill="#5eead4" stroke="#0f766e" stroke-width=".8"/><path d="M3 -1V-14Q9 -12 10 -6" fill="none" stroke="#0f766e" stroke-width="1.8" stroke-linecap="round"/></g></g>`).join('');

const defs = () => [
    rad('skin', [0.42, 0.36, 0.7], [[0, '#fff1e6'], [0.6, '#ffd5bd'], [1, '#f2b38f']]),
    lin('hair', [0, 0, 1, 1], [[0, '#fef3c7'], [0.45, '#f6c26b'], [1, '#c27c2c']]),
    lin('hairB', [0, 0, 1, 1], [[0, '#f8d58a'], [0.5, '#d9963f'], [1, '#9a5a1c']]),
    rad('iris', [0.45, 0.3, 0.75], [[0, '#ccfbf1'], [0.5, '#14b8a6'], [1, '#134e4a']]),
    lin('jacket', [0.1, 0, 0.9, 1], [[0, '#5eead4'], [0.5, '#14b8a6'], [1, '#0f766e']]),
    lin('sleeve', [0.1, 0, 0.9, 1], [[0, '#fffdf5'], [0.5, '#f5e9cf'], [1, '#d8c29a']]),
    lin('tee', [0, 0, 0, 1], [[0, '#ffffff'], [1, '#e8eef6']]),
    lin('denim', [0, 0, 1, 0], [[0, '#c7dcf5'], [0.5, '#7fa9dd'], [1, '#3f6fb0']]),
    lin('shoe', [0, 0, 0, 1], [[0, '#ffffff'], [1, '#e5ebf2']]),
    lin('cup', [0, 0, 1, 1], [[0, '#64748b'], [0.5, '#334155'], [1, '#0f172a']]),
    `<filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
].join('');

const motion = (state) => {
    const joints = { arm: '52px 108px', fore: '43px 136px', hand: '43px 162px', leg: '66px 186px' };
    const base = origins({
        all: '80px 238px', head: '80px 98px', body: '80px 188px', quiff: '84px 30px',
        ...Object.fromEntries(Object.entries(joints).flatMap(([part, o]) => [[`${part}L`, o], [`${part}R`, o]])),
    }, ['shadow', 'blink', 'note', 'led']);
    const always = `
        ${kf('blink', { 0: 'transform:scaleY(1)', 92: 'transform:scaleY(1)', 95: 'transform:scaleY(.1)', 98: 'transform:scaleY(1)', 100: 'transform:scaleY(1)' })}
        ${kf('led', { 0: 'opacity:.45', 50: 'opacity:1', 100: 'opacity:.45' })}
        ${play('.blink', 'blink', 4.2)}${play('.led', 'led', 1.2)}`;
    const rules = {
        Standing: `
            ${kf('breathe', { 0: 'transform:scale(1,1)', 50: 'transform:scale(1.012,.988)', 100: 'transform:scale(1,1)' })}
            ${kf('sway', { 0: 'transform:rotate(-2.5deg)', 50: 'transform:rotate(2.5deg)', 100: 'transform:rotate(-2.5deg)' })}
            ${kf('quiff', { 0: 'transform:rotate(-2deg)', 50: 'transform:rotate(3deg)', 100: 'transform:rotate(-2deg)' })}
            ${kf('rest', { 0: 'transform:rotate(4deg)', 50: 'transform:rotate(1deg)', 100: 'transform:rotate(4deg)' })}
            ${kf('wave', { 0: 'transform:rotate(6deg)', 50: 'transform:rotate(6deg)', 58: 'transform:rotate(148deg)', 86: 'transform:rotate(148deg)', 94: 'transform:rotate(6deg)', 100: 'transform:rotate(6deg)' })}
            ${kf('waveFore', { 0: 'transform:rotate(0)', 58: 'transform:rotate(0)', 62: 'transform:rotate(-24deg)', 67: 'transform:rotate(18deg)', 72: 'transform:rotate(-24deg)', 77: 'transform:rotate(18deg)', 82: 'transform:rotate(-10deg)', 94: 'transform:rotate(0)', 100: 'transform:rotate(0)' })}
            ${play('.body', 'breathe', 3.2)}${play('.head', 'sway', 4.4)}${play('.quiff', 'quiff', 2.2)}
            ${play('.armL', 'rest', 3.2)}${play('.armR', 'wave', 5)}${play('.foreR', 'waveFore', 5)}
            ${pose('.armR', 'rotate(148deg)')}${pose('.foreR', 'rotate(-14deg)')}`,
        Dancing: `
            ${kf('hop', { 0: 'transform:translateY(0) scale(1.04,.96)', 45: 'transform:translateY(-11px) scale(.98,1.03)', 100: 'transform:translateY(0) scale(1.04,.96)' })}
            ${kf('bob', { 0: 'transform:rotate(-7deg)', 50: 'transform:rotate(7deg) translateY(2px)', 100: 'transform:rotate(-7deg)' })}
            ${kf('quiff', { 0: 'transform:rotate(-5deg)', 50: 'transform:rotate(7deg)', 100: 'transform:rotate(-5deg)' })}
            ${kf('fist', { 0: 'transform:rotate(112deg)', 50: 'transform:rotate(142deg)', 100: 'transform:rotate(112deg)' })}
            ${kf('fistFore', { 0: 'transform:rotate(8deg)', 50: 'transform:rotate(30deg)', 100: 'transform:rotate(8deg)' })}
            ${kf('step', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-6px)', 100: 'transform:translateY(0)' })}
            ${kf('note', { 0: 'transform:translateY(8px) scale(.4);opacity:0', 30: 'opacity:1', 100: 'transform:translateY(-34px) scale(1.1);opacity:0' })}
            ${kf('shadowHop', { 0: 'transform:scale(1.04)', 45: 'transform:scale(.84)', 100: 'transform:scale(1.04)' })}
            ${play('.all', 'hop', 0.6)}${play('.head', 'bob', 1.2, '-1.1s')}${play('.quiff', 'quiff', 0.6, '-.5s')}
            ${play('.armL', 'fist', 0.6)}${play('.foreL', 'fistFore', 0.6, '-.55s')}${play('.armR', 'fist', 0.6, '-.3s')}${play('.foreR', 'fistFore', 0.6, '-.25s')}
            ${play('.legL', 'step', 0.6)}${play('.legR', 'step', 0.6, '-.3s')}${play('.note', 'note', 1.8)}${play('.shadow', 'shadowHop', 0.6)}
            ${pose('.armL', 'rotate(140deg)')}${pose('.foreL', 'rotate(26deg)')}${pose('.armR', 'rotate(114deg)')}${pose('.foreR', 'rotate(8deg)')}
            ${pose('.head', 'rotate(-5deg)')}${pose('.legL', 'translateY(-5px)')}`,
        DJing: `
            ${kf('jump', { 0: 'transform:translateY(0) scale(1.04,.96)', 40: 'transform:translateY(-10px) scale(.98,1.03)', 80: 'transform:translateY(0) scale(1.04,.96)', 100: 'transform:translateY(0) scale(1.04,.96)' })}
            ${kf('nodBack', { 0: 'transform:rotate(-4deg)', 40: 'transform:rotate(4deg) translateY(2.4px)', 100: 'transform:rotate(-4deg)' })}
            ${kf('quiff', { 0: 'transform:rotate(-4deg)', 40: 'transform:rotate(6deg)', 100: 'transform:rotate(-4deg)' })}
            ${kf('pump', { 0: 'transform:rotate(140deg)', 40: 'transform:rotate(164deg)', 100: 'transform:rotate(140deg)' })}
            ${kf('pumpFore', { 0: 'transform:rotate(30deg)', 40: 'transform:rotate(6deg)', 100: 'transform:rotate(30deg)' })}
            ${kf('scratch', { 0: 'transform:rotate(16deg)', 50: 'transform:rotate(32deg)', 100: 'transform:rotate(16deg)' })}
            ${kf('kick', { 0: 'transform:translateY(0)', 40: 'transform:translateY(-6px)', 80: 'transform:translateY(0)', 100: 'transform:translateY(0)' })}
            ${kf('shadowJump', { 0: 'transform:scale(1.04)', 40: 'transform:scale(.8)', 80: 'transform:scale(1.04)', 100: 'transform:scale(1.04)' })}
            ${play('.all', 'jump', 0.6)}${play('.head', 'nodBack', 0.6, '-.54s')}${play('.quiff', 'quiff', 0.6, '-.5s')}
            ${play('.armL', 'pump', 0.6)}${play('.foreL', 'pumpFore', 0.6, '-.52s')}${play('.foreR', 'scratch', 0.3)}
            ${play('.legL', 'kick', 0.6)}${play('.legR', 'kick', 0.6, '-.3s')}${play('.shadow', 'shadowJump', 0.6)}
            ${pose('.armL', 'rotate(150deg)')}${pose('.foreL', 'rotate(18deg)')}${pose('.armR', 'rotate(14deg)')}${pose('.foreR', 'rotate(24deg)')}${pose('.head', 'rotate(-3deg)')}`,
    };

    return base + always + rules[state];
};

export function wilmer(state) {
    const back = state === 'DJing';
    const dancing = state === 'Dancing';
    const neck = `<path d="${NECK}" fill="url(#skin)"/><path d="M71 92C76 97 84 97 89 92V96C84 100 76 100 71 96Z" fill="#000" fill-opacity=".12"/>`;
    const guy = back
        ? `${leg('L')}${mirror(leg('R'))}${mirror(arm('R'))}${neck}${body(true)}${head(true, false)}${arm('L')}`
        : `${leg('L')}${mirror(leg('R'))}${neck}${body(false)}${arm('L')}${mirror(arm('R'))}${head(false, dancing)}${neckPhones()}`;

    return picture({
        label: 'Wilmer',
        state,
        defs: defs(),
        body: `${shadow()}<g class="all">${guy}</g>${dancing ? notes() : ''}`,
        css: motion(state),
    });
}
