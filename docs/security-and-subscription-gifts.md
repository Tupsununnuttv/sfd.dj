# Subscription gifts and security update

## Deploy

Run `php artisan migrate --force` and `npm run build` with this release. The new migrations add account session counters and the subscription gift ledger. Apply migrations before serving the new PHP code; authenticated pages use both tables. Restart long-running PHP/queue workers after deployment.

Keep the production application behind HTTPS with `APP_DEBUG=false`, `APP_URL` set to the public HTTPS address, and secure session cookies. Back up the database and private uploads together: whisper audio is stored on the configured `filesystems.uploads` disk, not in the database.

## Gifts

Members can choose **Gift subscription** on another member's profile or use **Settings → Subscriptions → Make someone's month**. Each gift is a single payment for one calendar month with no renewal. The recipient activates it in **Your gifts**. A gift waits while an existing paid or gifted plan is active. Its activation does not cancel, replace or modify recurring Stripe billing.

The existing Stripe webhook at `/stripe/webhook` must receive:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded` for delayed payment methods
- `charge.refunded` for full refunds
- `charge.dispute.created` for disputed payments
- Existing `customer.subscription.created`, `customer.subscription.updated` and `customer.subscription.deleted` events for recurring plans

Both `STRIPE_SECRET` and `STRIPE_WEBHOOK_SECRET` must be configured. Gift delivery checks the webhook signature, checkout session, payment status, amount and currency. A checkout return URL alone grants nothing. Use Stripe test mode when checking the real checkout/webhook integration; automated tests fake all provider requests.

## Account security

Password changes and resets revoke previous sessions, remember-me credentials and personal API tokens. Logging out all other devices also works when session storage cannot list individual devices. Changes to email require the current password. Setting up 2FA requires the password; turning it off requires the password and an authenticator or unused recovery code.

Login challenges expire after five minutes. Authenticator codes cannot be reused, recovery codes are consumed atomically, and failed challenges are limited per account across browser sessions. Authentication endpoints have separate request limits.

## Media and playback

Whisper history loads older messages in pages. Audio remains restricted to conversation participants, including the group membership boundary, and supports byte ranges for replay and seeking. Missing recordings cannot be reconstructed from message rows; restore missing files from private-upload backups.

Manual skips and removals award no playback XP or coins. Natural completions are checked against the server clock; rewarded tracks must have a known duration and at least 30 seconds played. **My Stuff → How to earn XP** lists the reward amounts and limits.

**Import via streaming** accepts HTTPS links from YouTube, Spotify and SoundCloud. Spotify songs are matched to YouTube; versions may differ and public playlists may expose only the first 100 tracks. SoundCloud imports currently accept individual tracks, not sets. Redirects are validated before following them.
