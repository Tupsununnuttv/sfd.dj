# Discord Activity: room-only guest view

The Activity opens the public **SFD.DJ** room directly (`/rooms/sfddj`). It skips the website homepage, dashboard and old room catalogue. The room scene, current playback, chat history, waitlist and public participant list stay inside the Discord iframe.

The website sidebar, account links, DJ controls and general website footbar are hidden in this view. Volume/mute, pause/resume, room info and a small **Change room** back arrow remain. Change room opens a compact public-room picker whose links stay inside Discord.

## Guest behavior and entry

- `DISCORD_ACTIVITY_ROOM=sfddj` selects the room slug; this is also the default in `config/discord-activity.php`. Leaving the variable blank opens the public-room picker. A missing/private configured room falls back to the picker and never reveals a private room.
- The initial root or `/discord` request redirects to the configured public room and preserves Discord's SDK launch query parameters. `/discord/rooms` always shows the public-room picker. An old `/dashboard` link inside Activity returns to the room entry.
- Activity requests use a dedicated request guard that always returns no user. Even an existing signed-in website session receives guest data and no account or moderation permissions. The original guard is restored after each request; the website session is never logged out or deleted.
- Activity write requests and account/OAuth routes return 403. Existing guest watcher heartbeat/leave calls remain permitted. Account-scoped v1 API access is blocked in the Activity. Private rooms retain the normal server access checks.
- Guests can watch/read; they cannot send chat, react, vote, DJ, sign in or register inside this Activity. Normal website users keep their existing behavior outside the Activity.

## SDK, cookies and transport

`DiscordActivityCookies` sets a Secure, HttpOnly, SameSite=None, Partitioned context marker for navigation and refreshes. It controls display/transport only, never room entitlements. Internal URLs use the configured app's proxy origin during the request; normal URL/session configuration is restored afterward.

`DiscordActivityBridge` awaits one shared `ready()` handshake. Only SDK launch parameters are retained in sessionStorage to reconnect after a refresh; no OAuth tokens are stored. The root build paths remain relative to the proxy. Frame headers allow Discord and `*.discordsays.com`; normal website pages keep their own frame protections.

Room snapshots refresh over existing permission-checked HTTP routes every five seconds, roster every 15 seconds, and the existing guest heartbeat retains a stable anonymous alias. The Activity uses a null Echo connector; the ordinary website keeps its websocket transport. Provider resources use the SDK URL mappings and external links use `openExternalLink`.

No Activity client secret or separate Node `server.js` is needed for this guest view. Keep `DISCORD_ACTIVITY_CLIENT_ID=1563979983582535841` and `APP_URL=https://sfd-dj.eu`. Existing website OAuth variables remain unchanged.

## Discord Developer Portal: URL Mappings

In application **1563979983582535841**, keep Activities enabled and keep the root mapping:

| Prefix | Target |
| - | - |
| `/` | `sfd-dj.eu` |

For provider scripts, players and artwork, add these exact mappings. The source of truth is `config/discord-activity.php`; the same public mapping list is sent to the frontend.

| Prefix | Target |
| - | - |
| `/_discord/youtube` | `www.youtube.com` |
| `/_discord/youtube-nocookie` | `www.youtube-nocookie.com` |
| `/_discord/ytimg/{subdomain}` | `{subdomain}.ytimg.com` |
| `/_discord/soundcloud` | `w.soundcloud.com` |
| `/_discord/sndcdn/{subdomain}` | `{subdomain}.sndcdn.com` |
| `/_discord/twitch` | `player.twitch.tv` |
| `/_discord/kick` | `player.kick.com` |
| `/_discord/discord-cdn` | `cdn.discordapp.com` |

Targets have no `https://` prefix. These are named subdomain substitutions, not literal asterisks. No arbitrary reverse-proxy endpoint is added to the Laravel server.

**Media validation limit:** these mappings prepare the requests made by this app and its player APIs. An external provider's nested document can use additional endpoints or reject a proxied embed. The application does not rewrite provider HTML, strip provider protections, download tracks or extract media URLs. Actual YouTube/SoundCloud/Twitch playback must be tested in the real Discord client after the mappings are configured; it has not been verified there. A provider-side restriction cannot be fixed by changing Laravel Cloud's X-Content-Type-Options. Browser autoplay may require a click to enable sound.

## Laravel Cloud

1. Set `DISCORD_ACTIVITY_ROOM=sfddj` in the production environment (also the code default). Then apply the changed source to the repository and branch connected to the existing Cloud application, then deploy the new commit. Clicking Deploy without updating that source cannot upload this local workspace. The workspace has no `.git` directory.
2. Keep **Edge network > Response rules > X-Frame-Options = Anywhere** (the option that removes the Cloud header), and **X-Content-Type-Options = nosniff**. The working iframe settings need no further change for the room-only view.
3. Keep existing Composer commands. Build frontend assets in Cloud with its production variables:

   ```sh
   npm ci
   npm run build
   ```

   Cache configuration during Cloud's build with the existing `php artisan optimize`/`config:cache` process. Never deploy `public/hot`, which points to a local development server.
4. Run the read-only HTTP check:

   ```sh
   node scripts/check-discord-activity.mjs https://sfd-dj.eu
   ```

   It follows the initial room redirect, checks the room picker and direct room URL with the same cookies, guest context, CSP, SDK settings and build paths. It cannot prove the real SDK or media handshake.
5. Fully close the old Discord Activity and relaunch it to load the new frontend. Verify direct entry to the SFD.DJ room as a guest, then refresh that room and test sound.

A separate `activities.sfd-dj.eu` is optional. Add it to the same Cloud environment, configure the DNS record Cloud supplies, wait for HTTPS verification, and change only Discord's root mapping target to that host. Keep APP_URL pointing at the full website. The existing sfd-dj.eu host already supports the flow without a new subdomain.

## Verification

Eight focused Laravel tests cover direct room entry with preserved SDK parameters, forced guest mode even for a logged-in owner, private-room denial, blocked write/login/token/API actions, normal website session preservation, guest heartbeats, the public-room fallback and unchanged ordinary homepage behavior.

An isolated Chromium test exercises the production bundle in a stand-in Discord parent: direct room entry, no sidebar/account/DJ controls, rejected message submission, guest heartbeat and HTTP snapshots, changing rooms inside the same iframe, mobile sizing and SDK reconnection after refresh. Provider scripts/iframes are stand-ins; real provider sound and the real Discord client remain unverified.

The complete test archive remains unavailable after the earlier archive incident. Focused test sources and captures are kept separately outside the project and do not replace that archive. The website's `tests`, `tmp` and `test-results` directories remain absent after verification.

References: [Discord networking](https://docs.discord.com/developers/activities/development-guides/networking), [SDK](https://github.com/discord/embedded-app-sdk), [Cloud frame header settings](https://laravel.com/cloud/docs/network#x-frame-options), [Cloud deployments](https://laravel.com/cloud/docs/deployments).
