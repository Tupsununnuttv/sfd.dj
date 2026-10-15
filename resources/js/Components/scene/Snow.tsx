import { SCENE } from '@/lib/scenes';

const { x, y, w, h } = SCENE.screen;

/**
 * Snow that falls in front of everything in the Christmas room, the crowd too: three layers of flakes (far, middle, near) that fall at their own
 * speed while a song plays (see the .snow classes in app.css). It keeps clear of the video, which would be hard to watch through it.
 * `petals` is blossom, `variant` is autumn leaves in three colours, embers that rise, sprinkles in five bright ones, gold glitter (the Christmas V2 lodge),
 * green and purple sparks that rise (Halloween V2), pastel confetti (Easter) or fireflies that drift up (Midsummer).
 */
export default function Snow({ petals = false, variant }: { petals?: boolean; variant?: 'leaves' | 'embers' | 'sprinkles' | 'glitter' | 'wisps' | 'pastel' | 'fireflies' }) {
    return (
        <div
            className="pointer-events-none absolute inset-0 z-300 overflow-hidden"
            style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${x - 8}px ${y}px, ${x - 8}px ${y + h + 8}px, ${x + w + 8}px ${y + h + 8}px, ${x + w + 8}px ${y}px, ${x - 8}px ${y}px)` }}
            aria-hidden
        >
            <div className={`snow-sway absolute inset-0 ${petals ? 'petals' : ''} ${variant ?? ''}`}>
                <div className="snow snow-far" />
                <div className="snow snow-mid" />
                <div className="snow snow-near" />
            </div>
        </div>
    );
}
