import { FLAT, clampTone, equalizerRequest, type Tone, type EqualizerStatus } from '@/lib/extensionEqualizer';
import { SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

const presets: [string, Tone][] = [['Flat', FLAT], ['Bass boost', { bass: 6, mid: 0, treble: 1 }], ['Vocals', { bass: -2, mid: 4, treble: 2 }], ['Warm', { bass: 3, mid: 0, treble: -3 }]];
function savedTone(): Tone {
    try {
        const saved = JSON.parse(localStorage.getItem('sfddj.equalizer') ?? 'null');
        if (saved && ['bass', 'mid', 'treble'].every(key => typeof saved[key] === 'number')) return { bass: clampTone(saved.bass), mid: clampTone(saved.mid), treble: clampTone(saved.treble) };
    } catch { /* unavailable storage */ }
    return { ...FLAT };
}

export default function AudioEqualizer() {
    const [open, setOpen] = useState(false);
    const [tone, setTone] = useState(savedTone);
    const [status, setStatus] = useState<EqualizerStatus>({ installed: false, active: false });
    const statusRef = useRef(status);
    statusRef.current = status;
    const [applying, setApplying] = useState(false);
    const [applyError, setApplyError] = useState('');
    const [appliedTone, setAppliedTone] = useState<Tone | null>(null);
    const alive = useRef(true);
    useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
    useEffect(() => {
        let alive = true;
        let checking = false;
        const update = (next: EqualizerStatus) => {
            if (!alive) return;
            if (!next.active) setAppliedTone(null);
            statusRef.current = next;
            setStatus(next);
        };
        const poll = async () => { if (checking) return; checking = true; try { update(await equalizerRequest('status')); } finally { checking = false; } };
        const push = (event: Event) => { const value = (event as CustomEvent).detail; if (value) update({ installed: value.installed === true, active: value.active === true, error: value.error }); };
        void poll();
        const timer = setInterval(poll, 2500);
        window.addEventListener('sfd-eq-state-v1', push);
        return () => { alive = false; clearInterval(timer); window.removeEventListener('sfd-eq-state-v1', push); if (statusRef.current.active) void equalizerRequest('stop'); };
    }, []);
    useEffect(() => {
        try { localStorage.setItem('sfddj.equalizer', JSON.stringify(tone)); } catch { /* private mode */ }
        setApplyError('');
    }, [tone]);
    const applied = status.active && appliedTone !== null && (['bass', 'mid', 'treble'] as const).every(band => tone[band] === appliedTone[band]);
    const apply = async () => {
        if (applying) return;
        setApplyError('');
        if (!statusRef.current.active) {
            setApplyError('Cannot apply: this player does not provide direct audio access. The music has not changed.');
            return;
        }
        const requested = { ...tone };
        setApplying(true);
        try {
            const result = await equalizerRequest('tone', requested);
            if (!alive.current) return;
            setStatus(result);
            statusRef.current = result;
            if (result.active && !result.error) setAppliedTone(requested);
            else {
                setAppliedTone(null);
                setApplyError(result.error || 'Audio processing is unavailable. These changes were not applied.');
            }
        } catch {
            if (alive.current) setApplyError('Could not apply the changes. Please try again.');
        } finally { if (alive.current) setApplying(false); }
    };
    const box = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const id = useId();
    useEffect(() => {
        if (!open) return;
        const outside = (event: PointerEvent) => { if (!box.current?.contains(event.target as Node)) setOpen(false); };
        const key = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus();
        };
        document.addEventListener('pointerdown', outside);
        document.addEventListener('keydown', key, true);
        return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', key, true); };
    }, [open]);

    return <div ref={box} className="sfd-equalizer relative shrink-0">
        <button ref={trigger} type="button" aria-label="Equalizer" title="Equalizer" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className={`sfd-equalizerbutton flex h-9 w-9 items-center justify-center rounded-xl border transition ${status.active ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200' : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white'}`}><SlidersHorizontal size={17} /></button>
        {open && <section id={id} aria-label="Equalizer settings" className="sfd-equalizerpanel absolute right-0 top-full z-50 mt-3 w-[min(20rem,calc(100vw-5rem))] rounded-2xl border border-white/10 bg-neutral-950 p-4 text-sm text-neutral-100 shadow-2xl">
            <div className="flex items-center justify-between gap-3"><h2 className="font-bold">Equalizer <span className={`ml-1 text-xs ${status.active ? 'text-cyan-300' : 'text-neutral-500'}`}>{status.active ? 'On' : 'Settings only'}</span></h2><button type="button" aria-label="Close equalizer" onClick={() => { setOpen(false); trigger.current?.focus(); }} className="rounded p-1 text-neutral-400 hover:text-white"><X size={16} /></button></div>
            <p role="status" className="my-3 text-xs leading-relaxed text-neutral-400">{status.active ? 'Adjust the sliders, then press Apply to change your sound.' : 'Settings are saved on this device. The current embedded player cannot apply them to audio yet.'}</p>
            {status.error && status.error !== applyError && <p role="alert" className="mb-3 text-xs text-amber-300">{status.error}</p>}
            <fieldset aria-label="Tone controls">
            <div className="mb-4 flex flex-wrap gap-1.5">{presets.map(([label, values]) => <button key={label} type="button" aria-pressed={Object.keys(FLAT).every(key => tone[key as keyof Tone] === values[key as keyof Tone])} onClick={() => setTone({ ...values })} className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/10 aria-pressed:border-cyan-400/50 aria-pressed:text-cyan-200">{label}</button>)}</div>
            {(['bass', 'mid', 'treble'] as const).map((band, index) => <label key={band} className="sfd-equalizerband mb-3 block"><span className="flex justify-between"><span>{['Bass', 'Mids', 'Treble'][index]}</span><span className="tabular-nums text-neutral-400">{tone[band] > 0 ? '+' : ''}{tone[band]} dB</span></span><input type="range" min={-12} max={12} step={1} value={tone[band]} aria-label={['Bass', 'Mids', 'Treble'][index]} aria-valuetext={`${tone[band]} decibels`} onChange={event => setTone(previous => ({ ...previous, [band]: Number(event.target.value) }))} className="mt-1 w-full accent-cyan-400" /></label>)}
            <div className="flex gap-2">
                <button type="button" onClick={apply} disabled={applying} className="sfd-equalizerapply flex-1 rounded-xl bg-cyan-500 px-3 py-2 font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-60">{applying ? 'Applying...' : 'Apply'}</button>
                <button type="button" onClick={() => setTone({ ...FLAT })} className="rounded-xl border border-white/10 px-3 py-2 hover:bg-white/10">Reset</button>
            </div>
            {applyError && <p role="alert" className="mt-3 text-xs leading-relaxed text-amber-300">{applyError}</p>}
            {applied && !applyError && <p role="status" className="mt-3 text-xs text-cyan-300">Applied to your audio.</p>}
            {status.active && !applied && !applyError && <p className="mt-3 text-xs text-neutral-500">Changes have not been applied. Press Apply.</p>}
            </fieldset>
            {status.active && <button type="button" onClick={async () => setStatus(await equalizerRequest('stop'))} className="mt-3 w-full rounded-xl bg-cyan-500 px-3 py-2 font-semibold text-black hover:bg-cyan-400">Turn off</button>}
        </section>}
    </div>;
}
