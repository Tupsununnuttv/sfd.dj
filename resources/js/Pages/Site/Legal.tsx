import SiteLayout, { PageHeader } from '@/Layouts/SiteLayout';
import { legal, legalBySlug } from '@/lib/siteContent';
import { Head, Link } from '@inertiajs/react';

/** Community rules, terms and privacy: one template, three documents from lib/siteContent.ts. */
export default function Legal({ slug }: { slug: string }) {
    const doc = legalBySlug(slug)!;

    return (
        <SiteLayout>
            <Head title={doc.title} />
            <PageHeader crumbs={[['Legal'], [doc.title]]} title={doc.title} text={doc.summary} />

            <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1fr_14rem]">
                <article className="space-y-8">
                    {doc.sections.map(([heading, paragraphs], i) => (
                        <section key={heading} id={`s${i + 1}`} className="scroll-mt-24">
                            <h2 className="text-xl font-bold">{i + 1}. {heading}</h2>
                            <ul className="mt-3 space-y-3 text-neutral-300">
                                {paragraphs.map((p) => <li key={p}>{p}</li>)}
                            </ul>
                        </section>
                    ))}
                    <p className="text-sm text-neutral-500">Last updated {doc.updated}. Questions? <Link href={route('site.contact')} className="text-violet-400 hover:underline">Contact us</Link>.</p>
                </article>

                <aside className="space-y-6 text-sm">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">On this page</p>
                        <ul className="mt-3 space-y-1">
                            {doc.sections.map(([heading], i) => <li key={heading}><a href={`#s${i + 1}`} className="text-neutral-400 hover:text-white">{i + 1}. {heading}</a></li>)}
                        </ul>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Legal</p>
                        <ul className="mt-3 space-y-1">
                            {legal.map((d) => (
                                <li key={d.slug}><Link href={route('site.legal', d.slug)} className={`block rounded-md px-3 py-1.5 ${d.slug === slug ? 'bg-violet-600/20 text-violet-300' : 'text-neutral-400 hover:text-white'}`}>{d.title}</Link></li>
                            ))}
                        </ul>
                    </div>
                </aside>
            </div>
        </SiteLayout>
    );
}
