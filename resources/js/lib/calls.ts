export function startWhisperCall(user: { id: number; name: string }, video: boolean) {
    (window.top ?? window).postMessage({ type: 'sfd-whisper-call', user, video }, window.location.origin);
}

/** Wait for the complete SDP so no candidate can arrive before its call exists. */
export async function gatheredDescription(pc: RTCPeerConnection): Promise<string> {
    if (pc.iceGatheringState !== 'complete') await new Promise<void>((resolve, reject) => {
        const done = () => { clearTimeout(timer); pc.removeEventListener('icegatheringstatechange', check); };
        const check = () => { if (pc.iceGatheringState === 'complete') { done(); resolve(); } };
        const timer = setTimeout(() => { done(); reject(new Error('Could not prepare the connection. Try another network.')); }, 15000);
        pc.addEventListener('icegatheringstatechange', check);
        check();
    });
    if (!pc.localDescription?.sdp) throw new Error('Could not prepare the call.');
    return pc.localDescription.sdp;
}
