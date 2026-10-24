// Small static posters: rasterized SVGs and first-frame GIFs. No runtime dependency.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function staticCharacter(svg) {
    // Sampled animations repeat a complete articulated figure per frame. Keep frame zero only.
    const frames = /<g\b[^>]*class="(?:pose pose|solframe solframe|veyraframe veyraframe|kaidaframe kaidaframe)(\d+)"[^>]*>/g;
    let match;
    const cuts = [];
    while ((match = frames.exec(svg))) {
        const tags = /<g\b[^>]*>|<\/g\s*>/g;
        tags.lastIndex = frames.lastIndex;
        let depth = 1;
        let tag;
        while (depth && (tag = tags.exec(svg))) depth += tag[0].startsWith('</') ? -1 : tag[0].endsWith('/>') ? 0 : 1;
        if (depth) throw new Error('Unbalanced character frame');
        if (match[1] !== '0') cuts.push([match.index, tags.lastIndex]);
        frames.lastIndex = tags.lastIndex;
    }
    for (const [start, end] of cuts.reverse()) svg = svg.slice(0, start) + svg.slice(end);
    return svg.replace('</svg>', '<style>*{animation:none!important}</style></svg>');
}

/** Preserve the first GIF frame, its palette and transparency, without decoding or recompressing it. */
export function staticGif(gif) {
    if (gif.length < 13 || !/^GIF8[79]a$/.test(gif.toString('ascii', 0, 6))) throw new Error('Invalid GIF header');
    const paletteBytes = packed => packed & 0x80 ? 3 * (1 << ((packed & 7) + 1)) : 0;
    const headerEnd = 13 + paletteBytes(gif[10]);
    let cursor = headerEnd;
    let control = Buffer.alloc(0);
    const advance = count => { cursor += count; if (cursor > gif.length) throw new Error('Truncated GIF'); };
    const subBlocks = () => {
        while (true) {
            if (cursor >= gif.length) throw new Error('Truncated GIF blocks');
            const size = gif[cursor++];
            if (!size) return;
            advance(size);
        }
    };
    while (cursor < gif.length) {
        const start = cursor;
        const marker = gif[cursor++];
        if (marker === 0x21) {
            if (cursor >= gif.length) throw new Error('Truncated GIF extension');
            const label = gif[cursor++];
            subBlocks();
            if (label === 0xf9) control = gif.subarray(start, cursor);
        } else if (marker === 0x2c) {
            advance(9);
            advance(paletteBytes(gif[start + 9]));
            advance(1); // LZW minimum code size.
            subBlocks();
            return Buffer.concat([gif.subarray(0, headerEnd), control, gif.subarray(start, cursor), Buffer.from([0x3b])]);
        } else {
            throw new Error('GIF has no valid first frame');
        }
    }
    throw new Error('GIF has no first frame');
}

export function writeCharacterPosters(state = 'Standing') {
    const source = path.join(root, 'public/Avatars', state);
    const output = path.join(root, 'public/Avatars/Previews');
    fs.mkdirSync(output, { recursive: true });
    const manifest = {};
    let originalBytes = 0, posterBytes = 0;
    for (const file of fs.readdirSync(source).sort()) {
        if (!/^[a-z0-9]{2,11}\.(svg|gif)$/.test(file)) continue;
        const extension = path.extname(file);
        const name = path.basename(file, extension);
        if (extension === '.gif' && fs.existsSync(path.join(source, `${name}.svg`))) continue;
        const original = fs.readFileSync(path.join(source, file));
        const still = extension === '.gif' ? staticGif(original) : Buffer.from(staticCharacter(original.toString('utf8')));
        const hash = createHash('sha256').update(still).update(extension === '.gif' ? 'gif-v1' : 'png-v1;width=160').digest('hex').slice(0, 12);
        const filename = `${state === 'Standing' ? '' : 'djing-'}${name}.${hash}${extension === '.gif' ? '.gif' : '.png'}`;
        const destination = path.join(output, filename);
        if (!fs.existsSync(destination)) {
            const poster = extension === '.gif' ? still : new Resvg(still, { fitTo: { mode: 'width', value: 160 }, font: { loadSystemFonts: /<text\b/.test(still.toString('utf8')) } }).render().asPng();
            fs.writeFileSync(destination, poster);
        }
        manifest[name] = `/Avatars/Previews/${filename}`;
        originalBytes += original.length;
        posterBytes += fs.statSync(destination).size;
    }
    fs.writeFileSync(path.join(root, `resources/js/lib/${state === 'Standing' ? 'characterPosters' : 'characterDjPosters'}.json`), JSON.stringify(manifest, null, 2) + '\n');
    console.log(`${state} posters: ${Object.keys(manifest).length}; ${originalBytes} animated bytes -> ${posterBytes} poster bytes`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { writeCharacterPosters(); writeCharacterPosters('DJing'); }
