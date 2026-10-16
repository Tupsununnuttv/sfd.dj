/**
 * sfddj: the official JavaScript client for the SFD-DJ.EU API.
 * Works in Node 18+, Deno, Bun and browsers (browser extensions): it only needs `fetch`. No dependencies.
 */
export const VERSION = '1.1.0';
const DEFAULT_SITE = 'https://sfd-dj.eu';
const FALLBACK = { 401: 'Bad or missing token.', 403: 'Not allowed: the account lacks the permission or room role for this.', 404: 'Not found.', 429: 'Too many requests, slow down.' };
/** Thrown for every answer that is not a success. `status` is the HTTP status (0: no answer at all), `errors` the field errors of a 422, `retryAfter` the seconds the site asked you to wait. */
export class SfdDjError extends Error {
    constructor(message, status, errors, retryAfter) {
        super(message);
        this.status = status;
        this.errors = errors;
        this.retryAfter = retryAfter;
        this.name = 'SfdDjError';
    }
}
const queryString = (query) => {
    const parts = query ? Object.entries(query).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`) : [];
    return parts.length ? `?${parts.join('&')}` : '';
};
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
/** 0.5 s, 1 s, 2 s ... */
const backoff = (attempt) => 500 * 2 ** attempt;
const timeoutSignal = (ms) => {
    if (typeof AbortSignal.timeout === 'function')
        return AbortSignal.timeout(ms);
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
};
/** Requests that change nothing when they are made twice, so they may be repeated after a 5xx or a dropped connection. */
const REPEATABLE = new Set(['GET', 'HEAD', 'PUT', 'DELETE']);
/** The seconds the site asked us to wait (`Retry-After`), if it said. */
const retryAfter = (res) => {
    const seconds = res.headers.get('Retry-After') === null ? NaN : Number(res.headers.get('Retry-After'));
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
};
/** The JSON of a success, or an `SfdDjError` made from the answer. */
async function answer(res) {
    if (res.status === 204)
        return undefined;
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        const errors = json.errors;
        throw new SfdDjError((errors && Object.values(errors)[0]?.[0]) || json.message || FALLBACK[res.status] || `Request failed (${res.status})`, res.status, errors, retryAfter(res));
    }
    return json;
}
/** A call that needs no token. */
async function open(fetchImpl, url) {
    try {
        return await answer(await fetchImpl(url, { headers: { Accept: 'application/json' }, signal: timeoutSignal(15000) }));
    }
    catch (e) {
        if (e instanceof SfdDjError)
            throw e;
        throw new SfdDjError(`Could not reach the site: ${e.message}`, 0);
    }
}
export class SfdDj {
    constructor(options) {
        if (!options?.token)
            throw new Error('sfddj: a token is required (Settings → Developers on SFD-DJ.EU).');
        this.token = options.token;
        this.origin = (options.baseUrl || DEFAULT_SITE).replace(/\/+$/, '');
        this.base = `${this.origin}/api/v1`;
        this.doFetch = options.fetch ?? ((...args) => fetch(...args));
        this.timeoutMs = options.timeoutMs ?? 15000;
        this.retries = Math.max(0, options.retries ?? 2);
    }
    async call(method, path, body, query) {
        const url = `${this.base}${path}${queryString(query)}`;
        for (let attempt = 0;; attempt++) {
            let res;
            try {
                res = await this.doFetch(url, {
                    method,
                    headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json', 'X-SFDDJ-Client': `sfddj-js/${VERSION}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
                    body: body ? JSON.stringify(body) : undefined,
                    signal: timeoutSignal(this.timeoutMs),
                });
            }
            catch (e) {
                if (attempt < this.retries && REPEATABLE.has(method)) {
                    await sleep(backoff(attempt));
                    continue;
                }
                throw new SfdDjError(e.name === 'TimeoutError' || e.name === 'AbortError' ? 'The site did not answer in time.' : `Could not reach the site: ${e.message}`, 0);
            }
            // 429 was refused before anything happened, so any request may be repeated; a 5xx only if repeating is harmless
            if (attempt < this.retries && (res.status === 429 || ([502, 503, 504].includes(res.status) && REPEATABLE.has(method)))) {
                const wait = retryAfter(res);
                await sleep(wait === undefined ? backoff(attempt) : Math.min(wait, 30) * 1000);
                continue;
            }
            return answer(res);
        }
    }
    // ---- no token needed
    /** The front door: the API version, the time on the server and the limits. Good to check an address. */
    static async info(baseUrl = DEFAULT_SITE, fetchImpl = (...args) => fetch(...args)) {
        return open(fetchImpl, `${baseUrl.replace(/\/+$/, '')}/api/v1`);
    }
    /** The subscriptions, with prices in euro cents and what each one gives. */
    static async plans(baseUrl = DEFAULT_SITE, fetchImpl = (...args) => fetch(...args)) {
        return open(fetchImpl, `${baseUrl.replace(/\/+$/, '')}/api/v1/plans`);
    }
    /** The same as `SfdDj.info()`, for the site this client talks to. */
    info() { return SfdDj.info(this.origin, this.doFetch); }
    /** The same as `SfdDj.plans()`, for the site this client talks to. */
    plans() { return SfdDj.plans(this.origin, this.doFetch); }
    // ---- who
    me() { return this.call('GET', '/me'); }
    user(id) { return this.call('GET', `/users/${id}`); }
    /** The characters this account may wear, lowest level first, with the pictures of each. */
    characters() { return this.call('GET', '/characters'); }
    // ---- rooms
    rooms() { return this.call('GET', '/rooms'); }
    room(slug) { return this.call('GET', `/rooms/${slug}`); }
    members(slug) { return this.call('GET', `/rooms/${slug}/members`); }
    /** A bot shows in the room while it keeps calling this (the lease lasts 90 seconds: call it every 30). Bot accounts only. */
    join(slug) { return this.call('POST', `/rooms/${slug}/presence`); }
    /** A bot leaves the room's visual crowd. */
    leave(slug) { return this.call('DELETE', `/rooms/${slug}/presence`); }
    // ---- chat
    /** Latest messages, or with `after` only the ones newer than that message id (oldest first). */
    messages(slug, opts = {}) { return this.call('GET', `/rooms/${slug}/messages`, undefined, opts); }
    /** Say something in the room's chat (max 300 characters). */
    say(slug, body, opts = {}) { return this.call('POST', `/rooms/${slug}/messages`, { body, reply_to_id: opts.replyTo }); }
    deleteMessage(slug, messageId) { return this.call('DELETE', `/rooms/${slug}/messages/${messageId}`); }
    clearChat(slug) { return this.call('DELETE', `/rooms/${slug}/messages`); }
    /** A highlighted system announcement in chat. */
    announce(slug, message) { return this.call('POST', `/rooms/${slug}/announce`, { message }); }
    // ---- music
    /** Add a song by link (YouTube, SoundCloud, Spotify) or YouTube video id. */
    addSong(slug, song) { return this.call('POST', `/rooms/${slug}/queue`, 'url' in song ? { url: song.url } : { video_id: song.videoId }); }
    /** Put up to 50 songs of one of your playlists into the room's waitlist. */
    queuePlaylist(slug, playlistId) { return this.call('POST', `/rooms/${slug}/queue-playlist`, { playlist_id: playlistId }); }
    removeSong(slug, itemId) { return this.call('DELETE', `/rooms/${slug}/queue/${itemId}`); }
    leaveWaitlist(slug) { return this.call('DELETE', `/rooms/${slug}/waitlist`); }
    setWaitlist(slug, settings) { return this.call('PATCH', `/rooms/${slug}/waitlist-settings`, settings); }
    skip(slug, itemId) { return this.call('POST', `/rooms/${slug}/skip`, { item_id: itemId }); }
    vote(slug, type) { return this.call('POST', `/rooms/${slug}/vote`, { type }); }
    /** Grab the song that is playing into one of your playlists, or into a new one with that name. */
    grab(slug, into) { return this.call('POST', `/rooms/${slug}/vote`, { type: 'grab', ...('playlistId' in into ? { playlist_id: into.playlistId } : { new_playlist: into.newPlaylist }) }); }
    searchYoutube(q) { return this.call('GET', '/youtube/search', undefined, { q }); }
    // ---- your playlists (the limit of your subscription applies: `me().limits.playlists`)
    playlists() { return this.call('GET', '/playlists'); }
    /** The songs of one of your playlists, in play order. */
    playlist(id) { return this.call('GET', `/playlists/${id}`); }
    createPlaylist(name) { return this.call('POST', '/playlists', { name }); }
    renamePlaylist(id, name) { return this.call('PATCH', `/playlists/${id}`, { name }); }
    deletePlaylist(id) { return this.call('DELETE', `/playlists/${id}`); }
    /** Make it the playlist you play from. */
    activatePlaylist(id) { return this.call('POST', `/playlists/${id}/activate`); }
    /** Add a song by link (YouTube, SoundCloud, Spotify) or YouTube video id. */
    addToPlaylist(id, song) { return this.call('POST', `/playlists/${id}/songs`, 'url' in song ? { url: song.url } : { video_id: song.videoId }); }
    /** Add many links at once, one per line. */
    importToPlaylist(id, text) { return this.call('POST', `/playlists/${id}/import`, { text }); }
    removeFromPlaylist(id, songId) { return this.call('DELETE', `/playlists/${id}/songs/${songId}`); }
    /** Save an order: the ids of all the songs, first song first (see `playlist(id)`). */
    orderPlaylist(id, songIds) { return this.call('PUT', `/playlists/${id}/order`, { ids: songIds }); }
    shufflePlaylist(id) { return this.call('POST', `/playlists/${id}/shuffle`); }
    // ---- moderation (needs the matching room role)
    kick(slug, userId) { return this.call('POST', `/rooms/${slug}/kick/${userId}`); }
    ban(slug, userId) { return this.call('POST', `/rooms/${slug}/ban/${userId}`); }
    unban(slug, userId) { return this.call('DELETE', `/rooms/${slug}/ban/${userId}`); }
    mute(slug, userId, length = '10m') { return this.call('POST', `/rooms/${slug}/mute/${userId}`, { for: length }); }
    unmute(slug, userId) { return this.call('DELETE', `/rooms/${slug}/mute/${userId}`); }
    /** Give someone a room role (id from `members()`), or `null` to take it away. */
    setRole(slug, userId, roleId) { return this.call('PUT', `/rooms/${slug}/members/${userId}`, { room_role_id: roleId }); }
    // ---- whispers
    whispers() { return this.call('GET', '/whispers'); }
    whisperThread(userId) { return this.call('GET', `/whispers/${userId}`); }
    whisper(to, body) { return this.call('POST', '/whispers', { ...('userId' in to ? { user_id: to.userId } : { username: to.username }), body }); }
    /** A bot that watches one room: `client.bot('my-room').on('message', ...).start()`. */
    bot(slug, opts) { return new Bot(this, slug, opts); }
}
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/**
 * Polls a room and turns what happens into events. Simple and dependency free;
 * it makes about 30 requests a minute, well inside the rate limit.
 */
