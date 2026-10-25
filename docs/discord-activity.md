# Discord Activity

SFD-DJ.EU can run inside Discord as an Activity: a light page with the live rooms, a **Sign in with Discord** button for people whose Discord is already linked, and an **Open Full Website** button. It is the same Laravel app, database and accounts as the website; no second backend.

Rooms themselves do not play inside the Activity. A room needs YouTube, SoundCloud or Twitch players, a websocket and pictures from other addresses, and Discord's proxy only lets an Activity reach its own address (anything else is `blocked:csp`) unless each address has a URL mapping. So each room card has **Open room**, which opens the room on the full website through Discord's `openExternalLink`.

## How it works

- Discord opens the Activity at the root of the mapped address and adds `frame_id`, `instance_id` and `platform` to it. `SiteController::home` hands such a request to `DiscordActivityController::show`; `/discord` shows the same page for a plain browser tab (a preview: the SDK is not started there). The normal home page is untouched.
- `App\Support\DiscordActivity::request()` is the one place that says "this request is an Activity": the root or `/discord` with `frame_id`, and everything under `/discord/`. Only those requests differ from the rest of the site:
  - `AllowSameOriginFrames`: no `X-Frame-Options`, and `frame-ancestors 'self' https://discord.com https://*.discord.com https://*.discordsays.com` (the Activity is an iframe of the Discord client). Every other page keeps `SAMEORIGIN` / `frame-ancestors 'self'`.
  - `DiscordActivityCookies` (runs before the session starts) and `CheckDeviceBans`: the session, `XSRF-TOKEN` and `sfd_device` cookies are `SameSite=None; Secure; Partitioned`, as Discord's networking guide requires. The normal site keeps Lax cookies, and the two never share a cookie.
  - `Vite::createAssetPathsUsing` (AppServiceProvider): scripts and styles are root-relative (`/build/...`) instead of the site's absolute address, because the Activity's CSP only allows its own `<application id>.discordsays.com`. `app.blade.php` leaves out the Bunny font links there (system font).
- `resources/js/Pages/Discord/Activity.tsx` starts the SDK once (`new DiscordSDK(applicationId)`, `ready()` with a 15 second timeout, "Try again" on failure). The page is polled every 20 seconds (`router.reload`) instead of using Reverb/Pusher, which `app.tsx` skips inside an Activity.
- **Sign in** uses the official Activity flow: `commands.authorize` with the `identify` scope only, `POST /discord/token` with the code, the server exchanges it with the client secret, reads who the Discord user is, **revokes the Discord token at once** (it is never kept or sent to the browser) and signs in the SFD-DJ.EU account that has this `discord_id` (Settings > Connections). No account is created. Two-factor and unconfirmed-email accounts are told to use the full website. The route is throttled and keeps Laravel's CSRF check.
- **Open Full Website** and **Open room** call `discord.commands.openExternalLink({ url })`; outside Discord they are ordinary `target="_blank" rel="noopener noreferrer"` links. The addresses are built on the server from `APP_URL` (never from anything the browser sends).

## Settings

| Where | What |
| - | - |
| `.env` `DISCORD_ACTIVITY_CLIENT_ID` | The Application ID of the Discord app that has **Activities** turned on. Defaults to `1563979983582535841`. It is passed to the page by the server (it is public), so no rebuild is needed when it changes. |
| `.env` `DISCORD_ACTIVITY_CLIENT_SECRET` | The secret of **the same** Activity app, stored only on the server. Optional for the room list and SDK `ready()` handshake; required for the Sign in button. A secret from another app makes Discord answer `invalid_client`; sign-in then fails and `storage/logs` gets "Discord Activity sign-in: Discord refused the code" with the reason. The room list still works. |
| `.env` `APP_URL` | Where the two buttons lead (`https://sfd-dj.eu` live). |

The website login/bot keeps its existing `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`; Activity credentials are separate. Never put any client secret in a `VITE_` variable. The old `VITE_DISCORD_ACTIVITY_APP_ID` and `DISCORD_ACTIVITY_APP_ID` variables are unused.

The frontend starts the SDK only inside an iframe on a `*.discordsays.com` host with a nonempty `frame_id`. It reuses one SDK instance on retry and clears the readiness timer on completion. No second Discord SDK package or Node `server.js` is required: `@discord/embedded-app-sdk` handles Activities, and Laravel already supplies the backend/token endpoint.

## Discord Developer Portal (https://discord.com/developers/applications)

1. Open the app. **General Information > Application ID** is `DISCORD_ACTIVITY_CLIENT_ID`; **OAuth2 > Client Secret** is `DISCORD_ACTIVITY_CLIENT_SECRET` (the pair must come from this one app).
2. **Activities > Settings**: turn on **Enable Activities**. This creates the default "Launch" entry point.
3. **Activities > URL Mappings**:

   | PREFIX | TARGET |
   | - | - |
   | `/` | `sfd-dj.eu` |

   That is the only mapping the Activity page needs. Locally, the target is your tunnel host instead (see below). The page loads nothing from any other address. (If rooms are ever played inside the Activity, YouTube, SoundCloud, Twitch, the picture hosts and the websocket host each need their own mapping and `patchUrlMappings`.)
