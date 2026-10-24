import { dismissSystemError, useSystemPreferences } from '@/lib/systemPreferences';

export default function SystemPreferenceNotice() {
    const { error } = useSystemPreferences();
    if (!error) return null;
    return <div role="alert" className="fixed bottom-4 left-1/2 z-[20000] flex w-[min(92vw,32rem)] -translate-x-1/2 items-center gap-4 rounded-xl border border-amber-400/30 bg-neutral-900 p-4 text-sm text-amber-100 shadow-xl">
        <p>{error}</p><button onClick={dismissSystemError} aria-label="Dismiss performance settings notice" className="ml-auto shrink-0 px-2 py-1">✕</button>
    </div>;
}
