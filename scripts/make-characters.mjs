// Draws the characters in public/Avatars: for every character one picture per state, each a looping animated SVG.
//   public/Avatars/Standing/<name>.svg   standing still, breathing and blinking (before you press Woot)
//   public/Avatars/Dancing/<name>.svg    dancing (after you press Woot or Grab)
//   public/Avatars/DJing/<name>.svg      the DJ behind the booth, seen from behind (they face the screen)
// Run it with `node scripts/make-characters.mjs`. To add a character, add a line to `characters` below, or drop your own pictures
// (svg, webp, gif or png, named like the character) into the three folders: the shop lists every name found in Standing.
import fs from 'node:fs';
import { writeCharacterPosters } from './character-posters.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'Avatars');
const ink = '#1c1033';

/** One character: names are 2 to 11 letters or digits (the shop keeps "char:<name>" in a 16 character column). */
const characters = {
    foxy: { label: 'Foxy', skin: '#ffe0c2', hair: '#f97316', hairDark: '#c2410c', eyes: '#f59e0b', ears: 'fox', earColor: '#f97316', earTip: '#1c1033', tail: 'fox', tailColor: '#f97316', tailTip: '#fff7ed', cap: '#171717', capAccent: '#39ff14', phones: '#39ff14', hoodie: '#171717', hoodieLight: '#2b2b2b', trim: '#e5e5e5', pants: '#1f2937', shoes: '#f8fafc', laces: '#39ff14', blush: '#fb923c', logo: 'fox' },
    neko: { label: 'Neko', skin: '#ffe4d4', hair: '#a855f7', hairDark: '#7e22ce', eyes: '#22d3ee', ears: 'cat', earColor: '#a855f7', earTip: '#7e22ce', tail: 'cat', tailColor: '#a855f7', tailTip: '#a855f7', cap: null, phones: '#22d3ee', hoodie: '#ec4899', hoodieLight: '#f472b6', trim: '#fdf2f8', pants: '#312e81', shoes: '#fde047', laces: '#ffffff', blush: '#f472b6', logo: 'star' },
    bun: { label: 'Bun', skin: '#fff0e0', hair: '#fbcfe8', hairDark: '#f472b6', eyes: '#fb7185', ears: 'bunny', earColor: '#fbcfe8', earTip: '#f9a8d4', tail: 'puff', tailColor: '#ffffff', tailTip: '#ffffff', cap: null, phones: '#a78bfa', hoodie: '#fde047', hoodieLight: '#fef08a', trim: '#ffffff', pants: '#7c3aed', shoes: '#ffffff', laces: '#a78bfa', blush: '#fb7185', logo: 'heart' },
    robo: { label: 'Robo', skin: '#cbd5e1', hair: null, hairDark: '#64748b', eyes: '#22d3ee', ears: 'antenna', earColor: '#94a3b8', earTip: '#fb7185', tail: null, tailColor: null, tailTip: null, cap: null, phones: '#fb7185', hoodie: '#475569', hoodieLight: '#64748b', trim: '#22d3ee', pants: '#1e293b', shoes: '#94a3b8', laces: '#22d3ee', blush: null, logo: 'bolt', robot: true },
    panda: { label: 'Panda', skin: '#ffe9d6', hair: '#171717', hairDark: '#000000', eyes: '#171717', ears: 'round', earColor: '#171717', earTip: '#171717', tail: 'puff', tailColor: '#171717', tailTip: '#171717', cap: null, phones: '#34d399', hoodie: '#f8fafc', hoodieLight: '#ffffff', trim: '#171717', pants: '#171717', shoes: '#171717', laces: '#34d399', blush: '#fda4af', logo: 'paw' },
    wolfie: { label: 'Wolfie', skin: '#ffe0c8', hair: '#94a3b8', hairDark: '#64748b', eyes: '#38bdf8', ears: 'wolf', earColor: '#94a3b8', earTip: '#1c1033', tail: 'wolf', tailColor: '#94a3b8', tailTip: '#e2e8f0', cap: '#0ea5e9', capAccent: '#f8fafc', phones: '#f43f5e', hoodie: '#0ea5e9', hoodieLight: '#38bdf8', trim: '#f8fafc', pants: '#1e3a8a', shoes: '#f8fafc', laces: '#f43f5e', blush: '#fda4af', logo: 'moon' },
};

