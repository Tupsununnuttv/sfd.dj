/** How somebody shows themselves. The keys are the ones in App\Models\User::STATUSES. */
export type Status = 'online' | 'busy' | 'away' | 'offline';

export const STATUS: Record<Status, { label: string; dot: string; text: string; hint: string }> = {
    online: { label: 'Online', dot: 'bg-green-400', text: 'text-green-400', hint: 'Around, and happy to chat.' },
    busy: { label: 'Busy', dot: 'bg-red-500', text: 'text-red-400', hint: 'Do not disturb: no pop-ups for whispers and friend requests.' },
    away: { label: 'Away', dot: 'bg-amber-400', text: 'text-amber-300', hint: 'Not at the computer right now.' },
    offline: { label: 'Offline', dot: 'bg-neutral-500', text: 'text-neutral-400', hint: 'You look offline to everybody. You can still use SFD.DJ.' },
};

export const STATUSES = Object.keys(STATUS) as Status[];

/** Something the server sent that might not be a status (an old page, a bot): online. */
export const statusOf = (value?: string | null): Status => (value && value in STATUS ? (value as Status) : 'online');
