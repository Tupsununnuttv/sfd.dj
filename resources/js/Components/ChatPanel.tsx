import { Cosmetics } from '@/lib/cosmetics';
import Avatar from '@/Components/Avatar';
import Badges from '@/Components/Badges';
import { VERSION } from '@/lib/patchNotes';
import ContextMenu, { MenuAnchor, MenuItem } from '@/Components/ContextMenu';
import PeekCard from '@/Components/PeekCard';
import { EMOTE_TOKEN, EmoteInfo, emoteUrl, parseToken, tokenOf, useGlobalEmotes } from '@/lib/emotes';
import RoleBadge from '@/Components/RoleBadge';
import { CardUser } from '@/Components/UserCard';
import { getJson, post, send, sendJson, upload } from '@/lib/post';
import { RoleInfo } from '@/types';
import { Link } from '@inertiajs/react';
import { AtSign, Check, Copy, Ellipsis, MessageCircle, Reply, Trash2, UserRound, X } from 'lucide-react';
import { FormEvent, MouseEvent, ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface ChatMessageData {
    id: number;
    created_at?: string;
    type: 'user' | 'system';
    kind: string | null;
    body: string;
    user: string;
    user_id: number;
    avatar: string | null;
    cosmetics?: Cosmetics | null;
    role: RoleInfo;
    badges?: RoleInfo[];
    level?: number;
    sticker?: string | null;
    image_url?: string | null;
    reply?: { id: number; user: string | null; body: string | null } | null;
}

export interface RoomEmojiData {
    id: number;
    name: string;
    url: string;
}

const EMOJIS: Record<string, string[]> = {
    Smileys: ['😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😎', '🤩', '🥳', '😜', '🤔', '😴', '😭', '😡', '🤯', '🥺', '😅', '🙃', '😇'],
    Hands: ['👍', '👎', '👏', '🙌', '🤘', '✌️', '🤞', '🙏', '💪', '👋', '🤝', '🫶'],
    Music: ['🎧', '🎵', '🎶', '🎸', '🥁', '🎹', '🎤', '🎷', '🎺', '🎻', '💃', '🕺', '🪩'],
    Party: ['🎉', '🔥', '💯', '✨', '🚀', '👑', '💎', '🌈', '⭐', '🍻', '🍕', '🎂'],
    Hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '💖'],
};

const systemIcon: Record<string, string> = {
    grab: '💾', kick: '🥾', ban: '🔨', promote: '⬆️', demote: '⬇️', skip: '⏭️',
    remove: '🗑️', leave: '🚪', exit: '🚪', woot: '👍', meh: '👎', join: '👋', announcement: '📣', broadcast: '📢', welcome: '🎉', mute: '🔇', waitlist: '🔒', ended: '⏹️', donation: '💖',
};

// every kind of system line has its own colour (full class names, so Tailwind keeps them)
const systemTone: Record<string, string> = {
    join: 'text-emerald-400', promote: 'text-emerald-400', leave: 'text-orange-400', demote: 'text-orange-400', waitlist: 'text-sky-400',
    ended: 'text-cyan-300', skip: 'text-yellow-400', remove: 'text-rose-400', grab: 'text-pink-400', exit: 'text-neutral-500', woot: 'text-lime-400', meh: 'text-rose-400', kick: 'text-red-400', ban: 'text-red-500', mute: 'text-fuchsia-400', donation: 'text-pink-300',
};

