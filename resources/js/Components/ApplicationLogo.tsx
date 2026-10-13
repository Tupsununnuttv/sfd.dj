import { useId } from 'react';

/**
 * The SFD-DJ.EU mark: a record split by an S, in a deep violet tile, ringed by a dial that ends in a playhead.
 * `detail="full"` is the whole picture (grooves, glow, sheen, dial); `"simple"` is the bold version that stays crisp when it is small.
 * `spin` turns the record slowly (full version). The same drawings live in public/logo.svg and public/favicon.svg.
 */
export function LogoMark({ className = '', detail = 'simple', spin = false }: { className?: string; detail?: 'full' | 'simple'; spin?: boolean }) {
    const uid = useId().replace(/:/g, '');
    const id = (name: string) => `${uid}-${name}`;
    const ref = (name: string) => `url(#${id(name)})`;
    const style = { height: '1em', width: '1em' };

    if (detail === 'simple') {
        return (
            <svg viewBox="0 0 128 128" fill="none" aria-hidden className={className} style={style}>
                <defs>
                    <linearGradient id={id('tile')} x1="12" y1="4" x2="118" y2="126" gradientUnits="userSpaceOnUse"><stop stopColor="#3b1a6e" /><stop offset="1" stopColor="#0a0418" /></linearGradient>
                    <linearGradient id={id('a')} x1="14" y1="10" x2="108" y2="118" gradientUnits="userSpaceOnUse"><stop stopColor="#fbcfe8" /><stop offset=".4" stopColor="#e879f9" /><stop offset="1" stopColor="#9d1fb8" /></linearGradient>
                    <linearGradient id={id('b')} x1="114" y1="10" x2="20" y2="118" gradientUnits="userSpaceOnUse"><stop stopColor="#bae6fd" /><stop offset=".45" stopColor="#6aa9ff" /><stop offset="1" stopColor="#4338ca" /></linearGradient>
                    <clipPath id={id('disc')}><circle cx="64" cy="64" r="53" /></clipPath>
                </defs>
                <rect width="128" height="128" rx="30" fill={ref('tile')} />
                <g clipPath={ref('disc')}>
                    <circle cx="64" cy="64" r="53" fill={ref('a')} />
                    <path d="M64 11A53 53 0 0 1 64 117A26.5 26.5 0 0 0 64 64A26.5 26.5 0 0 1 64 11Z" fill={ref('b')} />
                    <path d="M64 11A26.5 26.5 0 0 0 64 64A26.5 26.5 0 0 1 64 117" stroke="#fff" strokeOpacity=".9" strokeWidth="5" strokeLinecap="round" />
                </g>
                <circle cx="64" cy="64" r="53" stroke="#fff" strokeOpacity=".35" strokeWidth="2" />
                <circle cx="64" cy="64" r="11" fill="#0a0418" />
                <circle cx="64" cy="64" r="11" stroke="#fff" strokeWidth="4" />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 128 128" fill="none" aria-hidden className={`${className} ${spin ? 'logo-spin' : ''}`} style={style}>
            <defs>
                <linearGradient id={id('tile')} x1="12" y1="4" x2="118" y2="126" gradientUnits="userSpaceOnUse"><stop stopColor="#3b1a6e" /><stop offset=".5" stopColor="#170b33" /><stop offset="1" stopColor="#06020f" /></linearGradient>
                <radialGradient id={id('halo')} cx="64" cy="66" r="62" gradientUnits="userSpaceOnUse"><stop stopColor="#d946ef" stopOpacity=".5" /><stop offset=".55" stopColor="#7c3aed" stopOpacity=".2" /><stop offset="1" stopColor="#7c3aed" stopOpacity="0" /></radialGradient>
                <linearGradient id={id('a')} x1="20" y1="18" x2="104" y2="110" gradientUnits="userSpaceOnUse"><stop stopColor="#fdf2f8" /><stop offset=".28" stopColor="#f0abfc" /><stop offset=".62" stopColor="#c026d3" /><stop offset="1" stopColor="#6b21a8" /></linearGradient>
                <linearGradient id={id('b')} x1="108" y1="18" x2="24" y2="110" gradientUnits="userSpaceOnUse"><stop stopColor="#e0f2fe" /><stop offset=".28" stopColor="#7dd3fc" /><stop offset=".62" stopColor="#6366f1" /><stop offset="1" stopColor="#3b0f8c" /></linearGradient>
                <linearGradient id={id('ring')} x1="8" y1="8" x2="120" y2="120" gradientUnits="userSpaceOnUse"><stop stopColor="#22d3ee" /><stop offset=".5" stopColor="#a855f7" /><stop offset="1" stopColor="#f472b6" /></linearGradient>
                <radialGradient id={id('shade')} cx="64" cy="64" r="44" gradientUnits="userSpaceOnUse"><stop offset=".5" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".5" /></radialGradient>
                <radialGradient id={id('sheen')} cx="64" cy="64" r="44" gradientUnits="userSpaceOnUse"><stop offset=".1" stopColor="#fff" stopOpacity="0" /><stop offset=".6" stopColor="#fff" stopOpacity=".1" /><stop offset="1" stopColor="#fff" stopOpacity=".3" /></radialGradient>
                <linearGradient id={id('gloss')} x1="34" y1="22" x2="62" y2="64" gradientUnits="userSpaceOnUse"><stop stopColor="#fff" stopOpacity=".5" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
                <clipPath id={id('disc')}><circle cx="64" cy="64" r="44" /></clipPath>
                <filter id={id('blur')} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6" /></filter>
                <filter id={id('dot')} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.2" /></filter>
            </defs>

            <rect width="128" height="128" rx="30" fill={ref('tile')} />
            <rect width="128" height="128" rx="30" fill={ref('halo')} />
            <rect x=".6" y=".6" width="126.8" height="126.8" rx="29.4" stroke="#fff" strokeOpacity=".16" strokeWidth="1.2" />

            <circle cx="64" cy="64" r="53.5" stroke="#fff" strokeOpacity=".07" strokeWidth="3" />
            <circle cx="64" cy="64" r="53.5" stroke={ref('ring')} strokeWidth="3" strokeLinecap="round" strokeDasharray="236 100" transform="rotate(70 64 64)" />
            <circle cx="107.8" cy="33.3" r="4.4" fill="#67e8f9" filter={ref('dot')} />
            <circle cx="107.8" cy="33.3" r="2.7" fill="#ecfeff" />

            <circle cx="64" cy="72" r="42" fill="#c026d3" opacity=".55" filter={ref('blur')} />

            <g clipPath={ref('disc')}>
                <g className="logo-disc">
                    <circle cx="64" cy="64" r="44" fill={ref('a')} />
                    <path d="M64 20A44 44 0 0 1 64 108A22 22 0 0 0 64 64A22 22 0 0 1 64 20Z" fill={ref('b')} />
                    <g stroke="#000" strokeOpacity=".17" strokeWidth="1">
                        {[39.5, 35, 30.5, 26, 21.5, 17].map((r) => <circle key={r} cx="64" cy="64" r={r} />)}
                    </g>
                    <g stroke="#fff" strokeOpacity=".1" strokeWidth=".8">
                        {[37.2, 32.7, 28.2, 23.7, 19.2].map((r) => <circle key={r} cx="64" cy="64" r={r} />)}
                    </g>
                    <path d="M64 20A22 22 0 0 0 64 64A22 22 0 0 1 64 108" stroke="#fff" strokeOpacity=".8" strokeWidth="2" strokeLinecap="round" />
                </g>
                <circle cx="64" cy="64" r="44" fill={ref('shade')} />
                <path d="M64 64 86 25.9A44 44 0 0 1 102.1 42Z" fill={ref('sheen')} />
                <path d="M64 64 42 102.1A44 44 0 0 1 25.9 86Z" fill={ref('sheen')} />
                <ellipse cx="46" cy="38" rx="28" ry="12" transform="rotate(-38 46 38)" fill={ref('gloss')} />
            </g>
            <circle cx="64" cy="64" r="44" stroke="#fff" strokeOpacity=".42" strokeWidth="1.2" />

            <circle cx="64" cy="64" r="8.5" fill="#0a0418" />
            <circle cx="64" cy="64" r="8.5" stroke="#fff" strokeOpacity=".92" strokeWidth="2.2" />
            <circle cx="64" cy="64" r="2.6" fill="#fff" />
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
                <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-sky-400 bg-clip-text text-transparent">-DJ.EU</span>
            </span>
        </span>
    );
}
