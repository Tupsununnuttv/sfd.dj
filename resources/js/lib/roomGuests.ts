import { useCallback, useEffect, useState } from 'react';
import { sendJson } from '@/lib/post';

export interface RoomGuest { id: string; name: string; is_guest: true }

export function useRoomGuests(slug: string, initial: RoomGuest[], anonymous: boolean) {
    const [guests, setGuests] = useState(initial);
    const update = useCallback((next: RoomGuest[]) => {
        if (!Array.isArray(next)) return;
        setGuests(previous => previous.map(g => g.id).join(',') === next.map(g => g.id).join(',') ? previous : next);
    }, []);
    useEffect(() => {
        const controller = new AbortController();
        let stopped = false;
        let pending = false;
        const refresh = async () => {
            if (stopped || pending || (!anonymous && document.hidden)) return;
            pending = true;
            try {
                const response = await sendJson<{ guests: RoomGuest[] }>('POST', route('rooms.watchers', slug), {}, { signal: controller.signal });
                if (!stopped) update(response.guests);
            } catch { /* Existing roster remains usable until the next heartbeat. */ }
            finally { pending = false; }
        };
        void refresh();
        const timer = window.setInterval(() => void refresh(), 30_000);
        const visible = () => { if (!document.hidden) void refresh(); };
        document.addEventListener('visibilitychange', visible);
        return () => {
            stopped = true;
            controller.abort();
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', visible);
        };
    }, [slug, anonymous, update]);
    return [guests, update] as const;
}
