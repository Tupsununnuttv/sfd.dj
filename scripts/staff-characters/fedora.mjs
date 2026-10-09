// Fedora: a rapper in a black fedora and big shades, a gold chain, a black jacket with blue piping, white sneakers and a boombox.
import { kf, lin, mirror, origins, picture, play, pose, rad, shadow } from './kit.mjs';

const BLUE = '#3b82f6';

const defs = () => [
    lin('skin', [0.1, 0, 0.9, 1], [[0, '#b27a52'], [0.5, '#855131'], [1, '#5c3722']]),
    lin('skinShade', [0, 0, 0, 1], [[0, '#000', 0.3], [1, '#000', 0]]),
    lin('hat', [0, 0, 0.9, 1], [[0, '#4c4c58'], [0.4, '#1e1e26'], [1, '#08080b']]),
    lin('brim', [0, 0, 0, 1], [[0, '#3b3b46'], [0.5, '#17171d'], [1, '#050507']]),
    lin('lens', [0, 0, 1, 1], [[0, '#4a4a58'], [0.35, '#16161d'], [1, '#030304']]),
    lin('jacket', [0, 0, 1, 1], [[0, '#4a4a56'], [0.4, '#22222a'], [1, '#09090c']]),
    lin('tee', [0, 0, 0, 1], [[0, '#ffffff'], [1, '#c9d3e4']]),
    lin('pants', [0, 0, 1, 0], [[0, '#4d5365'], [0.5, '#2a2e3b'], [1, '#14161e']]),
    lin('shoe', [0, 0, 0, 1], [[0, '#ffffff'], [0.7, '#e5ebf5'], [1, '#aab6cb']]),
    lin('gold', [0, 0, 1, 1], [[0, '#fff3b0'], [0.35, '#fbbf24'], [0.7, '#b9770e'], [1, '#f7d56a']]),
    lin('metal', [0, 0, 0, 1], [[0, '#c7cfdd'], [0.5, '#8a93a6'], [1, '#4a5163']]),
    rad('cone', [0.4, 0.35, 0.7], [[0, '#7c8497'], [0.5, '#2a2f3b'], [1, '#0b0d13']]),
    lin('glass', [0, 0, 0.7, 1], [[0, '#fff', 0.7], [1, '#fff', 0]]),
].join('');

const arm = (cls) => `<g class="${cls}">
    <path d="M41 141 Q41 133 50 133 Q59 133 59 141 L58 172 Q50 177 42 172 Z" fill="url(#jacket)"/>
    <rect x="43.5" y="170" width="13" height="19" rx="6" fill="url(#jacket)"/>
    <path d="M43.4 177 Q50 181 56.6 177" fill="none" stroke="${BLUE}" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="50" cy="194" r="8.2" fill="url(#skin)" stroke="#2a160c" stroke-opacity=".35" stroke-width=".9"/>
    <ellipse cx="57" cy="191" rx="3.2" ry="5" transform="rotate(-22 57 191)" fill="url(#skin)" stroke="#2a160c" stroke-opacity=".3" stroke-width=".8"/>
    <ellipse cx="46.5" cy="190.5" rx="3" ry="1.8" fill="#fff" fill-opacity=".18"/>
</g>`;

const leg = (cls) => `<g class="${cls}">
    <path d="M54 190 H78 L77 227 H56 Z" fill="url(#pants)"/>
    <path d="M60 196 V224" stroke="#fff" stroke-opacity=".07" stroke-width="1.4"/>
    <path d="M51 229 Q51 222 60 222 H74 Q81 222 82 230 Q83 238 75 238 H56 Q49 238 51 229 Z" fill="url(#shoe)" stroke="#6c7a95" stroke-opacity=".6" stroke-width=".9"/>
    <rect x="49.5" y="233.5" width="34" height="4.8" rx="2.4" fill="#d7deea" stroke="#6c7a95" stroke-opacity=".5" stroke-width=".7"/>
    <path d="M60 224 L68 232 M65 223.4 L72 230.4 M70 223.2 L76 229.2" stroke="#10131c" stroke-width="2.1" stroke-linecap="round"/>
    <path d="M56 226 Q64 222.6 74 225" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="1.8" stroke-linecap="round"/>
</g>`;

