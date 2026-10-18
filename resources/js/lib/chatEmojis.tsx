import type { ReactNode } from 'react';
import { EMOTE_TOKEN, emoteUrl, parseToken } from '@/lib/emotes';

export interface RoomEmojiData {
    id: number;
    name: string;
    url: string;
}

const SPLIT = new RegExp(`(${EMOTE_TOKEN}|:[a-z0-9_]{2,20}:)`);

/** Render room emoji and external emote tokens in chat, whispers and reply previews. */
export function withEmojis(body: string, emojis: RoomEmojiData[], emoteSize = 'h-7'): ReactNode[] {
    return body.split(SPLIT).map((part, i) => {
        if (new RegExp(`^${EMOTE_TOKEN}$`).test(part)) {
            const { source, id } = parseToken(part);
            return <img key={i} src={emoteUrl(source, id)} alt="emote" title={source === 'bttv' ? 'BetterTTV emote' : '7TV emote'} loading="lazy" className={`mx-0.5 inline ${emoteSize} w-auto max-w-20 align-middle`} />;
        }
        const e = emojis.find((x) => `:${x.name}:` === part);
        return e ? <img key={i} src={e.url} alt={part} title={part} className="mx-0.5 inline h-6 w-6 align-middle" /> : part;
    });
}
