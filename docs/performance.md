# Performance improvements

## Room memory pass (2026-10-24)

- Removed the room-wide preload of every character's Dancing and DJing picture. Only visible, active poses load; one DJ requests one DJ animation.
- Chat/profile/list character thumbnails and idle crowd characters use static posters on desktop as well as touch devices. SVG posters are cached 160-pixel-wide PNGs; imported GIF posters preserve only the first original frame, palette and transparency. Dancing figures and the active DJ remain animated at their existing display sizes.
- Aether, Kaida, Solstice and Veyra use pre-rendered, lossless APNG dance/DJ loops instead of keeping 48–72 vector poses alive in each browser image document. Every original pose and the exact loop duration are retained. Reduced-motion settings use the original SVG; Always play animations still overrides that preference. Other characters and uploaded photos retain their existing formats.
- `npm run build` generates the posters and eight animation assets. Deploy both `public/Avatars/Previews/` and `public/Avatars/Animations/` with the updated manifest/bundle. The eight full-resolution animation files total about 15 MB on disk; each is fetched only when its pose is actually displayed. This trades larger, cacheable first-use animation downloads for less browser vector rendering. Existing source art is preserved.

Measured with an isolated production build containing 37 different characters, 120 chat rows and Dragon scenery, at 1440 × 1000 in headless Chromium on this Windows host:

| Metric | Before | After |
| --- | ---: | ---: |
| Renderer private committed memory | 356.8 MiB | 130.2 MiB |
| Renderer resident working set, including shared pages | 549.4 MiB | 351.6 MiB |
| Browser document nodes, including image documents | 35,879 | 3,710 |
| Main-thread task time during a five-second sample | 4.20 s | 1.20 s |
| Animated character asset requests | 111 | 19 |
| DJ animation requests | 37 | 1 |

These are local, single-run comparisons, not a universal 100–299 MB cap. The production scene is exercised without YouTube/Twitch or other third-party video decoders, extensions, real-room custom CSS or a long-running session. Resident memory remains above 299 MiB in this stress fixture; private memory is within the requested range. Video/GPU/browser processes allocate additional memory. The headless host's animation-frame sampling remained around 13–14 callbacks/second; the reduced CPU task time does not establish a 60 FPS result. Verify total tab footprint and smoothness in the real deployed room.

Reproduce the optimized measurement:

```powershell
npx vite build --config tests/Browser/vite.memory.config.mjs
node scripts/benchmark-room-memory.mjs sample
```

The command creates `tmp/room-memory-results/` for process memory, browser metrics and a screenshot. The retained baseline and final measurements are in `docs/benchmarks/room-memory-before.json` and `docs/benchmarks/room-memory-final.json`. Temporary preview folders can be removed without affecting runtime assets. Browser regression coverage is in `tests/Browser/character-memory.spec.mjs`: active-pose loading, static thumbnails, GIF transparency, animated playback and reduced-motion behavior. APNG/GIF generation and animation timing have frontend tests.

## Site-wide follow-up (2026-10-24)

The optional System → Performance controls and their separate normal/low measurements are documented in [system-settings.md](system-settings.md). The low-mode fixture measured about 114 MiB renderer resident memory and 258 MiB summed working sets across its isolated browser processes, without a video decoder; this is not a universal tab-memory cap.

- Estonian and Russian dictionaries now load only when their language is selected. English downloads neither dictionary; selecting one language does not load the other. The initial language is loaded before rendering, and mounted text subscribes to dictionary completion. Interpolation patterns compile only when the selected language actually needs them. The production application entry shrank from 1,741,630 bytes to approximately 493 kB (gzip about 153 kB); dictionary downloads remain separate and cacheable.
- Room partial reloads resolve chat, roles, permissions, queue synchronization, votes, moderation panels and statistics only when those props are requested. Auth/profile refreshes no longer fetch the entire room again. Synchronization runs at most once in a full room response.
- Dashboard cards select only catalogue fields, excluding room CSS, rules and moderation configuration. The home page ranks thin room records before loading queue totals and relations for the six visible cards, and skips unrequested page sections on partial reloads.
- Anonymous watcher aliases use the existing shared cache, one per session across repeated tabs in a room, with 30-second heartbeats and a 120-second expiry. A keyed hash of the anonymous session supplies a stable fallback if overlapping requests lose the saved alias field; raw session identifiers never leave the server. No user account or per-heartbeat database account is created. Socket updates broadcast only roster changes. Requests cannot overlap within one mounted hook and are aborted on unmount; authenticated background tabs pause polling. Private rooms retain their existing entry restrictions.
- Active guest counts are included on room cards; configured Auto Host selfbot names appear in Dashboard, home and Live listings. Guests remain read-only and do not gain account actions.
- The `extensions/sfd-equalizer` source is retained because Preferences → Audio uses its tab-audio bridge. Removing it would remove the installable Equalizer extension. Existing audio behavior and its frontend checks are preserved.

