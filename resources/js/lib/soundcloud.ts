/**
 * SoundCloud songs play from SoundCloud, in its own player (the "widget"). Their `youtube_id` is "sc:" and the track's number (App\Services\Music),
 * so it can never be taken for a YouTube video id, and everything that copies a song (playlists, the waitlist, grabs) carries it along.
 */
export const isSoundCloud = (id: string | null | undefined): boolean => !!id?.startsWith('sc:');

/** What the widget wants to be told: the track's address in SoundCloud's API (the number is all it needs). */
export const soundcloudApiUrl = (id: string): string => `https://api.soundcloud.com/tracks/${id.slice(3)}`;

/** A quiet widget: the track and its picture, nothing to buy, share, like or wander off to. */
export const WIDGET_OPTIONS = {
    visual: true,
    hide_related: true,
    show_comments: false,
    show_user: true,
    show_reposts: false,
    show_teaser: false,
    show_playcount: false,
    buying: false,
    sharing: false,
    download: false,
    liking: false,
    color: '#a855f7',
} as const;

/** The widget as a page address, for an <iframe> (the room drives its own widget through the API instead, see soundcloudPlayer.ts). */
export const soundcloudEmbedUrl = (id: string, autoPlay = false): string =>
    `https://w.soundcloud.com/player/?${new URLSearchParams({ url: soundcloudApiUrl(id), auto_play: String(autoPlay), ...Object.fromEntries(Object.entries(WIDGET_OPTIONS).map(([key, value]) => [key, String(value)])) })}`;
