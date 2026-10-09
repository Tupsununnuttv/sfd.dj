/**
 * True when this page is shown inside the "page overlay" of a room (an iframe). Inside it the page hides its own
 * menu, so Docs, My Stuff, Admin panel ... can be read while the room, and its music, keeps running underneath.
 */
export const embedded = typeof window !== 'undefined' && window.self !== window.top;
