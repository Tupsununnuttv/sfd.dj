import { LIVE_SITES, LiveInfo, liveEmbed } from '@/lib/live';
import { ExternalLink } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';

/**
 * A live stream on the room's big screen: the player of YouTube, Twitch or Kick fills it, with a red Live mark and (when the mouse is over it) a button that opens the
 * stream on its own site. The room's volume and mute reach a YouTube stream; the other two have their own volume in the player.
 */
export default function LiveScreen({ live, volume, muted }: { live: LiveInfo; volume: number; muted: boolean }) {
    const frame = useRef<HTMLIFrameElement>(null);
    const mutedAtStart = useRef(muted).current;
    const site = LIVE_SITES[live.kind];
    // made once per stream: a new title must not restart it, and later volume changes go through the player's own commands
    const src = useMemo(() => liveEmbed(live, window.location.hostname, window.location.origin, mutedAtStart), [live.kind, live.ref]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (live.kind !== 'youtube') return;
        const command = (func: string, args: unknown[] = []) => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), 'https://www.youtube-nocookie.com');
        const apply = () => { command(muted ? 'mute' : 'unMute'); command('setVolume', [volume]); };
        apply();
        const again = window.setTimeout(apply, 2000); // the player may not have been ready the first time

        return () => window.clearTimeout(again);
    }, [volume, muted, live.kind, live.ref]);

    return (
        <div className="group absolute inset-0 bg-black">
            {live.kind === 'tiktok' ? <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-cyan-950 via-black to-rose-950 px-6 text-center text-white">
                <p className="text-lg font-bold">{live.title}</p>
                <p className="max-w-sm text-sm text-neutral-300">Watch @{live.ref} LIVE on TikTok. This stream opens in a new tab; it does not play inside the room.</p>
                <a href={live.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold hover:bg-rose-500"><ExternalLink size={16} /> Watch on TikTok</a>
            </div> : <iframe ref={frame} key={src} src={src} title={`${live.title}, live on ${site}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="h-full w-full border-0" />}
            <span className="unscale pointer-events-none absolute left-3 top-3 flex origin-top-left items-center gap-1.5 rounded bg-red-600 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white shadow-lg">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
            </span>
            <a href={live.url} target="_blank" rel="noopener noreferrer" title={`Open this stream on ${site}`} className="unscale absolute bottom-3 right-3 flex origin-bottom-right items-center gap-1.5 rounded-lg bg-black/75 px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-lg ring-1 ring-white/25 transition hover:bg-red-600 focus-visible:opacity-100 group-hover:opacity-100">
                <ExternalLink size={15} /> Open on {site}
            </a>
        </div>
    );
}
