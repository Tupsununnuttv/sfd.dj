# Browser compatibility

The production JavaScript and CSS targets are explicit in `vite.config.js`: Chrome/Edge 111+, Firefox 128+ and Safari 16.4+. Opera GX uses a Chromium engine; keep it updated. These targets align with the [Tailwind CSS browser requirements](https://tailwindcss.com/docs/compatibility), rather than assuming a JavaScript target polyfills browser APIs. The oldest target versions and Safari have not been tested locally.

## Applied fixes

- Compact preferences and connection notices use a guarded browser channel with storage and same-origin window/iframe fallbacks. Missing or blocked BroadcastChannel does not crash settings. Correlation IDs also work without secure-context `crypto.randomUUID`. Only non-sensitive UI events use this channel; account IDs and compact events are validated before applying preferences.
- Clipboard actions try the Clipboard API, then a selected-text fallback. They restore focus, remove the temporary field and show success only after a successful copy. A browser that blocks both mechanisms can still require manual copying.
- Cancelling recording while microphone permission is pending releases the stream as soon as permission returns. Recorder construction/startup failures release tracks too. A blocked audio level meter does not prevent recording.
- Calls retain separately delivered audio and video tracks, including streamless WebRTC events. Blocked autoplay offers a manual playback button without unhandled promise rejections; unavailable ringtone audio does not remove the visual invitation.
- Firefox now has the same keyboard-focus treatment on the room volume slider as Chromium browsers.

## Repeatable checks

```sh
npm run test:browsers:install
npm run test:browsers
npm run test:frontend
npm run build
```

Playwright runs Chromium and its Firefox test browser. On Windows it also detects installed Chrome, Edge and Opera GX. Set `OPERA_GX_PATH` for a nonstandard Opera installation. Headless browsers use fresh test profiles and do not change a member's existing browser profile.

The independent Vite harness runs the production preference store, channel, clipboard, recording and call helpers, stylesheet and a real animated character. It checks narrow viewport rendering, blocked channel/storage/UUID APIs, inter-tab events, copying, native audio recording/decoding and a local WebRTC peer connection with separately delivered audio/video. It mocks only the harness preference endpoint and microphone input; the recording and WebRTC implementations are real browser APIs. Its dependency cache is separate from the app development server.

To also check the actual public Laravel pages, start the local app and set its URL:

```powershell
$env:BROWSER_APP_URL = 'http://localhost:8000'
npm run test:browsers
```

This opens the home, login, registration and Patch Notes pages and checks rendering and JavaScript errors. Without `BROWSER_APP_URL`, that optional test is skipped. For production-bundle checks, run `npm run build` and stop Vite normally so Laravel serves the build rather than a development hot-file URL. Keep build assets unchanged while these checks run.

Validated on 19 October 2026: all 40 browser checks across Chromium, the Firefox test browser, installed Chrome, installed Edge and installed Opera GX passed, including the public application pages. The 15 frontend tests, 13 settings backend tests (204 assertions), TypeScript check and production build also passed.

These checks do not cover every authenticated flow, extension/privacy configuration, older browser release, physical camera, external music provider or connection between different real-world networks. Microphone/camera use still requires HTTPS (or localhost), browser permission and allowed WebRTC. Autoplay restrictions may require a click; restrictive networks can require TURN. Nothing here bypasses a member's privacy choices or browser permissions.

## Shop and profile regression checks

The shop tests use real Laravel purchase, outfit, login and profile endpoints with a disposable SQLite database. They block sockets, BroadcastChannel and localStorage, then buy Bamboo Panda, select it, save the profile-picture option, check the surrounding room sidebar, reload and open the profile. They also check the sidebar name, role and XP layout. A separate browser test checks stale quick-profile avatars and cache invalidation.

```powershell
npm run build
$env:BROWSER_SHOP_TEST = '1'
npm run test:browsers -- tests/Browser/shop-appearance.spec.mjs
Remove-Item Env:BROWSER_SHOP_TEST
```

Playwright starts and stops its own server on port 8012. The fixture script refuses any database except `tmp/browser-tests.sqlite` in the testing environment. Do not point these fixtures at development member data or production. Existing profile photos stay independent when the shop checkbox is unticked; selecting a character ticks it, and saving with it checked replaces the photo. Older API clients that omit the option keep their existing behavior.

## Guests, selfbots and new connection controls

```powershell
npm run build
$env:BROWSER_SHOP_TEST = '1'
$env:BROWSER_SITE_TEST = '1'
npx playwright test tests/Browser/site-upgrade.spec.mjs tests/Browser/lazy-language.spec.mjs
Remove-Item Env:BROWSER_SHOP_TEST, Env:BROWSER_SITE_TEST
```

This scenario uses production assets even if the normal development Vite server is running. Its PHP router and seed script refuse any database except the disposable test SQLite file. Persistent cache entries also stay in that database. Two anonymous tabs share one guest alias, a signed-in member sees the guest without sockets, room cards show the configured selfbot and all four new connection controls render with honest configuration status. The separate language scenario checks the real development language loader and mounted text, including that English fetches neither dictionary and Estonian does not fetch Russian. Keep the production build unchanged until these tests finish.

`scripts/localized-react.mjs` keeps the stateful JSX runtime out of Vite dependency prebundling; bundling it separately would create a second regional store. The shared browser server scans both the component harness and full app before serving tests, so tests with blocked hot-reload sockets use the same React dependency graph.
