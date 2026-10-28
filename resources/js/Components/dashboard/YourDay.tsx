import Avatar from '@/Components/Avatar';
import { CoinIcon } from '@/Components/CoinIcon';
import { Card, OnlineDot } from '@/Components/ui';
import { levelPercent, toNextText } from '@/lib/level';
import { Cosmetics } from '@/lib/cosmetics';
import { Link, router } from '@inertiajs/react';
import { CheckCircle2, Music, Radio, ThumbsUp, Trophy, UserPlus, Users } from 'lucide-react';
import { ReactNode, useId } from 'react';

export interface FriendOnline {
    id: number;
    name: string;
    avatar: string | null;
    online: boolean;
    status?: string;
    room: { name: string; slug: string } | null;
}

export interface Goal {
    key: string;
    title: string;
    have: number;
    goal: number;
    href: string | null;
}

/**
 * Who is around: friends online as a row of faces. A coloured ring means they are in a room (the face takes you there), a quiet one that they are
 * just online (the face opens their profile). Friend requests and unread whispers sit at the front of the row.
 */
export function FriendsRail({ friends, pendingFriends, unreadWhispers }: { friends: FriendOnline[]; pendingFriends: number; unreadWhispers: number }) {
    const bubble = 'flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full text-2xl transition group-hover:scale-105';

    return (
        <section aria-label="Friends around now" className="rounded-2xl border border-white/10 bg-white/4 px-4 pb-3 pt-3.5">
            <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Who&apos;s around</h2>
                <Link href={route('friends')} className="text-xs text-violet-400 hover:underline">All friends →</Link>
            </div>
            <ul className="flex gap-4 overflow-x-auto pb-1">
                {pendingFriends > 0 && (
                    <li className="w-20 shrink-0 text-center">
                        <Link href={route('friends')} className="group block">
                            <span className={`${bubble} mx-auto bg-sky-500/15 ring-2 ring-sky-400/60`} aria-hidden>👋</span>
                            <span className="mt-1.5 block truncate text-xs font-semibold text-sky-200"><b className="tabular-nums">{pendingFriends}</b> {pendingFriends === 1 ? 'request' : 'requests'}</span>
                            <span className="block text-[10px] text-neutral-500">waiting</span>
                        </Link>
                    </li>
                )}
                {unreadWhispers > 0 && (
                    <li className="w-20 shrink-0 text-center">
                        <Link href={route('whispers')} className="group block">
                            <span className={`${bubble} mx-auto bg-violet-500/15 ring-2 ring-violet-400/60`} aria-hidden>💬</span>
                            <span className="mt-1.5 block truncate text-xs font-semibold text-violet-200"><b className="tabular-nums">{unreadWhispers}</b> {unreadWhispers === 1 ? 'whisper' : 'whispers'}</span>
                            <span className="block text-[10px] text-neutral-500">unread</span>
                        </Link>
                    </li>
                )}
                {friends.map((friend) => (
                    <li key={friend.id} className="w-20 shrink-0 text-center">
                        <Link href={friend.room ? route('rooms.show', friend.room.slug) : route('users.show', friend.id)} className="group block">
                            <span className={`mx-auto block w-fit rounded-full p-[2.5px] transition group-hover:scale-105 ${friend.room ? 'bg-linear-to-tr from-emerald-400 via-sky-400 to-violet-500' : 'bg-white/15'}`}>
                                <span className="relative block rounded-full bg-neutral-950 p-[2px]">
                                    <Avatar name={friend.name} avatar={friend.avatar} className="h-[3.25rem] w-[3.25rem] text-xl" />
                                    <OnlineDot online status={friend.status} className="absolute bottom-0 right-0" />
                                </span>
                            </span>
                            <span className="sr-only">{friend.room ? 'Join them in their room' : 'Open their profile'}</span>
                        </Link>
                        <Link href={route('users.show', friend.id)} className="mt-1.5 block truncate text-xs font-semibold hover:underline">{friend.name}</Link>
                        {friend.room ? <Link href={route('rooms.show', friend.room.slug)} className="block truncate text-[10px] text-emerald-300 hover:underline">▶ {friend.room.name}</Link> : <span className="block text-[10px] text-neutral-500">online</span>}
                    </li>
                ))}
                {friends.length === 0 && (
                    <li className="flex min-w-0 flex-1 items-center gap-3 self-center text-sm text-neutral-500">
                        None of your friends is around right now.
                    </li>
                )}
                <li className="w-20 shrink-0 text-center">
                    <Link href={route('friends')} className="group block">
                        <span className={`${bubble} mx-auto border border-dashed border-white/25 text-neutral-400 group-hover:border-violet-400/70 group-hover:text-violet-200`}><UserPlus size={20} /></span>
                        <span className="mt-1.5 block truncate text-xs text-neutral-400">Find friends</span>
                    </Link>
                </li>
            </ul>
        </section>
    );
}

// the three daily goals as rings, outside in: get a song played, woot, chat
const RING_COLORS: Record<string, string> = { play: '#e879f9', woot: '#34d399', chat: '#38bdf8' };
const RING_RADII = [44, 33, 22];

