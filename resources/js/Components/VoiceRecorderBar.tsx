import { voiceTime } from '@/Components/VoiceBubble';
import { MAX_VOICE_SECONDS, micProblem, Recording, VoiceRecorder } from '@/lib/voiceRecorder';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const BARS = 36;

/**
 * The strip that takes the place of the text box while a voice message is being recorded: throw it away, or send it. It starts recording as soon as it appears
 * (asking for the microphone the first time) and stops by itself at the longest message. `onSend` answers when the message has been sent; if it throws, the strip closes.
 */
export default function VoiceRecorderBar({ onSend, onCancel, onProblem }: { onSend: (recording: Recording) => Promise<void>; onCancel: () => void; onProblem: (message: string) => void }) {
    const recorder = useRef(new VoiceRecorder());
    const [seconds, setSeconds] = useState(0);
    const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0));
    const [live, setLive] = useState(false);
    const [sending, setSending] = useState(false);
    const busy = useRef(false);
    const keep = useRef({ onSend, onCancel, onProblem });
    keep.current = { onSend, onCancel, onProblem };

    const send = async () => {
        if (busy.current) return;
        busy.current = true;
        setSending(true);
        try {
            await keep.current.onSend(await recorder.current.stop());
        } catch (error) {
            keep.current.onProblem((error as Error).message);
            keep.current.onCancel();
        }
    };

    useEffect(() => {
        const mine = recorder.current;
        let alive = true;
        mine.start({
            onTick: (s) => alive && setSeconds(s),
            onLevel: (level) => alive && setLevels((previous) => [...previous.slice(1), level]),
            onLimit: () => alive && void send(),
        }).then(() => alive && setLive(true)).catch((error) => { if (alive) { keep.current.onProblem(micProblem(error)); keep.current.onCancel(); } });

        return () => { alive = false; mine.cancel(); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps -- once: the recording lasts as long as the strip does

    return (
        <div className="flex items-center gap-3 p-3" role="group" aria-label="Recording a voice message">
            <button type="button" onClick={() => keep.current.onCancel()} disabled={sending} aria-label="Throw the recording away" title="Throw it away" className="rounded-lg p-2.5 text-neutral-400 transition hover:bg-red-500/15 hover:text-red-300 disabled:opacity-40"><Trash2 size={18} /></button>
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-white/6 px-3 py-2">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${live ? 'animate-pulse bg-red-500' : 'bg-neutral-600'}`} aria-hidden />
                <span className="w-10 shrink-0 text-sm font-semibold tabular-nums">{voiceTime(seconds)}</span>
                <div className="flex h-7 min-w-0 flex-1 items-center gap-px" aria-hidden>
                    {levels.map((level, i) => <span key={i} style={{ height: `${Math.max(8, Math.round(level * 100))}%` }} className="min-w-0 flex-1 rounded-full bg-linear-to-t from-fuchsia-500 to-violet-400" />)}
                </div>
                <span className="hidden shrink-0 text-[11px] text-neutral-500 sm:block">{live ? `max ${voiceTime(MAX_VOICE_SECONDS)}` : 'Allow the microphone…'}</span>
            </div>
            <button type="button" onClick={send} disabled={!live || sending || seconds < 0.5} aria-label="Send the voice message" className="rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 p-2.5 text-white transition hover:opacity-90 disabled:opacity-40">{sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}</button>
        </div>
    );
}
