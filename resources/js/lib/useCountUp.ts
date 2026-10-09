import { alwaysAnimate } from '@/lib/motion';
import { useEffect, useRef, useState } from 'react';

/** A number that counts up to `value` the first time it scrolls into view. */
export function useCountUp(value: number, ms = 1200) {
    const ref = useRef<HTMLElement | null>(null);
    const [shown, setShown] = useState(0);

    useEffect(() => {
        const el = ref.current;
        if (!el || typeof IntersectionObserver === 'undefined' || (window.matchMedia('(prefers-reduced-motion: reduce)').matches && !alwaysAnimate())) return setShown(value);

        let frame = 0;
        const seen = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            seen.disconnect();
            const start = performance.now();
            const tick = (now: number) => {
                const t = Math.min(1, (now - start) / ms);
                setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
                if (t < 1) frame = requestAnimationFrame(tick);
            };
            frame = requestAnimationFrame(tick);
        });
        seen.observe(el);

        return () => { seen.disconnect(); cancelAnimationFrame(frame); };
    }, [value, ms]);

    return [ref, shown] as const;
}
