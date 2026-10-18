// Veyra: a legendary phoenix dancer with a planted-foot articulated rig.
// The feather fan, long tail and sparks lag behind the body for a natural follow-through.
import { aetherPose } from './aether.mjs';
import { lin, rad, picture } from './kit.mjs';

const COUNT = 60;
const defs = () => [
    lin('shell', [0, 0, 1, 1], [[0, '#fff8df'], [.3, '#ffb454'], [.68, '#e94b49'], [1, '#741f63']]),
    lin('fabric', [0, 0, 1, 1], [[0, '#36245b'], [.45, '#171a40'], [1, '#080b20']]),
    lin('iridescent', [0, 0, 1, 1], [[0, '#fff7cf'], [.34, '#ff924b'], [.7, '#eb438c'], [1, '#7b5bff']]),
    rad('heart', [.42, .3, .67], [[0, '#fff'], [.26, '#fffaac'], [.62, '#ff9852'], [1, '#de3b78']]),
    `<g id="headFront"><path d="M-22-22Q-25-37-15-39L-10-30L-2-51L4-33L17-44L18-28L27-31L21-19Z" fill="url(#iridescent)" stroke="#ffd488" stroke-width="1.2"/><path d="M-24-14Q-20-34 0-34Q20-34 24-14L20 19L0 31L-20 19Z" fill="url(#shell)" stroke="#5b214a" stroke-width="1.5"/><path d="M-21-9Q0-18 21-9L17 9Q0 20-17 9Z" fill="#241637"/><path d="M-19-3Q-9-10-2-4L-8 1L-17 1ZM19-3Q9-10 2-4L8 1L17 1Z" fill="#b2fff0"/><path d="M-12-18L0-23L12-18L0-8Z" fill="url(#heart)"/><path d="M0 1L4 9L0 13L-4 9Z" fill="#ffcb76"/><path d="M-11 18Q0 24 11 18" fill="none" stroke="#fff1c9" stroke-width="1.5"/><path d="M-27-5V9M27-5V9" stroke="#16112c" stroke-width="8" stroke-linecap="round"/><path d="M-28-5V8M28-5V8" stroke="#ffb454" stroke-width="3" stroke-linecap="round"/><path d="M-26-10Q-28-35 0-40Q28-35 26-10" fill="none" stroke="#432047" stroke-width="4"/></g>`,
    `<g id="headBack"><path d="M-22-22Q-25-37-15-39L-10-30L-2-51L4-33L17-44L18-28L27-31L21-19Z" fill="url(#iridescent)" stroke="#ffd488" stroke-width="1.2"/><path d="M-24-14Q-20-34 0-34Q20-34 24-14L20 19L0 31L-20 19Z" fill="url(#shell)" stroke="#5b214a" stroke-width="1.5"/><path d="M-15-19L0-28L15-19L12 16L0 25L-12 16Z" fill="#2a1844"/><path d="M0-20L6-2L0 17L-6-2Z" fill="url(#heart)"/><path d="M-26-10Q-28-35 0-40Q28-35 26-10" fill="none" stroke="#432047" stroke-width="4"/></g>`,
    `<g id="torsoFront"><path d="M-25 0L-13-10L13-10L25 0L21 54L-21 54Z" fill="url(#fabric)" stroke="#11102b" stroke-width="1.6"/><path d="M-25 0L-13-10L-3 2L-14 24L-22 15ZM25 0L13-10L3 2L14 24L22 15Z" fill="url(#shell)"/><path d="M-14 4L0 17L14 4L9 39L0 49L-9 39Z" fill="#35214e" stroke="#ffb46c" stroke-width="1.3"/><path d="M0 13L10 26L0 39L-10 26Z" fill="url(#heart)"/><path d="M-19 43L0 54L19 43M-21 53H21" fill="none" stroke="#fcae75" stroke-width="2"/><path d="M-19 54L-14 65L0 59L14 65L19 54" fill="#3c2557" stroke="#fcae75" stroke-width="1"/></g>`,
    `<g id="torsoBack"><path d="M-25 0L-13-10L13-10L25 0L21 54L-21 54Z" fill="url(#fabric)" stroke="#11102b" stroke-width="1.6"/><path d="M-24 0L-12-8L0 3L12-8L24 0L18 14L0 7L-18 14Z" fill="url(#shell)"/><path d="M0 13Q20 25 0 42Q-20 25 0 13Z" fill="url(#heart)"/><path d="M0 18L6 27L0 36L-6 27Z" fill="#fffbd8"/><path d="M-21 53H21" stroke="#fcae75" stroke-width="2"/></g>`,
].join('');

