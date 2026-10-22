# Block and Ignore

Every signed-in user can use **Block / Unblock** and **Ignore / Stop ignoring** on another person's full profile or room user card. Their own **Settings → Privacy → Blocked and ignored users** lists these choices and lets them undo them.

Ignore hides that author's room chat, direct Whispers and messages in shared Whisper groups for the viewer. It also filters their quote previews, typing indicator, room activity popups and Whisper/friend-request toasts. Their messages do not increase the viewer's unread Whisper count. Other people keep their normal view. Ignoring does not forbid the sender from sending messages.

Block adds the same message filtering and prevents direct Whispers, voice messages, calls, friend requests and group invitations between the two accounts. The server enforces these restrictions in either direction, including staff accounts. An active or ringing call between them ends; pending friend requests between them are cancelled. Existing accepted friendships and group memberships remain. In an existing shared group, each person can still speak to the group; the blocker's view filters the blocked author's messages.

The two flags are independent. Removing Block while Ignore remains enabled keeps the messages hidden. Removing both restores ordinary message visibility, including older history, subject to explicit message hiding and other privacy settings. These actions never delete accounts, chat messages or voice recordings, and never ban someone from a room or alter moderation permissions. Room membership, profiles, playlists and songs are not hidden by these filters.

## Implementation

Apply `2026_12_04_000001_create_user_restrictions.php` during deployment. The unique `(user_id, target_id)` row in `user_restrictions` stores the viewer's flags. Requests can modify only the authenticated viewer's own row, and cannot target themselves. `GET /api/user-restrictions` returns only that viewer's list. The blocker's identity and restriction state are never broadcast to the target.

History, unread counts, reply previews and voice-recording access apply viewer-specific filters. Live room events are filtered in the browser because public room broadcasts are shared with other room participants. This is a personal display filter, not removal of the author's public content. A private `user-restrictions-changed` event syncs the viewer's other sessions; the browser channel syncs open tabs and room overlays. Unblocking also refreshes recent room history.

## Verification

`php artisan test --filter="UserRestrictions|Whisper|Friend|ProfileRoomExtras|UserProfile|ChatReaction"` covers permissions, both flags, reversal, staff blocks, calls, invitations, direct/group history, quotes, unread counters, recordings and isolation between users. Browser checks cover profile actions, filtering in another tab, persistence after reload, undo through Privacy, disabled Whisper composition, and the mobile layout.
