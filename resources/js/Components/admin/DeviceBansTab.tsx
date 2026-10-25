import { ago } from '@/lib/time';
import { send } from '@/lib/post';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import type { AdminProps } from './types';

export default function DeviceBansTab({ bans }: { bans: AdminProps['deviceBans'] }) {
    const [busy, setBusy] = useState<number | null>(null);
    const [error, setError] = useState('');
    const unban = async (id: number) => {
        setBusy(id); setError('');
        try { await send('DELETE', route('moderation.device-unban', id)); router.reload({ only: ['deviceBans'] }); }
        catch (error) { setError((error as Error).message); }
        finally { setBusy(null); }
    };
    return <section className="space-y-4">
        <p className="text-sm text-neutral-400">HWBAN blocks the selected device. Browser bans rely on saved site data; Windows HWID bans apply in the desktop app.</p>
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-white/5">
            {!bans.length && <p className="p-5 text-sm text-neutral-400">No device bans.</p>}
            {bans.map(ban => <div key={ban.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 text-sm"><p className="font-bold" translate="no">{ban.user_name ?? '—'}</p><p className="text-xs text-neutral-400">{ban.kind === 'windows' ? 'Windows HWID' : 'Browser device'} · {ago(ban.created_at)}</p><p className="mt-1 wrap-break-word text-sm" translate="no">{ban.reason}</p></div>
                <button disabled={busy !== null} onClick={() => void unban(ban.id)} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold disabled:opacity-50">Unban</button>
            </div>)}
        </div>
    </section>;
}
