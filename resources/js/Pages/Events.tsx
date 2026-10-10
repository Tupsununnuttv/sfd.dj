import Avatar from '@/Components/Avatar';
import { Card, EmptyState, fieldClass, ghostBtn, primaryBtn, SectionTitle, Tabs } from '@/Components/ui';
import AppLayout from '@/Layouts/AppLayout';
import { countdown, until, useNow } from '@/lib/time';
import { PageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { CalendarPlus, Check, Plus, Radio, Trash2, X } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

interface EventCard {
    id: number;
    title: string;
    description: string | null;
    starts_at: string;
    ends_at: string | null;
    room: { name: string; slug: string } | null;
    going_count: number;
    going: boolean;
    can_delete: boolean;
    attendees: { id: number; name: string; avatar: string | null }[];
    is_live: boolean;
}

interface Props {
    upcoming: EventCard[];
    past: EventCard[];
    canCreate: boolean;
    canManage: boolean;
    rooms: { id: number; name: string }[];
}

const when = (iso: string) => new Date(iso).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const month = (iso: string) => new Date(iso).toLocaleDateString([], { month: 'short' }).toUpperCase();
const day = (iso: string) => new Date(iso).getDate();

/** Which heading an upcoming event goes under. */
function bucket(e: EventCard): string {
    if (e.is_live) return 'Happening now';
    const d = new Date(e.starts_at);
    const days = Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
    return days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : days < 7 ? 'This week' : 'Later';
}

/** An .ics file the person can open in Google Calendar, Outlook or Apple Calendar. */
function downloadIcs(e: EventCard) {
    const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
    const end = e.ends_at ?? new Date(new Date(e.starts_at).getTime() + 2 * 3600000).toISOString();
    const lines = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SFD.DJ//Events//EN', 'BEGIN:VEVENT',
        `UID:sfddj-event-${e.id}@${window.location.host}`,
        `DTSTAMP:${stamp(new Date().toISOString())}`,
        `DTSTART:${stamp(e.starts_at)}`,
        `DTEND:${stamp(end)}`,
        `SUMMARY:${esc(e.title)}`,
        ...(e.description ? [`DESCRIPTION:${esc(e.description)}`] : []),
        ...(e.room ? [`LOCATION:${esc(e.room.name)} on SFD.DJ`, `URL:${window.location.origin}/rooms/${e.room.slug}`] : []),
        'END:VEVENT', 'END:VCALENDAR',
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `${e.title.replace(/[^\w-]+/g, '-')}.ics` });
    a.click();
    URL.revokeObjectURL(url);
}

function Faces({ e }: { e: EventCard }) {
    const more = e.going_count - e.attendees.length;

    return (
        <div className="flex items-center gap-2 text-xs text-neutral-400">
            {e.attendees.length > 0 && (
                <span className="flex -space-x-2">
                    {e.attendees.map((a) => <span key={a.id} title={a.name} className="rounded-full ring-2 ring-neutral-900"><Avatar name={a.name} avatar={a.avatar} className="h-6 w-6 text-[10px]" /></span>)}
                </span>
            )}
            <span>{e.going_count === 0 ? 'Nobody yet' : more > 0 ? `+${more} more going` : `${e.going_count} going`}</span>
        </div>
    );
}

function GoingButton({ e, guest }: { e: EventCard; guest: boolean }) {
    if (guest) return <Link href={route('login')} className={ghostBtn}>Log in to join</Link>;

    return (
        <button
            onClick={() => router.post(route('events.attend', e.id), {}, { preserveScroll: true })}
            className={e.going ? 'flex items-center gap-1.5 rounded-lg bg-green-500/20 px-4 py-2 text-sm font-semibold text-green-300 hover:bg-green-500/30' : primaryBtn}
        >
            {e.going ? <><Check size={15} /> I am going</> : "I'm going"}
        </button>
    );
}

function Countdown({ iso }: { iso: string }) {
    const c = countdown(iso, useNow(1000));
    if (!c) return <span className="font-semibold text-green-300">Starting now</span>;
    const box = (n: number, l: string) => (
        <div className="min-w-14 rounded-xl bg-black/30 px-3 py-2 text-center"><p className="text-2xl font-black tabular-nums">{String(n).padStart(2, '0')}</p><p className="text-[10px] uppercase tracking-wider text-neutral-400">{l}</p></div>
    );

    return <div className="flex gap-2">{box(c.d, 'days')}{box(c.h, 'hours')}{box(c.m, 'min')}{box(c.s, 'sec')}</div>;
}

