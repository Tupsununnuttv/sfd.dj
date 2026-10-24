import RoleIcon from '@/Components/RoleIcon';
import { Check } from 'lucide-react';
import { ReactNode } from 'react';

/** A paid plan as the server describes it (App\Support\Plans::catalog). */
export interface PlanInfo {
    key: string;
    name: string;
    color: string;
    month: string; // "€2.99"
    year: string;
    save: number; // how many percent the year costs less than twelve months
    perks: string[];
    limits?: { xp: number; playlists: number; songs: number; emojis: number };
    features?: { key: string; label: string; value: string; available: boolean }[];
}

export type Interval = 'month' | 'year';

const FREE_PERKS = ['Join and create rooms, DJ, chat, vote and grab', 'Playlists, imports from YouTube and Spotify', 'Every avatar, badge and effect in the shop, unlocked by level and SFD Coins', 'Friends, whispers, events and the public API'];

const descriptions: Record<string, string> = {
    bronze: 'A small XP boost, a bronze name, extra playlists, a profile frame and a join effect.',
    silver: 'More playlists, fair queue priority, room emojis, song effects and silver profile styling.',
    gold: 'Animated names, lobby effects, custom join messages, more song effects and DJ spotlight.',
    plus: 'Glowing outlines, custom profile backgrounds, animated entrances and song reactions.',
    pro: 'Premium song effects, animated profile borders, lobby announcements and advanced room themes.',
    premium: 'All earlier perks, full profile customization, exclusive auras and entrance animations.',
};

function PerkComparison({ plans, interval }: { plans: PlanInfo[]; interval: Interval }) {
    if (!plans.every((plan) => plan.limits && plan.features)) return null;
    const row = (label: string, values: string[], planned = false) => <tr key={label} className="border-t border-white/5">
        <th scope="row" className="px-4 py-3 text-left font-medium text-neutral-200">{label}{planned && <span className="mt-0.5 block text-[10px] font-normal text-amber-300">Coming soon</span>}</th>
        {values.map((value, index) => <td key={plans[index].key} className="px-4 py-3 text-center tabular-nums text-neutral-300">{value === 'Included' ? <><Check size={16} aria-hidden className="mx-auto text-emerald-300" /><span className="sr-only">Included</span></> : value}</td>)}
    </tr>;
    return <section className="mt-8 space-y-4" aria-labelledby="perk-comparison">
        <div><h2 id="perk-comparison" className="text-xl font-bold">{interval === 'month' ? 'Monthly' : 'Yearly'} subscription perks</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">Monthly and yearly subscriptions include the same perks. Higher tiers include the features of the tiers below them. Choose your effects in Settings → Subscriptions → Subscription customization.</p></div>
        <div role="region" aria-label="Subscription perk comparison, scroll horizontally" tabIndex={0} className="overflow-x-auto rounded-2xl border border-white/10 focus-visible:outline-2 focus-visible:outline-violet-400">
            <table className="w-full min-w-[820px] text-sm"><caption className="sr-only">Compare all six subscription tiers and their included customization.</caption>
                <thead><tr className="bg-white/5"><th scope="col" className="px-4 py-4 text-left">Perk</th>{plans.map((plan) => <th scope="col" key={plan.key} className="px-4 py-4 text-center" style={{ color: plan.color }}>{plan.name}<span className="mt-1 block whitespace-nowrap text-xs font-normal text-neutral-400">{interval === 'month' ? plan.month : plan.year} / {interval}</span></th>)}</tr></thead>
                <tbody>
                    {row('XP boost', plans.map((p) => `+${p.limits!.xp}%`))}
                    {row('Playlists', plans.map((p) => p.limits!.playlists.toLocaleString('en-GB')))}
                    {row('Songs / playlist', plans.map((p) => p.limits!.songs.toLocaleString('en-GB')))}
                    {row('Room emojis', plans.map((p) => String(p.limits!.emojis)))}
                    {row('Subscription name colour', plans.map((p) => p.name))}
                    {plans[0].features!.map((feature) => row(feature.label, plans.map((plan) => plan.features!.find((f) => f.key === feature.key)?.value ?? '—'), !feature.available))}
                </tbody>
            </table>
        </div>
        <p className="text-xs leading-relaxed text-neutral-500">Priority queue moves Silver / Gold / Plus / Pro / Premium members up by at most 1 / 2 / 3 / 4 / 5 places. The oldest entry gets the next turn after three completed turns. Current songs are never interrupted.</p>
    </section>;
}

