// Zoo S02: a fox mascot, upright, with a big head, amber eyes, cream cheeks, dark paws and a fluffy tail with a white tip. For the Owner only.
import { kf, lin, mirror, origins, picture, play, pose, rad, shadow } from './kit.mjs';

const defs = () => [
    rad('fur', [0.42, 0.3, 0.85], [[0, '#ffb35c'], [0.45, '#f2761a'], [1, '#b24706']]),
    lin('furBody', [0.1, 0, 0.9, 1], [[0, '#ff9a3d'], [0.5, '#e8650d'], [1, '#a93f05']]),
    lin('furLimb', [0, 0, 1, 0], [[0, '#ff9a3d'], [0.55, '#e8650d'], [1, '#b24706']]),
    lin('cream', [0, 0, 0, 1], [[0, '#fffaf0'], [0.6, '#fdebc8'], [1, '#f1cf9d']]),
    lin('dark', [0, 0, 1, 1], [[0, '#5a3217'], [0.5, '#2d170a'], [1, '#150a04']]),
    lin('earIn', [0, 0, 0, 1], [[0, '#fff4e2'], [1, '#f6c9a0']]),
    rad('iris', [0.4, 0.3, 0.8], [[0, '#ffe28a'], [0.45, '#f5a31c'], [1, '#8a4a05']]),
    lin('tailTip', [0, 0, 0, 1], [[0, '#fffaf0', 0], [0.35, '#fffaf0'], [1, '#fdebc8']]),
    lin('gloss', [0, 0, 0.7, 1], [[0, '#fff', 0.55], [1, '#fff', 0]]),
    `<clipPath id="tailClip"><path d="M100 206 C136 222 176 196 172 150 C170 126 158 106 148 90 C148 120 138 146 122 160 C112 170 106 186 100 206 Z"/></clipPath>`,
].join('');

const ear = (cls, back = false) => `<g class="${cls}">
    <path d="M41 60 L26 -2 L78 38 Z" fill="url(#fur)" stroke="#8a3a07" stroke-opacity=".6" stroke-width="1.2" stroke-linejoin="round"/>
    ${back ? '' : '<path d="M45 50 L37 14 L67 38 Z" fill="url(#earIn)"/>'}
    <path d="M26 -2 L33 22 L48 12 Z" fill="url(#dark)"/>
    <path d="M44 46 L40 24" stroke="#f0b98a" stroke-width="2" stroke-linecap="round" stroke-opacity=".8"/>
</g>`;

const arm = (cls) => `<g class="${cls}">
    <path d="M45 134 Q45 126 54 126 Q63 126 63 134 L61 172 Q54 178 47 172 Z" fill="url(#furLimb)"/>
    <ellipse cx="54" cy="181" rx="9.6" ry="9" fill="url(#dark)"/>
    <path d="M48.6 184 V188 M54 185 V190 M59.4 184 V188" stroke="#000" stroke-opacity=".5" stroke-width="1.2" stroke-linecap="round"/>
    <ellipse cx="50.6" cy="176.5" rx="3.6" ry="2" fill="#fff" fill-opacity=".25"/>
</g>`;

const leg = (cls) => `<g class="${cls}">
    <path d="M55 188 H79 L78 222 H56 Z" fill="url(#furLimb)"/>
    <path d="M55.6 214 H78.4 L78 224 Q67 228 56 224 Z" fill="url(#dark)"/>
    <path d="M49 230 Q49 221 60 221 H76 Q86 221 86 230 Q86 238 76 238 H59 Q49 238 49 230 Z" fill="url(#dark)"/>
    <path d="M60 223 Q68 220.4 76 223" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M62 231 V236 M68 231 V236 M74 231 V236" stroke="#000" stroke-opacity=".45" stroke-width="1.2" stroke-linecap="round"/>
</g>`;

const body = (back = false) => `
    <path d="M52 132 C52 122 66 117 80 117 C94 117 108 122 108 132 L114 190 C100 201 60 201 46 190 Z" fill="url(#furBody)"/>
    ${back
        ? '<path d="M80 122 C76 150 84 170 80 196" fill="none" stroke="#a93f05" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/><path d="M62 140 C70 150 90 150 98 140" fill="none" stroke="#ffb35c" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/>'
        : `<path d="M63 128 C68 121 92 121 97 128 L101 186 C90 195 70 195 59 186 Z" fill="url(#cream)"/>
    <path d="M66 123 L70 134 L74 124 L80 137 L86 124 L90 134 L94 123" fill="none" stroke="#e8650d" stroke-opacity=".45" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M70 150 q4 3 8 0 M82 160 q4 3 8 0 M68 170 q4 3 8 0" fill="none" stroke="#e1b98a" stroke-opacity=".7" stroke-width="1.4" stroke-linecap="round"/>`}
    <path d="M56 134 C66 127 94 127 104 134" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2.6" stroke-linecap="round"/>`;

