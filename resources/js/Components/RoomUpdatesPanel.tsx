import { getJson } from '@/lib/post';
import { formatDateTime } from '@/lib/regional';
import type { RoomReleaseState } from '@/lib/roomReleases';
import { useEffect, useState } from 'react';

export default function RoomUpdatesPanel({ slug }: { slug: string }) {
    const [releases, setReleases] = useState<RoomReleaseState | null>(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        let active = true;
        void getJson<RoomReleaseState>(route('rooms.updates', slug)).then(data => { if (active) setReleases(data); }).catch(() => { if (active) setFailed(true); });
        return () => { active = false; };
    }, [slug]);
    return <div className="space-y-4">
        {failed ? <p role="alert" className="text-sm text-amber-200">These updates are not available in this room yet.</p>
            : !releases ? <p className="text-sm text-neutral-400">Loading...</p> : <>
                {releases.early_access && <p className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-3 text-sm text-fuchsia-200">{`New room features ${releases.early_days} days early.`}</p>}
                {releases.updates.map(update => <article key={update.key} className="space-y-2 rounded-xl border border-white/10 bg-white/3 p-4" data-feature={update.key}>
                    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{update.title}</h3><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${update.phase === 'early' ? 'bg-fuchsia-500/20 text-fuchsia-200' : 'bg-emerald-500/15 text-emerald-200'}`}>{update.phase === 'early' ? 'Available early' : 'Available to all rooms'}</span></div>
                    <p className="text-sm leading-relaxed text-neutral-300">{update.description}</p>
                    {update.public_at && <p className="text-xs text-neutral-500">Public release: <time dateTime={update.public_at}>{formatDateTime(update.public_at)}</time></p>}
                </article>)}
            </>}
    </div>;
}
