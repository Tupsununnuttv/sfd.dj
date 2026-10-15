import RoleIcon from '@/Components/RoleIcon';
import { Card, ghostBtn, primaryBtn } from '@/Components/ui';
import { router } from '@inertiajs/react';
import { Fragment, useState } from 'react';
import { AdminProps } from './types';

export default function MatrixTab({ matrix, groups }: { matrix: AdminProps['matrix']; groups: AdminProps['roleGroups'] }) {
    const [granted, setGranted] = useState<Record<string, string[]>>(matrix.granted);
    const has = (role: string, perm: string) => (granted[role] ?? []).includes(perm);
    const flip = (role: string, perm: string) =>
        setGranted((g) => ({ ...g, [role]: has(role, perm) ? (g[role] ?? []).filter((p) => p !== perm) : [...(g[role] ?? []), perm] }));
    const perms = Object.entries(matrix.permissions);

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

            <Card className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-white/10">
                        <tr>
                            <th className="sticky left-0 z-10 bg-neutral-900 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Role</th>
                            {perms.map(([key, label]) => (
                                <th key={key} title={key} className="min-w-28 px-3 py-3 text-left align-bottom text-[11px] font-semibold leading-tight text-neutral-400">{label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(groups).map(([group, heading]) => (
                            <Fragment key={group}>
                                <tr className="border-y border-white/10 bg-white/4">
                                    <th colSpan={perms.length + 1} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-neutral-200">
                                        <span className="sticky left-3">{heading.icon} {heading.label}</span>
                                    </th>
                                </tr>
                                {matrix.roles.filter((r) => r.group === group).map((r) => {
                                    const fixed = r.key === 'owner' || r.key === 'member'; // the Owner has it all, the User has nothing extra
                                    return (
                                        <tr key={r.key} className="border-b border-white/5 hover:bg-white/2">
                                            <td className="sticky left-0 z-10 whitespace-nowrap bg-neutral-900 px-3 py-2.5 text-xs font-bold" style={{ color: r.color }}>
                                                <span className="mr-2 inline-flex align-middle"><RoleIcon role={r} /></span>{r.label}
                                                {r.key === 'member' && <span className="ml-2 font-normal text-neutral-500">(everyone)</span>}
                                            </td>
                                            {perms.map(([perm]) => (
                                                <td key={perm} className="px-3 py-2.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={r.key === 'owner' || (r.key !== 'member' && has(r.key, perm))}
                                                        disabled={!matrix.editable || fixed}
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

            {matrix.editable && (
                <div className="flex flex-wrap items-center gap-3">
                    <button disabled={!dirty} onClick={() => router.put(route('admin.permissions'), { granted }, { preserveScroll: true })} className={primaryBtn}>Save matrix</button>
                    <button
                        onClick={() => confirm('Put every role back to the recommended permissions?') && router.put(route('admin.permissions.reset'), {}, { preserveScroll: true, onSuccess: () => location.reload() })}
                        className={ghostBtn}
                    >
                        Reset to recommended
                    </button>
                    {dirty && <span className="text-sm text-amber-300">Unsaved changes</span>}
                </div>
            )}
        </section>
    );
}
