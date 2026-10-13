import SiteLayout, { PageHeader } from '@/Layouts/SiteLayout';
import { Head, Link } from '@inertiajs/react';

const values = [
    ['Together', 'Music is better when everyone hears the same moment. Every part of SFD-DJ.EU is built around that.'],
    ['Open to look at', 'Anyone can open a public room and watch. You only make an account when you want to join in.'],
    ['Safe by default', 'Hosts and moderators get real tools, and passwords are never stored in a readable form or sent to you.'],
    ['Open to build on', 'A public API and bot accounts, so the community can make the tools we did not think of.'],
];

export default function About() {
    return (
        <SiteLayout>
            <Head title="About" />
            <PageHeader crumbs={[['About']]} title="About SFD-DJ.EU" text="A place to share music live with people who care about the same song." />

            <section className="mx-auto max-w-3xl space-y-4 px-6 text-neutral-300">
                <p>SFD-DJ.EU is a set of live music rooms. In each room one person plays at a time while everyone else listens, chats and votes. When the song ends, the next person in the waitlist plays.</p>
                <p>Songs play through the official YouTube player, so there is nothing to download and no music is stored on our servers. SoundCloud and Spotify links are matched to the same song on YouTube.</p>
                <p>The site is built to feel like the classic social DJ rooms: roles, levels, badges, emotes and communities that make a room feel like a place, not just a playlist.</p>
            </section>

            <section className="mx-auto mt-14 grid max-w-6xl gap-4 px-6 sm:grid-cols-2">
                {values.map(([title, text]) => (
                    <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-6">
                        <h2 className="font-semibold">{title}</h2>
                        <p className="mt-1 text-sm text-neutral-400">{text}</p>
                    </div>
                ))}
            </section>

            <section className="mx-auto mt-14 flex max-w-3xl flex-wrap gap-3 px-6">
                <Link href={route('site.features')} className="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/20">See the features</Link>
                <Link href={route('site.contact')} className="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/20">Contact us</Link>
                <Link href={route('patch-notes')} className="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/20">What is new</Link>
            </section>
        </SiteLayout>
    );
}
