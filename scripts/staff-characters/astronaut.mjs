// The astronauts: a glossy helmet with a coloured visor, a graphite suit with ribbed arms, a chest panel and boots in the colour of the visor.
// Four colours (ice, azure, sun, nebula) in two builds: the standard one and a slimmer "mini" with a smaller helmet and an antenna.
import { kf, lin, mirror, origins, picture, play, pose, rad, shadow } from './kit.mjs';

export const THEMES = {
    ice: { label: 'Ice', white: true, accent: '#38bdf8', hi: '#d4f1ff', deep: '#0a2d78', abyss: '#030a24', glow: '#22d3ee', dark: '#0c6fa8' },
    azure: { label: 'Azure', white: false, accent: '#0ea5e9', hi: '#94e0ff', deep: '#0a2d78', abyss: '#030a24', glow: '#38bdf8', dark: '#0a5f95' },
    sun: { label: 'Sun', white: false, accent: '#f59e0b', hi: '#ffeaa8', deep: '#6e3a05', abyss: '#1c0d01', glow: '#fbbf24', dark: '#a5600a' },
    nebula: { label: 'Nebula', white: false, accent: '#a855f7', hi: '#efdcff', deep: '#3d1273', abyss: '#0e0322', glow: '#c084fc', dark: '#6d2bb0' },
};

const defs = (t) => [
    t.white
        ? lin('shell', [0.15, 0, 0.85, 1], [[0, '#ffffff'], [0.45, '#e4ebf7'], [1, '#98a9c4']])
        : lin('shell', [0.15, 0, 0.85, 1], [[0, '#6a728b'], [0.4, '#2d3144'], [1, '#0b0c13']]),
    rad('vis', [0.36, 0.26, 0.9], [[0, t.hi], [0.26, t.accent], [0.6, t.deep], [1, t.abyss]]),
    lin('suit', [0, 0, 1, 1], [[0, '#5c6277'], [0.5, '#2e3140'], [1, '#14151e']]),
    lin('suit2', [0, 0, 1, 1], [[0, '#858ca3'], [1, '#2d303f']]),
    lin('rib', [0, 0, 1, 0], [[0, '#707790'], [0.45, '#343849'], [1, '#161722']]),
    lin('glove', [0, 0, 0, 1], [[0, t.hi], [0.4, t.accent], [1, t.dark]]),
    lin('gloss', [0, 0, 0.7, 1], [[0, '#ffffff', 0.75], [1, '#ffffff', 0]]),
    lin('rimlight', [0, 0, 0, 1], [[0, t.accent, 0], [1, t.glow, 0.7]]),
    `<clipPath id="vclip"><ellipse cx="80" cy="74" rx="39" ry="35.5"/></clipPath>`,
].join('');

/** The helmet, drawn around (80, 70) with a radius of 50. */
/** The back of the helmet, for the DJ who stands with their back to us: the shell with a vent plate, a glowing seam and the neck ring. */
const backPlate = (t, edge) => `
    <path d="M47 64 C54 40 106 40 113 64" fill="none" stroke="${t.accent}" stroke-opacity=".85" stroke-width="3.2" stroke-linecap="round"/>
    <rect x="62" y="66" width="36" height="30" rx="8" fill="#0c0e16" stroke="${t.accent}" stroke-opacity=".75" stroke-width="1.3"/>
    <path d="M67 74H93M67 81H93M67 88H93" stroke="${t.accent}" stroke-opacity=".7" stroke-width="2.2" stroke-linecap="round"/>
    <circle class="led" cx="80" cy="104" r="2.6" fill="${t.glow}"/>
    <rect x="58" y="110" width="44" height="8" rx="4" fill="url(#shell)" stroke="${edge}" stroke-width="1.1"/>
    <rect x="62" y="112.6" width="36" height="3" rx="1.5" fill="${t.glow}" fill-opacity=".5"/>`;

