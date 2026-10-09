import Avatar from '@/Components/Avatar';
import { PageProps } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';

const SIZE = 256;

/** Crop the picture to a centred square and shrink it, so uploads stay tiny (the server has no image library). */
async function toSquare(file: File): Promise<File> {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    canvas.getContext('2d')!.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);

    const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not read that picture.'))), 'image/webp', 0.85),
    );

    return new File([blob], 'avatar.webp', { type: 'image/webp' });
}

const MAX_ANIMATED = 1024 * 1024;

/** A GIF, an animated WebP or an animated PNG? Those are sent as they are, because shrinking them would stop the loop. */
async function isAnimated(file: File): Promise<boolean> {
    if (file.type === 'image/gif') return true;

    // the markers sit in the first bytes: "ANIM" in a WebP, "acTL" in a PNG
    const head = new TextDecoder('latin1').decode(new Uint8Array(await file.slice(0, 65536).arrayBuffer()));

    return (file.type === 'image/webp' && head.includes('ANIM')) || (file.type === 'image/png' && head.includes('acTL'));
}

/** Change or remove your profile photo: a still picture (cropped to a square) or an animated one that loops. */
export default function AvatarUpload() {
    const { user } = usePage<PageProps>().props.auth;
    const input = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const hasPhoto = user.avatar?.startsWith('img:');

    const pick = async (file?: File) => {
        if (!file) return;
        setError('');
        setBusy(true);
        try {
            const animated = await isAnimated(file);
            if (animated && file.size > MAX_ANIMATED) throw new Error('An animated picture can be at most 1 MB.');
            const photo = animated ? file : await toSquare(file);
            router.post(route('profile.photo'), { photo }, {
                forceFormData: true,
                preserveScroll: true,
                onError: (e) => setError(e.photo ?? 'Upload failed.'),
                onFinish: () => setBusy(false),
            });
        } catch (e) {
            setError((e as Error).message);
            setBusy(false);
        }
        if (input.current) input.current.value = '';
    };

    return (
        <section>
            <div className="flex flex-wrap items-center gap-5">
                <Avatar name={user.name} avatar={user.avatar} cosmetics={user.cosmetics} className="h-24 w-24 text-4xl" />
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <button onClick={() => input.current?.click()} disabled={busy} className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                            {busy ? 'Uploading…' : hasPhoto ? 'Change photo' : 'Upload photo'}
                        </button>
                        {hasPhoto && (
                            <button onClick={() => router.delete(route('profile.photo.remove'), { preserveScroll: true })} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-neutral-200 hover:bg-white/20">
                                Remove
                            </button>
                        )}
                    </div>
                    <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
                    <p className="text-xs text-neutral-500">PNG, JPG or WebP, cropped to a square. An animated GIF or WebP (up to 1 MB, 1024 px) keeps moving.</p>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                </div>
            </div>
        </section>
    );
}
