/**
 * The names of the room scenes (the colours are in lib/scenes.ts) and a gradient of the same colours for banners. Full class strings so Tailwind keeps them.
 * `null` = the default scene. `host: true` marks a custom scene: only the host of a room sees it in Room settings and can pick it
 * (RoomController::HOST_BACKGROUNDS says the same on the server, and a test checks the two lists agree). `special: true` puts it in the Special group of
 * Room settings: only the Christmas and Halloween ones.
 */
export const backgrounds: Record<string, { label: string; className: string; host?: boolean; special?: boolean }> = {
    midnight: { label: 'Midnight', className: 'bg-linear-to-b from-indigo-950 via-black to-black' },
    sunset: { label: 'Sunset', className: 'bg-linear-to-b from-orange-900 via-fuchsia-950 to-black' },
    neon: { label: 'Neon', className: 'bg-linear-to-b from-fuchsia-900 via-violet-950 to-black' },
    forest: { label: 'Forest', className: 'bg-linear-to-b from-emerald-900 via-green-950 to-black' },
    club: { label: 'Club', className: 'bg-linear-to-b from-red-950 via-purple-950 to-black' },
    halloween: { label: 'Halloween', className: 'bg-linear-to-b from-orange-950 via-purple-950 to-black', host: true, special: true },
    halloween2: { label: 'Halloween V2', className: 'bg-linear-to-b from-purple-950 via-green-950 to-black', host: true, special: true },
    christmas: { label: 'Christmas', className: 'bg-linear-to-b from-sky-950 via-blue-950 to-black', host: true, special: true },
    christmas2: { label: 'Christmas V2', className: 'bg-linear-to-b from-red-950 via-amber-900 to-stone-950', host: true, special: true },
    winter: { label: 'Winter', className: 'bg-linear-to-b from-indigo-900 via-pink-900 to-slate-950', host: true },
    spring: { label: 'Spring', className: 'bg-linear-to-b from-sky-500 via-emerald-700 to-black', host: true },
    easter: { label: 'Easter', className: 'bg-linear-to-b from-sky-300 via-pink-200 to-lime-700', host: true },
    summer: { label: 'Summer', className: 'bg-linear-to-b from-cyan-500 via-amber-600 to-black', host: true },
    midsummer: { label: 'Midsummer', className: 'bg-linear-to-b from-indigo-950 via-orange-400 to-green-950', host: true },
    synthwave: { label: 'Synthwave', className: 'bg-linear-to-b from-purple-950 via-fuchsia-800 to-black', host: true },
    retrowave: { label: 'Retrowave', className: 'bg-linear-to-b from-violet-900 via-pink-600 to-slate-950', host: true },
    synthwave2: { label: 'Synthwave V2', className: 'bg-linear-to-b from-black via-fuchsia-900 to-orange-500', host: true },
    retrowave2: { label: 'Retrowave V2', className: 'bg-linear-to-b from-violet-950 via-rose-500 to-teal-900', host: true },
    definity: { label: 'Midnight Definity', className: 'bg-linear-to-b from-slate-950 via-indigo-950 to-black', host: true },
    anime: { label: 'Anime', className: 'bg-linear-to-b from-indigo-700 via-pink-400 to-orange-200', host: true },
    latam: { label: 'LATAM', className: 'bg-linear-to-b from-purple-900 via-rose-500 to-amber-400', host: true },
    lightshow: { label: 'Lightshow', className: 'bg-linear-to-b from-black via-violet-950 to-fuchsia-950', host: true },
    cats: { label: 'Cat café', className: 'bg-linear-to-b from-fuchsia-950 via-orange-700 to-amber-900', host: true },
    goldmine: { label: 'Gold Mine', className: 'bg-linear-to-b from-stone-950 via-amber-800 to-yellow-500', host: true },
    skull: { label: 'Skull', className: 'bg-linear-to-b from-black via-red-950 to-red-700', host: true },
    skulls: { label: 'Skulls', className: 'bg-linear-to-b from-stone-950 via-stone-700 to-emerald-900', host: true },
    ultra: { label: 'Ultra Music Festival', className: 'bg-linear-to-b from-indigo-950 via-fuchsia-800 to-cyan-500', host: true },
    foxy: { label: 'Foxy', className: 'bg-linear-to-b from-violet-950 via-orange-600 to-emerald-900', host: true },
    dragon: { label: 'Dragon', className: 'bg-linear-to-b from-indigo-950 via-red-800 to-amber-500', host: true },
    tastycat: { label: 'Tastycat', className: 'bg-linear-to-b from-pink-300 via-rose-200 to-teal-300', host: true },
    tasty: { label: 'Tasty', className: 'bg-linear-to-b from-indigo-950 via-red-900 to-orange-500', host: true },
    monstercat: { label: 'Monstercat', className: 'bg-linear-to-b from-black via-violet-950 to-lime-400', host: true },
    custom: { label: 'Your picture', className: 'bg-linear-to-b from-neutral-800 to-black', host: true },
};

export const backgroundClass = (key: string | null | undefined) => (key && backgrounds[key]?.className) || 'bg-black';
