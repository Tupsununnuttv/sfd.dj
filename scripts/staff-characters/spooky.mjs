// Spooky: a jack-o'-lantern scarecrow. A ribbed pumpkin head with a carved face lit by a candle inside (the light flickers, the cut edges show the
// pumpkin's thickness and the glow spills onto the skin), a twisted stem with a leaf and a curly vine, straw poking out at the neck and the cuffs, a striped
// scarf, a torn cloak with a crimson lining over a patched vest and a rope belt, leather gloves, curled boots, and an old iron lantern with a green ghost
// flame. Bats flit and will-o'-wisps rise around him. Everybody can wear him from level 14.
// The arms are chains (shoulder, elbow, wrist, and the lantern hanging from the hand), each joint a beat behind the one before, so the lantern swings
// like a pendulum and the cloak and scarf follow the body a moment late.
import { kf, lin, mirror, origins, picture, play, pose, rad, shadow } from './kit.mjs';

const r1 = (n) => Math.round(n * 10) / 10;
const both = (part) => part + mirror(part);

/** A torn edge from (x0, y0) to (x1, y1): `n` rags hanging up to `deep` below the line, each a little different. */
const rags = (x0, y0, x1, y1, n, deep) => Array.from({ length: n * 2 }, (_, i) => {
    const t = (i + 1) / (n * 2), wobble = [0.9, 0.55, 1.15, 0.7, 1, 0.6, 1.25, 0.8][i % 8];
    return `L${r1(x0 + (x1 - x0) * t)} ${r1(y0 + (y1 - y0) * t + (i % 2 ? 0 : deep * wobble))}`;
}).join('');

// ---------- the pumpkin ----------
const OUTER = 'M79 11C52 7 26 24 26 54C26 83 50 101 79 97Z';
const INNER = 'M80 10C61 9 45 27 45 54C45 81 61 99 80 98Z';
const MIDDLE = 'M80 9C67 9 62 31 62 54C62 77 67 99 80 99C93 99 98 77 98 54C98 31 93 9 80 9Z';
const PUMPKIN = 'M80 10C56 4 26 21 26 54C26 85 52 102 80 98C108 102 134 85 134 54C134 21 104 4 80 10Z';
const EYE = 'M47 40Q61 43 73 50Q66 57 54 59Q49 51 47 40Z';
const NOSE = 'M80 58.6L86.2 68.6Q80 70.6 73.8 68.6Z';
const MOUTH = 'M44 69C54 75 66 77 70 77L73 82L77 77H83L87 82L90 77C94 77 106 75 116 69C112 82 102 90 92 91L89 86L85 92C82 92.6 78 92.6 75 92L71 86L68 91C58 90 48 82 44 69Z';

/** The carved holes, each with the same attributes. */
const holes = (attrs) => `<path d="${EYE}" ${attrs}/><path d="${EYE}" transform="translate(160 0) scale(-1 1)" ${attrs}/><path d="${NOSE}" ${attrs}/><path d="${MOUTH}" ${attrs}/>`;

const lobes = () => `
    ${both(`<path d="${OUTER}" fill="url(#lobe)" stroke="#5c2203" stroke-width="1.1"/>`)}
    ${both(`<path d="${INNER}" fill="url(#lobe)" stroke="#5c2203" stroke-width="1.1"/>`)}
    <path d="${MIDDLE}" fill="url(#lobe)" stroke="#5c2203" stroke-width="1.1"/>
    <path d="M73.4 13C69.6 32 69.6 76 73.4 95M86.6 13C90.4 32 90.4 76 86.6 95" fill="none" stroke="#a9470b" stroke-opacity=".45" stroke-width=".8"/>
    ${both('<path d="M58 14C51 34 51 74 58 94M38 26C33 42 33 68 38 84" fill="none" stroke="#a9470b" stroke-opacity=".4" stroke-width=".8"/>')}
    <ellipse cx="72" cy="30" rx="4" ry="13" fill="url(#shine)"/>
    ${both('<ellipse cx="54.4" cy="34" rx="2.6" ry="10" fill="url(#shine)"/><ellipse cx="34" cy="44" rx="2" ry="8" fill="url(#shine)" opacity=".7"/>')}
    <g fill="#7a2d05" fill-opacity=".5"><circle cx="102" cy="28" r=".9"/><circle cx="106" cy="31" r=".6"/><circle cx="48" cy="76" r=".8"/><circle cx="66" cy="22" r=".6"/></g>
    <path d="${PUMPKIN}" fill="url(#pumpkinShade)"/>
    <ellipse cx="80" cy="12.4" rx="10" ry="3.6" fill="#6a2604" fill-opacity=".85"/>`;