const helmet = (t, mini, back = false) => {
    const edge = t.white ? '#7e90ad' : '#04050a';
    const cap = (side) => `<rect x="19" y="54" width="18" height="33" rx="9" fill="url(#shell)" stroke="${edge}" stroke-width="1.3"/><rect x="23.5" y="60" width="4.2" height="21" rx="2.1" fill="${t.accent}"/>${side}`;

    return `
    ${mini ? '' : cap('') + mirror(cap(''))}
    <circle cx="80" cy="70" r="50" fill="url(#shell)" stroke="${edge}" stroke-width="1.5"/>
    <path d="M42 54 C49 33 69 22 93 24" fill="none" stroke="#fff" stroke-opacity="${t.white ? 0.95 : 0.34}" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M118 86 C113 102 100 113 84 116" fill="none" stroke="#000" stroke-opacity="${t.white ? 0.12 : 0.4}" stroke-width="4" stroke-linecap="round"/>
    ${back ? backPlate(t, edge) : `    <ellipse cx="80" cy="74" rx="42.5" ry="38.5" fill="${t.white ? '#16203a' : '#08090f'}"/>
    <ellipse cx="80" cy="74" rx="39" ry="35.5" fill="url(#vis)"/>
    <g clip-path="url(#vclip)">
        <ellipse cx="80" cy="106" rx="34" ry="12" fill="url(#rimlight)"/>
        <path d="M44 62 C47 42 66 34 86 36 C70 41 58 51 54 68 Z" fill="url(#gloss)"/>
        <ellipse cx="64" cy="52" rx="7.4" ry="4.4" fill="#fff" fill-opacity=".9" transform="rotate(-26 64 52)"/>
        <ellipse cx="98" cy="46" rx="3.6" ry="2.3" fill="#fff" fill-opacity=".75"/>
        <circle cx="103" cy="95" r="2.1" fill="#fff" fill-opacity=".5"/>
        <g class="glint"><path d="M20 30 L36 30 L66 120 L50 120 Z" fill="#fff" fill-opacity=".2"/><path d="M42 30 L48 30 L78 120 L72 120 Z" fill="#fff" fill-opacity=".14"/></g>
    </g>
    <ellipse cx="80" cy="74" rx="39" ry="35.5" fill="none" stroke="${t.hi}" stroke-opacity=".35" stroke-width="1.2"/>
    <rect x="59" y="112.5" width="42" height="7" rx="3.5" fill="${t.glow}" fill-opacity=".28"/>
    <rect x="63" y="114" width="34" height="3.8" rx="1.9" fill="${t.hi}"/>`}
    ${mini ? `<path d="M80 22 V6" stroke="${edge}" stroke-width="3" stroke-linecap="round"/><circle class="tip" cx="80" cy="5" r="5.4" fill="${t.accent}" stroke="${t.hi}" stroke-width="1.2"/><circle cx="78" cy="3.2" r="1.6" fill="#fff" fill-opacity=".9"/>` : ''}`;
};

const arm = (t, cls) => `<g class="${cls}">
    ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="33.5" y="${146 + i * 7.3}" width="17" height="6.8" rx="3.2" fill="url(#rib)"/>`).join('')}
    <rect x="31.5" y="190" width="21" height="7.5" rx="3.4" fill="url(#glove)" stroke="#000" stroke-opacity=".25" stroke-width=".8"/>
    <ellipse cx="42" cy="206" rx="10.5" ry="9.8" fill="url(#glove)" stroke="#000" stroke-opacity=".28" stroke-width=".9"/>
    <ellipse cx="51.2" cy="201.6" rx="4.1" ry="6.2" transform="rotate(-24 51.2 201.6)" fill="url(#glove)" stroke="#000" stroke-opacity=".28" stroke-width=".9"/>
    <ellipse cx="37.5" cy="201.5" rx="3.6" ry="2.2" fill="#fff" fill-opacity=".5"/>
</g>`;

const leg = (t, cls) => `<g class="${cls}">
    <rect x="53" y="189" width="20" height="36" rx="9" fill="url(#suit)"/>
    <rect x="55" y="203" width="16" height="10" rx="5" fill="url(#suit2)" stroke="#000" stroke-opacity=".35" stroke-width=".8"/>
    <path d="M49 227 Q49 220 57 220 H71 Q77 220 78 226 L80 232 Q81 238 74 238 H54 Q47 238 48 232 Z" fill="url(#glove)" stroke="#000" stroke-opacity=".3" stroke-width=".9"/>
    <rect x="46.8" y="233" width="34.4" height="5.5" rx="2.7" fill="#0a0b10"/>
    <rect x="50" y="227" width="27" height="2.4" rx="1.2" fill="${t.hi}" fill-opacity=".8"/>
    <path d="M54 223.4 Q63 220.6 73 223.4" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.8" stroke-linecap="round"/>
