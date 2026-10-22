import { skullGlyph } from '@/Components/scene/shapes';
import { SCENE, ScenePalette } from '@/lib/scenes';
import { CSSProperties, useId } from 'react';

const font = 'Figtree, system-ui, sans-serif';

const darken = (hex: string, k: number) => `#${[1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - k)).toString(16).padStart(2, '0')).join('')}`;

type Ids = (name: string) => string;

/**
 * The DJ booth, drawn on a 300 x 150 canvas: a desk with two turntables and a mixer, and the front panel with equalizer lights.
 * The DJ stands in front of it, so the middle of the panel is hidden. `plate` writes "Open decks" there (for the previews and the picture files); in a room a button takes its place.
 * The moving parts only move in a `.sc-live` scene.
 */
export function BoothFrontArt({ u, p, plate }: { u: Ids; p: ScenePalette; plate: boolean }) {
    const bars = [0, 1, 2, 3, 4, 5];

    return (
        <>
            <defs>
                <linearGradient id={u('desk')} x1="0" y1="26" x2="0" y2="66" gradientUnits="userSpaceOnUse"><stop stopColor="#4d389e" /><stop offset="1" stopColor="#1d1346" /></linearGradient>
                <linearGradient id={u('face')} x1="0" y1="66" x2="0" y2="150" gradientUnits="userSpaceOnUse"><stop stopColor="#1e1544" /><stop offset="1" stopColor="#07050f" /></linearGradient>
                <linearGradient id={u('label')} x1="-15" y1="-15" x2="15" y2="15" gradientUnits="userSpaceOnUse"><stop stopColor={p.accent} /><stop offset="1" stopColor={p.accent2} /></linearGradient>
                <filter id={u('blur')} x="-20%" y="-300%" width="140%" height="700%"><feGaussianBlur stdDeviation="4" /></filter>
            </defs>

            {/* the glow it throws on the floor */}
            <ellipse cx="150" cy="150" rx="168" ry="10" fill={p.accent} opacity=".5" filter={`url(#${u('blur')})`} />

            {/* front panel */}
            <path className="sfd-boothfront " d="M14 66H286L299.5 146Q300 150 296 150H4Q0 150 0.5 146Z" fill={`url(#${u('face')})`} />
            <path d="M18 67H282" stroke={p.accent} strokeWidth="5" opacity=".6" filter={`url(#${u('blur')})`} />
            <path d="M14 66.5H286" stroke={p.accent} strokeWidth="2.4" />
            <path d="M14.5 68 2 146M285.5 68 298 146" stroke={p.accent2} strokeOpacity=".55" strokeWidth="1.4" />
            <rect x="8" y="143.5" width="284" height="3" rx="1.5" fill={p.accent} />

            {plate && (
                <>
                    <rect x="86" y="78" width="128" height="48" rx="10" fill="#0a0716" stroke={p.accent2} strokeOpacity=".6" />
                    <text x="150" y="92" textAnchor="middle" fontFamily={font} fontSize="8.5" fontWeight="700" letterSpacing="1.6" fill={p.accent2}>OPEN DECKS</text>
                    <text x="150" y="112" textAnchor="middle" fontFamily={font} fontSize="11.5" fontWeight="600" fill="#a9a3c9">Be the next DJ</text>
                </>
            )}

            {[18, 226].map((x0) => bars.map((i) => (
                <rect
                    key={`${x0}-${i}`}
                    className="sfd-boothlights av av-bottom sc-bar"
                    style={{ animationDelay: `${((i * 3 + (x0 > 100 ? 2 : 0)) % 7) * 0.09}s`, animationDuration: `${0.5 + (i % 3) * 0.15}s` }}
                    x={x0 + i * 9.6}
                    y={136 - (16 + ((i * 11 + (x0 > 100 ? 5 : 0)) % 22))}
                    width="6"
                    height={16 + ((i * 11 + (x0 > 100 ? 5 : 0)) % 22)}
                    rx="1.6"
                    fill={i % 2 ? p.accent2 : p.accent}
                />
            )))}

            {/* the desk with the decks and the mixer */}
            <path className="sfd-boothtop " d="M40 26H260Q265 26 266.5 30L286 66H14L33.5 30Q35 26 40 26Z" fill={`url(#${u('desk')})`} />
            <rect x="44" y="27" width="212" height="2.6" rx="1.3" fill="#fff" opacity=".24" />

            {[74, 226].map((cx, k) => (
                <g key={cx} className="sfd-boothdeck ">
                    <ellipse cx={cx} cy="47" rx="46" ry="14.5" fill="#0c0919" stroke={p.accent2} strokeOpacity=".55" strokeWidth="1.2" />
                    <g transform={`translate(${cx} 47) scale(1 .28)`}>
                        <g className="av sc-spin" style={{ animationDuration: k ? '2.6s' : '3.1s' }}>
                            <circle r="44" fill="#05040b" />
                            <g fill="none" stroke="#2a2250" strokeWidth=".9"><circle r="39" /><circle r="33" /><circle r="28" /><circle r="22" /></g>
                            <path d="M0 0V-42A42 42 0 0 1 29.7 -29.7ZM0 0V42A42 42 0 0 1 -29.7 29.7Z" fill="#fff" opacity=".1" />
                            <circle r="14.5" fill={`url(#${u('label')})`} />
                            <path d="M-8 0A8 8 0 0 1 8 0" stroke="#fff" strokeOpacity=".85" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                            <circle r="3.4" fill="#07050f" />
                        </g>
                    </g>
                    <path d={k ? `M${cx - 41} 37 ${cx - 19} 48` : `M${cx + 41} 37 ${cx + 19} 48`} stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round" />
                    <circle cx={k ? cx - 41 : cx + 41} cy="37" r="3.8" fill="#94a3b8" />
                </g>
            ))}

            <rect className="sfd-boothmixer " x="125" y="31" width="50" height="33" rx="6" fill="#0f0b22" stroke={p.accent} strokeOpacity=".6" />
            {[134, 143, 157, 166].map((x, i) => <circle key={x} cx={x} cy="38.5" r="3" fill={i % 2 ? p.accent : p.accent2} />)}
            <rect x="133.5" y="45" width="3" height="15" rx="1.5" fill="#2a2450" />
            <rect x="163.5" y="45" width="3" height="15" rx="1.5" fill="#2a2450" />
            <rect className="av sc-fader" x="131" y="49" width="8" height="4" rx="1" fill="#e5e7eb" />
            <rect className="av sc-fader" style={{ animationDelay: '-0.7s', animationDuration: '1.9s' }} x="161" y="53" width="8" height="4" rx="1" fill="#e5e7eb" />
            {p.theme === 'halloween' && (
                <>
                    <defs><radialGradient id={u('pk')} cx=".4" cy=".3" r=".85"><stop stopColor="#ffc15e" /><stop offset=".5" stopColor="#ff8a1f" /><stop offset="1" stopColor="#b93d0a" /></radialGradient></defs>
                    {[42, 258].map((x, k) => (
                        <g key={x}>
                            <ellipse className="sc-flame" style={{ animationDelay: `${-k * 0.9}s` }} cx={x} cy="20" rx="22" ry="17" fill={p.accent} opacity=".38" />
                            <ellipse cx={x - 6.5} cy="21" rx="8.4" ry="9.6" fill={`url(#${u('pk')})`} />
                            <ellipse cx={x + 6.5} cy="21" rx="8.4" ry="9.6" fill={`url(#${u('pk')})`} />
                            <ellipse cx={x} cy="21" rx="9.4" ry="10.4" fill={`url(#${u('pk')})`} />
                            <path d={`M${x - 1} 11Q${x} 6 ${x + 3} 4.6L${x + 5} 6.4Q${x + 2} 8 ${x + 2.6} 11Z`} fill="#3f2b13" />
                            <g className="sc-flame" style={{ animationDelay: `${-k * 0.9}s` }} fill="#ffe08a">
                                <path d={`M${x - 7} 19.4L${x - 2.6} 19.4L${x - 4.8} 14.6ZM${x + 2.6} 19.4L${x + 7} 19.4L${x + 4.8} 14.6Z`} />
                                <path d={`M${x - 7} 24Q${x} 30 ${x + 7} 24L${x + 5} 28L${x + 2.6} 25.6L${x} 28.6L${x - 2.6} 25.6L${x - 5} 28Z`} />
                            </g>
                        </g>
                    ))}
                </>
            )}

            {p.theme === 'winter' && (
                <>
                    {[42, 258].map((x) => <path key={x} d={`M${x - 24} 29Q${x - 14} 8 ${x} 12Q${x + 14} 8 ${x + 24} 29Z`} fill="#f4faff" stroke="#bcd6ee" strokeWidth="1" />)}
                    {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${24 + i * 17.2} 67l4 0l-2 ${8 + ((i * 7) % 9)}z`} fill="#d5efff" opacity=".9" />)}
                </>
            )}
            {p.theme === 'spring' && (
                <>
                    {[42, 258].map((x, k) => (
                        <g key={x}>
                            <path d={`M${x - 11} 20H${x + 11}L${x + 8} 31H${x - 8}Z`} fill="#b4602e" stroke="#7a3a18" strokeWidth="1" />
                            {[-7, 0, 7].map((dx, j) => <g key={dx}><path d={`M${x + dx} 20V${9 - (j % 2) * 3}`} stroke="#2f8a3a" strokeWidth="1.8" /><path d={`M${x + dx - 4} ${9 - (j % 2) * 3}Q${x + dx} ${-3 - (j % 2) * 3} ${x + dx + 4} ${9 - (j % 2) * 3}Q${x + dx} ${12 - (j % 2) * 3} ${x + dx - 4} ${9 - (j % 2) * 3}Z`} fill={['#f472b6', '#facc15', '#ef4444', '#c084fc'][(j + k * 2) % 4]} /></g>)}
                        </g>
                    ))}
                    <path d="M14 70Q150 82 286 70" fill="none" stroke="#2f8a3a" strokeWidth="2.4" />
                    {Array.from({ length: 12 }, (_, i) => { const t = (i + 0.5) / 12; return <circle key={i} cx={14 + 272 * t} cy={73 + 6 * 4 * t * (1 - t) * 1} r="3.4" fill={['#f9a8d4', '#fde047', '#ffffff', '#c4b5fd'][i % 4]} />; })}
                </>
            )}
            {p.theme === 'summer' && (
                <>
                    {[42, 258].map((x, k) => (
                        <g key={x}>
                            <ellipse className="sc-flame" style={{ animationDelay: `${-k * 0.7}s` }} cx={x} cy="8" rx="16" ry="16" fill="#ffb02e" opacity=".4" />
                            <rect x={x - 2.4} y="12" width="4.8" height="17" fill="#8a5a2b" /><rect x={x - 4} y="10" width="8" height="5" rx="1.4" fill="#5a3a18" />
                            <path className="sc-flame" style={{ animationDelay: `${-k * 0.7}s` }} d={`M${x} -4Q${x + 6} 3 ${x + 3} 9Q${x} 12 ${x - 3} 9Q${x - 6} 3 ${x} -4Z`} fill="#ffcf4a" />
                        </g>
                    ))}
                    <path d="M14 70Q150 82 286 70" fill="none" stroke="#15803d" strokeWidth="2" />
                    {Array.from({ length: 14 }, (_, i) => { const t = (i + 0.5) / 14; return <circle key={i} cx={14 + 272 * t} cy={73 + 6 * 4 * t * (1 - t) * 1} r="4" fill={['#f43f5e', '#fb923c', '#facc15', '#f472b6', '#22d3ee'][i % 5]} stroke="#00000030" strokeWidth=".6" />; })}
                </>
            )}

            {p.theme === 'christmas' && (
                <>
                    {[42, 258].map((x, k) => (
                        <g key={x}>
                            <ellipse className="sc-twinkle" style={{ animationDelay: `${-k * 0.8}s` }} cx={x} cy="12" rx="22" ry="22" fill="#fbbf24" opacity=".2" />
                            <rect x={x - 2.4} y="28" width="4.8" height="4" fill="#5b3418" />
                            <path d={`M${x - 13} 29L${x} 14L${x + 13} 29Z`} fill="#15803d" />
                            <path d={`M${x - 10} 21L${x} 7L${x + 10} 21Z`} fill="#16a34a" />
                            <path d={`M${x - 7} 14L${x} 1L${x + 7} 14Z`} fill="#22c55e" />
                            <path d={`M${x - 5} 4L${x} 1L${x + 5} 4Q${x + 2} 6 ${x} 4Q${x - 2} 6 ${x - 5} 4ZM${x - 9} 11L${x - 3} 8L${x} 11L${x + 3} 8L${x + 9} 11Q${x} 14 ${x - 9} 11Z`} fill="#f4faff" opacity=".9" />
                            <path d={`M${x} -4l1.6 3.2 3.5.5-2.5 2.5.6 3.5-3.2-1.7-3.2 1.7.6-3.5-2.5-2.5 3.5-.5z`} fill="#fde68a" />
                            {[[x - 6, 25, '#ef4444'], [x + 5, 26, '#fbbf24'], [x - 2, 17, '#38bdf8'], [x + 5, 17, '#ef4444'], [x - 1, 8, '#fbbf24']].map(([bx, by, c], i) => <circle key={i} className={i % 2 ? undefined : 'sc-twinkle'} style={i % 2 ? undefined : { animationDelay: `${-i * 0.3 - k * 0.5}s` }} cx={bx as number} cy={by as number} r="1.7" fill={c as string} />)}
                        </g>
                    ))}
                    <path d="M14 70Q150 82 286 70" fill="none" stroke="#10241a" strokeWidth="1.2" />
                    {Array.from({ length: 14 }, (_, i) => {
                        const t = (i + 0.5) / 14;
                        const c = ['#ef4444', '#fbbf24', '#22c55e', '#38bdf8', '#f472b6'][i % 5];

                        return (
                            <g key={i}>
                                <circle className={i % 3 ? undefined : 'sc-twinkle'} style={i % 3 ? undefined : { animationDelay: `${-i * 0.17}s` }} cx={14 + 272 * t} cy={73 + 12 * t * (1 - t) * 4 * 0.5} r="5.5" fill={c} opacity=".35" />
                                <ellipse cx={14 + 272 * t} cy={73 + 12 * t * (1 - t) * 4 * 0.5} rx="1.9" ry="2.5" fill={c} />
                            </g>
                        );
                    })}
                </>
            )}

            {p.theme === 'christmas2' && (
                <>
                    {[42, 258].map((x, k) => (
                        <g key={x}>
                            <ellipse className="sc-flame" style={{ animationDelay: `${-k * 0.7}s` }} cx={x} cy="6" rx="20" ry="18" fill="#ffb347" opacity=".3" />
                            <rect x={x - 4.5} y="10" width="9" height="19" rx="1.5" fill="#f6ecd8" />
                            <path d={`M${x - 4.5} 12q1.2 3 2.4 0q1.2 4 2.4 0q1.2 2.6 2.2 0q1 3.4 2 0`} fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="1" />
                            <path d={`M${x} 10v-2.4`} stroke="#3a2a1a" strokeWidth="1" />
                            <path className="sc-blaze" style={{ animationDelay: `${-k * 0.4}s` }} d={`M${x} -1Q${x + 4} 4 ${x + 2.4} 7.4Q${x} 9.4 ${x - 2.4} 7.4Q${x - 4} 4 ${x} -1Z`} fill="#ffcf4a" />
                            <path d={`M${x - 3} 29C${x - 10} 25 ${x - 15} 30 ${x - 18} 27C${x - 15} 33 ${x - 8} 33 ${x - 3} 30ZM${x + 3} 29C${x + 10} 25 ${x + 15} 30 ${x + 18} 27C${x + 15} 33 ${x + 8} 33 ${x + 3} 30Z`} fill="#15803d" />
                            {[-2.6, 0.6, 3.4].map((dx, i) => <circle key={i} cx={x + dx} cy={29.6 - (i % 2) * 1.6} r="1.9" fill="#dc2626" />)}
                        </g>
                    ))}
                    <path d="M14 69Q150 89 286 69" fill="none" stroke="#0f3d22" strokeWidth="7" strokeLinecap="round" />
                    <path d="M14 69Q150 89 286 69" fill="none" stroke="#22c55e" strokeWidth="5" strokeDasharray="1.6 2.6" strokeLinecap="round" opacity=".7" />
                    {Array.from({ length: 13 }, (_, i) => {
                        const t = (i + 0.5) / 13;
                        const x = 14 + 272 * t;
                        const y = 72 + 20 * t * (1 - t);

                        return i % 2 ? (
                            <circle key={i} cx={x} cy={y - 2} r="1.9" fill="#dc2626" />
                        ) : (
                            <g key={i}>
                                <circle className={i % 4 ? undefined : 'sc-twinkle'} style={i % 4 ? undefined : { animationDelay: `${-i * 0.2}s` }} cx={x} cy={y} r="5.5" fill="#ffcf6b" opacity=".4" />
                                <circle cx={x} cy={y} r="2" fill="#fff0c2" />
                            </g>
                        );
                    })}
                </>
            )}

            {p.theme === 'halloween2' && (
                <>
                    {[42, 258].map((x, k) => (
                        <g key={x}>
                            <ellipse className="sc-flame" style={{ animationDelay: `${-k * 0.8}s` }} cx={x} cy="12" rx="24" ry="18" fill="#a3e635" opacity=".3" />
                            <path d={`M${x - 12} 15C${x - 14} 26 ${x - 8} 31 ${x} 31C${x + 8} 31 ${x + 14} 26 ${x + 12} 15Z`} fill="#1f1a28" stroke="#4a4458" strokeWidth="1" />
                            <ellipse cx={x} cy="15" rx="12.6" ry="3.4" fill="#2a2433" stroke="#4a4458" strokeWidth="1.2" />
                            <ellipse cx={x} cy="15" rx="10.4" ry="2.4" fill="#bef264" />
                            <circle cx={x - 3} cy="13.6" r="1.6" fill="#ecfccb" /><circle cx={x + 3.4} cy="14" r="1.1" fill="#ecfccb" />
                            <circle className="sc-steam" style={{ animationDelay: `${-k * 1.6}s` }} cx={x} cy="8" r="4" fill="#d9f99d" />
                            <path d={`M${x - 9} 31L${x - 11} 34M${x + 9} 31L${x + 11} 34`} stroke="#1f1a28" strokeWidth="2" strokeLinecap="round" />
                        </g>
                    ))}
                    <path d="M14 69Q82 86 150 72Q218 86 286 69" fill="none" stroke="#e9e4f5" strokeOpacity=".55" strokeWidth="1" />
                    <path d="M14 69Q82 80 150 72Q218 80 286 69M82 79V70M218 79V70M48 75V69M116 76V71M184 76V71M252 75V69" fill="none" stroke="#e9e4f5" strokeOpacity=".35" strokeWidth=".8" />
                    {Array.from({ length: 13 }, (_, i) => {
                        const x = 14 + 272 * ((i + 0.5) / 13);
                        const y = 70 + 12 * Math.sin(((i + 0.5) / 13) * Math.PI * 2) ** 2;

                        return <circle key={i} className={i % 3 ? undefined : 'sc-twinkle'} style={i % 3 ? undefined : { animationDelay: `${-i * 0.2}s` }} cx={x} cy={y} r="2.2" fill={i % 2 ? '#c084fc' : '#a3e635'} />;
                    })}
                </>
            )}
            {p.theme === 'easter' && (
                <>
                    {[42, 258].map((x, k) => (
                        <g key={x}>
                            <path d={`M${x - 15} 22Q${x} 36 ${x + 15} 22Q${x} 30 ${x - 15} 22Z`} fill="#c8925a" stroke="#8a6238" strokeWidth=".8" />
                            {[[-7, 16, '#f9a8d4', -14], [0, 13, '#93c5fd', 4], [7, 16, '#fde68a', 16]].map(([dx, cy, c, a], i) => <ellipse key={i} cx={x + Number(dx)} cy={Number(cy)} rx="4.6" ry="6.2" fill={String(c)} stroke="#fff" strokeWidth=".8" transform={`rotate(${a} ${x + Number(dx)} ${cy})`} />)}
                            <path d={`M${x - 15} 22Q${x - 8} 18 ${x} 22T${x + 15} 22`} fill="none" stroke="#e2b47a" strokeWidth="2" />
                            <path className="sc-twinkle" style={{ animationDelay: `${-k * 0.7}s` }} d={`M${x + 13} 4l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2Z`} fill="#fff" />
                        </g>
                    ))}
                    <path d="M14 69Q150 84 286 69" fill="none" stroke="#e2a05a" strokeWidth="1.4" />
                    {Array.from({ length: 12 }, (_, i) => {
                        const t = (i + 0.5) / 12;
                        const x = 14 + 272 * t;
                        const y = 74 + 30 * t * (1 - t);

                        return <ellipse key={i} cx={x} cy={y} rx="3.4" ry="4.6" fill={['#f9a8d4', '#c4b5fd', '#93c5fd', '#86efac', '#fde68a', '#fdba74'][i % 6]} stroke="#fff" strokeWidth=".7" />;
                    })}
                </>
            )}
            {p.theme === 'midsummer' && (
                <>
                    {[42, 258].map((x, k) => (
                        <g key={x}>
                            <ellipse className="sc-flame" style={{ animationDelay: `${-k * 0.8}s` }} cx={x} cy="16" rx="22" ry="14" fill="#fbbf24" opacity=".25" />
                            <ellipse cx={x} cy="22" rx="14" ry="5" fill="none" stroke="#3f8a3a" strokeWidth="4" />
                            {Array.from({ length: 8 }, (_, i) => {
                                const a = (i / 8) * Math.PI * 2;

                                return <circle key={i} cx={x + Math.cos(a) * 14} cy={22 + Math.sin(a) * 5} r="2.4" fill={['#fbfaf2', '#3b82f6', '#fde047'][i % 3]} />;
                            })}
                            <rect x={x - 2.2} y="3" width="4.4" height="14" rx="1" fill="#f6ecd8" />
                            <path className="sc-blaze" style={{ animationDelay: `${-k * 0.4}s` }} d={`M${x} -7Q${x + 4} -2 ${x + 2.4} 1.6Q${x} 3.4 ${x - 2.4} 1.6Q${x - 4} -2 ${x} -7Z`} fill="#ffcf4a" />
                        </g>
                    ))}
                    <path d="M14 69Q150 86 286 69" fill="none" stroke="#2f6b34" strokeWidth="5" strokeLinecap="round" />
                    {Array.from({ length: 14 }, (_, i) => {
                        const t = (i + 0.5) / 14;
                        const x = 14 + 272 * t;
                        const y = 70 + 34 * t * (1 - t);

                        return <circle key={i} cx={x} cy={y} r="2.6" fill={['#fbfaf2', '#3b82f6', '#fde047'][i % 3]} stroke="#00000033" strokeWidth=".5" />;
                    })}
                </>
            )}

            {p.theme === 'goldmine' && (
                <>
                    <defs><linearGradient id={u('gb')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fde68a" /><stop offset=".5" stopColor="#fbbf24" /><stop offset="1" stopColor="#b45309" /></linearGradient></defs>
                    {[42, 258].map((x, k) => (
                        <g key={x}>
                            <ellipse className="sc-flame" style={{ animationDelay: `${-k * 0.9}s` }} cx={x} cy="16" rx="30" ry="16" fill="#fbbf24" opacity=".3" />
                            {[[-21, 26], [1, 26], [-10, 17]].map(([dx, y], i) => (
                                <g key={i}>
                                    <rect x={x + dx} y={y - 9} width="20" height="9" rx="1.4" fill={`url(#${u('gb')})`} stroke="#92400e" strokeWidth=".8" />
                                    <path d={`M${x + dx + 2.5} ${y - 6.2}H${x + dx + 10}`} stroke="#fff7c2" strokeWidth="1.2" strokeLinecap="round" />
                                </g>
                            ))}
                            <path className="sc-twinkle" style={{ animationDelay: `${-k * 0.8}s` }} d={`M${x + 12} 2l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4Z`} fill="#fff8cf" />
                        </g>
                    ))}
                </>
            )}

            {(p.theme === 'skull' || p.theme === 'skulls') && (
                <>
                    <defs>{skullGlyph(u('sk'))}</defs>
                    {[42, 258].map((x, k) => (
                        <g key={x}>
                            <ellipse className="sc-flame" style={{ animationDelay: `${-k * 0.9}s` }} cx={x} cy="12" rx="26" ry="18" fill={p.theme === 'skull' ? '#ef4444' : '#fbbf24'} opacity=".3" />
                            <use href={`#${u('sk')}`} transform={`translate(${x} 15) scale(.21)`} />
                            {p.theme === 'skull'
                                ? [-3.4, 3.4].map((dx) => <circle key={dx} className="sc-flame" style={{ animationDelay: `${-k * 0.5}s` }} cx={x + dx} cy="12.9" r="2.2" fill="#ff3a2a" />)
                                : (
                                    <>
                                        <rect x={x - 1.6} y="-4" width="3.2" height="6.6" rx=".8" fill="#efe6cf" />
                                        <path className="sc-flame" style={{ animationDelay: `${-k * 0.6}s` }} d={`M${x} -5C${x - 2.4} -8.4 ${x - 1} -10.4 ${x} -14C${x + 1} -10.4 ${x + 2.4} -8.4 ${x} -5Z`} fill="#ffd36b" />
                                    </>
                                )}
                        </g>
                    ))}
                </>
            )}

            {p.theme === 'foxy' && (
                <>
                    {[42, 258].map((x, k) => (
                        <g key={x}>
                            <ellipse className="sc-flame" style={{ animationDelay: `${-k * 0.9}s` }} cx={x} cy="14" rx="24" ry="16" fill="#9dff4a" opacity=".22" />
                            <path d={`M${x - 11} 26L${x - 12} 6L${x - 4} 13L${x} 12L${x + 4} 13L${x + 12} 6L${x + 11} 26Q${x} 33 ${x - 11} 26Z`} fill="#f97316" stroke="#7c2d12" strokeWidth=".8" strokeLinejoin="round" />
                            <path d={`M${x - 7} 26Q${x} 20 ${x + 7} 26Q${x} 31 ${x - 7} 26Z`} fill="#fff7ed" />
                            <circle cx={x} cy="25" r="1.4" fill="#1c1917" />
                            <circle cx={x - 5} cy="19" r="1.5" fill="#9dff4a" /><circle cx={x + 5} cy="19" r="1.5" fill="#9dff4a" />
                        </g>
                    ))}
                </>
            )}

            {p.theme === 'dragon' && (
                <>
                    <defs><radialGradient id={u('pe')} cx=".38" cy=".32" r=".8"><stop stopColor="#fff" /><stop offset=".35" stopColor="#ffe9a0" /><stop offset=".8" stopColor="#ffb347" /><stop offset="1" stopColor="#e8741c" /></radialGradient></defs>
                    {[42, 258].map((x, k) => (
                        <g key={x}>
                            <ellipse className="sc-flame" style={{ animationDelay: `${-k * 0.9}s` }} cx={x} cy="14" rx="26" ry="18" fill="#ff9a1f" opacity=".3" />
                            <path className="sc-flame" style={{ animationDelay: `${-k * 0.6}s` }} d={`M${x - 3} 12C${x - 12} -2 ${x - 6} -10 ${x - 2} -18C${x} -8 ${x + 9} -2 ${x + 4} 12Z`} fill="#ff8a3c" opacity=".85" />
                            <circle cx={x} cy="18" r="8.6" fill={`url(#${u('pe')})`} /><circle cx={x - 2.6} cy="15" r="2.2" fill="#fff" opacity=".85" />
                            <path d={`M${x - 12} 26Q${x} 20 ${x + 12} 26`} fill="none" stroke="#fcbf49" strokeWidth="2.4" strokeLinecap="round" />
                        </g>
                    ))}
                </>
            )}

            {p.theme === 'monstercat' && (
                <>
                    {[42, 258].map((x, k) => (
                        <g key={x}>
                            <ellipse className="sc-flame" style={{ animationDelay: `${-k * 0.9}s` }} cx={x} cy="14" rx="24" ry="16" fill="#7cff4f" opacity=".22" />
                            <path d={`M${x - 13} 27L${x - 15} 5L${x - 5} 12L${x} 10L${x + 5} 12L${x + 15} 5L${x + 13} 27Q${x} 34 ${x - 13} 27Z`} fill="#1a0f3a" stroke="#a855f7" strokeWidth="1" strokeLinejoin="round" />
                            <path d={`M${x - 10} 20Q${x - 6} 14 ${x - 2} 20Q${x - 6} 22 ${x - 10} 20ZM${x + 10} 20Q${x + 6} 14 ${x + 2} 20Q${x + 6} 22 ${x + 10} 20Z`} fill="#7cff4f" />
                            <path d={`M${x - 4} 28L${x - 2} 25L${x} 28L${x + 2} 25L${x + 4} 28`} fill="none" stroke="#f4f1ff" strokeWidth="1.1" strokeLinejoin="round" />
                        </g>
                    ))}
                </>
            )}

            {p.theme === 'tastycat' && (
                <>
                    {[42, 258].map((x, k) => (
                        <g key={x}>
                            <ellipse className="sc-flame" style={{ animationDelay: `${-k * 0.9}s` }} cx={x} cy="14" rx="22" ry="15" fill="#ff5fa2" opacity=".22" />
                            <path d={`M${x - 10} 29L${x - 8} 18H${x + 8}L${x + 10} 29Z`} fill="#fde68a" stroke="#b45309" strokeWidth=".8" strokeLinejoin="round" />
                            <path d={`M${x - 5} 19V28M${x} 19V28M${x + 5} 19V28`} stroke="#b45309" strokeOpacity=".5" strokeWidth=".8" />
                            <path d={`M${x - 12} 19C${x - 14} 11 ${x - 6} 8 ${x} 9C${x + 6} 8 ${x + 14} 11 ${x + 12} 19Z`} fill={k ? '#7ee0c4' : '#ffb3d4'} stroke="#be185d" strokeWidth=".8" strokeLinejoin="round" />
                            <circle cx={x} cy="6.4" r="3.1" fill="#ef4444" /><path d={`M${x} 3.4Q${x + 2} 0 ${x + 5} 0.6`} fill="none" stroke="#166534" strokeWidth="1" strokeLinecap="round" />
                            {[[-6, 14], [5, 13], [0, 16.5]].map(([dx, y], i) => <rect key={i} x={x + dx - 1.4} y={y} width="2.8" height="1.2" rx=".6" transform={`rotate(${i * 40 - 30} ${x + dx} ${y})`} fill={['#fff', '#ffd23f', '#a78bfa'][i]} />)}
                        </g>
                    ))}
                </>
            )}

            {p.theme === 'tasty' && (
                <>
                    {[42, 258].map((x, k) => (
                        <g key={x}>
                            <ellipse className="sc-flame" style={{ animationDelay: `${-k * 0.9}s` }} cx={x} cy="14" rx="24" ry="16" fill="#ff8a3d" opacity=".26" />
                            <path d={`M${x - 13} 16C${x - 13} 3 ${x + 13} 3 ${x + 13} 16Z`} fill="#e8a24a" stroke="#7c3f0e" strokeWidth=".8" strokeLinejoin="round" />
                            {[[-5, 8], [2, 6.4], [7, 10], [-1, 11]].map(([dx, y], i) => <ellipse key={i} cx={x + dx} cy={y} rx="1.2" ry=".7" fill="#fff7d6" />)}
                            <path d={`M${x - 14} 17C${x - 11} 15 ${x - 9} 19 ${x - 6} 17C${x - 3} 15 ${x} 19 ${x + 3} 17C${x + 6} 15 ${x + 9} 19 ${x + 14} 17V19.4H${x - 14}Z`} fill="#4ade80" />
                            <rect x={x - 13} y="19.4" width="26" height="4.4" rx="2.2" fill="#6b3a1e" />
                            <path d={`M${x - 13} 24.6H${x + 13}Q${x + 13} 30 ${x} 30Q${x - 13} 30 ${x - 13} 24.6Z`} fill="#e8a24a" stroke="#7c3f0e" strokeWidth=".8" strokeLinejoin="round" />
                        </g>
                    ))}
                </>
            )}

            {[0, 1, 2, 3, 4].map((i) => (
                <rect key={i} className="av sc-led" style={{ animationDelay: `${i * 0.13}s` }} x="146" y={44 + i * 3.4} width="8" height="2.4" rx="1" fill={i < 2 ? '#f87171' : i < 3 ? '#fbbf24' : '#4ade80'} />
            ))}

        </>
    );
}

