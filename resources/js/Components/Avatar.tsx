import { AnimatedAvatar, animatedAvatars } from '@/lib/animatedAvatars';
import { characterOf, characterUrl, DEFAULT_CHARACTER } from '@/lib/characters';
import { AccessoryLayers, Cosmetics, EffectLayer, FrameLayer } from '@/lib/cosmetics';
import characterPosters from '@/lib/characterPosters.json';
import { useState } from 'react';
import { useSystemRendering } from '@/lib/systemPreferences';
import { perk, subscriptionVars, useSubscriptionStyle } from '@/lib/subscriptionStyle';

const colors = ['bg-fuchsia-600', 'bg-violet-600', 'bg-sky-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600'];

/**
 * A user's picture. `avatar` is an uploaded photo ("img:<file>"), one of the animated avatars ("anim:<key>"), a character ("char:<name>": a
 * close-up of the head here, the whole person in the room), an emoji, or empty (then it is a coloured circle with their initial). `cosmetics` adds the pictures of the shop: an effect behind it, a frame round it and an accessory on it (lib/cosmetics.tsx).
 */
export default function Avatar({
    name,
    avatar,
    cosmetics,
    className = 'h-8 w-8 text-base',
}: {
    name: string;
    avatar?: string | null;
    cosmetics?: Cosmetics | null;
    className?: string;
}) {
    const system = useSystemRendering();
    const subscription = useSubscriptionStyle(cosmetics);
    const color = colors[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % colors.length];
    const photo = avatar?.startsWith('img:') ? route('media.avatar', avatar.slice(4)) : null;
    const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
    const animated = avatar?.startsWith('anim:') && animatedAvatars[avatar.slice(5)] ? avatar.slice(5) : null;
    const character = characterOf(avatar) ?? (!avatar || photo ? DEFAULT_CHARACTER : null);
    const poster = character ? (characterPosters as Record<string, string>)[character] : null;
    const picture = character ? (poster ?? characterUrl(character, 'standing')) : null;
    const accessory = cosmetics?.accessory ?? '';
    const frame = cosmetics?.frame ?? '';
    const effect = cosmetics?.effect ?? '';

    return (
        <span className="sfd-avatar sub-avatar relative isolate inline-flex shrink-0" aria-hidden style={subscriptionVars(subscription)} data-sub-frame={perk(subscription, 'frame') || undefined} data-sub-ring={perk(subscription, 'ring') || undefined} data-sub-aura={perk(subscription, 'aura') || undefined} data-sub-profile={perk(subscription, 'profile_animation') || undefined}>
            {effect && system.visual_effects && <EffectLayer name={effect} />}
            {frame && <FrameLayer name={frame} />}
            <span
                className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ${avatar ? 'bg-neutral-800' : color} ${className}`}
            >
                {photo && failedPhoto !== photo ? <img src={photo} alt="" loading="lazy" decoding="async" onError={() => setFailedPhoto(photo)} className="h-full w-full object-cover" /> : picture ? <img src={picture} alt="" loading="lazy" decoding="async" draggable={false} className="h-full w-full max-w-none origin-[50%_54%] translate-y-[-4%] scale-[1.3] object-cover object-top" /> : animated ? <AnimatedAvatar name={animated} /> : avatar ?? name.charAt(0).toUpperCase()}
            </span>
            {accessory && <AccessoryLayers name={accessory} />}
        </span>
    );
}