const torso = (back = false) => `
    <path d="M44 138 C44 128 60 123 80 123 C100 123 116 128 116 138 L122 194 Q80 205 38 194 Z" fill="url(#jacket)"/>
    ${back
        ? `<path d="M80 126 V196" stroke="#000" stroke-opacity=".3" stroke-width="1.6"/><path d="M52 150 H108" stroke="${BLUE}" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/>`
        : `<path d="M65 125 L80 170 L95 125 Z" fill="url(#tee)"/>
    <path d="M65 125 L80 170 L95 125" fill="none" stroke="#9fb0cc" stroke-opacity=".5" stroke-width="1"/>
    <path d="M62 124 L78 172 M98 124 L82 172" fill="none" stroke="${BLUE}" stroke-width="2.6" stroke-linecap="round"/>`}
    <path d="M38 195 Q80 206 122 195" fill="none" stroke="${BLUE}" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M50 134 C62 128 98 128 110 134" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="2.6" stroke-linecap="round"/>
    ${back ? '' : '<rect x="53" y="176" width="16" height="3" rx="1.5" fill="#000" fill-opacity=".5"/><rect x="91" y="176" width="16" height="3" rx="1.5" fill="#000" fill-opacity=".5"/>'}`;

const chain = () => `
    <path d="M58 131 Q80 160 102 131" fill="none" stroke="#7a4b06" stroke-width="5.6" stroke-linecap="round"/>
    <path d="M58 131 Q80 160 102 131" fill="none" stroke="url(#gold)" stroke-width="4.4" stroke-linecap="round" stroke-dasharray="5.2 1.4"/>
    <path d="M59 129.6 Q80 157 101 129.6" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.1" stroke-dasharray="5.2 1.4"/>
    <rect x="71.5" y="149.5" width="17" height="14" rx="4" fill="url(#gold)" stroke="#7a4b06" stroke-width="1.1"/>
    <path d="M75 153 H85 M75 157 H82" stroke="#fff7d1" stroke-opacity=".8" stroke-width="1.6" stroke-linecap="round"/>`;

/** The back of the head for the DJ who stands with their back to us: short black hair under the hat, and the neck. */
const hairBack = () => `
    <path d="M40 76 C40 46 58 32 80 32 C102 32 120 46 120 76 C120 102 104 120 80 120 C56 120 40 102 40 76 Z" fill="#17120f"/>
    <path d="M80 40 C76 62 84 84 80 110 M60 50 C56 70 62 90 58 106 M100 50 C104 70 98 90 102 106" fill="none" stroke="#ffffff" stroke-opacity=".08" stroke-width="2.2" stroke-linecap="round"/>
    <rect x="65" y="110" width="30" height="22" rx="7" fill="url(#skin)"/><path d="M65 112 Q80 122 95 112" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="2"/>`;

