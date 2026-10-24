# Room feature releases

Verified, partnered and featured rooms receive staged room features three days before general availability. Either badge or the featured flag is sufficient. Official alone does not qualify. Access belongs to the current room and applies to its visitors, including guests; owning an eligible room gives no preview rights in another room.

`Room::early_access` is derived from staff-controlled attributes. `RoomFeatureRelease::availableIn()` enforces the enabled switch, preview start and general release date on the server. General availability is `preview_at + early_days`, with a default of three days. Future/suspended releases are unavailable everywhere. A removed badge/featured flag removes preview access immediately on the server. Existing room permissions and private-room/banned-user restrictions still apply.

Admin → Room updates controls each implemented feature's schedule, lead time (1–30 days) and enabled state, using the separate `releases.manage` permission. Owner always has this permission; Developer/Admin defaults include it. The upgrade grants it to existing Developer/Admin roles only if they already manage rooms, preserving custom restrictions. It is independently assignable in Permissions Matrix. Disabling a feature rolls it back for all rooms. Room pages recheck when the tab becomes visible and once a minute; room badge broadcasts also refresh eligibility. Dates are submitted as ISO timestamps and shown in the viewer's locale.

The first staged feature is **Room updates**, available through More in eligible rooms immediately after migration. Other rooms receive it three days later. Its feed is filtered on the server, so ordinary rooms cannot read future feature descriptions through a direct URL.

For every future room feature:

1. Implement it behind a key in `config/room-releases.php`, and add a migration creating its disabled/scheduled `room_feature_releases` row.
2. Before executing its server actions, require `RoomReleases::allows($room, 'feature_key')` in addition to ordinary action permissions.
3. Show its UI only when the room's server-provided `roomReleases.features` contains the key. Never trust client-supplied badges, owner status or query-string preview switches.
4. Schedule it in Admin → Room updates. It becomes available to qualifying rooms at `preview_at`, then to every room three days later (or after the explicitly configured lead time).

The rollout system controls registered features; it does not make a second copy of the application's PHP/JS build. Existing public features remain public. Security fixes and corrections to existing functionality should ship normally rather than waiting for a preview window.