export function RoomNotifications({ notifications, onDismiss }: {
    notifications: { id: number; kind: string; body: string }[];
    onDismiss: (id: number) => void;
}) {
    if (notifications.length === 0) return null;

    return (
        <div className="pointer-events-none fixed left-2 right-2 top-14 z-40 flex max-h-[40vh] flex-col gap-1.5 overflow-y-auto md:left-auto md:right-84 md:top-16 md:w-[min(22rem,calc(100vw-23rem))]" aria-label="Room notifications" aria-live="polite">
            {notifications.map((notification) => (
                <div key={notification.id} className={`pointer-events-auto animate-rise flex items-start gap-2 rounded-md border border-white/10 bg-neutral-900/95 px-2.5 py-2 text-xs shadow-lg ${systemTone[notification.kind] ?? 'text-neutral-300'}`}>
                    <span aria-hidden className="shrink-0">{systemIcon[notification.kind] ?? '•'}</span>
                    <p className="min-w-0 flex-1 wrap-break-word font-medium">{notification.body}</p>
                    <button type="button" onClick={() => onDismiss(notification.id)} title="Dismiss notification" aria-label="Dismiss notification" className="-mr-1 -mt-1 shrink-0 rounded p-1 text-neutral-500 hover:bg-white/10 hover:text-white">
                        <X size={13} />
                    </button>
                </div>
            ))}
        </div>
    );
}

const chatText = { small: 'text-xs', normal: 'text-sm', large: 'text-base' };
const input = 'w-full rounded border-neutral-700 bg-neutral-900 text-sm text-white placeholder-neutral-500 focus:border-violet-500 focus:ring-0';
const tool = 'rounded-md p-1.5 text-neutral-400 transition hover:bg-white/10 hover:text-white';

type Picker = 'emoji' | 'gif' | 'sticker' | 'room' | 'bttv' | '7tv' | null;

const SPLIT = new RegExp(`(${EMOTE_TOKEN}|:[a-z0-9_]{2,20}:)`);

/** Replace :name: with the room's custom emoji image, and :bttv:ID: / :7tv:ID: with that emote. */
function withEmojis(body: string, emojis: RoomEmojiData[]): ReactNode[] {
    return body.split(SPLIT).map((part, i) => {
        if (new RegExp(`^${EMOTE_TOKEN}$`).test(part)) {
            const { source, id } = parseToken(part);
            return <img key={i} src={emoteUrl(source, id)} alt="emote" title={source === 'bttv' ? 'BetterTTV emote' : '7TV emote'} loading="lazy" className="mx-0.5 inline h-7 w-auto max-w-20 align-middle" />;
        }
        const e = emojis.find((x) => `:${x.name}:` === part);
        return e ? <img key={i} src={e.url} alt={part} title={part} className="mx-0.5 inline h-6 w-6 align-middle" /> : part;
    });
}

/** BetterTTV (global set) or 7TV (global set + search): click an emote to put its name in the message. */
function EmotePicker({ source, onPick }: { source: 'bttv' | '7tv'; onPick: (e: EmoteInfo) => void }) {
    const globals = useGlobalEmotes();
    const [q, setQ] = useState('');
    const [found, setFound] = useState<EmoteInfo[] | null>(null);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    useEffect(() => {
        setFound(null);
        setError('');
        if (source !== '7tv' || q.trim().length < 2) return;
        const t = setTimeout(() => {
            getJson<{ id: string; name: string }[]>(`${route('emotes.search')}?q=${encodeURIComponent(q.trim())}`)
                .then((r) => setFound(r.map((e) => ({ ...e, source: '7tv' as const }))))
                .catch((e: Error) => setError(e.message));
        }, 350);
        return () => clearTimeout(t);
    }, [q, source]);

    const all = globals?.[source] ?? [];
    const list = found ?? all.filter((e) => e.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 150);

    return (
        <div className="space-y-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={source === '7tv' ? 'Search all 7TV emotes' : 'Search BetterTTV global emotes'} className={input} autoFocus />
            {error && <p className="text-xs text-amber-300">{error}</p>}
            {globals === null && <p className="text-xs text-neutral-500">Loading emotes…</p>}
            {globals !== null && all.length === 0 && !found && <p className="text-xs text-neutral-500">Could not load the emote list right now.</p>}
            <div className="grid max-h-56 grid-cols-7 gap-1 overflow-y-auto">
                {list.map((e) => (
                    <button key={e.id} onClick={() => onPick(e)} title={e.name} className="flex h-10 items-center justify-center rounded hover:bg-neutral-800">
                        <img src={emoteUrl(e.source, e.id)} alt={e.name} loading="lazy" className="max-h-8 max-w-full object-contain" />
                    </button>
                ))}
            </div>
        </div>
    );
}