const head = (state, back = false) => {
    const grin = state === 'Standing'
        ? `<path d="M65 102 Q80 112 95 102" fill="none" stroke="#2a0f0a" stroke-width="2.6" stroke-linecap="round"/>`
        : `<path d="M63 100 Q80 122 97 100 Q80 105 63 100 Z" fill="#43160f"/><path d="M66 101.2 Q80 108 94 101.2 Q80 105 66 101.2 Z" fill="#fff"/><path d="M72 111 Q80 116 88 111 Q80 114 72 111 Z" fill="#e0525a"/>`;

    return `
    <g class="earL"><ellipse cx="39" cy="82" rx="6.4" ry="9.4" fill="url(#skin)"/><ellipse cx="39.6" cy="82" rx="3" ry="5" fill="#000" fill-opacity=".18"/></g>
    ${mirror('<g class="earR"><ellipse cx="39" cy="82" rx="6.4" ry="9.4" fill="url(#skin)"/><ellipse cx="39.6" cy="82" rx="3" ry="5" fill="#000" fill-opacity=".18"/></g>')}
    <rect x="68" y="112" width="24" height="18" rx="6" fill="url(#skin)"/>
    <path d="M40 76 C40 46 58 32 80 32 C102 32 120 46 120 76 C120 102 104 120 80 120 C56 120 40 102 40 76 Z" fill="url(#skin)"/>
    <path d="M44 92 C50 110 64 119 80 119 C96 119 110 110 116 92 C110 112 98 123 80 123 C62 123 50 112 44 92 Z" fill="#000" fill-opacity=".14"/>
    <ellipse cx="52" cy="98" rx="8" ry="5" fill="#c0603f" fill-opacity=".28"/><ellipse cx="108" cy="98" rx="8" ry="5" fill="#c0603f" fill-opacity=".28"/>
    <path d="M76 91 Q80 99 84 91" fill="none" stroke="#3a2012" stroke-opacity=".7" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M69 111 Q80 118 91 111 L89 123 Q80 129 71 123 Z" fill="#16110f"/>
    <path d="M64 99.4 Q80 93.6 96 99.4 Q80 98 64 99.4 Z" fill="#16110f" stroke="#16110f" stroke-width="2.4" stroke-linejoin="round"/>
    ${grin}
    <g class="shades">
        <rect x="45.4" y="71.4" width="30.6" height="23" rx="8" fill="url(#lens)" stroke="#050507" stroke-width="3.4"/>
        <rect x="84" y="71.4" width="30.6" height="23" rx="8" fill="url(#lens)" stroke="#050507" stroke-width="3.4"/>
        <rect x="75" y="77" width="10" height="4.4" rx="2.2" fill="#050507"/>
        <path d="M45.5 78 L40 80 M114.5 78 L120 80" stroke="#050507" stroke-width="3" stroke-linecap="round"/>
        <path d="M51 73 L62 73 L53 93 L47 93 Z" fill="url(#glass)" fill-opacity=".5"/><path d="M89.6 73 L100.6 73 L91.6 93 L85.6 93 Z" fill="url(#glass)" fill-opacity=".5"/>
        <circle cx="68.4" cy="77.4" r="1.7" fill="#fff" fill-opacity=".8"/><circle cx="107" cy="77.4" r="1.7" fill="#fff" fill-opacity=".8"/>
    </g>
    ${back ? hairBack() : ''}
    <ellipse cx="80" cy="73" rx="40" ry="8" fill="#000" fill-opacity=".34"/>
    <ellipse cx="80" cy="56" rx="62" ry="15" fill="url(#brim)" stroke="#000" stroke-width="1.2"/>
    <path d="M24 52 Q80 74 136 52" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="2" stroke-linecap="round"/>
    <path d="M49 55 C49 27 62 14 80 14 C98 14 111 27 111 55 Q80 66 49 55 Z" fill="url(#hat)" stroke="#000" stroke-width="1"/>
    <path d="M62 22 Q80 33 98 22" fill="none" stroke="#000" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>
    <path d="M49 47 Q80 58 111 47 L111 55 Q80 66 49 55 Z" fill="#32323d"/>
    <path d="M50 49 Q80 59 110 49" fill="none" stroke="#9aa0b5" stroke-opacity=".5" stroke-width="1.3"/>
    <path d="M56 33 C58 24 66 18 74 17" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="3" stroke-linecap="round"/>`;
};

/** The boombox, drawn around (6..72, -4..44); the state puts it on the floor, on the shoulder or beside the feet. */
const boombox = () => `
    <path d="M18 8 Q18 -4 30 -4 H48 Q60 -4 60 8" fill="none" stroke="#303644" stroke-width="3.6" stroke-linecap="round"/>
    <rect x="6" y="6" width="66" height="38" rx="9" fill="url(#metal)" stroke="#2a3040" stroke-width="1.4"/>
    <rect x="9" y="9" width="60" height="5" rx="2.5" fill="#fff" fill-opacity=".35"/>
    <g class="cone1"><circle cx="21" cy="28" r="12.6" fill="#1a1d27" stroke="#0a0c11" stroke-width="1.2"/><circle cx="21" cy="28" r="9.6" fill="url(#cone)"/><circle cx="21" cy="28" r="3.6" fill="#10131b"/><circle cx="18.6" cy="25.4" r="1.7" fill="#fff" fill-opacity=".5"/></g>
    <g class="cone2"><circle cx="57" cy="28" r="12.6" fill="#1a1d27" stroke="#0a0c11" stroke-width="1.2"/><circle cx="57" cy="28" r="9.6" fill="url(#cone)"/><circle cx="57" cy="28" r="3.6" fill="#10131b"/><circle cx="54.6" cy="25.4" r="1.7" fill="#fff" fill-opacity=".5"/></g>
    <rect x="31" y="15" width="16" height="11" rx="2.4" fill="#0e1118" stroke="#6b7488" stroke-width=".9"/>
    <circle cx="35.4" cy="20.6" r="2.4" fill="#2e3544"/><circle cx="42.6" cy="20.6" r="2.4" fill="#2e3544"/>
    <rect x="33" y="30" width="12" height="3.2" rx="1.6" fill="#38bdf8" class="eqled"/>
    <circle cx="35" cy="38" r="1.8" fill="#4ade80" class="eqled"/><circle cx="41" cy="38" r="1.8" fill="#f87171"/><circle cx="47" cy="38" r="1.8" fill="#fbbf24"/>`;

