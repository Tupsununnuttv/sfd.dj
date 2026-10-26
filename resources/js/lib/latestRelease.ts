/** Small summary shared by the home page, dashboard and chat; the archive loads separately. */
export type Kind = 'new' | 'improved' | 'fixed';

export const latestRelease: { version: string; title: string; notes: [Kind, string][] } = {
    version: '1.79',
    title: 'Desktop 1.4.0: Discord presence and updates',
    notes: [
        ['new', 'Desktop 1.4.0 adds Discord Rich Presence with the SFD logo, app name and elapsed time. Discord activity sharing must be enabled.'],
        ['improved', 'Discord presence reconnects automatically and clears when the desktop app closes.'],
        ['new', 'Check for updates includes startup and six-hour checks, update notices and the official download page.'],
        ['fixed', 'Firefox on Windows can download Desktop when the Windows version cannot be confirmed. Setup still requires Windows 11.'],
        ['improved', 'Install Desktop 1.4.0 once to enable these features. Your saved login and preferences stay in place.'],
    ],
};

export const VERSION = latestRelease.version;
