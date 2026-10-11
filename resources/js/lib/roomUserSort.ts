import type { RoleInfo } from '@/types';

export interface RoomSortableUser {
    id: number;
    name: string;
    username?: string | null;
    is_bot?: boolean;
    role: RoleInfo;
    badges?: RoleInfo[];
}

export function roomUserWeight(user: RoomSortableUser, roleOrder: readonly string[]): number {
    if (user.is_bot) return roleOrder.length + 1;

    const weights = [user.role.key, ...(user.badges ?? []).map((badge) => badge.key)]
        .map((key) => roleOrder.indexOf(key))
        .filter((rank) => rank >= 0)
        .map((rank) => rank + 1);

    return weights.length > 0 ? Math.min(...weights) : roleOrder.length;
}

export function sortRoomUsersByWeight<T extends RoomSortableUser>(users: readonly T[], roleOrder: readonly string[]): T[] {
    return [...users].sort((a, b) => {
        const weightDifference = roomUserWeight(a, roleOrder) - roomUserWeight(b, roleOrder);
        if (weightDifference !== 0) return weightDifference;

        const usernameDifference = (a.username ?? a.name).localeCompare(b.username ?? b.name, undefined, { sensitivity: 'base' });
        return usernameDifference || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.id - b.id;
    });
}
