import Avatar from '@/Components/Avatar';
import { levelPercent, toNextText } from '@/lib/level';
import CommunityTab, { CommunityAdmin } from '@/Components/CommunityTab';
import RoleBadge from '@/Components/RoleBadge';
import SocialIcon from '@/Components/SocialIcon';
import { Card, EmptyState, ProgressBar, SectionTitle, StatTile, Tabs } from '@/Components/ui';
import AppLayout from '@/Layouts/AppLayout';
import { ago } from '@/lib/time';
import { PageProps, RoleInfo } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Disc3, Flame, MessageCircle, Music, ThumbsUp, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';

interface Person {
    id: number;
    name: string;
    avatar: string | null;
    primary_role: RoleInfo;
}

interface Props {
    stats: { members: number; rooms: number; songs_played: number; messages: number };
    pulse: { messages: number; songs: number; joined: number; woots: number };
    week: {
        songs: { title: string; thumbnail: string | null; woots: number; dj: { id: number; name: string }; room: { name: string; slug: string } }[];
        djs: (Person & { plays: number })[];
        rooms: { id: number; name: string; slug: string; genre: string | null; plays: number }[];
        chatters: (Person & { messages: number })[];
    };
    newest: { id: number; name: string; avatar: string | null; joined: string }[];
    genres: { genre: string; n: number }[];
    team: (Person & { bio: string | null })[];
    inviters: (Person & { count: number })[];
    me: { xp: number; level: number; rank: number; from: number; to: number } | null;
    topXp: (Person & { xp: number; level: number })[];
    topDjs: (Person & { plays: number })[];
    canEdit: boolean;
    settings: CommunityAdmin | null;
}

type Tab = 'overview' | 'leaders' | 'week' | 'team';

const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function Row({ i, p, right }: { i: number; p: Person; right: string }) {
    return (
        <li>
            <Link href={route('users.show', p.id)} className="flex items-center gap-3 p-3 hover:bg-white/3">
                <span className="w-6 text-center text-sm font-bold text-neutral-500">{['🥇', '🥈', '🥉'][i] ?? i + 1}</span>
                <Avatar name={p.name} avatar={p.avatar} />
                <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                <RoleBadge role={p.primary_role} />
                <span className="text-xs text-neutral-400">{right}</span>
            </Link>
        </li>
    );
}

/** The three best, as a podium: second, first, third. */
function Podium({ people }: { people: (Person & { xp: number; level: number })[] }) {
    const order = [
        { p: people[1], medal: '🥈', height: 'h-24', tint: 'from-slate-300/30' },
        { p: people[0], medal: '🥇', height: 'h-32', tint: 'from-amber-300/40' },
        { p: people[2], medal: '🥉', height: 'h-20', tint: 'from-orange-400/30' },
    ];

    return (
        <div className="grid grid-cols-3 items-end gap-3">
            {order.map(({ p, medal, height, tint }) => (
                <Link key={p.id} href={route('users.show', p.id)} className="flex flex-col items-center text-center">
                    <span className="text-2xl">{medal}</span>
                    <Avatar name={p.name} avatar={p.avatar} className="mt-1 h-14 w-14 text-xl" />
                    <p className="mt-2 max-w-full truncate text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-neutral-400">Lv {p.level} · {p.xp} XP</p>
                    <div className={`mt-2 w-full rounded-t-xl bg-linear-to-t ${tint} to-transparent ${height}`} />
                </Link>
            ))}
        </div>
    );
}

