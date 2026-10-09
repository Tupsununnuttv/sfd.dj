// Blaze and Echo: two DJs with white headphones and wrap-around shades, a microphone and neon wristbands, and their referee-shirt versions.
// Blaze has a blue spiky crest and a goatee, Echo a long ponytail that swings. Drawn for the left, mirrored for the right, like all the others.
import { kf, lin, mirror, origins, picture, play, pose, rad, shadow } from './kit.mjs';

const PEOPLE = {
    blaze: {
        label: 'Blaze', skin: ['#f3bd90', '#d99865', '#a9683c'], cheek: '#e8785a',
        visor: ['#7cc4ff', '#2f6df0', '#16286e'], cushion: '#2563eb', ring: '#22d3ee', glow: '#38bdf8',
        top: ['#3a3a45', '#15151b', '#08080b'], shoe: ['#ffffff', '#e6ecf6', '#a9b6cc'], shoeAccent: '#ef4444', band: ['#a3e635', '#f472b6'],
        bottom: ['#4c6fb8', '#2c4a8e', '#182c5c'],
    },
    echo: {
        label: 'Echo', skin: ['#dca078', '#bd7f55', '#8b5532'], cheek: '#e0527a',
        visor: ['#ff9bd0', '#a855f7', '#312e81'], cushion: '#ec4899', ring: '#f472b6', glow: '#f0abfc',
        top: ['#f472b6', '#db2777', '#9d174d'], shoe: ['#fff3a3', '#facc15', '#ca8a04'], shoeAccent: '#ec4899', band: ['#2dd4bf', '#facc15'],
        bottom: ['#33333f', '#17171e', '#08080b'],
    },
};

const defs = (who, ref) => {
    const p = PEOPLE[who];

    return [
        lin('skin', [0.1, 0, 0.9, 1], p.skin.map((c, i) => [[0, 0.5, 1][i], c])),
        lin('hair', [0, 0, 0, 1], who === 'blaze' ? [[0, '#8fd0ff'], [0.35, '#2f6df0'], [1, '#0f1f66']] : [[0, '#3b4a9c'], [0.3, '#161e5c'], [1, '#070a22']]),
        lin('hairB', [0, 0, 1, 1], [[0, '#4d6bd6'], [0.5, '#1a2670'], [1, '#080b26']]),
        lin('visor', [0, 0, 1, 1], p.visor.map((c, i) => [[0, 0.5, 1][i], c])),
        lin('white', [0, 0, 1, 1], [[0, '#ffffff'], [0.55, '#e8eef9'], [1, '#aebbd3']]),
        lin('top', [0.1, 0, 0.9, 1], p.top.map((c, i) => [[0, 0.5, 1][i], c])),
        lin('bottom', [0.1, 0, 0.9, 1], p.bottom.map((c, i) => [[0, 0.5, 1][i], c])),
        lin('shoe', [0, 0, 0, 1], p.shoe.map((c, i) => [[0, 0.65, 1][i], c])),
        lin('glass', [0, 0, 0.7, 1], [[0, '#fff', 0.75], [1, '#fff', 0]]),
        lin('metal', [0, 0, 1, 0], [[0, '#e1e7f2'], [0.5, '#8f99ad'], [1, '#4a5163']]),
        rad('grille', [0.4, 0.35, 0.7], [[0, '#7b8499'], [0.5, '#262a36'], [1, '#090a0f']]),
        `<pattern id="stripes" width="12" height="10" patternUnits="userSpaceOnUse"><rect width="6" height="10" fill="#fafafa"/><rect x="6" width="6" height="10" fill="#101014"/></pattern>`,
        ref ? lin('shirt', [0, 0, 1, 1], [[0, '#fff', 0.35], [0.5, '#fff', 0], [1, '#000', 0.45]]) : '',
    ].join('');
};

const mic = (p) => `<g class="mic">
    <rect x="46.4" y="186" width="7.2" height="22" rx="3.4" fill="url(#metal)" stroke="#2a3040" stroke-width=".8"/>
    <rect x="46.4" y="195" width="7.2" height="3.6" fill="${p.glow}"/>
    <circle cx="50" cy="181" r="7.2" fill="url(#grille)" stroke="url(#metal)" stroke-width="1.8"/>
    <circle cx="47.6" cy="178.6" r="1.8" fill="#fff" fill-opacity=".55"/>
</g>`;

