/**
 * sfddj: the official JavaScript client for the SFD-DJ.EU API.
 * Works in Node 18+, Deno, Bun and browsers (browser extensions): it only needs `fetch`. No dependencies.
 */
export declare const VERSION = "1.1.0";
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
    stats: {
        xp: number;
        songs_played: number;
        woots: number;
        grabs: number;
        friends: number;
    };
    rooms: {
        id: number;
        name: string;
        slug: string;
        genre: string | null;
    }[];
}
/** The answer of the front door, GET /api/v1 (no token needed). */
export interface ApiInfo {
    name: string;
    version: string;
    /** The time on the server, ISO 8601. */
    time: string;
    docs: string;
    package: string;
    limits: {
        requests_per_minute: number;
        chat_per_minute: number;
        whispers_per_minute: number;
    };
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
    free: Limits & {
        xp: number;
    };
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
    images: {
        standing: string;
        dancing: string;
        djing: string;
    };
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
    host: {
        id: number;
        name: string;
    };
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
    votes: {
        woot: number;
        meh: number;
        grab: number;
    };
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
    reply: {
        id: number;
        user: string | null;
        body: string | null;
    } | null;
}
export interface RoomMembers {
    host: {
        id: number;
        name: string;
    };
    roles: {
        id: number;
        name: string;
        color: string;
        permissions: string[];
    }[];
    members: {
        user_id: number;
        name: string;
        room_role_id: number;
    }[];
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
/** Thrown for every answer that is not a success. `status` is the HTTP status (0: no answer at all), `errors` the field errors of a 422, `retryAfter` the seconds the site asked you to wait. */
export declare class SfdDjError extends Error {
    status: number;
    errors?: Record<string, string[]> | undefined;
    retryAfter?: number | undefined;
    constructor(message: string, status: number, errors?: Record<string, string[]> | undefined, retryAfter?: number | undefined);
}
export declare class SfdDj {
    private origin;
    private base;
    private token;
    private doFetch;
    private timeoutMs;
    private retries;
    constructor(options: ClientOptions);
    private call;
    /** The front door: the API version, the time on the server and the limits. Good to check an address. */
    static info(baseUrl?: string, fetchImpl?: typeof fetch): Promise<ApiInfo>;
    /** The subscriptions, with prices in euro cents and what each one gives. */
    static plans(baseUrl?: string, fetchImpl?: typeof fetch): Promise<PlanList>;
    /** The same as `SfdDj.info()`, for the site this client talks to. */
    info(): Promise<ApiInfo>;
    /** The same as `SfdDj.plans()`, for the site this client talks to. */
    plans(): Promise<PlanList>;
    me(): Promise<Me>;
    user(id: number): Promise<UserProfile>;
    /** The characters this account may wear, lowest level first, with the pictures of each. */
    characters(): Promise<Character[]>;
    rooms(): Promise<RoomSummary[]>;
    room(slug: string): Promise<Room>;
    members(slug: string): Promise<RoomMembers>;
    /** A bot shows in the room while it keeps calling this (the lease lasts 90 seconds: call it every 30). Bot accounts only. */
    join(slug: string): Promise<{
        online: boolean;
        expires_in: number;
    }>;
    /** A bot leaves the room's visual crowd. */
    leave(slug: string): Promise<void>;
    /** Latest messages, or with `after` only the ones newer than that message id (oldest first). */
    messages(slug: string, opts?: {
        after?: number;
        limit?: number;
    }): Promise<ChatMessage[]>;
    /** Say something in the room's chat (max 300 characters). */
    say(slug: string, body: string, opts?: {
        replyTo?: number;
    }): Promise<void>;
    deleteMessage(slug: string, messageId: number): Promise<void>;
    clearChat(slug: string): Promise<void>;
    /** A highlighted system announcement in chat. */
    announce(slug: string, message: string): Promise<void>;
    /** Add a song by link (YouTube, SoundCloud, Spotify) or YouTube video id. */
    addSong(slug: string, song: {
        url: string;
    } | {
        videoId: string;
    }): Promise<void>;
    /** Put up to 50 songs of one of your playlists into the room's waitlist. */
    queuePlaylist(slug: string, playlistId: number): Promise<void>;
    removeSong(slug: string, itemId: number): Promise<void>;
    leaveWaitlist(slug: string): Promise<void>;
    setWaitlist(slug: string, settings: {
        locked?: boolean;
        cycle?: boolean;
    }): Promise<void>;
    skip(slug: string, itemId: number): Promise<void>;
    vote(slug: string, type: VoteType): Promise<void>;
    /** Grab the song that is playing into one of your playlists, or into a new one with that name. */
    grab(slug: string, into: {
        playlistId: number;
    } | {
        newPlaylist: string;
    }): Promise<void>;
    searchYoutube(q: string): Promise<YoutubeResult[]>;
    playlists(): Promise<Playlist[]>;
    /** The songs of one of your playlists, in play order. */
    playlist(id: number): Promise<PlaylistSong[]>;
    createPlaylist(name: string): Promise<Pick<Playlist, "id" | "is_active" | "kind" | "name">>;
    renamePlaylist(id: number, name: string): Promise<Pick<Playlist, "id" | "is_active" | "kind" | "name">>;
    deletePlaylist(id: number): Promise<{
        ok: boolean;
    }>;
    /** Make it the playlist you play from. */
    activatePlaylist(id: number): Promise<unknown>;
    /** Add a song by link (YouTube, SoundCloud, Spotify) or YouTube video id. */
    addToPlaylist(id: number, song: {
        url: string;
    } | {
        videoId: string;
    }): Promise<Added>;
    /** Add many links at once, one per line. */
    importToPlaylist(id: number, text: string): Promise<Added & {
        errors: string[];
    }>;
    removeFromPlaylist(id: number, songId: number): Promise<{
        ok: boolean;
    }>;
    /** Save an order: the ids of all the songs, first song first (see `playlist(id)`). */
    orderPlaylist(id: number, songIds: number[]): Promise<{
        ok: boolean;
    }>;
    shufflePlaylist(id: number): Promise<PlaylistSong[]>;
    kick(slug: string, userId: number): Promise<void>;
    ban(slug: string, userId: number): Promise<void>;
    unban(slug: string, userId: number): Promise<void>;
    mute(slug: string, userId: number, length?: MuteLength): Promise<void>;
    unmute(slug: string, userId: number): Promise<void>;
    /** Give someone a room role (id from `members()`), or `null` to take it away. */
    setRole(slug: string, userId: number, roleId: number | null): Promise<void>;
    whispers(): Promise<{
        user: {
            id: number;
            name: string;
            username: string;
        };
        last: Whisper;
        unread: number;
    }[]>;
    whisperThread(userId: number): Promise<{
        user: {
            id: number;
            name: string;
        };
        messages: Whisper[];
    }>;
    whisper(to: {
        userId: number;
    } | {
        username: string;
    }, body: string): Promise<unknown>;
    /** A bot that watches one room: `client.bot('my-room').on('message', ...).start()`. */
    bot(slug: string, opts?: BotOptions): Bot;
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
/**
 * Polls a room and turns what happens into events. Simple and dependency free;
 * it makes about 30 requests a minute, well inside the rate limit.
 */
export declare class Bot {
    readonly client: SfdDj;
    readonly slug: string;
    private handlers;
    private commands;
    private cooldowns;
    private timer;
    private beat;
    private running;
    private lastId;
    private lastSong;
    private lastVotes;
    private meId;
    private tick;
    private failures;
    private pollMs;
    private prefix;
    private presence?;
    constructor(client: SfdDj, slug: string, opts?: BotOptions);
    on<K extends keyof Events>(event: K, handler: Events[K]): this;
    /**
     * `bot.command('ping', (m) => bot.say('pong'))` answers messages that start with `!ping`.
     * `cooldownMs` makes the bot ignore the same command from the same person for that long.
     */
    command(name: string, handler: (m: ChatMessage, args: string[]) => void | Promise<void>, opts?: {
        cooldownMs?: number;
    }): this;
    say(text: string, opts?: {
        replyTo?: number;
    }): Promise<void>;
    /** Answer one message, as a reply to it. */
    reply(message: ChatMessage, text: string): Promise<void>;
    private emit;
    /** Starts watching. Old messages are skipped: the bot only reacts to what is said from now on. */
    start(): Promise<this>;
    /** Stops watching and, if the bot was shown in the room, leaves it. */
    stop(): Promise<void>;
    private schedule;
    private poll;
}
export {};
