import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { animatedPng } from './animated-png.mjs';
import { aether } from './staff-characters/aether.mjs';
import { kaida } from './staff-characters/kaida.mjs';
import { solstice } from './staff-characters/solstice.mjs';
import { veyra } from './staff-characters/veyra.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function writeCharacterAnimations() {
    const output = path.join(root, 'public/Avatars/Animations');
    fs.mkdirSync(output, { recursive: true });
    const manifest = {};
    let total = 0;
    for (const [name, draw] of Object.entries({ aether, kaida, solstice, veyra })) {
        manifest[name] = {};
        for (const state of ['Dancing', 'DJing']) {
            const svg = fs.readFileSync(path.join(root, `public/Avatars/${state}/${name}.svg`), 'utf8');
            // Hand-edited source art stays authoritative; use its original SVG if it differs.
            if (svg.replaceAll('\r\n', '\n') !== draw(state)) continue;
            const count = (svg.match(/class="(?:pose pose|solframe solframe|veyraframe veyraframe|kaidaframe kaidaframe)\d+"/g) ?? []).length;
            const seconds = Number(svg.match(/animation:[\w-]+ ([\d.]+)s steps\(1,end\)/)?.[1]);
            if (!count || !seconds) throw new Error(`No sampled animation: ${name}/${state}`);
            const samples = Array.from({ length: count }, (_, index) => draw(state, index / count));
            const hash = createHash('sha256').update(samples.join('')).update(`apng-v2;width=200;seconds=${seconds}`).digest('hex').slice(0, 12);
            const filename = `${name}.${state.toLowerCase()}.${hash}.png`;
            if (!fs.existsSync(path.join(output, filename))) {
                const frames = samples.map(sample => new Resvg(sample, { fitTo: { mode: 'width', value: 200 }, font: { loadSystemFonts: false } }).render().asPng());
                fs.writeFileSync(path.join(output, filename), animatedPng(frames, seconds));
            }
            manifest[name][state.toLowerCase()] = `/Avatars/Animations/${filename}`;
            total++;
        }
    }
    fs.writeFileSync(path.join(root, 'resources/js/lib/characterAnimations.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log(`Pre-rendered character animations: ${total}; original frame counts and poses retained`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) writeCharacterAnimations();
