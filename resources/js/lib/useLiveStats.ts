import { useEffect, useState } from 'react';
import { poll } from '@/lib/polling';

export interface SiteStats {
    members: number; online: number; rooms: number; songs: number; listening: number | null; updated_at: string;
}

/** Public counters need occasional snapshots; an initial server snapshot avoids an immediate duplicate. */
export function useLiveStats(initial: SiteStats | null) {
    const [stats, setStats] = useState(initial);
    const [stale, setStale] = useState(false);
    useEffect(() => {
        let alive = true;
        const updates = poll(async (signal) => {
            try {
                const response = await fetch(route('site.stats'), { headers: { Accept: 'application/json' }, cache: 'no-store', signal });
                if (!response.ok) throw new Error('Statistics unavailable');
                const next: SiteStats = await response.json();
                if (alive) { setStats(next); setStale(false); }
            } catch (error) { if (alive) setStale(true); throw error; }
        }, { interval: 30000, immediate: !initial, timeout: 8000 });
        return () => { alive = false; updates.stop(); };
    }, []);
    return { stats, stale };
}
