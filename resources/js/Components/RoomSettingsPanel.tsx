import Avatar from '@/Components/Avatar';
import RoomEmojiManager from '@/Components/RoomEmojiManager';
import RoomRolesEditor, { RoomRoleInfo } from '@/Components/RoomRolesEditor';
import Toggle from '@/Components/Toggle';
import { RoomEmojiData } from '@/Components/ChatPanel';
import RulesModal, { RoomRule } from '@/Components/RulesModal';
import SceneBackdrop from '@/Components/scene/Backdrop';
import { backgrounds } from '@/lib/backgrounds';
import { CSS_HOOKS } from '@/lib/cssHooks';
import { paletteOf } from '@/lib/scenes';
import { getJson, send } from '@/lib/post';
import { router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Bot, Check, Code2, ExternalLink, Eye, ListMusic, LucideIcon, Plus, ScrollText, Settings2, ShieldCheck, Smile, Trash2 } from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';

/** A special time of the year (App\Support\Season): while it is on, every room shows one of its backgrounds. */
export interface SeasonInfo {
    key: string;
    label: string;
    when: string;
    backgrounds: string[];
    on: boolean;
}

export interface MemberRow {
    user_id: number;
    name: string;
    avatar: string | null;
    room_role_id: number;
}

interface Props {
    room: { slug: string; name: string; description: string | null; background: string | null; genre: string | null; is_private: boolean; welcome_message: string | null; rule_list: RoomRule[] | null; custom_background_url?: string | null; css_source?: string | null; css_notes?: string[] };
    genres: string[];
    backgrounds: string[]; // the keys of the scenes this person may pick: the custom ones are in it only for the host
    seasons: SeasonInfo[];
    canLock: boolean;
    can: Record<string, boolean>;
    roles: RoomRoleInfo[];
    memberList: MemberRow[];
    permissionLabels: Record<string, string>;
    emojis: RoomEmojiData[];
    canCss: boolean; // the host (and staff) write the room's own CSS
    locked: boolean;
    cycle: boolean;
    onOpenPage: (url: string, title: string) => void; // a page of the site in the room's overlay, so nobody has to leave the room
}

const input = 'w-full rounded-lg border-neutral-700 bg-neutral-900 text-sm text-white placeholder-neutral-500 focus:border-violet-500 focus:ring-0';
const bare = input.replace('w-full ', '');
const label = 'mb-1 flex items-baseline justify-between gap-2 text-xs text-neutral-400';

/** A box for one part of a tab: a title, a line about it, and on the right anything that belongs to the title (a badge, a link). */
function Card({ title, text, aside, children }: { title: string; text?: string; aside?: ReactNode; children: ReactNode }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{title}</p>
                    {text && <p className="mt-0.5 text-xs text-neutral-400">{text}</p>}
                </div>
                {aside}
            </div>
            {children}
        </div>
    );
}

/** How much of a text box is used, e.g. 12/50. */
const count = (text: string, max: number) => <span className={`tabular-nums ${text.length >= max ? 'text-amber-300' : 'text-neutral-600'}`}>{text.length}/{max}</span>;

type TabKey = 'General' | 'Rules' | 'Music & Waitlist' | 'Roles' | 'Emojis' | 'Room CSS';
const TABS: { key: TabKey; icon: LucideIcon; text: string }[] = [
    { key: 'General', icon: Settings2, text: 'The name, the welcome text, who can come in and the background.' },
    { key: 'Rules', icon: ScrollText, text: 'What people read and agree to when they come in.' },
    { key: 'Music & Waitlist', icon: ListMusic, text: 'The line, cycling, and the Auto Host that keeps the music going.' },
    { key: 'Roles', icon: ShieldCheck, text: 'Give people roles, and choose what each role may do.' },
    { key: 'Emojis', icon: Smile, text: "The room's own emojis for the chat." },
    { key: 'Room CSS', icon: Code2, text: 'Your own look for the room, written in CSS.' },
];

