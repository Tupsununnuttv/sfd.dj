import SiteCounters from '@/Components/SiteCounters';
import { SiteStats, useLiveStats } from '@/lib/useLiveStats';
import Avatar from '@/Components/Avatar';
import Crowd from '@/Components/Crowd';
import RoleBadge from '@/Components/RoleBadge';
import RoomBadge from '@/Components/RoomBadge';
import SiteLayout from '@/Layouts/SiteLayout';
import { latestRelease } from '@/lib/latestRelease';
import { features, Partner, partners } from '@/lib/siteContent';
import { countdown, until, useNow } from '@/lib/time';
import { PageProps, RoleInfo } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Calendar, Check, ChevronDown, Code2, Heart, PlugZap, Plus, Shirt, Sparkles, Trophy } from 'lucide-react';

interface HomeRoom {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    badges: string[] | null;
    genre: string | null;
    listening: number;
    now_playing: string | null;
    live_title: string | null; // a live stream is on the big screen
    items_count: number;
    user: { name: string };
}

interface Props {
    rooms: HomeRoom[];
    event: { id: number; title: string; description: string | null; starts_at: string; going: number; room: { name: string; slug: string } | null } | null;
    topDjs: { id: number; name: string; avatar: string | null; primary_role: RoleInfo; plays: number }[];
    genres: Record<string, number>;
    stats: SiteStats & { songs_played: number };
}

const btn = 'rounded-lg px-6 py-3 text-sm font-semibold transition';
const fallbackGenres = ['House', 'Hip-Hop', 'Rock', 'Pop', 'Electronic', 'Lo-fi', 'Jazz', 'Metal'];

const steps = [
    ['1', 'Pick a room', 'Browse live rooms by genre. No account needed to look around.'],
    ['2', 'Join the waitlist', 'Add songs from YouTube, SoundCloud or Spotify and wait for your turn.'],
    ['3', 'Listen and chat', 'Everyone hears the same second. Woot the good ones, talk about them.'],
];

const badges: [string, string][] = [['Owner', '#f43f5e'], ['Admin', '#ef4444'], ['Moderator', '#22c55e'], ['Helper', '#84cc16'], ['Artist', '#ec4899'], ['Music Producer', '#d946ef'], ['VIP', '#a855f7'], ['Supporter', '#fbbf24'], ['Beta Tester', '#2dd4bf'], ['Translator', '#60a5fa']];

const questions: [string, string][] = [
    ['Do I need an account?', 'Not to look around. As a guest you can open rooms, watch what is playing and read the chat. To chat, vote or DJ you need a free account.'],
    ['Where does the music come from?', 'Songs play through the official YouTube and SoundCloud players. Paste a YouTube, SoundCloud or Spotify link and SFD-DJ.EU finds the song for you.'],
    ['Is it really free?', 'Yes. Rooms, chat, playlists, the avatar shop and the API stay free. The Bronze, Silver, Gold, Plus, Pro and Premium subscriptions are optional upgrades; nothing free becomes paid.'],
    ['Can I make my own room?', 'Yes. Pick a name and a genre, set the rules, give roles to friends, or make it private.'],
];

/** The little picture on a partner's card: made for this page, not the partner's own logo. */
function PartnerMark({ mark }: { mark: Partner['mark'] }) {
    if (mark === 'plug') return <PlugZap size={28} className="text-emerald-300" />;

    return (
        <svg viewBox="0 0 48 48" width="28" height="28" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {mark === 'aurora' && (
                <>
                    <defs><linearGradient id="pm-aurora" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#34d399" /><stop offset=".55" stopColor="#38bdf8" /><stop offset="1" stopColor="#a78bfa" /></linearGradient></defs>
                    <path d="M6 34C14 14 22 14 24 24S34 36 42 12" stroke="url(#pm-aurora)" strokeWidth="4" />
                    <path d="M6 40C16 24 22 24 26 31S36 42 42 24" stroke="url(#pm-aurora)" strokeWidth="3" opacity=".55" />
                    <circle cx="36" cy="9" r="1.6" fill="#e0f2fe" /><circle cx="12" cy="10" r="1.2" fill="#e0f2fe" />
                </>
            )}
            {mark === 'record' && (
                <>
                    <circle cx="24" cy="24" r="17" stroke="#f0abfc" strokeWidth="3" />
                    <circle cx="24" cy="24" r="9" stroke="#c4b5fd" strokeWidth="2" opacity=".7" />
                    <circle cx="24" cy="24" r="3" fill="#f0abfc" />
                    <path d="M33 11a17 17 0 0 1 6 8" stroke="#fff" strokeWidth="2.4" opacity=".8" />
                </>
            )}
            {mark === 'cord' && (
                <>
                    <path d="M8 38C8 24 18 26 20 20S16 10 26 10 40 16 40 26" stroke="#7dd3fc" strokeWidth="3.4" />
                    <rect x="34" y="26" width="10" height="12" rx="2.5" fill="#7dd3fc" stroke="none" />
                    <path d="M37 22v4M41 22v4" stroke="#e0f2fe" strokeWidth="2.4" />
                </>
            )}
        </svg>
    );
}

