/** What became of a "confirm your email" message: the server's last word of "verification-link-sent" and the like. */
export type MailState = 'sent' | 'not-set-up' | 'failed';

export const mailState = (status?: string | null): MailState | null => {
    const word = status?.replace('verification-link-', '');

    return word === 'sent' || word === 'not-set-up' || word === 'failed' ? word : null;
};

/** What to tell somebody about each of them. */
export const MAIL_TEXT: Record<MailState, { tone: 'good' | 'warn' | 'bad'; head: string; text: string }> = {
    sent: { tone: 'good', head: 'The email is on its way', text: 'Nothing there after a minute? Look in your Spam or Junk folder, or send it again.' },
    'not-set-up': { tone: 'warn', head: 'This site cannot send email yet', text: 'The owner has not set up a mail server, so no message can arrive. You do not need it: everything works without confirming.' },
    failed: { tone: 'bad', head: 'The mail server did not take the message', text: 'Try again in a minute. If it keeps failing, ask SFD.DJ staff in the chat bubble to confirm you by hand.' },
};

export const TONE = {
    good: 'border-green-500/30 bg-green-500/10 text-green-300',
    warn: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    bad: 'border-red-500/30 bg-red-500/10 text-red-300',
} as const;
