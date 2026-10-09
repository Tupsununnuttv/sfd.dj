import { useId } from 'react';

/**
 * Animated avatars: little characters drawn as SVG that move in a loop (blinking, bobbing, chewing to the beat).
 * They are stored as "anim:<key>" in users.avatar; the keys here must match AvatarController::ANIMATED (a test checks).
 * Each one is drawn on a 100 x 100 square and shown inside the round avatar. The moving parts use the .av-* classes in app.css.
 */
type Art = (props: { u: (name: string) => string }) => JSX.Element;


const frame = 'animated-avatar h-full w-full';

/** A blue, furry, red-mouthed monster DJ with pink headphones. */
const Fang: Art = ({ u }) => (
    <svg viewBox="0 0 100 100" className={frame} aria-hidden>
        <defs>
            <radialGradient id={u('bg')} cx="50" cy="36" r="72" gradientUnits="userSpaceOnUse"><stop stopColor="#6d28d9" /><stop offset="1" stopColor="#1e1b4b" /></radialGradient>
            <linearGradient id={u('fur')} x1="50" y1="27" x2="50" y2="89" gradientUnits="userSpaceOnUse"><stop stopColor="#7dd3fc" /><stop offset="1" stopColor="#1d4ed8" /></linearGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${u('bg')})`} />
        <g className="av av-bob">
            <path d="M16 58C13 12 87 12 84 58" stroke="#f472b6" strokeWidth="5" strokeLinecap="round" fill="none" />
            <ellipse cx="50" cy="58" rx="34" ry="31" fill={`url(#${u('fur')})`} />
            <path d="M17 58 8 66 18 71ZM83 58 92 66 82 71Z" fill="#bae6fd" />
            <path d="M25 45 29 30 38 40 44 23 50 38 56 23 62 40 71 30 75 45Q50 36 25 45Z" fill="#e0f2fe" />
            <ellipse cx="50" cy="69" rx="21" ry="16" fill="#e0f2fe" />
            <g className="av av-blink">
                <circle cx="38" cy="51" r="8.5" fill="#fff" stroke="#0f172a" strokeWidth="1.6" />
                <circle cx="62" cy="51" r="8.5" fill="#fff" stroke="#0f172a" strokeWidth="1.6" />
                <g className="av av-look">
                    <circle cx="38" cy="52" r="4.2" fill="#0f172a" />
                    <circle cx="62" cy="52" r="4.2" fill="#0f172a" />
                    <circle cx="39.5" cy="50.4" r="1.4" fill="#fff" />
                    <circle cx="63.5" cy="50.4" r="1.4" fill="#fff" />
                </g>
            </g>
            <path d="M26 40 44 45M74 40 56 45" stroke="#0f172a" strokeWidth="3.4" strokeLinecap="round" />
            <path d="M44 61Q50 57 56 61L50 67Z" fill="#0f172a" />
            <g className="av av-top av-mouth">
                <path d="M33 70Q50 63 67 70Q64 86 50 87Q36 86 33 70Z" fill="#b91c1c" />
                <ellipse cx="50" cy="83" rx="9" ry="4.5" fill="#f43f5e" />
                <path d="M37 86 40.5 79 44 86ZM56 86 59.5 79 63 86Z" fill="#fff" />
            </g>
            <path d="M33 70Q50 63 67 70L65 73Q50 68 35 73Z" fill="#7f1d1d" />
            <path d="M36 71 40 78 44 70.5ZM45.5 70.5 50 79 54.5 70.5ZM56 70.5 60 78 64 71Z" fill="#fff" />
            <g className="av av-pulse"><rect x="7" y="46" width="14" height="26" rx="6" fill="#ec4899" /><rect x="10.5" y="50" width="3.5" height="18" rx="1.7" fill="#fbcfe8" /></g>
            <g className="av av-pulse" style={{ animationDelay: '0.3s' }}><rect x="79" y="46" width="14" height="26" rx="6" fill="#ec4899" /><rect x="86" y="50" width="3.5" height="18" rx="1.7" fill="#fbcfe8" /></g>
        </g>
    </svg>
);