function GifPicker({ onPick }: { onPick: (url: string, analyticsUrl?: string) => void }) {
    const [q, setQ] = useState('');
    const [gifs, setGifs] = useState<{ id: string; preview: string; url: string; analyticsUrl?: string }[]>([]);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [link, setLink] = useState('');
    const apiKey = import.meta.env.VITE_GIPHY_API_KEY;

    useEffect(() => {
        let cancelled = false;
        const timeout = window.setTimeout(async () => {
            if (!apiKey) {
                setGifs([]);
                setError('GIF search is not configured.');
                return;
            }

            const query = q.trim();
            const endpoint = new URL(`https://api.giphy.com/v1/gifs/${query ? 'search' : 'trending'}`);
            endpoint.searchParams.set('api_key', apiKey);
            endpoint.searchParams.set('limit', '18');
            endpoint.searchParams.set('rating', 'pg');
            if (query) endpoint.searchParams.set('q', query);

            try {
                const response = await fetch(endpoint);
                const result = await response.json() as {
                    data?: { id: string; images?: { fixed_width_small?: { url?: string }; preview_gif?: { url?: string }; original?: { url?: string } }; analytics?: { onsent?: { url?: string } } }[];
                    meta?: { status?: number; msg?: string };
                };
                if (!response.ok || (result.meta && result.meta.status !== 200)) throw new Error(result.meta?.msg || 'GIPHY could not load GIFs.');
                if (cancelled) return;

                setGifs((result.data ?? []).flatMap((gif) => {
                    const url = gif.images?.original?.url;
                    const preview = gif.images?.fixed_width_small?.url ?? gif.images?.preview_gif?.url;
                    return url && preview ? [{ id: gif.id, preview, url, analyticsUrl: gif.analytics?.onsent?.url }] : [];
                }));
                setError('');
            } catch (e) {
                if (cancelled) return;
                setGifs([]);
                setError(e instanceof Error ? e.message : 'GIPHY could not load GIFs.');
            }
        }, 350);
        return () => { cancelled = true; window.clearTimeout(timeout); };
    }, [apiKey, q]);

    return (
        <div className="space-y-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search GIFs" className={input} autoFocus />
            {error ? (
                <div className="space-y-2">
                    <p className="text-xs text-amber-300">{error}</p>
                    <form onSubmit={(e) => { e.preventDefault(); if (link.trim()) onPick(link.trim()); }} className="flex gap-2">
                        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste a Tenor or GIPHY GIF URL" className={input} />
                        <button className="rounded bg-violet-600 px-3 text-xs font-semibold">Send</button>
                    </form>
                </div>
            ) : (
                <div className="grid max-h-56 grid-cols-3 gap-1 overflow-y-auto">
                    {gifs.map((g) => (
                        <button key={g.id} onClick={() => onPick(g.url, g.analyticsUrl)} className="overflow-hidden rounded bg-neutral-800">
                            <img src={g.preview} alt="" loading="lazy" className="h-20 w-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
            <a href="https://giphy.com" target="_blank" rel="noreferrer" className="block text-right text-[10px] font-semibold text-neutral-500 hover:text-neutral-300">Powered By GIPHY</a>
        </div>
    );
}

export default function ChatPanel({
    slug,
    welcome = null,
    messages,
    userId,
    canDelete,
    emojis,
    stickers,
    typingText,
    onType,
    roomRoleOf,
    chatSize,
    showAvatars,
    readOnly = false,
    myName,
    onUser,
    onWhisper,
    mention,
    onMentionConsumed,
    showBadges = true,
    highlightMentions = true,
    onPatchNotes,
}: {
    slug: string;
    welcome?: string | null; // the room's welcome message: it stays at the top while the messages scroll under it, and Clear does not take it away
    messages: ChatMessageData[];
    userId: number;
    canDelete: boolean;
    emojis: RoomEmojiData[];
    stickers: string[];
    typingText: string;
    onType: () => void;
    roomRoleOf: (userId: number) => RoleInfo | null;
    chatSize: 'small' | 'normal' | 'large';
    showAvatars: boolean;
    readOnly?: boolean; // guests can read but not write
    myName: string;
    onUser: (user: CardUser, anchor: DOMRect) => void; // open the quick-profile menu of a message's author
    onWhisper?: (userId: number) => void; // open the whisper box with that person
    mention: { name: string; n: number } | null; // "Mention" was chosen in that menu: put @name in the box
    onMentionConsumed: () => void;
    showBadges?: boolean;
    highlightMentions?: boolean;
    onPatchNotes?: () => void; // opens the patch notes (the first line of the chat has a link to them)
}) {
    const [text, setText] = useState('');
    const [replyTo, setReplyTo] = useState<ChatMessageData | null>(null);
    const [picker, setPicker] = useState<Picker>(null);
    const [emojiTab, setEmojiTab] = useState('Smileys');
    const [menu, setMenu] = useState<{ m: ChatMessageData; anchor: MenuAnchor; row: DOMRect } | null>(null); // the open message menu
    const [copied, setCopied] = useState(false);
    const [peek, setPeek] = useState<{ user: CardUser; anchor: DOMRect } | null>(null); // the preview shown while the mouse rests on a name or picture
    const peekTimer = useRef<number | undefined>(undefined);
    const [picked, setPicked] = useState<Record<string, EmoteInfo>>({}); // emotes chosen from the pickers, by name
    const globals = useGlobalEmotes(!readOnly);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const chatScroll = useRef<HTMLDivElement>(null);
    const followMessages = useRef(true);
    const fileInput = useRef<HTMLInputElement>(null);
    const inputBox = useRef<HTMLInputElement>(null);

    useLayoutEffect(() => {
        const container = chatScroll.current;
        if (container && followMessages.current) container.scrollTop = container.scrollHeight;
    }, [messages]);

    useEffect(() => {
        if (!mention) return;
        setText((t) => `${t}${t && !t.endsWith(' ') ? ' ' : ''}@${mention.name} `);
        inputBox.current?.focus();
        onMentionConsumed();
    }, [mention?.n, onMentionConsumed]);

    useEffect(() => () => window.clearTimeout(peekTimer.current), []);

    // a name or picture the mouse rests on for a moment shows a short preview (not on touch screens: they have no hover)
    const showPeek = (u: CardUser, el: HTMLElement) => {
        window.clearTimeout(peekTimer.current);
        if (!window.matchMedia('(hover: hover)').matches) return;
        peekTimer.current = window.setTimeout(() => setPeek({ user: u, anchor: el.getBoundingClientRect() }), 450);
    };
    const hidePeek = () => {
        window.clearTimeout(peekTimer.current);
        setPeek(null);
    };
    const openMenu = (m: ChatMessageData, anchor: MenuAnchor, row: DOMRect) => {
        hidePeek();
        setCopied(false);
        setMenu({ m, anchor, row });
    };
    const reply = (m: ChatMessageData) => {
        setReplyTo(m);
        inputBox.current?.focus();
    };
    const mentionUser = (name: string) => {
        setText((t) => `${t}${t && !t.endsWith(' ') ? ' ' : ''}@${name} `);
        inputBox.current?.focus();
    };
    const copy = (body: string) => {
        navigator.clipboard?.writeText(body);
        setCopied(true);
        window.setTimeout(() => setMenu(null), 700);
    };
    const authorOf = (m: ChatMessageData): CardUser => ({ id: m.user_id, name: m.user, avatar: m.avatar, cosmetics: m.cosmetics, role: m.role, badges: m.badges, level: m.level });

    /** What the ⋯ menu offers for a message: you can only do to yourself and to others what makes sense. */
    const menuGroups = (m: ChatMessageData, row: DOMRect): MenuItem[][] => {
        const mine = m.user_id === userId;
        const look: MenuItem[] = [{ label: mine ? 'My quick profile' : 'Quick profile', icon: UserRound, onSelect: () => onUser(authorOf(m), row) }];
        const talk: MenuItem[] = [];
        if (!readOnly) talk.push({ label: 'Reply', icon: Reply, onSelect: () => reply(m) });
        if (!readOnly && !mine) talk.push({ label: 'Mention', icon: AtSign, onSelect: () => mentionUser(m.user) });
        if (!readOnly && !mine && onWhisper) talk.push({ label: 'Whisper', icon: MessageCircle, onSelect: () => onWhisper(m.user_id) });
        if (m.body) talk.push({ label: copied ? 'Copied!' : 'Copy text', icon: copied ? Check : Copy, keepOpen: true, onSelect: () => copy(m.body) });
        const remove: MenuItem[] = !readOnly && (mine || canDelete) ? [{ label: 'Delete message', icon: Trash2, danger: true, onSelect: () => send('DELETE', route('rooms.messages.delete', [slug, m.id])).catch(fail) }] : [];

        return [look, talk, remove].filter((g) => g.length > 0);
    };

    const fail = (e: unknown) => setError((e as Error).message);
    const extra = () => (replyTo ? { reply_to_id: replyTo.id } : {});
    const sent = () => { setReplyTo(null); setPicker(null); setError(''); };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const typed = text.trim();
        if (!typed) return;

        // "/w username message" whispers instead of posting in the room
        const whisper = typed.match(/^\/(?:w|whisper)\s+@?(\w+)\s+([\s\S]+)$/i);
        if (whisper) {
            setText('');
            sendJson('POST', route('api.whispers.send'), { username: whisper[1], body: whisper[2] })
                .then(() => { setNotice(`Whispered to ${whisper[1]}.`); setError(''); })
                .catch((err: Error) => { setText(typed); setNotice(''); setError(err.message); });
            return;
        }
        // turn emote names into the tokens everyone's chat understands
        const known = new Map<string, EmoteInfo>([...(globals?.bttv ?? []), ...(globals?.['7tv'] ?? [])].map((x) => [x.name, x]));
        Object.values(picked).forEach((x) => known.set(x.name, x));
        const body = typed.split(/(\s+)/).map((w) => (known.has(w) ? tokenOf(known.get(w)!) : w)).join('');
        setText('');
        post(route('rooms.message', slug), { body, ...extra() }).then(sent).catch((err) => { setText(typed); fail(err); });
    };

    const sendSticker = (sticker: string) => post(route('rooms.message', slug), { sticker, ...extra() }).then(sent).catch(fail);
    const sendGif = (gif: string, analyticsUrl?: string) => {
        if (analyticsUrl) {
            const analytics = new URL(analyticsUrl);
            analytics.searchParams.set('customer_id', String(userId));
            analytics.searchParams.set('ts', String(Date.now()));
            void fetch(analytics).catch(() => {});
        }
        post(route('rooms.message', slug), { gif, ...extra() }).then(sent).catch(fail);
    };

    const sendImage = (file?: File) => {
        if (!file) return;
        const form = new FormData();
        form.append('image', file);
        if (replyTo) form.append('reply_to_id', String(replyTo.id));
        upload(route('rooms.image', slug), form).then(sent).catch(fail);
        if (fileInput.current) fileInput.current.value = '';
    };

    const toolbar: [Picker, string, string][] = [['emoji', '😀', 'Emojis'], ['gif', 'GIF', 'GIFs'], ['sticker', '🏷️', 'Stickers'], ['room', '⭐', 'Room emojis'], ['bttv', 'BTTV', 'BetterTTV emotes'], ['7tv', '7TV', '7TV emotes']];

    return (
        <div className="sfd-chat flex min-h-0 flex-1 flex-col">
            <p className="mx-3 mt-3 flex shrink-0 items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-neutral-200" data-version>
                <span aria-hidden>👋</span>
                <span className="min-w-0 flex-1">Welcome to <span className="font-bold text-white">SFD-DJ.EU</span>, Version {VERSION}</span>
                {onPatchNotes && <button onClick={onPatchNotes} className="shrink-0 font-semibold text-violet-300 hover:underline">What's new</button>}
            </p>
            {welcome && (
                <p className={`mx-3 mt-3 flex max-h-28 shrink-0 gap-2 overflow-y-auto wrap-break-word rounded bg-violet-500/10 p-2 italic text-violet-200 ${chatText[chatSize]}`}>
                    <span aria-hidden>🎉</span>
                    <span>{welcome}</span>
                </p>
            )}
            <div
                ref={chatScroll}
                onScroll={(event) => {
                    const container = event.currentTarget;
                    followMessages.current = container.scrollHeight - container.scrollTop - container.clientHeight < 48;
                    if (peek) hidePeek();
                }}
                className={`flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-3 ${chatText[chatSize]}`}
            >
                {messages.map((m) => {
                    if (m.type === 'system') {
                        const loud = m.kind === 'announcement';
                        const broadcast = m.kind === 'broadcast';
                        const welcome = m.kind === 'welcome';
                        return (
                            <p key={m.id} className={`flex gap-2 wrap-break-word text-xs italic ${loud ? 'rounded bg-amber-500/10 p-2 text-amber-300' : broadcast ? 'rounded border border-amber-400/40 bg-amber-500/15 p-2 text-amber-200' : welcome ? 'rounded bg-violet-500/10 p-2 text-violet-200' : `border-l-2 border-current pl-2 ${systemTone[m.kind ?? ''] ?? 'text-neutral-500'}`}`}>
                                <span aria-hidden>{systemIcon[m.kind ?? ''] ?? '•'}</span>
                                <span>
                                    {m.kind === 'announcement' && <span className="font-semibold not-italic">System announcement: </span>}
                                    {broadcast && <span className="font-semibold not-italic">System broadcast: </span>}
                                    {m.kind === 'announcement' && <span className="not-italic text-amber-200">{m.user}: </span>}
                                    {m.body}
                                </span>
                            </p>
                        );
                    }

                    const rr = roomRoleOf(m.user_id);
                    const mine = m.user_id === userId;
                    const author = authorOf(m);
                    const timestamp = m.created_at ? new Date(m.created_at) : null;
                    const openCard = (e: MouseEvent<HTMLElement>) => { e.stopPropagation(); hidePeek(); onUser(author, e.currentTarget.getBoundingClientRect()); };
                    const peekOn = { onMouseEnter: (e: MouseEvent<HTMLElement>) => showPeek(author, e.currentTarget), onMouseLeave: hidePeek };
                    const open = menu?.m.id === m.id;
                    const mentionsMe = highlightMentions && !mine && !!myName && m.body.toLowerCase().includes(`@${myName.toLowerCase()}`);
                    return (
                        <div
                            key={m.id}
                            data-row
                            onContextMenu={(e) => {
                                if ((e.target as HTMLElement).closest('a, [data-media]')) return; // links and pictures keep the browser's own menu
                                e.preventDefault();
                                openMenu(m, { x: e.clientX, y: e.clientY }, e.currentTarget.getBoundingClientRect());
                            }}
                            className={`sfd-message group relative -mx-1.5 flex gap-2 rounded-lg px-1.5 py-0.5 transition-colors ${mentionsMe ? 'bg-amber-400/10 hover:bg-amber-400/15' : 'hover:bg-white/4'} ${open ? 'bg-white/6' : ''}`}
                        >
                            {showAvatars && <button onClick={openCard} {...peekOn} aria-label={`${m.user}: quick profile`} className="shrink-0 self-start"><Avatar name={m.user} avatar={m.avatar} cosmetics={m.cosmetics} /></button>}
                            <div className="min-w-0 flex-1">
                                <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold" style={{ color: m.role.color }}>
                                    {showBadges && <Badges badges={m.badges} level={m.level} />}
                                    <button onClick={openCard} {...peekOn} aria-label={`${m.user}: quick profile`} className="font-semibold hover:underline">{m.user}</button> <RoleBadge role={m.role} />
                                    {rr && <RoleBadge role={rr} />}
                                    {timestamp && <time dateTime={m.created_at} title={timestamp.toLocaleString()} className="ml-1 font-normal text-neutral-500">{timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>}
                                </p>

                                {m.reply && (
                                    <p className="mb-0.5 truncate border-l-2 border-violet-500 pl-2 text-xs text-neutral-400">
                                        {m.reply.user ? <><span className="font-semibold text-neutral-300">{m.reply.user}</span> {m.reply.body}</> : <span className="italic">Original message was deleted</span>}
                                    </p>
                                )}

                                {m.body && <p className="wrap-break-word text-neutral-200">{withEmojis(m.body, emojis)}</p>}
                                {m.sticker && <p className="text-5xl leading-tight">{m.sticker}</p>}
                                {m.image_url && <img src={m.image_url} data-media alt="" loading="lazy" className="mt-1 max-h-48 max-w-full rounded-lg" />}
                            </div>

                            <div className={`absolute -top-3 right-1 z-10 flex items-center gap-0.5 rounded-lg border border-white/10 bg-neutral-900/95 p-0.5 shadow-lg shadow-black/40 backdrop-blur transition-opacity focus-within:pointer-events-auto focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
                                {!readOnly && <button onClick={() => reply(m)} title="Reply" aria-label="Reply" className={tool}><Reply size={14} /></button>}
                                {m.body && <button onClick={() => navigator.clipboard?.writeText(m.body)} title="Copy text" aria-label="Copy text" className={tool}><Copy size={14} /></button>}
                                <button
                                    data-menu-trigger
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (open) return setMenu(null);
                                        const r = e.currentTarget.getBoundingClientRect();
                                        openMenu(m, { x: r.right, y: r.bottom + 4, right: true, flipTo: r.top - 4 }, e.currentTarget.closest('[data-row]')!.getBoundingClientRect());
                                    }}
                                    title="More"
                                    aria-label="Message options"
                                    aria-haspopup="menu"
                                    aria-expanded={open}
                                    className={tool}
                                >
                                    <Ellipsis size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="h-5 shrink-0 px-3 text-xs italic text-neutral-500">{typingText}</div>

            {readOnly ? (
                <div className="shrink-0 space-y-2 border-t border-neutral-800 p-4 text-center text-sm">
                    <p className="text-neutral-400">You are watching as a guest.</p>
                    <div className="flex justify-center gap-2">
                        <Link href={route('login')} className="rounded bg-violet-600 px-4 py-1.5 text-xs font-semibold hover:bg-violet-500">Log in</Link>
                        <Link href={route('register')} className="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold hover:bg-white/20">Register</Link>
                    </div>
                </div>
            ) : (
            <div className="relative shrink-0 border-t border-neutral-800 p-3">
                {picker && (
                    <div className="absolute bottom-full left-2 right-2 mb-1 max-h-80 overflow-y-auto rounded-xl border border-neutral-700 bg-neutral-900 p-3 shadow-xl">
                        {picker === 'emoji' && (
                            <>
                                <div className="mb-2 flex gap-1 overflow-x-auto text-xs">
                                    {Object.keys(EMOJIS).map((k) => (
                                        <button key={k} onClick={() => setEmojiTab(k)} className={`rounded px-2 py-1 ${emojiTab === k ? 'bg-violet-600/30 text-violet-200' : 'text-neutral-400 hover:text-white'}`}>{k}</button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-8 gap-1 text-xl">
                                    {EMOJIS[emojiTab].map((e) => (
                                        <button key={e} onClick={() => setText((t) => t + e)} className="rounded hover:bg-neutral-800">{e}</button>
                                    ))}
                                </div>
                            </>
                        )}
                        {picker === 'gif' && <GifPicker onPick={sendGif} />}
                        {(picker === 'bttv' || picker === '7tv') && (
                            <EmotePicker
                                key={picker}
                                source={picker}
                                onPick={(e) => {
                                    setPicked((p) => ({ ...p, [e.name]: e }));
                                    setText((t) => `${t}${t && !t.endsWith(' ') ? ' ' : ''}${e.name} `);
                                }}
                            />
                        )}
                        {picker === 'sticker' && (
                            <div className="grid grid-cols-6 gap-1 text-3xl">
                                {stickers.map((s) => <button key={s} onClick={() => sendSticker(s)} className="rounded hover:bg-neutral-800">{s}</button>)}
                            </div>
                        )}
                        {picker === 'room' &&
                            (emojis.length === 0 ? (
                                <p className="text-xs text-neutral-500">This room has no custom emojis yet. The host can add some in Room settings.</p>
                            ) : (
                                <div className="grid grid-cols-6 gap-2">
                                    {emojis.map((e) => (
                                        <button key={e.id} onClick={() => setText((t) => `${t}:${e.name}:`)} title={`:${e.name}:`} className="rounded p-1 hover:bg-neutral-800">
                                            <img src={e.url} alt={e.name} className="h-8 w-8 object-contain" />
                                        </button>
                                    ))}
                                </div>
                            ))}
                    </div>
                )}

                {replyTo && (
                    <p className="mb-2 flex items-center justify-between gap-2 rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-300">
                        <span className="truncate">↩ Replying to <span className="font-semibold">{replyTo.user}</span>: {replyTo.body || replyTo.sticker || 'a picture'}</span>
                        <button onClick={() => setReplyTo(null)} aria-label="Cancel reply" className="text-neutral-500 hover:text-white">✕</button>
                    </p>
                )}
                {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
                {notice && !error && <p className="mb-2 text-xs text-violet-300">💬 {notice}</p>}

                <div className="mb-2 flex items-center gap-1 text-sm">
                    {toolbar.map(([key, label, title]) => (
                        <button key={key} onClick={() => setPicker(picker === key ? null : key)} title={title} className={`rounded px-2 py-1 ${picker === key ? 'bg-violet-600/30 text-violet-200' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'} ${key === 'gif' || key === 'bttv' || key === '7tv' ? 'text-xs font-bold' : ''}`}>
                            {label}
                        </button>
                    ))}
                    {canDelete && (
                        <button onClick={() => confirm('Clear the chat for everyone? Every message goes, and it does not come back when the page is refreshed.') && send('DELETE', route('rooms.clear', slug)).catch(fail)} title="Clear chat" className="ml-auto rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-red-300">🧹 Clear</button>
                    )}
                    <button onClick={() => fileInput.current?.click()} title="Send a picture" className="rounded px-2 py-1 text-neutral-400 hover:bg-neutral-800 hover:text-white">🖼️</button>
                    <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => sendImage(e.target.files?.[0])} />
                </div>

                <form onSubmit={submit}>
                    <input
                        ref={inputBox}
                        value={text}
                        onChange={(e) => { setText(e.target.value); if (e.target.value) onType(); }}
                        maxLength={300}
                        placeholder="Type a message and press Enter… (/w name to whisper)"
                        className={input}
                    />
                </form>
            </div>
            )}

            {peek && !menu && <PeekCard user={peek.user} anchor={peek.anchor} />}
            {menu && (
                <ContextMenu
                    label={`Actions for ${menu.m.user}'s message`}
                    anchor={menu.anchor}
                    onClose={() => setMenu(null)}
                    header={
                        <div className="flex items-center gap-2.5">
                            <Avatar name={menu.m.user} avatar={menu.m.avatar} cosmetics={menu.m.cosmetics} className="h-9 w-9 text-lg" />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold" style={{ color: menu.m.role.color }}>{menu.m.user}</p>
                                <p className="text-[11px] text-neutral-500">{menu.m.role.label}{menu.m.level !== undefined && ` · Level ${menu.m.level}`}</p>
                            </div>
                        </div>
                    }
                    groups={menuGroups(menu.m, menu.row)}
                />
            )}
        </div>
    );
}
