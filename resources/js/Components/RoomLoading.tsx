import { router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

// The room page is the heaviest one. A link that opens a room can carry data-room-name="…" so the loader can say which room it is.
let clicked: string | null = null;
document.addEventListener('click', (e) => { clicked = (e.target as Element | null)?.closest?.('[data-room-name]')?.getAttribute('data-room-name') ?? null; }, true);

/**
 * "Loading room…": shown while any page opens a room (/rooms/<slug>) from another page, and gone when the visit is over.
 * Sits next to the page in app.tsx, so it stays up across the page change. It waits a moment first, so a quick load shows no flash.
 */
export default function RoomLoading() {
    const [room, setRoom] = useState<{ name: string | null } | null>(null);

    useEffect(() => {
        let timer: number | undefined;
        const off = [
            router.on('start', (event) => {
                const visit = event.detail.visit;
                const target = new URL(String(visit.url), window.location.href);

                if (visit.method === 'get' && /^\/rooms\/[^/]+\/?$/.test(target.pathname) && target.pathname !== window.location.pathname) {
                    const name = clicked;
                    window.clearTimeout(timer);
                    timer = window.setTimeout(() => setRoom({ name }), 120);
                }
            }),
            router.on('finish', () => { window.clearTimeout(timer); setRoom(null); }),
        ];

        return () => { window.clearTimeout(timer); off.forEach((stop) => stop()); };
    }, []);

    if (!room) return null;

    return (
        <div role="status" aria-live="polite" className="fixed inset-0 z-200 flex items-center justify-center bg-neutral-950/75 backdrop-blur-sm" data-room-loading>
            <div className="flex max-w-xs flex-col items-center gap-3 rounded-2xl border border-white/10 bg-neutral-900/90 px-8 py-7 text-center shadow-2xl shadow-black/50">
                <Loader2 size={38} className="animate-spin text-violet-400" aria-hidden />
                <p className="text-lg font-bold text-white">{room.name ? `Loading ${room.name}…` : 'Loading room…'}</p>
                <p className="text-sm text-neutral-400">Getting the stage ready.</p>
            </div>
        </div>
    );
}
