import StatusDot from '@/Components/StatusDot';
import type { LucideIcon } from 'lucide-react';
import { PropsWithChildren, ReactNode } from 'react';

/** The look shared by the app's pages: soft glass cards, section titles, number tiles, progress bars. */

export const card = 'rounded-2xl border border-white/10 bg-white/4 shadow-lg shadow-black/20';

export function Card({ className = '', children }: PropsWithChildren<{ className?: string }>) {
    return <section className={`${card} ${className}`}>{children}</section>;
}

export function SectionTitle({ title, hint, action }: { title: ReactNode; hint?: ReactNode; action?: ReactNode }) {
    return (
        <div className="mb-3 flex items-end justify-between gap-3">
            <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-300">{title}</h2>
                {hint && <p className="mt-0.5 text-xs text-neutral-500">{hint}</p>}
            </div>
            {action}
        </div>
    );
}

export function StatTile({ icon: Icon, label, value, hint, tone = 'violet' }: { icon: LucideIcon; label: string; value: ReactNode; hint?: ReactNode; tone?: 'violet' | 'fuchsia' | 'emerald' | 'amber' | 'sky' }) {
    const tones = {
        violet: 'from-violet-500/25 text-violet-300',
        fuchsia: 'from-fuchsia-500/25 text-fuchsia-300',
        emerald: 'from-emerald-500/25 text-emerald-300',
        amber: 'from-amber-500/25 text-amber-300',
        sky: 'from-sky-500/25 text-sky-300',
    };

    return (
        <div className={`${card} relative overflow-hidden p-4`}>
            <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-linear-to-br ${tones[tone].split(' ')[0]} to-transparent blur-xl`} />
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ${tones[tone].split(' ')[1]}`}><Icon size={18} /></div>
            <p className="text-2xl font-black tabular-nums tracking-tight">{value}</p>
            <p className="text-xs text-neutral-400">{label}</p>
            {hint && <p className="mt-1 text-[11px] text-neutral-500">{hint}</p>}
        </div>
    );
}

export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
    return (
        <div className={`h-2 overflow-hidden rounded-full bg-white/10 ${className}`}>
            <div className="h-full rounded-full bg-linear-to-r from-fuchsia-500 to-violet-500 transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
        </div>
    );
}

/** A little animated equalizer: shown next to a song that is playing. */
export function Equalizer({ className = '' }: { className?: string }) {
    return (
        <span className={`inline-flex h-3 items-end gap-[2px] ${className}`} aria-hidden>
            {[0, 1, 2].map((i) => (
                <span key={i} className="w-[3px] animate-pulse rounded-sm bg-green-400" style={{ height: `${[60, 100, 40][i]}%`, animationDelay: `${i * 0.2}s`, animationDuration: '0.9s' }} />
            ))}
        </span>
    );
}

export const chip = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold transition ${active ? 'bg-linear-to-r from-fuchsia-500 to-violet-500 text-white' : 'bg-white/5 text-neutral-300 hover:bg-white/10'}`;

export interface TabDef<K extends string> {
    key: K;
    label: string;
    count?: number | string;
    alert?: number; // a red number, for things that need attention
    icon?: LucideIcon;
}

/** A row of pill tabs with optional counts. */
export function Tabs<K extends string>({ tabs, active, onChange, className = '', compact = false }: { tabs: TabDef<K>[]; active: K; onChange: (key: K) => void; className?: string; compact?: boolean }) {
    return (
        <div className={`flex flex-wrap gap-1.5 ${className}`} role="tablist">
            {tabs.map((t) => (
                <button
                    key={t.key}
                    role="tab"
                    aria-selected={active === t.key}
                    onClick={() => onChange(t.key)}
                    className={`flex items-center rounded-xl py-2 font-semibold transition ${compact ? 'gap-1.5 px-3 text-[13px]' : 'gap-2 px-3.5 text-sm'} ${active === t.key ? 'bg-linear-to-r from-fuchsia-500/30 to-violet-500/30 text-white ring-1 ring-violet-400/40' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                >
                    {t.icon && <t.icon size={15} />}
                    {t.label}
                    {t.count !== undefined && <span className="rounded-full bg-white/10 px-1.5 text-[11px] font-bold text-neutral-300">{t.count}</span>}
                    {!!t.alert && <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{t.alert}</span>}
                </button>
            ))}
        </div>
    );
}

