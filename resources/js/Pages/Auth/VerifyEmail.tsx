import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { MAIL_TEXT, mailState, TONE } from '@/lib/verification';
import { PageProps } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, MailCheck, MailWarning } from 'lucide-react';
import { FormEventHandler } from 'react';

/**
 * Right after signing up (and whenever somebody who has not confirmed yet opens the site while the site asks for it): send the message, send it again, or, when the site does not ask
 * for it (it cannot send email yet, or staff left it optional), carry on without it.
 */
export default function VerifyEmail({ status, mail, required }: { status?: string | null; mail?: string | null; required: boolean; configured: boolean }) {
    const { post, processing } = useForm({});
    const email = usePage<PageProps>().props.auth.user.email;
    const state = mailState(status) ?? mailState(mail);
    const note = state ? MAIL_TEXT[state] : null;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('verification.send'), { preserveScroll: true });
    };

    return (
        <GuestLayout title={required ? 'Check your email' : 'Confirm your email'} subtitle={required ? 'One last step: open the link we sent to confirm it is really yours.' : 'You are in. Confirming your email is how you get back in if you forget your password.'}>
            <Head title="Email Verification" />

            <div className="mb-6 flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-verify-card>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300"><MailCheck size={22} /></span>
                <div className="text-sm">
                    <p className="font-semibold">{state === 'sent' ? 'We sent a link to' : 'The link goes to'}</p>
                    <p className="break-all text-violet-300">{email}</p>
                    <p className="mt-2 text-neutral-400">{state === null ? 'Press the button and we email it. It works for an hour.' : 'It works for an hour, and only for this account.'}</p>
                </div>
            </div>

            {note && state && (
                <div className={`mb-5 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${TONE[note.tone]}`} data-mail-state={state}>
                    {note.tone === 'good' ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <MailWarning size={18} className="mt-0.5 shrink-0" />}
                    <p><span className="block font-semibold">{note.head}</span>{state === 'not-set-up' && required ? 'The owner has not set up a mail server.' : note.text}</p>
                </div>
            )}

            <form onSubmit={submit} className="space-y-3">
                {!required && (
                    <Link href={route('dashboard')} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 py-3 text-sm font-semibold text-white transition hover:opacity-90" data-continue>
                        Continue to SFD.DJ <ArrowRight size={16} />
                    </Link>
                )}
                {required ? (
                    <PrimaryButton className="w-full py-3" disabled={processing}>{processing ? 'Sending…' : state === 'sent' ? 'Send the email again' : 'Send the confirm email'}</PrimaryButton>
                ) : (
                    <button disabled={processing} className="w-full rounded-lg bg-white/10 py-3 text-sm font-semibold text-neutral-100 transition hover:bg-white/15 disabled:opacity-50">{processing ? 'Sending…' : state === 'sent' ? 'Send the email again' : 'Send me the confirm email'}</button>
                )}
                <p className="text-center text-sm text-neutral-400">
                    Wrong address? Change it under <Link href={route('profile.edit')} className="text-violet-400 hover:underline">Profile</Link>, or{' '}
                    <Link href={route('logout')} method="post" as="button" className="text-violet-400 hover:underline">log out</Link>.
                </p>
            </form>
        </GuestLayout>
    );
}
