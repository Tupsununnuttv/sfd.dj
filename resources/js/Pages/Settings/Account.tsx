import SocialIcon from '@/Components/SocialIcon';
import { card, Field, ghostBtn, ProgressBar, SettingsSection, fieldClass } from '@/Components/ui';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { ago } from '@/lib/time';
import { PageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Circle, Download, Laptop, LogOut, Smartphone } from 'lucide-react';
import { FormEvent, useState } from 'react';
import DeleteUserForm from '../Profile/Partials/DeleteUserForm';
import TwoFactorForm, { TwoFactorState } from '../Profile/Partials/TwoFactorForm';
import UpdatePasswordForm from '../Profile/Partials/UpdatePasswordForm';

interface DiscordState {
    configured: boolean;
    username: string | null;
    notice: string | null;
    redirect: string | null;
}

interface Session {
    id: string;
    current: boolean;
    ip: string | null;
    last_active: string;
    browser: string;
    os: string;
    mobile: boolean;
}

function DiscordCard({ discord }: { discord: DiscordState }) {
    return (
        <div className="space-y-3">
            {discord.notice && <p className="rounded-lg bg-violet-500/10 px-3 py-2 text-sm text-violet-200">{discord.notice}</p>}

            {discord.username ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="flex items-center gap-2 text-sm"><SocialIcon name="discord" size={18} /> Linked as <span className="font-semibold text-indigo-300">{discord.username}</span></p>
                    <button onClick={() => confirm('Unlink your Discord account?') && router.delete(route('discord.disconnect'), { preserveScroll: true })} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20">Unlink</button>
                </div>
            ) : discord.configured ? (
                <a href={route('discord.connect')} target="_top" className="inline-flex items-center gap-2 rounded-lg bg-[#5865F2] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
                    <SocialIcon name="discord" /> Connect Discord
                </a>
            ) : (
                <div className="space-y-2">
                    <button disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-[#5865F2]/40 px-4 py-2.5 text-sm font-semibold text-white/70"><SocialIcon name="discord" /> Connect Discord</button>
                    <p className="text-xs text-neutral-500">Discord linking is not switched on for this site yet.</p>
                </div>
            )}

            {discord.redirect && !discord.configured && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                    Staff: create an application at discord.com/developers, add <code>{discord.redirect}</code> under OAuth2 → Redirects, and put its ids in .env as DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET.
                </p>
            )}
        </div>
    );
}

/** Every device you are logged in on. */
function Sessions({ sessions }: { sessions: { supported: boolean; list: Session[] } }) {
    const [asking, setAsking] = useState(false);
    const others = sessions.list.filter((s) => !s.current);
    const form = useForm({ password: '' });

    const logoutOthers = (e: FormEvent) => {
        e.preventDefault();
        form.delete(route('settings.sessions.revoke-others'), { preserveScroll: true, onSuccess: () => { form.reset(); setAsking(false); } });
    };

    if (!sessions.supported) return <p className="text-sm text-neutral-500">This site keeps its sessions somewhere that cannot be listed, so there is nothing to show here.</p>;

    return (
        <div className="space-y-4">
            <ul className="divide-y divide-white/5 rounded-xl border border-white/10 bg-black/20">
                {sessions.list.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 p-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-neutral-300">{s.mobile ? <Smartphone size={18} /> : <Laptop size={18} />}</span>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">{s.browser} on {s.os} {s.current && <span className="ml-1 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-300">THIS DEVICE</span>}</p>
                            <p className="text-xs text-neutral-500">{s.ip ?? 'unknown address'} · {s.current ? 'active now' : `last active ${ago(s.last_active)}`}</p>
                        </div>
                        {!s.current && <button onClick={() => router.delete(route('settings.sessions.revoke', s.id), { preserveScroll: true })} title="Log this device out" className="rounded-lg p-2 text-neutral-400 hover:bg-red-500/20 hover:text-red-300"><LogOut size={16} /></button>}
                    </li>
                ))}
            </ul>

            {others.length > 0 && !asking && <button onClick={() => setAsking(true)} className={ghostBtn}>Log out all other devices</button>}
            {asking && (
                <form onSubmit={logoutOthers} className="max-w-sm space-y-3">
                    <Field label="Type your password to confirm" htmlFor="sess-pass" error={form.errors.password}>
                        <input id="sess-pass" type="password" autoFocus value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} className={fieldClass} />
                    </Field>
                    <div className="flex gap-2">
                        <button disabled={form.processing || !form.data.password} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500 disabled:opacity-40">Log them out</button>
                        <button type="button" onClick={() => setAsking(false)} className={ghostBtn}>Cancel</button>
                    </div>
                </form>
            )}
            {others.length === 0 && <p className="text-sm text-neutral-500">You are logged in only here. Nothing to clean up.</p>}
        </div>
    );
}

export default function Account({ twoFactor, discord, sessions }: { twoFactor: TwoFactorState; discord: DiscordState; sessions: { supported: boolean; list: Session[] } }) {
    const { user } = usePage<PageProps>().props.auth;

    const checks: [boolean, string, string][] = [
        [user.email_verified_at !== null, 'Email verified', 'So you can get back in if you forget your password.'],
        [twoFactor.enabled, 'Two-factor login', 'A code from your phone, on top of the password.'],
        [sessions.list.filter((s) => !s.current).length === 0, 'No other devices logged in', 'Or log out the ones you do not recognise.'],
    ];
    const done = checks.filter(([ok]) => ok).length;

    return (
        <SettingsLayout title="Account & security" subtitle="Keep your account yours: password, two-factor login, devices and your data.">
            <Head title="Account" />

            <SettingsSection title="Security checkup" text={`${done} of ${checks.length} things look good.`}>
                <ProgressBar value={(done / checks.length) * 100} className="mb-4" />
                <ul className="space-y-3">
                    {checks.map(([ok, title, text]) => (
                        <li key={title} className="flex items-start gap-3">
                            {ok ? <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-green-400" /> : <Circle size={20} className="mt-0.5 shrink-0 text-neutral-600" />}
                            <span><span className="block text-sm font-semibold">{title}</span><span className="text-xs text-neutral-500">{text}</span></span>
                        </li>
                    ))}
                </ul>
            </SettingsSection>

            <div className={`${card} p-6`}><UpdatePasswordForm className="max-w-xl" /></div>
            <div className={`${card} p-6`}><TwoFactorForm state={twoFactor} className="max-w-xl" /></div>

            <SettingsSection title="Discord" text="Link your Discord account so people can tell it is really you. We only learn your Discord name, never your messages or servers.">
                <DiscordCard discord={discord} />
            </SettingsSection>

            <SettingsSection title="Where you are logged in" text="Every browser or device that has this account open. Log out the ones you do not recognise.">
                <Sessions sessions={sessions} />
            </SettingsSection>

            <SettingsSection title="Your data" text="Download everything we keep about you as one file: profile, settings, friends, playlists, rooms, whispers and violations. It never contains your password, two-factor secret or API tokens.">
                <a href={route('settings.export')} className={`${ghostBtn} inline-flex items-center gap-2`}><Download size={16} /> Download my data</a>
                <p className="mt-3 text-xs text-neutral-500">You can do this a few times an hour. <Link href={route('site.legal', 'privacy')} className="text-violet-400 hover:underline">Read the privacy policy</Link>.</p>
            </SettingsSection>

            <div className={`${card} border-red-500/30 p-6`}><DeleteUserForm className="max-w-xl" /></div>
        </SettingsLayout>
    );
}
