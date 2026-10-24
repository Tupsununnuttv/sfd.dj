import { Preferences } from '@/types';
import { router } from '@inertiajs/react';
import { SYSTEM_DEFAULTS } from './systemState';
import type { Language } from './languages';

export const defaults = {
    system: SYSTEM_DEFAULTS,
    regional: { language: 'en' as Language, time_format: '24' as '12' | '24' },
    appearance: { chat_size: 'normal' as 'small' | 'normal' | 'large', show_avatars: true, show_badges: true, show_activity: true, always_animate: false, compact: false, compact_chat: false },
    room: { autowoot: false, compact_layout: false },
    audio: { default_volume: 80, mute_on_join: false, entrance_sounds: false },
    notifications: { friend_requests: true, announcements: true, whispers: true, mentions: true, desktop: false },
    privacy: { whispers: 'everyone' as 'everyone' | 'friends' | 'nobody', friend_requests: true, show_online: true },
};

/** The user's saved preferences with defaults filled in. */
export function withDefaults(p: Preferences | null | undefined) {
    return {
        system: { ...defaults.system, ...p?.system },
        regional: { ...defaults.regional, ...p?.regional },
        appearance: { ...defaults.appearance, ...p?.appearance },
        room: { ...defaults.room, ...p?.room },
        audio: { ...defaults.audio, ...p?.audio },
        notifications: { ...defaults.notifications, ...p?.notifications },
        privacy: { ...defaults.privacy, ...p?.privacy },
    };
}

export const savePrefs = (patch: Preferences) =>
    router.patch(route('settings.preferences'), patch as never, {
        preserveScroll: true,
        onSuccess: () => {
            // Settings can be opened inside a room overlay: update that room's personal layout too.
            if (window.parent !== window) window.parent.postMessage({ type: 'sfd:preferences-updated' }, window.location.origin);
        },
    });
