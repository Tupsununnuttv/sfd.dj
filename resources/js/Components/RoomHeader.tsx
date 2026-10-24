import SubscriberName from '@/Components/SubscriberName';
import Avatar from '@/Components/Avatar';
import RoomBadge from '@/Components/RoomBadge';
import { Dancer } from '@/Components/RoomScene';
import { Equalizer } from '@/Components/ui';
import { Cosmetics } from '@/lib/cosmetics';
import { LIVE_SITES, LiveInfo } from '@/lib/live';
import { mmss } from '@/lib/playlists';
import { Link } from '@inertiajs/react';
import SocialIcon, { socialLabels } from '@/Components/SocialIcon';
import { ArrowLeft, Music2, Users, Volume1, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * The bar at the top of a room. On the left: the way out, the name of the room, how many are listening, and under it who I am here.
 * In the middle who is playing what, and under it how far the song is. On the right our social media as small icons (Discord, YouTube and so on;
 * the room info is in More, in the bar at the bottom) and the volume.
 */
export default function RoomHeader({ room, host, listening, dj, title, live, playing, elapsed, receivedAt, duration, volume, muted, onVolume, onMute, social, onDj }: {
    room: { name: string; badges: string[] | null };
    host: { name: string; avatar: string | null; cosmetics?: Cosmetics | null };
    listening: number;
    dj: Dancer | null;
    title: string | null; // the song that is playing
    live: LiveInfo | null; // a live stream is on the big screen: it takes the place of the song
    playing: boolean; // and I can hear it
    elapsed: number; // seconds elapsed when the server sent the current playback
    receivedAt: number; // when this client received it
    duration: number; // how long it is (0: not known)
    volume: number; // 0 to 100
    muted: boolean;
    onVolume: (v: number) => void;
    onMute: () => void;
    social: Record<string, string>; // name of the network -> link, only the ones that are set
    onDj: (user: Dancer, anchor: DOMRect) => void;
}) {
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        if (!title) return;
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [title]);

    const shown = muted ? 0 : volume;
    const Speaker = shown === 0 ? VolumeX : shown < 50 ? Volume1 : Volume2;
    const elapsedPosition = Math.max(0, elapsed + (now - receivedAt) / 1000);
    const position = duration > 0 ? Math.min(elapsedPosition, duration) : elapsedPosition;
    const progress = duration > 0 ? Math.min(1, position / duration) : 0;

    return (
        <header className="sfd-navbar relative z-30 flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-black/40 px-3 backdrop-blur sm:px-4 md:grid md:grid-cols-[minmax(11rem,1fr)_minmax(0,30rem)_minmax(11rem,1fr)]">
            <div className="flex min-w-0 shrink-0 items-center gap-3 md:shrink md:overflow-hidden">
                <Link href={route('dashboard')} title="Leave the room" aria-label="Leave the room" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-neutral-300 transition hover:bg-white/10 hover:text-white">
                    <ArrowLeft size={18} />
                </Link>
                <div className="min-w-0 max-w-60 sm:max-w-76">
                    <p className="flex items-center gap-2 leading-tight">
                        <span className="truncate text-sm font-extrabold tracking-tight" title={room.name}>{room.name}</span>
                        <RoomBadge badges={room.badges} compact />
                        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-green-400" title={`${listening} listening`}>
                            <Users size={13} /> {listening}<span className="hidden font-normal 2xl:inline"> listening</span>
                        </span>
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] leading-tight text-neutral-400">
                        <Avatar name={host.name} avatar={host.avatar} cosmetics={host.cosmetics} className="h-4 w-4 text-[9px]" />
                        <span className="truncate" title={host.name}><SubscriberName cosmetics={host.cosmetics}>{host.name}</SubscriberName></span>
                        <span className="shrink-0 whitespace-nowrap text-amber-300">Room host</span>
                    </p>
                </div>
            </div>

            {/* who is playing what, and under it how far the song is: in the exact middle of the bar (the two sides are equally wide) */}
            <div className="flex min-w-0 flex-1 items-center justify-center gap-2.5 md:w-full">
                {live ? (
                    <>
                        {dj && (
                            <button onClick={(e) => onDj(dj, e.currentTarget.getBoundingClientRect())} title={`${dj.name}: quick profile`} className="shrink-0 rounded-full">
                                <Avatar name={dj.name} avatar={dj.avatar} cosmetics={dj.cosmetics} className="h-8 w-8 text-sm" />
                            </button>
                        )}
                        <div className="min-w-0 flex-1" data-live-bar>
                            <p className="flex min-w-0 items-center gap-2 text-sm leading-tight">
                                <span className="hidden shrink-0 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white sm:inline">Live</span>
                                <span className="min-w-0 truncate">
                                    {dj && <><span className="font-semibold" style={{ color: dj.role.color }}><SubscriberName cosmetics={dj.cosmetics}>{dj.name}</SubscriberName></span> <span className="text-neutral-400">is live:</span>{' '}</>}
                                    <span className="font-bold text-white" title={live.title}>{live.title}</span>
                                </span>
                                <span className="hidden shrink-0 sm:inline">{playing ? <Equalizer /> : <Music2 size={14} className="text-neutral-600" />}</span>
                            </p>
                            <p className="mt-1 hidden text-[10px] font-semibold leading-none text-neutral-400 sm:block">on {LIVE_SITES[live.kind]}</p>
                        </div>
                    </>
                ) : title && dj ? (
                    <>
                        <button onClick={(e) => onDj(dj, e.currentTarget.getBoundingClientRect())} title={`${dj.name}: quick profile`} className="shrink-0 rounded-full">
                            <Avatar name={dj.name} avatar={dj.avatar} cosmetics={dj.cosmetics} className="h-8 w-8 text-sm" />
                        </button>
                        <div className="min-w-0 flex-1">
                            <p className="flex min-w-0 items-center gap-2 text-sm leading-tight">
                                <span className="min-w-0 truncate">
                                    <span className="text-neutral-400"><span className="font-semibold" style={{ color: dj.role.color }}><SubscriberName cosmetics={dj.cosmetics}>{dj.name}</SubscriberName></span> is playing:</span>{' '}
                                    <span className="font-bold text-white" title={title}>{title}</span>
                                </span>
                                {playing ? <Equalizer className="shrink-0" /> : <Music2 size={14} className="shrink-0 text-neutral-600" />}
                            </p>
                            <div className="mt-1.5 flex items-center gap-2 text-[10px] font-semibold tabular-nums leading-none text-neutral-400" data-progress>
                                <span className="shrink-0">{mmss(position)}</span>
                                <div className="relative h-1 min-w-8 flex-1 rounded-full bg-white/10">
                                    <div className="h-full rounded-full bg-linear-to-r from-fuchsia-500 via-violet-500 to-sky-400 transition-[width] duration-1000 ease-linear" style={{ width: `${progress * 100}%` }} />
                                    {progress > 0 && <span className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_rgba(168,85,247,0.9)] transition-[left] duration-1000 ease-linear" style={{ left: `${progress * 100}%` }} />}
                                </div>
                                <span className="shrink-0">{duration > 0 ? mmss(duration) : '--:--'}</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="text-sm font-semibold text-neutral-400">Waiting for the next DJ…</p>
                )}
            </div>

            <div className="flex min-w-0 shrink-0 items-center justify-end gap-2">
                {Object.keys(social).length > 0 && (
                    <nav aria-label="Our social media" className="hidden shrink-0 items-center gap-0.5 rounded-xl border border-white/10 bg-white/4 p-0.5 2xl:flex">
                        {Object.entries(social).map(([key, url]) => (
                            <a key={key} href={url} target="_blank" rel="noopener noreferrer" title={socialLabels[key] ?? key} aria-label={socialLabels[key] ?? key} className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-white/10 hover:text-white">
                                <SocialIcon name={key} size={14} />
                            </a>
                        ))}
                    </nav>
                )}
                {/* the volume */}
                <div className="sfd-volume flex shrink-0 items-center gap-2" data-volume>
                    <button onClick={onMute} aria-label={muted ? 'Unmute' : 'Mute'} title={muted ? 'Unmute' : 'Mute'} className={`sfd-volumebutton flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10 hover:text-white ${shown === 0 ? 'text-red-300' : 'text-neutral-300'}`}>
                        <Speaker size={18} />
                    </button>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={shown}
                        onChange={(e) => onVolume(+e.target.value)}
                        aria-label="Volume"
                        className="sfd-volumeslider vol hidden w-16 cursor-pointer sm:block xl:w-20 2xl:w-24"
                        style={{ background: `linear-gradient(to right, var(--volume-fill, #a855f7) ${shown}%, var(--volume-track, rgba(255,255,255,0.14)) ${shown}%)` }}
                    />
                    <span className="sfd-volumevalue hidden w-9 text-xs font-semibold tabular-nums text-neutral-400 2xl:inline">{shown}%</span>
                </div>
            </div>
        </header>
    );
}