4. **OAuth2**: no redirect is needed for an Activity; keep to the `identify` scope. (The existing website login keeps its own redirects.)
5. **Installation**: turn on Guild Install (scope `applications.commands`) and use the install link to add the app to your Discord server.
6. In Discord: **User Settings > Advanced > Developer Mode** on. Until the Activity is distributed, only you and members of the app's team can launch it.

## Launching

In a voice or text channel of the server, open the **App Launcher** (the rocket / apps button beside the message box), pick the app and press Launch. Everyone in the channel can join the same Activity.

## Testing

- Quick look, no Discord: open `/discord` in a browser. It shows the rooms and the buttons; the SDK is not started.
- Real test on this computer: Discord needs a public https address.
  1. Stop `vite` / remove `public/hot` and run `npm run build` (the Vite dev server address is not reachable through a tunnel).
  2. `php artisan serve`, then `cloudflared tunnel --url http://localhost:8000` (or ngrok). It prints `https://something.trycloudflare.com`.
  3. Set the `/` URL mapping target to `something.trycloudflare.com` (no `https://`), launch the Activity from the App Launcher. `APP_URL` decides where Open Full Website goes (`http://localhost:8000` opens the local site on your computer).
- Production: deploy as usual (the frontend has to be built with `npm run build`), with `/` mapped to `sfd-dj.eu`.

Automated: `tests/Feature/DiscordActivityTest.php` (headers, cookies, asset paths, sign-in outcomes). It checks what the server sends; the Discord client itself can only be tested inside Discord.

## Limits

- Not verified inside the real Discord client: the iframe, SDK handshake, cookies and `openExternalLink` were exercised against a stand-in that answers like Discord, never against Discord itself.
- The Cloudflare zone in front of `sfd-dj.eu` must let Discord's proxy through (no bot challenge for it), or the Activity opens blank.
- Device bans that rely on the browser cookie do not follow a person into Discord (the cookie there is separate). IP bans and account state still apply, and an Activity user can only read the room list.
- Live numbers update every 20 seconds, not instantly.

## Laravel Cloud deployment

1. Apply the changed source files to the repository and branch connected to the existing Cloud application. This local workspace has no `.git` directory; a deploy of the current Cloud commit alone will not upload these local edits.
2. In the production environment variables, set `DISCORD_ACTIVITY_CLIENT_ID=1563979983582535841` and set `DISCORD_ACTIVITY_CLIENT_SECRET` to that app's secret if Activity sign-in is needed. Keep `APP_URL=https://sfd-dj.eu`. Remove `VITE_DISCORD_CLIENT_SECRET` and any other frontend secret. Preserve the existing website OAuth credentials.
3. The Cloud build commands must install the frontend dependencies and run the build:

   ```sh
   npm ci
   npm run build
   ```

   Keep the existing Composer install/build/deploy commands too. Never commit or deploy `public/hot`; it points at a local Vite development server. If it exists in the deployed release, remove that specific file in the build before serving the app. Cloud should cache the new configuration during its build process (`php artisan config:cache` or `php artisan optimize`), as its documentation requires. No database migration is needed for this change.
4. Deploy the updated commit. The Activity uses the same Laravel service and `/discord/token` endpoint; no extra Node process or server port is needed.
5. Verify the real public response, including headers added after PHP:

   ```sh
   node scripts/check-discord-activity.mjs https://sfd-dj.eu
   ```

   On 2026-10-25 the public Activity response still contained `X-Frame-Options: deny`, even though the Activity middleware did not set that value. The updated middleware explicitly removes existing PHP response headers. Laravel Cloud defaults to `X-Frame-Options: DENY`: open the production canvas, click **Edge network > Response rules > X-Frame-Options**, and select **None/Unset**. `SAMEORIGIN` still blocks a Discord iframe. The application continues protecting normal pages with its own `SAMEORIGIN` and CSP. If a restrictive header remains after deployment, also inspect any separately managed Cloudflare response rules. Apache `.htaccess` rules cannot control Laravel Cloud's infrastructure. Do not add a second restrictive CSP alongside the application's policy.
6. In [Discord Developer Portal](https://discord.com/developers/applications/1563979983582535841/embedded), enable Activities and map prefix `/` to target `sfd-dj.eu`. Then launch the app in a voice channel and confirm the connection status clears and the room list appears. The HTTP verifier cannot prove the real Discord handshake.

`https://sfd-dj.eu/discord` is already the preview/Activity page. A separate `activities.sfd-dj.eu` is optional: add it to the same Cloud environment, create the DNS record Cloud supplies, wait for HTTPS verification, and then set Discord's `/` mapping target to `activities.sfd-dj.eu`. Keep `APP_URL=https://sfd-dj.eu` so the full-site and room buttons retain their destination. A plain visit to the new host's `/` still shows the usual homepage; Discord's launch query selects the Activity. No new paid service is required by the code.

References: [Discord SDK](https://github.com/discord/embedded-app-sdk), [Discord networking](https://docs.discord.com/developers/activities/development-guides/networking), [Cloud deployments](https://laravel.com/cloud/docs/deployments), [Cloud source control](https://laravel.com/cloud/docs/source-control), [Cloud frame header settings](https://laravel.com/cloud/docs/network#x-frame-options).
