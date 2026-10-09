import SiteLayout, { PageHeader } from '@/Layouts/SiteLayout';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

const code = `import { SfdDj } from 'sfddj';

const sfd = new SfdDj({ token: process.env.SFDDJ_TOKEN, baseUrl: '${typeof window !== 'undefined' ? window.location.origin : 'https://your-site'}' });

const bot = sfd.bot('my-room-slug')
    .command('ping', () => bot.say('pong!'))
    .on('songChange', (song) => song && bot.say(\`Now playing: \${song.title}\`));

await bot.start();`;

const cards = [
    ['🤖', 'Room bots', 'Greet people, run commands like !ping, announce songs, moderate. A bot is its own account with a 🤖 badge and only does what its room role allows.'],
    ['🧩', 'Extensions', 'A personal token acts as you, so your own browser extension or script can chat, vote and queue songs.'],
    ['🛠️', 'Tools', 'Read rooms, chat and the waitlist as JSON for dashboards, overlays and stats.'],
];

const steps = [
    ['Make an account', 'Developers use a normal SFD.DJ account.'],
    ['Open Settings → Developers', 'Create a bot, or a personal token. The token is shown once.'],
    ['Call the API', 'Send Authorization: Bearer YOUR_TOKEN to /api/v1/…, or install the npm package.'],
    ['Give the bot a role', 'In your room: Room settings → Roles. Without a role it can only read and chat.'],
];

export default function Developers() {
    const guest = usePage<PageProps>().props.auth.guest;

    return (
        <SiteLayout>
            <Head title="Developers" />
            <PageHeader crumbs={[['Developers']]} title="Build on SFD.DJ" text="A public JSON API, bot accounts and an npm package. Everything passes the same permission checks as the website." />

            <section className="mx-auto grid max-w-6xl gap-4 px-6 md:grid-cols-3">
                {cards.map(([icon, title, text]) => (
                    <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-6">
                        <p className="text-3xl">{icon}</p>
                        <h2 className="mt-3 font-semibold">{title}</h2>
                        <p className="mt-1 text-sm text-neutral-400">{text}</p>
                    </div>
                ))}
            </section>

            <section className="mx-auto mt-14 grid max-w-6xl gap-8 px-6 lg:grid-cols-2">
                <div>
                    <h2 className="text-2xl font-black">Start in four steps</h2>
                    <ol className="mt-4 space-y-4">
                        {steps.map(([title, text], i) => (
                            <li key={title} className="flex gap-4">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 text-sm font-bold">{i + 1}</span>
                                <div><p className="font-semibold">{title}</p><p className="text-sm text-neutral-400">{text}</p></div>
                            </li>
                        ))}
                    </ol>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link href={guest ? route('register') : route('settings.developers')} className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-5 py-2.5 text-sm font-semibold hover:opacity-90">{guest ? 'Create an account' : 'Get a token'}</Link>
                        <Link href={`${route('docs')}#developers`} className="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/20">API reference</Link>
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-black">A bot in ten lines</h2>
                    <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-300">{code}</pre>
                    <p className="mt-3 text-sm text-neutral-500"><code className="rounded bg-white/10 px-1.5 py-0.5 text-violet-300">npm install sfddj</code>: no dependencies, works in Node 18+ and the browser.</p>
                </div>
            </section>

            <section className="mx-auto mt-14 max-w-6xl px-6">
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-neutral-400">
                    <p className="font-semibold text-neutral-200">Good to know</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li>120 requests a minute per token. Chat 60 a minute, whispers 30.</li>
                        <li>Keep tokens secret. Never put one in a public repository or a shared extension.</li>
                        <li>Do not use the API to spam, scrape private data or get around bans. See the <Link href={route('site.legal', 'terms')} className="text-violet-400 hover:underline">Terms</Link>.</li>
                    </ul>
                </div>
            </section>
        </SiteLayout>
    );
}
