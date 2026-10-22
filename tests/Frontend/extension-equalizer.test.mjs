import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import { equalizerRequest } from '../../resources/js/lib/extensionEqualizer.ts';

const folder = new URL('../../extensions/sfd-equalizer/', import.meta.url);
test('extension only requests local tab-audio capabilities and specific site access', () => {
    const manifest = JSON.parse(readFileSync(new URL('manifest.json', folder), 'utf8'));
    assert.deepEqual(manifest.permissions.sort(), ['activeTab', 'offscreen', 'storage', 'tabCapture']);
    assert.ok(!manifest.content_scripts[0].matches.includes('<all_urls>'));
    assert.ok(!manifest.externally_connectable);
    assert.ok(!readFileSync(new URL('offscreen.js', folder), 'utf8').includes('getDisplayMedia'));
    assert.ok(!readFileSync(new URL('../../resources/js/Components/AudioEqualizer.tsx', import.meta.url), 'utf8').includes('getDisplayMedia'));
});
test('service worker restricts the bridge to SFD DJ and local testing origins', () => {
    const context = vm.createContext({ URL, chrome: {
        runtime: { onMessage: { addListener() {} } }, action: { onClicked: { addListener() {} } }, tabs: { onRemoved: { addListener() {} }, onUpdated: { addListener() {} } },
    } });
    vm.runInContext(readFileSync(new URL('background.js', folder), 'utf8'), context);
    for (const url of ['https://sfd-dj.eu/rooms/test', 'https://www.sfd-dj.eu/', 'http://localhost:8000/', 'http://127.0.0.1:4175/']) assert.equal(vm.runInContext(`allowed(${JSON.stringify(url)})`, context), true);
    for (const url of ['https://evil.example/', 'https://sfd-dj.eu.evil.example/', 'https://evilsfd-dj.eu/', 'file:///tmp/a', 'http://sfd-dj.eu/', 'invalid']) assert.equal(vm.runInContext(`allowed(${JSON.stringify(url)})`, context), false);
    const tone = JSON.parse(vm.runInContext('JSON.stringify(toneOf({bass:100,mid:-100,treble:"12"}))', context));
    assert.deepEqual(tone, { bass: 12, mid: -12, treble: 0 });
});
test('page bridge matches responses to request ids and never exposes a capture-start command', async () => {
    const previousWindow = globalThis.window;
    const window = new EventTarget(); globalThis.window = window;
    try {
        window.addEventListener('sfd-eq-request-v1', event => {
            assert.equal(event.detail.command, 'tone');
            window.dispatchEvent(new CustomEvent('sfd-eq-response-v1', { detail: { id: 'wrong', installed: false } }));
            window.dispatchEvent(new CustomEvent('sfd-eq-response-v1', { detail: { id: event.detail.id, installed: true, active: true } }));
        });
        assert.deepEqual(await equalizerRequest('tone', { bass: 12, mid: 0, treble: 0 }), { installed: true, active: true, error: null });
    } finally { globalThis.window = previousWindow; }
});
