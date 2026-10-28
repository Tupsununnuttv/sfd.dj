import { getJson, sendJson } from '@/lib/post';
import { formatDateTime } from '@/lib/regional';
import { chip } from '@/Components/ui';
import { useCallback, useEffect, useState } from 'react';

type Status = 'pending' | 'under_review' | 'accepted' | 'rejected';

interface Row {
    id: number;
    applicant: string;
    position: string;
    status: Status;
    source: 'website' | 'discord';
    submitted_at: string;
}

interface Detail extends Row {
    applicant_account: { id: number; name: string; username: string | null; joined: string } | null;
    discord_id: string | null;
    answers: { number: number; section: string; label: string; value: string }[];
    staff_notes: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
}

interface List {
    applications: Row[];
    counts: Record<Status, number>;
    statuses: Record<Status, string>;
    positions: string[];
    sections: Record<string, string>;
}

const tone: Record<Status, string> = {
    pending: 'bg-sky-500/15 text-sky-300',
    under_review: 'bg-amber-500/15 text-amber-300',
    accepted: 'bg-emerald-500/15 text-emerald-300',
    rejected: 'bg-red-500/15 text-red-300',
};
const select = 'rounded-md border-neutral-700 bg-neutral-800 text-sm text-neutral-100 focus:border-violet-500 focus:ring-violet-500';
const field = `w-full ${select} placeholder-neutral-500`;
const time = (iso: string) => formatDateTime(iso, { dateStyle: 'medium', timeStyle: 'short' });

