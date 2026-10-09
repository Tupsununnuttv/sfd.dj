import { after, Ids, lin, r1, rad, ref, sparkle, star } from '@/lib/art/kit';
import { ReactNode } from 'react';

/**
 * The accessories of the Avatar shop. The picture of the avatar is 100 x 100 here (its middle is 50, 50) and the drawing may go 40 beyond it on every side.
 * `back` is drawn behind the avatar (the wings), `front` over it. The same keys as AvatarController::ACCESSORIES.
 */
type Art = { back?: (u: Ids) => ReactNode; front?: (u: Ids) => ReactNode };

const mirror = (children: ReactNode, k: string | number = 'm') => <g key={k} transform="translate(100 0) scale(-1 1)">{children}</g>;
const sides = (draw: (side: number) => ReactNode) => <>{draw(0)}{mirror(draw(1))}</>;
const GOLD = [[0, '#fff6c2'], [0.35, '#f7c948'], [0.7, '#c98a14'], [1, '#7a4a05']] as const;

export const accessoryArt: Record<string, Art> = {
    headphones: {
        front: (u) => (
            <>
                <defs>
                    {lin(u('b'), [[0, '#6b7280'], [0.5, '#2a2f3a'], [1, '#0b0f18']])}
                    {lin(u('c'), [[0, '#59606e'], [0.55, '#232834'], [1, '#080b12']], [0, 0, 1, 1])}
                </defs>
                <path d="M6 54C6 -10 94 -10 94 54" fill="none" stroke="#000" strokeOpacity=".3" strokeWidth="10" strokeLinecap="round" transform="translate(0 2.5)" />
                <path d="M6 54C6 -10 94 -10 94 54" fill="none" stroke={ref(u, 'b')} strokeWidth="8" strokeLinecap="round" />
                <path d="M9.4 50C10.6 -2 89.4 -2 90.6 50" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M22 11C38 2 62 2 78 11" fill="none" stroke="#22d3ee" strokeOpacity=".85" strokeWidth="1.4" strokeLinecap="round" />
                {sides((s) => (
                    <g key={s}>
                        <rect x="-9" y="33" width="26" height="48" rx="13" fill={ref(u, 'c')} stroke="#05070c" strokeWidth="1.4" />
                        <ellipse cx="4" cy="57" rx="7.6" ry="15.5" fill="#05070c" stroke="#22d3ee" strokeWidth="2" />
                        <ellipse cx="4" cy="57" rx="7.6" ry="15.5" fill="none" stroke="#22d3ee" strokeOpacity=".3" strokeWidth="6" />
                        <path d="M-5 42C-6.4 53 -6.4 63 -5 72" fill="none" stroke="#fff" strokeOpacity=".32" strokeWidth="2" strokeLinecap="round" />
                        <rect x="14" y="40" width="6" height="34" rx="3" fill="#1b2230" />
                    </g>
                ))}
            </>
        ),
    },
    shades: {
        front: (u) => (
            <>
                <defs>
                    {lin(u('l'), [[0, '#7dd3fc', 0.96], [0.45, '#2563eb', 0.96], [1, '#0b1225', 0.98]], [0, 0, 0.5, 1])}
                    {lin(u('f'), GOLD)}
                </defs>
                {sides((s) => (
                    <g key={s}>
                        <path d="M9 42Q9 37.5 15 37.5H45Q49 37.5 48.4 43Q46.6 63 30 67Q11 64 9 42Z" fill={ref(u, 'l')} stroke={ref(u, 'f')} strokeWidth="2.6" strokeLinejoin="round" />
                        <path d="M14 41L28 41L19 60Z" fill="#fff" opacity=".3" /><path d="M31 41L35 41L27 54L25 54Z" fill="#fff" opacity=".2" />
                        <path d="M9 42L-4 38.6" stroke={ref(u, 'f')} strokeWidth="2.6" strokeLinecap="round" />
                    </g>
                ))}
                <path d="M47 43.6Q50 39 53 43.6" fill="none" stroke={ref(u, 'f')} strokeWidth="2.6" strokeLinecap="round" />
            </>
        ),
    },
    cap: {
        front: (u) => (
            <>
                <defs>
                    {lin(u('d'), [[0, '#55556a'], [1, '#14141d']])}
                    {lin(u('v'), [[0, '#9b6dff'], [1, '#4c1d95']])}
                </defs>
                <path d="M8 36C8 -4 92 -4 92 36Q50 26 8 36Z" fill={ref(u, 'd')} stroke="#0a0a10" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M50 0V30M30 4Q36 18 38 30M70 4Q64 18 62 30" fill="none" stroke="#000" strokeOpacity=".4" strokeWidth="1.2" />
                <path d="M18 14C28 4 42 1 56 2" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="3" strokeLinecap="round" />
                <circle cx="50" cy="0" r="4.2" fill="#7c3aed" stroke="#0a0a10" strokeWidth="1" />
                <path d={star(5, 6.4, 2.8)} transform="translate(50 16)" fill="#f7c948" stroke="#7a4a05" strokeWidth=".8" strokeLinejoin="round" />
                <path d="M10 36Q50 21 90 36Q98 47 66 51Q50 53 34 51Q2 47 10 36Z" fill="#000" opacity=".28" transform="translate(0 2)" />
                <path d="M10 36Q50 21 90 36Q98 47 66 51Q50 53 34 51Q2 47 10 36Z" fill={ref(u, 'v')} stroke="#2e1065" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M18 38Q50 28 82 38" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="1.6" strokeLinecap="round" />
            </>
        ),
    },
    beanie: {
        front: (u) => (
            <>
                <defs>
                    {lin(u('k'), [[0, '#fb7185'], [1, '#9f1239']])}
                    {lin(u('c'), [[0, '#fda4af'], [1, '#e11d48']])}
                    {rad(u('p'), [[0, '#fff'], [0.7, '#ffe4ea'], [1, '#fda4af']], [0.4, 0.35, 0.7])}
                </defs>
                <path d="M12 36C10 0 90 0 88 36Z" fill={ref(u, 'k')} stroke="#7f1d1d" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M24 5Q27 20 22 35M36 2Q38 18 35 35M48 1Q48 18 48 35M60 2Q59 18 61 35M72 5Q70 20 74 35" fill="none" stroke="#7f1d1d" strokeOpacity=".32" strokeWidth="1.3" />
                <rect x="4" y="30" width="92" height="19" rx="8" fill={ref(u, 'c')} stroke="#9f1239" strokeWidth="1.2" />
                {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${10 + i * 5.4} 32V47`} stroke="#9f1239" strokeOpacity=".32" strokeWidth="1.4" />)}
                <rect x="4" y="38" width="92" height="3.4" fill="#fff" opacity=".85" />
                <path d="M18 14C28 5 40 2 54 3" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="3" strokeLinecap="round" />
                {Array.from({ length: 14 }, (_, i) => { const a = (i * Math.PI * 2) / 14; return <circle key={i} cx={r1(50 + Math.cos(a) * 12)} cy={r1(-7 + Math.sin(a) * 12)} r="4.4" fill={ref(u, 'p')} />; })}
                <circle cx="50" cy="-7" r="11" fill={ref(u, 'p')} />
            </>
        ),
    },
    catears: {
        front: (u) => (
            <>
                <defs>
                    {lin(u('o'), [[0, '#3b3047'], [1, '#12101a']])}
                    {lin(u('i'), [[0, '#fbcfe8'], [1, '#ec4899']])}
                </defs>
                {sides((s) => (
                    <g key={s}>
                        <path d="M6 34C3 12 7 -12 15 -26C29 -16 41 -3 49 12Z" fill={ref(u, 'o')} stroke="#0a0810" strokeWidth="1.4" strokeLinejoin="round" />
                        <path d="M14 26C12 8 15 -8 19 -17C27 -10 34 -1 39 8Z" fill={ref(u, 'i')} />
                        <path d="M9 22C8 6 11 -8 15 -18" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="2" strokeLinecap="round" />
                        <path d="M17 -2L21 6M22 -6L26 2" stroke="#fff" strokeOpacity=".4" strokeWidth="1" strokeLinecap="round" />
                    </g>
                ))}
            </>
        ),
    },
    foxears: {
        front: (u) => (
            <>
                <defs>
                    {lin(u('o'), [[0, '#ffa04a'], [0.6, '#f97316'], [1, '#b8420c']], [0, 0, 1, 1])}
                    {lin(u('i'), [[0, '#57534e'], [1, '#1c1917']])}
                </defs>
                {sides((s) => (
                    <g key={s}>
                        <path d="M4 36C1 10 5 -14 11 -32C27 -22 44 -6 53 14Z" fill={ref(u, 'o')} stroke="#7c2d12" strokeWidth="1.4" strokeLinejoin="round" />
                        <path d="M11 -32C13 -26 14 -20 13 -14L5 -12C6 -20 8 -26 11 -32Z" fill="#1c1917" />
                        <path d="M13 26C11 6 13 -10 16 -22C26 -14 36 -4 43 9Z" fill={ref(u, 'i')} />
                        <path d="M15 30Q27 22 41 11Q35 30 15 30Z" fill="#fff7ed" />
                        <path d="M8 24C6 8 8 -8 11 -20" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="2" strokeLinecap="round" />
                    </g>
                ))}
            </>
        ),
    },
    flowers: {
        front: (u) => {
            const PETAL = ['#fbcfe8', '#ffffff', '#ddd6fe', '#fde68a', '#fecdd3', '#ffffff', '#fbcfe8'];

            return (
                <>
                    <defs>{rad(u('c'), [[0, '#fff3a0'], [1, '#f5b82e']], [0.4, 0.35, 0.7])}</defs>
                    <path d="M-2 40C0 -12 100 -12 102 40" fill="none" stroke="#2f7a3d" strokeWidth="3" strokeLinecap="round" opacity=".9" transform="translate(0 5)" />
                    {Array.from({ length: 9 }, (_, i) => { const a = -168 + i * 19.5; const x = 50 + Math.cos((a * Math.PI) / 180) * 56; const y = 50 + Math.sin((a * Math.PI) / 180) * 56; return <ellipse key={i} cx={r1(x)} cy={r1(y)} rx="9.6" ry="3.6" transform={`rotate(${r1(a + 90 + (i % 2 ? 36 : -36))} ${r1(x)} ${r1(y)})`} fill={i % 2 ? '#3f9a50' : '#2f7a3d'} />; })}
                    {PETAL.map((c, i) => {
                        const a = -160 + i * 23.3;
                        const x = r1(50 + Math.cos((a * Math.PI) / 180) * 54);
                        const y = r1(50 + Math.sin((a * Math.PI) / 180) * 54);
                        const sc = i === 3 ? 1.2 : 1;

                        return (
                            <g key={i} transform={`translate(${x} ${y}) rotate(${i * 25}) scale(${sc})`}>
                                {Array.from({ length: 5 }, (_, k) => <ellipse key={k} cy="-6.2" rx="4.6" ry="6.2" transform={`rotate(${k * 72})`} fill={c} stroke="#000" strokeOpacity=".18" strokeWidth=".6" />)}
                                <circle r="3.8" fill={ref(u, 'c')} stroke="#a16207" strokeWidth=".6" />
                            </g>
                        );
                    })}
                </>
            );
        },
    },
    halo: {
        front: (u) => (
            <>
                <defs>{lin(u('g'), [[0, '#fff7c2'], [0.5, '#f7c948'], [1, '#c98a14']], [0, 0, 1, 0])}</defs>
                <g className="cos-bob">
                    <ellipse cx="50" cy="-12" rx="29" ry="9" fill="none" stroke="#fde68a" strokeOpacity=".28" strokeWidth="11" />
                    <ellipse cx="50" cy="-12" rx="29" ry="9" fill="none" stroke={ref(u, 'g')} strokeWidth="4.6" />
                    <ellipse cx="50" cy="-12.6" rx="29" ry="9" fill="none" stroke="#fff" strokeOpacity=".85" strokeWidth="1.2" />
                    <path className="cos-twinkle" style={after(-0.6)} d={sparkle(0.8)} transform="translate(80 -17)" fill="#fff" />
                </g>
            </>
        ),
    },
    visor: {
        front: (u) => (
            <>
                <defs>
                    {lin(u('g'), [[0, '#a5f3fc', 0.72], [0.4, '#0891b2', 0.7], [1, '#06283a', 0.82]], [0, 0, 0.3, 1])}
                    {lin(u('f'), [[0, '#475569'], [1, '#0f172a']])}
                </defs>
                <path d="M6 41C22 31 78 31 94 41L92 63C78 70 22 70 8 63Z" fill="none" stroke="#22d3ee" strokeOpacity=".3" strokeWidth="6" strokeLinejoin="round" />
                <path d="M6 41C22 31 78 31 94 41L92 63C78 70 22 70 8 63Z" fill={ref(u, 'g')} stroke={ref(u, 'f')} strokeWidth="3" strokeLinejoin="round" />
                {[0.25, 0.5, 0.75].map((k) => <path key={k} d={`M10 ${r1(41 + k * 24)}Q50 ${r1(36 + k * 26)} 90 ${r1(41 + k * 24)}`} fill="none" stroke="#fff" strokeOpacity=".12" strokeWidth="1" />)}
                <path d="M14 44L34 40L22 62Z" fill="#fff" opacity=".34" /><path d="M38 40L44 39L32 61L28 62Z" fill="#fff" opacity=".18" />
                <rect x="-4" y="43" width="12" height="18" rx="4" fill={ref(u, 'f')} stroke="#22d3ee" strokeWidth="1.2" /><rect x="92" y="43" width="12" height="18" rx="4" fill={ref(u, 'f')} stroke="#22d3ee" strokeWidth="1.2" />
                <circle className="cos-twinkle" cx="98" cy="49" r="1.8" fill="#4ade80" /><path d="M72 51H84M72 55H80" stroke="#a5f3fc" strokeOpacity=".7" strokeWidth="1.2" strokeLinecap="round" />
            </>
        ),
    },
    laurel: {
        front: (u) => (
            <>
                <defs>{lin(u('g'), GOLD, [0, 0, 1, 1])}</defs>
                {sides((s) => (
                    <g key={s}>
                        <path d={`M${r1(50 + Math.cos((140 * Math.PI) / 180) * 54)} ${r1(50 + Math.sin((140 * Math.PI) / 180) * 54)}A54 54 0 0 1 50 -5`} fill="none" stroke={ref(u, 'g')} strokeWidth="2.4" strokeLinecap="round" />
                        {Array.from({ length: 10 }, (_, i) => {
                            const a = 144 + i * 12.6;
                            const th = (a * Math.PI) / 180;
                            const x = 50 + Math.cos(th) * 54;
                            const y = 50 + Math.sin(th) * 54;

                            return [-1, 1].map((out) => {
                                const lx = r1(x + Math.cos(th + (out * Math.PI) / 2) * 3);
                                const ly = r1(y + Math.sin(th + (out * Math.PI) / 2) * 3);

                                return <ellipse key={`${i}${out}`} cx={lx} cy={ly} rx={r1(10 - i * 0.35)} ry="3.6" transform={`rotate(${r1(a + 90 + out * 38)} ${lx} ${ly})`} fill={ref(u, 'g')} stroke="#7a4a05" strokeWidth=".6" />;
                            });
                        })}
                    </g>
                ))}
                <circle cx="50" cy="-5" r="3.4" fill="#f7c948" stroke="#7a4a05" strokeWidth=".8" />
            </>
        ),
    },
    horns: {
        front: (u) => (
            <>
                <defs>{lin(u('h'), [[0, '#fb7185'], [0.45, '#dc2626'], [1, '#450a0a']], [0, 1, 1, 0])}{rad(u('g'), [[0, '#ff5a3a', 0.65], [1, '#ff5a3a', 0]])}</defs>
                {sides((s) => (
                    <g key={s}>
                        <circle cx="24" cy="12" r="22" fill={ref(u, 'g')} />
                        <path d="M30 24C12 18 2 -2 12 -26C16 -10 28 -3 40 6Z" fill={ref(u, 'h')} stroke="#2a0606" strokeWidth="1.3" strokeLinejoin="round" />
                        <path d="M26 14C18 8 13 -2 13 -14" fill="none" stroke="#fff" strokeOpacity=".36" strokeWidth="2.2" strokeLinecap="round" />
                        <path d="M14 -4L24 1M17 -13L25 -8" stroke="#450a0a" strokeOpacity=".5" strokeWidth="1.4" strokeLinecap="round" />
                    </g>
                ))}
            </>
        ),
    },
    tophat: {
        front: (u) => (
            <g transform="rotate(-7 50 8)">
                <defs>
                    {lin(u('b'), [[0, '#454556'], [0.5, '#1a1a24'], [1, '#090910']], [0, 0, 1, 0])}
                    {lin(u('r'), [[0, '#a78bfa'], [1, '#5b21b6']])}
                    {lin(u('g'), GOLD, [0, 0, 1, 1])}
                </defs>
                <ellipse cx="50" cy="10" rx="45" ry="11.5" fill="#000" opacity=".3" transform="translate(0 2.5)" />
                <ellipse cx="50" cy="8" rx="45" ry="11.5" fill="#12121a" stroke="#05050a" strokeWidth="1.2" />
                <ellipse cx="50" cy="6" rx="45" ry="9.4" fill="none" stroke="#fff" strokeOpacity=".14" strokeWidth="1.4" />
                <path d="M26 8L28.4 -32Q50 -40 71.6 -32L74 8Q50 17 26 8Z" fill={ref(u, 'b')} stroke="#05050a" strokeWidth="1.2" strokeLinejoin="round" />
                <ellipse cx="50" cy="-32" rx="21.6" ry="6.2" fill="#2e2e3b" stroke="#05050a" strokeWidth="1" />
                <path d="M26.4 -2Q50 7 73.6 -2L74 8Q50 17 26 8Z" fill={ref(u, 'r')} stroke="#2e1065" strokeWidth=".9" />
                <rect x="44" y="1.4" width="12" height="9.6" rx="1.6" fill="none" stroke={ref(u, 'g')} strokeWidth="2.2" />
                <path d="M34 -28L35 2" stroke="#fff" strokeOpacity=".22" strokeWidth="3" strokeLinecap="round" />
            </g>
        ),
    },
    crown: {
        front: (u) => (
            <g transform="rotate(-5 50 10)">
                <defs>
                    {lin(u('g'), GOLD, [0, 0, 1, 1])}
                    {rad(u('r'), [[0, '#ffd0d0'], [0.45, '#ef4444'], [1, '#7f1d1d']], [0.35, 0.3, 0.8])}
                    {rad(u('s'), [[0, '#d5ecff'], [0.45, '#3b82f6'], [1, '#1e3a8a']], [0.35, 0.3, 0.8])}
                    {rad(u('e'), [[0, '#d5ffe4'], [0.45, '#22c55e'], [1, '#14532d']], [0.35, 0.3, 0.8])}
                </defs>
                <path d="M13 26L17 -8L34 10L50 -20L66 10L83 -8L87 26Q50 34 13 26Z" fill={ref(u, 'g')} stroke="#7a4a05" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M14 20Q50 28 86 20" fill="none" stroke="#fff6c2" strokeOpacity=".7" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M20 -2L35 12M80 -2L65 12M50 -12V10" stroke="#7a4a05" strokeOpacity=".4" strokeWidth="1.2" />
                {[[17, -8], [50, -20], [83, -8]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="4.2" fill={ref(u, 'g')} stroke="#7a4a05" strokeWidth=".9" />)}
                <circle cx="50" cy="17" r="5.4" fill={ref(u, 'r')} stroke="#4a0a0a" strokeWidth=".9" /><circle cx="48" cy="15" r="1.5" fill="#fff" opacity=".85" />
                <circle cx="30" cy="20" r="3.6" fill={ref(u, 's')} stroke="#0f1f5a" strokeWidth=".8" /><circle cx="70" cy="20" r="3.6" fill={ref(u, 'e')} stroke="#0a3a1a" strokeWidth=".8" />
                <path className="cos-twinkle" style={after(-0.4)} d={sparkle(0.8)} transform="translate(75 -14)" fill="#fff" /><path className="cos-twinkle" style={after(-1.4)} d={sparkle(0.55)} transform="translate(24 -8)" fill="#fff" />
            </g>
        ),
    },
    wings: {
        back: (u) => {
            const FEATHERS: [number, number][] = [[-86, 30], [-68, 40], [-52, 47], [-37, 52], [-22, 55], [-8, 53], [6, 47], [20, 38]];

            return (
                <>
                    <defs>
                        {lin(u('w'), [[0, '#ffffff'], [0.6, '#e6eefc'], [1, '#aebfdc']], [1, 0, 0, 0])}
                        {rad(u('g'), [[0, '#ffffff', 0.22], [1, '#ffffff', 0]])}
                    </defs>
                    {sides((s) => (
                        <g key={s}>
                            <circle cx="6" cy="40" r="46" fill={ref(u, 'g')} />
                            {FEATHERS.map(([a, l], i) => (
                                <g key={i} transform={`rotate(${a} 14 58)`}>
                                    <path d={`M14 58C14 52 ${14 - l * 0.4} 49 ${14 - l} 55C${14 - l * 0.7} 62 ${14 - l * 0.3} 64 14 58Z`} fill={ref(u, 'w')} stroke="#9fb0cf" strokeWidth=".9" strokeLinejoin="round" />
                                    <path d={`M14 57C${14 - l * 0.4} 54 ${14 - l * 0.7} 55 ${14 - l * 0.92} 55.4`} fill="none" stroke="#9fb0cf" strokeOpacity=".7" strokeWidth=".7" />
                                </g>
                            ))}
                            <path d="M14 58C4 56 -2 50 -4 40C6 42 12 48 14 58Z" fill="#fff" stroke="#9fb0cf" strokeWidth=".8" />
                        </g>
                    ))}
                </>
            );
        },
    },
    dragon: {
        front: (u) => (
            <>
                <defs>
                    {lin(u('h'), [[0, '#57534e'], [0.5, '#1f1b19'], [1, '#080606']], [0, 1, 1, 0])}
                    {rad(u('g'), [[0, '#ff8a3c', 0.7], [1, '#ff8a3c', 0]])}
                </defs>
                {sides((s) => (
                    <g key={s}>
                        <circle cx="24" cy="14" r="26" fill={ref(u, 'g')} />
                        <path d="M12 26C4 14 -6 -4 -12 -22C-16 -32 -20 -40 -26 -48C-10 -42 8 -28 22 -10C30 0 38 6 40 12Z" fill={ref(u, 'h')} stroke="#050404" strokeWidth="1.4" strokeLinejoin="round" />
                        <path d="M12 26C4 14 -6 -4 -12 -22C-16 -32 -20 -40 -26 -48" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" />
                        <path d="M10 20L24 13M2 6L15 -2M-5 -10L5 -17M-11 -24L-3 -29" stroke="#fb923c" strokeOpacity=".75" strokeWidth="1.6" strokeLinecap="round" />
                        <path d="M-26 -48L-16 -41L-21 -33Z" fill="#fde68a" stroke="#a16207" strokeWidth=".6" />
                        <path d="M30 -2C20 -14 8 -26 -6 -38" fill="none" stroke="#fff" strokeOpacity=".24" strokeWidth="2" strokeLinecap="round" />
                    </g>
                ))}
            </>
        ),
    },
    phoenix: {
        front: (u) => (
            <>
                <defs>
                    {lin(u('f'), [[0, '#991b1b'], [0.4, '#f97316'], [0.8, '#fde047'], [1, '#fff7c2']])}
                    {rad(u('g'), [[0, '#ff7a1a', 0.55], [1, '#ff7a1a', 0]])}
                    {rad(u('r'), [[0, '#ffd0d0'], [0.45, '#ef4444'], [1, '#7f1d1d']], [0.35, 0.3, 0.8])}
                </defs>
                <circle cx="50" cy="0" r="52" fill={ref(u, 'g')} />
                {[[-72, 30], [-50, 42], [-26, 54], [0, 62], [26, 54], [50, 42], [72, 30]].map(([a, l], i) => (
                    <g key={i} transform={`rotate(${a} 50 26)`}>
                        <g className="cos-flicker" style={after(-i * 0.37)}>
                            <path d={`M50 26C38 18 40 2 50 ${26 - l}C60 2 62 18 50 26Z`} fill={ref(u, 'f')} stroke="#7c2d12" strokeOpacity=".5" strokeWidth=".9" strokeLinejoin="round" />
                            <path d={`M50 22C45 14 46 4 50 ${26 - l * 0.62}C54 4 55 14 50 22Z`} fill="#fff7c2" opacity=".6" />
                        </g>
                    </g>
                ))}
                <path d="M34 26C40 32 60 32 66 26L62 36C54 40 46 40 38 36Z" fill="#f7c948" stroke="#7a4a05" strokeWidth="1" strokeLinejoin="round" />
                <circle cx="50" cy="29" r="5" fill={ref(u, 'r')} stroke="#4a0a0a" strokeWidth=".9" /><circle cx="48.4" cy="27.4" r="1.4" fill="#fff" opacity=".85" />
                <path className="cos-twinkle" d={sparkle(0.7)} transform="translate(84 -6)" fill="#fff" /><path className="cos-twinkle" style={after(-1)} d={sparkle(0.5)} transform="translate(14 -2)" fill="#fff" />
            </>
        ),
    },
};
