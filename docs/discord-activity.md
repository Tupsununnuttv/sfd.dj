# Discord Activity: room-only guest view

The Activity opens the public **SFD.DJ** room directly (slug `sfddj`). It skips the website homepage, dashboard and old room catalogue. The initial entry renders the room in place with HTTP 200 instead of redirecting the Discord proxy back into itself. The room scene, current playback, chat history, waitlist and public participant list stay inside the Discord iframe.

The website sidebar, account links, DJ controls and general website footbar are hidden in this view. Volume/mute, pause/resume, room info and a small **Change room** back arrow remain. Change room opens a compact public-room picker whose links stay inside Discord.

## Guest behavior and entry

- `DISCORD_ACTIVITY_ROOM=sfddj` selects the room slug; this is also the default in `config/discord-activity.php`. Leaving the variable blank opens the public-room picker. A missing/private configured room falls back to the picker and never reveals a private room.
- Activity entries at `/`, `/discord` and `/dashboard` render the configured public room directly with HTTP 200. The initial URL and SDK launch parameters remain intact. Exact `/discord` is recognized as Activity context even without a context cookie or launch query. `/discord/rooms` always shows the public-room picker.
- Activity requests use a dedicated request guard that always returns no user. Even an existing signed-in website session receives guest data and no account or moderation permissions. Legacy website login validation is skipped in Activity context, so a stale login cannot send the guest view to the blocked login page or invalidate the website session. The original guard is restored after each request; the website session is never logged out or deleted.
- Canonical redirects from an old room slug remain relative inside the Activity and preserve SDK/overlay query parameters. Normal website room redirects retain their previous behavior.
- Activity write requests and account/OAuth routes return 403. Existing guest watcher heartbeat/leave calls remain permitted. Account-scoped v1 API access is blocked in the Activity. Private rooms retain the normal server access checks.
- Guests can watch/read; they cannot send chat, react, vote, DJ, sign in or register inside this Activity. Normal website users keep their existing behavior outside the Activity.

## SDK, cookies and transport

`DiscordActivityCookies` sets a Secure, HttpOnly, SameSite=None, Partitioned context marker for navigation and refreshes. It controls display/transport only, never room entitlements. Internal URLs use the configured app's proxy origin during the request; normal URL/session configuration is restored afterward. Activity responses use `Cache-Control: private, no-store` so an edge cache cannot reuse session-bearing room pages across visitors.

`DiscordActivityBridge` awaits one shared `ready()` handshake. Only SDK launch parameters are retained in sessionStorage to reconnect after a refresh; no OAuth tokens are stored. The root build paths remain relative to the proxy. Frame headers allow Discord and `*.discordsays.com`; normal website pages keep their own frame protections.

Room snapshots refresh over existing permission-checked HTTP routes every five seconds, roster every 15 seconds, and the existing guest heartbeat retains a stable anonymous alias. The Activity uses a null Echo connector; the ordinary website keeps its websocket transport. Provider resources use the SDK URL mappings and external links use `openExternalLink`.

No Activity client secret or separate Node `server.js` is needed for this guest view. Keep `DISCORD_ACTIVITY_CLIENT_ID=1563979983582535841` and `APP_URL=https://sfd-dj.eu`. Existing website OAuth variables remain unchanged.

## Public access: verification, Discovery and launch command

