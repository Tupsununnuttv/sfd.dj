import Avatar from '@/Components/Avatar';
import Checkbox from '@/Components/Checkbox';
import PrimaryButton from '@/Components/PrimaryButton';
import SavedAccounts from '@/Components/SavedAccounts';
import TextInput from '@/Components/TextInput';
import { Field } from '@/Components/ui';
import GuestLayout from '@/Layouts/GuestLayout';
import { characterUrl, DEFAULT_CHARACTER } from '@/lib/characters';
import { AwardBadge } from '@/lib/cosmetics';
import { checkPassword } from '@/lib/password';
import { useUsernameCheck } from '@/lib/useUsernameCheck';
import { canSaveAccounts, saveAccount } from '@/lib/savedAccounts';
import { Head, Link, useForm } from '@inertiajs/react';
import { AtSign, Check, KeyRound, Loader2, Mail, UserRound, X } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const bar = ['bg-neutral-700', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-green-500'];

export default function Register({ inviter }: { inviter: { name: string; avatar: string | null } | null }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        terms: false as boolean,
    });

    const [save, setSave] = useState(false);
    const free = useUsernameCheck(data.username);

    const pw = checkPassword(data.password);
    const match = data.password_confirmation.length > 0 && data.password === data.password_confirmation;
    const ready = free.state !== 'taken' && data.username.trim().length >= 3 && !!data.email && pw.checks[0].ok && match && data.terms;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const mine = { username: data.username, name: data.name || data.username, email: data.email, password: data.password };

        post(route('register'), {
            onSuccess: () => {
                if (save) saveAccount(mine);
            },
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const icon = 'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500';
    const shownName = data.name.trim() || data.username;
    const step = (n: number, text: string) => (
        <p className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 ${n > 1 ? 'pt-2' : ''}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] text-neutral-200">{n}</span> {text}
        </p>
    );

    return (
        <GuestLayout
            switcher="register"
            title="Create your account"
            subtitle="Free, and it takes a minute. Then pick a room and press play."
            aside={<SavedAccounts onUse={(a) => setData((d) => ({ ...d, username: a.username, name: a.name, email: a.email }))} />}
        >
            <Head title="Register" />

            {inviter && (
                <p className="mb-5 flex items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
                    <Avatar name={inviter.name} avatar={inviter.avatar} className="h-9 w-9" />
                    <span><b>{inviter.name}</b> invited you to SFD-DJ.EU. Welcome!</span>
                </p>
            )}

            {/* what the room will show: everybody starts as a character, with the Beta Tester badge, at level 1 */}
            <div className="mb-6 flex items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-linear-to-r from-violet-600/20 via-fuchsia-600/5 to-transparent px-4 py-3" data-register-preview>
                <img src={characterUrl(DEFAULT_CHARACTER, 'dancing')} alt="" width={58} height={80} className="-my-1 shrink-0 drop-shadow-[0_8px_10px_rgba(0,0,0,0.5)]" />
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-violet-300">You in the room</p>
                    <p className={`truncate text-lg font-bold ${shownName ? '' : 'text-neutral-500'}`}>{shownName || 'Your name'}</p>
                    <p className="flex min-w-0 items-center gap-2 text-xs text-neutral-400">
                        <span className="truncate">@{data.username || 'username'}</span>
                        <span className="flex shrink-0 items-center gap-1 font-bold text-teal-400"><AwardBadge name="beta" className="h-4 w-4" /> Beta Tester</span>
                        <span className="shrink-0">Level 1</span>
                    </p>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-5">
                {step(1, 'How people see you')}
                <Field
                    label="Username"
                    htmlFor="username"
                    error={errors.username}
                    hint="3 to 20 letters, numbers or underscores. Your unique handle: friends add you with it, and you can log in with it."
                    right={
                        free.state === 'checking' ? <span className="flex items-center gap-1 text-xs text-neutral-500"><Loader2 size={12} className="animate-spin" /> checking</span>
                        : free.state === 'ok' ? <span className="flex items-center gap-1 text-xs text-green-400"><Check size={12} /> {free.message}</span>
                        : free.state === 'taken' ? <span className="flex items-center gap-1 text-xs text-red-400"><X size={12} /> {free.message}</span> : null
                    }
                >
                    <div className="relative">
                        <AtSign size={17} className={icon} />
                        <TextInput id="username" name="username" value={data.username} className="block w-full py-3 pl-10" autoComplete="username" isFocused onChange={(e) => setData('username', e.target.value.replace(/\s/g, ''))} required maxLength={20} placeholder="dj_kate" />
                    </div>
                </Field>

                <Field label="Display name (optional)" htmlFor="name" error={errors.name} hint="The name people see in rooms. Leave it empty to use your username.">
                    <div className="relative">
                        <UserRound size={17} className={icon} />
                        <TextInput id="name" name="name" value={data.name} className="block w-full py-3 pl-10" autoComplete="nickname" onChange={(e) => setData('name', e.target.value)} maxLength={30} placeholder="Kate" />
                    </div>
                </Field>

                {step(2, 'How you log in')}
                <Field label="Email" htmlFor="email" error={errors.email} hint="We send one message to check it is yours. We never show it to anyone.">
                    <div className="relative">
                        <Mail size={17} className={icon} />
                        <TextInput id="email" type="email" name="email" value={data.email} className="block w-full py-3 pl-10" autoComplete="email" onChange={(e) => setData('email', e.target.value)} required placeholder="you@example.com" />
                    </div>
                </Field>

                <Field label="Password" htmlFor="password" error={errors.password}>
                    <div className="relative">
                        <KeyRound size={17} className={icon} />
                        <TextInput id="password" type="password" name="password" value={data.password} className="block w-full py-3 pl-10" autoComplete="new-password" onChange={(e) => setData('password', e.target.value)} required placeholder="At least 8 characters" />
                    </div>
                    {data.password.length > 0 && (
                        <div className="mt-2.5">
                            <div className="flex gap-1.5">{[1, 2, 3, 4].map((n) => <span key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${pw.score >= n ? bar[pw.score] : 'bg-neutral-800'}`} />)}</div>
                            <p className="mt-1.5 text-xs font-semibold text-neutral-300">{pw.label}</p>
                            <ul className="mt-1 grid gap-x-4 gap-y-0.5 text-xs sm:grid-cols-2">
                                {pw.checks.map((c) => (
                                    <li key={c.label} className={`flex items-center gap-1.5 ${c.ok ? 'text-green-400' : 'text-neutral-500'}`}>{c.ok ? <Check size={12} /> : <span className="h-3 w-3 text-center leading-3">·</span>} {c.label}{c.required && !c.ok ? ' (needed)' : ''}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </Field>

                <Field
                    label="Confirm password"
                    htmlFor="password_confirmation"
                    error={errors.password_confirmation}
                    right={data.password_confirmation && (match ? <span className="flex items-center gap-1 text-xs text-green-400"><Check size={12} /> Matches</span> : <span className="text-xs text-red-400">Does not match yet</span>)}
                >
                    <div className="relative">
                        <KeyRound size={17} className={icon} />
                        <TextInput id="password_confirmation" type="password" name="password_confirmation" value={data.password_confirmation} className="block w-full py-3 pl-10" autoComplete="new-password" onChange={(e) => setData('password_confirmation', e.target.value)} required placeholder="Type it once more" />
                    </div>
                </Field>

                {step(3, 'Almost done')}
                <div className="space-y-2.5">
                    <label className="flex items-start gap-2.5 text-sm text-neutral-300">
                        <Checkbox className="mt-0.5" checked={data.terms} onChange={(e) => setData('terms', e.target.checked)} />
                        <span>
                            I accept the <Link href={route('site.legal', 'terms')} target="_blank" className="text-violet-400 hover:underline">terms</Link>, the <Link href={route('site.legal', 'rules')} target="_blank" className="text-violet-400 hover:underline">community rules</Link> and the <Link href={route('site.legal', 'privacy')} target="_blank" className="text-violet-400 hover:underline">privacy policy</Link>.
                        </span>
                    </label>
                    {errors.terms && <p className="text-sm text-red-400">{errors.terms}</p>}
                    {canSaveAccounts && (
                        <label className="flex items-center gap-2.5 text-sm text-neutral-400">
                            <Checkbox checked={save} onChange={(e) => setSave(e.target.checked)} /> Save this account on this device
                        </label>
                    )}
                </div>

                <PrimaryButton className="w-full py-3 text-base" disabled={processing || !ready}>{processing ? 'Creating your account…' : 'Create account'}</PrimaryButton>
                {!ready && !processing && data.username && <p className="text-center text-xs text-neutral-500">Fill in every box, match the passwords and accept the terms to continue.</p>}
                <p className="text-center text-xs text-neutral-500">We email you a link to confirm your address.</p>
            </form>

            <p className="mt-6 text-center text-sm text-neutral-400">
                Already have an account? <Link href={route('login')} className="font-semibold text-violet-400 hover:underline">Log in</Link>
                <span className="mx-2 text-neutral-700">·</span>
                <Link href={route('dashboard')} className="hover:text-white">Continue as guest</Link>
            </p>
        </GuestLayout>
    );
}
