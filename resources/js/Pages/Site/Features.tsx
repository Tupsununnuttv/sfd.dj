import SiteLayout, { PageHeader } from '@/Layouts/SiteLayout';
import { features } from '@/lib/siteContent';
import { Head, Link } from '@inertiajs/react';

export default function Features() {
    return (
        <SiteLayout>
            <Head title="Features" />
            <PageHeader crumbs={[['Features']]} title="Features" text="Everything in SFD-DJ.EU, in six parts. Open one for the details." />
            <section className="mx-auto grid max-w-6xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((f) => (
                    <Link key={f.slug} href={route('site.feature', f.slug)} className="rounded-xl border border-white/10 bg-white/5 p-6 transition hover:border-violet-500">
                        <p className="text-3xl">{f.icon}</p>
                        <h2 className="mt-3 text-lg font-semibold">{f.title}</h2>
                        <p className="mt-1 text-sm text-neutral-400">{f.tagline}</p>
                        <ul className="mt-4 space-y-1 text-sm text-neutral-500">
                            {f.points.slice(0, 3).map(([t]) => <li key={t}>· {t}</li>)}
                        </ul>
                        <p className="mt-4 text-sm font-semibold text-violet-400">Read more →</p>
                    </Link>
                ))}
            </section>
        </SiteLayout>
    );
}
