export const SYSTEM_DEFAULTS = { low_performance: false, animated_characters: true, background_effects: true, visual_effects: true, simple_background: false };
export type SystemValues = typeof SYSTEM_DEFAULTS;
export type SystemKey = keyof SystemValues;
export const SYSTEM_KEYS = Object.keys(SYSTEM_DEFAULTS) as SystemKey[];
export type SystemEvent = { key: SystemKey; value: boolean; token: string; phase: 'preview' | 'saved' | 'failed' };

export function effectiveSystem(values: SystemValues): SystemValues {
    return values.low_performance ? { low_performance: true, animated_characters: false, background_effects: false, visual_effects: false, simple_background: true } : values;
}

export function systemState(values: SystemValues) {
    return { values: { ...values }, confirmed: { ...values }, pending: {} as Partial<Record<SystemKey, string>>, error: null as string | null };
}
export type SystemState = ReturnType<typeof systemState>;

/** An older save may confirm storage but cannot undo a newer visible choice. */
export function systemEvent(state: SystemState, event: SystemEvent): SystemState {
    const next = { ...state, values: { ...state.values }, confirmed: { ...state.confirmed }, pending: { ...state.pending } };
    if (event.phase === 'preview') {
        next.values[event.key] = event.value;
        next.pending[event.key] = event.token;
        next.error = null;
    } else {
        if (event.phase === 'saved') next.confirmed[event.key] = event.value;
        if (next.pending[event.key] === event.token) {
            delete next.pending[event.key];
            next.values[event.key] = next.confirmed[event.key];
            next.error = event.phase === 'failed' ? 'Could not save your performance settings. Your last saved choice has been restored.' : null;
        }
    }
    return next;
}
