import { Loader2, Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/** 0:07 or 1:02 */
export const voiceTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

const BARS = 32;
/** The same bars for the same message, so it looks the same on both sides (a recording is not analysed: these only show how far it has played). */
const heights = (id: number) => Array.from({ length: BARS }, (_, i) => 0.25 + 0.75 * Math.abs(Math.sin(id * 12.9898 + i * 4.1414) * 43758.5453 % 1));

let playing: HTMLAudioElement | null = null; // one voice message at a time

/** A voice message in a conversation: play and pause, how far it has got, and how long it is. The recording is fetched when it is first played (only the two people of the whisper may hear it). */
export default function VoiceBubble({ id, seconds, mine }: { id: number; seconds: number; mine: boolean }) {
    const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'paused' | 'error'>('idle');
    const [at, setAt] = useState(0);
    const audio = useRef<HTMLAudioElement | null>(null);
    const [problem, setProblem] = useState('');
    const bars = useRef(heights(id));

    useEffect(() => () => {
        audio.current?.pause();
        if (playing === audio.current) playing = null;
        if (audio.current) { audio.current.removeAttribute('src'); audio.current.load(); }
    }, []);

    const load = (): HTMLAudioElement => {
        if (audio.current) return audio.current;
        // Start play in the user's click, not after an asynchronous fetch (Safari loses user activation).
        const a = new Audio(route('api.whispers.audio', id));
        a.preload = 'none';
        a.addEventListener('timeupdate', () => setAt(Math.min(seconds, a.currentTime)));
        a.addEventListener('playing', () => { setState('playing'); setProblem(''); });
        a.addEventListener('pause', () => setState((s) => s === 'error' ? s : 'paused'));
        a.addEventListener('waiting', () => setState('loading'));
        a.addEventListener('error', () => { setState('error'); setProblem('Could not load this recording. Tap to retry.'); });
        a.addEventListener('ended', () => { setState('paused'); setAt(0); a.currentTime = 0; });
        audio.current = a;

        return a;
    };

    const toggle = async () => {
        try {
            const a = load();
            if (!a.paused) { a.pause(); setState('paused'); return; }
            if (playing && playing !== a) playing.pause(); // the one that was playing stops where it is
            playing = a;
            if (state === 'error') a.load();
            setState('loading');
            setProblem('');
            await a.play();
            setState('playing');
        } catch (error) {
            setState('error');
            setProblem(error instanceof DOMException && error.name === 'NotAllowedError' ? 'Playback was blocked. Tap to try again.' : 'Could not play this recording. Tap to retry.');
        }
    };

    // click a bar to go there (a recording that does not say how long it is cannot be moved in)
    const seek = (fraction: number) => {
        const a = audio.current;
        if (!a || !Number.isFinite(a.duration) || a.duration <= 0) return;
        a.currentTime = fraction * a.duration;
        setAt(a.currentTime);
    };

    const done = seconds > 0 ? at / seconds : 0;
    const running = state === 'playing';

    return (
        <div className="flex w-56 items-center gap-2.5 py-0.5 sm:w-64">
            <button
                type="button"
                onClick={toggle}
                disabled={state === 'loading'}
                aria-label={running ? 'Pause the voice message' : 'Play the voice message'}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${mine ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-violet-500/30 text-violet-100 hover:bg-violet-500/50'}`}
            >
                {state === 'loading' ? <Loader2 size={17} className="animate-spin" /> : running ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </button>
            <div className="min-w-0 flex-1">
                <div className="flex h-8 items-center gap-px" role="slider" tabIndex={0} onKeyDown={(e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); seek(Math.max(0, Math.min(1, (at + (e.key === 'ArrowRight' ? 5 : -5)) / Math.max(1, seconds)))); } }} aria-label="Voice message position" aria-valuemin={0} aria-valuemax={seconds} aria-valuenow={Math.round(at)}>
                    {bars.current.map((h, i) => (
                        <button
                            key={i}
                            type="button"
                            tabIndex={-1}
                            onClick={() => seek((i + 0.5) / BARS)}
                            style={{ height: `${Math.round(h * 100)}%` }}
                            className={`min-w-0 flex-1 rounded-full ${i / BARS < done ? (mine ? 'bg-white' : 'bg-violet-300') : mine ? 'bg-white/35' : 'bg-white/25'}`}
                        />
                    ))}
                </div>
                <p role={state === 'error' ? 'alert' : undefined} className={`text-[10px] tabular-nums ${state === 'error' ? 'text-red-300' : mine ? 'text-white/70' : 'text-neutral-400'}`}>{state === 'error' ? problem : voiceTime(state === 'idle' || state === 'loading' ? seconds : at)}{state !== 'idle' && state !== 'error' && state !== 'loading' && ` / ${voiceTime(seconds)}`}</p>
            </div>
        </div>
    );
}
