import { SiteStats } from '@/lib/useLiveStats';

export default function SiteCounters({ stats, stale = false }: { stats: SiteStats | null; stale?: boolean }) {
    const items = [
        ['Registered members', stats?.members, 'Human accounts; bots are excluded.'],
        ['Online members', stats?.online, 'Members active in the last 5 minutes. Each account counts once.'],
        ['Public rooms', stats?.rooms, 'Rooms that everyone can browse.'],
        ['Listening now', stats?.listening, 'Unique members listening across rooms. Bots are excluded.'],
    ] as const;
    return <section aria-label="Community statistics" className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
        <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">{items.map(([label, value, hint]) => <div key={label} title={hint}><dt className="text-[11px] text-neutral-400">{label}</dt><dd className="mt-1 text-2xl font-bold tabular-nums text-white">{value == null ? '—' : value.toLocaleString()}</dd>{label === 'Online members' && <p className="text-[10px] text-neutral-500">Active in the last 5 min</p>}</div>)}</dl>
        <p className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-neutral-500"><span className={`h-1.5 w-1.5 rounded-full ${stale ? 'bg-amber-400' : 'bg-emerald-400'}`} />{stale ? 'Connection interrupted · showing the last update' : 'Updates every 5 seconds'}{stats && <time dateTime={stats.updated_at}>· {new Date(stats.updated_at).toLocaleTimeString()}</time>}{stats?.listening === null && <span>· Listener service unavailable</span>}</p>
    </section>;
}
