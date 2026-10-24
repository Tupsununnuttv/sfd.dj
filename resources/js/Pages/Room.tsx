import SubscriptionRoomEffects, { subscriptionEntrance, subscriptionReaction } from '@/Components/SubscriptionRoomEffects';
import SubscriberName from '@/Components/SubscriberName';
import { perk, subscriptionVars } from '@/lib/subscriptionStyle';
import type { SubscriptionAppearance } from '@/lib/cosmetics';
import { Cosmetics } from '@/lib/cosmetics';
import Avatar from '@/Components/Avatar';
import Badges from '@/Components/Badges';
import ChatPanel, { ChatMessageData, RoomEmojiData, RoomNotifications } from '@/Components/ChatPanel';
import Flag, { FlagInfo } from '@/Components/Flag';
import type { CardUser } from '@/Components/UserCard';
import Live from '@/Components/Live';
import LiveScreen from '@/Components/LiveScreen';
import RoleBadge from '@/Components/RoleBadge';
import RoleIcon, { RoleGlyph } from '@/Components/RoleIcon';
import RoomFootbar from '@/Components/RoomFootbar';
import RulesModal, { agreeToRules, RoomRule, rulesKey, rulesSeen } from '@/Components/RulesModal';
import StatusDot from '@/Components/StatusDot';
import SocialIcon from '@/Components/SocialIcon';
import RoomHeader from '@/Components/RoomHeader';
import type { RoomStats } from '@/Components/RoomInfoPanel';
import type { ModData } from '@/Components/ModerationPanel';
import type { RoomRoleInfo } from '@/Components/RoomRolesEditor';
import type { MemberRow, SeasonInfo } from '@/Components/RoomSettingsPanel';
import Sidebar from '@/Components/Sidebar';
import RoomScene from '@/Components/RoomScene';
import RoomGuestList from '@/Components/RoomGuestList';
import { useRoomGuests, type RoomGuest } from '@/lib/roomGuests';
import VoteBar, { MyVotes, Votes } from '@/Components/VoteBar';
import { SeatButton, WaitlistCard } from '@/Components/WaitlistCard';
import { backgroundClass } from '@/lib/backgrounds';
import type { LiveInfo } from '@/lib/live';
import { getJson, post, send, sendJson } from '@/lib/post';
import { refreshCounts } from '@/lib/counts';
import { useUserRestrictions } from '@/lib/userRestrictions';
import { useTouchRendering } from '@/lib/touchRendering';
import { invalidateProfile } from '@/lib/profileCache';
import { withDefaults } from '@/lib/prefs';
import { EMPTY_ROOM_RELEASES, type RoomReleaseState } from '@/lib/roomReleases';
import { saveCompactPreference, useCompactPreferences } from '@/lib/compactPreferences';
import RoomPlayer from '@/lib/roomPlayer';
import { isSoundCloud } from '@/lib/soundcloud';
import { PageProps, RoleInfo } from '@/types';
import { roomUserWeight, sortRoomUsersByWeight } from '@/lib/roomUserSort';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { Disc3, Ellipsis, Search, ExternalLink, Footprints, Gavel, MessageCircle, ShieldCheck, UserCheck, VolumeX, X } from 'lucide-react';
import { FormEvent, lazy, ReactNode, Suspense, useEffect, useRef, useState } from 'react';

const GrabDialog = lazy(() => import('@/Components/GrabDialog'));
const LiveControls = lazy(() => import('@/Components/LiveControls'));
const PageOverlay = lazy(() => import('@/Components/PageOverlay'));
const SupportWidget = lazy(() => import('@/Components/SupportWidget'));
const PlaylistManager = lazy(() => import('@/Components/PlaylistManager'));
const UserCard = lazy(() => import('@/Components/UserCard'));
const WhisperBox = lazy(() => import('@/Components/WhisperBox'));
const RoomInfoPanel = lazy(() => import('@/Components/RoomInfoPanel'));
const ModerationPanel = lazy(() => import('@/Components/ModerationPanel'));
const RoomSettingsPanel = lazy(() => import('@/Components/RoomSettingsPanel'));
const RoomUpdatesPanel = lazy(() => import('@/Components/RoomUpdatesPanel'));
const loadingPanel = <div className="flex min-h-0 flex-1 items-center justify-center p-6 text-sm text-neutral-400">Loading...</div>;

interface Song {
    id: number;
    user_id: number;
    youtube_id: string;
    title: string;
    thumbnail: string | null;
    duration: number;
    added_by: string;
    dj?: Member; // who added it (so guests, who see nobody else, still see the DJ)
}

interface Playback {
    current: Song | null;
    elapsed: number;
    queue: Song[];
    votes: Votes;
    dancers?: number[]; // who has wooted or grabbed this song
    locked: boolean;
    cycle: boolean;
    max: number; // how many people the waitlist holds
    live: LiveInfo | null; // a live stream is on the big screen: the songs wait
}

interface Member {
    id: number;
    name: string;
    username?: string | null;
    avatar: string | null;
    character?: string | null;
    is_bot?: boolean;
    bot_seen_at?: string | null;
    cosmetics?: Cosmetics | null;
    role: RoleInfo;
    badges?: RoleInfo[];
    level?: number;
    flag?: FlagInfo | null;
    status?: string;
}

interface RoomInfo {
    early_access?: boolean;
    id: number;
    name: string;
    slug: string;
    description: string | null;
    badges: string[] | null;
    background: string | null;
    genre: string | null;
    is_private: boolean;
    welcome_message: string | null;
    custom_background_url?: string | null; // the host's own picture
    rules: string | null;
    rule_list: RoomRule[] | null;
    css: string; // the room's own CSS, cleaned up by the server: all of it is inside the room
    css_source?: string | null; // only the host (and staff) get what was typed ...
    css_notes?: string[]; // ... and what was left out of it
    created_at: string;
}

interface Host {
    id: number;
    name: string;
    avatar: string | null;
    cosmetics?: Cosmetics | null;
    primary_role: RoleInfo;
}

type Tab = 'room' | 'chat' | 'waitlist' | 'users';
const transientNotificationKinds = new Set(['grab', 'woot', 'meh', 'ended', 'skip']);
const BOT_PRESENCE_TTL_MS = 90_000;
const isTransientActivity = (message: ChatMessageData) => message.type === 'system' && (
    transientNotificationKinds.has(message.kind ?? '')
    || ((message.kind === 'join' || message.kind === 'leave') && /(?:joined|left) the waitlist/i.test(message.body))
);
type PanelName = 'info' | 'settings' | 'moderation' | 'playlists' | 'whispers' | 'live' | 'updates' | null;

// Stamp each playback with arrival time so late joiners can add the time that passed since.
const stamp = (p: Playback) => ({ ...p, receivedAt: Date.now() });

const HOST_ROLE: RoleInfo = { key: 'host', label: 'Host', color: '#facc15' };
const USER_ROLE: RoleInfo = { key: 'member', label: 'User', color: '#a3a3a3' };
const NO_VOTES: MyVotes = { woot: false, meh: false, grab: false };
const SYNC_THRESHOLD_SECONDS = 8;
const SYNC_COOLDOWN_MS = 15_000;
const input =
    'w-full rounded border-neutral-700 bg-neutral-900 text-sm text-white placeholder-neutral-500 focus:border-violet-500 focus:ring-0';

