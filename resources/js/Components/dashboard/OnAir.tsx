import Avatar from '@/Components/Avatar';
import { NowPlaying, RoomSummary } from '@/Components/RoomCard';
import { Equalizer, SectionTitle } from '@/Components/ui';
import { LIVE_SITES, LiveInfo } from '@/lib/live';
import { alwaysAnimate } from '@/lib/motion';
import { Link } from '@inertiajs/react';
import { Flame, Headphones, Plus, Search, Shuffle, Sparkles } from 'lucide-react';
import { ReactNode, useEffect, useId, useState, useSyncExternalStore } from 'react';

/** A room that is on air: the song that plays there (or its live stream) and how many listen. */
export interface OnAirRoom {
    room: RoomSummary;
    song: NowPlaying | null;
    listening: number;
}

// One clock for every song timer on the page: each second only the timers redraw, not the whole Dashboard.
let now = Date.now();
const ticks = new Set<() => void>();
let timer: number | undefined;
const subscribe = (tick: () => void) => {
    ticks.add(tick);
    timer ??= window.setInterval(() => { now = Date.now(); ticks.forEach((t) => t()); }, 1000);
    return () => {
        ticks.delete(tick);
        if (!ticks.size && timer !== undefined) { window.clearInterval(timer); timer = undefined; }
    };
};
const useNow = () => useSyncExternalStore(subscribe, () => now);

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

/** Things may move: the computer does not ask for less motion, or "Always play animations" is on. */
export const motionAllowed = () => alwaysAnimate() || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const youtube = (url: string) => url.includes('i.ytimg.com/');
/** A sharper picture: YouTube's 480px one instead of the 320px one (every video has it), SoundCloud's 500px cover. */
const sharper = (url: string) => (youtube(url) ? url.replace(/\/(?:mq|sd|maxres)?default(_live)?\.jpg/, '/hqdefault$1.jpg') : url.replace('-large.', '-t500x500.'));

/** The song's picture, sharper. YouTube's 480px picture has black bands above and below a wide video: `crop` zooms past them. */
function Art({ src, className = '', crop = true }: { src: string; className?: string; crop?: boolean }) {
    const [failed, setFailed] = useState<string | null>(null);
    const url = failed === src ? src : sharper(src);

    return <img src={url} alt="" draggable={false} onError={() => setFailed(src)} className={`${className} ${crop && youtube(url) && url.includes('/hqdefault') ? 'scale-[1.34]' : ''}`} />;
}

const pictureOf = (entry: OnAirRoom) => entry.room.live?.thumbnail ?? entry.song?.thumbnail ?? null;

/** How far the song is, counting on each second from what the server said when the page got it. Nothing while a live stream holds the queue. */
export function SongTime({ song, received, compact = false }: { song: NowPlaying; received: number; compact?: boolean }) {
    const at = useNow();
    if (song.elapsed == null) return null;
    const duration = song.duration ?? 0;
    const elapsed = song.elapsed + Math.max(0, (at - received) / 1000);
    const shown = duration > 0 ? Math.min(duration, elapsed) : elapsed;

    return (
        <div>
            <div className={`overflow-hidden rounded-full bg-white/15 ${compact ? 'h-1' : 'h-1.5'}`}>
                <div className="h-full rounded-full bg-linear-to-r from-fuchsia-400 to-violet-400 motion-safe:transition-[width] motion-safe:duration-1000 motion-safe:ease-linear" style={{ width: duration > 0 ? `${(shown / duration) * 100}%` : '100%', opacity: duration > 0 ? 1 : 0.35 }} />
            </div>
            {!compact && (
                <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-neutral-300">
                    <span>{clock(shown)}</span>
                    <span>{duration > 0 ? `-${clock(duration - shown)}` : clock(shown)}</span>
                </div>
            )}
        </div>
    );
}

