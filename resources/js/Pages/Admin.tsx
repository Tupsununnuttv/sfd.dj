import { formatTime } from '@/lib/regional';
import EmailTab from '@/Components/admin/EmailTab';
import AccountsTab from '@/Components/admin/AccountsTab';
import { BroadcastTab, IpBansTab, MaintenanceTab } from '@/Components/admin/MiscTabs';
import MatrixTab from '@/Components/admin/MatrixTab';
import Overview from '@/Components/admin/Overview';
import RoomsTab from '@/Components/admin/RoomsTab';
import RoomReleasesPanel from '@/Components/admin/RoomReleasesPanel';
import { AdminProps } from '@/Components/admin/types';
import UsersTab from '@/Components/admin/UsersTab';
import SupportInbox from '@/Components/SupportInbox';
import { Tabs } from '@/Components/ui';
import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Ban, Disc3, KeyRound, LayoutDashboard, LifeBuoy, Mail, Megaphone, UserRound, Users, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';

type Tab = 'Overview' | 'Users' | 'Accounts' | 'Rooms' | 'Room updates' | 'Support' | 'Permissions' | 'Broadcast' | 'Email' | 'IP bans' | 'Maintenance';

// each tab needs its own permission; the ones you may not use stay hidden
const needs: Record<Tab, string> = {
    Overview: 'admin.access',
    Users: 'admin.access',
    Accounts: 'users.manage',
    Rooms: 'rooms.manage',
    'Room updates': 'releases.manage',
    Support: 'support.manage',
    Permissions: 'admin.access',
    Broadcast: 'broadcast.send',
    Email: 'email.manage',
    'IP bans': 'ipbans.manage',
    Maintenance: 'maintenance.toggle',
};

export default function Admin(props: AdminProps) {
    const { auth: { user } } = usePage<PageProps>().props;
    const perms = user.site_permissions;

    const tabs = ([
        { key: 'Overview', label: 'Overview', icon: LayoutDashboard },
        { key: 'Users', label: 'Users', icon: Users, count: props.stats.accounts },
        { key: 'Accounts', label: 'Accounts', icon: UserRound },
        { key: 'Rooms', label: 'Rooms', icon: Disc3, count: props.stats.rooms },
        { key: 'Room updates', label: 'Room updates', icon: Disc3 },
        { key: 'Support', label: 'Support', icon: LifeBuoy, alert: props.openTickets || undefined },
        { key: 'Permissions', label: 'Permissions', icon: KeyRound },
        { key: 'Broadcast', label: 'Broadcast', icon: Megaphone },
        { key: 'Email', label: 'Email', icon: Mail },
        { key: 'IP bans', label: 'IP bans', icon: Ban, count: props.ipBans.length },
        { key: 'Maintenance', label: props.maintenance ? 'Maintenance ON' : 'Maintenance', icon: Wrench, alert: props.maintenance ? 1 : undefined },
    ] as const).filter((t) => perms.includes(needs[t.key]));

    // the tab you are on survives a refresh: it is kept in the address (#Users)
    const fromHash = (): Tab => { const h = decodeURIComponent(window.location.hash.slice(1)) as Tab; return tabs.some((t) => t.key === h) ? h : 'Overview'; };
    const [tab, setTabState] = useState<Tab>(fromHash);
    const setTab = (t: Tab) => { setTabState(t); history.replaceState(null, '', `#${encodeURIComponent(t)}`); };
    const [refreshing, setRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState(false);
    useEffect(() => {
        let pending = false;
        const refresh = () => {
            if (document.hidden || pending) return;
            pending = true; setRefreshing(true);
            const editing = document.activeElement?.matches('input, select, textarea, [contenteditable="true"]');
            router.reload({ only: ['stats', 'openTickets', ...(tab === 'Overview' ? ['overview'] : []), ...((tab === 'Users' || tab === 'Accounts') && !editing ? ['users'] : [])],
                onSuccess: () => setRefreshError(false),
                onHttpException: () => { setRefreshError(true); return false; },
                onNetworkError: () => { setRefreshError(true); return false; },
                onFinish: () => { pending = false; setRefreshing(false); },
            });
        };
        const timer = window.setInterval(refresh, 5000);
        document.addEventListener('visibilitychange', refresh);
        return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
    }, [tab]);


    return (
        <AppLayout title="Admin panel" subtitle={`Signed in as ${user.name}. You see only the parts your role may use.`}>
            <Head title="Admin panel" />
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/3 px-5 py-4">
                <div className="flex flex-wrap gap-5 text-sm"><span><b className="tabular-nums">{props.stats.users.toLocaleString()}</b> members</span><span><b className="tabular-nums">{props.stats.bots.toLocaleString()}</b> bots</span><span><b className="tabular-nums text-emerald-300">{props.stats.online.toLocaleString()}</b> active in 5 min</span><span className="text-neutral-500">{props.stats.accounts.toLocaleString()} total accounts</span></div>
                <span className={`text-xs ${refreshError ? 'text-amber-300' : 'text-neutral-500'}`}>{refreshError ? 'Update interrupted ? retrying' : refreshing ? 'Updating?' : `Updated ${formatTime(props.stats.updated_at)} ? every 5s`}</span>
            </div>

            <Tabs<Tab> tabs={tabs.map((t) => ({ ...t }))} active={tab} onChange={setTab} />

            {tab === 'Overview' && <Overview data={props.overview} openTickets={props.openTickets} totalUsers={props.stats.users} gotoTab={setTab} />}
            {tab === 'Users' && <UsersTab q={props.q} filters={props.filters} users={props.users} roleOptions={props.roleOptions} assignable={props.assignable} groups={props.roleGroups} awardList={props.awardList} planList={props.planList} />}
            {tab === 'Accounts' && <AccountsTab q={props.q} filters={props.filters} users={props.users} />}
            {tab === 'Rooms' && <RoomsTab rooms={props.rooms} counts={props.counts} />}
            {tab === 'Room updates' && <RoomReleasesPanel releases={props.roomReleases} />}
            {tab === 'Support' && <SupportInbox />}
            {tab === 'Permissions' && <MatrixTab matrix={props.matrix} groups={props.roleGroups} />}
            {tab === 'Broadcast' && <BroadcastTab announcements={props.announcements} />}
            {tab === 'Email' && props.email && <EmailTab email={props.email} gotoTab={setTab} />}
            {tab === 'IP bans' && <IpBansTab ipBans={props.ipBans} myIp={props.myIp} />}
            {tab === 'Maintenance' && <MaintenanceTab maintenance={props.maintenance} />}
        </AppLayout>
    );
}
