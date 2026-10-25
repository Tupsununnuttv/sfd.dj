import { formatDate } from '@/lib/regional';
import Avatar from '@/Components/Avatar';
import { levelPercent, toNextText } from '@/lib/level';
import RoleBadge from '@/Components/RoleBadge';
import RoomBadge from '@/Components/RoomBadge';
import { Card, EmptyState, ghostBtn, ProgressBar, SectionTitle, StatTile, Tabs } from '@/Components/ui';
import AppLayout from '@/Layouts/AppLayout';
import { ago } from '@/lib/time';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, CheckCircle2, Circle, Gift, MessageCircle, Music, ShieldCheck, ThumbsUp, Users, Zap } from 'lucide-react';
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
    stats: { xp: number; level: number; songs_played: number; rooms_played: number; woots: number; grabs: number; woots_given: number; grabs_given: number; friends: number; referrals: number; messages: number };
    rooms: { id: number; name: string; slug: string; genre: string | null; is_private: boolean; badges: string[] | null; items_count: number; created_at: string }[];
    playlists: { id: number; name: string; kind: string; songs_count: number }[];
    recent: { id: number; title: string; thumbnail: string | null; played_at: string; room: { name: string; slug: string } }[];
    worn: Record<string, string | null>;
    account: { joined: string; username: string; email_verified: boolean; two_factor: boolean; discord: string | null; photo: boolean };
    achievements: Achievement[];
    xpGuide: { song: number; woot: number; minimum_play_seconds: number; chat: number; chat_cooldown_seconds: number; grab: number; referral: number; multiplier: number; plan: string | null; max_level: number };
}

type Tab = 'overview' | 'xp' | 'achievements' | 'rooms' | 'playlists' | 'songs';

