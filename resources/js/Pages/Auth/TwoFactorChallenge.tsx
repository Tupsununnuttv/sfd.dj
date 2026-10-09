import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Field } from '@/Components/ui';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

export default function TwoFactorChallenge() {
    const [useRecovery, setUseRecovery] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({ code: '', recovery_code: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('two-factor.challenge'), { onFinish: () => reset() });
    };

    return (
        <GuestLayout
            title="Two-step check"
            subtitle={useRecovery ? 'Enter one of the recovery codes you saved when you turned this on.' : 'Open your authenticator app and type the 6-digit code.'}
        >
            <Head title="Two-factor authentication" />

            <div className="mb-6 flex justify-center"><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300"><ShieldCheck size={32} /></span></div>

            <form onSubmit={submit} className="space-y-5">
                <Field label={useRecovery ? 'Recovery code' : 'Code'} htmlFor="code" error={errors.code}>
                    {useRecovery ? (
                        <TextInput id="code" value={data.recovery_code} onChange={(e) => setData('recovery_code', e.target.value)} className="block w-full py-3 text-center font-mono text-lg tracking-widest" placeholder="xxxxx-xxxxx" autoFocus />
                    ) : (
                        <TextInput id="code" value={data.code} onChange={(e) => setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))} className="block w-full py-3 text-center font-mono text-2xl tracking-[0.5em]" inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" autoFocus />
                    )}
                </Field>

                <PrimaryButton className="w-full py-3 text-base" disabled={processing || !(useRecovery ? data.recovery_code : data.code)}>{processing ? 'Checking…' : 'Verify'}</PrimaryButton>
                <button type="button" onClick={() => { setUseRecovery(!useRecovery); reset(); }} className="block w-full text-center text-sm text-violet-400 hover:underline">
                    {useRecovery ? 'Use the app code instead' : 'Lost your phone? Use a recovery code'}
                </button>
            </form>
        </GuestLayout>
    );
}
