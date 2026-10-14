import { after, arc, Ids, lin, pt, r1, rad, ref, sparkle, star } from '@/lib/art/kit';
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
        {glint && <path className="cos-twinkle" d={sparkle(0.9, 88, 12)} fill="#fff" />}
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
                    <path className={i % 3 ? undefined : 'cos-twinkle'} style={after(-i * 0.5)} d={sparkle(0.5, -1, -1.4)} fill="#fff" />
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
                    {i === 1 && <path className="cos-twinkle" d={sparkle(0.5, 6, -6)} fill="#fff" />}
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
            <path className="cos-twinkle" d={sparkle(0.9, 86, 20)} fill="#fff" /><path className="cos-twinkle" style={after(-1.2)} d={sparkle(0.65, 12, 78)} fill="#e0f2fe" />
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
            <path className="cos-twinkle" d={sparkle(0.8, 90, 22)} fill="#fff" />
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
            <path className="cos-twinkle" d={sparkle(1, 88, 14)} fill="#fff" /><path className="cos-twinkle" style={after(-1)} d={sparkle(0.7, 10, 80)} fill="#fff" /><path className="cos-twinkle" style={after(-2)} d={sparkle(0.6, 92, 86)} fill="#fff" />
        </>
    ),
    fireflies: (u) => (
        <>
            <defs>{rad(u('f'), [[0, '#fffbeb'], [0.35, '#fde047', 0.9], [1, '#f59e0b', 0]])}</defs>
            {stroke(R, '#f59e0b', 6, 0.16)}
            {stroke(R, '#fcd34d', 1.6, 0.9)}
            {stroke(R, '#fff', 0.6, 0.8)}
            <g className="cos-orbit" style={{ animationDuration: '16s' }}>
                {[24, 148, 262].map((a, i) => {
                    const [x, y] = pt(a, 58);

                    return (
                        <g key={a} transform={`translate(${x} ${y})`}>
                            <circle className="cos-twinkle" style={after(-i * 0.7)} r="9.6" fill={ref(u, 'f')} />
                            <ellipse cx="-2.6" cy="-3" rx="3" ry="1.5" transform="rotate(-32 -2.6 -3)" fill="#fff" fillOpacity=".85" />
                            <ellipse cx="2.6" cy="-3" rx="3" ry="1.5" transform="rotate(32 2.6 -3)" fill="#fff" fillOpacity=".85" />
                            <ellipse rx="2.2" ry="2.8" fill="#fef9c3" stroke="#ca8a04" strokeWidth=".5" />
                        </g>
                    );
                })}
            </g>
            {[[70, 0.7], [205, 0.55], [320, 0.6]].map(([a, s], i) => {
                const [x, y] = pt(a, 60.5);

                return <path key={a} className="cos-twinkle" style={after(-1.1 - i * 0.6)} d={sparkle(s, x, y)} fill="#fef3c7" />;
            })}
        </>
    ),
    comic: () => (
        <>
            <g className="cos-pulse">
                {Array.from({ length: 20 }, (_, i) => {
                    const [x0, y0] = pt(i * 18 + 6, 58.6);
                    const [x1, y1] = pt(i * 18 + 6, i % 2 ? 63 : 66);

                    return <path key={i} d={`M${x0} ${y0}L${x1} ${y1}`} stroke={i % 4 ? '#facc15' : '#fb923c'} strokeWidth={i % 2 ? 1.6 : 2.4} strokeLinecap="round" />;
                })}
            </g>
            {stroke(R, '#0a0a0a', 7.6)}
            {stroke(R, '#fff', 4.2)}
            {stroke(R, '#facc15', 1.2)}
            <g transform="translate(91 9)">
                <path className="cos-twinkle" style={after(-0.8)} d={star(8, 7.4, 3.8)} fill="#facc15" stroke="#0a0a0a" strokeWidth="1" strokeLinejoin="round" />
            </g>
            <g transform="translate(7 93)">
                <path d="M-9.4 -1.4C-9.4 -8.6 9.4 -8.6 9.4 -1.4C9.4 4.6 3.6 6.6 -0.6 5.8L-6.4 10.4L-5.2 4.8C-8.2 3.6 -9.4 1.6 -9.4 -1.4Z" fill="#fff" stroke="#0a0a0a" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M0 -6V0" stroke="#ef4444" strokeWidth="2.6" strokeLinecap="round" />
                <circle cy="3" r="1.4" fill="#ef4444" />
            </g>
        </>
    ),
    web: () => {
        const spokes = 14;
        const at = (i: number, r: number) => pt((i * 360) / spokes - 90, r);
        const leg = 'M-2 -1.6L-6 -5.6L-8.4 -2.4M-2.4 0L-7.4 -1.4L-9.6 2M-2.4 1.6L-7.4 3L-8.8 7.2M-2 3L-5.8 6.4L-6.6 10.6';

        return (
            <>
                <g fill="none" stroke="#e2e8f0" strokeOpacity=".85" strokeWidth=".7" strokeLinecap="round">
                    {Array.from({ length: spokes }, (_, i) => {
                        const [x0, y0] = at(i, 49);
                        const [x1, y1] = at(i, 65.4);

                        return <path key={i} d={`M${x0} ${y0}L${x1} ${y1}`} />;
                    })}
                    {[52.6, 57.8, 63].map((r) =>
                        Array.from({ length: spokes }, (_, i) => {
                            const [x0, y0] = at(i, r);
                            const [x1, y1] = at(i + 1, r);
                            const [cx, cy] = at(i + 0.5, r - 3.4);

                            return <path key={`${r}-${i}`} d={`M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}`} />;
                        }),
                    )}
                </g>
                <g className="cos-bob">
                    <path d="M93 -16V4" stroke="#e2e8f0" strokeOpacity=".8" strokeWidth=".6" />
                    <g transform="translate(93 8.6)">
                        <g fill="none" stroke="#0b0f19" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"><path d={leg} /><path d={leg} transform="scale(-1 1)" /></g>
                        <ellipse cy="-2.6" rx="2.8" ry="2.5" fill="#1f2937" stroke="#0b0f19" strokeWidth=".6" />
                        <ellipse cy="3" rx="4.2" ry="4.8" fill="#111827" stroke="#0b0f19" strokeWidth=".6" />
                        <path d="M-1.5 1.4H1.5L0 3.2ZM-1.5 5H1.5L0 3.2Z" fill="#ef4444" />
                        <ellipse cx="-1.6" cy="0.6" rx="1" ry="1.8" fill="#fff" fillOpacity=".3" />
                        <circle className="cos-flash" cx="-1" cy="-3" r=".7" fill="#f87171" /><circle className="cos-flash" cx="1" cy="-3" r=".7" fill="#f87171" />
                    </g>
                </g>
            </>
        );
    },
    candles: (u) => {
        const candle = (x: number, base: number, h: number, w: number, i: number) => {
            const top = base - h;

            return (
                <g key={i}>
                    <circle className="cos-pulse" style={after(-i * 0.8)} cx={x} cy={top - 5} r="7.4" fill={ref(u, 'h')} />
                    <path d={`M${r1(x - w / 2)} ${base}V${r1(top + 1.4)}Q${r1(x - w / 2)} ${top} ${r1(x - w / 2 + 1.4)} ${top}H${r1(x + w / 2 - 1.4)}Q${r1(x + w / 2)} ${top} ${r1(x + w / 2)} ${r1(top + 1.4)}V${base}Z`} fill={ref(u, 'w')} stroke="#9a7444" strokeWidth=".6" />
                    <path d={`M${r1(x - w / 2)} ${r1(top + 1)}q1.2 4.4 2.2 .6q.9 6.4 2 .8`} fill="#fff7e6" stroke="#9a7444" strokeWidth=".4" />
                    <path d={`M${x} ${top}v-1.8`} stroke="#3b2a1a" strokeWidth=".8" strokeLinecap="round" />
                    <path className="cos-flicker" style={after(-i * 0.37)} d={`M${x} ${r1(top - 10)}C${r1(x + 2.8)} ${r1(top - 5.8)} ${r1(x + 2.6)} ${r1(top - 1.6)} ${x} ${r1(top - 1.4)}C${r1(x - 2.6)} ${r1(top - 1.6)} ${r1(x - 2.8)} ${r1(top - 5.8)} ${x} ${r1(top - 10)}Z`} fill={ref(u, 'f')} />
                </g>
            );
        };

        return (
            <>
                <defs>
                    {lin(u('w'), [[0, '#fff7e6'], [0.55, '#f1d9ae'], [1, '#c79f63']], [0, 0, 1, 0])}
                    {lin(u('f'), [[0, '#fffbeb'], [0.4, '#fde047'], [1, '#f97316']], [0, 1, 0, 0])}
                    {rad(u('h'), [[0, '#fde68a', 0.6], [1, '#f59e0b', 0]])}
                    {lin(u('i'), [[0, '#57534e'], [0.5, '#1c1917'], [1, '#44403c']], [0, 0, 1, 1])}
                </defs>
                <circle cx="50" cy="50" r={R} fill="none" stroke="#000" strokeOpacity=".3" strokeWidth="7" transform="translate(0 1.2)" />
                {stroke(R, ref(u, 'i'), 5.4)}
                {stroke(R, '#a8a29e', 0.7, 0.5)}
                <path d={arc(204, 256, R)} fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1.6" strokeLinecap="round" />
                {[[-3, 98, 22, 6.8], [8, 106, 12, 5.8], [103, 98, 18, 6.6], [92, 106, 14, 5.6]].map(([x, base, h, w], i) => candle(x, base, h, w, i))}
                <ellipse cx="2.6" cy="105" rx="10.6" ry="2.4" fill="#f1d9ae" stroke="#9a7444" strokeWidth=".5" />
                <ellipse cx="97.4" cy="105" rx="10.6" ry="2.4" fill="#f1d9ae" stroke="#9a7444" strokeWidth=".5" />
            </>
        );
    },
    skulls: (u) => (
        <>
            <defs>{lin(u('s'), [[0, '#cffafe'], [0.4, '#22d3ee'], [1, '#7c3aed']])}</defs>
            {stroke(R, '#1e1b4b', 5.4)}
            {stroke(R, '#a855f7', 1, 0.6)}
            {Array.from({ length: 12 }, (_, i) => {
                const [x, y] = pt(i * 30 - 90, 56.6);

                return (
                    <g key={i} transform={`translate(${x} ${y})`}>
                        <path d="M-5.6 -0.6C-5.6 -7.2 5.6 -7.2 5.6 -0.6C5.6 2 4.4 3.2 3.4 3.8V6.2H-3.4V3.8C-4.4 3.2 -5.6 2 -5.6 -0.6Z" fill={ref(u, 's')} stroke="#0b1020" strokeWidth=".9" strokeLinejoin="round" />
                        <ellipse cx="-2.2" cy="-0.4" rx="1.7" ry="2" fill="#0b1020" />
                        <ellipse cx="2.2" cy="-0.4" rx="1.7" ry="2" fill="#0b1020" />
                        <path d="M0 1.8L-0.9 3.2H0.9Z" fill="#0b1020" />
                        <path d="M-1.6 4.2V6.2M0 4.2V6.2M1.6 4.2V6.2" stroke="#0b1020" strokeWidth=".6" />
                        <g className="cos-flash" style={after(-i * 0.22)}><circle cx="-2.2" cy="-0.2" r=".9" fill="#f0abfc" /><circle cx="2.2" cy="-0.2" r=".9" fill="#f0abfc" /></g>
                        <path d="M-3.8 -4.4Q-1.6 -6.2 1 -5.8" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth=".8" strokeLinecap="round" />
                    </g>
                );
            })}
        </>
    ),
    lanterns: (u) => {
        const lantern = (x: number, y: number, s: number, i: number) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
                <g className="cos-sway" style={after(-i * 1.3)}>
                    <path d="M0 -13V-8" stroke="#facc15" strokeWidth=".8" />
                    <circle cy="0" r="10" fill={ref(u, 'g')} />
                    <rect x="-3.2" y="-9" width="6.4" height="2.6" rx=".6" fill="#facc15" stroke="#92400e" strokeWidth=".4" />
                    <ellipse rx="7" ry="7.4" fill={ref(u, 'l')} stroke="#7f1d1d" strokeWidth=".7" />
                    <path d="M-3.6 -6.4Q-5.6 0 -3.6 6.4M0 -7.4V7.4M3.6 -6.4Q5.6 0 3.6 6.4" fill="none" stroke="#7f1d1d" strokeOpacity=".7" strokeWidth=".6" />
                    <ellipse cx="-2.6" cy="-2.6" rx="1.6" ry="3" fill="#fff" fillOpacity=".28" />
                    <rect x="-3.2" y="6.4" width="6.4" height="2.6" rx=".6" fill="#facc15" stroke="#92400e" strokeWidth=".4" />
                    <path d="M-1.4 9V14M0 9V15M1.4 9V14" stroke="#ef4444" strokeWidth=".8" strokeLinecap="round" />
                </g>
            </g>
        );

        return (
            <>
                <defs>
                    {lin(u('r'), [[0, '#f87171'], [0.5, '#b91c1c'], [1, '#7f1d1d']], [0, 0, 1, 1])}
                    {rad(u('l'), [[0, '#fde68a'], [0.35, '#f97316'], [0.75, '#dc2626'], [1, '#991b1b']], [0.45, 0.42, 0.62])}
                    {rad(u('g'), [[0, '#fbbf24', 0.45], [1, '#f97316', 0]])}
                </defs>
                <circle cx="50" cy="50" r={R} fill="none" stroke="#000" strokeOpacity=".3" strokeWidth="8.6" transform="translate(0 1.4)" />
                {stroke(R, ref(u, 'r'), 7.6)}
                {stroke(R, '#fcd34d', 1.2, 0.9, { strokeDasharray: '1.6 2.6' })}
                {stroke(50.2, '#facc15', 1.1)}
                {stroke(56.6, '#facc15', 1.1)}
                {lantern(-8, 38, 1.15, 0)}
                {lantern(7, 7, 0.85, 1)}
                {lantern(107, 72, 0.8, 2)}
            </>
        );
    },
    crystals: (u) => {
        const shard = (a: number, len: number, w: number, i: number) => {
            const tip = -2 - len;

            return (
                <g key={i} transform={`rotate(${a} 50 50)`}>
                    <path d={`M${50 - w} -1.6V${r1(-2 - len * 0.68)}L50 ${tip}L${50 + w} ${r1(-2 - len * 0.68)}V-1.6Z`} fill={ref(u, 'c')} stroke="#312e81" strokeWidth=".6" strokeLinejoin="round" />
                    <path d={`M${50 - w} -1.6V${r1(-2 - len * 0.68)}L50 ${tip}V-1.6Z`} fill="#fff" fillOpacity=".22" />
                    <path d={`M50 ${tip}V-1.6`} stroke="#e0e7ff" strokeOpacity=".6" strokeWidth=".5" />
                    {i % 3 === 0 && <path className="cos-twinkle" style={after(-i * 0.4)} d={sparkle(0.42, r1(50 - w * 0.4), r1(tip + 2))} fill="#fff" />}
                </g>
            );
        };
        const left: [number, number, number][] = [[-122, 9, 2.6], [-108, 15, 3.4], [-94, 11, 3], [-80, 16, 3.6], [-66, 9, 2.6]];

        return (
            <>
                <defs>
                    {lin(u('c'), [[0, '#a5f3fc'], [0.45, '#818cf8'], [1, '#7e22ce']])}
                    {rad(u('h'), [[0, '#a78bfa', 0.5], [1, '#22d3ee', 0]])}
                </defs>
                <circle className="cos-pulse" cx="-6" cy="50" r="16" fill={ref(u, 'h')} />
                <circle className="cos-pulse" style={after(-1.6)} cx="106" cy="50" r="16" fill={ref(u, 'h')} />
                {stroke(R, '#3b3555', 4)}
                {stroke(R, '#8b84ad', 1, 0.8)}
                <path d={arc(196, 250, R)} fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="1.4" strokeLinecap="round" />
                {left.map(([a, len, w], i) => shard(a, len, w, i))}
                {left.map(([a, len, w], i) => shard(-a, len * (i % 2 ? 0.9 : 1.1), w, i + 5))}
                {[[172, 7, 2.2], [188, 9, 2.6]].map(([a, len, w], i) => shard(a, len, w, i + 10))}
            </>
        );
    },
    portal: (u) => (
        <>
            <defs>{rad(u('g'), [[0.72, '#38bdf8', 0], [0.82, '#38bdf8', 0.4], [0.92, '#8b5cf6', 0.22], [1, '#8b5cf6', 0]])}</defs>
            <circle className="cos-pulse" cx="50" cy="50" r="66" fill={ref(u, 'g')} />
            {stroke(R, '#0b1240', 8)}
            <g className="cos-orbit" style={{ animationDuration: '6s' }}>{stroke(R, '#38bdf8', 3.6, 1, { strokeDasharray: '22 9 8 12', strokeLinecap: 'round' })}</g>
            <g className="cos-orbit" style={{ animationDuration: '9s', animationDirection: 'reverse' }}>{stroke(R + 2, '#a78bfa', 2, 1, { strokeDasharray: '14 18 5 10', strokeLinecap: 'round' })}</g>
            <g className="cos-orbit" style={{ animationDuration: '4s' }}>{stroke(R - 2, '#e0f2fe', 1, 0.9, { strokeDasharray: '6 14', strokeLinecap: 'round' })}</g>
            {stroke(49.6, '#7dd3fc', 1, 0.8)}
            <g className="cos-flash" fill="none" stroke="#bae6fd" strokeWidth=".9" strokeLinecap="round" strokeLinejoin="round">
                {[38, 160, 278].map((a) => {
                    const [x0, y0] = pt(a, 57);
                    const [x1, y1] = pt(a + 4, 61);
                    const [x2, y2] = pt(a - 2, 63.6);
                    const [x3, y3] = pt(a + 3, 66);

                    return <path key={a} d={`M${x0} ${y0}L${x1} ${y1}L${x2} ${y2}L${x3} ${y3}`} />;
                })}
            </g>
            <path className="cos-twinkle" d={sparkle(0.9, 90, 10)} fill="#fff" />
            <path className="cos-twinkle" style={after(-1.2)} d={sparkle(0.6, 6, 86)} fill="#c4b5fd" />
            <path className="cos-twinkle" style={after(-0.5)} d={sparkle(0.5, 102, 70)} fill="#7dd3fc" />
        </>
    ),
};
