import { fieldClass, ghostBtn, primaryBtn } from '@/Components/ui';
import { LIVE_SITES, LiveInfo } from '@/lib/live';
import { post, send } from '@/lib/post';
import { ago } from '@/lib/time';
import { RadioTower } from 'lucide-react';
import { FormEvent, useState } from 'react';

/**
 * Go live in a room, or look after the stream that is on: paste the link of a YouTube, Twitch, Kick or TikTok LIVE stream, give it a title, and the room's big screen shows it
 * (the DJs wait). The room and the Live streams page hear of it by themselves, so there is nothing to refresh here.
 */
export default function LiveControls({ slug, live }: { slug: string; live: LiveInfo | null }) {
    const [url, setUrl] = useState('');
    const [title, setTitle] = useState(live?.title ?? '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const run = (job: Promise<unknown>) => {
        setBusy(true);
        setError('');
        job.catch((e: Error) => setError(e.message)).finally(() => setBusy(false));
    };
    const start = (e: FormEvent) => {
        e.preventDefault();
        run(post(route('rooms.live.start', slug), { url: url.trim(), title: title.trim() || null }).then(() => setUrl('')));
    };
    const stop = () => confirm('End the live stream? The big screen goes back to the DJs.') && run(send('DELETE', route('rooms.live.end', slug)));

    return (
        <div className="space-y-4" data-live-controls>
            {live && (
                <div className="flex gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                    {live.thumbnail && <img src={live.thumbnail} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="hidden aspect-video w-32 shrink-0 rounded-lg object-cover sm:block" />}
                    <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-sm font-bold"><span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">Live</span><span className="truncate">{live.title}</span></p>
                        <p className="mt-1 text-xs text-neutral-300">On {LIVE_SITES[live.kind]} · started {ago(live.started_at)}{live.by && <> · by {live.by.name}</>}</p>
                        <button onClick={stop} disabled={busy} className="mt-3 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50">End the stream</button>
                    </div>
                </div>
            )}

            <form onSubmit={start} className="space-y-3">
                <div>
                    <label htmlFor="live-url" className="mb-1.5 block text-sm font-medium text-neutral-300">{live ? 'Switch to another stream' : 'Link of your live stream'}</label>
                    <input id="live-url" value={url} onChange={(e) => setUrl(e.target.value)} maxLength={300} placeholder="https://www.twitch.tv/yourname" autoComplete="off" className={fieldClass} />
                    <p className="mt-1.5 text-xs text-neutral-500">YouTube: the address of the live video (youtube.com/watch?v=… or youtube.com/live/…). Twitch: twitch.tv/yourname. Kick: kick.com/yourname. TikTok: tiktok.com/@yourname/live (opens on TikTok).</p>
                </div>
                <div>
                    <label htmlFor="live-title" className="mb-1.5 block text-sm font-medium text-neutral-300">Title <span className="font-normal text-neutral-500">(optional)</span></label>
                    <input id="live-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Friday night live set" className={fieldClass} />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button disabled={busy || !url.trim()} className={`${live ? ghostBtn : primaryBtn} flex items-center gap-2`}><RadioTower size={16} /> {live ? 'Switch stream' : 'Go live'}</button>
            </form>

            <ol className="list-decimal space-y-1 pl-5 text-xs leading-relaxed text-neutral-400">
                <li>Start your stream where you always do: from OBS or your phone to YouTube, Twitch, Kick or TikTok LIVE. Only music? A still picture as the video is fine.</li>
                <li>Paste its link here and press Go live. YouTube, Twitch and Kick play on the room screen. TikTok LIVE shows a link to watch on TikTok in a new tab. The room chat stays available.</li>
                <li>The songs of the DJs wait while the stream is on. End it here (or the host can) and they go on where they stopped.</li>
            </ol>
        </div>
    );
}
