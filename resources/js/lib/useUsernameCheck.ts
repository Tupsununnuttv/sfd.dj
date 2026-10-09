import { useEffect, useState } from 'react';

export type Availability = { state: 'idle' } | { state: 'checking' } | { state: 'ok' | 'taken'; message: string };

/** Asks the server, a moment after typing stops, whether a username is free. `current` (your own name) never counts as taken. */
export function useUsernameCheck(username: string, current?: string | null): Availability {
    const [result, setResult] = useState<Availability>({ state: 'idle' });

    useEffect(() => {
        const name = username.trim();
        if (name.length < 3 || name.toLowerCase() === current?.toLowerCase()) return setResult({ state: 'idle' });

        setResult({ state: 'checking' });
        const t = setTimeout(() => {
            fetch(`${route('username.available')}?username=${encodeURIComponent(name)}`, { headers: { Accept: 'application/json' } })
                .then((r) => r.json())
                .then((r: { available: boolean; message: string }) => setResult({ state: r.available ? 'ok' : 'taken', message: r.message }))
                .catch(() => setResult({ state: 'idle' }));
        }, 400);

        return () => clearTimeout(t);
    }, [username, current]);

    return result;
}
