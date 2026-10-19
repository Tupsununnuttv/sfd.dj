# Performance improvements

## Implemented

- Dashboard props that query the database are evaluated only when requested by Inertia. The room catalogue is loaded at most once per request and shared by the room lists, recommendations and playback summaries. Sidebar counter refreshes skip room, event and playlist queries.
- Admin partial reloads skip inactive-tab lists and settings. The five-second refresh requests overview analytics only while the Overview tab is open. User pages batch active subscription gifts and include violation counts in the user query instead of querying each user separately.
- The latest release summary is separate from the full Patch Notes archive. Home, Dashboard and chat no longer import the roughly 78 kB archive chunk. The archive loads when the Patch Notes page is opened. The release version remains 1.71.
- Avatar images use native lazy loading and asynchronous decoding, keeping offscreen lists from immediately requesting all image files. Existing dimensions remain controlled by their containers.
- Avatar Shop cards use generated, static SVG posters; a dancing animation is mounted only on pointer hover. `npm run build` and the character generators rebuild the posters and their manifest automatically. Include `public/Avatars/Previews/` when deploying. Content-addressed filenames avoid stale posters after a character is redrawn. All 40 standing posters total 566,679 bytes versus 1,809,628 bytes for their animated source files before compression; Kaida alone drops from 369,930 to 9,875 bytes. Offscreen posters remain lazy-loaded. The try-on studio still plays the full animations.
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
