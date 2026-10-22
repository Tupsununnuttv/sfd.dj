import SocialIcon from '@/Components/SocialIcon';
import { Check, Link2, X } from 'lucide-react';
import { ReactNode, useState } from 'react';

export interface ConnectionCard {
    id: string;
    label: string;
    color: string;
    configured: boolean;
    connected: boolean;
    account: string;
    description: string;
    notice: string | null;
    noticeOk?: boolean;
    details?: ReactNode;
    actions?: ReactNode;
    disconnect: () => void;
    connect: (className: string, children: ReactNode) => ReactNode;
}

function ServiceIcon({ id, size = 24 }: { id: string; size?: number }) {
    if (id !== 'spotify') return <SocialIcon name={id} size={size} />;
    return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="currentColor" /><g fill="none" stroke="#111" strokeLinecap="round"><path d="M5.5 8.3c4.6-1.3 9.4-.9 13 1.2" strokeWidth="1.8" /><path d="M6.3 12c3.9-1.1 7.7-.7 10.9 1.1" strokeWidth="1.6" /><path d="M7 15.5c3.1-.8 6.1-.5 8.8.9" strokeWidth="1.4" /></g></svg>;
}

/** Provider shortcuts above a separate card for each linked account. */
export default function ConnectionCards({ connections }: { connections: ConnectionCard[] }) {
    const [selected, setSelected] = useState<string | null>(null);
    const linked = connections.filter((connection) => connection.connected);
    const info = connections.find((connection) => connection.id === selected && !connection.connected);
    const shortcut = 'relative flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#1b1b1e] transition hover:border-white/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400';

    return <div className="max-w-3xl rounded-2xl border border-white/10 bg-[#111113] p-4 sm:p-6" data-connections>
        <h3 className="text-sm font-semibold text-neutral-200">Add a new connection</h3>
        <div className="mt-4 flex flex-wrap gap-2.5">
            {connections.map((connection) => {
                const icon = <><span style={{ color: connection.color }}><ServiceIcon id={connection.id} /></span><span className="sr-only">{connection.connected ? `${connection.label} connected` : `Connect ${connection.label}`}</span>{connection.connected && <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-[#111113] bg-green-500 p-0.5 text-black"><Check size={10} strokeWidth={3} /></span>}</>;
                return <div key={connection.id} title={connection.connected ? `${connection.label} connected` : `Connect ${connection.label}`}>
                    {connection.configured && !connection.connected ? connection.connect(shortcut, icon) : <button type="button" className={`${shortcut} ${selected === connection.id ? 'border-violet-400/60 bg-violet-500/10' : ''}`} aria-expanded={!connection.connected ? selected === connection.id : undefined} onClick={() => {
                        if (connection.connected) document.getElementById(`connection-${connection.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        else setSelected(selected === connection.id ? null : connection.id);
                    }}>{icon}</button>}
                </div>;
            })}
        </div>
        {info && <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-white/3 p-4">
            <p className="text-sm font-semibold">{info.label}</p>
            <p className="text-sm leading-relaxed text-neutral-400">{info.description}</p>
            <p className="text-xs text-neutral-500">{info.label} linking is not configured on this site yet.</p>
            {info.details}
        </div>}
        {connections.filter((connection) => !connection.connected && connection.notice).map((connection) => <p key={connection.id} role="status" className={`mt-4 rounded-lg px-3 py-2 text-sm ${connection.noticeOk ? 'bg-green-500/10 text-green-200' : 'bg-violet-500/10 text-violet-200'}`}><strong>{connection.label}:</strong> {connection.notice}</p>)}

        <h3 className="mb-4 mt-8 text-sm font-semibold text-neutral-300">{linked.length} {linked.length === 1 ? 'connection' : 'connections'}</h3>
        <div className="space-y-4">
            {linked.map((connection) => <section key={connection.id} id={`connection-${connection.id}`} aria-label={`${connection.label} connection`} className="scroll-mt-4 rounded-xl border border-white/10 bg-[#1a1a1d] p-4 sm:p-5">
                <div className="flex items-start gap-3.5">
                    <span className="mt-1 shrink-0" style={{ color: connection.color }}><ServiceIcon id={connection.id} size={28} /></span>
                    <div className="min-w-0 flex-1"><h4 className="break-words text-sm font-bold text-neutral-100">{connection.account}</h4><p className="mt-0.5 text-xs text-neutral-400">{connection.label}</p></div>
                    <button type="button" onClick={connection.disconnect} aria-label={`Disconnect ${connection.label}`} title={`Disconnect ${connection.label}`} className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"><X size={18} /></button>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-neutral-400">{connection.description}</p>
                {connection.notice && <p role="status" className={`mt-3 rounded-lg px-3 py-2 text-sm ${connection.noticeOk ? 'bg-green-500/10 text-green-200' : 'bg-violet-500/10 text-violet-200'}`}>{connection.notice}</p>}
                {connection.actions && <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">{connection.actions}</div>}
                {connection.details && <div className="mt-4">{connection.details}</div>}
            </section>)}
            {!linked.length && <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 px-5 py-8 text-center"><Link2 size={24} className="text-neutral-600" /><p className="text-sm font-medium text-neutral-300">No accounts connected yet</p><p className="text-xs text-neutral-500">Choose a service above to connect your account.</p></div>}
        </div>
        <p className="mt-5 text-xs leading-relaxed text-neutral-500">You can disconnect an account at any time. OAuth tokens are private and never sent to the browser.</p>
    </div>;
}
