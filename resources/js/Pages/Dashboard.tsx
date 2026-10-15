import type { LucideIcon } from 'lucide-react';
import { levelPercent, toNextText } from '@/lib/level';
import Avatar from '@/Components/Avatar';
import { CoinIcon } from '@/Components/CoinIcon';
import RoleBadge from '@/Components/RoleBadge';
import RoomCard, { NowPlaying, RoomSummary } from '@/Components/RoomCard';
import SocialIcon from '@/Components/SocialIcon';
import { Card, chip, Equalizer, OnlineDot, ProgressBar, SectionTitle, StatTile } from '@/Components/ui';
import { releases } from '@/lib/patchNotes';
import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, Circle, Gift, Heart, ListMusic, Music, Plus, Radio, Search, ShoppingBag, Shuffle, ThumbsUp, Trophy, Users, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

interface Activity {
    at: string;
    type: 'song' | 'room' | 'join';
    user: { id: number; name: string; avatar: string | null };
    text: string;
    slug: string | null;
}

interface Props {
    rooms: RoomSummary[];
    mine: RoomSummary[];
    featured: RoomSummary[];
    genres: string[];
    counts: Record<number, number>;
    nowPlaying: Record<number, NowPlaying>;
    activity: Activity[];
    stats: { xp: number; level: number; from: number; to: number; rank: number; songs_played: number; woots: number; friends: number } | null;
    daily: { amount: number; claimable: boolean } | null;
    friendIds: number[];
    goals: { key: string; title: string; have: number; goal: number; href: string | null }[];
    continue: { name: string; slug: string; genre: string | null; at: string } | null;
    friendsOnline: { id: number; name: string; avatar: string | null; online: boolean; status?: string; room: { name: string; slug: string } | null }[];
    recommended: { reason: string; rooms: { id: number; name: string; slug: string; genre: string | null; badges: string[] | null; listening: number }[] };
    events: { id: number; title: string; starts_at: string; going_count: number; room: { name: string; slug: string } | null }[];
    topDjs: { id: number; name: string; avatar: string | null; plays: number }[];
    mySongs: { id: number; title: string; thumbnail: string | null; played_at: string; room: { name: string; slug: string } }[];
}

const input = 'w-full rounded-lg border-white/10 bg-white/5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-violet-500 focus:ring-violet-500';

const ago = (iso: string) => {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
};

