import { characterUrl } from '@/lib/characters';
import posters from '@/lib/characterPosters.json';
import { useState } from 'react';
import { useSystemRendering } from '@/lib/systemPreferences';

/** Browsing uses a static poster; only a hovered card downloads and plays its dance. */
export default function ShopCharacterPreview({ name }: { name: string }) {
    const system = useSystemRendering();
    const poster = (posters as Record<string, string>)[name];
    const [hovered, setHovered] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [dancing, setDancing] = useState(false);
    const [failedPoster, setFailedPoster] = useState(false);
    return <span onPointerEnter={(event) => { if (event.pointerType !== 'touch') setHovered(true); }} onPointerLeave={() => { setHovered(false); setDancing(false); }} className="relative flex h-full w-20 items-end justify-center">
        {!loaded && <span aria-label="Loading character" className="absolute inset-0 animate-pulse rounded-xl bg-white/5" />}
        <img src={poster && !failedPoster ? poster : characterUrl(name, 'standing')} alt="" width={200} height={276} draggable={false} loading="lazy" decoding="async" onLoad={() => setLoaded(true)} onError={() => setFailedPoster(true)} className={`h-full w-full object-contain object-bottom ${hovered && dancing && system.animated_characters ? 'invisible' : ''}`} />
        {hovered && system.animated_characters && <img src={characterUrl(name, 'dancing')} alt="" width={200} height={276} draggable={false} decoding="async" onLoad={() => setDancing(true)} className={`absolute inset-0 h-full w-full object-contain object-bottom ${dancing ? '' : 'invisible'}`} />}
    </span>;
}
