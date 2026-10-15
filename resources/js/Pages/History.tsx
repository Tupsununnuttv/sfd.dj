import Avatar from '@/Components/Avatar';
import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';

interface Played {
    id: number;
    title: string;
    thumbnail: string | null;
    played_at: string;
    room: { name: string; slug: string };
    user: { name: string; avatar: string | null };
}

interface Props {
    songs: Played[];
    rooms: { name: string; slug: string }[];
    filters: { room: string | null; mine: boolean };
}

export default function History({ songs, rooms, filters }: Props) {
    const { guest } = usePage<PageProps>().props.auth;
    const apply = (next: Partial<Props['filters']>) => {
        const f = { ...filters, ...next };
        router.get(route('history'), { ...(f.room ? { room: f.room } : {}), ...(f.mine ? { mine: 1 } : {}) }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="History">
            <Head title="History" />
            <p className="-mt-3 text-sm text-neutral-400">Every song that has been played, newest first. Latest 100.</p>

            <div className="flex flex-wrap items-center gap-3">
                <select
                    value={filters.room ?? ''}
                    onChange={(e) => apply({ room: e.target.value || null })}
                    className="rounded-md border-neutral-700 bg-neutral-800 text-sm text-neutral-100 focus:border-violet-500 focus:ring-violet-500"
                >
                    <option value="">All rooms</option>
                    {rooms.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
                </select>
                {!guest && <label className="flex items-center gap-2 text-sm text-neutral-300">
                    <input type="checkbox" checked={filters.mine} onChange={(e) => apply({ mine: e.target.checked })} className="rounded border-neutral-600 bg-neutral-800 text-violet-500 focus:ring-violet-500" />
                    Only my songs
                </label>}
            </div>

            {songs.length === 0 ? (
                <p className="text-neutral-500">Nothing has been played yet.</p>
            ) : (
                <ul className="divide-y divide-neutral-800 rounded-2xl border border-white/10 bg-white/4">
                    {songs.map((s) => (
                        <li key={s.id} className="flex items-center gap-4 p-3">
                            {s.thumbnail && <img src={s.thumbnail} alt="" className="h-12 w-20 shrink-0 rounded object-cover" />}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{s.title}</p>
                                <p className="flex items-center gap-1.5 text-xs text-neutral-500">
                                    <Avatar name={s.user.name} avatar={s.user.avatar} className="h-4 w-4 text-[9px]" />
                                    <span className="text-neutral-300">{s.user.name}</span> played it in
                                    <Link href={route('rooms.show', s.room.slug)} className="text-violet-400 hover:underline">{s.room.name}</Link>
                                    · {new Date(s.played_at).toLocaleString()}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </AppLayout>
    );
}