const arm = (p, cls, { sleeve = false, held = false, ref = false } = {}) => `<g class="${cls}">
    <path d="M42.6 142 Q42.6 134 50 134 Q57.4 134 57.4 142 L56 184 Q50 189 44 184 Z" fill="url(#skin)"/>
    ${sleeve ? `<path d="M40.6 140 Q40.6 132 50 132 Q59.4 132 59.4 140 L58.6 160 Q50 165 41.4 160 Z" fill="${ref ? 'url(#stripes)' : 'url(#top)'}"/>${ref ? '<path d="M40.6 140 Q40.6 132 50 132 Q59.4 132 59.4 140 L58.6 160 Q50 165 41.4 160 Z" fill="url(#shirt)"/>' : ''}<path d="M41.4 160 Q50 165 58.6 160" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="1.2"/>` : ''}
    <rect x="42.4" y="173" width="15.2" height="6" rx="3" fill="${p.band[0]}" stroke="#000" stroke-opacity=".25" stroke-width=".7"/>
    <rect x="42.6" y="180" width="14.8" height="4.6" rx="2.3" fill="${p.band[1]}" stroke="#000" stroke-opacity=".25" stroke-width=".7"/>
    <circle cx="50" cy="194" r="7.8" fill="url(#skin)" stroke="#3a1c0c" stroke-opacity=".3" stroke-width=".8"/>
    <ellipse cx="57" cy="190.5" rx="3.1" ry="4.8" transform="rotate(-22 57 190.5)" fill="url(#skin)" stroke="#3a1c0c" stroke-opacity=".28" stroke-width=".8"/>
    <ellipse cx="46.6" cy="190" rx="3" ry="1.8" fill="#fff" fill-opacity=".22"/>
    ${held ? mic(p) : ''}
</g>`;

const leg = (p, cls, who) => `<g class="${cls}">
    <path d="M54.5 189 H77.5 L76 227 H56.5 Z" fill="url(#bottom)"/>
    ${who === 'blaze'
        ? '<path d="M61 196 V222 M72 196 V222" stroke="#fff" stroke-opacity=".08" stroke-width="1.2"/><rect x="56" y="202" width="9" height="9" rx="2" fill="none" stroke="#9fb4e6" stroke-opacity=".3" stroke-width="1"/>'
        : `<path d="M56.8 190 L57.6 226" stroke="${p.shoeAccent}" stroke-width="2.4" stroke-linecap="round"/><path d="M57.4 190 L58.1 226" stroke="#fff" stroke-opacity=".35" stroke-width=".8"/>`}
    <path d="M51 229 Q51 222 60 222 H73 Q81 222 82 230 Q83 238 75 238 H56 Q49 238 51 229 Z" fill="url(#shoe)" stroke="#000" stroke-opacity=".28" stroke-width=".9"/>
    <path d="M51.4 230 Q51 224 60 222.4 L61 230 Z" fill="${p.shoeAccent}" fill-opacity=".9"/>
    <rect x="49.5" y="233.5" width="34" height="4.8" rx="2.4" fill="${who === 'echo' ? p.shoeAccent : '#e9eef7'}" stroke="#000" stroke-opacity=".25" stroke-width=".7"/>
    <path d="M62 224 L70 224 M63 227 L72 227" stroke="#000" stroke-opacity=".25" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M56 225.4 Q64 222.2 74 224.6" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="1.6" stroke-linecap="round"/>
</g>`;

const whistle = () => `<path d="M72 126 L80 152 L88 126" fill="none" stroke="#111" stroke-width="1.8"/>
    <rect x="75" y="150" width="11" height="8" rx="3.6" fill="url(#metal)" stroke="#2a3040" stroke-width=".8"/><circle cx="77.6" cy="154" r="2" fill="#2a3040"/><rect x="83" y="151.4" width="4.4" height="3.6" rx="1.4" fill="url(#metal)"/>`;

