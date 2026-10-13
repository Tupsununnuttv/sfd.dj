/**
 * sfddj: the official JavaScript client for the SFD-DJ.EU API.
 * Works in Node 18+, Deno, Bun and browsers (browser extensions): it only needs `fetch`. No dependencies.
 */

export interface Role {
    key: string;
    label: string;
    color: string;
    icon?: string;
}

export interface Me {
    id: number;
    name: string;
    username: string | null;
    avatar: string | null;
    level: number;
    xp: number;
    primary_role: Role;
    badges: Role[];
    is_bot: boolean;
    roles: string[];
    site_permissions: string[];
}

export interface UserProfile {
    id: number;
    name: string;
    username: string | null;
    avatar: string | null;
    level: number;
    primary_role: Role;
    badges: Role[];
    joined: string;
    discord: string | null;
    friendship: 'none' | 'friends' | 'sent' | 'received';
    stats: { xp: number; songs_played: number; woots: number; grabs: number; friends: number };
    rooms: { id: number; name: string; slug: string; genre: string | null }[];
}

export interface RoomSummary {
    slug: string;
    name: string;
    description: string | null;
    genre: string | null;
    is_private: boolean;
    host: { id: number; name: string };
    listening: number;
    queue_length: number;
}

export interface Song {
    id: number;
    user_id: number;
    youtube_id: string;
    title: string;
    thumbnail: string | null;
    duration: number;
    added_by: string;
}

export interface Playback {
    current: Song | null;
    /** Seconds into the current song. */
    elapsed: number;
    queue: Song[];
    votes: { woot: number; meh: number; grab: number };
    locked: boolean;
    cycle: boolean;
}

export interface Room extends Omit<RoomSummary, 'queue_length'> {
    welcome_message: string | null;
    rules: string | null;
    /** What the caller may do here: moderate_chat, manage_queue, skip, moderate_users, manage_roles, edit_settings ... */
    permissions: string[];
    playback: Playback;
}

export interface ChatMessage {
    id: number;
    type: 'user' | 'system';
    kind: string | null;
    body: string;
    user: string;
    user_id: number;
    avatar: string | null;
    role: Role;
    badges: Role[];
    level: number;
    sticker: string | null;
    image_url: string | null;
    reply: { id: number; user: string | null; body: string | null } | null;
}

export interface RoomMembers {
    host: { id: number; name: string };
    roles: { id: number; name: string; color: string; permissions: string[] }[];
    members: { user_id: number; name: string; room_role_id: number }[];
}

export interface YoutubeResult {
    id: string;
    title: string;
    thumbnail: string | null;
    duration: number;
}

export interface Whisper {
    id: number;
    mine: boolean;
    from_id: number;
    to_id: number;
    body: string;
    at: string;
}

export type MuteLength = '10m' | '1h' | '24h' | 'forever';
export type VoteType = 'woot' | 'meh' | 'grab';

export interface ClientOptions {
    /** A token from Settings → Developers on SFD-DJ.EU. */
    token: string;
    /** The address of the SFD-DJ.EU site you talk to, e.g. https://sfd.example.com (no /api/v1 at the end). */
    baseUrl: string;
    /** Bring your own fetch (tests, old runtimes). */
    fetch?: typeof fetch;
}

const FALLBACK: Record<number, string> = { 401: 'Bad or missing token.', 403: 'Not allowed: the account lacks the permission or room role for this.', 404: 'Not found.', 429: 'Too many requests, slow down.' };

/** Thrown for every answer that is not a success. `status` is the HTTP status, `errors` the field errors of a 422. */
export class SfdDjError extends Error {
    constructor(
        message: string,
        public status: number,
        public errors?: Record<string, string[]>,
    ) {
        super(message);
        this.name = 'SfdDjError';
    }
}

export class SfdDj {
    private base: string;
    private token: string;
    private doFetch: typeof fetch;

    constructor(options: ClientOptions) {
        if (!options?.token) throw new Error('sfddj: a token is required (Settings → Developers on SFD-DJ.EU).');
        this.token = options.token;
        if (!options.baseUrl) throw new Error('sfddj: baseUrl is required, e.g. https://sfd.example.com');
        this.base = options.baseUrl.replace(/\/+$/, '') + '/api/v1';
        this.doFetch = options.fetch ?? ((...args) => fetch(...args));
    }

