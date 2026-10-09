import { Card, fieldBase, fieldClass, primaryBtn, SectionTitle } from '@/Components/ui';
import Toggle from '@/Components/Toggle';
import { ago } from '@/lib/time';
import { router, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { AdminProps } from './types';

export function BroadcastTab({ announcements }: Pick<AdminProps, 'announcements'>) {
    const [message, setMessage] = useState('');
    const [level, setLevel] = useState<'info' | 'warning'>('info');

    const send = (e: FormEvent) => {
        e.preventDefault();
        router.post(route('admin.broadcast'), { message, level }, { preserveScroll: true, onSuccess: () => setMessage('') });
    };
    const tone = (l: string) => (l === 'warning' ? 'border-amber-400/40 bg-amber-500/10 text-amber-100' : 'border-sky-400/40 bg-sky-500/10 text-sky-100');

    return (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <form onSubmit={send} className="space-y-3">
                <SectionTitle title="Send to everyone" hint="A line in the chat of every room, marked System broadcast. It stays when the chat is cleared." />
                <Card className="space-y-3 p-5">
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} rows={4} placeholder="Announcement text" className={fieldClass} />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <select value={level} onChange={(e) => setLevel(e.target.value as 'info' | 'warning')} className={`${fieldBase} w-auto`}>
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                            </select>
                            <span className="text-xs text-neutral-500">{message.length}/500</span>
                        </div>
                        <button disabled={!message.trim()} className={primaryBtn}>Send to everyone</button>
                    </div>
                    {message.trim() && (
                        <div>
                            <p className="mb-1 text-xs uppercase tracking-wider text-neutral-500">Preview</p>
                            <p className={`rounded-lg border px-4 py-2.5 text-sm ${tone(level)}`}>📢 {message}</p>
                        </div>
                    )}
                </Card>
            </form>

            <div>
                <SectionTitle title="Sent before" />
                <Card className="divide-y divide-white/5">
                    {announcements.length === 0 && <p className="p-4 text-sm text-neutral-500">No announcements yet.</p>}
                    {announcements.map((a) => (
                        <div key={a.id} className="p-4 text-sm">
                            <p>{a.message}</p>
                            <p className="mt-1 text-xs text-neutral-500"><span className={a.level === 'warning' ? 'text-amber-300' : 'text-sky-300'}>{a.level}</span> · {ago(a.created_at)}</p>
                        </div>
                    ))}
                </Card>
            </div>
        </section>
    );
}

export function IpBansTab({ ipBans, myIp }: Pick<AdminProps, 'ipBans' | 'myIp'>) {
    const [ip, setIp] = useState('');
    const [reason, setReason] = useState('');
    const errors = usePage().props.errors as Record<string, string>;

    const ban = (e: FormEvent) => {
        e.preventDefault();
        router.post(route('admin.ipbans.store'), { ip, reason }, { preserveScroll: true, onSuccess: () => { setIp(''); setReason(''); } });
    };

    return (
        <section className="space-y-4">
            <form onSubmit={ban}>
                <Card className="space-y-2 p-5">
                    <div className="flex flex-wrap gap-2">
                        <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="IP address" className={`${fieldBase} w-48`} />
                        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className={`${fieldBase} min-w-48 flex-1`} />
                        <button className={primaryBtn}>Ban IP</button>
                    </div>
                    {errors.ip && <p className="text-sm text-red-400">{errors.ip}</p>}
                    <p className="text-xs text-neutral-500">Your current IP is {myIp}; it cannot be banned.</p>
                </Card>
            </form>

            <Card className="divide-y divide-white/5">
                {ipBans.length === 0 && <p className="p-5 text-sm text-neutral-500">No banned IPs.</p>}
                {ipBans.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                        <div>
                            <p className="font-mono">{b.ip}</p>
                            <p className="text-xs text-neutral-500">{b.reason ?? 'No reason'} · {ago(b.created_at)}</p>
                        </div>
                        <button onClick={() => router.delete(route('admin.ipbans.destroy', b.id), { preserveScroll: true })} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20">Unban</button>
                    </div>
                ))}
            </Card>
        </section>
    );
}

export function MaintenanceTab({ maintenance }: Pick<AdminProps, 'maintenance'>) {
    return (
        <Card className={`max-w-xl px-5 ${maintenance ? 'border-amber-400/40' : ''}`}>
            <Toggle
                label="Maintenance mode"
                hint="Visitors see a maintenance page. Staff with admin access can still use the site, and login stays open."
                checked={maintenance}
                onChange={(v) => router.put(route('admin.maintenance'), { enabled: v }, { preserveScroll: true })}
            />
            {maintenance && <p className="pb-4 text-sm text-amber-300">⚠ Maintenance mode is ON. Everybody except staff sees the maintenance page.</p>}
        </Card>
    );
}
