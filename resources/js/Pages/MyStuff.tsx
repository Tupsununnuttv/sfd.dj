import Avatar from '@/Components/Avatar';
import { levelPercent, toNextText } from '@/lib/level';
import RoleBadge from '@/Components/RoleBadge';
import RoomBadge from '@/Components/RoomBadge';
import { Card, EmptyState, ghostBtn, ProgressBar, SectionTitle, StatTile, Tabs } from '@/Components/ui';
import AppLayout from '@/Layouts/AppLayout';
import { ago } from '@/lib/time';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle2, Circle, Gift, Music, ThumbsUp, Users, Zap } from 'lucide-react';
import { useState } from 'react';

interface Achievement {
    key: string;
    title: string;
    text: string;
    icon: string;
    have: number;
    goal: number;
    done: boolean;
}

interface Props {
    stats: { xp: number; level: number; songs_played: number; woots: number; grabs: number; friends: number; referrals: number; messages: number };
    rooms: { id: number; name: string; slug: string; genre: string | null; is_private: boolean; badges: string[] | null; items_count: number; created_at: string }[];
    playlists: { id: number; name: string; kind: string; songs_count: number }[];
    recent: { id: number; title: string; thumbnail: string | null; played_at: string; room: { name: string; slug: string } }[];
    worn: Record<string, string | null>;
    account: { joined: string; username: string; email_verified: boolean; two_factor: boolean; discord: string | null; photo: boolean };
    achievements: Achievement[];
}

type Tab = 'overview' | 'achievements' | 'rooms' | 'playlists' | 'songs';

