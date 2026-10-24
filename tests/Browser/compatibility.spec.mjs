import { test, expect } from '@playwright/test';

const harness = '/tests/Browser/index.html';
test.beforeEach(async ({ page }) => {
    await page.route('**/preferences', (route) => route.fulfill({ json: { preferences: {} } }));
});

test('shared controls, native selects and animated SVG render without runtime errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(harness);
    await expect(page.locator('#compact')).toBeVisible();
    await expect(page.getByRole('combobox')).toHaveCSS('color-scheme', 'dark');
    await expect.poll(() => page.getByAltText('Bamboo Panda').evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
});

test('compact changes reach an overlay immediately even with channel, storage and UUID APIs blocked', async ({ page }) => {
    await page.addInitScript(() => {
        window.BroadcastChannel = class { constructor() { throw new DOMException('Blocked', 'SecurityError'); } };
        Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
        Object.defineProperty(Crypto.prototype, 'randomUUID', { value: undefined, configurable: true });
    });
    await page.goto(harness);
    await page.locator('#compact').click();
    await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
    await page.evaluate((src) => { const frame = document.createElement('iframe'); frame.src = src; document.body.append(frame); }, harness);
    const overlay = page.frameLocator('iframe');
    await overlay.locator('#compact-chat').click();
    await expect(page.locator('#density')).toContainText('"compact_chat":true');
    await expect(overlay.locator('#density')).toContainText('"compact_chat":true');
});

test('channel uses storage when BroadcastChannel is unavailable and rejects foreign messages', async ({ context, page }) => {
    await context.addInitScript(() => { window.BroadcastChannel = undefined; });
    await page.goto(harness);
    const other = await context.newPage();
    await other.goto(harness);
    await other.waitForFunction(() => !!window.testChannel);
    await page.evaluate(() => window.testChannel.postMessage({ hello: 'room' }));
    await expect.poll(() => other.evaluate(() => window.testEvents)).toEqual([{ hello: 'room' }]);
    await other.evaluate(() => window.dispatchEvent(new MessageEvent('message', { origin: 'https://invalid.example', data: { channel: 'sfd:channel:browser-test', id: 'foreign', data: 'ignored' } })));
    expect(await other.evaluate(() => window.testEvents.length)).toBe(1);
});

test('clipboard fallback copies on click and reports rejection without claiming success', async ({ page }) => {
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
        document.addEventListener('copy', (event) => { window.copiedText = window.getSelection()?.toString() || document.activeElement?.value; });
    });
    await page.goto(harness);
    await page.locator('#copy').click();
    await expect(page.locator('body')).toHaveAttribute('data-copy', 'ok');
    expect(await page.evaluate(() => window.copiedText)).toBe('SFD-DJ.EU');
    await page.evaluate(() => { document.execCommand = () => false; });
    await page.locator('#copy').click();
    await expect(page.locator('body')).toHaveAttribute('data-copy', 'error');
    expect(await page.locator('textarea').count()).toBe(0);
    await expect(page.locator('#copy')).toBeFocused();
});

test('voice recording creates a playable recording and releases every track', async ({ page }) => {
    await page.goto(harness);
    await page.locator('#copy').click(); // user activation for browser audio policies
    const result = await page.evaluate(async () => {
        const { VoiceRecorder } = await import('/resources/js/lib/voiceRecorder.ts');
        const context = new AudioContext();
        await context.resume();
        const source = context.createOscillator();
        const destination = context.createMediaStreamDestination();
        source.connect(destination); source.start();
        navigator.mediaDevices.getUserMedia = async () => destination.stream;
        const recorder = new VoiceRecorder();
        await recorder.start({ onTick() {}, onLevel() {}, onLimit() {} });
        await new Promise((resolve) => setTimeout(resolve, 600));
        const recording = await recorder.stop();
        const audio = new Audio();
        const bytes = await recording.blob.arrayBuffer();
        const decoded = await context.decodeAudioData(bytes);
        const result = { bytes: recording.blob.size, duration: decoded.duration, type: audio.canPlayType(recording.blob.type), ended: destination.stream.getTracks().every((track) => track.readyState === 'ended') };
        source.stop(); await context.close();
        return result;
    });
    expect(result.bytes).toBeGreaterThan(100);
    expect(result.duration).toBeGreaterThan(0.1);
    expect(result.type).not.toBe('');
    expect(result.ended).toBe(true);
});

