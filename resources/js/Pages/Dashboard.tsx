import { formatDate, formatTime } from '@/lib/regional';
import DiscordInvite from '@/Components/DiscordInvite';
import CreateRoom from '@/Components/CreateRoom';
import SiteCounters from '@/Components/SiteCounters';
import { LiveWall, motionAllowed, OnAirRoom, OnAirStage } from '@/Components/dashboard/OnAir';
import { FriendOnline, FriendsRail, Goal, YourDay } from '@/Components/dashboard/YourDay';
import { poll } from '@/lib/polling';
import type { LucideIcon } from 'lucide-react';
import Avatar from '@/Components/Avatar';
import RoomCard, { NowPlaying, RoomSummary } from '@/Components/RoomCard';
import SocialIcon from '@/Components/SocialIcon';
import { Card, chip, SectionTitle, StatTile } from '@/Components/ui';
import { latestRelease } from '@/lib/latestRelease';
import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { CalendarDays, Gift, Heart, ListMusic, Music, Plus, Radio, Search, ShoppingBag, Trophy, Users } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

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
    goals: Goal[];
    continue: { name: string; slug: string; genre: string | null; at: string } | null;
    friendsOnline: FriendOnline[];
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
    return h < 5 ? ['Still up', '🦉'] : h < 12 ? ['Good morning', '☀️'] : h < 18 ? ['Good afternoon', '🎧'] : ['Good evening', '🌙'];
};

const when = (iso: string) => {
    const d = new Date(iso);
    const days = Math.round((d.getTime() - Date.now()) / 86400000);
    const day = days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : formatDate(d, { weekday: 'short', day: 'numeric', month: 'short' });
    return `${day}, ${formatTime(d)}`;
};

type Tab = 'all' | 'featured' | 'mine';
type Sort = 'listeners' | 'newest' | 'name';

