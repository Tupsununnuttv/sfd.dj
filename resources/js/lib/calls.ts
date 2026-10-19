export function startWhisperCall(user: { id: number; name: string }, video: boolean) {
    (window.top ?? window).postMessage({ type: 'sfd-whisper-call', user, video }, window.location.origin);
}

/** Some peers deliver streamless tracks; retain both audio and video as each arrives. */
export function receiveCallTracks(stream: MediaStream, event: RTCTrackEvent): void {
    const tracks = event.streams.length ? event.streams.flatMap((item) => item.getTracks()) : [event.track];
    for (const track of tracks) if (!stream.getTrackById(track.id)) stream.addTrack(track);
}

/** Video is optional; a missing, busy or denied camera must not prevent an audio call. */
export async function callMedia(devices: Pick<MediaDevices, 'getUserMedia'>, video: boolean): Promise<MediaStream> {
    const audio = { echoCancellation: true, noiseSuppression: true };
    if (video) {
        try {
            return await devices.getUserMedia({ audio, video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } });
        } catch {
            // Ask for audio independently: microphone permission may still be available.
        }
    }
    return devices.getUserMedia({ audio, video: false });
}

/** Restore SDP line endings, including older signals whose final CRLF was trimmed. */
export function remoteCallDescription(type: 'offer' | 'answer', sdp: string | null): RTCSessionDescriptionInit {
    if (!sdp || !sdp.startsWith('v=0')) throw new Error('The call connection details are missing. Please start a new call.');
    return { type, sdp: sdp.replace(/\r\n|\r|\n/g, '\n').replace(/\n*$/, '').replace(/\n/g, '\r\n') + '\r\n' };
}

/** Prefer complete gathering, but an unreachable ICE server must not discard usable candidates. */
export async function gatheredDescription(pc: RTCPeerConnection): Promise<string> {
    const hasCandidates = () => /^a=candidate:/m.test(pc.localDescription?.sdp ?? '');
    if (pc.signalingState === 'closed') throw new Error('Call cancelled.');
    if (pc.iceGatheringState !== 'complete') await new Promise<void>((resolve, reject) => {
        const done = () => {
            clearTimeout(timer);
            pc.removeEventListener('icegatheringstatechange', check);
            pc.removeEventListener('signalingstatechange', closed);
        };
        const check = () => { if (pc.iceGatheringState === 'complete') { done(); resolve(); } };
        const closed = () => { if (pc.signalingState === 'closed') { done(); reject(new Error('Call cancelled.')); } };
        const timer = setTimeout(() => {
            done();
            // Host/STUN/relay candidates already in localDescription can still establish the call.
            if (hasCandidates()) resolve();
            else reject(new Error('Your browser could not find a connection address. Check that WebRTC is allowed by your browser or VPN, then try again.'));
        }, 15000);
        pc.addEventListener('icegatheringstatechange', check);
        pc.addEventListener('signalingstatechange', closed);
        check();
        closed();
    });
    if (!pc.localDescription?.sdp) throw new Error('Could not prepare the call.');
    if (!hasCandidates()) throw new Error('Your browser could not find a connection address. Check that WebRTC is allowed by your browser or VPN, then try again.');
    return pc.localDescription.sdp;
}
