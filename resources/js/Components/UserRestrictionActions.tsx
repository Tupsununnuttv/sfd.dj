import { setUserRestriction, useUserRestrictions } from '@/lib/userRestrictions';
import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { Ban, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function UserRestrictionActions({ userId, name }: { userId: number; name: string }) {
    const { auth } = usePage<PageProps>().props;
    const { blocked, ignored } = useUserRestrictions();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    if (auth.guest || auth.user.id === userId) return null;
    const isBlocked = blocked.includes(userId);
    const isIgnored = ignored.includes(userId);
    const change = async (kind: 'blocked' | 'ignored', enabled: boolean) => {
        if (busy || (kind === 'blocked' && enabled && !confirm(`Block ${name}? Their messages will be hidden from you. Whispers, calls, friend requests and group invitations between you will be prevented.`))) return;
        setBusy(true); setError('');
        try { await setUserRestriction(auth.user.id, userId, { [kind]: enabled }); }
        catch (err) { setError(err instanceof Error ? err.message : 'Could not update this preference.'); }
        finally { setBusy(false); }
    };
    return <div className="w-full space-y-2">
        <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={busy} aria-pressed={isBlocked} title="Hide their messages and prevent direct contact between you" onClick={() => void change('blocked', !isBlocked)} className="flex items-center justify-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50"><Ban size={14} />{isBlocked ? 'Unblock' : 'Block'}</button>
            <button type="button" disabled={busy} aria-pressed={isIgnored} title="Hide their chat and Whisper messages only for you" onClick={() => void change('ignored', !isIgnored)} className="flex items-center justify-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-300 hover:bg-white/10 disabled:opacity-50"><EyeOff size={14} />{isIgnored ? 'Stop ignoring' : 'Ignore'}</button>
        </div>
        {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
    </div>;
}
