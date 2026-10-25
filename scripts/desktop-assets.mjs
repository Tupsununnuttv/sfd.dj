import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Package the existing SFD vector artwork as Windows icons without changing the logo. */
export function desktopAssets(root) {
    const directory = join(root, 'apps', 'desktop', 'Assets');
    mkdirSync(directory, { recursive: true });
    const sizes = [16, 24, 32, 48, 128, 256];
    const images = sizes.map(size => new Resvg(readFileSync(join(root, 'public', size <= 32 ? 'favicon.svg' : 'logo.svg')), { fitTo: { mode: 'width', value: size } }).render().asPng());
    const header = Buffer.alloc(6 + 16 * sizes.length);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(sizes.length, 4);
    let offset = header.length;
    sizes.forEach((size, index) => {
        const entry = 6 + index * 16;
        header[entry] = size === 256 ? 0 : size;
        header[entry + 1] = size === 256 ? 0 : size;
        header.writeUInt16LE(1, entry + 4);
        header.writeUInt16LE(32, entry + 6);
        header.writeUInt32LE(images[index].length, entry + 8);
        header.writeUInt32LE(offset, entry + 12);
        offset += images[index].length;
    });
    writeFileSync(join(directory, 'app.ico'), Buffer.concat([header, ...images]));
    // Inno Setup accepts the original PNG artwork for its wizard and header.
    writeFileSync(join(directory, 'wizard-logo.png'), new Resvg(readFileSync(join(root, 'public', 'logo.svg')), { fitTo: { mode: 'width', value: 192 } }).render().asPng());
    const artwork = readFileSync(join(root, 'public', 'logo.svg')).toString('base64');
    const banner = `<svg xmlns="http://www.w3.org/2000/svg" width="328" height="628"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#241035"/><stop offset="1" stop-color="#091822"/></linearGradient></defs><rect width="328" height="628" fill="url(#bg)"/><image href="data:image/svg+xml;base64,${artwork}" x="64" y="142" width="200" height="200"/><text x="164" y="395" text-anchor="middle" fill="white" font-family="Segoe UI,sans-serif" font-size="30" font-weight="bold">SFD-DJ.EU</text><text x="164" y="428" text-anchor="middle" fill="#c6b9d6" font-family="Segoe UI,sans-serif" font-size="17">Your music room, live.</text></svg>`;
    writeFileSync(join(directory, 'wizard-banner.png'), new Resvg(banner, { fitTo: { mode: 'width', value: 492 } }).render().asPng());
}
