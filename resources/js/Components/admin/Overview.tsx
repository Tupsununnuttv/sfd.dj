import Avatar from '@/Components/Avatar';
import { Bars, Card, SectionTitle, StatTile } from '@/Components/ui';
import { ago } from '@/lib/time';
import { Link } from '@inertiajs/react';
import { Activity, AlertTriangle, Bot, CheckCircle2, CircleDashed, Clock, Gavel, MessageSquare, Music, Radio, UserPlus, Users } from 'lucide-react';
import { Day, Overview as OverviewData } from './types';

const verb: Record<string, string> = { kick: 'kicked', ban: 'banned', unban: 'unbanned', mute: 'muted', unmute: 'unmuted', clear_chat: 'cleared the chat', delete_message: 'deleted a message from' };
const total = (d: Day[]) => d.reduce((n, x) => n + x.n, 0);

function Chart({ title, data, color }: { title: string; data: Day[]; color: string }) {
    return (
        <Card className="p-5">
            <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="text-xs text-neutral-500">last 14 days</p>
            </div>
            <p className="mt-1 text-3xl font-black tabular-nums">{total(data).toLocaleString()}</p>
            <div className="mt-3"><Bars data={data} color={color} /></div>
            <div className="mt-1 flex justify-between text-[10px] text-neutral-600"><span>{data[0]?.day.slice(5)}</span><span>today: {data[data.length - 1]?.n}</span></div>
        </Card>
    );
}

/** Admin panel → Overview: what is going on, and whether the site is set up properly. */
export default function Overview({ data, openTickets, totalUsers, gotoTab }: { data: OverviewData; openTickets: number; totalUsers: number; gotoTab: (tab: 'Support' | 'Users') => void }) {
    const k = data.kpis;
    const warnings = data.health.filter(([, s]) => s === 'warn');

    return (
        <div className="space-y-8">
            {(warnings.length > 0 || openTickets > 0) && (
                <div className="space-y-2">
                    {openTickets > 0 && (
                        <button onClick={() => gotoTab('Support')} className="flex w-full items-center gap-3 rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-left text-sm text-sky-100 hover:bg-sky-500/20">
                            <Radio size={18} /> <span><b>{openTickets}</b> open support {openTickets === 1 ? 'conversation needs' : 'conversations need'} an answer.</span><span className="ml-auto font-semibold">Open inbox →</span>
                        </button>
                    )}
                    {warnings.length > 0 && (
                        <div className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                            <span><b>{warnings.length} {warnings.length === 1 ? 'thing needs' : 'things need'} attention:</b> {warnings.map(([name]) => name).join(', ')}. Details under “Setup & health” below.</span>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile icon={Activity} tone="emerald" label="Online members" value={k.online} hint={`Active in the last 5 min ? ${k.listening == null ? 'listeners unavailable' : `${k.listening} unique listeners`}`} />
                <StatTile icon={Clock} tone="sky" label="Active in 24 h" value={k.active_24h} />
                <StatTile icon={UserPlus} tone="violet" label="New people, 7 days" value={k.new_7d} />
                <StatTile icon={MessageSquare} tone="fuchsia" label="Messages, 24 h" value={k.messages_24h} />
                <StatTile icon={Music} tone="amber" label="Songs played, 24 h" value={k.songs_24h} />
                <StatTile icon={Users} tone="sky" label="Registered members" value={totalUsers.toLocaleString()} />
                <StatTile icon={Bot} tone="violet" label="Bots" value={k.bots} />
                <StatTile icon={Gavel} tone="amber" label="Violations, 7 days" value={k.violations_7d} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Chart title="New people" data={data.series.users} color="#a78bfa" />
                <Chart title="Chat messages" data={data.series.messages} color="#e879f9" />
                <Chart title="Songs played" data={data.series.songs} color="#38bdf8" />
            </div>

            <section>
                <SectionTitle title="Setup & health" hint="Green is fine. Amber is something that does not work yet. Grey is an optional extra that is switched off." />
                <Card className="divide-y divide-white/5">
                    {data.health.map(([name, status, text]) => (
                        <div key={name} className="flex items-start gap-3 p-4">
                            {status === 'ok' ? <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-green-400" /> : status === 'warn' ? <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-400" /> : <CircleDashed size={20} className="mt-0.5 shrink-0 text-neutral-500" />}
                            <div className="min-w-0">
                                <p className="text-sm font-semibold">{name}</p>
                                <p className="text-sm text-neutral-400">{text}</p>
                            </div>
                        </div>
                    ))}
                </Card>
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section>
                    <SectionTitle title="Newest people" action={<button onClick={() => gotoTab('Users')} className="text-xs text-violet-400 hover:underline">All users →</button>} />
                    <Card className="divide-y divide-white/5">
                        {data.recentUsers.map((u) => (
                            <Link key={u.id} href={route('users.show', u.id)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/3">
                                <Avatar name={u.name} avatar={u.avatar} className="h-7 w-7 text-sm" />
                                <span className="min-w-0 flex-1 truncate">{u.name} {u.is_bot && <span className="rounded bg-sky-500/20 px-1 text-[10px] font-bold text-sky-300">BOT</span>}</span>
                                <span className="text-xs text-neutral-500">{ago(u.joined)}</span>
                            </Link>
                        ))}
                    </Card>
                </section>

                <section>
                    <SectionTitle title="Recent moderation" hint="In rooms, across the site" />
                    <Card className="divide-y divide-white/5">
                        {data.recentModeration.length === 0 && <p className="p-4 text-sm text-neutral-500">Nothing yet. Calm seas.</p>}
                        {data.recentModeration.map((m) => (
                            <div key={m.id} className="px-4 py-2.5 text-sm">
                                <p className="text-neutral-300"><b className="text-neutral-100">{m.actor ?? 'Someone'}</b> {verb[m.action] ?? m.action}{m.target && <> <b className="text-neutral-100">{m.target}</b></>}</p>
                                <p className="text-xs text-neutral-500">{m.room ? <Link href={route('rooms.show', m.room.slug)} className="hover:underline">{m.room.name}</Link> : 'a room'} · {ago(m.at)}</p>
                            </div>
                        ))}
                    </Card>
                </section>

                <section>
                    <SectionTitle title="Recent violations" />
                    <Card className="divide-y divide-white/5">
                        {data.recentViolations.length === 0 && <p className="p-4 text-sm text-neutral-500">No violations issued.</p>}
                        {data.recentViolations.map((v) => (
                            <div key={v.id} className="px-4 py-2.5 text-sm">
                                <p><b>{v.user ?? 'Someone'}</b> <span className="text-neutral-500">· by {v.by ?? 'staff'}</span></p>
                                <p className="truncate text-xs text-neutral-400">{v.reason}</p>
                                <p className="text-xs text-neutral-600">{ago(v.at)}</p>
                            </div>
                        ))}
                    </Card>
                </section>
            </div>
        </div>
    );
}
