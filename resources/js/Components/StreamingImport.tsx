import { Download, ExternalLink, Loader2, X } from 'lucide-react';
import { FormEvent } from 'react';

export type ImportProvider = '' | 'youtube' | 'spotify' | 'soundcloud';
const providers: { key: ImportProvider; name: string; icon: string; color: string; hint: string; placeholder: string }[] = [
    { key: 'youtube', name: 'YouTube', icon: 'YT', color: 'text-red-300 bg-red-500/10', hint: 'Import a video or a playlist, including YouTube Music links. Up to 1,000 tracks per import.', placeholder: 'https://www.youtube.com/playlist?list=…' },
    { key: 'spotify', name: 'Spotify', icon: 'SP', color: 'text-emerald-300 bg-emerald-500/10', hint: 'Import a track, album or public playlist. Spotify tracks are matched to YouTube, so versions can differ. Public lists may be limited to the first 100 tracks.', placeholder: 'https://open.spotify.com/playlist/…' },
    { key: 'soundcloud', name: 'SoundCloud', icon: 'SC', color: 'text-orange-300 bg-orange-500/10', hint: 'Import individual SoundCloud tracks, one link per line. SoundCloud sets are not supported yet.', placeholder: 'https://soundcloud.com/artist/track' },
    { key: '', name: 'Mixed links', icon: '+', color: 'text-violet-300 bg-violet-500/10', hint: 'Paste links from any of these services, one per line. Existing tracks are skipped; your playlist is kept.', placeholder: 'https://www.youtube.com/watch?v=…\nhttps://open.spotify.com/track/…\nhttps://soundcloud.com/artist/track' },
];

export default function StreamingImport({ provider, onProvider, text, onText, busy, errors, onSubmit, onClose }: { provider: ImportProvider; onProvider: (p: ImportProvider) => void; text: string; onText: (s: string) => void; busy: boolean; errors: string[]; onSubmit: (e: FormEvent) => void; onClose: () => void }) {
    const chosen = providers.find((p) => p.key === provider)!;
    return <form onSubmit={onSubmit} className="mt-3 space-y-4 rounded-2xl border border-violet-400/20 bg-linear-to-br from-violet-500/10 to-black/25 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-sm font-bold"><Download size={16} className="text-violet-300" /> Import via streaming</h3><button type="button" onClick={onClose} disabled={busy} aria-label="Close streaming import" className="text-neutral-500 hover:text-white"><X size={16} /></button></div>
        <fieldset disabled={busy} className="space-y-3 disabled:opacity-60">
            <legend className="sr-only">Streaming service</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{providers.map((p) => <button key={p.key} type="button" aria-pressed={provider === p.key} onClick={() => onProvider(p.key)} className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-semibold transition ${provider === p.key ? 'border-violet-400/60 bg-white/8 text-white' : 'border-white/10 text-neutral-400 hover:bg-white/5'}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] ${p.color}`}>{p.icon}</span>{p.name}</button>)}</div>
            <p className="text-xs leading-relaxed text-neutral-400">{chosen.hint}</p>
            <label className="block text-xs font-medium text-neutral-300">Track or playlist links<textarea aria-label="Streaming links" value={text} onChange={(e) => onText(e.target.value)} maxLength={100000} rows={3} placeholder={chosen.placeholder} className="mt-2 w-full rounded-xl border-white/10 bg-black/30 font-mono text-xs text-neutral-100 placeholder-neutral-600 focus:border-violet-400 focus:ring-violet-500/30" /></label>
            <div className="flex flex-wrap items-center justify-between gap-3"><button disabled={!text.trim()} className="flex items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40">{busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}{busy ? 'Importing tracks…' : 'Import into this playlist'}</button><a href={route('settings.connections')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-violet-300 hover:underline">Connected accounts <ExternalLink size={12} /></a></div>
        </fieldset>
        {errors.length > 0 && <ul role="alert" className="max-h-32 space-y-1 overflow-y-auto text-xs text-amber-300">{errors.map((error, i) => <li key={i}>{error}</li>)}</ul>}
    </form>;
}
