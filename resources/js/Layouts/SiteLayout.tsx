import ApplicationLogo from '@/Components/ApplicationLogo';
import SocialIcon from '@/Components/SocialIcon';
import SupportWidget from '@/Components/SupportWidget';
import { features, legal } from '@/lib/siteContent';
import { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { PropsWithChildren, useState } from 'react';

type Item = { label: string; href: string };
type Group = { label: string; items: Item[] };

const feature = (slug: string, label: string): Item => ({ label, href: route('site.feature', slug) });

/** The public website's menu. A group opens a drop-down with its sub-pages. */
const menu = (): (Group | Item)[] => [
    {
        label: 'Features',
        items: [{ label: 'All features', href: route('site.features') }, ...features.map((f) => feature(f.slug, f.title))],
    },
    {
        label: 'Community',
        items: [
            { label: 'Live rooms', href: route('dashboard') },
            { label: 'Leaderboards', href: route('community') },
            { label: 'Events', href: route('events') },
            { label: 'Community rules', href: route('site.legal', 'rules') },
            { label: 'Staff application', href: route('staff-application.create') },
        ],
    },
    {
        label: 'Developers',
        items: [
            { label: 'API & bots', href: route('site.developers') },
            { label: 'Documentation', href: route('docs') },
            { label: 'Patch notes', href: route('patch-notes') },
        ],
    },
    { label: 'Pricing', href: route('site.pricing') },
    { label: 'About', href: route('site.about') },
    {
        label: 'Help',
        items: [
            { label: 'FAQ', href: route('faq') },
            { label: 'Documentation', href: route('docs') },
            { label: 'Contact us', href: route('site.contact') },
        ],
    },
];

const isGroup = (i: Group | Item): i is Group => 'items' in i;

function Dropdown({ group }: { group: Group }) {
    return (
        <div className="group relative">
            <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-neutral-300 hover:text-white group-focus-within:text-white">
                {group.label} <span className="text-[10px] opacity-60">▾</span>
            </button>
            <div className="absolute left-0 top-full z-30 hidden w-60 pt-1 group-focus-within:block group-hover:block">
                <ul className="overflow-hidden rounded-xl border border-white/10 bg-neutral-950 py-1 shadow-2xl">
                    {group.items.map((i) => (
                        <li key={i.href + i.label}>
                            <Link href={i.href} className="block px-4 py-2 text-sm text-neutral-300 hover:bg-white/5 hover:text-white">{i.label}</Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

/** Frame for every public page: menu on top, footer below, live support in the corner. */
export default function SiteLayout({ children }: PropsWithChildren) {
    const { auth, community } = usePage<PageProps>().props;
    const [open, setOpen] = useState(false);
    const items = menu();
    const btn = 'rounded-lg px-4 py-2 text-sm font-semibold transition';

    return (
        <div className="min-h-screen bg-black text-white [background-image:radial-gradient(60rem_26rem_at_50%_-12%,rgba(168,85,247,0.28),transparent)]">
            <header className="sticky top-0 z-40 border-b border-white/5 bg-black/70 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
                    <Link href="/"><ApplicationLogo className="text-2xl" /></Link>

                    <nav className="hidden items-center gap-1 lg:flex">
                        {items.map((i) => isGroup(i)
                            ? <Dropdown key={i.label} group={i} />
                            : <Link key={i.label} href={i.href} className="rounded-md px-3 py-2 text-sm text-neutral-300 hover:text-white">{i.label}</Link>)}
                    </nav>

                    <div className="flex items-center gap-2">
                        {auth.guest ? (
                            <>
                                <Link href={route('login')} className="hidden px-3 py-2 text-sm text-neutral-300 hover:text-white sm:block">Log in</Link>
                                <Link href={route('register')} className={`${btn} bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:opacity-90`}>Register</Link>
                            </>
                        ) : (
                            <Link href={route('dashboard')} className={`${btn} bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:opacity-90`}>Open rooms</Link>
                        )}
                        <button onClick={() => setOpen(!open)} className="rounded-md p-2 text-neutral-300 hover:bg-white/10 lg:hidden" aria-label="Menu">{open ? <X size={20} /> : <Menu size={20} />}</button>
                    </div>
                </div>

                {open && (
                    <nav className="max-h-[75vh] space-y-4 overflow-y-auto border-t border-white/5 px-6 py-4 lg:hidden">
                        {items.map((i) => isGroup(i) ? (
                            <div key={i.label}>
                                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{i.label}</p>
                                <ul className="mt-1 space-y-1">
                                    {i.items.map((s) => <li key={s.href + s.label}><Link href={s.href} className="block py-1 text-sm text-neutral-300 hover:text-white">{s.label}</Link></li>)}
                                </ul>
                            </div>
                        ) : (
                            <Link key={i.label} href={i.href} className="block text-sm font-semibold text-neutral-200">{i.label}</Link>
                        ))}
                        {auth.guest && <Link href={route('login')} className="block text-sm text-neutral-300">Log in</Link>}
                    </nav>
                )}
            </header>

            <main>{children}</main>

            <footer className="mt-24 border-t border-white/10 bg-black/60">
                <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="lg:col-span-2">
                        <ApplicationLogo className="text-xl" />
                        <p className="mt-3 max-w-xs text-sm text-neutral-400">Live music rooms where everyone hears the same song at the same second.</p>
                        {Object.keys(community.social).length > 0 && (
                            <div className="mt-4 flex gap-3 text-neutral-400">
                                {Object.entries(community.social).map(([key, url]) => (
                                    <a key={key} href={url} target="_blank" rel="noopener noreferrer" title={key} className="hover:text-white"><SocialIcon name={key} size={18} /></a>
                                ))}
                            </div>
                        )}
                    </div>
                    <FooterColumn title="Product" links={[['Features', route('site.features')], ...features.slice(0, 3).map((f) => [f.title, route('site.feature', f.slug)] as [string, string]), ['Pricing', route('site.pricing')]]} />
                    <FooterColumn title="Community" links={[['Live rooms', route('dashboard')], ['Leaderboards', route('community')], ['Events', route('events')], ['Patch notes', route('patch-notes')]]} />
                    <FooterColumn title="Company" links={[['About', route('site.about')], ['Brand', route('site.brand')], ['Developers', route('site.developers')], ['Contact', route('site.contact')], ['FAQ', route('faq')], ...legal.map((d) => [d.title, route('site.legal', d.slug)] as [string, string])]} />
                </div>
                <p className="border-t border-white/5 py-5 text-center text-xs text-neutral-600">© {new Date().getFullYear()} SFD-DJ.EU. Music plays through YouTube.</p>
            </footer>

            <SupportWidget />
        </div>
    );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{title}</p>
            <ul className="mt-3 space-y-2 text-sm">
                {links.map(([label, href]) => <li key={href + label}><Link href={href} className="text-neutral-400 hover:text-white">{label}</Link></li>)}
            </ul>
        </div>
    );
}

/** Heading block used at the top of inner pages, with the path back (Home / Features / …). */
export function PageHeader({ crumbs, title, text }: { crumbs: [string, string?][]; title: string; text?: string }) {
    return (
        <section className="mx-auto max-w-6xl px-6 pb-8 pt-14">
            <p className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                <Link href="/" className="hover:text-white">Home</Link>
                {crumbs.map(([label, href]) => (
                    <span key={label} className="flex items-center gap-2">
                        <span>/</span>
                        {href ? <Link href={href} className="hover:text-white">{label}</Link> : <span className="text-neutral-300">{label}</span>}
                    </span>
                ))}
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
            {text && <p className="mt-4 max-w-2xl text-lg text-neutral-400">{text}</p>}
        </section>
    );
}
