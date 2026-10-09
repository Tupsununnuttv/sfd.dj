/** The levels go from 1 to 100. */
export const MAX_LEVEL = 100;

/** XP at the start of a level (20 * (level - 1)^2: the same curve the server uses). */
export const xpFor = (level: number) => 20 * (level - 1) ** 2;

/** XP at the start of a level and at the start of the next one. At the top level there is no next one: both are the start of level 100. */
export const levelSpan = (level: number): [number, number] => (level >= MAX_LEVEL ? [xpFor(MAX_LEVEL), xpFor(MAX_LEVEL)] : [xpFor(level), xpFor(level + 1)]);

/** How far you are through your level, 0 to 100. At the top level the bar is full. */
export const levelPercent = (xp: number, level: number) => {
    if (level >= MAX_LEVEL) return 100;
    const [from, to] = levelSpan(level);

    return Math.max(0, Math.min(100, ((xp - from) / Math.max(1, to - from)) * 100));
};

/** "1,234 / 1,620 XP"; at the top level just "MAX". */
export const xpText = (xp: number, level: number) => (level >= MAX_LEVEL ? 'MAX' : `${xp.toLocaleString()} / ${levelSpan(level)[1].toLocaleString()} XP`);

/** "386 XP to level 13"; at the top level "Max level". */
export const toNextText = (xp: number, level: number) => (level >= MAX_LEVEL ? 'Max level' : `${Math.max(0, levelSpan(level)[1] - xp).toLocaleString()} XP to level ${level + 1}`);