function Board({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
    return (
        <section>
            <SectionTitle title={title} hint={hint} />
            <Card>{children}</Card>
        </section>
    );
}

export default function Community({ stats, pulse, week, newest, genres, team, inviters, me, topXp, topDjs, canEdit, settings }: Props) {
    const { community } = usePage<PageProps>().props;
    const [tab, setTab] = useState<Tab>('overview');
    const [editing, setEditing] = useState(false);
    const links = Object.entries(community.social);
    const goal = community.donation;
    const progress = me ? levelPercent(me.xp, me.level) : 0;
    const topGenre = Math.max(1, ...genres.map((g) => g.n));

    return (
        <AppLayout title="Community" subtitle="The people, the songs and the leaderboards of SFD-DJ.EU.">
            <Head title="Community" />

            {/* today */}
            <section className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 lg:grid-cols-4">
                {([[MessageCircle, 'Messages today', pulse.messages], [Music, 'Songs played today', pulse.songs], [ThumbsUp, 'Woots today', pulse.woots], [UserPlus, 'New members today', pulse.joined]] as const).map(([Icon, label, value]) => (
                    <div key={label} className="flex items-center gap-3 bg-neutral-950/80 p-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-fuchsia-500/25 to-violet-500/25 text-violet-200"><Icon size={19} /></span>
                        <span><span className="block text-2xl font-black tabular-nums leading-none">{value}</span><span className="text-xs text-neutral-400">{label}</span></span>
                    </div>
                ))}
            </section>

            {me && (
                <div className="rounded-2xl border border-white/10 bg-linear-to-br from-fuchsia-600/20 via-violet-600/10 to-transparent p-5">
                    <div className="mb-2 flex items-baseline justify-between">
                        <p className="text-lg font-black">Level {me.level}</p>
                        <p className="text-sm text-neutral-300">{me.xp} XP · rank #{me.rank}</p>
                    </div>
                    <ProgressBar value={progress} />
                    <p className="mt-2 text-xs text-neutral-400">{toNextText(me.xp, me.level)}. Earn XP by chatting (+2), having your songs played (+10) and inviting friends (+100).</p>
                </div>
            )}

            <Tabs<Tab>
                active={tab}
                onChange={setTab}
                tabs={[{ key: 'overview', label: 'Overview' }, { key: 'leaders', label: 'Leaderboards' }, { key: 'week', label: 'This week', icon: Flame }, { key: 'team', label: 'The team', count: team.length }]}
            />

            {tab === 'overview' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <StatTile icon={Users} tone="sky" label="Members" value={stats.members.toLocaleString()} />
                        <StatTile icon={Disc3} tone="fuchsia" label="Rooms" value={stats.rooms.toLocaleString()} />
                        <StatTile icon={Music} tone="violet" label="Songs played" value={stats.songs_played.toLocaleString()} />
                        <StatTile icon={MessageCircle} tone="emerald" label="Messages" value={stats.messages.toLocaleString()} />
                    </div>

                    {(links.length > 0 || goal || canEdit) && (
                        <Card className="space-y-4 p-5">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="font-semibold">Follow SFD-DJ.EU</h2>
                                {canEdit && <button onClick={() => setEditing(!editing)} className="rounded-md bg-white/10 px-3 py-1 text-xs hover:bg-white/20">{editing ? 'Close editor' : 'Edit links & donation goal'}</button>}
                            </div>
                            {links.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {links.map(([key, url]) => (
                                        <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20">
                                            <SocialIcon name={key} /> <span className="capitalize">{key}</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                            {links.length === 0 && !goal && <p className="text-sm text-neutral-500">No links or donation goal have been set up yet.</p>}
                            {goal && (
                                <div>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <p className="text-sm"><span className="font-semibold">❤ {goal.title}</span> <span className="text-neutral-400">{goal.currency}{goal.current} of {goal.currency}{goal.goal} ({goal.percent}%)</span></p>
                                        {goal.url && <a href={goal.url} target="_blank" rel="noopener noreferrer" className="rounded-md bg-pink-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-pink-400">Donate</a>}
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-linear-to-r from-pink-500 to-fuchsia-500" style={{ width: `${goal.percent}%` }} /></div>
                                </div>
                            )}
                            {editing && settings && <div className="border-t border-white/10 pt-4"><CommunityTab community={settings} /></div>}
                        </Card>
                    )}

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <section>
                            <SectionTitle title="What people listen to" hint="Public rooms by genre" />
                            <Card className="space-y-3 p-5">
                                {genres.length === 0 && <p className="text-sm text-neutral-500">No genres yet. Pick one when you create a room.</p>}
                                {genres.map((g) => (
                                    <Link key={g.genre} href={`${route('dashboard')}?genre=${encodeURIComponent(g.genre)}`} className="group block">
                                        <div className="mb-1 flex justify-between text-sm"><span className="group-hover:text-violet-300">{g.genre}</span><span className="text-neutral-500">{g.n} {g.n === 1 ? 'room' : 'rooms'}</span></div>
                                        <ProgressBar className="h-1.5" value={(g.n / topGenre) * 100} />
                                    </Link>
                                ))}
                            </Card>
                        </section>

                        <section>
                            <SectionTitle title="Newest members" hint="Say hi!" />
                            <Card className="grid grid-cols-2 gap-1 p-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                                {newest.map((u) => (
                                    <Link key={u.id} href={route('users.show', u.id)} className="flex flex-col items-center rounded-xl p-3 text-center hover:bg-white/5">
                                        <Avatar name={u.name} avatar={u.avatar} className="h-12 w-12 text-lg" />
                                        <span className="mt-2 max-w-full truncate text-sm font-medium">{u.name}</span>
                                        <span className="text-[11px] text-neutral-500">{ago(u.joined)}</span>
                                    </Link>
                                ))}
                            </Card>
                        </section>
                    </div>
                </div>
            )}

            {tab === 'leaders' && (
                <div className="space-y-8">
                    {topXp.length >= 3 && (
                        <Card className="p-6">
                            <SectionTitle title="🏆 Top 3" hint="Most XP on SFD-DJ.EU" />
                            <Podium people={topXp} />
                        </Card>
                    )}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Board title="XP leaderboard"><ul className="divide-y divide-white/5">{topXp.map((p, i) => <Row key={p.id} i={i} p={p} right={`Lv ${p.level} · ${p.xp} XP`} />)}</ul></Board>
                        <div className="space-y-6">
                            <Board title="Top DJs" hint="Songs played, all time">
                                <ul className="divide-y divide-white/5">
                                    {topDjs.length === 0 && <li className="p-4 text-sm text-neutral-500">No songs played yet.</li>}
                                    {topDjs.map((p, i) => <Row key={p.id} i={i} p={p} right={count(p.plays, 'song')} />)}
                                </ul>
                            </Board>
                            <Board title="Top inviters" hint="Friends brought to SFD-DJ.EU">
                                <ul className="divide-y divide-white/5">
                                    {inviters.length === 0 && <li className="p-4 text-sm text-neutral-500">Nobody has invited anyone yet.</li>}
                                    {inviters.map((p, i) => <Row key={p.id} i={i} p={p} right={`${p.count} invited`} />)}
                                </ul>
                            </Board>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'week' && (
                <div className="space-y-8">
                    <section>
                        <SectionTitle title="🔥 Songs of the week" hint="The most wooted songs in the last 7 days" />
                        {week.songs.length === 0 ? <EmptyState icon="🎵" title="No woots this week yet" text="Play a song in a public room and ask the crowd to woot it." /> : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {week.songs.map((s, i) => (
                                    <Link key={s.title + i} href={route('rooms.show', s.room.slug)} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/4 transition hover:border-violet-400/60">
                                        <div className="relative h-32 bg-linear-to-br from-fuchsia-600/40 to-violet-900/50">
                                            {s.thumbnail && <img src={s.thumbnail} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105" />}
                                            <div className="absolute inset-0 bg-linear-to-t from-neutral-950 to-transparent" />
                                            <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold">#{i + 1}</span>
                                            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-green-500/90 px-2 py-0.5 text-xs font-bold text-black"><ThumbsUp size={12} /> {s.woots}</span>
                                        </div>
                                        <div className="p-4">
                                            <p className="truncate font-semibold">{s.title}</p>
                                            <p className="truncate text-xs text-neutral-500">played by {s.dj.name} in {s.room.name}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <Board title="Busiest DJs" hint="Songs played this week">
                            <ul className="divide-y divide-white/5">
                                {week.djs.length === 0 && <li className="p-4 text-sm text-neutral-500">Quiet week so far.</li>}
                                {week.djs.map((p, i) => <Row key={p.id} i={i} p={p} right={count(p.plays, 'song')} />)}
                            </ul>
                        </Board>
                        <Board title="Busiest rooms" hint="Songs played this week">
                            <ul className="divide-y divide-white/5">
                                {week.rooms.length === 0 && <li className="p-4 text-sm text-neutral-500">No rooms played anything yet.</li>}
                                {week.rooms.map((r, i) => (
                                    <li key={r.id}><Link href={route('rooms.show', r.slug)} className="flex items-center gap-3 p-3 hover:bg-white/3"><span className="w-6 text-center text-sm font-bold text-neutral-500">{['🥇', '🥈', '🥉'][i] ?? i + 1}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm">{r.name}</span><span className="text-xs text-neutral-500">{r.genre ?? 'No genre'}</span></span><span className="text-xs text-neutral-400">{count(r.plays, 'song')}</span></Link></li>
                                ))}
                            </ul>
                        </Board>
                        <Board title="Top chatters" hint="Messages this week">
                            <ul className="divide-y divide-white/5">
                                {week.chatters.length === 0 && <li className="p-4 text-sm text-neutral-500">Nobody has chatted yet.</li>}
                                {week.chatters.map((p, i) => <Row key={p.id} i={i} p={p} right={count(p.messages, 'message')} />)}
                            </ul>
                        </Board>
                    </div>
                </div>
            )}

            {tab === 'team' && (
                <section>
                    <SectionTitle title="Meet the team" hint="The people who keep SFD-DJ.EU running. Say hello in a room, or write to them through Contact." />
                    {team.length === 0 ? <EmptyState icon="🛠️" title="No team listed yet" /> : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {team.map((p) => (
                                <Link key={p.id} href={route('users.show', p.id)} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/4 p-5 transition hover:border-violet-400/60">
                                    <Avatar name={p.name} avatar={p.avatar} className="h-14 w-14 text-xl" />
                                    <span className="min-w-0">
                                        <span className="block truncate font-bold" style={{ color: p.primary_role.color }}>{p.name}</span>
                                        <RoleBadge role={p.primary_role} showMember />
                                        {p.bio && <span className="mt-2 block text-sm text-neutral-400">{p.bio}</span>}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            )}
        </AppLayout>
    );
}
