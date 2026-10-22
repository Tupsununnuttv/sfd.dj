let session = null;
let generation = 0;
const clamp = value => typeof value === 'number' && Number.isFinite(value) ? Math.max(-12, Math.min(12, value)) : 0;
function update(tone) {
    if (!session) return;
    const values = ['bass', 'mid', 'treble'].map(key => clamp(tone?.[key]));
    session.filters.forEach((filter, index) => filter.gain.setTargetAtTime(values[index], session.context.currentTime, 0.02));
    // Moderate headroom; the final limiter handles peaks instead of cancelling the entire bass boost.
    session.preamp.gain.setTargetAtTime(10 ** (-Math.max(0, ...values) / 40), session.context.currentTime, 0.02);
}
async function stop() {
    generation++;
    const previous = session; session = null;
    if (!previous) return;
    previous.stream.getTracks().forEach(track => track.stop());
    previous.source.disconnect();
    if (previous.context.state !== 'closed') await previous.context.close();
}
async function start(message) {
    await stop();
    const current = generation;
    let stream, context;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: message.streamId } }, video: false });
        if (current !== generation) { stream.getTracks().forEach(track => track.stop()); return; }
        if (!stream.getAudioTracks().length) throw new Error('No tab audio is available.');
        context = new AudioContext({ latencyHint: 'interactive' });
        await context.resume();
        if (current !== generation) { stream.getTracks().forEach(track => track.stop()); await context.close(); return; }
        if (context.state !== 'running') throw new Error('Audio playback is blocked. Click the extension icon again.');
        const source = context.createMediaStreamSource(stream);
        const filters = [120, 1000, 6000].map((frequency, index) => {
            const filter = context.createBiquadFilter(); filter.type = ['lowshelf', 'peaking', 'highshelf'][index]; filter.frequency.value = frequency; filter.Q.value = 0.7; return filter;
        });
        const preamp = context.createGain();
        const limiter = context.createDynamicsCompressor();
        limiter.threshold.value = -2; limiter.knee.value = 4; limiter.ratio.value = 20; limiter.attack.value = 0.003; limiter.release.value = 0.12;
        source.connect(filters[0]); filters[0].connect(filters[1]).connect(filters[2]).connect(preamp).connect(limiter).connect(context.destination);
        session = { tabId: message.tabId, stream, context, source, filters, preamp };
        update(message.tone);
        stream.getAudioTracks().forEach(track => track.addEventListener('ended', () => {
            if (current !== generation) return;
            stop().finally(() => chrome.runtime.sendMessage({ target: 'sfd-eq-worker', command: 'ended', tabId: message.tabId }).catch(() => {}));
        }, { once: true }));
    } catch (error) {
        stream?.getTracks().forEach(track => track.stop());
        if (context && context.state !== 'closed') await context.close();
        session = null;
        throw error;
    }
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (message?.target !== 'sfd-eq-offscreen' || sender.id !== chrome.runtime.id) return;
    (async () => {
        if (message.command === 'start') await start(message);
        else if (message.command === 'stop') await stop();
        else if (message.command === 'tone') update(message.tone);
        else if (message.command !== 'status') throw new Error('Unknown command.');
        return { active: !!session, tabId: session?.tabId ?? null };
    })().then(respond, error => respond({ error: error.message }));
    return true;
});