/** The song's sleeve with its record half out. The record turns while motion is allowed; still, it is a record on a sleeve. */
function Record({ picture, spinning }: { picture: string | null; spinning: boolean }) {
    return (
        <div className="relative mr-12 aspect-square w-36 shrink-0 sm:mr-16 sm:w-48 lg:mr-20 lg:w-56">
            <div className="absolute inset-[5%] translate-x-[38%]">
                <div className={`vinyl-grooves relative h-full w-full rounded-full shadow-2xl shadow-black/70 ${spinning ? 'animate-vinyl' : ''}`}>
                    <div className="vinyl-sheen absolute inset-0 rounded-full" />
                    <div className="absolute inset-[32%] overflow-hidden rounded-full ring-4 ring-black/70">
                        {picture ? <Art src={picture} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-linear-to-br from-fuchsia-500 to-violet-600" />}
                    </div>
                    <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-950 ring-1 ring-white/20" />
                </div>
            </div>
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-linear-to-br from-fuchsia-600 to-violet-800 shadow-2xl shadow-black/70 ring-1 ring-white/15">
                {picture ? <Art src={picture} className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-6xl" aria-hidden>🎧</span>}
                <div className="pointer-events-none absolute inset-0 bg-linear-to-tr from-black/35 via-transparent to-white/15" />
            </div>
        </div>
    );
}

function LiveBadge({ live }: { live: NonNullable<RoomSummary['live']> }) {
    return (
        <span className="flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white" data-live-badge>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live{LIVE_SITES[live.kind as LiveInfo['kind']] && <span className="font-semibold normal-case opacity-80">· {LIVE_SITES[live.kind as LiveInfo['kind']]}</span>}
        </span>
    );
}

/**
 * The top of the Dashboard: one room on air at a time, big — its song's picture washed into the background, the record, who plays what, the time
 * running. It moves on to the next room on air every 12 seconds (not while you point at it, and never where motion is reduced); the strip below
 * picks one by hand. With nothing on air it invites you to start.
 */
export function OnAirStage({ rooms, received, guest, vibe, rolling, onSurprise, onCreate, canSurprise }: {
    rooms: OnAirRoom[];
    received: number;
    guest: boolean;
    vibe: string | null;
    rolling: { name: string } | null;
    onSurprise: () => void;
    onCreate: () => void;
    canSurprise: boolean;
}) {
    const [chosen, setChosen] = useState<number | null>(null);
    const [paused, setPaused] = useState(false);
    const [moving] = useState(motionAllowed);
    const current = rooms.find((entry) => entry.room.id === chosen) ?? rooms[0] ?? null;
    const picture = current ? pictureOf(current) : null;

    useEffect(() => {
        if (!moving || paused || rooms.length < 2) return;
        const turn = window.setInterval(() => setChosen((id) => rooms[(Math.max(0, rooms.findIndex((entry) => entry.room.id === id)) + 1) % rooms.length].room.id), 12000);
        return () => window.clearInterval(turn);
    }, [moving, paused, rooms]);

    const actions: ReactNode = (
        <div className="mt-6 flex flex-wrap items-center gap-3">
            {current ? (
                <Link href={route('rooms.show', current.room.slug)} data-room-name={current.room.name} className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-neutral-950 shadow-lg shadow-black/30 transition hover:bg-violet-100"><Headphones size={17} /> Tune in</Link>
            ) : (
                <a href="#discover-rooms" className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-neutral-950 hover:bg-violet-100"><Search size={16} /> Explore rooms</a>
            )}
            {canSurprise && <button type="button" onClick={onSurprise} className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/15"><Shuffle size={16} /> Surprise me</button>}
            {guest
                ? <Link href={route('register')} className="rounded-xl border border-violet-300/30 bg-violet-500/20 px-4 py-3 text-sm font-semibold text-violet-100 hover:bg-violet-500/30">Join the community</Link>
                : <button type="button" onClick={onCreate} className="flex items-center gap-2 rounded-xl border border-violet-300/30 bg-violet-500/20 px-4 py-3 text-sm font-semibold text-violet-100 hover:bg-violet-500/30"><Plus size={16} /> Create a room</button>}
        </div>
    );

    return (
        <section
            aria-label="On air"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
            className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 shadow-2xl shadow-violet-950/30"
            data-on-air
        >
            {/* the song's picture, blurred into the colours of the stage */}
            {picture && <Art key={picture} src={picture} crop={false} className="absolute inset-0 -z-20 h-full w-full scale-125 object-cover opacity-60 blur-3xl saturate-150" />}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.35),transparent_60%)]" />
            <div className="absolute inset-0 -z-10 bg-linear-to-r from-neutral-950 via-neutral-950/80 to-neutral-950/30" />

            <div className="grid items-center gap-8 p-6 sm:p-8 md:grid-cols-[auto_1fr] md:gap-10">
                <div className="flex justify-center md:block"><Record picture={picture} spinning={Boolean(current?.song || current?.room.live) && moving} /></div>

                {current ? (
                    <div className="min-w-0" key={current.room.id}>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-red-200"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" /> On air</span>
                            {current.room.live && <LiveBadge live={current.room.live} />}
                            {current.room.genre && <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-violet-100">🎵 {current.room.genre}</span>}
                        </div>
                        <h2 className="mt-4 truncate text-3xl font-black tracking-tight sm:text-4xl">{current.room.name}</h2>
                        {current.room.live ? (
                            <p className="mt-2 line-clamp-2 text-lg font-semibold text-white/90">🔴 {current.room.live.title}</p>
                        ) : current.song ? (
                            <p className="mt-2 line-clamp-2 text-lg font-semibold text-white/90">{current.song.title}</p>
                        ) : (
                            <p className="mt-2 text-sm text-neutral-300">People are hanging out here. Bring a song and take the decks.</p>
                        )}
                        {current.song && !current.room.live && (
                            <>
                                <p className="mt-3 flex items-center gap-2 text-sm text-neutral-300">
                                    <Avatar name={current.song.dj} avatar={current.song.dj_avatar} className="h-6 w-6 text-xs" />
                                    <span>Spun by</span> <DjName song={current.song} />
                                </p>
                                <div className="mt-4 max-w-md"><SongTime song={current.song} received={received} /></div>
                            </>
                        )}
                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                            <span className={`flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 font-semibold backdrop-blur ${current.listening > 0 ? 'text-emerald-300' : 'text-neutral-400'}`}>{current.listening > 0 && <Equalizer />} <b className="tabular-nums">{current.listening}</b> listening</span>
                            {(current.song?.woots ?? 0) > 0 && <span className="flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 font-semibold text-amber-300 backdrop-blur"><Flame size={13} /> <b className="tabular-nums">{current.song!.woots}</b> woots</span>}
                        </div>
                        {actions}
                    </div>
                ) : (
                    <div className="min-w-0">
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">Your music. Your people.</span>
                        <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl">The decks are free.<br /><span className="bg-linear-to-r from-violet-300 via-fuchsia-300 to-sky-300 bg-clip-text text-transparent">Play the first song.</span></h2>
                        <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-300">Nothing is on air right now. Open a room, set the mood and the people will come.</p>
                        {actions}
                    </div>
                )}
            </div>

            {rooms.length > 1 && (
                <div className="border-t border-white/10 bg-black/30 px-4 py-3 backdrop-blur sm:px-6">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Also on air <span className="tabular-nums">· {rooms.length}</span></p>
                        {vibe && <p className="flex items-center gap-1 text-[11px] text-neutral-400"><Sparkles size={12} className="text-violet-300" /> Vibe right now: <b className="font-semibold text-white">{vibe}</b></p>}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {rooms.slice(0, 8).map((entry) => {
                            const thumb = pictureOf(entry);
                            const selected = entry.room.id === current?.room.id;
                            return (
                                <button key={entry.room.id} type="button" aria-pressed={selected} onClick={() => setChosen(entry.room.id)} className={`flex min-w-44 max-w-56 shrink-0 items-center gap-2.5 rounded-xl border p-1.5 pr-3 text-left transition ${selected ? 'border-violet-400/70 bg-violet-500/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                                    <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-linear-to-br from-fuchsia-600 to-violet-800">{thumb && <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover" />}</span>
                                    <span className="min-w-0">
                                        <span className="block truncate text-xs font-semibold">{entry.room.name}</span>
                                        <span className="block text-[10px] text-neutral-400"><b className="tabular-nums text-neutral-200">{entry.listening}</b> listening</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Surprise me: the room names roll like a slot machine, then the page goes to the one it stops on */}
            {rolling && (
                <div role="status" className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-neutral-950/75 px-6 text-center backdrop-blur-sm">
                    <span className="text-4xl" aria-hidden>🎲</span>
                    <span key={rolling.name} className="animate-pop max-w-full truncate text-3xl font-black tracking-tight sm:text-4xl">{rolling.name}</span>
                    <span className="text-xs uppercase tracking-widest text-neutral-400">Taking you there…</span>
                </div>
            )}
        </section>
    );
}

/** The DJ's name: it is a name (kept as written), not interface text. */
function DjName({ song }: { song: NowPlaying }) {
    const dj = { name: song.dj };
    return <b className="font-semibold text-white">{dj.name}</b>;
}

const tilePicture = 'absolute inset-0 -z-10 h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90';

/** "Right now on SFD": every room on air as a tile with its song's picture, one big and the rest around it, the time running on each. */
export function LiveWall({ rooms, received }: { rooms: OnAirRoom[]; received: number }) {
    const titleId = useId();
    const shown = rooms.slice(0, 5);
    // keep the mosaic without holes: two tall tiles next to the big one, or a wide one under two small ones
    const shape = (index: number) => (index === 0 ? 'col-span-2 row-span-2' : shown.length === 3 ? 'row-span-2' : shown.length === 4 && index === 3 ? 'col-span-2' : '');

    return (
        <section aria-labelledby={titleId}>
            <SectionTitle title={<span id={titleId}>Right now on SFD</span>} hint="Every room with music or a stream on. Pick one and jump in." />
            <div className="grid auto-rows-[9.5rem] grid-cols-2 gap-3 md:grid-cols-4">
                {shown.map((entry, index) => {
                    const { room, song, listening } = entry;
                    const thumb = pictureOf(entry);
                    const big = index === 0;
                    return (
                        <Link key={room.id} href={route('rooms.show', room.slug)} data-room-name={room.name} className={`group relative isolate overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 transition hover:border-violet-400/60 ${shape(index)}`}>
                            {/* only the big tile asks for the sharper picture: a small one is fine with the small one */}
                            {thumb ? (big ? <Art src={thumb} className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70 transition duration-500 group-hover:opacity-90" /> : <img src={thumb} alt="" loading="lazy" className={tilePicture} />) : <div className="absolute inset-0 -z-10 bg-linear-to-br from-violet-700/60 to-fuchsia-900/60" />}
                            <div className="absolute inset-0 -z-10 bg-linear-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
                            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                                {room.live && <LiveBadge live={room.live} />}
                                {big && room.genre && <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-violet-200 backdrop-blur">🎵 {room.genre}</span>}
                            </div>
                            <span className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold backdrop-blur ${listening > 0 ? 'text-green-400' : 'text-neutral-400'}`}>{listening > 0 && <Equalizer />}<span className="tabular-nums">{listening}</span></span>
                            <div className="absolute inset-x-3 bottom-3">
                                <p className={`truncate font-black tracking-tight ${big ? 'text-2xl' : 'text-sm'}`}>{room.name}</p>
                                {room.live ? <p className="truncate text-xs text-neutral-300">🔴 {room.live.title}</p> : song ? <p className={`truncate text-neutral-300 ${big ? 'text-sm' : 'text-xs'}`}>{song.title}</p> : <p className="truncate text-xs text-neutral-400">Hanging out</p>}
                                {song && !room.live && song.elapsed != null && <div className="mt-2"><SongTime song={song} received={received} compact={!big} /></div>}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
