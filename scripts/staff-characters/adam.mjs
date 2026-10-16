// Adam & Mochi: a bearded DJ in a black robe with red storm-cloud emblems, a metal headband and wrapped hands, and his panda Mochi in a robe of her own.
// Standing, Adam waves hello while Mochi nibbles a bamboo shoot; dancing, they bounce in turn, Adam throws his arms about and brings his hands together in a
// seal, Mochi flaps her arms, and little storm clouds rise behind them; at the decks, seen from behind, Adam scratches with one hand and pumps the other while
// Mochi bobs beside him. Brand Ambassadors and the roles above them can wear them (AvatarController::ROLE_ONLY).
// Drawn on the 200 x 276 frame like the others, but in the coordinates of the first sketch (Adam's middle is x = 65, his feet stand on y = 225, Mochi stands at
// x = 137 and is moved 4 closer), so the whole pair sits in one group that is scaled to fit the frame. The Mochi parts are named p...; Adam's left parts are
// drawn once and the right ones are their mirror image (around x = 65), so L and R share their joints.
// His sleeves are long, so a hand that swings out sideways leaves the frame: in the dance the forearm turns up or across the chest and never out to the side,
// which is why the elbow angles run past -180. `node scripts/make-staff-characters.mjs adammochi` redraws the three pictures.
import { kf, lin, origins, picture, play, pose } from './kit.mjs';

const INK = '#171824';
const FIT = 'translate(-13.9 -16.2) scale(1.12)';

/** The right-hand copy of a part drawn for Adam's left: turned over around his middle, x = 65. */
const flip = (part) => `<g transform="translate(130 0) scale(-1 1)">${part}</g>`;