const torsoBackTee = (p, ref) => `
    <path d="M47 139 C47 128 62 123 80 123 C98 123 113 128 113 139 L116 192 Q80 201 44 192 Z" fill="${ref ? 'url(#stripes)' : 'url(#top)'}"/>
    ${ref ? '<path d="M47 139 C47 128 62 123 80 123 C98 123 113 128 113 139 L116 192 Q80 201 44 192 Z" fill="url(#shirt)"/>' : ''}
    <path d="M80 126V190" stroke="#000" stroke-opacity=".22" stroke-width="1.6"/>
    <path d="M52 133 C64 127 96 127 108 133" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="2.6" stroke-linecap="round"/>
    <rect x="43" y="184" width="74" height="7" rx="3.5" fill="#0b0b10" stroke="#000" stroke-opacity=".4" stroke-width=".7"/>
    <rect x="44" y="185.4" width="72" height="2.2" rx="1.1" fill="${p.ring}"/><rect x="44" y="188.4" width="72" height="1.6" rx="0.8" fill="#f472b6"/>`;

const torsoBackCrop = (p, ref) => `
    <path d="M52 138 C52 128 64 123 80 123 C96 123 108 128 108 138 L109 164 Q80 172 51 164 Z" fill="${ref ? 'url(#stripes)' : 'url(#top)'}"/>
    ${ref ? '<path d="M52 138 C52 128 64 123 80 123 C96 123 108 128 108 138 L109 164 Q80 172 51 164 Z" fill="url(#shirt)"/>' : '<path d="M52 138 C52 128 64 123 80 123 L80 168 Q64 168 51 164 Z" fill="#14b8a6" fill-opacity=".85"/><path d="M108 138 C108 128 96 123 80 123 L80 168 Q96 168 109 164 Z" fill="#a855f7" fill-opacity=".85"/>'}
    <path d="M54 131 C66 126 94 126 106 131" fill="none" stroke="#fff" stroke-opacity=".24" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M51 164 Q80 172 109 164" fill="none" stroke="#facc15" stroke-width="3" stroke-linecap="round"/>
    <path d="M51 166 L47 190 Q80 199 113 190 L109 166 Q80 174 51 166 Z" fill="url(#skin)"/>
    <path d="M80 168V192" stroke="#000" stroke-opacity=".14" stroke-width="2"/>
    <path d="M44 186 Q80 197 116 186 L117 195 Q80 206 43 195 Z" fill="#0b0b10"/>
    <path d="M44 187.4 Q80 198.4 116 187.4" fill="none" stroke="${p.ring}" stroke-width="2.2"/><path d="M43.4 191.6 Q80 203 116.6 191.6" fill="none" stroke="#facc15" stroke-width="1.6"/>`;

const torsoTee = (p, ref) => `
    <path d="M47 139 C47 128 62 123 80 123 C98 123 113 128 113 139 L116 192 Q80 201 44 192 Z" fill="${ref ? 'url(#stripes)' : 'url(#top)'}"/>
    ${ref ? `<path d="M47 139 C47 128 62 123 80 123 C98 123 113 128 113 139 L116 192 Q80 201 44 192 Z" fill="url(#shirt)"/><path d="M62 125 Q80 136 98 125 L98 129 Q80 141 62 129 Z" fill="#111116"/>${mirror('<path d="M47 139 C47 128 62 123 80 123" fill="none" stroke="#000" stroke-opacity=".0"/>')}${whistle()}` : `<g class="logo"><path d="M69 168 v-4 a11 11 0 0 1 22 0 v4" fill="none" stroke="${p.glow}" stroke-opacity=".35" stroke-width="6" stroke-linecap="round"/><path d="M69 168 v-4 a11 11 0 0 1 22 0 v4" fill="none" stroke="#e8fbff" stroke-width="2.6" stroke-linecap="round"/><rect x="65.6" y="165" width="6" height="10" rx="2.6" fill="${p.ring}" stroke="#e8fbff" stroke-width="1"/><rect x="88.4" y="165" width="6" height="10" rx="2.6" fill="${p.ring}" stroke="#e8fbff" stroke-width="1"/></g>`}
    <path d="M52 133 C64 127 96 127 108 133" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="2.6" stroke-linecap="round"/>
    <rect x="43" y="184" width="74" height="7" rx="3.5" fill="#0b0b10" stroke="#000" stroke-opacity=".4" stroke-width=".7"/>
    <rect x="44" y="185.4" width="72" height="2.2" rx="1.1" fill="${p.ring}"/><rect x="44" y="188.4" width="72" height="1.6" rx="0.8" fill="#f472b6"/>`;

