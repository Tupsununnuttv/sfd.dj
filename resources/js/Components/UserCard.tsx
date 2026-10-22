import Avatar from '@/Components/Avatar';
import UserRestrictionActions from '@/Components/UserRestrictionActions';
import { useUserRestrictions } from '@/lib/userRestrictions';
import Badges from '@/Components/Badges';
import Flag, { FlagInfo } from '@/Components/Flag';
import RoleBadge from '@/Components/RoleBadge';
import SocialIcon from '@/Components/SocialIcon';
import StatusDot from '@/Components/StatusDot';
import { ProgressBar } from '@/Components/ui';
import { Cosmetics } from '@/lib/cosmetics';
import { levelPercent } from '@/lib/level';
import { send } from '@/lib/post';
import { patchProfile, useProfile } from '@/lib/profileCache';
import { STATUS, statusOf } from '@/lib/status';
import { RoleInfo } from '@/types';
import { router } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { AtSign, Bookmark, Clock, ExternalLink, Footprints, Gavel, Gift, MessageCircle, Music, Shield, ThumbsUp, UserCheck, UserPlus, Users, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/** Who the card is about; chat messages and the room's user list both have these fields. */
export interface CardUser {
    id: number;
    name: string;
    avatar: string | null;
    cosmetics?: Cosmetics | null;
    role: RoleInfo;
    badges?: RoleInfo[];
    level?: number;
    flag?: FlagInfo | null;
    status?: string;
}

export interface Profile {
    id: number;
    avatar?: string | null;
    cosmetics?: Cosmetics | null;
    name: string;
    username: string | null;
    level?: number;
    bio?: string | null;
    favorite_genre?: string | null;
    flag?: FlagInfo | null;
    pronouns?: string | null;
    status?: string;
    awards?: RoleInfo[];
    joined: string;
    discord: string | null;
    youtube_channel: { title: string | null; url: string } | null;
    is_me: boolean;
    friendship: 'none' | 'friends' | 'sent' | 'received';
    stats: { xp: number; songs_played: number; woots: number; grabs: number; friends: number };
    rooms: { id: number; name: string; slug: string; genre: string | null }[];
}

/** What the card may do inside the current room; the room page decides and passes it in. */
export interface CardRoom {
    slug: string;
    hostId: number;
    can: Record<string, boolean>;
    roleOf: RoleInfo | null;
    memberRoleId: number | null;
    roles: { id: number; name: string }[];
    mutedUntil: string | null | undefined; // undefined = not muted, null = muted until unmuted
    here?: boolean; // is the person in the room right now
    friendIds?: number[];
    onProfile: () => void;
    onMention: () => void;
    onWhisper: () => void;
    onFriendAdded: () => void;
    onChanged: () => void; // reload what the room page knows about mutes/roles
}

const MUTE_FOR: [string, string][] = [['10m', '10 min'], ['1h', '1 hour'], ['24h', '24 hours'], ['forever', 'Until unmuted']];

const tones = {
    plain: 'bg-white/5 text-neutral-200 hover:bg-white/10 hover:text-white',
    good: 'bg-green-500/10 text-green-300',
    warn: 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20',
    danger: 'bg-red-500/10 text-red-300 hover:bg-red-500/20',
    cool: 'bg-sky-500/10 text-sky-300 hover:bg-sky-500/20',
};

/** A square button: an icon with its name underneath. */
function Action({ icon: Icon, label, onClick, tone = 'plain', disabled = false }: { icon: LucideIcon; label: string; onClick?: () => void; tone?: keyof typeof tones; disabled?: boolean }) {
    return (
        <button onClick={onClick} disabled={disabled} className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-semibold transition disabled:cursor-default ${tones[tone]} ${disabled && tone === 'plain' ? 'opacity-50' : ''}`}>
            <Icon size={16} />
            {label}
        </button>
    );
}

/** The menu that opens when you click someone's name or picture in chat or the user list: a quick profile plus the things you can do with them. */
export default function UserCard({ user, viewerId, guest, room, anchor, onClose }: {
    user: CardUser;
    viewerId: number;
    guest: boolean;
    room: CardRoom;
    anchor: DOMRect;
    onClose: () => void;
}) {
    const { blocked } = useUserRestrictions();
    const isBlocked = blocked.includes(user.id);
    const { profile, failed, retry, setProfile } = useProfile(user.id);
    const [error, setError] = useState('');
    const [muting, setMuting] = useState(false);
    const box = useRef<HTMLDivElement>(null);
    const [top, setTop] = useState(Math.max(8, anchor.top));
    const me = user.id === viewerId;
    const moderate = !guest && !me && user.id !== room.hostId && room.can.moderate_users;
    const level = profile?.level ?? user.level ?? 1;
    const s = profile?.stats;
    const flag = profile?.flag ?? user.flag;
    const status = statusOf(profile?.status ?? user.status);
    const alreadyFriends = profile?.friendship === 'friends' || room.friendIds?.includes(user.id) === true;

    useEffect(() => {
        const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', key);
        box.current?.focus({ preventScroll: true });
        return () => window.removeEventListener('keydown', key);
    }, [user.id]);

    // The card opens to the left of what was clicked (chat sits on the right edge) and is nudged up when it would run off the bottom.
    const width = 304;
    const left = Math.max(8, Math.min(anchor.left - width - 8 > 8 ? anchor.left - width - 8 : anchor.left, window.innerWidth - width - 8));
    useLayoutEffect(() => {
        setTop(Math.max(8, Math.min(anchor.top, window.innerHeight - (box.current?.offsetHeight ?? 0) - 8)));
    }, [profile, failed, muting, error, room.mutedUntil]);

    const run = (job: Promise<void>, after?: () => void) =>
        job.then(() => { setError(''); after?.(); room.onChanged(); }).catch((e: Error) => setError(e.message));

    const friend = () =>
        router.post(route('friends.store'), { user_id: user.id }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                const friendship = profile?.friendship === 'received' ? 'friends' : 'sent';
                patchProfile(user.id, { friendship });
                setProfile((p) => p && { ...p, friendship });
                if (friendship === 'friends') room.onFriendAdded();
            },
            onError: (e) => setError(e.name ?? 'Could not send the request.'),
        });

    const kickOrBan = (what: 'kick' | 'ban') => {
        if (what === 'ban' && !confirm(`Ban ${user.name} from this room?`)) return;
        run(send('POST', route(`rooms.${what}`, [room.slug, user.id])), onClose);
    };

    const joined = profile && new Date(profile.joined).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const mutedLabel = room.mutedUntil ? `Muted until ${new Date(room.mutedUntil).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Muted until someone unmutes them';
    const stats: [LucideIcon, string, number | undefined][] = [[Music, 'Songs', s?.songs_played], [ThumbsUp, 'Woots', s?.woots], [Bookmark, 'Grabs', s?.grabs], [Users, 'Friends', s?.friends]];

    return (
        <div className="fixed inset-0 z-60" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }}>
            <div
                ref={box}
                role="dialog"
                aria-label={`${user.name}: quick profile`}
                tabIndex={-1}
                className="absolute max-h-[calc(100vh-1rem)] animate-menu overflow-y-auto rounded-2xl border border-white/10 bg-neutral-900/95 text-neutral-100 shadow-2xl shadow-black/60 outline-none backdrop-blur-md"
                style={{ left, top, width }}
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => e.stopPropagation()}
            >
                {/* who */}
                <div className="h-16 bg-linear-to-br from-violet-600/50 via-fuchsia-600/30 to-sky-500/20" />
                <div className="-mt-9 flex items-end gap-3 px-4">
                    <div className="rounded-full bg-neutral-900 p-1"><Avatar name={profile?.name ?? user.name} avatar={profile?.avatar !== undefined ? profile.avatar : user.avatar} cosmetics={profile?.cosmetics !== undefined ? profile.cosmetics : user.cosmetics} className="h-16 w-16 text-3xl" /></div>
                    <div className="min-w-0 pb-1">
                        <p className="truncate text-base font-bold leading-tight" style={{ color: user.role.color }}>{user.name}</p>
                        {(profile?.username || profile?.pronouns) && <p className="truncate text-xs text-neutral-400">{profile.username && `@${profile.username}`}{profile.username && profile.pronouns && ' · '}{profile.pronouns}</p>}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 px-4 pt-2.5">
                    <Badges badges={user.badges} level={level} />
                    <RoleBadge role={user.role} showMember />
                    {room.roleOf && <RoleBadge role={room.roleOf} />}
                    {profile?.favorite_genre && <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-bold leading-none text-neutral-300">🎵 {profile.favorite_genre}</span>}
                </div>
                <p className="flex items-center gap-1.5 px-4 pt-1.5 text-xs">
                    <StatusDot status={room.here ? status : 'offline'} ring="ring-transparent" className="ring-0!" />
                    <span className={room.here ? STATUS[status].text : 'text-neutral-500'}>{room.here ? `${STATUS[status].label}, in this room` : 'Not in this room right now'}</span>
                    {flag && <span className="ml-auto flex min-w-0 items-center gap-1.5 text-neutral-300"><Flag flag={flag} className="h-3.5" /><span className="truncate">{flag.name}</span></span>}
                </p>

                {/* how far */}
                <div className="px-4 pt-3">
                    <div className="mb-1 flex justify-between text-[11px] text-neutral-400"><span className="font-semibold text-neutral-200">Level {level}</span>{s && <span className="tabular-nums">{s.xp.toLocaleString()} XP</span>}</div>
                    <ProgressBar value={s ? levelPercent(s.xp, level) : 0} className="h-1.5" />
                </div>

                <div className={`grid grid-cols-4 gap-1.5 px-4 pt-3 ${profile || failed ? '' : 'animate-pulse'}`}>
                    {stats.map(([Icon, label, value]) => (
                        <div key={label} className="rounded-xl bg-white/5 py-2 text-center">
                            <Icon size={13} className="mx-auto text-violet-300" />
                            <p className="mt-0.5 text-sm font-bold tabular-nums">{value ?? '–'}</p>
                            <p className="text-[10px] text-neutral-500">{label}</p>
                        </div>
                    ))}
                </div>
                {failed && !profile && (
                    <p className="px-4 pt-2 text-xs text-neutral-400">Could not load the profile. <button onClick={retry} className="font-semibold text-violet-300 hover:underline">Try again</button></p>
                )}
                {profile?.bio && <p className="mx-4 mt-3 line-clamp-4 whitespace-pre-line wrap-break-word rounded-xl bg-white/5 px-3 py-2 text-xs italic text-neutral-300">“{profile.bio}”</p>}
                {joined && <p className="flex flex-wrap items-center gap-2 px-4 pt-2 text-[11px] text-neutral-500">Joined {joined}{profile?.discord && <> · Discord {profile.discord}</>}{profile?.youtube_channel && <a href={profile.youtube_channel.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-red-300"><SocialIcon name="youtube" size={13} /> {profile.youtube_channel.title || 'YouTube channel'}</a>}</p>}

                {/* what you can do */}
                <div className="space-y-2 px-4 pb-4 pt-3">
                    {!guest && !me && !isBlocked && (
                        <div className="grid grid-cols-3 gap-1.5">
                            <Action icon={MessageCircle} label="Whisper" onClick={() => { room.onWhisper(); onClose(); }} />
                            <Action icon={AtSign} label="Mention" onClick={() => { room.onMention(); onClose(); }} />
                            {alreadyFriends ? <Action icon={UserCheck} label="Friends" tone="good" disabled />
                                : profile?.friendship === 'sent' ? <Action icon={Clock} label="Requested" disabled />
                                : profile?.friendship === 'received' ? <Action icon={UserCheck} label="Accept" tone="good" onClick={friend} />
                                : <Action icon={UserPlus} label="Add friend" onClick={friend} disabled={!profile} />}
                        </div>
                    )}
                    <UserRestrictionActions userId={user.id} name={user.name} />
                    <button onClick={() => { room.onProfile(); onClose(); }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2 text-sm font-semibold text-neutral-100 transition hover:bg-white/15">
                        <ExternalLink size={14} /> View full profile
                    </button>
                    {!guest && !me && <button onClick={() => { onClose(); router.visit(`${route('settings.plus', { recipient: user.id })}#gifts`); }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/10 py-2 text-sm font-semibold text-fuchsia-200 hover:bg-fuchsia-500/20"><Gift size={15} /> Gift subscription</button>}
                </div>

                {!guest && !me && user.id !== room.hostId && room.can.manage_roles && (
                    <label className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs text-neutral-400">
                        Room role
                        <select
                            value={room.memberRoleId ?? ''}
                            onChange={(e) => run(send('PUT', route('rooms.members.assign', [room.slug, user.id]), { room_role_id: e.target.value ? Number(e.target.value) : null }))}
                            className="flex-1 rounded-lg border-white/10 bg-neutral-950 py-1 text-xs text-neutral-200 focus:border-violet-500 focus:ring-violet-500"
                        >
                            <option value="">No role</option>
                            {room.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </label>
                )}

                {moderate && (
                    <div className="space-y-2 border-t border-white/10 bg-black/25 px-4 py-3">
                        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300/80"><Shield size={12} /> Moderation</p>
                        {room.mutedUntil !== undefined && <p className="text-xs text-sky-300">{mutedLabel}</p>}
                        <div className="grid grid-cols-3 gap-1.5">
                            {room.mutedUntil !== undefined
                                ? <Action icon={Volume2} label="Unmute" tone="cool" onClick={() => run(send('DELETE', route('rooms.unmute', [room.slug, user.id])))} />
                                : <Action icon={VolumeX} label="Mute…" tone="cool" onClick={() => setMuting(!muting)} />}
                            <Action icon={Footprints} label="Kick" tone="warn" onClick={() => kickOrBan('kick')} />
                            <Action icon={Gavel} label="Ban" tone="danger" onClick={() => kickOrBan('ban')} />
                        </div>
                        {muting && room.mutedUntil === undefined && (
                            <div className="flex flex-wrap gap-1">
                                {MUTE_FOR.map(([value, label]) => (
                                    <button key={value} onClick={() => run(send('POST', route('rooms.mute', [room.slug, user.id]), { for: value }), () => setMuting(false))} className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium hover:bg-white/20">{label}</button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {error && <p className="border-t border-white/10 px-4 py-2 text-xs text-red-300">{error}</p>}
            </div>
        </div>
    );
}
