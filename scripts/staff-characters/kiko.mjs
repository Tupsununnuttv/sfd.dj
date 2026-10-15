// Kiko & Mochi: a DJ girl and her Shiba Inu puppy. Kiko has lilac space buns, big violet eyes, pink headphones, an oversized lavender hoodie with a
// star and white chunky sneakers. Mochi sits beside her: an orange Shiba with a cream face and chest, the little eyebrow dots, a curled tail and a red
// bandana. Standing, Mochi wags and tilts its head while Kiko sways; dancing, they hop in turn (Mochi on the off-beat with its front paws up) and hearts
// rise between them; at the decks Kiko pumps a fist and Mochi bobs beside her. Everybody can wear them from level 16.
import { kf, lin, mirror, origins, picture, play, pose, rad, shadow } from './kit.mjs';
import { capsule } from './shapes.mjs';

const INK = '#3b1e4a';
const both = (part) => part + mirror(part);

// ---------- Kiko ----------
const HAIR_BACK = 'M44 64C40 40 56 22 80 22C104 22 120 40 116 64L118 96C112 104 104 104 102 98L100 70H60L58 98C56 104 48 104 42 96Z';
const FACE = 'M49 60C49 40 62 30 80 30C98 30 111 40 111 60C111 80 98 94 80 94C62 94 49 80 49 60Z';
const BANGS = 'M47 58C46 38 60 26 80 26C100 26 114 38 113 58L106 50L101 57L95 47L88 55L80 44L72 55L65 47L59 57L54 50Z';
const LOCK = 'M50 52C44 64 43 82 46 98C47 102 52 102 53 98C53 84 54 68 56 56Z';

const eye = () => `<g class="blink">
    <ellipse cx="68" cy="64" rx="6.6" ry="8" fill="#fff"/>
    <ellipse cx="68.4" cy="65" rx="5.2" ry="6.8" fill="url(#iris)"/>
    <circle cx="68.6" cy="65.4" r="2.8" fill="#2a1240"/>
    <circle cx="70.4" cy="61.8" r="2.2" fill="#fff"/><circle cx="66.4" cy="68.6" r="1" fill="#fff"/>
    <path d="M60.6 59.4C63 55.8 72 55 76 59" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M61.4 60L58.6 57.6" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
</g>`;

const kikoFace = (happy) => `
    ${happy ? both(`<path d="M61.6 66C64 60 72 60 74.4 66" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`) : both(eye())}
    ${both(`<path d="M63 52.6C66 51 70 51 73 52.4" fill="none" stroke="#9d5fb8" stroke-width="1.4" stroke-linecap="round"/>`)}
    ${both('<ellipse cx="61" cy="77" rx="5.2" ry="3" fill="#ff8fb4" opacity=".55"/>')}
    <path d="M79 74.4C79.6 75 80.4 75 81 74.4" fill="none" stroke="#c97a8a" stroke-width="1.2" stroke-linecap="round"/>
    ${happy
        ? '<path d="M74.6 79.4C75.6 86.6 84.4 86.6 85.4 79.4Z" fill="#8a2f52" stroke="#5a1a35" stroke-width="1" stroke-linejoin="round"/><path d="M77 83.4C78.6 82 81.4 82 83 83.4C82 85.4 78 85.4 77 83.4Z" fill="#ff8fb1"/>'
        : '<path d="M75.6 80C78 82.6 82 82.6 84.4 80" fill="none" stroke="#b4537c" stroke-width="1.8" stroke-linecap="round"/>'}`;

/** Pink headphones: on her head in every state (at the decks seen from behind). */
const phones = (back) => `<path d="M44 70C40 36 58 18 80 18C102 18 120 36 116 70" fill="none" stroke="#f5f3ff" stroke-width="5.4" stroke-linecap="round"/>
    <path d="M47 60C45 36 60 22 80 22C100 22 115 36 113 60" fill="none" stroke="#f9a8d4" stroke-width="1.6" stroke-linecap="round"/>
    ${both(`<g transform="translate(44.4 71)"><ellipse rx="7.4" ry="11" fill="url(#cup)" stroke="${INK}" stroke-width=".9"/><ellipse cx="${back ? -0.8 : 0.8}" rx="4.4" ry="7.4" fill="#fdf2f8"/><ellipse class="led" cx="${back ? -0.8 : 0.8}" rx="4.4" ry="7.4" fill="none" stroke="#5eead4" stroke-width="1.3" filter="url(#glow)"/></g>`)}`;

