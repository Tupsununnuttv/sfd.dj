import type { RoomGuest } from '@/lib/roomGuests';
import { Eye } from 'lucide-react';

export default function RoomGuestList({ guests, search }: { guests: RoomGuest[]; search: string }) {
    const shown = guests.filter(guest => guest.name.toLowerCase().includes(search.trim().toLowerCase()));
    if (!shown.length) return null;
    return <section className="sfd-usersgroup mb-3" data-role-group="Guests">
        <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-neutral-400"><Eye size={14} /> Guests ({shown.length})</h3>
        <ul className="space-y-1.5">{shown.map(guest => <li key={guest.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 p-3" data-guest-id={guest.id}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-neutral-400"><Eye size={18} /></span>
            <div><p className="text-sm font-semibold text-neutral-200" translate="no">{guest.name}</p><p className="mt-1 text-[11px] text-neutral-400">Guest · Watching without an account</p></div>
        </li>)}</ul>
    </section>;
}
