export type CompactKey = 'compact' | 'compact_chat' | 'compact_layout';
export type CompactValues = Record<CompactKey, boolean>;
export type CompactEvent = { key: CompactKey; token: string; phase: 'preview' | 'saved' | 'failed'; value: boolean };
export interface CompactState {
    values: CompactValues;
    confirmed: CompactValues;
    pending: Partial<Record<CompactKey, string>>;
    error: string | null;
}

export function compactState(values: CompactValues): CompactState {
    return { values: { ...values }, confirmed: { ...values }, pending: {}, error: null };
}

/** Older responses may confirm storage, but must never replace a newer visible choice. */
export function compactEvent(state: CompactState, event: CompactEvent): CompactState {
    const { key, token, phase, value } = event;
    const next = { ...state, values: { ...state.values }, confirmed: { ...state.confirmed }, pending: { ...state.pending } };
    if (phase === 'preview') {
        next.values[key] = value;
        next.pending[key] = token;
        next.error = null;
    } else {
        if (phase === 'saved') next.confirmed[key] = value;
        if (next.pending[key] === token) {
            delete next.pending[key];
            next.values[key] = next.confirmed[key];
            next.error = phase === 'failed' ? 'Could not save your layout. Your last saved setting has been restored. Please try again.' : null;
        }
    }
    return next;
}
