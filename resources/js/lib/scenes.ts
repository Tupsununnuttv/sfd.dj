/**
 * The room scene is drawn on one fixed 1600 x 900 canvas and the whole canvas is scaled to fit the window.
 * Everything below is in canvas pixels: the screen with the video, the 300 x 150 DJ booth, the DJ behind it, the Woot / Grab / Meh cards to
 * the right of the booth, the Join / Leave Waitlist card to the left of it, and the spots where the crowd dances.
 */
export const SCENE = {
    w: 1600,
    h: 900,
    booth: { x: 650, y: 690, w: 300, h: 150 }, // the booth at the bottom of the room, against the footbar. Everything that belongs to it (the DJ, the cards) is set from its top, so move it here and they come along. On a taller canvas it moves down with the bottom edge
    screen: { x: 508, y: 8, w: 584, h: 328 }, // the video: right under the navbar (the frame around it starts above the top edge)
    floor: 628, // where the wall ends and the dance floor begins
    dj: { x: 800, y: 775, size: 100 }, // the DJ: the middle of their picture. A bigger y puts the DJ lower, a smaller one higher (on a taller canvas it moves down with the booth)
    stage: { x: 690, dy: -105, w: 220, h: 290 }, // where nobody in the crowd stands: `dy` from the top of the booth
    votes: { x: 982, dy: 16, w: 332 }, // Woot, Grab and Meh: three cards in a row, `dy` below the top of the booth
    join: { right: 618, dy: 16, w: 196 }, // Join / Leave Waitlist: one card, its right edge next to the booth, `dy` below the top of the booth
    crowdSize: 64,
    people: { crowd: 140, dj: 190 }, // a character is a whole person: how tall its picture is in the crowd (crowd) and on the stage (dj)
};

/** The colours of a room's scene: the wall, the floor and the lights. A room picks one by name in Room settings; none is the default violet. */
export interface ScenePalette {
    wallTop: string;
    wallBottom: string;
    floorTop: string;
    floorBottom: string;
    accent: string; // neon signs, the light strip on the booth
    accent2: string; // the second light colour
    glow: string; // the haze behind the screen
    theme?: 'halloween' | 'halloween2' | 'christmas' | 'christmas2' | 'winter' | 'spring' | 'easter' | 'summer' | 'midsummer' | 'synthwave' | 'retrowave' | 'synthwave2' | 'retrowave2' | 'definity' | 'anime' | 'latam' | 'lightshow' | 'cats' | 'goldmine' | 'celestial' | 'skull' | 'skulls' | 'ultra' | 'foxy' | 'dragon' | 'tastycat' | 'tasty' | 'monstercat' | 'custom'; // a scenery of its own (Components/scene/Halloween.tsx, Christmas.tsx, Winter.tsx, Spring.tsx, Summer.tsx, Synthwave.tsx, Retrowave.tsx); none is the club
}

