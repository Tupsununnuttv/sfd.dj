// Aether: articulated cyber DJ. Deterministic two-bone IK keeps the supporting foot planted.
// Frame poses use real SVG geometry (also renderable offline), not a whole-body scale/bounce.
import { lin, rad, picture } from './kit.mjs';

const N = 48;
const TAU = Math.PI * 2;
const p = ([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`;
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
function joint(a, b, l1, l2, bend = 1) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const distance = Math.max(.01, Math.min(Math.hypot(dx, dy), l1 + l2 - .01));
    const along = (l1 * l1 - l2 * l2 + distance * distance) / (2 * distance);
    const height = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    const angle = Math.atan2(dy, dx);
    return [a[0] + along * Math.cos(angle) - bend * height * Math.sin(angle), a[1] + along * Math.sin(angle) + bend * height * Math.cos(angle)];
}
const line = (a, b, width, color) => `<path d="M${p(a)}L${p(b)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
const circle = (a, r, color) => `<circle cx="${a[0].toFixed(2)}" cy="${a[1].toFixed(2)}" r="${r}" fill="${color}"/>`;

const defs = () => [
    lin('shell', [0, 0, 1, 1], [[0, '#ffffff'], [.35, '#e2e8f0'], [.7, '#94a3b8'], [1, '#334155']]),
    lin('fabric', [0, 0, 1, 1], [[0, '#475569'], [.45, '#1e293b'], [1, '#080f21']]),
    lin('iridescent', [0, 0, 1, 1], [[0, '#a5f3fc'], [.32, '#22d3ee'], [.62, '#818cf8'], [1, '#fb7185']]),
    rad('visor', [.3, .15, .9], [[0, '#164e63'], [.5, '#0f172a'], [1, '#020617']]),
    `<g id="headFront"><path d="M-25-4L-20-27Q0-41 20-27L25-4L19 21L0 30L-19 21Z" fill="url(#shell)" stroke="#0f172a" stroke-width="1.6"/><path d="M-21-16Q0-24 21-16L19 9Q0 23-19 9Z" fill="url(#visor)" stroke="#334155" stroke-width="1.6"/><path d="M-17-5L-7-7L-2-3M3-3L9-7L17-5" fill="none" stroke="#a5f3fc" stroke-width="2.4" stroke-linecap="round"/><path d="M-18-16L-11-18L3 12L-3 14Z" fill="#fff" opacity=".12"/><path d="M-13 18L0 24L13 18" fill="none" stroke="#38bdf8" stroke-width="1.5"/><path d="M-28-8V10M28-8V10" stroke="#0f172a" stroke-width="9" stroke-linecap="round"/><path d="M-28-6V6M28-6V6" stroke="#22d3ee" stroke-width="3" stroke-linecap="round"/><path d="M-27-13Q-27-36 0-38Q27-36 27-13" fill="none" stroke="#0f172a" stroke-width="5"/><path d="M-21-28Q0-42 21-28" fill="none" stroke="#c4b5fd" stroke-width="1.6"/></g>`,
    `<g id="headBack"><path d="M-25-4L-20-27Q0-41 20-27L25-4L19 21L0 30L-19 21Z" fill="url(#shell)" stroke="#0f172a" stroke-width="1.6"/><path d="M-17-19Q0-30 17-19L14 10L0 17L-14 10Z" fill="url(#fabric)"/><path d="M-10-13H10M-10-6H10M-10 1H10" stroke="#64748b" stroke-width="2"/><path d="M-13 20L0 25L13 20" fill="none" stroke="#22d3ee" stroke-width="2"/><path d="M-27-12Q-27-35 0-37Q27-35 27-12" fill="none" stroke="#0f172a" stroke-width="5"/><path d="M-27-7V9M27-7V9" stroke="#a5f3fc" stroke-width="4" stroke-linecap="round"/></g>`,
    `<g id="torsoFront"><path d="M-25 0L-13-10L13-10L25 0L21 54L-21 54Z" fill="url(#fabric)" stroke="#020617" stroke-width="1.5"/><path d="M-25 0L-13-10L-3 5L-6 44L-21 48Z" fill="url(#shell)"/><path d="M13-10L25 0L21 54L4 50L3 6Z" fill="url(#shell)"/><path d="M-14-8L0 9L14-8" fill="none" stroke="#f8fafc" stroke-width="4"/><path d="M0 12V50" stroke="#64748b" stroke-width="2"/><path d="M-22 8L-18 37M19 8L17 37" stroke="#22d3ee" stroke-width="2"/><path d="M7 16H18V26H7Z" fill="#0f172a"/><path d="M9 19H16M9 23H14" stroke="#fda4af" stroke-width="1.2"/><path d="M-21 52Q0 59 21 52" fill="none" stroke="#020617" stroke-width="7"/><path d="M-12 40L-5 39M8 41L17 43" stroke="#475569" stroke-width="2"/></g>`,
    `<g id="torsoBack"><path d="M-25 0L-13-10L13-10L25 0L21 54L-21 54Z" fill="url(#shell)" stroke="#0f172a" stroke-width="1.5"/><path d="M-16 4L0-2L16 4L12 41L0 49L-12 41Z" fill="url(#fabric)"/><path d="M0 9L-9 30H-4L0 20L4 30H9Z" fill="url(#iridescent)"/><text x="0" y="39" text-anchor="middle" fill="#a5f3fc" font-family="sans-serif" font-size="5" letter-spacing="1.1">AETHER</text><path d="M-20 5L-18 40M20 5L18 40" stroke="#22d3ee" stroke-width="2"/><path d="M-21 52Q0 59 21 52" fill="none" stroke="#0f172a" stroke-width="7"/></g>`,
].join('');

export function aetherPose(state, fraction) {
    const t = fraction * TAU, dance = state === 'Dancing', dj = state === 'DJing';
    const sway = Math.sin(t), beat = Math.cos(t * 2);
    const hip = [80 + sway * (dance ? 8 : dj ? 3 : 1), 158 + (dance ? 3 * beat : dj ? 1.5 * beat : Math.sin(t) * .7)];
    const chest = add(hip, [dance ? -sway * 4 : 0, -55]);
    const lean = dance ? -sway * 4 : dj ? sway * 2 : sway;
    const leftFoot = [60 + (dance ? Math.max(0, sway) * 5 : 0), 229 - (dance ? Math.max(0, sway) * 7 : 0)];
    const rightFoot = [101 - (dance ? Math.max(0, -sway) * 5 : 0), 229 - (dance ? Math.max(0, -sway) * 7 : 0)];
    const legs = [leftFoot, rightFoot].map((foot, i) => {
        const h = add(hip, [i ? 12 : -12, 0]);
        const knee = joint(h, foot, 37, 37, i ? -1 : 1);
        return `${line(h, knee, 19, '#0b1224')}${line(h, knee, 14, 'url(#fabric)')}${line(knee, foot, 15, '#111827')}${line(knee, foot, 10, '#334155')}${circle(knee, 8, '#475569')}${line(add(knee, [-4, -1]), add(knee, [4, 1]), 2, '#a5f3fc')}<g transform="translate(${p(foot)})"><path d="M-9-5H8L12 4L12 8H-13L-14 4Z" fill="url(#shell)" stroke="#0f172a" stroke-width="1.4"/><path d="M-11 6H10" stroke="#22d3ee" stroke-width="2"/><path d="M-5-2H5M-4 1H6" stroke="#64748b" stroke-width="1"/></g>`;
    }).join('');
    const hands = dance ? [[chest[0] - 39 + Math.sin(t + .5) * 10, chest[1] + 25 - Math.sin(t) * 24], [chest[0] + 39 + Math.sin(t + 1) * 9, chest[1] + 25 + Math.sin(t) * 24]] : dj ? [[chest[0] - 32 + Math.sin(t * 2) * 7, chest[1] + 34], [chest[0] + 36 + Math.sin(t) * 6, chest[1] + 20 + Math.cos(t) * 8]] : [[chest[0] - 29, chest[1] + 51], [chest[0] + 30, chest[1] + 50]];
    const arms = hands.map((hand, i) => {
        const shoulder = add(chest, [i ? 25 : -25, 1]);
        const elbow = joint(shoulder, hand, 29, 28, i ? -1 : 1);
        return `${line(shoulder, elbow, 17, '#0f172a')}${line(shoulder, elbow, 13, 'url(#shell)')}${line(elbow, hand, 13, '#0f172a')}${line(elbow, hand, 9, 'url(#fabric)')}${circle(elbow, 5.5, '#334155')}${line(add(shoulder, [0, 5]), add(elbow, [0, -3]), 1.5, '#67e8f9')}<g transform="translate(${p(hand)}) rotate(${dance ? sway * 15 : dj ? 50 : 0})"><rect x="-6" y="-4" width="12" height="14" rx="5" fill="url(#shell)" stroke="#0f172a" stroke-width="1"/><path d="M-3 1V6M0 1V7M3 1V6" stroke="#475569" stroke-width=".8"/></g>`;
    }).join('');
    const scarf = `<path d="M${p(add(chest, [13, -9]))}Q${p(add(chest, [46 + Math.sin(t - .6) * 8, 11]))} ${p(add(chest, [39 + Math.sin(t - 1) * 12, 52]))}L${p(add(chest, [48 + Math.sin(t - 1) * 12, 61]))}Q${p(add(chest, [61 + Math.sin(t - .6) * 8, 5]))} ${p(add(chest, [18, -13]))}Z" fill="url(#iridescent)" opacity=".7" stroke="#a5f3fc" stroke-width=".8"/>`;
    const head = add(chest, [dance ? sway * 1.5 : 0, -42 + Math.sin(t * 2 - .4) * (dance ? 1.7 : .5)]);
    return `<g data-pose="${state.toLowerCase()}">${scarf}${legs}<g transform="translate(${p(chest)}) rotate(${lean.toFixed(2)})"><use href="#${dj ? 'torsoBack' : 'torsoFront'}"/></g>${arms}<path d="M${p(add(chest, [-9, -11]))}L${p(add(chest, [9, -11]))}" stroke="#0f172a" stroke-width="12"/><g transform="translate(${p(head)}) rotate(${(-lean * .6).toFixed(2)})"><use href="#${dj ? 'headBack' : 'headFront'}"/></g></g>`;
}

export function aether(state, sample = null) {
    const duration = state === 'Standing' ? 4.8 : state === 'Dancing' ? 2 : 2.8;
    const css = `.pose{opacity:0;animation:pose ${duration}s steps(1,end) infinite}.pose0{opacity:1}@keyframes pose{0%{opacity:1}${100 / N}%{opacity:0}100%{opacity:0}}`;
    const frames = sample === null ? Array.from({ length: N }, (_, i) => `<g class="pose pose${i}" style="animation-delay:${(-duration + i * duration / N).toFixed(6)}s">${aetherPose(state, i / N)}</g>`).join('') : aetherPose(state, sample);
    return picture({ label: 'Aether', state, defs: defs(), body: `<ellipse cx="80" cy="238" rx="43" ry="5" fill="url(#shd)"/>${frames}`, css: sample === null ? css : '' });
}