const note = (cls, color) => `<g class="${cls}"><path d="M0 0 V-12 L8 -14 V-3" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="-2" cy="1" rx="3.6" ry="2.6" fill="${color}"/><ellipse cx="6" cy="-1" rx="3.6" ry="2.6" fill="${color}"/></g>`;
const notes = () => note('note1', '#7dd3fc') + note('note2', '#f0abfc');

const motion = (state) => {
    const base = origins({ all: '80px 238px', head: '80px 120px', armL: '50px 140px', armR: '50px 140px', legL: '66px 192px', legR: '66px 192px', box: '0 0', note1: '0 0', note2: '0 0' }, ['shadow', 'shades', 'cone1', 'cone2', 'eqled']);
    const shared = kf('pulse', { 0: 'opacity:1', 50: 'opacity:.4', 100: 'opacity:1' }) + kf('thump', { 0: 'transform:scale(1)', 50: 'transform:scale(1.1)', 100: 'transform:scale(1)' });
    const rules = {
        Standing: `
            ${kf('breathe', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-1.6px)', 100: 'transform:translateY(0)' })}
            ${kf('sway', { 0: 'transform:rotate(-1.3deg)', 50: 'transform:rotate(1.3deg)', 100: 'transform:rotate(-1.3deg)' })}
            ${kf('arms', { 0: 'transform:rotate(1.5deg)', 50: 'transform:rotate(-2.5deg)', 100: 'transform:rotate(1.5deg)' })}
            ${pose('.box', 'translate(114px,207px) scale(.62)')}${play('.all', 'breathe', 3.2)}${play('.head', 'sway', 4.8)}${play('.armL', 'arms', 3.2)}${play('.armR', 'arms', 3.2, 'reverse')}${play('.cone1', 'thump', 1.4)}${play('.cone2', 'thump', 1.4, '.35s')}${play('.eqled', 'pulse', 1.2)}`,
        Dancing: `
            ${kf('hop', { 0: 'transform:translateY(0) scale(1.03,.96)', 45: 'transform:translateY(-10px) scale(.98,1.03)', 100: 'transform:translateY(0) scale(1.03,.96)' })}
            ${kf('nod', { 0: 'transform:rotate(-5deg) translateY(0)', 50: 'transform:rotate(5deg) translateY(3px)', 100: 'transform:rotate(-5deg) translateY(0)' })}
            ${kf('armUp', { 0: 'transform:rotate(150deg)', 50: 'transform:rotate(128deg)', 100: 'transform:rotate(150deg)' })}
            ${kf('armOut', { 0: 'transform:rotate(60deg)', 25: 'transform:rotate(100deg)', 50: 'transform:rotate(68deg)', 75: 'transform:rotate(96deg)', 100: 'transform:rotate(60deg)' })}
            ${kf('knee', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-8px)', 100: 'transform:translateY(0)' })}
            ${kf('boxHop', { 0: 'transform:translate(113px,86px) rotate(-13deg) scale(.8)', 45: 'transform:translate(113px,81px) rotate(-9deg) scale(.82)', 100: 'transform:translate(113px,86px) rotate(-13deg) scale(.8)' })}
            ${kf('noteA', { 0: 'transform:translate(150px,76px);opacity:0', 20: 'opacity:1', 100: 'transform:translate(160px,30px);opacity:0' })}
            ${kf('noteB', { 0: 'transform:translate(132px,70px);opacity:0', 20: 'opacity:1', 100: 'transform:translate(122px,22px);opacity:0' })}
            ${kf('shadowHop', { 0: 'transform:scale(1.04)', 45: 'transform:scale(.8)', 100: 'transform:scale(1.04)' })}
            ${play('.all', 'hop', 0.6)}${play('.head', 'nod', 1.2)}${play('.armR', 'armUp', 0.6)}${play('.armL', 'armOut', 1.2)}${play('.legL', 'knee', 0.6)}${play('.legR', 'knee', 0.6, '.3s')}${play('.box', 'boxHop', 0.6)}${play('.cone1', 'thump', 0.3)}${play('.cone2', 'thump', 0.3)}${play('.eqled', 'pulse', 0.3)}${play('.note1', 'noteA', 1.8)}${play('.note2', 'noteB', 1.8, '.9s')}${play('.shadow', 'shadowHop', 0.6)}
            ${pose('.armR', 'rotate(150deg)')}${pose('.armL', 'rotate(70deg)')}${pose('.legL', 'translateY(-7px)')}${pose('.head', 'rotate(-4deg)')}${pose('.box', 'translate(113px,86px) rotate(-13deg) scale(.8)')}${pose('.note1', 'translate(152px,56px)')}${pose('.note2', 'translate(128px,48px)')}`,
        DJing: `
            ${kf('jump', { 0: 'transform:translateY(0) scale(1.05,.94)', 38: 'transform:translateY(-17px) scale(.97,1.04)', 76: 'transform:translateY(0) scale(1.05,.94)', 100: 'transform:translateY(0) scale(1.05,.94)' })}
            ${kf('bob', { 0: 'transform:rotate(-6deg) translateY(0)', 50: 'transform:rotate(6deg) translateY(3px)', 100: 'transform:rotate(-6deg) translateY(0)' })}
            ${kf('pump', { 0: 'transform:rotate(126deg)', 38: 'transform:rotate(164deg)', 76: 'transform:rotate(126deg)', 100: 'transform:rotate(126deg)' })}
            ${kf('kick', { 0: 'transform:translateY(0)', 38: 'transform:translateY(-9px) rotate(5deg)', 76: 'transform:translateY(0)', 100: 'transform:translateY(0)' })}
            ${kf('shadowJump', { 0: 'transform:scale(1.05)', 38: 'transform:scale(.7)', 76: 'transform:scale(1.05)', 100: 'transform:scale(1.05)' })}
            ${kf('boxStay', { 0: 'transform:translate(114px,207px) scale(.62)', 50: 'transform:translate(114px,204px) scale(.64)', 100: 'transform:translate(114px,207px) scale(.62)' })}
            ${play('.all', 'jump', 0.7)}${play('.head', 'bob', 0.7)}${play('.armL', 'pump', 0.7)}${play('.armR', 'pump', 0.7, '.1s')}${play('.legL', 'kick', 0.7)}${play('.legR', 'kick', 0.7, '.1s')}${play('.box', 'boxStay', 0.35)}${play('.cone1', 'thump', 0.35)}${play('.cone2', 'thump', 0.35)}${play('.eqled', 'pulse', 0.35)}${play('.shadow', 'shadowJump', 0.7)}
            ${pose('.armL', 'rotate(148deg)')}${pose('.armR', 'rotate(148deg)')}${pose('.legR', 'translateY(-9px)')}${pose('.head', 'rotate(-4deg)')}${pose('.box', 'translate(114px,207px) scale(.62)')}`,
    };

    return base + shared + rules[state];
};

export function fedora(state) {
    const back = state === 'DJing';
    const rig = `${leg('legL')}${mirror(leg('legR'))}${torso(back)}${back ? '' : chain()}${arm('armL')}${mirror(arm('armR'))}`;

    return picture({
        label: 'Fedora',
        state,
        defs: defs(),
        body: `${shadow()}<g class="all"><g class="box">${boombox()}</g>${rig}<g class="head">${head(state, back)}</g>${state === 'Dancing' ? notes() : ''}</g>`,
        css: motion(state),
    });
}