export default function MyStuff({ stats, rooms, playlists, recent, worn, account, achievements }: Props) {
    const { user } = usePage<PageProps>().props.auth;
    const [tab, setTab] = useState<Tab>('overview');

    const lv = stats.level;
    const done = achievements.filter((a) => a.done);
    const almost = achievements.filter((a) => !a.done).sort((a, b) => b.have / b.goal - a.have / a.goal).slice(0, 3);

    const checklist: [boolean, string, string, string][] = [
        [account.email_verified, 'Email confirmed', 'So you can get back in if you forget your password', route('verification.notice')],
        [account.two_factor, 'Two-factor login', 'Protects your account even if your password leaks', route('settings.account')],
        [account.photo, 'Profile picture', 'Upload a photo or choose an avatar', route('profile.edit')],
        [!!account.discord, 'Discord linked', account.discord ? `Linked as ${account.discord}` : 'Show your Discord name on your profile', route('settings.connections')],
    ];
    const secure = checklist.filter(([ok]) => ok).length;

    const wornItems = Object.entries(worn).filter(([, v]) => v);

    return (
        <AppLayout
            title="My Stuff"
            subtitle="Everything that is yours on SFD-DJ.EU, in one place."
            actions={<Link href={route('users.show', user.id)} className={ghostBtn}>View my public profile</Link>}
        >
            <Head title="My Stuff" />

            {/* who you are */}
            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-600/20 via-violet-600/10 to-sky-600/10 p-6 sm:p-8">
                <div className="pointer-events-none absolute -right-14 -top-14 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />
                <div className="relative flex flex-wrap items-center gap-6">
                    <Avatar name={user.name} avatar={user.avatar} cosmetics={user.cosmetics} className="h-24 w-24 text-4xl" />
                    <div className="min-w-0 flex-1">
                        <h2 className="flex flex-wrap items-center gap-3 text-2xl font-black tracking-tight">{user.name} <RoleBadge role={user.primary_role} /></h2>
                        <p className="text-sm text-neutral-400">@{account.username} · member since {new Date(account.joined).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <div className="mt-4 max-w-md">
                            <div className="mb-1.5 flex items-baseline justify-between text-xs text-neutral-300"><span className="font-semibold">Level {lv}</span><span>{stats.xp.toLocaleString()} XP · {toNextText(stats.xp, lv)}</span></div>
                            <ProgressBar value={levelPercent(stats.xp, lv)} />
                        </div>
                    </div>
                    <div className="min-w-48 rounded-2xl bg-black/25 p-4 text-sm">
                        <p className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-400">Wearing <Link href={route('shop')} className="normal-case text-violet-300 hover:underline">Shop</Link></p>
                        {wornItems.length === 0 ? <p className="text-neutral-500">Nothing yet</p> : (
                            <dl className="space-y-1">{wornItems.map(([slot, name]) => <div key={slot} className="flex justify-between gap-4"><dt className="text-neutral-500">{slot}</dt><dd>{name}</dd></div>)}</dl>
                        )}
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <StatTile icon={Zap} tone="amber" label="XP" value={stats.xp.toLocaleString()} />
                <StatTile icon={Music} tone="violet" label="Songs played" value={stats.songs_played} />
                <StatTile icon={ThumbsUp} tone="emerald" label="Woots received" value={stats.woots} />
                <StatTile icon={Gift} tone="fuchsia" label="Grabs received" value={stats.grabs} />
                <StatTile icon={Users} tone="sky" label="Friends" value={stats.friends} />
            </div>

            <Tabs<Tab>
                active={tab}
                onChange={setTab}
                tabs={[
                    { key: 'overview', label: 'Overview' },
                    { key: 'achievements', label: 'Achievements', count: done.length },
                    { key: 'rooms', label: 'Rooms', count: rooms.length },
                    { key: 'playlists', label: 'Playlists', count: playlists.length },
                    { key: 'songs', label: 'Recent songs', count: recent.length },
                ]}
            />

            {tab === 'overview' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <section>
                        <SectionTitle title="Account checklist" hint={`${secure} of ${checklist.length} done`} />
                        <Card className="divide-y divide-white/5">
                            {checklist.map(([ok, title, text, href]) => (
                                <Link key={title} href={href} className="flex items-center gap-3 p-4 hover:bg-white/[0.03]">
                                    {ok ? <CheckCircle2 size={20} className="shrink-0 text-green-400" /> : <Circle size={20} className="shrink-0 text-neutral-600" />}
                                    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{title}</span><span className="block truncate text-xs text-neutral-500">{text}</span></span>
                                    {!ok && <span className="text-xs font-semibold text-violet-300">Set up →</span>}
                                </Link>
                            ))}
                        </Card>
                    </section>

                    <section>
                        <SectionTitle title="Closest achievements" action={<button onClick={() => setTab('achievements')} className="text-xs text-violet-400 hover:underline">All →</button>} />
                        <Card className="divide-y divide-white/5">
                            {almost.length === 0 && <p className="p-4 text-sm text-neutral-500">You have them all. 🎉</p>}
                            {almost.map((a) => (
                                <div key={a.key} className="flex items-center gap-3 p-4">
                                    <span className="text-2xl">{a.icon}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold">{a.title} <span className="font-normal text-neutral-500">{a.have}/{a.goal}</span></p>
                                        <p className="text-xs text-neutral-500">{a.text}</p>
                                        <ProgressBar className="mt-2 h-1.5" value={(a.have / a.goal) * 100} />
                                    </div>
                                </div>
                            ))}
                        </Card>
                    </section>

                    <section className="lg:col-span-2">
                        <SectionTitle title="Recently played by me" action={<Link href={route('history', { mine: 1 })} className="text-xs text-violet-400 hover:underline">History →</Link>} />
                        {recent.length === 0 ? <EmptyState icon="🎧" title="None of your songs has been played yet" text="Add a song to a room's waitlist and wait for your turn." /> : (
                            <Card className="divide-y divide-white/5">
                                {recent.slice(0, 4).map((s) => <SongRow key={s.id} s={s} />)}
                            </Card>
                        )}
                    </section>
                </div>
            )}

            {tab === 'achievements' && (
                <>
                    <p className="text-sm text-neutral-400">{done.length} of {achievements.length} unlocked. They are worked out from what you do on SFD-DJ.EU.</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {achievements.map((a) => (
                            <Card key={a.key} className={`p-4 ${a.done ? 'border-amber-400/30 bg-amber-400/[0.06]' : ''}`}>
                                <div className="flex items-start gap-3">
                                    <span className={`text-3xl ${a.done ? '' : 'opacity-40 grayscale'}`}>{a.icon}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold">{a.title} {a.done && <span className="text-xs text-amber-300">✓ Unlocked</span>}</p>
                                        <p className="text-xs text-neutral-400">{a.text}</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                    <ProgressBar className="h-1.5 flex-1" value={(a.have / a.goal) * 100} />
                                    <span className="text-xs tabular-nums text-neutral-500">{a.have}/{a.goal}</span>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {tab === 'rooms' && (
                rooms.length === 0 ? (
                    <EmptyState icon="🏠" title="You have not created a room yet" text="A room is yours to host: pick the genre, set the rules, give roles to friends." action={<Link href={route('dashboard')} className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-5 py-2 text-sm font-semibold">Create a room</Link>} />
                ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {rooms.map((r) => (
                            <Link key={r.id} href={route('rooms.show', r.slug)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-violet-400/60">
                                <div className="flex items-center gap-2"><h3 className="truncate font-bold">{r.name}</h3><RoomBadge badges={r.badges} />{r.is_private && <span title="Private">🔒</span>}</div>
                                <p className="mt-1 text-sm text-neutral-400">{r.genre ?? 'No genre'} · {r.items_count} in queue · created {ago(r.created_at)}</p>
                            </Link>
                        ))}
                    </div>
                )
            )}

            {tab === 'playlists' && (
                <>
                    <div className="flex justify-end"><Link href={route('playlists')} className={ghostBtn}>Manage playlists</Link></div>
                    <Card className="divide-y divide-white/5">
                        {playlists.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-4 text-sm">
                                <span>{`🎵 ${p.name}`}</span>
                                <span className="text-xs text-neutral-500">{p.songs_count} songs</span>
                            </div>
                        ))}
                        {playlists.length === 0 && <p className="p-4 text-sm text-neutral-500">No playlists yet.</p>}
                    </Card>
                </>
            )}

            {tab === 'songs' && (
                recent.length === 0 ? <EmptyState icon="🎧" title="None of your songs has been played yet" /> : <Card className="divide-y divide-white/5">{recent.map((s) => <SongRow key={s.id} s={s} />)}</Card>
            )}
        </AppLayout>
    );
}

function SongRow({ s }: { s: Props['recent'][number] }) {
    return (
        <Link href={route('rooms.show', s.room.slug)} className="flex items-center gap-3 p-3 hover:bg-white/[0.03]">
            {s.thumbnail ? <img src={s.thumbnail} alt="" className="h-11 w-[4.5rem] shrink-0 rounded-lg object-cover" /> : <span className="h-11 w-[4.5rem] shrink-0 rounded-lg bg-white/10" />}
            <div className="min-w-0">
                <p className="truncate text-sm font-medium">{s.title}</p>
                <p className="text-xs text-neutral-500">{s.room.name} · {ago(s.played_at)}</p>
            </div>
        </Link>
    );
}
