import { CHARACTER_RATIO, characterUrl } from '@/lib/characters';

/**
 * A few characters from the Avatar shop dancing side by side on a lit floor: the site's crowd, on the log in pages and the home page.
 * The middle ones stand nearer, so they are bigger. Like everywhere else, they keep still when the computer asks for less motion.
 */
export default function Crowd({ names, height, lazy = false, className = '' }: { names: string[]; height: number; lazy?: boolean; className?: string }) {
    const middle = (names.length - 1) / 2;

    return (
        <div className={`pointer-events-none relative flex items-end justify-center ${className}`} aria-hidden>
            <div className="absolute inset-x-[8%] -bottom-2 h-8 rounded-[100%] bg-fuchsia-500/30 blur-xl" />
            {names.map((name, i) => {
                const far = Math.abs(i - middle);
                const h = Math.round(height * (1 - 0.12 * far));

                return (
                    <img
                        key={name}
                        src={characterUrl(name, 'dancing')}
                        alt=""
                        loading={lazy ? 'lazy' : undefined}
                        width={Math.round(h * CHARACTER_RATIO)}
                        height={h}
                        className="relative shrink-0 drop-shadow-[0_10px_12px_rgba(0,0,0,0.55)]"
                        style={{ marginInline: -h * CHARACTER_RATIO * 0.12, zIndex: 10 - Math.round(far) }}
                    />
                );
            })}
        </div>
    );
}
