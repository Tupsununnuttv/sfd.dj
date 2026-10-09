import { AnimatedAvatar, animatedAvatars } from '@/lib/animatedAvatars';
import { characterOf, characterUrl } from '@/lib/characters';
import { AccessoryLayers, Cosmetics, EffectLayer, FrameLayer } from '@/lib/cosmetics';

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
    const color = colors[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % colors.length];
    const photo = avatar?.startsWith('img:') ? route('media.avatar', avatar.slice(4)) : null;
    const animated = avatar?.startsWith('anim:') && animatedAvatars[avatar.slice(5)] ? avatar.slice(5) : null;
    const character = characterOf(avatar);
    const accessory = cosmetics?.accessory ?? '';
    const frame = cosmetics?.frame ?? '';
    const effect = cosmetics?.effect ?? '';

    return (
        <span className="sfd-avatar relative isolate inline-flex shrink-0" aria-hidden>
            {effect && <EffectLayer name={effect} />}
            {frame && <FrameLayer name={frame} />}
            <span
                className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ${avatar ? 'bg-neutral-800' : color} ${className}`}
            >
                {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : character ? <img src={characterUrl(character, 'standing')} alt="" draggable={false} className="h-full w-full max-w-none origin-[50%_54%] -translate-y-[4%] scale-[1.3] object-cover object-top" /> : animated ? <AnimatedAvatar name={animated} /> : (avatar?.startsWith('anim:') || character ? null : avatar) ?? name.charAt(0).toUpperCase()}
            </span>
            {accessory && <AccessoryLayers name={accessory} />}
        </span>
    );
}
