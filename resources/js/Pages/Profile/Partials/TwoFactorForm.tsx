import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { PageProps } from '@/types';
import { useForm, usePage, router } from '@inertiajs/react';
import QRCode from 'qrcode';
import { FormEventHandler, useEffect, useState } from 'react';

export interface TwoFactorState {
    enabled: boolean;
    pending: boolean;
    secret: string | null;
    otpauth: string | null;
}

export default function TwoFactorForm({ state, className = '' }: { state: TwoFactorState; className?: string }) {
    const recoveryCodes = usePage<PageProps>().props.recoveryCodes;
    const [qr, setQr] = useState('');

    const confirm = useForm({ code: '' });
    const disable = useForm({ password: '' });

    useEffect(() => {
        if (state.otpauth) QRCode.toDataURL(state.otpauth, { margin: 1, width: 192 }).then(setQr);
    }, [state.otpauth]);

    const submitConfirm: FormEventHandler = (e) => {
        e.preventDefault();
        confirm.post(route('two-factor.confirm'), { preserveScroll: true, onSuccess: () => confirm.reset() });
    };

    const submitDisable: FormEventHandler = (e) => {
        e.preventDefault();
        disable.delete(route('two-factor.destroy'), { preserveScroll: true, onSuccess: () => disable.reset() });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-bold text-neutral-100">Two-factor authentication</h2>
                <p className="mt-1 text-sm text-neutral-400">
                    Protect your account with a 6-digit code from an authenticator app (Google Authenticator, Authy, 1Password).
                </p>
            </header>

            <div className="mt-6 space-y-4">
                {recoveryCodes && (
                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
                        <p className="text-sm font-semibold text-amber-300">Save your recovery codes</p>
                        <p className="mt-1 text-xs text-neutral-400">Each code works once if you lose your phone. They are shown only now.</p>
                        <ul className="mt-3 grid grid-cols-2 gap-1 font-mono text-sm text-neutral-100">
                            {recoveryCodes.map((c) => <li key={c}>{c}</li>)}
                        </ul>
                    </div>
                )}

                {state.enabled && (
                    <form onSubmit={submitDisable} className="space-y-3">
                        <p className="text-sm text-green-400">Two-factor authentication is on.</p>
                        <TextInput type="password" value={disable.data.password} onChange={(e) => disable.setData('password', e.target.value)} placeholder="Current password" className="block w-full max-w-xs" />
                        <InputError message={disable.errors.password} />
                        <button disabled={disable.processing} className="rounded-md bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white hover:bg-red-500 disabled:opacity-50">
                            Turn off
                        </button>
                    </form>
                )}

                {state.pending && (
                    <form onSubmit={submitConfirm} className="space-y-3">
                        <p className="text-sm text-neutral-300">Scan this code with your app, then enter the 6-digit code it shows.</p>
                        {qr && <img src={qr} alt="2FA QR code" className="rounded bg-white p-1" width={192} height={192} />}
                        <p className="text-xs text-neutral-500">Or enter this key manually: <span className="font-mono text-neutral-300">{state.secret}</span></p>
                        <TextInput value={confirm.data.code} onChange={(e) => confirm.setData('code', e.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" className="block w-full max-w-xs" />
                        <InputError message={confirm.errors.code} />
                        <PrimaryButton disabled={confirm.processing}>Confirm</PrimaryButton>
                    </form>
                )}

                {!state.enabled && !state.pending && (
                    <PrimaryButton onClick={() => router.post(route('two-factor.enable'), {}, { preserveScroll: true })}>Set up</PrimaryButton>
                )}
            </div>
        </section>
    );
}