const stem = () => `
    <path d="M73.6 12C72.4 4 74 -4 79 -9.6C82 -12.6 87 -12.8 89.6 -10C86.4 -8.6 83.4 -5.4 82.4 -.4C81.6 4.6 83 9.6 86.4 12.6Z" fill="url(#stem)" stroke="#2a1d0a" stroke-width=".9" stroke-linejoin="round"/>
    <path d="M76.6 9.6C75.8 3 77 -3 80.6 -7.4M79.6 10.6C79.2 4.6 80 -1 83 -5.6" fill="none" stroke="#b9c27a" stroke-opacity=".5" stroke-width=".8" stroke-linecap="round"/>
    <path class="vine" d="M84 -4.6C92 -9 100.6 -5 99 1.4C97.6 6.6 91 5.6 91.4 1.4C91.8 -1.6 95.4 -1.4 95.2 1" fill="none" stroke="#5f7a22" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M75 9.4C70 1 59.6 0 54.6 6.4C61 6 65.6 9.6 69.4 12.6Z" fill="url(#leaf)" stroke="#1f3a10" stroke-width=".8" stroke-linejoin="round"/>
    <path d="M73 9.6C67 5 61 4.4 56.6 6.2" fill="none" stroke="#a6d47e" stroke-opacity=".6" stroke-width=".7"/>`;

/** The carved face: a soft bloom of light round it, the cut walls (a dark band at the top of each hole, the pumpkin's thickness), the lit inside and the candle flame. */
const face = () => `
    <ellipse class="glow" cx="80" cy="66" rx="50" ry="32" fill="url(#spill)"/>
    <g class="glow" filter="url(#bloom)">${holes('fill="#ffb230"')}</g>
    ${holes('fill="#b84c08"')}
    <g clip-path="url(#carve)">
        <g transform="translate(0 2.6)">${holes('fill="url(#candle)"')}</g>
        <path class="flame" d="M80 79C83.2 82.6 83.6 86.2 80 89C76.4 86.2 76.8 82.6 80 79Z" fill="#fffef2"/>
    </g>
    ${holes('fill="none" stroke="#4a1a02" stroke-width="1" stroke-linejoin="round"')}`;

const head = (back = false) => `<g class="head">
    ${back ? mirror(stem()) : stem()}
    ${lobes()}
    ${back ? '<path d="M66 96C70 99.6 90 99.6 94 96" fill="none" stroke="#ffb230" stroke-opacity=".35" stroke-width="2" stroke-linecap="round" filter="url(#bloom)"/>' : face()}
</g>`;

// ---------- straw, scarf, vest, belt, cloak ----------
const STRAW = 'M64 95L59.6 104.6M68 96L65.4 106.6M72.6 97L71.6 107.6M77 98L76.6 108M83 98L84 108M87.4 97L89.4 107M92 96L96.4 105.4M96 94.6L101.6 102.6';
const straw = () => `<path d="${STRAW}" stroke="#e7c35a" stroke-width="1.3" stroke-linecap="round"/><path d="M66 96L63 105M75 97.6L74 107M85 97.6L86.8 107M94 95.6L98.6 104" stroke="#a9852b" stroke-width="1" stroke-linecap="round"/>`;

const scarfWrap = () => `<path d="M57 99C66 106.6 94 106.6 103 99L105.4 107.6C95 114.6 65 114.6 54.6 107.6Z" fill="url(#scarf)" stroke="#1f0819" stroke-width=".9" stroke-linejoin="round"/>
    <path d="M64 103.6L62.6 111.4M73 105.4L72.4 113.2M87 105.4L87.6 113.2M96 103.6L97.4 111.4" stroke="#3f6a34" stroke-width="3"/>
    <path d="M58 102C67 108.4 93 108.4 102 102" fill="none" stroke="#b0609a" stroke-opacity=".45" stroke-width=".9" stroke-linecap="round"/>`;
const scarfEnd = () => `<g class="scarf">
    <path d="M90 110C92 124 90 140 92 153L102.6 151C100.6 138 102.6 124 100.4 110Z" fill="url(#scarf)" stroke="#1f0819" stroke-width=".9" stroke-linejoin="round"/>
    <path d="M90.8 121.4L101.2 120.6M90.8 125L101 124.2M90.6 136.4L101.2 135.6M90.8 140L101.6 139.2" stroke="#3f6a34" stroke-width="2.2"/>
    <path d="M92.6 153.4L92.2 159M95 153L94.8 159.8M97.4 152.6L97.6 159.2M99.8 152.2L100.4 158.4M102 151.6L103 157.4" stroke="#6a2a58" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M92.4 112C93.6 126 92 140 93.6 151" fill="none" stroke="#b0609a" stroke-opacity=".4" stroke-width=".9" stroke-linecap="round"/>
</g>
<ellipse cx="95.4" cy="109.6" rx="5.4" ry="4.4" fill="url(#scarf)" stroke="#1f0819" stroke-width=".9"/>
<path d="M92.6 108C94 106.8 97 106.8 98.4 108.2" fill="none" stroke="#b0609a" stroke-opacity=".5" stroke-width=".8" stroke-linecap="round"/>`;

