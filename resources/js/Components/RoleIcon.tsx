import type { LucideIcon } from 'lucide-react';
import { AudioWaveform, BadgeCheck, Bot, ChevronsUp, ChevronUp, Clapperboard, CodeXml, Crown, Disc3, Gavel, Gem, Handshake, Heart, Languages, LifeBuoy, Megaphone, MicVocal, Rocket, ShieldCheck, ShieldPlus, Sparkles, Tag, User, Zap } from 'lucide-react';

/** The icon of every site role (App\Enums\Role), and of bots. */
const SITE: Record<string, LucideIcon> = {
    owner: Sparkles,
    developer: CodeXml,
    admin: Zap,
    lead_moderator: ShieldPlus,
    brand_ambassador: BadgeCheck,
    moderator: ShieldCheck,
    site_moderator: Gavel,
    helper: LifeBuoy,
    promoter: Megaphone,
    translator: Languages,
    content_provider: Clapperboard,
    music_producer: AudioWaveform,
    artist: MicVocal,
    partnership: Handshake,
    vip: Gem,
    early_supporter: Rocket,
    supporter: Heart,
    member: User,
    bot: Bot,
    // the six subscription roles
    premium: Gem,
    pro: Gem,
    plus: Gem,
    gold: Gem,
    silver: Gem,
    bronze: Gem,
};

/** Drawn solid instead of as a line: the host's crown and the gems of the subscription roles (in the colour of the plan). */
const SOLID = new Set(['host', 'premium', 'pro', 'plus', 'gold', 'silver', 'bronze']);

/** The host and the four roles every room has (their names cannot be changed); a role a host made gets a tag. */
const ROOM: Record<string, LucideIcon> = { Host: Crown, 'Co-Host': Crown, Manager: ChevronsUp, Bouncer: ChevronUp, 'Resident DJ': Disc3 };

interface Role { key: string; label: string; color: string }

/** The line icon of a site or room role. The host's crown is filled, the co-host's is not; the gems of the subscription roles are filled too. */
export function RoleGlyph({ role, size = 12 }: { role: Role; size?: number }) {
    const Icon = SITE[role.key] ?? ROOM[role.label] ?? Tag;

    return <Icon size={size} strokeWidth={2.4} fill={SOLID.has(role.key) ? 'currentColor' : 'none'} aria-hidden className="shrink-0" />;
}

/** A role as a small tile: its icon in its colour on a tinted square with a border of the same colour. The name shows on hover. */
export default function RoleIcon({ role, size = 18 }: { role: Role; size?: number }) {
    return (
        <span
            title={role.label}
            data-role-icon={role.key}
            className="inline-flex shrink-0 cursor-default items-center justify-center rounded-[5px] border"
            style={{ width: size, height: size, color: role.color, borderColor: `${role.color}73`, backgroundColor: `${role.color}24` }}
        >
            <RoleGlyph role={role} size={Math.round(size * 0.64)} />
        </span>
    );
}