/** A dark cat outlined in neon, with glowing eyes and twitching ears. */
const NeonCat: Art = ({ u }) => (
    <svg viewBox="0 0 100 100" className={frame} aria-hidden>
        <defs>
            <radialGradient id={u('bg')} cx="50" cy="44" r="66" gradientUnits="userSpaceOnUse"><stop stopColor="#3b0764" /><stop offset="1" stopColor="#0a0618" /></radialGradient>
            <filter id={u('glow')} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.7" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect width="100" height="100" fill={`url(#${u('bg')})`} />
        <path className="av av-twinkle" d="M14 22 15.6 26.4 20 28 15.6 29.6 14 34 12.4 29.6 8 28 12.4 26.4Z" fill="#67e8f9" />
        <path className="av av-twinkle" style={{ animationDelay: '1.1s' }} d="M86 70 87.2 73.2 90.4 74.4 87.2 75.6 86 78.8 84.8 75.6 81.6 74.4 84.8 73.2Z" fill="#f0abfc" />
        <g className="av av-float">
            <g filter={`url(#${u('glow')})`}>
                <path className="av av-bottom av-twitch" d="M21 47 22 12 46 30Z" fill="#2a1458" stroke="#f0abfc" strokeWidth="2.6" strokeLinejoin="round" />
                <path className="av av-bottom av-twitch" style={{ animationDelay: '1.7s' }} d="M79 47 78 12 54 30Z" fill="#2a1458" stroke="#f0abfc" strokeWidth="2.6" strokeLinejoin="round" />
                <ellipse cx="50" cy="60" rx="33" ry="28" fill="#241254" stroke="#f0abfc" strokeWidth="2.6" />
            </g>
            <path d="M27 38 28 22 40 31ZM73 38 72 22 60 31Z" fill="#f472b6" opacity=".55" />
            <g className="av av-blink">
                <ellipse cx="36" cy="57" rx="7.5" ry="8.5" fill="#22d3ee" filter={`url(#${u('glow')})`} />
                <ellipse cx="64" cy="57" rx="7.5" ry="8.5" fill="#22d3ee" filter={`url(#${u('glow')})`} />
                <ellipse cx="36" cy="57" rx="2" ry="6.5" fill="#0c0a1f" />
                <ellipse cx="64" cy="57" rx="2" ry="6.5" fill="#0c0a1f" />
            </g>
            <path d="M45.5 68H54.5L50 73.5Z" fill="#f472b6" />
            <path d="M50 73.5Q46.5 80 41 77M50 73.5Q53.5 80 59 77" stroke="#f0abfc" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <g stroke="#f0abfc" strokeWidth=".9" strokeLinecap="round" opacity=".8">
                <g className="av av-whisker"><path d="M15 64 32 67M14 72 32 71M16 80 33 75" /></g>
                <g className="av av-whisker" style={{ animationDelay: '0.5s', animationDirection: 'reverse' }}><path d="M85 64 68 67M86 72 68 71M84 80 67 75" /></g>
            </g>
        </g>
    </svg>
);

/** A silver robot with a scanning visor and a mouth that is an equalizer. */
const Robo: Art = ({ u }) => (
    <svg viewBox="0 0 100 100" className={frame} aria-hidden>
        <defs>
            <radialGradient id={u('bg')} cx="50" cy="40" r="68" gradientUnits="userSpaceOnUse"><stop stopColor="#1e3a8a" /><stop offset="1" stopColor="#0b1020" /></radialGradient>
            <linearGradient id={u('metal')} x1="50" y1="26" x2="50" y2="82" gradientUnits="userSpaceOnUse"><stop stopColor="#f1f5f9" /><stop offset=".55" stopColor="#94a3b8" /><stop offset="1" stopColor="#475569" /></linearGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${u('bg')})`} />
        <g className="av av-bob">
            <path d="M50 29V17" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            <circle className="av av-light" cx="50" cy="14" r="4.5" fill="#fb7185" />
            <rect x="21" y="28" width="58" height="52" rx="14" fill={`url(#${u('metal')})`} stroke="#334155" strokeWidth="2" />
            <g className="av av-pulse"><circle cx="17" cy="55" r="8" fill="#6366f1" stroke="#c7d2fe" strokeWidth="1.6" /></g>
            <g className="av av-pulse" style={{ animationDelay: '0.35s' }}><circle cx="83" cy="55" r="8" fill="#6366f1" stroke="#c7d2fe" strokeWidth="1.6" /></g>
            <rect x="28" y="38" width="44" height="20" rx="10" fill="#0f172a" />
            <g className="av av-scan">
                <rect x="33" y="43" width="12" height="10" rx="5" fill="#22d3ee" />
                <rect x="55" y="43" width="12" height="10" rx="5" fill="#22d3ee" />
                <rect x="36" y="45" width="4" height="3" rx="1.5" fill="#ecfeff" />
                <rect x="58" y="45" width="4" height="3" rx="1.5" fill="#ecfeff" />
            </g>
            <rect x="32" y="63" width="36" height="12" rx="4" fill="#0f172a" />
            {[0, 1, 2, 3, 4].map((i) => (
                <rect key={i} className="av av-bottom av-eq" style={{ animationDuration: `${0.55 + (i % 3) * 0.17}s`, animationDelay: `${i * 0.11}s` }} x={35 + i * 6} y="65" width="4" height="8" rx="1.2" fill={i % 2 ? '#a78bfa' : '#f0abfc'} />
            ))}
        </g>
    </svg>
);

