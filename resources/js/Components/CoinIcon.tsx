import { useId } from 'react';

/** An SFD Coin: a gold coin with a ridged rim and an S on its face. */
export function CoinIcon({ className = 'h-4 w-4' }: { className?: string }) {
    const id = useId().replace(/:/g, '');

    return (
        <svg viewBox="0 0 32 32" data-coin className={`shrink-0 ${className}`} aria-hidden>
            <defs>
                <linearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff3b0" /><stop offset=".45" stopColor="#f5b82e" /><stop offset="1" stopColor="#9a5a08" /></linearGradient>
                <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffdc70" /><stop offset="1" stopColor="#d98a14" /></linearGradient>
            </defs>
            <circle cx="16" cy="16" r="14.6" fill={`url(#${id}r)`} stroke="#7a4a05" strokeWidth="1" />
            <circle cx="16" cy="16" r="13.3" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth=".7" strokeDasharray="1.1 1.7" />
            <circle cx="16" cy="16" r="11.2" fill={`url(#${id}f)`} stroke="#b8741a" strokeWidth=".8" />
            <path d="M20.4 12C19.6 10.4 18 9.8 16.1 9.8C13.6 9.8 12.2 11 12.2 12.8C12.2 14.6 13.6 15.2 16.2 15.9C18.9 16.6 20.4 17.3 20.4 19.2C20.4 21.1 18.7 22.3 16.1 22.3C13.9 22.3 12.3 21.5 11.5 19.8" fill="none" stroke="#8a5208" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M16 7.6V9.6M16 22.6V24.6" stroke="#8a5208" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M8.8 12.8C9.9 9 13 7 17 6.8" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
    );
}

/** An amount of SFD Coins in a small gold pill. `compact` writes a big amount short (12.3K) where there is little room. */
export function CoinPill({ amount, className = '', compact = false }: { amount: number; className?: string; compact?: boolean }) {
    return (
        <span title={`${amount.toLocaleString()} SFD Coins`} className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-bold tabular-nums leading-4 text-amber-200 ring-1 ring-amber-300/20 ${className}`}>
            <CoinIcon className="h-3.5 w-3.5" />
            {compact && amount >= 10000 ? new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(amount) : amount.toLocaleString()}
        </span>
    );
}
