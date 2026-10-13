import Checkbox from '@/Components/Checkbox';
import PrimaryButton from '@/Components/PrimaryButton';
import SavedAccounts from '@/Components/SavedAccounts';
import SocialIcon from '@/Components/SocialIcon';
import TextInput from '@/Components/TextInput';
import { Field } from '@/Components/ui';
import GuestLayout from '@/Layouts/GuestLayout';
import { canSaveAccounts, saveAccount } from '@/lib/savedAccounts';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, KeyRound, UserRound } from 'lucide-react';
import { FormEventHandler, KeyboardEvent, useState } from 'react';

export default function Login({ status, canResetPassword, discordLoginEnabled, discordError }: { status?: string; canResetPassword: boolean; discordLoginEnabled: boolean; discordError?: string }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const [save, setSave] = useState(false);
    const [caps, setCaps] = useState(false);
    const [shake, setShake] = useState(0);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const { email, password } = data;

        post(route('login'), {
            // only a successful login is worth remembering; the server tells us the account's names
            onSuccess: (page) => {
                const u = (page.props as unknown as PageProps).auth.user;
                if (save && u.id) saveAccount({ username: u.username, name: u.name, email, password });
            },
            onError: () => setShake((n) => n + 1),
            onFinish: () => reset('password'),
        });
    };

    const watchCaps = (e: KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState('CapsLock'));
    const wrong = errors.email || errors.password;

    return (
        <GuestLayout
            title="Welcome back"
            subtitle="Log in to jump into your rooms, your playlists and your friends."
            aside={<SavedAccounts onUse={(a) => setData((d) => ({ ...d, email: a.email, password: a.password }))} />}
        >
            <Head title="Log in" />

            {status && (
                <p className="mb-5 flex items-start gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300"><CheckCircle2 size={18} className="mt-0.5 shrink-0" /> {status}</p>
            )}
            {discordError && (
                <p className="mb-5 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"><AlertCircle size={18} className="mt-0.5 shrink-0" /> {discordError}</p>
            )}
            {wrong && (
                <p key={shake} className="mb-5 flex animate-shake items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"><AlertCircle size={18} className="mt-0.5 shrink-0" /> {wrong}</p>
            )}

            <form onSubmit={submit} className="space-y-5">
                <Field label="Email or username" htmlFor="email">
                    <div className="relative">
                        <UserRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <TextInput id="email" type="text" name="email" value={data.email} className="block w-full py-3 pl-10" autoComplete="username" isFocused onChange={(e) => setData('email', e.target.value)} placeholder="you@example.com or dj_kate" />
                    </div>
                </Field>

                <Field
                    label="Password"
                    htmlFor="password"
                    right={canResetPassword && <Link href={route('password.request')} className="text-sm text-violet-400 hover:underline">Forgot it?</Link>}
                >
                    <div className="relative">
                        <KeyRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <TextInput id="password" type="password" name="password" value={data.password} className="block w-full py-3 pl-10" autoComplete="current-password" onChange={(e) => setData('password', e.target.value)} onKeyUp={watchCaps} onKeyDown={watchCaps} placeholder="Your password" />
                    </div>
                    {caps && <p className="mt-1.5 text-xs text-amber-300">Caps Lock is on.</p>}
                </Field>

                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-neutral-400">
                        <Checkbox name="remember" checked={data.remember} onChange={(e) => setData('remember', (e.target.checked || false) as false)} /> Keep me logged in on this device
                    </label>
                    {canSaveAccounts && (
                        <label className="flex items-center gap-2 text-sm text-neutral-400">
                            <Checkbox checked={save} onChange={(e) => setSave(e.target.checked)} /> Save this account on this device
                        </label>
                    )}
                </div>

                <PrimaryButton className="w-full py-3 text-base" disabled={processing || !data.email || !data.password}>{processing ? 'Logging in…' : 'Log in'}</PrimaryButton>
            </form>

            {discordLoginEnabled && (
                <>
                    <div className="my-6 flex items-center gap-3 text-xs text-neutral-600"><span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" /></div>
                    <a href={route('discord.login')} className="mb-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#5865F2] px-4 py-3 text-sm font-semibold text-white hover:opacity-90">
                        <SocialIcon name="discord" size={18} /> Continue with Discord
                    </a>
                </>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
                <Link href={route('register')} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm font-semibold hover:bg-white/10">Create an account</Link>
                <Link href={route('dashboard')} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm font-semibold text-neutral-300 hover:bg-white/10">Continue as guest</Link>
            </div>
        </GuestLayout>
    );
}
