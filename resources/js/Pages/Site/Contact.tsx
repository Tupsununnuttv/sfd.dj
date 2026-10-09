import SiteLayout, { PageHeader } from '@/Layouts/SiteLayout';
import SocialIcon from '@/Components/SocialIcon';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

const topics = [
    ['A problem or a bug', 'Say what you did, what you expected and what happened. A screenshot helps.'],
    ['An account question', 'Locked out, wrong email, a ban you think is a mistake. We never ask for your password.'],
    ['Reporting someone', 'Use the room\'s moderators first. For serious cases, tell us the room and the person\'s name.'],
    ['Ideas and partnerships', 'Want a Verified or Partnered room, or have an idea? Tell us.'],
];

export default function Contact() {
    const { community } = usePage<PageProps>().props;
    const social = Object.entries(community.social);

    return (
        <SiteLayout>
            <Head title="Contact" />
            <PageHeader crumbs={[['Contact']]} title="Contact us" text="The fastest way is the live chat. No account needed." />

            <section className="mx-auto grid max-w-6xl gap-6 px-6 lg:grid-cols-2">
                <div className="rounded-xl border border-violet-500/40 bg-violet-600/10 p-8">
                    <p className="text-3xl">💬</p>
                    <h2 className="mt-3 text-xl font-bold">Live support</h2>
                    <p className="mt-2 text-neutral-300">Press the chat bubble in the bottom right corner and write your message. You can close the page and come back: the conversation stays on this device and our answer is waiting.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-8">
                    <h2 className="text-xl font-bold">Also</h2>
                    <ul className="mt-3 space-y-3 text-sm text-neutral-300">
                        <li>Read the <Link href={route('faq')} className="text-violet-400 hover:underline">FAQ</Link> and the <Link href={route('docs')} className="text-violet-400 hover:underline">documentation</Link>: most questions are answered there.</li>
                        <li>See what is new in the <Link href={route('patch-notes')} className="text-violet-400 hover:underline">patch notes</Link>.</li>
                        {social.length > 0 && (
                            <li className="flex flex-wrap items-center gap-3">
                                Find us on
                                {social.map(([key, url]) => <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-violet-400 hover:underline"><SocialIcon name={key} size={14} /> <span className="capitalize">{key}</span></a>)}
                            </li>
                        )}
                    </ul>
                </div>
            </section>

            <section className="mx-auto mt-10 max-w-6xl px-6">
                <h2 className="text-xl font-bold">What to write about</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {topics.map(([title, text]) => (
                        <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-5">
                            <h3 className="font-semibold">{title}</h3>
                            <p className="mt-1 text-sm text-neutral-400">{text}</p>
                        </div>
                    ))}
                </div>
            </section>
        </SiteLayout>
    );
}
