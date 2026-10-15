import { Card, chip, fieldClass } from '@/Components/ui';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Kind, releases } from '@/lib/patchNotes';

const badge: Record<Kind, string> = {
    new: 'bg-violet-500/20 text-violet-300',
    improved: 'bg-sky-500/20 text-sky-300',
    fixed: 'bg-emerald-500/20 text-emerald-300',
};
const dot: Record<Kind, string> = { new: 'bg-violet-400', improved: 'bg-sky-400', fixed: 'bg-emerald-400' };
const kinds: Kind[] = ['new', 'improved', 'fixed'];

export default function PatchNotes() {
    const [kind, setKind] = useState<Kind | null>(null);
    const [q, setQ] = useState('');
    const needle = q.trim().toLowerCase();

    const totals = useMemo(() => Object.fromEntries(kinds.map((k) => [k, releases.reduce((n, r) => n + r.notes.filter(([x]) => x === k).length, 0)])) as Record<Kind, number>, []);
    const shown = useMemo(() => releases
        .map((r) => ({ ...r, notes: r.notes.filter(([k, text]) => (!kind || k === kind) && (!needle || `${r.title} ${text}`.toLowerCase().includes(needle))) }))
        .filter((r) => r.notes.length > 0), [kind, needle]);

    return (
        <AppLayout title="Patch notes" subtitle={`What changed, newest first. ${releases.length} releases so far.`}>
            <Head title="Patch notes" />

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-52 flex-1 sm:max-w-xs">
                    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the notes" className={`${fieldClass} pl-9`} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setKind(null)} className={chip(kind === null)}>All</button>
                    {kinds.map((k) => <button key={k} onClick={() => setKind(kind === k ? null : k)} className={chip(kind === k)}>{k[0].toUpperCase() + k.slice(1)} · {totals[k]}</button>)}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_11rem]">
                <div className="relative space-y-6 border-l border-white/10 pl-6">
                    {shown.length === 0 && <p className="text-neutral-500">Nothing matches.</p>}
                    {shown.map((r) => (
                        <section key={r.version} id={`v${r.version}`} className="relative scroll-mt-4">
                            <span className={`absolute left-[-31px] top-5 h-3 w-3 rounded-full ring-4 ring-neutral-950 ${r.version === releases[0].version ? 'bg-green-400' : 'bg-violet-400'}`} />
                            <Card className="p-5">
                                <h2 className="flex flex-wrap items-center gap-3 font-bold">
                                    <span className="rounded-md bg-linear-to-r from-fuchsia-500 to-violet-500 px-2 py-0.5 text-sm">v{r.version}</span>
                                    {r.title}
                                    {r.version === releases[0].version && <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-300">Latest</span>}
                                </h2>
                                <ul className="mt-4 space-y-2.5 text-sm">
                                    {r.notes.map(([k, text]) => (
                                        <li key={text} className="flex items-start gap-3">
                                            <span className={`mt-0.5 w-18 shrink-0 rounded px-1.5 py-0.5 text-center text-[10px] font-bold uppercase ${badge[k]}`}>{k}</span>
                                            <span className="text-neutral-300">{text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        </section>
                    ))}
                </div>

                <aside className="hidden lg:block">
                    <ul className="sticky top-4 space-y-1 text-sm">
                        <li className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Versions</li>
                        {releases.map((r) => (
                            <li key={r.version}>
                                <a href={`#v${r.version}`} className="flex items-center gap-2 rounded-md px-2 py-1 text-neutral-400 hover:bg-white/5 hover:text-white">
                                    <span className={`h-1.5 w-1.5 rounded-full ${dot[r.notes[0]?.[0] ?? 'new']}`} /> v{r.version}
                                </a>
                            </li>
                        ))}
                    </ul>
                </aside>
            </div>
        </AppLayout>
    );
}