const shade = (hex, k) => `#${[1, 3, 5].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 + k)))).toString(16).padStart(2, '0')).join('')}`;

// ---------- the parts, drawn around a 160 x 240 body (head centre (80, 76), shoulders at y 136, feet at y 238) in a 200 x 276 picture, so ears, tails and raised arms have room ----------
const tail = (c) => {
    if (!c.tail) return '';
    const shapes = {
        fox: `<path d="M110 190C150 196 164 150 148 120C146 146 132 160 110 166Z" fill="${c.tailColor}"/><path d="M148 120C156 136 156 150 148 160C142 150 142 134 148 120Z" fill="${c.tailTip}"/>`,
        wolf: `<path d="M110 190C146 200 160 156 146 124C140 150 130 162 110 166Z" fill="${c.tailColor}"/><path d="M146 124C154 140 152 154 144 164C138 152 140 138 146 124Z" fill="${c.tailTip}"/>`,
        cat: `<path d="M110 186C140 190 156 170 150 136C146 128 136 130 140 142C144 160 130 170 110 170Z" fill="${c.tailColor}"/>`,
        puff: `<circle cx="116" cy="188" r="14" fill="${c.tailColor}"/>`,
    };

    return `<g class="tail">${shapes[c.tail]}</g>`;
};

// Seen from behind, Foxy's tail grows from the centre of the lower back.
// Paint it after the hoodie so its base is attached to the back, rather than
// reusing the side silhouette from the front-facing Standing/Dancing poses.
const foxyBackTail = (c) => `<g class="tail tail-back">
    <path d="M75 182C68 195 66 207 74 218C78 224 85 229 90 232C103 221 109 210 102 198C96 190 88 187 85 181Z" fill="${c.tailColor}"/>
    <path d="M74 215L81 210L86 218L93 212L102 216C99 222 95 228 90 232C83 228 77 222 74 215Z" fill="${c.tailTip}"/>
</g>`;

const legs = (c) => `
    <g class="legL"><path d="M66 192V220" stroke="${c.pants}" stroke-width="21"/><path d="M58 230Q66 218 78 228Q80 238 66 238Q54 238 58 230Z" fill="${c.shoes}"/><path d="M60 228Q66 224 74 227" fill="none" stroke="${c.laces}" stroke-width="3"/></g>
    <g class="legR"><path d="M94 192V220" stroke="${c.pants}" stroke-width="21"/><path d="M102 230Q94 218 82 228Q80 238 94 238Q106 238 102 230Z" fill="${c.shoes}"/><path d="M100 228Q94 224 86 227" fill="none" stroke="${c.laces}" stroke-width="3"/></g>`;

const logoMark = (c) => {
    const x = 80, y = 152;
    const marks = {
        fox: `<path d="M${x - 10} ${y - 6}L${x - 8} ${y - 15}L${x - 2} ${y - 9}H${x + 2}L${x + 8} ${y - 15}L${x + 10} ${y - 6}Q${x + 10} ${y + 6} ${x} ${y + 9}Q${x - 10} ${y + 6} ${x - 10} ${y - 6}Z" fill="#fff" stroke="none"/>`,
        star: `<path d="M${x} ${y - 11}l3.2 7 7.6.9-5.6 5.2 1.5 7.5-6.7-3.8-6.7 3.8 1.5-7.5-5.6-5.2 7.6-.9Z" fill="#fff" stroke="none"/>`,
        heart: `<path d="M${x} ${y + 8}C${x - 14} ${y - 2} ${x - 8} ${y - 12} ${x} ${y - 5}C${x + 8} ${y - 12} ${x + 14} ${y - 2} ${x} ${y + 8}Z" fill="#fff" stroke="none"/>`,
        bolt: `<path d="M${x + 3} ${y - 11}L${x - 7} ${y + 2}H${x - 1}L${x - 4} ${y + 11}L${x + 7} ${y - 3}H${x + 1}Z" fill="${c.trim}" stroke="none"/>`,
        paw: `<g fill="#171717" stroke="none"><ellipse cx="${x}" cy="${y + 3}" rx="6" ry="5"/><circle cx="${x - 7}" cy="${y - 5}" r="2.6"/><circle cx="${x - 2.5}" cy="${y - 9}" r="2.6"/><circle cx="${x + 2.5}" cy="${y - 9}" r="2.6"/><circle cx="${x + 7}" cy="${y - 5}" r="2.6"/></g>`,
        moon: `<path d="M${x + 5} ${y - 9}A10 10 0 1 0 ${x + 5} ${y + 9}A8 8 0 1 1 ${x + 5} ${y - 9}Z" fill="#fff" stroke="none"/>`,
    };

    return marks[c.logo] ?? '';
};

