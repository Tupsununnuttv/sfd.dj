/**
 * The red numbers in the menu (friend requests, unread whispers) are read with every page. When something changes them without a new page (a request answered,
 * a whisper read), call this: the menu of this window reads them again, and so does the menu of the room around this page when it is shown in the room's
 * overlay (an iframe, which the menu cannot see into).
 */
export const COUNTS_EVENT = 'sfd:counts';

export const refreshCounts = () => {
    window.dispatchEvent(new CustomEvent(COUNTS_EVENT));
    if (window.parent !== window) window.parent.dispatchEvent(new CustomEvent(COUNTS_EVENT));
};
