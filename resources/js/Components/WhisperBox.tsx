import { formatDate, formatTime } from '@/lib/regional';
import Avatar from '@/Components/Avatar';
import { EmojiPicker, EmotePicker } from '@/Components/ChatPanel';
import { withEmojis } from '@/lib/chatEmojis';
import { fieldClass } from '@/Components/ui';
import VoiceBubble, { voiceTime } from '@/Components/VoiceBubble';
import VoiceRecorderBar from '@/Components/VoiceRecorderBar';
import { GroupAvatar, GroupInfo, NewGroup } from '@/Components/WhisperGroupPanel';
import { refreshCounts } from '@/lib/counts';
import { useUserRestrictions } from '@/lib/userRestrictions';
import { startWhisperCall } from '@/lib/calls';
import { EmoteInfo, useGlobalEmotes, withEmoteTokens } from '@/lib/emotes';
import { getJson, post, send as request, sendJson, uploadJson } from '@/lib/post';
import { ago } from '@/lib/time';
import { canRecordVoice, Recording } from '@/lib/voiceRecorder';
import { PageProps } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { ArrowLeft, EyeOff, MessageCirclePlus, Mic, Phone, Video, Reply, Search, Send, Smile, Trash2, UserRound, UsersRound } from 'lucide-react';
import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface Person {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
}
export interface Group {
    id: number;
    name: string;
    owner_id: number;
    members: Person[];
    created_at: string;
}
interface Line {
    id: number;
    mine: boolean;
    from_id: number;
    to_id: number | null; // none in a group
    group_id?: number | null;
    from?: Person | null; // in a group: who wrote it
    body: string;
    voice?: { seconds: number } | null; // a voice message: `body` is empty, the recording is fetched from api.whispers.audio
    reply?: { id: number; from_id: number; body: string } | null; // the whisper this one answers
    at: string;
}
interface Conversation {
    user: Person;
    last: Line;
    unread: number;
}
interface GroupConversation {
    group: Group;
    last: Line | null;
    unread: number;
}
interface Incoming extends Omit<Line, 'mine'> {
    sender: Person;
}

/** What a conversation is with: a person or a group. */
type Target = { user: number } | { group: number };
const keyOf = (t: Target) => ('group' in t ? `g${t.group}` : `u${t.user}`);

