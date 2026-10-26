# Desktop update notifications

SFD DJ Desktop 1.3.0 adds a native **Check for updates** toolbar button. Checks also run when the window first opens and every six hours while it remains open. Background checks do not show modal dialogs or interrupt playback. A newer stable version turns the toolbar button gold and displays **Update available: VERSION**. Clicking it checks again and offers to open the official download page. Manual checks also show an up-to-date confirmation or a retryable connection error.

The installed version comes from the desktop assembly. The release is read from `https://sfd-dj.eu/downloads/desktop-release.json` with cache bypass, a 15-second deadline and a 64 KiB response limit. Only a stable numeric version for the existing Windows installer is accepted. Versions compare numerically; the same or an older server version never prompts a downgrade. Redirects and cookies are disabled for this request. Closing the app cancels pending checks. Network or metadata errors do not affect normal app navigation, and background failures stay quiet.

The update action opens the fixed official `https://sfd-dj.eu/download` page in the user's browser. It does not execute a path supplied by release metadata. Users download Setup, close the app and run Setup over their existing installation. The existing AppId, installation directory and user profile remain the same.

## Publishing the next release

1. Increase `<Version>` in `apps/desktop/SfdDj.Desktop.csproj`.
2. Build on Windows with `npm run desktop:build` or, with a trusted certificate configured, `npm run desktop:build:release` (see [signing](desktop-signing.md)).
3. Publish the generated Setup executable, legacy download alias, SHA-256 files, notices and `desktop-release.json` together. Publish the installer before advertising its version in the metadata.
4. Run the normal web build after the desktop build, because the Downloads page imports release metadata into its bundle. Deploy the connected repository to Laravel Cloud; edge-cache purge on deployment should remain enabled.

Existing 1.2.0 installations need to install a version from 1.3.0 onward once to gain the native update checker. The latest installer is now 1.4.0 with [Discord Rich Presence](desktop-discord-presence.md). Website updates continue appearing automatically inside the app, independently of desktop version checks. The installer remains unsigned until a trusted signing certificate is configured; update notifications do not remove SmartScreen warnings.

## Verification

The 1.3.0 Windows installer and production website bundle were built successfully. Focused tests exercised 26 assertions covering numeric version comparisons, official request/download URLs, cache bypass, missing/invalid/oversized metadata, HTTP errors, redirects and cancellation. Native WinForms checks used the published production assembly and controlled HTTP responses to verify the command, gold notification, current/older releases, retry after errors, preservation of an existing notification when offline and the six-hour interval. No newer release has been deployed publicly yet, so an end-to-end notification against a future live release is not verified. The historical full test archive remains incomplete; focused checks ran outside the project and did not replace it.
