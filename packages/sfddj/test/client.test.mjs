// Run with `npm test` (builds first). Uses the built-in test runner and a fake fetch: no network, no token.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SfdDj, SfdDjError, VERSION } from '../dist/index.js';

const json = (body, init = {}) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) }, ...init });

/** A fake fetch: `routes` maps "METHOD /path" to a function (or a list of them, used one after the other) that makes the answer. Every call is written down in `calls`. */
const fake = (routes) => {
    const calls = [];
    const fetchImpl = async (url, init = {}) => {
        const { pathname, search } = new URL(url);
        const key = `${init.method ?? 'GET'} ${pathname.replace(/^\/api\/v1/, '') || '/'}`;
        calls.push({ key, search, headers: init.headers, body: init.body, url });
        let route = routes[key];
        if (Array.isArray(route)) route = route.length > 1 ? route.shift() : route[0];
        if (!route) return json({ message: `no fake for ${key}` }, { status: 404 });

        return route(init);
    };

    return { fetchImpl, calls };
};

test('talks to the right address, with the token and the client header', async () => {
    const { fetchImpl, calls } = fake({ 'GET /me': () => json({ id: 7 }) });
    await new SfdDj({ token: 't0k', baseUrl: 'http://127.0.0.1:8000/', fetch: fetchImpl }).me();

    assert.equal(calls[0].url, 'http://127.0.0.1:8000/api/v1/me');
    assert.equal(calls[0].headers.Authorization, 'Bearer t0k');
    assert.equal(calls[0].headers['X-SFDDJ-Client'], `sfddj-js/${VERSION}`);
    assert.throws(() => new SfdDj({ token: '' }), /token is required/);
});

test('puts the query in the address and the body in JSON', async () => {
    const { fetchImpl, calls } = fake({
        'GET /rooms/lobby/messages': () => json([]),
        'POST /rooms/lobby/vote': () => new Response(null, { status: 204 }),
        'POST /playlists/3/songs': () => json({ added: 1, found: 1 }),
    });
    const sfd = new SfdDj({ token: 'x', fetch: fetchImpl });

    await sfd.messages('lobby', { after: 12, limit: 5 });
    assert.equal(calls[0].search, '?after=12&limit=5');

    assert.equal(await sfd.grab('lobby', { newPlaylist: 'Keepers' }), undefined);
    assert.deepEqual(JSON.parse(calls[1].body), { type: 'grab', new_playlist: 'Keepers' });

    assert.deepEqual(await sfd.addToPlaylist(3, { videoId: 'dQw4w9WgXcQ' }), { added: 1, found: 1 });
    assert.deepEqual(JSON.parse(calls[2].body), { video_id: 'dQw4w9WgXcQ' });
});

test('errors say what went wrong', async () => {
    const { fetchImpl } = fake({
        'POST /rooms/lobby/messages': () => json({ message: 'Invalid.', errors: { body: ['The body field is required.'] } }, { status: 422 }),
        'GET /rooms/nope': () => json({}, { status: 404 }),
        'GET /me': () => json({}, { status: 429, headers: { 'Retry-After': '9' } }),
    });
    const sfd = new SfdDj({ token: 'x', fetch: fetchImpl, retries: 0 });

    await assert.rejects(sfd.say('lobby', ''), (e) => e instanceof SfdDjError && e.status === 422 && e.message === 'The body field is required.' && e.errors.body.length === 1);
    await assert.rejects(sfd.room('nope'), (e) => e.status === 404 && e.message === 'Not found.');
    await assert.rejects(sfd.me(), (e) => e.status === 429 && e.retryAfter === 9);
});

test('tries again when the site says slow down, and after a 503 only when that is harmless', async () => {
    const slow = fake({ 'GET /me': [() => json({}, { status: 429, headers: { 'Retry-After': '0' } }), () => json({ id: 1 })] });
    assert.deepEqual(await new SfdDj({ token: 'x', fetch: slow.fetchImpl }).me(), { id: 1 });
    assert.equal(slow.calls.length, 2);

    const down = fake({ 'GET /rooms': [() => json({}, { status: 503, headers: { 'Retry-After': '0' } }), () => json([])] });
    assert.deepEqual(await new SfdDj({ token: 'x', fetch: down.fetchImpl }).rooms(), []);

    const post = fake({ 'POST /rooms/lobby/messages': () => json({}, { status: 503, headers: { 'Retry-After': '0' } }) });
    await assert.rejects(new SfdDj({ token: 'x', fetch: post.fetchImpl }).say('lobby', 'hi'), (e) => e.status === 503);
    assert.equal(post.calls.length, 1, 'a chat message is not sent twice');
});

test('a site that does not answer in time is an error with status 0', async () => {
    const hang = (url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'TimeoutError' }))));
    await assert.rejects(new SfdDj({ token: 'x', fetch: hang, timeoutMs: 30, retries: 0 }).me(), (e) => e instanceof SfdDjError && e.status === 0 && /in time/.test(e.message));
});

test('the front door and the price list need no token', async () => {
    const { fetchImpl, calls } = fake({
        'GET /': () => json({ name: 'SFD-DJ.EU API', version: 'v1' }),
        'GET /plans': () => json({ free: { playlists: 100 }, plans: [{ key: 'plus', month: 299 }] }),
    });

    assert.equal((await SfdDj.info('http://localhost:8000', fetchImpl)).version, 'v1');
    assert.equal((await SfdDj.plans('http://localhost:8000/', fetchImpl)).plans[0].month, 299);
    assert.equal(calls[0].headers.Authorization, undefined);
    assert.equal(calls[1].url, 'http://localhost:8000/api/v1/plans');
});

test('a bot answers commands once per cooldown, shows itself in the room and leaves when stopped', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
    const flush = () => new Promise((done) => setImmediate(done));
    const room = { slug: 'lobby', playback: { current: null, votes: { woot: 0, meh: 0, grab: 0 } } };
    const said = [];
    const asked = (id, body) => ({ id, type: 'user', user_id: 2, body });
    const { fetchImpl, calls } = fake({
        'GET /me': () => json({ id: 1, is_bot: true }),
        'GET /rooms/lobby': () => json(room),
        'POST /rooms/lobby/presence': () => json({ online: true, expires_in: 90 }),
        'DELETE /rooms/lobby/presence': () => new Response(null, { status: 204 }),
        'POST /rooms/lobby/messages': (init) => { said.push(JSON.parse(init.body).body); return new Response(null, { status: 204 }); },
        'GET /rooms/lobby/messages': [
            () => json([{ id: 5, type: 'user', user_id: 2, body: 'old' }]), // start(): the latest message is skipped
            () => json([asked(6, '!ping'), asked(7, '!ping again'), asked(8, 'hello')]),
        ],
    });

    const bot = new SfdDj({ token: 'x', fetch: fetchImpl }).bot('lobby', { pollMs: 1000 });
    const heard = [];
    bot.on('message', (m) => heard.push(m.body));
    bot.command('ping', (m) => bot.reply(m, 'pong'), { cooldownMs: 5000 });

    await bot.start();
    assert.ok(calls.some((c) => c.key === 'POST /rooms/lobby/presence'), 'a bot account shows in the room');

    t.mock.timers.tick(1000);
    await flush();
    await flush();
    assert.deepEqual(heard, ['!ping', '!ping again', 'hello']);
    assert.deepEqual(said, ['pong'], 'the second !ping within the cooldown is ignored');

    await bot.stop();
    assert.ok(calls.some((c) => c.key === 'DELETE /rooms/lobby/presence'));
});