function Panel({ title, onClose, children, wide = false, large = false, bare = false, full = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; large?: boolean; bare?: boolean; full?: boolean }) {
    useEffect(() => {
        const key = (e: KeyboardEvent) => e.key === 'Escape' && !e.defaultPrevented && onClose(); // a menu or a text box inside has taken the Esc already
        window.addEventListener('keydown', key);
        return () => window.removeEventListener('keydown', key);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
            <div
                role="dialog"
                aria-label={title}
                className={`w-full animate-menu overflow-x-hidden rounded-2xl border border-white/10 bg-neutral-900 text-white shadow-2xl shadow-black/60 ${full ? 'flex h-[92vh] max-w-370 flex-col overflow-hidden' : `max-h-[92vh] overflow-y-auto ${wide ? 'max-w-4xl' : large ? 'max-w-3xl' : 'max-w-xl'}`}`}
                onClick={(e) => e.stopPropagation()}
            >
                {bare ? children : (
                    <>
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-neutral-900/95 px-6 py-4 backdrop-blur">
                            <h2 className="font-bold">{title}</h2>
                            <button onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white" aria-label="Close"><X size={18} /></button>
                        </div>
                        <div className="space-y-4 p-6">{children}</div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function Room({
    room,
    roomReleases = EMPTY_ROOM_RELEASES,
    host,
    roleOrder,
    roleGroupOf,
    genres,
    can,
    roles,
    members,
    memberList,
    friendIds: initialFriendIds,
    botMembers,
    mod,
    permissionLabels,
    backgrounds,
    seasons,
    bans,
    myVotes,
    stickers,
    emojis,
    guestMembers = [],
    stats,
    messages: initialMessages,
    playback: initialPlayback,
}: PageProps<{
    room: RoomInfo;
    roomReleases?: RoomReleaseState;
    host: Host;
    roleOrder: string[];
    roleGroupOf: Record<string, string>; // role key => staff, staff2, creator or community
    genres: string[];
    can: Record<string, boolean>;
    roles: RoomRoleInfo[];
    members: Record<string, number>;
    friendIds: number[];
    botMembers: Member[];
    guestMembers?: RoomGuest[];
    memberList: MemberRow[];
    mod: ModData | null;
    permissionLabels: Record<string, string>;
    backgrounds: string[]; // the scenes this person may pick in Room settings
    seasons: SeasonInfo[]; // Halloween and Christmas: when they are, and whether one is on now
    bans: { id: number; name: string; avatar: string | null }[];
    myVotes: MyVotes;
    stickers: string[];
    emojis: RoomEmojiData[];
    listening: number;
    stats: RoomStats;
    messages: ChatMessageData[];
    playback: Playback;
}>) {
    const { auth: { user, guest }, community } = usePage<PageProps>().props;
    const { hiddenAuthors } = useUserRestrictions();
    const touchRendering = useTouchRendering();
    const [watchers, updateWatchers] = useRoomGuests(room.slug, guestMembers, guest);
    const hiddenAuthorsRef = useRef(hiddenAuthors);
    hiddenAuthorsRef.current = hiddenAuthors;
    const prefs = withDefaults(user.preferences);
    useEffect(() => {
        const refresh = () => { if (!document.hidden) router.reload({ only: ['room', 'roomReleases'] }); };
        const timer = window.setInterval(refresh, 60_000);
        document.addEventListener('visibilitychange', refresh);
        return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
    }, [room.id]);
    const { values: compact } = useCompactPreferences();
    prefs.appearance.compact_chat = compact.compact_chat;
    prefs.room.compact_layout = compact.compact_layout;

    const [messages, setMessages] = useState(initialMessages);
    const previousFilters = useRef(hiddenAuthors);
    useEffect(() => {
        if (previousFilters.current === hiddenAuthors) return;
        previousFilters.current = hiddenAuthors;
        router.reload({ only: ['messages'], onSuccess: (page) => {
            const fresh = page.props.messages as ChatMessageData[];
            if (!Array.isArray(fresh)) return;
            setMessages((now) => {
                const stored = new Map(now.filter((message) => message.id > 0).map((message) => [message.id, message]));
                fresh.forEach((message) => stored.set(message.id, message));
                return [...stored.values()].sort((a, b) => a.id - b.id).slice(-200).concat(now.filter((message) => message.id < 0));
            });
        } });
    }, [hiddenAuthors]);
    const [peopleSearch, setPeopleSearch] = useState('');
    const [notifications, setNotifications] = useState<{ id: number; kind: string; body: string }[]>([]);
    const [playback, setPlayback] = useState(() => stamp(initialPlayback));
    const [mine, setMine] = useState<MyVotes>(myVotes);
    const [users, setUsers] = useState<Member[]>(botMembers);
    // Saves in a same-origin shop overlay refresh auth even if the live socket is unavailable.
    useEffect(() => {
        if (guest) return;
        setUsers((currentUsers) => currentUsers.map((member) => member.id === user.id ? {
            ...member, name: user.name, avatar: user.avatar, character: user.character, cosmetics: user.cosmetics,
            role: user.primary_role, badges: user.badges, level: user.level, flag: user.flag,
        } : member));
    }, [guest, user.id, user.name, user.avatar, user.character, user.cosmetics, user.primary_role, user.badges, user.level, user.flag]);
    const [friendIds, setFriendIds] = useState(initialFriendIds);
    const [typers, setTypers] = useState<Record<number, string>>({});
    const [tab, setTab] = useState<Tab>(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? 'room' : 'chat');
    const [panel, setPanel] = useState<PanelName>(null);
    useEffect(() => { if (panel === 'updates' && !roomReleases.features.includes('room_updates')) setPanel(null); }, [panel, roomReleases]);
    const [whisperTo, setWhisperTo] = useState<number | null>(null);
    const [page, setPage] = useState<{ url: string; title: string } | null>(null);
    const [card, setCard] = useState<{ user: CardUser; anchor: DOMRect } | null>(null);
    const [grabbing, setGrabbing] = useState(false); // the window that asks which playlist a grabbed song goes in
    const [mention, setMention] = useState<{ name: string; n: number } | null>(null);
    // The music starts as soon as you are in the room. A browser that keeps the sound back until you have clicked on the page plays the video muted
    // meanwhile: then this is true, and the first click or key anywhere turns the sound on.
    const [silenced, setSilenced] = useState(false);
    const [playbackOn, setPlaybackOn] = useState(true);
    const playbackOnRef = useRef(playbackOn);
    playbackOnRef.current = playbackOn;
    // The volume you set stays after a refresh (per browser); the Audio setting is only the first-ever value.
    const [volume, setVolume] = useState<number>(() => {
        try {
            const saved = Number(localStorage.getItem('sfddj.volume'));
            return localStorage.getItem('sfddj.volume') !== null && saved >= 0 && saved <= 100 ? saved : prefs.audio.default_volume;
        } catch {
            return prefs.audio.default_volume;
        }
    });
    useEffect(() => {
        try { localStorage.setItem('sfddj.volume', String(volume)); } catch { /* private mode */ }
    }, [volume]);
    const [muted, setMuted] = useState<boolean>(prefs.audio.mute_on_join);
    const [leaving, setLeaving] = useState(false);
    const [deckKey, setDeckKey] = useState(0); // bumped when my playlists changed, so the footbar reads them again
    const [notice, setNotice] = useState('');
    const [announcement, setAnnouncement] = useState('');
    const canLock = user.id === host.id || user.is_staff;

    const box = useRef<HTMLDivElement>(null);
    const player = useRef<RoomPlayer | null>(null);
    const [ready, setReady] = useState(false);
    const [discoveredDuration, setDiscoveredDuration] = useState<{ itemId: number; seconds: number } | null>(null);
    const reportedDuration = useRef<number | null>(null);
    const current = playback.current;
    const currentRef = useRef(current);
    currentRef.current = current;
    const live = playback.live ?? null;
    const liveRef = useRef(live);
    liveRef.current = live;
    const playbackRef = useRef(playback);
    playbackRef.current = playback;
    /** Where the room is in the song that plays now, in seconds. */
    const roomPosition = () => {
        const now = playbackRef.current;

        return now.current ? Math.max(0, now.elapsed + (Date.now() - now.receivedAt) / 1000) : 0;
    };
    const playbackSync = useRef({ songId: current?.id ?? null, receivedAt: playback.receivedAt, lastSeekAt: 0 });
    const lastResumeAttempt = useRef<{ songId: number; at: number } | null>(null);
    const resumePlaybackMuted = () => {
        const song = currentRef.current;
        const activePlayer = player.current;
        if (!playbackOnRef.current || !song || !activePlayer || liveRef.current) return;

        const now = Date.now();
        if (lastResumeAttempt.current?.songId === song.id && now - lastResumeAttempt.current.at < 2000) return;
        lastResumeAttempt.current = { songId: song.id, at: now };
        activePlayer.mute?.();
        activePlayer.playVideo?.();
        setSilenced(true);
    };
    const applyBotPresence = (presence: Member & { online: boolean }) => {
        setUsers((currentUsers) => presence.online
            ? [...currentUsers.filter((member) => member.id !== presence.id), presence]
            : currentUsers.filter((member) => member.id !== presence.id));
    };

    useEffect(() => {
        const timer = window.setInterval(() => {
            const cutoff = Date.now() - BOT_PRESENCE_TTL_MS;
            setUsers((currentUsers) => currentUsers.filter((member) => !member.is_bot || !member.bot_seen_at || Date.parse(member.bot_seen_at) >= cutoff));
        }, 15_000);

        return () => window.clearInterval(timer);
    }, []);
    const channel = useRef<any>(null);
    const lastWhisper = useRef(0);
    const typingTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
    const localId = useRef(0);
    const notificationTimers = useRef<Record<number, number>>({});
    const seenNotifications = useRef(new Set<number>());

    // A line that only exists in this browser (joins, site broadcasts); negative ids never clash with stored messages.
    const say = (kind: string, body: string) => {
        const line: ChatMessageData = { id: --localId.current - 1, type: 'system', kind, body, user: 'System', user_id: 0, avatar: null, role: HOST_ROLE };
        setMessages((p) => [...p, line].slice(-200));
    };
    // back from Stripe after a donation (?donated=1): say thank you, and take the mark off the address
    useEffect(() => {
        const here = new URL(window.location.href);
        if (!here.searchParams.has('donated')) return;
        here.searchParams.delete('donated');
        window.history.replaceState(window.history.state, '', here);
        say('donation', 'Thank you for your donation! It counts towards the goal as soon as Stripe confirms the payment.');
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const notify = (kind: string, body: string) => {
        const id = --localId.current - 1;
        setNotifications((p) => [...p, { id, kind, body }].slice(-3));
        notificationTimers.current[id] = window.setTimeout(() => {
            setNotifications((p) => p.filter((n) => n.id !== id));
            delete notificationTimers.current[id];
        }, 4500);
    };
    const receiveMessage = (message: ChatMessageData) => {
        if (hiddenAuthorsRef.current.has(message.user_id)) return;
        if (isTransientActivity(message)) {
            if (!seenNotifications.current.has(message.id)) {
                seenNotifications.current.add(message.id);
                if (seenNotifications.current.size > 500) seenNotifications.current.delete(seenNotifications.current.values().next().value!);
                notify(message.kind ?? 'ended', message.body);
            }
            return;
        }
        setMessages((p) => (p.some((x) => x.id === message.id) ? p : [...p, message].slice(-200)));
    };

    useEffect(() => () => {
        Object.values(notificationTimers.current).forEach((timer) => window.clearTimeout(timer));
    }, []);

    const roomRoleOf = (userId: number): RoleInfo | null => {
        if (userId === host.id) return HOST_ROLE;
        const r = roles.find((x) => x.id === members[userId]);
        return r ? { key: `room-${r.id}`, label: r.name, color: r.color } : null;
    };

    // whoever's song is playing stands behind the booth
    const dj: Member | null = live?.by
        ? (users.find((u) => u.id === live.by!.id) ?? (live.by as Member)) // the one who streams
        : current ? (users.find((u) => u.id === current.user_id) ?? current.dj ?? { id: current.user_id, name: current.added_by, avatar: null, role: USER_ROLE }) : null;
    // everybody stands until they press Woot or Grab: the server says who has, and my own press counts at once
    const dancing = new Set(playback.dancers ?? []);
    if (!guest) {
        if ((mine.woot || mine.grab) && !mine.meh) dancing.add(user.id);
        else dancing.delete(user.id);
    }
    if (live) { users.forEach((u) => dancing.add(u.id)); if (!guest) dancing.add(user.id); } // a live show: everybody dances
    const canModerate = can.moderate_chat || can.manage_queue || can.moderate_users;
    const canEditRoom = can.edit_settings || can.manage_roles || can.manage_queue || can.delete_room || can.selfbots;
    // a song's video is being watched in a playlist or a search (VideoPreview): the room goes quiet until it closes
    const [previewing, setPreviewing] = useState(false);
    useEffect(() => {
        const preview = (e: Event) => setPreviewing((e as CustomEvent<boolean>).detail);
        window.addEventListener('sfd:preview', preview);

        return () => window.removeEventListener('sfd:preview', preview);
    }, []);
    const effectiveVolume = muted || previewing ? 0 : volume;
    const effectiveVolumeRef = useRef(effectiveVolume);
    effectiveVolumeRef.current = effectiveVolume;
    const canSkip = (s: Song) => can.skip || s.user_id === user.id;
    const waitlist = [...(current ? [current] : []), ...playback.queue];
    const myPosition = waitlist.findIndex((s) => s.user_id === user.id);
    const lineRef = useRef<number[]>([]); // who is in the line (the DJ first), for the channel's "left the room" callback
    lineRef.current = waitlist.map((s) => s.user_id);

    // How far into the song we are: server's elapsed time plus what passed since it arrived.
    const rawPosition = current ? Math.max(0, playback.elapsed + (Date.now() - playback.receivedAt) / 1000) : 0;
    const position = current && current.duration > 0 ? Math.min(rawPosition, current.duration) : rawPosition;

    // Join / Leave Waitlist: in the line means a song of mine is waiting or playing. The wait is what is left of the song that plays now plus the songs ahead of mine
    // (all of them, if I am not in the line yet).
    const inList = myPosition >= 0;
    const ahead = (inList ? waitlist.slice(1, myPosition) : playback.queue).reduce((n, s) => n + Math.max(0, s.duration), 0);
    const etaSeconds = inList && myPosition === 0 && current
        ? 0
        : (current && current.duration > 0 ? Math.max(0, current.duration - playback.elapsed) : 0) + ahead;
    const etaSince = current ? playback.receivedAt : Date.now();
    const closed = playback.locked && !can.manage_queue;

    // If a song has run past its length and nobody's player said so (nobody joined, blocked embed), say it ourselves.
    const reportedEnd = useRef<number | null>(null);
    useEffect(() => {
        if (guest || !current || current.duration <= 0 || live) return;
        const reportEndIfNeeded = () => {
            const elapsed = Math.max(0, playback.elapsed + (Date.now() - playback.receivedAt) / 1000);
            if (elapsed < current.duration + 3 || reportedEnd.current === current.id) return;
            reportedEnd.current = current.id;
            post(route('rooms.skip', room.slug), { item_id: current.id, ended: true }).catch(() => {});
        };
        const timer = window.setInterval(reportEndIfNeeded, 1000);
        reportEndIfNeeded();

        return () => window.clearInterval(timer);
    }, [guest, current?.id, current?.duration, playback.elapsed, playback.receivedAt, room.slug, !!live]);

    // The host changed the room (its name, scene, rules, CSS ...): read it again. A moment apart, so a full room does not ask all at once.
    const reloadRoom = () => { window.setTimeout(() => router.reload({ only: ['room', 'backgrounds', 'host', 'roomReleases'] }), Math.random() * 1500); };

    // who joins, leaves and votes shows as lines in the chat, unless this person turned that off (Settings, Appearance)
    const activity = useRef(true);
    activity.current = prefs.appearance.show_activity;
    const sayVote = (v: { user_id: number; name: string; type: 'woot' | 'meh' | 'grab'; appearance?: SubscriptionAppearance | null }) => {
        if (!activity.current || hiddenAuthorsRef.current.has(v.user_id) || (v.type === 'grab' && v.user_id === user.id)) return; // my own grab says more in the window I just used
        subscriptionReaction(v.name, v.appearance);
        notify(v.type, `${v.name} ${v.type === 'woot' ? 'wooted' : v.type === 'meh' ? "meh'd" : 'grabbed'} this song`);
    };

    // The rules people agree to when they come in: the host does not have to, and a changed list asks again.
    const rules = room.rule_list ?? [];
    const rulesHash = rulesKey(rules);
    const [rulesOpen, setRulesOpen] = useState(() => rules.length > 0 && user.id !== host.id && !rulesSeen(room.id, rules));
    const firstRules = useRef(true);
    useEffect(() => {
        if (firstRules.current) { firstRules.current = false; return; }
        setRulesOpen(rules.length > 0 && user.id !== host.id && !rulesSeen(room.id, rules));
    }, [room.id, rulesHash]);

    // Presence channel: chat, playback, who is here, who is typing, role changes, kicks.
    useEffect(() => {
        if (guest) {
            // Guests cannot join Presence, so poll only the privacy-filtered roster of a public room.
            const name = `room-view.${room.id}`;
            echo<'reverb'>()
                .channel(name)
                .listen('.message', receiveMessage)
                .listen('.chat-reaction', (data: { id: number; reactions: ChatMessageData['reactions'] }) => setMessages((items) => items.map((m) => m.id === data.id ? { ...m, reactions: data.reactions } : m)))
                .listen('.message-deleted', (d: { id: number }) => setMessages((p) => p.filter((m) => m.id !== d.id)))
                .listen('.playback', (p: Playback) => setPlayback(stamp(p)))
                .listen('.room-bot-presence', applyBotPresence)
                .listen('.room-guests', (data: { guests: RoomGuest[] }) => updateWatchers(data.guests))
                .listen('.chat-cleared', () => setMessages([]))
                .listen('.vote-cast', sayVote)
                .listen('.room-updated', reloadRoom);
            const refreshMembers = () => {
                if (document.hidden) return;
                getJson<Member[]>(route('rooms.members', room.slug))
                    .then((list) => setUsers((current) => [...new Map([...list, ...current.filter((member) => member.is_bot)].map((member) => [member.id, member])).values()]))
                    .catch(() => {});
            };
            void refreshMembers();
            const timer = window.setInterval(refreshMembers, 15_000);
            say('join', `You are watching ${room.name} as a guest. Log in to chat, vote and play songs.`);

            return () => {
                window.clearInterval(timer);
                echo().leave(name);
            };
        }

        const name = `room.${room.id}`;
        const ch = echo<'reverb'>().join(name) as any;
        channel.current = ch;
        let sweepTimer: ReturnType<typeof setTimeout> | undefined;

        ch.here((list: Member[]) => {
            setUsers((currentUsers) => [...new Map([...list, ...currentUsers.filter((member) => member.is_bot)].map((member) => [member.id, member])).values()]);
            const count = list.length + users.filter((member) => member.is_bot).length;
            subscriptionEntrance(user.name, user.cosmetics);
            notify('join', `You joined ${room.name}. ${count} ${count === 1 ? 'person is' : 'people are'} here.`);
        })
            .joining((m: Member) => {
                if (!hiddenAuthorsRef.current.has(m.id)) subscriptionEntrance(m.name, m.cosmetics);
                setUsers((p) => [...p.filter((u) => u.id !== m.id), m]);
                activity.current && !hiddenAuthorsRef.current.has(m.id) && notify('join', `${m.name} joined the room`);
            })
            .leaving((m: Member) => {
                setUsers((p) => p.filter((u) => u.id !== m.id));
                activity.current && !hiddenAuthorsRef.current.has(m.id) && notify('exit', `${m.name} left the room`);
                // gone from the room without saying so (tab closed, computer asleep, connection lost) but still in the line or at the booth:
                // ask the server to take them out; it checks with the live server itself, so it never takes out somebody who is still here
                if (lineRef.current.includes(m.id)) {
                    clearTimeout(sweepTimer);
                    sweepTimer = setTimeout(() => void post(route('rooms.waitlist.sweep', room.slug), {}).catch(() => {}), 4000);
                }
            })
            .listen('.message', receiveMessage)
                .listen('.chat-reaction', (data: { id: number; reactions: ChatMessageData['reactions'] }) => setMessages((items) => items.map((m) => m.id === data.id ? { ...m, reactions: data.reactions } : m)))
            .listen('.message-deleted', (d: { id: number }) => setMessages((p) => p.filter((m) => m.id !== d.id)))
            .listen('.playback', (p: Playback) => setPlayback(stamp(p)))
            .listen('.room-bot-presence', applyBotPresence)
            .listen('.room-guests', (data: { guests: RoomGuest[] }) => updateWatchers(data.guests))
            .listen('.chat-cleared', () => setMessages([]))
            .listen('.roles-updated', () => router.reload({ only: ['roles', 'members', 'memberList', 'can', 'bans', 'mod'] }))
            .listen('.room-updated', reloadRoom)
            .listen('.vote-cast', sayVote)
            .listen('.user-updated', (m: Member) => {
                invalidateProfile(m.id);
                setUsers((p) => p.map((u) => (u.id === m.id ? { ...u, ...m } : u)));
                if (m.id === user.id) router.reload({ only: ['auth'] }); // my own menu, coins and name
            })
            .listen('.user-kicked', (k: { user_id: number; banned: boolean }) => {
                if (k.user_id !== user.id) {
                    setUsers((p) => p.filter((u) => u.id !== k.user_id)); // gone from the room for everybody at once, not when their page gets round to leaving
                    return;
                }
                // leave first (the room unmounts and drops off the live channel), then say why: an alert first would keep a tab in the background in the room
                const why = k.banned ? 'You were banned from this room.' : 'You were kicked from this room.';
                router.visit(route('dashboard'), { onFinish: () => alert(why) });
            })
            .listenForWhisper('typing', (m: Member) => {
                setTypers((p) => ({ ...p, [m.id]: m.name }));
                clearTimeout(typingTimers.current[m.id]);
                typingTimers.current[m.id] = setTimeout(
                    () => setTypers(({ [m.id]: _gone, ...rest }) => rest),
                    3000,
                );
            });

        return () => {
            clearTimeout(sweepTimer);
            echo().leave(name);
            channel.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room.id, user.id]);

    useEffect(() => {
        if (guest) return;

        let leaveSent = false;
        const leaveWaitlist = () => {
            if (leaveSent) return;
            leaveSent = true;
            void send('DELETE', route('rooms.leave', room.slug), undefined, { keepalive: true }).catch(() => {});
        };

        window.addEventListener('pagehide', leaveWaitlist);

        return () => {
            window.removeEventListener('pagehide', leaveWaitlist);
            leaveWaitlist();
        };
    }, [guest, room.id]); // not room.slug: a rename changes it while people are here, and that is not leaving (the old address still works for this call)

    // Site-wide broadcasts also show up in this room's chat as system lines (not stored).
    useEffect(() => {
        const ch = echo<'reverb'>().channel('site');
        const onBroadcast = (a: { message: string }) => say('broadcast', `System broadcast: ${a.message}`);
        ch.listen('.announcement', onBroadcast);

        return () => {
            ch.stopListening('.announcement', onBroadcast);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Autowoot (the menu on Woot): a moment after a new song starts, woot it, unless it is mine or I have already wooted or mehed it.
    // The server's `auto` vote only ever adds a woot, so it can never take back one I gave myself.
    const [autowoot, setAutowootState] = useState(prefs.room.autowoot);
    const mineRef = useRef(mine);
    mineRef.current = mine;
    const setAutowoot = (on: boolean) => {
        setAutowootState(on);
        router.patch(route('settings.preferences'), { room: { autowoot: on } }, { preserveScroll: true, preserveState: true, only: ['auth'] });
    };
    useEffect(() => {
        if (!autowoot || guest || !current || current.user_id === user.id || live) return;
        const songId = current.id;
        const timer = setTimeout(() => {
            if (currentRef.current?.id !== songId || mineRef.current.woot || mineRef.current.meh) return;
            setMine((m) => ({ ...m, woot: true, meh: false }));
            post(route('rooms.vote', room.slug), { type: 'woot', item_id: songId, auto: true }).catch(() => setMine((m) => ({ ...m, woot: false })));
        }, 1200 + Math.random() * 2300);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autowoot, guest, current?.id, !!live]);

    // A new song means new votes: forget what I voted on the last one, and the window for grabbing the last one closes.
    useEffect(() => setGrabbing(false), [current?.id]);
    const firstSong = useRef(true);
    useEffect(() => {
        if (firstSong.current) {
            firstSong.current = false;
            return;
        }
        setMine(NO_VOTES);
    }, [current?.id]);

    // Create the player once: YouTube's, with SoundCloud's beside it for the songs that come from there (RoomPlayer picks the one that has the song).
    useEffect(() => {
        if (!box.current) return;

        player.current = new RoomPlayer(box.current, {
            onReady: () => setReady(true),
            onAutoplayBlocked: resumePlaybackMuted,
            onStateChange: (e: { data: number }) => {
                // 0 = ended. Every client reports it; the server ignores duplicates.
                if (e.data === 0 && currentRef.current && !guest) {
                    post(route('rooms.skip', room.slug), { item_id: currentRef.current.id, ended: true }).catch(() => {});
                }
                if (e.data === 2 && currentRef.current && playbackOnRef.current) {
                    const songId = currentRef.current.id;
                    window.setTimeout(() => {
                        const activePlayer = player.current;
                        if (document.visibilityState !== 'visible' || !playbackOnRef.current || currentRef.current?.id !== songId || activePlayer?.getPlayerState?.() !== 2) return;
                        resumePlaybackMuted();
                    }, 750);
                }
            },
        }, roomPosition);
        // Cache the chosen level before the asynchronous provider becomes ready or loads a song.
        player.current.setVolume(effectiveVolumeRef.current);

        return () => {
            player.current?.destroy?.();
            player.current = null;
            setReady(false);
        };
    }, [room.id]); // eslint-disable-line react-hooks/exhaustive-deps -- by room, not by address: a rename must not restart the player

    useEffect(() => {
        if (ready) player.current?.setVolume(effectiveVolume);
    }, [ready, effectiveVolume, current?.id, playbackOn]);

    // Start/stop the video when the song changes, when the player is ready, or when playback is switched on/off.
    useEffect(() => {
        if (!ready || !player.current) return;
        if (current && playbackOn && !live) {
            const at = () => playback.elapsed + (Date.now() - playback.receivedAt) / 1000;
            player.current.load(current.youtube_id, at());

            // Not playing after a moment (or playing without sound): the browser wants a click first. Muted it may always play, so it does, from the right second.
            const t = setTimeout(() => {
                const p = player.current;
                const state = p?.getPlayerState?.();
                if ((state === 1 || state === 3) && (!p?.isMuted?.() || effectiveVolumeRef.current === 0)) return;
                p?.mute?.();
                (state === 1 || state === 3) || p?.load?.(current.youtube_id, at());
                p?.playVideo?.();
                setSilenced(true);
            }, 2500);
            return () => clearTimeout(t);
        } else {
            player.current.stopVideo();
        }
        // Only a different song should reload the video, not a queue change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, playbackOn, current?.id, !!live]);

    useEffect(() => {
        if (!ready || !current) return;

        const sync = playbackSync.current;
        if (sync.songId !== current.id) {
            playbackSync.current = { songId: current.id, receivedAt: playback.receivedAt, lastSeekAt: 0 };
            return;
        }
        if (sync.receivedAt === playback.receivedAt) return;
        sync.receivedAt = playback.receivedAt;
        if (!playbackOn) return;

        const activePlayer = player.current;
        if (activePlayer?.getPlayerState?.() !== 1) return;

        const target = Math.max(0, playback.elapsed + (Date.now() - playback.receivedAt) / 1000);
        const drift = target - (activePlayer.getCurrentTime?.() ?? target);
        const now = Date.now();
        if (Math.abs(drift) < SYNC_THRESHOLD_SECONDS || now - sync.lastSeekAt < SYNC_COOLDOWN_MS) return;

        sync.lastSeekAt = now;
        activePlayer.seekTo?.(target, true);
    }, [ready, current?.id, playback.elapsed, playback.receivedAt, playbackOn]);

    useEffect(() => {
        const resumeWhenVisible = () => {
            if (document.visibilityState !== 'visible' || !playbackOnRef.current || !currentRef.current) return;
            const state = player.current?.getPlayerState?.();
            if (state === 0 || state === 1 || state === 3) return;
            resumePlaybackMuted();
        };

        document.addEventListener('visibilitychange', resumeWhenVisible);
        window.addEventListener('pageshow', resumeWhenVisible);
        return () => {
            document.removeEventListener('visibilitychange', resumeWhenVisible);
            window.removeEventListener('pageshow', resumeWhenVisible);
        };
    }, []);

    const previousTab = useRef(tab);
    useEffect(() => {
        const returnedToRoom = previousTab.current !== 'room' && tab === 'room';
        previousTab.current = tab;
        if (!returnedToRoom || !ready || !current || !playbackOn) return;

        const state = player.current?.getPlayerState?.();
        if (state !== 0 && state !== 1 && state !== 3) resumePlaybackMuted();
    }, [tab, ready, current?.id, playbackOn]);

    useEffect(() => {
        if (!ready || !current || current.duration > 0 || discoveredDuration?.itemId === current.id) return;

        let active = true;
        const syncDuration = () => {
            const duration = Math.round(player.current?.getDuration?.() ?? 0);
            if (!active || !Number.isFinite(duration) || duration < 1 || duration > 86400) return;

            setDiscoveredDuration((previous) => previous?.itemId === current.id && previous.seconds === duration ? previous : { itemId: current.id, seconds: duration });
            if (guest || reportedDuration.current === current.id) return;

            reportedDuration.current = current.id;
            post(route('rooms.duration', room.slug), { item_id: current.id, duration }).catch(() => {
                if (reportedDuration.current === current.id) reportedDuration.current = null;
            });
        };

        syncDuration();
        const timer = window.setInterval(syncDuration, 1000);

        return () => {
            active = false;
            window.clearInterval(timer);
        };
    }, [current?.id, current?.duration, discoveredDuration?.itemId, guest, ready, room.slug]);

    // the first click or key anywhere on the page lets the browser play sound: turn it on
    useEffect(() => {
        if (!silenced) return;
        const events = ['pointerup', 'keydown', 'touchend'] as const;
        const unmute = (e: Event) => {
            if (navigator.userActivation ? !navigator.userActivation.hasBeenActive : (e as KeyboardEvent).key === 'Escape') return; // Esc does not count as a click
            player.current?.unMute?.();
            player.current?.playVideo?.();
            setSilenced(false);
        };
        events.forEach((e) => window.addEventListener(e, unmute, true));
        return () => events.forEach((e) => window.removeEventListener(e, unmute, true));
    }, [silenced]);

    const typing = Object.entries(typers).filter(([id]) => +id !== user.id && !hiddenAuthors.has(+id)).map(([, n]) => n);
    const typingText =
        typing.length === 0 ? '' : typing.length === 1 ? `${typing[0]} is typing…` : typing.length === 2 ? `${typing[0]} and ${typing[1]} are typing…` : 'Several people are typing…';

    const whisperTyping = () => {
        // Whisper at most every 1.5s while the user types.
        if (Date.now() - lastWhisper.current > 1500) {
            lastWhisper.current = Date.now();
            channel.current?.whisper('typing', { id: user.id, name: user.name });
        }
    };

    const vote = (type: keyof Votes) => {
        if (guest) return router.visit(route('login'));
        if (type === 'grab') return setGrabbing(true); // a grab asks which of your playlists the song goes in
        const before = mine;
        // Woot and meh replace each other; repeating either one takes it back.
        setMine({ ...mine, woot: type === 'woot' ? !mine.woot : false, meh: type === 'meh' ? !mine.meh : false });
        post(route('rooms.vote', room.slug), { type }).catch(() => setMine(before));
    };

    // Join Waitlist queues the next track of my active playlist; with no playlist, or an empty one, the playlists open. Leave takes my songs out (if mine is playing it is skipped).
    const joinOrLeave = () => {
        if (guest) return router.visit(route('login'));
        setLeaving(true);
        const stop = () => setLeaving(false);

        if (inList) {
            send('DELETE', route('rooms.leave', room.slug)).then(() => setDeckKey((k) => k + 1)).catch((e: Error) => say('error', e.message)).finally(stop);
            return;
        }

        sendJson<{ queued: boolean; reason?: 'already' | 'no_playlist' | 'empty' | 'full' }>('POST', route('rooms.join', room.slug))
            .then((r) => {
                if (r.queued || r.reason === 'already') return;
                if (r.reason === 'full') return say('join', `The waitlist is full (${playback.max} people). Try again when somebody leaves.`);
                say('join', r.reason === 'empty' ? 'Your active playlist is empty. Add songs to it, then press Join Waitlist.' : 'Make a playlist and add songs to it, then press Join Waitlist.');
                setPanel('playlists');
            })
            .catch((e: Error) => say('error', e.message))
            .finally(stop);
    };

    const assign = (userId: number, roleId: string) =>
        send('PUT', route('rooms.members.assign', [room.slug, userId]), { room_role_id: roleId ? Number(roleId) : null })
            .catch((e: Error) => setNotice(e.message));

    const mute = (u: Member) => {
        const length = prompt(`Mute ${u.name} for how long? 10m, 1h, 24h or forever`, '1h')?.trim();
        if (length) send('POST', route('rooms.mute', [room.slug, u.id]), { for: length }).then(() => router.reload({ only: ['mod'] })).catch((e: Error) => setNotice(e.message));
    };

    const moderate = (action: 'kick' | 'ban', u: Member) => {
        if (action === 'ban' && !confirm(`Ban ${u.name} from this room?`)) return;
        send('POST', route(`rooms.${action}`, [room.slug, u.id])).catch((e: Error) => setNotice(e.message));
    };

    const announce = (e: FormEvent) => {
        e.preventDefault();
        const message = announcement.trim();
        if (!message) return;
        setAnnouncement('');
        post(route('rooms.announce', room.slug), { message }).catch(() => setAnnouncement(message));
    };

    const rankedUsers = sortRoomUsersByWeight(users, roleOrder);
    const isSiteRanked = (member: Member) => !member.is_bot && roomUserWeight(member, roleOrder) < roleOrder.length;
    // the heading of a person's highest site role (Role::group); plain users and bots have none
    const teamOf = (member: Member) => (isSiteRanked(member) ? roleGroupOf[roleOrder[roomUserWeight(member, roleOrder) - 1]] : null);
    const roleGroups = [
        { role: { key: 'site-team', label: 'Staff', color: '#a78bfa' }, people: rankedUsers.filter((member) => teamOf(member) === 'staff') },
        { role: { key: 'staff2-team', label: 'Staff 2', color: '#facc15' }, people: rankedUsers.filter((member) => teamOf(member) === 'staff2') },
        { role: { key: 'creator-team', label: 'Creator / Contributor', color: '#f0abfc' }, people: rankedUsers.filter((member) => teamOf(member) === 'creator') },
        { role: { key: 'community-team', label: 'Community / Status', color: '#67e8f9' }, people: rankedUsers.filter((member) => teamOf(member) === 'community') },
        { role: HOST_ROLE, people: rankedUsers.filter((member) => member.id === host.id && !isSiteRanked(member)) },
        ...[...roles].sort((a, b) => a.rank - b.rank).map((roomRole) => ({
            role: { key: `room-${roomRole.id}`, label: roomRole.name, color: roomRole.color },
            people: rankedUsers.filter((member) => !isSiteRanked(member) && !member.is_bot && member.id !== host.id && members[member.id] === roomRole.id),
        })),
        { role: USER_ROLE, people: rankedUsers.filter((member) => !isSiteRanked(member) && !member.is_bot && member.id !== host.id && !roles.some((roomRole) => roomRole.id === members[member.id])) },
        { role: { key: 'api-bot', label: 'API Bots', color: '#38bdf8' }, people: rankedUsers.filter((member) => member.is_bot) },
    ].filter((group) => group.people.length > 0);

    // whoever is in the room right now is drawn as they are now: a new frame or a new flag shows in the chat lines they wrote before, too
    const here = new Map(users.map((u) => [u.id, u]));
    const shownMessages = messages.filter((m) => !isTransientActivity(m) && !hiddenAuthors.has(m.user_id)).map((message) => {
        const m = message.reply?.user_id && hiddenAuthors.has(message.reply.user_id) ? { ...message, reply: null } : message;
        if (m.type !== 'system' && !guest && m.user_id === user.id) {
            return { ...m, avatar: user.avatar, cosmetics: user.cosmetics, badges: user.badges, level: user.level, role: user.primary_role };
        }
        const u = m.type === 'system' ? undefined : here.get(m.user_id);

        return u ? { ...m, avatar: u.avatar, cosmetics: u.cosmetics, badges: u.badges ?? m.badges, level: u.level ?? m.level, role: u.role ?? m.role } : m;
    });

    const tabs: [Tab, string, string][] = [
        ['room', 'Room', 'sfd-tabroom '],
        ['chat', 'Chat', 'sfd-tabchat '],
        ['waitlist', `Waitlist (${waitlist.length}/${playback.max})`, 'sfd-tabwaitlist '],
        ['users', `Users (${users.length + watchers.length})`, 'sfd-tabusers '],
    ];

    return (
        <>
            <Head title={room.name} />
            {room.css && <style data-room-css>{room.css}</style>}
            <div className="sfd-room isolate flex h-dvh overflow-hidden bg-black text-white" data-room-layout={prefs.room.compact_layout ? 'compact' : 'normal'} data-rendering={touchRendering ? 'touch' : 'full'}>
                <Sidebar
                    room={{
                        slug: room.slug,
                        name: room.name,
                        canLive: !!can.go_live,
                        isLive: !!live,
                        onRoom: () => { setPage(null); setPanel(null); },
                        onPlaylists: () => setPanel('playlists'),
                        onWhispers: () => { setWhisperTo(null); setPanel('whispers'); },
                        onLive: () => setPanel('live'),
                        onOpenPage: (url, title) => setPage({ url, title }),
                    }}
                />

                <main style={subscriptionVars(host.cosmetics?.subscription)} data-sub-theme={perk(host.cosmetics?.subscription, 'theme') || undefined} className={`sfd-main relative ${tab === 'room' ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col ${backgroundClass(room.background)}`}>
                    <Live />
                    <SubscriptionRoomEffects host={host.cosmetics} dj={dj?.cosmetics} songId={current?.id} entranceSounds={prefs.audio.entrance_sounds} />

                    <RoomHeader
                        room={room}
                        host={host}
                        listening={users.length + watchers.length}
                        dj={dj}
                        title={current?.title ?? null}
                        live={live}
                        playing={(!!current || !!live) && playbackOn}
                        elapsed={playback.elapsed}
                        receivedAt={playback.receivedAt}
                        duration={current?.duration || (current && discoveredDuration?.itemId === current.id ? discoveredDuration.seconds : 0)}
                        volume={volume}
                        muted={muted}
                        onVolume={(v) => { setVolume(v); setMuted(false); }}
                        onMute={() => setMuted(!muted)}
                        social={community.social}
                        onDj={(u, anchor) => setCard({ user: u, anchor })}
                    />

                    {/* the room: the video on the big screen, the DJ in front of the booth, Woot / Grab / Meh on one side of it and Join Waitlist on the other, everybody else standing until they press Woot or Grab */}
                    <RoomScene
                        background={room.background}
                        cosmetics={host.cosmetics}
                        image={room.custom_background_url}
                        users={users}
                        dj={dj}
                        dancing={dancing}
                        playing={(!!current || !!live) && playbackOn}
                        myId={user.id}
                        onUser={(u, anchor) => setCard({ user: u, anchor })}
                        waitlist={<WaitlistCard inList={inList} etaSeconds={etaSeconds} etaSince={etaSince} locked={closed} full={waitlist.length >= playback.max} busy={leaving} onClick={joinOrLeave} />}
                        seat={<SeatButton locked={closed} onClick={joinOrLeave} />}
                        votes={<VoteBar votes={playback.votes} mine={mine} disabled={!current || !!live || current.user_id === user.id} ownSong={!!current && current.user_id === user.id} onVote={vote} autowoot={autowoot} onAutowoot={guest ? undefined : setAutowoot} />}
                        playbackSource={playbackOn ? live ? { key: `live:${live.kind}:${live.ref}`, title: live.title, live, position: () => 0 } : current && !isSoundCloud(current.youtube_id) ? { key: String(current.id), title: current.title, youtubeId: current.youtube_id, position: roomPosition } : null : null}
                        screen={
                            <>
                                <div ref={box} className="absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full" />
                                {live && playbackOn && <LiveScreen live={live} volume={volume} muted={muted || previewing} />}
                                {playbackOn && current && !live && (
                                    // point at the video and a button appears: it opens the song on YouTube (or SoundCloud), at the place it is at now
                                    <div className="pointer-events-none group absolute inset-0">
                                        {isSoundCloud(current.youtube_id) ? (
                                            <button
                                                type="button"
                                                onClick={() => window.open(player.current?.openUrl?.(roomPosition()) ?? `https://soundcloud.com/search?q=${encodeURIComponent(current.title)}`, '_blank', 'noopener,noreferrer')}
                                                title="Open this track on SoundCloud, at the place it is at now"
                                                className="unscale pointer-events-auto absolute right-3 top-12 flex origin-top-right items-center gap-1.5 rounded-lg bg-black/75 px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-lg ring-1 ring-white/25 transition hover:bg-orange-600 focus-visible:opacity-100 group-hover/playback:opacity-100"
                                            >
                                                <ExternalLink size={15} /> Open on SoundCloud
                                            </button>
                                        ) : (
                                            <a
                                                href={`https://www.youtube.com/watch?v=${current.youtube_id}&t=${Math.floor(position)}s`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Open this video on YouTube, at the place it is at now"
                                                className="unscale pointer-events-auto absolute right-3 top-12 flex origin-top-right items-center gap-1.5 rounded-lg bg-black/75 px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-lg ring-1 ring-white/25 transition hover:bg-red-600 focus-visible:opacity-100 group-hover/playback:opacity-100"
                                            >
                                                <SocialIcon name="youtube" size={15} /> Open on YouTube
                                            </a>
                                        )}
                                    </div>
                                )}
                                {silenced && playbackOn && current && !live && (
                                    // the browser keeps the sound back until a click: any click does, this one says so
                                    <div className="absolute inset-x-0 bottom-3 flex justify-center">
                                            <button onClick={() => { player.current?.unMute?.(); player.current?.playVideo?.(); setMuted(false); setSilenced(false); }} className="unscale flex origin-bottom items-center gap-2 rounded-full bg-black/80 px-4 py-2 text-sm font-semibold text-white shadow-lg ring-1 ring-white/25 hover:bg-violet-600">
                                                <VolumeX size={16} /> Tap to start playback with sound
                                        </button>
                                    </div>
                                )}
                                {!playbackOn ? (
                                    <button onClick={() => setPlaybackOn(true)} className="absolute inset-0 flex items-center justify-center bg-neutral-900 text-neutral-300 hover:text-white">
                                        <span className="unscale text-base">Playback is off. Click to turn it on.</span>
                                    </button>
                                ) : (
                                    !current && !live && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/90">
                                            <div className="unscale flex flex-col items-center gap-3 text-center">
                                                <span className="text-lg font-semibold text-neutral-200">Waiting for the next DJ…</span>
                                                {guest ? (
                                                    <Link href={route('login')} className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500">Log in to be the next DJ</Link>
                                                ) : (
                                                    <button onClick={() => setPanel('playlists')} className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500">Open playlists</button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                )}
                            </>
                        }
                    />

                    <RoomFootbar
                        guest={guest}
                        slug={room.slug}
                        onOpenPage={(url, title) => setPage({ url, title })}
                        playbackOn={playbackOn}
                        onPlayback={() => setPlaybackOn(!playbackOn)}
                        canSkip={!!current && !live && canSkip(current)}
                        onSkip={() => current && post(route('rooms.skip', room.slug), { item_id: current.id })}
                        onPlaylists={() => setPanel('playlists')}
                        onRoomInfo={() => setPanel('info')}
                        onUpdates={roomReleases.features.includes('room_updates') ? () => setPanel('updates') : undefined}
                        canModerate={canModerate}
                        onModeration={() => setPanel('moderation')}
                        community={community}
                        refreshKey={`${current?.id ?? 0}-${deckKey}`}
                    />
                </main>

                <aside className={`sfd-panel ${tab === 'room' ? 'fixed bottom-17 left-14 right-0 z-20 flex h-14 md:static md:z-auto md:h-auto' : 'flex'} min-w-0 flex-1 flex-col border-t border-neutral-800 bg-black md:w-80 md:flex-none md:border-l md:border-t-0`}>
                    <div className="sfd-tabs flex h-14 shrink-0 border-b border-neutral-800">
                        {tabs.map(([key, label, cssClass]) => (
                            <button
                                key={key}
                                onClick={() => setTab(key)}
                                className={`sfd-tab ${cssClass}flex-1 text-xs font-semibold ${key === 'room' ? 'md:hidden' : ''} ${tab === key ? 'sfd-tabactive border-b-2 border-violet-500 text-white' : 'sfd-tabinactive text-neutral-500 hover:text-neutral-300'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {tab === 'chat' && <button onClick={() => setTab('users')} className="shrink-0 border-b border-white/10 px-3 py-2 text-left text-xs text-neutral-400 hover:text-white" data-room-watchers>{watchers.length} {watchers.length === 1 ? 'guest watching' : 'guests watching'} · View people</button>}
                    {tab === 'chat' && (
                        <ChatPanel
                            slug={room.slug}
                            welcome={room.welcome_message ? `Welcome to ${room.name}: ${room.welcome_message}` : null}
                            messages={shownMessages}
                            onReactionUpdate={(data) => setMessages((items) => items.map((m) => m.id === data.id ? { ...m, reactions: data.reactions } : m))}
                            userId={user.id}
                            canDelete={can.moderate_chat}
                            emojis={emojis}
                            stickers={stickers}
                            typingText={typingText}
                            typingEffect={perk(users.find((member) => Object.keys(typers).includes(String(member.id)))?.cosmetics?.subscription, 'typing')}
                            onType={whisperTyping}
                            roomRoleOf={roomRoleOf}
                            chatSize={prefs.appearance.chat_size}
                            compactChat={prefs.appearance.compact_chat}
                            onCompactChat={guest ? undefined : (on) => saveCompactPreference('compact_chat', on)}
                            showAvatars={prefs.appearance.show_avatars}
                            readOnly={guest}
                            myName={user.name}
                            onUser={(u, anchor) => setCard({ user: u, anchor })}
                            onWhisper={(id) => { setWhisperTo(id); setPanel('whispers'); }}
                            mention={mention}
                            onMentionConsumed={() => setMention(null)}
                            showBadges={prefs.appearance.show_badges}
                            highlightMentions={prefs.notifications.mentions}
                            onPatchNotes={() => setPage({ url: route('patch-notes'), title: 'Patch notes' })}
                        />
                    )}

                    {tab === 'waitlist' && (
                        <div className="sfd-waitlist flex min-h-0 flex-1 flex-col">
                            <div className="sfd-waitliststatus flex shrink-0 items-center justify-between gap-2 border-b border-neutral-800 p-3 text-xs">
                                <span className="sfd-waitlistposition text-neutral-400">
                                    {myPosition >= 0 ? (myPosition === 0 && current ? 'You are playing now' : `You are #${myPosition} in line`) : 'You are not in the waitlist'}
                                </span>
                            </div>
                            {(playback.locked || playback.cycle) && (
                                <p className="sfd-waitlistflags flex shrink-0 gap-3 border-b border-neutral-800 px-3 py-2 text-xs text-neutral-400">
                                    {playback.locked && <span className="sfd-waitlistlocked text-amber-300">🔒 Waitlist locked</span>}
                                    {playback.cycle && <span className="sfd-waitlistcycle text-sky-300">🔁 Cycling</span>}
                                </p>
                            )}
                            <ol className="sfd-waitlistentries flex-1 space-y-2 overflow-y-auto overflow-x-hidden p-3 text-sm">
                                {waitlist.length === 0 && <li className="sfd-waitlistempty text-neutral-500">Nobody is in the waitlist. Press Join Waitlist to be the first.</li>}
                                {waitlist.map((s, i) => {
                                    const dj = users.find((u) => u.id === s.user_id);

                                    return (
                                        <li key={s.id} data-queue-highlight={dj?.cosmetics?.subscription?.queue_highlight || undefined} style={subscriptionVars(dj?.cosmetics?.subscription)} className={`sfd-waitlistentry flex items-center gap-2.5 rounded-lg px-2 py-1.5 ${i === 0 && current ? 'sfd-waitlistplaying bg-violet-500/10' : ''}`}>
                                            <span className="sfd-waitlistnumber w-5 shrink-0 text-center text-xs text-neutral-500">{i === 0 && current ? '▶' : i}</span>
                                            <Avatar name={s.added_by} avatar={dj?.avatar ?? null} cosmetics={dj?.cosmetics} className="h-8 w-8 text-sm" />
                                            <div className="min-w-0 flex-1">
                                                <p className="sfd-waitlistname truncate font-semibold" style={{ color: dj?.role.color }}><SubscriberName cosmetics={dj?.cosmetics}>{s.added_by}</SubscriberName>{s.user_id === user.id && <span className="ml-1.5 text-xs font-normal text-green-400">you</span>}</p>
                                                <p className="sfd-waitlistsong truncate text-xs text-neutral-400" title={s.title}>{s.title}</p>
                                                <p className="sfd-waitlisteta text-[11px] text-neutral-500">{i === 0 && current ? 'playing now' : i === 1 ? 'next' : `in ${i} turns`}</p>
                                            </div>
                                            {can.manage_queue && (
                                                <button
                                                    onClick={() => send('DELETE', route('rooms.remove', [room.slug, s.id]))}
                                                    className="sfd-waitlistremove shrink-0 text-neutral-600 hover:text-red-400"
                                                    aria-label={`Remove ${s.added_by} from the waitlist`}
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                    )}

                    {tab === 'users' && (
                        <div className="sfd-users flex-1 overflow-y-auto overflow-x-hidden p-3 text-sm">
                            <div className="sfd-usersinfo mb-3 rounded-lg bg-white/5 p-3 text-xs text-neutral-300">
                                <p className="sfd-userstitle font-semibold text-white">{room.name} community</p>
                                <p className="sfd-userscount text-neutral-400">{users.length} {users.length === 1 ? 'member' : 'members'} · {watchers.length} {watchers.length === 1 ? 'guest' : 'guests'} watching</p>
                            </div>
                            {notice && <p className="sfd-usersnotice mb-2 rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-300">{notice}</p>}
                            <div className="sfd-userssearch relative mb-3"><Search size={15} className="pointer-events-none absolute left-3 top-3 text-neutral-400" /><input value={peopleSearch} onChange={(e) => setPeopleSearch(e.target.value)} aria-label="Search people in this room" placeholder="Find someone…" className="sfd-userssearchinput w-full rounded-xl border-white/10 bg-neutral-900 py-2 pl-9 text-sm text-white placeholder-neutral-500 focus:border-violet-400 focus:ring-violet-400" /></div>
                            {peopleSearch && ![...users, ...watchers].some((u) => u.name.toLowerCase().includes(peopleSearch.trim().toLowerCase())) && <p className="sfd-usersempty py-6 text-center text-xs text-neutral-400">No members match your search.</p>}
                            {/* everybody under the room role they hold: the host, then the roles in their order, then everyone else */}
                            {roleGroups.map(({ role, people }) => ({ role, people: people.filter((u) => u.name.toLowerCase().includes(peopleSearch.trim().toLowerCase())) })).filter((g) => g.people.length > 0).map(({ role, people }) => (
                                <section key={role.key} className="sfd-usersgroup mb-3" data-role-group={role.label}>
                                    <div className="sfd-usersgroupheader mb-1.5 flex items-center justify-between gap-2">
                                        <span className="sfd-usersrole inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold uppercase leading-none tracking-wider" style={{ color: role.color, borderColor: `${role.color}59`, backgroundColor: `${role.color}1a` }}>
                                            {role.key === 'site-team' ? <ShieldCheck size={13} /> : role.key === 'staff2-team' ? '🧩' : role.key === 'creator-team' ? '🎨' : role.key === 'community-team' ? '💎' : role.key === 'api-bot' ? '🤖' : <RoleGlyph role={role} size={13} />} {role.label}
                                        </span>
                                        <span className="sfd-usersrolecount rounded-md border border-white/10 bg-white/5 px-1.5 py-1 text-[11px] font-bold leading-none text-neutral-400">{people.length}</span>
                                    </div>
                                    <ul className="sfd-usersentries space-y-1.5">
                                        {people.map((u) => {
                                            const rr = roomRoleOf(u.id);
                                            
                                            

                                            return (
                                                <li key={u.id} className={`sfd-user rounded-xl border p-3 ${current?.user_id === u.id ? 'sfd-usercurrent border-violet-400/30 bg-violet-500/10' : 'border-white/8 bg-white/3'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={(e) => setCard({ user: u, anchor: e.currentTarget.getBoundingClientRect() })} aria-label={`View ${u.name}'s profile`} className="sfd-useravatar relative shrink-0"><Avatar name={u.name} avatar={u.avatar} cosmetics={u.cosmetics} className="h-10 w-10" /><StatusDot status={u.status} className="sfd-userstatus absolute -bottom-0.5 -right-0.5" /></button>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5"><button onClick={(e) => setCard({ user: u, anchor: e.currentTarget.getBoundingClientRect() })} className="sfd-username min-w-0 truncate text-left text-sm font-semibold text-neutral-100 hover:text-violet-200"><SubscriberName cosmetics={u.cosmetics}>{u.name}</SubscriberName></button>{u.id === user.id && <span className="sfd-useryou shrink-0 text-[10px] text-neutral-400">you</span>}<Flag flag={u.flag} className="sfd-userflag h-3 shrink-0" /></div>
                                                            <p className="sfd-usermeta mt-1 truncate text-[11px] text-neutral-400">{u.id === host.id ? 'Room host' : rr?.label ?? u.role.label}{u.level !== undefined && ` · Level ${u.level}`}</p>
                                                        </div>
                                                        <button onClick={(e) => setCard({ user: u, anchor: e.currentTarget.getBoundingClientRect() })} aria-label={`Actions for ${u.name}`} title="Profile and actions" className="sfd-useractions shrink-0 rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"><Ellipsis size={18} /></button>
                                                    </div>
                                                    {(current?.user_id === u.id || friendIds.includes(u.id)) && <div className="sfd-userbadges mt-2 flex flex-wrap items-center gap-2 border-t border-white/5 pt-2 text-[10px]">{current?.user_id === u.id && <span className="sfd-userplaying inline-flex items-center gap-1 font-semibold text-violet-200"><Disc3 size={12} /> Playing now</span>}{friendIds.includes(u.id) && <span className="sfd-userfriend inline-flex items-center gap-1 text-emerald-300"><UserCheck size={12} /> Friend</span>}</div>}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </section>
                            ))}
                            <RoomGuestList guests={watchers} search={peopleSearch} />
                        </div>
                    )}
                </aside>

                <RoomNotifications
                    notifications={notifications}
                    onDismiss={(id) => {
                        window.clearTimeout(notificationTimers.current[id]);
                        delete notificationTimers.current[id];
                        setNotifications((p) => p.filter((n) => n.id !== id));
                    }}
                />
            </div>

            {card && (
                <Suspense fallback={null}>
                    <UserCard
                        user={users.find((member) => member.id === card.user.id) ?? card.user}
                        anchor={card.anchor}
                        viewerId={user.id}
                        guest={guest}
                        onClose={() => setCard(null)}
                        room={{
                            slug: room.slug,
                            hostId: host.id,
                            can,
                            roleOf: roomRoleOf(card.user.id),
                            memberRoleId: members[card.user.id] ?? null,
                            roles,
                            mutedUntil: mod?.muted.find((m) => m.id === card.user.id)?.until,
                            here: users.some((u) => u.id === card.user.id),
                            friendIds,
                            onProfile: () => setPage({ url: route('users.show', card.user.id), title: `${card.user.name}'s profile` }),
                            onMention: () => { setTab('chat'); setMention({ name: card.user.name, n: Date.now() }); },
                            onWhisper: () => { setWhisperTo(card.user.id); setPanel('whispers'); },
                            onFriendAdded: () => setFriendIds((ids) => ids.includes(card.user.id) ? ids : [...ids, card.user.id]),
                            onChanged: () => router.reload({ only: ['mod', 'members', 'memberList', 'roles', 'can', 'bans'] }),
                        }}
                    />
                </Suspense>
            )}

            {page && <Suspense fallback={null}><PageOverlay url={page.url} title={page.title} onClose={() => { setPage(null); refreshCounts(); }} /></Suspense>}
            <Suspense fallback={null}><SupportWidget launcher={false} /></Suspense>{/* no bubble in the room: More → Contact support opens it */}

            {grabbing && current && (
                <Suspense fallback={null}>
                    <GrabDialog
                        slug={room.slug}
                        song={{ id: current.id, title: current.title, thumbnail: current.thumbnail, added_by: current.added_by }}
                        onClose={() => setGrabbing(false)}
                        onGrabbed={(r) => {
                            setGrabbing(false);
                            setMine((m) => ({ ...m, grab: true }));
                            setDeckKey((k) => k + 1); // my playlists changed: the bar at the bottom reads them again
                            notify('grab', r.added ? `You saved “${current.title}” in ${r.playlist.name} (${r.songs} ${r.songs === 1 ? 'song' : 'songs'}).` : `“${current.title}” is in ${r.playlist.name} already.`);
                        }}
                    />
                </Suspense>
            )}

            {rulesOpen && (
                <RulesModal
                    roomName={room.name}
                    rules={rules}
                    onAgree={() => { agreeToRules(room.id, rules, false); setRulesOpen(false); }}
                    onAlways={() => { agreeToRules(room.id, rules, true); setRulesOpen(false); }}
                />
            )}

            {panel === 'whispers' && (
                <Panel title="Whispers" onClose={() => setPanel(null)} wide>
                    <Suspense fallback={loadingPanel}><WhisperBox start={whisperTo} className="h-[62vh] min-h-96" openProfile={(id, name) => { setPanel(null); setPage({ url: route('users.show', id), title: `${name}'s profile` }); }} /></Suspense>
                </Panel>
            )}

            {panel === 'live' && (
                <Panel title="Live stream" onClose={() => setPanel(null)}>
                    <Suspense fallback={loadingPanel}><LiveControls slug={room.slug} live={live} /></Suspense>
                </Panel>
            )}

            {panel === 'updates' && roomReleases.features.includes('room_updates') && <Panel title="Room updates" onClose={() => setPanel(null)} large><Suspense fallback={loadingPanel}><RoomUpdatesPanel slug={room.slug} /></Suspense></Panel>}

            {panel === 'playlists' && (
                <div className="sfd-room text-white">
                <Panel title="Playlists" onClose={() => setPanel(null)} full bare>
                    <Suspense fallback={loadingPanel}><PlaylistManager onClose={() => setPanel(null)} onChanged={() => setDeckKey((k) => k + 1)} className="min-h-0 flex-1" /></Suspense>
                </Panel>
                </div>
            )}

            {panel === 'info' && (
                <Panel title="Room info" onClose={() => setPanel(null)} large bare>
                    <Suspense fallback={loadingPanel}>
                        <RoomInfoPanel
                            room={room}
                            host={host}
                            online={users}
                            team={roles.map((r) => ({ role: { key: `room-${r.id}`, label: r.name, color: r.color }, people: users.filter((u) => members[u.id] === r.id) }))}
                            now={current ? { title: current.title, thumbnail: current.thumbnail, added_by: current.added_by } : null}
                            queue={playback.queue.length}
                            stats={stats}
                            canEdit={canEditRoom}
                            guest={guest}
                            myId={user.id}
                            onEdit={() => setPanel('settings')}
                            onClose={() => setPanel(null)}
                            onProfile={(id, name) => { setPanel(null); setPage({ url: route('users.show', id), title: `${name}'s profile` }); }}
                            onWhisper={(id) => { setWhisperTo(id); setPanel('whispers'); }}
                        />
                    </Suspense>
                </Panel>
            )}

            {panel === 'settings' && (
                <Panel title="Room settings" onClose={() => setPanel(null)} wide>
                    <Suspense fallback={loadingPanel}>
                        <RoomSettingsPanel
                            room={room}
                            genres={genres}
                            backgrounds={backgrounds}
                            seasons={seasons}
                            canLock={canLock}
                            can={can}
                            roles={roles}
                            memberList={memberList}
                            permissionLabels={permissionLabels}
                            emojis={emojis}
                            canCss={user.id === host.id || user.is_staff}
                            live={live}
                            locked={playback.locked}
                            cycle={playback.cycle}
                            onOpenPage={(url, title) => setPage({ url, title })}
                        />
                    </Suspense>
                </Panel>
            )}

            {panel === 'moderation' && (
                <Panel wide title="Room moderation" onClose={() => setPanel(null)}>
                    <Suspense fallback={loadingPanel}>
                        <ModerationPanel
                            slug={room.slug}
                            can={can}
                            mod={mod}
                            bans={bans}
                            online={users.filter((u) => u.id !== user.id && u.id !== host.id)}
                            currentSongId={current?.id ?? null}
                            announcement={announcement}
                            setAnnouncement={setAnnouncement}
                            announce={announce}
                        />
                    </Suspense>
                </Panel>
            )}
        </>
    );
}
