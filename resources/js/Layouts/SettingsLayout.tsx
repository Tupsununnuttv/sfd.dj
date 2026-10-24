import { translate } from '@/lib/regional';
import Avatar from '@/Components/Avatar';
import RoleBadge from '@/Components/RoleBadge';
import { card } from '@/Components/ui';
import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Languages, Bell, Cable, Code2, Gauge, Gavel, Lock, Palette, ShieldCheck, Sparkles, UserRound, Volume2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PropsWithChildren, ReactNode } from 'react';

const groups: { name: string; items: [string, string, LucideIcon][] }[] = [
    { name: 'You', items: [['profile.edit', 'Profile', UserRound], ['settings.connections', 'Connections', Cable], ['settings.privacy', 'Privacy', Lock], ['settings.account', 'Account & security', ShieldCheck]] },
    { name: 'Account status', items: [['settings.violations', 'Violations', Gavel]] },
    { name: 'Preferences', items: [['settings.appearance', 'Appearance', Palette], ['settings.audio', 'Audio', Volume2], ['settings.notifications', 'Notifications', Bell]] },
    { name: 'Regional', items: [['settings.language-time', 'Language & Time', Languages]] },
    { name: 'System', items: [['settings.system', 'Performance', Gauge]] },
    { name: 'More', items: [['settings.plus', 'SFD-DJ.EU Subscriptions', Sparkles]] },
    { name: 'Developer tools', items: [['settings.developers', 'Developers', Code2]] },
];

/** Settings: a menu on the left (a scrolling row on small screens) and the page on the right. */
export default function SettingsLayout({ title, subtitle, children }: PropsWithChildren<{ title?: ReactNode; subtitle?: ReactNode }>) {
    const { auth: { user }, pendingSubscriptionGifts } = usePage<PageProps>().props;
    const t = (text: string) => translate(text, user.preferences?.regional?.language ?? 'en');
    const link = (name: string, label: string, Icon: LucideIcon) => {
        const active = route().current(name);

        return (
            <Link
                key={name}
                href={route(name)}
                className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${active ? 'bg-linear-to-r from-violet-600/30 to-fuchsia-600/5 font-semibold text-white shadow-[inset_3px_0_0_#a855f7]' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
            >
                <Icon size={17} className="shrink-0" /> {t(label)}
                {name === 'settings.plus' && pendingSubscriptionGifts > 0 && <span className="rounded-full bg-fuchsia-500/25 px-2 text-xs font-bold text-fuchsia-200">{pendingSubscriptionGifts}</span>}
            </Link>
        );
    };

    return (
        <AppLayout title={t('Settings')} subtitle={t('Your profile, your privacy and how SFD-DJ.EU works for you.')}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_1fr]">
                <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
                    <Link href={route('users.show', user.id)} className={`${card} hidden items-center gap-3 p-3 hover:border-violet-400/50 lg:flex`}>
                        <Avatar name={user.name} avatar={user.avatar} cosmetics={user.cosmetics} className="h-11 w-11 text-lg" />
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-bold">{user.name}</span>
                            <span className="flex items-center gap-1.5 text-xs text-neutral-500">Lv {user.level} <RoleBadge role={user.primary_role} /></span>
                        </span>
                    </Link>

                    {/* wide: groups in a column */}
                    <nav className="hidden space-y-4 lg:block">
                        {groups.map((g) => (
                            <div key={t(g.name)}>
                                <p className="mb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-neutral-600">{t(g.name)}</p>
                                <div className="space-y-0.5">{g.items.map(([name, label, Icon]) => link(name, label, Icon))}</div>
                            </div>
                        ))}
                    </nav>

                    {/* small: one scrolling row */}
                    <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:hidden">{groups.flatMap((g) => g.items).map(([name, label, Icon]) => link(name, label, Icon))}</nav>
                </aside>

                <div className="min-w-0 space-y-6">
                    {title && (
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">{title}</h2>
                            {subtitle && <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>}
                        </div>
                    )}
                    {children}
                </div>
            </div>
        </AppLayout>
    );
}
