import { STATUS, statusOf } from '@/lib/status';

/** The little dot next to somebody's picture: green online, red busy, amber away, grey offline. */
export default function StatusDot({ status, className = '', ring = 'ring-neutral-950' }: { status?: string | null; className?: string; ring?: string }) {
    const s = statusOf(status);

    return (
        <span title={STATUS[s].label} data-status={s} className={`relative inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-2 ${ring} ${STATUS[s].dot} ${className}`}>
            {s === 'busy' && <span className="absolute inset-x-[2px] top-1/2 h-[2px] -translate-y-1/2 rounded bg-white" />}
        </span>
    );
}
