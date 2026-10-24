import Avatar from '@/Components/Avatar';
import SubscriberName from '@/Components/SubscriberName';
import SubscriptionRoomEffects, { subscriptionEntrance } from '@/Components/SubscriptionRoomEffects';
import { SettingsSection, primaryBtn } from '@/Components/ui';
import { profileVars } from '@/lib/subscriptionStyle';
import type { PageProps } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export interface PerkControl { key: string; label: string; feature: string; type: string; options: string[]; unlocked: boolean }
const input = 'mt-2 block w-full rounded-lg border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-violet-400 focus:ring-violet-400 disabled:opacity-40';
const notify = () => { if (window.parent !== window) window.parent.postMessage({ type: 'sfd:preferences-updated' }, window.location.origin); };

export default function SubscriptionCustomization({ controls }: { controls: PerkControl[] }) {
    const { auth: { user } } = usePage<PageProps>().props;
    const saved = user.preferences?.subscription ?? {};
    const initialValues = Object.fromEntries(controls.map((control) => {
        const value = saved[control.key] ?? (control.key === 'frame' ? control.options.at(-1) ?? '' : control.key === 'join' ? String(user.cosmetics?.subscription?.join ?? '') : '');
        return [control.key, control.type === 'select' && !control.options.includes(value) ? '' : value];
    }));
    const form = useForm<Record<string, string>>(initialValues);
    const image = useForm<{ image: File | null }>({ image: null });
    const style = user.cosmetics?.subscription;
    const [previewSong, setPreviewSong] = useState<number | null>(null);
    return <SettingsSection id="customization" title="Subscription customization" text="Choose your profile, chat and room effects. Room settings apply to rooms you host. Monthly, yearly and gifted plans unlock the same features; saved choices stop applying when the plan expires.">
        <div className="sub-profile mb-6 flex items-center gap-4 rounded-xl border border-white/10 p-5" style={profileVars(user.cosmetics)}><Avatar name={user.name} avatar={user.avatar} cosmetics={user.cosmetics} className="h-14 w-14 text-xl" /><div><p className="font-bold"><SubscriberName cosmetics={user.cosmetics}>{user.name}</SubscriberName></p><p className="mt-1 text-xs text-neutral-400">Your saved look</p></div></div>
        {style && <div className="mb-6"><div className="relative flex h-72 flex-col overflow-hidden rounded-xl border border-white/10 bg-neutral-950" aria-label="Subscription effects preview"><SubscriptionRoomEffects host={user.cosmetics} dj={user.cosmetics} songId={previewSong} /><p className="m-auto text-sm text-neutral-500">Effects preview</p></div><div className="mt-3 flex flex-wrap gap-3"><button type="button" className="rounded-lg bg-white/10 px-3 py-2 text-xs" onClick={() => subscriptionEntrance(user.name, user.cosmetics)}>Preview entrance</button><button type="button" className="rounded-lg bg-white/10 px-3 py-2 text-xs" onClick={() => setPreviewSong(Date.now())}>Preview song effect</button></div></div>}
        <form onSubmit={(event) => { event.preventDefault(); form.transform((data) => Object.fromEntries(Object.entries(data).filter(([key]) => controls.find((c) => c.key === key)?.unlocked))); form.patch(route('settings.subscription-perks'), { preserveScroll: true, onSuccess: notify }); }}>
            <div className="grid gap-5 sm:grid-cols-2">{controls.map((control) => <div key={control.key}>
                <label htmlFor={`perk-${control.key}`} className="block text-sm font-semibold">{control.label}{!control.unlocked && <span className="ml-2 text-[10px] font-normal text-neutral-500">Higher tier required</span>}</label>
                {control.type === 'select' ? <select id={`perk-${control.key}`} className={input} disabled={!control.unlocked || form.processing} value={form.data[control.key]} onChange={(event) => form.setData(control.key, event.target.value)}><option value="">Off / none</option>{control.options.map((option) => <option key={option} value={option}>{option === 'pop' ? 'Pop animation' : option.charAt(0).toUpperCase() + option.slice(1)}</option>)}</select>
                    : control.type === 'links' ? <textarea id={`perk-${control.key}`} rows={3} className={input} disabled={!control.unlocked || form.processing} value={form.data[control.key]} onChange={(event) => form.setData(control.key, event.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
                    : <input id={`perk-${control.key}`} type={control.type === 'color' ? 'text' : 'text'} className={input} disabled={!control.unlocked || form.processing} maxLength={180} placeholder={control.type === 'color' ? '#a78bfa (leave empty for default)' : control.type === 'badges' ? user.badges.map((b) => b.key).join(', ') : 'Leave empty to disable'} value={form.data[control.key]} onChange={(event) => form.setData(control.key, event.target.value)} />}
                {form.errors[control.key] && <p role="alert" className="mt-1 text-xs text-red-300">{form.errors[control.key]}</p>}
            </div>)}</div>
            <div className="mt-6 flex items-center gap-4"><button type="submit" className={primaryBtn} disabled={form.processing || !controls.some((c) => c.unlocked)}>{form.processing ? 'Saving…' : 'Save customization'}</button>{form.recentlySuccessful && <p role="status" className="text-sm text-emerald-300">Customization saved.</p>}</div>
        </form>
        {controls.find((c) => c.key === 'background')?.unlocked && <form className="mt-6 border-t border-white/10 pt-5" onSubmit={(event) => { event.preventDefault(); image.post(route('settings.subscription-background'), { preserveScroll: true, onSuccess: () => { image.reset(); notify(); } }); }}>
            <label htmlFor="subscription-background" className="block text-sm font-semibold">Profile background image</label><p className="mt-1 text-xs text-neutral-400">PNG, JPEG or WebP, up to 4 MB. Pro and Premium also support animated GIF backgrounds.</p>
            <input id="subscription-background" type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="mt-3 w-full text-sm" onChange={(event) => image.setData('image', event.target.files?.[0] ?? null)} />
            {image.errors.image && <p role="alert" className="mt-2 text-xs text-red-300">{image.errors.image}</p>}
            <div className="mt-3 flex flex-wrap gap-3"><button type="submit" disabled={!image.data.image || image.processing} className={primaryBtn}>Upload background</button>{style?.image && <button type="button" className="text-sm text-neutral-400" onClick={() => router.delete(route('settings.subscription-background.remove'), { preserveScroll: true, onSuccess: notify })}>Remove background</button>}</div>
        </form>}
    </SettingsSection>;
}
