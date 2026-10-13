import { Card, fieldBase, fieldClass } from '@/Components/ui';
import { AdminProps, AdminUser } from '@/Components/admin/types';
import { Link, router, useForm } from '@inertiajs/react';
import { FormEvent, Fragment, useState } from 'react';

const th = 'px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500';

function AccountEditor({ user, onClose }: { user: AdminUser; onClose: () => void }) {
    const form = useForm({
        name: user.name,
        username: user.username ?? '',
        email: user.email,
        password: '',
        password_confirmation: '',
    });

    const save = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.patch(route('admin.users.account', user.id), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('password', 'password_confirmation');
                onClose();
            },
        });
    };

    return (
        <form onSubmit={save} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="space-y-1 text-xs text-neutral-400">Display name
                    <input value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} className={`${fieldBase} w-full`} maxLength={30} required />
                    {form.errors.name && <span className="block text-red-300">{form.errors.name}</span>}
                </label>
                <label className="space-y-1 text-xs text-neutral-400">Username
                    <input value={form.data.username} onChange={(event) => form.setData('username', event.target.value)} className={`${fieldBase} w-full`} maxLength={20} />
                    {form.errors.username && <span className="block text-red-300">{form.errors.username}</span>}
                </label>
                <label className="space-y-1 text-xs text-neutral-400">Email
                    <input type="email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} className={`${fieldBase} w-full`} maxLength={255} required />
                    {form.errors.email && <span className="block text-red-300">{form.errors.email}</span>}
                </label>
                <label className="space-y-1 text-xs text-neutral-400">New password
                    <input type="password" autoComplete="new-password" value={form.data.password} onChange={(event) => form.setData('password', event.target.value)} className={`${fieldBase} w-full`} />
                    {form.errors.password && <span className="block text-red-300">{form.errors.password}</span>}
                </label>
                <label className="space-y-1 text-xs text-neutral-400">Confirm new password
                    <input type="password" autoComplete="new-password" value={form.data.password_confirmation} onChange={(event) => form.setData('password_confirmation', event.target.value)} className={`${fieldBase} w-full`} />
                </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-neutral-500">Leave both password fields empty to keep the current password. Changing the email requires verification again.</p>
                <div className="flex gap-2">
                    <button type="button" onClick={onClose} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20">Cancel</button>
                    <button disabled={form.processing} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50">{form.processing ? 'Saving...' : 'Save account'}</button>
                </div>
            </div>
        </form>
    );
}

export default function AccountsTab({ q, filters, users }: Pick<AdminProps, 'q' | 'filters' | 'users'>) {
    const [search, setSearch] = useState(q);
    const [editing, setEditing] = useState<number | null>(null);

    const find = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const query = { q: search, role: filters.role, type: filters.type, sort: filters.sort };
        router.get(route('admin'), Object.fromEntries(Object.entries(query).filter(([, value]) => value)), { preserveState: true, replace: true });
    };

    return (
        <section className="space-y-4">
            <form onSubmit={find} className="flex flex-wrap items-center gap-2">
                <input aria-label="Search accounts" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, username or email" className={`${fieldClass} min-w-56 flex-1 sm:max-w-sm`} />
                <button className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">Search</button>
            </form>

            <Card className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-white/10">
                        <tr><th className={th}>Person</th><th className={th}>Username</th><th className={th}>Email</th><th className={th}></th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.data.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-neutral-500">No accounts match.</td></tr>}
                        {users.data.map((user) => (
                            <Fragment key={user.id}>
                                <tr className="hover:bg-white/[0.02]">
                                    <td className="px-3 py-3"><Link href={route('users.show', user.id)} className="font-semibold hover:underline">{user.name}</Link></td>
                                    <td className="px-3 py-3 text-neutral-400">{user.username ? `@${user.username}` : '-'}</td>
                                    <td className="px-3 py-3 text-neutral-400">{user.email}</td>
                                    <td className="px-3 py-3 text-right">
                                        {user.editable
                                            ? <button onClick={() => setEditing(editing === user.id ? null : user.id)} className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20">{editing === user.id ? 'Close' : 'Edit account'}</button>
                                            : <span title="You can only change people ranked below you" className="text-xs text-neutral-600">locked</span>}
                                    </td>
                                </tr>
                                {editing === user.id && user.editable && <tr><td colSpan={4} className="border-b border-white/10 bg-black/20 p-4"><AccountEditor user={user} onClose={() => setEditing(null)} /></td></tr>}
                            </Fragment>
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