/** A friendly ghost in headphones, floating and singing along. */
const Ghost: Art = ({ u }) => (
    <svg viewBox="0 0 100 100" className={frame} aria-hidden>
        <defs>
            <radialGradient id={u('bg')} cx="50" cy="42" r="68" gradientUnits="userSpaceOnUse"><stop stopColor="#5b21b6" /><stop offset="1" stopColor="#0f172a" /></radialGradient>
            <linearGradient id={u('body')} x1="50" y1="18" x2="50" y2="86" gradientUnits="userSpaceOnUse"><stop stopColor="#ffffff" /><stop offset="1" stopColor="#c7d2fe" /></linearGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${u('bg')})`} />
        <path className="av av-twinkle" d="M17 22 18.6 26.4 23 28 18.6 29.6 17 34 15.4 29.6 11 28 15.4 26.4Z" fill="#fde68a" />
        <path className="av av-twinkle" style={{ animationDelay: '0.8s' }} d="M83 30 84 32.8 86.8 33.8 84 34.8 83 37.6 82 34.8 79.2 33.8 82 32.8Z" fill="#fde68a" />
        <path className="av av-twinkle" style={{ animationDelay: '1.6s' }} d="M80 74 81.2 77.2 84.4 78.4 81.2 79.6 80 82.8 78.8 79.6 75.6 78.4 78.8 77.2Z" fill="#a5f3fc" />
        <ellipse className="av av-pulse" cx="50" cy="90" rx="17" ry="3.5" fill="#000" opacity=".35" />
        <g className="av av-float">
            <path d="M25 84V48C25 22 37 14 50 14S75 22 75 48V84Q69 77 62.5 84 56 77 50 84 44 77 37.5 84 31 77 25 84Z" fill={`url(#${u('body')})`} />
            <path d="M27 50C27 28 38 17 50 17" stroke="#fff" strokeOpacity=".7" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M25 46C25 8 75 8 75 46" stroke="#a78bfa" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <rect x="19" y="39" width="9" height="19" rx="4" fill="#7c3aed" /><rect x="72" y="39" width="9" height="19" rx="4" fill="#7c3aed" />
            <g className="av av-blink">
                <ellipse cx="41" cy="50" rx="4.5" ry="6" fill="#1e1b4b" /><ellipse cx="59" cy="50" rx="4.5" ry="6" fill="#1e1b4b" />
                <circle cx="42.4" cy="47.6" r="1.6" fill="#fff" /><circle cx="60.4" cy="47.6" r="1.6" fill="#fff" />
            </g>
            <circle cx="33" cy="60" r="4.2" fill="#f9a8d4" opacity=".75" /><circle cx="67" cy="60" r="4.2" fill="#f9a8d4" opacity=".75" />
            <ellipse className="av av-sing" cx="50" cy="62" rx="4.2" ry="5.2" fill="#1e1b4b" />
        </g>
    </svg>
);

