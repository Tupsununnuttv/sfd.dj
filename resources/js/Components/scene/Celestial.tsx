import { BoothFrontArt } from '@/Components/scene/DjBooth';
import { SCENE, ScenePalette } from '@/lib/scenes';
import { useId } from 'react';

interface Props { palette: ScenePalette; live?: boolean; withBooth?: boolean; height?: number; className?: string }

/** A quiet observatory terrace. Screen and crowd coordinates follow the shared room layout. */
export default function CelestialBackdrop({ palette: p, live = false, withBooth = false, height = 900, className = '' }: Props) {
    const uid = useId().replace(/:/g, '');
    const u = (name: string) => `${uid}-celestial-${name}`;
    const f = (name: string) => `url(#${u(name)})`;
    const ext = Math.max(0, height - SCENE.h);
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 1600 ${height}`} preserveAspectRatio="xMidYMin slice" className={`${className} ${live ? 'sc-live' : ''}`} aria-hidden data-scene="celestial">
        <defs>
            <linearGradient id={u('sky')} x2="0" y2="1"><stop stopColor="#030615" /><stop offset=".6" stopColor="#19204a" /><stop offset="1" stopColor="#385b73" /></linearGradient>
            <radialGradient id={u('nebula')}><stop stopColor="#8b5cf6" stopOpacity=".32" /><stop offset="1" stopColor="#8b5cf6" stopOpacity="0" /></radialGradient>
            <radialGradient id={u('moon')}><stop stopColor="#fffce6" /><stop offset=".7" stopColor="#d4eaf0" /><stop offset="1" stopColor="#879fcd" /></radialGradient>
            <radialGradient id={u('halo')}><stop stopColor="#bcefff" stopOpacity=".32" /><stop offset="1" stopColor="#bcefff" stopOpacity="0" /></radialGradient>
            <linearGradient id={u('water')} x2="0" y2="1"><stop stopColor="#47617b" /><stop offset="1" stopColor="#0b1530" /></linearGradient>
            <linearGradient id={u('floor')} x2="0" y2="1"><stop stopColor="#202b42" /><stop offset="1" stopColor="#050914" /></linearGradient>
            <linearGradient id={u('stone')}><stop stopColor="#10162b" /><stop offset=".4" stopColor="#43516a" /><stop offset=".55" stopColor="#29364d" /><stop offset="1" stopColor="#0b1022" /></linearGradient>
            <linearGradient id={u('crystal')} x2="1" y2="1"><stop stopColor="#efffff" /><stop offset=".35" stopColor="#80e7eb" /><stop offset=".6" stopColor="#9d8fe8" /><stop offset="1" stopColor="#2f426b" /></linearGradient>
        </defs>
        <rect width="1600" height={height} fill={f('sky')} />
        <ellipse cx="980" cy="270" rx="650" ry="310" fill={f('nebula')} />
        {Array.from({ length: 55 }, (_, i) => {
            const x = (i * 277 + 91) % 1600, y = (i * 113 + 19) % 480;
            if (x > 475 && x < 1125 && y < 360) return null;
            return <circle key={i} className="sc-star" cx={x} cy={y} r={i % 7 === 0 ? 2 : 1} fill="#d5efff" opacity={.35 + (i % 4) * .15} style={{ animationDelay: `${-(i % 8) * .4}s` }} />;
        })}
        <circle cx="274" cy="150" r="140" fill={f('halo')} />
        <circle cx="274" cy="150" r="61" fill={f('moon')} />
        <g fill="#6b83b1" opacity=".2"><ellipse cx="250" cy="134" rx="12" ry="18" /><circle cx="295" cy="168" r="16" /><circle cx="277" cy="113" r="8" /><circle cx="245" cy="172" r="6" /></g>
        <g transform="translate(1330 155) rotate(-24)"><ellipse rx="91" ry="24" fill="none" stroke="#b0a0e9" strokeOpacity=".45" strokeWidth="2" /><circle r="39" fill="#665587" /><path d="M-35-8Q0 5 35-8M-34 10Q0 23 34 10" fill="none" stroke="#b7abd4" strokeOpacity=".5" strokeWidth="5" /><path d="M-91 0A91 24 0 0 0 91 0" fill="none" stroke="#b0a0e9" strokeWidth="3" /></g>
        <path d="M0 410L95 337L170 390L295 310L400 397L506 350L630 420L840 340L1010 408L1180 320L1345 395L1450 340L1600 415V620H0Z" fill="#142039" />
        <path d="M0 465L160 404L275 455L400 417L610 476L790 422L950 469L1165 407L1340 466L1490 410L1600 464V620H0Z" fill="#1e3349" />
        <rect y="480" width="1600" height="150" fill={f('water')} />
        {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${130 + i % 3 * 24} ${490 + i * 8}h${290 - i * 10}M${1190 - i % 4 * 20} ${493 + i * 8}h${160 + i * 3}`} stroke="#9bdce6" opacity={.15 - i * .005} strokeWidth="2" />)}
        <path d="M0 585Q800 535 1600 585V635H0Z" fill="#11192d" stroke="#60718b" strokeWidth="2" />
        {Array.from({ length: 25 }, (_, i) => <path key={i} d={`M${i * 67} 587V629`} stroke="#6d8b9e" strokeOpacity=".5" strokeWidth="5" />)}
        <path d="M0 588Q800 543 1600 588" fill="none" stroke="#78dce1" strokeWidth="2" opacity=".65" />
        <rect y={SCENE.floor} width="1600" height={height - SCENE.floor} fill={f('floor')} />
        {[650, 684, 732, 801, 893].map((y) => <path key={y} d={`M0 ${y + ext}H1600`} stroke="#5b7187" strokeOpacity=".17" />)}
        {[-7, -5, -3, -1, 1, 3, 5, 7].map((i) => <path key={i} d={`M${800 + i * 48} 628L${800 + i * 180} ${height}`} stroke="#5b7187" strokeOpacity=".17" />)}
        {[0, 1].map((side) => <g key={side} transform={side ? 'translate(1600 0) scale(-1 1)' : undefined}>
            <path d="M29 625V220Q29 125 107 86L165 56L186 89Q79 144 79 229V625Z" fill={f('stone')} stroke="#63738e" strokeWidth="2" />
            <path d="M54 599V228Q54 149 172 80" fill="none" stroke="#8edce5" strokeOpacity=".65" strokeWidth="2" />
            <path d="M0 612H125L143 644H0Z" fill="#24354c" stroke="#6f849d" strokeWidth="1.5" />
            <path d="M391 605V393L420 368L449 393V605Z" fill={f('stone')} stroke="#768ca2" strokeWidth="1.5" />
            <ellipse cx="420" cy="611" rx="67" ry="11" fill="#000" opacity=".3" />
            <path d="M379 602H461L474 623H365Z" fill="#27334e" stroke="#7189a0" />
            <g className="sc-star" style={{ animationDuration: '5s' }}><path d="M420 324L443 365L420 399L397 365Z" fill={f('crystal')} stroke="#c5ffff" strokeWidth="1.2" /><path d="M420 324V399L408 365Z" fill="#e0fcff" opacity=".4" /><path d="M397 365H443" stroke="#f0ffff" strokeWidth=".8" /></g>
            <path d="M410 430L420 417L430 430L420 443ZM410 473L420 460L430 473L420 486Z" fill="none" stroke="#7fe7df" strokeOpacity=".7" strokeWidth="1.4" />
            <g transform="translate(171 590)"><path d="M-47 0H47L32 53H-32Z" fill="#192a3e" stroke="#77939e" /><path d="M0 0Q-61-73-73-110Q-17-92 0-10Q16-104 62-127Q53-40 5 0Q60-53 89-49Q60-2 0 0Z" fill="#284952" stroke="#608e91" strokeWidth="1.3" /><path d="M0-6Q-34-66-64-95M3-8Q31-65 54-110" stroke="#86c5b3" strokeOpacity=".5" fill="none" strokeWidth="1.2" /></g>
        </g>)}
        {/* Frame only: the shared room component places the actual video above it. */}
        <rect x={SCENE.screen.x - 12} y="0" width={SCENE.screen.w + 24} height={SCENE.screen.h + 30} rx="9" fill="#080d1d" stroke="#607a99" strokeWidth="3" />
        <path d="M494 337H1106M489 4V335M1111 4V335" fill="none" stroke="#94e8ef" strokeOpacity=".65" strokeWidth="2" />
        <path d="M720 359H880M773 369H827" stroke="#a79bdb" strokeWidth="2" strokeLinecap="round" />
        <text x="800" y="403" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="15" letterSpacing="9" fill="#a5c9d9" opacity=".7">CELESTIAL TERRACE</text>
        <g transform={`translate(0 ${ext})`}>
            <ellipse cx="800" cy="807" rx="249" ry="43" fill="#070e1b" stroke="#6eaab4" strokeWidth="2" />
            <ellipse cx="800" cy="807" rx="235" ry="37" fill="none" stroke="#a6e9dd" strokeOpacity=".5" strokeWidth="1.4" strokeDasharray="4 10" />
            <ellipse cx="800" cy="807" rx="218" ry="31" fill="none" stroke="#a99bdd" strokeOpacity=".5" />
        </g>
        {withBooth && <svg x={SCENE.booth.x} y={SCENE.booth.y + ext} width={SCENE.booth.w} height={SCENE.booth.h} viewBox="0 0 300 150" overflow="visible"><BoothFrontArt u={(n) => u(`booth-${n}`)} p={p} plate /></svg>}
    </svg>;
}
