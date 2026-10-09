import type { Profile } from '@/Components/UserCard';
import { getJson } from '@/lib/post';
import { useEffect, useState } from 'react';

/** Quick-profile data, kept for a few seconds so the hover preview and the click card share one request and a name you just looked at opens instantly. */
type Entry = { at: number; data?: Profile; request: Promise<Profile> };
const cache = new Map<number, Entry>();

/** The profile from memory when it is younger than `maxAge` ms, otherwise from the server. */
export function loadProfile(id: number, maxAge = 20000): Promise<Profile> {
    const hit = cache.get(id);
    if (hit && Date.now() - hit.at < maxAge) return hit.data ? Promise.resolve(hit.data) : hit.request;

    const entry: Entry = {
        at: Date.now(),
        request: getJson<Profile>(route('users.card', id)).then((data) => {
            entry.data = data;
            return data;
        }),
    };
    entry.request.catch(() => cache.get(id) === entry && cache.delete(id));
    cache.set(id, entry);

    return entry.request;
}

/** Change what is remembered about someone, e.g. after sending them a friend request. */
export function patchProfile(id: number, change: Partial<Profile>) {
    const hit = cache.get(id);
    if (hit?.data) hit.data = { ...hit.data, ...change };
}

/** What we know about this person: the remembered copy right away, then the fresh one. */
export function useProfile(id: number) {
    const [profile, setProfile] = useState<Profile | null>(() => cache.get(id)?.data ?? null);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let live = true;
        setFailed(false);
        setProfile(cache.get(id)?.data ?? null);
        loadProfile(id, attempt ? 0 : undefined)
            .then((p) => live && setProfile(p))
            .catch(() => live && setFailed(true));

        return () => {
            live = false;
        };
    }, [id, attempt]);

    return { profile, failed, retry: () => setAttempt((n) => n + 1), setProfile };
}
