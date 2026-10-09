import Avatar from '@/Components/Avatar';
import Badges from '@/Components/Badges';
import Flag from '@/Components/Flag';
import { ProgressBar } from '@/Components/ui';
import type { CardUser } from '@/Components/UserCard';
import { levelPercent } from '@/lib/level';
import { useProfile } from '@/lib/profileCache';

/**
 * The short preview that appears when the mouse rests on a name or picture in chat. It cannot be clicked
 * (so it never gets in the way); clicking the name opens the full quick-profile card.
 */
export default function PeekCard({ user, anchor }: { user: CardUser; anchor: DOMRect }) {
    const { profile } = useProfile(user.id);
    const width = 272;
    const left = Math.max(8, Math.min(anchor.left - width - 8 > 8 ? anchor.left - width - 8 : anchor.left, window.innerWidth - width - 8));
    const top = Math.max(8, Math.min(anchor.top - 8, window.innerHeight - 270));
    const level = profile?.level ?? user.level ?? 1;
    const s = profile?.stats;

    return (
        <div aria-hidden className="pointer-events-none fixed z-[55] animate-menu overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/95 shadow-2xl shadow-black/60 backdrop-blur-md" style={{ left, top, width }}>
            <div className="flex items-center gap-3 bg-gradient-to-br from-violet-600/30 via-fuchsia-600/15 to-transparent p-3">
                <Avatar name={user.name} avatar={user.avatar} cosmetics={user.cosmetics} className="h-12 w-12 text-2xl" />
                <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-bold" style={{ color: user.role.color }}>
                        {!!user.badges?.length && <Badges badges={user.badges} />}
                        <span className="truncate">{user.name}</span>
                        <Flag flag={profile?.flag ?? user.flag} className="h-3" />
                    </p>
                    <p className="truncate text-xs text-neutral-400">{user.role.label}{profile?.pronouns && ` · ${profile.pronouns}`}{profile?.favorite_genre && ` · ${profile.favorite_genre}`}</p>
                </div>
            </div>

            <div className="space-y-2 px-3 pb-2.5 pt-2">
                <div>
                    <div className="mb-1 flex justify-between text-[11px] text-neutral-400"><span className="font-semibold text-neutral-200">Level {level}</span>{s && <span className="tabular-nums">{s.xp.toLocaleString()} XP</span>}</div>
                    <ProgressBar value={s ? levelPercent(s.xp, level) : 0} className="h-1.5" />
                </div>
                {profile?.bio && <p className="line-clamp-2 break-words text-xs italic text-neutral-300">“{profile.bio}”</p>}
                <div className={`grid grid-cols-3 gap-1.5 text-center ${profile ? '' : 'animate-pulse'}`}>
                    {([['Songs', s?.songs_played], ['Woots', s?.woots], ['Friends', s?.friends]] as const).map(([label, value]) => (
                        <div key={label} className="rounded-lg bg-white/5 py-1.5">
                            <p className="text-sm font-bold tabular-nums">{value ?? '–'}</p>
                            <p className="text-[10px] text-neutral-500">{label}</p>
                        </div>
                    ))}
                </div>
            </div>
            <p className="border-t border-white/5 py-1.5 text-center text-[10px] text-neutral-500">Click the name for more</p>
        </div>
    );
}
