# Discord Rich Presence in Desktop 1.4.0

SFD DJ Desktop automatically announces its running process to the local Discord desktop client through Discord's documented IPC/RPC transport. The activity uses application ID `1563979983582535841`, the display name **SFD DJ Desktop**, the existing public SFD logo at `https://sfd-dj.eu/icon-512.png`, elapsed session time, and buttons for the website and Downloads page.

The payload describes app usage only. It does not claim a track is playing, publish room names, or send chat, website login cookies, user/device identifiers or Discord tokens. No OAuth login, client secret or bot token is needed for this integration. The Embedded App SDK used by the voice-channel Activity remains separate.

Presence starts when the main window opens. It discovers local `discord-ipc-0` through `discord-ipc-9` named pipes on a background task, validates the handshake, handles fragmented frames and ping/pong, bounds incoming frames to 64 KiB, and retries after 15 seconds when Discord is absent or restarts. The original session start time is kept on reconnection. Closing the app cancels the worker and attempts to clear the activity within a bounded shutdown window; the connection is then disposed. Missing Discord never prevents the website, music or sign-in from working.

Installation alone does not mean the app is being used: Discord displays the activity while SFD DJ Desktop is running. Discord's desktop client must also be running with the user's activity-sharing settings enabled. The integration does not alter those settings or force visibility for users who disabled sharing. Each user's installed app reports that user's own activity.

## Icon and Developer Portal

The public Discord application record already has an SFD icon. The question-mark icon shown by generic executable detection is replaced by associating this process with the actual Discord application and setting a Rich Presence image explicitly. Live RPC testing acknowledged the display name `SFD DJ Desktop` and returned a Discord media-proxy asset for the public logo URL.

No Portal change is required for the external logo URL used here. If you replace the application icon later, use **General Information → App Icon** in the [same application](https://discord.com/developers/applications/1563979983582535841/information). Uploaded Rich Presence art is a separate option in [Rich Presence](https://discord.com/developers/applications/1563979983582535841/rich-presence); the existing `public/icon-512.png` can be uploaded with a key such as `sfd_logo`, then referenced in the payload instead of the URL. The shared application is registered as `SFD.DJ Activities`; this desktop payload overrides the displayed activity name without renaming the voice-channel Activity.

## Installation and publishing

Install Desktop **1.4.0** once to gain Rich Presence. The existing installation identity, browser profile and update-check feature remain the same. Publish the new installer, legacy alias, checksums, notices and `desktop-release.json` together, then run the normal web build and deploy. See [desktop updates](desktop-updates.md) and [signing](desktop-signing.md). The installer remains unsigned until a trusted certificate is configured.

## Validation

The Windows project built without warnings. Focused tests passed 22 assertions using actual isolated named pipes: correct ID/name/logo/process, elapsed time and buttons, fragmented reads, invalid/truncated/oversized frames, READY handshake, ping/pong, absent Discord, later startup, reconnection, bounded/idempotent shutdown and clear activity. A live running Discord client accepted `SET_ACTIVITY`, the overridden name and the external logo (converted to a media-proxy asset); the temporary test activity was cleared immediately afterward. The actual profile-card rendering for every Discord client version or user privacy configuration is not guaranteed by that acknowledgement. No account settings or credentials were changed. The historical full test archive is incomplete, so focused tests ran outside the workspace.

Protocol references: [Discord RPC](https://docs.discord.com/developers/topics/rpc), [Rich Presence setup, names and assets](https://docs.discord.com/developers/discord-social-sdk/development-guides/setting-rich-presence), [external activity images](https://docs.discord.com/developers/events/gateway-events#activity-object-activity-asset-image).
