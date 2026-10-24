/** Small summary shared by the home page, dashboard and chat; the archive loads separately. */
export type Kind = 'new' | 'improved' | 'fixed';

export const latestRelease: { version: string; title: string; notes: [Kind, string][] } = {
    version: '1.76',
    title: 'System settings, lighter rooms and guest viewers',
    notes: [
        ['new', 'Settings > System > Performance includes Low performance mode for older computers and laptops. It uses still characters, a lightweight room background and fewer decorative effects while keeping music, chat and room controls available.'],
        ['new', 'Control animated characters, background motion and particles, visual effects such as blur and shadows, and the lightweight room background separately. Low performance mode temporarily overrides these choices and restores them when switched off. System animation settings also take priority over Always play animations.'],
        ['improved', 'Performance preferences apply immediately, save to your account and update the room when changed from the profile overlay. Closing the overlay keeps pending saves running, and supported open tabs receive the updated preferences. System settings also explain where to change hardware acceleration in your browser.'],
        ['fixed', 'Background room refreshes no longer overwrite recently saved performance choices. Failed saves restore the last confirmed settings and show a message. Keyboard focus stays visible when shadows are disabled.'],
        ['improved', 'Room and chat portraits use still thumbnails, and character animations load when needed instead of preloading every dance and DJ pose. Selected complex characters use pre-rendered animation loops to reduce rendering work.'],
        ['improved', 'The site loads the selected language dictionary and opens heavier panels when needed. Smaller room updates and lighter room cards reduce unnecessary loading and processing across the home page, dashboard and listening rooms.'],
        ['new', 'Visitors without an account appear as Guest viewers in the room Users list and viewer counts. Guests can watch without registering; chat and account actions still require sign-in. Tabs sharing the same session use one guest identity, and inactive guests expire automatically.'],
        ['new', 'Room cards on the home page, dashboard and Live page show the configured selfbot name when a room has one.'],
        ['new', 'Reddit, Instagram, Facebook and X (Twitter) join Settings > Connections with account authorization and disconnect controls. Linking becomes available once each provider app is configured for the site. Instagram linking supports Business and Creator accounts.'],
        ['fixed', 'Removed the blinking light from the centre of the Elementary character mask and made the Cancer mark larger and higher on its back.'],
    ],
};

export const VERSION = latestRelease.version;
