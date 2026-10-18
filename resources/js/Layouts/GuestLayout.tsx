import SiteCounters from '@/Components/SiteCounters';
import { useLiveStats } from '@/lib/useLiveStats';
import ApplicationLogo, { LogoMark } from '@/Components/ApplicationLogo';
import Crowd from '@/Components/Crowd';
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

/** Who dances on the brand panel's stage. The middle three dance above the form on phones. */
const dancers = ['robo', 'neko', 'kikomochi', 'pandabear', 'foxy'];

/** A row of bars that dance: the light wall behind the crowd. */
function Bars({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-end justify-between gap-1.5 ${className}`} aria-hidden>
            {Array.from({ length: 28 }, (_, i) => (
                <span key={i} className="w-1.5 animate-eq rounded-full bg-linear-to-t from-fuchsia-500/70 to-violet-400/70" style={{ height: `${30 + ((i * 37) % 70)}%`, animationDelay: `${(i % 9) * 0.13}s`, animationDuration: `${0.9 + (i % 5) * 0.18}s` }} />
            ))}
        </div>
    );
}

/** "Log in | Create account" on top of those two forms. */
function Switcher({ current }: { current: 'login' | 'register' }) {
    return (
        <nav aria-label="Log in or create an account" className="mb-7 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/40 p-1 text-sm font-semibold">
            {(['login', 'register'] as const).map((name) => (
                <Link
                    key={name}
                    href={route(name)}
                    aria-current={current === name ? 'page' : undefined}
                    className={`rounded-lg py-2 text-center transition ${current === name ? 'bg-linear-to-r from-fuchsia-500 to-violet-500 text-white shadow-lg shadow-violet-950/50' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                >
                    {name === 'login' ? 'Log in' : 'Create account'}
                </Link>
            ))}
        </nav>
    );
}

/**
 * The frame of every log in / register / password page: a brand panel on the left (wide screens), with the crowd dancing on a stage, and the form
 * in a card on the right. `switcher` puts the Log in / Create account tabs on top of the card; `aside` (saved accounts) goes under it.
 */
export default function Guest({ children, aside, title, subtitle, switcher }: PropsWithChildren<{ aside?: ReactNode; title?: ReactNode; subtitle?: ReactNode; switcher?: 'login' | 'register' }>) {
    const liveStats = useLiveStats(usePage<PageProps>().props.siteStats);

    return (
        <div className="grid min-h-screen bg-neutral-950 text-neutral-100 lg:grid-cols-[1.05fr_1fr]">
            {/* brand panel */}
            <aside className="relative hidden gap-6 overflow-hidden bg-linear-to-br from-violet-950 via-neutral-950 to-fuchsia-950 px-12 py-10 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between">
                <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 animate-float rounded-full bg-fuchsia-600/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 right-0 h-112 w-md animate-float rounded-full bg-violet-600/25 blur-3xl [animation-delay:2s]" />
                <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] bg-size-[44px_44px]" />

                <Link href="/" className="relative w-fit"><ApplicationLogo className="text-3xl" /></Link>

                <div className="relative">
                    <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300"><Headphones size={13} /> Live music rooms</p>
                    <h2 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight">
                        Music is better
                        <br />
                        <span className="bg-linear-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">together.</span>
                    </h2>
                </div>

                {/* the stage: the logo spins on the decks, the crowd dances in front of the light wall */}
                <div className="relative max-w-xl rounded-3xl border border-white/10 bg-black/35 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm" data-stage>
                    <div className="flex items-center gap-4">
                        <LogoMark detail="full" spin className="shrink-0 text-[4rem] drop-shadow-[0_12px_28px_rgba(168,85,247,0.55)]" />
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-fuchsia-300">On the decks</p>
                            <p className="text-lg font-bold leading-snug">Your song could be next</p>
                            <p className="text-sm text-neutral-400">Join the waitlist, and the whole room hears it with you.</p>
                        </div>
                    </div>
                    <div className="relative mt-2">
                        <Bars className="absolute inset-x-3 bottom-6 h-24 opacity-40" />
                        <Crowd names={dancers} height={168} />
                    </div>
                </div>

                <ul className="relative grid max-w-xl grid-cols-3 gap-5 [@media(max-height:880px)]:hidden">
                    {points.map(([Icon, head, text]) => (
                        <li key={head}>
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-violet-200"><Icon size={18} /></span>
                            <span className="mt-2 block font-semibold">{head}</span>
                            <span className="text-sm text-neutral-400">{text}</span>
                        </li>
                    ))}
                </ul>

                <div className="relative"><SiteCounters {...liveStats} /></div>

            </aside>

            {/* the form */}
            <main className="flex flex-col px-5 py-6 bg-[radial-gradient(40rem_24rem_at_50%_-4rem,rgba(139,92,246,0.16),transparent)] sm:px-10 sm:py-8 xl:pr-28">
                <div className="mb-5 lg:hidden"><SiteCounters {...liveStats} /></div>
                <div className="flex items-center justify-between lg:justify-end">
                    <Link href="/" className="lg:hidden"><ApplicationLogo className="text-2xl" /></Link>
                    <Link href="/" className="text-sm text-neutral-400 hover:text-white">← Back to the home page</Link>
                </div>

                <Crowd names={dancers.slice(1, 4)} height={92} className="mt-5 lg:hidden" />

                <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
                    <div className="sm:rounded-3xl sm:border sm:border-white/10 sm:bg-neutral-900/70 sm:p-8 sm:shadow-2xl sm:shadow-black/50" data-auth-card>
                        {switcher && <Switcher current={switcher} />}
                        {title && (
                            <div className="mb-7 animate-rise">
                                <h1 className="text-3xl font-black tracking-tight">{title}</h1>
                                {subtitle && <p className="mt-2 text-neutral-400">{subtitle}</p>}
                            </div>
                        )}
                        <div className="animate-rise [animation-delay:80ms]">{children}</div>
                    </div>
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
