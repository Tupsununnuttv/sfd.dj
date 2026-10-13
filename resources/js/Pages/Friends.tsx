import Avatar from '@/Components/Avatar';
import RoleBadge from '@/Components/RoleBadge';
import { Card, EmptyState, fieldClass, OnlineDot, primaryBtn, SectionTitle, StatTile, Tabs } from '@/Components/ui';
import AppLayout from '@/Layouts/AppLayout';
import { STATUS, statusOf } from '@/lib/status';
import { ago } from '@/lib/time';
import { RoleInfo } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Heart, MessageCircle, Search, UserCheck, UserPlus, Users, X } from 'lucide-react';
import { FormEvent, ReactNode, useMemo, useState } from 'react';

interface Person {
    id: number; // friendship id for friends and requests, user id for everybody else
    user_id: number;
    name: string;
    username: string | null;
    avatar: string | null;
    primary_role: RoleInfo;
    level: number;
}
type Friend = Person & { online: boolean; status?: string; last_seen_at: string | null; room: { name: string; slug: string } | null };
type Fan = Person & { votes: number; linked: boolean };
type Suggestion = Person & { mutual: number };

interface Props {
    friends: Friend[];
    incoming: Person[];
    outgoing: Person[];
    people: Person[];
    fans: Fan[];
    suggestions: Suggestion[];
}

type Tab = 'friends' | 'discover' | 'fans' | 'requests';

const btn = 'rounded-lg px-3 py-1.5 text-xs font-semibold transition';

function Who({ p, sub }: { p: Person; sub?: ReactNode }) {
    return (
        <Link href={route('users.show', p.user_id)} className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar name={p.name} avatar={p.avatar} className="h-10 w-10 text-base" />
            <span className="min-w-0">
                <span className="flex items-center gap-2"><span className="truncate font-semibold hover:underline">{p.name}</span><RoleBadge role={p.primary_role} /></span>
                <span className="block truncate text-xs text-neutral-500">{sub ?? <>@{p.username ?? '…'} · Lv {p.level}</>}</span>
            </span>
        </Link>
    );
}

function Row({ p, sub, children }: { p: Person; sub?: ReactNode; children?: ReactNode }) {
    return (
        <li className="flex items-center gap-3 p-3">
            <Who p={p} sub={sub} />
            <div className="flex shrink-0 items-center gap-2">{children}</div>
        </li>
    );
}

function status(f: Friend): ReactNode {
    if (f.room) return <>● In <span className="text-green-400">{f.room.name}</span></>;
    if (f.online) return <span className={STATUS[statusOf(f.status)].text}>● {STATUS[statusOf(f.status)].label}</span>;
    return <>Active {ago(f.last_seen_at)}</>;
}

