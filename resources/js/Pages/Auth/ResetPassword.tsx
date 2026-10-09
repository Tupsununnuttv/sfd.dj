import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Field } from '@/Components/ui';
import GuestLayout from '@/Layouts/GuestLayout';
import { checkPassword } from '@/lib/password';
import { Head, useForm } from '@inertiajs/react';
import { Check, KeyRound, Mail } from 'lucide-react';
import { FormEventHandler } from 'react';

const bar = ['bg-neutral-700', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-green-500'];

export default function ResetPassword({ token, email }: { token: string; email: string }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const pw = checkPassword(data.password);
    const match = data.password_confirmation.length > 0 && data.password === data.password_confirmation;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    const icon = 'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500';

    return (
        <GuestLayout title="Choose a new password" subtitle="Pick something you have not used anywhere else.">
            <Head title="Reset Password" />

            <form onSubmit={submit} className="space-y-5">
                <Field label="Email" htmlFor="email" error={errors.email}>
                    <div className="relative">
                        <Mail size={17} className={icon} />
                        <TextInput id="email" type="email" name="email" value={data.email} className="block w-full py-3 pl-10 opacity-70" autoComplete="username" readOnly />
                    </div>
                </Field>

                <Field label="New password" htmlFor="password" error={errors.password}>
                    <div className="relative">
                        <KeyRound size={17} className={icon} />
                        <TextInput id="password" type="password" name="password" value={data.password} className="block w-full py-3 pl-10" autoComplete="new-password" isFocused onChange={(e) => setData('password', e.target.value)} placeholder="At least 8 characters" />
                    </div>
                    {data.password.length > 0 && (
                        <div className="mt-2.5">
                            <div className="flex gap-1.5">{[1, 2, 3, 4].map((n) => <span key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${pw.score >= n ? bar[pw.score] : 'bg-neutral-800'}`} />)}</div>
                            <p className="mt-1.5 text-xs font-semibold text-neutral-300">{pw.label}</p>
                        </div>
                    )}
                </Field>

                <Field label="Confirm new password" htmlFor="password_confirmation" error={errors.password_confirmation} right={data.password_confirmation && (match ? <span className="flex items-center gap-1 text-xs text-green-400"><Check size={12} /> Matches</span> : <span className="text-xs text-red-400">Does not match yet</span>)}>
                    <div className="relative">
                        <KeyRound size={17} className={icon} />
                        <TextInput id="password_confirmation" type="password" name="password_confirmation" value={data.password_confirmation} className="block w-full py-3 pl-10" autoComplete="new-password" onChange={(e) => setData('password_confirmation', e.target.value)} placeholder="Type it once more" />
                    </div>
                </Field>

                <PrimaryButton className="w-full py-3 text-base" disabled={processing || !pw.checks[0].ok || !match}>{processing ? 'Saving…' : 'Save new password'}</PrimaryButton>
            </form>
        </GuestLayout>
    );
}