const greeting = () => {
    const h = new Date().getHours();
    return h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const when = (iso: string) => {
    const d = new Date(iso);
    const days = Math.round((d.getTime() - Date.now()) / 86400000);
    const day = days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    return `${day}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

type Tab = 'all' | 'featured' | 'mine';
type Sort = 'listeners' | 'newest' | 'name';

function CreateRoom({ genres, onClose }: { genres: string[]; onClose: () => void }) {
    const { data, setData, post, processing, errors } = useForm({ name: '', description: '', genre: '', is_private: false });
    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('rooms.store'), { onSuccess: onClose });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
            <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">Create a room</h2>
                    <button type="button" onClick={onClose} className="text-neutral-500 hover:text-white" aria-label="Close"><X size={18} /></button>
                </div>
                <div>
                    <input autoFocus value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Room name" maxLength={50} className={input} />
                    {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                </div>
                <div>
                    <select value={data.genre} onChange={(e) => setData('genre', e.target.value)} className={input}>
                        <option value="">Genre (optional)</option>
                        {genres.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                    {errors.genre && <p className="mt-1 text-sm text-red-400">{errors.genre}</p>}
                </div>
                <input value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Description (optional)" maxLength={140} className={input} />
                <label className="flex items-center gap-2 text-sm text-neutral-300">
                    <input type="checkbox" checked={data.is_private} onChange={(e) => setData('is_private', e.target.checked)} className="rounded border-neutral-600 bg-neutral-800 text-violet-500 focus:ring-violet-500" />
                    🔒 Private room <span className="text-xs text-neutral-500">(only you and SFD-DJ.EU staff can enter)</span>
                </label>
                <button disabled={processing} className="w-full rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Create room</button>
            </form>
        </div>
    );
}

export default function Dashboard({ rooms, mine, featured, genres, counts, nowPlaying, activity, stats, daily, friendIds, goals, continue: resume, friendsOnline, recommended, events, topDjs, mySongs }: Props) {
    const { auth: { user, guest }, community, pendingFriends, unreadWhispers } = usePage<PageProps>().props;
    const [creating, setCreating] = useState(false);
    const [tab, setTab] = useState<Tab>('all');
    const [q, setQ] = useState('');
    const [genre, setGenre] = useState(() => new URLSearchParams(window.location.search).get('genre') ?? '');
    const [sort, setSort] = useState<Sort>('listeners');
    const [liveOnly, setLiveOnly] = useState(false);
    const [feed, setFeed] = useState<'all' | 'friends'>('all');

    // Live numbers: refetch just the changing parts every 5s while the tab is visible.
    useEffect(() => {
        const timer = setInterval(() => {
            if (!document.hidden) router.reload({ only: ['counts', 'nowPlaying', 'activity', 'friendsOnline'] });
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const online = Object.values(counts).reduce((a, b) => a + b, 0);
    const live = useMemo(() => rooms.filter((r) => (counts[r.id] ?? 0) > 0 || nowPlaying[r.id]).sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0)).slice(0, 4), [rooms, counts, nowPlaying]);

    const source = tab === 'featured' ? featured : tab === 'mine' ? mine : rooms;
    const shown = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return source
            .filter((r) => (!genre || r.genre === genre) && (!needle || `${r.name} ${r.description ?? ''} ${r.genre ?? ''} ${r.user?.name ?? ''}`.toLowerCase().includes(needle)) && (!liveOnly || (counts[r.id] ?? 0) > 0 || nowPlaying[r.id]))
            .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'newest' ? b.id - a.id : (counts[b.id] ?? 0) - (counts[a.id] ?? 0) || b.id - a.id);
    }, [source, q, genre, sort, liveOnly, counts, nowPlaying]);

    const usedGenres = useMemo(() => [...new Set(rooms.map((r) => r.genre).filter(Boolean))] as string[], [rooms]);
    const feedItems = feed === 'friends' ? activity.filter((a) => friendIds.includes(a.user.id) || a.user.id === user.id) : activity;
    const progress = stats ? levelPercent(stats.xp, stats.level) : 0;

    // a random room: a live one if there is one
    const surprise = () => {
        const pool = live.length ? live : rooms;
        if (pool.length) router.visit(route('rooms.show', pool[Math.floor(Math.random() * pool.length)].slug));
    };

    const quick: [LucideIcon, string, string, string][] = [
        [ListMusic, 'Playlists', route('playlists'), 'text-violet-300'],
        [Users, 'Friends', route('friends'), 'text-sky-300'],
        [ShoppingBag, 'Avatar shop', route('shop'), 'text-fuchsia-300'],
        [Gift, 'Invite & earn', route('referral'), 'text-amber-300'],
        [CalendarDays, 'Events', route('events'), 'text-emerald-300'],
        [Trophy, 'Leaderboard', route('community'), 'text-rose-300'],
    ];

    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />

            {/* hero */}
            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-fuchsia-600/25 via-violet-600/15 to-sky-600/10 p-6 sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
                {guest ? (
                    <div className="relative flex flex-wrap items-center justify-between gap-5">
                        <div className="max-w-xl">
                            <h2 className="text-3xl font-black tracking-tight">Welcome to SFD-DJ.EU 🎧</h2>
                            <p className="mt-2 text-neutral-300">You are browsing as a guest: watch rooms and read the chat. Log in to chat, vote, build playlists and DJ.</p>
                            <p className="mt-3 flex items-center gap-2 text-sm text-green-400"><Equalizer /> {online} listening right now</p>
                        </div>
                        <div className="flex gap-2">
                            {rooms.length > 1 && <button onClick={surprise} className="flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/20"><Shuffle size={16} /> Surprise me</button>}
                            <Link href={route('login')} className="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/20">Log in</Link>
                            <Link href={route('register')} className="rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 px-5 py-2.5 text-sm font-semibold hover:opacity-90">Register free</Link>
                        </div>
                    </div>
                ) : (
                    <div className="relative flex flex-wrap items-center justify-between gap-6">
                        <div className="flex min-w-0 items-center gap-4">
                            <Avatar name={user.name} avatar={user.avatar} cosmetics={user.cosmetics} className="h-16 w-16 text-2xl" />
                            <div className="min-w-0">
                                <p className="text-sm text-neutral-400">{greeting()},</p>
                                <h2 className="flex flex-wrap items-center gap-2 text-2xl font-black tracking-tight sm:text-3xl">{user.name} <RoleBadge role={user.primary_role} /></h2>
                                <p className="mt-1 flex items-center gap-2 text-sm text-green-400"><Equalizer /> {online} {online === 1 ? 'person is' : 'people are'} listening right now</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {daily?.claimable && <button onClick={() => router.post(route('shop.daily'), {}, { preserveScroll: true })} data-daily className="flex items-center gap-2 rounded-lg bg-linear-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-sm font-bold text-amber-950 shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400"><CoinIcon className="h-4 w-4" /> Claim {daily.amount} daily coins</button>}
                            <button onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 px-5 py-2.5 text-sm font-semibold hover:opacity-90"><Plus size={16} /> Create room</button>
                            {live[0] && <Link href={route('rooms.show', live[0].slug)} className="flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/20"><Radio size={16} /> Jump into {live[0].name}</Link>}
                            {rooms.length > 1 && <button onClick={surprise} className="flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/20"><Shuffle size={16} /> Surprise me</button>}
                        </div>
                        {stats && (
                            <div className="relative w-full">
                                <div className="mb-1.5 flex items-baseline justify-between text-xs text-neutral-300">
                                    <span className="font-semibold">Level {stats.level}</span>
                                    <span>{stats.xp.toLocaleString()} XP · {toNextText(stats.xp, stats.level)}</span>
                                </div>
                                <ProgressBar value={progress} />
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* things that need you */}
            {!guest && (pendingFriends > 0 || unreadWhispers > 0) && (
                <div className="flex flex-wrap gap-3">
                    {pendingFriends > 0 && <Link href={route('friends')} className="flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2.5 text-sm text-sky-200 hover:bg-sky-500/20">👋 {pendingFriends} friend {pendingFriends === 1 ? 'request is' : 'requests are'} waiting</Link>}
                    {unreadWhispers > 0 && <Link href={route('whispers')} className="flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-sm text-violet-200 hover:bg-violet-500/20">💬 {unreadWhispers} unread {unreadWhispers === 1 ? 'whisper' : 'whispers'}</Link>}
                </div>
            )}

            {!guest && resume && (
                <Link href={route('rooms.show', resume.slug)} className="group flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/4 px-5 py-4 transition hover:border-violet-400/60">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-fuchsia-500/30 to-violet-500/30 text-violet-200"><Radio size={19} /></span>
                    <span className="min-w-0 flex-1"><span className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Pick up where you left off</span><span className="block truncate font-semibold">{resume.name}{resume.genre && <span className="font-normal text-neutral-500"> · {resume.genre}</span>} <span className="font-normal text-neutral-500">· you were there {ago(resume.at)}</span></span></span>
                    <span className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold group-hover:bg-white/20">Rejoin →</span>
                </Link>
            )}

            {/* numbers */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats ? (
                    <>
                        <StatTile icon={Trophy} tone="amber" label="Rank" value={`#${stats.rank}`} hint={`Level ${stats.level}`} />
                        <StatTile icon={Music} tone="violet" label="Songs played" value={stats.songs_played} />
                        <StatTile icon={ThumbsUp} tone="emerald" label="Woots received" value={stats.woots} />
                        <StatTile icon={Users} tone="sky" label="Friends" value={stats.friends} />
                    </>
                ) : (
                    <>
                        <StatTile icon={Radio} tone="emerald" label="Listening now" value={online} />
                        <StatTile icon={Music} tone="violet" label="Rooms" value={rooms.length} />
                        <StatTile icon={Trophy} tone="amber" label="Top DJ plays" value={topDjs[0]?.plays ?? 0} />
                        <StatTile icon={CalendarDays} tone="sky" label="Upcoming events" value={events.length} />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="space-y-8 lg:col-span-2">
                    {/* live now */}
                    {live.length > 0 && (
                        <section>
                            <SectionTitle title="🔴 Live now" hint="Rooms with people listening or a song playing" />
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {live.slice(0, 2).map((r) => <RoomCard key={r.id} room={r} listening={counts[r.id] ?? 0} playing={nowPlaying[r.id]} />)}
                            </div>
                        </section>
                    )}

                    {/* picked for you */}
                    {!guest && recommended.rooms.length > 0 && (
                        <section>
                            <SectionTitle title="✨ Picked for you" hint={recommended.reason} />
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                {recommended.rooms.map((r) => (
                                    <Link key={r.id} href={route('rooms.show', r.slug)} className="rounded-2xl border border-white/10 bg-white/4 p-4 transition hover:border-violet-400/60">
                                        <p className="truncate font-bold">{r.name}</p>
                                        <p className="mt-1 text-xs text-neutral-500">{r.genre ?? 'No genre'}</p>
                                        <p className={`mt-3 text-xs ${(counts[r.id] ?? r.listening) > 0 ? 'text-green-400' : 'text-neutral-500'}`}>● {counts[r.id] ?? r.listening} listening</p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* room browser */}
                    <section>
                        <SectionTitle
                            title="Rooms"
                            action={!guest && <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20"><Plus size={14} /> New room</button>}
                        />
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                {([['all', `All (${rooms.length})`], ['featured', `⭐ Featured (${featured.length})`], ...(!guest ? [['mine', `Mine (${mine.length})`]] : [])] as [Tab, string][]).map(([k, label]) => (
                                    <button key={k} onClick={() => setTab(k)} className={chip(tab === k)}>{label}</button>
                                ))}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative min-w-48 flex-1">
                                    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search rooms, genres, hosts" className={`${input} pl-9`} />
                                </div>
                                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={input.replace('w-full', 'w-auto')}>
                                    <option value="listeners">Most listeners</option>
                                    <option value="newest">Newest</option>
                                    <option value="name">A to Z</option>
                                </select>
                                <label className="flex items-center gap-2 text-xs text-neutral-300"><input type="checkbox" checked={liveOnly} onChange={(e) => setLiveOnly(e.target.checked)} className="rounded border-neutral-600 bg-neutral-800 text-violet-500 focus:ring-violet-500" /> Live only</label>
                            </div>
                            {usedGenres.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    <button onClick={() => setGenre('')} className={chip(genre === '')}>Any genre</button>
                                    {usedGenres.map((g) => <button key={g} onClick={() => setGenre(genre === g ? '' : g)} className={chip(genre === g)}>{g}</button>)}
                                </div>
                            )}
                        </div>

                        {shown.length === 0 ? (
                            <Card className="mt-4 p-8 text-center">
                                <p className="text-3xl">🎶</p>
                                <p className="mt-2 font-semibold">{rooms.length === 0 ? 'No rooms yet' : tab === 'mine' ? 'You have not created a room yet' : 'No rooms match'}</p>
                                <p className="mt-1 text-sm text-neutral-400">{rooms.length === 0 || tab === 'mine' ? 'Make the first one and invite your friends.' : 'Try a different search or clear the filters.'}</p>
                                {!guest && (rooms.length === 0 || tab === 'mine') && <button onClick={() => setCreating(true)} className="mt-4 rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 px-5 py-2 text-sm font-semibold">Create a room</button>}
                            </Card>
                        ) : (
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                {shown.map((r) => <RoomCard key={r.id} room={r} listening={counts[r.id] ?? 0} playing={nowPlaying[r.id]} />)}
                            </div>
                        )}
                    </section>
                </div>

                <aside className="space-y-6">
                    {!guest && (
                        <section>
                            <SectionTitle title="Quick actions" />
                            <div className="grid grid-cols-2 gap-2">
                                {quick.map(([Icon, label, href, tone]) => (
                                    <Link key={label} href={href} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/4 px-3 py-3 text-sm font-medium transition hover:border-violet-400/50 hover:bg-white/[0.07]">
                                        <span className={tone}><Icon size={17} /></span> {label}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {!guest && goals.length > 0 && (
                        <section>
                            <SectionTitle title="Today's goals" hint={`${goals.filter((g) => g.have >= g.goal).length} of ${goals.length} done`} />
                            <Card className="divide-y divide-white/5">
                                {goals.map((g) => (
                                    <div key={g.key} className="p-4">
                                        <div className="flex items-center gap-3">
                                            {g.have >= g.goal ? <CheckCircle2 size={18} className="shrink-0 text-green-400" /> : <Circle size={18} className="shrink-0 text-neutral-600" />}
                                            <span className={`flex-1 text-sm font-semibold ${g.have >= g.goal ? 'text-neutral-400 line-through' : ''}`}>{g.title}</span>
                                            <span className="text-xs tabular-nums text-neutral-500">{g.have}/{g.goal}</span>
                                        </div>
                                        <ProgressBar className="mt-2 h-1.5" value={(g.have / g.goal) * 100} />
                                    </div>
                                ))}
                            </Card>
                        </section>
                    )}

                    {!guest && (
                        <section>
                            <SectionTitle title="Friends online" action={<Link href={route('friends')} className="text-xs text-violet-400 hover:underline">All →</Link>} />
                            <Card className="divide-y divide-white/5">
                                {friendsOnline.length === 0 && <p className="p-4 text-sm text-neutral-500">None of your friends is around right now.</p>}
                                {friendsOnline.map((f) => (
                                    <div key={f.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                                        <span className="relative"><Avatar name={f.name} avatar={f.avatar} className="h-8 w-8 text-sm" /><OnlineDot online status={f.status} className="absolute -bottom-0.5 -right-0.5" /></span>
                                        <span className="min-w-0 flex-1"><Link href={route('users.show', f.id)} className="block truncate font-semibold hover:underline">{f.name}</Link><span className="block truncate text-xs text-neutral-500">{f.room ? `in ${f.room.name}` : 'online'}</span></span>
                                        {f.room && <Link href={route('rooms.show', f.room.slug)} className="rounded-lg bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-300 hover:bg-green-500/30">Join</Link>}
                                    </div>
                                ))}
                            </Card>
                        </section>
                    )}

                    <section>
                        <SectionTitle title="Upcoming events" action={<Link href={route('events')} className="text-xs text-violet-400 hover:underline">All →</Link>} />
                        <Card className="divide-y divide-white/5">
                            {events.length === 0 && <p className="p-4 text-sm text-neutral-500">No events planned yet.</p>}
                            {events.map((e) => (
                                <Link key={e.id} href={e.room ? route('rooms.show', e.room.slug) : route('events')} className="block p-4 hover:bg-white/3">
                                    <p className="font-semibold">{e.title}</p>
                                    <p className="mt-0.5 text-xs text-violet-300">{when(e.starts_at)}</p>
                                    <p className="mt-0.5 text-xs text-neutral-500">{e.room ? `in ${e.room.name} · ` : ''}{e.going_count} going</p>
                                </Link>
                            ))}
                        </Card>
                    </section>

                    <section>
                        <SectionTitle
                            title="Activity"
                            action={!guest && (
                                <span className="flex gap-1">
                                    <button onClick={() => setFeed('all')} className={chip(feed === 'all')}>Everyone</button>
                                    <button onClick={() => setFeed('friends')} className={chip(feed === 'friends')}>Friends</button>
                                </span>
                            )}
                        />
                        <Card className="p-4">
                            <ul className="space-y-3">
                                {feedItems.length === 0 && <li className="text-sm text-neutral-500">{feed === 'friends' ? 'Your friends have been quiet. Add more friends!' : 'Nothing yet.'}</li>}
                                {feedItems.map((a, i) => (
                                    <li key={i} className="flex gap-3 text-sm">
                                        <Avatar name={a.user.name} avatar={a.user.avatar} className="h-7 w-7 text-sm" />
                                        <div className="min-w-0">
                                            <p className="text-neutral-300">
                                                <Link href={route('users.show', a.user.id)} className="font-semibold text-neutral-100 hover:underline">{a.user.name}</Link>{' '}
                                                {a.slug ? <Link href={route('rooms.show', a.slug)} className="hover:underline">{a.text}</Link> : a.text}
                                            </p>
                                            <p className="text-xs text-neutral-500">{ago(a.at)}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </section>

                    {topDjs.length > 0 && (
                        <section>
                            <SectionTitle title="Top DJs" action={<Link href={route('community')} className="text-xs text-violet-400 hover:underline">Leaderboard →</Link>} />
                            <Card className="divide-y divide-white/5">
                                {topDjs.map((d, i) => (
                                    <Link key={d.id} href={route('users.show', d.id)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/3">
                                        <span className="w-5 text-center text-base">{['🥇', '🥈', '🥉'][i] ?? <span className="text-xs text-neutral-500">{i + 1}</span>}</span>
                                        <Avatar name={d.name} avatar={d.avatar} className="h-7 w-7 text-sm" />
                                        <span className="min-w-0 flex-1 truncate">{d.name}</span>
                                        <span className="text-xs text-neutral-500">{d.plays} songs</span>
                                    </Link>
                                ))}
                            </Card>
                        </section>
                    )}

                    {mySongs.length > 0 && (
                        <section>
                            <SectionTitle title="Your recent songs" action={<Link href={`${route('history')}?mine=1`} className="text-xs text-violet-400 hover:underline">History →</Link>} />
                            <Card className="divide-y divide-white/5">
                                {mySongs.map((s) => (
                                    <Link key={s.id} href={route('rooms.show', s.room.slug)} className="flex items-center gap-3 p-3 hover:bg-white/3">
                                        {s.thumbnail ? <img src={s.thumbnail} alt="" className="h-9 w-14 shrink-0 rounded object-cover" /> : <span className="h-9 w-14 shrink-0 rounded bg-white/10" />}
                                        <div className="min-w-0">
                                            <p className="truncate text-sm">{s.title}</p>
                                            <p className="text-xs text-neutral-500">{s.room.name} · {ago(s.played_at)}</p>
                                        </div>
                                    </Link>
                                ))}
                            </Card>
                        </section>
                    )}

                    <section>
                        <SectionTitle title={`What's new · v${releases[0].version}`} action={<Link href={route('patch-notes')} className="text-xs text-violet-400 hover:underline">All notes →</Link>} />
                        <Card className="p-4">
                            <p className="font-semibold">{releases[0].title}</p>
                            <ul className="mt-2 space-y-2 text-sm text-neutral-400">
                                {releases[0].notes.slice(0, 3).map(([kind, text]) => (
                                    <li key={text} className="flex gap-2"><span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${kind === 'new' ? 'bg-violet-400' : kind === 'improved' ? 'bg-sky-400' : 'bg-emerald-400'}`} />{text}</li>
                                ))}
                            </ul>
                        </Card>
                    </section>

                    {community.donation && (
                        <Card className="border-pink-500/30 bg-pink-500/5 p-5">
                            <p className="flex items-center gap-2 font-semibold"><Heart size={16} className="text-pink-400" /> {community.donation.title}</p>
                            <p className="mt-1 text-sm text-neutral-400">{community.donation.currency}{community.donation.current} of {community.donation.currency}{community.donation.goal} ({community.donation.percent}%)</p>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-linear-to-r from-pink-500 to-fuchsia-500" style={{ width: `${community.donation.percent}%` }} /></div>
                            {community.donation.url && <a href={community.donation.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-400">Donate</a>}
                        </Card>
                    )}

                    {Object.keys(community.social).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(community.social).map(([key, url]) => (
                                <a key={key} href={url} target="_blank" rel="noopener noreferrer" title={key} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-neutral-300 hover:border-violet-400/50 hover:text-white"><SocialIcon name={key} size={17} /></a>
                            ))}
                        </div>
                    )}
                </aside>
            </div>

            {creating && <CreateRoom genres={genres} onClose={() => setCreating(false)} />}
        </AppLayout>
    );
}
