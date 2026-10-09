import { MAIL_TEXT, mailState } from '@/lib/verification';
import { PageProps } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { MailWarning, X } from 'lucide-react';
import { useState } from 'react';

/** For somebody who has not confirmed their email yet (and the site can send it): a bar at the top of the page with a Send button. They can hide it for now when it is not required. */
export default function VerifyBanner() {
    const { verification } = usePage<PageProps>().props;
    const [busy, setBusy] = useState(false);
    const [hidden, setHidden] = useState(() => { try { return sessionStorage.getItem('sfddj.verify-banner') === '1'; } catch { return false; } });

    if (!verification || hidden || (!verification.mail && !verification.required)) return null;

    const state = mailState(verification.status);
    const note = state ? MAIL_TEXT[state] : null;
    const send = () => router.post(route('verification.send'), {}, { preserveScroll: true, onStart: () => setBusy(true), onFinish: () => setBusy(false) });
    const hide = () => { setHidden(true); try { sessionStorage.setItem('sfddj.verify-banner', '1'); } catch { /* private mode */ } };

    return (
        <div className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm ${state === 'failed' ? 'border-red-500/30 bg-red-500/10 text-red-200' : state === 'sent' ? 'border-green-500/30 bg-green-500/10 text-green-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-100'}`} data-verify-banner role="status">
            <MailWarning size={18} className="shrink-0" />
            <p className="min-w-0 flex-1">
                {note ? <><span className="font-semibold">{note.head}.</span> {state === 'sent' ? 'Look in your inbox, and in the Spam folder.' : note.text}</> : verification.required ? 'Confirm your email to chat, vote and DJ.' : 'Your email is not confirmed yet. Confirm it, so you can get back in if you forget your password.'}
            </p>
            <button onClick={send} disabled={busy} className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25 disabled:opacity-50">{busy ? 'Sending…' : state === 'sent' ? 'Send it again' : 'Send the email'}</button>
            {!verification.required && <button onClick={hide} aria-label="Hide this" className="rounded p-1 text-current opacity-70 hover:opacity-100"><X size={16} /></button>}
        </div>
    );
}
