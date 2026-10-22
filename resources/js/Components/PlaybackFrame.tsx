import { liveEmbed, type LiveInfo } from '@/lib/live';
import { Maximize, Minimize, PictureInPicture2, RectangleHorizontal, X } from 'lucide-react';
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';

export interface PlaybackWindowSource {
    key: string;
    title: string;
    youtubeId?: string;
    live?: LiveInfo | null;
    position: () => number;
}
type PipBrowser = Window & { documentPictureInPicture?: { requestWindow: (options: { width: number; height: number }) => Promise<Window> } };

/** Resize the existing player in place; the pop-out is a muted video mirror. */
export default function PlaybackFrame({ children, normal, wide, source }: { children: ReactNode; normal: CSSProperties; wide: CSSProperties; source?: PlaybackWindowSource | null }) {
    const frame = useRef<HTMLDivElement>(null);
    const [theatre, setTheatre] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [popupOpen, setPopupOpen] = useState(false);
    const [error, setError] = useState('');
    const popup = useRef<Window | null>(null);
    const mirror = useRef<HTMLIFrameElement | null>(null);
    const mirrorKey = useRef<string | null>(null);
    const current = useRef(source);
    current.current = source;
    const videoSource = source?.live?.kind !== 'tiktok' && (source?.youtubeId || source?.live);

    const mirrorUrl = (value: PlaybackWindowSource) => value.live
        ? (liveEmbed(value.live, window.location.hostname, window.location.origin, true) ?? '')
        : `https://www.youtube-nocookie.com/embed/${encodeURIComponent(value.youtubeId!)}?autoplay=1&mute=1&controls=1&fs=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&start=${Math.max(0, Math.floor(value.position()))}`;

    useEffect(() => {
        const changed = () => setFullscreen(document.fullscreenElement === frame.current);
        document.addEventListener('fullscreenchange', changed);
        return () => document.removeEventListener('fullscreenchange', changed);
    }, []);
    useEffect(() => {
        if (!theatre) return;
        const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !document.fullscreenElement) setTheatre(false); };
        window.addEventListener('keydown', escape);
        return () => window.removeEventListener('keydown', escape);
    }, [theatre]);
    useEffect(() => () => { popup.current?.close(); }, []);
    useEffect(() => {
        if (!popupOpen) return;
        const sync = () => {
            const value = current.current;
            if (popup.current?.closed) { popup.current = null; mirror.current = null; setPopupOpen(false); return; }
            if (!value || !mirror.current) return;
            if (value.youtubeId || value.live?.kind === 'youtube') {
                const command = (func: string, args: unknown[] = []) => mirror.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), 'https://www.youtube-nocookie.com');
                command('mute');
                if (!value.live) command('seekTo', [value.position(), true]);
            }
        };
        const timer = setInterval(sync, 3000);
        return () => clearInterval(timer);
    }, [popupOpen]);
    useEffect(() => {
        if (!popupOpen || !mirror.current) return;
        if (!source || !videoSource) { popup.current?.close(); popup.current = null; mirror.current = null; setPopupOpen(false); return; }
        popup.current!.document.title = source.title;
        if (mirrorKey.current !== source.key) { mirror.current.src = mirrorUrl(source); mirrorKey.current = source.key; }
    }, [source?.key, popupOpen]); // source changes replace only the mirror, never the room player

    const popout = async () => {
        setError('');
        if (popup.current && !popup.current.closed) { popup.current.focus(); return; }
        if (!source || !videoSource) return;
        try {
            const pip = (window as PipBrowser).documentPictureInPicture;
            const next = pip ? await pip.requestWindow({ width: 560, height: 360 }) : window.open('about:blank', 'sfd-playback-window', 'popup=yes,width=560,height=360');
            if (!next) throw new Error('The browser blocked the video window. Allow pop-ups for this site and try again.');
            next.opener = null;
            next.document.title = source.title;
            next.document.body.style.cssText = 'margin:0;background:#09080b;color:#d4d4d8;font:12px system-ui;height:100vh;display:flex;flex-direction:column';
            const note = next.document.createElement('p');
            note.textContent = 'Video window - sound and volume stay in the room.';
            note.style.cssText = 'margin:0;padding:8px 12px;flex:none';
            const video = next.document.createElement('iframe');
            video.title = source.title;
            video.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
            video.allowFullscreen = true;
            video.referrerPolicy = 'strict-origin-when-cross-origin';
            video.style.cssText = 'border:0;width:100%;flex:1;min-height:0';
            // The mirror always starts muted, avoiding double audio from the room.
            video.src = mirrorUrl(source);
            next.document.body.replaceChildren(note, video);
            popup.current = next; mirror.current = video; mirrorKey.current = source.key; setPopupOpen(true);
        } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not open the video window.'); }
    };
    const toggleFullscreen = async () => {
        setError('');
        try { if (document.fullscreenElement === frame.current) await document.exitFullscreen(); else await frame.current?.requestFullscreen(); }
        catch { setError('Fullscreen is unavailable in this browser or window.'); }
    };
    const button = 'flex h-8 w-8 items-center justify-center rounded-lg text-white/85 outline-none transition hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-30';
    return <div ref={frame} className={`sfd-playbackscreen group/playback absolute overflow-hidden rounded-md bg-neutral-950 ${theatre ? 'z-600 shadow-[0_0_0_2000px_rgba(0,0,0,0.8)]' : 'z-5'}`} style={theatre ? wide : normal} data-theatre={theatre ? 'on' : 'off'}>
        {children}
        <div className="sfd-playbackcontrols unscale absolute left-2 top-2 z-30 flex origin-top-left items-center gap-0.5 rounded-xl border border-white/10 bg-black/75 p-1 opacity-0 backdrop-blur transition-opacity group-hover/playback:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100" role="group" aria-label="Video display controls">
            <button type="button" aria-label={theatre ? 'Exit theatre mode' : 'Theatre mode'} title={theatre ? 'Exit theatre mode' : 'Theatre mode'} aria-pressed={theatre} onClick={() => setTheatre(!theatre)} className={button}>{theatre ? <X size={17} /> : <RectangleHorizontal size={17} />}</button>
            <button type="button" aria-label="Open video window" title={videoSource ? 'Open a small video window (sound stays in the room)' : 'A video must be playing to open a video window'} disabled={!videoSource} onClick={popout} className={button}><PictureInPicture2 size={17} /></button>
            <button type="button" aria-label={fullscreen ? 'Exit video fullscreen' : 'Video fullscreen'} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} disabled={typeof document === 'undefined' || !document.fullscreenEnabled} onClick={toggleFullscreen} className={button}>{fullscreen ? <Minimize size={17} /> : <Maximize size={17} />}</button>
        </div>
        {error && <p role="alert" className="unscale absolute inset-x-3 top-14 z-40 origin-top-left rounded-lg bg-black/90 p-2 text-xs text-amber-200">{error}</p>}
    </div>;
}
