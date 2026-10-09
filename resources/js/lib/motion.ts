/**
 * Some computers are set to reduce motion (on Windows: Settings, Accessibility, Visual effects, Animation effects off), and then every animation on the
 * site stands still. "Always play animations" in Settings, Appearance keeps the dancing and the avatars moving anyway: it puts data-motion="always" on
 * the page, and the style sheet and the character pictures (?motion=1) follow it.
 */
export const alwaysAnimate = (): boolean => document.documentElement.dataset.motion === 'always';

export function applyMotion(on: boolean | undefined): void {
    if (on) document.documentElement.dataset.motion = 'always';
    else delete document.documentElement.dataset.motion;
}
