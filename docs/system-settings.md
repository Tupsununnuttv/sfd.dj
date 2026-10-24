# System → Performance

Signed-in users can open `/settings/system` from the new System group in their profile settings. Preferences save to the existing account JSON; there is no migration or new service. Defaults retain the site's normal appearance. Changes apply immediately, including to a room surrounding its settings overlay and to other open tabs for the same account.

- **Low performance mode** temporarily overrides individual choices: static characters, a static room background, no decorative scenery animation/particles and no blur/glow/shadow effects. Disabling it restores the individual saved choices rather than replacing them.
- **Animated characters** controls the crowd, DJ and avatar-shop character previews. Turning it off replaces animated assets with generated stills; the DJ retains its rear-facing pose. CSS-only profile avatar animations also stop. Explicit System choices override Appearance → Always play animations.
- **Background animations and particles** removes room particles and disables scenery/booth animation.
- **Blur, glow and shadow effects** disables decorative CSS filters, backdrop filters, shadows and layer-promotion hints. Expensive equipped avatar effects and the subscription DJ spotlight are unmounted.
- **Lightweight room background** replaces live vector scenery with one generated 960-pixel-wide static image. The custom background image is retained for a room with an uploaded image. Layout, screen, vote controls and member positions stay in place.

Low mode also stops decorative CSS animations and transitions across the site. Music/video playback, chat, permissions and queue behavior are not paused. Background and character components subscribe to a shared store; switching mode does not replace the playback component. Writes are serialized, previewed optimistically and restored on failure. The outer window owns overlay writes so closing the settings frame cannot cancel a queued save. Counter-only Inertia reloads cannot overwrite a confirmed choice with unchanged stale auth props.

Browser hardware acceleration is explained separately, with vendor guidance. The page does not claim to toggle or detect a browser/OS setting. Browser graphics acceleration normally helps video decode/rendering; users troubleshooting graphics failures can change it in the browser and restart. See [Microsoft guidance](https://learn.microsoft.com/en-us/troubleshoot/microsoft-edge/performance/edge-high-cpu-memory) and [Firefox performance settings](https://support.mozilla.org/en-US/kb/performance-settings).

`npm run build` generates both standing and DJ posters in `public/Avatars/Previews/`, with separate content-hashed manifests, plus `public/backgrounds/stills/` and `resources/js/lib/backgroundStills.json`. Deploy these generated files with the bundle. The 34 static backgrounds total about 11 MB on disk; only the selected room image loads when the lightweight option is active. The 59 DJ posters total about 1.1 MB. These are disk/download totals, not an allocation per tab.

Validation covers preference access, validation/merging, numeric boolean normalization, restoration of saved choices, failed writes, room rendering, playback-component identity and overlay-close persistence. Browser checks are in `tests/Browser/system-settings.spec.mjs`. Use the isolated production-asset test server:

```powershell
npm run build
$env:BROWSER_SHOP_TEST = '1'
$env:BROWSER_SITE_TEST = '1'
npx playwright test tests/Browser/system-settings.spec.mjs
Remove-Item Env:BROWSER_SHOP_TEST, Env:BROWSER_SITE_TEST
```

For the isolated 37-character memory fixture, build with `npx vite build --config tests/Browser/vite.memory.config.mjs`, then run `node scripts/benchmark-room-memory.mjs system-normal` and `node scripts/benchmark-room-memory.mjs system-low --low-performance` sequentially. This fixture includes 120 chat rows and Dragon scenery, without a third-party video decoder. It does not establish a universal memory cap for real video rooms.

Measured on this Windows host with fresh, headless Chromium sessions at 1440 × 1000 (2026-10-24):

| Metric | Normal | Low performance |
| --- | ---: | ---: |
| Renderer resident working set | 341.5 MiB | 113.9 MiB |
| Renderer private committed memory | 122.1 MiB | 46.5 MiB |
| Sum of browser/GPU/network/renderer working sets | 572.6 MiB | 257.6 MiB |
| Document nodes, including image documents | 3,710 | 1,171 |
| Main-thread task time in a five-second sample | 1.09 s | 0.06 s |
| Animated character requests | 19 | 0 |

These are single-run local comparisons. Working-set sums count shared pages in each process and are not the same metric as a browser task manager's tab allocation. The fixture has no real video decoder, live socket traffic or long-running session; actual rooms can use more memory. Source records are retained in `docs/benchmarks/system-normal.json` and `docs/benchmarks/system-low.json`. The static image omits the preview's booth because the room draws its foreground booth separately.
