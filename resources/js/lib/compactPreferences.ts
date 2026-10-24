import type { Preferences } from '@/types';
import { compactEvent, compactEvents, compactState, type CompactEvent, type CompactKey, type CompactValues } from './compactState';
import { sendJson } from './post';
import { browserChannel, browserId } from './browserChannel';
import { useSyncExternalStore } from 'react';

let userId: number | null = null;
let state = compactState({ compact: false, compact_chat: false, compact_layout: false });
const listeners = new Set<() => void>();
type CompactPacket = { userId: number; event?: CompactEvent; events?: CompactEvent[] };
let channel: ReturnType<typeof browserChannel<CompactPacket>> | null = null;
let bridgeStarted = false;
let queue: Promise<void> = Promise.resolve();
let serverSnapshot: string | null = null;
const keys: CompactKey[] = ['compact', 'compact_chat', 'compact_layout'];

function validEvent(event: CompactEvent | undefined): event is CompactEvent {
    return !!event && keys.includes(event.key) && typeof event.token === 'string' && typeof event.value === 'boolean' && ['preview', 'saved', 'failed'].includes(event.phase);
}

function notify() {
    if (typeof document !== 'undefined') {
        if (state.values.compact) document.documentElement.dataset.density = 'compact';
        else delete document.documentElement.dataset.density;
    }
    listeners.forEach((listener) => listener());
}

function packetEvents(packet: CompactPacket): CompactEvent[] {
    if (Array.isArray(packet.events) && packet.events.length > 0 && packet.events.length <= 3 && packet.events.every(validEvent)) return packet.events;
    return validEvent(packet.event) ? compactEvents(packet.event) : [];
}

function receive(events: CompactEvent[]) {
    for (const event of events) state = compactEvent(state, event);
    notify();
}

function publish(event: CompactEvent, owner: number) {
    if (userId !== owner) return;
    const events = compactEvents(event);
    receive(events);
    channel?.postMessage({ userId: owner, event, events });
}

function enqueueSave(event: CompactEvent, owner: number) {
    const { key, value, token } = event;
    const patch = key === 'compact_layout' ? { room: { compact_layout: value } } : { appearance: { [key]: value } };
    queue = queue.then(async () => {
        if (userId !== owner) return;
        try {
            await sendJson('PATCH', route('settings.preferences'), patch);
            publish({ key, value, token, phase: 'saved' }, owner);
        } catch {
            publish({ key, value, token, phase: 'failed' }, owner);
        }
    });
}

/** Called with server props on navigation; an in-flight local/overlay choice takes precedence. */
export function syncCompactPreferences(id: number | null, preferences: Preferences | null | undefined, freshNavigation = false) {
    const bool = (value: unknown) => value === true || value === 1 || value === '1';
    const master = bool(preferences?.appearance?.compact);
    const values: CompactValues = {
        compact: master,
        compact_chat: preferences?.appearance?.compact_chat == null ? master : bool(preferences.appearance.compact_chat),
        compact_layout: master || bool(preferences?.room?.compact_layout),
    };
    const snapshot = JSON.stringify(values);
    // Counter/room-only Inertia refreshes retain old auth props after a JSON save.
    if (id === userId && serverSnapshot === snapshot && !freshNavigation) return;
    serverSnapshot = snapshot;
    if (id !== userId) {
        userId = id;
        state = compactState(values);
    } else {
        const next = { ...state, values: { ...state.values }, confirmed: { ...state.confirmed } };
        for (const key of keys) if (!state.pending[key]) {
            next.values[key] = values[key];
            next.confirmed[key] = values[key];
        }
        state = next;
    }
    if (!channel && typeof window !== 'undefined') {
        channel = browserChannel('compact-preferences', (data: CompactPacket) => {
            if (data?.userId !== userId) return;
            const events = packetEvents(data);
            if (events.length) receive(events);
        });
    }
    if (!bridgeStarted && typeof window !== 'undefined') {
        bridgeStarted = true;
        window.addEventListener('message', (message) => {
            const data = message.data;
            if (message.origin !== window.location.origin || data?.type !== 'sfd:save-compact' || data.userId !== userId || !validEvent(data.event) || data.event.phase !== 'preview' || window.parent !== window) return;
            const incoming: CompactEvent = data.event;
            // The room owns the write queue, so closing its settings iframe cannot drop queued saves.
            const events = compactEvents(incoming);
            if (!events.every(event => state.pending[event.key] === event.token)) receive(events);
            enqueueSave(incoming, data.userId);
        });
    }
    notify();
}

export function useCompactPreferences() {
    return useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => state, () => state);
}

export function dismissCompactError() {
    state = { ...state, error: null };
    notify();
}

/** Update the UI first; queue writes so rapid toggles cannot cancel or overtake one another. */
export function saveCompactPreference(key: CompactKey, value: boolean) {
    if (!userId) return;
    const owner = userId;
    const token = browserId();
    publish({ key, value, token, phase: 'preview' }, owner);
    const event: CompactEvent = { key, value, token, phase: 'preview' };
    if (typeof window !== 'undefined' && window.parent !== window && channel) {
        window.parent.postMessage({ type: 'sfd:save-compact', userId: owner, event }, window.location.origin);
    } else enqueueSave(event, owner);
}
