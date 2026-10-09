import { RoleGlyph } from '@/Components/RoleIcon';
import { RoleInfo } from '@/types';

/** Coloured pill with the role's icon and name. Members get no badge unless `showMember` is set. */
export default function RoleBadge({ role, showMember = false }: { role: RoleInfo; showMember?: boolean }) {
    if (role.key === 'member' && !showMember) return null;

    return (
        <span
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide"
            style={{ color: role.color, backgroundColor: `${role.color}26` }}
        >
            <RoleGlyph role={role} size={10} />
            {role.label}
        </span>
    );
}