/** The booth on the scene: see BoothFrontArt. */
export function BoothFront({ p, plate = false, className = '', style }: { p: ScenePalette; plate?: boolean; className?: string; style?: CSSProperties }) {
    const uid = useId().replace(/:/g, '');

    return (
        <svg viewBox="0 0 300 150" width={SCENE.booth.w} height={SCENE.booth.h} overflow="visible" className={`sfd-booth ${className}`} style={style} aria-hidden>
            <BoothFrontArt u={(n) => `${uid}-${n}`} p={p} plate={plate} />
        </svg>
    );
}

/**
 * The DJ from the chest up, to go under the DJ's picture: a hoodie and two fists in the air that pump to the beat.
 * Coordinates are measured from the middle of the picture (which is 100 wide), so the drawing is 240 x 170 around it.
 */
export function DjBody({ p, className = '', style }: { p: ScenePalette; className?: string; style?: CSSProperties }) {
    const uid = useId().replace(/:/g, '');
    const hood = `url(#${uid}-hood)`;

    return (
        <svg viewBox="-120 -60 240 170" width="240" height="170" overflow="visible" className={className} style={style} aria-hidden>
            <defs>
                <linearGradient id={`${uid}-hood`} x1="0" y1="30" x2="0" y2="100" gradientUnits="userSpaceOnUse"><stop stopColor={p.glow} /><stop offset="1" stopColor={darken(p.glow, 0.55)} /></linearGradient>
            </defs>
            <g className="av sc-pump">
                <path d="M-56 52Q-90 48 -94 10" stroke={hood} strokeWidth="19" strokeLinecap="round" fill="none" />
                <rect x="-104" y="-8" width="20" height="9" rx="4.5" fill={darken(p.glow, 0.3)} />
                <circle cx="-94" cy="-12" r="11" fill="#f6cfa8" stroke="#d3a47a" strokeWidth=".9" />
            </g>
            <g className="av sc-pump sc-pump-b">
                <path d="M56 52Q90 48 94 10" stroke={hood} strokeWidth="19" strokeLinecap="round" fill="none" />
                <rect x="84" y="-8" width="20" height="9" rx="4.5" fill={darken(p.glow, 0.3)} />
                <circle cx="94" cy="-12" r="11" fill="#f6cfa8" stroke="#d3a47a" strokeWidth=".9" />
            </g>
            <path d="M-54 30H54Q68 30 70 44L74 102Q74 106 70 106H-70Q-74 106 -74 102L-70 44Q-68 30 -54 30Z" fill={hood} />
            <path d="M-22 33Q0 54 22 33" stroke="#fff" strokeOpacity=".28" strokeWidth="3.4" strokeLinecap="round" fill="none" />
            <path d="M-11 46-13 74M11 46 13 74" stroke="#e5e7eb" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="0" cy="88" r="9" fill="none" stroke={p.accent} strokeWidth="2.4" />
            <circle cx="0" cy="88" r="2.4" fill={p.accent} />
        </svg>
    );
}