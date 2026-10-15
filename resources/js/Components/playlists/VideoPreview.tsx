import { X } from 'lucide-react';
import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * A song's video in a window over the page, to watch it before adding or queueing it. While it is open the room's own music goes quiet
 * (Room listens for "sfd:preview"), and it comes back when it closes. `children` are the buttons under the video (Add, Queue ...).
 */
export default function VideoPreview({ id, title, channel, onClose, children }: { id: string; title: string; channel?: string | null; onClose: () => void; children?: ReactNode }) {
    const close = useRef(onClose);
    close.current = onClose;

    useEffect(() => {
        const say = (open: boolean) => window.top?.dispatchEvent(new CustomEvent('sfd:preview', { detail: open }));
        const esc = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            e.stopPropagation(); // only this window closes, not the panel under it
            close.current();
        };
        say(true);
        window.addEventListener('keydown', esc, true);

        return () => { say(false); window.removeEventListener('keydown', esc, true); };
    }, []);

    return createPortal(
        <div role="dialog" aria-modal="true" aria-label={`Watch ${title}`} data-video-preview onClick={() => close.current()} className="fixed inset-0 z-70 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl shadow-black/60">
                <div className="flex items-start gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-neutral-100" title={title}>{title}</p>
                        {channel && <p className="truncate text-xs text-neutral-500">{channel}</p>}
                    </div>
                    <button type="button" onClick={() => close.current()} aria-label="Close" className="shrink-0 rounded-lg p-1.5 text-neutral-400 transition hover:bg-white/10 hover:text-white"><X size={18} /></button>
                </div>
                <div className="aspect-video bg-black">
                    <iframe
                        src={`https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                        title={title}
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                        className="h-full w-full border-0"
                    />
                </div>
                {children && <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3">{children}</div>}
            </div>
        </div>,
        document.body,
    );
}
