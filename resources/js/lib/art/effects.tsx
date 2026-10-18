import { after, Ids, lin, r1, rad, ref, sparkle } from '@/lib/art/kit';
import { ReactNode } from 'react';

/**
 * The effects of the Avatar shop: things that happen behind and round the picture. The avatar is 100 x 100 here (its middle is 50, 50) and the drawing may go 40 beyond
 * it on every side. Most of them move (see the .cos classes in app.css) and look right standing still too. The same keys as AvatarController::EFFECTS.
 */
const HEART = 'M0 6C-12 -2 -9 -12 -3 -11C-1 -11 0 -9 0 -8C0 -9 1 -11 3 -11C9 -12 12 -2 0 6Z';
const FLAKE = 'M0 -6.4V6.4M-5.5 -3.2L5.5 3.2M-5.5 3.2L5.5 -3.2M-1.6 -5L0 -3.6L1.6 -5M-1.6 5L0 3.6L1.6 5';

/** A soft round glow from the edge of the picture outwards. `from` is where it starts (0 to 1 of its radius). */
const halo = (id: string, color: string, o: number, from = 0.62) => rad(id, [[from - 0.12, color, 0], [from, color, o], [from + 0.2, color, o * 0.35], [1, color, 0]]);

export const effectArt: Record<string, (u: Ids) => ReactNode> = {
    fireflyswarm: (u) => (
        <>
            <defs>{halo(u('garden'), '#84cc16', .2)}{rad(u('fly'), [[0, '#fffde0', 1], [.25, '#ecfccb', .9], [1, '#a3e635', 0]])}</defs>
            <circle cx="50" cy="50" r="80" fill={ref(u, 'garden')} />
            {[[-12, 24], [7, -8], [41, -23], [91, -7], [112, 30], [116, 81], [88, 113], [48, 121], [7, 105], [-20, 70]].map(([x, y], i) => (
                <g key={i} transform={`translate(${x} ${y})`}>
                    <g className="cos-bob" style={{ ...after(-i * .47), animationDuration: `${3.1 + i % 3}s` }}>
                        <circle className="cos-twinkle" style={after(-i * .33)} r={i % 2 ? 6 : 8} fill={ref(u, 'fly')} />
                        <circle r="1.3" fill="#fffac2" />
                    </g>
                </g>
            ))}
        </>
    ),
    butterflies: (u) => (
        <>
            <defs>{lin(u('wing'), [[0, '#fff0f8'], [.4, '#d8b4fe'], [1, '#38bdf8']], [0, 0, 1, 1])}</defs>
            {[[-14, 19, -28, .95], [106, 5, 24, 1.05], [117, 79, -15, .8], [1, 104, 32, .8], [60, -22, 15, .6]].map(([x, y, angle, size], i) => (
                <g key={i} transform={`translate(${x} ${y}) rotate(${angle}) scale(${size})`}>
                    <g className="cos-bob" style={after(-i * .65)}>
                        <g className="cos-flicker" style={{ ...after(-i * .21), animationDuration: '1.6s' }}>
                            <path d="M0 1C-5-20-20-14-15-3L-7 2C-17 4-10 15 0 5C10 15 17 4 7 2L15-3C20-14 5-20 0 1Z" fill={ref(u, 'wing')} stroke="#e9d5ff" strokeWidth=".8" />
                            <path d="M-3-1L-11-8M3-1L11-8M-3 5L-7 9M3 5L7 9" stroke="#a78bfa" strokeWidth=".7" fill="none" />
                            <path d="M0-3V7M0-3L-3-7M0-3L3-7" stroke="#fdf4ff" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                        </g>
                    </g>
                </g>
            ))}
        </>
    ),
    auroraveil: (u) => (
        <>
            <defs>{lin(u('aurora'), [[0, '#38bdf8', 0], [.2, '#5eead4', .75], [.5, '#c4b5fd', .65], [.8, '#f0abfc', .7], [1, '#818cf8', 0]], [0, 1, 1, 0])}{halo(u('sky'), '#67e8f9', .18)}</defs>
            <circle cx="50" cy="50" r="84" fill={ref(u, 'sky')} />
            {[-1, 1].map((side) => (
                <g key={side} transform={side < 0 ? 'translate(100 0) scale(-1 1)' : undefined}>
                    <g className="cos-sway" style={{ ...after(side < 0 ? -2 : 0), animationDuration: '6s' }}>
                        <path d="M-29 79Q-21-17 40-26Q1-9 8 39Q-11 22-29 79Z" fill={ref(u, 'aurora')} />
                        <path d="M-18 85Q-13-4 38-20" fill="none" stroke="#99f6e4" strokeOpacity=".65" strokeWidth="1.2" />
                    </g>
                </g>
            ))}
            {[[-9, 91], [17, -12], [92, -1], [111, 98]].map(([x, y], i) => <path key={i} className="cos-twinkle" style={after(-i * .7)} d={sparkle(.5, x, y)} fill="#ecfeff" />)}
        </>
    ),
    hologram: (u) => (
        <>
            <defs>{halo(u('holo'), '#22d3ee', .25)}</defs>
            <circle cx="50" cy="50" r="81" fill={ref(u, 'holo')} />
            <g className="cos-orbit" style={{ animationDuration: '24s' }}>
                <circle cx="50" cy="50" r="60" fill="none" stroke="#67e8f9" strokeOpacity=".7" strokeWidth="1.3" strokeDasharray="18 8 2 8" />
                {[0, 90, 180, 270].map((a) => <path key={a} transform={`rotate(${a} 50 50)`} d="M38-21H27V-10M62-21H73V-10M50-27V-18" fill="none" stroke="#a5f3fc" strokeWidth="1.5" strokeLinecap="round" />)}
            </g>
            {[0, 1, 2].map((i) => <ellipse key={i} className="cos-ripple" style={{ ...after(-i * 1.4), animationDuration: '4.2s' }} cx="50" cy="50" rx="62" ry="40" fill="none" stroke={i % 2 ? '#c4b5fd' : '#67e8f9'} strokeWidth="1" opacity=".65" />)}
        </>
    ),
    meteors: (u) => (
        <>
            <defs>{lin(u('trail'), [[0, '#818cf8', 0], [.6, '#67e8f9', .45], [1, '#fff', 1]], [0, 0, 1, 1])}</defs>
            {[[-23, 1, 1], [98, -25, .9], [111, 44, .8], [16, 93, .7], [61, -28, .55]].map(([x, y, size], i) => (
                <g key={i} transform={`translate(${x} ${y}) scale(${size})`}>
                    <g className="cos-meteor" style={{ ...after(-i * .83), animationDuration: `${4 + i % 2}s` }}>
                        <path d="M-20-28L3 2L0 5L-4 2Z" fill={ref(u, 'trail')} />
                        <circle r="2.5" cy="3" fill="#f0f9ff" />
                        <path d={sparkle(.4, 0, 3)} fill="#a5f3fc" />
                    </g>
                </g>
            ))}
        </>
    ),
    eclipse: (u) => (
        <>
            <defs>{rad(u('corona'), [[.52, '#ffedd5', 0], [.61, '#ffedd5', .9], [.69, '#fb923c', .65], [.85, '#db2777', .2], [1, '#7c3aed', 0]])}</defs>
            <circle className="cos-pulse" style={{ animationDuration: '5s' }} cx="50" cy="50" r="85" fill={ref(u, 'corona')} />
            <g className="cos-orbit" style={{ animationDuration: '30s' }}>
                {[0, 120, 240].map((a) => <g key={a} transform={`rotate(${a} 50 50)`}><path d="M1 23Q-1-5 30-6Q11-3 8 17" fill="none" stroke="#fed7aa" strokeWidth="1.4" strokeLinecap="round" /><circle cx="21" cy="-4" r="2" fill="#fff7ed" /></g>)}
            </g>
            <circle cx="50" cy="50" r="51.5" fill="none" stroke="#ffedd5" strokeOpacity=".9" strokeWidth="1.7" />
            {[[-7, 61], [106, 34], [63, -7], [32, 107]].map(([x, y], i) => <path key={i} className="cos-twinkle" style={after(-i * 1.1)} d={sparkle(.55, x, y)} fill="#ffedd5" />)}
        </>
    ),
    glow: (u) => (
        <>
            <defs>{halo(u('g'), '#a78bfa', 0.6, 0.64)}</defs>
            <circle className="cos-pulse" cx="50" cy="50" r="80" fill={ref(u, 'g')} />
        </>
    ),
    waves: () => (
        <>
            {[56, 66, 77].map((r, i) => <circle key={r} className="cos-ripple" style={after(-i * 1.1)} cx="50" cy="50" r={r} fill="none" stroke={['#22d3ee', '#a78bfa', '#e879f9'][i]} strokeWidth={2 - i * 0.3} opacity={0.85 - i * 0.25} />)}
        </>
    ),
    sparkles: (u) => (
        <>
            <defs>{halo(u('g'), '#fde68a', 0.22, 0.62)}</defs>
            <circle cx="50" cy="50" r="80" fill={ref(u, 'g')} />
            {[[-6, 18, 9, '#fff'], [106, 12, 7, '#fde68a'], [12, -20, 6, '#a5f3fc'], [90, -26, 8, '#fff'], [-20, 72, 5, '#fbcfe8'], [114, 68, 7, '#fff'], [32, 112, 6, '#fde68a'], [74, 110, 9, '#a5f3fc'], [52, -32, 5, '#fff']].map(([x, y, s, c], i) => (
                <path key={i} className="cos-twinkle" style={after(-i * 0.43)} d={sparkle(Number(s) / 8, Number(x), Number(y))} fill={String(c)} />
            ))}
        </>
    ),
    notes: () => (
        <>
            {[[-16, 66, '#c4b5fd', 0], [108, 52, '#f9a8d4', 1.1], [4, 20, '#67e8f9', 2.2], [100, 10, '#fde68a', 3.3]].map(([x, y, c, d], i) => (
                <g key={i} transform={`translate(${x} ${y})`}>
                    <g className="cos-rise" style={after(-Number(d))}>
                        <ellipse cx="0" cy="12" rx="5.4" ry="3.9" transform="rotate(-20 0 12)" fill={String(c)} />
                        <path d="M4.4 11V-6Q11.4 -3 11.4 4" fill="none" stroke={String(c)} strokeWidth="2.3" strokeLinecap="round" />
                        {i % 2 === 0 && <><ellipse cx="14" cy="9" rx="5.4" ry="3.9" transform="rotate(-20 14 9)" fill={String(c)} /><path d="M18.4 8V-8.6M4.4 -6L18.4 -8.6" fill="none" stroke={String(c)} strokeWidth="2.3" strokeLinecap="round" /></>}
                    </g>
                </g>
            ))}
        </>
    ),
    hearts: (u) => (
        <>
            <defs>{lin(u('h'), [[0, '#ffd1dc'], [0.5, '#fb7185'], [1, '#be123c']], [0.2, 0, 0.8, 1])}</defs>
            {[[-14, 62, 1.3, 0], [104, 66, 1.1, 1], [0, 20, 0.95, 2], [96, 8, 1.2, 3], [50, 108, 1, 1.5]].map(([x, y, s, d], i) => (
                <g key={i} transform={`translate(${x} ${y})`}>
                    <g className="cos-rise" style={after(-Number(d))}>
                        <path d={HEART} transform={`scale(${s})`} fill={ref(u, 'h')} stroke="#9f1239" strokeOpacity=".5" strokeWidth=".7" />
                        <path d="M-6 -7C-4 -9 -2 -9 -1 -8" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="1.2" strokeLinecap="round" transform={`scale(${s})`} />
                    </g>
                </g>
            ))}
        </>
    ),
    petals: (u) => (
        <>
            <defs>{lin(u('p'), [[0, '#fff1f5'], [0.5, '#f9a8d4'], [1, '#ec4899']], [0, 0, 0, 1])}</defs>
            {[[-14, 8, 20], [112, 2, -30], [20, -26, 70], [84, -32, -60], [-28, 54, 110], [120, 48, -110], [42, -36, 10], [64, -24, 150]].map(([x, y, r], i) => (
                <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
                    <g className="cos-fall" style={{ ...after(-i * 0.7), animationDuration: `${3.6 + (i % 3) * 0.7}s` }}>
                        <path d="M0 0C-5.4 -3.4 -4.4 -11 0 -14C4.4 -11 5.4 -3.4 0 0Z" fill={ref(u, 'p')} stroke="#db2777" strokeOpacity=".35" strokeWidth=".6" />
                        <path d="M0 -2V-11" stroke="#db2777" strokeOpacity=".4" strokeWidth=".6" />
                    </g>
                </g>
            ))}
        </>
    ),
    snow: () => (
        <>
            {[[-16, 6, 1.1], [108, 0, 0.9], [14, -26, 1], [86, -30, 1.2], [-24, 58, 0.9], [118, 52, 1.1], [40, -36, 0.8], [66, 112, 1], [26, 108, 0.9]].map(([x, y, s], i) => (
                <g key={i} transform={`translate(${x} ${y})`}>
                    <g className="cos-fall" style={{ ...after(-i * 0.8), animationDuration: `${5 + (i % 3)}s` }}>
                        <path d={FLAKE} transform={`scale(${s})`} fill="none" stroke="#e0f2fe" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle r="1.1" fill="#fff" />
                    </g>
                </g>
            ))}
            {[[4, 40], [96, 30], [50, -30], [-10, 90], [108, 96]].map(([x, y], i) => <circle key={i} className="cos-twinkle" style={after(-i * 0.7)} cx={x} cy={y} r="1.8" fill="#fff" />)}
        </>
    ),
    flames: (u) => (
        <>
            <defs>
                {lin(u('f'), [[0, '#b91c1c'], [0.4, '#f97316'], [0.8, '#fde047'], [1, '#fffbe0']], [0, 1, 0, 0])}
                {halo(u('g'), '#ff7a1a', 0.5, 0.66)}
            </defs>
            <circle cx="50" cy="50" r="84" fill={ref(u, 'g')} />
            {Array.from({ length: 12 }, (_, i) => {
                const L = 30 + ((i * 7) % 5) * 3.4;

                return (
                    <g key={i} transform={`rotate(${i * 30 + 8} 50 50)`}>
                        <g className="cos-flicker" style={after(-i * 0.29)}>
                            <path d={`M41 10C41 ${r1(10 - L * 0.45)} 47 ${r1(10 - L * 0.6)} 50 ${r1(10 - L)}C53 ${r1(10 - L * 0.6)} 59 ${r1(10 - L * 0.45)} 59 10Z`} fill={ref(u, 'f')} />
                            <path d={`M45 10C45 ${r1(10 - L * 0.3)} 49 ${r1(10 - L * 0.4)} 50 ${r1(10 - L * 0.66)}C51 ${r1(10 - L * 0.4)} 55 ${r1(10 - L * 0.3)} 55 10Z`} fill="#fff7c2" opacity=".7" />
                        </g>
                    </g>
                );
            })}
            {[[14, 30], [88, 22], [-6, 64], [104, 70], [50, -22]].map(([x, y], i) => <circle key={i} className="cos-rise" style={after(-i * 0.9)} cx={x} cy={y} r="1.8" fill="#fdba74" />)}
        </>
    ),
    lightning: (u) => (
        <>
            <defs>{halo(u('g'), '#60a5fa', 0.4, 0.64)}</defs>
            <circle className="cos-pulse" cx="50" cy="50" r="80" fill={ref(u, 'g')} />
            {[[-62, 0], [10, 0.5], [82, 1.1], [152, 1.7], [222, 2.2]].map(([a, d], i) => (
                <g key={i} transform={`rotate(${a} 50 50)`}>
                    <g className="cos-flash" style={after(-Number(d))}>
                        <path d="M50 -1L45 -10L52 -12L44 -25L51 -27L42 -42" fill="none" stroke="#93c5fd" strokeOpacity=".5" strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M50 -1L45 -10L52 -12L44 -25L51 -27L42 -42" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M45 -10L36 -16" fill="none" stroke="#bfdbfe" strokeWidth="1.2" strokeLinecap="round" />
                    </g>
                </g>
            ))}
        </>
    ),
    toxic: (u) => (
        <>
            <defs>{halo(u('g'), '#84cc16', 0.45, 0.64)}{rad(u('b'), [[0, '#ecfccb', 0.5], [1, '#a3e635', 0.15]], [0.4, 0.35, 0.7])}</defs>
            <circle className="cos-pulse" cx="50" cy="50" r="82" fill={ref(u, 'g')} />
            {[[-10, 72, 4.4], [102, 60, 3.4], [6, 30, 3], [96, 14, 4.8], [34, 108, 3.6], [76, 104, 2.8], [50, -28, 3.4]].map(([x, y, r], i) => (
                <g key={i} transform={`translate(${x} ${y})`}>
                    <g className="cos-rise" style={after(-i * 0.8)}>
                        <circle r={r} fill={ref(u, 'b')} stroke="#a3e635" strokeWidth="1.1" />
                        <circle cx={-Number(r) * 0.32} cy={-Number(r) * 0.32} r={Number(r) * 0.24} fill="#fff" opacity=".75" />
                    </g>
                </g>
            ))}
        </>
    ),
    cosmic: (u) => (
        <>
            <defs>
                {rad(u('n'), [[0.52, '#7c3aed', 0], [0.66, '#7c3aed', 0.5], [0.86, '#2563eb', 0.2], [1, '#2563eb', 0]])}
                {rad(u('p'), [[0, '#fde68a'], [1, '#d97706']], [0.35, 0.3, 0.8])}
                {rad(u('m'), [[0, '#ede9fe'], [1, '#8b5cf6']], [0.35, 0.3, 0.8])}
            </defs>
            <circle cx="50" cy="50" r="84" fill={ref(u, 'n')} />
            {[[-8, 10, 7], [110, 24, 6], [20, 118, 8], [96, 112, 5], [54, -32, 6], [-24, 60, 5], [120, 70, 6]].map(([x, y, s], i) => <path key={i} className="cos-twinkle" style={after(-i * 0.55)} d={sparkle(Number(s) / 8, x, y)} fill="#fff" />)}
            <g className="cos-orbit" style={{ animationDuration: '16s' }}>
                <g transform="rotate(-24 50 50)">
                    <ellipse cx="50" cy="50" rx="66" ry="23" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="1" strokeDasharray="2 4" />
                    <circle cx="116" cy="50" r="6.2" fill={ref(u, 'p')} /><ellipse cx="116" cy="50" rx="10.6" ry="2.7" fill="none" stroke="#fcd34d" strokeWidth="1.3" />
                    <circle cx="-16" cy="50" r="3.2" fill={ref(u, 'm')} />
                </g>
            </g>
        </>
    ),
    void: (u) => (
        <>
            <defs>{rad(u('v'), [[0.5, '#000', 0], [0.62, '#12002a', 0.88], [0.82, '#3b0764', 0.4], [1, '#3b0764', 0]])}</defs>
            <circle cx="50" cy="50" r="84" fill={ref(u, 'v')} />
            <g className="cos-orbit" style={{ animationDuration: '11s' }}>
                {[0, 120, 240].map((a) => (
                    <g key={a} transform={`rotate(${a} 50 50)`}>
                        <path d="M50 -2C70 -7 94 8 98 32" fill="none" stroke="#4c1d95" strokeOpacity=".55" strokeWidth="7" strokeLinecap="round" />
                        <path d="M50 -2C70 -7 94 8 98 32" fill="none" stroke="#c4b5fd" strokeOpacity=".7" strokeWidth="1.4" strokeLinecap="round" />
                    </g>
                ))}
            </g>
            {[[8, 8], [96, 16], [-14, 56], [112, 62], [30, 114], [80, 112], [50, -30]].map(([x, y], i) => <circle key={i} className="cos-twinkle" style={after(-i * 0.6)} cx={x} cy={y} r="1.5" fill="#e9d5ff" />)}
        </>
    ),
};
