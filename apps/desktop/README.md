# SFD DJ Desktop for Windows 11

Windows 11 x64 installed app, opening **https://sfd-dj.eu/** in Microsoft Edge WebView2. Both Setup and startup require a Windows workstation reporting version 10.0, build 22000 or newer; Windows 10 and Windows Server are rejected before creating a browser profile or installing prerequisites. The website remains the source of music, chat, subscriptions, account settings and room release flags. No server, API credentials or development URL is bundled.

The Downloads page enables the EXE link only when User-Agent Client Hints identify Windows 11. Browsers that cannot distinguish Windows 10 and 11, including Firefox, show an instruction to open the page in Chrome or Edge. This browser check is a convenience, not an authentication boundary: the public artifact URL can still be copied, but the EXE enforces its own OS requirement. See [Microsoft's UA-CH guidance](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/how-to-detect-win11).

Run **SFD-DJ-Setup.exe**. The wizard displays SFD artwork, always offers an installation-folder chooser, adds a Start menu shortcut and optionally a desktop shortcut, and registers an uninstaller in Windows Settings. It normally requests administrator permission and installs to Program Files. The downloaded EXE, installed application, shortcuts and uninstaller use the existing SFD logo, packaged at six Windows icon sizes. A browser's download-list icon is controlled by that browser and can remain generic.

Setup and uninstall offer the same 12 languages as the website: English, Estonian, Russian, Brazilian Portuguese, Spanish, German, French, Finnish, Ukrainian, Latvian, Lithuanian and Polish. The language dialog is shown at startup, with Windows' matching language selected automatically. Navigation, folder selection, shortcuts and SFD-specific prerequisite/error messages follow that choice. Most translations are supplied by the pinned compiler; the updated Estonian and Latvian catalogs are vendored with [source credits](Installer/Languages/SOURCES.md).

Setup checks x64 Microsoft .NET 10 Desktop Runtime, Visual C++ v14 Redistributable and Evergreen WebView2. Missing or older components are downloaded directly from Microsoft and installed before app files are copied. Already suitable versions are preserved. The exact .NET/VC++ minimums are recorded in `public/downloads/desktop-release.json`. Each build resolves the latest stable .NET 10 patch and current VC++ package, verifies Microsoft Authenticode signatures and the official .NET SHA-512, and pins SHA-256 hashes plus resolved HTTPS URLs in Setup. No SDK or unrelated runtimes are installed. Microsoft owns and updates these shared components under its respective terms.

Prerequisite failures stop installation with an error; retry after fixing the reported problem. Microsoft restart-required exit codes are propagated to Setup's restart prompt; the app is not launched until after that restart. Silent deployments should use `/NORESTART /RESTARTEXITCODE=3010`. Setup never uninstalls shared Microsoft components or deletes the user's SFD profile. If WebView2 is removed later, the app retains its first-run repair offer using a bundled Microsoft-signed bootstrapper. Internet access is required for missing prerequisites and the online site.

The app's profile, cookies, local storage and window placement live in `%LOCALAPPDATA%/SFD-DJ/Desktop`. Remember-me cookies follow the website's normal login, logout and revocation rules. The app does not export passwords or authentication tokens. External links open in the default browser; known sign-in providers stay inside the app's sandboxed browser. Provider restrictions on embedded sign-in may still require password login or the normal browser. Third-party Chrome extensions, including the optional tab-audio Equalizer extension, are installed separately in Chrome/Edge and do not automatically load in this app.

From desktop 1.2.0, Windows' `SystemIdentification.GetSystemIdForPublisher` supplies a system identity (TPM, UEFI or registry). The app hashes it with an SFD-specific purpose string and sends only that hash and the source type to the exact HTTPS SFD site origins. Raw Windows/system identifiers are never sent. Headers are stripped on third-party requests, OAuth providers and redirects. This identifier does not depend on browser profile files, login or installation directory. Registry-backed identifiers can change after reinstalling Windows; hardware changes or a modified client can also affect enforcement. This is an abuse-control signal, never proof of authentication. The native client exposes no host objects or script-to-native bridge.

The site HMACs device signals again before storage. Authorized staff can issue IP bans or select a recorded browser/Windows device from quick or full profiles; room moderation roles do not grant that permission. Browser bans use an encrypted HttpOnly cookie and can be evaded by clearing site data. Windows HWID bans apply in this app, including a fresh browser profile. They cannot identify a new independent browser that has not supplied that ID. The Privacy page explains the recorded access signals.

Back, Forward, Home, Reload and Open in browser are available in the toolbar. F11 toggles fullscreen; video fullscreen is supported. Ctrl+R reloads, Ctrl+W closes. The window size is restored on the next launch.

## Build

On Windows, install the .NET 10 SDK and run `npm run desktop:build` from the repository root. The WebView2 SDK version is pinned in the project/lock file. The build prepares the Microsoft prerequisite metadata, generates icons from the existing vector logo, publishes a framework-dependent x64 app and compiles the wizard using Inno Setup 7.1.0. The signed Inno compiler is automatically prepared outside the repository when absent. Compiler/prerequisite downloads, intermediate build output and generated prerequisite definitions are cached under `%LOCALAPPDATA%/SFD-DJ/build-tools`. The installed payload includes third-party notices and the Inno Setup license; original copyrights and about information are retained.

The build writes these deployable files:

- `public/downloads/SFD-DJ-Setup.exe`
- `public/downloads/SFD-DJ-Setup.exe.sha256`
- `public/downloads/SFD-DJ-Desktop.exe` (compatibility URL delivering the same Setup)
- `public/downloads/desktop-release.json`
- `public/downloads/SFD-DJ-Desktop.exe.sha256`
- `public/downloads/SFD-DJ-Desktop-NOTICES.txt`

Then run `npm run build` so the download page embeds the corresponding release version/size. Deploy all listed artifacts together with the website. Setup and the native app are currently **unsigned**: a publisher certificate and signing/reputation work are required for a signed Windows release. Never describe these files as signed or bypass Windows trust checks programmatically. Rebuild Setup when updating prerequisite minimums or the native host; website changes arrive through the existing site. Existing portable users can install Setup without losing their default profile.

The command-line-only `/CURRENTUSER` override is available for managed environments with prerequisites already installed. It changes the default to a user-local install directory. Without administrator permission, missing machine-wide .NET/VC++ installation can fail and is reported normally. For read-only prerequisite diagnostics, run Setup with `/CURRENTUSER /VERYSILENT /SUPPRESSMSGBOXES /CHECKPREREQUISITES=1 /LOG="C:\\path\\check.log"`. This logs three `CHECK ...=0/1` values and exits before installation with exit code 1.

## Validation

`node scripts/test-workspace.mjs exec node tests/Desktop/languages.mjs` runs the actual compiled installer in read-only diagnostic mode for all 12 language choices, verifies localized wizard and component messages, and checks the complete Estonian/Latvian catalogs and placeholders. It exits before installation and does not change installed runtimes or user installations.

`node scripts/test-workspace.mjs exec dotnet run --project tests/Desktop/PolicyChecks.csproj --artifacts-path <outside-workspace-cache>` checks URI boundaries and rejects local files, JavaScript and executable URI schemes.

`node scripts/test-workspace.mjs exec node tests/Desktop/installer.mjs` compiles a separate installer with a different AppId and test prerequisite executables. It checks missing/current/outdated dependencies, failure and restart handling, folder selection and uninstall, without changing machine runtimes. It then tests the actual production Setup only when no existing SFD DJ installation is registered and all prerequisites are already installed. The production install uses an isolated custom folder, runs the app smoke and uninstalls afterward.

`node scripts/test-workspace.mjs exec node tests/Desktop/smoke.mjs` launches the actual published application with its companion files and an isolated profile, attaches via a loopback-only diagnostic port supplied to the child process environment, verifies site rendering and persistent HttpOnly cookies/local storage across restart, checks local-file blocking and exercises offline recovery. It never signs in to a real user's account. Normal launches expose no diagnostic port. `SFD_DJ_PROFILE_DIRECTORY` is an optional local profile-directory override used by this test, with its own single-instance mutex; no renderer or URL can change it. The installer test uses `SFD_DESKTOP_SMOKE_APPLICATION` to check the installed files directly.

The ordinary `npm run build` does not build the EXE, start the desktop app, restore tests or create test folders.
