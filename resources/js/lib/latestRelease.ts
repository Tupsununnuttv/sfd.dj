/** Small summary shared by the home page, dashboard and chat; the archive loads separately. */
export type Kind = 'new' | 'improved' | 'fixed';

export const latestRelease: { version: string; title: string; notes: [Kind, string][] } = {
    version: '1.82',
    title: 'Replies on staff applications',
    notes: [
        ['new', 'Staff can reply to a staff application in Admin panel → Applications. The applicant reads the replies on the Staff application page and can answer there.'],
        ['improved', 'Applications are reviewed by the staff roles only: Owner, Developer, Admin, Lead Moderator, Brand Ambassador, Site Moderator and Moderator. Brand Ambassadors, Site Moderators and Moderators open the Admin panel with just the Applications tab.'],
        ['improved', 'Lead Moderator and Moderator are new positions to apply for, on the website and with /apply in Discord.'],
        ['fixed', 'Applications sent on the website reach the staff channel in Discord again.'],
    ],
};

export const VERSION = latestRelease.version;
