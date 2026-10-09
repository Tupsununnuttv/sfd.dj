import type { LucideIcon } from 'lucide-react';
import { AudioWaveform, BadgeCheck, Bot, ChevronsUp, ChevronUp, Clapperboard, CodeXml, Crown, Disc3, FlaskConical, Gavel, Gem, Handshake, Heart, Languages, LifeBuoy, Megaphone, MicVocal, Rocket, ShieldCheck, ShieldPlus, Sparkles, Tag, User, Zap } from 'lucide-react';

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
    beta_tester: FlaskConical,
    supporter: Heart,
    member: User,
    bot: Bot,
    'sub:plus': Gem, // the paid plans: a solid gem in the colour of the plan
    'sub:premium': Gem,
};

/** The host and the four roles every room has (their names cannot be changed); a role a host made gets a tag. */
const ROOM: Record<string, LucideIcon> = { Host: Crown, 'Co-Host': Crown, Manager: ChevronsUp, Bouncer: ChevronUp, 'Resident DJ': Disc3 };

interface Role { key: string; label: string; color: string }

/** The line icon of a site or room role. The host's crown is filled, the co-host's is not, and so are the gems of Plus and Premium. */
export function RoleGlyph({ role, size = 12 }: { role: Role; size?: number }) {
    const Icon = SITE[role.key] ?? ROOM[role.label] ?? Tag;

    return <Icon size={size} strokeWidth={2.4} fill={role.key === 'host' || role.key.startsWith('sub:') ? 'currentColor' : 'none'} aria-hidden className="shrink-0" />;
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
