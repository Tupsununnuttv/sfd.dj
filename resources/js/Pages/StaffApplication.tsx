import { Field, fieldClass, primaryBtn } from '@/Components/ui';
import SiteLayout, { PageHeader } from '@/Layouts/SiteLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Props {
    discord: { username: string | null; connected: boolean };
    configured: boolean;
    questions: { motivation: string; experience: string; availability: string };
    requirements: string[];
    notice?: string;
    error?: string;
}

export default function StaffApplication({ discord, configured, questions, requirements, notice, error }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({ motivation: '', experience: '', availability: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(route('staff-application.store'), { onSuccess: () => reset() });
    };

    return (
        <SiteLayout>
            <Head title="Staff application" />
            <PageHeader crumbs={[["Community"], ["Staff application"]]} title="Staff application" text="Tell us how you would help keep SFD.DJ welcoming and running smoothly." />
            <section className="mx-auto max-w-3xl space-y-6 px-6 pb-16">
                {notice && <p role="status" className="border-l-2 border-green-400 pl-4 text-sm text-green-200">{notice}</p>}
                {error && <p role="alert" className="border-l-2 border-red-400 pl-4 text-sm text-red-200">{error}</p>}
                {requirements.length > 0 && (
                    <section className="border-y border-white/10 py-5">
                        <h2 className="text-sm font-semibold text-white">Requirements</h2>
                        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-400">
                            {requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}
                        </ul>
                    </section>
                )}

                {!discord.connected ? (
                    <p className="text-sm text-neutral-300">
                        Connect Discord before applying. <Link href={route('settings.connections')} className="text-violet-300 underline">Open Connections</Link>
                    </p>
                ) : !configured ? (
                    <p className="text-sm text-neutral-400">Staff applications are not available right now. Please try again later.</p>
                ) : (
                    <>
                        <p className="text-sm text-neutral-400">Applying as {discord.username || 'your connected Discord account'}. Staff review applications in the private SFD.DJ Discord channel.</p>
                        <form onSubmit={submit} className="space-y-5">
                            <Field label={questions.motivation} htmlFor="motivation" error={errors.motivation}>
                                <textarea id="motivation" value={data.motivation} onChange={(event) => setData('motivation', event.target.value)} maxLength={900} required rows={4} className={fieldClass} />
                            </Field>
                            <Field label={questions.experience} htmlFor="experience" error={errors.experience}>
                                <textarea id="experience" value={data.experience} onChange={(event) => setData('experience', event.target.value)} maxLength={900} required rows={4} className={fieldClass} />
                            </Field>
                            <Field label={questions.availability} htmlFor="availability" error={errors.availability}>
                                <textarea id="availability" value={data.availability} onChange={(event) => setData('availability', event.target.value)} maxLength={900} required rows={3} className={fieldClass} />
                            </Field>
                            <button type="submit" disabled={processing} className={primaryBtn}>{processing ? 'Sending…' : 'Send application'}</button>
                        </form>
                    </>
                )}
            </section>
        </SiteLayout>
    );
}