const head = (back, happy) => `<g class="head">
    <path d="${HAIR_BACK}" fill="url(#hair)" stroke="${INK}" stroke-width="1"/>
    <g class="bunL"><circle cx="54" cy="22" r="14" fill="url(#hair)" stroke="${INK}" stroke-width="1"/><path d="M46 18C50 12 58 12 61 18" fill="none" stroke="#f5d0fe" stroke-width="1.6" stroke-linecap="round"/></g>
    ${mirror('<g class="bunR"><circle cx="54" cy="22" r="14" fill="url(#hair)" stroke="#3b1e4a" stroke-width="1"/><path d="M46 18C50 12 58 12 61 18" fill="none" stroke="#f5d0fe" stroke-width="1.6" stroke-linecap="round"/></g>')}
    ${back
        ? `<path d="M46 60C44 38 60 24 80 24C100 24 116 38 114 60C114 82 102 96 80 96C58 96 46 82 46 60Z" fill="url(#hair)" stroke="${INK}" stroke-width="1"/><path d="M80 26V92M64 30C60 50 60 74 64 92M96 30C100 50 100 74 96 92" fill="none" stroke="#a855f7" stroke-opacity=".45" stroke-width="1.2"/>`
        : `<path d="${FACE}" fill="url(#skin)" stroke="#d99a7e" stroke-width="1"/>${kikoFace(happy)}<path d="${BANGS}" fill="url(#hair)" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/><path d="M60 34C66 30 74 29 80 29" fill="none" stroke="#f5d0fe" stroke-width="1.6" stroke-linecap="round"/>`}
    <g class="lockL"><path d="${LOCK}" fill="url(#hair)" stroke="${INK}" stroke-width="1"/></g>${mirror(`<g class="lockR"><path d="${LOCK}" fill="url(#hair)" stroke="${INK}" stroke-width="1"/></g>`)}
    <path d="M70 18.6L72.4 13.4L74.8 18.6L80 19.4L76 22.6L77.2 28L72.4 25.2L67.6 28L68.8 22.6L64.8 19.4Z" transform="translate(28 -2) scale(.7)" fill="#fde047" stroke="#ca8a04" stroke-width="1"/>
    ${phones(back)}
</g>`;

const HOODIE = 'M58 100C66 97.6 94 97.6 102 100C112 104 116 116 117 132L120 184C110 190.6 50 190.6 40 184L43 132C44 116 48 104 58 100Z';

const body = (back) => `<g class="body">
    <path d="${HOODIE}" fill="url(#hoodie)" stroke="${INK}" stroke-width="1.1"/>
    ${back
        ? '<path d="M60 100C60 92 100 92 100 100C102 116 96 128 80 132C64 128 58 116 60 100Z" fill="url(#hood)" stroke="#3b1e4a" stroke-width="1"/><path d="M80 150L83.6 157.4L91.6 158.4L85.8 164L87.2 172L80 168.2L72.8 172L74.2 164L68.4 158.4L76.4 157.4Z" fill="#fdf4ff"/>'
        : `<path d="M62 100C66 93.6 94 93.6 98 100C94 105.6 66 105.6 62 100Z" fill="url(#hood)" stroke="${INK}" stroke-width="1"/>
           <path d="M74 103L72.6 126M86 103L87.4 126" stroke="#fdf4ff" stroke-width="1.6" stroke-linecap="round"/><circle cx="72.6" cy="127" r="1.8" fill="#f9a8d4"/><circle cx="87.4" cy="127" r="1.8" fill="#f9a8d4"/>
           <path d="M80 118L82.6 123.4L88.4 124.2L84.2 128.2L85.2 134L80 131.2L74.8 134L75.8 128.2L71.6 124.2L77.4 123.4Z" fill="#fdf4ff"/>
           <path d="M60 150H100L104 172H56Z" fill="url(#hood)" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/><path d="M64 154H96" stroke="#c4b5fd" stroke-width="1.2" stroke-linecap="round"/>`}
    <path d="M42 182C56 188 104 188 118 182" fill="none" stroke="#7c3aed" stroke-width="3" stroke-linecap="round"/>
    <path d="M48 120C46 140 45 160 46 178" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2.4" stroke-linecap="round"/>
</g>`;