const clock = (iso: string) => formatTime(iso, { hour: '2-digit', minute: '2-digit' });
const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString();
const dayLabel = (iso: string) => {
    const d = new Date(iso);
    const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
    return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : formatDate(d, { weekday: 'long', day: 'numeric', month: 'long' });
};
const people = (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`;
/** A whisper as one short line, for the list of conversations. */
const said = (line: Line) => (line.voice ? `🎤 Voice message (${voiceTime(line.voice.seconds)})` : withEmojis(line.body, [], 'h-4'));

/**
 * Whispers: your conversations (people and groups) on the left, the open one on the right. Updates live.
 * `start` opens a person straight away and `startGroup` a group; `friends` fills the "new whisper" picker; `openProfile` replaces going to their page.
 */
export default function WhisperBox({ start, startGroup, friends = [], openProfile, className = 'h-[calc(100vh-15rem)] min-h-120' }: {
    start?: number | null;
    startGroup?: number | null;
    friends?: Person[];
    openProfile?: (id: number, name: string) => void;
    className?: string;
}) {
    const me = usePage<PageProps>().props.auth.user.id;
    const { blocked, hiddenAuthors } = useUserRestrictions();
    const restrictionsRef = useRef(hiddenAuthors);
    restrictionsRef.current = hiddenAuthors;
    const [list, setList] = useState<Conversation[]>([]);
    const [groups, setGroups] = useState<GroupConversation[]>([]);
    const [other, setOther] = useState<Person | null>(null);
    const [group, setGroup] = useState<Group | null>(null); // the open group
    const [makingGroup, setMakingGroup] = useState(false); // the form for a new group is open
    const [showGroup, setShowGroup] = useState(false); // the open group's people and settings are shown instead of its whispers
    const [composing, setComposing] = useState(false); // the "new whisper" picker is open
    const [lines, setLines] = useState<Line[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const historyScroll = useRef<HTMLDivElement>(null);
    const restoredScroll = useRef<{ height: number; top: number } | null>(null);
    const [text, setText] = useState('');
    const [to, setTo] = useState('');
    const [find, setFind] = useState('');
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState<number | null>(null);
    const [clearing, setClearing] = useState<number | null>(null);
    const hiddenIds = useRef(new Set<number>());
    const clearedThrough = useRef(new Map<number, number>());
    const [recording, setRecording] = useState(false); // the strip that records a voice message is open
    const [replyTo, setReplyTo] = useState<Line | null>(null); // the whisper the next one answers
    const [picker, setPicker] = useState<'emoji' | 'bttv' | '7tv' | null>(null); // the emoji and emote panel above the text box
    const [picked, setPicked] = useState<Record<string, EmoteInfo>>({}); // emotes chosen from a 7TV search, by name: the typed name turns into the emote on send
    const globals = useGlobalEmotes();
    const openKey = useRef<string | null>(null); // which conversation is open, for the listeners below
    openKey.current = group ? keyOf({ group: group.id }) : other ? keyOf({ user: other.id }) : null;
    const unseen = useRef<Target | null>(null); // somebody wrote while this tab was in the background: read when it comes back
    const markRead = useCallback((t: Target) => { post('group' in t ? route('api.whisper-groups.read', t.group) : route('api.whispers.read', t.user)).then(refreshCounts).catch(() => {}); }, []);
    const targetOf = (w: Pick<Line, 'group_id' | 'from_id' | 'to_id'>): Target => (w.group_id ? { group: w.group_id } : { user: (w.from_id === me ? w.to_id : w.from_id) as number });
    const cleanLines = useCallback((messages: Line[]) => {
        const cutoff = (message: Line) => message.group_id ? 0 : clearedThrough.current.get(message.from_id === me ? message.to_id! : message.from_id) ?? 0;
        return messages.filter((message) => !hiddenIds.current.has(message.id) && !hiddenAuthors.has(message.from_id) && message.id > cutoff(message)).map((message) => {
            const reply = message.reply;
            return reply && (hiddenIds.current.has(reply.id) || hiddenAuthors.has(reply.from_id) || reply.id <= cutoff(message)) ? { ...message, reply: null } : message;
        });
    }, [me, hiddenAuthors]);
    const end = useRef<HTMLDivElement>(null);
    const box = useRef<HTMLTextAreaElement>(null);

    const loadList = useCallback(() => {
        getJson<Conversation[]>(route('api.whispers')).then(setList).catch(() => {});
        getJson<GroupConversation[]>(route('api.whisper-groups.index')).then((all) => {
            setGroups(all);
            setGroup((now) => (now ? all.find((g) => g.group.id === now.id)?.group ?? null : now));
        }).catch(() => {});
    }, []);
    const applyCleared = useCallback((userId: number, throughId: number) => {
        const previous = clearedThrough.current.get(userId);
        if (previous !== undefined && throughId <= previous) { loadList(); refreshCounts(); return; }
        clearedThrough.current.set(userId, throughId);
        setList((now) => now.filter((c) => c.user.id !== userId || c.last.id > throughId));
        if (openKey.current === keyOf({ user: userId })) {
            openKey.current = null; unseen.current = null;
            setOther(null); setLines([]); setReplyTo(null); setText(''); setHasMore(false); setRecording(false);
            const url = new URL(window.location.href);
            if (url.searchParams.get('with') === String(userId)) {
                url.searchParams.delete('with');
                window.history.replaceState(window.history.state, '', url);
            }
        }
        loadList(); refreshCounts();
    }, [loadList]);
    const clearConversation = async (person: Person) => {
        if (clearing !== null || !confirm(`Remove your conversation with ${person.name}? Its current messages will be hidden only for you. The other person keeps their copy. New messages will bring the conversation back.`)) return;
        setClearing(person.id); setError('');
        try {
            const result = await sendJson<{ through_id: number }>('DELETE', route('api.whispers.clear', person.id));
            applyCleared(person.id, result.through_id);
        } catch (e) { setError(e instanceof Error ? e.message : 'Could not remove the conversation.'); }
        finally { setClearing(null); }
    };
    const open = useCallback((id: number) => {
        getJson<{ user: Person; messages: Line[]; has_more: boolean }>(route('api.whispers.thread', id))
            .then((t) => { restoredScroll.current = null; setHasMore(t.has_more); setOther(t.user); setGroup(null); setComposing(false); setMakingGroup(false); setLines(cleanLines(t.messages)); setError(''); loadList(); refreshCounts(); }) // opening it marks theirs as read
            .catch((e: Error) => setError(e.message));
    }, [loadList, cleanLines]);
    const openGroup = useCallback((id: number) => {
        getJson<{ group: Group; messages: Line[]; has_more: boolean }>(route('api.whisper-groups.show', id))
            .then((t) => { restoredScroll.current = null; setHasMore(t.has_more); setGroup(t.group); setOther(null); setComposing(false); setMakingGroup(false); setShowGroup(false); setLines(cleanLines(t.messages)); setError(''); loadList(); refreshCounts(); })
            .catch((e: Error) => setError(e.message));
    }, [loadList, cleanLines]);

    useEffect(() => {
        loadList();
        if (openKey.current?.startsWith('u')) open(Number(openKey.current.slice(1)));
        else if (openKey.current?.startsWith('g')) openGroup(Number(openKey.current.slice(1)));
        else if (start) open(start);
        else if (startGroup) openGroup(startGroup);

        const ch = echo<'reverb'>().private(`App.Models.User.${me}`);
        const reloadOpenThread = (target: Target) => {
            // Read viewer-specific reply previews so hidden messages do not reappear in quotes.
            const url = 'group' in target ? route('api.whisper-groups.show', target.group) : route('api.whispers.thread', target.user);
            getJson<{ messages: Line[] }>(url).then((result) => {
                if (keyOf(target) !== openKey.current) return;
                setLines((now) => cleanLines([...now.filter((m) => !result.messages.some((fresh) => fresh.id === m.id)), ...result.messages]).sort((a, b) => a.id - b.id));
                refreshCounts();
            }).catch(() => {});
        };
        const onWhisper = (w: Incoming) => {
            if (restrictionsRef.current.has(w.from_id)) return;
            const target = targetOf(w);
            if (keyOf(target) === openKey.current) {
                if (document.visibilityState === 'visible') reloadOpenThread(target);
                else unseen.current = target; // Do not mark background messages as read.
            }
            loadList();
        };
        const onGroup = (g: { group_id: number; removed: number | null; deleted?: boolean }) => {
            if (g.removed === me || g.deleted) {
                if (openKey.current === keyOf({ group: g.group_id })) { setLines([]); setReplyTo(null); setShowGroup(false); }
                setGroup((now) => (now?.id === g.group_id ? null : now));
            }
            loadList();
            refreshCounts();
        };
        const onDeleted = (w: { id: number }) => {
            hiddenIds.current.add(w.id);
            setLines((now) => now.filter((m) => m.id !== w.id).map((m) => m.reply?.id === w.id ? { ...m, reply: null } : m));
            setReplyTo((now) => now?.id === w.id ? null : now);
            loadList(); refreshCounts();
        };
        const onCleared = (event: { user_id: number; through_id: number }) => applyCleared(event.user_id, event.through_id);
        ch.listen('.whisper-conversation-cleared', onCleared);
        ch.listen('.whisper', onWhisper);
        ch.listen('.whisper-group', onGroup);
        ch.listen('.whisper-deleted', onDeleted);
        const back = () => {
            if (document.visibilityState !== 'visible') return;
            if (unseen.current && keyOf(unseen.current) === openKey.current) { reloadOpenThread(unseen.current); markRead(unseen.current); }
            unseen.current = null;
        };
        document.addEventListener('visibilitychange', back);

        return () => { ch.stopListening('.whisper-conversation-cleared', onCleared); ch.stopListening('.whisper', onWhisper); ch.stopListening('.whisper-group', onGroup); ch.stopListening('.whisper-deleted', onDeleted); document.removeEventListener('visibilitychange', back); };
    }, [me, start, startGroup, open, openGroup, loadList, markRead, cleanLines, applyCleared]); // eslint-disable-line react-hooks/exhaustive-deps -- targetOf only reads `me`

    useEffect(() => {
        if (restoredScroll.current && historyScroll.current) {
            historyScroll.current.scrollTop = restoredScroll.current.top + historyScroll.current.scrollHeight - restoredScroll.current.height;
            restoredScroll.current = null;
        } else end.current?.scrollIntoView({ block: 'end' });
    }, [lines, other, group?.id, showGroup]);

    const deleteMessage = async (message: Line) => {
        if (deleting !== null || !confirm(message.mine ? 'Delete this message for everyone? This cannot be undone.' : 'Hide this message only for you? The sender keeps their copy.')) return;
        setDeleting(message.id); setError('');
        try {
            await request('DELETE', route(message.mine ? 'api.whispers.destroy' : 'api.whispers.hide', message.id));
            hiddenIds.current.add(message.id);
            setLines((now) => now.filter((m) => m.id !== message.id).map((m) => m.reply?.id === message.id ? { ...m, reply: null } : m));
            setReplyTo((now) => now?.id === message.id ? null : now);
            loadList(); refreshCounts();
        } catch (e) { setError(e instanceof Error ? e.message : 'Could not delete the message.'); }
        finally { setDeleting(null); }
    };

    const loadOlder = async () => {
        if (loadingOlder || !lines.length || (!group && !other)) return;
        const key = openKey.current;
        setLoadingOlder(true);
        try {
            const url = group ? route('api.whisper-groups.show', group.id) : route('api.whispers.thread', other!.id);
            const result = await getJson<{ messages: Line[]; has_more: boolean }>(`${url}?before=${lines[0].id}`);
            if (key !== openKey.current) return;
            if (historyScroll.current) restoredScroll.current = { height: historyScroll.current.scrollHeight, top: historyScroll.current.scrollTop };
            setLines((now) => cleanLines([...result.messages.filter((m) => !now.some((n) => n.id === m.id)), ...now]));
            setHasMore(result.has_more);
        } catch (err) { if (key === openKey.current) setError((err as Error).message); }
        finally { setLoadingOlder(false); }
    };
    useEffect(() => { setRecording(false); setReplyTo(null); setPicker(null); setShowGroup(false); }, [other?.id, group?.id]);
    useEffect(() => {
        const el = box.current;
        if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 120)}px`; }
    }, [text]);

    /** The server took a whisper: show it (the first one to somebody new opens that conversation). */
    const sent = (r: { message: Line; user?: Person }) => {
        if (!other && !group && r.user) { setOther(r.user); setComposing(false); setTo(''); setLines(cleanLines([r.message])); }
        else if (keyOf(targetOf(r.message)) === openKey.current) setLines((p) => (p.some((x) => x.id === r.message.id) ? p : cleanLines([...p, r.message])));
        loadList();
    };

    const send = (e?: FormEvent) => {
        e?.preventDefault();
        const typed = text.trim();
        if (!typed) return;
        const body = withEmoteTokens(typed, globals, picked);
        const reply = replyTo;
        const payload = group ? { group_id: group.id, body, reply_to_id: reply?.id } : other ? { user_id: other.id, body, reply_to_id: reply?.id } : { username: to.trim().replace(/^@/, ''), body };
        setText('');
        setReplyTo(null);
        setPicker(null);
        sendJson<{ message: Line; user?: Person }>('POST', route('api.whispers.send'), payload)
            .then((r) => { setError(''); sent(r); })
            .catch((er: Error) => { setText(typed); setReplyTo(reply); setError(er.message); });
    };

    const startVoice = () => {
        if (!other && !group && !to.trim()) return setError('Pick who it is for first.');
        setError('');
        setRecording(true);
    };

    const sendVoice = async (recorded: Recording) => {
        const form = new FormData();
        if (group) form.append('group_id', String(group.id));
        else if (other) form.append('user_id', String(other.id));
        else form.append('username', to.trim().replace(/^@/, ''));
        form.append('audio', recorded.blob, `voice.${recorded.extension}`);
        form.append('seconds', String(recorded.seconds));
        if (replyTo) form.append('reply_to_id', String(replyTo.id));
        const r = await uploadJson<{ message: Line; user?: Person }>(route('api.whispers.voice'), form);
        setError('');
        setRecording(false);
        setReplyTo(null);
        sent(r);
    };

    const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    };

    const startNew = () => { setOther(null); setGroup(null); setMakingGroup(false); setComposing(true); setLines([]); setError(''); setTo(''); };
    const startNewGroup = () => { setOther(null); setGroup(null); setComposing(false); setMakingGroup(true); setLines([]); setError(''); };
    const unreadTotal = list.reduce((n, c) => n + c.unread, 0) + groups.reduce((n, g) => n + g.unread, 0);

    // people and groups in one list, the one with the newest whisper first
    const needle = find.trim().toLowerCase();
    const shown = [
        ...list.map((c) => ({ kind: 'user' as const, key: `u${c.user.id}`, at: c.last.at, unread: c.unread, name: `${c.user.name} ${c.user.username}`, c })),
        ...groups.map((g) => ({ kind: 'group' as const, key: `g${g.group.id}`, at: g.last?.at ?? g.group.created_at, unread: g.unread, name: g.group.name, g })),
    ].filter((i) => (!unreadOnly || i.unread > 0) && (!needle || i.name.toLowerCase().includes(needle))).sort((a, b) => (a.at < b.at ? 1 : -1));

    // people offered in the picker: earlier conversations and friends, narrowed by what is typed
    const suggestions = useMemo(() => {
        const seen = new Set<number>();
        const all = [...list.map((c) => c.user), ...friends].filter((p) => !seen.has(p.id) && seen.add(p.id));
        const n = to.trim().replace(/^@/, '').toLowerCase();

        return all.filter((p) => !n || `${p.name} ${p.username}`.toLowerCase().includes(n)).slice(0, 8);
    }, [list, friends, to]);

    // consecutive messages from the same person are grouped; a new day gets a heading
    const visibleLines = cleanLines(lines);
    const rows = visibleLines.map((m, i) => {
        const prev = visibleLines[i - 1];
        const next = visibleLines[i + 1];
        const newDay = !prev || !sameDay(prev.at, m.at);

        return {
            m,
            heading: newDay ? dayLabel(m.at) : null,
            first: newDay || prev.from_id !== m.from_id,
            last: !next || next.from_id !== m.from_id || !sameDay(next.at, m.at),
        };
    });

    /** Who wrote the whisper a reply answers: you, the other person, or somebody of the group. */
    const nameOf = (id: number) => (id === me ? 'You' : group ? group.members.find((p) => p.id === id)?.name ?? lines.find((l) => l.from_id === id)?.from?.name ?? 'Someone' : other?.name);

    const blockedThread = !!other && blocked.includes(other.id);
    useEffect(() => { setReplyTo((message) => message && hiddenAuthors.has(message.from_id) ? null : message); }, [hiddenAuthors]);
    useEffect(() => { if (blockedThread) { setRecording(false); setReplyTo(null); } }, [blockedThread]);
    const chatOpen = !!other || !!group || composing || makingGroup;

    return (
        <div className={`grid gap-4 md:grid-cols-[19rem_1fr] ${className}`}>
            {/* conversations */}
            <section className={`${chatOpen ? 'hidden md:flex' : 'flex'} min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/4`}>
                <div className="space-y-2 border-b border-white/10 p-3">
                    <div className="flex items-center gap-2">
                        <div className="relative min-w-0 flex-1">
                            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                            <input value={find} onChange={(e) => setFind(e.target.value)} placeholder="Search whispers" className={`${fieldClass} py-1.5 pl-8`} />
                        </div>
                        <button onClick={startNewGroup} title="New group" aria-label="New group" className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"><UsersRound size={17} /></button>
                        <button onClick={startNew} title="New whisper" aria-label="New whisper" className="rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 p-2 text-white hover:opacity-90"><MessageCirclePlus size={17} /></button>
                    </div>
                    <div className="flex gap-1.5 text-xs">
                        <button onClick={() => setUnreadOnly(false)} className={`rounded-full px-3 py-1 font-semibold ${!unreadOnly ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'}`}>All</button>
                        <button onClick={() => setUnreadOnly(true)} className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold ${unreadOnly ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'}`}>Unread {unreadTotal > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{unreadTotal}</span>}</button>
                    </div>
                </div>

                {error && !chatOpen && <p role="alert" className="px-3 py-2 text-xs text-red-400">{error}</p>}
                <ul className="min-h-0 flex-1 divide-y divide-white/5 overflow-y-auto">
                    {shown.length === 0 && (
                        <li className="p-6 text-center text-sm text-neutral-500">
                            {list.length + groups.length === 0 ? <>No whispers yet.<br /><button onClick={startNew} className="mt-2 text-violet-400 hover:underline">Start one</button></> : 'Nothing matches.'}
                        </li>
                    )}
                    {shown.map((i) => (
                        <li key={i.key}>
                            {i.kind === 'user' ? (
                                <div className="group flex items-center pr-2">
                                <button onClick={() => open(i.c.user.id)} className={`flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5 ${other?.id === i.c.user.id ? 'bg-violet-500/10' : ''}`}>
                                    <Avatar name={i.c.user.name} avatar={i.c.user.avatar} className="h-10 w-10 text-base" />
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-baseline justify-between gap-2">
                                            <span className={`truncate text-sm ${i.unread ? 'font-bold text-white' : 'font-medium'}`}>{i.c.user.name}</span>
                                            <span className="shrink-0 text-[11px] text-neutral-500">{ago(i.c.last.at)}</span>
                                        </span>
                                        <span className="flex items-center justify-between gap-2">
                                            <span className={`truncate text-xs ${i.unread ? 'text-neutral-200' : 'text-neutral-500'}`}>{i.c.last.mine ? 'You: ' : ''}{said(i.c.last)}</span>
                                            {i.unread > 0 && <span className="shrink-0 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{i.unread}</span>}
                                        </span>
                                    </span>
                                </button>
                                <button type="button" disabled={clearing !== null} onClick={() => void clearConversation(i.c.user)} title="Remove conversation for me" aria-label={`Remove conversation with ${i.c.user.name}`} className="shrink-0 rounded-lg p-2 text-neutral-500 transition hover:bg-red-500/15 hover:text-red-300 disabled:opacity-40"><Trash2 size={15} /></button>
                                </div>
                            ) : (
                                <button onClick={() => openGroup(i.g.group.id)} className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5 ${group?.id === i.g.group.id ? 'bg-violet-500/10' : ''}`}>
                                    <GroupAvatar className="h-10 w-10" />
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-baseline justify-between gap-2">
                                            <span className={`truncate text-sm ${i.unread ? 'font-bold text-white' : 'font-medium'}`}>{i.g.group.name}</span>
                                            <span className="shrink-0 text-[11px] text-neutral-500">{ago(i.at)}</span>
                                        </span>
                                        <span className="flex items-center justify-between gap-2">
                                            <span className={`truncate text-xs ${i.unread ? 'text-neutral-200' : 'text-neutral-500'}`}>
                                                {i.g.last ? <>{i.g.last.mine ? 'You' : i.g.last.from?.name}: {said(i.g.last)}</> : people(i.g.group.members.length)}
                                            </span>
                                            {i.unread > 0 && <span className="shrink-0 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{i.unread}</span>}
                                        </span>
                                    </span>
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            {/* the open conversation */}
            <section className={`${chatOpen ? 'flex' : 'hidden md:flex'} min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/4`}>
                {!chatOpen ? (
                    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                        <p className="text-5xl">💬</p>
                        <p className="mt-3 font-semibold">Your whispers</p>
                        <p className="mt-1 max-w-xs text-sm text-neutral-400">Private messages between you and one other person, or a group of your friends. Pick a conversation, or start a new one.</p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            <button onClick={startNew} className="rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 px-4 py-2 text-sm font-semibold">New whisper</button>
                            <button onClick={startNewGroup} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">New group</button>
                        </div>
                    </div>
                ) : makingGroup ? (
                    <>
                        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 sm:gap-3">
                            <button onClick={() => setMakingGroup(false)} className="rounded-lg p-1 text-neutral-400 hover:bg-white/10 md:hidden" aria-label="Back"><ArrowLeft size={18} /></button>
                            <GroupAvatar className="h-9 w-9" />
                            <div className="min-w-0">
                                <p className="truncate font-semibold">New group</p>
                                <p className="truncate text-xs text-neutral-500">You and your friends whisper together</p>
                            </div>
                        </div>
                        <NewGroup onCreated={(g) => { setMakingGroup(false); openGroup(g.id); }} />
                    </>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap border-b border-white/10 px-4 py-3 sm:gap-3">
                            <button onClick={() => { setOther(null); setGroup(null); setComposing(false); }} className="rounded-lg p-1 text-neutral-400 hover:bg-white/10 md:hidden" aria-label="Back"><ArrowLeft size={18} /></button>
                            {other ? (
                                <>
                                    <Avatar name={other.name} avatar={other.avatar} className="h-9 w-9" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold">{other.name}</p>
                                        <p className="truncate text-xs text-neutral-500">@{other.username}</p>
                                    </div>
                                    <button type="button" disabled={clearing !== null} onClick={() => void clearConversation(other)} title="Remove conversation for me" aria-label="Remove conversation for me" className="shrink-0 rounded-lg p-2 text-neutral-500 hover:bg-red-500/15 hover:text-red-300 disabled:opacity-40"><Trash2 size={17} /></button>
                                    <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                                    <button disabled={blockedThread} onClick={() => startWhisperCall(other, false)} aria-label={`Voice call ${other.name}`} title="Voice call" className="rounded-lg bg-violet-500/15 p-2 text-violet-200 hover:bg-violet-500/30"><Phone size={17} /></button>
                                    <button disabled={blockedThread} onClick={() => startWhisperCall(other, true)} aria-label={`Video call ${other.name}`} title="Video call" className="rounded-lg bg-violet-500/15 p-2 text-violet-200 hover:bg-violet-500/30"><Video size={17} /></button>
                                    <button onClick={() => (openProfile ? openProfile(other.id, other.name) : router.visit(route('users.show', other.id)))} aria-label="Open profile" title="Open profile" className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20"><UserRound size={14} /><span>Profile</span></button>
                                    </div>
                                </>
                            ) : group ? (
                                <>
                                    <GroupAvatar className="h-9 w-9" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold">{group.name}</p>
                                        <p className="truncate text-xs text-neutral-500">{people(group.members.length)}: {group.members.map((p) => p.name).join(', ')}</p>
                                    </div>
                                    <button onClick={() => setShowGroup((v) => !v)} aria-pressed={showGroup} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${showGroup ? 'bg-violet-500/30 text-violet-100' : 'bg-white/10 hover:bg-white/20'}`}><UsersRound size={14} /> People</button>
                                </>
                            ) : (
                                <div className="flex flex-1 items-center gap-2">
                                    <span className="text-sm text-neutral-400">To:</span>
                                    <input autoFocus value={to} onChange={(e) => setTo(e.target.value)} placeholder="username, or pick below" className={`${fieldClass} py-1.5`} />
                                </div>
                            )}
                        </div>

                        {group && showGroup ? (
                            <GroupInfo
                                group={group}
                                me={me}
                                onChanged={(g) => { setGroup(g); loadList(); }}
                                onLeft={() => { setGroup(null); setLines([]); setReplyTo(null); setShowGroup(false); loadList(); refreshCounts(); }}
                            />
                        ) : (
                            <>
                                <div ref={historyScroll} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                                    {(other || group) && hasMore && <button type="button" disabled={loadingOlder} onClick={loadOlder} className="mb-4 w-full rounded-lg bg-white/5 py-2 text-xs text-violet-300 hover:bg-white/10 disabled:opacity-50">{loadingOlder ? 'Loading…' : 'Load older messages'}</button>}
                                    {!other && !group && (
                                        <div className="mb-4">
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Friends and recent</p>
                                            {suggestions.length === 0 ? <p className="text-sm text-neutral-500">No suggestions. Type the exact username above.</p> : (
                                                <div className="flex flex-wrap gap-2">
                                                    {suggestions.map((p) => (
                                                        <button key={p.id} onClick={() => open(p.id)} className="flex items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-3 text-sm hover:bg-white/10">
                                                            <Avatar name={p.name} avatar={p.avatar} className="h-6 w-6 text-xs" /> {p.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {(other || group) && visibleLines.length === 0 && <p className="py-10 text-center text-sm text-neutral-500">{other && hiddenAuthors.has(other.id) ? 'Messages from this user are hidden.' : 'No messages yet. Say hi 👋'}</p>}
                                    {rows.map(({ m, heading, first, last }) => {
                                        // beside the bubble, on the side facing the middle: shown when the mouse is over the message (always on a touch screen)
                                        const replyButton = <button type="button" onClick={() => { setReplyTo(m); box.current?.focus(); }} aria-label="Reply" title="Reply" className="shrink-0 rounded-md p-1.5 text-neutral-500 opacity-0 transition hover:bg-white/10 hover:text-white focus-visible:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100"><Reply size={14} /></button>;

                                        return (
                                            <div key={m.id}>
                                                {heading && <p className="my-4 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{heading}</p>}
                                                <div className={`group flex items-center gap-1 ${m.mine ? 'justify-end' : 'justify-start'} ${first ? 'mt-3' : 'mt-0.5'}`}>
                                                    {(m.mine || !group) && <button type="button" onClick={() => void deleteMessage(m)} disabled={deleting !== null} aria-label={m.mine ? 'Delete message for everyone' : 'Hide message for me'} title={m.mine ? 'Delete message for everyone' : 'Hide message for me'} className="shrink-0 rounded-md p-1.5 text-neutral-500 opacity-60 transition hover:bg-red-500/15 hover:text-red-300 focus-visible:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100 disabled:opacity-40">{m.mine ? <Trash2 size={14} /> : <EyeOff size={14} />}</button>}
                                                    {m.mine && replyButton}
                                                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${m.mine ? 'rounded-br-md bg-linear-to-br from-fuchsia-600 to-violet-600 text-white' : 'rounded-bl-md bg-white/10'}`}>
                                                        {group && !m.mine && first && <p className="mb-0.5 text-xs font-semibold text-violet-300">{m.from?.name}</p>}
                                                        {m.reply && (
                                                            <p className={`mb-1 truncate rounded-md border-l-2 bg-black/15 px-2 py-0.5 text-xs ${m.mine ? 'border-white/70 text-white/80' : 'border-violet-400 text-neutral-300'}`}>
                                                                <span className="font-semibold">{nameOf(m.reply.from_id)}</span> {withEmojis(m.reply.body, [], 'h-4')}
                                                            </p>
                                                        )}
                                                        {m.voice ? <VoiceBubble id={m.id} seconds={m.voice.seconds} mine={m.mine} /> : <p className="whitespace-pre-wrap wrap-break-word">{withEmojis(m.body, [])}</p>}
                                                        {last && <p className={`mt-0.5 text-[10px] ${m.mine ? 'text-white/60' : 'text-neutral-500'}`}>{clock(m.at)}</p>}
                                                    </div>
                                                    {!m.mine && replyButton}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={end} />
                                </div>

                                {error && <p className="px-4 pb-1 text-xs text-red-400">{error}</p>}
                                {blockedThread && <p role="status" className="border-t border-white/10 bg-red-500/10 px-4 py-2 text-xs text-red-200">You blocked this user. Unblock them from their profile or Privacy settings to send Whispers or calls.</p>}
                                <fieldset disabled={blockedThread} className="relative min-w-0 border-t border-white/10 disabled:opacity-50">
                                    {picker && (
                                        <div className="absolute inset-x-3 bottom-full z-10 mb-1 max-h-72 overflow-y-auto rounded-xl border border-neutral-700 bg-neutral-900 p-3 shadow-xl">
                                            <div className="mb-3 flex gap-1 text-xs font-bold">
                                                {([['emoji', 'Emoji'], ['bttv', 'BTTV'], ['7tv', '7TV']] as const).map(([key, label]) => (
                                                    <button key={key} type="button" onClick={() => setPicker(key)} className={`rounded px-2.5 py-1 ${picker === key ? 'bg-violet-600/30 text-violet-200' : 'text-neutral-400 hover:text-white'}`}>{label}</button>
                                                ))}
                                            </div>
                                            {picker === 'emoji' ? <EmojiPicker onPick={(e) => setText((t) => t + e)} /> : (
                                                <EmotePicker
                                                    key={picker}
                                                    source={picker}
                                                    gridClass="max-h-40" /* lower than in chat: the tab row takes room too, and the panel must not scroll inside a scroll */
                                                    onPick={(e) => {
                                                        setPicked((p) => ({ ...p, [e.name]: e }));
                                                        setText((t) => `${t}${t && !t.endsWith(' ') ? ' ' : ''}${e.name} `);
                                                    }}
                                                />
                                            )}
                                        </div>
                                    )}
                                    {replyTo && (
                                        <p className="mx-3 mt-3 flex items-center justify-between gap-2 rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-300">
                                            <span className="flex min-w-0 items-center gap-1.5"><Reply size={12} className="shrink-0 text-violet-300" /><span className="truncate">Replying to <span className="font-semibold">{replyTo.mine ? 'yourself' : nameOf(replyTo.from_id)}</span>: {replyTo.voice ? '🎤 Voice message' : withEmojis(replyTo.body, [], 'h-4')}</span></span>
                                            <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply" className="text-neutral-500 hover:text-white">✕</button>
                                        </p>
                                    )}
                                    {recording ? (
                                        <VoiceRecorderBar onSend={sendVoice} onCancel={() => setRecording(false)} onProblem={setError} />
                                    ) : (
                                        <form onSubmit={send} className="flex items-end gap-2 p-3">
                                            <button type="button" onClick={() => setPicker(picker ? null : 'emoji')} aria-label="Emojis and emotes" aria-expanded={!!picker} title="Emojis and emotes" className={`rounded-lg p-2.5 transition ${picker ? 'bg-violet-600/30 text-violet-200' : 'text-neutral-400 hover:bg-white/10 hover:text-white'}`}><Smile size={17} /></button>
                                            <textarea ref={box} rows={1} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} placeholder={group ? `Whisper to ${group.name}…` : other ? `Whisper to ${other.name}…` : 'Write a whisper…'} maxLength={500} className={`${fieldClass} max-h-28 resize-none`} />
                                            {text.length > 400 && <span className="pb-2 text-[11px] text-neutral-500">{500 - text.length}</span>}
                                            {!text.trim() && canRecordVoice() && (
                                                <button type="button" onClick={startVoice} aria-label="Record a voice message" title="Record a voice message" className="rounded-lg bg-white/10 p-2.5 text-neutral-200 transition hover:bg-white/20"><Mic size={17} /></button>
                                            )}
                                            {/* always there, so it can be clicked (Enter works too); mouse-down is not let take the focus from the box, so you can go on typing */}
                                            <button disabled={!text.trim()} onMouseDown={(e) => e.preventDefault()} aria-label="Send" title="Send (Enter)" className="rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 p-2.5 text-white transition hover:opacity-90 disabled:opacity-40"><Send size={17} /></button>
                                        </form>
                                    )}
                                </fieldset>
                            </>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}
