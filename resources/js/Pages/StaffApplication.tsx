import { ProgressBar } from '@/Components/ui';
import { formatDateTime } from '@/lib/regional';
import SiteLayout, { PageHeader } from '@/Layouts/SiteLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';

interface Field {
    key: string;
    section: string;
    type: 'text' | 'select' | 'textarea' | 'radio';
    label: string;
    required: boolean;
    options?: string[];
    other?: boolean; // besides the options the person may write their own answer
    min?: number;
    max?: number;
}

interface Application {
    status: 'pending' | 'under_review' | 'accepted' | 'rejected';
    status_label: string;
    position: string;
    submitted_at: string;
    decided_at: string | null;
    messages: { id: number; from_staff: boolean; who: string; body: string; at: string }[];
}

interface Props {
    sections: Record<string, string>;
    fields: Field[];
    application: Application | null;
    discord: { username: string | null; connected: boolean };
    links: { label: string; url: string }[]; // the Discord channels to read first
    notice?: string;
}

// the form on black: dark grey fields, a violet ring on focus, a red border on a missing answer
const input = (bad: boolean) => `w-full rounded-lg border bg-[#111111] px-3 py-2.5 text-sm text-white placeholder-neutral-600 transition focus:ring-2 focus:ring-violet-500/40 ${bad ? 'border-red-500 focus:border-red-500' : 'border-white/10 hover:border-white/25 focus:border-violet-500'}`;
const OTHER = '__other__'; // what the select holds while the person writes their own answer
const statusTone = { pending: 'text-sky-300 border-sky-400/40 bg-sky-400/10', under_review: 'text-amber-300 border-amber-400/40 bg-amber-400/10', accepted: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10', rejected: 'text-red-300 border-red-400/40 bg-red-400/10' };

/** What is wrong with an answer, or null. The server checks the same again. */
const problem = (field: Field, value: string): string | null => {
    const text = value.trim();
    if (!text) return field.required ? (field.other ? 'Please choose an option or write your own answer.' : field.type === 'select' || field.type === 'radio' ? 'Please choose one of the options.' : 'Please answer this question.') : null;
    if (field.min && text.length < field.min) return `Please write at least ${field.min} characters.`;
    return null;
};

function StatusCard({ application, notice }: { application: Application; notice?: string }) {
    const when = (iso: string) => formatDateTime(iso, { dateStyle: 'long', timeStyle: 'short' });
    const Icon = application.status === 'accepted' ? CheckCircle2 : application.status === 'rejected' ? XCircle : Clock;
    const text = {
        pending: 'Staff will read it soon. You do not need to do anything else.',
        under_review: 'Staff are reading your application right now.',
        accepted: 'Welcome to the team! Staff will contact you with the next steps.',
        rejected: 'Thank you for applying. This time the answer is no, but you can apply again.',
    }[application.status];

    return (
        <section aria-live="polite" className={`rounded-2xl border p-6 ${statusTone[application.status]}`}>
            <div className="flex items-start gap-4">
                <Icon size={32} className="mt-0.5 shrink-0" aria-hidden />
                <div>
                    <h2 className="text-lg font-bold text-white">{notice ? 'Application sent' : 'Your application'}: {application.status_label}</h2>
                    <p className="mt-1 text-sm text-neutral-300">{notice ?? text}</p>
                    {notice && <p className="mt-1 text-sm text-neutral-300">{text}</p>}
                    <p className="mt-3 text-xs text-neutral-400">{application.position} · {`Submitted on ${when(application.submitted_at)}`}{application.decided_at && <> · {`Decided on ${when(application.decided_at)}`}</>}</p>
                </div>
            </div>
        </section>
    );
}

/** The replies between the staff and the applicant, and a box to answer them. */
function Replies({ application }: { application: Application }) {
    const { data, setData, post, processing, errors, reset } = useForm({ body: '' });
    const when = (iso: string) => formatDateTime(iso, { dateStyle: 'medium', timeStyle: 'short' });
    const send = (event: FormEvent) => {
        event.preventDefault();
        if (!data.body.trim()) return;
        post(route('staff-application.reply'), { preserveScroll: true, onSuccess: () => reset() });
    };

    return (
        <section className="rounded-2xl border border-white/10 bg-black p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-white">Replies</h2>
            {application.messages.length === 0
                ? <p className="mt-1 text-sm text-neutral-400">When staff reply to your application, you see it here. You can also write to them.</p>
                : (
                    <ul className="mt-3 space-y-2">
                        {application.messages.map((m) => (
                            <li key={m.id} className={`rounded-lg px-3 py-2 text-sm ${m.from_staff ? 'mr-8 bg-violet-500/10' : 'ml-8 bg-white/5'}`}>
                                <p className="text-[11px] text-neutral-500">{m.from_staff ? `${m.who} · SFD-DJ.EU staff` : 'You'} · {when(m.at)}</p>
                                <p className="whitespace-pre-wrap wrap-break-word text-neutral-100">{m.body}</p>
                            </li>
                        ))}
                    </ul>
                )}
            <form onSubmit={send} className="mt-3">
                <label htmlFor="reply" className="sr-only">Write to the staff</label>
                <textarea id="reply" value={data.body} onChange={(e) => setData('body', e.target.value)} maxLength={2000} rows={3} placeholder="Write to the staff" aria-invalid={Boolean(errors.body)} aria-describedby={errors.body ? 'reply-error' : undefined} className={`${input(Boolean(errors.body))} resize-y`} />
                {errors.body && <p id="reply-error" role="alert" className="mt-1.5 text-sm text-red-400">{errors.body}</p>}
                <button type="submit" disabled={processing || !data.body.trim()} className="mt-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50">{processing ? 'Sending…' : 'Send reply'}</button>
            </form>
        </section>
    );
}

export default function StaffApplication({ sections, fields, application, discord, links, notice }: Props) {
    const { data, setData, post, processing, errors, setError, clearErrors, reset } = useForm<Record<string, string>>(
        Object.fromEntries(fields.map((f) => [f.key, f.key === 'discord_username' ? discord.username ?? '' : ''])),
    );
    const [failure, setFailure] = useState('');
    const [writing, setWriting] = useState<Record<string, boolean>>({}); // the questions where the person chose Other and writes their own answer
    const sending = useRef(false);
    const required = fields.filter((f) => f.required);
    const answered = required.filter((f) => !problem(f, data[f.key] ?? '')).length;
    const open = !application || application.status === 'rejected'; // one application waits at a time; after a No the form comes back

    /** Show the first question that needs attention: scroll to it and put the cursor there. */
    const showFirst = (keys: string[]) => {
        const first = fields.find((f) => keys.includes(f.key));
        const target = first && document.getElementById(`field-${first.key}`);
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(() => (target.querySelector<HTMLElement>('[aria-invalid="true"]') ?? target.querySelector<HTMLElement>('input, select, textarea'))?.focus({ preventScroll: true }), 250);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (sending.current) return; // a second click while the first is on its way
        const missing = Object.fromEntries(fields.flatMap((f) => { const p = problem(f, data[f.key] ?? ''); return p ? [[f.key, p]] : []; }));
        if (Object.keys(missing).length) {
            setError(missing);
            setFailure('');
            showFirst(Object.keys(missing));
            return;
        }

        clearErrors();
        setFailure('');
        sending.current = true;
        post(route('staff-application.store'), {
            preserveScroll: false,
            onSuccess: () => { reset(); setWriting({}); },
            // the answers stay in the form whatever goes wrong
            onError: (errs) => showFirst(Object.keys(errs)),
            onHttpException: () => { setFailure('The website had a problem and your application was not sent. Your answers are still here: please try again in a minute.'); return false; },
            onNetworkError: () => { setFailure('The connection was lost and your application was not sent. Your answers are still here: please try again when you are online.'); return false; },
            onFinish: () => { sending.current = false; },
        });
    };

    /** An edited answer is no longer marked as wrong. */
    const change = (key: string, value: string) => {
        setData(key, value);
        if (errors[key]) clearErrors(key);
    };

    const describedBy = (field: Field) => (errors[field.key] ? `error-${field.key}` : undefined);

    const control = (field: Field) => {
        const bad = Boolean(errors[field.key]);
        const common = { id: field.key, name: field.key, 'aria-invalid': bad, 'aria-describedby': describedBy(field), required: field.required };
        const value = data[field.key] ?? '';

        if (field.type === 'select') {
            const own = Boolean(field.other && writing[field.key]); // Other is chosen: a box for the person's own words opens under the select
            const choose = (choice: string) => {
                setWriting((w) => ({ ...w, [field.key]: choice === OTHER }));
                change(field.key, choice === OTHER ? '' : choice);
            };

            return (
                <>
                    <select {...common} aria-invalid={bad && !own} required={field.required && !own} value={own ? OTHER : value} onChange={(e) => choose(e.target.value)} className={input(bad && !own)}>
                        <option value="">Choose one…</option>
                        {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                        {field.other && <option value={OTHER}>Other (write your own)</option>}
                    </select>
                    {own && (
                        <input id={`${field.key}-own`} name={`${field.key}_own`} type="text" value={value} onChange={(e) => change(field.key, e.target.value)} maxLength={field.max} autoComplete="off" autoFocus required aria-label="Write your answer" aria-invalid={bad} aria-describedby={describedBy(field)} placeholder="Write your answer" className={`mt-2 ${input(bad)}`} />
                    )}
                </>
            );
        }
        if (field.type === 'textarea') {
            return (
                <>
                    <textarea {...common} value={value} onChange={(e) => change(field.key, e.target.value)} maxLength={field.max} rows={4} className={`${input(bad)} resize-y`} />
                    <p className="mt-1 text-right text-[11px] tabular-nums text-neutral-600">{value.length} / {field.max}</p>
                </>
            );
        }
        if (field.type === 'radio') {
            return (
                <div role="radiogroup" aria-labelledby={`label-${field.key}`} aria-describedby={describedBy(field)} className="flex gap-3">
                    {field.options?.map((o) => (
                        <label key={o} className="cursor-pointer">
                            <input type="radio" name={field.key} value={o} checked={value === o} onChange={() => change(field.key, o)} required={field.required} className="peer sr-only" />
                            <span className={`block min-w-24 rounded-lg border bg-[#111111] px-5 py-2.5 text-center text-sm transition hover:border-white/30 peer-checked:border-transparent peer-checked:bg-linear-to-r peer-checked:from-fuchsia-500 peer-checked:to-violet-500 peer-checked:font-semibold peer-focus-visible:ring-2 peer-focus-visible:ring-violet-400 ${bad ? 'border-red-500' : 'border-white/10'}`}>{o}</span>
                        </label>
                    ))}
                </div>
            );
        }
        return <input {...common} type="text" value={value} onChange={(e) => change(field.key, e.target.value)} maxLength={field.max} autoComplete="off" className={input(bad)} />;
    };

    return (
        <SiteLayout>
            <Head title="Staff application" />
            <PageHeader crumbs={[["Community"], ["Staff application"]]} title="Staff application" text="Tell us how you would help keep SFD-DJ.EU welcoming and running smoothly." />
            <section className="mx-auto max-w-3xl space-y-6 px-6 pb-16">
                {application && <StatusCard application={application} notice={notice} />}
                {application && <Replies application={application} />}
                {errors.application && <p role="alert" className="border-l-2 border-red-400 pl-4 text-sm text-red-200">{errors.application}</p>}

                {links.length > 0 && (
                    <section className="border-y border-white/10 py-5">
                        <h2 className="text-sm font-semibold text-white">Requirements</h2>
                        <p className="mt-1 text-sm text-neutral-400">Read these Discord channels before you apply:</p>
                        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-400">
                            {links.map((link) => (
                                <li key={link.url}>
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sky-400 hover:text-sky-300 hover:underline">{link.label}</a>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <p className="text-sm text-neutral-400">
                    {discord.connected
                        ? `You are applying as ${discord.username || 'your connected Discord account'}. Staff review applications on the website and in the private SFD-DJ.EU Discord channel, and can give you the staff role there when you are accepted.`
                        : <>You apply with your SFD-DJ.EU account: you do not need to connect Discord. Staff review applications on the website and in the private SFD-DJ.EU Discord channel. If you <Link href={route('settings.connections')} className="text-violet-300 underline">connect Discord</Link>, the team can also give you the staff role there when you are accepted. You can also apply in the Discord server with /apply.</>}
                </p>

                {open && (
                    <form onSubmit={submit} noValidate className="space-y-8 overflow-clip rounded-2xl border border-white/10 bg-black p-5 sm:p-8">
                        <div className="sticky top-[4.25rem] z-20 -mx-5 -mt-5 border-b border-white/10 bg-black/90 px-5 py-3 backdrop-blur sm:-mx-8 sm:-mt-8 sm:px-8">
                            <div className="mb-1.5 flex items-center justify-between text-xs text-neutral-400">
                                <span>Required questions answered</span>
                                <span className="font-semibold tabular-nums text-white">{answered} / {required.length}</span>
                            </div>
                            <div role="progressbar" aria-label="Required questions answered" aria-valuemin={0} aria-valuemax={required.length} aria-valuenow={answered}>
                                <ProgressBar value={(answered / required.length) * 100} />
                            </div>
                        </div>

                        {Object.entries(sections).map(([key, title], index) => (
                            <fieldset key={key} className="space-y-6">
                                <legend className="mb-1 w-full border-b border-white/10 pb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                                    <span className="mr-2 text-violet-400">{index + 1}.</span>{title}
                                </legend>
                                {fields.filter((f) => f.section === key).map((field) => (
                                    <div key={field.key} id={`field-${field.key}`} className="scroll-mt-40">
                                        <label id={`label-${field.key}`} htmlFor={field.type === 'radio' ? undefined : field.key} className="mb-2 block text-sm font-medium text-neutral-200">
                                            <span className="mr-1.5 text-neutral-500">{fields.indexOf(field) + 1}.</span>
                                            {field.label}
                                            {field.required ? <><span className="ml-1 text-red-500" aria-hidden>*</span><span className="sr-only"> (required)</span></> : <span className="ml-2 text-xs font-normal text-neutral-500">optional</span>}
                                        </label>
                                        {control(field)}
                                        {errors[field.key] && <p id={`error-${field.key}`} role="alert" className="mt-1.5 text-sm text-red-400">{errors[field.key]}</p>}
                                    </div>
                                ))}
                            </fieldset>
                        ))}

                        {failure && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{failure}</p>}
                        {Object.keys(errors).length > 0 && !failure && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">Some answers need your attention. They are marked in red above.</p>}

                        <button type="submit" disabled={processing} aria-busy={processing} className="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:opacity-60 sm:w-auto">
                            {processing && <Loader2 size={16} className="animate-spin" aria-hidden />}
                            {processing ? 'Sending…' : 'Send Application'}
                        </button>
                    </form>
                )}
            </section>
        </SiteLayout>
    );
}
