import Avatar from '@/Components/Avatar';
import UserRestrictionActions from '@/Components/UserRestrictionActions';
import { SettingsSection } from '@/Components/ui';
import { getJson } from '@/lib/post';
import { useUserRestrictions } from '@/lib/userRestrictions';
import { useEffect, useState } from 'react';

interface Entry { user: { id: number; name: string; username: string; avatar: string | null }; blocked: boolean; ignored: boolean }
export default function RestrictedUsers() {
    const { state } = useUserRestrictions();
    const [people, setPeople] = useState<Entry[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        let active = true;
        getJson<{ people: Entry[] }>(route('api.user-restrictions.index')).then((result) => {
            if (active) { setPeople(result.people); setLoaded(true); setError(''); }
        }).catch(() => { if (active) setError('Could not load blocked and ignored users. Refresh to try again.'); });
        return () => { active = false; };
    }, [state]);
    return <SettingsSection title="Blocked and ignored users" text="Ignore hides their chat and Whisper messages. Block also prevents Whispers, calls, friend requests and group invitations between you. Your choices are private and can be undone.">
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        {!loaded && !error && <p className="text-sm text-neutral-500">Loading…</p>}
        {loaded && people.length === 0 && <p className="text-sm text-neutral-500">No blocked or ignored users. Open a person's profile or room user card to add them.</p>}
        <div className="space-y-3">{people.map(({ user, blocked, ignored }) => <div key={user.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <Avatar name={user.name} avatar={user.avatar} className="h-9 w-9" />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user.name}</p><p className="text-xs text-neutral-500">{[blocked && 'Blocked', ignored && 'Ignored'].filter(Boolean).join(' · ')}</p></div>
            <div className="w-full sm:w-60"><UserRestrictionActions userId={user.id} name={user.name} /></div>
        </div>)}</div>
    </SettingsSection>;
}