const vest = () => `<path d="M64 110H96L98 182H62Z" fill="url(#vest)"/>
    <path d="M80 112V176" stroke="#120a05" stroke-width="1.2"/>
    <path d="M81.4 113V175" stroke="#6a4a30" stroke-opacity=".5" stroke-width=".7" stroke-dasharray="2 2"/>
    ${[124, 138, 152, 166].map((y) => `<circle cx="75.6" cy="${y}" r="2.1" fill="#e9dcc0" stroke="#3a2a1a" stroke-width=".6"/><circle cx="75" cy="${y}" r=".45" fill="#3a2a1a"/><circle cx="76.2" cy="${y}" r=".45" fill="#3a2a1a"/>`).join('')}
    <path d="M83.4 140.6L91.6 139.4L92.4 148.8L84.2 149.8Z" fill="#5a3e26" stroke="#2a1a0d" stroke-width=".6"/>
    <path d="M84.6 141.6L86.4 143.4M86.4 141.6L84.6 143.4M89.6 141L91.4 142.8M91.4 141L89.6 142.8M85.2 146.4L87 148.2M87 146.4L85.2 148.2M90.2 146L92 147.8M92 146L90.2 147.8" stroke="#c9a873" stroke-width=".6"/>`;

const belt = () => `<path d="M62 174.6C70 172.6 90 172.6 98 174.6" fill="none" stroke="#7a5a2a" stroke-width="4.2" stroke-linecap="round"/>
    <path d="M62 174.6C70 172.6 90 172.6 98 174.6" fill="none" stroke="#c9a05a" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="1.6 1.4"/>
    <path d="M70.6 176.6C69.6 181 69.4 186 70.4 191.6M73.4 176.6C74.6 181 75.4 186.6 74.6 192" fill="none" stroke="#a9803e" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M69.6 191L68.6 194.6M70.6 191.4L70.8 195.4M74.2 191.6L73.6 195.6M75.2 191.4L76.2 195" stroke="#c9a05a" stroke-width=".8" stroke-linecap="round"/>
    <circle cx="72" cy="175.4" r="3" fill="#b08a4a" stroke="#5a3e18" stroke-width=".7"/>`;

const PANEL = `M80 104C70 104 52 104 42 110C33 116 29 140 27.6 170C27 186 26 198 25 206${rags(25, 206, 67.4, 207, 5, 9)}C64 186 63 150 66 120C67 112 72 106 80 104Z`;
const CLOAK_IN = `M80 104C64 104 46 106 40 112C32 120 27 160 25 206${rags(25, 206, 135, 206, 11, 8)}C133 160 128 120 120 112C114 106 96 104 80 104Z`;
const CLOAK_BACK = `M80 102C64 102 48 104 40 110C31 117 27 140 25.6 170C25 186 24 198 23 206${rags(23, 206, 137, 206, 12, 10)}C136 198 135 186 134.4 170C133 140 129 117 120 110C112 104 96 102 80 102Z`;

const panel = () => `<path d="${PANEL}" fill="url(#cloak)" stroke="#07050c" stroke-width="1" stroke-linejoin="round"/>
    <path d="M66 120C63 150 64 186 67.4 207L71 205C68 186 67.4 150 69.6 121Z" fill="url(#liningRed)"/>
    <path d="M48 128C44 150 40 176 38 203M56.4 132C54.6 160 54.4 182 55.4 207" fill="none" stroke="#07050c" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
    <path d="M40.6 120C36.4 140 34.4 166 33 196M51 124C49 150 48.6 176 49.4 200" fill="none" stroke="#7a6aa8" stroke-opacity=".3" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M38.4 166.6L47.6 165.4L48.6 174.4L39.4 175.6Z" fill="#3a2d4e" stroke="#120e1f" stroke-width=".6"/>
    <path d="M39.4 167.4L47 166.4L47.8 173.6L40.2 174.6Z" fill="none" stroke="#a89bc8" stroke-opacity=".7" stroke-width=".5" stroke-dasharray="1.2 1"/>
    <path d="M52 186L55.4 183.6L54.6 188.4L58 189.4L54.8 191.6L55.6 195L52.6 192.4L50.2 194.4L50.8 190.2Z" fill="#07050c"/>`;

const cloakBack = () => `<path d="${CLOAK_BACK}" fill="url(#cloak)" stroke="#07050c" stroke-width="1" stroke-linejoin="round"/>
    <path d="M44 124C40 150 37 178 35 204M58 132C56 160 55.6 184 56.4 208M102 132C104 160 104.4 184 103.6 208M116 124C120 150 123 178 125 204" fill="none" stroke="#07050c" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
    <path d="M37 122C33 146 31 172 30 198M128 130C130 154 131 178 131.4 200" fill="none" stroke="#7a6aa8" stroke-opacity=".3" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M80 144V210" stroke="#07050c" stroke-opacity=".6" stroke-width="1.2"/>
    <path d="M57.6 104C57 98 103 98 102.4 104C103.4 118 96 134 80 145C64 134 56.6 118 57.6 104Z" fill="url(#hood)" stroke="#07050c" stroke-width="1" stroke-linejoin="round"/>
    <path d="M60 104C64 100.6 96 100.6 100 104C98 110 90 114 80 115C70 114 62 110 60 104Z" fill="#0a0712"/>
    <path d="M58.4 106C58.6 120 66 132 80 143" fill="none" stroke="#9a8ad0" stroke-opacity=".55" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M101.6 106C101.4 120 94 132 80 143" fill="none" stroke="#07050c" stroke-opacity=".5" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M66 112C70 122 74 130 80 136" fill="none" stroke="#7a6aa8" stroke-opacity=".35" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M114.4 160.6L123.6 161.6L122.6 170.6L113.4 169.6Z" fill="#3a2d4e" stroke="#120e1f" stroke-width=".6"/>
    <path d="M115.2 161.6L122.6 162.4L121.8 169.6L114.4 168.8Z" fill="none" stroke="#a89bc8" stroke-opacity=".7" stroke-width=".5" stroke-dasharray="1.2 1"/>`;