export class Bot {
    constructor(client, slug, opts = {}) {
        this.client = client;
        this.slug = slug;
        this.handlers = {};
        this.commands = new Map();
        this.cooldowns = new Map();
        this.timer = null;
        this.beat = null;
        this.running = false;
        this.lastId = 0;
        this.lastVotes = '';
        this.meId = 0;
        this.tick = 0;
        this.failures = 0;
        this.pollMs = Math.max(1000, opts.pollMs ?? 2000);
        this.prefix = opts.prefix ?? '!';
        this.presence = opts.presence;
    }
    on(event, handler) {
        var _a;
        ((_a = this.handlers)[event] ?? (_a[event] = [])).push(handler);
        return this;
    }
    /**
     * `bot.command('ping', (m) => bot.say('pong'))` answers messages that start with `!ping`.
     * `cooldownMs` makes the bot ignore the same command from the same person for that long.
     */
    command(name, handler, opts = {}) {
        this.commands.set(name.replace(/^[!/]/, '').toLowerCase(), { handler, cooldownMs: opts.cooldownMs ?? 0 });
        return this;
    }
    say(text, opts) { return this.client.say(this.slug, text, opts); }
    /** Answer one message, as a reply to it. */
    reply(message, text) { return this.say(text, { replyTo: message.id }); }
    emit(event, ...args) {
        for (const h of this.handlers[event] ?? [])
            h(...args);
    }
    /** Starts watching. Old messages are skipped: the bot only reacts to what is said from now on. */
    async start() {
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
            this.beat = setInterval(() => this.client.join(this.slug).catch((e) => this.emit('error', e)), 30000);
        }
        this.schedule();
        return this;
    }
    /** Stops watching and, if the bot was shown in the room, leaves it. */
    async stop() {
        this.running = false;
        if (this.timer)
            clearTimeout(this.timer);
        if (this.beat)
            clearInterval(this.beat);
        const wasThere = this.beat !== null;
        this.timer = this.beat = null;
        if (wasThere)
            await this.client.leave(this.slug).catch(() => undefined);
    }
    schedule() {
        // after failures in a row wait longer: 2 s, 4 s, 8 s ... at most 30 s
        this.timer = setTimeout(() => this.poll(), Math.min(30000, this.pollMs * 2 ** this.failures));
    }
    async poll() {
        try {
            const hit = new RegExp(`^${escapeRegExp(this.prefix)}(\\w+)\\s*(.*)$`);
            for (const m of await this.client.messages(this.slug, { after: this.lastId })) {
                this.lastId = Math.max(this.lastId, m.id);
                if (m.type !== 'user' || m.user_id === this.meId)
                    continue;
                this.emit('message', m);
                const found = hit.exec(m.body);
                const name = found?.[1].toLowerCase() ?? '';
                const command = found && this.commands.get(name);
                if (!command)
                    continue;
                const key = `${name}:${m.user_id}`;
                if (command.cooldownMs && Date.now() < (this.cooldowns.get(key) ?? 0))
                    continue;
                if (command.cooldownMs)
                    this.cooldowns.set(key, Date.now() + command.cooldownMs);
                await command.handler(m, found[2] ? found[2].split(/\s+/) : []);
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
                }
                else if (votes !== this.lastVotes) {
                    this.lastVotes = votes;
                    this.emit('votes', room.playback.votes, room);
                }
            }
            this.failures = 0;
        }
        catch (e) {
            this.failures = Math.min(this.failures + 1, 4);
            this.emit('error', e);
        }
        if (this.running)
            this.schedule();
    }
}
