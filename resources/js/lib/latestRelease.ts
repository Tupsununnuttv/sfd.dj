/** Small summary shared by the home page, dashboard and chat; the archive loads separately. */
export type Kind = 'new' | 'improved' | 'fixed';

export const latestRelease: { version: string; title: string; notes: [Kind, string][] } = {
    version: '1.73',
    title: 'Your look, everywhere: profile fixes and browser improvements',
    notes: [
        ['fixed', 'Saving a selected shop character can now update your profile picture too. Selecting a character enables the profile-picture option; untick it to keep your uploaded photo while changing your room character.'],
        ['fixed', 'Purchases and saved looks refresh the surrounding room sidebar when the shop is open in an overlay, even without a working live connection. Your own older chat messages also use your current avatar and cosmetics.'],
        ['improved', 'Sidebar profile cards now separate your name, flag, role, level and XP. Names have more space, and XP numbers stay together instead of breaking into awkward fragments.'],
        ['fixed', 'Quick-profile cards and hover previews use the current avatar returned by the server. Saving a look or receiving a live member update clears the old profile cache so a previous message does not keep showing an outdated picture.'],
        ['fixed', 'The profile-picture option also works when you choose the character you already wear. Ownership and level checks still apply, and a failed validation leaves your uploaded photo intact.'],
        ['improved', 'The shop refreshes its saved preview from the server after saving. Character selection and the main undo and shuffle controls pause during requests to prevent conflicting changes.'],
        ['improved', 'Removed global background prefetching of unrelated page chunks and room scenes. Pages and panels keep loading their required files when opened.'],
        ['improved', 'More resilient browser behavior in Chrome, Edge, Firefox and Opera GX: clipboard fallbacks, compact-setting synchronization when browser channels are blocked, safer microphone cleanup and calls that retain separately delivered audio and video tracks.'],
        ['fixed', 'A blocked ringtone audio context no longer breaks the visual call invitation, and retrying browser-blocked call playback handles rejection safely.'],
        ['improved', 'Added repeatable browser checks for buying, equipping and saving a character, refreshing the room, opening the profile and updating cached quick-profile pictures. Shop checks use an isolated test database and also cover blocked live sockets and browser storage.'],
    ],
};

export const VERSION = latestRelease.version;