const torsoCrop = (p, ref) => `
    <path d="M52 138 C52 128 64 123 80 123 C96 123 108 128 108 138 L109 164 Q80 172 51 164 Z" fill="${ref ? 'url(#stripes)' : 'url(#top)'}"/>
    ${ref ? `<path d="M52 138 C52 128 64 123 80 123 C96 123 108 128 108 138 L109 164 Q80 172 51 164 Z" fill="url(#shirt)"/><path d="M64 125 Q80 135 96 125 L96 129 Q80 140 64 129 Z" fill="#111116"/>${whistle()}` : `
    <path d="M52 138 C52 128 64 123 80 123 L80 168 Q64 168 51 164 Z" fill="#14b8a6" fill-opacity=".85"/>
    <path d="M108 138 C108 128 96 123 80 123 L80 168 Q96 168 109 164 Z" fill="#a855f7" fill-opacity=".85"/>
    <path d="M70 124 L76 168 M90 124 L84 168" stroke="#fff" stroke-opacity=".75" stroke-width="2" stroke-linecap="round"/>
    <path d="M54 131 C66 126 94 126 106 131" fill="none" stroke="#fff" stroke-opacity=".24" stroke-width="2.4" stroke-linecap="round"/>`}
    <path d="M51 164 Q80 172 109 164" fill="none" stroke="#facc15" stroke-width="3" stroke-linecap="round"/>
    <path d="M51 166 L47 190 Q80 199 113 190 L109 166 Q80 174 51 166 Z" fill="url(#skin)"/>
    <path d="M62 178 Q80 184 98 178" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="3"/>
    <circle cx="80" cy="181" r="2" fill="#000" fill-opacity=".22"/>
    <path d="M44 186 Q80 197 116 186 L117 195 Q80 206 43 195 Z" fill="#0b0b10"/>
    <path d="M44 187.4 Q80 198.4 116 187.4" fill="none" stroke="${p.ring}" stroke-width="2.2"/><path d="M43.4 191.6 Q80 203 116.6 191.6" fill="none" stroke="#facc15" stroke-width="1.6"/>`;

const phones = (p, who) => {
    const cup = (id) => `<g class="${id}">
        <rect x="25" y="62" width="21" height="42" rx="10" fill="url(#white)" stroke="#8fa0bf" stroke-width="1"/>
        <rect x="29.4" y="67" width="12" height="32" rx="6" fill="none" stroke="${p.ring}" stroke-width="1.8" stroke-opacity=".95"/>
        <rect x="40" y="68" width="8" height="30" rx="4" fill="${p.cushion}" stroke="#0b1a4a" stroke-opacity=".4" stroke-width=".8"/>
        <ellipse cx="32" cy="70" rx="3.6" ry="2" fill="#fff" fill-opacity=".8" transform="rotate(-30 32 70)"/>
    </g>`;

    return `<path d="M37 78 C32 14 128 14 123 78" fill="none" stroke="#8fa0bf" stroke-width="8.6" stroke-linecap="round"/>
        <path d="M37 78 C32 14 128 14 123 78" fill="none" stroke="url(#white)" stroke-width="6.4" stroke-linecap="round"/>
        <path d="M40 66 C42 30 70 22 92 24" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="2" stroke-linecap="round"/>
        ${cup('cupL')}${mirror(cup('cupR'))}`;
};

