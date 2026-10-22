# Twitch and TikTok

Settings → Connections supports linking and disconnecting existing SFD-DJ.EU users' Twitch and TikTok accounts. This does not add a new site login method. Authorization is bound to the signed-in user, expires after ten minutes and can only be used once. Provider IDs have unique database constraints. Access and refresh tokens are encrypted in the database and excluded from user serialization. The Connections page receives only the connection status and display name. No chat, publishing or email permission is requested.

## Configure

1. Apply the migration with `php artisan migrate`.
2. Create a confidential app in the [Twitch developer console](https://dev.twitch.tv/console/apps). Set `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` in the server environment. Register `https://sfd-dj.eu/auth/twitch/callback` for production.
3. Create an app in [TikTok for Developers](https://developers.tiktok.com/), enable Login Kit for Web, and configure the `user.info.basic` scope. Set `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET` in the server environment. Register `https://sfd-dj.eu/auth/tiktok/callback` for production. Complete TikTok's app review before use outside its permitted testing users.
4. Use the exact callback URL for your deployment. Staff can see it in Settings → Connections. TikTok web callbacks require HTTPS; use a registered HTTPS development domain for testing.
5. Clear or rebuild Laravel's configuration cache after setting the environment variables. Buttons become available when both credentials are configured.

Disconnect attempts remote token revocation and always clears the local connection. If revocation fails, the page tells the user to remove the app in the provider's connected-app settings. Tokens are stored for authorization management; this integration makes no ongoing API requests or automatic refresh calls.

## Live streams

Twitch already plays through its official embedded player. In a room, use Go live with `https://www.twitch.tv/yourchannel`. Its `parent` parameter uses the room's hostname.

TikTok LIVE links use `https://www.tiktok.com/@yourname/live`. A room shows a **Watch on TikTok** button and lists the stream on the Live streams page. Viewers open TikTok in another tab. No TikTok LIVE iframe, scraping, restreaming, chat sync or automatic live-status detection is provided. The host starts the broadcast on TikTok and manually starts/ends its room listing. As with other room live modes, the DJ queue pauses until the host ends this mode.

The [TikTok embed player](https://developers.tiktok.com/docs/en/embed-player) documents playback of posts. It does not document a LIVE embed endpoint. This external watch link avoids claiming in-room LIVE playback.

## Validation

`php artisan test --filter="StreamConnectionTest|LiveStreamTest"` exercises both providers using fake HTTP responses, including CSRF state, expiry, account uniqueness, private token storage, disconnect failures and live permissions. No test contacts real providers. Finish setup with a real consent/cancel/disconnect check against registered developer apps.

API references: [Twitch authorization](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/), [TikTok Login Kit Web](https://developers.tiktok.com/docs/en/login-kit-web), [TikTok user info](https://developers.tiktok.com/docs/en/tiktok-api-v2-get-user-info), [TikTok token management](https://developers.tiktok.com/docs/en/oauth-user-access-token-management).
