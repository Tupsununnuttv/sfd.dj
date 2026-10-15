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
    perks: string[];
}

export type Interval = 'month' | 'year';

const FREE_PERKS = ['Join and create rooms, DJ, chat, vote and grab', 'Playlists, imports from YouTube and Spotify', 'Every avatar, badge and effect in the shop, unlocked by level and SFD Coins', 'Friends, whispers, events and the public API'];

/** Monthly or yearly: the yearly price is about two months free. */
export function IntervalSwitch({ value, onChange }: { value: Interval; onChange: (v: Interval) => void }) {
    return (
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 text-sm font-semibold" role="group" aria-label="Pay by the month or the year">
            {(['month', 'year'] as const).map((v) => (
                <button key={v} onClick={() => onChange(v)} aria-pressed={value === v} className={`rounded-full px-4 py-1.5 ${value === v ? 'bg-white text-black' : 'text-neutral-300 hover:text-white'}`}>
                    {v === 'month' ? 'Monthly' : <>Yearly <span className={value === v ? 'text-emerald-600' : 'text-emerald-400'}>· 2 months free</span></>}
                </button>
            ))}
        </div>
    );
}

/** Free, Plus and Premium side by side. `action` draws the button under a paid plan; `current` is the plan you have (null = Free). */
export default function PlanCards({ plans, interval, current, action, freeAction }: { plans: PlanInfo[]; interval: Interval; current?: string | null; action: (p: PlanInfo) => ReactNode; freeAction?: ReactNode }) {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className={`flex flex-col rounded-2xl border p-6 ${current === null ? 'border-white/30 bg-white/6' : 'border-white/10 bg-white/3'}`} data-plan="free">
                <h3 className="text-lg font-bold">Free</h3>
                <p className="mt-2 text-4xl font-black">€0</p>
                <p className="text-xs text-neutral-500">Always free</p>
                <ul className="mt-5 flex-1 space-y-2 text-sm text-neutral-300">
                    {FREE_PERKS.map((i) => <li key={i} className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-neutral-400" /> {i}</li>)}
                </ul>
                {freeAction}
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
                        <RoleIcon role={{ key: `sub:${p.key}`, label: `SFD-DJ.EU ${p.name}`, color: p.color }} size={22} /> {p.name}
                    </h3>
                    <p className="mt-2 text-4xl font-black">{interval === 'month' ? p.month : p.year}<span className="text-base font-semibold text-neutral-400"> / {interval}</span></p>
                    <p className="text-xs text-neutral-500">{interval === 'month' ? `or ${p.year} a year` : `instead of ${p.month} a month`}</p>
                    <ul className="mt-5 flex-1 space-y-2 text-sm text-neutral-200">
                        {p.perks.map((i) => <li key={i} className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0" style={{ color: p.color }} /> {i}</li>)}
                    </ul>
                    {action(p)}
                </div>
            ))}
        </div>
    );
}