/** A storm cloud with a bolt: the emblem on the robes. */
const cloud = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-12 3q-8 -1 -6 -7q1 -5 7 -4q2 -8 9 -5q7 -3 10 4q9 -1 9 6q0 6 -8 6H-3q-5 0 -4 -4q1 -4 6 -2" fill="url(#red)" stroke="#ecd2d4" stroke-width="1.1"/><path d="M1 -10l-4 7h7l-4 7" fill="none" stroke="#602337" stroke-width="1.2"/></g>`;

/** A thin light line along an edge that catches the light. */
const rim = (d) => `<path d="${d}" fill="none" stroke="#8a89a3" stroke-opacity=".42" stroke-width=".9"/>`;

// ---------- Adam ----------
const leg = (dx) => `<g class="leg${dx ? 'R' : 'L'}">
    <path d="M${40 + dx} 178h23l-1 33h-20z" fill="#272735"/>
    <path d="M${40 + dx} 199h22v15h-22z" fill="#b4b4c6"/><path d="M${41 + dx} 201l20 4m-20 0l20 4m-20 0l20 4" stroke="#777a91" stroke-width="1"/>
    <path d="M${39 + dx} 213q13 -4 24 2l4 10h-31z" fill="#232533"/><path d="M${42 + dx} 216q10 -4 20 -0.5" fill="none" stroke="#4a4b62" stroke-width="1"/>
    <path d="M${36 + dx} 225h31" stroke="#bb4b60" stroke-width="3"/><path d="M${46 + dx} 218h8" stroke="#e1b396" stroke-width="3"/>
</g>`;

const flap = (right) => right
    ? `<g class="robeR"><path d="M65 177l35 -5 6 35q-17 8 -37 4z" fill="url(#robe)"/><path d="M65 177l35 -5 1 7 -36 5z" fill="#05060b" opacity=".3" stroke="none"/><path d="M70 206l33 -5 3 6 -37 5z" fill="url(#red)"/><path d="M94 182l3 15m-21 -16l2 17" stroke="#45424f" stroke-width="1"/>${rim('M67 180l32 -5')}${cloud(85, 194, 0.49)}</g>`
    : `<g class="robeL"><path d="M30 172l35 5 -4 34q-19 4 -36 -4z" fill="url(#robe)"/><path d="M30 172l35 5v7l-36 -5z" fill="#05060b" opacity=".3" stroke="none"/><path d="M28 201l33 5 -1 6 -35 -5z" fill="url(#red)"/><path d="M34 182l-2 15m22 -16l-1 17" stroke="#45424f" stroke-width="1"/>${rim('M32 175l31 4.5')}${cloud(46, 193, 0.47)}</g>`;

const torso = (back) => `<g>
    <path d="M33 125q30 -13 64 0l6 59q-38 16 -77 0z" fill="url(#torso)"/><path d="M35 132l-4 43m64 -43l4 43" stroke="#51505d" stroke-width="1"/>
    ${rim('M38 129q27 -9 54 0')}
    ${back
        ? `${cloud(64, 155, 0.85)}`
        : `${cloud(45, 143, 0.43)}${cloud(84, 158, 0.48)}${cloud(43, 174, 0.44)}`}
</g>`;

const collar = (back) => back
    ? `<path d="M40 124q23 14 49 0l-3 -14H44z" fill="#282833"/><path d="M43 123q23 8 43 0" stroke="#d05767" stroke-width="2" fill="none"/><path d="M64 177v23" stroke="#42404d" stroke-width="1"/>`
    : `<path d="M36 122l20 11 9 -10 10 10 20 -11 -6 -15H42z" fill="url(#red)"/><path d="M39 117l16 12 10 -10 11 10 16 -12 -4 -9H44z" fill="#2c2b37"/><path d="M42 119q23 17 46 0l-1 9q-22 13 -44 0z" fill="#05060b" opacity=".42" stroke="none"/><path d="M65 130v73" stroke="#c46b79" stroke-width="1.1"/><path d="M62 145h6m-6 16h6m-6 16h6" stroke="#9e8d94" stroke-width="1.2"/>`;

/** One arm, drawn for Adam's left (the left of the picture): the forearm turns at the elbow, the whole arm at the shoulder. `side` is L or R (the right one is flipped). */
const arm = (side) => `<g class="arm${side}">
    <g class="fore${side}">
        <path d="M17.1 144L14 156L36 163L39.9 144Z" fill="url(#sleeve)"/>
        <path d="M34 155l-20 -6 -3 10 21 7z" fill="url(#red)"/><path d="M16 150.6l17 5" fill="none" stroke="#ffb0b4" stroke-opacity=".45" stroke-width=".9"/>
        <g><path d="M30 165q-14 -8 -15 2l2 9q6 7 13 -1z" fill="url(#skin)"/><path d="M29 171l-10 -1" stroke="#3c3542" stroke-width="5"/><path d="M28 169.3l-8 -.7" fill="none" stroke="#6a6179" stroke-width=".9"/>
            <path d="M29 166l-2 6" stroke="#bd826d" stroke-width="1"/><path d="M19.6 175.6l.9 2.6M22.8 176.7l.6 2.6M26 176.5l.2 2.4" fill="none" stroke="#b57762" stroke-width=".8"/></g>
    </g>
    <path d="M36 124q-13 -3 -16 9l-3.9 15h23l3 -14z" fill="url(#sleeve)" stroke="none"/>
    <path d="M39.1 148L42.1 134L36 124Q23 121 20 133L16.1 148" fill="none"/>
    ${rim('M34 125.5Q23 123.5 21.2 132')}
    <path d="M31 132l-4 13" stroke="#4d4654" stroke-width="1"/>
    ${cloud(28, 139, 0.3)}
</g>`;

const HAIR = 'M34 69Q25 48 36 38l-2 -5 10 1 3 -7 10 3q16 -8 30 3l9 0 -1 7q8 10 3 29z';

const bandTail = () => `<g class="bandtail"><path d="M88 54q17 -5 24 3l-7 4 9 10q-17 -1 -28 -13" fill="url(#red)"/><path d="M92 58q10 3 15 9" stroke="#7f2a43" fill="none" stroke-width="1"/></g>`;

/** The mouth under the moustache: a closed smile, or an open grin when he dances. */
const mouth = (grin) => grin
    ? `<path d="M54.5 104.5Q64 109.4 74.5 104Q72.4 116.4 64 116.4Q56 115.6 54.5 104.5Z" fill="#6b2630" stroke="#47302c" stroke-width="1"/>
    <path d="M56.4 105.6Q64 109.2 72.6 105.2L72 108.2Q64 111.8 57 108.2Z" fill="#fff3e2" stroke="none"/><path d="M59.4 113.4Q64 110.6 68.6 113.4Q64 116.6 59.4 113.4Z" fill="#d9667a" stroke="none"/>`
    : `<path d="M55 105Q64 108 74 104Q69 112 62 110Z" fill="#ce9b81" stroke="none"/><path d="M55 105Q64 108 74 104" fill="none" stroke="#47302c" stroke-width="1.2"/><path d="M57 111q7 2 12 0" fill="none" stroke="#94674b" stroke-width=".7" opacity=".55"/>`;

const headFront = (grin) => `<g class="head">
    ${bandTail()}
    <path d="${HAIR}" fill="#49332d"/>
    <path d="M34 51Q39 35 58 34l-7 6q17 -9 32 -2l-6 3q12 0 18 10l-6 -1q-10 -10 -23 -7l6 -5q-17 1 -30 14z" fill="#73503d" stroke="none"/>
    <path d="M37 47q7 -9 19 -11m5 -2q16 -2 27 8m-40 2q10 -7 19 -6M44 42q4 -4 9 -5m27 5q-5 -5 -11 -6" fill="none" stroke="#98705a" stroke-width=".85" opacity=".6"/>
    <ellipse cx="32" cy="81" rx="6" ry="10" fill="url(#skin)"/><ellipse cx="98" cy="81" rx="6" ry="10" fill="url(#skin)"/>
    <path d="M30 78q-2 3 1 8M100 78q2 3 -1 8" fill="none" stroke="#b9806c" stroke-width=".9" stroke-linecap="round"/>
    <path d="M35 59q29 -12 60 0l2 31q-1 25 -31 29q-30 -4 -32 -29z" fill="url(#skin)"/>
    <path d="M35 64l5 4 -1 20 6 8 12 5 -9 5q-14 -9 -14 -21z" fill="#b77965" opacity=".34" stroke="none"/>
    <path d="M92 65l3 0 2 21q0 14 -13 23l-9 -5 12 -10 5 -12z" fill="#ad6e60" opacity=".29" stroke="none"/>
    <ellipse cx="43" cy="88" rx="4.6" ry="2.6" fill="#e0776c" opacity=".12" stroke="none"/><ellipse cx="87" cy="88" rx="4.6" ry="2.6" fill="#e0776c" opacity=".12" stroke="none"/>
    <path d="M46 66q17 -3 35 0" fill="none" stroke="#ffe0c2" stroke-width="1" opacity=".65"/>
    <path d="M35 57q-1 -14 9 -18q-3 11 -6 23M91 40q9 5 5 22l-6 -8z" fill="#49332d"/>
    <path d="M33 51q31 -5 65 0l-1 12q-31 -8 -63 0z" fill="#272633"/><path d="M36 54.4q6 -1 10 -1.2M84 53.2q5 .1 9 .8" fill="none" stroke="#454658" stroke-width=".9"/>
    <rect x="44" y="49" width="42" height="14" rx="3" fill="url(#metal)"/><path d="M50 49.6h9l-5 12.8h-9z" fill="#fff" opacity=".18" stroke="none"/>
    <circle cx="48" cy="53" r="1" fill="#565d70" stroke="none"/><circle cx="82" cy="53" r="1" fill="#565d70" stroke="none"/>
    <path d="M65 51l-7 5 7 5 7 -5zM61 56h8" fill="none" stroke="#54536b" stroke-width="1.4"/><path d="M51 60l5 -8m19 8l3 -7" stroke="#f3e6e4" stroke-width=".8"/>
    <g transform="translate(0 ${grin ? -1.8 : 0})"><path d="M40 72l8 -3 10 3 -1 2 -10 -2 -7 2zM72 72l10 -3 9 4 -1 2 -9 -3 -9 2z" fill="#54392f" stroke="none"/></g>
    <g class="eyes"><path d="M40 79l8 -4q6 0 11 5l-8 4 -8 -2zM72 80q5 -5 11 -4l8 5 -4 3 -8 0z" fill="#fff5e6" stroke="#3d2e32" stroke-width=".8"/>
        <path d="M40 79l8 -4q6 0 11 5M72 80q5 -5 11 -4l8 5" fill="none" stroke="#332a30" stroke-width="1.9"/>
        <ellipse cx="50" cy="79.5" rx="3.7" ry="4.1" fill="#80583d" stroke="#4c3532" stroke-width=".7"/><ellipse cx="81" cy="80" rx="3.7" ry="4.1" fill="#80583d" stroke="#4c3532" stroke-width=".7"/>
        <path d="M47.5 81q2.5 3 5 0M78.5 81.5q2.5 3 5 0" fill="none" stroke="#c49457" stroke-width="1.1"/>
        <ellipse cx="50" cy="79.2" rx="1.5" ry="2.4" fill="#30272c" stroke="none"/><ellipse cx="81" cy="79.7" rx="1.5" ry="2.4" fill="#30272c" stroke="none"/>
        <circle cx="48.7" cy="77.8" r="1.1" fill="#fffaf1" stroke="none"/><circle cx="79.7" cy="78.3" r="1.1" fill="#fffaf1" stroke="none"/>
        <path d="M44 84l10 1M77 85h9" fill="none" stroke="#a67062" stroke-width=".7"/></g>
    <path d="M64 80l-3 9 3 2" fill="none" stroke="#bd806b" stroke-width="1"/>
    <path d="M59 93q6 2 12 -1" fill="none" stroke="#9c6559" stroke-width="1"/>
    <path d="M62 85l-2 5 4 0z" fill="#ffe0c1" stroke="none" opacity=".65"/>
    <path d="M35 85Q40 94 46 97Q52 96 57 96L65 99 73 96Q80 95 85 97Q92 93 96 85L95 102Q93 114 84 120Q75 127 65 127Q52 127 43 117Q35 109 35 98Z" fill="url(#beard)" stroke="#3c2d2b" stroke-width="1.5"/>
    <path d="M36 93Q40 105 45 112Q53 122 65 124Q81 123 89 111Q83 120 72 119Q49 120 39 99Z" fill="#362a29" stroke="none" opacity=".55"/>
    <path d="M42 99Q46 110 53 114Q64 120 76 115Q62 119 52 109Z" fill="#80543d" opacity=".25" stroke="none"/>
    <path d="M47 99Q54 91 63 96L65 98 68 96Q77 92 84 100Q79 101 75 103L65 100 55 103Z" fill="#5e3d2d" stroke="none"/>
    <path d="M52 100Q57 96 62 98M69 98Q75 96 80 100" fill="none" stroke="#8b6045" stroke-width=".7" opacity=".5"/>
    ${mouth(grin)}
    <path d="M43 105q2 5 6 8M50 113q3 4 7 5M73 119q5 -2 8 -6M86 104l-2 6M58 120q4 2 8 1M40 98q1 4 3 6" fill="none" stroke="#8d654b" stroke-width=".7" opacity=".38"/>
    <path d="M38 84l5 2m43 0l6 -1" stroke="#d99a84" stroke-width="1"/>
</g>`;

const headBack = () => `<g class="head">
    ${bandTail()}
    <path d="${HAIR}" fill="#49332d"/>
    <path d="M34 51Q39 35 58 34l-7 6q17 -9 32 -2l-6 3q12 0 18 10l-6 -1q-10 -10 -23 -7l6 -5q-17 1 -30 14z" fill="#73503d" stroke="none"/>
    <ellipse cx="32" cy="81" rx="6" ry="10" fill="url(#skin)"/><ellipse cx="98" cy="81" rx="6" ry="10" fill="url(#skin)"/>
    <path d="M35 59q29 -12 60 0l2 31q-1 25 -31 29q-30 -4 -32 -29z" fill="url(#skin)"/>
    <path d="M38 102q27 11 54 0l-1 8q-26 11 -52 0z" fill="#8a5a4a" opacity=".38" stroke="none"/>
    <path d="M34 58q29 -16 62 0l1 30 -4 14q-28 11 -57 -1l-3 -15z" fill="#4a342e"/>
    <path d="M41 61q-5 22 3 37m8 -40q-4 25 1 43m10 -44v46m12 -45l2 43m8 -39l3 35" fill="none" stroke="#705043" stroke-width="1.1"/>
    <path d="M36 98Q35 111 45 118Q40 108 40 99Z M94 98Q95 111 85 118Q90 108 90 99Z" fill="url(#beard)" stroke="#3c2d2b" stroke-width="1"/>
    <path d="M34 53q31 -5 63 0v11q-31 -7 -63 0z" fill="#242632"/><path d="M82 58l11 4 -2 12 -8 -4z" fill="url(#red)"/>
</g>`;

const adam = (back, grin) => `<g class="adam">${leg(0)}${leg(28)}
    ${torso(back)}${flap(false)}${flap(true)}${collar(back)}
    ${arm('L')}${flip(arm('R'))}${back ? headBack() : headFront(grin)}</g>`;

// ---------- Mochi, the panda ----------
const pLeg = (right) => right
    ? `<g class="pLegR"><path d="M140 201q6 -3 12 0l3 21q-9 5 -15 -3z" fill="#2d2d3b"/><path d="M142 220h12" stroke="#cf5a6c" stroke-width="2"/><path d="M143 208l5 1" stroke="#5a5064" stroke-width="1"/></g>`
    : `<g class="pLegL"><path d="M122 201q6 -3 13 0l-1 18q-6 9 -14 3z" fill="#2d2d3b"/><path d="M121 220h13" stroke="#cf5a6c" stroke-width="2"/><path d="M125 208l5 1" stroke="#5a5064" stroke-width="1"/></g>`;

const bamboo = () => `<path d="M155 196l-11 -26" stroke="#526e43" stroke-width="3"/><path d="M150 184l7 -4 -1 -4 -7 3m-2 -3l-7 -2 -3 -6 9 3" fill="#8fc774" stroke="#526e43" stroke-width="1"/><path d="M151 188l3 -1m-7 -10l3 -1" stroke="#c2db91" stroke-width="1.3"/>`;

const pArms = (holdsBamboo) => `<g class="pArmL"><path d="M123 181q-10 0 -10 12q1 9 9 6l6 -9" fill="#30303e"/><path d="M114 192l9 2" stroke="#bd5267" stroke-width="2"/><ellipse cx="116" cy="197" rx="4" ry="4.5" fill="#3d3948"/><path d="M114.6 195.6q.4 1.6 1.6 2.4" fill="none" stroke="#242330" stroke-width=".7"/></g>
    <g class="pArmR"><path d="M148 181q12 -1 14 10q1 9 -9 9l-7 -9" fill="#30303e"/><path d="M152 193l9 -2" stroke="#bd5267" stroke-width="2"/><ellipse cx="159" cy="197" rx="4" ry="4.5" fill="#3d3948"/><path d="M160.4 195.6q-.4 1.6 -1.6 2.4" fill="none" stroke="#242330" stroke-width=".7"/>${holdsBamboo ? bamboo() : ''}</g>`;

const pEars = (inner) => `<g class="pEarL"><circle cx="122" cy="153" r="8" fill="#30303e"/>${inner ? '<circle cx="122.4" cy="153.6" r="4.2" fill="#4b495b" stroke="none"/>' : ''}</g><g class="pEarR"><circle cx="151" cy="153" r="8" fill="#30303e"/>${inner ? '<circle cx="150.6" cy="153.6" r="4.2" fill="#4b495b" stroke="none"/>' : ''}</g>`;

const pHeadFront = () => `<g class="pHead">${pEars(true)}
    <path d="M116 166q-1 -16 21 -16q22 0 22 16q0 18 -21 18q-22 0 -22 -18" fill="url(#white)"/>
    <ellipse cx="127" cy="166" rx="5" ry="7" transform="rotate(23 127 166)" fill="#363441" stroke="none"/><ellipse cx="148" cy="166" rx="5" ry="7" transform="rotate(-23 148 166)" fill="#363441" stroke="none"/>
    <g class="pEyes"><circle cx="128" cy="165" r="1.8" fill="#faf5e9" stroke="none"/><circle cx="147" cy="165" r="1.8" fill="#faf5e9" stroke="none"/></g>
    <ellipse cx="137" cy="175.4" rx="7" ry="4.2" fill="#d6dde4" opacity=".7" stroke="none"/>
    <path d="M134 172q4 -2 7 0l-4 3z" fill="#373440"/><path d="M136.2 172.6l1 -.5" stroke="#8a8798" stroke-width=".8"/><path d="M137 175v2q-4 3 -6 0m6 0q4 3 6 0" fill="none" stroke-width="1"/>
    <path d="M118 155q19 -4 39 0v5q-19 -4 -39 0z" fill="#b74c60"/><rect x="129" y="152" width="16" height="7" rx="2" fill="url(#metal)"/><path d="M137 154l-3 2 3 2 3 -2z" fill="#56556e" stroke="none"/>
    <path d="M121 174h4m25 0h4" stroke="#e7a1aa" stroke-width="1.5"/></g>`;

const pHeadBack = () => `<g class="pHead">${pEars(false)}
    <path d="M116 166q-1 -16 21 -16q22 0 22 16q0 18 -21 18q-22 0 -22 -18" fill="url(#white)"/><path d="M120 171q18 12 34 0" stroke="#b0bdca" fill="none" stroke-width="1"/>
    <path d="M116 156q20 -5 42 0v5q-20 -4 -42 0z" fill="#b74c60"/><path d="M149 158l13 6 -7 3 -8 -6" fill="#b74c60"/></g>`;

const mochi = (back, holdsBamboo) => `<g class="pip">
    ${pLeg(false)}${pLeg(true)}
    <g class="pTorso"><path d="M122 178q15 -8 29 0l5 28q-17 8 -37 0z" fill="url(#robe)"/>
        ${back
            ? `<path d="M124 178q13 4 25 0" fill="none" stroke="#c85164" stroke-width="3"/>${cloud(137, 192, 0.5)}`
            : `<path d="M124 178l13 8 12 -8" fill="none" stroke="#c85164" stroke-width="3"/><path d="M137 186v20" stroke="#ba596a" stroke-width="1"/>${cloud(137, 198, 0.39)}`}
        <path d="M123 180q14 8 28 0q-14 3 -28 0z" fill="#05060b" opacity=".35" stroke="none"/>
        ${pArms(holdsBamboo)}
        ${back ? pHeadBack() : pHeadFront()}
    </g>
</g>`;

// ---------- the clouds that rise behind them while they dance ----------
const puffs = () => [[150, 138, 0.46, 0], [126, 112, 0.4, -0.9], [160, 100, 0.36, -1.8]].map(([x, y, s, d]) => `<g class="puff" style="animation-delay:${d}s">${cloud(x, y, s)}</g>`).join('');

const defs = () => [
    lin('skin', [0, 0, 0.8, 1], [[0, '#f4c5a8'], [1, '#c78870']]),
    lin('robe', [0, 0, 1, 1], [[0, '#343441'], [0.5, '#1a1b27'], [1, '#10121c']]),
    lin('torso', [33, 125, 103, 184], [[0, '#3a3a4a'], [0.45, '#1b1c28'], [1, '#0f111a']], true),
    lin('sleeve', [14, 124, 42, 163], [[0, '#3a3a4a'], [0.5, '#1c1d2a'], [1, '#11131d']], true),
    lin('red', [0, 0, 1, 1], [[0, '#ed666c'], [1, '#9d2441']]),
    lin('metal', [0, 0, 0.7, 1], [[0, '#e1dce0'], [0.5, '#9299ab'], [1, '#cbd6db']]),
    lin('beard', [0, 0, 0.3, 1], [[0, '#654332'], [1, '#382b28']]),
    lin('white', [0, 0, 0.8, 1], [[0, '#fff9ed'], [1, '#c8d3dc']]),
].join('');

/** Eight beats of the dance (every 12.5% of the loop) from a list of eight transforms; the ninth frame is the first again. */
const beats = (name, values) => kf(name, Object.fromEntries([...values, values[0]].map((v, i) => [i * 12.5, `transform:${v}`])));
const rot = (...degrees) => degrees.map((d) => `rotate(${d}deg)`);

const motion = (state) => {
    const base = origins({
        adam: '65px 225px', head: '65px 113px', armL: '38px 133px', armR: '38px 133px', foreL: '28px 149px', foreR: '28px 149px',
        legL: '51px 181px', legR: '79px 181px', robeL: '49px 171px', robeR: '80px 171px', bandtail: '91px 55px',
        pip: '137px 222px', pHead: '137px 179px', pTorso: '137px 202px', pArmL: '123px 183px', pArmR: '150px 183px', pLegL: '128px 204px', pLegR: '146px 204px',
        pEarL: '122px 153px', pEarR: '151px 153px',
    }, ['eyes', 'pEyes', 'puff', 'shadow', 'pshadow']);
    const always = `
        ${kf('blink', { 0: 'transform:scaleY(1)', 92: 'transform:scaleY(1)', 95: 'transform:scaleY(.1)', 98: 'transform:scaleY(1)', 100: 'transform:scaleY(1)' })}
        ${kf('flutter', { 0: 'transform:rotate(-6deg)', 50: 'transform:rotate(12deg)', 100: 'transform:rotate(-6deg)' })}
        ${play('.eyes', 'blink', 4.2)}${play('.pEyes', 'blink', 3.4, '-1.2s')}`;
    const rules = {
        Standing: `
            ${kf('breathe', { 0: 'transform:scale(1,1)', 50: 'transform:scale(1.01,.99)', 100: 'transform:scale(1,1)' })}
            ${kf('look', { 0: 'transform:rotate(-1.5deg)', 30: 'transform:rotate(1.5deg)', 56: 'transform:rotate(0)', 62: 'transform:rotate(4deg)', 84: 'transform:rotate(4deg)', 92: 'transform:rotate(-1deg)', 100: 'transform:rotate(-1.5deg)' })}
            ${kf('wave', { 0: 'transform:rotate(3deg)', 54: 'transform:rotate(3deg)', 62: 'transform:rotate(80deg)', 84: 'transform:rotate(80deg)', 92: 'transform:rotate(3deg)', 100: 'transform:rotate(3deg)' })}
            ${kf('waveFore', { 0: 'transform:rotate(0)', 56: 'transform:rotate(0)', 62: 'transform:rotate(60deg)', 66: 'transform:rotate(40deg)', 70: 'transform:rotate(80deg)', 74: 'transform:rotate(40deg)', 78: 'transform:rotate(80deg)', 84: 'transform:rotate(60deg)', 92: 'transform:rotate(0)', 100: 'transform:rotate(0)' })}
            ${kf('armSway', { 0: 'transform:rotate(2deg)', 50: 'transform:rotate(-2deg)', 100: 'transform:rotate(2deg)' })}
            ${kf('nibbleArm', { 0: 'transform:rotate(-12deg)', 18: 'transform:rotate(-40deg)', 28: 'transform:rotate(-34deg)', 38: 'transform:rotate(-42deg)', 48: 'transform:rotate(-34deg)', 58: 'transform:rotate(-42deg)', 74: 'transform:rotate(-12deg)', 100: 'transform:rotate(-12deg)' })}
            ${kf('nibbleHead', { 0: 'transform:rotate(0)', 18: 'transform:rotate(-6deg)', 28: 'transform:rotate(-2deg)', 38: 'transform:rotate(-6deg)', 48: 'transform:rotate(-2deg)', 58: 'transform:rotate(-5deg)', 74: 'transform:rotate(2deg)', 90: 'transform:rotate(0)', 100: 'transform:rotate(0)' })}
            ${kf('twitch', { 0: 'transform:rotate(0)', 70: 'transform:rotate(0)', 73: 'transform:rotate(-16deg)', 76: 'transform:rotate(0)', 100: 'transform:rotate(0)' })}
            ${play('.adam', 'breathe', 3.2)}${play('.head', 'look', 6)}${play('.bandtail', 'flutter', 1.6)}${play('.armL', 'armSway', 3.2)}${play('.armR', 'wave', 6)}${play('.foreR', 'waveFore', 6)}
            ${play('.pip', 'breathe', 3.2, '-1.4s')}${play('.pArmR', 'nibbleArm', 3.6)}${play('.pHead', 'nibbleHead', 3.6)}${play('.pEarR', 'twitch', 5)}`,
        Dancing: `
            ${beats('bounce', ['translate(0,0) rotate(0)', 'translate(-3px,2px) rotate(-3deg)', 'translate(-3px,-5px) rotate(-3deg)', 'translate(-1px,2px) rotate(-1deg)', 'translate(3px,2px) rotate(3deg)', 'translate(3px,-5px) rotate(3deg)', 'translate(1px,2px) scale(1.02,.98)', 'translate(0,-9px) rotate(-2deg)'])}
            ${beats('nod', rot(0, 3, 7, 2, -3, -7, -1, 4))}
            ${beats('kickL', ['rotate(0)', 'rotate(15deg)', 'translate(-3px,-7px) rotate(25deg)', 'rotate(-8deg)', 'rotate(-13deg)', 'rotate(-7deg)', 'rotate(5deg)', 'rotate(-12deg)'])}
            ${beats('kickR', ['rotate(0)', 'rotate(10deg)', 'rotate(6deg)', 'rotate(-8deg)', 'rotate(-15deg)', 'translate(3px,-5px) rotate(-25deg)', 'rotate(-5deg)', 'rotate(12deg)'])}
            ${beats('flapL', rot(0, 4, 8, 0, -3, -6, 0, 9))}${beats('flapR', rot(0, 3, 6, 0, -4, -8, 0, -9))}
            ${beats('swingL', rot(15, 40, 110, 60, 15, 45, -10, 150))}${beats('swingR', rot(15, 15, 45, 110, 60, 30, -10, 150))}
            ${beats('elbowL', rot(-15, -95, -305, -190, -35, -135, -115, -345))}${beats('elbowR', rot(-15, -30, -135, -305, -190, -90, -115, -345))}
            ${beats('shadowDance', ['scale(1)', 'scale(1)', 'scale(.9)', 'scale(1)', 'scale(1)', 'scale(.9)', 'scale(1.04)', 'scale(.8)'])}
            ${kf('hop', { 0: 'transform:translateY(0) scale(1.05,.95)', 40: 'transform:translateY(-9px) scale(.97,1.04)', 80: 'transform:translateY(0) scale(1.05,.95)', 100: 'transform:translateY(0) scale(1.05,.95)' })}
            ${beats('pKickL', ['translate(0,0) rotate(0)', 'translate(0,0) rotate(0)', 'translate(-2px,-5px) rotate(23deg)', 'translate(0,0) rotate(0)', 'translate(0,0) rotate(0)', 'translate(0,0) rotate(0)', 'translateY(1px) scaleY(.94)', 'rotate(-10deg)'])}
            ${beats('pKickR', ['translate(0,0) rotate(0)', 'translate(0,0) rotate(0)', 'translate(0,0) rotate(0)', 'translate(0,0) rotate(0)', 'translate(2px,-5px) rotate(-23deg)', 'translate(0,0) rotate(0)', 'translateY(1px) scaleY(.94)', 'rotate(10deg)'])}
            ${beats('pSwingL', rot(-8, -45, -95, -15, 30, -30, -10, 112))}${beats('pSwingR', rot(8, -30, -20, 45, 95, 30, 10, -112))}
            ${beats('pNod', rot(0, -9, -5, 9, 5, 0, -4, 3))}
            ${kf('earL', { 0: 'transform:rotate(8deg)', 40: 'transform:rotate(-14deg)', 80: 'transform:rotate(8deg)', 100: 'transform:rotate(8deg)' })}
            ${kf('earR', { 0: 'transform:rotate(-8deg)', 40: 'transform:rotate(14deg)', 80: 'transform:rotate(-8deg)', 100: 'transform:rotate(-8deg)' })}
            ${kf('shadowHop', { 0: 'transform:scale(1.05)', 40: 'transform:scale(.8)', 80: 'transform:scale(1.05)', 100: 'transform:scale(1.05)' })}
            ${kf('rise', { 0: 'transform:translateY(8px) scale(.4);opacity:0', 30: 'opacity:1', 100: 'transform:translateY(-34px) scale(1.1);opacity:0' })}
            ${play('.adam', 'bounce', 2.4)}${play('.head', 'nod', 2.4, '-.1s')}${play('.legL', 'kickL', 2.4)}${play('.legR', 'kickR', 2.4)}${play('.robeL', 'flapL', 2.4)}${play('.robeR', 'flapR', 2.4)}
            ${play('.armL', 'swingL', 2.4)}${play('.armR', 'swingR', 2.4)}${play('.foreL', 'elbowL', 2.4, '-.05s')}${play('.foreR', 'elbowR', 2.4, '-.05s')}${play('.bandtail', 'flutter', 0.6)}${play('.shadow', 'shadowDance', 2.4)}
            ${play('.pip', 'hop', 0.6, '-.3s')}${play('.pLegL', 'pKickL', 2.4)}${play('.pLegR', 'pKickR', 2.4)}${play('.pArmL', 'pSwingL', 2.4)}${play('.pArmR', 'pSwingR', 2.4)}${play('.pHead', 'pNod', 2.4)}
            ${play('.pEarL', 'earL', 0.6, '-.3s')}${play('.pEarR', 'earR', 0.6, '-.3s')}${play('.pshadow', 'shadowHop', 0.6, '-.3s')}${play('.puff', 'rise', 1.8)}
            ${pose('.armL', 'rotate(105deg)')}${pose('.armR', 'rotate(105deg)')}${pose('.foreL', 'rotate(60deg)')}${pose('.foreR', 'rotate(60deg)')}${pose('.head', 'rotate(-5deg)')}${pose('.adam', 'rotate(-3deg)')}
            ${pose('.pArmL', 'rotate(108deg)')}${pose('.pArmR', 'rotate(-108deg)')}${pose('.pip', 'translateY(-6px)')}${pose('.legL', 'translateY(-4px) rotate(10deg)')}`,
        DJing: `
            ${kf('sway', { 0: 'transform:translate(0,0) rotate(-2deg)', 25: 'transform:translate(-2px,-3px) rotate(-3deg)', 50: 'transform:translate(0,0) rotate(2deg)', 75: 'transform:translate(2px,-3px) rotate(3deg)', 100: 'transform:translate(0,0) rotate(-2deg)' })}
            ${kf('nodBack', { 0: 'transform:rotate(-3deg)', 25: 'transform:rotate(0) translateY(2px)', 50: 'transform:rotate(3deg)', 75: 'transform:rotate(0) translateY(2px)', 100: 'transform:rotate(-3deg)' })}
            ${kf('scratchArm', { 0: 'transform:rotate(22deg)', 25: 'transform:rotate(30deg)', 50: 'transform:rotate(24deg)', 75: 'transform:rotate(30deg)', 100: 'transform:rotate(22deg)' })}
            ${kf('scratch', { 0: 'transform:rotate(-62deg)', 50: 'transform:rotate(-38deg)', 100: 'transform:rotate(-62deg)' })}
            ${kf('pumpArm', { 0: 'transform:rotate(20deg)', 25: 'transform:rotate(34deg)', 50: 'transform:rotate(20deg)', 75: 'transform:rotate(34deg)', 100: 'transform:rotate(20deg)' })}
            ${kf('pump', { 0: 'transform:rotate(-70deg)', 25: 'transform:rotate(-45deg)', 50: 'transform:rotate(-70deg)', 75: 'transform:rotate(-45deg)', 100: 'transform:rotate(-70deg)' })}
            ${kf('tapL', { 0: 'transform:rotate(0)', 25: 'transform:translateY(-3px) rotate(9deg)', 50: 'transform:rotate(0)', 75: 'transform:rotate(-4deg)', 100: 'transform:rotate(0)' })}
            ${kf('tapR', { 0: 'transform:rotate(0)', 25: 'transform:rotate(4deg)', 50: 'transform:rotate(0)', 75: 'transform:translateY(-3px) rotate(-9deg)', 100: 'transform:rotate(0)' })}
            ${kf('flapDj', { 0: 'transform:rotate(0)', 25: 'transform:rotate(6deg)', 50: 'transform:rotate(0)', 75: 'transform:rotate(-5deg)', 100: 'transform:rotate(0)' })}
            ${kf('bob', { 0: 'transform:translate(0,0) rotate(-6deg)', 25: 'transform:translate(-3px,-7px) rotate(5deg)', 50: 'transform:translate(0,0) rotate(6deg)', 75: 'transform:translate(3px,-7px) rotate(-5deg)', 100: 'transform:translate(0,0) rotate(-6deg)' })}
            ${kf('pSwingDjL', { 0: 'transform:rotate(0)', 25: 'transform:rotate(95deg)', 50: 'transform:rotate(15deg)', 75: 'transform:rotate(45deg)', 100: 'transform:rotate(0)' })}
            ${kf('pSwingDjR', { 0: 'transform:rotate(-75deg)', 25: 'transform:rotate(-15deg)', 50: 'transform:rotate(-100deg)', 75: 'transform:rotate(-20deg)', 100: 'transform:rotate(-75deg)' })}
            ${kf('pNodDj', { 0: 'transform:rotate(-4deg)', 25: 'transform:rotate(3deg)', 50: 'transform:rotate(4deg)', 75: 'transform:rotate(-3deg)', 100: 'transform:rotate(-4deg)' })}
            ${kf('shadowBeat', { 0: 'transform:scale(1)', 25: 'transform:scale(.92)', 50: 'transform:scale(1)', 75: 'transform:scale(.92)', 100: 'transform:scale(1)' })}
            ${play('.adam', 'sway', 1.2)}${play('.head', 'nodBack', 1.2, '-1.1s')}${play('.armL', 'scratchArm', 1.2)}${play('.foreL', 'scratch', 0.3)}${play('.armR', 'pumpArm', 1.2)}${play('.foreR', 'pump', 1.2, '-.05s')}
            ${play('.legL', 'tapL', 1.2)}${play('.legR', 'tapR', 1.2)}${play('.robeL', 'flapDj', 1.2)}${play('.robeR', 'flapDj', 1.2, '-.6s')}${play('.bandtail', 'flutter', 0.6)}${play('.shadow', 'shadowBeat', 1.2)}
            ${play('.pip', 'bob', 1.2)}${play('.pArmL', 'pSwingDjL', 1.2)}${play('.pArmR', 'pSwingDjR', 1.2)}${play('.pHead', 'pNodDj', 1.2)}${play('.pshadow', 'shadowBeat', 1.2, '-.3s')}
            ${pose('.armL', 'rotate(28deg)')}${pose('.armR', 'rotate(28deg)')}${pose('.foreL', 'rotate(-60deg)')}${pose('.foreR', 'rotate(-60deg)')}${pose('.pArmL', 'rotate(40deg)')}${pose('.pArmR', 'rotate(-60deg)')}`,
    };
    return base + always + rules[state];
};

export function adamMochi(state) {
    const back = state === 'DJing';
    const dancing = state === 'Dancing';
    return picture({
        label: 'Adam &amp; Mochi',
        state,
        defs: defs(),
        body: `<g transform="${FIT}" stroke="${INK}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
<ellipse class="shadow" cx="65" cy="226" rx="42" ry="6.4" fill="url(#shd)" stroke="none"/><ellipse class="pshadow" cx="133" cy="225" rx="21" ry="3.8" fill="url(#shd)" stroke="none"/>
${dancing ? puffs() : ''}${adam(back, dancing)}<g transform="translate(-4 0)">${mochi(back, state === 'Standing')}</g></g>`,
        css: motion(state),
    });
}
