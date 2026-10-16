/**
 * sfddj: the official JavaScript client for the SFD-DJ.EU API.
 * Works in Node 18+, Deno, Bun and browsers (browser extensions): it only needs `fetch`. No dependencies.
 */

export const VERSION = '1.1.0';

export interface Role {
    key: string;
    label: string;
    color: string;
    icon?: string;
}

/** What an account may have: playlists, songs in each playlist and emojis in the rooms it hosts. More with a subscription. */
export interface Limits {
    playlists: number;
    songs: number;
    emojis: number;
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
    /** The character it wears, e.g. `foxy` (null for a photo or an older avatar). */
    character: string | null;
    /** The subscription it has now: `bronze`, `silver`, `gold`, `plus`, `pro` or `premium`, or null. */
    plan: string | null;
    limits: Limits;
    /** SFD Coins. */
    coins: number;
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

/** The answer of the front door, GET /api/v1 (no token needed). */
export interface ApiInfo {
    name: string;
    version: string;
    /** The time on the server, ISO 8601. */
    time: string;
    docs: string;
    package: string;
    limits: { requests_per_minute: number; chat_per_minute: number; whispers_per_minute: number };
}

/** A subscription. Prices are in euro cents; `xp` is a multiplier (1.25 is +25%). */
export interface PlanInfo extends Limits {
    key: string;
    currency: string;
    name: string;
    color: string;
    month: number;
    year: number;
    xp: number;
}

export interface PlanList {
    /** What everybody has without a subscription. */
    free: Limits & { xp: number };
    plans: PlanInfo[];
}

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'staff' | 'owner';

export interface Character {
    name: string;
    label: string;
    /** The level that opens it. */
    level: number;
    rarity: Rarity;
    /** In SFD Coins. 0 is free. */
    price: number;
    owned: boolean;
    /** The site role it is reserved for (`brand_ambassador`, `owner`), or null for everybody. */
    role: string | null;
    /** The picture of each state. */
    images: { standing: string; dancing: string; djing: string };
}

export interface Playlist {
    id: number;
    name: string;
    kind: string;
    /** The one you play from. */
    is_active: boolean;
    songs_count: number;
    /** Seconds; null for an empty playlist. */
    songs_sum_duration: number | null;
}

export interface PlaylistSong {
    id: number;
    youtube_id: string;
    title: string;
    channel: string | null;
    thumbnail: string | null;
    duration: number;
    origin: string | null;
    position: number;
}

/** How many songs were added of the ones found (a link may be a whole playlist; songs already in the list are skipped). */
export interface Added {
    added: number;
    found: number;
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
    /** The site you talk to, without /api/v1 at the end. https://sfd-dj.eu unless you give another (a copy on your own PC: http://localhost:8000 or http://127.0.0.1:8000). */
    baseUrl?: string;
    /** Bring your own fetch (tests, old runtimes). */
    fetch?: typeof fetch;
    /** Give up on a request after this many milliseconds. Default 15000. */
    timeoutMs?: number;
    /** How many times to try again when the site says "slow down" (429), or when a request that changes nothing meets a 502, 503, 504 or a dropped connection. Default 2. */
    retries?: number;
}

const DEFAULT_SITE = 'https://sfd-dj.eu';
const FALLBACK: Record<number, string> = { 401: 'Bad or missing token.', 403: 'Not allowed: the account lacks the permission or room role for this.', 404: 'Not found.', 429: 'Too many requests, slow down.' };

/** Thrown for every answer that is not a success. `status` is the HTTP status (0: no answer at all), `errors` the field errors of a 422, `retryAfter` the seconds the site asked you to wait. */
export class SfdDjError extends Error {
    constructor(
        message: string,
        public status: number,
        public errors?: Record<string, string[]>,
        public retryAfter?: number,
    ) {
        super(message);
        this.name = 'SfdDjError';
    }
}

type Query = Record<string, string | number | undefined>;

const queryString = (query?: Query) => {
    const parts = query ? Object.entries(query).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`) : [];

    return parts.length ? `?${parts.join('&')}` : '';
};

const sleep = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));
/** 0.5 s, 1 s, 2 s ... */
const backoff = (attempt: number) => 500 * 2 ** attempt;
const timeoutSignal = (ms: number) => {
    if (typeof AbortSignal.timeout === 'function') return AbortSignal.timeout(ms);
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);

    return controller.signal;
};

/** Requests that change nothing when they are made twice, so they may be repeated after a 5xx or a dropped connection. */
const REPEATABLE = new Set(['GET', 'HEAD', 'PUT', 'DELETE']);

/** The seconds the site asked us to wait (`Retry-After`), if it said. */
const retryAfter = (res: Response) => {
    const seconds = res.headers.get('Retry-After') === null ? NaN : Number(res.headers.get('Retry-After'));

    return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
};

/** The JSON of a success, or an `SfdDjError` made from the answer. */
async function answer<T>(res: Response): Promise<T> {
    if (res.status === 204) return undefined as T;
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        const errors = json.errors as Record<string, string[]> | undefined;
        throw new SfdDjError((errors && Object.values(errors)[0]?.[0]) || json.message || FALLBACK[res.status] || `Request failed (${res.status})`, res.status, errors, retryAfter(res));
    }

    return json as T;
}

/** A call that needs no token. */
async function open<T>(fetchImpl: typeof fetch, url: string): Promise<T> {
    try {
        return await answer<T>(await fetchImpl(url, { headers: { Accept: 'application/json' }, signal: timeoutSignal(15000) }));
    } catch (e) {
        if (e instanceof SfdDjError) throw e;
        throw new SfdDjError(`Could not reach the site: ${(e as Error).message}`, 0);
    }
}

export class SfdDj {
    private origin: string;
    private base: string;
    private token: string;
    private doFetch: typeof fetch;
    private timeoutMs: number;
    private retries: number;

    constructor(options: ClientOptions) {
        if (!options?.token) throw new Error('sfddj: a token is required (Settings → Developers on SFD-DJ.EU).');
        this.token = options.token;
        this.origin = (options.baseUrl || DEFAULT_SITE).replace(/\/+$/, '');
        this.base = `${this.origin}/api/v1`;
        this.doFetch = options.fetch ?? ((...args) => fetch(...args));
        this.timeoutMs = options.timeoutMs ?? 15000;
        this.retries = Math.max(0, options.retries ?? 2);
    }

    private async call<T>(method: string, path: string, body?: object, query?: Query): Promise<T> {
        const url = `${this.base}${path}${queryString(query)}`;

        for (let attempt = 0; ; attempt++) {
            let res: Response;

            try {
                res = await this.doFetch(url, {
                    method,
                    headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json', 'X-SFDDJ-Client': `sfddj-js/${VERSION}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
                    body: body ? JSON.stringify(body) : undefined,
                    signal: timeoutSignal(this.timeoutMs),
                });
            } catch (e) {
                if (attempt < this.retries && REPEATABLE.has(method)) { await sleep(backoff(attempt)); continue; }
                throw new SfdDjError((e as Error).name === 'TimeoutError' || (e as Error).name === 'AbortError' ? 'The site did not answer in time.' : `Could not reach the site: ${(e as Error).message}`, 0);
            }

            // 429 was refused before anything happened, so any request may be repeated; a 5xx only if repeating is harmless
            if (attempt < this.retries && (res.status === 429 || ([502, 503, 504].includes(res.status) && REPEATABLE.has(method)))) {
                const wait = retryAfter(res);
                await sleep(wait === undefined ? backoff(attempt) : Math.min(wait, 30) * 1000);
                continue;
            }

            return answer<T>(res);
        }
    }

    // ---- no token needed
    /** The front door: the API version, the time on the server and the limits. Good to check an address. */
    static async info(baseUrl: string = DEFAULT_SITE, fetchImpl: typeof fetch = (...args) => fetch(...args)): Promise<ApiInfo> {
        return open<ApiInfo>(fetchImpl, `${baseUrl.replace(/\/+$/, '')}/api/v1`);
    }

    /** The subscriptions, with prices in euro cents and what each one gives. */
    static async plans(baseUrl: string = DEFAULT_SITE, fetchImpl: typeof fetch = (...args) => fetch(...args)): Promise<PlanList> {
        return open<PlanList>(fetchImpl, `${baseUrl.replace(/\/+$/, '')}/api/v1/plans`);
    }

    /** The same as `SfdDj.info()`, for the site this client talks to. */
    info() { return SfdDj.info(this.origin, this.doFetch); }
    /** The same as `SfdDj.plans()`, for the site this client talks to. */
    plans() { return SfdDj.plans(this.origin, this.doFetch); }

    // ---- who
    me() { return this.call<Me>('GET', '/me'); }
    user(id: number) { return this.call<UserProfile>('GET', `/users/${id}`); }
    /** The characters this account may wear, lowest level first, with the pictures of each. */
    characters() { return this.call<Character[]>('GET', '/characters'); }

    // ---- rooms
    rooms() { return this.call<RoomSummary[]>('GET', '/rooms'); }
    room(slug: string) { return this.call<Room>('GET', `/rooms/${slug}`); }
    members(slug: string) { return this.call<RoomMembers>('GET', `/rooms/${slug}/members`); }
    /** A bot shows in the room while it keeps calling this (the lease lasts 90 seconds: call it every 30). Bot accounts only. */
    join(slug: string) { return this.call<{ online: boolean; expires_in: number }>('POST', `/rooms/${slug}/presence`); }
    /** A bot leaves the room's visual crowd. */
    leave(slug: string) { return this.call<void>('DELETE', `/rooms/${slug}/presence`); }

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
    /** Put up to 50 songs of one of your playlists into the room's waitlist. */
    queuePlaylist(slug: string, playlistId: number) { return this.call<void>('POST', `/rooms/${slug}/queue-playlist`, { playlist_id: playlistId }); }
    removeSong(slug: string, itemId: number) { return this.call<void>('DELETE', `/rooms/${slug}/queue/${itemId}`); }
    leaveWaitlist(slug: string) { return this.call<void>('DELETE', `/rooms/${slug}/waitlist`); }
    setWaitlist(slug: string, settings: { locked?: boolean; cycle?: boolean }) { return this.call<void>('PATCH', `/rooms/${slug}/waitlist-settings`, settings); }
    skip(slug: string, itemId: number) { return this.call<void>('POST', `/rooms/${slug}/skip`, { item_id: itemId }); }
    vote(slug: string, type: VoteType) { return this.call<void>('POST', `/rooms/${slug}/vote`, { type }); }
    /** Grab the song that is playing into one of your playlists, or into a new one with that name. */
    grab(slug: string, into: { playlistId: number } | { newPlaylist: string }) { return this.call<void>('POST', `/rooms/${slug}/vote`, { type: 'grab', ...('playlistId' in into ? { playlist_id: into.playlistId } : { new_playlist: into.newPlaylist }) }); }
    searchYoutube(q: string) { return this.call<YoutubeResult[]>('GET', '/youtube/search', undefined, { q }); }

    // ---- your playlists (the limit of your subscription applies: `me().limits.playlists`)
    playlists() { return this.call<Playlist[]>('GET', '/playlists'); }
    /** The songs of one of your playlists, in play order. */
    playlist(id: number) { return this.call<PlaylistSong[]>('GET', `/playlists/${id}`); }
    createPlaylist(name: string) { return this.call<Pick<Playlist, 'id' | 'name' | 'kind' | 'is_active'>>('POST', '/playlists', { name }); }
    renamePlaylist(id: number, name: string) { return this.call<Pick<Playlist, 'id' | 'name' | 'kind' | 'is_active'>>('PATCH', `/playlists/${id}`, { name }); }
    deletePlaylist(id: number) { return this.call<{ ok: boolean }>('DELETE', `/playlists/${id}`); }
    /** Make it the playlist you play from. */
    activatePlaylist(id: number) { return this.call<unknown>('POST', `/playlists/${id}/activate`); }
    /** Add a song by link (YouTube, SoundCloud, Spotify) or YouTube video id. */
    addToPlaylist(id: number, song: { url: string } | { videoId: string }) { return this.call<Added>('POST', `/playlists/${id}/songs`, 'url' in song ? { url: song.url } : { video_id: song.videoId }); }
    /** Add many links at once, one per line. */
    importToPlaylist(id: number, text: string) { return this.call<Added & { errors: string[] }>('POST', `/playlists/${id}/import`, { text }); }
    removeFromPlaylist(id: number, songId: number) { return this.call<{ ok: boolean }>('DELETE', `/playlists/${id}/songs/${songId}`); }
    /** Save an order: the ids of all the songs, first song first (see `playlist(id)`). */
    orderPlaylist(id: number, songIds: number[]) { return this.call<{ ok: boolean }>('PUT', `/playlists/${id}/order`, { ids: songIds }); }
    shufflePlaylist(id: number) { return this.call<PlaylistSong[]>('POST', `/playlists/${id}/shuffle`); }

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
    /** What a chat command starts with. Default `!`. */
    prefix?: string;
    /** Show the bot in the room while it runs (it joins, calls `join()` every 30 seconds and leaves when stopped). Default: yes for a bot account, no for a person's token. */
    presence?: boolean;
}