function Featured({ e, guest }: { e: EventCard; guest: boolean }) {
    return (
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-600/25 via-violet-600/15 to-sky-600/10 p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="relative flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-xl">
                    {e.is_live ? (
                        <p className="inline-flex items-center gap-2 rounded-full bg-red-500/90 px-3 py-1 text-xs font-bold"><span className="h-2 w-2 animate-pulse rounded-full bg-white" /> LIVE NOW</p>
                    ) : (
                        <p className="text-xs font-bold uppercase tracking-wider text-violet-200">Next event · {until(e.starts_at)}</p>
                    )}
                    <h2 className="mt-3 text-3xl font-black tracking-tight">{e.title}</h2>
                    <p className="mt-1 text-violet-200">{when(e.starts_at)}{e.ends_at && ` – ${when(e.ends_at)}`}</p>
                    {e.description && <p className="mt-3 whitespace-pre-line text-neutral-200">{e.description}</p>}
                    <div className="mt-4"><Faces e={e} /></div>
                </div>
                {!e.is_live && <Countdown iso={e.starts_at} />}
            </div>
            <div className="relative mt-6 flex flex-wrap items-center gap-2">
                {e.room && <Link href={route('rooms.show', e.room.slug)} className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-neutral-900 hover:bg-neutral-200"><Radio size={15} /> {e.is_live ? 'Join' : 'Open'} {e.room.name}</Link>}
                <GoingButton e={e} guest={guest} />
                <button onClick={() => downloadIcs(e)} className={`${ghostBtn} flex items-center gap-2`}><CalendarPlus size={15} /> Add to calendar</button>
                {e.can_delete && <DeleteButton e={e} />}
            </div>
        </section>
    );
}

function DeleteButton({ e }: { e: EventCard }) {
    return (
        <button onClick={() => confirm(`Delete "${e.title}"?`) && router.delete(route('events.destroy', e.id), { preserveScroll: true })} title="Delete event" className="rounded-lg p-2 text-neutral-400 hover:bg-red-500/20 hover:text-red-300"><Trash2 size={16} /></button>
    );
}

function EventItem({ e, past, guest }: { e: EventCard; past?: boolean; guest: boolean }) {
    return (
        <Card className={`flex gap-4 p-4 ${past ? 'opacity-70' : ''}`}>
            <div className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl ${e.is_live ? 'bg-red-500/80' : 'bg-gradient-to-br from-fuchsia-500/30 to-violet-500/30'}`}>
                <span className="text-[10px] font-bold tracking-wider text-white/80">{month(e.starts_at)}</span>
                <span className="text-2xl font-black leading-none">{day(e.starts_at)}</span>
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{e.title}</h3>
                    {e.is_live && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold">LIVE</span>}
                </div>
                <p className="text-sm text-violet-300">{when(e.starts_at)}{e.ends_at && ` – ${when(e.ends_at)}`}{!past && !e.is_live && <span className="ml-2 text-xs text-neutral-400">({until(e.starts_at)})</span>}</p>
                {e.description && <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-neutral-400">{e.description}</p>}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <Faces e={e} />
                        {e.room && <Link href={route('rooms.show', e.room.slug)} className="text-sm text-violet-400 hover:underline">🎧 {e.room.name}</Link>}
                    </div>
                    <div className="flex items-center gap-1.5">
                        {!past && (
                            <>
                                <button onClick={() => downloadIcs(e)} title="Add to calendar" className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"><CalendarPlus size={16} /></button>
                                {guest ? null : (
                                    <button
                                        onClick={() => router.post(route('events.attend', e.id), {}, { preserveScroll: true })}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${e.going ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' : 'bg-violet-600 hover:bg-violet-500'}`}
                                    >
                                        {e.going ? '✓ Going' : "I'm going"}
                                    </button>
                                )}
                            </>
                        )}
                        {e.can_delete && <DeleteButton e={e} />}
                    </div>
                </div>
            </div>
        </Card>
    );
}

