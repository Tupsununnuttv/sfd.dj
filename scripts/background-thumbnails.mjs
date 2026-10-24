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

// A still backdrop keeps the scene recognizable without thousands of live SVG nodes.
const stillOutput = path.join(source, 'stills');
fs.mkdirSync(stillOutput, { recursive: true });
const stills = {};
for (const filename of fs.readdirSync(source).sort()) {
    if (!/^[a-z0-9]+\.svg$/.test(filename)) continue;
    const svg = fs.readFileSync(path.join(source, filename));
    const name = path.basename(filename, '.svg');
    const hash = createHash('sha256').update(svg).update('width=960;v=2;booth=off').digest('hex').slice(0, 12);
    const target = `${name}.${hash}.png`;
    const destination = path.join(stillOutput, target);
    // The exported preview includes a booth; the live room already draws its foreground booth.
    const scenery = svg.toString('utf8').replace(/(<svg\b[^>]*>)/, '$1<style>svg[viewBox="0 0 300 150"]{display:none}</style>');
    if (!fs.existsSync(destination)) fs.writeFileSync(destination, new Resvg(scenery, { fitTo: { mode: 'width', value: 960 } }).render().asPng());
    stills[name] = `/backgrounds/stills/${target}`;
}
fs.writeFileSync(path.join(root, 'resources/js/lib/backgroundStills.json'), JSON.stringify(stills, null, 2) + '\n');
console.log(`Static room backgrounds: ${Object.keys(stills).length}`);
