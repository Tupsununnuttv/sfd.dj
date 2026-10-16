/** The longest voice message, in seconds (the server refuses more: App\Models\Whisper::VOICE_SECONDS). */
export const MAX_VOICE_SECONDS = 120;

/** What this browser can record: WebM or Ogg (Chrome, Edge, Firefox) or MP4 (Safari). Voice needs little: 32 kbit/s is clear and keeps a message small. */
const TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg', 'audio/mp4'];
const supportedType = () => (typeof MediaRecorder === 'undefined' ? undefined : TYPES.find((type) => MediaRecorder.isTypeSupported(type)));

/** Can this browser record (it also needs https, or localhost, for the microphone)? */
export const canRecordVoice = () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && !!supportedType();

export interface Recording {
    blob: Blob;
    seconds: number;
    extension: string; // for the file name the server is sent
}

/** A message for a microphone that could not be used. */
export const micProblem = (error: unknown): string => {
    const name = (error as { name?: string })?.name;
    if (name === 'NotAllowedError' || name === 'SecurityError') return 'Allow the microphone (the lock next to the address) to record a voice message.';
    if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No microphone was found.';

    return 'The microphone could not be used.';
};

/** One recording: start it, then stop it (you get the sound) or cancel it (it is thrown away). The microphone is released either way. */
export class VoiceRecorder {
    private stream: MediaStream | null = null;
    private recorder: MediaRecorder | null = null;
    private chunks: Blob[] = [];
    private startedAt = 0;
    private tick = 0;
    private audio: AudioContext | null = null;

    /** `onTick` says how long it has gone on (about five times a second), `onLevel` how loud it is now (0 to 1, about twelve times a second), `onLimit` that the longest message is reached. */
    async start(on: { onTick: (seconds: number) => void; onLevel: (level: number) => void; onLimit: () => void }): Promise<void> {
        const type = supportedType();
        if (!type) throw new Error('This browser cannot record sound.');

        this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        this.chunks = [];
        this.recorder = new MediaRecorder(this.stream, { mimeType: type, audioBitsPerSecond: 32_000 });
        this.recorder.ondataavailable = (event) => event.data.size > 0 && this.chunks.push(event.data);
        this.recorder.start(250);
        this.startedAt = Date.now();

        const analyser = (this.audio = new AudioContext()).createAnalyser();
        analyser.fftSize = 512;
        this.audio.createMediaStreamSource(this.stream).connect(analyser);
        const samples = new Uint8Array(analyser.fftSize);
        let ticks = 0;
        this.tick = window.setInterval(() => {
            const seconds = (Date.now() - this.startedAt) / 1000;
            if (++ticks % 3 === 0) on.onTick(seconds);
            analyser.getByteTimeDomainData(samples);
            on.onLevel(Math.min(1, Math.sqrt(samples.reduce((sum, v) => sum + ((v - 128) / 128) ** 2, 0) / samples.length) * 5));
            if (seconds >= MAX_VOICE_SECONDS) on.onLimit();
        }, 80);
    }

    /** Stop and hand over what was recorded. */
    stop(): Promise<Recording> {
        const recorder = this.recorder;
        const type = recorder?.mimeType || 'audio/webm';
        const seconds = Math.min(MAX_VOICE_SECONDS, Math.max(1, Math.round((Date.now() - this.startedAt) / 1000)));

        return new Promise((resolve, reject) => {
            if (!recorder) return reject(new Error('Nothing was recorded.'));
            recorder.onstop = () => {
                resolve({ blob: new Blob(this.chunks, { type }), seconds, extension: type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm' });
                this.release();
            };
            recorder.state === 'inactive' ? recorder.onstop(new Event('stop')) : recorder.stop();
        });
    }

    cancel() {
        if (this.recorder) this.recorder.onstop = null;
        if (this.recorder?.state !== 'inactive') this.recorder?.stop();
        this.release();
    }

    private release() {
        window.clearInterval(this.tick);
        this.stream?.getTracks().forEach((track) => track.stop());
        void this.audio?.close().catch(() => {});
        this.stream = this.recorder = this.audio = null;
    }
}