type Events = {
    /** A chat message from somebody else (never the bot's own). */
    message: (m: ChatMessage) => void;
    /** A different song started (or the room went quiet: `song` is null). */
    songChange: (song: Song | null, room: Room) => void;
    /** The woots, mehs or grabs of the song that is playing changed. */
    votes: (votes: Playback['votes'], room: Room) => void;
    /** Anything that failed while polling; the bot keeps going (and waits a little longer after each failure in a row). */
    error: (e: Error) => void;
};

type Command = { handler: (m: ChatMessage, args: string[]) => void | Promise<void>; cooldownMs: number };

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Polls a room and turns what happens into events. Simple and dependency free;
 * it makes about 30 requests a minute, well inside the rate limit.
 */
export class Bot {
    private handlers: { [K in keyof Events]?: Events[K][] } = {};
    private commands = new Map<string, Command>();
    private cooldowns = new Map<string, number>();
    private timer: ReturnType<typeof setTimeout> | null = null;
    private beat: ReturnType<typeof setInterval> | null = null;
    private running = false;
    private lastId = 0;
    private lastSong: number | null | undefined;
    private lastVotes = '';
    private meId = 0;
    private tick = 0;
    private failures = 0;
    private pollMs: number;
    private prefix: string;
    private presence?: boolean;