// ---------- legs and boots (the left; the right is its mirror image) ----------
const leg = (side, back = false) => `<g class="leg${side}">
    <path d="M63 176H79L78.4 222L76 219.6L73.4 223.2L70.6 219.8L67.6 223.4L64.8 220L62.2 222.6Z" fill="url(#trousers)" stroke="#0b0d09" stroke-width=".8" stroke-linejoin="round"/>
    <path d="M65.6 190C65.4 200 66 210 67 218" fill="none" stroke="#56604c" stroke-opacity=".5" stroke-width="1" stroke-linecap="round"/>
    ${back ? '' : '<path d="M66.4 200.6L74.4 200L74.8 208.4L66.8 209Z" fill="#4a3a2a" stroke="#1a120a" stroke-width=".6"/><path d="M67.2 201.4L73.6 201L74 207.6L67.6 208" fill="none" stroke="#c9a873" stroke-opacity=".7" stroke-width=".5" stroke-dasharray="1.1 1"/>'}
    <path d="M62.6 219H77.6L78 231.6C78.2 236.4 76 239.4 71.6 239.6H58C51.6 239.6 47.4 237.4 45.6 233C44.4 230 45.4 227.2 47.6 226.8C49.4 226.4 50.4 228 49.8 229.6C51.8 232.2 56 232.6 62.4 231.8Z" fill="url(#boot)" stroke="#060402" stroke-width=".9" stroke-linejoin="round"/>
    <path d="M62.6 219H77.6L77.7 223.2H62.6Z" fill="#1a110a"/>
    <path d="M62.5 227.4H77.8" stroke="#3a2a1c" stroke-width="2.2"/>
    <rect x="${back ? 64.4 : 71.4}" y="225.8" width="4.2" height="3.4" rx=".6" fill="none" stroke="#c9a05a" stroke-width="1"/>
    <path d="M47 229.4C48.6 233.6 54 235.6 62 235" fill="none" stroke="#7a5a40" stroke-opacity=".6" stroke-width=".9" stroke-linecap="round"/>
    ${back ? '<path d="M62.6 236.4H77.4V239.6H62.6Z" fill="#0a0603"/>' : '<path d="M66 221C66.6 226 66.8 231 66.4 236" fill="none" stroke="#7a5a40" stroke-opacity=".5" stroke-width=".8" stroke-linecap="round"/>'}
</g>`;

// ---------- arms, gloves and the lantern (drawn for the left; the right is the mirror image) ----------
const glove = (grip = false) => `
    <path d="M-5 1.6C-5.6 5 -5.2 8.4 -4.2 10.4C-1.6 11.4 1.6 11.4 4.2 10.4C5.2 8.4 5.6 5 5 1.6Z" fill="url(#glove)" stroke="#050407" stroke-width=".8"/>
    <path d="${grip
        ? 'M-3.6 9.6C-5.4 11 -5.2 14.6 -2.6 15.4M-1.2 10.2C-2.8 12.2 -2.4 15.8 .2 16.2M1.2 10.2C0 12.2 .6 15.6 3 15.6M3.6 9.6C3 11.6 3.6 14.2 5.4 14M-4.8 3.6Q-7 8.6 -2.6 11.6'
        : 'M-3.6 9.6Q-4.6 14.6 -5.2 19.6M-1.2 10.2Q-1.8 16 -2 21.8M1.2 10.2Q1.6 16 1.8 21.4M3.6 9.6Q4.4 14 4.8 18.4M-4.8 3.6Q-8 6.6 -8.4 11.4'}" fill="none" stroke="#050407" stroke-width="3.2" stroke-linecap="round"/>
    <path d="${grip
        ? 'M-3.6 9.6C-5.4 11 -5.2 14.6 -2.6 15.4M-1.2 10.2C-2.8 12.2 -2.4 15.8 .2 16.2M1.2 10.2C0 12.2 .6 15.6 3 15.6M3.6 9.6C3 11.6 3.6 14.2 5.4 14M-4.8 3.6Q-7 8.6 -2.6 11.6'
        : 'M-3.6 9.6Q-4.6 14.6 -5.2 19.6M-1.2 10.2Q-1.8 16 -2 21.8M1.2 10.2Q1.6 16 1.8 21.4M3.6 9.6Q4.4 14 4.8 18.4M-4.8 3.6Q-8 6.6 -8.4 11.4'}" fill="none" stroke="#24202a" stroke-width="2.2" stroke-linecap="round"/>
    ${grip ? '' : '<path d="M-4.2 12.4L-4.8 16.4M-1.4 13L-1.8 18M1.4 13L1.7 17.8M3.9 12.2L4.4 15.6" stroke="#6a6276" stroke-opacity=".7" stroke-width=".6" stroke-linecap="round"/>'}
    <rect x="-5.8" y="-1.8" width="11.6" height="3.6" rx="1.2" fill="#2e2834" stroke="#050407" stroke-width=".7"/>
    <path d="M-4.4 -.6H4.4" stroke="#6a6276" stroke-opacity=".6" stroke-width=".6"/>`;

