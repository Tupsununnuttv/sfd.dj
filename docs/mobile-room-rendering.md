# Touch-device room rendering

The supplied 12.7-second landscape recording shows intermittent black/missing navbar and chat regions while scene/avatar animations continue. This is a paint/compositing failure, not evidence of a navigation or message-data failure. The room's custom theme combines backdrop blur on bars with drop shadows on repeated animated SVG avatars. These effects are a plausible rendering-pressure trigger, not a hardware-confirmed root cause.

## Changes

- `useTouchRendering` detects coarse pointing capability, with a touch-capable Android/iOS/iPad desktop-identification fallback. It does not depend on a narrow viewport; landscape and desktop-site modes are covered.
- Rooms expose `data-rendering="touch"` or `"full"`. On touch devices, targeted CSS removes backdrop filtering and avatar/large-container filter chains even when custom room CSS requests them. Theme colours, borders and layout remain customizable.
- Small character avatars use the existing content-addressed static posters. Cosmetic art stays visible, with its inline SVG animations paused inside touch-mode rooms. Idle crowd characters use static poses too.
- Touch scenes stop decorative background/booth animation and omit the large particle overlays. They do not preload every unused dancing/DJ SVG. The actual video, music, dance poses and DJ characters remain mounted and available.
- The already-clipped stage gets paint containment to bound scene repainting. Panels do not get containment, which could clip their fixed menus. No blanket `translateZ`/`will-change` layer promotion is added.

This is automatic rendering hardening, independent of viewport width or the user's reduced-motion preference. An ordinary non-touch desktop retains its animated scenery, dancing characters and room glass effects. Small character thumbnails and idle crowd figures now use static posters on every device (see `performance.md`). Existing uploaded avatar photos are unchanged.

## Verification

`npm run test:browsers:mobile` runs the production scene/avatar renderer in Chromium and WebKit. The fixture uses Dragon scenery, live dance/DJ poses, 24 cosmetic avatars and custom `!important` blur/shadow rules. Portrait and landscape/desktop-site tests check computed filter removal, static head images, omitted particles, retained video/dance elements, scrolling, tab interaction, orientation changes and screenshot pixels in the header/chat across the supplied recording's duration. Desktop and iPad-desktop-identification cases are checked separately. Install engines with `npm run test:browsers:install`.

These are desktop-hosted browser engine tests with touch emulation. They do not reproduce the exact physical Android/iPhone GPU or prove that every device-specific blackout is resolved. The final confirmation is replaying the same room on the affected devices after deployment.

Relevant primary references: [WebKit backdrop-filter rendering passes](https://webkit.org/blog/3632/introducing-backdrop-filters/), [WebKit iOS backdrop-filter/page-scale image failure](https://bugs.webkit.org/show_bug.cgi?id=295653), [CSS paint containment semantics](https://www.w3.org/TR/css-contain-1/#paint-containment).
