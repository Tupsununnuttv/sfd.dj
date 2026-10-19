import thumbnails from '@/lib/backgroundThumbnails.json';
import { useState } from 'react';

/** Settings thumbnails never mount a complete React scenery or fetch its JavaScript. */
export default function BackgroundPreview({ name, large = false }: { name: string; large?: boolean }) {
    const key = name || 'default';
    const full = `/backgrounds/${key}.svg`;
    const thumbnail = (thumbnails as Record<string, string>)[key];
    const [loaded, setLoaded] = useState(false);
    const [fallback, setFallback] = useState(false);
    return <>
        {!loaded && <span aria-hidden className="absolute inset-0 animate-pulse bg-slate-900" />}
        <img src={large || fallback || !thumbnail ? full : thumbnail} alt="" width={1600} height={900} loading={large ? 'eager' : 'lazy'} decoding="async" onLoad={() => setLoaded(true)} onError={() => setFallback(true)} className="absolute inset-0 h-full w-full object-cover" />
    </>;
}