/** A picture of a real room (public/images/home-room.png), to show what you get, with a few characters dancing in front of it and what plays right now. */
function Preview({ playing }: { playing: HomeRoom | undefined }) {
    return (
        <div className="relative pb-20">
            <div className="relative animate-float">
                <div className="absolute -inset-4 rounded-4xl bg-linear-to-br from-fuchsia-600/30 via-violet-600/20 to-sky-600/20 blur-2xl" />
                <img src="/images/home-room.png" alt="A SFD-DJ.EU room: the video, the DJ booth, the crowd on the dance floor and the chat" width={1909} height={923} className="relative w-full rounded-3xl border border-white/10 shadow-2xl" />
                {playing && (
                    <Link href={route('rooms.show', playing.slug)} className="absolute left-3 top-3 flex max-w-[85%] items-center gap-2 rounded-full border border-white/15 bg-black/75 px-3 py-1.5 text-xs backdrop-blur hover:border-violet-400/60">
                        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-green-400" />
                        <span className="truncate"><b>Now playing</b> in {playing.name}: {playing.now_playing}</span>
                    </Link>
                )}
            </div>
            <div className="absolute inset-x-0 bottom-0"><Crowd names={['neko', 'kikomochi', 'foxy']} height={150} /></div>
        </div>
    );
}

/** The Avatar shop on the home page: some of the characters dancing, and the way to dress up. */
function Showcase({ guest }: { guest: boolean }) {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-violet-600/20 via-white/3 to-fuchsia-600/10 p-7">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400"><Shirt size={14} /> Avatar shop</p>
            <h3 className="mt-3 text-2xl font-black">Dress up your DJ</h3>
            <p className="mt-2 max-w-lg text-neutral-400">Characters that dance when you woot and spin at the decks when it is your song. New ones come with updates, and some unlock as you level up.</p>
            <Crowd names={['milky', 'emberdragon', 'kikomochi', 'frostdragon', 'spooky']} height={150} lazy className="mt-6" />
            <Link href={guest ? route('register') : route('shop')} className="mt-6 inline-block text-sm font-semibold text-violet-400 hover:underline">{guest ? 'Make an account to dress up →' : 'Open the Avatar shop →'}</Link>
        </div>
    );
}