export const palettes: Record<string, ScenePalette> = {
    default: { wallTop: '#0b0620', wallBottom: '#24114f', floorTop: '#1d1240', floorBottom: '#08040f', accent: '#d946ef', accent2: '#38bdf8', glow: '#8b5cf6' },
    midnight: { wallTop: '#050b24', wallBottom: '#16296a', floorTop: '#0f1f55', floorBottom: '#040813', accent: '#60a5fa', accent2: '#22d3ee', glow: '#3b82f6' },
    sunset: { wallTop: '#2a0a2e', wallBottom: '#8a2a4a', floorTop: '#5a1a3a', floorBottom: '#12040c', accent: '#fb923c', accent2: '#f472b6', glow: '#f97316' },
    neon: { wallTop: '#12031f', wallBottom: '#4a0f6e', floorTop: '#2d0a4a', floorBottom: '#0a0212', accent: '#f0abfc', accent2: '#22d3ee', glow: '#d946ef' },
    forest: { wallTop: '#03160f', wallBottom: '#0f4a35', floorTop: '#0a3326', floorBottom: '#020b07', accent: '#34d399', accent2: '#a3e635', glow: '#10b981' },
    club: { wallTop: '#1a0508', wallBottom: '#5a0f2a', floorTop: '#3a0a22', floorBottom: '#0d0206', accent: '#f43f5e', accent2: '#a855f7', glow: '#e11d48' },
    halloween: { wallTop: '#05021a', wallBottom: '#3a1248', floorTop: '#1a1026', floorBottom: '#07030c', accent: '#ff7a1a', accent2: '#a855f7', glow: '#ff6a00', theme: 'halloween' },
    halloween2: { wallTop: '#0d0618', wallBottom: '#2a0f3d', floorTop: '#2a1a33', floorBottom: '#0a050f', accent: '#84cc16', accent2: '#a855f7', glow: '#65a30d', theme: 'halloween2' },
    christmas: { wallTop: '#020716', wallBottom: '#17628a', floorTop: '#123a63', floorBottom: '#06111f', accent: '#ef4444', accent2: '#22c55e', glow: '#fbbf24', theme: 'christmas' },
    christmas2: { wallTop: '#1e0709', wallBottom: '#5a171c', floorTop: '#6a3b1f', floorBottom: '#1a0c06', accent: '#ef4444', accent2: '#fbbf24', glow: '#dc2626', theme: 'christmas2' },
    winter: { wallTop: '#2c2f7a', wallBottom: '#c7689f', floorTop: '#3a5fa0', floorBottom: '#0f1f45', accent: '#7dd3fc', accent2: '#c4b5fd', glow: '#fda4af', theme: 'winter' },
    spring: { wallTop: '#5eb7f0', wallBottom: '#fdf2d0', floorTop: '#4f9a4a', floorBottom: '#1f5a2c', accent: '#f472b6', accent2: '#a3e635', glow: '#fde68a', theme: 'spring' },
    easter: { wallTop: '#9fd8f5', wallBottom: '#ffe4ef', floorTop: '#86c96a', floorBottom: '#3f7d3a', accent: '#f472b6', accent2: '#a78bfa', glow: '#fde68a', theme: 'easter' },
    summer: { wallTop: '#1e88e5', wallBottom: '#ffe9b0', floorTop: '#a8703c', floorBottom: '#4a2e18', accent: '#fb923c', accent2: '#22d3ee', glow: '#fde047', theme: 'summer' },
    midsummer: { wallTop: '#14204a', wallBottom: '#f59e7a', floorTop: '#3b5a2a', floorBottom: '#0f1d0e', accent: '#fbbf24', accent2: '#60a5fa', glow: '#fb923c', theme: 'midsummer' },
    synthwave: { wallTop: '#0b0220', wallBottom: '#5b1a8f', floorTop: '#240b45', floorBottom: '#07020f', accent: '#ff2fd0', accent2: '#22d3ee', glow: '#d946ef', theme: 'synthwave' },
    retrowave: { wallTop: '#1a0b3d', wallBottom: '#ff5d8f', floorTop: '#0f2a4a', floorBottom: '#050b1a', accent: '#ff6ac1', accent2: '#2de2c8', glow: '#ffb454', theme: 'retrowave' },
    synthwave2: { wallTop: '#04000f', wallBottom: '#ff3d7f', floorTop: '#2a0a52', floorBottom: '#06010f', accent: '#ff2fd0', accent2: '#22d3ee', glow: '#ff7ab8', theme: 'synthwave2' },
    retrowave2: { wallTop: '#0f0530', wallBottom: '#ff6b5c', floorTop: '#10284a', floorBottom: '#040a18', accent: '#ff6ac1', accent2: '#2de2c8', glow: '#ffb85c', theme: 'retrowave2' },
    definity: { wallTop: '#01020a', wallBottom: '#2a2f8a', floorTop: '#0b1030', floorBottom: '#02030a', accent: '#a78bfa', accent2: '#22d3ee', glow: '#6366f1', theme: 'definity' },
    anime: { wallTop: '#1b2a6b', wallBottom: '#ff8fa3', floorTop: '#4a3f86', floorBottom: '#15103a', accent: '#ff7aa8', accent2: '#a5f3fc', glow: '#ffb7d5', theme: 'anime' },
    latam: { wallTop: '#2a1060', wallBottom: '#ff9a3c', floorTop: '#5a2a3a', floorBottom: '#1a0a14', accent: '#ff5d8f', accent2: '#22b8cf', glow: '#ffd43b', theme: 'latam' },
    lightshow: { wallTop: '#03030a', wallBottom: '#12082a', floorTop: '#0d0a24', floorBottom: '#03030a', accent: '#ff2fd0', accent2: '#22d3ee', glow: '#a78bfa', theme: 'lightshow' },
    cats: { wallTop: '#5b3a5a', wallBottom: '#e6a06a', floorTop: '#7a4a2a', floorBottom: '#3a1f10', accent: '#fb923c', accent2: '#f472b6', glow: '#fcd34d', theme: 'cats' },
    goldmine: { wallTop: '#150b06', wallBottom: '#6a4526', floorTop: '#5a3a1e', floorBottom: '#1c1008', accent: '#fbbf24', accent2: '#f97316', glow: '#ffb454', theme: 'goldmine' },
    celestial: { wallTop: '#030615', wallBottom: '#19204a', floorTop: '#202b42', floorBottom: '#050914', accent: '#7fe7df', accent2: '#b7a5ed', glow: '#67cbd9', theme: 'celestial' },
    skull: { wallTop: '#05000b', wallBottom: '#4a0a1c', floorTop: '#1a0608', floorBottom: '#050102', accent: '#ef4444', accent2: '#f97316', glow: '#ff3a2a', theme: 'skull' },
    skulls: { wallTop: '#0b0806', wallBottom: '#3a2a1a', floorTop: '#2a2018', floorBottom: '#0a0705', accent: '#f59e0b', accent2: '#4ade80', glow: '#7cffa0', theme: 'skulls' },
    ultra: { wallTop: '#01020c', wallBottom: '#3a1a8a', floorTop: '#0c0b2e', floorBottom: '#03030c', accent: '#22d3ee', accent2: '#e879f9', glow: '#818cf8', theme: 'ultra' },
    foxy: { wallTop: '#12082e', wallBottom: '#c0481c', floorTop: '#2a4a30', floorBottom: '#0a1610', accent: '#f97316', accent2: '#9dff4a', glow: '#ffb347', theme: 'foxy' },
    dragon: { wallTop: '#04060f', wallBottom: '#8a3a4a', floorTop: '#2a1a30', floorBottom: '#07040c', accent: '#fcbf49', accent2: '#dc2626', glow: '#ff6a3a', theme: 'dragon' },
    tastycat: { wallTop: '#ffb3d4', wallBottom: '#ffe6f0', floorTop: '#ffd1e3', floorBottom: '#b5527f', accent: '#ff5fa2', accent2: '#4fe0c0', glow: '#ffc2dd', theme: 'tastycat' },
    tasty: { wallTop: '#0b0e2a', wallBottom: '#4a1830', floorTop: '#3a2316', floorBottom: '#0d0705', accent: '#ff6b2c', accent2: '#ffd23f', glow: '#ff9a3c', theme: 'tasty' },
    monstercat: { wallTop: '#02010a', wallBottom: '#24104a', floorTop: '#0d0a22', floorBottom: '#020208', accent: '#7cff4f', accent2: '#a855f7', glow: '#5bff9a', theme: 'monstercat' },
    custom: { wallTop: '#0b0b14', wallBottom: '#1a1a2e', floorTop: '#14142a', floorBottom: '#05050c', accent: '#a78bfa', accent2: '#38bdf8', glow: '#8b5cf6', theme: 'custom' },
};