const shades = (p) => `<g class="shades">
    <path d="M42 71 C54 63 106 63 118 71 L117 86 C114 95 101 99 92 93 C88 90 84 87 80 87 C76 87 72 90 68 93 C59 99 46 95 43 86 Z" fill="url(#visor)" stroke="#0a1233" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M48 70 L66 68 L56 96 L46 90 Z" fill="url(#glass)" fill-opacity=".6"/><path d="M96 68 L108 69 L100 94 L92 92 Z" fill="url(#glass)" fill-opacity=".38"/>
    <ellipse cx="62" cy="75" rx="5" ry="2.4" fill="#fff" fill-opacity=".85" transform="rotate(-14 62 75)"/><circle cx="104" cy="76" r="1.8" fill="#fff" fill-opacity=".75"/>
    <path d="M42 80 L38 82 M118 80 L122 82" stroke="#0a1233" stroke-width="2.6" stroke-linecap="round"/>
</g>`;

const smile = (state, who) => {
    if (who === 'echo') {
        return state === 'Standing'
            ? `<path d="M68 103 Q80 112 92 103 Q80 106 68 103 Z" fill="#e11d74" stroke="#9d174d" stroke-width="1.4" stroke-linejoin="round"/><ellipse cx="76" cy="105" rx="3" ry="1" fill="#fff" fill-opacity=".55"/>`
            : `<path d="M64 101 Q80 120 96 101 Q80 106 64 101 Z" fill="#7f1239"/><path d="M67 101.6 Q80 108 93 101.6 Q80 105 67 101.6 Z" fill="#fff"/><path d="M62 100 Q80 95 98 100 Q80 105 62 100 Z" fill="#e11d74"/><path d="M73 111 Q80 116 87 111 Q80 114 73 111 Z" fill="#fb7185"/>`;
    }

    return state === 'Standing'
        ? `<path d="M64 102 Q80 114 96 102 Q80 108 64 102 Z" fill="#fff" stroke="#3a1c0c" stroke-width="1.8" stroke-linejoin="round"/>`
        : `<path d="M62 100 Q80 122 98 100 Q80 105 62 100 Z" fill="#4a1810"/><path d="M65 101 Q80 109 95 101 Q80 106 65 101 Z" fill="#fff"/><path d="M72 112 Q80 117 88 112 Q80 115 72 112 Z" fill="#f0626e"/>`;
};


/** The back of a head, for the DJ who stands with their back to us: hair all over it (the face is gone), with a few strands and a parting. */
const headBack = (path) => `<path d="${path}" fill="url(#hairB)" stroke="#05071c" stroke-opacity=".6" stroke-width="1.2"/>
    <path d="M80 38C76 56 84 70 80 92M62 44C58 62 64 80 60 100M98 44C102 62 96 80 100 100" fill="none" stroke="#6d8bff" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>
    <path d="M56 112C64 124 96 124 104 112L100 122C92 130 68 130 60 122Z" fill="url(#hairB)"/>`;

