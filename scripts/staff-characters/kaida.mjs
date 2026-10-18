// Kaida: a nine-tailed celestial kitsune. Silks and tails trail the dancer's turns.
import { aetherPose } from './aether.mjs';
import { lin, rad, picture } from './kit.mjs';

const COUNT = 60;
const defs = () => [
    lin('shell', [0, 0, 1, 1], [[0, '#fff5dc'], [.28, '#e9b7ff'], [.62, '#9f6cff'], [1, '#3d236e']]),
    lin('fabric', [0, 0, 1, 1], [[0, '#202750'], [.46, '#121833'], [1, '#090d20']]),
    lin('silk', [0, 0, 1, 1], [[0, '#adfff2'], [.32, '#62e7dd'], [.68, '#9a72ff'], [1, '#ff8acc']]),
    rad('jewel', [.4, .3, .65], [[0, '#fff'], [.25, '#c7fff1'], [.65, '#57e2d1'], [1, '#6740cc']]),
    `<g id="headFront"><path d="M-18-21L-32-53Q-33-58-28-55L-5-37L0-47L6-37L28-55Q33-58 32-53L18-21Z" fill="url(#shell)" stroke="#d8b2ff" stroke-width="1.5"/><path d="M-23-16Q-19-35 0-36Q19-35 23-16L20 17L0 30L-20 17Z" fill="url(#shell)" stroke="#59337f" stroke-width="1.5"/><path d="M-20-9Q0-18 20-9L17 8Q0 19-17 8Z" fill="#1b1534" stroke="#75f7e1" stroke-width="1.1"/><path d="M-18-4L-8-9L-2-5L-9 1L-17 1ZM18-4L8-9L2-5L9 1L17 1Z" fill="#aaffec"/><path d="M-7 8Q0 5 7 8L0 14Z" fill="url(#jewel)"/><path d="M-10 19Q0 24 10 19" fill="none" stroke="#fff0d1" stroke-width="1.5"/><path d="M-26-5V9M26-5V9" stroke="#21163c" stroke-width="8" stroke-linecap="round"/><circle cx="-26" cy="2" r="3" fill="#68f5dc"/><circle cx="26" cy="2" r="3" fill="#68f5dc"/></g>`,
    `<g id="headBack"><path d="M-18-21L-32-53Q-33-58-28-55L-5-37L0-47L6-37L28-55Q33-58 32-53L18-21Z" fill="url(#shell)" stroke="#d8b2ff" stroke-width="1.5"/><path d="M-23-16Q-19-35 0-36Q19-35 23-16L20 17L0 30L-20 17Z" fill="url(#shell)" stroke="#59337f" stroke-width="1.5"/><path d="M-14-18L0-29L14-18L11 15L0 23L-11 15Z" fill="#242044"/><path d="M0-21L7-4L0 15L-7-4Z" fill="url(#jewel)"/><path d="M-26-5V9M26-5V9" stroke="#68f5dc" stroke-width="3" stroke-linecap="round"/></g>`,
    `<g id="torsoFront"><path d="M-25 0L-13-10L13-10L25 0L21 54L-21 54Z" fill="url(#fabric)" stroke="#080c20" stroke-width="1.5"/><path d="M-25 0L-13-10L0 3L-12 18L-22 14ZM25 0L13-10L0 3L12 18L22 14Z" fill="url(#silk)"/><path d="M-14 7L0 17L14 7L8 44L0 51L-8 44Z" fill="#282047" stroke="#8bf4df" stroke-width="1.3"/><path d="M0 13L9 25L0 37L-9 25Z" fill="url(#jewel)"/><path d="M-20 38Q0 50 20 38M-20 51H20" fill="none" stroke="#e8caff" stroke-width="1.7"/><path d="M-18 53L-15 66L0 61L15 66L18 53" fill="#252044" stroke="#68f5dc" stroke-width="1"/></g>`,
    `<g id="torsoBack"><path d="M-25 0L-13-10L13-10L25 0L21 54L-21 54Z" fill="url(#fabric)" stroke="#080c20" stroke-width="1.5"/><path d="M-25 0L-13-10L0 3L13-10L25 0L16 14L0 8L-16 14Z" fill="url(#silk)"/><path d="M0 13Q20 26 0 43Q-20 26 0 13Z" fill="url(#jewel)"/><path d="M0 18L6 27L0 36L-6 27Z" fill="#edffeb"/><path d="M-20 51H20" stroke="#8bf4df" stroke-width="1.7"/></g>`,
].join('');

