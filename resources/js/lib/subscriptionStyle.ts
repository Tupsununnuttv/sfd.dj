import type { Cosmetics, SubscriptionAppearance } from '@/lib/cosmetics';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import type { ScenePalette } from '@/lib/scenes';

export function useSubscriptionStyle(cosmetics?: Cosmetics | null): SubscriptionAppearance | null {
    const style = cosmetics?.subscription;
    const expires = typeof style?.expires_at === 'string' ? Date.parse(style.expires_at) : Infinity;
    const [revision, render] = useState(0);
    useEffect(() => {
        if (!Number.isFinite(expires) || expires <= Date.now()) return;
        const timer = window.setTimeout(() => render((value) => value + 1), Math.min(expires - Date.now() + 20, 2147483647));
        return () => window.clearTimeout(timer);
    }, [expires, revision]);
    return expires <= Date.now() ? null : style ?? null;
}

export const perk = (style: SubscriptionAppearance | null | undefined, key: string): string => typeof style?.expires_at === 'string' && Date.parse(style.expires_at) <= Date.now() ? '' : typeof style?.[key] === 'string' ? style[key] as string : '';
const palettes: Record<string, [string, string]> = { silver: ['#cbd5e1', '#818cf8'], ocean: ['#22d3ee', '#6366f1'], sunset: ['#fb923c', '#f472b6'], candy: ['#e879f9', '#22d3ee'], forest: ['#34d399', '#a3e635'] };
export function subscriptionVars(style?: SubscriptionAppearance | null): CSSProperties {
    const palette = palettes[perk(style, 'palette')];
    return { '--sub-accent': perk(style, 'accent') || palette?.[0] || style?.color || '#a78bfa', '--sub-secondary': perk(style, 'secondary') || palette?.[1] || '#e879f9', '--sub-bg': perk(style, 'background') || '#111827' } as CSSProperties;
}
export function profileVars(cosmetics?: Cosmetics | null): CSSProperties {
    const style = cosmetics?.subscription;
    return { ...subscriptionVars(style), ...(style ? { backgroundColor: perk(style, 'background') || undefined, backgroundImage: perk(style, 'image') ? `linear-gradient(#0008,#0009), url("${perk(style, 'image')}")` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' } : {}) };
}

export function subscriptionScenePalette(style?: SubscriptionAppearance | null): ScenePalette | null {
    const theme = perk(style, 'theme');
    if (!theme) return null;
    const colors: Record<string, [string, string, string]> = {
        midnight: ['#080c20', '#818cf8', '#c4b5fd'], ocean: ['#042635', '#22d3ee', '#38bdf8'],
        sunset: ['#2d1025', '#fb923c', '#f472b6'], forest: ['#06251b', '#34d399', '#a3e635'],
        cosmic: ['#1b1035', '#c084fc', '#f472b6'],
        custom: [perk(style, 'background') || '#101828', perk(style, 'accent') || style?.color || '#a78bfa', perk(style, 'secondary') || '#e879f9'],
    };
    const [base, accent, secondary] = colors[theme] ?? colors.midnight;
    return { wallTop: '#030712', wallBottom: base, floorTop: base, floorBottom: '#030712', accent, accent2: secondary, glow: accent };
}