const blazeHead = (p, state, back = false) => {
    const tips = [[-170, 20], [-148, 31], [-124, 37], [-98, 40], [-72, 38], [-48, 33], [-26, 26], [-8, 17]];
    const R = 41;
    const spikes = tips.map(([deg, len]) => {
        const a = (deg * Math.PI) / 180, d = (16 * Math.PI) / 180;
        const pt = (ang, rad2) => `${(80 + rad2 * Math.cos(ang)).toFixed(1)} ${(66 + rad2 * Math.sin(ang)).toFixed(1)}`;

        return `M${pt(a - d, R - 10)} Q${pt(a - d * 0.5, R + len * 0.5)} ${pt(a + 0.08, R + len)} Q${pt(a + d * 0.55, R + len * 0.45)} ${pt(a + d, R - 10)} Z`;
    }).join('');

    return `
    <g class="spikes"><path d="${spikes}" fill="url(#hair)" stroke="#0a1650" stroke-opacity=".6" stroke-width="1.2" stroke-linejoin="round"/></g>
    <rect x="68" y="110" width="24" height="20" rx="7" fill="url(#skin)"/>
    <ellipse cx="40" cy="84" rx="6" ry="9" fill="url(#skin)"/>${mirror('<ellipse cx="40" cy="84" rx="6" ry="9" fill="url(#skin)"/>')}
    <path d="M42 78 C42 50 58 36 80 36 C102 36 118 50 118 78 C118 102 102 120 80 120 C58 120 42 102 42 78 Z" fill="url(#skin)"/>
    <path d="M46 94 C52 112 66 121 80 121 C94 121 108 112 114 94 C108 114 96 125 80 125 C64 125 52 114 46 94 Z" fill="#000" fill-opacity=".12"/>
    <ellipse cx="52" cy="99" rx="7" ry="4.4" fill="${p.cheek}" fill-opacity=".34"/><ellipse cx="108" cy="99" rx="7" ry="4.4" fill="${p.cheek}" fill-opacity=".34"/>
    <path d="M77 92 Q80 97 83 92" fill="none" stroke="#7a4220" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>
    <path d="M70 108 Q80 113 90 108 L88 119 Q80 125 72 119 Z" fill="#17120f"/>
    <path d="M67 99.6 Q80 95 93 99.6 Q80 98.6 67 99.6 Z" fill="#17120f" stroke="#17120f" stroke-width="2" stroke-linejoin="round"/>
    ${smile(state, 'blaze')}
    ${back ? headBack('M42 78 C42 50 58 36 80 36 C102 36 118 50 118 78 C118 102 102 120 80 120 C58 120 42 102 42 78 Z') : shades(p)}
    <path d="M42 74 C40 50 58 35 80 35 C102 35 120 50 118 74 L113 66 L107 58 L99 64 L92 52 L84 62 L80 55 L76 62 L68 52 L61 64 L53 58 L47 66 Z" fill="url(#hairB)" stroke="#0a1650" stroke-opacity=".5" stroke-width="1" stroke-linejoin="round"/>
    <path d="M50 60 C56 47 68 41 80 41" fill="none" stroke="#9fd2ff" stroke-opacity=".8" stroke-width="2.4" stroke-linecap="round"/><path d="M96 42 C104 45 111 51 114 60" fill="none" stroke="#9fd2ff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
    ${phones(p, 'blaze')}`;
};

const echoHead = (p, state, back = false) => `
    <g class="tail">
        <path d="M100 36 C132 14 166 40 162 86 C160 112 148 128 154 156 C136 146 130 118 134 92 C137 70 124 54 100 44 Z" fill="url(#hairB)" stroke="#05071c" stroke-opacity=".7" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M118 30 C146 30 158 56 154 84" fill="none" stroke="#6d8bff" stroke-opacity=".75" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M150 104 C150 120 146 134 150 148" fill="none" stroke="#6d8bff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>
        <rect x="94" y="32" width="14" height="10" rx="4" fill="${p.cushion}" stroke="#fff" stroke-opacity=".6" stroke-width="1" transform="rotate(-24 101 37)"/>
    </g>
    <path d="M44 74 C38 100 40 118 48 130 C56 124 56 100 56 84 Z" fill="url(#hairB)"/>${mirror('<path d="M44 74 C38 100 40 118 48 130 C56 124 56 100 56 84 Z" fill="url(#hairB)"/>')}
    <rect x="69" y="110" width="22" height="20" rx="7" fill="url(#skin)"/>
    <ellipse cx="41" cy="84" rx="5.6" ry="8.6" fill="url(#skin)"/>${mirror('<ellipse cx="41" cy="84" rx="5.6" ry="8.6" fill="url(#skin)"/>')}
    <path d="M43 78 C43 50 58 36 80 36 C102 36 117 50 117 78 C117 102 102 119 80 119 C58 119 43 102 43 78 Z" fill="url(#skin)"/>
    <path d="M48 94 C54 111 66 120 80 120 C94 120 106 111 112 94 C106 113 96 124 80 124 C64 124 54 113 48 94 Z" fill="#000" fill-opacity=".12"/>
    <ellipse cx="53" cy="99" rx="7" ry="4.4" fill="${p.cheek}" fill-opacity=".34"/><ellipse cx="107" cy="99" rx="7" ry="4.4" fill="${p.cheek}" fill-opacity=".34"/>
    <path d="M77 92 Q80 97 83 92" fill="none" stroke="#6e3a1c" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>
    ${smile(state, 'echo')}
    ${back ? headBack('M43 78 C43 50 58 36 80 36 C102 36 117 50 117 78 C117 102 102 119 80 119 C58 119 43 102 43 78 Z') : shades(p)}
    <path d="M43 80 C40 48 58 33 80 33 C102 33 120 48 117 80 C114 66 108 58 100 54 C90 60 70 60 60 54 C52 58 46 66 43 80 Z" fill="url(#hairB)"/>
    <path d="M60 54 C70 61 90 61 100 54 L100 59 C90 66 70 66 60 59 Z" fill="#05071c" fill-opacity=".5"/>
    <path d="M52 52 C58 42 70 37 84 37" fill="none" stroke="#7d95ff" stroke-opacity=".75" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M96 42 C104 44 111 50 114 60" fill="none" stroke="#7d95ff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
    ${phones(p, 'echo')}`;

