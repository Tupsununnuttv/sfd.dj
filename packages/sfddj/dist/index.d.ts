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
    /** The site you talk to, without /api/v1 at the end. https://sfd-dj.eu unless you give another (a copy on your own PC: http://localhost:8000). */
    baseUrl?: string;
    /** Bring your own fetch (tests, old runtimes). */
    fetch?: typeof fetch;
}
/** Thrown for every answer that is not a success. `status` is the HTTP status, `errors` the field errors of a 422. */
export declare class SfdDjError extends Error {
    status: number;
    errors?: Record<string, string[]> | undefined;
    constructor(message: string, status: number, errors?: Record<string, string[]> | undefined);
}
export declare class SfdDj {
    private base;
    private token;
    private doFetch;
    constructor(options: ClientOptions);
    private call;
    me(): Promise<Me>;
    user(id: number): Promise<UserProfile>;
    rooms(): Promise<RoomSummary[]>;
    room(slug: string): Promise<Room>;
    members(slug: string): Promise<RoomMembers>;
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
    removeSong(slug: string, itemId: number): Promise<void>;
    leaveWaitlist(slug: string): Promise<void>;
    setWaitlist(slug: string, settings: {
        locked?: boolean;
        cycle?: boolean;
    }): Promise<void>;
    skip(slug: string, itemId: number): Promise<void>;
    vote(slug: string, type: VoteType): Promise<void>;
    searchYoutube(q: string): Promise<YoutubeResult[]>;
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
export declare class Bot {
    readonly client: SfdDj;
    readonly slug: string;
    private handlers;
    private commands;
    private timer;
    private lastId;
    private lastSong;
    private meId;
    private tick;
    private pollMs;
    constructor(client: SfdDj, slug: string, opts?: BotOptions);
    on<K extends keyof Events>(event: K, handler: Events[K]): this;
    /** `bot.command('ping', (m) => bot.say('pong'))` answers messages that start with `!ping`. */
    command(name: string, handler: (m: ChatMessage, args: string[]) => void | Promise<void>): this;
    say(text: string, opts?: {
        replyTo?: number;
    }): Promise<void>;
    private emit;
    /** Starts watching. Old messages are skipped: the bot only reacts to what is said from now on. */
    start(): Promise<this>;
    stop(): void;
    private schedule;
    private poll;
}
export {};