const tail = () => `<g class="tail">
    <path d="M100 206 C136 222 176 196 172 150 C170 126 158 106 148 90 C148 120 138 146 122 160 C112 170 106 186 100 206 Z" fill="url(#furBody)" stroke="#8a3a07" stroke-opacity=".55" stroke-width="1.2"/>
    <g clip-path="url(#tailClip)"><path d="M140 70 L190 70 L190 126 C168 120 150 116 140 124 Z" fill="url(#tailTip)"/><path d="M146 128 C158 120 170 124 176 134" fill="none" stroke="#f1cf9d" stroke-width="2" stroke-linecap="round" stroke-opacity=".7"/></g>
    <path d="M132 188 C150 188 164 176 166 156" fill="none" stroke="#ffb35c" stroke-opacity=".5" stroke-width="2.4" stroke-linecap="round"/>
</g>`;

const eye = (state, cx) => {
    if (state === 'DJing') return `<path d="M${cx - 10} 76 Q${cx} 62 ${cx + 10} 76" fill="none" stroke="#2d170a" stroke-width="4" stroke-linecap="round"/>`;

    return `<g class="blink">
        <ellipse cx="${cx}" cy="72" rx="10.4" ry="12.2" fill="#2d170a"/>
        <ellipse cx="${cx}" cy="72.4" rx="8.6" ry="10.4" fill="url(#iris)"/>
        <ellipse cx="${cx}" cy="73" rx="4.2" ry="7.2" fill="#0d0603"/>
        <circle cx="${cx - 3.6}" cy="67" r="3.2" fill="#fff"/><circle cx="${cx + 3.2}" cy="78" r="1.5" fill="#fff" fill-opacity=".9"/>
    </g>`;
};

const head = (state, back = false) => {
    const mouth = state === 'Standing'
        ? `<path d="M80 104 V108.4 M80 108.4 Q74.4 114 68.4 109.6 M80 108.4 Q85.6 114 91.6 109.6" fill="none" stroke="#2d170a" stroke-width="2.2" stroke-linecap="round"/>`
        : `<path d="M80 104 V107 M67.4 108.6 Q80 128 92.6 108.6 Q80 113 67.4 108.6 Z" fill="#6b1d12" stroke="#2d170a" stroke-width="1.8" stroke-linejoin="round"/><path d="M73.6 117 Q80 123.4 86.4 117 Q80 114.6 73.6 117 Z" fill="#fb7185"/>`;

    return `
    ${ear('earL', back)}${mirror(ear('earR', back))}
    <path d="M24 84 C26 52 50 33 80 33 C110 33 134 52 136 84 L126 80 L130 95 L117 92 C111 109 96 119 80 119 C64 119 49 109 43 92 L30 95 L34 80 Z" fill="url(#fur)" stroke="#8a3a07" stroke-opacity=".55" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M80 36 C70 42 66 52 68 62 C74 56 78 50 80 40 C82 50 86 56 92 62 C94 52 90 42 80 36 Z" fill="#ffc07a" fill-opacity=".6"/>
    <path d="M80 74 C70 79 56 86 43 88 C50 108 64 122 80 124 C96 122 110 108 117 88 C104 86 90 79 80 74 Z" fill="url(#cream)"/>
    <path d="M43 88 C50 92 56 92 62 88 M117 88 C110 92 104 92 98 88" fill="none" stroke="#f0c08a" stroke-width="1.6" stroke-linecap="round" stroke-opacity=".8"/>
    ${eye(state, 62)}${eye(state, 98)}
    <path d="M50 58 Q58 53 68 56 M110 58 Q102 53 92 56" fill="none" stroke="#fff3d9" stroke-width="2.8" stroke-linecap="round" stroke-opacity=".9"/>
    <path d="M54 62 L47 58 M106 62 L113 58" stroke="#2d170a" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M72.6 94 Q80 89.4 87.4 94 Q86.4 102 80 105 Q73.6 102 72.6 94 Z" fill="url(#dark)" stroke="#000" stroke-opacity=".5" stroke-width=".8"/>
    <ellipse cx="77" cy="94" rx="3" ry="1.5" fill="#fff" fill-opacity=".6"/>
    ${mouth}
    <path d="M60 100 L44 97 M60 104 L45 106 M100 100 L116 97 M100 104 L115 106" stroke="#fff" stroke-opacity=".85" stroke-width="1" stroke-linecap="round"/>
    <circle cx="58" cy="98" r=".9" fill="#c98a54"/><circle cx="62" cy="101" r=".9" fill="#c98a54"/><circle cx="102" cy="98" r=".9" fill="#c98a54"/><circle cx="98" cy="101" r=".9" fill="#c98a54"/>
    ${back
        ? `<path d="M24 84 C26 52 50 33 80 33 C110 33 134 52 136 84 L126 80 L130 95 L117 92 C111 109 96 119 80 119 C64 119 49 109 43 92 L30 95 L34 80 Z" fill="url(#fur)" stroke="#8a3a07" stroke-opacity=".55" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M80 36 C70 42 66 52 68 62 C74 56 78 50 80 40 C82 50 86 56 92 62 C94 52 90 42 80 36 Z" fill="#ffc07a" fill-opacity=".6"/>
    <path d="M80 60 C78 80 82 100 80 118" fill="none" stroke="#a93f05" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>
    <path d="M50 104 C60 126 100 126 110 104 L108 124 C96 134 64 134 52 124 Z" fill="url(#fur)"/>`
        : ''}
    <path d="M44 60 C52 44 66 38 80 38" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="3.2" stroke-linecap="round"/>`;
};