Working iframe code does not make an Activity public. Discord restricts an **Unverified Activity** to its developers, development team and invited app testers, in servers with fewer than 25 members. **Verified Activities** can be used by all Discord users and in servers of any size. These are Discord platform restrictions, not room permissions. [Discord's verified/unverified Activity requirements](https://support-dev.discord.com/hc/en-us/articles/26576097154199-What-are-Verified-and-Unverified-Activities).

For general App Launcher search, the owner must complete app/team-owner identity verification, then meet the Portal's requirements and enable **Discovery**. Setting a bot's **Public Bot** flag alone does not complete Activity verification or Discovery. Code, the Embedded App SDK and Laravel Cloud headers cannot bypass the owner's identity or app review steps. The authenticated Portal is the authority for this application's current eligibility; this session has no available Portal browser and has not verified or changed its distribution status. [Discord's verification and Discovery steps](https://docs.discord.com/developers/discovery/enabling-discovery).

Keep **Enable Activities** on and confirm the supported platforms. Enabling Activities normally creates a default **Launch** Entry Point command automatically. If launching is missing, inspect the existing global Entry Point configuration before creating or replacing commands: the default is command type `PRIMARY_ENTRY_POINT` (`4`) with handler `DISCORD_LAUNCH_ACTIVITY` (`2`). [Discord's default Entry Point guide](https://docs.discord.com/developers/activities/building-an-activity#default-entry-point-command).

## Discord Developer Portal: URL Mappings

For the current no-audio investigation and Estonian setup steps, see [Discord Activity audio](discord-activity-audio-et.md). On 2026-10-27 the deployed room entry passed origin/proxy HTTP checks, while both provider API paths below still returned HTML 404 responses. Player mappings must work before actual playback can be tested.

In application **1563979983582535841**, keep Activities enabled. In **Activities > URL Mappings > Root Mapping**, keep the single root mapping:

| Prefix | Target |
| - | - |
| `/` | `sfd-dj.eu` |

On the same page, add these exact mappings under **Proxy Path Mappings** for provider scripts, players and artwork. Do not replace Root Mapping with a provider target. The source of truth is `config/discord-activity.php`; the same public mapping list is sent to the frontend.

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

The audio correction creates the mapped YouTube iframe explicitly and passes only the proxy origin as the player API `host`. A host containing the `/_discord/youtube` path fails the API's `postMessage` origin checks. The room also exposes **Enable sound**, provider error messages and **Retry playback** to rebuild a failed player. These changes still require the Proxy Path Mappings above and real-client playback validation.

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

   The default check must inspect both the origin and the actual `1563979983582535841.discordsays.com` proxy. A passing origin-only check cannot rule out a proxy redirect failure. It checks direct HTTP-200 room entry, the room picker, cookies, guest context, CSP, SDK settings and build paths. For a local backend use the checker's `--origin-only` option; that deliberately does not validate the deployed Discord proxy. Neither HTTP mode can prove the real SDK or media handshake.
5. Fully close the old Discord Activity and relaunch it to load the new frontend. Verify direct entry to the SFD.DJ room as a guest, then refresh that room and test sound.

A separate `activities.sfd-dj.eu` is optional. Add it to the same Cloud environment, configure the DNS record Cloud supplies, wait for HTTPS verification, and change only Discord's root mapping target to that host. Keep APP_URL pointing at the full website. The existing sfd-dj.eu host already supports the flow without a new subdomain.

## Verification

### Live findings before deployment of these fixes — 2026-10-26

The origin-side checks passed while the real Discord proxy's initial root URL, with launch parameters, returned **HTTP 520** and the error response had `X-Frame-Options: SAMEORIGIN`. The proxy's `/rooms/sfddj` URL with `frame_id` returned **200 Room**, and `/discord/rooms` returned **200 Activity**. This isolates a failure at the initial entry/redirect path; direct-200 entry removes that redirect from the local code. These live results describe the existing deployment, not a successful deployment of this workspace.

The real proxy paths `/_discord/youtube/iframe_api` and `/_discord/soundcloud/player/api.js` returned **Laravel 404**. Provider mappings are therefore missing or not taking effect for those requests; the corresponding Portal configuration must be checked. No authenticated Portal browser is available in this session. The mappings, verification status and Discovery settings have not been changed here. Actual provider playback is still unverified.

### Focused local coverage

Twelve focused Laravel tests cover direct HTTP-200 entry at root, `/discord` and `/dashboard`, exact `/discord` without cookies, safe relative renamed-room redirects with SDK parameters, forced guest mode even for a logged-in owner, stale website-session isolation, unchanged normal stale-session rejection, private-room denial, blocked write/login/token/API actions, normal website session preservation, guest heartbeats, the public-room fallback and unchanged ordinary homepage behavior.

An isolated Chromium test exercises the production bundle in a stand-in Discord parent: direct room entry, no sidebar/account/DJ controls, rejected message submission, guest heartbeat and HTTP snapshots, changing rooms inside the same iframe, mobile sizing and SDK reconnection after refresh. Provider scripts/iframes are stand-ins; real provider sound and the real Discord client remain unverified.

The 2026-10-27 audio checks also cover provider-script 404 detection, retrying both players, track error feedback, an explicit sound-enabling click including restoration from zero volume, and ignoring errors/autoplay events from an inactive YouTube player. A separate test uses the actual RoomPlayer source and official YouTube loader/widget API with a protocol stand-in for the provider iframe: the mapped embed URL is preserved, the API accepts `onReady`, and volume/current-position playback commands reach that iframe. These checks do not prove streaming or audio decoding in Discord. Production frontend build and TypeScript checks pass.

The complete test archive remains unavailable after the earlier archive incident. Focused test sources and captures are kept separately outside the project and do not replace that archive. The website's `tests`, `tmp` and `test-results` directories remain absent after verification.

References: [Discord networking](https://docs.discord.com/developers/activities/development-guides/networking), [SDK](https://github.com/discord/embedded-app-sdk), [Cloud frame header settings](https://laravel.com/cloud/docs/network#x-frame-options), [Cloud deployments](https://laravel.com/cloud/docs/deployments).