/** A record spinning under a tonearm, with a glow that breathes. */
const Spin: Art = ({ u }) => (
    <svg viewBox="0 0 100 100" className={frame} aria-hidden>
        <defs>
            <radialGradient id={u('bg')} cx="50" cy="50" r="62" gradientUnits="userSpaceOnUse"><stop stopColor="#4c1d95" /><stop offset="1" stopColor="#09090f" /></radialGradient>
            <linearGradient id={u('label')} x1="38" y1="38" x2="62" y2="62" gradientUnits="userSpaceOnUse"><stop stopColor="#f0abfc" /><stop offset=".55" stopColor="#a855f7" /><stop offset="1" stopColor="#38bdf8" /></linearGradient>
            <linearGradient id={u('ring')} x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse"><stop stopColor="#22d3ee" /><stop offset=".5" stopColor="#a855f7" /><stop offset="1" stopColor="#f472b6" /></linearGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${u('bg')})`} />
        <circle className="av av-glow" cx="50" cy="52" r="44" stroke={`url(#${u('ring')})`} strokeWidth="2.5" fill="none" />
        <g className="av av-spin">
            <circle cx="50" cy="52" r="38" fill="#0f172a" />
            <g stroke="#334155" strokeWidth=".8" fill="none"><circle cx="50" cy="52" r="34" /><circle cx="50" cy="52" r="30" /><circle cx="50" cy="52" r="26" /><circle cx="50" cy="52" r="22" /></g>
            <path d="M50 52V14A38 38 0 0 1 80 29Z M50 52V90A38 38 0 0 1 20 75Z" fill="#fff" opacity=".09" />
            <circle cx="50" cy="52" r="14" fill={`url(#${u('label')})`} />
            <path d="M43 52A7 7 0 0 1 57 52" stroke="#fff" strokeOpacity=".8" strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="50" cy="52" r="3.6" fill="#09090f" />
        </g>
        <path d="M30 22A34 34 0 0 1 56 15" stroke="#fff" strokeOpacity=".22" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <g className="av av-arm">
            <path d="M86 14 74 44" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
            <rect x="69" y="42" width="9" height="6" rx="1.5" fill="#e2e8f0" transform="rotate(25 73 45)" />
            <circle cx="86" cy="14" r="4.5" fill="#94a3b8" stroke="#475569" strokeWidth="1.4" />
        </g>
    </svg>
);

/** A little flame that flickers, blinks and throws sparks. */
const Ember: Art = ({ u }) => (
    <svg viewBox="0 0 100 100" className={frame} aria-hidden>
        <defs>
            <radialGradient id={u('bg')} cx="50" cy="78" r="70" gradientUnits="userSpaceOnUse"><stop stopColor="#7f1d1d" /><stop offset="1" stopColor="#0c0a09" /></radialGradient>
            <linearGradient id={u('outer')} x1="50" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse"><stop stopColor="#fbbf24" /><stop offset=".45" stopColor="#f97316" /><stop offset="1" stopColor="#dc2626" /></linearGradient>
            <linearGradient id={u('inner')} x1="50" y1="38" x2="50" y2="88" gradientUnits="userSpaceOnUse"><stop stopColor="#fef08a" /><stop offset="1" stopColor="#fb923c" /></linearGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${u('bg')})`} />
        {[[30, 80, 0], [72, 78, 0.9], [50, 84, 1.7], [62, 86, 2.4]].map(([x, y, d]) => (
            <circle key={x} className="av av-spark" style={{ animationDelay: `${d}s` }} cx={x} cy={y} r="2.2" fill="#fde047" />
        ))}
        <g className="av av-bottom av-flicker">
            <path d="M50 10C55 26 74 34 72 58 70 77 61 89 50 89 39 89 30 77 28 58 26 40 41 34 44 22 46 17 48 14 50 10Z" fill={`url(#${u('outer')})`} />
        </g>
        <g className="av av-bottom av-flicker" style={{ animationDelay: '0.35s', animationDuration: '1.3s' }}>
            <path d="M50 40C54 51 63 55 62 68 61 79 56 86 50 86 44 86 39 79 38 68 37 58 46 54 47 46 48 43 49 42 50 40Z" fill={`url(#${u('inner')})`} />
        </g>
        <g className="av av-blink">
            <ellipse cx="42" cy="62" rx="3.4" ry="4.8" fill="#431407" /><ellipse cx="58" cy="62" rx="3.4" ry="4.8" fill="#431407" />
            <circle cx="43" cy="60.2" r="1.2" fill="#fff" /><circle cx="59" cy="60.2" r="1.2" fill="#fff" />
        </g>
        <path d="M44 72Q50 78 56 72" stroke="#7c2d12" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
);

export const animatedAvatars: Record<string, Art> = {
    fang: Fang,
    neoncat: NeonCat,
    robo: Robo,
    ghost: Ghost,
    spin: Spin,
    ember: Ember,
};

/** One of the animated avatars by key (the part after "anim:"). Ids inside the drawing are made unique so many can share a page. */
export function AnimatedAvatar({ name }: { name: string }) {
    const uid = useId().replace(/:/g, '');
    const Art = animatedAvatars[name];

    return Art ? <Art u={(n) => `${uid}-${n}`} /> : null;
}