function DailyRings({ goals }: { goals: Goal[] }) {
    const done = goals.filter((g) => g.have >= g.goal).length;

    return (
        <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0 -rotate-90" role="img" aria-label={`${done} of ${goals.length} goals done`}>
            {goals.slice(0, 3).map((g, i) => {
                const color = RING_COLORS[g.key] ?? '#a78bfa';
                const share = Math.min(100, (g.have / Math.max(1, g.goal)) * 100);
                return (
                    <g key={g.key}>
                        <circle cx="50" cy="50" r={RING_RADII[i]} fill="none" stroke={color} strokeOpacity={0.16} strokeWidth="9" />
                        {share > 0 && <circle cx="50" cy="50" r={RING_RADII[i]} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" pathLength={100} strokeDasharray={`${share} 100`} style={g.have >= g.goal ? { filter: `drop-shadow(0 0 3px ${color})` } : undefined} />}
                    </g>
                );
            })}
        </svg>
    );
}

/** A ring round the face that fills as the level goes on. */
function LevelRing({ percent, children }: { percent: number; children: ReactNode }) {
    const gradient = useId();

    return (
        <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
                <defs>
                    <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#d946ef" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient>
                </defs>
                <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                {percent > 0 && <circle cx="50" cy="50" r="46" fill="none" stroke={`url(#${gradient})`} strokeWidth="5" strokeLinecap="round" pathLength={100} strokeDasharray={`${percent} 100`} />}
            </svg>
            <div className="absolute inset-[9px]">{children}</div>
        </div>
    );
}

/**
 * Your day on SFD: your level as a ring round your face, today's three goals as rings that close as you play, woot and chat, the daily coins,
 * your numbers, and the room you were last in.
 */
export function YourDay({ user, stats, goals, daily, resume, ago }: {
    user: { name: string; avatar: string | null; cosmetics?: Cosmetics | null };
    stats: { xp: number; level: number; rank: number; songs_played: number; woots: number; friends: number };
    goals: Goal[];
    daily: { amount: number; claimable: boolean } | null;
    resume: { name: string; slug: string; genre: string | null; at: string } | null;
    ago: (iso: string) => string;
}) {
    const done = goals.filter((g) => g.have >= g.goal).length;
    const numbers: [typeof Music, string, number][] = [[Music, 'Songs played', stats.songs_played], [ThumbsUp, 'Woots received', stats.woots], [Users, 'Friends', stats.friends]];

    return (
        <section aria-label="Your day" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="flex items-center gap-5 p-5">
                <LevelRing percent={levelPercent(stats.xp, stats.level)}>
                    <Avatar name={user.name} avatar={user.avatar} cosmetics={user.cosmetics} className="h-full w-full text-3xl" />
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-linear-to-r from-fuchsia-500 to-violet-500 px-2 py-0.5 text-[10px] font-black tabular-nums shadow-lg">{stats.level}</span>
                </LevelRing>
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Level <span className="tabular-nums">{stats.level}</span></p>
                    <p className="mt-1 text-sm text-neutral-300">{toNextText(stats.xp, stats.level)}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-sm"><Trophy size={15} className="text-amber-300" /> <b className="tabular-nums">#{stats.rank}</b> <span className="text-neutral-400">on the leaderboard</span></p>
                </div>
            </Card>

            <Card className="flex items-center gap-5 p-5">
                <div className="relative">
                    <DailyRings goals={goals} />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-black tabular-nums">{done === goals.length && goals.length > 0 ? '🎉' : `${done}/${goals.length}`}</span>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{done === goals.length && goals.length > 0 ? 'All done today' : "Today's goals"}</p>
                    <ul className="mt-2 space-y-1.5">
                        {/* `goal`, not `g`: the titles are interface text the page translates, not something a person wrote */}
                        {goals.map((goal) => (
                            <li key={goal.key} className="flex items-center gap-2 text-sm">
                                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: RING_COLORS[goal.key] ?? '#a78bfa' }} />
                                {goal.href && goal.have < goal.goal ? <Link href={route(goal.href)} className="min-w-0 flex-1 truncate hover:underline">{goal.title}</Link> : <span className={`min-w-0 flex-1 truncate ${goal.have >= goal.goal ? 'text-neutral-500 line-through' : ''}`}>{goal.title}</span>}
                                {goal.have >= goal.goal ? <CheckCircle2 size={15} className="shrink-0 text-green-400" /> : <span className="shrink-0 text-xs tabular-nums text-neutral-500">{goal.have}/{goal.goal}</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            </Card>

            <Card className="flex flex-col gap-3 p-5">
                {daily && (daily.claimable ? (
                    <button type="button" onClick={() => router.post(route('shop.daily'), {}, { preserveScroll: true })} data-daily className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/20"><CoinIcon className="h-4 w-4" /> Claim {daily.amount} daily coins</button>
                ) : (
                    <p className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/4 px-3 py-2.5 text-sm text-neutral-400"><CoinIcon className="h-4 w-4 opacity-60" /> Daily coins claimed. See you tomorrow!</p>
                ))}
                <dl className="grid grid-cols-3 gap-2 text-center">
                    {numbers.map(([Icon, label, value]) => (
                        <div key={label} className="rounded-xl bg-white/4 px-2 py-2">
                            <dt className="flex items-center justify-center gap-1 text-[10px] text-neutral-500"><Icon size={11} /> {label}</dt>
                            <dd className="mt-0.5 text-lg font-black tabular-nums">{value.toLocaleString()}</dd>
                        </div>
                    ))}
                </dl>
                {resume && (
                    <Link href={route('rooms.show', resume.slug)} data-room-name={resume.name} className="group mt-auto flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 transition hover:border-violet-400/60">
                        <Radio size={16} className="shrink-0 text-violet-300" />
                        <span className="min-w-0 flex-1">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Pick up where you left off</span>
                            <span className="block truncate text-sm font-semibold">{resume.name} <span className="font-normal text-neutral-500">· {ago(resume.at)}</span></span>
                        </span>
                        <span className="text-xs font-semibold text-violet-300 group-hover:text-violet-200">Rejoin →</span>
                    </Link>
                )}
            </Card>
        </section>
    );
}
