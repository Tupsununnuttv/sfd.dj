/** What the playlist manager and the footbar of a room share: the shapes of the data, and a few ways of writing a time. */

export interface PlaylistInfo {
    id: number;
    name: string;
    kind: 'custom';
    is_active: boolean;
    songs_count: number;
    songs_sum_duration: number | string | null; // seconds
}

export interface Song {
    id: number;
    youtube_id: string;
    title: string;
    channel: string | null;
    thumbnail: string | null;
    duration: number;
    origin: 'youtube' | 'soundcloud' | 'spotify';
    position?: number;
}

/** The footbar's view: my lists (one of them active) and the next track of the active one. */
export interface Deck {
    lists: { id: number; name: string; is_active: boolean; songs_count: number }[];
    next: Song | null;
}

export const originLabel = { youtube: 'YouTube', soundcloud: 'SoundCloud', spotify: 'Spotify' } as const;

/** 3:21 or 1:02:09 */
export const mmss = (s: number) => {
    const m = Math.floor(s / 60) % 60;
    const h = Math.floor(s / 3600);

    return `${h ? `${h}:${String(m).padStart(2, '0')}` : m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

/** 7h 49m, 49m or 0m: how long a playlist plays. */
export const playtime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);

    return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
};

export const isLink = (s: string) => /^https?:\/\//i.test(s.trim());

export const watchUrl = (youtubeId: string) => `https://www.youtube.com/watch?v=${youtubeId}`;
