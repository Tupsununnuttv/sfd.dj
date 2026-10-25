/** Small summary shared by the home page, dashboard and chat; the archive loads separately. */
export type Kind = 'new' | 'improved' | 'fixed';

export const latestRelease: { version: string; title: string; notes: [Kind, string][] } = {
    version: '1.78',
    title: 'Desktop setup, clearer controls and site moderation',
    notes: [
        ['new', 'Downloads now offers SFD DJ Desktop for Windows 11 with an SFD-branded Setup, installation folder selection and desktop shortcuts.'],
        ['improved', 'Setup supports 12 languages and automatically installs missing or outdated .NET Desktop Runtime, Visual C++ Redistributable and WebView2 components.'],
        ['improved', 'Join Waitlist and Leave Waitlist explain their actions, ETA and locked or full queues on hover, keyboard focus or the information button.'],
        ['improved', 'Woot, Grab and Meh include action help, with touch controls and the existing Autowoot option.'],
        ['new', 'Authorized site staff can use IP Ban and HWBAN from quick and full profiles, with a reason, confirmation and protection for their own or higher-ranked accounts.'],
        ['new', 'Desktop 1.2.0 adds Windows HWID support. Browser device bans use saved site data; Windows device bans apply in the updated desktop app. Raw hardware IDs are not stored.'],
        ['new', 'Admin > Device bans lists active device bans and allows removal. Permissions Matrix controls device bans separately from IP bans and room moderation.'],
        ['improved', 'SFD DJ Equalizer is marked Coming Soon on Downloads.'],
    ],
};

export const VERSION = latestRelease.version;