    private async call<T>(method: string, path: string, body?: object, query?: Record<string, string | number | undefined>): Promise<T> {
        const qs = query ? Object.entries(query).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&') : '';
        const res = await this.doFetch(`${this.base}${path}${qs ? `?${qs}` : ''}`, {
            method,
            headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (res.status === 204) return undefined as T;
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            const errors = json.errors as Record<string, string[]> | undefined;
            throw new SfdDjError((errors && Object.values(errors)[0]?.[0]) || json.message || FALLBACK[res.status] || `Request failed (${res.status})`, res.status, errors);
        }

        return json as T;
    }

    // ---- who
    me() { return this.call<Me>('GET', '/me'); }
    user(id: number) { return this.call<UserProfile>('GET', `/users/${id}`); }

    // ---- rooms
    rooms() { return this.call<RoomSummary[]>('GET', '/rooms'); }
    room(slug: string) { return this.call<Room>('GET', `/rooms/${slug}`); }
    members(slug: string) { return this.call<RoomMembers>('GET', `/rooms/${slug}/members`); }

    // ---- chat
    /** Latest messages, or with `after` only the ones newer than that message id (oldest first). */
    messages(slug: string, opts: { after?: number; limit?: number } = {}) { return this.call<ChatMessage[]>('GET', `/rooms/${slug}/messages`, undefined, opts); }
    /** Say something in the room's chat (max 300 characters). */
    say(slug: string, body: string, opts: { replyTo?: number } = {}) { return this.call<void>('POST', `/rooms/${slug}/messages`, { body, reply_to_id: opts.replyTo }); }
    deleteMessage(slug: string, messageId: number) { return this.call<void>('DELETE', `/rooms/${slug}/messages/${messageId}`); }
    clearChat(slug: string) { return this.call<void>('DELETE', `/rooms/${slug}/messages`); }
    /** A highlighted system announcement in chat. */
    announce(slug: string, message: string) { return this.call<void>('POST', `/rooms/${slug}/announce`, { message }); }

    // ---- music
    /** Add a song by link (YouTube, SoundCloud, Spotify) or YouTube video id. */
    addSong(slug: string, song: { url: string } | { videoId: string }) { return this.call<void>('POST', `/rooms/${slug}/queue`, 'url' in song ? { url: song.url } : { video_id: song.videoId }); }
    removeSong(slug: string, itemId: number) { return this.call<void>('DELETE', `/rooms/${slug}/queue/${itemId}`); }
    leaveWaitlist(slug: string) { return this.call<void>('DELETE', `/rooms/${slug}/waitlist`); }
    setWaitlist(slug: string, settings: { locked?: boolean; cycle?: boolean }) { return this.call<void>('PATCH', `/rooms/${slug}/waitlist-settings`, settings); }
    skip(slug: string, itemId: number) { return this.call<void>('POST', `/rooms/${slug}/skip`, { item_id: itemId }); }
    vote(slug: string, type: VoteType) { return this.call<void>('POST', `/rooms/${slug}/vote`, { type }); }
    searchYoutube(q: string) { return this.call<YoutubeResult[]>('GET', '/youtube/search', undefined, { q }); }

    // ---- moderation (needs the matching room role)
    kick(slug: string, userId: number) { return this.call<void>('POST', `/rooms/${slug}/kick/${userId}`); }
    ban(slug: string, userId: number) { return this.call<void>('POST', `/rooms/${slug}/ban/${userId}`); }
    unban(slug: string, userId: number) { return this.call<void>('DELETE', `/rooms/${slug}/ban/${userId}`); }
    mute(slug: string, userId: number, length: MuteLength = '10m') { return this.call<void>('POST', `/rooms/${slug}/mute/${userId}`, { for: length }); }
    unmute(slug: string, userId: number) { return this.call<void>('DELETE', `/rooms/${slug}/mute/${userId}`); }
    /** Give someone a room role (id from `members()`), or `null` to take it away. */
    setRole(slug: string, userId: number, roleId: number | null) { return this.call<void>('PUT', `/rooms/${slug}/members/${userId}`, { room_role_id: roleId }); }

    // ---- whispers
    whispers() { return this.call<{ user: { id: number; name: string; username: string }; last: Whisper; unread: number }[]>('GET', '/whispers'); }
    whisperThread(userId: number) { return this.call<{ user: { id: number; name: string }; messages: Whisper[] }>('GET', `/whispers/${userId}`); }
    whisper(to: { userId: number } | { username: string }, body: string) { return this.call<unknown>('POST', '/whispers', { ...('userId' in to ? { user_id: to.userId } : { username: to.username }), body }); }

    /** A bot that watches one room: `client.bot('my-room').on('message', ...).start()`. */
    bot(slug: string, opts?: BotOptions) { return new Bot(this, slug, opts); }
}

export interface BotOptions {
    /** How often to look for new chat messages, in ms. Default 2000, minimum 1000. */
    pollMs?: number;
}

type Events = {
    /** A chat message from somebody else (never the bot's own). */
    message: (m: ChatMessage) => void;
    /** A different song started (or the room went quiet: `song` is null). */
    songChange: (song: Song | null, room: Room) => void;
    /** Anything that failed while polling; the bot keeps going. */
    error: (e: Error) => void;
};

/**
 * Polls a room and turns what happens into events. Simple and dependency free;
 * it makes about 30 requests a minute, well inside the rate limit.
 */
export class Bot {
    private handlers: { [K in keyof Events]?: Events[K][] } = {};
    private commands = new Map<string, (m: ChatMessage, args: string[]) => void | Promise<void>>();
    private timer: ReturnType<typeof setTimeout> | null = null;
    private lastId = 0;
    private lastSong: number | null | undefined;
    private meId = 0;
    private tick = 0;
    private pollMs: number;

