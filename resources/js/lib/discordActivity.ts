/**
 * True when Discord opened this page as an Activity. Discord loads the site in an iframe through its proxy and puts frame_id in the address;
 * the SDK needs it too, and its constructor throws without it, so the SDK is only started when this is true.
 */
export const discordActivity = typeof window !== 'undefined' && window.self !== window.top && new URLSearchParams(window.location.search).has('frame_id');
