import { alwaysAnimate } from '@/lib/motion';

/**
 * Characters are whole people in three states, drawn in public/Avatars/Standing, Dancing and DJing (served at /characters/<state>/<name>).
 * They are stored as "char:<name>" in users.avatar. Everybody stands until they press Woot or Grab; the DJ dances on the stage.
 */
export type CharacterState = 'standing' | 'dancing' | 'djing';

/** The pictures are 200 x 276 with the feet at the bottom, so a box of this shape (height first) fits one. */
export const CHARACTER_RATIO = 200 / 276;

/** The name of the character in an avatar string, or null if it is not one. */
export const characterOf = (avatar: string | null | undefined): string | null => (avatar?.startsWith('char:') ? avatar.slice(5) : null);

export const characterUrl = (name: string, state: CharacterState): string => route('characters.show', { state, name, ...(alwaysAnimate() ? { motion: 1 } : {}) });
