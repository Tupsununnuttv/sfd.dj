import type { Dancer } from '@/Components/RoomScene';

/** A live stream on a room's big screen (App\Models\Room::liveState). The Dashboard's room list has the same, without `by`. */
export interface LiveInfo {
    kind: 'youtube' | 'twitch' | 'kick';
    ref: string; // the YouTube video or channel id, or the Twitch or Kick channel
    url: string; // the stream on its own site
    thumbnail: string | null;
    title: string;
    started_at: string;
    by?: Dancer | null; // who is streaming
}

export const LIVE_SITES: Record<LiveInfo['kind'], string> = { youtube: 'YouTube', twitch: 'Twitch', kick: 'Kick' };

/** The address of the site's own player for the stream (Twitch wants to be told the name of the site that shows it). */
export function liveEmbed(live: LiveInfo, host: string, origin: string, mute: boolean): string {
    if (live.kind === 'twitch') return `https://player.twitch.tv/?channel=${live.ref}&parent=${host}&autoplay=true&muted=${mute}`;
    if (live.kind === 'kick') return `https://player.kick.com/${live.ref}?autoplay=true&muted=${mute}`;

    const what = live.ref.length === 24 ? `live_stream?channel=${live.ref}&` : `${live.ref}?`; // a channel id (UC…) shows the channel's live stream
    return `https://www.youtube-nocookie.com/embed/${what}autoplay=1&rel=0&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(origin)}${mute ? '&mute=1' : ''}`;
}
