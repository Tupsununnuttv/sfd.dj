import ApplicationLogo, { LogoMark } from '@/Components/ApplicationLogo';
import SiteLayout, { PageHeader } from '@/Layouts/SiteLayout';
import { Head } from '@inertiajs/react';
import { Check, Download } from 'lucide-react';
import { useState } from 'react';

const files: [string, string, string, string][] = [
    ['The mark', 'SVG, any size. The full drawing.', '/logo.svg', 'logo.svg'],
    ['The mark, PNG', '512 x 512, transparent corners.', '/logo.png', 'sfddj-logo-512.png'],
    ['Small mark', 'SVG for 16 to 32 px: bolder, fewer details. This is the browser tab icon.', '/favicon.svg', 'sfddj-small.svg'],
    ['App icon', '512 x 512 square, for phones and home screens.', '/icon-512.png', 'sfddj-app-icon-512.png'],
    ['Social image', '1200 x 630, the picture shown when a link is shared.', '/og-image.png', 'sfddj-social.png'],
];

const colours: [string, string, string][] = [
    ['Violet', '#6d28d9', 'text-white'],
    ['Magenta', '#c026d3', 'text-white'],
    ['Pink', '#db2777', 'text-white'],
    ['Sky', '#0ea5e9', 'text-white'],
    ['Cyan glow', '#22d3ee', 'text-neutral-950'],
    ['Ink', '#0a0a0a', 'text-white'],
];

const dos = ['Use it on dark backgrounds: that is where it looks best.', 'Leave empty space around it, at least half the height of the mark.', 'Use the small mark below 32 px.', 'Link to the full mark file or the social image: they are always the latest.'];
const donts = ['Do not stretch, squash, rotate or recolour it.', 'Do not put the mark on a busy picture or a light background without its tile.', 'Do not add shadows or outlines of your own.', 'Do not suggest SFD-DJ.EU made or approves your project, unless it did.'];

export default function Brand() {
    const [copied, setCopied] = useState<string | null>(null);
    const copy = (hex: string) => {
        navigator.clipboard?.writeText(hex).catch(() => {});
        setCopied(hex);
        setTimeout(() => setCopied(null), 1500);
    };

    return (
        <SiteLayout>
            <Head title="Brand" />
            <PageHeader crumbs={[['Brand']]} title="The SFD-DJ.EU brand" text="A bold S in a glossy tile that runs from violet to cyan, ringed by a sound spectrum with a playhead: the music, in sync, live. Use it to write about us or to link to us." />

            <section className="mx-auto max-w-6xl px-6">
                <div className="relative flex flex-col items-center overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-violet-950 via-neutral-950 to-fuchsia-950 px-6 py-16">
                    <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 animate-float rounded-full bg-fuchsia-600/25 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 right-0 h-96 w-96 animate-float rounded-full bg-violet-600/25 blur-3xl [animation-delay:2s]" />
                    <LogoMark detail="full" spin className="relative text-[16rem] drop-shadow-[0_30px_70px_rgba(168,85,247,0.6)]" />
                    <ApplicationLogo className="relative mt-8 text-6xl" detail="full" />
                    <p className="relative mt-3 text-neutral-400">Your music room, live.</p>
                </div>
            </section>

            <section className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-4 px-6 md:grid-cols-3">
                <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-neutral-950 p-8">
                    <div className="flex items-end gap-5">{[16, 24, 32, 48, 64].map((s) => <span key={s} className="text-center text-[10px] text-neutral-500"><span style={{ fontSize: s }} className="block"><LogoMark detail={s < 32 ? 'simple' : 'full'} /></span>{s}px</span>)}</div>
                    <p className="mt-5 text-sm text-neutral-400">Sizes: the bold version takes over below 32 px.</p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white p-8">
                    <ApplicationLogo className="text-4xl" detail="full" onLight />
                    <p className="mt-5 text-center text-sm text-neutral-500">On a light page, keep the tile and write SFD in dark.</p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-linear-to-br from-fuchsia-600 to-violet-700 p-8">
                    <ApplicationLogo className="text-4xl" detail="full" />
                    <p className="mt-5 text-center text-sm text-white/80">On a colour, the tile still keeps it readable.</p>
                </div>
            </section>

            <section className="mx-auto mt-14 max-w-6xl px-6">
                <h2 className="text-2xl font-black tracking-tight">Downloads</h2>
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {files.map(([title, text, href, name]) => (
                        <a key={href} href={href} download={name} className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-violet-400/60">
                            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-neutral-950"><img src={href} alt="" className="max-h-12 max-w-12 object-contain" /></span>
                            <span className="min-w-0 flex-1">
                                <span className="block font-semibold">{title}</span>
                                <span className="block text-xs text-neutral-400">{text}</span>
                            </span>
                            <Download size={18} className="mt-1 shrink-0 text-neutral-500 group-hover:text-violet-300" />
                        </a>
                    ))}
                </div>
            </section>

            <section className="mx-auto mt-14 max-w-6xl px-6">
                <h2 className="text-2xl font-black tracking-tight">Colours</h2>
                <p className="mt-1 text-sm text-neutral-400">Click a colour to copy it.</p>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {colours.map(([name, hex, text]) => (
                        <button key={hex} onClick={() => copy(hex)} className="overflow-hidden rounded-2xl border border-white/10 text-left transition hover:scale-[1.02]">
                            <span className={`flex h-20 items-end p-3 text-xs font-bold ${text}`} style={{ backgroundColor: hex }}>{copied === hex ? <span className="flex items-center gap-1"><Check size={13} /> Copied</span> : null}</span>
                            <span className="block bg-white/5 p-3"><span className="block text-sm font-semibold">{name}</span><span className="font-mono text-xs text-neutral-400">{hex}</span></span>
                        </button>
                    ))}
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-linear-to-r from-fuchsia-500 via-violet-500 to-sky-400" title="The brand gradient: fuchsia to violet to sky" />
            </section>

            <section className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-4 px-6 md:grid-cols-2">
                <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
                    <h2 className="font-bold text-green-300">Please do</h2>
                    <ul className="mt-3 space-y-2 text-sm text-neutral-300">{dos.map((t) => <li key={t} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-green-400" /> {t}</li>)}</ul>
                </div>
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                    <h2 className="font-bold text-red-300">Please do not</h2>
                    <ul className="mt-3 space-y-2 text-sm text-neutral-300">{donts.map((t) => <li key={t} className="flex gap-2"><span className="mt-0.5 w-4 shrink-0 text-center text-red-400">×</span> {t}</li>)}</ul>
                </div>
            </section>
        </SiteLayout>
    );
}
