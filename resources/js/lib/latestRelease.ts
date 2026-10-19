/** Small summary shared by the home page, dashboard and chat; the archive loads separately. */
export type Kind = 'new' | 'improved' | 'fixed';

export const latestRelease: { version: string; title: string; notes: [Kind, string][] } = {
    version: '1.72',
    title: 'Instant compact controls, better Whispers and new shop arrivals',
    notes: [
        ['new', 'Compact chat and Compact room layout join the overall Compact preference in Settings > Appearance. Chat also has a quick density toggle. All three choices apply immediately, save to your account and synchronize between settings overlays and supported open tabs.'],
        ['new', 'Bamboo Panda (level 5) and Vesper & Pip (level 22) join the Avatar Shop, each with separate standing, dancing and DJ animations.'],
        ['improved', 'Whisper calls ring before connecting and show Accept and Decline controls. Microphone and camera preparation starts after acceptance, with clearer ringing and connection states.'],
        ['fixed', 'Rapid compact-setting changes no longer let an older save overwrite your latest choice. Closing the room settings overlay keeps pending saves running; a failed save restores the confirmed choice and shows a notice.'],
        ['new', 'Delete your own text and voice messages in Whispers, with confirmation. Deleted messages and their reply previews disappear for participants in real time, and deleted voice recordings are removed.'],
        ['new', 'Whisper group owners can delete a group for everyone, including its messages and voice recordings. Other members can still leave a group separately.'],
        ['improved', 'Video calls can continue with audio when a camera is missing or unavailable, while still receiving the other person\'s video. Voice calls no longer show an empty video area.'],
        ['fixed', 'Corrected call-description formatting that caused invalid SDP errors, improved connection-candidate handling on slower networks and prevented other tabs from taking over the same call.'],
        ['new', 'Six new Avatar Shop effects: Firefly Garden, Prism Butterflies, Aurora Veil, Holographic Pulse, Meteor Shower and Solar Eclipse.'],
        ['new', 'Meet the Lunar Fox Companion accessory at level 24 and the Legendary Phoenix Heart badge at level 30.'],
        ['new', 'Celestial Terrace is a new room background with a moonlit observatory, ringed planet, crystal details and an open dance floor. Choose it in Room settings > Custom backgrounds.'],
        ['fixed', 'Newly uploaded and archived custom room backgrounds now keep a database-backed copy so replacing local files during a site update does not lose the picture. Existing uploads can be archived before deployment, and seasonal changes no longer override a selected custom picture.'],
        ['improved', 'The Avatar Shop uses lightweight character posters and loads dance previews on hover, reducing the initial download and animation work. The larger try-on preview still shows the character in motion.'],
        ['improved', 'Room settings uses small, lazy-loaded background thumbnails and loads additional settings panels when needed. Background browsing no longer renders every full scene at once.'],
        ['improved', 'Dashboard and admin requests load data only when needed, with fewer repeated database queries. Home, dashboard and chat load a small latest-release summary while the full Patch Notes archive loads separately.'],
        ['improved', 'Login attempts using an account\'s username or email share the same limit. Password recovery uses a consistent public response, and changing an email address revokes other sessions, remembered logins and API tokens.'],
        ['fixed', 'New Discord staff applications show https://sfd-dj.eu/ instead of a localhost or loopback account link.'],
        ['fixed', 'Fixed the ChatPanel emoji-helper export that interrupted Vite Fast Refresh during development.'],
    ],
};

export const VERSION = latestRelease.version;
