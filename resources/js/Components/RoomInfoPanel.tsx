import { formatDate } from '@/lib/regional';
import { copyText } from '@/lib/clipboard';
import Avatar from '@/Components/Avatar';
import RoleBadge from '@/Components/RoleBadge';
import RoomBadge from '@/Components/RoomBadge';
import type { RoomRule } from '@/Components/RulesModal';
import { Equalizer } from '@/Components/ui';
import { backgroundClass } from '@/lib/backgrounds';
import { Cosmetics } from '@/lib/cosmetics';
import { RoleInfo } from '@/types';
import type { LucideIcon } from 'lucide-react';
import { Check, Copy, Crown, Globe, ListMusic, Lock, MessageCircle, Music, Settings, ThumbsUp, User, Users, X } from 'lucide-react';
import { useState } from 'react';

export interface Person {
    id: number;
    name: string;
    avatar: string | null;
    cosmetics?: Cosmetics | null;
    role: RoleInfo;
}

export interface RoomStats {
    songs_played: number;
    woots: number;
    djs: number;
}

/** Everything about a room in one window: who runs it, what it is about, what is playing, who is here, the rules. */
export default function RoomInfoPanel({ room, host, online, team, now, queue, stats, canEdit, guest, myId, onEdit, onClose, onProfile, onWhisper }: {
    room: { name: string; slug: string; description: string | null; badges: string[] | null; background: string | null; genre: string | null; is_private: boolean; welcome_message: string | null; rules: string | null; rule_list?: RoomRule[] | null; created_at: string };
    host: { id: number; name: string; avatar: string | null; primary_role: RoleInfo };
    online: Person[];
    team: { role: RoleInfo; people: Person[] }[];
    now: { title: string; thumbnail: string | null; added_by: string } | null;
    queue: number;
    stats: RoomStats;
    canEdit: boolean;
    guest: boolean;
    myId: number;
    onEdit: () => void;
    onClose: () => void;
    onProfile: (id: number, name: string) => void;
    onWhisper: (id: number) => void;
}) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        void copyText(route('rooms.show', room.slug)).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        }).catch(() => {});
    };

    const since = formatDate(room.created_at, { year: 'numeric', month: 'long', day: 'numeric' });
    const rules: RoomRule[] = room.rule_list?.length ? room.rule_list : (room.rules ?? '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => ({ title: l.replace(/^\d+[.)]\s*/, ''), text: '' }));
    const shown = online.slice(0, 9);
    const present = team.filter((t) => t.people.length > 0);
    const away = team.filter((t) => t.people.length === 0);
    const tiles: [LucideIcon, string, number][] = [[Users, 'Listening now', online.length], [ListMusic, 'In the waitlist', queue], [Music, 'Songs played', stats.songs_played], [ThumbsUp, 'Woots given', stats.woots]];
    const pill = 'inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-neutral-100';

    return (
        <>
            {/* the room's own backdrop, with the name on it */}
            <div className={`relative overflow-hidden px-6 pb-6 pt-7 ${backgroundClass(room.background)}`}>
                <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-fuchsia-600/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-violet-600/25 blur-3xl" />
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-neutral-900 via-neutral-900/20 to-transparent" />
                <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-lg bg-black/30 p-1.5 text-neutral-300 backdrop-blur hover:bg-black/50 hover:text-white"><X size={18} /></button>

                <div className="relative">
                    <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-violet-300">Room info <RoomBadge badges={room.badges} /></p>
                    <h2 className="mt-1 wrap-break-word text-3xl font-black tracking-tight sm:text-4xl">{room.name}</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {room.genre && <span className={pill}>🎵 {room.genre}</span>}
                        <span className={pill}>{room.is_private ? <><Lock size={12} /> Private</> : <><Globe size={12} /> Public</>}</span>
                        <span className={pill}>Since {since}</span>
                        <span className={`${pill} bg-green-500/15! text-green-300!`}><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" /> {online.length} here now</span>
                    </div>
                    {room.description && <p className="mt-3 max-w-2xl text-sm text-neutral-200">{room.description}</p>}
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={copy} className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold backdrop-blur hover:bg-white/25">
                            {copied ? <><Check size={15} className="text-green-300" /> Link copied</> : <><Copy size={15} /> Copy room link</>}
                        </button>
                        {canEdit && <button onClick={onEdit} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur hover:bg-white/20"><Settings size={15} /> Room settings</button>}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                <div className="min-w-0 space-y-5">
                    <section>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Now playing</h3>
                        {now ? (
                            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/4 p-3">
                                {now.thumbnail ? <img src={now.thumbnail} alt="" className="h-14 w-24 shrink-0 rounded-lg object-cover" /> : <span className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg bg-white/5 text-2xl">🎵</span>}
                                <div className="min-w-0">
                                    <p className="line-clamp-2 text-sm font-semibold">{now.title}</p>
                                    <p className="mt-0.5 flex items-center gap-2 text-xs text-neutral-400"><Equalizer /> played by <span className="font-semibold text-fuchsia-300">{now.added_by}</span></p>
                                </div>
                            </div>
                        ) : (
                            <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-neutral-400">Nobody is playing right now. Be the next DJ: add a song to the waitlist.</p>
                        )}
                    </section>

                    {room.welcome_message && (
                        <section>
                            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Welcome message</h3>
                            <p className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-4 text-sm text-violet-100">🎉 {room.welcome_message}</p>
                        </section>
                    )}

                    <section>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Room rules</h3>
                        {rules.length === 0 ? (
                            <p className="text-sm text-neutral-500">The host has not written any rules. Be kind and keep the music going.</p>
                        ) : (
                            <ol className="space-y-2.5">
                                {rules.map((rule, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-neutral-200">
                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-[11px] font-bold text-violet-200">{i + 1}</span>
                                        <span className="min-w-0 wrap-break-word"><span className="font-semibold text-neutral-100">{rule.title}</span>{rule.text && <span className="mt-0.5 block whitespace-pre-line text-neutral-400">{rule.text}</span>}</span>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </section>
                </div>

                <div className="min-w-0 space-y-5">
                    <div className="grid grid-cols-2 gap-2">
                        {tiles.map(([Icon, label, value]) => (
                            <div key={label} className="rounded-xl border border-white/10 bg-white/4 p-3">
                                <Icon size={15} className="text-violet-300" />
                                <p className="mt-1.5 text-xl font-black tabular-nums leading-none">{value.toLocaleString()}</p>
                                <p className="mt-1 text-[11px] text-neutral-400">{label}</p>
                            </div>
                        ))}
                    </div>

                    <section>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Host</h3>
                        <div className="rounded-xl border border-amber-400/20 bg-linear-to-br from-amber-500/10 to-transparent p-3">
                            <div className="flex items-center gap-3">
                                <Avatar name={host.name} avatar={host.avatar} className="h-12 w-12 text-2xl" />
                                <div className="min-w-0">
                                    <p className="flex items-center gap-1.5 truncate font-bold"><Crown size={14} className="shrink-0 text-amber-300" /> <span className="truncate">{host.name}</span></p>
                                    <RoleBadge role={host.primary_role} showMember />
                                </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                                <button onClick={() => onProfile(host.id, host.name)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/10 py-1.5 text-xs font-semibold hover:bg-white/20"><User size={13} /> Profile</button>
                                {!guest && host.id !== myId && <button onClick={() => onWhisper(host.id)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/10 py-1.5 text-xs font-semibold hover:bg-white/20"><MessageCircle size={13} /> Whisper</button>}
                            </div>
                        </div>
                    </section>

                    {team.length > 0 && (
                        <section>
                            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Room team</h3>
                            {present.length > 0 && (
                                <ul className="space-y-2">
                                    {present.map(({ role, people }) => (
                                        <li key={role.key} className="rounded-xl bg-white/4 p-2.5">
                                            <RoleBadge role={role} />
                                            <ul className="mt-2 flex flex-wrap gap-1.5">
                                                {people.map((p) => (
                                                    <li key={p.id}>
                                                        <button onClick={() => onProfile(p.id, p.name)} className="flex items-center gap-1.5 rounded-full bg-white/5 py-0.5 pl-0.5 pr-2.5 text-xs hover:bg-white/10">
                                                            <Avatar name={p.name} avatar={p.avatar} cosmetics={p.cosmetics} className="h-5 w-5 text-[10px]" />
                                                            <span className="max-w-28 truncate">{p.name}</span>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {away.length > 0 && (
                                <p className={`flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 ${present.length > 0 ? 'mt-2' : ''}`}>
                                    {present.length > 0 ? 'Also in the team, not here now:' : 'Nobody from the team is here now:'}
                                    {away.map(({ role }) => <RoleBadge key={role.key} role={role} />)}
                                </p>
                            )}
                        </section>
                    )}

                    {online.length > 0 && (
                        <section>
                            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Here right now</h3>
                            <div className="flex items-center">
                                <ul className="flex -space-x-2">
                                    {shown.map((p) => (
                                        <li key={p.id} title={p.name} className="rounded-full ring-2 ring-neutral-900"><Avatar name={p.name} avatar={p.avatar} cosmetics={p.cosmetics} className="h-8 w-8 text-base" /></li>
                                    ))}
                                </ul>
                                {online.length > shown.length && <span className="ml-2 text-xs text-neutral-400">+{online.length - shown.length}</span>}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </>
    );
}