export const paletteOf = (key: string | null | undefined): ScenePalette => palettes[key ?? ''] ?? palettes.default;

const VANISH_Y = 330; // the lines of the floor meet at (800, 330)

/** Where the floor's lines run: column `i` at height `y`. */
export const floorLineX = (i: number, y: number) => 800 + i * 130 * ((y - VANISH_Y) / (900 - VANISH_Y));

/** The floor's cross lines get further apart towards the viewer, for as long as the floor goes on. */
export const floorRowY = (j: number) => SCENE.floor + (900 - SCENE.floor) * (j / 6) ** 1.7;

/** A floor tile in perspective, column `i`, row `j`, as the points of a polygon. */
export const floorTile = (i: number, j: number) => {
    const y0 = floorRowY(j);
    const y1 = floorRowY(j + 1);

    return `${floorLineX(i, y0)},${y0} ${floorLineX(i + 1, y0)},${y0} ${floorLineX(i + 1, y1)},${y1} ${floorLineX(i, y1)},${y1}`;
};

/**
 * Where people stand (the middle of each avatar), in rows above the stage, the spots nearest the DJ first. `offset` is how far the stage has moved down
 * because the canvas is taller than 900: there are more rows, as there is more room above it.
 */
export const crowdSlots = (offset: number): [number, number][] => {
    const { booth, votes, stage, join } = SCENE;
    const half = SCENE.crowdSize / 2;
    const top = booth.y + offset;
    const all: [number, number][] = [];

    for (let n = 0, y = top - 52; y >= 548; n++, y -= 58) for (let k = 0; k < 13 - (n % 2); k++) all.push([(n % 2 ? 149 : 90) + k * 118, y]);

    // nobody stands in the booth or where the DJ stands, nor under the buttons (the cards grow with a small window, but the spots above them stay free)
    const hits = (x: number, y: number, box: { x: number; y: number; w: number; h: number }) => x + half > box.x && x - half < box.x + box.w && y + half > box.y && y - half < box.y + box.h;
    const boxes = [
        { ...booth, y: top },
        { ...stage, y: top + stage.dy },
        { x: votes.x - 6, y: top + votes.dy - 8, w: 310, h: 182 },
        { x: join.right - join.w - 6, y: top + join.dy - 8, w: join.w + 12, h: 182 },
    ];

    return all.filter(([x, y]) => !boxes.some((b) => hits(x, y, b))).sort((a, b) => Math.hypot((a[0] - 800) * 0.55, a[1] - (top - 30)) - Math.hypot((b[0] - 800) * 0.55, b[1] - (top - 30)));
};