const n = (v) => v.toFixed(2);

export function kaidaPose(state, fraction) {
    const t = fraction * Math.PI * 2;
    const dancing = state === 'Dancing';
    const x = 80 + Math.sin(t) * (dancing ? 8 : 2);
    const sway = Math.sin(t - .55) * (dancing ? 10 : 3);
    const rise = dancing ? Math.cos(t * 2) * 2 : Math.sin(t) * .7;
    // Nine separate ribbon tails have staggered phase and length, like a soft fan following a turn.
    const tails = Array.from({ length: 9 }, (_, i) => {
        const u = i - 4;
        const phase = t - .8 - Math.abs(u) * .09;
        const lag = Math.sin(phase) * (dancing ? 9 + Math.abs(u) : 3);
        const baseX = x + u * 3.7;
        const tipX = x + u * 12 + lag;
        const tipY = 171 + Math.abs(u) * 2 + Math.cos(phase) * (dancing ? 5 : 1.5);
        const width = 5.5 - Math.abs(u) * .55;
        return `<path d="M${n(baseX)} ${n(113 + rise)}Q${n(baseX + u * 3 + lag * .25)} 139 ${n(tipX + width)} ${n(tipY)}Q${n(tipX)} ${n(tipY + 13)} ${n(tipX - width)} ${n(tipY)}Q${n(baseX + u * 2)} 140 ${n(baseX - 2)} ${n(115 + rise)}Z" fill="url(#silk)" stroke="#d5c1ff" stroke-width=".75" opacity="${.72 + (4 - Math.abs(u)) * .055}"/>`;
    }).join('');
    const ribbon = `<path d="M${n(x - 15)} ${n(105 + rise)}Q${n(x - 39 + sway)} 128 ${n(x - 33 + sway)} 150M${n(x + 15)} ${n(105 + rise)}Q${n(x + 41 + sway)} 127 ${n(x + 29 + sway)} 148" fill="none" stroke="url(#silk)" stroke-width="3" stroke-linecap="round" opacity=".85"/>`;
    const motes = Array.from({ length: 8 }, (_, i) => {
        const a = t * .75 + i * Math.PI / 4;
        const px = x + Math.cos(a) * (34 + (i % 3) * 4);
        const py = 78 + i * 16 + Math.sin(a) * 5;
        return `<circle cx="${n(px)}" cy="${n(py)}" r="${i % 2 ? 1.4 : 2.2}" fill="${i % 2 ? '#b5fff0' : '#f2d5ff'}" opacity=".9"/>`;
    }).join('');
    let body = aetherPose(state, fraction)
        .replaceAll('#22d3ee', '#65e7d8').replaceAll('#67e8f9', '#a7fff0')
        .replaceAll('#a5f3fc', '#d9fff0').replaceAll('#c4b5fd', '#c8a5ff');
    return `${tails}${ribbon}${body}${motes}`;
}

export function kaida(state, sample = null) {
    const duration = state === 'Dancing' ? 2.8 : state === 'DJing' ? 3.4 : 5;
    const frames = sample === null
        ? Array.from({ length: COUNT }, (_, i) => `<g class="kaidaframe kaidaframe${i}" style="animation-delay:${(-duration + i * duration / COUNT).toFixed(6)}s">${kaidaPose(state, i / COUNT)}</g>`).join('')
        : kaidaPose(state, sample);
    const css = sample === null ? `.kaidaframe{opacity:0;animation:kaidapose ${duration}s steps(1,end) infinite}.kaidaframe0{opacity:1}@keyframes kaidapose{0%{opacity:1}${100 / COUNT}%{opacity:0}100%{opacity:0}}` : '';
    return picture({ label: 'Kaida', state, defs: defs(), body: `<ellipse cx="80" cy="238" rx="46" ry="5" fill="url(#shd)"/>${frames}`, css });
}