test('late microphone permission and recorder startup failure both release the microphone', async ({ page }) => {
    await page.goto(harness);
    const result = await page.evaluate(async () => {
        const { VoiceRecorder } = await import('/resources/js/lib/voiceRecorder.ts');
        let resolvePermission;
        let stopped = 0;
        const stream = { getTracks: () => [{ stop() { stopped++; } }] };
        navigator.mediaDevices.getUserMedia = () => new Promise((resolve) => { resolvePermission = resolve; });
        const recorder = new VoiceRecorder();
        const pending = recorder.start({ onTick() {}, onLevel() {}, onLimit() {} }).catch(() => {});
        recorder.cancel(); resolvePermission(stream); await pending;
        const first = stopped;
        navigator.mediaDevices.getUserMedia = async () => stream;
        window.MediaRecorder = class { static isTypeSupported() { return true; } constructor() { throw new DOMException('Unsupported', 'NotSupportedError'); } };
        await recorder.start({ onTick() {}, onLevel() {}, onLimit() {} }).catch(() => {});
        return { first, total: stopped };
    });
    expect(result).toEqual({ first: 1, total: 2 });
});

test('WebRTC exchanges normalized descriptions and retains streamless audio and video', async ({ page }) => {
    await page.goto(harness);
    await page.locator('#copy').click();
    const received = await page.evaluate(async () => {
        const { gatheredDescription, remoteCallDescription, receiveCallTracks } = await import('/resources/js/lib/calls.ts');
        const a = new RTCPeerConnection({ iceServers: [] });
        const b = new RTCPeerConnection({ iceServers: [] });
        const context = new AudioContext();
        const destination = context.createMediaStreamDestination();
        const source = context.createOscillator(); source.connect(destination); source.start();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 16;
        canvas.getContext('2d').fillRect(0, 0, 16, 16);
        const video = canvas.captureStream(10);
        const receiving = new MediaStream();
        try {
            a.addTrack(destination.stream.getAudioTracks()[0]);
            a.addTrack(video.getVideoTracks()[0]);
            const track = new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error('No remote audio')), 15000);
                b.ontrack = (event) => {
                    receiveCallTracks(receiving, event);
                    if (receiving.getTracks().length === 2) { clearTimeout(timer); resolve(receiving.getTracks().map((track) => track.kind).sort()); }
                };
            });
            await a.setLocalDescription(await a.createOffer());
            const offer = await gatheredDescription(a);
            await b.setRemoteDescription(remoteCallDescription('offer', offer.trim().replaceAll('\r\n', '\n')));
            await b.setLocalDescription(await b.createAnswer());
            await a.setRemoteDescription(remoteCallDescription('answer', await gatheredDescription(b)));
            const kind = await track;
            await new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error('Peer did not connect')), 15000);
                const check = () => { if (a.connectionState === 'connected') { clearTimeout(timer); resolve(); } };
                a.addEventListener('connectionstatechange', check); check();
            });
            return kind;
        } finally { a.close(); b.close(); source.stop(); [...destination.stream.getTracks(), ...video.getTracks()].forEach((track) => track.stop()); await context.close(); }
    });
    expect(received).toEqual(['audio', 'video']);
});

test('public application pages render without JavaScript crashes', async ({ page }) => {
    test.skip(!process.env.BROWSER_APP_URL, 'Set BROWSER_APP_URL to check a running local Laravel app.');
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const path of ['/', '/login', '/register', '/patch-notes']) {
        const response = await page.goto(new URL(path, process.env.BROWSER_APP_URL).href);
        expect(response.status()).toBeLessThan(400);
        await expect(page.locator('#app')).not.toBeEmpty();
        await expect(page.locator('h1, h2, form').first()).toBeVisible();
    }
    expect(errors).toEqual([]);
});

test('quick profile uses the fresh server avatar and refreshes a cached look after a save', async ({ page }) => {
    let avatar = 'char:panda';
    await page.route('**/profile-api/77', (route) => route.fulfill({ json: { id: 77, name: 'DJ Test', avatar, cosmetics: null, level: 29, stats: { xp: 15860, songs_played: 1, woots: 2, friends: 3 } } }));
    await page.goto(harness);
    await page.locator('#peek').click();
    await expect(page.locator('img[src^="/Avatars/Previews/panda."]')).toBeVisible();
    avatar = 'char:bamboopanda';
    await page.evaluate(async () => { const { invalidateProfile } = await import('/resources/js/lib/profileCache.ts'); invalidateProfile(77); });
    await expect(page.locator('img[src^="/Avatars/Previews/bamboopanda."]')).toBeVisible();
});
