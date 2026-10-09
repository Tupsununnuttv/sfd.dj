import RoleIcon from '@/Components/RoleIcon';
import { AwardBadge, ShopBadge } from '@/lib/cosmetics';
import { RoleInfo } from '@/types';

/** Level pill colour: grows more special every 10 levels. */
const tier = (level: number) =>
    level >= 30 ? 'bg-fuchsia-500/20 text-fuchsia-300' : level >= 20 ? 'bg-amber-400/20 text-amber-300' : level >= 10 ? 'bg-sky-400/20 text-sky-300' : 'bg-neutral-700/60 text-neutral-300';

/**
 * Small badges shown in front of a name: one icon per role the person holds (highest first), the special badges staff gave them (Beta Tester ...),
 * the badge they wear from the shop, then their level. Only the first `awards` special badges are drawn, the rest is a "+2" with their names on it.
 */
export default function Badges({ badges = [], level, awards = 3 }: { badges?: RoleInfo[]; level?: number; awards?: number }) {
    const all = badges.filter((b) => b.icon || b.key.startsWith('shop:') || b.key.startsWith('award:'));
    const hidden = all.filter((b) => b.key.startsWith('award:')).slice(awards);

    return (
        <span className="inline-flex items-center gap-1 align-middle">
            {all.filter((b) => !hidden.includes(b)).map((b) => (
                b.key.startsWith('shop:')
                    ? <span key={b.key} title={b.label} className="inline-flex cursor-default"><ShopBadge name={b.key.slice(5)} className="h-[18px] w-[18px]" /></span>
                    : b.key.startsWith('award:')
                        ? <span key={b.key} title={b.text ? `${b.label}: ${b.text}` : b.label} className="inline-flex cursor-default"><AwardBadge name={b.key.slice(6)} className="h-[18px] w-[18px]" /></span>
                        : <RoleIcon key={b.key} role={b} />
            ))}
            {hidden.length > 0 && <span title={hidden.map((b) => b.label).join(', ')} className="cursor-default rounded bg-white/10 px-1 py-0.5 text-[9px] font-bold leading-none text-neutral-300">+{hidden.length}</span>}
            {level !== undefined && (
                <span title={`Level ${level}`} className={`rounded px-1 py-0.5 text-[9px] font-bold leading-none ${tier(level)}`}>
                    Lv {level}
                </span>
            )}
        </span>
    );
}
