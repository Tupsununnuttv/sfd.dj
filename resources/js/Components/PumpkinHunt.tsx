import { CoinIcon } from '@/Components/CoinIcon';
import { embedded } from '@/lib/embed';
import { getJson, sendJson } from '@/lib/post';
import { formatDate } from '@/lib/regional';
import type { PageProps } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowUpRight, Check, ChevronDown, Gift, LoaderCircle, Sparkles, X } from 'lucide-react';
import { CSSProperties, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../css/pumpkin-hunt.css';

interface Pumpkin { id: number; token: string; seed: number }
interface HuntState {
    active: boolean;
    season: string | null;
    ends_at: string | null;
    total: number;
    found: number;
    collected: number[];
    per_pumpkin: number;
    completion_bonus: number;
    coins: number;
    pumpkins: Pumpkin[];
    encounter_ids: number[];
    locations: { page: string; label: string; found: number; total: number }[];
}
interface Claim { state: HuntState; awarded: number; bonus: number; coins: number; already_claimed: boolean }
type HuntProps = PageProps<{ room?: { slug: string }; roomReleases?: { features: string[] } }>;

const pages: Record<string, string> = { Dashboard: 'dashboard', Community: 'community', Events: 'events', Shop: 'shop', Playlists: 'playlists', History: 'history', Faq: 'faq', Docs: 'docs', PatchNotes: 'patch-notes' };
const locationRoutes: Record<string, string> = { dashboard: 'dashboard', community: 'community', events: 'events', shop: 'shop', playlists: 'playlists' };
const clues: Record<string, string> = { dashboard: 'Where the rooms come alive', community: 'Among familiar faces', events: 'Where the next party begins', shop: 'Between the costumes', playlists: 'Where your next set is waiting' };

/** A hand-drawn lantern; each face belongs to one collectible and keeps its shape after navigation. */
export function PumpkinHead({ face = 0, className = '' }: { face?: number; className?: string }) {
    const id = useId().replace(/:/g, '');
    return <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
        <defs>
            <radialGradient id={`${id}skin`} cx=".38" cy=".25" r=".85"><stop stopColor="#ffc25b" /><stop offset=".4" stopColor="#f77b1e" /><stop offset="1" stopColor="#9e2c12" /></radialGradient>
            <linearGradient id={`${id}stem`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a5ae49" /><stop offset="1" stopColor="#44512c" /></linearGradient>
            <radialGradient id={`${id}light`}><stop stopColor="#fff8a7" /><stop offset="1" stopColor="#ffbe34" /></radialGradient>
        </defs>
        <ellipse cx="40" cy="73" rx="27" ry="3.5" fill="#000" opacity=".3" />
        <path d="M37 24c-4-10-1-17 6-19l6 5c-7 1-8 6-6 15" fill={`url(#${id}stem)`} stroke="#394026" strokeWidth="2" />
        <path d="M45 16c7-9 18-5 20 0-8 4-15 3-20 0" fill="#829442" /><path d="M46 16l14-1" stroke="#d1c36b" strokeWidth="1.4" />
        <ellipse cx="25" cy="47" rx="19" ry="25" fill={`url(#${id}skin)`} stroke="#a34017" strokeWidth="1.5" />
        <ellipse cx="55" cy="47" rx="19" ry="25" fill={`url(#${id}skin)`} stroke="#a34017" strokeWidth="1.5" />
        <ellipse cx="40" cy="47" rx="21" ry="27" fill={`url(#${id}skin)`} stroke="#b34615" strokeWidth="1.5" />
        <path d="M28 27c-7 10-9 27-3 38M51 27c8 10 10 27 4 38M40 23v45" fill="none" stroke="#b44518" strokeOpacity=".42" strokeWidth="2" />
        <path d="M16 38c2-6 5-9 9-10" fill="none" stroke="#ffda8a" strokeOpacity=".65" strokeWidth="2.7" strokeLinecap="round" />
        <g fill={`url(#${id}light)`} stroke="#7b2c12" strokeWidth="1.8" strokeLinejoin="round">
            {face % 3 === 0 ? <><path d="m21 43 12-9 3 13z" /><path d="m59 43-12-9-3 13z" /><path d="m20 53 10 4 2-4 8 7 8-7 2 4 10-4c-5 18-35 18-40 0Z" /></> : face % 3 === 1 ? <><path d="M21 44q6-15 14 0Z" /><path d="M45 44q8-15 14 0Z" /><path d="M23 54q17 20 34 0l-8 2-2 6-7-2-7 2-2-6Z" /></> : <><path d="m21 37 15 7-13 3Z" /><path d="m59 37-15 7 13 3Z" /><path d="m22 55 8 3 4-4 6 7 6-7 4 4 8-3q-18 22-36 0Z" /></>}
            <path d="m40 46-4 7h8Z" />
        </g>
    </svg>;
}

/** Empty hosts sit in the existing seams between page sections, never above a control. */
export function PumpkinPerch({ spot }: { spot: number }) {
    return <div className="sfd-pumpkin-perch" data-pumpkin-spot={spot} />;
}

export default function PumpkinHunt() {
    const page = usePage<HuntProps>();
    const { auth, verification, room, roomReleases } = page.props;
    const isRoom = page.component === 'Room';
    const roomAllowed = isRoom && roomReleases?.features.includes('pumpkin_hunt') === true;
    const pageKey = pages[page.component];
    const enabled = !embedded && !auth.guest && auth.user.id > 0 && !(auth.user as typeof auth.user & { is_bot?: boolean }).is_bot && !verification?.required && (!!pageKey || roomAllowed);
    const contextKey = enabled ? `${auth.user.id}:${isRoom ? `room:${room?.slug}` : pageKey}` : '';
    const [state, setState] = useState<HuntState | null>(null);
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState<number | null>(null);
    const [message, setMessage] = useState<{ text: string; error?: boolean; complete?: boolean } | null>(null);
    const [refresh, setRefresh] = useState(0);
    const [hosts, setHosts] = useState<HTMLElement[]>([]);
    const [control, setControl] = useState<HTMLElement | null>(null);
    const [panelHost, setPanelHost] = useState<HTMLElement | null>(null);
    const currentContext = useRef(contextKey);
    const contextGeneration = useRef(0);
    if (currentContext.current !== contextKey) contextGeneration.current++;
    currentContext.current = contextKey;
    const inFlight = useRef(false);
    const request = useRef<AbortController | null>(null);
    const box = useRef<HTMLDivElement>(null);
    const mounted = useRef(true);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current?.abort(); }; }, []);

    useEffect(() => {
        setState(null);
        setMessage(null);
        setOpen(false);
        setBusy(null);
        inFlight.current = false;
    }, [contextKey]);

    useEffect(() => {
        if (!enabled || (isRoom && !room?.slug)) return;
        const abort = new AbortController();
        request.current?.abort();
        request.current = abort;
        const query = isRoom ? `room_slug=${encodeURIComponent(room!.slug)}` : `page=${encodeURIComponent(pageKey)}`;
        getJson<HuntState>(`${route('pumpkin-hunt.show')}?${query}`, { signal: abort.signal }).then(result => {
            if (!abort.signal.aborted && currentContext.current === contextKey) setState(result);
        }).catch(() => { /* Seasonal decorations stay quiet if unavailable; ordinary pages keep working. */ });
        return () => abort.abort();
    }, [contextKey, refresh]);

    useEffect(() => {
        if (!enabled) return;
        let lastRefresh = 0;
        const update = () => {
            if (document.visibilityState !== 'visible' || Date.now() - lastRefresh < 1000 || inFlight.current) return;
            lastRefresh = Date.now();
            setRefresh(n => n + 1);
        };
        const storage = (event: StorageEvent) => { if (event.key === 'sfddj.pumpkin-hunt') update(); };
        window.addEventListener('focus', update);
        window.addEventListener('sfd:pumpkin-hunt', update);
        window.addEventListener('storage', storage);
        document.addEventListener('visibilitychange', update);
        return () => {
            window.removeEventListener('focus', update);
            window.removeEventListener('sfd:pumpkin-hunt', update);
            window.removeEventListener('storage', storage);
            document.removeEventListener('visibilitychange', update);
        };
    }, [enabled]);

    useEffect(() => {
        if (!enabled || !state?.active) { setHosts([]); setControl(null); setPanelHost(null); return; }
        const scan = () => {
            const scope = document.querySelector<HTMLElement>(isRoom ? '[data-pumpkin-room-context]' : '[data-pumpkin-content]');
            if (!scope) return;
            const found = [...scope.querySelectorAll<HTMLElement>('[data-pumpkin-spot]')];
            setHosts(previous => previous.length === found.length && previous.every((item, i) => item === found[i]) ? previous : found);
            setControl(scope.querySelector('[data-pumpkin-control]'));
            setPanelHost(scope.querySelector('[data-pumpkin-panel]'));
        };
        scan();
        // Some page cards appear after lazy content loads; roots/anchors retain their identity.
        const observer = new MutationObserver(scan);
        observer.observe(document.body, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, [enabled, state?.active, contextKey, isRoom]);

    useEffect(() => {
        if (!open) return;
        const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); control?.querySelector('button')?.focus(); } };
        window.addEventListener('keydown', escape);
        return () => window.removeEventListener('keydown', escape);
    }, [open, control]);

    const claim = async (pumpkin: Pumpkin) => {
        if (inFlight.current || !state?.active) return;
        const context = contextKey;
        const generation = contextGeneration.current;
        const controller = new AbortController();
        request.current?.abort(); // An earlier GET must not overwrite this claim's fresh progress.
        inFlight.current = true;
        setBusy(pumpkin.id);
        setMessage(null);
        try {
            const result = await sendJson<Claim>('POST', route('pumpkin-hunt.claim'), { token: pumpkin.token }, { signal: controller.signal });
            try { localStorage.setItem('sfddj.pumpkin-hunt', `${Date.now()}:${result.state.found}`); } catch { /* Private mode. */ }
            window.dispatchEvent(new Event('sfd:pumpkin-hunt'));
            // A claim can finish after navigation. The reward is still saved, but belongs to its own page.
            if (!mounted.current) return;
            if (currentContext.current !== context || contextGeneration.current !== generation) { setRefresh(n => n + 1); return; }
            setState(result.state);
            const total = result.awarded + result.bonus;
            setMessage({ text: result.already_claimed ? 'This pumpkin is already in your collection.' : result.bonus > 0 ? `All 20 found! +${total} SFD Coins. Your Pumpkin Hunter achievement is unlocked.` : `Pumpkin found! +${total} SFD Coins`, complete: result.bonus > 0 });
            if (result.bonus > 0) setOpen(true);
            router.reload({ only: ['auth', 'coins', 'history'], showProgress: false });
        } catch (error) {
            if (mounted.current && currentContext.current === context && contextGeneration.current === generation) setMessage({ text: error instanceof Error ? error.message : 'The pumpkin could not be collected. Please try again.', error: true });
        } finally {
            if (mounted.current && currentContext.current === context && contextGeneration.current === generation) { inFlight.current = false; setBusy(null); }
        }
    };

    if (!enabled || !state?.active || !control) return null;
    const complete = state.found >= state.total;
    // Sort IDs before assigning unique perches: collecting one must not move the others.
    const placements = Array.from({ length: state.total }, (_, index) => index + 1).sort((a, b) => a - b);
    const currentIds = state.encounter_ids;
    const huntPanel = <section ref={box} id="pumpkin-hunt-panel" aria-label="Halloween pumpkin hunt" className={`sfd-hunt-panel ${message?.complete ? 'sfd-hunt-complete' : ''}`}>
        <div className="sfd-hunt-intro">
            <div className="sfd-hunt-emblem"><PumpkinHead face={1} /><span aria-hidden="true">✦</span></div>
            <div className="min-w-0 flex-1"><p className="sfd-hunt-eyebrow">A little mischief, a little magic</p><h2>{complete ? 'The whole patch is yours!' : 'The great pumpkin hunt'}</h2><p>20 little lanterns have escaped across SFD.DJ. Find them, give them a tap, and pocket a treat.</p></div>
            <button type="button" className="sfd-hunt-close" onClick={() => setOpen(false)} aria-label="Close pumpkin hunt"><X size={17} /></button>
        </div>
        <div className="sfd-hunt-rewards"><span><CoinIcon /> {state.per_pumpkin} coins for every find</span><span><Gift size={15} /> +{state.completion_bonus} when you find them all</span><strong>{state.total * state.per_pumpkin + state.completion_bonus} SFD Coins in total</strong></div>
        <div className="sfd-hunt-progressline"><strong>{state.found}<span> / {state.total} found</span></strong><span>{state.ends_at ? <>Until {formatDate(new Date(new Date(`${state.ends_at.slice(0, 10)}T00:00:00Z`).getTime() - 1), { day: 'numeric', month: 'long', timeZone: 'UTC' })}</> : 'Halloween event'}</span></div>
        <div className="sfd-hunt-progress" role="progressbar" aria-label="Pumpkins collected" aria-valuenow={state.found} aria-valuemin={0} aria-valuemax={state.total}><span style={{ width: `${state.found / state.total * 100}%` }} /></div>
        <div className="sfd-hunt-collection" aria-label="Your pumpkin collection">{placements.map(id => <span key={id} className={state.collected.includes(id) ? 'is-collected' : ''} title={state.collected.includes(id) ? `Pumpkin ${id}: found` : `Pumpkin ${id}: still hiding`}><PumpkinHead face={id} />{state.collected.includes(id) && <Check size={10} />}</span>)}</div>
        <div className="sfd-hunt-clues"><h3><Sparkles size={14} /> Follow the orange glow</h3>{state.locations.map(location => <Link key={location.page} href={route(locationRoutes[location.page] ?? 'dashboard')} onClick={() => setOpen(false)} className={location.found >= location.total ? 'is-finished' : ''}><span><strong>{location.label}</strong><small>{clues[location.page]}</small></span><span>{location.found}/{location.total} {location.found >= location.total ? <Check size={14} /> : <ArrowUpRight size={14} />}</span></Link>)}</div>
        <p className="sfd-hunt-footnote">Your finds are saved to your account. Each pumpkin rewards you once this Halloween.</p>
    </section>;

    return <>
        {createPortal(<button type="button" className={`sfd-hunt-launcher ${complete ? 'is-complete' : ''}`} aria-expanded={open} aria-controls="pumpkin-hunt-panel" onClick={() => setOpen(value => !value)}><PumpkinHead face={1} /><span><strong>{complete ? 'Pumpkin Hunter' : 'Pumpkin hunt'}</strong><small>{state.found}/{state.total} found</small></span>{complete ? <Check size={14} /> : <ChevronDown size={14} className={open ? 'rotate-180' : ''} />}</button>, control)}
        {open && panelHost && createPortal(huntPanel, panelHost)}
        {message && panelHost && createPortal(<div role={message.error ? 'alert' : 'status'} className={`sfd-hunt-message ${message.error ? 'is-error' : ''}`}><span>{message.error ? <X size={16} /> : <Gift size={17} />}</span><p>{message.text}</p>{message.error && <button type="button" onClick={() => { setMessage(null); setRefresh(n => n + 1); }}>Try again</button>}<button type="button" onClick={() => setMessage(null)} aria-label="Dismiss pumpkin message"><X size={15} /></button></div>, panelHost)}
        {state.pumpkins.map(pumpkin => {
            const index = currentIds.indexOf(pumpkin.id);
            const host = hosts[index];
            if (!host) return null;
            const style = { '--pumpkin-x': `${14 + Math.abs(pumpkin.seed % 73)}%`, '--pumpkin-tilt': `${pumpkin.seed % 19 - 9}deg`, '--pumpkin-delay': `${-(pumpkin.seed % 40) / 10}s` } as CSSProperties;
            return createPortal(<button key={pumpkin.id} type="button" className="sfd-hidden-pumpkin" style={style} data-pumpkin-id={pumpkin.id} disabled={busy !== null} aria-label={`Collect Halloween pumpkin ${pumpkin.id}`} title="A little Halloween treat…" onClick={() => void claim(pumpkin)}><PumpkinHead face={pumpkin.seed} />{busy === pumpkin.id && <span className="sfd-pumpkin-loading"><LoaderCircle size={17} className="animate-spin" /></span>}<span className="sfd-pumpkin-spark sfd-pumpkin-spark-one" aria-hidden="true">✦</span><span className="sfd-pumpkin-spark sfd-pumpkin-spark-two" aria-hidden="true">·</span></button>, host, `pumpkin-${pumpkin.id}`);
        })}
    </>;
}
