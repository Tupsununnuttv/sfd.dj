import PlanCards, { Interval, IntervalSwitch, PlanInfo } from '@/Components/PlanCards';
import SiteLayout, { PageHeader } from '@/Layouts/SiteLayout';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

/** The public price list: Free, then Bronze, Silver, Gold, Plus, Pro and Premium. Buying happens in Settings → Subscriptions. */
export default function Pricing({ plans }: { plans: PlanInfo[] }) {
    const { auth, community } = usePage<PageProps>().props;
    const [period, setPeriod] = useState<Interval>('month');
    const cta = (label: string, style?: object) => (
        <Link href={auth.guest ? route('register') : route('settings.plus')} className="mt-6 block w-full rounded-lg py-2.5 text-center text-sm font-bold text-black hover:brightness-110" style={style}>
            {label}
        </Link>
    );

    return (
        <SiteLayout>
            <Head title="Pricing" />
            <PageHeader crumbs={[['Pricing']]} title="Pricing" text="SFD-DJ.EU is free, and it stays free. Bronze, Silver, Gold, Plus, Pro and Premium are optional plans for people who want a role of their own with a gem next to their name, more XP and room for more." />

            <section className="mx-auto max-w-6xl space-y-6 px-6">
                <div className="flex justify-center"><IntervalSwitch value={period} onChange={setPeriod} /></div>
                <PlanCards
                    plans={plans}
                    interval={period}
                    freeAction={<Link href={auth.guest ? route('register') : route('dashboard')} className="mt-6 block w-full rounded-lg bg-white/10 py-2.5 text-center text-sm font-semibold text-white hover:bg-white/20">{auth.guest ? 'Create a free account' : 'Go to the dashboard'}</Link>}
                    action={(p) => cta(auth.guest ? `Sign up, then get ${p.name}` : `Get ${p.name}`, { backgroundColor: p.color })}
                />
                <p className="text-center text-xs text-neutral-500">Prices in euros. Pay by the month or the year through Stripe, and cancel any time in Settings → Subscriptions: you keep your plan until the end of the time you paid for.</p>
            </section>

            <section className="mx-auto mt-12 max-w-3xl space-y-3 px-6 text-center text-neutral-400">
                <p>Want to help in another way? {community.donation ? 'Chip in to the donation goal and it goes to keeping the servers running.' : 'Invite friends: you earn XP for every one who registers.'}</p>
                <div className="flex flex-wrap justify-center gap-3">
                    {community.donation?.url && <a href={community.donation.url} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-400">❤ Donate</a>}
                    <Link href={auth.guest ? route('register') : route('referral')} className="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20">{auth.guest ? 'Create a free account' : 'Invite friends'}</Link>
                </div>
            </section>
        </SiteLayout>
    );
}
