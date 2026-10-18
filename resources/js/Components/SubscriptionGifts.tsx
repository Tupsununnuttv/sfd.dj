import { Card, Field, fieldClass, primaryBtn } from '@/Components/ui';
import { PlanInfo } from '@/Components/PlanCards';
import { router, useForm } from '@inertiajs/react';
import { Check, Gift, Search, Send } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface GiftMember { id: number; name: string; username: string | null }
export interface SubscriptionGiftInfo {
    id: number; plan: string; name: string; price: string;
    sender: GiftMember | null; recipient: GiftMember;
    status: 'pending' | 'ready' | 'active' | 'expired' | 'revoked'; expires_at: string | null;
}
const statusLabels = { pending: 'Awaiting payment', ready: 'Ready to activate', active: 'Active', expired: 'Ended', revoked: 'Refunded or disputed' };

export default function SubscriptionGifts({ plans, payments, recipient, received, sent, hasPlan }: {
    plans: PlanInfo[]; payments: boolean; recipient: GiftMember | null; received: SubscriptionGiftInfo[]; sent: SubscriptionGiftInfo[]; hasPlan: boolean;
}) {
    const [selected, setSelected] = useState<GiftMember | null>(recipient);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<GiftMember[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [claiming, setClaiming] = useState<number | null>(null);
    const [claimError, setClaimError] = useState('');
    const form = useForm({ recipient_id: recipient?.id ?? 0, plan: 'plus' });
    const chosenPlan = plans.find((p) => p.key === form.data.plan)!;

    useEffect(() => {
        setResults([]);
        setSearchError('');
        if (selected || query.trim().replace(/^@/, '').length < 2) { setSearching(false); return; }
        const controller = new AbortController();
        setSearching(true);
        const timer = window.setTimeout(() => {
            fetch(route('settings.plus.gifts.recipients', { q: query }), { headers: { Accept: 'application/json' }, signal: controller.signal })
                .then(async (response) => { if (!response.ok) throw new Error('Member search failed'); return await response.json() as GiftMember[]; })
                .then((data) => { if (!controller.signal.aborted) setResults(data); })
                .catch(() => { if (!controller.signal.aborted) setSearchError('Could not search members. Please try again.'); })
                .finally(() => { if (!controller.signal.aborted) setSearching(false); });
        }, 300);
        return () => { window.clearTimeout(timer); controller.abort(); };
    }, [query, selected]);

    const activate = (gift: SubscriptionGiftInfo) => {
        setClaiming(gift.id); setClaimError('');
        router.post(route('settings.plus.gifts.activate', gift.id), {}, {
            preserveScroll: true,
            onError: (errors) => setClaimError(errors.gift || 'This gift could not be activated. Please try again.'),
            onFinish: () => setClaiming(null),
        });
    };

    return <div id="gifts" className="space-y-5 scroll-mt-5">
        <Card className="overflow-hidden">
            <div className="border-b border-white/10 bg-linear-to-r from-violet-500/15 via-fuchsia-500/10 to-transparent p-5 sm:p-6">
                <div className="flex items-center gap-3"><span className="rounded-2xl bg-violet-400/15 p-3 text-violet-300"><Gift size={24} /></span><div><h2 className="text-xl font-bold">Make someone's month</h2><p className="mt-1 text-sm text-neutral-400">Gift a subscription to another member.</p></div></div>
            </div>
            <form className="space-y-5 p-5 sm:p-6" onSubmit={(e) => { e.preventDefault(); form.post(route('settings.plus.gifts.checkout'), { preserveScroll: true }); }}>
                <Field label="Who is it for?" htmlFor="gift-recipient" error={form.errors.recipient_id} hint="Search by username or display name, then choose the exact member.">
                    {selected ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-3"><span className="flex items-center gap-2 text-sm"><Check size={17} className="text-violet-300" /><span className="font-semibold">{selected.name}</span>{selected.username && <span className="text-neutral-400">@{selected.username}</span>}</span><button type="button" disabled={form.processing} className="text-xs font-semibold text-violet-300 hover:text-white" onClick={() => { setSelected(null); form.setData('recipient_id', 0); setQuery(''); }}>Change recipient</button></div> : <>
                        <div className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-3 text-neutral-500" /><input id="gift-recipient" value={query} onChange={(e) => setQuery(e.target.value)} maxLength={60} autoComplete="off" placeholder="Search @username" className={`${fieldClass} pl-9`} /></div>
                        <div aria-live="polite" className="mt-2">
                            {searching && <p className="text-xs text-neutral-500">Searching members...</p>}
                            {searchError && <p className="text-sm text-red-300">{searchError}</p>}
                            {!searching && query.trim().replace(/^@/, '').length >= 2 && !results.length && !searchError && <p className="text-xs text-neutral-500">No members found.</p>}
                            {!!results.length && <ul className="overflow-hidden rounded-xl border border-white/10 bg-black/20">{results.map((member) => <li key={member.id}><button type="button" className="flex w-full flex-wrap gap-2 px-4 py-3 text-left text-sm hover:bg-violet-500/15" onClick={() => { setSelected(member); form.setData('recipient_id', member.id); form.clearErrors('recipient_id'); }}><span className="font-semibold">{member.name}</span><span className="text-neutral-400">@{member.username}</span></button></li>)}</ul>}
                        </div>
                    </>}
                </Field>
                <fieldset><legend className="mb-2 text-sm font-medium text-neutral-300">Choose a plan · 1 month</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{plans.map((plan) => <label key={plan.key} className={`cursor-pointer rounded-xl border p-3 transition ${form.data.plan === plan.key ? 'border-violet-400/60 bg-violet-500/15' : 'border-white/10 bg-white/3 hover:bg-white/5'}`}><input type="radio" name="gift-plan" value={plan.key} checked={form.data.plan === plan.key} onChange={() => form.setData('plan', plan.key)} className="mr-2 border-neutral-600 bg-neutral-900 text-violet-500 focus:ring-violet-500" /><span className="font-semibold" style={{ color: plan.color }}>{plan.name}</span><span className="mt-1 block pl-6 text-sm text-neutral-400">{plan.month} once</span></label>)}</div></fieldset>
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-black/20 p-4"><div className="text-sm"><p className="font-semibold">1 month of {chosenPlan.name} · {chosenPlan.month}</p><p className="mt-1 max-w-lg text-xs leading-relaxed text-neutral-400">One payment. No automatic renewal. The recipient activates the gift in Settings → Subscriptions when ready. Existing subscriptions stay unchanged.</p></div><button type="submit" disabled={!payments || !selected || form.processing} className={`${primaryBtn} flex items-center gap-2`}><Send size={16} />{form.processing ? 'Opening checkout...' : `Gift ${chosenPlan.name}`}</button></div>
                {!payments && <p className="text-sm text-amber-300">Gift payments are not connected yet.</p>}
                {(form.errors as Record<string, string>).gift && <p role="alert" className="text-sm text-red-300">{(form.errors as Record<string, string>).gift}</p>}
            </form>
        </Card>

        <Card className="p-5 sm:p-6"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-bold"><Gift size={18} className="text-fuchsia-300" /> Your gifts</h2><button type="button" className="text-xs font-semibold text-violet-300 hover:text-white" onClick={() => router.reload({ only: ['receivedGifts', 'sentGifts', 'mine', 'pendingSubscriptionGifts'] })}>Refresh</button></div>
            {hasPlan && received.some((gift) => gift.status === 'ready') && <p className="mb-4 text-sm text-neutral-400">Your gifts are saved. Activate one after your current plan ends to enjoy the full month.</p>}
            {claimError && <p role="alert" className="mb-3 text-sm text-red-300">{claimError}</p>}
            {!received.length ? <p className="text-sm text-neutral-500">Gifts from other members will appear here.</p> : <ul className="space-y-2">{received.map((gift) => <li key={gift.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/4 p-4"><div><p className="text-sm font-semibold">{gift.name} · 1 month</p><p className="mt-1 text-xs text-neutral-400">From {gift.sender?.name || 'a former member'}{gift.sender?.username ? ` (@${gift.sender.username})` : ''}</p><p className="mt-1 text-xs text-neutral-500">{statusLabels[gift.status]}{gift.status === 'active' && gift.expires_at ? ` until ${new Date(gift.expires_at).toLocaleDateString()}` : ''}</p></div>{gift.status === 'ready' && <button onClick={() => activate(gift)} disabled={claiming !== null || hasPlan} className={primaryBtn}>{claiming === gift.id ? 'Activating...' : hasPlan ? 'Saved for later' : 'Activate 1 month'}</button>}</li>)}</ul>}
            {!!sent.length && <details className="mt-5 border-t border-white/10 pt-4"><summary className="cursor-pointer text-sm font-semibold text-neutral-300">Sent gifts · {sent.length}</summary><ul className="mt-3 space-y-2">{sent.map((gift) => <li key={gift.id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-white/3 p-3 text-xs"><span><span className="font-semibold text-neutral-200">{gift.recipient.name}</span><span className="text-neutral-400"> · {gift.name} · {gift.price}</span></span><span className={gift.status === 'ready' || gift.status === 'active' ? 'text-emerald-300' : 'text-neutral-500'}>{gift.status === 'ready' ? 'Delivered' : statusLabels[gift.status]}</span></li>)}</ul></details>}
        </Card>
    </div>;
}
