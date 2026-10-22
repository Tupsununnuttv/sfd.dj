/** Small summary shared by the home page, dashboard and chat; the archive loads separately. */
export type Kind = 'new' | 'improved' | 'fixed';

export const latestRelease: { version: string; title: string; notes: [Kind, string][] } = {
    version: '1.75',
    title: 'Better room playback controls',
    notes: [
        ['fixed', 'Touch devices use lighter room rendering to reduce intermittent black or missing header and chat areas: static avatar thumbnails, simpler decorative effects, and no stacked blur layers from room CSS. Decorative background motion and particles are disabled on touch devices; video, music and dancing stage characters remain available. This also applies in landscape and desktop-site mode.'],
        ['new', 'The room video has theatre mode, fullscreen and a separate video window. Theatre mode enlarges the existing player inside the room without restarting it.'],
        ['new', 'Open a small video window while staying in the room. The video starts at the current song position and stays muted; sound and volume remain in the room. Supported browsers use an always-on-top picture-in-picture window, with a regular pop-out window as the fallback.'],
        ['improved', 'YouTube playback now exposes its own player controls and settings, including video quality choices such as 720p when available for the video.'],
        ['improved', 'Video display controls appear on hover, keyboard focus and touch screens. Fullscreen keeps the buttons at a readable size, and blocked pop-out windows show a clear message.'],
        ['improved', 'Moved Open on YouTube and Open on SoundCloud slightly lower in the playback area. Room CSS can also style the video display controls.'],
    ],
};

export const VERSION = latestRelease.version;
