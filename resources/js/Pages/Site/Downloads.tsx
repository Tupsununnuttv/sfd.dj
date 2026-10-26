import SiteLayout, { PageHeader } from '@/Layouts/SiteLayout';
import { Head } from '@inertiajs/react';
import { Check, Clock3, Download, Monitor, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { windows11DownloadSupport, type DesktopSupport } from '@/lib/desktopPlatform';
import desktopRelease from '../../../../public/downloads/desktop-release.json';

export default function Downloads() {
    const [support, setSupport] = useState<DesktopSupport | 'checking'>('checking');
    useEffect(() => {
        let mounted = true;
        void windows11DownloadSupport(navigator).then(value => { if (mounted) setSupport(value); });
        return () => { mounted = false; };
    }, []);

    return (
        <SiteLayout>
            <Head title="Downloads" />
            <PageHeader crumbs={[['Downloads']]} title="Downloads" text="Optional tools for your music room." />

            <section className="mx-auto max-w-6xl space-y-8 px-6">
                <div className="grid gap-8 rounded-3xl border border-violet-400/25 bg-linear-to-br from-fuchsia-500/15 via-violet-500/10 to-sky-500/10 p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr]">
                    <div>
                        <div className="flex items-center gap-4">
                            <img src="/icon-192.png" alt="" width={64} height={64} className="rounded-2xl" />
                            <div><p className="text-sm font-semibold text-violet-300">Windows 11 desktop app</p><h2 className="text-2xl font-bold">SFD DJ Desktop</h2></div>
                        </div>
                        <p className="mt-5 text-neutral-300">Your rooms, music and chat in a dedicated desktop window.</p>
                        <p className="mt-2 text-sm text-neutral-400">Windows 11 · 64-bit (x64) · v{desktopRelease.version} · {(desktopRelease.bytes / 1048576).toFixed(1)} MB</p>
                        {support !== 'unsupported' ? (
                            <a href={desktopRelease.file} download={desktopRelease.download_name} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-fuchsia-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90">
                                <Download size={18} /> Download for Windows 11
                            </a>
                        ) : (
                            <button disabled className="mt-6 inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-neutral-400">
                                <Download size={18} /> Windows 11 only
                            </button>
                        )}
                        {support !== 'supported' && <p role="status" className="mt-3 text-xs text-neutral-400">{support === 'unknown' ? 'Your browser cannot confirm the Windows version. You can still download; Setup checks that your PC runs Windows 11.' : support === 'unsupported' ? 'This desktop app is available only for Windows 11.' : 'Checking Windows version...'}</p>}
                        <p className="mt-3 text-xs text-neutral-400">Open SFD-DJ-Setup.exe and choose where to install the app.</p>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-violet-300">
                            <a href={`${desktopRelease.file}.sha256`} className="hover:underline">SHA-256</a>
                            <a href="/downloads/SFD-DJ-Desktop-NOTICES.txt" className="hover:underline">Third-party notices</a>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-5 sm:p-6">
                        <h3 className="flex items-center gap-2 font-bold"><Monitor size={18} className="text-violet-300" /> Made for your desktop</h3>
                        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-300">
                            {[
                                'Choose your installation folder and add an SFD DJ desktop shortcut.',
                                'Your login stays saved when Keep me logged in is enabled.',
                                'Website updates appear automatically inside the app.',
                                'Use F11 for fullscreen and Ctrl+R to refresh.',
                            ].map(text => <li key={text} className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-violet-300" /><span>{text}</span></li>)}
                        </ul>
                        <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-relaxed text-neutral-400">Setup automatically installs missing or outdated .NET Desktop Runtime, Visual C++ Redistributable and WebView2 components. Internet access and administrator permission may be required.</p>
                        <p className="mt-3 text-xs leading-relaxed text-neutral-400">{desktopRelease.signing.status === 'signed' ? 'This installer is digitally signed. Windows may still display a SmartScreen warning while the app builds reputation.' : 'This installer is not digitally signed, so Windows may ask you to confirm the publisher.'}</p>
                    </div>
                </div>
                <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-linear-to-br from-violet-500/10 via-white/5 to-fuchsia-500/10 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                    <div>
                        <span className="inline-flex rounded-2xl bg-violet-500/15 p-4 text-violet-300"><SlidersHorizontal size={30} /></span>
                        <h2 className="mt-5 text-2xl font-bold">SFD DJ Equalizer</h2>
                        <p className="mt-2 text-sm font-semibold text-violet-300">Chrome and Edge on desktop</p>
                        <p className="mt-4 text-neutral-300">Adjust bass, mids and treble in your room.</p>
                    </div>
                    <span className="inline-flex self-start shrink-0 items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-5 py-3 text-sm font-semibold text-violet-300 sm:self-center">
                        <Clock3 size={18} /> Coming Soon
                    </span>
                </div>
            </section>
        </SiteLayout>
    );
}