/** Room settings: a list of parts on the left (across the top on a phone), the chosen part on the right. */
export default function RoomSettingsPanel({ room, genres, backgrounds: pickable, seasons, canLock, can, roles, memberList, permissionLabels, emojis, canCss, locked, cycle, onOpenPage }: Props) {
    const allowed: Record<TabKey, boolean> = { General: can.edit_settings, Rules: can.edit_settings, 'Music & Waitlist': can.manage_queue, Roles: can.manage_roles, Emojis: can.edit_settings, 'Room CSS': canCss };
    const tabs = TABS.filter((t) => allowed[t.key]);
    const [tab, setTab] = useState<TabKey>(tabs[0]?.key ?? 'General');
    const current = tabs.find((t) => t.key === tab) ?? tabs[0];

    if (!current) return <p className="text-sm text-neutral-400">You cannot change anything in this room.</p>;

    return (
        <div className="flex flex-col gap-5 md:flex-row" data-room-settings>
            <nav aria-label="Parts of the room settings" className="-mx-1 flex shrink-0 gap-1 overflow-x-auto px-1 pb-1 md:sticky md:top-0 md:mx-0 md:w-56 md:flex-col md:self-start md:overflow-visible md:px-0">
                {tabs.map(({ key, icon: Icon, text }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        aria-current={tab === key ? 'page' : undefined}
                        className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition md:w-full ${tab === key ? 'bg-violet-500/15 text-white ring-1 ring-violet-400/40' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tab === key ? 'bg-violet-500/30 text-violet-100' : 'bg-white/5'}`}><Icon size={16} /></span>
                        <span className="min-w-0">
                            <span className="block whitespace-nowrap text-sm font-semibold">{key}</span>
                            <span className="hidden text-[11px] leading-tight text-neutral-500 md:block">{text}</span>
                        </span>
                    </button>
                ))}
            </nav>

            <section className="min-w-0 flex-1" data-settings-part={current.key}>
                <header className="mb-4">
                    <h3 className="text-lg font-bold text-white">{current.key}</h3>
                    <p className="text-sm text-neutral-400">{current.text}</p>
                </header>

                {current.key === 'General' && <General room={room} genres={genres} backgrounds={pickable} seasons={seasons} canLock={canLock} />}
                {current.key === 'Rules' && <RulesEditor slug={room.slug} name={room.name} saved={room.rule_list ?? []} />}
                {current.key === 'Music & Waitlist' && <MusicWaitlist slug={room.slug} locked={locked} cycle={cycle} onOpenPage={onOpenPage} />}
                {current.key === 'Roles' && (
                    <div className="space-y-4">
                        <Card title="Give someone a role" text="Search anybody on SFD-DJ.EU by name. A role gives the rights you set below.">
                            <GiveRoles slug={room.slug} roles={roles} memberList={memberList} />
                        </Card>
                        <Card title="The roles" text="What each role may do in this room.">
                            <RoomRolesEditor slug={room.slug} roles={roles} labels={permissionLabels} />
                        </Card>
                    </div>
                )}
                {current.key === 'Emojis' && <Card title="Room emojis" text="Everybody in the room can use these in the chat."><RoomEmojiManager slug={room.slug} emojis={emojis} /></Card>}
                {current.key === 'Room CSS' && <CssEditor slug={room.slug} saved={room.css_source ?? ''} notes={room.css_notes ?? []} />}
            </section>
        </div>
    );
}

function General({ room, genres, backgrounds: pickable, seasons, canLock }: Pick<Props, 'room' | 'genres' | 'backgrounds' | 'seasons' | 'canLock'>) {
    const start = {
        name: room.name,
        description: room.description ?? '',
        welcome_message: room.welcome_message ?? '',
        background: room.background ?? '',
        genre: room.genre ?? '',
        is_private: room.is_private,
    };
    const [saved, setSaved] = useState(start); // what the server has: the bar at the bottom shows when the form differs from it
    const [s, setS] = useState(start);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);
    const set = (patch: Partial<typeof s>) => { setDone(false); setS({ ...s, ...patch }); };
    const dirty = JSON.stringify(s) !== JSON.stringify(saved);
    const scenes = Object.entries(backgrounds).filter(([key]) => pickable.includes(key));
    const plain = scenes.filter(([, b]) => !b.host);
    const custom = scenes.filter(([, b]) => b.host && !b.special); // only the host is sent these
    const special = scenes.filter(([, b]) => b.special); // Halloween and Christmas, in a group of their own (for the host too)
    const [uploadError, setUploadError] = useState('');
    const [uploading, setUploading] = useState(false);
    const picker = useRef<HTMLInputElement>(null);
    const upload = (file?: File) => {
        if (!file) return;
        setUploadError('');
        setUploading(true);
        router.post(route('rooms.background.upload', room.slug), { image: file }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => set({ background: 'custom' }),
            onError: (e) => setUploadError(e.image ?? 'The picture could not be uploaded.'),
            onFinish: () => setUploading(false),
        });
    };
    const removePicture = () => router.delete(route('rooms.background.remove', room.slug), { preserveScroll: true, onSuccess: () => s.background === 'custom' && set({ background: '' }) });
    const season = seasons.find((x) => x.on); // Halloween or Christmas time: every room shows the season's background
    const seasonal = !!season && !!room.background && season.backgrounds.includes(room.background);
    const keptCustom = !custom.length && !special.length && !!room.background && !!backgrounds[room.background]?.host; // somebody else, and the host (or the season) has put a custom scene on
    const chosenName = s.background === '' ? 'Default' : backgrounds[s.background]?.label ?? s.background;

    const save = (e: FormEvent) => {
        e.preventDefault();
        setBusy(true);
        router.patch(
            route('rooms.update', room.slug),
            { ...s, background: s.background || null, genre: s.genre || null, welcome_message: s.welcome_message || null, is_private: canLock ? s.is_private : undefined },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => { setSaved(s); setErrors({}); setDone(true); },
                onError: (e) => setErrors(e),
                onFinish: () => setBusy(false),
            },
        );
    };

    // one choice: a small picture of the scene with its name (custom ones carry a star)
    const tile = (key: string, name: string, star = false) => (
        <button
            type="button"
            key={key}
            data-bg={key || 'default'}
            onClick={() => (key !== 'custom' || room.custom_background_url) && set({ background: key })}
            aria-pressed={s.background === key}
            title={name}
            className={`relative h-16 w-28 overflow-hidden rounded-lg border-2 transition ${s.background === key ? 'border-violet-400 ring-2 ring-violet-400/30' : 'border-neutral-700 hover:border-neutral-500'}`}
        >
            {key === 'custom' ? (
                room.custom_background_url ? <img src={room.custom_background_url} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <span className="absolute inset-0 flex items-center justify-center bg-neutral-900 px-1 text-center text-[10px] text-neutral-500">no picture yet</span>
            ) : (
                <SceneBackdrop palette={paletteOf(key)} withBooth className="absolute inset-0 h-full w-full" />
            )}
            {star && <span className="absolute right-1 top-1 rounded bg-black/60 px-1 text-[10px] font-bold leading-4 text-amber-300">★ Host</span>}
            {season?.backgrounds.includes(key) && <span className="absolute left-1 top-1 rounded bg-emerald-500/90 px-1 text-[10px] font-bold leading-4 text-black">On now</span>}
            {s.background === key && <span className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-white"><Check size={11} strokeWidth={3} /></span>}
            <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-center text-[10px] font-semibold text-white">{name}</span>
        </button>
    );

    return (
        <form onSubmit={save} className="space-y-4">
            <Card title="About the room" text="What people see in the room list and when they come in.">
                <div className="space-y-3">
                    <div>
                        <label className={label}><span>Room name</span>{count(s.name, 50)}</label>
                        <input value={s.name} onChange={(e) => set({ name: e.target.value })} maxLength={50} className={input} />
                        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                    </div>
                    <div>
                        <label className={label}><span>Description</span>{count(s.description, 140)}</label>
                        <input value={s.description} onChange={(e) => set({ description: e.target.value })} maxLength={140} placeholder="What kind of music and people this room is for" className={input} />
                        {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description}</p>}
                    </div>
                    <div>
                        <label className={label}><span>Welcome message <span className="text-neutral-600">(it stays at the top of the chat for everyone)</span></span>{count(s.welcome_message, 300)}</label>
                        <textarea value={s.welcome_message} onChange={(e) => set({ welcome_message: e.target.value })} maxLength={300} rows={2} placeholder="Welcome! Play good music and be kind." className={input} />
                        {errors.welcome_message && <p className="mt-1 text-xs text-red-400">{errors.welcome_message}</p>}
                    </div>
                    <div>
                        <label className={label}><span>Genre</span></label>
                        <select value={s.genre} onChange={(e) => set({ genre: e.target.value })} className={input}>
                            <option value="">No genre</option>
                            {genres.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    {canLock && <Toggle label="🔒 Private room" hint="Only the host and SFD-DJ.EU staff can enter" checked={s.is_private} onChange={(v) => set({ is_private: v })} />}
                </div>
            </Card>

            <Card title="Background" text="The scene everybody in the room sees behind the stage." aside={<span className="shrink-0 rounded-md bg-white/5 px-2 py-1 text-[11px] text-neutral-300">{chosenName}</span>}>
                <div className="relative mb-3 h-40 overflow-hidden rounded-xl border border-white/10 bg-black" data-background-preview>
                    {s.background === 'custom'
                        ? room.custom_background_url && <img src={room.custom_background_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                        : <SceneBackdrop palette={paletteOf(s.background)} withBooth className="absolute inset-0 h-full w-full" />}
                    <span className="absolute bottom-2 left-2 rounded-md bg-black/65 px-2 py-0.5 text-xs font-semibold text-white">{chosenName}</span>
                </div>
                <div className="flex flex-wrap gap-2">{[['', { label: 'Default' }] as const, ...plain].map(([key, b]) => tile(key, b.label))}</div>
                {special.length > 0 && (
                    <div className="mt-4 rounded-xl border border-orange-400/25 bg-linear-to-r from-orange-500/[0.07] via-purple-500/5 to-red-500/[0.07] p-3" data-special-backgrounds>
                        <p className="mb-2 flex flex-wrap items-center gap-x-2 text-xs font-semibold text-orange-200">
                            <span>🎃 🎄 Special</span>
                            <span className="font-normal text-neutral-400">Halloween and Christmas. Room members with settings permission can see and pick these.</span>
                        </p>
                        <p className="mb-2 text-[11px] text-neutral-400" data-season-note>
                            {season
                                ? <>It is {season.label} time ({season.when}): every room shows a {season.label} background by itself. Pick the other {season.label} one if you like it better, or any other background to switch it off in this room. After {season.label} the room goes back to its own background.</>
                                : <>They come on by themselves in every room in their season: {seasons.map((x) => `${x.label} in ${x.when}`).join(', ')}. After it the room goes back to its own background.</>}
                        </p>
                        <div className="flex flex-wrap gap-2">{special.map(([key, b]) => tile(key, b.label, true))}</div>
                    </div>
                )}
                {custom.length > 0 && (
                    <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/4 p-3">
                        <p className="mb-2 flex flex-wrap items-center gap-x-2 text-xs font-semibold text-amber-200">
                            <span>★ Custom backgrounds</span>
                            <span className="font-normal text-neutral-400">Room members with settings permission can see and pick these.</span>
                        </p>
                        <div className="flex flex-wrap gap-2">{custom.map(([key, b]) => tile(key, b.label, true))}</div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
                            <button type="button" onClick={() => picker.current?.click()} disabled={uploading} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15 disabled:opacity-50">
                                {uploading ? 'Uploading…' : room.custom_background_url ? 'Upload another picture' : 'Upload your own picture'}
                            </button>
                            {room.custom_background_url && <button type="button" onClick={removePicture} className="rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:text-red-300">Remove picture</button>}
                            <input ref={picker} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
                            <span className="text-[11px] text-neutral-500">PNG, JPG or WebP, at least 800 × 450 and up to 4 MB. A wide picture works best; it is put on at once.</span>
                        </div>
                        {uploadError && <p className="mt-2 text-xs text-red-400">{uploadError}</p>}
                    </div>
                )}
                {keptCustom && <p className="mt-3 text-xs text-neutral-500">{seasonal && season ? `It is ${season.label} time (${season.when}): the room shows a ${season.label} background, and only the host can pick another one.` : 'The host put a custom background on this room. Only the host can pick another custom one; you can still choose one of the colour schemes above.'}</p>}
            </Card>

            {/* the save bar stays at the bottom of the window while you scroll */}
            <div className="sticky bottom-0 z-10 flex items-center gap-3 rounded-xl border border-white/10 bg-neutral-900/95 px-3 py-2.5 shadow-xl shadow-black/40 backdrop-blur" data-save-bar>
                <span className={`flex min-w-0 items-center gap-2 text-xs ${dirty ? 'text-amber-200' : done ? 'text-emerald-300' : 'text-neutral-500'}`}>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${dirty ? 'bg-amber-400' : done ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
                    {dirty ? 'You have changes that are not saved yet.' : done ? 'Saved. Everybody in the room sees it now.' : 'Everything is saved.'}
                </span>
                {dirty && <button type="button" onClick={() => setS(saved)} className="ml-auto shrink-0 rounded-lg px-3 py-2 text-xs text-neutral-400 hover:text-white">Undo changes</button>}
                <button disabled={!dirty || busy} className={`${dirty ? '' : 'ml-auto'} shrink-0 rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40`}>{busy ? 'Saving…' : 'Save'}</button>
            </div>
        </form>
    );
}

function MusicWaitlist({ slug, locked, cycle, onOpenPage }: { slug: string; locked: boolean; cycle: boolean; onOpenPage: Props['onOpenPage'] }) {
    const [error, setError] = useState('');
    const set = (patch: { locked?: boolean; cycle?: boolean }) =>
        send('PATCH', route('rooms.waitlist.settings', slug), patch).then(() => setError('')).catch((e: Error) => setError(e.message));

    return (
        <div className="space-y-4">
            <Card title="Waitlist" text="Who may join the line, and what happens to a song after it plays. Changes are saved at once.">
                <div className="divide-y divide-white/5">
                    <Toggle label="Lock waitlist" hint="While locked, only people who manage the queue can add songs. Everyone else sees “The waitlist is locked”." checked={locked} onChange={(v) => set({ locked: v })} />
                    <Toggle label="Cycle waitlist" hint="A song that has been played goes to the back of the waitlist, so the music keeps going round. Somebody who has left the room is taken out of the line instead." checked={cycle} onChange={(v) => set({ cycle: v })} />
                </div>
                {error && <p className="pt-3 text-sm text-red-400">{error}</p>}
            </Card>
            <AutoHost slug={slug} onOpenPage={onOpenPage} />
        </div>
    );
}

type AutoHostState = { bot_id: number | null; playlist_id: number | null; bots: { id: number; name: string }[]; playlists: { id: number; name: string; songs_count: number }[] };

/**
 * Auto Host, for the host of the room (AutoHostController): one of your own bots keeps the music going. Whenever nobody is in the waitlist it plays the next song
 * of a playlist of yours; somebody who joins plays after the bot's song. The site runs the bot itself: no script, no token. A bot can be made right here,
 * and Settings → Developers opens over the room, so nobody has to leave it.
 */
function AutoHost({ slug, onOpenPage }: { slug: string; onOpenPage: Props['onOpenPage'] }) {
    const [state, setState] = useState<AutoHostState | null>(null);
    const [botId, setBotId] = useState('');
    const [listId, setListId] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [making, setMaking] = useState(false);
    const [botName, setBotName] = useState('');

    const show = (st: AutoHostState, pick?: number) => {
        setState(st);
        setBotId(String(pick ?? st.bot_id ?? st.bots[0]?.id ?? ''));
        setListId((id) => id || String(st.playlist_id ?? st.playlists.find((p) => p.songs_count > 0)?.id ?? ''));
    };

    useEffect(() => {
        getJson<AutoHostState>(route('rooms.auto-host', slug))
            .then((st) => show(st))
            .catch(() => setState(null)); // not the host: nothing to show
    }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!state) return null;

    const on = state.bot_id !== null;
    const save = (enable: boolean) =>
        send('PUT', route('rooms.auto-host.update', slug), enable ? { bot_id: Number(botId), playlist_id: Number(listId) } : { bot_id: null })
            .then(() => {
                setState({ ...state, bot_id: enable ? Number(botId) : null, playlist_id: enable ? Number(listId) : null });
                setError('');
                setNotice(enable ? 'Auto Host is on. If nobody is playing, it starts now.' : 'Auto Host is off.');
            })
            .catch((e: Error) => setError(e.message));
    const makeBot = (e: FormEvent) => {
        e.preventDefault();
        setError('');
        send('POST', route('developers.bots.store'), { name: botName.trim() })
            .then(() => getJson<AutoHostState>(route('rooms.auto-host', slug)))
            .then((st) => {
                const newest = Math.max(...st.bots.map((b) => b.id));
                setMaking(false);
                setBotName('');
                setNotice(`${st.bots.find((b) => b.id === newest)?.name ?? 'The bot'} is ready. Pick a playlist and turn Auto Host on.`);
                show(st, newest);
            })
            .catch((err: Error) => setError(err.message));
    };
    const playing = on ? `${state.bots.find((b) => b.id === state.bot_id)?.name ?? 'Your bot'} plays from “${state.playlists.find((p) => p.id === state.playlist_id)?.name ?? 'a playlist'}”.` : null;
    const botForm = (
        <form onSubmit={makeBot} className="flex flex-wrap items-center gap-2" data-make-bot>
            <input value={botName} onChange={(e) => setBotName(e.target.value)} maxLength={30} placeholder="Name the bot, e.g. Night Bot" aria-label="Bot name" className={`${bare} min-w-0 flex-1`} />
            <button disabled={botName.trim().length < 2} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-40"><Bot size={15} /> Make a bot</button>
        </form>
    );

    return (
        <Card
            title="🤖 Auto Host"
            text="One of your bots keeps the music going. Whenever nobody is in the waitlist, it plays the next song of the playlist you pick; somebody who joins plays right after the bot's song. The site runs the bot for you."
            aside={on && <span className="shrink-0 rounded-md bg-emerald-500/20 px-2 py-1 text-[11px] font-bold text-emerald-300">ON</span>}
        >
            <div className="space-y-3" data-auto-host={on ? 'on' : 'off'}>
                {playing && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">{playing}</p>}
                {state.bots.length === 0 ? (
                    <>
                        <p className="text-xs text-amber-200">You need a bot for this. Make one here; it takes a second.</p>
                        {botForm}
                    </>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center gap-2">
                            <select value={botId} onChange={(e) => setBotId(e.target.value)} aria-label="Bot" className={`${bare} w-44`}>
                                {state.bots.map((b) => <option key={b.id} value={b.id}>🤖 {b.name}</option>)}
                            </select>
                            <select value={listId} onChange={(e) => setListId(e.target.value)} aria-label="Playlist" className={`${bare} w-56`}>
                                <option value="">Pick a playlist…</option>
                                {state.playlists.map((p) => <option key={p.id} value={p.id} disabled={p.songs_count === 0}>{p.name} ({p.songs_count})</option>)}
                            </select>
                            <button onClick={() => save(true)} disabled={!botId || !listId} className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-40">{on ? 'Save' : 'Turn on'}</button>
                            {on && <button onClick={() => save(false)} className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-neutral-200 hover:bg-white/20">Turn off</button>}
                        </div>
                        {making ? botForm : <button type="button" onClick={() => setMaking(true)} className="flex items-center gap-1.5 text-xs font-semibold text-violet-300 hover:text-violet-200"><Plus size={13} /> Make another bot</button>}
                    </>
                )}
                {error && <p className="text-sm text-red-400">{error}</p>}
                {notice && !error && <p className="text-xs text-emerald-300">{notice}</p>}
                <button type="button" onClick={() => onOpenPage(route('settings.developers'), 'Developers')} className="flex items-center gap-1.5 border-t border-white/5 pt-3 text-xs text-neutral-400 hover:text-white">
                    <ExternalLink size={13} /> Manage your bots and their tokens in Settings → Developers (it opens over the room)
                </button>
            </div>
        </Card>
    );
}

/** Pick any SFD-DJ.EU user by name and give them one of this room's roles. */
function GiveRoles({ slug, roles, memberList }: { slug: string; roles: RoomRoleInfo[]; memberList: MemberRow[] }) {
    const [q, setQ] = useState('');
    const [found, setFound] = useState<{ id: number; name: string; avatar: string | null }[]>([]);
    const [roleId, setRoleId] = useState(String(roles[0]?.id ?? ''));
    const [msg, setMsg] = useState('');

    useEffect(() => {
        if (q.trim().length < 2) return setFound([]);
        const t = setTimeout(() => getJson<typeof found>(`${route('rooms.find-users', slug)}?q=${encodeURIComponent(q.trim())}`).then(setFound).catch(() => setFound([])), 250);
        return () => clearTimeout(t);
    }, [q, slug]);

    const assign = (userId: number, role: string | null, name: string) =>
        send('PUT', route('rooms.members.assign', [slug, userId]), { room_role_id: role ? Number(role) : null })
            .then(() => {
                setMsg(role ? `${name} got the role.` : `${name}'s role was removed.`);
                setQ('');
                router.reload({ only: ['members', 'memberList', 'roles', 'can'] });
            })
            .catch((e: Error) => setMsg(e.message));

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a user by name" className={`${bare} min-w-0 flex-1`} />
                <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className={`${bare} w-40`}>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
            </div>
            {found.length > 0 && (
                <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
                    {found.map((u) => (
                        <li key={u.id} className="flex items-center gap-2 p-2 text-sm">
                            <Avatar name={u.name} avatar={u.avatar} className="h-6 w-6 text-xs" />
                            <span className="flex-1 truncate">{u.name}</span>
                            <button onClick={() => assign(u.id, roleId, u.name)} disabled={!roleId} className="rounded bg-violet-600 px-3 py-1 text-xs font-semibold hover:bg-violet-500 disabled:opacity-50">Give role</button>
                        </li>
                    ))}
                </ul>
            )}
            {msg && <p className="text-xs text-neutral-300">{msg}</p>}

            <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-neutral-500">People with a role ({memberList.length})</p>
                {memberList.length === 0 && <p className="text-sm text-neutral-500">Nobody yet.</p>}
                <ul className="space-y-2">
                    {memberList.map((m) => (
                        <li key={m.user_id} className="flex items-center gap-2 text-sm">
                            <Avatar name={m.name} avatar={m.avatar} className="h-6 w-6 text-xs" />
                            <span className="min-w-0 flex-1 truncate">{m.name}</span>
                            <select value={m.room_role_id} onChange={(e) => assign(m.user_id, e.target.value, m.name)} className="w-36 rounded border-neutral-700 bg-neutral-900 py-0.5 text-xs text-neutral-300">
                                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                            <button onClick={() => assign(m.user_id, null, m.name)} className="text-xs text-red-400 hover:underline">Remove</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

const SAMPLE_RULES: RoomRule[] = [
    { title: 'Be kind', text: 'Treat everybody here with respect. No insults, no hate.' },
    { title: 'No spam', text: 'Do not repeat messages or fill the chat with links.' },
    { title: 'Play music that fits the room', text: 'Keep to the genre of this room. Skip-worthy songs get skipped.' },
];

/** The rules people read when they come into the room: a title and a few words each, up to ten. */
function RulesEditor({ slug, name, saved }: { slug: string; name: string; saved: RoomRule[] }) {
    const [list, setList] = useState<RoomRule[]>(saved);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);
    const [preview, setPreview] = useState(false);

    const change = (i: number, patch: Partial<RoomRule>) => { setDone(false); setList((l) => l.map((r, k) => (k === i ? { ...r, ...patch } : r))); };
    const move = (i: number, by: number) => { setDone(false); setList((l) => { const next = [...l]; [next[i], next[i + by]] = [next[i + by], next[i]]; return next; }); };
    const clean = list.filter((r) => r.title.trim() !== '');
    const save = () => {
        setError('');
        router.put(route('rooms.rules', slug), { rules: clean }, { preserveScroll: true, onSuccess: () => { setList(clean); setDone(true); }, onError: (e) => setError(Object.values(e)[0] ?? 'The rules could not be saved.') });
    };

    return (
        <div className="space-y-3" data-rules-editor>
            <p className="text-sm text-neutral-300">People read these when they come into the room, and tick “I agree”. They can say “Do not show again”, but when you change the rules everybody reads them again.</p>

            {list.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/15 p-5 text-center">
                    <p className="text-sm text-neutral-400">No rules yet: the room opens without asking anything.</p>
                    <button type="button" onClick={() => setList(SAMPLE_RULES)} className="mt-3 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15">Start with three common rules</button>
                </div>
            )}

            <ol className="space-y-2">
                {list.map((r, i) => (
                    <li key={i} className="flex gap-2 rounded-xl border border-white/10 bg-white/3 p-3">
                        <span className="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-200">{i + 1}</span>
                        <div className="min-w-0 flex-1 space-y-2">
                            <input value={r.title} onChange={(e) => change(i, { title: e.target.value })} maxLength={60} placeholder="The rule, in a few words" aria-label={`Rule ${i + 1}: title`} className={`${input} font-semibold`} />
                            <textarea value={r.text} onChange={(e) => change(i, { text: e.target.value })} maxLength={500} rows={2} placeholder="What it means (you can leave this empty)" aria-label={`Rule ${i + 1}: text`} className={input} />
                        </div>
                        <div className="flex shrink-0 flex-col gap-1">
                            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="rounded p-1 text-neutral-400 hover:bg-white/10 hover:text-white disabled:opacity-30"><ArrowUp size={14} /></button>
                            <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Move down" className="rounded p-1 text-neutral-400 hover:bg-white/10 hover:text-white disabled:opacity-30"><ArrowDown size={14} /></button>
                            <button type="button" onClick={() => { setDone(false); setList((l) => l.filter((_, k) => k !== i)); }} aria-label="Delete this rule" className="rounded p-1 text-neutral-500 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={14} /></button>
                        </div>
                    </li>
                ))}
            </ol>

            <div className="flex flex-wrap items-center gap-2">
                {list.length < 10 && <button type="button" onClick={() => { setDone(false); setList((l) => [...l, { title: '', text: '' }]); }} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15"><Plus size={14} /> Add a rule</button>}
                <button type="button" onClick={() => setPreview(true)} disabled={clean.length === 0} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15 disabled:opacity-40"><Eye size={14} /> Preview</button>
                <button type="button" onClick={save} className="ml-auto rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 px-4 py-2 text-sm font-semibold">Save rules</button>
            </div>
            {done && <p className="text-xs text-green-400">Saved. Everybody reads the new rules when they come in.</p>}
            {error && <p className="text-xs text-red-400">{error}</p>}
            {preview && <RulesModal roomName={name} rules={clean} preview onAgree={() => setPreview(false)} onAlways={() => setPreview(false)} />}
        </div>
    );
}

const CSS_EXAMPLES: [string, string][] = [
    ['Neon chat', '.sfd-chat {\n  background: rgba(14, 0, 40, 0.9);\n}\n.sfd-message:hover {\n  background: rgba(217, 70, 239, 0.14);\n}'],
    ['Glass bars', '.sfd-navbar, .sfd-footbar {\n  background: rgba(255, 255, 255, 0.07);\n  backdrop-filter: blur(14px);\n}'],
    ['Glowing pictures', '.sfd-avatar {\n  filter: drop-shadow(0 0 6px rgba(255, 0, 200, 0.65));\n}'],
    ['Big chat text', '.sfd-chat {\n  font-size: 15px;\n  line-height: 1.45;\n}'],
    ['Pulsing Woot buttons', '@keyframes beat {\n  from { transform: scale(1); }\n  to { transform: scale(1.04); }\n}\n.sfd-votes {\n  animation: beat 0.6s ease-in-out infinite alternate;\n}'],
];

/** The room's own CSS, for the host: what is typed here is cleaned by the server (RoomCss) and put on the room for everybody. */
function CssEditor({ slug, saved, notes }: { slug: string; saved: string; notes: string[] }) {
    const [css, setCss] = useState(saved);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);

    const save = (text = css) => {
        setError('');
        setBusy(true);
        router.put(route('rooms.css', slug), { css: text }, { preserveScroll: true, onSuccess: () => setDone(true), onError: (e) => setError(Object.values(e)[0] ?? 'The CSS could not be saved.'), onFinish: () => setBusy(false) });
    };

    return (
        <div className="space-y-3" data-css-editor>
            <p className="text-sm text-neutral-300">Make the room look the way you want with your own CSS. It is put on this room for everybody who comes in, and nothing outside the room changes.</p>

            <div className="flex flex-wrap gap-1.5">
                <span className="self-center text-[11px] uppercase tracking-wider text-neutral-500">Start from</span>
                {CSS_EXAMPLES.map(([title, code]) => (
                    <button key={title} type="button" onClick={() => { setDone(false); setCss((c) => `${c.trimEnd()}${c.trim() ? '\n\n' : ''}${code}`); }} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium hover:bg-white/15">{title}</button>
                ))}
            </div>

            <textarea
                value={css}
                onChange={(e) => { setDone(false); setCss(e.target.value); }}
                maxLength={20000}
                rows={14}
                spellCheck={false}
                aria-label="Room CSS"
                placeholder={'.sfd-chat {\n  background: #12002b;\n}'}
                className={`${input} font-mono text-[13px] leading-5`}
            />

            <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => save()} disabled={busy} className="rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 px-4 py-2 text-sm font-semibold disabled:opacity-50">{busy ? 'Saving…' : 'Save CSS'}</button>
                {saved !== '' && <button type="button" onClick={() => { setCss(''); save(''); }} className="rounded-lg px-3 py-2 text-xs text-neutral-400 hover:text-red-300">Remove all of it</button>}
                <span className="ml-auto text-[11px] text-neutral-500">{css.length.toLocaleString()} / 20,000</span>
            </div>
            {done && <p className="text-xs text-green-400">Saved. The room has it now.</p>}
            {error && <p className="text-xs text-red-400">{error}</p>}
            {notes.length > 0 && (
                <div className="rounded-xl border border-amber-400/25 bg-amber-400/6 p-3 text-xs text-amber-200">
                    <p className="font-semibold">Left out of what the room gets:</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-amber-100/80">{notes.map((n) => <li key={n}>{n}</li>)}</ul>
                </div>
            )}

            <details className="rounded-xl border border-white/10 bg-white/3 p-3 text-xs text-neutral-300">
                <summary className="cursor-pointer font-semibold text-neutral-100">What you can use</summary>
                <p className="mt-2">Pick the parts of the room with these classes. Put a dot in front, like <code className="rounded bg-white/10 px-1">.sfd-chat</code>; add <code className="rounded bg-white/10 px-1">:hover</code>, <code className="rounded bg-white/10 px-1">::before</code> or a tag below it (<code className="rounded bg-white/10 px-1">.sfd-chat a</code>) if you like.</p>
                <ul className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
                    {CSS_HOOKS.map(([key, text]) => <li key={key}><code className="rounded bg-white/10 px-1 text-violet-200">.sfd-{key}</code> <span className="text-neutral-400">{text}</span></li>)}
                </ul>
                <p className="mt-3 text-neutral-400">Allowed: colours, fonts, sizes, borders, shadows, gradients, filters, transforms, <code>@media</code> and <code>@keyframes</code> animations. Pictures with <code>url()</code> must be https links (they load from that site, so use only sites you trust). Not allowed: <code>@import</code>, <code>@font-face</code>, ids and <code>[attribute]</code> selectors, <code>position: fixed</code> and anything that runs code.</p>
            </details>
        </div>
    );
}
