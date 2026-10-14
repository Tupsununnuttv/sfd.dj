import { useId } from 'react';

const S = 'M75.3 44.5A13 13 0 1 0 64 64A13 13 0 1 1 52.7 83.5';

/** The ring of the mark: a circle of bars like a sound spectrum, each as loud as the "music" at its angle. */
const BARS = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2 - Math.PI / 2;
    const len = 3 + 9 * (0.5 + 0.5 * Math.sin(i * 0.9) * Math.cos(i * 0.37 + 1.2));
    const p = (r: number) => `${(64 + Math.cos(a) * r).toFixed(2)} ${(64 + Math.sin(a) * r).toFixed(2)}`;
    return `M${p(39)}L${p(39 + len)}`;
}).join('');

/**
 * The SFD-DJ.EU mark: a bold white S in a glossy tile that runs from violet through magenta to cyan, ringed by a sound spectrum with a playhead.
 * `detail="full"` is the whole picture; `"simple"` is the bold version for 32 px and less (a dotted ring, a bigger S and playhead), so it stays
 * crisp. `spin` turns the spectrum round slowly (full version). The same drawings live in public/logo.svg and public/favicon.svg.
 */
export function LogoMark({ className = '', detail = 'simple', spin = false }: { className?: string; detail?: 'full' | 'simple'; spin?: boolean }) {
    const uid = useId().replace(/:/g, '');
    const id = (name: string) => `${uid}-${name}`;
    const ref = (name: string) => `url(#${id(name)})`;
    const style = { height: '1em', width: '1em' };

    return (
        <svg viewBox="0 0 128 128" fill="none" aria-hidden className={`${className} ${spin ? 'logo-spin' : ''}`} style={style}>
            <defs>
                <linearGradient id={id('tile')} x1="6" y1="0" x2="122" y2="128" gradientUnits="userSpaceOnUse"><stop stopColor="#6d28d9" /><stop offset=".42" stopColor="#c026d3" /><stop offset=".72" stopColor="#db2777" /><stop offset="1" stopColor="#0ea5e9" /></linearGradient>
                <radialGradient id={id('cyan')} cx="110" cy="118" r="62" gradientUnits="userSpaceOnUse"><stop stopColor="#22d3ee" stopOpacity=".85" /><stop offset="1" stopColor="#22d3ee" stopOpacity="0" /></radialGradient>
                <linearGradient id={id('gloss')} x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse"><stop stopColor="#fff" stopOpacity=".34" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
                <linearGradient id={id('s')} x1="0" y1="36" x2="0" y2="92" gradientUnits="userSpaceOnUse"><stop stopColor="#fff" /><stop offset="1" stopColor="#f5e8ff" /></linearGradient>
                <filter id={id('drop')} x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3.5" stdDeviation="3.2" floodColor="#3b0764" floodOpacity=".6" /></filter>
                <filter id={id('soft')} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.4" /></filter>
            </defs>

            <rect width="128" height="128" rx="32" fill={ref('tile')} />
            <rect width="128" height="128" rx="32" fill={ref('cyan')} />
            <path d="M0 32A32 32 0 0 1 32 0H96A32 32 0 0 1 128 32V54C96 66 32 66 0 54Z" fill={ref('gloss')} />
            <rect x=".75" y=".75" width="126.5" height="126.5" rx="31.25" stroke="#fff" strokeOpacity=".28" strokeWidth="1.5" />

            {detail === 'simple' ? (
                <>
                    <circle cx="64" cy="64" r="46" stroke="#fff" strokeOpacity=".5" strokeWidth="5" strokeDasharray="6 7.2" />
                    <circle cx="98" cy="31" r="7.5" fill="#fff" />
                    <path d="M77.6 43.2A14.6 14.6 0 1 0 64 64A14.6 14.6 0 1 1 50.4 84.8" stroke={ref('s')} strokeWidth="17" strokeLinecap="round" filter={ref('drop')} />
                </>
            ) : (
                <>
                    <g className="logo-disc">
                        <path d={BARS} stroke="#fff" strokeOpacity=".62" strokeWidth="2.6" strokeLinecap="round" />
                        <circle cx="99.5" cy="29" r="6" fill="#fff" opacity=".55" filter={ref('soft')} />
                        <circle cx="99.5" cy="29" r="3.6" fill="#fff" />
                    </g>
                    <path d={S} stroke={ref('s')} strokeWidth="13.5" strokeLinecap="round" filter={ref('drop')} />
                </>
            )}
        </svg>
    );
}

/** The mark, a small gap, then the name: SFD in white (dark with `onLight`), -DJ.EU in colour. */
export default function ApplicationLogo({ className = '', textClassName = '', detail = 'simple', spin = false, onLight = false }: { className?: string; textClassName?: string; detail?: 'full' | 'simple'; spin?: boolean; onLight?: boolean }) {
    return (
        <span className={`inline-flex items-center gap-2.5 ${className}`} style={{ fontSize: '1.2em' }}>
            <LogoMark detail={detail} spin={spin} />
            <span className={`font-black tracking-tight ${textClassName}`}>
                <span className={onLight ? 'text-neutral-950' : 'text-white'}>SFD</span>
                <span className={`bg-gradient-to-r bg-clip-text text-transparent ${onLight ? 'from-violet-600 via-fuchsia-600 to-sky-600' : 'from-violet-300 via-fuchsia-300 to-sky-300'}`}>-DJ.EU</span>
            </span>
        </span>
    );
}
