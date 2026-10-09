import { after, arc, Ids, lin, r1, rad, ref, sparkle } from '@/lib/art/kit';
import { ReactNode } from 'react';

/**
 * The frames of the Avatar shop: a ring round the picture. The avatar is 100 x 100 here (its middle is 50, 50, its edge is 50 from it), the ring lies between 49.5 and 57.5
 * and what hangs off it may go to 66. The same keys as AvatarController::FRAMES.
 */
const R = 53.4;
const stroke = (r: number, color: string, w: number, o = 1, extra?: object) => <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth={w} strokeOpacity={o} {...extra} />;

/** A ring of polished metal: bevelled, with a shine on the upper left. */
const metal = (u: Ids, stops: readonly (readonly [number, string])[], glint = false) => (
    <>
        <defs>{lin(u('m'), stops, [0, 0, 1, 1])}</defs>
        <circle cx="50" cy="50" r={R} fill="none" stroke="#000" strokeOpacity=".3" strokeWidth="8.6" transform="translate(0 1.4)" />
        {stroke(R, ref(u, 'm'), 7.6)}
        {stroke(49.6, '#000', 1, 0.45)}
        {stroke(57.1, '#fff', 0.9, 0.55)}
        <path d={arc(196, 258, R)} fill="none" stroke="#fff" strokeOpacity=".62" strokeWidth="2" strokeLinecap="round" />
        {glint && <path className="cos-twinkle" d={sparkle(0.9)} transform="translate(88 12)" fill="#fff" />}
    </>
);

/** A ring cut into `n` arcs, each its own colour: how the colour-shifting ones are drawn. `hue(i)` is the hue of arc i. */
const segments = (n: number, w: number, hue: (i: number) => number, light = 62) => (
    <>
        {Array.from({ length: n }, (_, i) => <path key={i} d={arc((i * 360) / n - 0.5, ((i + 1) * 360) / n + 0.5, R)} fill="none" stroke={`hsl(${r1(hue(i))} 88% ${light}%)`} strokeWidth={w} />)}
    </>
);