const kikoLeg = (side) => `<g class="leg${side}">
    <path d="${capsule([68, 184], [68, 226], 6, 5.6)}" fill="url(#tights)" stroke="${INK}" stroke-width="1"/>
    <path d="M56 236C56 228 62 223 70 224C77 225 80 229 80 234C80 238 78 240 74 240H59C57 240 56 238.6 56 236Z" fill="url(#shoe)" stroke="${INK}" stroke-width="1"/>
    <path d="M56.4 236.4H79.6" stroke="#f472b6" stroke-width="2.4"/>
    <path d="M65 228L69 227M66.4 230.8L70.4 229.8" stroke="#f472b6" stroke-width="1.2" stroke-linecap="round"/>
</g>`;

const kikoArm = (side) => `<g class="arm${side}">
    <path d="${capsule([53, 108], [44, 136], 8.4, 7.6)}" fill="url(#hoodie)" stroke="${INK}" stroke-width="1"/>
    <g class="fore${side}">
        <path d="${capsule([44, 134], [44, 157], 7.6, 8.4)}" fill="url(#hoodie)" stroke="${INK}" stroke-width="1"/>
        <path d="M36.6 156H51.4" stroke="#7c3aed" stroke-width="2.6" stroke-linecap="round"/>
        <g class="hand${side}"><circle cx="44" cy="163" r="5.8" fill="url(#skin)" stroke="#d99a7e" stroke-width="1"/><path d="M40.6 166.4C42 167.6 44.6 167.8 46.4 166.8" fill="none" stroke="#d99a7e" stroke-width="1" stroke-linecap="round"/></g>
    </g>
</g>`;