export default function Friends({ friends, incoming, outgoing, people, fans, suggestions }: Props) {
    const [tab, setTab] = useState<Tab>(incoming.length > 0 ? 'requests' : 'friends');
    const [q, setQ] = useState('');
    const [onlineOnly, setOnlineOnly] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({ name: '' });

    const add = (e: FormEvent) => {
        e.preventDefault();
        post(route('friends.store'), { preserveScroll: true, onSuccess: () => reset() });
    };
    const addUser = (userId: number) => router.post(route('friends.store'), { user_id: userId }, { preserveScroll: true });
    const remove = (id: number) => router.delete(route('friends.destroy', id), { preserveScroll: true });
    const addBtn = (userId: number) => <button onClick={() => addUser(userId)} className={`${btn} flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500`}><UserPlus size={13} /> Add</button>;

    const online = friends.filter((f) => f.online).length;
    const needle = q.trim().toLowerCase();
    const shownFriends = useMemo(() => friends.filter((f) => (!onlineOnly || f.online) && (!needle || `${f.name} ${f.username ?? ''}`.toLowerCase().includes(needle))), [friends, onlineOnly, needle]);
    const shownPeople = useMemo(() => people.filter((p) => !needle || `${p.name} ${p.username ?? ''}`.toLowerCase().includes(needle)), [people, needle]);

    return (
        <AppLayout
            title="Friends"
            subtitle="Your people on SFD-DJ.EU: see who is around, send a whisper, find new friends."
            actions={<Link href={route('referral')} className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"><UserPlus size={15} /> Invite friends</Link>}
        >
            <Head title="Friends" />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile icon={Users} tone="sky" label="Friends" value={friends.length} hint={`${online} online now`} />
                <StatTile icon={UserCheck} tone="emerald" label="Online now" value={online} />
                <StatTile icon={Heart} tone="fuchsia" label="Fans" value={fans.length} hint="Wooted or grabbed your songs" />
                <StatTile icon={MessageCircle} tone="amber" label="Requests" value={incoming.length + outgoing.length} hint={incoming.length ? `${incoming.length} waiting for you` : undefined} />
            </div>

            <Tabs<Tab>
                active={tab}
                onChange={(t) => { setTab(t); setQ(''); }}
                tabs={[
                    { key: 'friends', label: 'Friends', count: friends.length },
                    { key: 'discover', label: 'Find people', count: suggestions.length || undefined },
                    { key: 'fans', label: 'Fans', count: fans.length },
                    { key: 'requests', label: 'Requests', alert: incoming.length || undefined, count: incoming.length ? undefined : outgoing.length },
                ]}
            />

            {tab === 'friends' && (
                <section className="space-y-4">
                    {friends.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative min-w-52 flex-1 sm:max-w-xs">
                                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your friends" className={`${fieldClass} pl-9`} />
                            </div>
                            <label className="flex items-center gap-2 text-sm text-neutral-300"><input type="checkbox" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} className="rounded border-neutral-600 bg-neutral-800 text-violet-500 focus:ring-violet-500" /> Online only</label>
                        </div>
                    )}

                    {friends.length === 0 ? (
                        <EmptyState icon="🤝" title="No friends yet" text="Add people from a room (click their name), from the Find people tab, or invite someone new." action={<button onClick={() => setTab('discover')} className={primaryBtn}>Find people</button>} />
                    ) : shownFriends.length === 0 ? (
                        <p className="text-sm text-neutral-500">Nobody matches.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {shownFriends.map((f) => (
                                <Card key={f.id} className="flex items-center gap-3 p-4">
                                    <div className="relative">
                                        <Avatar name={f.name} avatar={f.avatar} className="h-12 w-12 text-lg" />
                                        <OnlineDot online={f.online} status={f.status} className="absolute -bottom-0.5 -right-0.5" />
                                    </div>
                                    <Link href={route('users.show', f.user_id)} className="min-w-0 flex-1">
                                        <span className="flex items-center gap-2"><span className="truncate font-semibold hover:underline">{f.name}</span><RoleBadge role={f.primary_role} /></span>
                                        <span className="block truncate text-xs text-neutral-500">Lv {f.level} · {status(f)}</span>
                                    </Link>
                                    <div className="flex shrink-0 items-center gap-1.5">
                                        {f.room && <Link href={route('rooms.show', f.room.slug)} className={`${btn} bg-green-500/20 text-green-300 hover:bg-green-500/30`}>Join</Link>}
                                        <Link href={`${route('whispers')}?with=${f.user_id}`} title="Whisper" className={`${btn} bg-white/10 hover:bg-white/20`}><MessageCircle size={14} /></Link>
                                        <button onClick={() => confirm(`Remove ${f.name} from your friends?`) && remove(f.id)} title="Remove friend" className={`${btn} bg-white/5 text-neutral-400 hover:bg-red-500/20 hover:text-red-300`}><X size={14} /></button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {tab === 'discover' && (
                <div className="space-y-8">
                    <Card className="p-5">
                        <h2 className="font-semibold">Add someone by username</h2>
                        <form onSubmit={add} className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <input value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Their exact username" className={fieldClass} />
                            <button disabled={processing || !data.name.trim()} className={primaryBtn}>Send request</button>
                        </form>
                        {errors.name && <p className="mt-2 text-sm text-red-400">{errors.name}</p>}
                    </Card>

                    {suggestions.length > 0 && (
                        <section>
                            <SectionTitle title="People you may know" hint="Friends of your friends" />
                            <Card className="divide-y divide-white/5">
                                {suggestions.map((p) => <Row key={p.id} p={p} sub={`${p.mutual} mutual ${p.mutual === 1 ? 'friend' : 'friends'} · Lv ${p.level}`}>{addBtn(p.user_id)}</Row>)}
                            </Card>
                        </section>
                    )}

                    <section>
                        <SectionTitle title="Everyone on SFD-DJ.EU" action={<div className="relative w-52"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people" className={`${fieldClass} py-1.5 pl-8`} /></div>} />
                        {shownPeople.length === 0 ? (
                            <p className="text-sm text-neutral-500">{q ? 'Nobody matches.' : 'Everyone on SFD-DJ.EU is already your friend or has a pending request.'}</p>
                        ) : (
                            <Card className="divide-y divide-white/5">{shownPeople.map((p) => <Row key={p.id} p={p}>{addBtn(p.user_id)}</Row>)}</Card>
                        )}
                    </section>
                </div>
            )}

            {tab === 'fans' && (
                <section>
                    <p className="mb-3 text-sm text-neutral-400">People who woot or grab the songs you play.</p>
                    {fans.length === 0 ? (
                        <EmptyState icon="💜" title="No fans yet" text="Play a song in a room. Everyone who woots or grabs it shows up here." />
                    ) : (
                        <Card className="divide-y divide-white/5">
                            {fans.map((p) => (
                                <Row key={p.id} p={p}>
                                    <span className="text-xs font-semibold text-fuchsia-300">{p.votes} ❤</span>
                                    {p.linked ? <span className="text-xs text-neutral-500">Connected</span> : addBtn(p.user_id)}
                                </Row>
                            ))}
                        </Card>
                    )}
                </section>
            )}

            {tab === 'requests' && (
                <div className="space-y-8">
                    <section>
                        <SectionTitle title={`Received (${incoming.length})`} />
                        {incoming.length === 0 ? (
                            <p className="text-sm text-neutral-500">No requests waiting.</p>
                        ) : (
                            <Card className="divide-y divide-white/5">
                                {incoming.map((p) => (
                                    <Row key={p.id} p={p}>
                                        <button onClick={() => router.patch(route('friends.accept', p.id), {}, { preserveScroll: true })} className={`${btn} bg-violet-600 hover:bg-violet-500`}>Accept</button>
                                        <button onClick={() => remove(p.id)} className={`${btn} bg-white/10 hover:bg-white/20`}>Decline</button>
                                    </Row>
                                ))}
                            </Card>
                        )}
                    </section>
                    <section>
                        <SectionTitle title={`Sent (${outgoing.length})`} />
                        {outgoing.length === 0 ? (
                            <p className="text-sm text-neutral-500">You have no pending requests.</p>
                        ) : (
                            <Card className="divide-y divide-white/5">
                                {outgoing.map((p) => <Row key={p.id} p={p}><button onClick={() => remove(p.id)} className={`${btn} bg-white/10 hover:bg-white/20`}>Cancel</button></Row>)}
                            </Card>
                        )}
                    </section>
                </div>
            )}
        </AppLayout>
    );
}
