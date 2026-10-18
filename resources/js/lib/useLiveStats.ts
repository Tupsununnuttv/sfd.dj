import { useEffect, useState } from 'react';

export interface SiteStats {
    members: number; online: number; rooms: number; songs: number; listening: number | null; updated_at: string;
}

/** Five-second snapshots, no overlapping requests, paused in background tabs. */
export function useLiveStats(initial: SiteStats | null) {
    const [stats, setStats] = useState(initial);
    const [stale, setStale] = useState(false);
    useEffect(() => {
        let controller: AbortController | null = null;
        let alive = true;
        const refresh = async () => {
            if (document.hidden || controller) return;
            controller = new AbortController();
            const timeout = window.setTimeout(() => controller?.abort(), 8000);
            try {
                const response = await fetch(route('site.stats'), { headers: { Accept: 'application/json' }, cache: 'no-store', signal: controller.signal });
                if (!response.ok) throw new Error('Statistics unavailable');
                const next: SiteStats = await response.json();
                if (alive) { setStats(next); setStale(false); }
            } catch { if (alive) setStale(true); }
            finally { window.clearTimeout(timeout); controller = null; }
        };
        void refresh();
        const timer = window.setInterval(refresh, 5000);
        document.addEventListener('visibilitychange', refresh);
        window.addEventListener('online', refresh);
        return () => { alive = false; window.clearInterval(timer); controller?.abort(); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('online', refresh); };
    }, []);
    return { stats, stale };
}