// ---------- Mochi, the Shiba (sitting on Kiko's right) ----------
const DOG_EAR = 'M141 179L143 160L153 172Z';
const mochi = (back, happy) => `<g class="dog">
    <ellipse cx="141.6" cy="231" rx="9.4" ry="7.4" fill="url(#shiba)" stroke="#7c2d12" stroke-width="1"/>
    <ellipse cx="166.4" cy="231" rx="9.4" ry="7.4" fill="url(#shiba)" stroke="#7c2d12" stroke-width="1"/>
    <g class="tail"><path d="M166 214C178 214 182 202 177 195C172 189 162 192 164 199C165 203 170 203 170.6 199.6" fill="none" stroke="#7c2d12" stroke-width="8.4" stroke-linecap="round"/><path d="M166 214C178 214 182 202 177 195C172 189 162 192 164 199C165 203 170 203 170.6 199.6" fill="none" stroke="url(#shiba)" stroke-width="6.4" stroke-linecap="round"/><path d="M168 211C175 210 178 203 175.4 198" fill="none" stroke="#fff3e0" stroke-width="2.2" stroke-linecap="round"/></g>
    <path d="M139 236C137 220 142 202 154 200C166 202 171 220 169 236Z" fill="url(#shiba)" stroke="#7c2d12" stroke-width="1.1"/>
    ${back
        ? '<path d="M154 202C150 214 150 226 154 236" fill="none" stroke="#9a3412" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/>'
        : `<ellipse cx="154" cy="219" rx="10" ry="14" fill="url(#cream)"/>
           <g class="pawL"><path d="${capsule([149, 214], [148.6, 234], 3.8, 3.6)}" fill="url(#cream)" stroke="#a16207" stroke-width=".9"/><ellipse cx="148.4" cy="236.4" rx="4.4" ry="2.6" fill="url(#cream)" stroke="#a16207" stroke-width=".9"/></g>
           <g class="pawR"><path d="${capsule([159, 214], [159.4, 234], 3.8, 3.6)}" fill="url(#cream)" stroke="#a16207" stroke-width=".9"/><ellipse cx="159.6" cy="236.4" rx="4.4" ry="2.6" fill="url(#cream)" stroke="#a16207" stroke-width=".9"/></g>`}
    <g class="dogHead">
        <g class="dogEarL"><path d="${DOG_EAR}" fill="url(#shiba)" stroke="#7c2d12" stroke-width="1" stroke-linejoin="round"/>${back ? '' : '<path d="M144 175L145.4 165L150.4 172Z" fill="#fecdd3"/>'}</g>
        <g class="dogEarR"><path d="${DOG_EAR}" transform="translate(308 0) scale(-1 1)" fill="url(#shiba)" stroke="#7c2d12" stroke-width="1" stroke-linejoin="round"/>${back ? '' : '<path d="M144 175L145.4 165L150.4 172Z" transform="translate(308 0) scale(-1 1)" fill="#fecdd3"/>'}</g>
        <ellipse cx="154" cy="186" rx="16.4" ry="14.4" fill="url(#shiba)" stroke="#7c2d12" stroke-width="1.1"/>
        ${back
            ? '<path d="M144 178C148 174 160 174 164 178" fill="none" stroke="#fdba74" stroke-width="1.4" stroke-linecap="round"/>'
            : `<path d="M140 190C142 198 148 201 154 201C160 201 166 198 168 190C164 193 160 191 154 191C148 191 144 193 140 190Z" fill="url(#cream)"/>
               <ellipse cx="154" cy="193" rx="7.4" ry="5.4" fill="url(#cream)"/>
               <circle cx="147.6" cy="180.4" r="1.6" fill="#fff3e0"/><circle cx="160.4" cy="180.4" r="1.6" fill="#fff3e0"/>
               ${happy
                   ? '<path d="M145 185C146.6 182 150 182 151.4 185M156.6 185C158 182 161.4 182 163 185" fill="none" stroke="#1c1917" stroke-width="1.6" stroke-linecap="round"/>'
                   : '<g class="dogBlink"><ellipse cx="148.4" cy="184.4" rx="2.2" ry="2.6" fill="#1c1917"/><ellipse cx="159.6" cy="184.4" rx="2.2" ry="2.6" fill="#1c1917"/><circle cx="149.2" cy="183.4" r=".8" fill="#fff"/><circle cx="160.4" cy="183.4" r=".8" fill="#fff"/></g>'}
               <path d="M151.4 189.6C151.4 188 156.6 188 156.6 189.6C156.6 191 155 192 154 192C153 192 151.4 191 151.4 189.6Z" fill="#1c1917"/>
               ${happy ? '<path d="M151.6 195C152 199.6 156 199.6 156.4 195Z" fill="#fb7185" stroke="#9f1239" stroke-width=".7"/>' : ''}
               <path d="M154 192V194.4M150.6 195C152 196.4 153.4 196.4 154 194.4C154.6 196.4 156 196.4 157.4 195" fill="none" stroke="#1c1917" stroke-width="1" stroke-linecap="round"/>`}
        <path d="M143.6 199.4Q154 205.4 164.4 199.4L154 211Z" fill="url(#bandana)" stroke="#7f1d1d" stroke-width=".9" stroke-linejoin="round"/>
        <circle cx="151" cy="203" r=".9" fill="#fff"/><circle cx="157" cy="203" r=".9" fill="#fff"/><circle cx="154" cy="207" r=".9" fill="#fff"/>
    </g>
</g>`;

/** Hearts that rise between them while they dance (and now and then while they stand). */
const hearts = () => [[118, 150, 1, 0], [128, 120, 0.8, -0.8], [112, 100, 0.7, -1.6]].map(([x, y, s, d]) => `<g class="heart" style="animation-delay:${d}s"><path transform="translate(${x} ${y}) scale(${s})" d="M0 3C-6 -1 -7 -6 -3.6 -7.4C-1.6 -8.2 0 -6.6 0 -5.4C0 -6.6 1.6 -8.2 3.6 -7.4C7 -6 6 -1 0 3Z" fill="#fb7185" stroke="#be123c" stroke-width=".8"/></g>`).join('');

