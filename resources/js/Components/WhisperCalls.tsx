import { callMedia, gatheredDescription, remoteCallDescription } from '@/lib/calls';
import { getJson, send, sendJson } from '@/lib/post';
import { router } from '@inertiajs/react';
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Call {
    id: string; caller_id: number; callee_id: number; video: boolean;
    status: 'ringing' | 'active' | 'ended'; offer: string | null; answer: string | null;
    peer: { id: number; name: string };
}

function Media({ stream, muted = false, video = true }: { stream: MediaStream | null; muted?: boolean; video?: boolean }) {
    const ref = useRef<HTMLVideoElement>(null);
    const [blocked, setBlocked] = useState(false);
    useEffect(() => {
        if (ref.current) { ref.current.srcObject = stream; if (stream) void ref.current.play().catch(() => setBlocked(true)); }
    }, [stream]);
    return <div className="relative"><video ref={ref} autoPlay playsInline muted={muted} className={video ? 'max-h-64 w-full rounded-xl bg-black object-contain' : 'hidden'} />{blocked && <button onClick={() => void ref.current?.play().then(() => setBlocked(false))} className="rounded-xl bg-white/10 p-3 text-sm text-white">Tap to hear the call</button>}</div>;
}

/** Mounted once above page navigation. Only this tab owns its media and heartbeat. */
export default function WhisperCalls({ initialUser }: { initialUser: number | null }) {
    const [me, setMe] = useState(initialUser);
    const [call, setCall] = useState<Call | null>(null);
    const [local, setLocal] = useState<MediaStream | null>(null);
    const [remote, setRemote] = useState<MediaStream | null>(null);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [muted, setMuted] = useState(false);
    const [cameraOff, setCameraOff] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const current = useRef<Call | null>(null);
    const owned = useRef<string | null>(null);
    const pc = useRef<RTCPeerConnection | null>(null);
    const media = useRef<MediaStream | null>(null);
    const operation = useRef(0);
    const working = useRef(false);
    const connectedAt = useRef<number | null>(null);
    const connectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const alive = useRef(true);
    const setCurrent = (next: Call | null) => { current.current = next; setCall(next); };
    const cleanup = () => {
        operation.current++;
        owned.current = null;
        if (connectionTimer.current) clearTimeout(connectionTimer.current);
        connectionTimer.current = null;
        pc.current?.close(); pc.current = null;
        media.current?.getTracks().forEach((t) => t.stop()); media.current = null;
        connectedAt.current = null;
        setLocal(null); setRemote(null); setMuted(false); setCameraOff(false); setSeconds(0);
    };
    const end = async () => {
        const previous = current.current;
        cleanup(); setCurrent(null); setStatus('');
        if (previous) await send('PATCH', route('calls.update', previous.id), { action: 'end' }, { keepalive: true }).catch(() => {});
    };
    const prepare = async (video: boolean) => {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) throw new Error('Calls need HTTPS and a browser with microphone support.');
        const generation = operation.current;
        const config = await getJson<RTCConfiguration>(route('calls.config'));
        if (!alive.current || generation !== operation.current) throw new Error('Call cancelled.');
        const stream = await callMedia(navigator.mediaDevices, video);
        if (!alive.current || generation !== operation.current) { stream.getTracks().forEach((t) => t.stop()); throw new Error('Call cancelled.'); }
        media.current = stream; setLocal(stream);
        const connection = new RTCPeerConnection(config); pc.current = connection;
        stream.getTracks().forEach((track) => connection.addTrack(track, stream));
        if (video && stream.getVideoTracks().length === 0) {
            connection.addTransceiver('video', { direction: 'recvonly' });
            setCameraOff(true);
        }
        connection.ontrack = (event) => setRemote(new MediaStream(event.streams[0]?.getTracks() ?? [event.track]));
        connection.onconnectionstatechange = () => {
            if (pc.current !== connection) return;
            if (connection.connectionState === 'connected') {
                if (connectionTimer.current) clearTimeout(connectionTimer.current);
                connectionTimer.current = null;
                setStatus('Connected'); connectedAt.current ??= Date.now();
            }
            if (connection.connectionState === 'disconnected') {
                setStatus('Reconnecting…');
                if (!connectionTimer.current) connectionTimer.current = setTimeout(() => { setError('The connection was lost.'); void end(); }, 20000);
            }
            if (connection.connectionState === 'failed') { setError('Connection failed. Try again on another network.'); void end(); }
        };
        return connection;
    };
    const fail = async (reason: unknown) => { setError(reason instanceof Error ? reason.message : 'The call could not connect.'); await end(); };
    const start = async (user: { id: number; name: string }, video: boolean) => {
        if (working.current || current.current || !me) return;
        working.current = true; setBusy(true); setError(''); setStatus('Calling…');
        const generation = operation.current;
        try {
            const result = await sendJson<{ call: Call }>('POST', route('calls.store'), { user_id: user.id, video });
            if (generation !== operation.current || !alive.current) { await send('PATCH', route('calls.update', result.call.id), { action: 'end' }); return; }
            owned.current = result.call.id;
            setCurrent(result.call); setStatus('Ringing — waiting for an answer…');
        } catch (e) { if (generation === operation.current) await fail(e); }
        finally { working.current = false; setBusy(false); }
    };
    const accept = async () => {
        const incoming = current.current;
        if (!incoming || working.current || pc.current) return;
        working.current = true; setBusy(true); setError(''); setStatus('Accepting…');
        const generation = operation.current;
        try {
            const result = await sendJson<{ call: Call }>('PATCH', route('calls.update', incoming.id), { action: 'accept' });
            if (generation !== operation.current || !alive.current) return;
            owned.current = incoming.id;
            setCurrent(result.call); setStatus('Accepted — preparing the connection…');
        } catch (e) {
            // A different tab may have answered first. Stop only this tab's devices.
            setError(e instanceof Error ? e.message : 'Could not answer the call.');
            cleanup(); setCurrent(null); setStatus('');
        }
        finally { working.current = false; setBusy(false); }
    };

    const connect = async (active: Call) => {
        if (working.current || pc.current || owned.current !== active.id) return;
        const caller = active.caller_id === me;
        if (!caller && !active.offer) return;
        const generation = operation.current;
        working.current = true; setBusy(true); setStatus('Preparing your devices…');
        try {
            const connection = await prepare(active.video);
            if (caller) await connection.setLocalDescription(await connection.createOffer());
            else {
                await connection.setRemoteDescription(remoteCallDescription('offer', active.offer));
                await connection.setLocalDescription(await connection.createAnswer());
            }
            setStatus('Preparing the connection…');
            const sdp = await gatheredDescription(connection);
            if (generation !== operation.current) return;
            await send('PATCH', route('calls.update', active.id), caller ? { action: 'offer', offer: sdp } : { action: 'answer', answer: sdp });
            if (generation !== operation.current) return;
            if (!connectedAt.current) {
                setStatus('Connecting…');
                connectionTimer.current = setTimeout(() => { setError('Could not connect. Please try again.'); void end(); }, 45000);
            }
        } catch (e) { if (generation === operation.current) await fail(e); }
        finally { working.current = false; setBusy(false); }
    };

    useEffect(() => router.on('navigate', (event) => {
        const auth = (event.detail.page.props as { auth?: { user?: { id: number }; guest?: boolean } }).auth;
        setMe(auth?.guest ? null : auth?.user?.id ?? null);
    }), []);

    useEffect(() => {
        if (!me) { void end(); return; }
        let polling = false;
        let cancelled = false;
        const poll = async () => {
            if (polling) return;
            polling = true;
            const generation = operation.current;
            try {
                const snapshot = current.current;
                if (snapshot && owned.current === snapshot.id) await send('PATCH', route('calls.update', snapshot.id), { action: 'heartbeat' }).catch(() => {});
                const result = await getJson<{ call: Call | null }>(route('calls.index'));
                if (cancelled || generation !== operation.current) return;
                if (!result.call && snapshot && current.current?.id === snapshot.id) { cleanup(); setCurrent(null); setStatus(''); setError('Call ended or was not answered.'); }
                else if (result.call && !working.current) {
                    // Another tab may own an active call. Never end or take it over from this tab.
                    if (owned.current !== result.call.id && (result.call.status === 'active' || result.call.caller_id === me)) {
                        if (snapshot) { cleanup(); setCurrent(null); setStatus(''); }
                        return;
                    }
                    setCurrent(result.call);
                    if (result.call.caller_id !== me && result.call.status === 'ringing') setStatus(`Incoming ${result.call.video ? 'video' : 'voice'} call`);
                    if (result.call.status === 'active' && !pc.current) void connect(result.call);
                    if (result.call.answer && pc.current && !pc.current.remoteDescription) {
                        await pc.current.setRemoteDescription(remoteCallDescription('answer', result.call.answer));
                        setStatus('Connecting…');
                        if (!connectedAt.current && !connectionTimer.current) connectionTimer.current = setTimeout(() => { setError('Could not connect. Try another network.'); void end(); }, 30000);
                    }
                }
            } catch (e) {
                if (current.current && !cancelled) setStatus('Connection interrupted. Retrying…');
            } finally { polling = false; }
        };
        void poll();
        const timer = setInterval(() => { void poll(); if (connectedAt.current) setSeconds(Math.floor((Date.now() - connectedAt.current) / 1000)); }, 2000);
        const request = (event: MessageEvent) => {
            if (event.origin !== window.location.origin || event.data?.type !== 'sfd-whisper-call') return;
            if (!Number.isInteger(event.data.user?.id) || typeof event.data.video !== 'boolean') return;
            if (current.current || working.current) { setError('End your current call before starting another.'); return; }
            void start(event.data.user, event.data.video);
        };
        window.addEventListener('message', request);
        return () => { cancelled = true; clearInterval(timer); window.removeEventListener('message', request); };
    }, [me]);

    useEffect(() => {
        alive.current = true;
        const leave = () => { if (owned.current || pc.current || working.current) void end(); else { cleanup(); setCurrent(null); } };
        window.addEventListener('pagehide', leave);
        return () => { alive.current = false; window.removeEventListener('pagehide', leave); leave(); };
    }, []);

    const incoming = call?.caller_id !== me && call?.status === 'ringing' && !local;
    useEffect(() => {
        if (!incoming) return;
        const context = new AudioContext();
        const ring = () => {
            if (context.state !== 'running') return;
            for (const offset of [0, .3]) {
                const tone = context.createOscillator();
                const volume = context.createGain();
                const at = context.currentTime + offset;
                tone.frequency.value = 660;
                volume.gain.setValueAtTime(0, at);
                volume.gain.linearRampToValueAtTime(.07, at + .02);
                volume.gain.linearRampToValueAtTime(0, at + .2);
                tone.connect(volume); volume.connect(context.destination);
                tone.start(at); tone.stop(at + .22);
            }
        };
        const unlock = () => { void context.resume().then(ring).catch(() => {}); };
        unlock();
        const timer = setInterval(ring, 2500);
        window.addEventListener('pointerdown', unlock);
        window.addEventListener('keydown', unlock);
        return () => {
            clearInterval(timer);
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
            void context.close().catch(() => {});
        };
    }, [incoming, call?.id]);

    if (!call && !busy && !error) return null;
    return <section role="dialog" aria-label="Whisper call" aria-live="polite" className="fixed bottom-4 right-4 z-[200] max-h-[90dvh] w-[calc(100vw-2rem)] max-w-sm overflow-y-auto rounded-2xl border border-violet-400/30 bg-neutral-950 p-5 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-3"><div><h2 className="font-bold">{call?.peer?.name ?? 'Whisper call'}</h2><p className="mt-1 text-sm text-violet-200">{status}{seconds > 0 && ` · ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`}</p></div>{!call && !busy && <button aria-label="Dismiss call notice" onClick={() => setError('')}><X size={18} /></button>}</div>
        {error && <p role="alert" className="mt-3 text-sm text-amber-200">{error}</p>}
        {(remote || local) && <div className="mt-4 space-y-2">{remote && <Media stream={remote} video={!!call?.video && remote.getVideoTracks().length > 0} />}{call?.video && !!local?.getVideoTracks().length && <div className="ml-auto w-28"><Media stream={local} muted /></div>}</div>}
        {call?.video && local && local.getVideoTracks().length === 0 && <p className="mt-3 text-xs text-neutral-400">Joined without a camera. You can still talk and watch the other person's video.</p>}
        {incoming && <p className="mt-3 text-xs text-neutral-400">Your microphone will only turn on after you accept.{call?.video ? ' A camera is optional; you can join with audio only if it is unavailable or you decline camera access.' : ''}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
            {incoming && <button disabled={busy} onClick={() => void accept()} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"><Phone size={17} /> Accept</button>}
            {local && <><button aria-label={muted ? 'Unmute microphone' : 'Mute microphone'} aria-pressed={muted} onClick={() => { media.current?.getAudioTracks().forEach((t) => { t.enabled = muted; }); setMuted(!muted); }} className="rounded-xl bg-white/10 p-3">{muted ? <MicOff size={18} /> : <Mic size={18} />}</button>{call?.video && !!local.getVideoTracks().length && <button aria-label={cameraOff ? 'Turn camera on' : 'Turn camera off'} aria-pressed={cameraOff} onClick={() => { media.current?.getVideoTracks().forEach((t) => { t.enabled = cameraOff; }); setCameraOff(!cameraOff); }} className="rounded-xl bg-white/10 p-3">{cameraOff ? <VideoOff size={18} /> : <Video size={18} />}</button>}</>}
            {(call || busy) && <button onClick={() => void end()} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold"><PhoneOff size={17} />{incoming ? 'Decline' : 'End call'}</button>}
        </div>
    </section>;
}