const torso = (c) => `
    <path d="M46 138C50 120 110 120 114 138L122 196Q80 208 38 196Z" fill="${c.hoodie}"/>
    <ellipse cx="80" cy="126" rx="33" ry="11" fill="${shade(c.hoodie, -0.25)}"/>
    <path d="M54 170H106L110 192Q80 200 50 192Z" fill="${c.hoodieLight}" opacity=".75" stroke="none"/>
    <path d="M72 128L69 150M88 128L91 150" stroke="${c.trim}" stroke-width="2.6" fill="none"/>
    <circle cx="69" cy="151" r="2.4" fill="${c.trim}" stroke="none"/><circle cx="91" cy="151" r="2.4" fill="${c.trim}" stroke="none"/>
    <g>${logoMark(c)}</g>`;

const arm = (c, side) => {
    const x = side === 'L' ? 50 : 110;
    return `<g class="arm${side}"><path d="M${x} 138V176" stroke="${c.hoodie}" stroke-width="18"/><rect x="${x - 9.5}" y="168" width="19" height="9" rx="4" fill="${c.trim}"/><circle cx="${x}" cy="184" r="9.5" fill="${c.skin}"/></g>`;
};

const ears = (c) => {
    const e = {
        fox: `<g class="earL"><path d="M42 54L38 14L72 38Z" fill="${c.earColor}"/><path d="M47 47L45 26L62 38Z" fill="#ffe4c7" stroke="none"/><path d="M38 14L45 20L40 28Z" fill="${c.earTip}" stroke="none"/></g><g class="earR"><path d="M118 54L122 14L88 38Z" fill="${c.earColor}"/><path d="M113 47L115 26L98 38Z" fill="#ffe4c7" stroke="none"/><path d="M122 14L115 20L120 28Z" fill="${c.earTip}" stroke="none"/></g>`,
        wolf: `<g class="earL"><path d="M40 56L34 10L74 38Z" fill="${c.earColor}"/><path d="M46 48L43 24L63 38Z" fill="#e2e8f0" stroke="none"/><path d="M34 10L42 18L36 28Z" fill="${c.earTip}" stroke="none"/></g><g class="earR"><path d="M120 56L126 10L86 38Z" fill="${c.earColor}"/><path d="M114 48L117 24L97 38Z" fill="#e2e8f0" stroke="none"/><path d="M126 10L118 18L124 28Z" fill="${c.earTip}" stroke="none"/></g>`,
        cat: `<g class="earL"><path d="M40 58L36 18Q44 12 74 36Z" fill="${c.earColor}"/><path d="M46 50L44 28Q50 26 62 38Z" fill="#fbcfe8" stroke="none"/></g><g class="earR"><path d="M120 58L124 18Q116 12 86 36Z" fill="${c.earColor}"/><path d="M114 50L116 28Q110 26 98 38Z" fill="#fbcfe8" stroke="none"/></g>`,
        bunny: `<g class="earL"><ellipse cx="54" cy="14" rx="11" ry="32" transform="rotate(-10 54 30)" fill="${c.earColor}"/><ellipse cx="54" cy="16" rx="5.5" ry="22" transform="rotate(-10 54 30)" fill="${c.earTip}" stroke="none"/></g><g class="earR"><ellipse cx="106" cy="14" rx="11" ry="32" transform="rotate(10 106 30)" fill="${c.earColor}"/><ellipse cx="106" cy="16" rx="5.5" ry="22" transform="rotate(10 106 30)" fill="${c.earTip}" stroke="none"/></g>`,
        round: `<g class="earL"><circle cx="44" cy="42" r="15" fill="${c.earColor}"/></g><g class="earR"><circle cx="116" cy="42" r="15" fill="${c.earColor}"/></g>`,
        antenna: `<g class="earL"><path d="M80 34V10" stroke="${c.earColor}" stroke-width="5"/><circle cx="80" cy="8" r="7" fill="${c.earTip}"/></g>`,
    };

    return e[c.ears] ?? '';
};

