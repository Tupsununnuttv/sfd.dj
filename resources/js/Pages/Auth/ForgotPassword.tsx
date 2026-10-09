import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Field } from '@/Components/ui';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { CheckCircle2, Mail } from 'lucide-react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status, devLink }: { status?: string; devLink?: string | null }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout title="Forgot your password?" subtitle="No problem. Tell us your email or username and we will send a link to choose a new one.">
            <Head title="Forgot Password" />

            {status && (
                <p className="mb-5 flex items-start gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                    <span>{status} If it does not show up within a minute, look in your Spam or Junk folder.</span>
                </p>
            )}

            {devLink && (
                <div className="mb-5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
                    <p className="font-semibold">Developer mode: no email was sent</p>
                    <p className="mt-1 text-xs">Mail is not set up yet (MAIL_MAILER=log), so here is your reset link. It only shows on your own computer.</p>
                    <a href={devLink} className="mt-3 inline-block rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-400">Choose a new password</a>
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <Field label="Email or username" htmlFor="email" error={errors.email}>
                    <div className="relative">
                        <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <TextInput id="email" type="text" name="email" value={data.email} className="block w-full py-3 pl-10" isFocused onChange={(e) => setData('email', e.target.value)} placeholder="you@example.com or dj_kate" />
                    </div>
                </Field>

                <PrimaryButton className="w-full py-3 text-base" disabled={processing || !data.email}>{processing ? 'Sending…' : 'Email me a reset link'}</PrimaryButton>
            </form>

            <p className="mt-6 text-center text-sm text-neutral-400">Remembered it? <Link href={route('login')} className="font-semibold text-violet-400 hover:underline">Back to log in</Link></p>
        </GuestLayout>
    );
}