function NewEvent({ rooms, onClose }: { rooms: Props['rooms']; onClose: () => void }) {
    const { data, setData, post, processing, errors, transform } = useForm({ title: '', description: '', starts_at: '', ends_at: '', room_id: '' });

    // the browser's datetime-local value is local time without a zone; send it as an exact instant
    transform((d) => ({
        ...d,
        starts_at: d.starts_at ? new Date(d.starts_at).toISOString() : '',
        ends_at: d.ends_at ? new Date(d.ends_at).toISOString() : '',
        room_id: d.room_id || null,
    }));

    const create = (e: FormEvent) => {
        e.preventDefault();
        post(route('events.store'), { preserveScroll: true, onSuccess: onClose });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
            <form onSubmit={create} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg space-y-3 rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">New event</h2>
                    <button type="button" onClick={onClose} className="text-neutral-500 hover:text-white" aria-label="Close"><X size={18} /></button>
                </div>
                <div>
                    <input autoFocus value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="Title" maxLength={120} className={fieldClass} />
                    {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title}</p>}
                </div>
                <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="What is it about? (optional)" rows={3} maxLength={1000} className={fieldClass} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="text-xs text-neutral-400">
                        Starts
                        <input type="datetime-local" value={data.starts_at} onChange={(e) => setData('starts_at', e.target.value)} className={`${fieldClass} mt-1`} />
                        {errors.starts_at && <span className="text-sm text-red-400">{errors.starts_at}</span>}
                    </label>
                    <label className="text-xs text-neutral-400">
                        Ends (optional)
                        <input type="datetime-local" value={data.ends_at} onChange={(e) => setData('ends_at', e.target.value)} className={`${fieldClass} mt-1`} />
                        {errors.ends_at && <span className="text-sm text-red-400">{errors.ends_at}</span>}
                    </label>
                </div>
                <label className="block text-xs text-neutral-400">
                    Room (optional)
                    <select value={data.room_id} onChange={(e) => setData('room_id', e.target.value)} className={`${fieldClass} mt-1`}>
                        <option value="">No room</option>
                        {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </label>
                <button disabled={processing} className={`${primaryBtn} w-full py-2.5`}>Create event</button>
            </form>
        </div>
    );
}

export default function Events({ upcoming, past, canCreate, rooms }: Props) {
    const { guest } = usePage<PageProps>().props.auth;
    const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
    const [creating, setCreating] = useState(false);

    const featured = upcoming[0] ?? null;
    const rest = featured ? upcoming.slice(1) : upcoming;
    const groups = useMemo(() => {
        const order = ['Happening now', 'Today', 'Tomorrow', 'This week', 'Later'];
        const map = new Map<string, EventCard[]>();
        rest.forEach((e) => map.set(bucket(e), [...(map.get(bucket(e)) ?? []), e]));

        return order.filter((k) => map.has(k)).map((k) => [k, map.get(k)!] as const);
    }, [rest]);

    return (
        <AppLayout
            title="Events"
            subtitle="Listening parties, contests and meetups. Say you are going and find the room when it starts."
            actions={canCreate && <button onClick={() => setCreating(true)} className={`${primaryBtn} flex items-center gap-2`}><Plus size={16} /> New event</button>}
        >
            <Head title="Events" />

            <Tabs active={tab} onChange={setTab} tabs={[{ key: 'upcoming', label: 'Upcoming', count: upcoming.length }, { key: 'past', label: 'Past', count: past.length }]} />

            {tab === 'upcoming' && (
                <>
                    {!featured ? (
                        <EmptyState icon="📅" title="No events planned right now" text="Create one or check back soon." action={canCreate ? <button onClick={() => setCreating(true)} className={primaryBtn}>Create the first one</button> : undefined} />
                    ) : (
                        <Featured e={featured} guest={guest} />
                    )}

                    {groups.map(([name, items]) => (
                        <section key={name}>
                            <SectionTitle title={name} />
                            <div className="space-y-3">{items.map((e) => <EventItem key={e.id} e={e} guest={guest} />)}</div>
                        </section>
                    ))}
                    {guest && upcoming.length > 0 && <p className="text-sm text-neutral-500"><Link href={route('login')} className="text-violet-400 hover:underline">Log in</Link> to say you are going.</p>}
                </>
            )}

            {tab === 'past' && (
                past.length === 0 ? <EmptyState icon="🕰️" title="No past events yet" /> : <div className="space-y-3">{past.map((e) => <EventItem key={e.id} e={e} past guest={guest} />)}</div>
            )}

            {creating && <NewEvent rooms={rooms} onClose={() => setCreating(false)} />}
        </AppLayout>
    );
}