// ---------- the DJing picture is seen from behind: the DJ stands behind the booth with their back to us, looking at the screen ----------
/** The ears from behind: the same shapes, without the pink or pale inside. */
const earsBack = (c) => ears(c).replace(/ fill="(#[0-9a-fA-F]{6})" stroke="none"/g, (m, col) => (col.toLowerCase() === String(c.earTip).toLowerCase() ? m : ` fill="${shade(c.earColor, -0.1)}" stroke="none"`));

/** The back of the head: hair all over it (a robot has a plate with vents), and the nape. */
const headBack = (c) => (c.robot
    ? `<g fill="none" stroke="${ink}" stroke-width="3"><path d="M52 70H108M50 82H110M52 94H108"/></g><circle cx="80" cy="108" r="3.4" fill="${c.eyes}" stroke="none" class="led"/>`
    : `<path d="M80 34C76 54 84 74 80 96M60 40C56 60 62 82 58 100M100 40C104 60 98 82 102 100" fill="none" stroke="${c.hairDark}" stroke-width="2.6" stroke-linecap="round" opacity=".7"/><path d="M52 108Q80 130 108 108L102 120Q80 134 58 120Z" fill="${c.hairDark}" stroke="none"/>`);

/** The hoodie from behind: a hood folded down the neck, a seam and the logo big on the back. */
const torsoBack = (c) => `
    <path d="M46 138C50 120 110 120 114 138L122 196Q80 208 38 196Z" fill="${c.hoodie}"/>
    <path d="M50 130C56 116 104 116 110 130C104 144 56 144 50 130Z" fill="${shade(c.hoodie, -0.2)}"/>
    <path d="M80 142V200" stroke="${shade(c.hoodie, -0.3)}" stroke-width="2.4" fill="none"/>
    <path d="M54 176H106L110 194Q80 202 50 194Z" fill="${c.hoodieLight}" opacity=".6" stroke="none"/>
    <g transform="translate(80 163) scale(1.6) translate(-80 -152)">${logoMark(c)}</g>`;

const capFor = (c) => (c.cap ? `<path d="M37 70C36 38 58 28 80 28C102 28 124 38 123 70C108 62 52 62 37 70Z" fill="${c.cap}"/><rect x="60" y="60" width="40" height="9" rx="4.5" fill="${c.capAccent}"/><circle cx="80" cy="29" r="4" fill="${c.capAccent}" stroke="none"/>` : '');

const hairFor = (c) => (c.hair ? `<path d="M36 82C32 46 56 28 80 28C104 28 128 46 124 82C118 66 108 58 98 62C90 52 72 52 64 62C52 58 42 66 36 82Z" fill="${c.hair}"/><path d="M36 82L34 104L44 96ZM124 82L126 104L116 96Z" fill="${c.hair}"/>` : '');

const phones = (c) => `
    <path d="M37 86C32 30 128 30 123 86" fill="none" stroke="${ink}" stroke-width="10"/><path d="M37 86C32 30 128 30 123 86" fill="none" stroke="${c.phones}" stroke-width="5" class="glow"/>
    <rect x="25" y="72" width="17" height="32" rx="8" fill="${c.phones}" class="glow"/><rect x="118" y="72" width="17" height="32" rx="8" fill="${c.phones}" class="glow"/>
    <rect x="30" y="78" width="7" height="20" rx="3.5" fill="${ink}" opacity=".45" stroke="none"/><rect x="123" y="78" width="7" height="20" rx="3.5" fill="${ink}" opacity=".45" stroke="none"/>`;

const eye = (c, x, state) => {
    if (c.robot) return '';
    if (state === 'DJing') return `<path d="M${x - 9} 86Q${x} 74 ${x + 9} 86" fill="none" stroke="${ink}" stroke-width="3.6"/>`;
    return `<g class="blink"><ellipse cx="${x}" cy="85" rx="9" ry="12" fill="#fff"/><ellipse cx="${x}" cy="86" rx="6.6" ry="9.4" fill="${c.eyes}" stroke="none"/><ellipse cx="${x}" cy="87" rx="3.4" ry="5.4" fill="${ink}" stroke="none"/><circle cx="${x + 3}" cy="81" r="2.8" fill="#fff" stroke="none"/><circle cx="${x - 2.5}" cy="90" r="1.4" fill="#fff" stroke="none"/></g>`;
};