function EventCard({ event }: { event: NonNullable<Props['event']> }) {
    const c = countdown(event.starts_at, useNow(1000));

    return (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-fuchsia-600/20 via-violet-600/10 to-transparent p-7">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-200"><Calendar size={14} /> {c ? `Next event · ${until(event.starts_at)}` : 'Happening now'}</p>
            <h3 className="mt-3 text-2xl font-black">{event.title}</h3>
            {event.description && <p className="mt-2 line-clamp-2 text-neutral-300">{event.description}</p>}
            {c && (
                <div className="mt-5 flex gap-2">
                    {([['days', c.d], ['hours', c.h], ['min', c.m], ['sec', c.s]] as const).map(([l, n]) => (
                        <div key={l} className="min-w-14 rounded-xl bg-black/30 px-3 py-2 text-center"><p className="text-xl font-black tabular-nums">{String(n).padStart(2, '0')}</p><p className="text-[10px] uppercase tracking-wider text-neutral-400">{l}</p></div>
                    ))}
                </div>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                <span className="text-neutral-400">{event.going} going</span>
                {event.room && <Link href={route('rooms.show', event.room.slug)} className="font-semibold text-violet-300 hover:underline">🎧 {event.room.name}</Link>}
                <Link href={route('events')} className="ml-auto font-semibold text-violet-300 hover:underline">All events →</Link>
            </div>
        </div>
    );
}

export default function Welcome({ rooms, event, topDjs, genres, stats: initialStats }: Props) {
    const { stats: freshStats, stale } = useLiveStats(initialStats);
    const stats = freshStats ?? initialStats;
    const { auth, community } = usePage<PageProps>().props;
    const guest = auth.guest;
    const goal = community.donation;
    const genreList = Object.keys(genres).length ? Object.keys(genres) : fallbackGenres;
    const news = latestRelease;

    return (
        <SiteLayout>
            <Head title="Listen together" />

            {/* hero */}
            <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-16 pt-16 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
                <div>
                    <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-neutral-300">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" /> {stats.listening === null ? 'Live listener count temporarily unavailable' : `${stats.listening} ${stats.listening === 1 ? 'person is' : 'people are'} listening right now`}
                    </p>
                    <h1 className="mt-6 text-5xl font-black leading-[1.02] tracking-tight sm:text-7xl">
                        Your music room,
                        <br />
                        <span className="bg-linear-to-r from-fuchsia-500 to-violet-500 bg-clip-text text-transparent">live.</span>
                    </h1>
                    <p className="mt-6 max-w-lg text-lg text-neutral-400">Join a room, add songs and listen in perfect sync with everyone else, with live chat, a waitlist and a crowd that cares about the same song.</p>
                    <div className="mt-9 flex flex-wrap gap-3">
                        <Link href={guest ? route('register') : route('dashboard')} className={`${btn} inline-flex items-center gap-2 bg-linear-to-r from-fuchsia-500 to-violet-500 shadow-lg shadow-violet-900/30 hover:opacity-90`}>{guest ? 'Get started, it is free' : 'Open my rooms'} <ArrowRight size={16} /></Link>
                        <Link href={route('dashboard')} className={`${btn} bg-white/10 hover:bg-white/20`}>{guest ? 'Browse as guest' : 'Browse all rooms'}</Link>
                    </div>
                    <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-400">
                        {['Free to use', 'Nothing to download', 'Plays through YouTube and SoundCloud'].map((t) => <li key={t} className="flex items-center gap-1.5"><Check size={15} className="text-green-400" /> {t}</li>)}
                    </ul>
                </div>
                <Preview playing={rooms.find((r) => r.now_playing)} />
            </section>

            {/* numbers */}
            <section className="mx-auto max-w-4xl px-6">
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-4">
                    <div className="col-span-full"><SiteCounters stats={stats} stale={stale} /></div>
                </div>
            </section>

            {/* partners */}
            <section aria-labelledby="partners-title" className="mx-auto mt-16 max-w-6xl px-6">
                <p id="partners-title" className="text-center text-xs font-bold uppercase tracking-[0.22em] text-neutral-500">Our partners</p>
                <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {partners.map((p) => {
                        const inner = (
                            <>
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-white/10 to-white/3 ring-1 ring-white/10 transition group-hover:from-fuchsia-500/20 group-hover:to-violet-500/10"><PartnerMark mark={p.mark} /></span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-xl font-black tracking-tight">{p.name}</span>
                                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Partner</span>
                                </span>
                                {p.url && <ArrowRight size={16} className="shrink-0 text-neutral-600 transition group-hover:translate-x-1 group-hover:text-violet-300" />}
                            </>
                        );
                        const card = 'group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/4 px-5 py-4 transition';

                        return (
                            <li key={p.name}>
                                {p.url ? (
                                    <a href={p.url} target="_blank" rel="noopener noreferrer" className={`${card} hover:-translate-y-0.5 hover:border-violet-500/60 hover:bg-white/[0.07]`}>{inner}</a>
                                ) : (
                                    <div className={card}>{inner}</div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </section>

            {/* genres */}
            <section className="mx-auto mt-16 max-w-6xl px-6">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Find your sound</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    {genreList.map((g) => (
                        <Link key={g} href={`${route('dashboard')}?genre=${encodeURIComponent(g)}`} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:border-violet-400/60 hover:bg-violet-500/15">🎵 {g}{genres[g] ? <span className="ml-1.5 text-xs text-neutral-500">{genres[g]}</span> : null}</Link>
                    ))}
                </div>
            </section>

            {/* live rooms */}
            <section className="mx-auto mt-16 max-w-6xl px-6">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight">Live right now</h2>
                        <p className="mt-1 text-neutral-400">Step into a room that is already playing.</p>
                    </div>
                    <Link href={route('dashboard')} className="text-sm text-violet-400 hover:underline">All rooms →</Link>
                </div>
                {rooms.length === 0 ? (
                    <p className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6 text-neutral-400">No rooms yet. Be the first: register and create one.</p>
                ) : (
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {rooms.map((r) => (
                            <Link key={r.id} href={route('rooms.show', r.slug)} className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-0.5 hover:border-violet-500">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <h3 className="max-w-full truncate font-semibold">{r.name}</h3>
                                    <RoomBadge badges={r.badges} />
                                    {r.live_title && <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">Live</span>}
                                </div>
                                {r.genre && <span className="mt-1 inline-block rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] text-violet-300">🎵 {r.genre}</span>}
                                <p className="mt-3 truncate text-sm text-neutral-300">{r.live_title ? <>🔴 {r.live_title}</> : r.now_playing ? <>▶ {r.now_playing}</> : <span className="text-neutral-500">Waiting for the next DJ…</span>}</p>
                                <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                                    <span className={r.listening > 0 ? 'text-green-400' : ''}>● {r.listening} listening</span>
                                    <span>host {r.user.name}</span>
                                </div>
                            </Link>
                        ))}
                        <Link href={guest ? route('register') : route('dashboard')} className="flex min-h-36 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-white/15 p-5 text-center text-neutral-400 transition hover:border-violet-400/60 hover:bg-violet-500/10 hover:text-white">
                            <Plus size={22} />
                            <span className="font-semibold">Start your own room</span>
                            <span className="text-xs text-neutral-500">Pick a name and a genre, invite your friends. Free.</span>
                        </Link>
                    </div>
                )}
            </section>

            {/* features */}
            <section className="mx-auto mt-24 max-w-6xl px-6">
                <h2 className="text-3xl font-black tracking-tight">Everything a music room needs</h2>
                <p className="mt-1 text-neutral-400">Pick one to see how it works.</p>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((f, i) => (
                        <Link key={f.slug} href={route('site.feature', f.slug)} className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-violet-500 ${i === 0 ? 'lg:col-span-2' : i === features.length - 1 ? 'lg:col-span-3' : ''}`}>
                            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-500/15 blur-2xl transition group-hover:bg-fuchsia-500/25" />
                            <p className="text-3xl">{f.icon}</p>
                            <h3 className="mt-3 font-semibold">{f.title}</h3>
                            <p className="mt-1 text-sm text-neutral-400">{f.tagline}</p>
                            {i === 0 && <p className="mt-3 max-w-md text-sm text-neutral-500">{f.intro}</p>}
                            <p className="mt-4 flex items-center gap-1 text-sm font-semibold text-violet-400">Read more <ArrowRight size={14} className="transition group-hover:translate-x-1" /></p>
                        </Link>
                    ))}
                </div>
            </section>

            {/* how it works */}
            <section className="mx-auto mt-24 max-w-6xl px-6">
                <h2 className="text-3xl font-black tracking-tight">How it works</h2>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {steps.map(([n, title, text]) => (
                        <div key={n} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-r from-fuchsia-500 to-violet-500 text-sm font-bold">{n}</span>
                            <h3 className="mt-3 font-semibold">{title}</h3>
                            <p className="mt-1 text-sm text-neutral-400">{text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* the community: the next event, the top DJs and the Avatar shop (an odd last card takes the whole row) */}
            <section className="mx-auto mt-24 grid max-w-6xl grid-cols-1 gap-4 px-6 lg:grid-cols-2 lg:[&>*:last-child:nth-child(odd)]:col-span-2">
                {event && <EventCard event={event} />}
                {topDjs.length > 0 && (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400"><Trophy size={14} /> Top DJs</p>
                        <ul className="mt-4 space-y-3">
                            {topDjs.map((d, i) => (
                                <li key={d.id}>
                                    <Link href={route('users.show', d.id)} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/5">
                                        <span className="w-6 text-center text-lg">{['🥇', '🥈', '🥉'][i]}</span>
                                        <Avatar name={d.name} avatar={d.avatar} className="h-10 w-10" />
                                        <span className="min-w-0 flex-1 truncate font-semibold">{d.name}</span>
                                        <RoleBadge role={d.primary_role} />
                                        <span className="text-sm text-neutral-400">{d.plays} songs</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <Link href={route('community')} className="mt-4 inline-block text-sm font-semibold text-violet-400 hover:underline">Leaderboards →</Link>
                    </div>
                )}
                <Showcase guest={guest} />
            </section>

            {/* badges */}
            <section className="mx-auto mt-24 max-w-6xl px-6 text-center">
                <h2 className="text-3xl font-black tracking-tight">Roles, badges and levels</h2>
                <p className="mx-auto mt-2 max-w-xl text-neutral-400">Earn XP when your songs play, level up, and stand out in chat. Staff and supporters carry their own colours.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {badges.map(([label, color]) => <span key={label} className="rounded-full px-4 py-1.5 text-sm font-bold" style={{ color, backgroundColor: `${color}22` }}>{label}</span>)}
                </div>
            </section>

            {/* news */}
            <section className="mx-auto mt-24 max-w-6xl px-6">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400"><Sparkles size={14} /> What is new · v{news.version}</p>
                        <Link href={route('patch-notes')} className="text-sm font-semibold text-violet-400 hover:underline">All patch notes →</Link>
                    </div>
                    <h3 className="mt-3 text-2xl font-black">{news.title}</h3>
                    <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 text-sm text-neutral-300 sm:grid-cols-2">
                        {news.notes.slice(0, 6).map(([kind, text]) => (
                            <li key={text} className="flex gap-2"><span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${kind === 'new' ? 'bg-violet-400' : kind === 'improved' ? 'bg-sky-400' : 'bg-emerald-400'}`} />{text}</li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* questions */}
            <section className="mx-auto mt-24 max-w-3xl px-6">
                <h2 className="text-center text-3xl font-black tracking-tight">Quick questions</h2>
                <div className="mt-6 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5">
                    {questions.map(([q, a]) => (
                        <details key={q} className="group p-5">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{q}<ChevronDown size={18} className="shrink-0 text-neutral-500 transition group-open:rotate-180" /></summary>
                            <p className="mt-3 text-sm text-neutral-400">{a}</p>
                        </details>
                    ))}
                </div>
                <p className="mt-4 text-center text-sm"><Link href={route('faq')} className="text-violet-400 hover:underline">More answers in the FAQ →</Link></p>
            </section>

            {/* developers + donation */}
            <section className="mx-auto mt-24 grid max-w-6xl grid-cols-1 gap-4 px-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
                    <p className="text-violet-300"><Code2 size={28} /></p>
                    <h2 className="mt-3 text-2xl font-black">Build on SFD-DJ.EU</h2>
                    <p className="mt-2 text-neutral-400">A public API, bot accounts and an npm package. Make a room bot or a browser extension in a few lines.</p>
                    <Link href={route('site.developers')} className="mt-5 inline-block text-sm font-semibold text-violet-400 hover:underline">For developers →</Link>
                </div>
                {goal ? (
                    <div className="rounded-2xl border border-pink-500/30 bg-pink-500/5 p-8">
                        <p className="text-pink-400"><Heart size={28} /></p>
                        <h2 className="mt-3 text-2xl font-black">{goal.title}</h2>
                        <p className="mt-2 text-neutral-400">{goal.currency}{goal.current} of {goal.currency}{goal.goal} ({goal.percent}%)</p>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-linear-to-r from-pink-500 to-fuchsia-500" style={{ width: `${goal.percent}%` }} /></div>
                        {goal.url && <a href={goal.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block rounded-lg bg-pink-500 px-5 py-2 text-sm font-semibold hover:bg-pink-400">Donate</a>}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
                        <p className="text-3xl">🎉</p>
                        <h2 className="mt-3 text-2xl font-black">Free, for everyone</h2>
                        <p className="mt-2 text-neutral-400">Rooms, chat, playlists and the avatar shop cost nothing today.</p>
                        <Link href={route('site.pricing')} className="mt-5 inline-block text-sm font-semibold text-violet-400 hover:underline">See pricing →</Link>
                    </div>
                )}
            </section>

            {/* final call */}
            {guest && (
                <section className="mx-auto mt-24 max-w-3xl px-6 text-center">
                    <Crowd names={['bun', 'wolfie', 'panda', 'robo']} height={120} lazy className="mb-8" />
                    <h2 className="text-4xl font-black tracking-tight">Ready to play the next song?</h2>
                    <p className="mt-3 text-neutral-400">Make an account in a minute. Free.</p>
                    <Link href={route('register')} className={`${btn} mt-6 inline-block bg-linear-to-r from-fuchsia-500 to-violet-500 hover:opacity-90`}>Create account</Link>
                </section>
            )}
        </SiteLayout>
    );
}
