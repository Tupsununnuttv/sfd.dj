export interface FlagInfo {
    code: string;
    name: string;
}

/** The flag somebody chose for their profile (the pictures are in public/flags). Nothing is drawn when they chose none. */
export default function Flag({ flag, className = 'h-3.5' }: { flag?: FlagInfo | null; className?: string }) {
    if (!flag) return null;

    return <img src={`/flags/${flag.code}.svg`} alt={flag.name} title={flag.name} data-flag={flag.code} loading="lazy" draggable={false} className={`inline-block w-auto shrink-0 rounded-[2px] object-contain ring-1 ring-white/25 ${className}`} />;
}
