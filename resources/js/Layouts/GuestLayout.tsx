import ApplicationLogo, { LogoMark } from '@/Components/ApplicationLogo';
import SupportWidget from '@/Components/SupportWidget';
import { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Headphones, MessageCircle, Radio, Users } from 'lucide-react';
import { PropsWithChildren, ReactNode } from 'react';

const points: [typeof Radio, string, string][] = [
    [Radio, 'Perfect sync', 'Everyone hears the same second of the song.'],
    [MessageCircle, 'Live chat', 'GIFs, emotes, replies and whispers.'],
    [Users, 'Your crowd', 'Rooms, roles, friends and levels.'],
];

/** A row of bars that dance, for the brand panel. */
function Bars() {
    return (
        <div className="flex h-16 items-end gap-1.5" aria-hidden>
            {Array.from({ length: 28 }, (_, i) => (
                <span key={i} className="w-1.5 animate-eq rounded-full bg-gradient-to-t from-fuchsia-500/70 to-violet-400/70" style={{ height: `${30 + ((i * 37) % 70)}%`, animationDelay: `${(i % 9) * 0.13}s`, animationDuration: `${0.9 + (i % 5) * 0.18}s` }} />
            ))}
        </div>
    );
}

/**
 * The frame of every log in / register / password page: a brand panel on the left (wide screens) and the form on the right.
 * `aside` (saved accounts) goes under the form.
 */
export default function Guest({ children, aside, title, subtitle }: PropsWithChildren<{ aside?: ReactNode; title?: ReactNode; subtitle?: ReactNode }>) {
    const stats = usePage<PageProps>().props.siteStats;

    return (
        <div className="grid min-h-screen bg-neutral-950 text-neutral-100 lg:grid-cols-[1.05fr_1fr]">
            {/* brand panel */}
            <aside className="relative hidden overflow-hidden bg-gradient-to-br from-violet-950 via-neutral-950 to-fuchsia-950 p-12 lg:flex lg:flex-col lg:justify-between">
                <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 animate-float rounded-full bg-fuchsia-600/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 right-0 h-[28rem] w-[28rem] animate-float rounded-full bg-violet-600/25 blur-3xl [animation-delay:2s]" />
                <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:44px_44px]" />

                <Link href="/" className="relative w-fit"><ApplicationLogo className="text-3xl" /></Link>

                <div className="relative max-w-md">
                    <LogoMark detail="full" spin className="mb-8 animate-float text-[11rem] drop-shadow-[0_24px_48px_rgba(168,85,247,0.55)]" />
                    <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300"><Headphones size={13} /> Live music rooms</p>
                    <h2 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight">
                        Music is better
                        <br />
                        <span className="bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">together.</span>
                    </h2>
                    <ul className="mt-8 space-y-4">
                        {points.map(([Icon, head, text]) => (
                            <li key={head} className="flex items-start gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-violet-200"><Icon size={18} /></span>
                                <span><span className="block font-semibold">{head}</span><span className="text-sm text-neutral-400">{text}</span></span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="relative space-y-6">
                    <Bars />
                    {stats && (
                        <dl className="flex gap-8">
                            {([['Members', stats.members], ['Rooms', stats.rooms], ['Songs played', stats.songs]] as const).map(([label, value]) => (
                                <div key={label}><dt className="text-xs text-neutral-500">{label}</dt><dd className="text-2xl font-black tabular-nums">{value.toLocaleString()}</dd></div>
                            ))}
                            <div><dt className="text-xs text-neutral-500">Listening now</dt><dd className="flex items-center gap-2 text-2xl font-black tabular-nums text-green-400"><span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />{stats.listening}</dd></div>
                        </dl>
                    )}
                </div>
            </aside>

            {/* the form */}
            <main className="flex flex-col px-6 py-8 sm:px-10">
                <div className="flex items-center justify-between lg:justify-end">
                    <Link href="/" className="lg:hidden"><ApplicationLogo className="text-2xl" /></Link>
                    <Link href="/" className="text-sm text-neutral-400 hover:text-white">← Back to the home page</Link>
                </div>

                <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
                    {title && (
                        <div className="mb-7 animate-rise">
                            <h1 className="text-3xl font-black tracking-tight">{title}</h1>
                            {subtitle && <p className="mt-2 text-neutral-400">{subtitle}</p>}
                        </div>
                    )}
                    <div className="animate-rise [animation-delay:80ms]">{children}</div>
                    {aside && <div className="mt-6 animate-rise [animation-delay:160ms]">{aside}</div>}
                </div>

                <p className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-neutral-600">
                    <Link href={route('site.legal', 'terms')} className="hover:text-neutral-300">Terms</Link>
                    <Link href={route('site.legal', 'rules')} className="hover:text-neutral-300">Community rules</Link>
                    <Link href={route('site.legal', 'privacy')} className="hover:text-neutral-300">Privacy</Link>
                    <Link href={route('site.contact')} className="hover:text-neutral-300">Help</Link>
                </p>
            </main>

            <SupportWidget />
        </div>
    );
}