const motion = (state) => {
    const base = origins({ all: '80px 238px', head: '80px 118px', armL: '54px 132px', armR: '54px 132px', legL: '67px 190px', legR: '67px 190px', tail: '102px 200px', earL: '56px 40px', earR: '56px 40px' }, ['shadow', 'blink']);
    const rules = {
        Standing: `
            ${kf('breathe', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-1.6px)', 100: 'transform:translateY(0)' })}
            ${kf('sway', { 0: 'transform:rotate(-1.4deg)', 50: 'transform:rotate(1.4deg)', 100: 'transform:rotate(-1.4deg)' })}
            ${kf('arms', { 0: 'transform:rotate(1.5deg)', 50: 'transform:rotate(-2.5deg)', 100: 'transform:rotate(1.5deg)' })}
            ${kf('blink', { 0: 'transform:scaleY(1)', 90: 'transform:scaleY(1)', 94: 'transform:scaleY(.08)', 98: 'transform:scaleY(1)', 100: 'transform:scaleY(1)' })}
            ${kf('wag', { 0: 'transform:rotate(-3deg)', 50: 'transform:rotate(4deg)', 100: 'transform:rotate(-3deg)' })}
            ${kf('twitch', { 0: 'transform:rotate(0)', 86: 'transform:rotate(0)', 90: 'transform:rotate(-9deg)', 95: 'transform:rotate(3deg)', 100: 'transform:rotate(0)' })}
            ${play('.all', 'breathe', 3.2)}${play('.head', 'sway', 4.6)}${play('.armL', 'arms', 3.2)}${play('.armR', 'arms', 3.2, 'reverse')}${play('.blink', 'blink', 4.4)}${play('.tail', 'wag', 3.6)}${play('.earL', 'twitch', 6)}${play('.earR', 'twitch', 6, '2.2s')}`,
        Dancing: `
            ${kf('hop', { 0: 'transform:translateY(0) scale(1.03,.96)', 45: 'transform:translateY(-11px) scale(.98,1.03)', 100: 'transform:translateY(0) scale(1.03,.96)' })}
            ${kf('nod', { 0: 'transform:rotate(-6deg) translateY(0)', 50: 'transform:rotate(6deg) translateY(3px)', 100: 'transform:rotate(-6deg) translateY(0)' })}
            ${kf('armUp', { 0: 'transform:rotate(140deg)', 25: 'transform:rotate(104deg)', 50: 'transform:rotate(152deg)', 75: 'transform:rotate(112deg)', 100: 'transform:rotate(140deg)' })}
            ${kf('armOut', { 0: 'transform:rotate(60deg)', 25: 'transform:rotate(130deg)', 50: 'transform:rotate(72deg)', 75: 'transform:rotate(124deg)', 100: 'transform:rotate(60deg)' })}
            ${kf('knee', { 0: 'transform:translateY(0)', 50: 'transform:translateY(-9px)', 100: 'transform:translateY(0)' })}
            ${kf('wag', { 0: 'transform:rotate(-12deg)', 50: 'transform:rotate(14deg)', 100: 'transform:rotate(-12deg)' })}
            ${kf('flap', { 0: 'transform:rotate(0)', 50: 'transform:rotate(-8deg)', 100: 'transform:rotate(0)' })}
            ${kf('blink', { 0: 'transform:scaleY(1)', 90: 'transform:scaleY(1)', 94: 'transform:scaleY(.08)', 98: 'transform:scaleY(1)', 100: 'transform:scaleY(1)' })}
            ${kf('shadowHop', { 0: 'transform:scale(1.04)', 45: 'transform:scale(.8)', 100: 'transform:scale(1.04)' })}
            ${play('.all', 'hop', 0.6)}${play('.head', 'nod', 1.2)}${play('.armL', 'armUp', 1.2)}${play('.armR', 'armOut', 1.2)}${play('.legL', 'knee', 0.6)}${play('.legR', 'knee', 0.6, '.3s')}${play('.tail', 'wag', 0.4)}${play('.earL', 'flap', 0.6)}${play('.earR', 'flap', 0.6, '.3s')}${play('.blink', 'blink', 3.4)}${play('.shadow', 'shadowHop', 0.6)}
            ${pose('.armL', 'rotate(140deg)')}${pose('.armR', 'rotate(62deg)')}${pose('.legL', 'translateY(-8px)')}${pose('.head', 'rotate(-5deg)')}${pose('.tail', 'rotate(10deg)')}`,
        DJing: `
            ${kf('jump', { 0: 'transform:translateY(0) scale(1.05,.94)', 38: 'transform:translateY(-17px) scale(.97,1.04)', 76: 'transform:translateY(0) scale(1.05,.94)', 100: 'transform:translateY(0) scale(1.05,.94)' })}
            ${kf('bob', { 0: 'transform:rotate(-7deg) translateY(0)', 50: 'transform:rotate(7deg) translateY(3px)', 100: 'transform:rotate(-7deg) translateY(0)' })}
            ${kf('pump', { 0: 'transform:rotate(128deg)', 38: 'transform:rotate(166deg)', 76: 'transform:rotate(128deg)', 100: 'transform:rotate(128deg)' })}
            ${kf('kick', { 0: 'transform:translateY(0)', 38: 'transform:translateY(-9px) rotate(5deg)', 76: 'transform:translateY(0)', 100: 'transform:translateY(0)' })}
            ${kf('wag', { 0: 'transform:rotate(-14deg)', 50: 'transform:rotate(16deg)', 100: 'transform:rotate(-14deg)' })}
            ${kf('flap', { 0: 'transform:rotate(0)', 50: 'transform:rotate(-10deg)', 100: 'transform:rotate(0)' })}
            ${kf('shadowJump', { 0: 'transform:scale(1.05)', 38: 'transform:scale(.7)', 76: 'transform:scale(1.05)', 100: 'transform:scale(1.05)' })}
            ${play('.all', 'jump', 0.7)}${play('.head', 'bob', 0.7)}${play('.armL', 'pump', 0.7)}${play('.armR', 'pump', 0.7, '.1s')}${play('.legL', 'kick', 0.7)}${play('.legR', 'kick', 0.7, '.1s')}${play('.tail', 'wag', 0.35)}${play('.earL', 'flap', 0.7)}${play('.earR', 'flap', 0.7, '.35s')}${play('.shadow', 'shadowJump', 0.7)}
            ${pose('.armL', 'rotate(146deg)')}${pose('.armR', 'rotate(146deg)')}${pose('.legR', 'translateY(-9px)')}${pose('.head', 'rotate(-4deg)')}${pose('.tail', 'rotate(12deg)')}`,
    };

    return base + rules[state];
};

export function fox(state) {
    const back = state === 'DJing';

    return picture({
        label: 'Zoo S02 fox',
        state,
        defs: defs(),
        body: `${shadow()}<g class="all">${back ? '' : tail()}${leg('legL')}${mirror(leg('legR'))}${body(back)}${back ? tail() : ''}${arm('armL')}${mirror(arm('armR'))}<g class="head">${head(state, back)}</g></g>`,
        css: motion(state),
    });
}
