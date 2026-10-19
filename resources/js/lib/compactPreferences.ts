import type { Preferences } from '@/types';
import { compactEvent, compactState, type CompactEvent, type CompactKey, type CompactValues } from './compactState';
import { sendJson } from './post';
import { browserChannel, browserId } from './browserChannel';
import { useSyncExternalStore } from 'react';

let userId: number | null = null;
let state = compactState({ compact: false, compact_chat: false, compact_layout: false });
const listeners = new Set<() => void>();
let channel: ReturnType<typeof browserChannel<{ userId: number; event: CompactEvent }>> | null = null;
let bridgeStarted = false;
let queue: Promise<void> = Promise.resolve();
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

function receive(event: CompactEvent) {
    state = compactEvent(state, event);
    notify();
}

function publish(event: CompactEvent, owner: number) {
    if (userId !== owner) return;
    receive(event);
    channel?.postMessage({ userId: owner, event });
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
export function syncCompactPreferences(id: number | null, preferences: Preferences | null | undefined) {
    const values: CompactValues = {
        compact: preferences?.appearance?.compact ?? false,
        compact_chat: preferences?.appearance?.compact_chat ?? false,
        compact_layout: preferences?.room?.compact_layout ?? false,
    };
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
        channel = browserChannel('compact-preferences', (data: { userId: number; event: CompactEvent }) => {
            const e = data?.event;
            if (data?.userId !== userId || !validEvent(e)) return;
            receive(e);
        });
    }
    if (!bridgeStarted && typeof window !== 'undefined') {
        bridgeStarted = true;
        window.addEventListener('message', (message) => {
            const data = message.data;
            if (message.origin !== window.location.origin || data?.type !== 'sfd:save-compact' || data.userId !== userId || !validEvent(data.event) || data.event.phase !== 'preview' || window.parent !== window) return;
            const incoming: CompactEvent = data.event;
            // The room owns the write queue, so closing its settings iframe cannot drop queued saves.
            if (!state.pending[incoming.key]) receive(incoming);
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