export default function Dashboard({ rooms, mine, featured, genres, counts, nowPlaying, activity, stats, daily, friendIds, goals, continue: resume, friendsOnline, recommended, events, topDjs, mySongs }: Props) {
    const { auth: { user, guest }, community, pendingFriends, unreadWhispers } = usePage<PageProps>().props;
    const [creating, setCreating] = useState(false);
    const siteStats = usePage<PageProps>().props.siteStats;
    const [tab, setTab] = useState<Tab>('all');
    const [q, setQ] = useState('');
    const [genre, setGenre] = useState(() => new URLSearchParams(window.location.search).get('genre') ?? '');
    const [sort, setSort] = useState<Sort>('listeners');
    const [liveOnly, setLiveOnly] = useState(false);
    const [streamsOnly, setStreamsOnly] = useState(false);
    const [refreshFailed, setRefreshFailed] = useState(false);
    const [feed, setFeed] = useState<'all' | 'friends'>('all');
    const [rolling, setRolling] = useState<{ name: string } | null>(null);
    const spinning = useRef<number | undefined>(undefined);
    const search = useRef<HTMLInputElement>(null);

    // One background request updates the dashboard and its site counters (and today's goals, so the rings close while you play elsewhere).
    useEffect(() => {
        let mounted = true;
        const updates = poll((signal) => new Promise<void>((resolve, reject) => {
            let failed = false;
            const fail = () => { failed = true; if (mounted) setRefreshFailed(true); return false as const; };
            let cancel = () => {};
            const abort = () => cancel();
            signal.addEventListener('abort', abort, { once: true });
            router.reload({ only: ['rooms', 'mine', 'featured', 'counts', 'nowPlaying', 'activity', 'friendsOnline', 'siteStats', 'goals'],
                showProgress: false,
                onCancelToken: (token) => { cancel = () => token.cancel(); if (signal.aborted) cancel(); },
                onSuccess: () => { if (mounted) setRefreshFailed(false); },
                onHttpException: fail,
                onNetworkError: fail,
                onFinish: () => { signal.removeEventListener('abort', abort); failed || signal.aborted ? reject(new Error('Dashboard refresh interrupted')) : resolve(); },
            });
        }), { interval: 15000, immediate: false });
        return () => { mounted = false; updates.stop(); window.clearInterval(spinning.current); };
    }, []);

    // "/" anywhere on the page (outside a text box) jumps to the room search
    useEffect(() => {
        const jump = (event: KeyboardEvent) => {
            if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey || (event.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable="true"]')) return;
            event.preventDefault();
            search.current?.focus();
        };
        window.addEventListener('keydown', jump);
        return () => window.removeEventListener('keydown', jump);
    }, []);

    const online = siteStats?.listening ?? null;
    // when the song times came: they count on from here until the next refresh
    const received = useMemo(() => Date.now(), [nowPlaying]);

    // rooms on air: something to show first (a live stream, then a song), then the busiest
    const onAir: OnAirRoom[] = useMemo(() => rooms
        .map((room) => ({ room, song: nowPlaying[room.id] ?? null, listening: counts[room.id] ?? 0 }))
        .filter((entry) => entry.song || entry.room.live || entry.listening > 0)
        .sort((a, b) => Number(Boolean(b.room.live)) - Number(Boolean(a.room.live)) || Number(Boolean(b.song)) - Number(Boolean(a.song)) || b.listening - a.listening), [rooms, counts, nowPlaying]);

    // the genre most people are in right now
    const vibe = useMemo(() => {
        const score = new Map<string, number>();
        onAir.forEach(({ room, listening }) => { if (room.genre) score.set(room.genre, (score.get(room.genre) ?? 0) + 1 + listening); });
        return [...score].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    }, [onAir]);

    const source = tab === 'featured' ? featured : tab === 'mine' ? mine : rooms;
    const shown = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return source
            .filter((r) => !streamsOnly || !!r.live)
            .filter((r) => (!genre || r.genre === genre) && (!needle || `${r.name} ${r.description ?? ''} ${r.genre ?? ''} ${r.user?.name ?? ''}`.toLowerCase().includes(needle)) && (!liveOnly || (counts[r.id] ?? 0) > 0 || nowPlaying[r.id] || r.live))
            .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'newest' ? b.id - a.id : (counts[b.id] ?? 0) - (counts[a.id] ?? 0) || b.id - a.id);
    }, [source, q, genre, sort, liveOnly, streamsOnly, counts, nowPlaying]);

    const usedGenres = useMemo(() => [...new Set(rooms.map((r) => r.genre).filter(Boolean))] as string[], [rooms]);
    const feedItems = feed === 'friends' ? activity.filter((a) => friendIds.includes(a.user.id) || a.user.id === user.id) : activity;

    // Surprise me: a room on air if there is one. The names roll like a slot machine first (at once where motion is reduced).
    const surprise = () => {
        const pool = onAir.length ? onAir.map((entry) => entry.room) : rooms;
        if (!pool.length || rolling) return;
        const target = pool[Math.floor(Math.random() * pool.length)];
        const go = () => router.visit(route('rooms.show', target.slug), { onCancel: () => setRolling(null), onError: () => setRolling(null) });
        if (!motionAllowed()) {
            setRolling({ name: target.name });
            go();
            return;
        }
        let spins = 0;
        spinning.current = window.setInterval(() => {
            spins += 1;
            if (spins < 14) {
                setRolling({ name: rooms[Math.floor(Math.random() * rooms.length)].name });
                return;
            }
            window.clearInterval(spinning.current);
            setRolling({ name: target.name });
            window.setTimeout(go, 500);
        }, 90);
    };

    const quick: [LucideIcon, string, string, string][] = [
        [ListMusic, 'Playlists', route('playlists'), 'text-violet-300'],
        [Users, 'Friends', route('friends'), 'text-sky-300'],
        [ShoppingBag, 'Avatar shop', route('shop'), 'text-fuchsia-300'],
        [Gift, 'Invite & earn', route('referral'), 'text-amber-300'],
        [CalendarDays, 'Events', route('events'), 'text-emerald-300'],
        [Trophy, 'Leaderboard', route('community'), 'text-rose-300'],
    ];
    const [hello, emoji] = greeting();

    return (
        <AppLayout
            title={guest ? 'Discover' : <>{hello}, {user.name} <span aria-hidden>{emoji}</span></>}
            subtitle={onAir.length > 0
                ? <span className="flex flex-wrap items-center gap-x-2">{(online ?? 0) > 0 && <><span>🎧 <b className="tabular-nums text-neutral-200">{online}</b> listening</span><span aria-hidden>·</span></>}<span><b className="tabular-nums text-neutral-200">{onAir.length}</b> {onAir.length === 1 ? 'room on air' : 'rooms on air'}</span></span>
                : 'Good music starts with good company.'}
            actions={<div className="flex flex-wrap gap-2"><DiscordInvite /><a href="#discover-rooms" className="rounded-xl border border-white/15 px-4 py-2 text-sm text-neutral-300 hover:bg-white/5">Browse rooms</a></div>}
        >
            <Head title="Dashboard" />

            <OnAirStage rooms={onAir} received={received} guest={guest} vibe={vibe} rolling={rolling} onSurprise={surprise} onCreate={() => setCreating(true)} canSurprise={rooms.length > 0} />

            {!guest && <FriendsRail friends={friendsOnline} pendingFriends={pendingFriends} unreadWhispers={unreadWhispers} />}

            {!guest && stats ? (
                <YourDay user={user} stats={stats} goals={goals} daily={daily} resume={resume} ago={ago} />
            ) : (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatTile icon={Radio} tone="emerald" label="Listening now" value={online ?? '?'} />
                    <StatTile icon={Music} tone="violet" label="Rooms" value={rooms.length} />
                    <StatTile icon={Trophy} tone="amber" label="Top DJ plays" value={topDjs[0]?.plays ?? 0} />
                    <StatTile icon={CalendarDays} tone="sky" label="Upcoming events" value={events.length} />
                </div>
            )}

            <SiteCounters stats={siteStats} stale={refreshFailed} />

            {onAir.length >= 3 && <LiveWall rooms={onAir} received={received} />}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="space-y-8 lg:col-span-2">
                    {/* room browser */}
                    <section id="discover-rooms" className="scroll-mt-6 rounded-3xl border border-white/10 bg-neutral-900/60 p-4 sm:p-6">
                        <SectionTitle
                            title="Find your sound"
                            hint="Explore the community, or make a space of your own."
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
                                    <input ref={search} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search rooms, genres or hosts" aria-keyshortcuts="/" placeholder="Search rooms, genres, hosts" className={`${input} pl-9 sm:pr-9`} />
                                    <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-white/15 px-1.5 text-[10px] text-neutral-500 sm:block" title="Press / to search">/</kbd>
                                </div>
                                <select aria-label="Sort rooms" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={input.replace('w-full', 'w-auto')}>
                                    <option value="listeners">Most listeners</option>
                                    <option value="newest">Newest</option>
                                    <option value="name">A to Z</option>
                                </select>
                                <label className="flex items-center gap-2 text-xs text-neutral-300"><input type="checkbox" checked={liveOnly} onChange={(e) => setLiveOnly(e.target.checked)} className="rounded border-neutral-600 bg-neutral-800 text-violet-500 focus:ring-violet-500" /> Live only</label>
                                <label className="flex items-center gap-2 text-xs text-neutral-300"><input type="checkbox" checked={streamsOnly} onChange={(e) => setStreamsOnly(e.target.checked)} className="rounded border-neutral-600 bg-neutral-800 text-violet-500 focus:ring-violet-500" /> Livestreams</label>
                            </div>
                            {usedGenres.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    <button onClick={() => setGenre('')} className={chip(genre === '')}>Any genre</button>
                                    {usedGenres.map((g) => <button key={g} onClick={() => setGenre(genre === g ? '' : g)} className={chip(genre === g)}>{g}</button>)}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400"><span role="status">{shown.length} {shown.length === 1 ? 'room' : 'rooms'} found</span><span className={refreshFailed ? 'text-amber-300' : 'text-emerald-300'}>{refreshFailed ? 'Connection interrupted · retrying' : 'Updates every 15 seconds'}</span>{(q || genre || liveOnly || streamsOnly) && <button onClick={() => { setQ(''); setGenre(''); setLiveOnly(false); setStreamsOnly(false); }} className="rounded-lg bg-white/10 px-3 py-1.5 text-white hover:bg-white/20">Clear filters</button>}</div>
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

                    {/* picked for you */}
                    {!guest && recommended.rooms.length > 0 && (
                        <section>
                            <SectionTitle title="✨ Picked for you" hint={recommended.reason} />
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                {recommended.rooms.map((r) => (
                                    <Link key={r.id} href={route('rooms.show', r.slug)} data-room-name={r.name} className="rounded-2xl border border-white/10 bg-white/4 p-4 transition hover:border-violet-400/60">
                                        <p className="truncate font-bold">{r.name}</p>
                                        <p className="mt-1 text-xs text-neutral-500">{r.genre ?? 'No genre'}</p>
                                        <p className={`mt-3 text-xs ${(counts[r.id] ?? r.listening) > 0 ? 'text-green-400' : 'text-neutral-500'}`}>● {counts[r.id] ?? r.listening} listening</p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
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

                    <section>
                        <SectionTitle title="Upcoming events" action={<Link href={route('events')} className="text-xs text-violet-400 hover:underline">All →</Link>} />
                        <Card className="divide-y divide-white/5">
                            {events.length === 0 && <p className="p-4 text-sm text-neutral-500">No events planned yet.</p>}
                            {events.map((e) => (
                                <Link key={e.id} href={e.room ? route('rooms.show', e.room.slug) : route('events')} className="flex gap-3 p-4 hover:bg-white/3">
                                    <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-violet-500/15 text-violet-200" aria-hidden>
                                        <span className="text-[10px] font-bold uppercase">{formatDate(e.starts_at, { month: 'short' })}</span>
                                        <span className="text-lg font-black leading-none">{formatDate(e.starts_at, { day: 'numeric' })}</span>
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block font-semibold">{e.title}</span>
                                        <span className="mt-0.5 block text-xs text-violet-300">{when(e.starts_at)}</span>
                                        <span className="mt-0.5 block text-xs text-neutral-500">{e.room ? `in ${e.room.name} · ` : ''}{e.going_count} going</span>
                                    </span>
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
                            <Card className="px-4 pt-5">
                                {/* the podium: second, first, third */}
                                <div className="flex items-end justify-center gap-2">
                                    {[1, 0, 2].map((place) => {
                                        const dj = topDjs[place];
                                        if (!dj) return <span key={place} className="w-1/3" />;
                                        return (
                                            <Link key={dj.id} href={route('users.show', dj.id)} className="group flex w-1/3 min-w-0 flex-col items-center">
                                                <Avatar name={dj.name} avatar={dj.avatar} className={`${place === 0 ? 'h-14 w-14 text-xl ring-2 ring-amber-300/70' : 'h-11 w-11 text-base'} transition group-hover:scale-105`} />
                                                <span className="mt-1.5 max-w-full truncate text-xs font-semibold group-hover:underline">{dj.name}</span>
                                                <span className="text-[10px] text-neutral-500"><b className="tabular-nums">{dj.plays}</b> songs</span>
                                                <span className={`mt-2 flex w-full justify-center rounded-t-lg pt-1.5 text-lg ${place === 0 ? 'h-16 bg-amber-400/20' : place === 1 ? 'h-12 bg-neutral-300/15' : 'h-9 bg-orange-700/25'}`} aria-hidden>{['🥇', '🥈', '🥉'][place]}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                                {topDjs.length > 3 && (
                                    <div className="-mx-4 divide-y divide-white/5 border-t border-white/5">
                                        {topDjs.slice(3).map((dj, i) => (
                                            <Link key={dj.id} href={route('users.show', dj.id)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/3">
                                                <span className="w-5 text-center text-xs text-neutral-500">{i + 4}</span>
                                                <Avatar name={dj.name} avatar={dj.avatar} className="h-7 w-7 text-sm" />
                                                <span className="min-w-0 flex-1 truncate">{dj.name}</span>
                                                <span className="text-xs text-neutral-500"><span className="tabular-nums">{dj.plays}</span> songs</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
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
                        <SectionTitle title={`What's new · v${latestRelease.version}`} action={<Link href={route('patch-notes')} className="text-xs text-violet-400 hover:underline">All notes →</Link>} />
                        <Card className="p-4">
                            <p className="font-semibold">{latestRelease.title}</p>
                            <ul className="mt-2 space-y-2 text-sm text-neutral-400">
                                {latestRelease.notes.slice(0, 3).map(([kind, text]) => (
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
