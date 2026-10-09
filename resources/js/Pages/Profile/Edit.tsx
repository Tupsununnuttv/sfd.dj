import Avatar from '@/Components/Avatar';
import AvatarUpload from '@/Components/AvatarUpload';
import Badges from '@/Components/Badges';
import Flag from '@/Components/Flag';
import PrimaryButton from '@/Components/PrimaryButton';
import RoleBadge from '@/Components/RoleBadge';
import StatusDot from '@/Components/StatusDot';
import TextInput from '@/Components/TextInput';
import { Card, Field, SettingsSection, fieldClass } from '@/Components/ui';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { STATUS, STATUSES, statusOf } from '@/lib/status';
import { MAIL_TEXT, mailState } from '@/lib/verification';
import { useUsernameCheck } from '@/lib/useUsernameCheck';
import { PageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Check, ExternalLink, Loader2, MailWarning, X } from 'lucide-react';
import { FormEvent } from 'react';

const PRONOUNS = ['she/her', 'he/him', 'they/them', 'she/they', 'he/they', 'any pronouns', 'ask me'];

export default function Edit({ mustVerifyEmail, status, genres, countries }: PageProps<{ mustVerifyEmail: boolean; status?: string; genres: string[]; countries: Record<string, string> }>) {
    const { user } = usePage<PageProps>().props.auth;
    const { data, setData, patch, errors, processing, recentlySuccessful, isDirty } = useForm({
        username: user.username,
        name: user.name,
        bio: user.bio ?? '',
        favorite_genre: user.favorite_genre ?? '',
        country: user.flag?.code ?? '',
        pronouns: user.pronouns ?? '',
        email: user.email,
    });
    const flag = data.country && countries[data.country] ? { code: data.country, name: countries[data.country] } : null;
    const myStatus = statusOf(user.status);
    const setStatus = (s: string) => router.patch(route('profile.status'), { status: s }, { preserveScroll: true, only: ['auth'] });
    const free = useUsernameCheck(data.username, user.username);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        patch(route('profile.update'), { preserveScroll: true });
    };

    const unverified = mustVerifyEmail && user.email_verified_at === null;
    const mail = mailState(status);
    const emailChanged = data.email.trim().toLowerCase() !== user.email.toLowerCase();

    return (
        <SettingsLayout title="Profile" subtitle="How you look to everybody else. The card on the right updates as you type.">
            <Head title="Profile" />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_20rem]">
                <div className="min-w-0 space-y-6">
                    <SettingsSection title="Picture" text="Upload a photo, or pick an animated avatar or a character, and a frame, in the Avatar shop.">
                        <AvatarUpload />
                    </SettingsSection>

                    <SettingsSection title="Status" text="Shows as a dot next to your picture: in the menu, in the rooms and on your profile.">
                        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Status">
                            {STATUSES.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    role="radio"
                                    aria-checked={myStatus === s}
                                    data-status-option={s}
                                    onClick={() => myStatus !== s && setStatus(s)}
                                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${myStatus === s ? 'border-violet-400/60 bg-violet-500/15' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'}`}
                                >
                                    <StatusDot status={s} ring="ring-transparent" className="!h-3 !w-3 !ring-0" />
                                    <span>
                                        <span className="block text-sm font-semibold">{STATUS[s].label}</span>
                                        <span className="block text-xs text-neutral-500">{STATUS[s].hint}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </SettingsSection>

                    <form onSubmit={submit}>
                        <SettingsSection title="About you" text="Your username is for logging in and being found. Your display name and bio are what people read.">
                            <div className="space-y-5">
                                <Field
                                    label="Username"
                                    htmlFor="username"
                                    error={errors.username}
                                    hint="3 to 20 letters, numbers or underscores. Friends add you with it."
                                    right={
                                        free.state === 'checking' ? <span className="flex items-center gap-1 text-xs text-neutral-500"><Loader2 size={12} className="animate-spin" /> checking</span>
                                        : free.state === 'ok' ? <span className="flex items-center gap-1 text-xs text-green-400"><Check size={12} /> {free.message}</span>
                                        : free.state === 'taken' ? <span className="flex items-center gap-1 text-xs text-red-400"><X size={12} /> {free.message}</span> : null
                                    }
                                >
                                    <TextInput id="username" className="block w-full" value={data.username} onChange={(e) => setData('username', e.target.value.replace(/\s/g, ''))} required maxLength={20} autoComplete="off" />
                                </Field>

                                <Field label="Display name" htmlFor="name" error={errors.name} hint="Shown in rooms and chat. It does not have to be unique.">
                                    <TextInput id="name" className="block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required maxLength={30} autoComplete="nickname" />
                                </Field>

                                <Field label="Pronouns" htmlFor="pronouns" error={errors.pronouns} hint="Shown next to your name on your profile. Pick one or write your own.">
                                    <input id="pronouns" list="pronoun-options" value={data.pronouns} onChange={(e) => setData('pronouns', e.target.value)} maxLength={24} placeholder="she/her, he/him, they/them…" autoComplete="off" className={fieldClass} />
                                    <datalist id="pronoun-options">{PRONOUNS.map((p) => <option key={p} value={p} />)}</datalist>
                                </Field>

                                <Field label="Country" htmlFor="country" error={errors.country} right={<Flag flag={flag} className="h-4" />} hint="Your flag shows on your profile and in the rooms, so people know where you are from.">
                                    <select id="country" value={data.country} onChange={(e) => setData('country', e.target.value)} className={fieldClass}>
                                        <option value="">No flag</option>
                                        {Object.entries(countries).sort((a, b) => a[1].localeCompare(b[1])).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                                    </select>
                                </Field>

                                <Field label="Bio" htmlFor="bio" error={errors.bio} right={<span className="text-xs text-neutral-500">{data.bio.length}/500</span>} hint="Write whatever you like: it shows on your profile and in your quick profile card.">
                                    <textarea id="bio" value={data.bio} onChange={(e) => setData('bio', e.target.value)} rows={5} maxLength={500} placeholder="Deep house at night, drum and bass on Fridays…" className={`${fieldClass} resize-y`} />
                                </Field>

                                <Field label="Favourite genre" htmlFor="genre" error={errors.favorite_genre} hint="We use it to suggest rooms on your dashboard.">
                                    <select id="genre" value={data.favorite_genre} onChange={(e) => setData('favorite_genre', e.target.value)} className={fieldClass}>
                                        <option value="">No favourite yet</option>
                                        {genres.map((g) => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </Field>

                                <Field label="Email" htmlFor="email" error={errors.email} hint="Only you see it. Changing it means you confirm the new address again.">
                                    <TextInput id="email" type="email" className="block w-full" value={data.email} onChange={(e) => setData('email', e.target.value)} required autoComplete="email" />
                                </Field>

                                {emailChanged && <p className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"><MailWarning size={18} className="mt-0.5 shrink-0" /> After you save, we email a link to the new address, and you confirm it again.</p>}

                                {unverified && !emailChanged && (
                                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                                        <p className="flex items-center gap-2"><MailWarning size={18} /> Your email address is not confirmed yet.</p>
                                        <Link href={route('verification.send')} method="post" as="button" preserveScroll className="mt-2 font-semibold underline hover:text-white">Send the confirm email</Link>
                                        {mail && <p className={`mt-2 ${mail === 'sent' ? 'text-green-300' : mail === 'failed' ? 'text-red-300' : 'text-amber-100'}`} data-mail-state={mail}>{MAIL_TEXT[mail].head}. {mail === 'sent' ? 'Look in your inbox, and in the Spam folder.' : MAIL_TEXT[mail].text}</p>}
                                    </div>
                                )}

                                <div className="flex items-center gap-4">
                                    <PrimaryButton disabled={processing || !isDirty || free.state === 'taken'}>{processing ? 'Saving…' : 'Save changes'}</PrimaryButton>
                                    {recentlySuccessful && <span className="flex items-center gap-1 text-sm text-green-400"><Check size={15} /> Saved</span>}
                                </div>
                            </div>
                        </SettingsSection>
                    </form>
                </div>

                {/* how others see you, live */}
                <aside className="xl:sticky xl:top-4 xl:self-start">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Preview</p>
                    <Card className="overflow-hidden">
                        <div className="h-16 bg-gradient-to-r from-fuchsia-600/50 via-violet-600/40 to-sky-600/30" />
                        <div className="-mt-9 px-5 pb-5">
                            <span className="relative inline-block"><Avatar name={data.name || user.name} avatar={user.avatar} cosmetics={user.cosmetics} className="h-[4.5rem] w-[4.5rem] text-3xl ring-4 ring-neutral-900" /><StatusDot status={myStatus} ring="ring-neutral-900" className="absolute bottom-0 right-0 !h-4 !w-4" /></span>
                            <p className="mt-3 flex flex-wrap items-center gap-2 text-lg font-black" style={{ color: user.primary_role.color }}>
                                <Badges badges={user.badges} level={user.level} awards={9} /> {data.name || 'Your name'} <RoleBadge role={user.primary_role} />
                            </p>
                            <p className="flex flex-wrap items-center gap-x-2 text-sm text-neutral-400">@{data.username || 'username'}{data.pronouns && <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-neutral-200">{data.pronouns}</span>}</p>
                            {flag && <p className="mt-2 flex items-center gap-2 text-sm text-neutral-300"><Flag flag={flag} className="h-4" /> {flag.name}</p>}
                            {data.favorite_genre && <span className="mt-2 inline-block rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs text-violet-300">🎵 {data.favorite_genre}</span>}
                            <p className="mt-3 whitespace-pre-line break-words text-sm text-neutral-300">{data.bio || <span className="text-neutral-600">Your bio shows here.</span>}</p>
                        </div>
                    </Card>

                    <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-neutral-500">In chat</p>
                    <Card className="p-4 text-sm">
                        <div className="flex gap-2.5">
                            <Avatar name={data.name || user.name} avatar={user.avatar} cosmetics={user.cosmetics} />
                            <div>
                                <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold" style={{ color: user.primary_role.color }}><Badges badges={user.badges} level={user.level} /> {data.name || 'Your name'}</p>
                                <p className="text-neutral-200">Hey everyone, great song! 🎧</p>
                            </div>
                        </div>
                    </Card>

                    <Link href={route('users.show', user.id)} className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20">View my public profile <ExternalLink size={14} /></Link>
                </aside>
            </div>
        </SettingsLayout>
    );
}
