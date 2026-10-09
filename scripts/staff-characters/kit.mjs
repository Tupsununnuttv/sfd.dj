// Shared bits for the staff characters (astronauts, people and the fox): the picture frame, gradients, shadows and the animation CSS.
// Every picture is a looping SVG on a 200 x 276 canvas (viewBox -20 -32 200 276): the body is about 160 x 240 around x = 80, the feet stand on y = 238,
// and there is room above and beside for ears, hair, tails and raised arms. Left parts are drawn once and the right ones are their mirror image.

export const STATES = ['Standing', 'Dancing', 'DJing'];

const VIEWBOX = '-20 -32 200 276';

/** A @keyframes block from { percent: 'css declarations' }. */
export const kf = (name, frames) => `@keyframes ${name}{${Object.entries(frames).map(([p, d]) => `${p}%{${d}}`).join('')}}`;

/** `.sel{animation:...}` with the usual easing and endless loop. */
export const play = (sel, name, seconds, extra = '') => `${sel}{animation:${name} ${seconds}s ease-in-out infinite ${extra}}`;

/** A still pose: where a part is when nothing moves (a computer set to reduce motion keeps this, so the three states differ even then). */
export const pose = (sel, transform) => `${sel}{transform:${transform}}`;

/** transform-origin for each part, in the picture's own coordinates. Parts listed in `boxed` turn around their own middle. */
export const origins = (map, boxed = []) =>
    Object.entries(map).map(([cls, o]) => `.${cls}{transform-box:view-box;transform-origin:${o}}`).join('') +
    boxed.map((cls) => `.${cls}{transform-box:fill-box;transform-origin:center}`).join('');

/** The clause that keeps every picture still when the computer asks for reduced motion. The site's "Always play animations" asks for the picture without it. */
export const REDUCED = '@media (prefers-reduced-motion: reduce){*{animation:none!important}}';

export const lin = (id, [x1, y1, x2, y2], stops, user = false) =>
    `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${user ? ' gradientUnits="userSpaceOnUse"' : ''}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('')}</linearGradient>`;

export const rad = (id, [cx, cy, r], stops, user = false) =>
    `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${user ? ' gradientUnits="userSpaceOnUse"' : ''}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('')}</radialGradient>`;

/** The right-hand copy of a part drawn for the left: the same drawing, turned over around the middle (x = 80). */
export const mirror = (content) => `<g transform="translate(160 0) scale(-1 1)">${content}</g>`;

/** The soft shadow on the floor. */
export const shadowDefs = rad('shd', [0.5, 0.5, 0.5], [[0, '#000', 0.5], [0.6, '#000', 0.22], [1, '#000', 0]]);
export const shadow = (cls = 'shadow') => `<ellipse class="${cls}" cx="80" cy="236" rx="50" ry="8" fill="url(#shd)"/>`;

/** The picture itself. */
export function picture({ label, state, defs, body, css }) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}" width="200" height="276" role="img" aria-label="${label}, ${state.toLowerCase()}">\n<defs>${shadowDefs}${defs}</defs>\n<style>${(css + REDUCED).replace(/\s+/g, ' ')}</style>\n${body}\n</svg>\n`;
}