    constructor(public readonly client: SfdDj, public readonly slug: string, opts: BotOptions = {}) {
        this.pollMs = Math.max(1000, opts.pollMs ?? 2000);
        this.prefix = opts.prefix ?? '!';
        this.presence = opts.presence;
    }

    on<K extends keyof Events>(event: K, handler: Events[K]): this {
        (this.handlers[event] ??= [] as never).push(handler as never);
        return this;
    }

    /**
     * `bot.command('ping', (m) => bot.say('pong'))` answers messages that start with `!ping`.
     * `cooldownMs` makes the bot ignore the same command from the same person for that long.
     */
    command(name: string, handler: (m: ChatMessage, args: string[]) => void | Promise<void>, opts: { cooldownMs?: number } = {}): this {
        this.commands.set(name.replace(/^[!/]/, '').toLowerCase(), { handler, cooldownMs: opts.cooldownMs ?? 0 });
        return this;
    }

    say(text: string, opts?: { replyTo?: number }) { return this.client.say(this.slug, text, opts); }

    /** Answer one message, as a reply to it. */
    reply(message: ChatMessage, text: string) { return this.say(text, { replyTo: message.id }); }

    private emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>) {
        for (const h of this.handlers[event] ?? []) (h as (...a: unknown[]) => void)(...args);
    }

    /** Starts watching. Old messages are skipped: the bot only reacts to what is said from now on. */
    async start(): Promise<this> {
        const me = await this.client.me();
        this.meId = me.id;
        const latest = await this.client.messages(this.slug, { limit: 1 });
        this.lastId = latest[0]?.id ?? 0;
        const room = await this.client.room(this.slug);
        this.lastSong = room.playback.current?.id ?? null;
        this.lastVotes = JSON.stringify(room.playback.votes);
        this.running = true;

        if (this.presence ?? me.is_bot) {
            await this.client.join(this.slug);
            this.beat = setInterval(() => this.client.join(this.slug).catch((e) => this.emit('error', e)), 30_000);
        }

        this.schedule();
        return this;
    }

    /** Stops watching and, if the bot was shown in the room, leaves it. */
    async stop(): Promise<void> {
        this.running = false;
        if (this.timer) clearTimeout(this.timer);
        if (this.beat) clearInterval(this.beat);
        const wasThere = this.beat !== null;
        this.timer = this.beat = null;
        if (wasThere) await this.client.leave(this.slug).catch(() => undefined);
    }

    private schedule() {
        // after failures in a row wait longer: 2 s, 4 s, 8 s ... at most 30 s
        this.timer = setTimeout(() => this.poll(), Math.min(30_000, this.pollMs * 2 ** this.failures));
    }

    private async poll() {
        try {
            const hit = new RegExp(`^${escapeRegExp(this.prefix)}(\\w+)\\s*(.*)$`);

            for (const m of await this.client.messages(this.slug, { after: this.lastId })) {
                this.lastId = Math.max(this.lastId, m.id);
                if (m.type !== 'user' || m.user_id === this.meId) continue;
                this.emit('message', m);

                const found = hit.exec(m.body);
                const name = found?.[1].toLowerCase() ?? '';
                const command = found && this.commands.get(name);
                if (!command) continue;

                const key = `${name}:${m.user_id}`;
                if (command.cooldownMs && Date.now() < (this.cooldowns.get(key) ?? 0)) continue;
                if (command.cooldownMs) this.cooldowns.set(key, Date.now() + command.cooldownMs);
                await command.handler(m, found![2] ? found![2].split(/\s+/) : []);
            }

            // the song and the votes cost a request, so every third round is enough
            if (this.tick++ % 3 === 0) {
                const room = await this.client.room(this.slug);
                const id = room.playback.current?.id ?? null;
                const votes = JSON.stringify(room.playback.votes);
                if (id !== this.lastSong) {
                    this.lastSong = id;
                    this.lastVotes = votes;
                    this.emit('songChange', room.playback.current, room);
                } else if (votes !== this.lastVotes) {
                    this.lastVotes = votes;
                    this.emit('votes', room.playback.votes, room);
                }
            }

            this.failures = 0;
        } catch (e) {
            this.failures = Math.min(this.failures + 1, 4);
            this.emit('error', e as Error);
        }

        if (this.running) this.schedule();
    }
}
