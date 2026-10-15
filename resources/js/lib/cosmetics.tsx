import { accessoryArt } from '@/lib/art/accessories';
import { awardArt } from '@/lib/art/awards';
import { badgeArt } from '@/lib/art/badges';
import { effectArt } from '@/lib/art/effects';
import { frameArt } from '@/lib/art/frames';
import { Ids } from '@/lib/art/kit';
import { useId } from 'react';

/** What a user has equipped from the Avatar shop (slot -> item key). The keys are the ones in AvatarController. */
export interface Cosmetics {
    badge?: string;
    accessory?: string;
    frame?: string;
    effect?: string;
}

/** Ids for the gradients of one picture: the same all through it and unlike those of any other picture on the page. */
const useIds = (): Ids => {
    const id = useId().replace(/:/g, '');

    return (name) => `cs${id}${name}`;
};

/** A badge from the shop, drawn at the size you give it (16 px in chat, bigger in the shop). */
export function ShopBadge({ name, className = 'h-4 w-4' }: { name: string; className?: string }) {
    const u = useIds();
    const art = badgeArt[name];

    return art ? <svg viewBox="0 0 32 32" data-badge={name} className={`shrink-0 drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)] ${className}`} aria-hidden>{art(u)}</svg> : null;
}

/** A special badge from staff (Beta Tester, Bug Hunter ...): the same size as a shop badge, drawn as a seal. */
export function AwardBadge({ name, className = 'h-4 w-4' }: { name: string; className?: string }) {
    const u = useIds();
    const art = awardArt[name];

    return art ? <svg viewBox="0 0 32 32" data-award={name} className={`shrink-0 drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)] ${className}`} aria-hidden>{art(u)}</svg> : null;
}

// The layers sit round the picture of an avatar and are as big as the avatar needs: an effect reaches 40 % beyond it, a frame 16 %, an accessory 40 %.
const layer = 'cos pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible';

/** The effect, behind everything. */
export function EffectLayer({ name }: { name: string }) {
    const u = useIds();
    const art = effectArt[name];

    return art ? <svg viewBox="-40 -40 180 180" data-effect={name} className={`${layer} -z-20 h-[180%] w-[180%]`} aria-hidden>{art(u)}</svg> : null;
}

/** The frame: a ring round the picture. */
export function FrameLayer({ name }: { name: string }) {
    const u = useIds();
    const art = frameArt[name];

    return art ? <svg viewBox="-16 -16 132 132" data-frame={name} className={`${layer} -z-10 h-[132%] w-[132%]`} aria-hidden>{art(u)}</svg> : null;
}

/** The accessory: the part that goes behind the avatar (wings) and the part that goes over it. */
export function AccessoryLayers({ name }: { name: string }) {
    const u = useIds();
    const art = accessoryArt[name];

    if (!art) return null;

    return (
        <>
            {art.back && <svg viewBox="-40 -40 180 180" data-accessory-back={name} className={`${layer} z-[-5] h-[180%] w-[180%]`} aria-hidden>{art.back((n) => u(`b${n}`))}</svg>}
            {art.front && <svg viewBox="-40 -40 180 180" data-accessory={name} className={`${layer} z-10 h-[180%] w-[180%]`} aria-hidden>{art.front(u)}</svg>}
        </>
    );
}
