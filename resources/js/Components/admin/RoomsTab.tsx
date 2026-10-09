import RoomBadge, { roomBadgeKeys, roomBadges } from '@/Components/RoomBadge';
import { Card, fieldClass } from '@/Components/ui';
import { ago } from '@/lib/time';
import { Link, router } from '@inertiajs/react';
import { Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AdminRoom } from './types';

const th = 'px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500';

export default function RoomsTab({ rooms, counts }: { rooms: AdminRoom[]; counts: Record<number, number> }) {
    const [q, setQ] = useState('');
    const needle = q.trim().toLowerCase();
    const shown = useMemo(() => rooms.filter((r) => !needle || `${r.name} ${r.user.name} ${r.genre ?? ''}`.toLowerCase().includes(needle)), [rooms, needle]);
    const patch = (r: AdminRoom, data: Record<string, string | boolean | string[] | null>) => router.patch(route('admin.rooms.update', r.slug), data, { preserveScroll: true });

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative min-w-56 flex-1 sm:max-w-sm">
                    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search rooms, hosts, genres" className={`${fieldClass} pl-9`} />
                </div>
                <p className="text-sm text-neutral-500">{shown.length} of {rooms.length} rooms</p>
            </div>

            <Card className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-white/10">
                        <tr><th className={th}>Room</th><th className={th}>Host</th><th className={th}>Listening</th><th className={th}>Queue</th><th className={th}>Created</th><th className={th}>Badges</th><th className={th}>Featured</th><th className={th}></th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {shown.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-neutral-500">No rooms.</td></tr>}
                        {shown.map((r) => (
                            <tr key={r.id} className="hover:bg-white/[0.02]">
                                <td className="px-3 py-3">
                                    <Link href={route('rooms.show', r.slug)} className="font-semibold hover:underline">{r.name}</Link> <RoomBadge badges={r.badges} />{r.is_private && <span title="Private room" className="ml-1">🔒</span>}
                                    <p className="text-xs text-neutral-500">{r.genre ?? 'No genre'}</p>
                                </td>
                                <td className="px-3 py-3 text-neutral-400">{r.user.name}</td>
                                <td className="px-3 py-3">{(counts[r.id] ?? 0) > 0 ? <span className="text-green-400">● {counts[r.id]}</span> : <span className="text-neutral-600">0</span>}</td>
                                <td className="px-3 py-3 text-neutral-400">{r.items_count}</td>
                                <td className="whitespace-nowrap px-3 py-3 text-xs text-neutral-500">{ago(r.created_at)}</td>
                                <td className="px-3 py-3">
                                    <div className="flex gap-1.5">
                                        {roomBadgeKeys.map((key) => {
                                            const has = r.badges ?? [];
                                            const on = has.includes(key);
                                            const b = roomBadges[key];

                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    aria-pressed={on}
                                                    title={on ? `Take the ${b.name} badge away` : `Give the room the ${b.name} badge`}
                                                    onClick={() => patch(r, { badges: on ? has.filter((k) => k !== key) : [...has, key] })}
                                                    className={`whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-bold uppercase leading-none transition ${on ? `border-transparent ${b.className}` : 'border-white/10 text-neutral-500 hover:border-white/25 hover:text-neutral-300'}`}
                                                >
                                                    {b.glyph} {b.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </td>
                                <td className="px-3 py-3">
                                    <input type="checkbox" checked={r.is_featured} onChange={(e) => patch(r, { is_featured: e.target.checked })} className="rounded border-neutral-600 bg-neutral-800 text-violet-500 focus:ring-violet-500" />
                                </td>
                                <td className="px-3 py-3 text-right">
                                    <button onClick={() => confirm(`Delete room "${r.name}"? Its chat and queue go with it.`) && router.delete(route('admin.rooms.destroy', r.slug), { preserveScroll: true })} title="Delete room" className="rounded-lg p-1.5 text-neutral-500 hover:bg-red-500/20 hover:text-red-300"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </section>
    );
}
