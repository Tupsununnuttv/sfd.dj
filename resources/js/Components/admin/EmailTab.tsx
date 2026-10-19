import { copyText } from '@/lib/clipboard';
import { Card, ghostBtn, SectionTitle } from '@/Components/ui';
import { router } from '@inertiajs/react';
import { Check, CheckCircle2, Copy, MailWarning, Send } from 'lucide-react';
import { useState } from 'react';
import { AdminProps } from './types';

const ENV = `MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your.address@gmail.com
MAIL_PASSWORD=the-16-letter-app-password
MAIL_FROM_ADDRESS=your.address@gmail.com
MAIL_FROM_NAME="SFD-DJ.EU"`;

/** The mail server of the site: is it set up, a test message, and whether people must confirm their email. */
export default function EmailTab({ email, gotoTab }: { email: NonNullable<AdminProps['email']>; gotoTab: (tab: 'Users') => void }) {
    const [copied, setCopied] = useState(false);
    const [busy, setBusy] = useState(false);
    const copy = () => { void copyText(ENV).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }).catch(() => {}); };
    const test = () => router.post(route('admin.email.test'), {}, { preserveScroll: true, onStart: () => setBusy(true), onFinish: () => setBusy(false) });
    const choose = (verification: 'required' | 'optional') => router.put(route('admin.email'), { verification }, { preserveScroll: true });

    const row = (label: string, value: string) => <div className="flex justify-between gap-4 border-b border-white/5 py-2 text-sm last:border-0"><span className="text-neutral-500">{label}</span><span className="break-all text-right text-neutral-200">{value}</span></div>;
    const option = (value: 'required' | 'optional', title: string, text: string) => (
        <button type="button" onClick={() => email.choice !== value && choose(value)} aria-pressed={email.choice === value} data-choice={value} className={`rounded-xl border px-4 py-3 text-left transition ${email.choice === value ? 'border-violet-400/60 bg-violet-500/15 text-white' : 'border-white/10 bg-white/3 text-neutral-300 hover:bg-white/[0.07]'}`}>
            <span className="block text-sm font-semibold">{title}</span>
            <span className="mt-0.5 block text-xs text-neutral-400">{text}</span>
        </button>
    );

    return (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2" data-email-tab>
            <div className="space-y-3">
                <SectionTitle title="Mail server" hint="What sends the “confirm your email” message and the password reset mails." />
                <Card className="p-5">
                    <p className={`mb-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${email.configured ? 'border-green-500/30 bg-green-500/10 text-green-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-200'}`} data-mail-ready={email.configured}>
                        {email.configured ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <MailWarning size={18} className="mt-0.5 shrink-0" />}
                        {email.configured ? 'Ready: the site can send email.' : 'Not set up: every message is only written to storage/logs/laravel.log, nothing is sent.'}
                    </p>
                    {row('Mailer', email.mailer)}
                    {email.host && row('Server', `${email.host}:${email.port}`)}
                    {email.mailer === 'smtp' && row('Login', email.login_set ? 'set in .env' : 'not set in .env')}
                    {row('Sent from', email.from)}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button onClick={test} disabled={busy} className={`${ghostBtn} flex items-center gap-2`} data-test-mail><Send size={15} /> {busy ? 'Sending…' : 'Send a test email to me'}</button>
                    </div>
                    {email.test && (
                        <p className={`mt-3 rounded-xl border px-3 py-2.5 text-sm ${email.test.ok ? (email.test.configured ? 'border-green-500/30 bg-green-500/10 text-green-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-200') : 'border-red-500/30 bg-red-500/10 text-red-300'}`} data-test-result={email.test.ok ? 'ok' : 'failed'}>
                            {email.test.ok ? '' : 'It did not work: '}{email.test.message}
                        </p>
                    )}

                    {!email.configured && (
                        <div className="mt-5">
                            <p className="text-sm font-semibold">How to turn it on (for example with Gmail)</p>
                            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-neutral-400">
                                <li>On the Google account: turn on 2-step verification, then Security → App passwords, and make one for SFD-DJ.EU (16 letters).</li>
                                <li>Open the file <code className="rounded bg-white/10 px-1 text-violet-300">.env</code> in the project folder and put these lines in it, with your own address and the app password.</li>
                                <li>Save the file and press the test button here.</li>
                            </ol>
                            <div className="relative mt-3">
                                <pre className="overflow-x-auto rounded-xl border border-white/10 bg-neutral-950 p-4 pr-14 text-xs leading-relaxed text-neutral-300">{ENV}</pre>
                                <button onClick={copy} aria-label="Copy" className="absolute right-2 top-2 rounded-lg bg-white/10 p-2 text-neutral-300 hover:bg-white/20 hover:text-white">{copied ? <Check size={14} /> : <Copy size={14} />}</button>
                            </div>
                            <p className="mt-2 text-xs text-neutral-500">The password goes only in .env on the computer that runs the site: not in the admin panel, not in a chat.</p>
                        </div>
                    )}
                </Card>
            </div>

            <div className="space-y-3">
                <SectionTitle title="Confirming the email" hint="Must new members open the link we email them before they can chat, vote and DJ?" />
                <Card className="space-y-3 p-5">
                    <div className="grid gap-2 sm:grid-cols-2">
                        {option('required', 'Required', 'Members confirm their email first. Asked for only while the site can send email.')}
                        {option('optional', 'Optional', 'Everybody gets in at once. A bar invites them to confirm later.')}
                    </div>
                    <p className={`rounded-xl border px-3 py-2.5 text-sm ${email.enforced ? 'border-violet-400/30 bg-violet-500/10 text-violet-100' : 'border-white/10 bg-white/3 text-neutral-300'}`} data-enforced={email.enforced}>
                        {email.enforced
                            ? 'Right now: new members must confirm their email before they can chat, vote and DJ.'
                            : email.choice === 'required'
                                ? 'Right now: nobody has to confirm. “Required” starts the moment the site can send email, because until then the message cannot come.'
                                : 'Right now: nobody has to confirm. Everybody who signs up gets in at once.'}
                    </p>
                    <p className="text-sm text-neutral-400">
                        <span className="font-semibold text-neutral-200">{email.unverified}</span> {email.unverified === 1 ? 'person has' : 'people have'} not confirmed their email.{' '}
                        {email.unverified > 0 && <button onClick={() => gotoTab('Users')} className="text-violet-400 hover:underline">Users tab: confirm somebody by hand</button>}
                    </p>
                </Card>
            </div>
        </section>
    );
}
