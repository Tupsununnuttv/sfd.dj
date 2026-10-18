// Solstice: Legendary astral guardian. Uses the articulated, foot-planted performance rig.
// Costume, face, crown, mantle and orbiting light are original to this character.
import { aetherPose } from './aether.mjs';
import { lin, rad, picture } from './kit.mjs';

const COUNT = 72;
const gold = '#fcd34d';
const edge = '#422006';
const defs = () => [
    lin('shell', [0, 0, 1, 1], [[0, '#fff7ce'], [.25, '#fcd34d'], [.55, '#a16207'], [.8, '#fde68a'], [1, '#713f12']]),
    lin('fabric', [0, 0, 1, 1], [[0, '#475569'], [.35, '#1e1b4b'], [.75, '#0f1029'], [1, '#020617']]),
    lin('iridescent', [0, 0, 1, 1], [[0, '#fef3c7'], [.4, '#fbbf24'], [1, '#c084fc']]),
    rad('core', [.4, .3, .65], [[0, '#fff'], [.2, '#fef3c7'], [.55, '#fbbf24'], [1, '#7c2d12']]),
    lin('cape', [0, 0, 1, 1], [[0, '#7c3aed'], [.4, '#312e81'], [.8, '#0f172a'], [1, '#6d28d9']]),
    `<g id="headFront"><path d="M-21-21L-29-42L-11-30L0-46L11-30L29-42L21-21Z" fill="url(#shell)" stroke="${edge}" stroke-width="1.3"/><path d="M-25-9L-20-27Q0-37 20-27L25-9L19 18L0 32L-19 18Z" fill="url(#fabric)" stroke="${gold}" stroke-width="1.6"/><path d="M-23-16L-11-24L-5-13L-12 5L-19 10ZM23-16L11-24L5-13L12 5L19 10Z" fill="url(#shell)"/><path d="M-15-8L-6-5M6-5L15-8" stroke="#fef3c7" stroke-width="2.8" stroke-linecap="round"/><path d="M0-24L5-16L0-8L-5-16Z" fill="url(#core)" stroke="#fff7ce" stroke-width=".7"/><path d="M-8 13L0 22L8 13M0-4V8" fill="none" stroke="${gold}" stroke-width="1.4"/><path d="M-22 10L-15 21L0 31L15 21L22 10" fill="none" stroke="#fde68a" stroke-width="2"/><path d="M-28-7V8M28-7V8" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/><path d="M-28-5V5M28-5V5" stroke="${gold}" stroke-width="3"/><path d="M-26-14Q-28-37 0-39Q28-37 26-14" fill="none" stroke="#a16207" stroke-width="3"/></g>`,
    `<g id="headBack"><path d="M-21-21L-29-42L-11-30L0-46L11-30L29-42L21-21Z" fill="url(#shell)" stroke="${edge}" stroke-width="1.3"/><path d="M-25-9L-20-27Q0-37 20-27L25-9L19 18L0 32L-19 18Z" fill="url(#fabric)" stroke="${gold}" stroke-width="1.6"/><path d="M-19-21L-11-25L-8 16L0 25L8 16L11-25L19-21L16 21L0 32L-16 21Z" fill="url(#shell)"/><circle cy="-3" r="10" fill="#0f172a" stroke="${gold}"/><path d="M0-11L3-3L0 5L-3-3Z" fill="#fef3c7"/><path d="M-28-5V5M28-5V5" stroke="${gold}" stroke-width="4" stroke-linecap="round"/></g>`,
    `<g id="torsoFront"><path d="M-25 0L-13-10L13-10L25 0L21 54L-21 54Z" fill="url(#fabric)" stroke="#020617" stroke-width="1.6"/><path d="M-25 0L-13-10L0 1L13-10L25 0L16 10L0 5L-16 10Z" fill="url(#shell)" stroke="${edge}"/><path d="M-24 4L-12 14L-16 40L-22 45M24 4L12 14L16 40L22 45" fill="none" stroke="${gold}" stroke-width="2"/><path d="M0 8L12 23L0 39L-12 23Z" fill="url(#shell)" stroke="${edge}"/><path d="M0 13L7 23L0 33L-7 23Z" fill="url(#core)"/><path d="M-11 41L0 47L11 41M-20 50H20" fill="none" stroke="${gold}" stroke-width="2"/><path d="M-20 53L-15 75L-4 64V54M20 53L15 75L4 64V54" fill="url(#fabric)" stroke="#a16207" stroke-width="1"/></g>`,
    `<g id="torsoBack"><path d="M-25 0L-13-10L13-10L25 0L21 54L-21 54Z" fill="url(#fabric)" stroke="${edge}" stroke-width="1.5"/><path d="M-25 0L-13-10L0 1L13-10L25 0L16 10L0 5L-16 10Z" fill="url(#shell)"/><circle cy="26" r="16" fill="#17132f" stroke="${gold}" stroke-width="1.3"/><circle cy="26" r="11" fill="none" stroke="#a16207"/><path d="M0 10L4 22L16 26L4 30L0 42L-4 30L-16 26L-4 22Z" fill="url(#shell)"/><path d="M-20 50H20" stroke="${gold}" stroke-width="2"/><path d="M-20 53L-15 75L-4 64V54M20 53L15 75L4 64V54" fill="url(#fabric)" stroke="#a16207" stroke-width="1"/></g>`,
].join('');

