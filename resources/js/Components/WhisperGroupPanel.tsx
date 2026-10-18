import Avatar from '@/Components/Avatar';
import Checkbox from '@/Components/Checkbox';
import { fieldClass, ghostBtn, primaryBtn } from '@/Components/ui';
import type { Group, Person } from '@/Components/WhisperBox';
import { getJson, send, sendJson } from '@/lib/post';
import { Crown, LogOut, Trash2, UserPlus, UsersRound, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

/** How many people a group holds, the owner too (the server enforces it: App\Models\WhisperGroup::MAX_MEMBERS). */
export const MAX_MEMBERS = 20;

/** A group has no picture of its own: a round badge. */
export function GroupAvatar({ className = 'h-10 w-10' }: { className?: string }) {
    return <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-fuchsia-500 to-violet-600 text-white ${className}`} aria-hidden><UsersRound className="h-1/2 w-1/2" /></span>;
}

/** Your friends with a box to tick each one. `taken` are already in the group; at most `room` can be ticked. */
function FriendPicker({ taken = [], picked, room, onToggle }: { taken?: number[]; picked: number[]; room: number; onToggle: (id: number) => void }) {
    const [friends, setFriends] = useState<Person[] | null>(null);
    const [find, setFind] = useState('');
    const [error, setError] = useState('');

    useEffect(() => { getJson<Person[]>(route('api.whisper-groups.friends')).then(setFriends).catch((e: Error) => setError(e.message)); }, []);

    const left = (friends ?? []).filter((f) => !taken.includes(f.id));
    const needle = find.trim().toLowerCase();
    const shown = left.filter((f) => !needle || `${f.name} ${f.username}`.toLowerCase().includes(needle));

    if (error) return <p className="text-sm text-red-400">{error}</p>;
    if (friends === null) return <p className="text-sm text-neutral-500">Loading your friends…</p>;
    if (left.length === 0) return <p className="text-sm text-neutral-500">{friends.length === 0 ? 'You have no friends yet. Add some from Friends in the menu, then come back.' : 'All your friends are in this group already.'}</p>;

    return (
        <div className="space-y-2">
            {left.length > 6 && <input value={find} onChange={(e) => setFind(e.target.value)} placeholder="Search your friends" className={fieldClass} />}
            <ul className="max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-white/3 p-1">
                {shown.length === 0 && <li className="p-3 text-center text-sm text-neutral-500">Nobody matches.</li>}
                {shown.map((f) => (
                    <li key={f.id}>
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5">
                            <Checkbox checked={picked.includes(f.id)} disabled={!picked.includes(f.id) && picked.length >= room} onChange={() => onToggle(f.id)} />
                            <Avatar name={f.name} avatar={f.avatar} className="h-8 w-8 text-sm" />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">{f.name}</span>
                                <span className="block truncate text-xs text-neutral-500">@{f.username}</span>
                            </span>
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
}

const toggled = (ids: number[], id: number) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

/** The form for a new group: a name, and which friends go in (you are the owner). `onCreated` gets the group when the server has made it. */
export function NewGroup({ onCreated }: { onCreated: (group: Group) => void }) {
    const [name, setName] = useState('');
    const [picked, setPicked] = useState<number[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const create = (e: FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        sendJson<Group>('POST', route('api.whisper-groups.store'), { name: name.trim(), user_ids: picked })
            .then(onCreated)
            .catch((er: Error) => { setError(er.message); setBusy(false); });
    };

    return (
        <form onSubmit={create} className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
            <div>
                <label htmlFor="whisper-group-name" className="mb-1.5 block text-sm font-medium text-neutral-300">Group name</label>
                <input id="whisper-group-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Night owls" className={fieldClass} />
            </div>
            <div>
                <p className="mb-1.5 text-sm font-medium text-neutral-300">Friends to add <span className="font-normal text-neutral-500">({picked.length} of {MAX_MEMBERS - 1} at most)</span></p>
                <FriendPicker picked={picked} room={MAX_MEMBERS - 1} onToggle={(id) => setPicked((p) => toggled(p, id))} />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button disabled={busy || !name.trim() || picked.length === 0} className={primaryBtn}>Create group</button>
        </form>
    );
}

/**
 * Who is in a group and what the owner can do about it: rename, add friends, take people out. Everybody can leave.
 * `onChanged` gets the group as it is after a change, `onLeft` is called when you have left.
 */
export function GroupInfo({ group, me, onChanged, onLeft }: { group: Group; me: number; onChanged: (group: Group) => void; onLeft: () => void }) {
    const owner = group.owner_id === me;
    const [name, setName] = useState(group.name);
    const [adding, setAdding] = useState<number[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => setName(group.name), [group.name]);

    const run = (job: Promise<unknown>) => {
        setBusy(true);
        setError('');
        return job.catch((e: Error) => setError(e.message)).finally(() => setBusy(false));
    };
    const rename = (e: FormEvent) => {
        e.preventDefault();
        void run(sendJson<Group>('PATCH', route('api.whisper-groups.update', group.id), { name: name.trim() }).then(onChanged));
    };
    const add = () => void run(sendJson<Group>('POST', route('api.whisper-groups.members.add', group.id), { user_ids: adding }).then((g) => { setAdding([]); onChanged(g); }));
    const remove = (p: Person) => confirm(`Take ${p.name} out of ${group.name}?`) && void run(send('DELETE', route('api.whisper-groups.members.remove', [group.id, p.id])).then(() => onChanged({ ...group, members: group.members.filter((m) => m.id !== p.id) })));
    const leave = () => confirm(`Leave ${group.name}? You will not see its whispers any more.`) && void run(send('DELETE', route('api.whisper-groups.members.remove', [group.id, me])).then(onLeft));
    const destroy = () => confirm(`Delete ${group.name} for everyone? All messages and voice recordings will be permanently deleted.`) && void run(send('DELETE', route('api.whisper-groups.destroy', group.id)).then(onLeft));

    const members = [...group.members].sort((a, b) => Number(b.id === group.owner_id) - Number(a.id === group.owner_id));
    const room = MAX_MEMBERS - group.members.length;

    return (
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
            <section>
                <h3 className="mb-1.5 text-sm font-medium text-neutral-300">Name</h3>
                {owner ? (
                    <form onSubmit={rename} className="flex gap-2">
                        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} aria-label="Group name" className={fieldClass} />
                        <button disabled={busy || !name.trim() || name.trim() === group.name} className={ghostBtn}>Save</button>
                    </form>
                ) : <p className="font-semibold">{group.name}</p>}
            </section>

            <section>
                <h3 className="mb-1.5 text-sm font-medium text-neutral-300">People <span className="font-normal text-neutral-500">({group.members.length} of {MAX_MEMBERS})</span></h3>
                <ul className="divide-y divide-white/5 rounded-xl border border-white/10 bg-white/3">
                    {members.map((p) => (
                        <li key={p.id} className="flex items-center gap-3 px-3 py-2">
                            <Avatar name={p.name} avatar={p.avatar} className="h-8 w-8 text-sm" />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">{p.name}{p.id === me && <span className="font-normal text-neutral-500"> (you)</span>}</span>
                                <span className="block truncate text-xs text-neutral-500">@{p.username}</span>
                            </span>
                            {p.id === group.owner_id && <span className="flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300"><Crown size={11} /> Owner</span>}
                            {owner && p.id !== me && <button onClick={() => remove(p)} disabled={busy} aria-label={`Take ${p.name} out`} title="Take out" className="rounded-md p-1.5 text-neutral-500 hover:bg-red-500/15 hover:text-red-300 disabled:opacity-40"><X size={15} /></button>}
                        </li>
                    ))}
                </ul>
            </section>

            {owner && room > 0 && (
                <section>
                    <h3 className="mb-1.5 text-sm font-medium text-neutral-300">Add friends</h3>
                    <FriendPicker taken={group.members.map((p) => p.id)} picked={adding} room={room} onToggle={(id) => setAdding((a) => toggled(a, id))} />
                    {adding.length > 0 && <button onClick={add} disabled={busy} className={`${primaryBtn} mt-3 flex items-center gap-2`}><UserPlus size={15} /> Add {adding.length}</button>}
                </section>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button onClick={leave} disabled={busy} className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"><LogOut size={15} /> Leave group</button>
            {owner && <section className="rounded-xl border border-red-400/20 p-4"><h3 className="text-sm font-semibold text-red-300">Delete group</h3><p className="mt-1 text-xs text-neutral-400">Permanently remove this group, all messages and voice recordings for everyone.</p><button onClick={destroy} disabled={busy} className="mt-3 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"><Trash2 size={15} /> Delete group for everyone</button></section>}
        </div>
    );
}