const motion = (state, who) => {
    const base = origins({ all: '80px 238px', head: '80px 120px', armL: '50px 140px', armR: '50px 140px', legL: '66px 192px', legR: '66px 192px', tail: '104px 38px', spikes: '80px 70px' }, ['shadow', 'shades', 'logo']);
    const shared = kf('pulse', { 0: 'opacity:1', 50: 'opacity:.45', 100: 'opacity:1' });
    const hairSway = who === 'echo'
        ? kf('tailS', { 0: 'transform:rotate(-3deg)', 50: 'transform:rotate(4deg)', 100: 'transform:rotate(-3deg)' }) + kf('tailD', { 0: 'transform:rotate(-9deg)', 50: 'transform:rotate(11deg)', 100: 'transform:rotate(-9deg)' }) + kf('tailJ', { 0: 'transform:rotate(-14deg)', 50: 'transform:rotate(16deg)', 100: 'transform:rotate(-14deg)' })
        : kf('spikeS', { 0: 'transform:rotate(-1deg)', 50: 'transform:rotate(1.4deg)', 100: 'transform:rotate(-1deg)' }) + kf('spikeD', { 0: 'transform:rotate(-3deg) scaleY(1)', 50: 'transform:rotate(3deg) scaleY(1.05)', 100: 'transform:rotate(-3deg) scaleY(1)' });
    const hair = (s) => (who === 'echo' ? play('.tail', { S: 'tailS', D: 'tailD', J: 'tailJ' }[s], { S: 3.4, D: 1.2, J: 0.7 }[s]) : play('.spikes', { S: 'spikeS', D: 'spikeD', J: 'spikeD' }[s], { S: 3, D: 1.2, J: 0.7 }[s]));
    const rules = {
        Standing: `
            ${kf('breathe', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-1.6px)', 100: 'transform:translateY(0)' })}
            ${kf('sway', { 0: 'transform:rotate(-1.3deg)', 50: 'transform:rotate(1.3deg)', 100: 'transform:rotate(-1.3deg)' })}
            ${kf('arms', { 0: 'transform:rotate(1.5deg)', 50: 'transform:rotate(-2.5deg)', 100: 'transform:rotate(1.5deg)' })}
            ${kf('glint', { 0: 'opacity:.35', 50: 'opacity:1', 100: 'opacity:.35' })}
            ${kf('tap', { 0: 'transform:rotate(0)', 8: 'transform:rotate(-3deg)', 16: 'transform:rotate(0)', 100: 'transform:rotate(0)' })}
            ${play('.all', 'breathe', 3.2)}${play('.head', 'sway', 4.8)}${play('.armL', 'arms', 3.2)}${play('.armR', 'arms', 3.2, 'reverse')}${hair('S')}${play('.legR', 'tap', 2.6)}${play('.logo', 'pulse', 2.4)}`,
        Dancing: `
            ${kf('hop', { 0: 'transform:translateY(0) scale(1.03,.96)', 45: 'transform:translateY(-10px) scale(.98,1.03)', 100: 'transform:translateY(0) scale(1.03,.96)' })}
            ${kf('nod', { 0: 'transform:rotate(-5deg) translateY(0)', 50: 'transform:rotate(5deg) translateY(3px)', 100: 'transform:rotate(-5deg) translateY(0)' })}
            ${kf('armUp', { 0: 'transform:rotate(150deg)', 25: 'transform:rotate(112deg)', 50: 'transform:rotate(156deg)', 75: 'transform:rotate(118deg)', 100: 'transform:rotate(150deg)' })}
            ${kf('armOut', { 0: 'transform:rotate(62deg)', 25: 'transform:rotate(126deg)', 50: 'transform:rotate(72deg)', 75: 'transform:rotate(118deg)', 100: 'transform:rotate(62deg)' })}
            ${kf('knee', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-8px)', 100: 'transform:translateY(0)' })}
            ${kf('shadowHop', { 0: 'transform:scale(1.04)', 45: 'transform:scale(.8)', 100: 'transform:scale(1.04)' })}
            ${play('.all', 'hop', 0.6)}${play('.head', 'nod', 1.2)}${play('.armL', 'armUp', 1.2)}${play('.armR', 'armOut', 1.2)}${play('.legL', 'knee', 0.6)}${play('.legR', 'knee', 0.6, '.3s')}${hair('D')}${play('.logo', 'pulse', 0.6)}${play('.shadow', 'shadowHop', 0.6)}
            ${pose('.armL', 'rotate(150deg)')}${pose('.armR', 'rotate(64deg)')}${pose('.legL', 'translateY(-7px)')}${pose('.head', 'rotate(-4deg)')}${who === 'echo' ? pose('.tail', 'rotate(8deg)') : ''}`,
        DJing: `
            ${kf('jump', { 0: 'transform:translateY(0) scale(1.05,.94)', 38: 'transform:translateY(-17px) scale(.97,1.04)', 76: 'transform:translateY(0) scale(1.05,.94)', 100: 'transform:translateY(0) scale(1.05,.94)' })}
            ${kf('bob', { 0: 'transform:rotate(-6deg) translateY(0)', 50: 'transform:rotate(6deg) translateY(3px)', 100: 'transform:rotate(-6deg) translateY(0)' })}
            ${kf('pump', { 0: 'transform:rotate(126deg)', 38: 'transform:rotate(164deg)', 76: 'transform:rotate(126deg)', 100: 'transform:rotate(126deg)' })}
            ${kf('kick', { 0: 'transform:translateY(0)', 38: 'transform:translateY(-9px) rotate(5deg)', 76: 'transform:translateY(0)', 100: 'transform:translateY(0)' })}
            ${kf('shadowJump', { 0: 'transform:scale(1.05)', 38: 'transform:scale(.7)', 76: 'transform:scale(1.05)', 100: 'transform:scale(1.05)' })}
            ${play('.all', 'jump', 0.7)}${play('.head', 'bob', 0.7)}${play('.armL', 'pump', 0.7)}${play('.armR', 'pump', 0.7, '.1s')}${play('.legL', 'kick', 0.7)}${play('.legR', 'kick', 0.7, '.1s')}${hair('J')}${play('.logo', 'pulse', 0.35)}${play('.shadow', 'shadowJump', 0.7)}
            ${pose('.armL', 'rotate(148deg)')}${pose('.armR', 'rotate(148deg)')}${pose('.legR', 'translateY(-9px)')}${pose('.head', 'rotate(-4deg)')}${who === 'echo' ? pose('.tail', 'rotate(12deg)') : ''}`,
    };

    return base + shared + hairSway + rules[state];
};

export function dj(who, ref, state) {
    const p = PEOPLE[who];
    const sleeve = who === 'blaze';
    const rig = `${leg(p, 'legL', who)}${mirror(leg(p, 'legR', who))}${state === 'DJing' ? (who === 'blaze' ? torsoBackTee(p, ref) : torsoBackCrop(p, ref)) : who === 'blaze' ? torsoTee(p, ref) : torsoCrop(p, ref)}${arm(p, 'armL', { sleeve, held: true, ref })}${mirror(arm(p, 'armR', { sleeve, ref }))}`;

    return picture({
        label: `${p.label}${ref ? ' Ref' : ''}`,
        state,
        defs: defs(who, ref),
        body: `${shadow()}<g class="all">${rig}<g class="head">${who === 'blaze' ? blazeHead(p, state, state === 'DJing') : echoHead(p, state, state === 'DJing')}</g></g>`,
        css: motion(state, who),
    });
}
