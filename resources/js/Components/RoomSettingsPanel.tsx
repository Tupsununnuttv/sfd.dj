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
import { ArrowDown, ArrowUp, Eye, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

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
    onSaved: () => void;
}

const input = 'w-full rounded border-neutral-700 bg-neutral-900 text-sm text-white placeholder-neutral-500 focus:border-violet-500 focus:ring-0';
const bare = input.replace('w-full ', '');
const label = 'mb-1 block text-xs text-neutral-400';

/** Room settings in tabs: General, Music & Waitlist, Roles (give people roles) and Emojis. */
export default function RoomSettingsPanel({ room, genres, backgrounds: pickable, seasons, canLock, can, roles, memberList, permissionLabels, emojis, canCss, locked, cycle, onSaved }: Props) {
    const tabs = [
        can.edit_settings && 'General',
        can.edit_settings && 'Rules',
        can.manage_queue && 'Music & Waitlist',
        can.manage_roles && 'Roles',
        can.edit_settings && 'Emojis',
        canCss && 'Room CSS',
    ].filter(Boolean) as string[];
    const [tab, setTab] = useState(tabs[0]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-1 border-b border-neutral-800">
                {tabs.map((t) => (
                    <button key={t} onClick={() => setTab(t)} className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === t ? 'border-violet-500 text-white' : 'border-transparent text-neutral-400 hover:text-white'}`}>{t}</button>
                ))}
            </div>

            {tab === 'General' && <General room={room} genres={genres} backgrounds={pickable} seasons={seasons} canLock={canLock} onSaved={onSaved} />}
            {tab === 'Rules' && <RulesEditor slug={room.slug} name={room.name} saved={room.rule_list ?? []} />}
            {tab === 'Music & Waitlist' && <MusicWaitlist slug={room.slug} locked={locked} cycle={cycle} />}
            {tab === 'Roles' && (
                <>
                    <GiveRoles slug={room.slug} roles={roles} memberList={memberList} />
                    <RoomRolesEditor slug={room.slug} roles={roles} labels={permissionLabels} />
                </>
            )}
            {tab === 'Emojis' && <RoomEmojiManager slug={room.slug} emojis={emojis} />}
            {tab === 'Room CSS' && <CssEditor slug={room.slug} saved={room.css_source ?? ''} notes={room.css_notes ?? []} />}
        </div>
    );
}

function General({ room, genres, backgrounds: pickable, seasons, canLock, onSaved }: Pick<Props, 'room' | 'genres' | 'backgrounds' | 'seasons' | 'canLock' | 'onSaved'>) {
    const [s, setS] = useState({
        name: room.name,
        description: room.description ?? '',
        welcome_message: room.welcome_message ?? '',
        background: room.background ?? '',
        genre: room.genre ?? '',
        is_private: room.is_private,
    });
    const set = (patch: Partial<typeof s>) => setS({ ...s, ...patch });
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

    const save = (e: FormEvent) => {
        e.preventDefault();
        router.patch(
            route('rooms.update', room.slug),
            { ...s, background: s.background || null, genre: s.genre || null, welcome_message: s.welcome_message || null, is_private: canLock ? s.is_private : undefined },
            { preserveScroll: true, onSuccess: onSaved },
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
            className={`relative h-16 w-28 overflow-hidden rounded-lg border-2 ${s.background === key ? 'border-violet-400' : 'border-neutral-700 hover:border-neutral-500'}`}
        >
            {key === 'custom' ? (
                room.custom_background_url ? <img src={room.custom_background_url} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <span className="absolute inset-0 flex items-center justify-center bg-neutral-900 px-1 text-center text-[10px] text-neutral-500">no picture yet</span>
            ) : (
                <SceneBackdrop palette={paletteOf(key)} withBooth className="absolute inset-0 h-full w-full" />
            )}
            {star && <span className="absolute right-1 top-1 rounded bg-black/60 px-1 text-[10px] font-bold leading-4 text-amber-300">★ Host</span>}
            {season?.backgrounds.includes(key) && <span className="absolute left-1 top-1 rounded bg-emerald-500/90 px-1 text-[10px] font-bold leading-4 text-black">On now</span>}
            <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-[10px] font-semibold text-white">{name}</span>
        </button>
    );

    return (
        <form onSubmit={save} className="space-y-3">
            <div>
                <label className={label}>Room name</label>
                <input value={s.name} onChange={(e) => set({ name: e.target.value })} maxLength={50} className={input} />
            </div>
            <div>
                <label className={label}>Description</label>
                <input value={s.description} onChange={(e) => set({ description: e.target.value })} maxLength={140} className={input} />
            </div>
            <div>
                <label className={label}>Welcome message <span className="text-neutral-600">(it stays at the top of the chat for everyone)</span></label>
                <input value={s.welcome_message} onChange={(e) => set({ welcome_message: e.target.value })} maxLength={300} placeholder="Welcome! Play good music and be kind." className={input} />
            </div>
            <div>
                <label className={label}>Genre</label>
                <select value={s.genre} onChange={(e) => set({ genre: e.target.value })} className={input}>
                    <option value="">No genre</option>
                    {genres.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>
            {canLock && (
                <Toggle label="🔒 Private room" hint="Only the host and SFD-DJ.EU staff can enter" checked={s.is_private} onChange={(v) => set({ is_private: v })} />
            )}
            <div>
                <p className={label}>Background</p>
                <div className="flex flex-wrap gap-2">{[['', { label: 'Default' }] as const, ...plain].map(([key, b]) => tile(key, b.label))}</div>
                {special.length > 0 && (
                    <div className="mt-4 rounded-xl border border-orange-400/25 bg-gradient-to-r from-orange-500/[0.07] via-purple-500/[0.05] to-red-500/[0.07] p-3" data-special-backgrounds>
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
                    <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-3">
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
            </div>
            <button className="rounded bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-2 text-sm font-semibold">Save</button>
        </form>
    );
}

function MusicWaitlist({ slug, locked, cycle }: { slug: string; locked: boolean; cycle: boolean }) {
    const [error, setError] = useState('');
    const set = (patch: { locked?: boolean; cycle?: boolean }) =>
        send('PATCH', route('rooms.waitlist.settings', slug), patch).then(() => setError('')).catch((e: Error) => setError(e.message));

    return (
        <div className="divide-y divide-neutral-800">
            <Toggle label="Lock waitlist" hint="While locked, only people who manage the queue can add songs. Everyone else sees “The waitlist is locked”." checked={locked} onChange={(v) => set({ locked: v })} />
            <Toggle label="Cycle waitlist" hint="A song that has been played goes to the back of the waitlist, so the music keeps going round." checked={cycle} onChange={(v) => set({ cycle: v })} />
            {error && <p className="pt-3 text-sm text-red-400">{error}</p>}
        </div>
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
            <h3 className="text-sm font-semibold">Give someone a role</h3>
            <div className="flex gap-2">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a user by name" className={`${bare} min-w-0 flex-1`} />
                <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className={`${bare} w-40`}>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
            </div>
            {found.length > 0 && (
                <ul className="divide-y divide-neutral-800 rounded border border-neutral-800">
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
                    <li key={i} className="flex gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
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
                <button type="button" onClick={save} className="ml-auto rounded bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-2 text-sm font-semibold">Save rules</button>
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
                <button type="button" onClick={() => save()} disabled={busy} className="rounded bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-2 text-sm font-semibold disabled:opacity-50">{busy ? 'Saving…' : 'Save CSS'}</button>
                {saved !== '' && <button type="button" onClick={() => { setCss(''); save(''); }} className="rounded-lg px-3 py-2 text-xs text-neutral-400 hover:text-red-300">Remove all of it</button>}
                <span className="ml-auto text-[11px] text-neutral-500">{css.length.toLocaleString()} / 20,000</span>
            </div>
            {done && <p className="text-xs text-green-400">Saved. The room has it now.</p>}
            {error && <p className="text-xs text-red-400">{error}</p>}
            {notes.length > 0 && (
                <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-3 text-xs text-amber-200">
                    <p className="font-semibold">Left out of what the room gets:</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-amber-100/80">{notes.map((n) => <li key={n}>{n}</li>)}</ul>
                </div>
            )}

            <details className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-neutral-300">
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