export function solsticePose(state, fraction) {
    const t = fraction * Math.PI * 2;
    const dancing = state === 'Dancing';
    const x = 80 + Math.sin(t) * (dancing ? 8 : state === 'DJing' ? 3 : 1);
    const lift = dancing ? Math.cos(t * 2) * 3 : Math.sin(t) * .7;
    const drift = Math.sin(t - .8) * (dancing ? 9 : 4);
    const mantle = `<path d="M${x - 23} ${103 + lift}Q${x - 43 + drift} 145 ${x - 48 + drift} 211L${x - 22 + drift / 2} 198L${x - 9} 132L${x + 9} 132L${x + 22 + drift / 2} 198L${x + 48 + drift} 211Q${x + 43 + drift} 145 ${x + 23} ${103 + lift}Z" fill="url(#cape)" stroke="#a78bfa" stroke-width="1.2"/><path d="M${x - 26} 116Q${x - 35 + drift} 160 ${x - 44 + drift} 203M${x + 26} 116Q${x + 35 + drift} 160 ${x + 44 + drift} 203" fill="none" stroke="#fcd34d" stroke-width="1.1" opacity=".8"/>`;
    const stars = [[-28, 149], [30, 163], [-32, 181], [35, 190]].map(([dx, y], i) => `<path d="M${x + dx + drift / 2} ${y - 3}V${y + 3}M${x + dx + drift / 2 - 3} ${y}H${x + dx + drift / 2 + 3}" stroke="${i % 2 ? '#e9d5ff' : '#fde68a'}" stroke-width="1"/>`).join('');
    const orbit = `<g transform="translate(${x} ${49 + lift}) rotate(${Math.sin(t - .3) * 9})"><ellipse rx="42" ry="10" fill="none" stroke="#a16207" stroke-width="2.3"/><ellipse rx="42" ry="10" fill="none" stroke="#fde68a" stroke-width=".7"/><circle cx="${Math.cos(t) * 42}" cy="${Math.sin(t) * 10}" r="2.7" fill="#fff7ce"/></g>`;
    let body = aetherPose(state, fraction);
    // Match the limb rig's materials to the bespoke armour, keeping the joint geometry.
    body = body.replaceAll('#22d3ee', '#fcd34d').replaceAll('#67e8f9', '#fde68a').replaceAll('#a5f3fc', '#fff7ce').replaceAll('#c4b5fd', '#fbbf24');
    return `${mantle}${stars}${orbit}${body}`;
}

export function solstice(state, sample = null) {
    const duration = state === 'Standing' ? 5.4 : state === 'Dancing' ? 3 : 3.6;
    const frames = sample === null ? Array.from({ length: COUNT }, (_, i) => `<g class="solframe solframe${i}" style="animation-delay:${(-duration + i * duration / COUNT).toFixed(6)}s">${solsticePose(state, i / COUNT)}</g>`).join('') : solsticePose(state, sample);
    const css = sample === null ? `.solframe{opacity:0;animation:solpose ${duration}s steps(1,end) infinite}.solframe0{opacity:1}@keyframes solpose{0%{opacity:1}${100 / COUNT}%{opacity:0}100%{opacity:0}}` : '';
    return picture({ label: 'Solstice', state, defs: defs(), body: `<ellipse cx="80" cy="238" rx="47" ry="5" fill="url(#shd)"/>${frames}`, css });
}
