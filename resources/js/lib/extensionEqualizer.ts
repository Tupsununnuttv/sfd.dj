export type Tone = { bass: number; mid: number; treble: number };
export type EqualizerStatus = { installed: boolean; active: boolean; error?: string | null };
export const FLAT: Tone = { bass: 0, mid: 0, treble: 0 };
export const clampTone = (value: number) => Number.isFinite(value) ? Math.max(-12, Math.min(12, value)) : 0;

/** The page can adjust or stop audio, but capture starts only from the extension icon. */
export function equalizerRequest(command: 'status' | 'tone' | 'stop', tone?: Tone): Promise<EqualizerStatus> {
    return new Promise(resolve => {
        const id = crypto.randomUUID();
        const complete = (result: EqualizerStatus) => {
            clearTimeout(timer); window.removeEventListener('sfd-eq-response-v1', response); resolve(result);
        };
        const response = (event: Event) => {
            const result = (event as CustomEvent).detail;
            if (result?.id === id) complete({ installed: result.installed === true, active: result.active === true, error: typeof result.error === 'string' ? result.error : null });
        };
        const timer = setTimeout(() => complete({ installed: false, active: false }), 1500);
        window.addEventListener('sfd-eq-response-v1', response);
        window.dispatchEvent(new CustomEvent('sfd-eq-request-v1', { detail: { id, command, tone } }));
    });
}