/** Admin panel → Applications: every staff application with its 15 answers. Staff move it through the review, accept or reject it, and keep private notes. */
export default function ApplicationsPanel() {
    const [list, setList] = useState<List | null>(null);
    const [status, setStatus] = useState<Status | ''>('');
    const [position, setPosition] = useState('');
    const [openId, setOpenId] = useState<number | null>(() => Number(new URLSearchParams(window.location.search).get('application')) || null);
    const [detail, setDetail] = useState<Detail | null>(null);
    const [notes, setNotes] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        const query = new URLSearchParams({ ...(status && { status }), ...(position && { position }) });
        return getJson<List>(`${route('admin.applications.index')}?${query}`).then((l) => { setList(l); setError(''); }).catch((e: Error) => setError(e.message));
    }, [status, position]);

    useEffect(() => {
        load();
        const timer = window.setInterval(() => { if (!document.hidden) load(); }, 20000);
        return () => window.clearInterval(timer);
    }, [load]);

    useEffect(() => {
        if (openId === null) { setDetail(null); return; }
        setMessage('');
        getJson<Detail>(route('admin.applications.show', openId)).then((d) => { setDetail(d); setNotes(d.staff_notes ?? ''); }).catch((e: Error) => setError(e.message));
    }, [openId]);

    const update = (data: { status?: Status; staff_notes?: string }) => {
        if (!detail || busy) return;
        setBusy(true);
        setError('');
        sendJson<{ application: Detail; notice: string | null }>('PATCH', route('admin.applications.update', detail.id), data)
            .then((r) => { setDetail(r.application); setNotes(r.application.staff_notes ?? ''); setMessage(r.notice ?? (data.status ? `Marked ${list?.statuses[data.status]}.` : 'Notes saved.')); return load(); })
            .catch((e: Error) => setError(e.message))
            .finally(() => setBusy(false));
    };

    const decide = (next: Status) => {
        if (!detail) return;
        const words = { accepted: `Accept ${detail.applicant} for ${detail.position}? Their Discord staff role is given when their Discord account is linked.`, rejected: `Reject ${detail.applicant}'s application for ${detail.position}?` };
        if (next in words && !window.confirm(words[next as 'accepted' | 'rejected'])) return;
        update({ status: next });
    };

    const statuses = list ? (Object.keys(list.statuses) as Status[]) : [];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <button className={chip(status === '')} onClick={() => setStatus('')}>All</button>
                {statuses.map((s) => <button key={s} className={chip(status === s)} onClick={() => setStatus(s)}>{list?.statuses[s]} <span className="tabular-nums opacity-70">{list?.counts[s] ?? 0}</span></button>)}
                <select value={position} onChange={(e) => setPosition(e.target.value)} aria-label="Filter by position" className={`${select} ml-auto`}>
                    <option value="">All positions</option>
                    {list?.positions.map((p) => <option key={p}>{p}</option>)}
                </select>
            </div>
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

            <div className="grid min-h-112 gap-4 lg:grid-cols-[20rem_1fr]">
                <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/4">
                    <p className="border-b border-neutral-800 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Applications</p>
                    {list && list.applications.length === 0 && <p className="p-4 text-sm text-neutral-500">No applications here.</p>}
                    <ul className="max-h-128 divide-y divide-neutral-800 overflow-y-auto">
                        {list?.applications.map((a) => (
                            <li key={a.id}>
                                <button onClick={() => setOpenId(a.id)} className={`w-full px-4 py-3 text-left hover:bg-neutral-800 ${openId === a.id ? 'bg-neutral-800' : ''}`}>
                                    <p className="flex items-center gap-2 text-sm font-medium">
                                        <span className="truncate">{a.applicant}</span>
                                        <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone[a.status]}`}>{list.statuses[a.status]}</span>
                                    </p>
                                    <p className="text-xs text-neutral-400">{a.position} · {a.source === 'discord' ? 'Discord' : 'Website'}</p>
                                    <p className="text-[10px] text-neutral-600">{time(a.submitted_at)}</p>
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/4">
                    {!detail || !list ? (
                        <p className="flex h-full min-h-112 items-center justify-center text-sm text-neutral-500">Pick an application.</p>
                    ) : (
                        <div className="max-h-176 space-y-5 overflow-y-auto p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-bold">{detail.applicant} <span className={`ml-1 rounded-full px-2 py-0.5 align-middle text-[11px] font-semibold ${tone[detail.status]}`}>{list.statuses[detail.status]}</span></h2>
                                    <p className="text-sm text-neutral-400">{detail.position} · sent {time(detail.submitted_at)} from {detail.source === 'discord' ? 'Discord' : 'the website'}</p>
                                    <p className="mt-1 text-xs text-neutral-500">
                                        {detail.applicant_account
                                            ? <>SFD-DJ.EU account: <a href={route('users.show', detail.applicant_account.id)} className="text-violet-300 underline">{detail.applicant_account.name}</a> (user #{detail.applicant_account.id}, joined {time(detail.applicant_account.joined)})</>
                                            : 'No SFD-DJ.EU account: applied from Discord.'}
                                        {' · '}{detail.discord_id ? `Discord ID ${detail.discord_id}` : 'Discord not linked'}
                                    </p>
                                    {detail.reviewed_at && <p className="mt-1 text-xs text-neutral-500">Last changed {time(detail.reviewed_at)}{detail.reviewed_by && ` by ${detail.reviewed_by}`}</p>}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {statuses.filter((s) => s !== detail.status).map((s) => (
                                        <button key={s} disabled={busy} onClick={() => decide(s)} className={`rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${s === 'accepted' ? 'bg-emerald-600 hover:bg-emerald-500' : s === 'rejected' ? 'bg-red-600 hover:bg-red-500' : 'bg-neutral-800 hover:bg-neutral-700'}`}>
                                            {s === 'accepted' ? 'Accept application' : s === 'rejected' ? 'Reject application' : s === 'under_review' ? 'Mark Under Review' : 'Back to Pending'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {message && <p role="status" className="rounded-md bg-white/5 px-3 py-2 text-sm text-neutral-200">{message}</p>}

                            {Object.entries(list.sections).map(([key, title]) => (
                                <div key={key}>
                                    <h3 className="mb-2 border-b border-neutral-800 pb-1 text-xs font-bold uppercase tracking-wider text-neutral-500">{title}</h3>
                                    <dl className="space-y-3">
                                        {detail.answers.filter((a) => a.section === key).map((a) => (
                                            <div key={a.number}>
                                                <dt className="text-xs text-neutral-500">{a.number}. {a.label}</dt>
                                                <dd className="whitespace-pre-wrap wrap-break-word text-sm text-neutral-100">{a.value || <span className="text-neutral-600">(no answer)</span>}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            ))}

                            <div>
                                <label htmlFor="staff-notes" className="mb-1 block text-xs font-bold uppercase tracking-wider text-neutral-500">Private staff notes</label>
                                <textarea id="staff-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={3000} rows={4} placeholder="Only staff with this permission can see these." className={field} />
                                <button disabled={busy || notes === (detail.staff_notes ?? '')} onClick={() => update({ staff_notes: notes })} className="mt-2 rounded-md bg-violet-600 px-4 py-1.5 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50">Save notes</button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
