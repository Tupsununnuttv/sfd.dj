import RoleIcon from '@/Components/RoleIcon';
import { router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

export interface RoomRoleInfo {
    id: number;
    name: string;
    color: string;
    rank: number;
    permissions: string[];
    builtin: boolean;
}

const field =
    'rounded border-neutral-700 bg-neutral-900 text-sm text-white placeholder-neutral-500 focus:border-violet-500 focus:ring-0';

/** Create, edit and delete a room's custom roles. Built-in roles (Co-Host, Manager, Bouncer, Resident DJ) are read-only. */
function RoleForm({
    labels,
    initial,
    onSubmit,
    onCancel,
    submitLabel,
}: {
    labels: Record<string, string>;
    initial: { name: string; color: string; permissions: string[] };
    onSubmit: (data: { name: string; color: string; permissions: string[] }) => void;
    onCancel?: () => void;
    submitLabel: string;
}) {
    const [name, setName] = useState(initial.name);
    const [color, setColor] = useState(initial.color);
    const [permissions, setPermissions] = useState(initial.permissions);

    const toggle = (p: string) => setPermissions((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
    const submit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit({ name, color, permissions });
    };

    return (
        <form onSubmit={submit} className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950 p-3">
            <div className="flex gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder="Role name" className={`${field} flex-1`} />
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-neutral-700 bg-neutral-900" aria-label="Role colour" />
            </div>
            <div className="grid gap-1">
                {Object.entries(labels).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-xs text-neutral-300">
                        <input type="checkbox" checked={permissions.includes(key)} onChange={() => toggle(key)} className="rounded border-neutral-600 bg-neutral-800 text-violet-500 focus:ring-violet-500" />
                        {label}
                    </label>
                ))}
            </div>
            <div className="flex gap-2">
                <button disabled={!name.trim()} className="rounded bg-violet-600 px-3 py-1.5 text-xs font-semibold hover:bg-violet-500 disabled:opacity-50">{submitLabel}</button>
                {onCancel && <button type="button" onClick={onCancel} className="rounded bg-neutral-800 px-3 py-1.5 text-xs hover:bg-neutral-700">Cancel</button>}
            </div>
        </form>
    );
}

export default function RoomRolesEditor({ slug, roles, labels }: { slug: string; roles: RoomRoleInfo[]; labels: Record<string, string> }) {
    const [editing, setEditing] = useState<number | 'new' | null>(null);
    const opts = { preserveScroll: true, onSuccess: () => setEditing(null) };

    return (
        <div className="space-y-3 border-t border-neutral-800 pt-4">
            <h3 className="text-sm font-semibold">Room roles</h3>
            <p className="text-xs text-neutral-500">Give people a role from the Users tab. Create your own roles with exactly the powers you want.</p>

            <ul className="space-y-2">
                {roles.map((r) =>
                    editing === r.id ? (
                        <li key={r.id}>
                            <RoleForm
                                labels={labels}
                                initial={r}
                                submitLabel="Save role"
                                onCancel={() => setEditing(null)}
                                onSubmit={(d) => router.patch(route('rooms.roles.update', [slug, r.id]), d, opts)}
                            />
                        </li>
                    ) : (
                        <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                            <span>
                                <span className="mr-1.5 inline-flex align-middle"><RoleIcon role={{ key: `room-${r.id}`, label: r.name, color: r.color }} /></span>
                                <span className="font-semibold" style={{ color: r.color }}>{r.name}</span>
                                <span className="ml-2 text-xs text-neutral-500">
                                    {r.permissions.map((p) => labels[p]).join(', ') || 'no permissions'}
                                </span>
                            </span>
                            {r.builtin ? (
                                <span className="text-xs text-neutral-600">built-in</span>
                            ) : (
                                <span className="flex shrink-0 gap-3 text-xs">
                                    <button onClick={() => setEditing(r.id)} className="text-violet-400 hover:underline">Edit</button>
                                    <button
                                        onClick={() => confirm(`Delete the role "${r.name}"? People holding it lose it.`) && router.delete(route('rooms.roles.destroy', [slug, r.id]), { preserveScroll: true })}
                                        className="text-red-400 hover:underline"
                                    >
                                        Delete
                                    </button>
                                </span>
                            )}
                        </li>
                    ),
                )}
            </ul>

            {editing === 'new' ? (
                <RoleForm
                    labels={labels}
                    initial={{ name: '', color: '#a78bfa', permissions: [] }}
                    submitLabel="Create role"
                    onCancel={() => setEditing(null)}
                    onSubmit={(d) => router.post(route('rooms.roles.store', slug), d, opts)}
                />
            ) : (
                <button onClick={() => setEditing('new')} className="rounded bg-neutral-800 px-3 py-1.5 text-xs hover:bg-neutral-700">＋ New custom role</button>
            )}
        </div>
    );
}
