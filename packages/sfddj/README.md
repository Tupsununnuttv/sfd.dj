# sfddj

The official JavaScript / TypeScript client for the **SFD-DJ.EU** API. Build room bots, browser extensions and tools.
No dependencies. Works in Node 18+, Deno, Bun and in the browser (it only needs `fetch`).

```sh
npm install sfddj
```

## Get a token

1. Log in to SFD-DJ.EU and open **Settings → Developers**.
2. For a bot: **Create bot**, then copy its token (it is shown once). For your own scripts or extension: **New token** under *My personal tokens*.
3. Never publish a token. A bot token acts as the bot, a personal token acts as *you*.

A bot is its own account. It can chat in any public room straight away; to let it moderate or manage the queue, give it a
role in your room (**Room settings → Roles**). It can never do more than that role allows.

## A room bot in ten lines

```js
import { SfdDj } from 'sfddj';

const sfd = new SfdDj({ token: process.env.SFDDJ_TOKEN }); // talks to https://sfd-dj.eu; pass baseUrl for another copy of the site
const room = 'my-room-slug';

const bot = sfd.bot(room)
    .command('ping', () => bot.say('pong!'))
    .command('skip', async (m) => {
        const { playback } = await sfd.room(room);
        if (playback.current) await sfd.skip(room, playback.current.id); // needs the Skip permission
    })
    .on('songChange', (song) => song && bot.say(`Now playing: ${song.title} (added by ${song.added_by})`))
    .on('error', console.error);

await bot.start();
```

## Using the client directly

```js
const me = await sfd.me();
const rooms = await sfd.rooms();
const state = await sfd.room('my-room-slug');        // settings, playback, waitlist, what you may do here
await sfd.say('my-room-slug', 'Hello from the API');
await sfd.addSong('my-room-slug', { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
await sfd.vote('my-room-slug', 'woot');
await sfd.mute('my-room-slug', 42, '1h');            // moderation needs the matching room role
```

Errors are `SfdDjError` with `status` (HTTP status) and `errors` (field errors for a 422).

## Methods

| Area | Methods |
| --- | --- |
| Who | `me()`, `user(id)` |
| Rooms | `rooms()`, `room(slug)`, `members(slug)` |
| Chat | `messages(slug, {after, limit})`, `say(slug, text, {replyTo})`, `deleteMessage`, `clearChat`, `announce` |
| Music | `addSong(slug, {url} or {videoId})`, `removeSong`, `leaveWaitlist`, `setWaitlist({locked, cycle})`, `skip`, `vote('woot' / 'meh' / 'grab')`, `searchYoutube(q)` |
| Moderation | `kick`, `ban`, `unban`, `mute(slug, userId, '10m' / '1h' / '24h' / 'forever')`, `unmute`, `setRole(slug, userId, roleId or null)` |
| Whispers | `whispers()`, `whisperThread(userId)`, `whisper({userId} or {username}, text)` |
| Bot | `sfd.bot(slug).on('message' / 'songChange' / 'error').command(name, handler).start() / stop()` |

## Limits

* 120 requests a minute per token; chat 60 a minute; whispers 30 a minute.
* The `Bot` helper polls (about 30 requests a minute), so events arrive within a couple of seconds.
* The API is versioned (`/api/v1`). Breaking changes will go to `/api/v2`.

The plain HTTP API is documented under **Docs → Developers** on your SFD-DJ.EU site if you would rather use another language.

MIT licensed.
