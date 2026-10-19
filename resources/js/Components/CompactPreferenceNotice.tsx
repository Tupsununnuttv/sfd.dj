import { dismissCompactError, useCompactPreferences } from '@/lib/compactPreferences';

export default function CompactPreferenceNotice() {
    const { error } = useCompactPreferences();
    return error ? <div role="alert" className="fixed bottom-5 right-5 z-[300] flex max-w-sm items-start gap-3 rounded-xl border border-red-400/30 bg-neutral-950 p-4 text-sm text-red-200 shadow-xl">
        <p>{error}</p><button type="button" onClick={dismissCompactError} aria-label="Dismiss layout notice" className="rounded px-2 text-white hover:bg-white/10">×</button>
    </div> : null;
}
