import GuestLayout from '@/Layouts/GuestLayout';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, MailCheck, MailX } from 'lucide-react';

const button = 'flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 py-3 text-sm font-semibold text-white transition hover:opacity-90';

/**
 * Where the link in the "confirm your email" message lands when it is opened logged out, or logged in as another account (VerifyEmailController).
 * The account's own session goes straight on to the site instead.
 */
export default function EmailConfirmed({ confirmed, name }: { confirmed: boolean; name: string | null }) {
    const { auth } = usePage<PageProps>().props;
    const me = auth.guest ? null : auth.user.name;

    return (
        <GuestLayout
            title={confirmed ? 'Email confirmed' : 'This link no longer works'}
            subtitle={confirmed ? `Thanks, ${name}! The address is confirmed, so you can always get back in.` : 'A confirm link works for an hour, and only for the address it was sent to. This one is older, or the account has a new address since.'}
        >
            <Head title={confirmed ? 'Email confirmed' : 'Link no longer works'} />

            <div className="mb-6 flex items-start gap-4 rounded-2xl border border-white/10 bg-white/4 p-5" data-email-confirmed={confirmed ? 'yes' : 'no'}>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${confirmed ? 'bg-green-500/15 text-green-300' : 'bg-amber-500/15 text-amber-300'}`}>
                    {confirmed ? <MailCheck size={22} /> : <MailX size={22} />}
                </span>
                <p className="text-sm text-neutral-300">
                    {confirmed
                        ? me ? <>You are logged in here as <b>{me}</b>. To use the account of <b>{name}</b>, log out and log in as them.</> : 'Log in and carry on where you left off.'
                        : me ? 'Open the confirm page and ask for a new email. It goes to the address of the account you are logged in with.' : 'Log in, and the site offers to send a fresh link.'}
                </p>
            </div>

            <div className="space-y-3">
                {me ? (
                    <Link href={confirmed ? route('dashboard') : route('verification.notice')} className={button}>{confirmed ? `Carry on as ${me}` : 'Get a new link'} <ArrowRight size={16} /></Link>
                ) : (
                    <Link href={route('login')} className={button}>Log in <ArrowRight size={16} /></Link>
                )}
                {me && confirmed && (
                    <Link href={route('logout')} method="post" as="button" className="w-full rounded-lg bg-white/10 py-3 text-sm font-semibold text-neutral-100 transition hover:bg-white/15">Log out</Link>
                )}
            </div>
        </GuestLayout>
    );
}
