# Halloween pumpkin hunt

Each account has 20 pumpkins per annual hunt, from 20 October through 7 November inclusive (application timezone). Five groups of four can be found on Rooms/Discover, Community, Events, Avatar shop and Playlists. History, FAQ, Docs and Patch notes provide alternate places for the first four groups. Random positions are stable for an account and season, so rerenders do not move a target. Room encounters are another way to collect the same IDs; no room or paid plan is needed to finish.

Each new find awards 5 SFD Coins. The twentieth also awards a 150-coin completion bonus: 250 coins in total. The shop ledger shows both rewards. My Stuff includes a permanent Pumpkin hunter achievement based on the best collection in any season.

## Deploy and configure

Run `php artisan migrate --force` and `npm run build` during deployment. The new `pumpkin_hunt_claims` table stores account, season, pumpkin ID and collection time. Do not run migration rollback against a live completed hunt unless the stored progress is intentionally being removed.

`config/pumpkin-hunt.php` holds the annual dates and token lifetime. Set `PUMPKIN_HUNT_ENABLED=false` and rebuild the configuration cache to pause the entire hunt. Outside its dates it stops issuing pumpkins and rejects collection, while earned coins and achievements remain.

The migration also schedules the `pumpkin_hunt` room feature with three days of preview access. Admin → Room updates can change its schedule or pause room encounters. Verified **or** Partnered **or** Featured qualifies; Official alone does not. `RoomReleases::allows` is checked again on every room token issue and claim, along with room privacy and bans. The room UI uses the room's server-provided feature list. A room-only pause does not turn off the rest of the site's hunt.

## Account and reward handling

The endpoints require the site's normal authenticated/verified access. Bots cannot earn hunt rewards. GET `/api/pumpkin-hunt` accepts an allowed `page` or a `room_slug`, and returns only that location's remaining pumpkins, progress, reward amounts and page clues. Claim POST `/api/pumpkin-hunt/claim` accepts an encrypted token bound to the account, season, location, pumpkin and expiry.

Claims lock the user row inside a database transaction, recheck availability and room access, then insert a unique `(user_id, season, pumpkin_id)` claim. The same transaction pays the normal coin ledger using `pumpkin_hunt` and `pumpkin_bonus`. Duplicate clicks return existing progress without another payment. A claim token is a proof for an offered encounter, not a proof that a person visually searched the page; the bounded collection and one-time rewards prevent repeated farming.

Guests can still browse the site. Hunt participation, progress and rewards belong to a signed-in account. Embedded page overlays and Discord guest mode do not render a second hunt.
