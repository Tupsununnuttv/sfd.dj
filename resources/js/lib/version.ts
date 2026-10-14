import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

/**
 * Has a new build of the site gone live since this page was loaded? The page knows its own build (Inertia's asset version, the hash of the build
 * manifest); every five minutes, and whenever the tab comes back into view, it asks the site which build runs now (GET /version).
 */
export function useNewVersion(): boolean {
    const mine = usePage().version;
    const [latest, setLatest] = useState<string | null>(null);

    useEffect(() => {
        if (!mine) return; // no build to compare with

        const ask = () => {
            if (document.visibilityState !== 'visible') return;
            fetch(route('version'), { headers: { Accept: 'application/json' } })
                .then((r) => (r.ok ? r.json() : null))
                .then((v: { version?: string | null } | null) => v?.version && setLatest(v.version))
                .catch(() => {}); // offline for a moment: ask again next time
        };
        const timer = window.setInterval(ask, 5 * 60 * 1000);
        document.addEventListener('visibilitychange', ask);

        return () => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', ask);
        };
    }, [mine]);

    return !!mine && !!latest && latest !== mine;
}
