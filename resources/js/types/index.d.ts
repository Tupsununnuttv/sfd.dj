import type { FlagInfo } from '@/Components/Flag';
import { Cosmetics } from '@/lib/cosmetics';
import type { Status } from '@/lib/status';

export interface RoleInfo {
    icon?: string;
    key: string;
    label: string;
    color: string;
    text?: string; // what a special badge means
}

export interface Preferences {
    appearance?: { chat_size?: 'small' | 'normal' | 'large'; show_avatars?: boolean; show_badges?: boolean; show_activity?: boolean; always_animate?: boolean; compact?: boolean; compact_chat?: boolean };
    room?: { autowoot?: boolean; compact_layout?: boolean };
    audio?: { default_volume?: number; mute_on_join?: boolean };
    notifications?: { friend_requests?: boolean; announcements?: boolean; whispers?: boolean; mentions?: boolean; desktop?: boolean };
    privacy?: { whispers?: 'everyone' | 'friends' | 'nobody'; friend_requests?: boolean; show_online?: boolean };
}

export interface User {
    id: number;
    name: string; // display name
    username: string;
    email: string;
    email_verified_at?: string;
    avatar: string | null;
    character: string | null;
    bio: string | null;
    favorite_genre: string | null;
    flag: FlagInfo | null;
    pronouns: string | null;
    status: Status;
    cosmetics: Cosmetics | null;
    xp: number;
    level: number;
    primary_role: RoleInfo;
    is_staff: boolean;
    can_moderate: boolean;
    two_factor_enabled: boolean;
    badges: RoleInfo[];
    site_permissions: string[];
    preferences: Preferences | null;
}

export interface Announcement {
    id: number;
    message: string;
    level: 'info' | 'warning';
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User; // guests get a placeholder user (id 0)
        guest: boolean;
        coins: number; // your SFD Coins (0 for a guest)
        limits: { playlists: number; songs: number; emojis: number }; // how many you may have: more with a plan
    };
    // somebody who has not confirmed their email yet: must they, can the site send the message, and what became of the last one; null for everybody else
    verification: { required: boolean; mail: boolean; status: string | null } | null;
    pendingFriends: number;
    pendingSubscriptionGifts: number;
    unreadWhispers: number;
    userRestrictions?: import('@/lib/userRestrictions').UserRestrictionState;
    liveCount: number; // rooms with a live stream on (the number in the menu)
    community: Community;
    siteStats: import('@/lib/useLiveStats').SiteStats | null;
    recoveryCodes?: string[] | null;
};

export interface Community {
    social: Record<string, string>;
    donate: boolean; // can the Donate button take a donation (Stripe is connected, or staff set a donation page)
    donation: { title: string; goal: number; current: number; percent: number; currency: string; url: string } | null;
}
