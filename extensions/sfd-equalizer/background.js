const allowed = value => {
    try { const url = new URL(value); return (url.protocol === 'https:' && (url.hostname === 'sfd-dj.eu' || url.hostname.endsWith('.sfd-dj.eu'))) || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)); } catch { return false; }
};
const clamp = value => typeof value === 'number' && Number.isFinite(value) ? Math.max(-12, Math.min(12, value)) : 0;
const toneOf = tone => Object.fromEntries(['bass', 'mid', 'treble'].map(key => [key, clamp(tone?.[key])]));
let creating;
let actionQueue = Promise.resolve();
const errors = new Map();
async function offscreen(create = false) {
    const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'], documentUrls: [chrome.runtime.getURL('offscreen.html')] });
    if (contexts.length) return true;
    if (!create) return false;
    creating ??= chrome.offscreen.createDocument({ url: 'offscreen.html', reasons: ['USER_MEDIA'], justification: 'Process local tab audio through the equalizer without recording or transmitting it.' }).finally(() => { creating = null; });
    await creating;
    return true;
}
async function command(command, data = {}, create = false) {
    if (!await offscreen(create)) return { active: false, tabId: null };
    const response = await chrome.runtime.sendMessage({ target: 'sfd-eq-offscreen', command, ...data });
    if (response?.error) throw new Error(response.error);
    return response ?? { active: false, tabId: null };
}
async function badge(tabId, text) {
    try { await chrome.action.setBadgeText({ tabId, text }); await chrome.action.setBadgeBackgroundColor({ tabId, color: '#7c3aed' }); } catch { /* closed tab */ }
}
async function statusFor(tabId) {
    const state = await command('status');
    return { installed: true, active: state.active && state.tabId === tabId, error: errors.get(tabId) ?? null };
}
async function notify(tabId) {
    if (tabId == null) return;
    try { await chrome.tabs.sendMessage(tabId, { type: 'sfd-eq-status', ...await statusFor(tabId) }); } catch { /* page reloaded */ }
}
chrome.action.onClicked.addListener(tab => {
    actionQueue = actionQueue.catch(() => {}).then(async () => {
        if (tab.id == null || !allowed(tab.url)) return;
        errors.delete(tab.id);
        try {
            const before = await command('status');
            if (before.active && before.tabId === tab.id) {
                await command('stop'); await badge(tab.id, '');
            } else {
                if (before.active) { await command('stop'); await badge(before.tabId, ''); await notify(before.tabId); }
                const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
                const saved = await chrome.storage.local.get('tone');
                await command('start', { streamId, tabId: tab.id, tone: toneOf(saved.tone) }, true);
                await badge(tab.id, 'EQ');
            }
        } catch (error) { errors.set(tab.id, error.message || 'Could not enable tab audio. Click the extension icon to retry.'); await badge(tab.id, '!'); }
        await notify(tab.id);
    });
});
chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (message?.target === 'sfd-eq-worker' && message.command === 'ended' && sender.url === chrome.runtime.getURL('offscreen.html')) {
        badge(message.tabId, '').then(() => notify(message.tabId));
        return;
    }
    if (message?.target !== 'sfd-eq-worker' || sender.id !== chrome.runtime.id || sender.frameId !== 0 || !sender.tab || !allowed(sender.url)) return;
    const tabId = sender.tab.id;
    (async () => {
        if (!['status', 'tone', 'stop'].includes(message.command)) throw new Error('Unsupported equalizer command.');
        const state = await command('status');
        if (message.command === 'tone') {
            const tone = toneOf(message.tone);
            await chrome.storage.local.set({ tone });
            if (state.active && state.tabId === tabId) await command('tone', { tone });
        }
        if (message.command === 'stop' && state.active && state.tabId === tabId) { await command('stop'); await badge(tabId, ''); }
        return statusFor(tabId);
    })().then(respond, error => respond({ installed: true, active: false, error: error.message }));
    return true;
});
chrome.tabs.onRemoved.addListener(tabId => { errors.delete(tabId); command('status').then(state => { if (state.tabId === tabId) return command('stop'); }).catch(() => {}); });
// A full navigation ends the session; Inertia's room panels do not navigate the tab.
chrome.tabs.onUpdated.addListener((tabId, change) => {
    if (change.status !== 'loading') return;
    command('status').then(async state => { if (state.tabId === tabId) { await command('stop'); await badge(tabId, ''); } }).catch(() => {});
});