    constructor(public readonly client: SfdDj, public readonly slug: string, opts: BotOptions = {}) {
        this.pollMs = Math.max(1000, opts.pollMs ?? 2000);
    }

    on<K extends keyof Events>(event: K, handler: Events[K]): this {
        (this.handlers[event] ??= [] as never).push(handler as never);
        return this;
    }

    /** `bot.command('ping', (m) => bot.say('pong'))` answers messages that start with `!ping`. */
    command(name: string, handler: (m: ChatMessage, args: string[]) => void | Promise<void>): this {
        this.commands.set(name.replace(/^!/, '').toLowerCase(), handler);
        return this;
    }

    say(text: string, opts?: { replyTo?: number }) { return this.client.say(this.slug, text, opts); }

    private emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>) {
        for (const h of this.handlers[event] ?? []) (h as (...a: unknown[]) => void)(...args);
    }

    /** Starts watching. Old messages are skipped: the bot only reacts to what is said from now on. */
    async start(): Promise<this> {
        this.meId = (await this.client.me()).id;
        const latest = await this.client.messages(this.slug, { limit: 1 });
        this.lastId = latest[0]?.id ?? 0;
        this.lastSong = (await this.client.room(this.slug)).playback.current?.id ?? null;
        this.schedule();
        return this;
    }

    stop() {
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
    }

    private schedule() {
        this.timer = setTimeout(() => this.poll(), this.pollMs);
    }

    private async poll() {
        try {
            for (const m of await this.client.messages(this.slug, { after: this.lastId })) {
                this.lastId = Math.max(this.lastId, m.id);
                if (m.type !== 'user' || m.user_id === this.meId) continue;
                this.emit('message', m);

                const hit = /^!(\w+)\s*(.*)$/.exec(m.body);
                const handler = hit && this.commands.get(hit[1].toLowerCase());
                if (handler) await handler(m, hit![2] ? hit![2].split(/\s+/) : []);
            }

            // the song check costs a request, so every third round is enough
            if (this.tick++ % 3 === 0) {
                const room = await this.client.room(this.slug);
                const id = room.playback.current?.id ?? null;
                if (id !== this.lastSong) {
                    this.lastSong = id;
                    this.emit('songChange', room.playback.current, room);
                }
            }
        } catch (e) {
            this.emit('error', e as Error);
        }

        if (this.timer) this.schedule();
    }
}