const defs = () => [
    rad('skin', [0.42, 0.36, 0.7], [[0, '#fff1e8'], [0.6, '#ffd9c4'], [1, '#f5b89c']]),
    lin('hair', [0, 0, 1, 1], [[0, '#e9d5ff'], [0.45, '#c084fc'], [1, '#9333ea']]),
    rad('iris', [0.45, 0.3, 0.75], [[0, '#ddd6fe'], [0.5, '#8b5cf6'], [1, '#4c1d95']]),
    lin('hoodie', [0.1, 0, 0.9, 1], [[0, '#ddd6fe'], [0.5, '#a78bfa'], [1, '#7c3aed']]),
    lin('hood', [0, 0, 0, 1], [[0, '#c4b5fd'], [1, '#8b5cf6']]),
    lin('tights', [0, 0, 1, 0], [[0, '#4b3b5c'], [1, '#1e1529']]),
    lin('shoe', [0, 0, 0, 1], [[0, '#ffffff'], [1, '#e9e3f5']]),
    lin('cup', [0, 0, 1, 1], [[0, '#fbcfe8'], [0.55, '#f472b6'], [1, '#be185d']]),
    rad('shiba', [0.4, 0.3, 0.8], [[0, '#fdba74'], [0.55, '#f97316'], [1, '#c2410c']]),
    lin('cream', [0, 0, 0, 1], [[0, '#fffbf2'], [1, '#fde7c8']]),
    lin('bandana', [0, 0, 1, 1], [[0, '#f87171'], [1, '#b91c1c']]),
    `<filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
].join('');

const motion = (state) => {
    const joints = { arm: '53px 108px', fore: '44px 135px', hand: '44px 160px', leg: '68px 186px', lock: '52px 54px' };
    const base = origins({
        all: '80px 238px', head: '80px 98px', body: '80px 188px', bunL: '54px 30px', bunR: '54px 30px',
        dog: '154px 238px', dogHead: '154px 200px', tail: '166px 213px', dogEarL: '147px 176px', dogEarR: '161px 176px', pawL: '149px 214px', pawR: '159px 214px',
        ...Object.fromEntries(Object.entries(joints).flatMap(([part, o]) => [[`${part}L`, o], [`${part}R`, o]])),
    }, ['shadow', 'blink', 'dogBlink', 'heart']);
    const always = `
        ${kf('blink', { 0: 'transform:scaleY(1)', 92: 'transform:scaleY(1)', 95: 'transform:scaleY(.1)', 98: 'transform:scaleY(1)', 100: 'transform:scaleY(1)' })}
        ${kf('led', { 0: 'opacity:.45', 50: 'opacity:1', 100: 'opacity:.45' })}
        ${kf('wag', { 0: 'transform:rotate(-12deg)', 50: 'transform:rotate(14deg)', 100: 'transform:rotate(-12deg)' })}
        ${kf('heart', { 0: 'transform:translateY(8px) scale(.4);opacity:0', 30: 'opacity:1', 100: 'transform:translateY(-34px) scale(1.1);opacity:0' })}
        ${play('.blink', 'blink', 4.2)}${play('.dogBlink', 'blink', 3.4, '-1.2s')}${play('.led', 'led', 1.2)}`;
    const rules = {
        Standing: `
            ${kf('breathe', { 0: 'transform:scale(1,1)', 50: 'transform:scale(1.012,.988)', 100: 'transform:scale(1,1)' })}
            ${kf('sway', { 0: 'transform:rotate(-2.5deg)', 50: 'transform:rotate(2.5deg)', 100: 'transform:rotate(-2.5deg)' })}
            ${kf('lock', { 0: 'transform:rotate(2deg)', 50: 'transform:rotate(-3deg)', 100: 'transform:rotate(2deg)' })}
            ${kf('look', { 0: 'transform:rotate(0)', 45: 'transform:rotate(0)', 55: 'transform:rotate(-16deg)', 80: 'transform:rotate(-16deg)', 90: 'transform:rotate(0)', 100: 'transform:rotate(0)' })}
            ${kf('twitch', { 0: 'transform:rotate(0)', 60: 'transform:rotate(0)', 63: 'transform:rotate(-14deg)', 66: 'transform:rotate(0)', 100: 'transform:rotate(0)' })}
            ${kf('wave', { 0: 'transform:rotate(4deg)', 55: 'transform:rotate(4deg)', 62: 'transform:rotate(30deg)', 82: 'transform:rotate(30deg)', 90: 'transform:rotate(4deg)', 100: 'transform:rotate(4deg)' })}
            ${kf('waveFore', { 0: 'transform:rotate(0)', 55: 'transform:rotate(0)', 62: 'transform:rotate(24deg)', 66: 'transform:rotate(36deg)', 70: 'transform:rotate(22deg)', 74: 'transform:rotate(36deg)', 78: 'transform:rotate(24deg)', 90: 'transform:rotate(0)', 100: 'transform:rotate(0)' })}
            ${play('.body', 'breathe', 3.2)}${play('.head', 'sway', 4.4)}${play('.lockL', 'lock', 4.4, '-.3s')}${play('.lockR', 'lock', 4.4, '-.5s')}
            ${play('.dogHead', 'look', 5)}${play('.dogEarL', 'twitch', 5)}${play('.tail', 'wag', 0.5)}
            ${play('.armR', 'wave', 5)}${play('.foreR', 'waveFore', 5)}`,
        Dancing: `
            ${kf('hop', { 0: 'transform:translateY(0) scale(1.04,.96)', 45: 'transform:translateY(-11px) scale(.98,1.03)', 100: 'transform:translateY(0) scale(1.04,.96)' })}
            ${kf('bob', { 0: 'transform:rotate(-7deg)', 50: 'transform:rotate(7deg) translateY(2px)', 100: 'transform:rotate(-7deg)' })}
            ${kf('bun', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-3px)', 100: 'transform:translateY(0)' })}
            ${kf('lock', { 0: 'transform:rotate(8deg)', 50: 'transform:rotate(-10deg)', 100: 'transform:rotate(8deg)' })}
            ${kf('swing', { 0: 'transform:rotate(124deg)', 50: 'transform:rotate(150deg)', 100: 'transform:rotate(124deg)' })}
            ${kf('swingFore', { 0: 'transform:rotate(24deg)', 50: 'transform:rotate(-10deg)', 100: 'transform:rotate(24deg)' })}
            ${kf('step', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-6px)', 100: 'transform:translateY(0)' })}
            ${kf('pup', { 0: 'transform:translateY(0) scale(1.06,.94)', 45: 'transform:translateY(-13px) scale(.96,1.05)', 100: 'transform:translateY(0) scale(1.06,.94)' })}
            ${kf('beg', { 0: 'transform:translateY(0) scaleY(1)', 45: 'transform:translateY(-10px) scaleY(.5)', 100: 'transform:translateY(0) scaleY(1)' })}
            ${kf('dogBob', { 0: 'transform:rotate(8deg)', 50: 'transform:rotate(-8deg)', 100: 'transform:rotate(8deg)' })}
            ${kf('shadowHop', { 0: 'transform:scale(1.04)', 45: 'transform:scale(.84)', 100: 'transform:scale(1.04)' })}
            ${play('.all', 'hop', 0.6)}${play('.head', 'bob', 1.2, '-1.1s')}${play('.bunL', 'bun', 0.6, '-.5s')}${play('.bunR', 'bun', 0.6, '-.45s')}${play('.lockL', 'lock', 0.6, '-.5s')}${play('.lockR', 'lock', 0.6, '-.4s')}
            ${play('.armL', 'swing', 1.2)}${play('.foreL', 'swingFore', 1.2, '-1.1s')}${play('.armR', 'swing', 1.2, '-.6s')}${play('.foreR', 'swingFore', 1.2, '-.5s')}
            ${play('.legL', 'step', 0.6)}${play('.legR', 'step', 0.6, '-.3s')}
            ${play('.dog', 'pup', 0.6, '-.3s')}${play('.pawL', 'beg', 0.6, '-.3s')}${play('.pawR', 'beg', 0.6, '-.25s')}${play('.dogHead', 'dogBob', 0.6, '-.2s')}${play('.tail', 'wag', 0.3)}${play('.heart', 'heart', 1.8)}${play('.shadow', 'shadowHop', 0.6)}
            ${pose('.armL', 'rotate(130deg)')}${pose('.foreL', 'rotate(16deg)')}${pose('.armR', 'rotate(146deg)')}${pose('.foreR', 'rotate(-6deg)')}${pose('.pawL', 'translateY(-9px) scaleY(.55)')}${pose('.pawR', 'translateY(-9px) scaleY(.55)')}
            ${pose('.head', 'rotate(-5deg)')}${pose('.dog', 'translateY(-6px)')}${pose('.legL', 'translateY(-4px)')}`,
        DJing: `
            ${kf('jump', { 0: 'transform:translateY(0) scale(1.04,.96)', 40: 'transform:translateY(-10px) scale(.98,1.03)', 80: 'transform:translateY(0) scale(1.04,.96)', 100: 'transform:translateY(0) scale(1.04,.96)' })}
            ${kf('nodBack', { 0: 'transform:rotate(-4deg)', 40: 'transform:rotate(4deg) translateY(2.4px)', 100: 'transform:rotate(-4deg)' })}
            ${kf('lock', { 0: 'transform:rotate(6deg)', 50: 'transform:rotate(-8deg)', 100: 'transform:rotate(6deg)' })}
            ${kf('pump', { 0: 'transform:rotate(140deg)', 40: 'transform:rotate(162deg)', 100: 'transform:rotate(140deg)' })}
            ${kf('pumpFore', { 0: 'transform:rotate(30deg)', 40: 'transform:rotate(6deg)', 100: 'transform:rotate(30deg)' })}
            ${kf('scratch', { 0: 'transform:rotate(16deg)', 50: 'transform:rotate(32deg)', 100: 'transform:rotate(16deg)' })}
            ${kf('dogNod', { 0: 'transform:rotate(-6deg)', 40: 'transform:rotate(6deg) translateY(2px)', 100: 'transform:rotate(-6deg)' })}
            ${kf('pupHop', { 0: 'transform:translateY(0)', 40: 'transform:translateY(-6px)', 80: 'transform:translateY(0)', 100: 'transform:translateY(0)' })}
            ${kf('shadowJump', { 0: 'transform:scale(1.04)', 40: 'transform:scale(.8)', 80: 'transform:scale(1.04)', 100: 'transform:scale(1.04)' })}
            ${play('.all', 'jump', 0.6)}${play('.head', 'nodBack', 0.6, '-.54s')}${play('.lockL', 'lock', 0.6, '-.5s')}${play('.lockR', 'lock', 0.6, '-.4s')}
            ${play('.armL', 'pump', 0.6)}${play('.foreL', 'pumpFore', 0.6, '-.52s')}${play('.foreR', 'scratch', 0.3)}
            ${play('.dog', 'pupHop', 0.6, '-.3s')}${play('.dogHead', 'dogNod', 0.6, '-.2s')}${play('.tail', 'wag', 0.3)}${play('.shadow', 'shadowJump', 0.6)}
            ${pose('.armL', 'rotate(146deg)')}${pose('.foreL', 'rotate(20deg)')}${pose('.armR', 'rotate(14deg)')}${pose('.foreR', 'rotate(24deg)')}${pose('.head', 'rotate(-3deg)')}`,
    };

    return base + always + rules[state];
};

export function kiko(state) {
    const back = state === 'DJing';
    const dancing = state === 'Dancing';
    const girl = back
        ? `${kikoLeg('L')}${mirror(kikoLeg('R'))}${mirror(kikoArm('R'))}${body(true)}${head(true, false)}${kikoArm('L')}`
        : `${kikoLeg('L')}${mirror(kikoLeg('R'))}${body(false)}${kikoArm('L')}${mirror(kikoArm('R'))}${head(false, dancing)}`;

    return picture({
        label: 'Kiko &amp; Mochi',
        state,
        defs: defs(),
        body: `${shadow()}<ellipse class="shadow" cx="154" cy="238" rx="20" ry="4" fill="url(#shd)"/><g class="all">${girl}</g>${mochi(back, dancing)}${dancing ? hearts() : ''}`,
        css: motion(state),
    });
}
