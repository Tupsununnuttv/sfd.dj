import Avatar from '@/Components/Avatar';
import SceneBackdrop from '@/Components/scene/Backdrop';
import { BoothFront, DjBody } from '@/Components/scene/DjBooth';
import Snow from '@/Components/scene/Snow';
import { CHARACTER_RATIO, characterOf, characterUrl, DEFAULT_CHARACTER } from '@/lib/characters';
import { Cosmetics } from '@/lib/cosmetics';
import { crowdSlots, paletteOf, SCENE } from '@/lib/scenes';
import { RoleInfo } from '@/types';
import { CSSProperties, ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

export interface Dancer {
    id: number;
    name: string;
    avatar: string | null;
    character?: string | null;
    cosmetics?: Cosmetics | null;
    role: RoleInfo;
    badges?: RoleInfo[];
    level?: number;
}

const DANCES = ['dance-bounce', 'dance-sway', 'dance-hop', 'dance-wiggle'];

/**
 * The room as a place: a club on a 1600 x 900 canvas that is scaled to fit the window. The video plays on the big screen, the DJ dances in front
 * of the 300 x 150 booth, Woot / Grab / Meh sit to the right of the booth, Join / Leave Waitlist to the left of it, and everybody else stands on the floor until they press Woot or Grab:
 * then they dance. A character (avatar "char:<name>") is a whole person with a picture for each of Standing, Dancing and DJing.
 * Text and buttons are kept readable when the canvas is scaled down: `--s` is the canvas scale and `--f` how much of it they follow.
 */
export default function RoomScene({ background, image = null, users, dj, dancing, playing, myId, screen, votes, waitlist, seat, onUser }: {
    background: string | null;
    image?: string | null; // the host's own picture, when the background is "custom"
    users: Dancer[];
    dj: Dancer | null; // whoever is playing now: stands in front of the booth, and always dances while the song plays
    dancing: ReadonlySet<number>; // who has pressed Woot or Grab on this song
    playing: boolean;
    myId: number;
    screen: ReactNode;
    votes: ReactNode;
    waitlist: ReactNode; // the Join / Leave Waitlist card, to the left of the booth
    seat: ReactNode; // the button on the front of the booth while nobody is playing
    onUser: (user: Dancer, anchor: DOMRect) => void;
}) {
    const palette = paletteOf(background);
    const wrap = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.6);
    const [height, setHeight] = useState<number>(SCENE.h); // the canvas is 900 tall, or taller when the window is: the floor just goes on
    const [width, setWidth] = useState<number>(SCENE.w); // how wide the room is on the screen
    const [djHover, setDjHover] = useState(false);

    useLayoutEffect(() => {
        const el = wrap.current;
        if (!el) return;
        const fit = () => {
            const box = el.getBoundingClientRect();
            const s = Math.min(1.25, Math.max(0.42, Math.min(box.width / SCENE.w, box.height / SCENE.h)));
            setScale(s);
            setWidth(box.width);
            setHeight(Math.round(Math.min(1320, Math.max(SCENE.h, box.height / s))));
        };
        fit();
        const watch = new ResizeObserver(fit);
        watch.observe(el);

        return () => watch.disconnect();
    }, []);

    const { booth, screen: tv, votes: ballot, join, dj: stand, people } = SCENE;
    const half = SCENE.crowdSize / 2;
    const crowdW = people.crowd * CHARACTER_RATIO;
    const djW = people.dj * CHARACTER_RATIO;
    const personOf = (user: Dancer) => characterOf(user.character) ?? characterOf(user.avatar) ?? DEFAULT_CHARACTER;
    const djPerson = dj ? personOf(dj) : null;

    // The pictures for dancing and for the stage load before anybody needs them, so a press on Woot changes the pose at once.
    const names = [...new Set([...users, ...(dj ? [dj] : [])].map(personOf))].sort().join(',');
    useEffect(() => {
        for (const name of names ? names.split(',') : []) for (const state of ['dancing', 'djing'] as const) new Image().src = characterUrl(name, state);
    }, [names]);

    // Everybody keeps their spot while others come and go: a newcomer takes the free spot nearest the booth.
    const spots = useRef(new Map<number, string>());
    const crowd = users.filter((u) => u.id !== dj?.id);
    const off = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas: on a taller one it moves down with it
    const slots = useMemo(() => crowdSlots(off), [off]);
    const slotOf = useMemo(() => {
        const key = (s: [number, number]) => `${s[0]},${s[1]}`;
        const taken = spots.current;
        const valid = new Map(slots.map((s) => [key(s), s]));
        const here = new Set(crowd.map((u) => u.id));
        for (const [id, at] of [...taken]) if (!here.has(id) || !valid.has(at)) taken.delete(id);
        const used = new Set(taken.values());
        for (const u of crowd) {
            if (taken.has(u.id)) continue;
            const free = slots.find((s) => !used.has(key(s)));
            if (free) {
                taken.set(u.id, key(free));
                used.add(key(free));
            }
        }

        return new Map([...taken].map(([id, at]) => [id, valid.get(at)!]));
    }, [crowd.map((u) => u.id).join(','), slots]);
    const placed = crowd.filter((u) => slotOf.has(u.id)).map((u) => ({ u, x: slotOf.get(u.id)![0], y: slotOf.get(u.id)![1] }));
    const extra = crowd.length - placed.length;

    const f = Math.min(1.6, 1 / scale); // buttons and name tags follow the canvas only part of the way down, so they stay easy to use
    // the three cards grow the same way, but never past the right edge of what can be seen (in a narrow window the canvas is wider than the room)
    const seenRight = SCENE.w / 2 + width / 2 / scale;
    const fv = Math.max(0.7, Math.min(f, (seenRight - 12 - ballot.x) / ballot.w));
    // the Waitlist card grows from its right edge, the one next to the booth, and stops at the left edge of what can be seen
    const seenLeft = SCENE.w / 2 - width / 2 / scale;
    const fj = Math.max(0.7, Math.min(f, (join.right - 12 - seenLeft) / join.w));

    return (
        <div
            ref={wrap}
            className="sfd-stage relative min-h-0 flex-1 overflow-hidden"
            // the wall, the floor and then more dark floor continue past the scene's edges, so a window of any shape looks like one room
            style={{ background: `linear-gradient(to bottom, ${palette.wallTop} 0, ${palette.wallBottom} ${SCENE.floor * scale}px, ${palette.floorTop} ${SCENE.floor * scale}px, ${palette.floorBottom} ${height * scale}px, ${palette.floorBottom})` }}
        >
            <div
                className={`absolute left-1/2 top-0 ${playing ? 'sc-live' : ''}`}
                style={{ width: SCENE.w, height, transform: `translateX(-50%) scale(${scale})`, transformOrigin: 'top center', '--s': scale, '--f': f } as CSSProperties}
            >
                <SceneBackdrop palette={palette} image={image} live={playing} height={height} className="absolute inset-0 h-full w-full" />

                <div className="absolute z-5 overflow-hidden rounded-md bg-neutral-950" style={{ left: tv.x, top: tv.y, width: tv.w, height: tv.h }}>{screen}</div>

                {/* the crowd: nearer the front, drawn later. Everybody stands until they press Woot or Grab. */}
                {placed.map(({ u, x, y }) => {
                    const person = personOf(u);
                    const moving = playing && dancing.has(u.id);

                    return (
                        <button
                            key={u.id}
                            onClick={(e) => onUser(u, e.currentTarget.getBoundingClientRect())}
                            aria-label={`${u.name}: quick profile`}
                            className="group absolute"
                            style={{ left: x - half, top: y - half, width: SCENE.crowdSize, height: SCENE.crowdSize, zIndex: 100 + Math.round(y / 8) }}
                        >
                            {person ? (
                                // a whole person, the feet on this spot
                                <img
                                    src={characterUrl(person, moving ? 'dancing' : 'standing')}
                                    alt=""
                                    draggable={false}
                                    className="absolute left-1/2 max-w-none -translate-x-1/2 object-contain object-bottom"
                                    style={{ bottom: -2, width: crowdW, height: people.crowd }}
                                />
                            ) : (
                                <>
                                    <span className="absolute -bottom-1 left-1/2 h-3 w-14 -translate-x-1/2 rounded-full bg-black/50 blur-[3px]" />
                                    <span
                                        className={`relative block ${moving ? DANCES[u.id % DANCES.length] : ''}`}
                                        style={{ animationDuration: `${0.56 + (u.id % 5) * 0.07}s`, animationDelay: `-${(u.id % 7) * 0.11}s` }}
                                    >
                                        <Avatar name={u.name} avatar={u.avatar} cosmetics={u.cosmetics} className="h-16 w-16 text-3xl" />
                                    </span>
                                </>
                            )}
                            <span
                                className={`pointer-events-none absolute left-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold leading-4 shadow ${u.id === myId ? 'bg-violet-600 text-white' : 'bg-black/80 text-neutral-100 opacity-0 transition-opacity group-hover:opacity-100'}`}
                                style={{ top: person ? 66 - people.crowd + 18 : -8, transform: `translateX(-50%) translateY(-100%) scale(${f})`, transformOrigin: 'bottom center', color: u.id === myId ? undefined : u.role.color }}
                            >
                                {u.id === myId ? 'You' : u.name}
                            </span>
                        </button>
                    );
                })}
                {(palette.theme === 'christmas' || palette.theme === 'winter') && <Snow />}
                {(palette.theme === 'spring' || palette.theme === 'anime') && <Snow petals />}
                {palette.theme === 'foxy' && <Snow variant="leaves" />}
                {palette.theme === 'dragon' && <Snow variant="embers" />}
                {palette.theme === 'tastycat' && <Snow variant="sprinkles" />}
                {palette.theme === 'christmas2' && <Snow variant="glitter" />}
                {palette.theme === 'halloween2' && <Snow variant="wisps" />}
                {palette.theme === 'easter' && <Snow variant="pastel" />}
                {palette.theme === 'midsummer' && <Snow variant="fireflies" />}
                {extra > 0 && (
                    <div className="absolute z-480 flex items-center justify-center rounded-full bg-black/60 text-sm font-bold text-neutral-100 ring-1 ring-white/20" style={{ left: 1480, top: 560, width: 56, height: 56 }}>
                        <span style={{ transform: `scale(${f})` }}>+{extra}</span>
                    </div>
                )}

                {/* the booth is at the bottom, against the footbar; the DJ stands in front of the decks with their back to us (looking at the screen), the crowd stands above */}
                <BoothFront p={palette} className={`absolute z-12 ${playing ? 'sc-live' : ''}`} style={{ left: booth.x, top: booth.y + off }} />
                {!dj && (
                    <div className="absolute z-13" style={{ left: booth.x + booth.w / 2 - 70, top: booth.y + off + 72, width: 140, transform: `scale(${f})`, transformOrigin: 'top center' }}>{seat}</div>
                )}
                {dj && (
                    <>
                        <div className="pointer-events-none absolute z-9" style={{ left: stand.x - 190, top: stand.y + off - 200, width: 380, height: 380, background: 'radial-gradient(closest-side, rgba(255,255,255,0.26), rgba(255,255,255,0))' }} />
                        <div
                            className="absolute z-14"
                            onMouseEnter={() => setDjHover(true)}
                            onMouseLeave={() => setDjHover(false)}
                            style={djPerson ? { left: stand.x - djW / 2, top: stand.y - people.dj / 2 + off, width: djW, height: people.dj } : { left: stand.x - 120, top: stand.y + off - 60, width: 240, height: 170 }}
                        >
                            {djPerson ? (
                                // a character on the stage: the DJing picture, which shows them from behind (they stand at the decks, between the turntables, and look at the screen)
                                <button onClick={(e) => onUser(dj, e.currentTarget.getBoundingClientRect())} aria-label={`${dj.name}: quick profile`} className="block h-full w-full">
                                    <img src={characterUrl(djPerson, 'djing')} alt="" draggable={false} className="h-full w-full max-w-none object-contain object-bottom" />
                                </button>
                            ) : (
                                <div className={`relative h-full w-full ${playing ? 'dance-dj sc-live' : ''}`}>
                                    <DjBody p={palette} className="absolute inset-0" />
                                    <button
                                        onClick={(e) => onUser(dj, e.currentTarget.getBoundingClientRect())}
                                        aria-label={`${dj.name}: quick profile`}
                                        className="absolute"
                                        style={{ left: 120 - stand.size / 2, top: 60 - stand.size / 2, width: stand.size, height: stand.size }}
                                    >
                                        <Avatar name={dj.name} avatar={dj.avatar} cosmetics={{ ...dj.cosmetics, accessory: undefined }} className="h-25 w-25 text-5xl" />
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* the name shows above the head, only while the mouse is on the DJ, and above the crowd standing round */}
                        <span
                            className={`pointer-events-none absolute z-490 whitespace-nowrap rounded-full bg-black/80 px-2.5 py-0.5 text-xs font-bold leading-4 shadow ring-1 ring-white/20 transition-opacity ${djHover ? 'opacity-100' : 'opacity-0'}`}
                            style={{ left: stand.x, top: (djPerson ? stand.y - people.dj / 2 : stand.y - 60) + off - 4, transform: `translateX(-50%) translateY(-100%) scale(${f})`, transformOrigin: 'bottom center', color: dj.role.color }}
                        >
                            {dj.name}
                        </span>
                    </>
                )}
                {/* Join or Leave Waitlist, to the left of the booth */}
                <div className="absolute z-500" style={{ left: join.right - join.w, top: booth.y + join.dy + off, width: join.w, transform: `scale(${fj})`, transformOrigin: 'top right' }}>{waitlist}</div>
                {/* Woot, Grab and Meh, to the right of the booth */}
                <div className="absolute z-500" style={{ left: ballot.x, top: booth.y + ballot.dy + off, width: ballot.w, transform: `scale(${fv})`, transformOrigin: 'top left' }}>{votes}</div>
            </div>
        </div>
    );
}
