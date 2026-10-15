import EmailTab from '@/Components/admin/EmailTab';
import AccountsTab from '@/Components/admin/AccountsTab';
import { BroadcastTab, IpBansTab, MaintenanceTab } from '@/Components/admin/MiscTabs';
import MatrixTab from '@/Components/admin/MatrixTab';
import Overview from '@/Components/admin/Overview';
import RoomsTab from '@/Components/admin/RoomsTab';
import { AdminProps } from '@/Components/admin/types';
import UsersTab from '@/Components/admin/UsersTab';
import SupportInbox from '@/Components/SupportInbox';
import { Tabs } from '@/Components/ui';
import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Ban, Disc3, KeyRound, LayoutDashboard, LifeBuoy, Mail, Megaphone, UserRound, Users, Wrench } from 'lucide-react';
import { useState } from 'react';

type Tab = 'Overview' | 'Users' | 'Accounts' | 'Rooms' | 'Support' | 'Permissions' | 'Broadcast' | 'Email' | 'IP bans' | 'Maintenance';

// each tab needs its own permission; the ones you may not use stay hidden
const needs: Record<Tab, string> = {
    Overview: 'admin.access',
    Users: 'admin.access',
    Accounts: 'users.manage',
    Rooms: 'rooms.manage',
    Support: 'admin.access',
    Permissions: 'admin.access',
    Broadcast: 'broadcast.send',
    Email: 'maintenance.toggle',
    'IP bans': 'ipbans.manage',
    Maintenance: 'maintenance.toggle',
};

export default function Admin(props: AdminProps) {
    const { auth: { user } } = usePage<PageProps>().props;
    const perms = user.site_permissions;

    const tabs = ([
        { key: 'Overview', label: 'Overview', icon: LayoutDashboard },
        { key: 'Users', label: 'Users', icon: Users, count: props.stats.users },
        { key: 'Accounts', label: 'Accounts', icon: UserRound },
        { key: 'Rooms', label: 'Rooms', icon: Disc3, count: props.stats.rooms },
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

    return (
        <AppLayout title="Admin panel" subtitle={`Signed in as ${user.name}. You see only the parts your role may use.`}>
            <Head title="Admin panel" />

            <Tabs<Tab> tabs={tabs.map((t) => ({ ...t }))} active={tab} onChange={setTab} />

            {tab === 'Overview' && <Overview data={props.overview} openTickets={props.openTickets} totalUsers={props.stats.users} gotoTab={setTab} />}
            {tab === 'Users' && <UsersTab q={props.q} filters={props.filters} users={props.users} roleOptions={props.roleOptions} assignable={props.assignable} groups={props.roleGroups} awardList={props.awardList} planList={props.planList} />}
            {tab === 'Accounts' && <AccountsTab q={props.q} filters={props.filters} users={props.users} />}
            {tab === 'Rooms' && <RoomsTab rooms={props.rooms} counts={props.counts} />}
            {tab === 'Support' && <SupportInbox />}
            {tab === 'Permissions' && <MatrixTab matrix={props.matrix} groups={props.roleGroups} />}
            {tab === 'Broadcast' && <BroadcastTab announcements={props.announcements} />}
            {tab === 'Email' && props.email && <EmailTab email={props.email} gotoTab={setTab} />}
            {tab === 'IP bans' && <IpBansTab ipBans={props.ipBans} myIp={props.myIp} />}
            {tab === 'Maintenance' && <MaintenanceTab maintenance={props.maintenance} />}
        </AppLayout>
    );
}
