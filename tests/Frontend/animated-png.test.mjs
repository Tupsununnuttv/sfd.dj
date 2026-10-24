import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { animatedPng, pngChunks } from '../../scripts/animated-png.mjs';

test('APNG retains lossless frames, sequence, transparency replacement and loop timing', () => {
    const frames = ['red', 'blue'].map(color => new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="1" height="1" fill="${color}"/></svg>`).render().asPng());
    const chunks = pngChunks(animatedPng(frames, 0.2));
    assert.equal(chunks.find(c => c.type === 'acTL').data.readUInt32BE(0), 2);
    assert.equal(chunks.find(c => c.type === 'acTL').data.readUInt32BE(4), 0);
    assert.deepEqual(chunks.filter(c => ['fcTL', 'fdAT'].includes(c.type)).map(c => c.data.readUInt32BE(0)), [0, 1, 2]);
    for (const control of chunks.filter(c => c.type === 'fcTL')) {
        assert.equal(control.data.readUInt16BE(20) / control.data.readUInt16BE(22), 0.1);
        assert.equal(control.data[25], 0);
    }
    assert.deepEqual(chunks.find(c => c.type === 'IDAT').data, pngChunks(frames[0]).find(c => c.type === 'IDAT').data);
    assert.deepEqual(chunks.find(c => c.type === 'fdAT').data.subarray(4), pngChunks(frames[1]).find(c => c.type === 'IDAT').data);
    assert.equal(chunks.at(-1).type, 'IEND');
    assert.throws(() => pngChunks(animatedPng(frames, 0.2).subarray(0, -1)), /Truncated PNG/);
});

test('generated character animations retain every pose and the complete source loop duration', () => {
    const manifest = JSON.parse(readFileSync(new URL('../../resources/js/lib/characterAnimations.json', import.meta.url), 'utf8'));
    for (const [name, states] of Object.entries(manifest)) for (const [state, filename] of Object.entries(states)) {
        const folder = state === 'djing' ? 'DJing' : 'Dancing';
        const svg = readFileSync(new URL(`../../public/Avatars/${folder}/${name}.svg`, import.meta.url), 'utf8');
        const count = (svg.match(/class="(?:pose pose|solframe solframe|veyraframe veyraframe|kaidaframe kaidaframe)\d+"/g) ?? []).length;
        const seconds = Number(svg.match(/animation:[\w-]+ ([\d.]+)s steps\(1,end\)/)[1]);
        const chunks = pngChunks(readFileSync(new URL(`../../public${filename}`, import.meta.url)));
        const frames = chunks.filter(c => c.type === 'fcTL');
        assert.equal(frames.length, count, `${name}/${state} frame count`);
        const duration = frames.reduce((sum, c) => sum + c.data.readUInt16BE(20) / c.data.readUInt16BE(22), 0);
        assert.ok(Math.abs(duration - seconds) < 0.000001, `${name}/${state} loop timing`);
    }
});
