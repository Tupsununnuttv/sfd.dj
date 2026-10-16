import PlanCards, { Interval, IntervalSwitch, PlanInfo } from '@/Components/PlanCards';
import { Card } from '@/Components/ui';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, CreditCard } from 'lucide-react';
import { useState } from 'react';

interface Mine {
    key: string;
    name: string;
    until: string | null; // null: given for good
    interval: string | null;
    renews: boolean;
}

const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

/** SFD-DJ.EU Subscriptions (Bronze, Silver, Gold, Plus, Pro and Premium): what you have, the plans and their prices, and buying one on Stripe. */
export default function Plus({ plans, mine, manageable, payments, paid }: { plans: PlanInfo[]; mine: Mine | null; manageable: boolean; payments: boolean; paid: boolean }) {
    const [period, setPeriod] = useState<Interval>('month');
    const [busy, setBusy] = useState<string | null>(null);
    const buy = (plan: string) => { setBusy(plan); router.post(route('settings.plus.checkout'), { plan, interval: period }, { onFinish: () => setBusy(null) }); };
    const manage = () => { setBusy('manage'); router.post(route('settings.plus.portal'), {}, { onFinish: () => setBusy(null) }); };
    const color = plans.find((p) => p.key === mine?.key)?.color;

    return (
        <SettingsLayout title="SFD-DJ.EU Subscriptions" subtitle="Optional plans that give you the role of the same name, more XP and room for more playlists and emojis. Everything that is free stays free.">
            <Head title="SFD-DJ.EU Subscriptions" />
            <div className="max-w-5xl space-y-6">
                {paid && (
                    <p className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                        <CheckCircle2 size={18} /> Thank you! Your plan comes on as soon as Stripe tells us the payment went through, usually within a minute.
                    </p>
                )}

                <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <div data-my-plan>
                        <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Your plan</p>
                        {mine ? (
                            <p className="mt-1 text-lg font-bold" style={{ color }}>
                                SFD-DJ.EU {mine.name}
                                <span className="ml-2 text-sm font-normal text-neutral-400">
                                    {mine.until ? `${mine.renews ? 'renews' : 'until'} ${day(mine.until)}${mine.renews && mine.interval ? ` (${mine.interval === 'year' ? 'yearly' : 'monthly'})` : ''}` : 'for good'}
                                </span>
                            </p>
                        ) : (
                            <p className="mt-1 text-lg font-bold">Free</p>
                        )}
                    </div>
                    {manageable && (
                        <button onClick={manage} disabled={busy !== null} className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20 disabled:opacity-50">
                            <CreditCard size={16} /> {busy === 'manage' ? 'Opening…' : 'Manage or cancel'}
                        </button>
                    )}
                </Card>

                <div className="flex justify-center"><IntervalSwitch value={period} onChange={setPeriod} /></div>

                <PlanCards
                    plans={plans}
                    interval={period}
                    current={mine?.key ?? null}
                    freeAction={<button disabled className="mt-6 w-full rounded-lg bg-white/10 py-2.5 text-sm font-semibold text-neutral-400">{mine ? 'Free' : 'Your plan'}</button>}
                    action={(p) => (mine?.key === p.key ? (
                        <button disabled className="mt-6 w-full rounded-lg py-2.5 text-sm font-semibold text-black" style={{ backgroundColor: p.color }}>Your plan</button>
                    ) : payments ? (
                        <button onClick={() => buy(p.key)} disabled={busy !== null || (!!mine && manageable)} title={mine && manageable ? 'Switch plans on Stripe’s page: Manage or cancel' : undefined} className="mt-6 w-full rounded-lg py-2.5 text-sm font-bold text-black hover:brightness-110 disabled:opacity-50" style={{ backgroundColor: p.color }} data-buy={p.key}>
                            {busy === p.key ? 'Opening Stripe…' : `Get ${p.name}`}
                        </button>
                    ) : (
                        <button disabled className="mt-6 w-full rounded-lg bg-white/10 py-2.5 text-sm font-semibold text-neutral-400" data-buy={p.key}>Payments are not connected yet</button>
                    ))}
                />

                <p className="text-xs leading-relaxed text-neutral-500">
                    A plan gives you the role of the same name (Bronze, Silver, Gold, Plus, Pro or Premium) as soon as you have it, and it goes when the plan ends; it does not give you any staff rights. Payments are handled by Stripe; SFD-DJ.EU never sees your card. A plan renews by itself every month or year until you cancel it under “Manage or cancel”, and after cancelling you keep it until the end of the time you paid for. Prices are in euros. SFD Coins are never sold for money: you earn them by using the site.
                </p>
            </div>
        </SettingsLayout>
    );
}
