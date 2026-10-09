import Avatar from '@/Components/Avatar';
import Badges from '@/Components/Badges';
import RoleBadge from '@/Components/RoleBadge';
import RoleIcon from '@/Components/RoleIcon';
import { Card, fieldBase, fieldClass, OnlineDot } from '@/Components/ui';
import { ago, within } from '@/lib/time';
import { AwardBadge } from '@/lib/cosmetics';
import { PageProps } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { Search, ShieldAlert, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { AdminProps, AdminUser, RoleGroups, RoleMeta } from './types';

const th = 'px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500';

/** Pick the roles somebody should have. The most powerful is first. */
function RoleEditor({ user, assignable, groups }: { user: AdminUser; assignable: RoleMeta[]; groups: RoleGroups }) {
    const [open, setOpen] = useState(false);
    const [roles, setRoles] = useState<string[]>(user.roles ?? []);

    const toggle = (key: string) => setRoles((r) => (r.includes(key) ? r.filter((k) => k !== key) : [...r, key]));
    const save = () => router.patch(route('admin.roles', user.id), { roles }, { preserveScroll: true, onSuccess: () => setOpen(false) });

    if (!user.editable) return <span title="You can only change people ranked below you" className="text-xs text-neutral-600">locked</span>;
    if (!open) return <button onClick={() => setOpen(true)} className="rounded-md bg-violet-600 px-3 py-1 text-xs font-semibold text-white hover:bg-violet-500">Set role</button>;

    return (
        <div className="w-64 space-y-2 rounded-xl border border-white/10 bg-neutral-950 p-3 shadow-xl">
            <p className="text-[11px] text-neutral-500">Tick every role this person should have. The top of each list is the most powerful.</p>
            <div className="space-y-2">
                {Object.entries(groups).map(([group, heading]) => {
                    const list = assignable.filter((r) => r.group === group);

                    return list.length === 0 ? null : (
                        <div key={group}>
                            <p className="px-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">{heading.icon} {heading.label}</p>
                            {list.map((r) => (
                                <label key={r.key} className="flex items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-white/5">
                                    <input type="checkbox" checked={roles.includes(r.key)} onChange={() => toggle(r.key)} className="rounded border-neutral-600 bg-neutral-800 text-violet-500 focus:ring-violet-500" />
                                    <RoleIcon role={r} size={16} />
                                    <span style={{ color: r.color }}>{r.label}</span>
                                </label>
                            ))}
                        </div>
                    );
                })}
            </div>
            <div className="flex gap-2">
                <button onClick={save} className="rounded bg-violet-600 px-3 py-1 text-xs font-semibold hover:bg-violet-500">Save</button>
                <button onClick={() => setOpen(false)} className="rounded bg-white/10 px-3 py-1 text-xs hover:bg-white/20">Cancel</button>
            </div>
        </div>
    );
}

/** The special badges (Beta Tester, Bug Hunter ...): tick the ones this person has earned. */
function AwardEditor({ user, list }: { user: AdminUser; list: AdminProps['awardList'] }) {
    const [open, setOpen] = useState(false);
    const [awards, setAwards] = useState<string[]>(user.awards);

    const toggle = (key: string) => setAwards((a) => (a.includes(key) ? a.filter((k) => k !== key) : [...a, key]));
    const save = () => router.patch(route('admin.awards', user.id), { awards }, { preserveScroll: true, onSuccess: () => setOpen(false) });

    if (!open) return <button onClick={() => setOpen(true)} className="block text-xs text-sky-300 hover:underline">Special badges{user.awards.length > 0 && ` (${user.awards.length})`}</button>;

    return (
        <div className="w-64 space-y-2 rounded-xl border border-white/10 bg-neutral-950 p-3 shadow-xl">
            <p className="text-[11px] text-neutral-500">Tick every special badge this person has earned.</p>
            {list.map((a) => (
                <label key={a.key} className="flex items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-white/5" title={a.text}>
                    <input type="checkbox" checked={awards.includes(a.key)} onChange={() => toggle(a.key)} className="rounded border-neutral-600 bg-neutral-800 text-violet-500 focus:ring-violet-500" />
                    <AwardBadge name={a.key} className="h-5 w-5" />
                    <span style={{ color: a.color }}>{a.label}</span>
                </label>
            ))}
            <div className="flex gap-2">
                <button onClick={save} className="rounded bg-violet-600 px-3 py-1 text-xs font-semibold hover:bg-violet-500">Save</button>
                <button onClick={() => { setAwards(user.awards); setOpen(false); }} className="rounded bg-white/10 px-3 py-1 text-xs hover:bg-white/20">Cancel</button>
            </div>
        </div>
    );
}

/** SFD.DJ Plus or Premium by hand: for a month, three, a year or for good, or none. A plan bought through Stripe is left to Stripe. */
function PlanEditor({ user, list }: { user: AdminUser; list: AdminProps['planList'] }) {
    const [open, setOpen] = useState(false);
    const [plan, setPlan] = useState(user.plan ?? '');
    const [months, setMonths] = useState('1');

    const save = () => router.patch(route('admin.plan', user.id), { plan: plan || null, months: plan ? Number(months) : null }, { preserveScroll: true, onSuccess: () => setOpen(false) });

    if (user.plan_paid) return <p className="text-xs text-neutral-500">Paid plan (Stripe)</p>;
    if (!open) return <button onClick={() => setOpen(true)} className="block text-xs text-teal-300 hover:underline" data-plan-editor>{user.plan ? 'Change plan' : 'Give a plan'}</button>;

    return (
        <div className="w-64 space-y-2 rounded-xl border border-white/10 bg-neutral-950 p-3 shadow-xl">
            <p className="text-[11px] text-neutral-500">Give SFD.DJ Plus or Premium for free, or take it away.</p>
            <select value={plan} onChange={(e) => setPlan(e.target.value)} className={`${fieldBase} w-full py-1.5 text-xs`}>
                <option value="">No plan</option>
                {list.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
            </select>
            {plan && (
                <select value={months} onChange={(e) => setMonths(e.target.value)} className={`${fieldBase} w-full py-1.5 text-xs`}>
                    <option value="1">For 1 month</option>
                    <option value="3">For 3 months</option>
                    <option value="12">For 1 year</option>
                    <option value="0">For good</option>
                </select>
            )}
            <div className="flex gap-2">
                <button onClick={save} className="rounded bg-violet-600 px-3 py-1 text-xs font-semibold hover:bg-violet-500">Save</button>
                <button onClick={() => setOpen(false)} className="rounded bg-white/10 px-3 py-1 text-xs hover:bg-white/20">Cancel</button>
            </div>
        </div>
    );
}

export default function UsersTab({ q, filters, users, roleOptions, assignable, groups, awardList, planList }: Pick<AdminProps, 'q' | 'filters' | 'users' | 'roleOptions' | 'assignable' | 'awardList' | 'planList'> & { groups: RoleGroups }) {
    const [search, setSearch] = useState(q);
    const canAward = usePage<PageProps>().props.auth.user.site_permissions.includes('users.manage');

    const go = (next: Partial<{ q: string; role: string | null; type: string | null; sort: string }>) => {
        const f = { q: search, role: filters.role, type: filters.type, sort: filters.sort, ...next };
        router.get(route('admin'), Object.fromEntries(Object.entries(f).filter(([, v]) => v)), { preserveState: true, replace: true });
    };
    const find = (e: FormEvent) => { e.preventDefault(); go({ q: search }); };
    const warn = (u: AdminUser) => {
        const reason = prompt(`Reason for the violation on ${u.name}?`);
        if (reason?.trim()) router.post(route('admin.warn', u.id), { reason }, { preserveScroll: true });
    };
    const remove = (u: AdminUser) => confirm(`Delete the account of ${u.name} for good?

Their rooms, playlists, messages and friends go with it. This cannot be undone.`) && router.delete(route('admin.users.destroy', u.id), { preserveScroll: true });
    const select = `${fieldBase} w-auto py-2`;

    return (
        <section className="space-y-4">
            <form onSubmit={find} className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-56 flex-1 sm:max-w-sm">
                    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, username or email" className={`${fieldClass} pl-9`} />
                </div>
                <select value={filters.role ?? ''} onChange={(e) => go({ role: e.target.value || null })} className={select}>
                    <option value="">Any role</option>
                    {Object.entries(groups).map(([group, heading]) => (
                        <optgroup key={group} label={`${heading.icon} ${heading.label}`}>
                            {roleOptions.filter((r) => r.group === group).map((r) => <option key={r.key} value={r.key}>{r.icon} {r.label}</option>)}
                        </optgroup>
                    ))}
                </select>
                <select value={filters.type ?? ''} onChange={(e) => go({ type: e.target.value || null })} className={select}>
                    <option value="">Everyone</option>
                    <option value="online">Online now</option>
                    <option value="bots">Bots</option>
                </select>
                <select value={filters.sort} onChange={(e) => go({ sort: e.target.value })} className={select}>
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="xp">Most XP</option>
                    <option value="seen">Last seen</option>
                </select>
                <button className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">Search</button>
            </form>

            <Card className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-white/10">
                        <tr><th className={th}>Person</th><th className={th}>Roles</th><th className={th}>Level</th><th className={th}>Joined</th><th className={th}>Last seen</th><th className={th}>Viol.</th><th className={th}></th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.data.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-neutral-500">Nobody matches.</td></tr>}
                        {users.data.map((u) => (
                            <tr key={u.id} className="align-top hover:bg-white/[0.02]">
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="relative"><Avatar name={u.name} avatar={u.avatar} /><OnlineDot online={within(u.last_seen_at, 5)} className="absolute -bottom-0.5 -right-0.5" /></div>
                                        <div className="min-w-0">
                                            <Link href={route('users.show', u.id)} className="font-semibold hover:underline">{u.name}</Link> {u.is_bot && <span className="rounded bg-sky-500/20 px-1 text-[10px] font-bold text-sky-300">BOT</span>} <Badges badges={u.badges} awards={9} /> {!u.email_verified && !u.is_bot && <span title="Has not confirmed their email" className="rounded bg-amber-500/20 px-1 text-[10px] font-bold text-amber-300">UNCONFIRMED</span>}
                                            <p className="truncate text-xs text-neutral-500">{u.username && `@${u.username} · `}{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-3 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        <RoleBadge role={u.primary_role} showMember />
                                        {(u.roles?.length ?? 0) > 1 && <span className="text-xs text-neutral-500">+{u.roles!.length - 1} more</span>}
                                    </div>
                                    {u.plan && <p className="mt-1 text-[11px] font-semibold" style={{ color: planList.find((p) => p.key === u.plan)?.color }}>{planList.find((p) => p.key === u.plan)?.name} {u.plan_until ? `until ${new Date(u.plan_until).toLocaleDateString()}` : 'for good'}</p>}
                                </td>
                                <td className="px-3 py-3 text-neutral-300">Lv {u.level} <span className="text-xs text-neutral-500">· {u.xp} XP</span></td>
                                <td className="whitespace-nowrap px-3 py-3 text-xs text-neutral-400">{new Date(u.joined).toLocaleDateString()}</td>
                                <td className="whitespace-nowrap px-3 py-3 text-xs text-neutral-400">{within(u.last_seen_at, 5) ? <span className="text-green-400">online</span> : ago(u.last_seen_at)}</td>
                                <td className="px-3 py-3">{u.violations > 0 ? <span className="flex items-center gap-1 text-amber-300"><ShieldAlert size={14} />{u.violations}</span> : <span className="text-neutral-600">0</span>}</td>
                                <td className="space-y-2 px-3 py-3">
                                    <RoleEditor key={u.id + (u.roles ?? []).join()} user={u} assignable={assignable} groups={groups} />
                                    {canAward && !u.email_verified && !u.is_bot && <button onClick={() => router.patch(route('admin.users.confirm-email', u.id), {}, { preserveScroll: true })} className="block text-xs text-emerald-300 hover:underline" data-confirm-email>Confirm email</button>}
                                    {canAward && <AwardEditor key={u.id + u.awards.join()} user={u} list={awardList} />}
                                    {canAward && <PlanEditor key={`${u.id}${u.plan}${u.plan_until}`} user={u} list={planList} />}
                                    {u.editable && <button onClick={() => warn(u)} className="block text-xs text-amber-400 hover:underline">Issue violation</button>}
                                    {u.editable && <button onClick={() => remove(u)} className="flex items-center gap-1 text-xs text-red-400 hover:underline" data-delete-user><Trash2 size={12} /> Delete account</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <div className="flex justify-between text-sm">
                {users.prev_page_url ? <Link href={users.prev_page_url} preserveState className="text-violet-400 hover:underline">← Previous</Link> : <span />}
                {users.next_page_url ? <Link href={users.next_page_url} preserveState className="text-violet-400 hover:underline">Next →</Link> : <span />}
            </div>
        </section>
    );
}
