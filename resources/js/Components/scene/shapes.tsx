import { r1 } from '@/Components/scene/util';

/** One tier of a pine, round the line x = 0: the tip is (0, a), the base is at y = b and w is half as wide; `snow` is the colour of the cap of snow on it. */
export const pineTier = (a: number, b: number, w: number, fill: string, snow = '#f4faff') => {
    const n = Math.max(2, Math.round(w / 12));
    let d = `M0 ${a}L${-w} ${b}`;
    for (let i = 0; i < n; i++) d += `Q${r1(-w + ((2 * w * (i + 0.5)) / n))} ${b + 5} ${r1(-w + (2 * w * (i + 1)) / n)} ${b}`;

    return (
        <g key={a}>
            <path d={`${d}Z`} fill={fill} />
            <path d={`M0 ${a}L${r1(-w * 0.55)} ${r1(a + (b - a) * 0.55)}Q${r1(-w * 0.3)} ${r1(a + (b - a) * 0.66)} ${r1(-w * 0.1)} ${r1(a + (b - a) * 0.58)}Q${r1(w * 0.12)} ${r1(a + (b - a) * 0.7)} ${r1(w * 0.3)} ${r1(a + (b - a) * 0.6)}Q${r1(w * 0.45)} ${r1(a + (b - a) * 0.62)} ${r1(w * 0.55)} ${r1(a + (b - a) * 0.55)}Z`} fill={snow} />
        </g>
    );
};

/** A cloud with a flat bottom at (x, y), `s` times its size (about 190 wide). */
export const cloud = (k: string | number, x: number, y: number, s: number, fill = '#ffffff', shade = '#c9dcf5') => (
    <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
        <ellipse cx="0" cy="18" rx="94" ry="16" fill={shade} />
        <circle cx="-48" cy="2" r="28" fill={fill} /><circle cx="-8" cy="-14" r="38" fill={fill} /><circle cx="40" cy="-2" r="30" fill={fill} /><circle cx="72" cy="8" r="20" fill={fill} />
        <ellipse cx="0" cy="12" rx="94" ry="16" fill={fill} />
    </g>
);

const SKULL = 'M0 -60C24 -60 40 -42 40 -20C40 -8 37 2 33 11C31 16 28 19 27 24V36C27 48 18 58 0 58C-18 58 -27 48 -27 36V24C-28 19 -31 16 -33 11C-37 2 -40 -8 -40 -20C-40 -42 -24 -60 0 -60Z';

/**
 * A skull seen from the front, 80 wide and 118 tall with its middle at (0, 0). Put it in a `<defs>` with an id and `<use>` it as often as you like.
 * `bone` is the colour of the bone, `shade` the darker edge on the side away from the light and `socket` the dark of the eyes, the nose and the gaps between the teeth.
 */
export const skullGlyph = (id: string, bone = '#ece3cb', shade = '#b3a688', socket = '#120d09') => (
    <g id={id}>
        <path d={SKULL} fill={shade} />
        <path d={SKULL} fill={bone} transform="translate(-2.4 -2) scale(.95)" />
        <path d="M-26 -44Q-10 -55 6 -53" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="3" strokeLinecap="round" />
        <path d="M10 -58L6 -47L12 -39L8 -31" fill="none" stroke={shade} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M-33 12Q-30 18 -27 22M33 12Q30 18 27 22" fill="none" stroke={shade} strokeWidth="1.8" strokeLinecap="round" />
        <ellipse cx="-16" cy="-10" rx="11.5" ry="13" fill={socket} transform="rotate(-10 -16 -10)" />
        <ellipse cx="16" cy="-10" rx="11.5" ry="13" fill={socket} transform="rotate(10 16 -10)" />
        <path d="M0 8L-7 24Q0 28 7 24Z" fill={socket} />
        <rect x="-19" y="33" width="38" height="14" rx="3" fill={bone} stroke={shade} strokeWidth="1.2" />
        <path d="M-9.5 33V47M0 33V47M9.5 33V47" stroke={shade} strokeWidth="1.4" />
        <path d="M-22 47.5H22" stroke={socket} strokeWidth="2" />
        <rect x="-13" y="48.5" width="26" height="6.5" rx="2" fill={bone} stroke={shade} strokeWidth="1" />
        <path d="M-6.5 48.5V55M0 48.5V55M6.5 48.5V55" stroke={shade} strokeWidth="1.2" />
    </g>
);

/** A long bone lying along the x axis with its middle at (0, 0), `len` long, with a pair of knobs at each end. */
export const femur = (k: string | number, len: number, bone = '#ece3cb', shade = '#b3a688') => (
    <g key={k}>
        <rect x={-len / 2} y="-4.5" width={len} height="9" rx="4.5" fill={bone} />
        <rect x={-len / 2 + 6} y="1" width={len - 12} height="3.5" rx="1.7" fill={shade} opacity=".55" />
        {[-1, 1].map((s) => (
            <g key={s} transform={`translate(${(s * len) / 2} 0)`}>
                <circle cx={-s * 2} cy="-6.5" r="6.8" fill={bone} /><circle cx={-s * 2} cy="6.5" r="6.8" fill={bone} />
                <circle cx={-s * 2 + 1.5} cy="8" r="3.4" fill={shade} opacity=".5" />
            </g>
        ))}
    </g>
);