/** The lantern, hanging from the hand's grip at (0, 13): an iron cap and frame, green glass and a ghost flame. */
const lantern = () => `<g class="lantern">
    <circle class="halo" cy="38" r="19" fill="url(#lanternHalo)"/>
    <path d="M-5.4 21C-5.4 13.8 5.4 13.8 5.4 21" fill="none" stroke="#26262c" stroke-width="1.5"/>
    <path d="M-8.2 25.6L0 18.6L8.2 25.6Z" fill="url(#iron)" stroke="#0a0a0d" stroke-width=".7" stroke-linejoin="round"/>
    <circle cy="18.6" r="1.6" fill="url(#iron)" stroke="#0a0a0d" stroke-width=".5"/>
    <rect x="-9" y="25.4" width="18" height="2.6" rx=".8" fill="url(#iron)" stroke="#0a0a0d" stroke-width=".6"/>
    <rect x="-7.4" y="28" width="14.8" height="18" fill="url(#lanternGlow)"/>
    <path class="lflame" d="M0 31.6C3.4 35.4 4 39.4 0 43C-4 39.4 -3.4 35.4 0 31.6Z" fill="url(#ghostFlame)" filter="url(#glow)"/>
    <path d="M-7.4 28V46M-3.6 28V46M3.6 28V46M7.4 28V46" stroke="#17171c" stroke-width="1.3"/>
    <path d="M-5.6 30V44" stroke="#fff" stroke-opacity=".25" stroke-width=".9"/>
    <rect x="-9" y="46" width="18" height="2.6" rx=".8" fill="url(#iron)" stroke="#0a0a0d" stroke-width=".6"/>
    <path d="M-6.6 48.6H6.6L5.2 51.4H-5.2Z" fill="url(#iron)" stroke="#0a0a0d" stroke-width=".6" stroke-linejoin="round"/>
</g>`;

const arm = (side, withLantern = false) => `<g class="arm${side}">
    <path d="M50.6 112C48 107 40 106.4 35.6 110C32.4 113 31.6 122 30.8 134C30.4 140 30.2 144 30.4 147L44.8 147.6C45.4 140 46.4 130 48 122C49 117 50.6 114.4 50.6 112Z" fill="url(#sleeve)" stroke="#07050c" stroke-width=".9" stroke-linejoin="round"/>
    <path d="M37.6 112C35.4 122 34.2 134 33.8 145" fill="none" stroke="#7a6aa8" stroke-opacity=".4" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M44.6 118C42.8 128 41.8 138 41.8 146M39.6 132C41 134.6 42.6 135.6 44.6 135.4" fill="none" stroke="#07050c" stroke-opacity=".55" stroke-width="1.2" stroke-linecap="round"/>
    <g class="fore${side}">
        <path d="M30.6 144C30 152 28.4 162 25.6 171L28.6 169L30.4 173.4L33.2 170L35.6 174L38.4 170.2L41 173.6L43.4 169.6L46.4 171.6C44.8 162 44.4 152 44.8 145Z" fill="url(#sleeve)" stroke="#07050c" stroke-width=".9" stroke-linejoin="round"/>
        <path d="M32.8 150C31.8 158 30.6 164 29.4 169" fill="none" stroke="#7a6aa8" stroke-opacity=".4" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M41.4 150C41 158 41.6 164 42.6 169M36.6 156C36.4 162 36.6 166 37.4 170" fill="none" stroke="#07050c" stroke-opacity=".5" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M32.6 170.4L30.4 177.6M36 171.4L35.4 178.6M39.8 170.8L41 177.4M34.4 171L32.8 176.4M38.2 171L38.8 176.6" stroke="#e7c35a" stroke-width="1.1" stroke-linecap="round"/>
        <g class="hand${side}"><g transform="translate(36.4 171)">${glove(withLantern)}${withLantern ? lantern() : ''}</g></g>
    </g>
</g>`;

// ---------- bats and will-o'-wisps round him ----------
const WING = 'M-2.4 -1C-6 -6.4 -12.4 -6.6 -16.6 -3.4C-14.6 -1.6 -13.8 .8 -14 3C-11.6 1.4 -9.6 1.6 -8.6 3.6C-7 1.8 -4.8 1.6 -2.8 2.8Z';
const bat = (x, y, s, delay) => `<g class="bat" style="animation-delay:${delay}s"><g transform="translate(${x} ${y}) scale(${s})">
    <path class="wing" style="animation-delay:${delay}s" d="${WING}" fill="#160d1f" stroke="#4a3866" stroke-width=".6" stroke-linejoin="round"/>
    <g transform="scale(-1 1)"><path class="wing" style="animation-delay:${delay}s" d="${WING}" fill="#160d1f" stroke="#4a3866" stroke-width=".6" stroke-linejoin="round"/></g>
    <ellipse rx="2.8" ry="3.8" fill="#160d1f" stroke="#4a3866" stroke-width=".5"/>
    <path d="M-2.2 -2.8L-2.6 -6.2L-.8 -3.6ZM2.2 -2.8L2.6 -6.2L.8 -3.6Z" fill="#160d1f"/>
    <circle cx="-1" cy="-1.4" r=".6" fill="#ff6a3a"/><circle cx="1" cy="-1.4" r=".6" fill="#ff6a3a"/>
</g></g>`;
const wisp = (x, y, s, delay) => `<g class="wisp" style="animation-delay:${delay}s"><path transform="translate(${x} ${y}) scale(${s})" d="M0 -9C3.6 -4.6 4.6 -.6 3.4 2.6C2.4 5.4 -2.4 5.4 -3.4 2.6C-4.6 -.6 -2 -3 -1 -6C.2 -4.4 .4 -3 0 -9Z" fill="url(#wisp)"/></g>`;
const extras = () => `${bat(2, 26, 1, 0)}${bat(158, 70, 0.8, -1.3)}${wisp(-8, 214, 1, 0)}${wisp(168, 204, 0.8, -1.2)}${wisp(150, 168, 0.65, -2.4)}${wisp(6, 160, 0.6, -1.8)}`;