const f = (v) => v.toFixed(2);

export function veyraPose(state, fraction) {
    const t = fraction * Math.PI * 2;
    const dance = state === 'Dancing';
    const sway = Math.sin(t - .35) * (dance ? 8 : 3);
    const rise = dance ? Math.cos(t * 2) * 2 : Math.sin(t) * .8;
    const cx = 80 + Math.sin(t) * (dance ? 8 : 2);
    const wing = [-2, -1, 0, 1, 2].map((i) => {
        const side = Math.sign(i) || 1;
        const spread = i * 15 + Math.sin(t - .55 + i * .3) * (dance ? 7 : 3);
        const tipX = cx + spread + side * 21;
        const tipY = 136 + Math.abs(i) * 6 + Math.cos(t - .9 + i) * (dance ? 7 : 3);
        return `<path d="M${f(cx + i * 6)} ${f(114 + rise)}Q${f(cx + spread * .7)} ${f(125 - Math.abs(i) * 12)} ${f(tipX)} ${f(tipY)}Q${f(cx + spread * 1.2)} ${f(160 + Math.abs(i) * 8)} ${f(cx + i * 7)} ${f(149 + rise)}Z" fill="url(#iridescent)" stroke="#ffce8e" stroke-width="1" opacity="${i === 0 ? .85 : .96}"/>`;
    }).join('');
    const tails = [-1, 0, 1].map((i) => {
        const lag = Math.sin(t - 1.05 + i * .35) * (dance ? 11 : 4);
        const x = cx + i * 11;
        return `<path d="M${f(x)} ${f(157 + rise)}Q${f(x + i * 12 + lag)} 187 ${f(x + i * 19 + lag * 1.5)} ${f(211 - Math.abs(i) * 8)}Q${f(x + i * 16 + lag)} ${f(188 + Math.abs(i) * 2)} ${f(x - 4)} ${f(162 + rise)}Z" fill="url(#iridescent)" stroke="#ffd28f" stroke-width=".8"/>`;
    }).join('');
    const embers = Array.from({ length: 7 }, (_, i) => {
        const a = t + i * 2.399;
        const x = cx + Math.cos(a) * (37 + i * 3) + sway * .35;
        const y = 77 + i * 19 + Math.sin(a * .7) * 7;
        return `<path d="M${f(x)} ${f(y - 3)}L${f(x + 2)} ${f(y)}L${f(x)} ${f(y + 3)}L${f(x - 2)} ${f(y)}Z" fill="${i % 2 ? '#a7fff1' : '#ffe5a4'}" opacity=".85"/>`;
    }).join('');
    let body = aetherPose(state, fraction);
    body = body.replaceAll('#22d3ee', '#ffb454').replaceAll('#67e8f9', '#ffd38d').replaceAll('#a5f3fc', '#fff1c1').replaceAll('#c4b5fd', '#ef78a7');
    return `<g>${tails}${wing}${body}${embers}</g>`;
}

export function veyra(state, sample = null) {
    const duration = state === 'Dancing' ? 2.4 : state === 'DJing' ? 3.2 : 5;
    const frames = sample === null ? Array.from({ length: COUNT }, (_, i) => `<g class="veyraframe veyraframe${i}" style="animation-delay:${(-duration + i * duration / COUNT).toFixed(6)}s">${veyraPose(state, i / COUNT)}</g>`).join('') : veyraPose(state, sample);
    const css = sample === null ? `.veyraframe{opacity:0;animation:veyradance ${duration}s steps(1,end) infinite}.veyraframe0{opacity:1}@keyframes veyradance{0%{opacity:1}${100 / COUNT}%{opacity:0}100%{opacity:0}}` : '';
    return picture({ label: 'Veyra', state, defs: defs(), body: `<ellipse cx="80" cy="238" rx="46" ry="5" fill="url(#shd)"/>${frames}`, css });
}
