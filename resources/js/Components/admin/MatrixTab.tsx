import RoleIcon from '@/Components/RoleIcon';
import { Card, ghostBtn, primaryBtn } from '@/Components/ui';
import { router } from '@inertiajs/react';
import { Fragment, useState } from 'react';
import { translate } from '@/lib/regional';
import { AdminProps } from './types';

export default function MatrixTab({ matrix, groups }: { matrix: AdminProps['matrix']; groups: AdminProps['roleGroups'] }) {
    const [granted, setGranted] = useState<Record<string, string[]>>(matrix.granted);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [roleGroup, setRoleGroup] = useState('all');
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState('');
    const has = (role: string, perm: string) => (granted[role] ?? []).includes(perm);
    const flip = (role: string, perm: string) =>
        setGranted((g) => ({ ...g, [role]: has(role, perm) ? (g[role] ?? []).filter((p) => p !== perm) : [...(g[role] ?? []), perm] }));
    const categories: Record<string, string> = { admin: 'Administration', users: 'User accounts', subscriptions: 'Subscriptions', support: 'Support', email: 'Email', rooms: 'Rooms', broadcast: 'Announcements', events: 'Events', community: 'Community', ipbans: 'IP bans', maintenance: 'Maintenance' };
    const needle = search.trim().toLocaleLowerCase();
    const perms = Object.entries(matrix.permissions).filter(([key, label]) => (category === 'all' || key.startsWith(`${category}.`)) && (!needle || `${key} ${label} ${translate(label)}`.toLocaleLowerCase().includes(needle)));
    const flipVisible = (role: string) => {
        const every = perms.every(([permission]) => has(role, permission));
        setGranted((current) => ({ ...current, [role]: every ? (current[role] ?? []).filter((permission) => !perms.some(([key]) => key === permission)) : [...new Set([...(current[role] ?? []), ...perms.map(([key]) => key)])] }));
        setNotice('');
    };

    // has anything been ticked or unticked since the last save?
    const dirty = matrix.roles.some((r) => {
        const a = [...(granted[r.key] ?? [])].sort().join();
        const b = [...(matrix.granted[r.key] ?? [])].sort().join();
        return a !== b;
    });

    return (
        <section className="space-y-4">
            <p className="text-sm text-neutral-400">
                Which site-wide permissions each role has, from the most powerful role down. The Owner role always has everything, and the plain User has nothing extra.
                {!matrix.editable && ' Only an Owner can change this table.'}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
                <input aria-label="Search permissions" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search permissions…" className="rounded-lg border-white/10 bg-neutral-900 text-sm" />
                <select aria-label="Permission category" value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border-white/10 bg-neutral-900 text-sm"><option value="all">All categories</option>{Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
                <select aria-label="Role group" value={roleGroup} onChange={(event) => setRoleGroup(event.target.value)} className="rounded-lg border-white/10 bg-neutral-900 text-sm"><option value="all">All role groups</option>{Object.entries(groups).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select>
            </div>
            <p className="text-xs text-neutral-400">{perms.length} / {Object.keys(matrix.permissions).length} permissions. Subscriptions unlock perks; they never grant staff permissions.</p>

            <Card className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-white/10">
                        <tr>
                            <th className="sticky left-0 z-10 bg-neutral-900 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Role</th>
                            {perms.map(([key, label]) => (
                                <th key={key} title={key} className="min-w-32 px-3 py-3 text-left align-bottom text-[11px] font-semibold leading-tight text-neutral-400">{label}<code className="mt-1 block text-[9px] font-normal text-neutral-600">{key}</code></th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(groups).filter(([group]) => roleGroup === 'all' || roleGroup === group).map(([group, heading]) => (
                            <Fragment key={group}>
                                <tr className="border-y border-white/10 bg-white/4">
                                    <th colSpan={perms.length + 1} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-neutral-200">
                                        <span className="sticky left-3">{heading.icon} {heading.label}</span>
                                    </th>
                                </tr>
                                {matrix.roles.filter((r) => r.group === group).map((r) => {
                                    const fixed = r.key === 'owner' || r.key === 'member'; // the Owner has it all, the User has nothing extra
                                    return (
                                        <tr key={r.key} data-role={r.key} className="border-b border-white/5 hover:bg-white/2">
                                            <td className="sticky left-0 z-10 whitespace-nowrap bg-neutral-900 px-3 py-2.5 text-xs font-bold" style={{ color: r.color }}>
                                                <span className="mr-2 inline-flex align-middle"><RoleIcon role={r} /></span>{r.label}
                                                {r.key === 'member' && <span className="ml-2 font-normal text-neutral-500">(everyone)</span>}
                                                {!fixed && matrix.editable && perms.length > 0 && <button type="button" disabled={saving} onClick={() => flipVisible(r.key)} aria-label={`${r.label}: Toggle all visible permissions`} className="mt-1 block text-[10px] font-normal text-violet-300 hover:underline">{perms.every(([permission]) => has(r.key, permission)) ? 'Clear visible' : 'Grant visible'}</button>}
                                            </td>
                                            {perms.map(([perm]) => (
                                                <td key={perm} className="px-3 py-2.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={r.key === 'owner' || (r.key !== 'member' && has(r.key, perm))}
                                                        disabled={!matrix.editable || fixed || saving}
                                                        onChange={() => flip(r.key, perm)}
                                                        aria-label={`${r.label}: ${perm}`}
                                                        className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-violet-500 focus:ring-violet-500 disabled:opacity-40"
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </Card>
            {perms.length === 0 && <p role="status" className="text-sm text-neutral-400">No permissions match your search.</p>}

            {matrix.editable && (
                <div className="flex flex-wrap items-center gap-3">
                    <button disabled={!dirty || saving} onClick={() => { setSaving(true); setNotice(''); router.put(route('admin.permissions'), { granted }, { preserveScroll: true, onSuccess: () => setNotice('Permissions saved.'), onError: () => setNotice('Could not save permissions. Please try again.'), onFinish: () => setSaving(false) }); }} className={primaryBtn}>{saving ? 'Saving…' : 'Save matrix'}</button>
                    <button
                        onClick={() => confirm('Put every role back to the recommended permissions?') && router.put(route('admin.permissions.reset'), {}, { preserveScroll: true, onSuccess: () => location.reload() })}
                        className={ghostBtn}
                    >
                        Reset to recommended
                    </button>
                    {dirty && <span className="text-sm text-amber-300">Unsaved changes</span>}
                    {notice && <span role="status" className="text-sm text-emerald-300">{notice}</span>}
                </div>
            )}
        </section>
    );
}