/** Monthly or yearly: the label says how much the year saves (up to as much as the best plan saves). */
export function IntervalSwitch({ value, onChange, plans }: { value: Interval; onChange: (v: Interval) => void; plans: PlanInfo[] }) {
    const save = Math.max(0, ...plans.map((p) => p.save));

    return (
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 text-sm font-semibold" role="group" aria-label="Pay by the month or the year">
            {(['month', 'year'] as const).map((v) => (
                <button key={v} onClick={() => onChange(v)} aria-pressed={value === v} className={`rounded-full px-4 py-1.5 ${value === v ? 'bg-white text-black' : 'text-neutral-300 hover:text-white'}`}>
                    {v === 'month' ? 'Monthly' : <>Yearly {save > 0 && <span className={value === v ? 'text-emerald-600' : 'text-emerald-400'}>· save up to {save}%</span>}</>}
                </button>
            ))}
        </div>
    );
}

/**
 * Free across the top, then the paid plans from Bronze up to Premium, three to a row. `action` draws the button under a paid plan; `current` is the plan you have (null = Free).
 * The columns follow the width of the box the cards sit in (a container query), so the same cards fit the wide Pricing page and the narrower Settings page.
 */
export default function PlanCards({ plans, interval, current, action, freeAction }: { plans: PlanInfo[]; interval: Interval; current?: string | null; action: (p: PlanInfo) => ReactNode; freeAction?: ReactNode }) {
    return (
        <div className="@container">
            <p className="mb-4 text-sm text-neutral-400">{interval === 'month' ? 'Monthly' : 'Yearly'} subscription perks · Same benefits with either billing period.</p>
            <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @3xl:grid-cols-3">
                {/* stacked on a phone; the name and the button on one line with the perks in two columns under them; and all in one row when there is room */}
                <div className={`flex flex-col gap-5 rounded-2xl border p-6 @xl:col-span-2 @3xl:col-span-3 @3xl:flex-row @3xl:flex-wrap @3xl:items-center @3xl:justify-between @5xl:flex-nowrap @5xl:gap-8 ${current === null ? 'border-white/30 bg-white/6' : 'border-white/10 bg-white/3'}`} data-plan="free">
                    <div className="shrink-0 @5xl:w-40">
                        <h3 className="text-lg font-bold">Free</h3>
                        <p className="mt-2 text-4xl font-black">€0</p>
                        <p className="text-xs text-neutral-500">Always free</p>
                    </div>
                    <ul className="grid gap-x-8 gap-y-2 text-sm text-neutral-300 @3xl:order-3 @3xl:basis-full @3xl:grid-cols-2 @5xl:order-0 @5xl:flex-1 @5xl:basis-auto">
                        {FREE_PERKS.map((i) => <li key={i} className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-neutral-400" /> {i}</li>)}
                    </ul>
                    <div className="@3xl:order-2 @3xl:w-56 @5xl:order-0 @5xl:shrink-0 *:mt-0!">{freeAction}</div>
                </div>
                {plans.map((p) => (
                    <div
                        key={p.key}
                        className="relative flex flex-col rounded-2xl border p-6"
                        style={{ borderColor: `${p.color}${current === p.key ? 'cc' : '55'}`, background: `linear-gradient(180deg, ${p.color}1f, transparent 60%)` }}
                        data-plan={p.key}
                    >
                        {p.key === 'premium' && <span className="absolute right-4 top-4 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black" style={{ backgroundColor: p.color }}>Best value</span>}
                        <h3 className="flex items-center gap-2 text-lg font-bold" style={{ color: p.color }}>
                            <RoleIcon role={{ key: p.key, label: p.name, color: p.color }} size={22} /> {p.name}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-neutral-400">{descriptions[p.key]}</p>
                        <p className="mt-2 text-4xl font-black">{interval === 'month' ? p.month : p.year}<span className="text-base font-semibold text-neutral-400"> / {interval}</span></p>
                        <p className="text-xs text-neutral-500">{interval === 'month' ? `or ${p.year} a year, ${p.save}% less` : `instead of ${p.month} a month: ${p.save}% less`}</p>
                        <ul className="mt-5 flex-1 space-y-2 text-sm text-neutral-200">
                            {p.perks.map((i) => <li key={i} className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0" style={{ color: p.color }} /> {i}</li>)}
                        </ul>
                        {!!p.features?.some((f) => f.value !== '—') && <details className="mt-5 rounded-lg border border-white/10 bg-white/4 p-3 text-sm">
                            <summary className="cursor-pointer font-semibold text-neutral-200">Included customization</summary>
                            <ul className="mt-3 space-y-2 text-xs text-neutral-300">{p.features.filter((f) => f.value !== '—').map((f) => <li key={f.key}>{f.label}{f.value !== 'Included' ? ` · ${f.value}` : ''}</li>)}</ul>
                        </details>}
                        {action(p)}
                    </div>
                ))}
            </div>
            <PerkComparison plans={plans} interval={interval} />
        </div>
    );
}
