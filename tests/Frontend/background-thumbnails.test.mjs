import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { test } from 'node:test';

test('every shipped background has a current small PNG for room settings', () => {
    const root = new URL('../../', import.meta.url);
    const manifest = JSON.parse(fs.readFileSync(new URL('resources/js/lib/backgroundThumbnails.json', root), 'utf8'));
    const names = fs.readdirSync(new URL('public/backgrounds/', root)).filter((name) => /^[a-z0-9]+\.svg$/.test(name));
    assert.equal(Object.keys(manifest).length, names.length);
    for (const file of names) {
        const name = file.slice(0, -4);
        const svg = fs.readFileSync(new URL('public/backgrounds/' + file, root));
        const hash = createHash('sha256').update(svg).update('width=224;v=1').digest('hex').slice(0, 12);
        assert.equal(manifest[name], `/backgrounds/thumbnails/${name}.${hash}.png`);
        const png = fs.readFileSync(new URL('public' + manifest[name], root));
        assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
        assert.equal(png.readUInt32BE(16), 224);
        assert.equal(png.readUInt32BE(20), 126);
    }
});
