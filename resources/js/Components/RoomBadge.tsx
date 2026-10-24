/** The badges staff give a room. A room can have any of them at once; they always show in this order. */
export const roomBadges: Record<string, { glyph: string; name: string; className: string }> = {
    official: { glyph: '◆', name: 'Official', className: 'bg-violet-500/25 text-violet-200' },
    verified: { glyph: '✓', name: 'Verified', className: 'bg-sky-500/20 text-sky-300' },
    partnered: { glyph: '★', name: 'Partnered', className: 'bg-amber-500/20 text-amber-300' },
};

export const roomBadgeKeys = Object.keys(roomBadges);

/** compact: only the symbol of each badge (the name is in the tooltip), for the room bar where there is little space. */
export default function RoomBadge({ badges, compact = false, earlyAccess = false }: { badges?: string[] | null; compact?: boolean; earlyAccess?: boolean }) {
    const shown = roomBadgeKeys.filter((k) => badges?.includes(k));

    return shown.length > 0 || earlyAccess ? (
        <span className="inline-flex shrink-0 items-center gap-1">
            {shown.map((k) => (
                <span key={k} title={`${roomBadges[k].name} room`} className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none ${roomBadges[k].className}`}>
                    {compact ? roomBadges[k].glyph : `${roomBadges[k].glyph} ${roomBadges[k].name}`}
                </span>
            ))}
            {earlyAccess && <span title="Early access to new room features" className="whitespace-nowrap rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-fuchsia-200">{compact ? '✦' : 'Early access'}</span>}
        </span>
    ) : null;
}
