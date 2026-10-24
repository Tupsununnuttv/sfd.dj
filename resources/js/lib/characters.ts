import { alwaysAnimate } from '@/lib/motion';
import animations from '@/lib/characterAnimations.json';
import posters from '@/lib/characterPosters.json';
import djPosters from '@/lib/characterDjPosters.json';
import { getSystemRendering } from '@/lib/systemPreferences';

/**
 * Characters are whole people in three states, drawn in public/Avatars/Standing, Dancing and DJing (served at /characters/<state>/<name>).
 * They are stored as "char:<name>" in users.avatar. Everybody stands until they press Woot or Grab; the DJ dances on the stage.
 */
export type CharacterState = 'standing' | 'dancing' | 'djing';
export const DEFAULT_CHARACTER = 'foxy';

/** The pictures are 200 x 276 with the feet at the bottom, so a box of this shape (height first) fits one. */
export const CHARACTER_RATIO = 200 / 276;

/** Match imported GIF canvases so a portrait box does not shrink their figures. */
const WIDE_DRAGONS = new Set(['dragone01', 'dragone02', 'dragone03', 'dragone04']);
const IMPORTED_GIFS = new Set(['admin01', 'admin02', 'admin03', 'admin04', 'admin05', 'admin06', 'admin07', 'admin08', 'admin09', 'ba01', 'ba02', 'ba03', 'ba04', '2014hw07']);
export const characterRatio = (name: string, state: CharacterState): number => {
    if (WIDE_DRAGONS.has(name)) return state === 'djing' ? 340 / 220 : 440 / 220;
    if (IMPORTED_GIFS.has(name)) {
        if (state === 'djing') return 170 / 220;
        const canvasHeight = name === 'admin09' ? 217 : name === 'ba02' ? 218 : 220;
        return 220 / canvasHeight;
    }
    return CHARACTER_RATIO;
};

/** The name of the character in an avatar string, or null if it is not one. */
export const characterOf = (avatar: string | null | undefined): string | null => (avatar?.startsWith('char:') ? avatar.slice(5) : null);

export const characterUrl = (name: string, state: CharacterState): string => {
    if (!getSystemRendering().animated_characters) {
        const still = ((state === 'djing' ? djPosters : posters) as Record<string, string>)[name];
        if (still) return still;
    }
    const motion = alwaysAnimate();
    const animation = (animations as Record<string, Partial<Record<CharacterState, string>>>)[name]?.[state];
    // SVG remains the reduced-motion version; the explicit animation preference still wins.
    if (animation && (motion || !window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return animation;
    return route('characters.show', { state, name, ...(motion ? { motion: 1 } : {}) });
};
