import SocialIcon from '@/Components/SocialIcon';
import Toggle from '@/Components/Toggle';
import { router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

export interface CommunityAdmin {
    social: Record<string, string>;
    donation: { enabled: boolean; title: string; goal: number; current: number; currency: string; url: string };
    labels: Record<string, string>;
}

const field = 'w-full rounded-md border-neutral-700 bg-neutral-800 text-sm text-neutral-100 placeholder-neutral-500 focus:border-violet-500 focus:ring-violet-500';
const card = 'rounded-2xl border border-white/10 bg-white/[0.04] p-5';

/** Admin panel → Community: the social links in the room footbar and the donation goal. */
export default function CommunityTab({ community }: { community: CommunityAdmin }) {
    const [social, setSocial] = useState(community.social);
    const [d, setD] = useState(community.donation);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saved, setSaved] = useState(false);

    const save = (e: FormEvent) => {
        e.preventDefault();
        router.put(route('community.update'), { social, donation: d }, {
            preserveScroll: true,
            onSuccess: () => { setErrors({}); setSaved(true); setTimeout(() => setSaved(false), 2000); },
            onError: setErrors,
        });
    };

    const percent = d.goal > 0 ? Math.min(100, Math.round((d.current / d.goal) * 100)) : 0;

    return (
        <form onSubmit={save} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className={`${card} space-y-3`}>
                <h2 className="font-semibold">Social links</h2>
                <p className="text-xs text-neutral-500">Shown as small icons in every room's footbar. Leave one empty to hide it. Links must start with https://</p>
                {Object.entries(community.labels).map(([key, label]) => (
                    <div key={key}>
                        <label className="flex items-center gap-3">
                            <span className="flex w-24 shrink-0 items-center gap-2 text-sm text-neutral-300"><SocialIcon name={key} /> {label}</span>
                            <input value={social[key] ?? ''} onChange={(e) => setSocial({ ...social, [key]: e.target.value })} placeholder="https://" className={field} />
                        </label>
                        {errors[`social.${key}`] && <p className="mt-1 text-xs text-red-400">{errors[`social.${key}`]}</p>}
                    </div>
                ))}
            </section>

            <section className={`${card} space-y-3`}>
                <h2 className="font-semibold">Donation goal</h2>
                <Toggle label="Show the donation goal" hint="A heart with the percentage in the room footbar, and a card on the dashboard." checked={d.enabled} onChange={(v) => setD({ ...d, enabled: v })} />
                <input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} placeholder="Title, e.g. Server costs for October" maxLength={60} className={field} />
                <div className="grid grid-cols-3 gap-3">
                    <label className="text-xs text-neutral-400">Currency
                        <input value={d.currency} onChange={(e) => setD({ ...d, currency: e.target.value })} maxLength={3} className={`${field} mt-1`} />
                    </label>
                    <label className="text-xs text-neutral-400">Raised elsewhere
                        <input type="number" min={0} step="0.01" value={d.current} onChange={(e) => setD({ ...d, current: Number(e.target.value) })} className={`${field} mt-1`} />
                    </label>
                    <label className="text-xs text-neutral-400">Goal
                        <input type="number" min={0} step="0.01" value={d.goal} onChange={(e) => setD({ ...d, goal: Number(e.target.value) })} className={`${field} mt-1`} />
                    </label>
                </div>
                <div>
                    <input value={d.url} onChange={(e) => setD({ ...d, url: e.target.value })} placeholder="Donation page when Stripe is off, e.g. https://ko-fi.com/yourname" className={field} />
                    {errors['donation.url'] && <p className="mt-1 text-xs text-red-400">{errors['donation.url']}</p>}
                </div>
                <div>
                    <div className="h-2 overflow-hidden rounded-full bg-neutral-800"><div className="h-full bg-gradient-to-r from-pink-500 to-fuchsia-500" style={{ width: `${percent}%` }} /></div>
                    <p className="mt-1 text-xs text-neutral-500">{d.currency}{d.current} of {d.currency}{d.goal} ({percent}%), before the donations made on the site. People donate any amount with the Donate button in a room's footbar: with Stripe connected they pay on Stripe and it is added to the goal by itself; without it, the page above opens. Put money raised anywhere else in "Raised elsewhere".</p>
                </div>
            </section>

            <div className="flex items-center gap-3 lg:col-span-2">
                <button className="rounded-md bg-gradient-to-r from-fuchsia-500 to-violet-500 px-5 py-2 text-sm font-semibold">Save</button>
                {saved && <span className="text-sm text-green-400">Saved.</span>}
            </div>
        </form>
    );
}