const face = (c, state) => {
    if (c.robot) {
        return `<rect x="46" y="68" width="68" height="34" rx="14" fill="#0f172a"/><g class="blink"><rect x="54" y="76" width="18" height="16" rx="7" fill="${c.eyes}" stroke="none"/><rect x="88" y="76" width="18" height="16" rx="7" fill="${c.eyes}" stroke="none"/></g>
            ${state === 'Standing' ? `<path d="M68 110H92" stroke="${ink}" stroke-width="4"/>` : `<rect x="64" y="106" width="32" height="8" rx="3" fill="#0f172a"/><g stroke="none" fill="${c.eyes}"><rect class="led" x="67" y="108" width="4" height="4"/><rect class="led l2" x="74" y="108" width="4" height="4"/><rect class="led l3" x="81" y="108" width="4" height="4"/><rect class="led" x="88" y="108" width="4" height="4"/></g>`}`;
    }

    const mouth = state === 'Standing'
        ? `<path d="M72 104Q80 111 88 104" fill="none" stroke="${ink}" stroke-width="3.4"/>`
        : `<path d="M69 102Q80 118 91 102Q80 107 69 102Z" fill="#7f1d1d"/><path d="M73 107Q80 112 87 107" stroke="#fb7185" stroke-width="3" fill="none" stroke-linecap="round"/>`;

    return `${eye(c, 62, state)}${eye(c, 98, state)}${c.blush ? `<ellipse cx="48" cy="99" rx="7" ry="4.6" fill="${c.blush}" opacity=".55" stroke="none"/><ellipse cx="112" cy="99" rx="7" ry="4.6" fill="${c.blush}" opacity=".55" stroke="none"/>` : ''}${mouth}`;
};

// ---------- how each state moves ----------
const styles = (state) => {
    const base = `
        .all, .headgrp, .tail, .legL, .legR, .earL, .earR, .blink, .armL, .armR, .glow, .led { transform-box: view-box; }
        .blink { transform-box: fill-box; transform-origin: center; }
        .glow { transform-box: fill-box; transform-origin: center; }
        .all { transform-origin: 80px 238px; }
        .headgrp { transform-origin: 80px 118px; }
        .tail { transform-origin: 112px 182px; }
        .earL { transform-origin: 58px 50px; } .earR { transform-origin: 102px 50px; }
        .armL { transform-origin: 50px 138px; } .armR { transform-origin: 110px 138px; }
        .legL { transform-origin: 66px 192px; } .legR { transform-origin: 94px 192px; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
    `;
    const k = {
        Standing: `
            @keyframes breathe { 0%,100% { transform: translateY(0) scale(1,1); } 50% { transform: translateY(-1.5px) scale(1.012,1.018); } }
            @keyframes blink { 0%,90%,100% { transform: scaleY(1); } 94% { transform: scaleY(.08); } }
            @keyframes sway { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(3deg); } }
            @keyframes armSway { 0%,100% { transform: rotate(2deg); } 50% { transform: rotate(-3deg); } }
            @keyframes earTwitch { 0%,86%,100% { transform: rotate(0); } 90% { transform: rotate(-9deg); } 95% { transform: rotate(3deg); } }
            .all { animation: breathe 3.2s ease-in-out infinite; } .blink { animation: blink 4.4s infinite; } .tail { animation: sway 3.6s ease-in-out infinite; }
            .armL { animation: armSway 3.2s ease-in-out infinite; } .armR { animation: armSway 3.2s ease-in-out infinite reverse; }
            .earL { animation: earTwitch 6s infinite; } .earR { animation: earTwitch 6s infinite 2.2s; }`,
        Dancing: `
            @keyframes hop { 0%,100% { transform: translateY(0) scale(1.03,.96); } 45% { transform: translateY(-11px) scale(.98,1.03); } }
            @keyframes hips { 0%,100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
            @keyframes armLd { 0%,100% { transform: rotate(140deg); } 25% { transform: rotate(102deg); } 50% { transform: rotate(152deg); } 75% { transform: rotate(112deg); } }
            @keyframes armRd { 0%,100% { transform: rotate(-62deg); } 25% { transform: rotate(-140deg); } 50% { transform: rotate(-72deg); } 75% { transform: rotate(-132deg); } }
            @keyframes kneeL { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
            @keyframes wag { 0%,100% { transform: rotate(-14deg); } 50% { transform: rotate(16deg); } }
            @keyframes nod { 0%,100% { transform: rotate(-5deg) translateY(0); } 50% { transform: rotate(5deg) translateY(3px); } }
            @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .55; } }
            .all { animation: hop .66s ease-in-out infinite; } .headgrp { animation: nod 1.32s ease-in-out infinite; }
            .armL { animation: armLd 1.32s ease-in-out infinite; } .armR { animation: armRd 1.32s ease-in-out infinite; }
            .legL { animation: kneeL .66s ease-in-out infinite; } .legR { animation: kneeL .66s ease-in-out infinite .33s; }
            .tail { animation: wag .44s ease-in-out infinite; } .glow { animation: pulse .66s ease-in-out infinite; }
            .earL { animation: hips 1.32s ease-in-out infinite; } .earR { animation: hips 1.32s ease-in-out infinite reverse; }
            .led { animation: pulse .33s infinite; } .l2 { animation-delay: .1s; } .l3 { animation-delay: .2s; }
            .armL { transform: rotate(140deg); } .armR { transform: rotate(-62deg); } .legL { transform: translateY(-8px); } .headgrp { transform: rotate(-5deg); } .tail { transform: rotate(12deg); }`,
        DJing: `
            @keyframes pump { 0%,100% { transform: translateY(0) scale(1.02,.97); } 50% { transform: translateY(-9px) scale(.99,1.02); } }
            @keyframes knee { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
            @keyframes fistL { 0%,100% { transform: rotate(128deg); } 50% { transform: rotate(160deg); } }
            @keyframes fistR { 0%,100% { transform: rotate(-160deg); } 50% { transform: rotate(-128deg); } }
            @keyframes bob { 0%,100% { transform: rotate(-6deg) translateY(0); } 50% { transform: rotate(6deg) translateY(4px); } }
            @keyframes wag { 0%,100% { transform: rotate(-12deg); } 50% { transform: rotate(14deg); } }
            @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }
            .all { animation: pump .64s ease-in-out infinite; } .headgrp { animation: bob .64s ease-in-out infinite; }
            .armL { animation: fistL .64s ease-in-out infinite; } .armR { animation: fistR .64s ease-in-out infinite .32s; }
            .legL { animation: knee .64s ease-in-out infinite; } .legR { animation: knee .64s ease-in-out infinite .32s; }
            .tail { animation: wag .4s ease-in-out infinite; } .glow { animation: pulse .32s infinite; }
            .earL, .earR { animation: bob .64s ease-in-out infinite; } .led { animation: pulse .24s infinite; } .l2 { animation-delay: .08s; } .l3 { animation-delay: .16s; }
            .armL { transform: rotate(145deg); } .armR { transform: rotate(-145deg); } .headgrp { transform: rotate(-4deg); } .tail { transform: rotate(10deg); }`,
    };

    return base + k[state];
};

