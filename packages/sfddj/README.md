# sfddj

The official JavaScript / TypeScript client for the **SFD-DJ.EU** API. Build room bots, browser extensions and tools.
No dependencies. Works in Node 18+, Deno, Bun and in the browser (it only needs `fetch`).

```sh
npm install sfddj
```

## Where the API lives

The live site answers on `https://sfd-dj.eu/api/v1`. The client adds `/api/v1` itself, so give it the site: without `baseUrl` it talks to `https://sfd-dj.eu`, and for a copy of the site on your own computer pass its address, `new SfdDj({ token, baseUrl: 'http://localhost:8000' })`.

## Get a token

1. Log in to SFD-DJ.EU and open **Settings → Developers**.
2. For a bot: **Create bot**, then copy its token (it is shown once). For your own scripts or extension: **New token** under *My personal tokens*.
3. Never publish a token. A bot token acts as the bot, a personal token acts as *you*.

A bot is its own account. It can chat in any public room straight away; to let it moderate or manage the queue, give it a
role in your room (**Room settings → Roles**). It can never do more than that role allows.

## A room bot in a few lines

```js
import { SfdDj } from 'sfddj';

const sfd = new SfdDj({ token: process.env.SFDDJ_TOKEN });
const room = 'my-room-slug';

const bot = sfd.bot(room)
    .command('ping', (m) => bot.reply(m, 'pong!'), { cooldownMs: 3000 }) // once every 3 seconds per person
    .command('skip', async () => {
        const { playback } = await sfd.room(room);
        if (playback.current) await sfd.skip(room, playback.current.id); // needs the Skip permission
    })
    .on('songChange', (song) => song && bot.say(`Now playing: ${song.title} (added by ${song.added_by})`))
    .on('votes', (votes) => console.log(`woot ${votes.woot} · meh ${votes.meh} · grab ${votes.grab}`))
    .on('error', console.error);

await bot.start();   // a bot account also shows in the room and leaves it again on bot.stop()
```

Options: `sfd.bot(room, { pollMs: 2000, prefix: '!', presence: true })`.

## Using the client directly

```js
const me = await sfd.me();                           // who you are, your plan, your limits and your SFD Coins
const rooms = await sfd.rooms();
const state = await sfd.room('my-room-slug');        // settings, playback, waitlist, what you may do here
await sfd.say('my-room-slug', 'Hello from the API');
await sfd.addSong('my-room-slug', { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
await sfd.vote('my-room-slug', 'woot');
await sfd.grab('my-room-slug', { newPlaylist: 'Keepers' });
await sfd.mute('my-room-slug', 42, '1h');            // moderation needs the matching room role
```

### Playlists

Your playlists, with the same rules as the Playlists page: up to `me.limits.playlists` of them (100 for everybody, more with a subscription).

```js
const { id } = await sfd.createPlaylist('Warm up');
await sfd.addToPlaylist(id, { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
await sfd.importToPlaylist(id, 'https://youtu.be/aaaaaaaaaaa\nhttps://youtu.be/bbbbbbbbbbb');
const songs = await sfd.playlist(id);                // in play order
await sfd.orderPlaylist(id, songs.map((s) => s.id).reverse());
await sfd.activatePlaylist(id);                      // the one you play from
await sfd.queuePlaylist('my-room-slug', id);         // up to 50 songs into a room's waitlist
```

### Characters and plans

```js
const characters = await sfd.characters();           // what you may wear: level, price, owned, and the standing / dancing / djing pictures
const { free, plans } = await sfd.plans();           // Bronze, Silver, Gold, Plus, Pro, Premium: prices in euro cents, XP, limits
const online = await SfdDj.info('http://localhost:8000'); // no token needed: the version, the server time and the limits
```

## Errors, retries and time-outs

Every failure is an `SfdDjError` with `status` (the HTTP status, `0` when the site did not answer), `errors` (field errors of a 422) and `retryAfter` (seconds, when the site asked you to wait).

The client tries again by itself: when the site says slow down (`429`, after the `Retry-After` it sent), and, for requests that change nothing when repeated (reads, `PUT`, `DELETE`), after a `502`, `503`, `504` or a dropped connection. A chat message or a vote is never sent twice. Set `retries` (default `2`) and `timeoutMs` (default `15000`) to change this:

```js
new SfdDj({ token, retries: 0, timeoutMs: 5000 });
```

## TypeScript

The package ships its types (`Me`, `Room`, `Playback`, `ChatMessage`, `Playlist`, `PlaylistSong`, `Character`, `PlanInfo` ...).

## Methods

| Area | Methods |
| --- | --- |
| No token | `SfdDj.info(baseUrl?)`, `SfdDj.plans(baseUrl?)`, also `sfd.info()`, `sfd.plans()` |
| Who | `me()`, `user(id)`, `characters()` |
| Rooms | `rooms()`, `room(slug)`, `members(slug)`, `join(slug)` / `leave(slug)` (bot accounts: show in the room) |
| Chat | `messages(slug, {after, limit})`, `say(slug, text, {replyTo})`, `deleteMessage`, `clearChat`, `announce` |
| Music | `addSong(slug, {url} or {videoId})`, `queuePlaylist(slug, playlistId)`, `removeSong`, `leaveWaitlist`, `setWaitlist({locked, cycle})`, `skip`, `vote('woot' / 'meh' / 'grab')`, `grab(slug, {playlistId} or {newPlaylist})`, `searchYoutube(q)` |
| Playlists | `playlists()`, `playlist(id)`, `createPlaylist`, `renamePlaylist`, `deletePlaylist`, `activatePlaylist`, `addToPlaylist`, `importToPlaylist`, `removeFromPlaylist`, `orderPlaylist`, `shufflePlaylist` |
| Moderation | `kick`, `ban`, `unban`, `mute(slug, userId, '10m' / '1h' / '24h' / 'forever')`, `unmute`, `setRole(slug, userId, roleId or null)` |
| Whispers | `whispers()`, `whisperThread(userId)`, `whisper({userId} or {username}, text)` |
| Bot | `sfd.bot(slug).on('message' / 'songChange' / 'votes' / 'error').command(name, handler, {cooldownMs}).start() / stop()`, `bot.say`, `bot.reply` |

## Limits

* 120 requests a minute per token; chat 60 a minute; whispers 30 a minute. The answers carry `X-RateLimit-Remaining`.
* The `Bot` helper polls (about 30 requests a minute), so events arrive within a couple of seconds, and it waits longer after failures in a row.
* The API is versioned (`/api/v1`). Changes inside v1 only add things; breaking changes will go to `/api/v2`.

The plain HTTP API is documented under **Docs → Developers** on SFD-DJ.EU if you would rather use another language.

## What is new in 1.1

* Playlists: `playlists()`, `createPlaylist()`, `addToPlaylist()`, `importToPlaylist()`, `orderPlaylist()`, `queuePlaylist()` and the rest.
* `characters()`, `plans()` and `SfdDj.info()`; `me()` now also tells your character, plan, limits and SFD Coins.
* `grab()`, `join()` and `leave()`.
* Retries, time-outs and `retryAfter` on errors.
* The bot shows itself in the room, has a `votes` event, command cooldowns, a custom prefix and `reply()`, and backs off after failures.

MIT licensed.
