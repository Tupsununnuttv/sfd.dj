import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { cloud } from '@/Components/scene/shapes';
import { after, floorGrid, r1, rand } from '@/Components/scene/util';
import { floorLineX as lineX, floorRowY as rowY, floorTile as tile, SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

const FLOOR = SCENE.floor;
const tv = SCENE.screen;
const font = 'Figtree, system-ui, sans-serif';
const PINKS = ['#ffc9dd', '#ffb0cf', '#ff9ec2', '#ffe0ec'];
const RAINBOW = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#38bdf8', '#8b5cf6'];

// flowers in the grass of the hills, the crowns of the two cherry trees and the tulips along the fence: the same every time
const rs = rand(41);
const SPECKS = Array.from({ length: 90 }, () => ({ x: rs() * 1600, y: 480 + rs() * 150, c: ['#ffffff', '#fde047', '#f9a8d4', '#fb7185'][Math.floor(rs() * 4)], r: 1.6 + rs() * 1.6 }));
const LAWN = Array.from({ length: 40 }, () => ({ x: rs() * 1600, y: 650 + rs() * 240, c: ['#ffffff', '#fde047', '#f9a8d4'][Math.floor(rs() * 3)], r: 1.8 + rs() * 1.8 }));
const crown = (seed: number) => {
    const r = rand(seed);

    return {
        blobs: Array.from({ length: 28 }, () => ({ x: r1((r() * 2 - 1) * 150), y: r1((r() * 2 - 1) * 90), r: r1(32 + r() * 30), c: PINKS[Math.floor(r() * 4)] })),
        dots: Array.from({ length: 46 }, () => ({ x: r1((r() * 2 - 1) * 170), y: r1((r() * 2 - 1) * 110), r: r1(2.4 + r() * 3.4) })),
    };
};
const CROWNS = [crown(3), crown(8)];
const TULIPS = Array.from({ length: 70 }, (_, k) => ({ x: k < 35 ? 4 + k * 18.2 + rs() * 8 : 968 + (k - 35) * 18.2 + rs() * 8, y: 598 + rs() * 10, c: ['#ef4444', '#facc15', '#f472b6', '#c084fc', '#fb923c'][k % 5], s: 0.8 + rs() * 0.5 }));
const ROSES = Array.from({ length: 22 }, (_, k) => {
    const t = (k + 0.5) / 22;
    const a = Math.PI * (1 - t);

    return { x: 800 + Math.cos(a) * 96 + (k % 2 ? 4 : -4), y: 548 - Math.sin(a) * 70 + (k % 3) * 3, c: ['#fb7185', '#f9a8d4', '#ffffff', '#f43f5e'][k % 4] };
});
const DAISIES = Array.from({ length: 30 }, (_, k) => {
    const a = (k * Math.PI * 2) / 30;
    const sy = Math.sin(a);

    return { x: r1(800 + Math.cos(a) * 332), y: r1(sy * 56), s: r1(0.9 + (sy + 1) * 0.3), k };
});

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/**
 * The spring scenery on a 1600 x 900 canvas: a bright morning after the rain. A rainbow behind the screen, a hot-air balloon drifting by, a windmill and
 * little white cottages on green hills, two cherry trees in blossom, a rose arch with the name, and the video in a trellis hung with ivy and bunting.
 * The dance floor is a mown lawn with a ring of daisies under the booth. Like the others it only moves while a song plays (`live`): clouds drift,
 * the balloon floats across, the windmill turns and butterflies flutter; the blossom that falls over everything is drawn by RoomScene (Snow.tsx).
 */
export default function SpringBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (n: string) => `${uid}-${n}`;
    const f = (n: string) => `url(#${u(n)})`;
    const ext = Math.max(0, height - SCENE.h); // the stage sits on the bottom edge of the canvas, so on a tall one it moves down
    const use = (id: string, x: number, y: number, s: number, k: string | number) => <use key={k} href={`#${u(id)}`} transform={`translate(${r1(x)} ${r1(y)}) scale(${r1(s)})`} />;

    const cottage = (k: string, x: number, y: number, w: number) => {
        const h = w * 0.6;

        return (
            <g key={k}>
                <ellipse cx={x} cy={y + 2} rx={w * 0.7} ry="3" fill="#2f6b2a" opacity=".35" />
                <rect x={x - w / 2} y={y - h} width={w} height={h} fill="#fff7e6" />
                <path d={`M${x - w * 0.62} ${y - h}L${x} ${y - h - w * 0.5}L${x + w * 0.62} ${y - h}Z`} fill="#d9534f" />
                <rect x={x - w * 0.3} y={y - h * 0.75} width={w * 0.22} height={h * 0.34} fill="#7cc3f2" stroke="#8a5a2b" strokeWidth=".8" />
                <rect x={x + w * 0.1} y={y - h * 0.6} width={w * 0.2} height={h * 0.6} fill="#8a5a2b" />
            </g>
        );
    };

    const sakura = (cx: number, cy: number, s: number, c: ReturnType<typeof crown>, flip = 1) => (
        <g transform={`translate(${cx} ${cy}) scale(${s * flip} ${s})`}>
            <ellipse cx="0" cy="6" rx="150" ry="12" fill="#1f5a2c" opacity=".4" />
            <path d="M-18 6C-14 -60 -26 -120 -52 -190M18 6C14 -50 26 -110 56 -176M-4 -90C-40 -130 -70 -150 -96 -176M6 -100C38 -140 70 -166 96 -190" fill="none" stroke="#5a3a28" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M-4 6C-2 -60 -10 -110 -30 -170" fill="none" stroke="#7a5238" strokeWidth="8" strokeLinecap="round" opacity=".6" />
            <g transform="translate(0 -250)">
                {c.blobs.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={b.c} />)}
                {c.dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#fff" opacity=".7" />)}
            </g>
        </g>
    );

    const butterfly = (k: string, x: number, y: number, c1: string, c2: string, d: number) => (
        <g key={k} className="sc-flutter" style={after(d)}>
            <g transform={`translate(${x} ${y})`}>
                <g className="sc-flap" style={after(d / 4)}>
                    <path d="M0 0C-8 -14 -22 -14 -20 -2C-19 6 -8 6 0 0ZM0 0C8 -14 22 -14 20 -2C19 6 8 6 0 0Z" fill={c1} stroke="#4a2a12" strokeWidth=".8" />
                    <path d="M0 2C-6 10 -16 10 -14 16C-12 20 -4 14 0 2ZM0 2C6 10 16 10 14 16C12 20 4 14 0 2Z" fill={c2} stroke="#4a2a12" strokeWidth=".8" />
                </g>
                <path d="M0 -6V12M0 -6L-5 -13M0 -6L5 -13" stroke="#3a2a1a" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            </g>
        </g>
    );

    const left = tv.x - 18;
    const right = tv.x + tv.w + 18;
    const bottom = tv.y + tv.h + 14;
    const FLAGS = ['#f472b6', '#facc15', '#86efac', '#7dd3fc', '#c4b5fd'];
    const bunting = Array.from({ length: 20 }, (_, i) => {
        const x0 = left + 24 + i * 35.6;
        const t = (i + 0.5) / 20;
        const y = bottom + 6 + 12 * 4 * t * (1 - t);

        return <path key={i} d={`M${r1(x0)} ${r1(y - 2)}L${r1(x0 + 28)} ${r1(y - 2)}L${r1(x0 + 14)} ${r1(y + 26)}Z`} fill={FLAGS[i % 5]} stroke="#00000022" strokeWidth=".8" />;
    });
    const ivy = (x: number, k: string) => (
        <g key={k}>
            {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${x} ${14 + i * 36}c${i % 2 ? 12 : -12} 4 ${i % 2 ? 14 : -14} 16 ${i % 2 ? 2 : -2} 20c${i % 2 ? -12 : 12} -4 ${i % 2 ? -12 : 12} -16 ${i % 2 ? -2 : 2} -20Z`} fill={i % 3 ? '#3f9a46' : '#6dc25c'} />)}
            {Array.from({ length: 6 }, (_, i) => <circle key={i} cx={x + (i % 2 ? 9 : -9)} cy={40 + i * 66} r="5" fill={PINKS[i % 4]} stroke="#e879a8" strokeWidth=".8" />)}
        </g>
    );
    const branch = (k: string) => (
        <g key={k}>
            <path d="M-20 40C60 90 170 70 250 40S360 40 420 70" fill="none" stroke="#5a3a28" strokeWidth="14" strokeLinecap="round" />
            {Array.from({ length: 16 }, (_, i) => <circle key={i} cx={r1(10 + i * 26)} cy={r1(60 + Math.sin(i * 0.9) * 26 + (i % 3) * 6)} r={r1(14 + (i % 4) * 4)} fill={PINKS[i % 4]} />)}
            {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={r1(20 + i * 29)} cy={r1(50 + Math.sin(i * 0.9 + 1) * 30)} r="3.4" fill="#fff" opacity=".8" />)}
        </g>
    );

    return (
        <svg viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${live ? 'sc-live' : ''} ${className}`} aria-hidden>
            <defs>
                <linearGradient id={u('sky')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#4aaeee" /><stop offset=".45" stopColor="#8fd0f6" /><stop offset=".75" stopColor="#cdeefc" /><stop offset="1" stopColor="#fff4d6" /></linearGradient>
                <radialGradient id={u('sunGlow')} cx="210" cy="120" r="330" gradientUnits="userSpaceOnUse"><stop stopColor="#fff6c4" stopOpacity=".9" /><stop offset=".3" stopColor="#ffe58a" stopOpacity=".4" /><stop offset="1" stopColor="#ffe58a" stopOpacity="0" /></radialGradient>
                <linearGradient id={u('hillA')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#b6ea9a" /><stop offset="1" stopColor="#7fcf74" /></linearGradient>
                <linearGradient id={u('hillB')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8fdc72" /><stop offset="1" stopColor="#4fb255" /></linearGradient>
                <linearGradient id={u('hillC')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#6bc65a" /><stop offset="1" stopColor="#3b9544" /></linearGradient>
                <linearGradient id={u('floor')} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.floorTop} /><stop offset="1" stopColor={p.floorBottom} /></linearGradient>
                <linearGradient id={u('haze')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#bfe9a8" stopOpacity="0" /><stop offset="1" stopColor={p.floorBottom} stopOpacity=".55" /></linearGradient>
                <radialGradient id={u('pool')} cx=".5" cy=".5" r=".5"><stop stopColor="#fff6c4" stopOpacity=".5" /><stop offset=".6" stopColor="#d7f3a8" stopOpacity=".2" /><stop offset="1" stopColor="#d7f3a8" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('vig')} cx="800" cy={height / 2 - 10} r="1020" gradientUnits="userSpaceOnUse"><stop offset=".6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#0b2a10" stopOpacity=".45" /></radialGradient>
                <radialGradient id={u('fog')} cx=".5" cy=".5" r=".5"><stop stopColor="#ffffff" stopOpacity=".5" /><stop offset=".55" stopColor="#e6f7d8" stopOpacity=".18" /><stop offset="1" stopColor="#e6f7d8" stopOpacity="0" /></radialGradient>
                <radialGradient id={u('shine')} cx=".34" cy=".3" r=".7"><stop stopColor="#fff" stopOpacity=".7" /><stop offset=".4" stopColor="#fff" stopOpacity=".1" /><stop offset="1" stopColor="#000" stopOpacity=".2" /></radialGradient>
                <clipPath id={u('env')}><path d="M0 -62C-52 -62 -58 -4 -22 34L22 34C58 -4 52 -62 0 -62Z" /></clipPath>
                <g id={u('daisy')}>
                    {[0, 60, 120, 180, 240, 300].map((a) => <ellipse key={a} cx="0" cy="-5.4" rx="2.6" ry="4.4" fill="#fff" stroke="#e5e7eb" strokeWidth=".4" transform={`rotate(${a})`} />)}
                    <circle r="2.8" fill="#facc15" />
                </g>
                <g id={u('tulip')}>
                    <path d="M0 0V-12" stroke="#2f8a3a" strokeWidth="1.6" /><path d="M0 -4Q-6 -6 -7 -11Q-3 -9 0 -6ZM0 -4Q6 -6 7 -11Q3 -9 0 -6Z" fill="#3f9a46" />
                    <path d="M-4.4 -13Q-4.6 -20 0 -22Q4.6 -20 4.4 -13Q0 -9 -4.4 -13Z" fill="currentColor" />
                </g>
            </defs>

            {/* the sky: sun, clouds, the rainbow, a balloon */}
            <rect width="1600" height="650" fill={f('sky')} />
            <circle cx="210" cy="120" r="330" fill={f('sunGlow')} />
            <g className="sc-rays" opacity=".5"><g transform="translate(210 120)" stroke="#fff3b0" strokeWidth="6" strokeLinecap="round">{Array.from({ length: 12 }, (_, k) => <path key={k} d="M0 -70V-104" transform={`rotate(${k * 30})`} strokeWidth={k % 2 ? 4 : 7} />)}</g></g>
            <circle cx="210" cy="120" r="46" fill="#fff4b0" /><circle cx="210" cy="120" r="38" fill="#ffe36a" />
            <g fill="none" opacity=".42">{RAINBOW.map((c, i) => <circle key={c} cx="800" cy="760" r={690 - i * 17} stroke={c} strokeWidth="17.5" />)}</g>
            <g className="sc-drift">{cloud('c1', 120, 330, 0.8)}{cloud('c3', 1280, 180, 0.7)}</g>
            <g className="sc-drift" style={after(-5)}>{cloud('c2', 370, 190, 0.55)}{cloud('c4', 1500, 330, 0.85)}</g>
            <g className="sc-balloon">
                <g transform="translate(330 296)">
                    <g className="sc-bob">
                        <g clipPath={f('env')}>
                            {['#ef4444', '#fde047', '#ffffff', '#38bdf8', '#ef4444', '#fde047', '#ffffff'].map((c, i) => <rect key={i} x={-63 + i * 18} y="-64" width="18" height="100" fill={c} />)}
                            <rect x="-60" y="-64" width="120" height="100" fill={f('shine')} />
                        </g>
                        <path d="M0 -62C-52 -62 -58 -4 -22 34L22 34C58 -4 52 -62 0 -62Z" fill="none" stroke="#7f1d1d" strokeWidth="1.4" opacity=".6" />
                        <path d="M-20 34L-10 56M20 34L10 56M-4 34L-3 56M4 34L3 56" stroke="#5a3a28" strokeWidth="1.6" />
                        <rect x="-13" y="54" width="26" height="16" rx="3" fill="#a16207" stroke="#5a3a28" strokeWidth="1.4" /><path d="M-13 60H13" stroke="#5a3a28" strokeWidth="1.2" />
                    </g>
                </g>
            </g>

            {/* the hills, a windmill and the cottages */}
            <path d="M0 500C140 462 300 482 460 490S720 516 900 502S1160 466 1320 480S1520 484 1600 470V650H0Z" fill={f('hillA')} />
            {cottage('h1', 560, 512, 38)}{cottage('h2', 626, 520, 30)}{cottage('h3', 1010, 506, 34)}{cottage('h4', 1066, 500, 28)}
            <g transform="translate(1262 528)">
                <ellipse cx="0" cy="2" rx="44" ry="6" fill="#2f6b2a" opacity=".35" />
                <path d="M-26 0L-16 -112H16L26 0Z" fill="#f6ead3" /><path d="M4 -112H16L26 0H4Z" fill="#dccaa6" />
                <path d="M-22 -112L0 -142L22 -112Z" fill="#b5483a" />
                <path d="M-8 0V-24A8 8 0 0 1 8 -24V0Z" fill="#7a4a26" /><rect x="-5" y="-70" width="10" height="14" fill="#7cc3f2" stroke="#7a4a26" strokeWidth="1.2" />
                <g transform="translate(0 -118)">
                    <g className="sc-blades">
                        {[0, 90, 180, 270].map((a) => (
                            <g key={a} transform={`rotate(${a})`}>
                                <rect x="-2.4" y="-66" width="4.8" height="66" fill="#7a5238" />
                                <rect x="2.4" y="-64" width="15" height="42" fill="#fdf6e3" stroke="#b49a74" strokeWidth="1.2" /><path d="M2.4 -50H17.4M2.4 -36H17.4M10 -64V-22" stroke="#b49a74" strokeWidth="1" />
                            </g>
                        ))}
                    </g>
                    <circle r="6" fill="#7a5238" />
                </g>
            </g>
            <path d="M0 540C120 516 260 528 400 536S640 556 800 548S1080 520 1250 530S1480 536 1600 520V650H0Z" fill={f('hillB')} />
            <path d="M0 584C100 566 220 572 340 580S560 600 700 596L900 596S1100 578 1260 572S1480 566 1600 580V650H0Z" fill={f('hillC')} />
            {SPECKS.filter((s) => s.y > 520).map((s, k) => <circle key={k} cx={r1(s.x)} cy={r1(s.y)} r={r1(s.r)} fill={s.c} opacity=".85" />)}

            {/* the rose arch with the name */}
            <ellipse cx="800" cy="552" rx="170" ry="80" fill="#fff6c4" opacity=".28" />
            <g fill="none" strokeLinecap="round">
                <path d="M704 604V548Q704 478 800 478Q896 478 896 548V604" stroke="#8a5a2b" strokeWidth="16" />
                <path d="M704 604V548Q704 478 800 478Q896 478 896 548V604" stroke="#3f9a46" strokeWidth="11" strokeDasharray="5 3" />
                <path d="M704 604V548Q704 478 800 478Q896 478 896 548V604" stroke="#6dc25c" strokeWidth="5" strokeDasharray="3 6" />
            </g>
            {ROSES.map((r, i) => <g key={i}><circle cx={r1(r.x)} cy={r1(r.y)} r="8.4" fill={r.c} /><circle cx={r1(r.x)} cy={r1(r.y)} r="4.6" fill="none" stroke="#00000030" strokeWidth="1.2" /><circle cx={r1(r.x - 2)} cy={r1(r.y - 2)} r="1.6" fill="#fff" opacity=".6" /></g>)}
            <path d="M774 488V478M826 488V478" stroke="#8a5a2b" strokeWidth="2" /><rect x="754" y="488" width="92" height="28" rx="6" fill="#fff6e0" stroke="#8a5a2b" strokeWidth="2.2" />
            <text x="800" y="508" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize="17" letterSpacing="1" fill="#c2410c">SFD-DJ.EU</text>
            {[704, 896].map((x) => <ellipse key={x} cx={x} cy="605" rx="24" ry="7" fill="#2f7a32" opacity=".5" />)}

            {/* the fence and the tulips along it */}
            {[0, 960].map((x) => (
                <g key={x}>
                    <rect x={x} y="566" width="640" height="3.6" fill="#fff" /><rect x={x} y="582" width="640" height="3.6" fill="#fff" />
                    {Array.from({ length: 40 }, (_, i) => <path key={i} d={`M${x + i * 16 + 2} 600V562Q${x + i * 16 + 8} 554 ${x + i * 16 + 14} 562V600Z`} fill="#fffdf6" stroke="#d6cfba" strokeWidth=".8" />)}
                </g>
            ))}
            {TULIPS.map((t, k) => <g key={k} color={t.c}>{use('tulip', t.x, t.y, t.s, `t${k}`)}</g>)}

            {/* the frame the video hangs in: a trellis, ivy, blossom and bunting */}
            <rect x={tv.x - 30} y={tv.y - 30} width={tv.w + 60} height={tv.h + 56} rx="26" fill="#ffe58a" opacity=".16" />
            <rect x={tv.x - 18} y={tv.y - 22} width={tv.w + 36} height={tv.h + 36} rx="16" fill="#1f160c" stroke="#a9733a" strokeWidth="6" />
            <rect x={tv.x - 18} y={tv.y - 22} width={tv.w + 36} height={tv.h + 36} rx="16" fill="none" stroke="#e7b878" strokeWidth="1.6" strokeOpacity=".7" />
            {ivy(left + 1, 'ivL')}{ivy(right - 1, 'ivR')}
            <path d={`M${left + 20} ${bottom + 2}Q${(left + right) / 2} ${bottom + 26} ${right - 20} ${bottom + 2}`} stroke="#5a3a28" strokeWidth="2" fill="none" />
            {bunting}
            {[left + 6, right - 6].map((x, i) => (
                <g key={x} transform={`translate(${x} ${bottom - 2})`}>
                    <path d="M-16 0H16L11 22H-11Z" fill="#a9733a" stroke="#5a3a28" strokeWidth="1.4" /><path d="M-14 8H14" stroke="#7a5238" strokeWidth="1.2" />
                    {[-9, 0, 9].map((dx, j) => <circle key={dx} cx={dx} cy={-4 - (j % 2) * 5} r="7" fill={PINKS[(i + j) % 4]} />)}
                    <circle cx="0" cy="-6" r="3" fill="#facc15" />
                </g>
            ))}
            <g>{branch('bl')}</g>
            <g transform="translate(1600 0) scale(-1 1)">{branch('br')}</g>

            {/* the floor: a mown lawn */}
            <rect y={FLOOR} width="1600" height={height - FLOOR} fill={f('floor')} />
            {floorGrid(height).map(({ i, j }) => {
                const stone = (i * 7 + j * 3 + 100) % 13 === 0;

                return <polygon key={`${i}-${j}`} points={tile(i, j)} fill={stone ? '#f1e6c8' : i % 2 ? '#ffffff' : '#0b3a14'} opacity={stone ? 0.22 : 0.07} />;
            })}
            <g stroke="#ffffff" strokeOpacity=".1" strokeWidth="1.2">
                {Array.from({ length: 29 }, (_, k) => k - 14).map((i) => <line key={i} x1={lineX(i, FLOOR)} y1={FLOOR} x2={lineX(i, height)} y2={height} />)}
                {Array.from({ length: 12 }, (_, j) => j).filter((j) => rowY(j) < height).map((j) => <line key={`r${j}`} x1="0" x2="1600" y1={rowY(j)} y2={rowY(j)} />)}
            </g>
            {LAWN.filter((s) => s.y < height - 10).map((s, k) => <circle key={k} cx={r1(s.x)} cy={r1(s.y)} r={r1(s.r)} fill={s.c} opacity=".8" />)}

            {/* the cherry trees in blossom, in front */}
            {sakura(130, 700, 0.88, CROWNS[0])}
            {sakura(1500, 720, 0.86, CROWNS[1], -1)}

            {/* the daisies under the booth */}
            <g transform={`translate(0 ${ext})`}>
            <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 20} rx="400" ry="74" fill={f('pool')} />
            <ellipse cx="800" cy={SCENE.booth.y + 100} rx="318" ry="53" fill="none" stroke="#2f8a3a" strokeWidth="6" opacity=".6" />
            {DAISIES.map((d) => use('daisy', d.x, d.y + SCENE.booth.y + 100, d.s, `d${d.k}`))}
            <ellipse cx="800" cy={SCENE.booth.y + SCENE.booth.h + 4} rx="184" ry="15" fill="#000" opacity=".4" />
            </g>
            {butterfly('b1', 470, 690, '#fb923c', '#fde047', 0)}{butterfly('b2', 1150, 700, '#60a5fa', '#c4b5fd', -3)}{butterfly('b3', 940, 520, '#f472b6', '#fbbf24', -6)}

            {/* mist over the edge of the floor */}
            {([[150, 616, 340, 36, 0.4], [820, 606, 420, 34, 0.3], [1470, 612, 360, 38, 0.4]] as const).map(([x, y, rx, ry, o], k) => <ellipse key={k} className={k % 2 ? 'sc-drift' : undefined} style={k % 2 ? after(-k * 1.5) : undefined} cx={x} cy={y} rx={rx} ry={ry} fill={f('fog')} opacity={o} />)}

            {withBooth && (
                <svg x={SCENE.booth.x} y={SCENE.booth.y + ext} width={SCENE.booth.w} height={SCENE.booth.h} viewBox="0 0 300 150" overflow="visible">
                    <BoothFrontArt u={(n) => `${uid}-b-${n}`} p={p} plate />
                </svg>
            )}

            <rect y="520" width="1600" height={height - 520} fill={f('haze')} />
            <rect width="1600" height={height} fill={f('vig')} />
        </svg>
    );
}
