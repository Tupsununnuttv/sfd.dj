import Avatar from '@/Components/Avatar';
import RoomBadge from '@/Components/RoomBadge';
import { EmptyState, primaryBtn } from '@/Components/ui';
import AppLayout from '@/Layouts/AppLayout';
import { LIVE_SITES, LiveInfo } from '@/lib/live';
import { ago } from '@/lib/time';
import { Head, Link, router } from '@inertiajs/react';
import { Users } from 'lucide-react';
import { useEffect } from 'react';

interface Stream {
    room: { id: number; name: string; slug: string; genre: string | null; badges: string[] | null; is_private: boolean };
    live: LiveInfo;
    listening: number;
}

/** The rooms that have a live stream on their big screen right now, the busiest first. */
export default function LiveStreams({ streams }: { streams: Stream[] }) {
    // who is live, and how many are watching, changes all the time
    useEffect(() => {
        const timer = window.setInterval(() => { if (!document.hidden) router.reload({ only: ['streams', 'liveCount'] }); }, 20_000);

        return () => window.clearInterval(timer);
    }, []);

    return (
        <AppLayout title="Live streams" subtitle="Join a room to watch and chat. TikTok LIVE opens on TikTok in a new tab.">
            <Head title="Live streams" />

            {streams.length === 0 ? (
                <EmptyState
                    icon="📡"
                    title="Nobody is live right now"
                    text="Host a room, press Go live in its menu and paste the link of your YouTube, Twitch or Kick stream: it shows on the room's big screen, and here."
                    action={<Link href={route('dashboard')} className={primaryBtn}>Go to the rooms</Link>}
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {streams.map(({ room, live, listening }) => (
                        <Link
                            key={room.id}
                            href={route('rooms.show', room.slug)}
                            data-live-room={room.name}
                            className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/4 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-red-400/60 hover:shadow-red-500/10"
                        >
                            <div className="relative aspect-video overflow-hidden bg-linear-to-br from-red-900/60 to-violet-900/60">
                                {live.thumbnail && <img src={live.thumbnail} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105" />}
                                <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-transparent to-transparent" />
                                <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded bg-red-600 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white shadow-lg"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live</span>
                                <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-green-400 backdrop-blur"><Users size={12} /> {listening}</span>
                                <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-neutral-200 backdrop-blur">{LIVE_SITES[live.kind]}{live.kind === 'tiktok' && ' · opens on TikTok'}</span>
                            </div>
                            <div className="flex flex-1 flex-col p-4">
                                <h3 className="truncate font-bold" title={live.title}>{live.title}</h3>
                                <p className="mt-1 flex min-w-0 items-center gap-2 text-sm text-neutral-400">
                                    {live.by && <Avatar name={live.by.name} avatar={live.by.avatar} cosmetics={live.by.cosmetics} className="h-5 w-5 text-[10px]" />}
                                    <span className="truncate">{live.by?.name}<span className="text-neutral-600"> in </span><span className="text-neutral-200">{room.name}</span></span>
                                    <RoomBadge badges={room.badges} compact />
                                    {room.is_private && <span title="Private room: staff only">🔒</span>}
                                </p>
                                <p className="mt-auto pt-3 text-xs text-neutral-500">Live since {ago(live.started_at)}{room.genre && <> · 🎵 {room.genre}</>}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