export default function MyStuff({ stats, rooms, playlists, recent, worn, account, achievements, xpGuide }: Props) {
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
            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-fuchsia-600/20 via-violet-600/10 to-sky-600/10 p-6 sm:p-8">
                <div className="pointer-events-none absolute -right-14 -top-14 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />
                <div className="relative flex flex-wrap items-center gap-6">
                    <Avatar name={user.name} avatar={user.avatar} cosmetics={user.cosmetics} className="h-24 w-24 text-4xl" />
                    <div className="min-w-0 flex-1">
                        <h2 className="flex flex-wrap items-center gap-3 text-2xl font-black tracking-tight">{user.name} <RoleBadge role={user.primary_role} /></h2>
                        <p className="text-sm text-neutral-400">@{account.username} · member since {formatDate(account.joined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <div className="mt-4 max-w-md">
                            <div className="mb-1.5 flex items-baseline justify-between text-xs text-neutral-300"><span className="font-semibold">Level {lv}</span><span>{stats.xp.toLocaleString()} XP · {toNextText(stats.xp, lv)}</span></div>
                            <ProgressBar value={levelPercent(stats.xp, lv)} />
                            <button onClick={() => setTab('xp')} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 hover:text-violet-200"><BookOpen size={13} /> How to earn XP</button>
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
                    { key: 'xp', label: 'How to earn XP', icon: Zap },
                    { key: 'achievements', label: 'Achievements', count: done.length },
                    { key: 'rooms', label: 'Rooms', count: rooms.length },
                    { key: 'playlists', label: 'Playlists', count: playlists.length },
                    { key: 'songs', label: 'Recent songs', count: recent.length },
                ]}
            />

            {tab === 'xp' && (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-300/15 bg-linear-to-br from-amber-400/10 to-violet-500/10 p-5 sm:p-6">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">Your next level starts here</p>
                            <h2 className="mt-2 text-xl font-bold">Play music. Share discoveries. Join the conversation.</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-400">These are the base XP rewards. Your active subscription multiplies each award, then rounds it to a whole XP.</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 px-5 py-3">
                            <p className="text-2xl font-black text-amber-200">{xpGuide.multiplier.toFixed(2)}× XP</p>
                            <p className="mt-1 text-xs text-neutral-400">{xpGuide.plan ? `${xpGuide.plan} bonus active` : 'Standard rewards'}</p>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        {[
                            { icon: Music, title: 'Finish a DJ set track', reward: `+${xpGuide.song} XP`, text: `Your queued song must finish naturally, have a known length of at least ${xpGuide.minimum_play_seconds} seconds, and play for at least ${xpGuide.minimum_play_seconds} seconds. The server checks its playback time.` },
                            { icon: ThumbsUp, title: 'Receive woots', reward: `+${xpGuide.woot} XP / woot`, text: 'Each woot still on your song adds to its completion reward. The same completion rules apply; skipped songs earn no woot bonus.' },
                            { icon: Gift, title: 'Someone grabs your song', reward: `+${xpGuide.grab} XP`, text: 'Earn XP when another listener saves your playing song to their playlist. Each listener counts once for that queued song; grabbing it again gives no extra XP.' },
                            { icon: MessageCircle, title: 'Chat in a room', reward: `+${xpGuide.chat} XP`, text: `Leave at least ${xpGuide.chat_cooldown_seconds} seconds between your room messages to earn another award there. Messages sent sooner earn no XP. Whispers do not award XP.` },
                            { icon: Users, title: 'Invite a new member', reward: `+${xpGuide.referral} XP`, text: 'Share your referral link. You receive the reward when a new member signs up through it, once for that new account.' },
                        ].map(({ icon: Icon, title, reward, text }) => (
                            <Card key={title} className="p-5">
                                <div className="mb-3 flex items-center justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300"><Icon size={20} /></span><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-bold text-emerald-300">{reward}</span></div>
                                <h3 className="font-bold">{title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{text}</p>
                            </Card>
                        ))}
                        <Card className="border-sky-400/15 p-5">
                            <ShieldCheck size={24} className="mb-4 text-sky-300" />
                            <h3 className="font-bold">Progress that counts</h3>
                            <p className="mt-2 text-sm leading-relaxed text-neutral-400">Skipping, removing songs and replaying an end request award no playback XP or coins. Short clips and tracks with an unknown length earn no completion rewards. Simply staying online or voting on somebody else&apos;s song gives no XP.</p>
                        </Card>
                    </div>

                    <Card className="p-5 sm:p-6">
                        <SectionTitle title="Levels & rewards" />
                        <div className="grid gap-5 text-sm text-neutral-400 sm:grid-cols-3">
                            <p><span className="mb-1 block font-semibold text-white">Up to level {xpGuide.max_level}</span>Level thresholds follow 20 × (level − 1)² total XP. Level 2 starts at 20 XP, level 5 at 320 XP and level 10 at 1,620 XP.</p>
                            <p><span className="mb-1 block font-semibold text-white">Coins on each level</span>Each new level gives 10 × that level in SFD Coins. Reaching level 5 earns 50 coins; reaching level 10 earns 100.</p>
                            <p><span className="mb-1 block font-semibold text-white">Achievements track milestones</span>Achievements show what you have accomplished. Unlocking one does not add a separate XP award.</p>
                        </div>
                    </Card>
                </div>
            )}

            {tab === 'overview' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <section>
                        <SectionTitle title="Account checklist" hint={`${secure} of ${checklist.length} done`} />
                        <Card className="divide-y divide-white/5">
                            {checklist.map(([ok, title, text, href]) => (
                                <Link key={title} href={href} className="flex items-center gap-3 p-4 hover:bg-white/3">
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
                            <Card key={a.key} className={`p-4 ${a.done ? 'border-amber-400/30 bg-amber-400/6' : ''}`}>
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
                    <EmptyState icon="🏠" title="You have not created a room yet" text="A room is yours to host: pick the genre, set the rules, give roles to friends." action={<Link href={route('dashboard')} className="rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 px-5 py-2 text-sm font-semibold">Create a room</Link>} />
                ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {rooms.map((r) => (
                            <Link key={r.id} href={route('rooms.show', r.slug)} className="rounded-2xl border border-white/10 bg-white/4 p-5 transition hover:border-violet-400/60">
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
        <Link href={route('rooms.show', s.room.slug)} className="flex items-center gap-3 p-3 hover:bg-white/3">
            {s.thumbnail ? <img src={s.thumbnail} alt="" className="h-11 w-18 shrink-0 rounded-lg object-cover" /> : <span className="h-11 w-18 shrink-0 rounded-lg bg-white/10" />}
            <div className="min-w-0">
                <p className="truncate text-sm font-medium">{s.title}</p>
                <p className="text-xs text-neutral-500">{s.room.name} · {ago(s.played_at)}</p>
            </div>
        </Link>
    );
}
