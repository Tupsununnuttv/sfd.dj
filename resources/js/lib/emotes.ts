import { getJson } from '@/lib/post';
import { useEffect, useState } from 'react';

export type EmoteSource = 'bttv' | '7tv';

export interface EmoteInfo {
    id: string;
    name: string;
    source: EmoteSource;
}

/** A message carries an emote as ":bttv:<id>:" or ":7tv:<id>:". */
export const EMOTE_TOKEN = ':(?:bttv|7tv):[A-Za-z0-9]{10,32}:';
export const tokenOf = (e: EmoteInfo) => `:${e.source}:${e.id}:`;

export const emoteUrl = (source: string, id: string) =>
    source === 'bttv' ? `https://cdn.betterttv.net/emote/${id}/1x.webp` : `https://cdn.7tv.app/emote/${id}/1x.webp`;

export const parseToken = (token: string) => {
    const [, source, id] = token.split(':');
    return { source, id };
};

type Sets = Record<EmoteSource, EmoteInfo[]>;
let loading: Promise<Sets> | null = null;

/** The global BetterTTV and 7TV emotes, fetched once per page load. */
export function useGlobalEmotes(enabled = true): Sets | null {
    const [sets, setSets] = useState<Sets | null>(null);

    useEffect(() => {
        if (!enabled) return;
        loading ??= getJson<Record<EmoteSource, { id: string; name: string }[]>>(route('emotes'))
            .then((r) => ({
                bttv: (r.bttv ?? []).map((e) => ({ ...e, source: 'bttv' as const })),
                '7tv': (r['7tv'] ?? []).map((e) => ({ ...e, source: '7tv' as const })),
            }))
            .catch(() => {
                loading = null; // try again next time
                return { bttv: [], '7tv': [] };
            });
        loading.then(setSets);
    }, [enabled]);

    return sets;
}
