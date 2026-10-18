import assert from 'node:assert/strict';
import { test } from 'node:test';
import { callMedia, gatheredDescription } from '../../resources/js/lib/calls.ts';

test('video call falls back to microphone when the camera is unavailable or denied', async () => {
    for (const name of ['NotFoundError', 'NotAllowedError', 'NotReadableError']) {
        const requests = [];
        const audioStream = {};
        const devices = { async getUserMedia(constraints) {
            requests.push(constraints);
            if (constraints.video) throw new DOMException('Camera unavailable', name);
            return audioStream;
        } };
        assert.equal(await callMedia(devices, true), audioStream);
        assert.equal(requests.length, 2);
        assert.equal(requests[1].video, false);
        assert.equal(requests[1].audio.echoCancellation, true);
    }
});

test('successful camera access does not request a second stream', async () => {
    let count = 0;
    const stream = {};
    assert.equal(await callMedia({ async getUserMedia() { count++; return stream; } }, true), stream);
    assert.equal(count, 1);
});

test('microphone denial remains an error', async () => {
    await assert.rejects(callMedia({ async getUserMedia() { throw new DOMException('Permission denied', 'NotAllowedError'); } }, true), { name: 'NotAllowedError' });
});

function peer(candidate = true) {
    return Object.assign(new EventTarget(), {
        iceGatheringState: 'gathering',
        signalingState: 'have-local-offer',
        localDescription: { sdp: 'v=0\r\n' + (candidate ? 'a=candidate:1 1 UDP 2122260223 192.0.2.1 50000 typ host\r\n' : '') },
    });
}

test('uses gathered candidates when an ICE server never finishes', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const pc = peer();
    const result = gatheredDescription(pc);
    t.mock.timers.tick(15000);
    assert.equal(await result, pc.localDescription.sdp);
});

test('returns immediately when gathering completes', async () => {
    const pc = peer();
    const result = gatheredDescription(pc);
    pc.iceGatheringState = 'complete';
    pc.dispatchEvent(new Event('icegatheringstatechange'));
    assert.equal(await result, pc.localDescription.sdp);
});

test('does not send a candidate-free description after timeout', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const result = assert.rejects(gatheredDescription(peer(false)), /could not find a connection address/);
    t.mock.timers.tick(15000);
    await result;
});

test('closing the peer cancels preparation without waiting for timeout', async () => {
    const pc = peer();
    const result = assert.rejects(gatheredDescription(pc), /Call cancelled/);
    pc.signalingState = 'closed';
    pc.dispatchEvent(new Event('signalingstatechange'));
    await result;
});
