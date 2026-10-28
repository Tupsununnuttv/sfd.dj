import Avatar from '@/Components/Avatar';
import RoomBadge from '@/Components/RoomBadge';
import { Equalizer } from '@/Components/ui';
import { Link } from '@inertiajs/react';
import { Bot } from 'lucide-react';

export interface NowPlaying {
    title: string;
    thumbnail: string | null;
    dj: string;
    dj_avatar?: string | null;
    duration?: number; // seconds; 0 when unknown
    elapsed?: number | null; // seconds into the song when the page got it; null while a live stream holds the queue
    woots?: number;
}

export interface RoomSummary {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    badges: string[] | null;
    genre: string | null;
    is_private: boolean;
    is_featured: boolean;
    items_count: number;
    created_at?: string;
    user?: { name: string };
    auto_host_bot?: { id: number; name: string } | null;
    live?: { kind: string; title: string; thumbnail: string | null; started_at: string } | null; // a live stream is on the big screen
}

// a stable colour per room, so an empty room still has a face
const tints = ['from-fuchsia-600/50 to-violet-900/60', 'from-violet-600/50 to-sky-900/60', 'from-sky-600/40 to-emerald-900/60', 'from-emerald-600/40 to-teal-900/60', 'from-amber-600/40 to-rose-900/60', 'from-rose-600/50 to-fuchsia-900/60'];
const tintOf = (id: number) => tints[id % tints.length];

/** A room as a card: the picture of the song that is playing, who plays it and how many listen. */
export default function RoomCard({ room, listening = 0, playing }: { room: RoomSummary; listening?: number; playing?: NowPlaying | null }) {
    return (
        <Link
            href={route('rooms.show', room.slug)}
            data-room-name={room.name}
            className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/4 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-violet-400/60 hover:shadow-violet-500/10"
        >
            <div className={`relative h-28 overflow-hidden bg-linear-to-br ${tintOf(room.id)}`}>
                {(room.live?.thumbnail ?? playing?.thumbnail) && <img src={(room.live?.thumbnail ?? playing?.thumbnail)!} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105" />}
                <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/30 to-transparent" />
                <div className="absolute left-3 top-3 flex items-center gap-1.5">
                    {room.live && <span className="flex items-center gap-1.5 rounded bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white" data-live-badge><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live</span>}
                    {room.is_featured && <span className="rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-bold text-black">⭐ Featured</span>}
                    {room.genre && <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-violet-200 backdrop-blur">🎵 {room.genre}</span>}
                </div>
                <span className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold backdrop-blur ${listening > 0 ? 'text-green-400' : 'text-neutral-400'}`}>
                    {listening > 0 && <Equalizer />} {listening} {listening === 1 ? 'listener' : 'listening'}
                </span>
                {!playing && !room.live && <p className="absolute bottom-2 left-3 text-xs text-neutral-300">Waiting for the next DJ…</p>}
            </div>

            <div className="flex flex-1 flex-col p-4">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="max-w-full truncate font-bold">{room.name}</h3>
                    <RoomBadge badges={room.badges} />
                    {room.is_private && <span title="Private room: staff only">🔒</span>}
                </div>
                {room.auto_host_bot && <p data-selfbot className="mt-2 flex items-center gap-1.5 text-xs text-sky-300"><Bot size={13} /><span className="truncate">Selfbot: {room.auto_host_bot.name}</span></p>}
                {room.live ? (
                    <p className="mt-1 truncate text-sm text-neutral-200">🔴 {room.live.title}</p>
                ) : playing ? (
                    <p className="mt-1 truncate text-sm text-neutral-200">▶ {playing.title} <span className="text-neutral-500">· {playing.dj}</span></p>
                ) : (
                    room.description && <p className="mt-1 line-clamp-2 text-sm text-neutral-400">{room.description}</p>
                )}
                <div className="mt-auto flex items-center justify-between pt-4 text-xs text-neutral-500">
                    <span className="flex items-center gap-1.5">{room.user && <><Avatar name={room.user.name} className="h-5 w-5 text-[10px]" /> {room.user.name}</>}</span>
                    <span>{room.items_count} in queue</span>
                </div>
            </div>
        </Link>
    );
}
