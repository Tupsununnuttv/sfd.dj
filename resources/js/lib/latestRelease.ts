/** Small summary shared by the home page, dashboard and chat; the archive loads separately. */
export type Kind = 'new' | 'improved' | 'fixed';

export const latestRelease: { version: string; title: string; notes: [Kind, string][] } = {
    version: '1.77',
    title: "Calavera, Compact and early room updates",
    notes: [
        ["new", "Calavera joins the avatar shop with Standing, Dancing and DJing poses, plus a larger room display and shop preview."],
        ["improved", "Settings > Appearance now has one Compact switch for the site, room layout and chat. The chat toolbar keeps its own density button."],
        ["improved", "Keep me logged in is enabled by default. Password and Discord sign-ins, completed two-factor logins and new registrations can stay signed in after closing the browser."],
        ["new", "Language & Time supports 12 languages, including Brazilian Portuguese. Language changes apply across the interface immediately and save with your 12/24-hour time preference."],
        ["new", "Join our Discord is available on the home page, dashboard, login and registration pages, and in the room More menu. The community invite opens in a new tab."],
        ["new", "Scheduled room features reach Verified, Partnered or Featured rooms 3 days early, then open to all rooms automatically. Early access belongs to the room and its visitors."],
        ["new", "Admin > Room updates controls release schedules and pausing. Permissions Matrix has a separate release permission, search, filters and individual controls for roles, badges, subscriptions, support and email."],
        ["improved", "Entrance sounds now lives in Settings > Audio and saves to your account. Video display controls sit slightly lower in the player."],
        ["improved", "Monthly and yearly plans share expanded tier perks, including XP boosts, playlist limits, priority queue and profile, chat, song and room customization."],
        ["fixed", "Compact changes stay visible during background refreshes and save even when the settings overlay closes. Rapid toggles and failed saves preserve the latest confirmed layout."],
    ],
};

export const VERSION = latestRelease.version;
