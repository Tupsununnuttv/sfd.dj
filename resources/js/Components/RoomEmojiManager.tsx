import { RoomEmojiData } from '@/Components/ChatPanel';
import { router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

const field = 'rounded border-neutral-700 bg-neutral-900 text-sm text-white placeholder-neutral-500 focus:border-violet-500 focus:ring-0';

/** Add and remove a room's custom emojis (typed in chat as :name:). */
export default function RoomEmojiManager({ slug, emojis }: { slug: string; emojis: RoomEmojiData[] }) {
    const [name, setName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');

    const add = (e: FormEvent) => {
        e.preventDefault();
        if (!file) return;
        router.post(route('rooms.emojis.store', slug), { name, image: file }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => { setName(''); setFile(null); setError(''); },
            onError: (errs) => setError(errs.name ?? errs.image ?? 'Could not add the emoji.'),
        });
    };

    return (
        <div className="space-y-3 border-t border-neutral-800 pt-4">
            <h3 className="text-sm font-semibold">Room emojis</h3>
            <p className="text-xs text-neutral-500">Small PNG, WEBP or GIF images (100 KB max). People type them as :name: or pick them in chat.</p>

            {emojis.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                    {emojis.map((e) => (
                        <li key={e.id} className="flex items-center gap-2 rounded-lg bg-neutral-800 px-2 py-1 text-xs">
                            <img src={e.url} alt="" className="h-6 w-6 object-contain" />
                            :{e.name}:
                            <button onClick={() => router.delete(route('rooms.emojis.destroy', [slug, e.id]), { preserveScroll: true })} className="text-neutral-500 hover:text-red-400" aria-label={`Delete ${e.name}`}>✕</button>
                        </li>
                    ))}
                </ul>
            )}

            <form onSubmit={add} className="flex flex-wrap items-center gap-2">
                <input value={name} onChange={(e) => setName(e.target.value.toLowerCase())} placeholder="name" maxLength={20} className={`${field} w-28`} />
                <input type="file" accept="image/png,image/webp,image/gif" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="max-w-[12rem] text-xs text-neutral-400" />
                <button disabled={!name || !file} className="rounded bg-violet-600 px-3 py-1.5 text-xs font-semibold hover:bg-violet-500 disabled:opacity-50">Add emoji</button>
            </form>
            {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
    );
}