The social connections feature adds its own database migration; see `docs/social-connections.md`. It has no bearing on the browser-memory measurements above.

## Implemented

- Dashboard props that query the database are evaluated only when requested by Inertia. The room catalogue is loaded at most once per request and shared by the room lists, recommendations and playback summaries. Sidebar counter refreshes skip room, event and playlist queries.
- Admin partial reloads skip inactive-tab lists and settings. The five-second refresh requests overview analytics only while the Overview tab is open. User pages batch active subscription gifts and include violation counts in the user query instead of querying each user separately.
- The latest release summary is separate from the full Patch Notes archive. Home, Dashboard and chat no longer import the roughly 78 kB archive chunk. The archive loads when the Patch Notes page is opened. The release version remains 1.71.
- Avatar images use native lazy loading and asynchronous decoding, keeping offscreen lists from immediately requesting all image files. Existing dimensions remain controlled by their containers.
- Avatar Shop cards use generated static PNG/GIF posters; a dancing animation is mounted only on pointer hover. `npm run build` and the character generators rebuild the posters and their manifest automatically. Include `public/Avatars/Previews/` when deploying. Source hashes avoid stale posters after a character is redrawn. Offscreen posters remain lazy-loaded. The try-on studio still plays the full animations.
- Room Settings uses 224 × 126 PNG background cards instead of mounting every SVG scenery as React components. The 34 thumbnails total 1,330,924 bytes versus 3,165,042 bytes for their SVG sources before compression, and offscreen cards load lazily. Only the selected large preview requests a full static SVG. The panel no longer imports the backdrop renderer or its scenery modules. Live-stream controls, role editing, emoji management and the rules preview load on demand. The General form is memoized against unrelated room updates; role-search requests are cancelled when superseded or unmounted.

Live data continues to be requested from the server; no stale statistics cache was introduced. Existing visibility and overlap guards on dashboard/admin polling remain in place.

Global `Vite::prefetch` has also been removed. It followed the application's dynamic imports and downloaded other page chunks and scene modules in the background, undermining on-demand loading. Required imports still load normally when a page or panel opens.

## Validation

`npm run build` passes. Feature tests verify that a sidebar-only dashboard request does not query rooms, events or playlists, that admin user refreshes skip other tabs, and that a 15-row admin user page batches gift queries and violation counts. The related dashboard, site and permission tests also pass.

These are query and asset-loading improvements, not a production latency or Lighthouse benchmark. Measure the deployed site on both mobile and desktop to establish LCP, INP, CLS and server response time under real traffic.

## Production configuration

Build with `npm run build`; serve the generated assets instead of the Vite development server. Run `php artisan optimize` after production environment configuration is finalized, and rebuild caches on each deployment. Never run production configuration caching against a local development environment file.

The build generates background thumbnails using the `@resvg/resvg-js` development dependency. Deploy `public/backgrounds/thumbnails/` alongside the full background files and generated frontend bundle. `npm run backgrounds:previews` regenerates only those thumbnails; unchanged content hashes reuse already rendered files.

At the host, enable PHP OPcache and Brotli/gzip for static JavaScript, CSS and SVG. Serve content-hashed `/build/assets/` files with a long public cache lifetime and `immutable`; avoid applying that policy to HTML, authenticated JSON or whisper recordings. Verify these hosting settings on the actual server before assuming they are active.

Use a shared cache/session backend when running multiple application instances, keep queue workers separate from web requests, and monitor slow SQL and error rates before choosing further indexes or caching. This change introduces no database migration or new service dependency.
