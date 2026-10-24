import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { staticCharacter, staticGif } from '../../scripts/character-posters.mjs';

test('poster removes later nested poses and preserves the first figure and definitions', () => {
    const input = '<svg><defs><g id="head"><path d="M0 0"/></g></defs><g class="pose pose0"><g><use href="#head"/></g></g><g class="pose pose1"><g><g><path id="later"/></g></g></g><ellipse id="shadow"/></svg>';
    const poster = staticCharacter(input);
    assert.ok(poster.includes('id="head"'));
    assert.ok(poster.includes('href="#head"'));
    assert.ok(poster.includes('id="shadow"'));
    assert.ok(!poster.includes('id="later"'));
    assert.ok(poster.includes('animation:none!important'));
});

test('GIF posters keep the first frame and its transparent palette without the animation loop', () => {
    const single = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    const loop = Buffer.from('21ff0b4e45545343415045322e300301000000', 'hex');
    const animated = Buffer.concat([single.subarray(0, 19), loop, single.subarray(19, -1), single.subarray(19)]);
    assert.deepEqual(staticGif(animated), single);
    assert.deepEqual(staticGif(single), single);
    assert.throws(() => staticGif(Buffer.from('not a gif')), /Invalid GIF/);
    assert.throws(() => staticGif(single.subarray(0, -5)), /Truncated GIF/);
});

test('Legendary posters preserve one complete pose and are substantially smaller', () => {
    for (const name of ['aether', 'solstice', 'veyra', 'kaida']) {
        const source = readFileSync(new URL(`../../public/Avatars/Standing/${name}.svg`, import.meta.url), 'utf8');
        const poster = staticCharacter(source);
        assert.equal((poster.match(/class="(?:pose pose|solframe solframe|veyraframe veyraframe|kaidaframe kaidaframe)\d+"/g) ?? []).length, 1);
        assert.ok(poster.length < source.length / 10);
        assert.ok(!poster.includes('NaN'));
    }
});

test('every character has a static DJ poster, and imported GIF DJ posters contain only their first frame', () => {
    const root = new URL('../../', import.meta.url);
    const standing = JSON.parse(readFileSync(new URL('resources/js/lib/characterPosters.json', root), 'utf8'));
    const djs = JSON.parse(readFileSync(new URL('resources/js/lib/characterDjPosters.json', root), 'utf8'));
    assert.deepEqual(Object.keys(djs), Object.keys(standing));
    for (const url of Object.values(djs)) {
        const buffer = readFileSync(new URL('public' + url, root));
        if (url.endsWith('.gif')) assert.deepEqual(staticGif(buffer), buffer);
        else {
            assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
            assert.equal(buffer.readUInt32BE(16), 160);
        }
    }
});
