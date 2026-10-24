# Reddit, Instagram, Facebook and X account connections

These are authorization-code account connections in Settings → Connections, alongside the existing providers. They link an external identity to the signed-in, verified site account; they do not sign users into SFD-DJ, publish posts or send messages. The popup flow also works from embedded room settings.

## Activation

1. Apply `database/migrations/2026_12_07_000001_create_social_connections.php` on each deployed database. It has already been applied to the local SQLite development database. Deploy the updated PHP and frontend build together.
2. Create the appropriate developer application at each provider and add the credentials below to the server's environment. Keep secrets server-side. Register the exact callback URL, using the public HTTPS site origin in production; the authenticated staff Connections page also displays it.
3. Rebuild the application's production configuration cache after configuring the credentials. Test authorization, account details and disconnect with an approved account at each provider. Until credentials are supplied, the UI accurately says linking is not configured.

| Provider | Environment variables | Callback path | Requested permissions |
| --- | --- | --- | --- |
| Reddit | `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`; optional descriptive `REDDIT_USER_AGENT` | `/auth/reddit/callback` | `identity`, permanent authorization |
| Instagram | `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET` | `/auth/instagram/callback` | `instagram_business_basic` |
| Facebook | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`; `META_GRAPH_VERSION` defaults to `v25.0` | `/auth/facebook/callback` | `public_profile` |
| X / Twitter | `X_CLIENT_ID`, `X_CLIENT_SECRET` | `/auth/x/callback` | `users.read tweet.read offline.access`, S256 PKCE |

Use the Instagram App ID/secret for **Instagram API with Instagram Login**. This API supports Business and Creator accounts; personal Instagram accounts are not supported. Instagram and Facebook require their corresponding login products, allowed redirect URLs, app mode and provider approval/access appropriate for the intended users. X requires OAuth 2.0 configured for a confidential web application and provider access to the current-user endpoint. Reddit requires a web app and any provider approval required for its API access.

Tokens are encrypted with Laravel's application key and hidden from serialized models and Inertia props. Keep the existing `APP_KEY` when deploying. OAuth state is bound to the site user/session, expires after ten minutes and is consumed once. An external account cannot belong to two site accounts. Disconnect attempts provider-side revocation, then removes the local connection. If revocation fails, the UI explicitly asks the user to remove the app at the provider too. No token refresh worker or future social features are introduced by this account-linking change.

The automated feature tests use provider HTTP fakes: successful linking for all four providers, token encryption, private settings props, state expiry/replay/user binding, PKCE, duplicate account protection, disconnect and missing configuration. Live provider authorization still needs credentials and app configuration.

Official references: [Reddit OAuth](https://github.com/reddit-archive/reddit/wiki/OAuth2), [Instagram Business Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login), [Facebook manual login flow](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow/), [X OAuth authorization code flow](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code), [X current user endpoint](https://docs.x.com/x-api/users/get-my-user).
