import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'public/backgrounds');
const output = path.join(source, 'thumbnails');
fs.mkdirSync(output, { recursive: true });
const manifest = {};
let sourceBytes = 0, thumbnailBytes = 0;
for (const filename of fs.readdirSync(source).sort()) {
    if (!/^[a-z0-9]+\.svg$/.test(filename)) continue;
    const svg = fs.readFileSync(path.join(source, filename));
    const name = path.basename(filename, '.svg');
    const hash = createHash('sha256').update(svg).update('width=224;v=1').digest('hex').slice(0, 12);
    const target = `${name}.${hash}.png`;
    const destination = path.join(output, target);
    if (!fs.existsSync(destination)) {
        fs.writeFileSync(destination, new Resvg(svg, { fitTo: { mode: 'width', value: 224 } }).render().asPng());
    }
    manifest[name] = `/backgrounds/thumbnails/${target}`;
    sourceBytes += svg.length;
    thumbnailBytes += fs.statSync(destination).size;
}
fs.writeFileSync(path.join(root, 'resources/js/lib/backgroundThumbnails.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Background thumbnails: ${Object.keys(manifest).length}; ${sourceBytes} SVG bytes -> ${thumbnailBytes} thumbnail bytes`);
