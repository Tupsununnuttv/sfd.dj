import { formatDateTime } from '@/lib/regional';
import { getJson, send } from '@/lib/post';
import type { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { Ban, MonitorX, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

type Device = { id: number; kind: 'browser' | 'windows'; last_seen_at: string; ban_id: number | null };
type Access = { allowed: boolean; ip?: string | null; ip_ban_id?: number | null; devices?: Device[] };

/** Site permissions apply here; a room moderator role never grants site-wide bans. */
export default function SiteBanActions({ userId }: { userId: number }) {
    const { auth } = usePage<PageProps>().props;
    const perms = auth.user.site_permissions;
    const canIp = perms.includes('ipbans.manage');
    const canDevice = perms.includes('devicebans.manage');
    const eligible = !auth.guest && auth.user.id !== userId && (canIp || canDevice);
    const [access, setAccess] = useState<Access | null>(null);
    const [mode, setMode] = useState<'ip' | 'device' | null>(null);
    const [deviceId, setDeviceId] = useState<number | null>(null);
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [busy, setBusy] = useState(false);
    const refresh = async (signal?: AbortSignal) => {
        const data = await getJson<Access>(route('moderation.access', userId), { signal });
        setAccess(data);
        setDeviceId(current => data.devices?.some(device => device.id === current) ? current : data.devices?.[0]?.id ?? null);
    };
    useEffect(() => {
        setAccess(null); setMode(null); setError(''); setSaved(false);
        if (!eligible) return;
        const controller = new AbortController();
        void refresh(controller.signal).catch(error => { if (!controller.signal.aborted) setError(error.message); });
        return () => controller.abort();
    }, [userId, eligible, canIp, canDevice]);
    if (!eligible || access?.allowed === false) return null;
    const device = access?.devices?.find(device => device.id === deviceId);
    const existingBan = mode === 'ip' ? access?.ip_ban_id : device?.ban_id;
    const apply = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!mode || busy) return;
        setBusy(true); setError(''); setSaved(false);
        try {
            if (existingBan) {
                await send('DELETE', route(mode === 'ip' ? 'admin.ipbans.destroy' : 'moderation.device-unban', existingBan));
            } else {
                await send('POST', route(mode === 'ip' ? 'moderation.ip-ban' : 'moderation.device-ban', userId), mode === 'ip' ? { ip: access?.ip, reason } : { device_id: deviceId, reason });
            }
            await refresh(); setReason(''); setMode(null); setSaved(true);
        } catch (error) { setError((error as Error).message); }
        finally { setBusy(false); }
    };
    const choose = (value: 'ip' | 'device') => { setMode(mode === value ? null : value); setReason(''); setError(''); setSaved(false); };
    return <section className="w-full space-y-2 rounded-xl border border-red-400/20 bg-red-500/5 p-3">
        <p className="flex items-center gap-1.5 text-xs font-bold text-red-300"><Shield size={13} /> Site moderation</p>
        <div className="flex gap-2">
            {canIp && <button type="button" disabled={!access || busy || !access.ip} onClick={() => choose('ip')} aria-expanded={mode === 'ip'} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500/15 px-3 py-2 text-xs font-bold text-red-300 disabled:opacity-50"><Ban size={14} /> IP Ban</button>}
            {canDevice && <button type="button" disabled={!access || busy || !access.devices?.length} onClick={() => choose('device')} aria-expanded={mode === 'device'} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500/15 px-3 py-2 text-xs font-bold text-red-300 disabled:opacity-50"><MonitorX size={14} /> HWBAN</button>}
        </div>
        {!access && !error && <p className="text-xs text-neutral-400">Loading...</p>}
        {access && canIp && !access.ip && <p className="text-xs text-neutral-400">No recorded IP address.</p>}
        {access && canDevice && !access.devices?.length && <p className="text-xs text-neutral-400">Devices appear after the user visits the site or opens the updated desktop app.</p>}
        {mode && <form onSubmit={apply} className="space-y-3 border-t border-white/10 pt-3">
            <p className="text-xs leading-relaxed text-neutral-300">{mode === 'ip'
                ? 'IP Ban blocks access to the site from this IP address, including other people sharing it.'
                : 'HWBAN blocks the selected device. Browser bans rely on saved site data; Windows HWID bans apply in the desktop app.'}</p>
            {mode === 'ip' ? <p className="font-mono text-sm" translate="no">{access?.ip}</p> : <label className="block text-xs text-neutral-400">Device
                <select aria-label="Device" disabled={busy} value={deviceId ?? ''} onChange={event => setDeviceId(Number(event.target.value))} className="mt-1 w-full rounded-lg border-white/10 bg-neutral-950 text-xs text-white">
                    {access?.devices?.map(device => <option key={device.id} value={device.id}>{device.kind === 'windows' ? 'Windows HWID' : 'Browser device'} · {formatDateTime(device.last_seen_at)}</option>)}
                </select>
            </label>}
            {mode === 'device' && <p className="text-xs leading-relaxed text-amber-200">Clearing site data can bypass a browser ban. Windows device IDs can change after hardware or Windows changes.</p>}
            {!existingBan && <label className="block text-xs text-neutral-400">Reason
                <input required minLength={3} maxLength={200} disabled={busy} value={reason} onChange={event => setReason(event.target.value)} className="mt-1 w-full rounded-lg border-white/10 bg-neutral-950 text-sm text-white" />
            </label>}
            <div className="flex gap-2">
                <button disabled={busy || (!existingBan && reason.trim().length < 3)} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{existingBan ? 'Unban' : 'Confirm'}</button>
                <button type="button" disabled={busy} onClick={() => setMode(null)} className="rounded-lg bg-white/10 px-3 py-2 text-xs">Cancel</button>
            </div>
        </form>}
        {error && <p role="alert" className="text-xs text-red-300">{error} <button type="button" disabled={busy} onClick={() => { setError(''); void refresh().catch(error => setError(error.message)); }} className="underline">Try again</button></p>}
        {saved && <p role="status" className="text-xs text-emerald-300">Saved.</p>}
    </section>;
}
