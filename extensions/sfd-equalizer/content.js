// This bridge is installed only on SFD DJ and localhost. It cannot start capture.
const requestEvent = 'sfd-eq-request-v1';
const responseEvent = 'sfd-eq-response-v1';
const stateEvent = 'sfd-eq-state-v1';
window.addEventListener(requestEvent, event => {
    const data = event.detail;
    if (!data || typeof data.id !== 'string' || data.id.length > 100 || !['status', 'tone', 'stop'].includes(data.command)) return;
    chrome.runtime.sendMessage({ target: 'sfd-eq-worker', command: data.command, tone: data.tone }).then(result => {
        window.dispatchEvent(new CustomEvent(responseEvent, { detail: { id: data.id, ...result } }));
    }).catch(() => window.dispatchEvent(new CustomEvent(responseEvent, { detail: { id: data.id, installed: false, active: false } })));
});
chrome.runtime.onMessage.addListener(message => {
    if (message?.type === 'sfd-eq-status') window.dispatchEvent(new CustomEvent(stateEvent, { detail: message }));
});
