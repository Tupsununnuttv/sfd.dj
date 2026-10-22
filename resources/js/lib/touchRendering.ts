import { useSyncExternalStore } from 'react';

let pointer: MediaQueryList | null = null;
const query = () => pointer ??= window.matchMedia('(any-pointer: coarse)');

/** Device capability, not viewport width: phones/tablets can request a desktop-sized page. */
export function needsTouchRendering(): boolean {
    if (typeof window === 'undefined') return false;
    if (query().matches) return true;
    // iPad desktop mode can identify itself as a Mac, including with a trackpad connected.
    return navigator.maxTouchPoints > 0 && (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.platform === 'MacIntel');
}

const subscribe = (changed: () => void) => {
    const media = query();
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
};

export const useTouchRendering = () => useSyncExternalStore(subscribe, needsTouchRendering, () => false);
