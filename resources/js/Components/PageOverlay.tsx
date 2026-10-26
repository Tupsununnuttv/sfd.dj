import { ExternalLink, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { discordActivity } from '@/lib/discordActivity';

/** A big window on top of the room that shows any site page, so you never have to leave the room (the music keeps playing). */
export default function PageOverlay({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
    const [loading, setLoading] = useState(true);
    const pageUrl = new URL(url, window.location.href);
    if (discordActivity) pageUrl.searchParams.set('sfd_overlay', '1');
    const sameOriginUrl = `${pageUrl.pathname}${pageUrl.search}${pageUrl.hash}`;

    // it can open over a panel (Room settings → Developers): Esc closes only this, the panel underneath stays
    useEffect(() => {
        const key = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            e.preventDefault();
            onClose();
        };
        window.addEventListener('keydown', key, true);
        return () => window.removeEventListener('keydown', key, true);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-3 sm:p-6" onClick={onClose}>
            <div className="flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-neutral-700 bg-neutral-950 text-neutral-100 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-4 py-2.5 text-sm">
                    <p className="font-semibold">{title} <span className="ml-2 text-xs font-normal text-neutral-500">You are still in the room; the music keeps playing.</span></p>
                    <div className="flex items-center gap-3">
                        <a href={sameOriginUrl} target="_blank" rel="noopener noreferrer" title="Open in a new tab" className="text-neutral-400 hover:text-white"><ExternalLink size={16} /></a>
                        <button onClick={onClose} aria-label="Close" className="text-neutral-400 hover:text-white"><X size={18} /></button>
                    </div>
                </div>
                <div className="relative min-h-0 flex-1">
                    {loading && <p className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500">Loading…</p>}
                    <iframe src={sameOriginUrl} title={title} onLoad={() => setLoading(false)} className="h-full w-full border-0 bg-neutral-950" />
                </div>
            </div>
        </div>
    );
}
