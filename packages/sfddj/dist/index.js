/**
 * sfddj: the official JavaScript client for the SFD.DJ API.
 * Works in Node 18+, Deno, Bun and browsers (browser extensions): it only needs `fetch`. No dependencies.
 */
const FALLBACK = { 401: 'Bad or missing token.', 403: 'Not allowed: the account lacks the permission or room role for this.', 404: 'Not found.', 429: 'Too many requests, slow down.' };
/** Thrown for every answer that is not a success. `status` is the HTTP status, `errors` the field errors of a 422. */
export class SfdDjError extends Error {
    constructor(message, status, errors) {
        super(message);
        this.status = status;
        this.errors = errors;
        this.name = 'SfdDjError';
    }
}
export class SfdDj {
    constructor(options) {
        if (!options?.token)
            throw new Error('sfddj: a token is required (Settings → Developers on SFD.DJ).');
        this.token = options.token;
        if (!options.baseUrl)
            throw new Error('sfddj: baseUrl is required, e.g. https://sfd.example.com');
        this.base = options.baseUrl.replace(/\/+$/, '') + '/api/v1';
        this.doFetch = options.fetch ?? ((...args) => fetch(...args));
    }
    async call(method, path, body, query) {
        const qs = query ? Object.entries(query).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&') : '';
        const res = await this.doFetch(`${this.base}${path}${qs ? `?${qs}` : ''}`, {
            method,
            headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (res.status === 204)
            return undefined;
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            const errors = json.errors;
            throw new SfdDjError((errors && Object.values(errors)[0]?.[0]) || json.message || FALLBACK[res.status] || `Request failed (${res.status})`, res.status, errors);
        }
        return json;
    }
    // ---- who
    me() { return this.call('GET', '/me'); }
    user(id) { return this.call('GET', `/users/${id}`); }
    // ---- rooms
    rooms() { return this.call('GET', '/rooms'); }
    room(slug) { return this.call('GET', `/rooms/${slug}`); }
    members(slug) { return this.call('GET', `/rooms/${slug}/members`); }
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
    removeSong(slug, itemId) { return this.call('DELETE', `/rooms/${slug}/queue/${itemId}`); }
    leaveWaitlist(slug) { return this.call('DELETE', `/rooms/${slug}/waitlist`); }
    setWaitlist(slug, settings) { return this.call('PATCH', `/rooms/${slug}/waitlist-settings`, settings); }
    skip(slug, itemId) { return this.call('POST', `/rooms/${slug}/skip`, { item_id: itemId }); }
    vote(slug, type) { return this.call('POST', `/rooms/${slug}/vote`, { type }); }
    searchYoutube(q) { return this.call('GET', '/youtube/search', undefined, { q }); }
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
        this.timer = null;
        this.lastId = 0;
        this.meId = 0;
        this.tick = 0;
        this.pollMs = Math.max(1000, opts.pollMs ?? 2000);
    }
    on(event, handler) {
        var _a;
        ((_a = this.handlers)[event] ?? (_a[event] = [])).push(handler);
        return this;
    }
    /** `bot.command('ping', (m) => bot.say('pong'))` answers messages that start with `!ping`. */
    command(name, handler) {
        this.commands.set(name.replace(/^!/, '').toLowerCase(), handler);
        return this;
    }
    say(text, opts) { return this.client.say(this.slug, text, opts); }
    emit(event, ...args) {
        for (const h of this.handlers[event] ?? [])
            h(...args);
    }
    /** Starts watching. Old messages are skipped: the bot only reacts to what is said from now on. */
    async start() {
        this.meId = (await this.client.me()).id;
        const latest = await this.client.messages(this.slug, { limit: 1 });
        this.lastId = latest[0]?.id ?? 0;
        this.lastSong = (await this.client.room(this.slug)).playback.current?.id ?? null;
        this.schedule();
        return this;
    }
    stop() {
        if (this.timer)
            clearTimeout(this.timer);
        this.timer = null;
    }
    schedule() {
        this.timer = setTimeout(() => this.poll(), this.pollMs);
    }
    async poll() {
        try {
            for (const m of await this.client.messages(this.slug, { after: this.lastId })) {
                this.lastId = Math.max(this.lastId, m.id);
                if (m.type !== 'user' || m.user_id === this.meId)
                    continue;
                this.emit('message', m);
                const hit = /^!(\w+)\s*(.*)$/.exec(m.body);
                const handler = hit && this.commands.get(hit[1].toLowerCase());
                if (handler)
                    await handler(m, hit[2] ? hit[2].split(/\s+/) : []);
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
        }
        catch (e) {
            this.emit('error', e);
        }
        if (this.timer)
            this.schedule();
    }
}