export function EmptyState({ icon = '🎶', title, text, action }: { icon?: string; title: string; text?: ReactNode; action?: ReactNode }) {
    return (
        <div className={`${card} flex flex-col items-center px-6 py-10 text-center`}>
            <p className="text-4xl">{icon}</p>
            <p className="mt-3 font-semibold">{title}</p>
            {text && <p className="mt-1 max-w-sm text-sm text-neutral-400">{text}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

/** A dot in the colour of what somebody shows (green online, red busy, amber away) when they are around, grey when not. */
export function OnlineDot({ online, status, className = '' }: { online: boolean; status?: string | null; className?: string }) {
    return <StatusDot status={online ? status : 'offline'} className={className} />;
}

/** A text box without a width: add w-full, w-48, w-auto yourself (two widths on one element fight each other). */
export const fieldBase = 'rounded-lg border-white/10 bg-white/5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-violet-500 focus:ring-violet-500';
export const fieldClass = `w-full ${fieldBase}`;
export const primaryBtn = 'whitespace-nowrap rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50';
export const ghostBtn = 'whitespace-nowrap rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-neutral-100 transition hover:bg-white/20 disabled:opacity-50';

/** A tiny bar chart (inline SVG, no library): one bar per day. */
export function Bars({ data, color = '#a855f7', height = 56 }: { data: { day: string; n: number }[]; color?: string; height?: number }) {
    const max = Math.max(1, ...data.map((d) => d.n));
    const w = 100 / data.length;

    return (
        <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} role="img" aria-label="Last 14 days">
            {data.map((d, i) => {
                const h = Math.max(d.n ? 3 : 1, (d.n / max) * (height - 4));
                return (
                    <rect key={d.day} x={i * w + w * 0.15} y={height - h} width={w * 0.7} height={h} rx="1" fill={color} opacity={d.n ? 0.9 : 0.25}>
                        <title>{`${d.day}: ${d.n}`}</title>
                    </rect>
                );
            })}
        </svg>
    );
}

/** A label, the input, a hint and the error: the same shape for every form. */
export function Field({ label, htmlFor, hint, error, right, children, className = '' }: { label: string; htmlFor?: string; hint?: ReactNode; error?: string; right?: ReactNode; children: ReactNode; className?: string }) {
    return (
        <div className={className}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
                <label htmlFor={htmlFor} className="text-sm font-medium text-neutral-300">{label}</label>
                {right}
            </div>
            {children}
            {hint && !error && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>}
            {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
        </div>
    );
}

/** One choice out of a few, as joined buttons. */
export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string; hint?: string }[]; onChange: (v: T) => void }) {
    return (
        <div className="grid gap-2 sm:grid-cols-3">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    onClick={() => onChange(o.value)}
                    className={`rounded-xl border px-4 py-3 text-left transition ${value === o.value ? 'border-violet-400/60 bg-violet-500/15 text-white' : 'border-white/10 bg-white/3 text-neutral-300 hover:bg-white/[0.07]'}`}
                >
                    <span className="block text-sm font-semibold">{o.label}</span>
                    {o.hint && <span className="mt-0.5 block text-xs text-neutral-500">{o.hint}</span>}
                </button>
            ))}
        </div>
    );
}

/** A block on a settings page: a heading, a sentence about it, then the controls. */
export function SettingsSection({ title, text, danger = false, children, id }: { title: ReactNode; text?: ReactNode; danger?: boolean; children: ReactNode; id?: string }) {
    return (
        <section id={id} className={`${card} scroll-mt-4 p-6 ${danger ? 'border-red-500/30' : ''}`}>
            <h2 className={`text-lg font-bold ${danger ? 'text-red-300' : ''}`}>{title}</h2>
            {text && <p className="mt-1 max-w-2xl text-sm text-neutral-400">{text}</p>}
            <div className="mt-5">{children}</div>
        </section>
    );
}