const defs = () => [
    lin('lobe', [0, 0, 1, 0], [[0, '#8f3505'], [0.28, '#d9661a'], [0.55, '#ff9b33'], [0.8, '#e5711a'], [1, '#9a3a06']]),
    rad('pumpkinShade', [0.46, 0.36, 0.64], [[0.55, '#2a0c00', 0], [1, '#2a0c00', 0.62]]),
    rad('shine', [0.5, 0.5, 0.5], [[0, '#fff3d6', 0.55], [1, '#fff3d6', 0]]),
    rad('candle', [80, 70, 44], [[0, '#fffbe0'], [0.3, '#ffe27a'], [0.62, '#ffae2b'], [1, '#f2650c']], true),
    rad('spill', [0.5, 0.5, 0.5], [[0, '#ffcf6b', 0.38], [1, '#ffcf6b', 0]]),
    lin('stem', [0, 0, 1, 0], [[0, '#7d8a3a'], [0.45, '#55561f'], [1, '#2b2610']]),
    lin('leaf', [0, 0, 1, 1], [[0, '#6fa63a'], [1, '#2c5216']]),
    lin('cloak', [0.2, 0, 0.8, 1], [[0, '#3a3156'], [0.45, '#231c38'], [1, '#120e1f']]),
    lin('hood', [0, 0, 0, 1], [[0, '#4d4280'], [0.6, '#2e2650'], [1, '#1d1730']]),
    lin('lining', [0, 0, 0, 1], [[0, '#1a1226'], [1, '#0a0712']]),
    lin('liningRed', [0, 0, 1, 0], [[0, '#8a1c40'], [1, '#3d0a1c']]),
    lin('vest', [0, 0, 1, 1], [[0, '#4a3220'], [0.6, '#2e1d12'], [1, '#1a0f08']]),
    lin('trousers', [0, 0, 1, 0], [[0, '#3a4234'], [0.5, '#262c22'], [1, '#151912']]),
    lin('boot', [0, 0, 0, 1], [[0, '#4a3322'], [0.5, '#24170e'], [1, '#120b06']]),
    lin('sleeve', [0, 0, 1, 0], [[0, '#3a3156'], [0.55, '#241d3a'], [1, '#120e1f']]),
    lin('glove', [0, 0, 1, 1], [[0, '#4a4252'], [0.5, '#24202a'], [1, '#0c0a10']]),
    lin('scarf', [0, 0, 1, 1], [[0, '#7a3066'], [1, '#3a1232']]),
    lin('iron', [0, 0, 1, 0], [[0, '#6a6a76'], [0.5, '#2c2c34'], [1, '#121216']]),
    rad('lanternGlow', [0.5, 0.55, 0.6], [[0, '#eaffd0'], [0.35, '#9dff6a'], [0.75, '#2fbf5a'], [1, '#0d4a26']]),
    rad('lanternHalo', [0.5, 0.5, 0.5], [[0, '#7dff8a', 0.45], [0.5, '#3be06a', 0.15], [1, '#3be06a', 0]]),
    lin('ghostFlame', [0, 0, 0, 1], [[0, '#f4ffe8'], [0.5, '#b8ff8a'], [1, '#3fd66a']]),
    rad('wisp', [0.5, 0.6, 0.6], [[0, '#f0ffe8', 0.95], [0.5, '#8dff9a', 0.45], [1, '#8dff9a', 0]]),
    `<filter id="bloom" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="2.8"/></filter>`,
    `<filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
    `<clipPath id="carve">${holes('')}</clipPath>`,
].join('');

const motion = (state) => {
    const joints = { arm: '42px 114px', fore: '37.6px 146px', hand: '36.4px 171px', leg: '70px 178px' };
    const base = origins({
        all: '80px 238px', head: '80px 100px', cape: '80px 106px', scarf: '95px 110px', lantern: '0px 13px',
        ...Object.fromEntries(Object.entries(joints).flatMap(([part, o]) => [[`${part}L`, o], [`${part}R`, o]])),
    }, ['shadow', 'flame', 'lflame', 'halo', 'bat', 'wisp']) + '.wing{transform-box:fill-box;transform-origin:100% 40%}';
    const always = `
        ${kf('flicker', { 0: 'opacity:1', 8: 'opacity:.74', 12: 'opacity:1', 37: 'opacity:.88', 40: 'opacity:1', 63: 'opacity:.68', 66: 'opacity:.95', 88: 'opacity:.84', 100: 'opacity:1' })}
        ${kf('flick', { 0: 'transform:scale(1,1)', 30: 'transform:scale(.88,1.14)', 60: 'transform:scale(1.06,.9)', 100: 'transform:scale(1,1)' })}
        ${kf('halo', { 0: 'opacity:.7;transform:scale(.92)', 50: 'opacity:1;transform:scale(1.08)', 100: 'opacity:.7;transform:scale(.92)' })}
        ${kf('flap', { 0: 'transform:rotate(-30deg) scaleY(.85)', 50: 'transform:rotate(16deg)', 100: 'transform:rotate(-30deg) scaleY(.85)' })}
        ${kf('flit', { 0: 'transform:translate(0,0) rotate(-5deg)', 50: 'transform:translate(3px,-7px) rotate(5deg)', 100: 'transform:translate(0,0) rotate(-5deg)' })}
        ${kf('rise', { 0: 'transform:translateY(10px) scale(.6);opacity:0', 30: 'opacity:.9', 100: 'transform:translateY(-28px) scale(1.1);opacity:0' })}
        ${play('.glow', 'flicker', 2.3)}${play('.flame', 'flick', 0.9)}${play('.lflame', 'flick', 0.7)}${play('.halo', 'halo', 1.4)}
        ${play('.wing', 'flap', 0.34)}${play('.bat', 'flit', 2.8)}${play('.wisp', 'rise', 3.6)}`;
    const rules = {
        Standing: `
            ${kf('breathe', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-1.4px)', 100: 'transform:translateY(0)' })}
            ${kf('tilt', { 0: 'transform:rotate(-3deg)', 40: 'transform:rotate(-3deg)', 48: 'transform:rotate(6deg)', 78: 'transform:rotate(6deg)', 88: 'transform:rotate(-3deg)', 100: 'transform:rotate(-3deg)' })}
            ${kf('drape', { 0: 'transform:skewX(-1.6deg)', 50: 'transform:skewX(1.6deg)', 100: 'transform:skewX(-1.6deg)' })}
            ${kf('hang', { 0: 'transform:rotate(-2.5deg)', 50: 'transform:rotate(2.5deg)', 100: 'transform:rotate(-2.5deg)' })}
            ${kf('creep', { 0: 'transform:rotate(-7deg)', 50: 'transform:rotate(7deg)', 100: 'transform:rotate(-7deg)' })}
            ${kf('carry', { 0: 'transform:rotate(1.4deg)', 50: 'transform:rotate(-1.4deg)', 100: 'transform:rotate(1.4deg)' })}
            ${kf('pendulum', { 0: 'transform:rotate(-10deg)', 50: 'transform:rotate(10deg)', 100: 'transform:rotate(-10deg)' })}
            ${kf('flutter', { 0: 'transform:rotate(-3deg)', 50: 'transform:rotate(4deg)', 100: 'transform:rotate(-3deg)' })}
            ${play('.all', 'breathe', 3.4)}${play('.head', 'tilt', 5.6)}${play('.cape', 'drape', 3.8)}${play('.scarf', 'flutter', 3.2, '-2.8s')}
            ${play('.armL', 'hang', 3.8)}${play('.foreL', 'hang', 3.8, '-3.4s')}${play('.handL', 'creep', 2.2)}
            ${play('.armR', 'carry', 2.6)}${play('.lantern', 'pendulum', 2.6)}
            ${pose('.head', 'rotate(-3deg)')}`,
        Dancing: `
            ${kf('hop', { 0: 'transform:translateY(0) scale(1.03,.97)', 45: 'transform:translateY(-9px) scale(.98,1.03)', 100: 'transform:translateY(0) scale(1.03,.97)' })}
            ${kf('bob', { 0: 'transform:rotate(-7deg)', 25: 'transform:rotate(0) translateY(2.6px)', 50: 'transform:rotate(7deg)', 75: 'transform:rotate(0) translateY(2.6px)', 100: 'transform:rotate(-7deg)' })}
            ${kf('swirl', { 0: 'transform:skewX(5deg)', 50: 'transform:skewX(-5deg)', 100: 'transform:skewX(5deg)' })}
            ${kf('wave', { 0: 'transform:rotate(112deg)', 50: 'transform:rotate(132deg)', 100: 'transform:rotate(112deg)' })}
            ${kf('waveFore', { 0: 'transform:rotate(30deg)', 50: 'transform:rotate(54deg)', 100: 'transform:rotate(30deg)' })}
            ${kf('waveHand', { 0: 'transform:rotate(-18deg)', 50: 'transform:rotate(22deg)', 100: 'transform:rotate(-18deg)' })}
            ${kf('swingOut', { 0: 'transform:rotate(14deg)', 50: 'transform:rotate(38deg)', 100: 'transform:rotate(14deg)' })}
            ${kf('swingLantern', { 0: 'transform:rotate(-2deg)', 50: 'transform:rotate(-52deg)', 100: 'transform:rotate(-2deg)' })}
            ${kf('step', { 0: 'transform:translateY(0) rotate(0)', 50: 'transform:translateY(-7px) rotate(-4deg)', 100: 'transform:translateY(0) rotate(0)' })}
            ${kf('flap', { 0: 'transform:rotate(-12deg)', 50: 'transform:rotate(12deg)', 100: 'transform:rotate(-12deg)' })}
            ${kf('shadowHop', { 0: 'transform:scale(1.04)', 45: 'transform:scale(.84)', 100: 'transform:scale(1.04)' })}
            ${play('.all', 'hop', 0.6)}${play('.head', 'bob', 1.2, '-1.08s')}${play('.cape', 'swirl', 1.2, '-1.04s')}${play('.scarf', 'flap', 0.6, '-.48s')}${play('.glow', 'flicker', 1.2)}
            ${play('.armL', 'wave', 1.2)}${play('.foreL', 'waveFore', 1.2, '-1.1s')}${play('.handL', 'waveHand', 1.2, '-1.02s')}
            ${play('.armR', 'swingOut', 1.2)}${play('.lantern', 'swingLantern', 1.2, '-.98s')}
            ${play('.legL', 'step', 0.6)}${play('.legR', 'step', 0.6, '-.3s')}${play('.shadow', 'shadowHop', 0.6)}
            ${pose('.armL', 'rotate(128deg)')}${pose('.foreL', 'rotate(42deg)')}${pose('.handL', 'rotate(6deg)')}
            ${pose('.armR', 'rotate(30deg)')}${pose('.lantern', 'rotate(-32deg)')}
            ${pose('.head', 'rotate(-6deg)')}${pose('.cape', 'skewX(3deg)')}${pose('.legL', 'translateY(-6px) rotate(-3deg)')}`,
        DJing: `
            ${kf('jump', { 0: 'transform:translateY(0) scale(1.03,.96)', 40: 'transform:translateY(-10px) scale(.98,1.03)', 80: 'transform:translateY(0) scale(1.03,.96)', 100: 'transform:translateY(0) scale(1.03,.96)' })}
            ${kf('nod', { 0: 'transform:rotate(-5deg)', 40: 'transform:rotate(5deg) translateY(2.6px)', 100: 'transform:rotate(-5deg)' })}
            ${kf('swirl', { 0: 'transform:skewX(3deg)', 50: 'transform:skewX(-3deg)', 100: 'transform:skewX(3deg)' })}
            ${kf('raise', { 0: 'transform:rotate(142deg)', 40: 'transform:rotate(162deg)', 100: 'transform:rotate(142deg)' })}
            ${kf('swingHigh', { 0: 'transform:rotate(-146deg)', 40: 'transform:rotate(-196deg)', 100: 'transform:rotate(-146deg)' })}
            ${kf('scratch', { 0: 'transform:rotate(14deg)', 50: 'transform:rotate(30deg)', 100: 'transform:rotate(14deg)' })}
            ${kf('kick', { 0: 'transform:translateY(0)', 40: 'transform:translateY(-7px)', 80: 'transform:translateY(0)', 100: 'transform:translateY(0)' })}
            ${kf('shadowJump', { 0: 'transform:scale(1.05)', 40: 'transform:scale(.74)', 80: 'transform:scale(1.05)', 100: 'transform:scale(1.05)' })}
            ${play('.all', 'jump', 0.6)}${play('.head', 'nod', 0.6, '-.54s')}${play('.cape', 'swirl', 1.2, '-1.1s')}
            ${play('.armL', 'raise', 0.6)}${play('.lantern', 'swingHigh', 0.6, '-.48s')}${play('.foreR', 'scratch', 0.3)}
            ${play('.legL', 'kick', 0.6)}${play('.legR', 'kick', 0.6, '-.3s')}${play('.shadow', 'shadowJump', 0.6)}
            ${pose('.armL', 'rotate(152deg)')}${pose('.foreL', 'rotate(16deg)')}${pose('.lantern', 'rotate(-168deg)')}
            ${pose('.armR', 'rotate(14deg)')}${pose('.foreR', 'rotate(22deg)')}${pose('.head', 'rotate(-4deg)')}${pose('.legR', 'translateY(-6px)')}`,
    };

    return base + always + rules[state];
};

export function spooky(state) {
    const back = state === 'DJing';
    const body = back
        ? `${leg('L', true)}${mirror(leg('R', true))}
            <g class="cape">${cloakBack()}</g>
            ${mirror(arm('R'))}
            ${straw()}${scarfWrap()}
            ${head(true)}
            ${arm('L', true)}`
        : `<path d="${CLOAK_IN}" fill="url(#lining)"/>
            ${leg('L')}${mirror(leg('R'))}
            ${vest()}${belt()}
            <g class="cape">${both(panel())}</g>
            ${straw()}${scarfWrap()}${scarfEnd()}
            ${head()}
            ${arm('L')}${mirror(arm('R', true))}`;

    return picture({
        label: 'Spooky',
        state,
        defs: defs(),
        body: `${shadow()}<g class="all">${body}</g>${extras()}`,
        css: motion(state),
    });
}
