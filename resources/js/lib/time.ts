import { useEffect, useState } from 'react';

/** "just now", "5m ago", "3h ago", "2d ago". */
export const ago = (iso: string | null | undefined): string => {
    if (!iso) return 'never';
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
    return new Date(iso).toLocaleDateString();
};

/** "in 5 min", "in 3 h", "in 2 days", or "now" once it has started. */
export const until = (iso: string): string => {
    const min = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
    if (min <= 0) return 'now';
    if (min < 60) return `in ${min} min`;
    if (min < 1440) return `in ${Math.round(min / 60)} h`;
    return `in ${Math.round(min / 1440)} days`;
};

/** Was this moment within the last `minutes`? */
export const within = (iso: string | null | undefined, minutes: number): boolean => !!iso && Date.now() - new Date(iso).getTime() < minutes * 60000;


/** The current time as a number that updates every `ms`, so a countdown on screen keeps counting. */
export function useNow(ms = 1000): number {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), ms);
        return () => clearInterval(t);
    }, [ms]);

    return now;
}

/** "2d 04:13:09" style countdown to a moment; null once it has passed. */
export function countdown(iso: string, now: number): { d: number; h: number; m: number; s: number } | null {
    const left = Math.floor((new Date(iso).getTime() - now) / 1000);
    if (left <= 0) return null;

    return { d: Math.floor(left / 86400), h: Math.floor((left % 86400) / 3600), m: Math.floor((left % 3600) / 60), s: left % 60 };
}
