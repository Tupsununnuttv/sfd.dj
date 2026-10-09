import Live from '@/Components/Live';
import Sidebar from '@/Components/Sidebar';
import VerifyBanner from '@/Components/VerifyBanner';
import { PropsWithChildren, ReactNode } from 'react';

/** Dark shell: sidebar on the left, scrolling page on the right. `subtitle` goes under the title, `actions` to its right. */
export default function AppLayout({ title, subtitle, actions, children }: PropsWithChildren<{ title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }>) {
    return (
        <div className="flex h-dvh bg-neutral-950 text-neutral-100">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
                <Live />
                <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden [background-image:radial-gradient(50rem_22rem_at_70%_-8%,rgba(139,92,246,0.16),transparent),radial-gradient(40rem_20rem_at_0%_0%,rgba(217,70,239,0.08),transparent)]">
                    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
                        <VerifyBanner />
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div className="min-w-0">
                                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
                                {subtitle && <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>}
                            </div>
                            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
                        </div>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
