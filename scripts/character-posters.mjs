// Small, content-addressed shop posters. No rasterizer or runtime dependency required.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

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

export function writeCharacterPosters() {
    const source = path.join(root, 'public/Avatars/Standing');
    const output = path.join(root, 'public/Avatars/Previews');
    fs.mkdirSync(output, { recursive: true });
    const manifest = {};
    let originalBytes = 0, posterBytes = 0;
    for (const file of fs.readdirSync(source).sort()) {
        if (!/^[a-z0-9]{2,11}\.svg$/.test(file)) continue;
        const svg = fs.readFileSync(path.join(source, file), 'utf8');
        const poster = staticCharacter(svg);
        const name = path.basename(file, '.svg');
        const hash = createHash('sha256').update(poster).digest('hex').slice(0, 12);
        const filename = `${name}.${hash}.svg`;
        fs.writeFileSync(path.join(output, filename), poster);
        manifest[name] = `/Avatars/Previews/${filename}`;
        originalBytes += Buffer.byteLength(svg);
        posterBytes += Buffer.byteLength(poster);
    }
    fs.writeFileSync(path.join(root, 'resources/js/lib/characterPosters.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log(`Shop posters: ${Object.keys(manifest).length}; ${originalBytes} animated bytes -> ${posterBytes} poster bytes`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) writeCharacterPosters();
