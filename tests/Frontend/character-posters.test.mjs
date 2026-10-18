import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { staticCharacter } from '../../scripts/character-posters.mjs';

test('poster removes later nested poses and preserves the first figure and definitions', () => {
    const input = '<svg><defs><g id="head"><path d="M0 0"/></g></defs><g class="pose pose0"><g><use href="#head"/></g></g><g class="pose pose1"><g><g><path id="later"/></g></g></g><ellipse id="shadow"/></svg>';
    const poster = staticCharacter(input);
    assert.ok(poster.includes('id="head"'));
    assert.ok(poster.includes('href="#head"'));
    assert.ok(poster.includes('id="shadow"'));
    assert.ok(!poster.includes('id="later"'));
    assert.ok(poster.includes('animation:none!important'));
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
