import type { Preferences } from '@/types';
import { useSyncExternalStore } from 'react';
import { browserChannel, browserId } from './browserChannel';
import { sendJson } from './post';
import { SYSTEM_DEFAULTS, SYSTEM_KEYS, effectiveSystem, systemEvent, systemState, type SystemEvent, type SystemKey } from './systemState';

let userId: number | null = null;
let state = systemState(SYSTEM_DEFAULTS);
let effective = effectiveSystem(state.values);
const listeners = new Set<() => void>();
let channel: ReturnType<typeof browserChannel<{ userId: number; event: SystemEvent }>> | null = null;
let bridgeStarted = false;
let queue: Promise<void> = Promise.resolve();
let serverSnapshot: string | null = null;

function valid(event: SystemEvent | undefined): event is SystemEvent {
    return !!event && SYSTEM_KEYS.includes(event.key) && typeof event.value === 'boolean' && typeof event.token === 'string' && ['preview', 'saved', 'failed'].includes(event.phase);
}

function notify() {
    effective = effectiveSystem(state.values);
    if (typeof document !== 'undefined') {
        Object.assign(document.documentElement.dataset, {
            systemLow: String(effective.low_performance),
            characterMotion: effective.animated_characters ? 'on' : 'off',
            backgroundEffects: effective.background_effects ? 'on' : 'off',
            visualEffects: effective.visual_effects ? 'on' : 'off',
        });
    }
    listeners.forEach(listener => listener());
}

function receive(event: SystemEvent) { state = systemEvent(state, event); notify(); }
function publish(event: SystemEvent, owner: number) {
    if (owner !== userId) return;
    receive(event);
    channel?.postMessage({ userId: owner, event });
}
function enqueue(event: SystemEvent, owner: number) {
    queue = queue.then(async () => {
        if (userId !== owner) return;
        try {
            await sendJson('PATCH', route('settings.preferences'), { system: { [event.key]: event.value } });
            publish({ ...event, phase: 'saved' }, owner);
        } catch { publish({ ...event, phase: 'failed' }, owner); }
    });
}

export function syncSystemPreferences(id: number | null, preferences?: Preferences | null, freshNavigation = false) {
    const values = { ...SYSTEM_DEFAULTS, ...preferences?.system };
    const snapshot = JSON.stringify(values);
    // Inertia counter-only reloads retain the page's old auth prop. Those unchanged
    // props must not undo a JSON save or a choice received from another open tab.
    if (id === userId && serverSnapshot === snapshot && !freshNavigation) return;
    serverSnapshot = snapshot;
    if (id !== userId) { userId = id; state = systemState(values); }
    else {
        state = { ...state, values: { ...state.values }, confirmed: { ...state.confirmed } };
        for (const key of SYSTEM_KEYS) if (!state.pending[key]) state.values[key] = state.confirmed[key] = values[key];
    }
    if (!channel && typeof window !== 'undefined') {
        channel = browserChannel('system-preferences', (data: { userId: number; event: SystemEvent }) => {
            if (data?.userId === userId && valid(data.event)) receive(data.event);
        });
    }
    if (!bridgeStarted && typeof window !== 'undefined') {
        bridgeStarted = true;
        window.addEventListener('message', message => {
            const data = message.data;
            if (window.parent !== window || message.origin !== window.location.origin || data?.type !== 'sfd:save-system' || data.userId !== userId || !valid(data.event) || data.event.phase !== 'preview') return;
            if (state.pending[data.event.key as SystemKey] !== data.event.token) receive(data.event);
            // The parent owns writes, so closing the settings overlay cannot cancel queued saves.
            enqueue(data.event, data.userId);
        });
    }
    notify();
}

const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const getSystemRendering = () => effective;
export const useSystemRendering = () => useSyncExternalStore(subscribe, getSystemRendering, getSystemRendering);
export const useSystemPreferences = () => useSyncExternalStore(subscribe, () => state, () => state);
export function dismissSystemError() { state = { ...state, error: null }; notify(); }

export function saveSystemPreference(key: SystemKey, value: boolean) {
    if (!userId) return;
    const owner = userId;
    const event: SystemEvent = { key, value, token: browserId(), phase: 'preview' };
    publish(event, owner);
    if (window.parent !== window && channel) window.parent.postMessage({ type: 'sfd:save-system', userId: owner, event }, window.location.origin);
    else enqueue(event, owner);
}
