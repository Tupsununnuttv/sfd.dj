import type { Cosmetics, SubscriptionAppearance } from '@/lib/cosmetics';
import { perk, subscriptionVars, useSubscriptionStyle } from '@/lib/subscriptionStyle';
import { useEffect, useRef, useState } from 'react';

export function subscriptionEntrance(name: string, cosmetics?: Cosmetics | null) {
    if (cosmetics?.subscription) window.dispatchEvent(new CustomEvent('sfd:subscription-entrance', { detail: { name, style: cosmetics.subscription } }));
}
export function subscriptionReaction(name: string, style?: SubscriptionAppearance | null) {
    if (style) window.dispatchEvent(new CustomEvent('sfd:subscription-reaction', { detail: { name, style } }));
}

export default function SubscriptionRoomEffects({ host, dj, songId, entranceSounds = false }: { host?: Cosmetics | null; dj?: Cosmetics | null; songId?: number | null; entranceSounds?: boolean }) {
    const room = useSubscriptionStyle(host);
    const song = useSubscriptionStyle(dj);
    const [entrance, setEntrance] = useState<{ name: string; style: SubscriptionAppearance; id: number } | null>(null);
    const [reaction, setReaction] = useState<{ name: string; style: SubscriptionAppearance; id: number } | null>(null);
    const audio = useRef<AudioContext | null>(null);
    const entranceTimer = useRef(0);
    const reactionTimer = useRef(0);
    const lastEntrance = useRef(0);
    useEffect(() => {
        if (!entranceSounds || typeof AudioContext === 'undefined') return;
        const context = new AudioContext();
        audio.current = context;
        const unlock = () => { if (context.state === 'suspended') void context.resume().catch(() => {}); };
        unlock();
        window.addEventListener('pointerdown', unlock);
        window.addEventListener('keydown', unlock);
        return () => {
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
            audio.current = null;
            void context.close().catch(() => {});
        };
    }, [entranceSounds]);
    useEffect(() => {
        const join = (event: Event) => {
            const data = (event as CustomEvent<{ name: string; style: SubscriptionAppearance }>).detail;
            // Bound activity in busy rooms; reconnect storms must not create unbounded animations or audio.
            if (Date.now() - lastEntrance.current < 1500) return;
            lastEntrance.current = Date.now();
            setEntrance({ ...data, id: Date.now() });
            window.clearTimeout(entranceTimer.current);
            entranceTimer.current = window.setTimeout(() => setEntrance(null), 4000);
            if (audio.current?.state === 'running' && perk(data.style, 'sound') && !document.hidden) {
                const context = audio.current;
                const oscillator = context.createOscillator(); const gain = context.createGain();
                oscillator.type = perk(data.style, 'sound') === 'synth' ? 'triangle' : 'sine';
                const hz = perk(data.style, 'sound') === 'bell' ? 880 : perk(data.style, 'sound') === 'synth' ? 330 : 660;
                oscillator.frequency.setValueAtTime(hz, context.currentTime); oscillator.frequency.exponentialRampToValueAtTime(hz * 1.5, context.currentTime + 0.18);
                gain.gain.setValueAtTime(0.025, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35);
                oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.36);
            }
        };
        const react = (event: Event) => {
            setReaction({ ...(event as CustomEvent).detail, id: Date.now() });
            window.clearTimeout(reactionTimer.current); reactionTimer.current = window.setTimeout(() => setReaction(null), 1800);
        };
        window.addEventListener('sfd:subscription-entrance', join); window.addEventListener('sfd:subscription-reaction', react);
        return () => { window.removeEventListener('sfd:subscription-entrance', join); window.removeEventListener('sfd:subscription-reaction', react); window.clearTimeout(entranceTimer.current); window.clearTimeout(reactionTimer.current); };
    }, []);
    return <>
        <div className="sub-room-effects pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden style={subscriptionVars(room)} data-lobby-effect={perk(room, 'lobby') || undefined} data-particles={perk(room, 'particles') || undefined}>
            {(perk(room, 'particles') || perk(room, 'lobby')) && Array.from({ length: 12 }, (_, index) => <i key={index} style={{ left: `${(index * 37) % 100}%`, animationDelay: `${index * -0.7}s`, animationDuration: `${8 + index % 4}s` }}>{perk(room, 'particles') === 'snow' ? '❄' : perk(room, 'lobby') === 'notes' ? '♫' : '✦'}</i>)}
        </div>
        {(perk(room, 'banner') || perk(room, 'announcement')) && <div className="sub-room-banner relative z-10 border-y border-white/10 bg-black/70 px-4 py-2 text-center text-xs" style={subscriptionVars(room)}>{perk(room, 'banner') && <p className="sub-banner-text font-semibold">{perk(room, 'banner')}</p>}{perk(room, 'announcement') && <p className="mt-1 text-neutral-300">{perk(room, 'announcement')}</p>}</div>}
        {songId && <div key={songId} className="sub-song-effect pointer-events-none absolute inset-0 z-10 overflow-hidden" data-effect={perk(song, 'song') || undefined} data-transition={perk(song, 'transition') || undefined} data-spotlight={song?.dj_spotlight || undefined} style={subscriptionVars(song)} aria-hidden>{perk(song, 'song') && Array.from({ length: 8 }, (_, index) => <i key={index} style={{ left: `${10 + index * 11}%`, animationDelay: `${index * 0.14}s` }}>{perk(song, 'song') === 'notes' ? '♫' : perk(song, 'song') === 'hearts' ? '♥' : '✦'}</i>)}</div>}
        {songId && perk(song, 'dedication') && <p className="relative z-10 bg-black/50 px-4 py-1 text-center text-xs text-violet-200">♫ Dedicated to {perk(song, 'dedication')}</p>}
        {entrance && (perk(entrance.style, 'join') || perk(entrance.style, 'entrance') || perk(entrance.style, 'join_message')) && <div key={entrance.id} className="sub-entrance pointer-events-none absolute left-1/2 top-28 z-30 w-[min(28rem,90%)] -translate-x-1/2 rounded-2xl border border-white/20 bg-neutral-950/90 p-5 text-center shadow-xl" style={subscriptionVars(entrance.style)} data-effect={perk(entrance.style, 'entrance') || perk(entrance.style, 'join')} data-aura={entrance.style.entrance_aura || undefined} role="status"><strong className="text-sm">{entrance.name}</strong><p className="mt-1 text-xs text-neutral-300">{perk(entrance.style, 'join_message') || 'Joined the room'}</p></div>}
        {reaction && (perk(reaction.style, 'song_reaction') || perk(reaction.style, 'reaction')) && <div key={reaction.id} className="sub-song-reaction pointer-events-none absolute left-1/2 top-1/3 z-30 text-center" data-animation={perk(reaction.style, 'reaction')}><span className="text-5xl">{perk(reaction.style, 'song_reaction') || '✨'}</span><p className="mt-2 rounded bg-black/80 px-2 text-xs">{reaction.name}</p></div>}
    </>;
}
