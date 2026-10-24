import { Card, fieldClass, primaryBtn } from '@/Components/ui';
import { formatDateTime } from '@/lib/regional';
import type { RoomFeatureRelease } from '@/lib/roomReleases';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

const localDate = (value: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
function Release({ release }: { release: RoomFeatureRelease }) {
    const form = useForm({ enabled: release.enabled, preview_at: localDate(release.preview_at), early_days: release.early_days });
    const [saved, setSaved] = useState(false);
    return <form data-release={release.key} className="space-y-3 border-t border-white/10 pt-4" onSubmit={event => {
        event.preventDefault(); setSaved(false);
        form.transform(data => ({ ...data, preview_at: data.preview_at ? new Date(data.preview_at).toISOString() : null }));
        form.put(route('admin.room-releases.update', release.key), { preserveScroll: true, onSuccess: () => setSaved(true) });
    }}>
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-semibold">{release.title}</h4><p className="mt-1 text-xs text-neutral-400">{release.description}</p></div><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.data.enabled} disabled={form.processing} onChange={event => form.setData('enabled', event.target.checked)} className="rounded border-neutral-600 bg-neutral-800 text-fuchsia-500" /> Release enabled</label></div>
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_9rem_auto]">
            <label className="text-xs text-neutral-400">Preview starts<input type="datetime-local" required={form.data.enabled} disabled={form.processing} value={form.data.preview_at} onChange={event => form.setData('preview_at', event.target.value)} className={`${fieldClass} mt-1 [color-scheme:dark]`} /></label>
            <label className="text-xs text-neutral-400">Days early<input type="number" min={1} max={30} required disabled={form.processing} value={form.data.early_days} onChange={event => form.setData('early_days', Number(event.target.value))} className={`${fieldClass} mt-1`} /></label>
            <button type="submit" disabled={form.processing} className={primaryBtn}>{form.processing ? 'Saving…' : 'Save schedule'}</button>
        </div>
        {release.public_at && <p className="text-xs text-neutral-500">Public release: {formatDateTime(release.public_at)}</p>}
        {Object.entries(form.errors).map(([key, error]) => <p role="alert" key={key} className="text-xs text-red-300">{error}</p>)}
        {saved && <p role="status" className="text-xs text-emerald-300">Schedule saved.</p>}
    </form>;
}
export default function RoomReleasesPanel({ releases }: { releases: RoomFeatureRelease[] }) {
    return <Card className="space-y-4 p-5"><div><h3 className="font-bold">Room update releases</h3><p className="mt-1 text-sm text-neutral-400">Verified, partnered or featured rooms receive new features 3 days early.</p></div>{releases.map(release => <Release key={release.key} release={release} />)}</Card>;
}
