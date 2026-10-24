import type { Cosmetics } from '@/lib/cosmetics';
import { perk } from '@/lib/subscriptionStyle';
import type { RoleInfo } from '@/types';
import RoleBadge from '@/Components/RoleBadge';

export default function SubscriptionShowcase({ cosmetics, badges = [] }: { cosmetics?: Cosmetics | null; badges?: RoleInfo[] }) {
    const style = cosmetics?.subscription;
    const selected = perk(style, 'badges').split(',').map((key) => key.trim());
    const shown = badges.filter((badge) => selected.includes(badge.key));
    const music = perk(style, 'music').split(/\r?\n/).filter((url) => /^https:\/\/(www\.)?(youtube\.com|youtu\.be|soundcloud\.com|open\.spotify\.com)\//.test(url));
    if (!shown.length && !music.length) return null;
    return <section className="space-y-4 rounded-xl border border-white/10 bg-white/4 p-4" aria-label="Profile showcase">
        {shown.length > 0 && <div><h3 className="mb-2 text-sm font-semibold">Badge showcase</h3><div className="flex flex-wrap gap-2">{shown.map((badge) => <RoleBadge key={badge.key} role={badge} showMember />)}</div></div>}
        {music.length > 0 && <div><h3 className="mb-2 text-sm font-semibold">Music showcase</h3><ul className="space-y-2">{music.map((url, index) => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer" className="block truncate text-sm text-violet-300 hover:underline">♫ {index + 1}. {url}</a></li>)}</ul></div>}
    </section>;
}
