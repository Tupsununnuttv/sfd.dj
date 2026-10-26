import { startDiscordSdk } from '@/lib/discordSdk';
import { discordActivity } from '@/lib/discordActivity';
import { useEffect, useState } from 'react';

/** The SDK stays connected as the normal site navigates; failures do not hide the page. */
export default function DiscordActivityBridge({ applicationId }: { applicationId?: string }) {
    const [problem, setProblem] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        if (!discordActivity) return;
        let live = true;
        setProblem(null);
        void startDiscordSdk(applicationId).catch(error => { if (live) setProblem(error.message); });
        const failed = (event: Event) => setProblem((event as CustomEvent<string>).detail);
        window.addEventListener('sfd:discord-error', failed);
        return () => { live = false; window.removeEventListener('sfd:discord-error', failed); };
    }, [applicationId, attempt]);
    if (!problem) return null;
    return <div role="alert" className="fixed bottom-3 left-3 z-[100] max-w-sm rounded-xl border border-amber-400/30 bg-neutral-950 p-3 text-sm text-amber-100 shadow-xl">
        <p>{problem}</p>
        <button type="button" onClick={() => setAttempt(n => n + 1)} className="mt-2 rounded-lg bg-white/10 px-3 py-1.5 font-semibold">Try again</button>
    </div>;
}
