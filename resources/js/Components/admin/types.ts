import { RoleInfo } from '@/types';

export type RoleMeta = RoleInfo & { rank: number; group: string };
export type RoleGroups = Record<string, { icon: string; label: string }>;

export interface AdminUser {
    id: number;
    name: string;
    username: string | null;
    email: string;
    avatar: string | null;
    roles: string[] | null;
    xp: number;
    level: number;
    primary_role: RoleInfo;
    badges: RoleInfo[];
    awards: string[];
    plan: string | null; // bronze, silver, gold, plus, pro or premium
    plan_until: string | null; // null with a plan: for good
    plan_paid: boolean; // bought through Stripe: Stripe runs it
    email_verified: boolean;
    is_bot: boolean;
    editable: boolean;
    outranked: boolean;
    violations: number;
    joined: string;
    last_seen_at: string | null;
}

export interface AdminRoom {
    id: number;
    name: string;
    slug: string;
    badges: string[] | null;
    genre: string | null;
    is_private: boolean;
    is_featured: boolean;
    early_access: boolean;
    items_count: number;
    created_at: string;
    user: { name: string };
}

export interface Day { day: string; n: number }

export interface Overview {
    kpis: { online: number; listening: number | null; active_24h: number; new_7d: number; messages_24h: number; songs_24h: number; bots: number; violations_7d: number };
    series: { users: Day[]; messages: Day[]; songs: Day[] };
    recentUsers: { id: number; name: string; avatar: string | null; is_bot: boolean; joined: string }[];
    recentViolations: { id: number; user: string | null; by: string | null; reason: string; at: string }[];
    recentModeration: { id: number; action: string; actor: string | null; target: string | null; room: { name: string; slug: string } | null; at: string }[];
    health: [string, 'ok' | 'warn' | 'off', string][];
}

export interface AdminProps {
    q: string;
    filters: { role: string | null; type: string | null; sort: string };
    stats: { accounts: number; bots: number; online: number; updated_at: string; users: number; rooms: number; messages: number; songs_played: number };
    overview: Overview;
    users: { total: number; from: number | null; to: number | null; data: AdminUser[]; next_page_url: string | null; prev_page_url: string | null };
    roleGroups: RoleGroups;
    awardList: { key: string; label: string; text: string; color: string }[];
    planList: { key: string; name: string; color: string }[];
    roleOptions: RoleMeta[];
    rooms: AdminRoom[];
    roomReleases: import('@/lib/roomReleases').RoomFeatureRelease[];
    counts: Record<number, number>;
    openTickets: number;
    assignable: RoleMeta[];
    matrix: { roles: RoleMeta[]; permissions: Record<string, string>; granted: Record<string, string[]>; editable: boolean };
    announcements: { id: number; message: string; level: string; created_at: string }[];
    ipBans: { id: number; ip: string; reason: string | null; created_at: string }[];
    maintenance: boolean;
    email: {
        mailer: string;
        host: string | null;
        port: number | null;
        login_set: boolean;
        from: string;
        configured: boolean; // the site can really send email
        choice: 'required' | 'optional'; // what staff chose
        enforced: boolean; // what is true now: "required" only counts while the site can send email
        unverified: number;
        test: { ok: boolean; message: string; to: string; configured: boolean } | null;
    } | null; // only for those who may open the Email tab
    myIp: string;
}