export const frameArt: Record<string, (u: Ids) => ReactNode> = {
    bronze: (u) => metal(u, [[0, '#ffe2b8'], [0.28, '#d98a3d'], [0.5, '#7a4318'], [0.72, '#d98a3d'], [1, '#ffe2b8']]),
    silver: (u) => metal(u, [[0, '#ffffff'], [0.28, '#b9c1ce'], [0.5, '#5b6574'], [0.72, '#c9d0db'], [1, '#ffffff']]),
    gold: (u) => metal(u, [[0, '#fff6c2'], [0.26, '#f7c948'], [0.5, '#a8700f'], [0.74, '#f3c23a'], [1, '#fff3b0']], true),
    neon: () => (
        <>
            <g className="cos-pulse">{stroke(R, '#22d3ee', 12, 0.16)}{stroke(R, '#22d3ee', 7, 0.34)}</g>
            {stroke(R, '#67e8f9', 3)}
            {stroke(R, '#fff', 1, 0.9)}
            {stroke(49.2, '#e879f9', 4, 0.3)}
            {stroke(49.2, '#f0abfc', 1.5, 0.95)}
        </>
    ),
    carbon: (u) => (
        <>
            <defs>
                <pattern id={u('w')} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="6" height="6" fill="#15151a" /><rect width="3" height="3" fill="#2d2d36" /><rect x="3" y="3" width="3" height="3" fill="#2d2d36" />
                </pattern>
                {lin(u('s'), [[0, '#e5e7eb'], [0.5, '#6b7280'], [1, '#e5e7eb']], [0, 0, 1, 1])}
            </defs>
            <circle cx="50" cy="50" r={R} fill="none" stroke="#000" strokeOpacity=".35" strokeWidth="8.6" transform="translate(0 1.4)" />
            {stroke(R, ref(u, 'w'), 7.8)}
            {stroke(49.4, '#ef4444', 1.4)}
            {stroke(57.4, ref(u, 's'), 1.2)}
            <path d={arc(200, 252, R)} fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="2.4" strokeLinecap="round" />
        </>
    ),
    emerald: (u) => (
        <>
            <defs>{lin(u('g'), [[0, '#bbf7d0'], [0.3, '#10b981'], [0.55, '#064e3b'], [0.8, '#34d399'], [1, '#d1fae5']], [0, 0, 1, 1])}</defs>
            <circle cx="50" cy="50" r={R} fill="none" stroke="#000" strokeOpacity=".3" strokeWidth="8.6" transform="translate(0 1.4)" />
            {stroke(R, ref(u, 'g'), 7)}
            {stroke(57, '#d1fae5', 0.8, 0.6)}
            {Array.from({ length: 8 }, (_, i) => (
                <g key={i} transform={`rotate(${i * 45 + 22.5} 50 50) translate(50 -3.4)`}>
                    <path d="M0 -5.6L4 0L0 5.6L-4 0Z" fill="#ecfdf5" stroke="#047857" strokeWidth=".8" strokeLinejoin="round" />
                    <path d="M0 -5.6L4 0H0Z" fill="#6ee7b7" /><path d="M0 5.6L-4 0H0Z" fill="#10b981" />
                    <path className={i % 3 ? undefined : 'cos-twinkle'} style={after(-i * 0.5)} d={sparkle(0.5)} transform="translate(-1 -1.4)" fill="#fff" />
                </g>
            ))}
        </>
    ),
    vinyl: () => (
        <>
            {stroke(53.6, '#0a0a0e', 9.6)}
            {[50.8, 52.6, 54.4, 56.2].map((r) => <g key={r}>{stroke(r, '#2c2c36', 0.55)}</g>)}
            <g className="cos-orbit" style={{ animationDuration: '14s' }}>
                <path d={arc(-34, 8, 53.6)} fill="none" stroke="#fff" strokeOpacity=".32" strokeWidth="8.4" />
                <path d={arc(146, 188, 53.6)} fill="none" stroke="#fff" strokeOpacity=".32" strokeWidth="8.4" />
            </g>
            {stroke(49.3, '#e879f9', 1.2, 0.75)}
            {stroke(58.1, '#fff', 0.7, 0.22)}
        </>
    ),
    equalizer: () => (
        <>
            {stroke(50.8, '#fff', 1, 0.2)}
            {Array.from({ length: 40 }, (_, i) => {
                const h = 4 + ((i * 7 + 3) % 10);

                return (
                    <g key={i} transform={`rotate(${i * 9} 50 50)`}>
                        <rect className="cos-eq" style={after(-i * 0.09)} x="48.9" y={-2 - h} width="2.2" height={h} rx="1.1" fill={`hsl(${r1(176 + i * 4.4)} 92% 62%)`} />
                    </g>
                );
            })}
        </>
    ),
    thorns: (u) => (
        <>
            <defs>{rad(u('r'), [[0, '#fecdd3'], [0.4, '#fb7185'], [1, '#9f1239']], [0.4, 0.35, 0.8])}</defs>
            {stroke(R, '#0b2e19', 5.4)}
            {stroke(R, '#2f8a4a', 3.4)}
            <path d={arc(208, 262, R)} fill="none" stroke="#a7f3d0" strokeOpacity=".55" strokeWidth="1.2" strokeLinecap="round" />
            {Array.from({ length: 24 }, (_, i) => <g key={i} transform={`rotate(${i * 15 + 4} 50 50)`}><path d="M48.4 -3.2L50 -9.4L51.6 -3.2Z" fill="#0b2e19" /></g>)}
            {[20, 70, 118, 175, 232, 288, 335].map((a, i) => <g key={a} transform={`rotate(${a} 50 50)`}><ellipse cx="50" cy="-4.4" rx="6.6" ry="2.7" transform={`rotate(${i % 2 ? 38 : -38} 50 -4.4)`} fill={i % 2 ? '#3fa05a' : '#2f8a4a'} stroke="#0b2e19" strokeWidth=".5" /></g>)}
            {[-62, 24, 150].map((a, i) => (
                <g key={a} transform={`rotate(${a} 50 50) translate(50 -3.6)`}>
                    <circle r="7.8" fill={ref(u, 'r')} stroke="#7f1237" strokeWidth=".8" />
                    <path d="M-3.6 0C-3.6 -3.4 3.6 -3.4 3.6 0C3.6 3.8 -4.4 3.6 -4.4 -1C-4.4 -5.6 4.6 -5.6 5.6 -1" fill="none" stroke="#7f1237" strokeOpacity=".75" strokeWidth=".9" strokeLinecap="round" />
                    <path d="M-5.4 -3.6C-3.4 -6 -0.4 -6.6 2 -6" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="1.1" strokeLinecap="round" />
                    {i === 1 && <path className="cos-twinkle" d={sparkle(0.5)} transform="translate(6 -6)" fill="#fff" />}
                </g>
            ))}
        </>
    ),
    frost: (u) => (
        <>
            <defs>
                {lin(u('i'), [[0, '#f0f9ff'], [0.35, '#7dd3fc'], [0.65, '#0ea5e9'], [1, '#e0f2fe']], [0, 0, 1, 1])}
                {lin(u('s'), [[0, '#ffffff'], [1, '#7dd3fc', 0.9]])}
            </defs>
            <circle cx="50" cy="50" r={R} fill="none" stroke="#0369a1" strokeOpacity=".35" strokeWidth="8.6" transform="translate(0 1.4)" />
            {stroke(R, ref(u, 'i'), 7)}
            {stroke(57, '#fff', 0.8, 0.8)}
            <path d={arc(196, 250, R)} fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="2" strokeLinecap="round" />
            {[9, 14, 7, 11, 17, 8, 12, 10, 15, 7, 13, 9, 16, 8].map((len, i) => (
                <g key={i} transform={`rotate(${i * (360 / 14) + 8} 50 50)`}>
                    <path d={`M${r1(50 - 3.2)} -5.6L50 ${r1(-5.6 - len)}L${r1(50 + 3.2)} -5.6Z`} fill={ref(u, 's')} stroke="#38bdf8" strokeWidth=".7" strokeLinejoin="round" />
                    <path d={`M${r1(50 - 1)} -6L50 ${r1(-5.6 - len + 3)}`} stroke="#fff" strokeOpacity=".8" strokeWidth=".8" />
                </g>
            ))}
            <path className="cos-twinkle" d={sparkle(0.9)} transform="translate(86 20)" fill="#fff" /><path className="cos-twinkle" style={after(-1.2)} d={sparkle(0.65)} transform="translate(12 78)" fill="#e0f2fe" />
        </>
    ),
    hellfire: (u) => (
        <>
            <defs>{lin(u('f'), [[0, '#7f1d1d'], [0.35, '#ef4444'], [0.7, '#fb923c'], [1, '#fde047']], [0, 1, 0, 0])}{lin(u('o'), [[0, '#2f1013'], [1, '#09040a']], [0, 0, 1, 1])}</defs>
            {stroke(R, ref(u, 'o'), 7.8)}
            {stroke(49.8, '#f97316', 4, 0.3)}
            {stroke(49.8, '#fdba74', 1.4)}
            {Array.from({ length: 18 }, (_, i) => {
                const h = 11 + ((i * 5) % 9);

                return (
                    <g key={i} transform={`rotate(${i * 20 + 5} 50 50)`}>
                        <g className="cos-flicker" style={after(-i * 0.23)}>
                            <path d={`M44.4 -3C44.4 ${r1(-3 - h * 0.45)} 48.6 ${r1(-3 - h * 0.6)} 50 ${r1(-3 - h)}C51.4 ${r1(-3 - h * 0.6)} 55.6 ${r1(-3 - h * 0.45)} 55.6 -3Z`} fill={ref(u, 'f')} />
                        </g>
                    </g>
                );
            })}
        </>
    ),
    aurora: () => (
        <>
            <g className="cos-orbit" style={{ animationDuration: '9s' }}>
                <g opacity=".3">{segments(36, 13, (i) => 170 + 60 * (1 + Math.sin((i * Math.PI * 4) / 36)))}</g>
                {segments(36, 7.4, (i) => 170 + 60 * (1 + Math.sin((i * Math.PI * 4) / 36)))}
            </g>
            {stroke(49.6, '#000', 1, 0.35)}
            {stroke(57.2, '#fff', 0.8, 0.55)}
            <path d={arc(200, 250, R)} fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
            <path className="cos-twinkle" d={sparkle(0.8)} transform="translate(90 22)" fill="#fff" />
        </>
    ),
    prism: () => (
        <>
            <g className="cos-orbit" style={{ animationDuration: '12s' }}>
                <g opacity=".28">{segments(48, 14, (i) => (i * 360) / 48, 66)}</g>
                {segments(48, 7.6, (i) => (i * 360) / 48, 64)}
            </g>
            {stroke(49.6, '#fff', 1, 0.5)}
            {stroke(57.2, '#fff', 0.9, 0.75)}
            <path d={arc(190, 246, R)} fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="2.4" strokeLinecap="round" />
            <path className="cos-twinkle" d={sparkle(1)} transform="translate(88 14)" fill="#fff" /><path className="cos-twinkle" style={after(-1)} d={sparkle(0.7)} transform="translate(10 80)" fill="#fff" /><path className="cos-twinkle" style={after(-2)} d={sparkle(0.6)} transform="translate(92 86)" fill="#fff" />
        </>
    ),
};
