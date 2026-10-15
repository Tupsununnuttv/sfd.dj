import SiteLayout, { PageHeader } from '@/Layouts/SiteLayout';
import { featureBySlug, features } from '@/lib/siteContent';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

/** One feature as its own sub-page, from the words in lib/siteContent.ts. */
export default function Feature({ slug }: { slug: string }) {
    const f = featureBySlug(slug)!;
    const guest = usePage<PageProps>().props.auth.guest;
    const index = features.findIndex((x) => x.slug === slug);
    const next = features[(index + 1) % features.length];

    return (
        <SiteLayout>
            <Head title={f.title} />
            <PageHeader crumbs={[['Features', route('site.features')], [f.title]]} title={`${f.icon} ${f.title}`} text={f.intro} />

            <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1fr_16rem]">
                <div>
                    <p className="text-xl font-semibold text-violet-300">{f.tagline}</p>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        {f.points.map(([title, text]) => (
                            <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-5">
                                <h2 className="font-semibold">{title}</h2>
                                <p className="mt-1 text-sm text-neutral-400">{text}</p>
                            </div>
                        ))}
                    </div>

                    {f.steps && (
                        <div className="mt-10">
                            <h2 className="text-xl font-bold">Try it</h2>
                            <ol className="mt-3 list-decimal space-y-2 pl-5 text-neutral-300">
                                {f.steps.map((s) => <li key={s}>{s}</li>)}
                            </ol>
                        </div>
                    )}

                    <div className="mt-10 flex flex-wrap gap-3">
                        <Link href={guest ? route('register') : route('dashboard')} className="rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 px-5 py-2.5 text-sm font-semibold hover:opacity-90">{guest ? 'Get started' : 'Open rooms'}</Link>
                        <Link href={route('site.feature', next.slug)} className="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/20">Next: {next.title} →</Link>
                    </div>
                </div>

                <aside className="space-y-6">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">All features</p>
                        <ul className="mt-3 space-y-1 text-sm">
                            {features.map((x) => (
                                <li key={x.slug}>
                                    <Link href={route('site.feature', x.slug)} className={`block rounded-md px-3 py-2 ${x.slug === slug ? 'bg-violet-600/20 text-violet-300' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}>{x.icon} {x.title}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Related</p>
                        <ul className="mt-3 space-y-1 text-sm">
                            {f.related.map((r) => {
                                const rel = featureBySlug(r)!;
                                return <li key={r}><Link href={route('site.feature', r)} className="text-violet-400 hover:underline">{rel.title}</Link></li>;
                            })}
                        </ul>
                    </div>
                </aside>
            </div>
        </SiteLayout>
    );
}