const draw = (name, c, state) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -32 200 276" width="200" height="276" role="img" aria-label="${c.label}, ${state.toLowerCase()}">
<style>${(styles(state) + (state === 'DJing' && name === 'foxy' ? ' .tail-back { transform-origin: 80px 184px; }' : '')).replace(/\s+/g, ' ')}</style>
<ellipse cx="80" cy="236" rx="44" ry="6" fill="#000" opacity=".22"/>
<g stroke="${ink}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">
<g class="all">
${state === 'DJing' && name === 'foxy' ? '' : tail(c)}
${legs(c)}
<g class="torso">${state === 'DJing' ? torsoBack(c) : torso(c)}</g>
${state === 'DJing' && name === 'foxy' ? foxyBackTail(c) : ''}
${arm(c, 'L')}${arm(c, 'R')}
<g class="headgrp">
${state === 'DJing' ? earsBack(c) : ears(c)}
<circle cx="80" cy="76" r="44" fill="${state === 'DJing' && c.hair ? c.hair : c.skin}"/>
${state === 'DJing' ? '' : hairFor(c)}
${capFor(c)}
${phones(c)}
${state === 'DJing' ? headBack(c) : face(c, state)}
</g>
</g>
</g>
</svg>
`;

for (const state of ['Standing', 'Dancing', 'DJing']) {
    fs.mkdirSync(path.join(out, state), { recursive: true });
    for (const [name, c] of Object.entries(characters)) fs.writeFileSync(path.join(out, state, `${name}.svg`), draw(name, c, state));
}

console.log(`wrote ${Object.keys(characters).length * 3} pictures to ${out}`);
writeCharacterPosters();