</g>`;

/** The life-support pack on the back of the suit: two tanks in the colour of the visor between the straps. */
const backpack = (t) => `
    <path d="M52 131 L58 152 M108 131 L102 152" stroke="#0a0c13" stroke-width="5.5" stroke-linecap="round"/>
    <rect x="57" y="132" width="46" height="56" rx="9" fill="#1a1d29" stroke="${t.accent}" stroke-opacity=".7" stroke-width="1.4"/>
    <rect x="62" y="137" width="15" height="44" rx="7.5" fill="url(#shell)" stroke="#000" stroke-opacity=".35" stroke-width=".8"/><rect x="83" y="137" width="15" height="44" rx="7.5" fill="url(#shell)" stroke="#000" stroke-opacity=".35" stroke-width=".8"/>
    <rect x="62" y="150" width="15" height="4.4" fill="${t.accent}"/><rect x="83" y="150" width="15" height="4.4" fill="${t.accent}"/>
    <rect x="62" y="164" width="15" height="4.4" fill="${t.accent}" fill-opacity=".7"/><rect x="83" y="164" width="15" height="4.4" fill="${t.accent}" fill-opacity=".7"/>
    <rect x="70" y="127" width="20" height="8" rx="3" fill="#2d3142" stroke="${t.accent}" stroke-width="1"/>
    <circle class="led" cx="80" cy="182" r="2.4" fill="${t.glow}"/>`;

const torso = (t, back = false) => `
    ${mirror('<rect x="25" y="141" width="11" height="36" rx="5.5" fill="#222534" stroke="#000" stroke-opacity=".4" stroke-width=".8"/>')}
    <rect x="25" y="141" width="11" height="36" rx="5.5" fill="#222534" stroke="#000" stroke-opacity=".4" stroke-width=".8"/>
    <path d="M40 143 C40 130 58 124 80 124 C102 124 120 130 120 143 L126 191 C108 200 52 200 34 191 Z" fill="url(#suit)"/>
    <path d="M47 135 C61 128.5 99 128.5 113 135" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="3" stroke-linecap="round"/>
    <path d="M80 130 V190" stroke="#000" stroke-opacity=".35" stroke-width="1.2"/>
    ${back ? backpack(t) : `    <rect x="62" y="138" width="36" height="25" rx="5" fill="#0a0c13" stroke="${t.accent}" stroke-opacity=".75" stroke-width="1.2"/>
    <rect x="66" y="142" width="17" height="9" rx="2" fill="${t.accent}"/>
    <rect x="66" y="142" width="17" height="4" rx="2" fill="#fff" fill-opacity=".32"/>
    <path d="M68 148.4 h5 l2 -3 l3 5.5 l2 -2.5 h2" fill="none" stroke="#04101f" stroke-opacity=".7" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
    <circle class="led" cx="90" cy="144" r="2.2" fill="#fb7185"/><circle class="led l2" cx="90" cy="150" r="2.2" fill="#fbbf24"/><circle class="led l3" cx="90" cy="156" r="2.2" fill="#4ade80"/>
    <rect x="66" y="155" width="19" height="4.2" rx="2.1" fill="#1b1e2c"/><rect x="66" y="155" width="11" height="4.2" rx="2.1" fill="${t.accent}"/>
    <g class="logo"><path d="M71 178 v-3 a9 9 0 0 1 18 0 v3" fill="none" stroke="${t.glow}" stroke-opacity=".35" stroke-width="5.4" stroke-linecap="round"/>
    <path d="M71 178 v-3 a9 9 0 0 1 18 0 v3" fill="none" stroke="${t.hi}" stroke-width="2.4" stroke-linecap="round"/>
    <rect x="67.8" y="175.5" width="5.4" height="9" rx="2.4" fill="${t.accent}" stroke="${t.hi}" stroke-width="1"/><rect x="86.8" y="175.5" width="5.4" height="9" rx="2.4" fill="${t.accent}" stroke="${t.hi}" stroke-width="1"/></g>`}
    <rect x="35" y="186" width="90" height="10.5" rx="5.2" fill="#161824" stroke="#000" stroke-opacity=".35" stroke-width=".8"/>
    <rect x="37" y="190" width="86" height="2.6" rx="1.3" fill="${t.accent}" fill-opacity=".95"/>
    <rect x="72" y="184.5" width="16" height="13" rx="3.2" fill="#2d3142" stroke="${t.accent}" stroke-width="1"/>
    <rect x="76" y="188" width="8" height="6" rx="1.8" fill="${t.accent}" fill-opacity=".85"/>
    ${mirror('<circle cx="42" cy="143" r="15" fill="url(#suit2)" stroke="#000" stroke-opacity=".35" stroke-width=".9"/><circle cx="42" cy="143" r="15" fill="none" stroke="' + t.accent + '" stroke-opacity=".6" stroke-width="1.5"/><ellipse cx="37" cy="137.5" rx="5.5" ry="3" fill="#fff" fill-opacity=".3" transform="rotate(-30 37 137.5)"/>')}
    <circle cx="42" cy="143" r="15" fill="url(#suit2)" stroke="#000" stroke-opacity=".35" stroke-width=".9"/><circle cx="42" cy="143" r="15" fill="none" stroke="${t.accent}" stroke-opacity=".6" stroke-width="1.5"/><ellipse cx="37" cy="137.5" rx="5.5" ry="3" fill="#fff" fill-opacity=".3" transform="rotate(-30 37 137.5)"/>`;

const motion = (state, mini) => {
    const base = origins({ all: '80px 238px', head: '80px 122px', armL: '42px 143px', armR: '42px 143px', legL: '63px 192px', legR: '63px 192px', glint: '0 0' }, ['shadow', 'led', 'logo', 'tip']);
    const common = kf('glint', { 0: 'transform:translateX(-30px)', 58: 'transform:translateX(-30px)', 82: 'transform:translateX(120px)', 100: 'transform:translateX(120px)' }) + kf('pulse', { 0: 'opacity:1', 50: 'opacity:.4', 100: 'opacity:1' });
    const tip = mini ? play('.tip', 'pulse', 1.4) : '';
    const rules = {
        Standing: `
            ${kf('breathe', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-1.8px)', 100: 'transform:translateY(0)' })}
            ${kf('sway', { 0: 'transform:rotate(-1.4deg)', 50: 'transform:rotate(1.4deg)', 100: 'transform:rotate(-1.4deg)' })}
            ${kf('arms', { 0: 'transform:rotate(1.5deg)', 50: 'transform:rotate(-2.5deg)', 100: 'transform:rotate(1.5deg)' })}
            ${play('.all', 'breathe', 3.4)}${play('.head', 'sway', 5.2)}${play('.armL', 'arms', 3.4)}${play('.armR', 'arms', 3.4, 'reverse')}${play('.glint', 'glint', 6)}${play('.led', 'pulse', 1.8)}${play('.l2', 'pulse', 1.8, '.3s')}${play('.l3', 'pulse', 1.8, '.6s')}${play('.logo', 'pulse', 3)}${play('.shadow', 'pulse', 3.4)}`,
        Dancing: `
            ${kf('hop', { 0: 'transform:translateY(0) scale(1.03,.96)', 45: 'transform:translateY(-11px) scale(.98,1.03)', 100: 'transform:translateY(0) scale(1.03,.96)' })}
            ${kf('nod', { 0: 'transform:rotate(-6deg) translateY(0)', 50: 'transform:rotate(6deg) translateY(3px)', 100: 'transform:rotate(-6deg) translateY(0)' })}
            ${kf('armUp', { 0: 'transform:rotate(140deg)', 25: 'transform:rotate(102deg)', 50: 'transform:rotate(152deg)', 75: 'transform:rotate(112deg)', 100: 'transform:rotate(140deg)' })}
            ${kf('armOut', { 0: 'transform:rotate(62deg)', 25: 'transform:rotate(140deg)', 50: 'transform:rotate(72deg)', 75: 'transform:rotate(132deg)', 100: 'transform:rotate(62deg)' })}
            ${kf('knee', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-9px)', 100: 'transform:translateY(0)' })}
            ${kf('shadowHop', { 0: 'transform:scale(1.04)', 45: 'transform:scale(.8)', 100: 'transform:scale(1.04)' })}
            ${play('.all', 'hop', 0.6)}${play('.head', 'nod', 1.2)}${play('.armL', 'armUp', 1.2)}${play('.armR', 'armOut', 1.2)}${play('.legL', 'knee', 0.6)}${play('.legR', 'knee', 0.6, '.3s')}${play('.glint', 'glint', 1.8)}${play('.led', 'pulse', 0.4)}${play('.l2', 'pulse', 0.4, '.12s')}${play('.l3', 'pulse', 0.4, '.24s')}${play('.logo', 'pulse', 0.6)}${play('.shadow', 'shadowHop', 0.6)}
            ${pose('.armL', 'rotate(140deg)')}${pose('.armR', 'rotate(62deg)')}${pose('.legL', 'translateY(-8px)')}${pose('.head', 'rotate(-5deg)')}`,
        DJing: `
            ${kf('jump', { 0: 'transform:translateY(0) scale(1.05,.94)', 38: 'transform:translateY(-17px) scale(.97,1.04)', 76: 'transform:translateY(0) scale(1.05,.94)', 100: 'transform:translateY(0) scale(1.05,.94)' })}
            ${kf('bob', { 0: 'transform:rotate(-7deg) translateY(0)', 50: 'transform:rotate(7deg) translateY(3px)', 100: 'transform:rotate(-7deg) translateY(0)' })}
            ${kf('pump', { 0: 'transform:rotate(128deg)', 38: 'transform:rotate(166deg)', 76: 'transform:rotate(128deg)', 100: 'transform:rotate(128deg)' })}
            ${kf('kick', { 0: 'transform:translateY(0)', 38: 'transform:translateY(-9px) rotate(6deg)', 76: 'transform:translateY(0)', 100: 'transform:translateY(0)' })}
            ${kf('shadowJump', { 0: 'transform:scale(1.05)', 38: 'transform:scale(.7)', 76: 'transform:scale(1.05)', 100: 'transform:scale(1.05)' })}
            ${play('.all', 'jump', 0.7)}${play('.head', 'bob', 0.7)}${play('.armL', 'pump', 0.7)}${play('.armR', 'pump', 0.7, '.12s')}${play('.legL', 'kick', 0.7)}${play('.legR', 'kick', 0.7, '.12s')}${play('.glint', 'glint', 1.3)}${play('.led', 'pulse', 0.3)}${play('.l2', 'pulse', 0.3, '.1s')}${play('.l3', 'pulse', 0.3, '.2s')}${play('.logo', 'pulse', 0.35)}${play('.shadow', 'shadowJump', 0.7)}
            ${pose('.armL', 'rotate(146deg)')}${pose('.armR', 'rotate(146deg)')}${pose('.legR', 'translateY(-9px)')}${pose('.head', 'rotate(-4deg)')}`,
    };

    return base + common + tip + rules[state];
};

export function astronaut(key, mini, state) {
    const t = THEMES[key];
    const rig = `${leg(t, 'legL')}${mirror(leg(t, 'legR'))}${torso(t, state === 'DJing')}${arm(t, 'armL')}${mirror(arm(t, 'armR'))}`;
    // the mini is slimmer in the body and has a smaller helmet
    const rigWrapped = mini ? `<g transform="translate(80 0) scale(.84 1) translate(-80 0)">${rig}</g>` : rig;
    const headWrapped = mini ? `<g transform="translate(80 122) scale(.86) translate(-80 -122)"><g class="head">${helmet(t, true, state === 'DJing')}</g></g>` : `<g class="head">${helmet(t, false, state === 'DJing')}</g>`;
    const neck = `<ellipse cx="80" cy="122" rx="${mini ? 21 : 25}" ry="7" fill="#161824" stroke="${t.accent}" stroke-opacity=".7" stroke-width="1.3"/>`;

    return picture({
        label: `${t.label}${mini ? ' Mini' : ''} astronaut`,
        state,
        defs: defs(t),
        body: `${shadow()}<g class="all">${rigWrapped}${neck}${headWrapped}</g>`,
        css: motion(state, mini),
    });
}
