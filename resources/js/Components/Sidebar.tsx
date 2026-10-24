import SubscriberName from '@/Components/SubscriberName';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { CoinPill } from '@/Components/CoinIcon';
import Avatar from '@/Components/Avatar';
import Flag from '@/Components/Flag';
import RoleBadge from '@/Components/RoleBadge';
import StatusDot from '@/Components/StatusDot';
import { PageProps } from '@/types';
import { COUNTS_EVENT } from '@/lib/counts';
import { embedded } from '@/lib/embed';
import { MAX_LEVEL, levelPercent, xpText } from '@/lib/level';
import { STATUS, STATUSES, Status, statusOf } from '@/lib/status';
import { Link, router, usePage } from '@inertiajs/react';
import { createContext, MouseEvent, useContext, useEffect, useRef, useState } from 'react';
import {
    BookOpen, Bot, Check, ChevronDown, ChevronRight, Sparkles, CalendarDays, Clock, Gift, HelpCircle, LayoutDashboard, ListMusic, LogIn, LogOut, type LucideIcon,
    MessageCircle, Package, PanelLeftClose, PanelLeftOpen, Radio, RadioTower, ScrollText, ShieldCheck, ShoppingBag, Trophy, UserPlus, Users,
} from 'lucide-react';

type NavLink = { label: string; routeName: string; icon: LucideIcon; params?: Record<string, string>; membersOnly?: boolean };

const links: NavLink[] = [
    { label: 'Dashboard', routeName: 'dashboard', icon: LayoutDashboard },
    { label: 'Live streams', routeName: 'live', icon: RadioTower },
    { label: 'Community', routeName: 'community', icon: Trophy },
    { label: 'Events', routeName: 'events', icon: CalendarDays },
    { label: 'Friends', routeName: 'friends', icon: Users, membersOnly: true },
    { label: 'Whispers', routeName: 'whispers', icon: MessageCircle, membersOnly: true },
    { label: 'Selfbots', routeName: 'selfbots', icon: Bot, membersOnly: true },
    { label: 'Avatar shop', routeName: 'shop', icon: ShoppingBag, membersOnly: true },
    { label: 'Referral', routeName: 'referral', icon: Gift, membersOnly: true },
];

const help: NavLink[] = [
    { label: 'FAQ', routeName: 'faq', icon: HelpCircle },
    { label: 'Patch notes', routeName: 'patch-notes', icon: ScrollText },
    { label: 'Docs', routeName: 'docs', icon: BookOpen },
];


/** Inside a room this opens a page in the overlay instead of leaving the room. */
const OpenPage = createContext<((url: string, title: string) => void) | null>(null);
const ExpandedSidebar = createContext(false);

/** A normal click opens the overlay; ctrl/middle click still opens a new tab. */
function useOverlayClick(url: string, title: string) {
    const open = useContext(OpenPage);

    return open
        ? (e: MouseEvent) => {
              if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
              e.preventDefault();
              open(url, title);
          }
        : undefined;
}

const item = 'sfd-menuitem sfd-nav-item flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition [@media(max-height:900px)]:py-1 [@media(max-height:780px)]:py-0.5';
const divider = 'sfd-menudivider my-3 border-t border-white/10 [@media(max-height:900px)]:my-1';
const idle = 'text-neutral-400 hover:bg-white/5 hover:text-white';

function NavItem({ label, routeName, icon: Icon, params }: NavLink) {
    const { pendingFriends, unreadWhispers, liveCount, auth } = usePage<PageProps>().props;
    const expanded = useContext(ExpandedSidebar);
    const badge = routeName === 'friends' && auth.user.preferences?.notifications?.friend_requests !== false ? pendingFriends : routeName === 'whispers' ? unreadWhispers : routeName === 'live' ? liveCount : 0;

    const url = route(routeName, params);
    const onOverlay = useOverlayClick(url, label);
    const className = `${item} ${route().current(routeName) ? 'bg-linear-to-r from-violet-600/30 to-fuchsia-600/5 font-semibold text-white shadow-[inset_3px_0_0_#a855f7]' : idle}`;
    const inner = (
        <>
            <Icon size={18} className="shrink-0" />
            <span className={`${expanded ? 'inline' : 'hidden lg:inline'} flex-1 whitespace-nowrap`}>{label}</span>
            {badge > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{badge}</span>}
            {routeName === 'shop' && !auth.guest && <span className={`${expanded ? 'inline' : 'hidden lg:inline'} shrink-0`}><CoinPill amount={auth.coins} compact className="px-1.5! text-[11px]!" /></span>}
        </>
    );

    return onOverlay ? (
        <a href={url} title={label} className={className} onClick={onOverlay}>{inner}</a>
    ) : (
        <Link href={url} title={label} className={className}>{inner}</Link>
    );
}

/** Who you are, right under the logo: picture, name, level and how far you are to the next one. Opens your profile. */
function ProfileCard() {
    const { auth: { user } } = usePage<PageProps>().props;
    const expanded = useContext(ExpandedSidebar);
    const url = route('profile.edit');
    const onOverlay = useOverlayClick(url, 'Profile');
    const pct = levelPercent(user.xp, user.level);
    const className = `sfd-menuprofile group relative block rounded-t-2xl outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400 ${expanded ? 'p-3' : 'p-0.5 lg:p-3'} ${route().current('profile.edit') ? 'bg-violet-500/10' : 'hover:bg-violet-500/5'}`;
    const title = `${user.name}: level ${user.level}, ${xpText(user.xp, user.level)}. Open your profile.`;

    const body = (
        <>
            {/* wide menu: profile, role and progress in one compact card */}
            <div data-profile-card className={`${expanded ? 'block' : 'hidden lg:block'}`}>
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-400 via-fuchsia-500 to-violet-700 p-[2px] shadow-[0_0_16px_rgba(168,85,247,0.18)]">
                        <span className="flex rounded-full bg-[#100b1a] p-0.5"><Avatar name={user.name} avatar={user.avatar} cosmetics={user.cosmetics} className="h-10 w-10 text-xl" /></span>
                        <span className="absolute -bottom-0.5 -right-0.5 flex"><StatusDot status={user.status} className="h-3.5! w-3.5!" ring="ring-[#100b1a]" /></span>
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                            <span className="min-w-0 truncate text-sm font-bold leading-tight tracking-tight text-white"><SubscriberName cosmetics={user.cosmetics}>{user.name}</SubscriberName></span>
                            <Flag flag={user.flag} className="h-3 shrink-0" />
                        </span>
                        <span className="mt-1.5 flex min-w-0 items-center"><RoleBadge role={user.primary_role} /></span>
                    </span>
                    <ChevronRight size={15} className="shrink-0 text-violet-300/50 transition group-hover:translate-x-0.5 group-hover:text-violet-200" />
                </div>
                <span className="mt-3 flex items-center justify-between gap-2 text-[10px]">
                    <span className="whitespace-nowrap font-bold text-violet-100">Level {user.level}</span>
                    {user.level >= MAX_LEVEL
                        ? <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-fuchsia-300">Max level <Sparkles size={11} /></span>
                        : <span className="truncate tabular-nums text-violet-200/50">{xpText(user.xp, user.level)}</span>}
                </span>
                <span role="progressbar" aria-label="Level progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-valuetext={user.level >= MAX_LEVEL ? 'Maximum level' : `${Math.round(pct)}% through level ${user.level}`} className="mt-1.5 block h-2 overflow-hidden rounded-full border border-violet-300/10 bg-black/40 p-px">
                    <span className="block h-full rounded-full bg-linear-to-r from-violet-600 via-purple-500 to-fuchsia-400 shadow-[0_0_8px_rgba(192,132,252,0.4)] transition-[width] duration-700 motion-reduce:transition-none" style={{ width: `${pct}%` }} />
                </span>
            </div>

            {/* narrow menu: the picture inside a ring that fills up with XP, and the level on top */}
            <span className={`${expanded ? 'hidden' : 'relative mx-auto block h-10 w-10 lg:hidden'}`}>
                <span className="flex h-full w-full items-center justify-center rounded-full p-[2.5px]" style={{ background: `conic-gradient(#d946ef ${pct * 3.6}deg, rgba(255,255,255,0.14) 0)` }}>
                    <span className="flex h-full w-full items-center justify-center rounded-full bg-neutral-950">
                        <Avatar name={user.name} avatar={user.avatar} cosmetics={user.cosmetics} className="h-7 w-7 text-sm" />
                    </span>
                </span>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-neutral-800 px-1 text-[9px] font-bold leading-4 text-white ring-1 ring-neutral-950">{user.level}</span>
            </span>
        </>
    );

    return onOverlay ? <a href={url} title={title} className={className} onClick={onOverlay}>{body}</a> : <Link href={url} title={title} className={className}>{body}</Link>;
}

/** Online, busy, away or offline: one click on the status under your card opens the choices. */
function StatusMenu() {
    const { auth: { user } } = usePage<PageProps>().props;
    const expanded = useContext(ExpandedSidebar);
    const [open, setOpen] = useState(false);
    const box = useRef<HTMLDivElement>(null);
    const status = statusOf(user.status);

    useEffect(() => {
        if (!open) return;
        const away = (e: globalThis.MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
        const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('mousedown', away);
        document.addEventListener('keydown', esc);

        return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
    }, [open]);

    const pick = (s: Status) => {
        setOpen(false);
        if (s !== status) router.patch(route('profile.status'), { status: s }, { preserveScroll: true, preserveState: true, only: ['auth'] });
    };

    return (
        <div ref={box} className={`sfd-menustatus relative ${expanded ? 'border-t border-violet-300/10 p-2' : 'mt-2 lg:mt-0 lg:border-t lg:border-violet-300/10 lg:p-2'}`}>
            <button onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} title={`Status: ${STATUS[status].label}. Click to change it.`} data-status-button className={`flex w-full items-center gap-2 rounded-xl border border-transparent py-2 text-xs text-violet-100/80 outline-none transition hover:border-violet-300/15 hover:bg-violet-400/10 hover:text-white focus-visible:ring-2 focus-visible:ring-violet-400 ${expanded ? 'justify-start bg-violet-300/5 px-2.5' : 'justify-center px-1 lg:justify-start lg:bg-violet-300/5 lg:px-2.5'}`}>
                <StatusDot status={status} ring="ring-transparent" className="ring-0!" />
                <span className={`${expanded ? 'inline' : 'hidden lg:inline'} flex-1 text-left font-medium`}>{STATUS[status].label}</span>
                <ChevronDown size={14} className={`${expanded ? 'block' : 'hidden lg:block'} transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div role="menu" aria-label="Status" className="absolute left-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] animate-menu rounded-2xl border border-violet-300/20 bg-[#110d19] p-1.5 shadow-2xl shadow-black/60">
                    {STATUSES.map((s) => (
                        <button key={s} role="menuitemradio" aria-checked={s === status} data-status-option={s} onClick={() => pick(s)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-white/10 ${s === status ? 'bg-violet-500/15 ring-1 ring-inset ring-violet-400/20' : ''}`}>
                            <StatusDot status={s} ring="ring-transparent" className="h-3! w-3! ring-0!" />
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold text-white">{STATUS[s].label}</span>
                                <span className="block text-[11px] leading-snug text-neutral-400">{STATUS[s].hint}</span>
                            </span>
                            {s === status && <Check size={14} className="shrink-0 text-violet-300" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/** `room` marks the sidebar as in-room: it adds the room-only items. */
export default function Sidebar({
    room,
}: {
    room?: { slug: string; name: string; canLive: boolean; isLive: boolean; onRoom: () => void; onPlaylists: () => void; onWhispers: () => void; onLive: () => void; onOpenPage: (url: string, title: string) => void; };
}) {
    const { auth: { user, guest }, unreadWhispers } = usePage<PageProps>().props;
    const [expanded, setExpanded] = useState(false);

    // a friend request answered or a whisper read (here, or in the overlay of this room): the red numbers are read again
    useEffect(() => {
        if (guest || embedded) return; // inside an overlay there is no menu to update: the room around it hears about it instead
        let timer = 0;
        const again = () => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => router.reload({ only: ['pendingFriends', 'unreadWhispers'] }), 150); // several changes at once ask once
        };
        window.addEventListener(COUNTS_EVENT, again);

        return () => { window.clearTimeout(timer); window.removeEventListener(COUNTS_EVENT, again); };
    }, [guest]);

    useEffect(() => {
        if (!expanded) return;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setExpanded(false);
        };
        window.addEventListener('keydown', closeOnEscape);

        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [expanded]);

    // the page overlay of a room shows pages without their own menu
    if (embedded) return null;

    return (
        <OpenPage.Provider value={room?.onOpenPage ?? null}>
        <ExpandedSidebar.Provider value={expanded}>
        <>
            {expanded && <button onClick={() => setExpanded(false)} aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/50 lg:hidden" />}
            <aside className={`sfd-menu relative flex shrink-0 flex-col border-r border-white/10 bg-neutral-950 p-2 ${expanded ? 'fixed inset-y-0 left-0 z-50 h-dvh w-56 shadow-2xl lg:static lg:z-auto lg:h-auto lg:shadow-none' : 'w-14 lg:w-56'}`}>
            <div className="mb-3 flex h-10 shrink-0 items-center justify-between [@media(max-height:900px)]:mb-2 [@media(max-height:730px)]:h-8 lg:justify-start lg:px-3">
                <Link href="/" onClick={() => setExpanded(false)} className="flex min-w-0 items-center justify-center lg:justify-start">
                    <ApplicationLogo className={expanded ? 'text-xl' : 'text-base'} textClassName={expanded ? 'inline' : 'hidden lg:inline'} />
                </Link>
                <button onClick={() => setExpanded((previous) => !previous)} aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'} aria-expanded={expanded} aria-controls="primary-navigation" title={expanded ? 'Show less' : 'Show more'} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-white/10 hover:text-white lg:hidden">
                    {expanded ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
                </button>
            </div>

            {!guest && <div className={`mb-3 shrink-0 ${expanded ? 'rounded-2xl border border-violet-300/20 bg-linear-to-br from-violet-400/10 via-[#100c18] to-[#09070e] shadow-lg shadow-black/20' : 'lg:rounded-2xl lg:border lg:border-violet-300/20 lg:bg-linear-to-br lg:from-violet-400/10 lg:via-[#100c18] lg:to-[#09070e] lg:shadow-lg lg:shadow-black/20'}`}>
                <ProfileCard />
                <StatusMenu />
            </div>}

            <nav id="primary-navigation" onClick={() => expanded && setExpanded(false)} className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden [@media(max-height:900px)]:space-y-0">
                {links.filter((l) => (!guest || !l.membersOnly) && !(room && ['whispers', 'selfbots'].includes(l.routeName))).map((l) => <NavItem key={l.routeName} {...l} />)}
                <div className={divider} />
                {help.map((l) => <NavItem key={l.routeName} {...l} />)}

                {room && (
                    <>
                        <div className={divider} />
                        <p title={room.name} className={`${expanded ? 'block' : 'hidden lg:block'} truncate px-3 pb-1 pt-0.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500`}>{room.name}</p>
                        <button onClick={room.onRoom} title={`Room: ${room.name}`} aria-current="page" className={`${item} bg-linear-to-r from-violet-600/30 to-fuchsia-600/5 font-semibold text-white shadow-[inset_3px_0_0_#a855f7]`}>
                            <Radio size={18} className="shrink-0 text-violet-300" />
                            <span className={expanded ? 'inline' : 'hidden lg:inline'}>Room</span>
                        </button>
                        {!guest && (
                            <button onClick={room.onPlaylists} title="Playlists" className={`${item} ${idle}`}>
                                <ListMusic size={18} className="shrink-0" />
                                <span className={expanded ? 'inline' : 'hidden lg:inline'}>Playlists</span>
                            </button>
                        )}
                        {!guest && (
                            <button onClick={room.onWhispers} title="Whispers" className={`${item} ${idle}`}>
                                <MessageCircle size={18} className="shrink-0" />
                                <span className={`${expanded ? 'inline' : 'hidden lg:inline'} flex-1 text-left`}>Whispers</span>
                                {unreadWhispers > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{unreadWhispers}</span>}
                            </button>
                        )}
                        {room.canLive && (
                            <button onClick={room.onLive} title={room.isLive ? 'Live stream: controls' : 'Go live'} className={`${item} ${room.isLive ? 'font-semibold text-red-300 hover:bg-red-500/10' : idle}`}>
                                <RadioTower size={18} className="shrink-0" />
                                <span className={`${expanded ? 'inline' : 'hidden lg:inline'} flex-1 text-left`}>{room.isLive ? 'Live controls' : 'Go live'}</span>
                                {room.isLive && <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500" aria-hidden />}
                            </button>
                        )}
                        <NavItem label="History" routeName="history" icon={Clock} params={{ room: room.slug }} />
                    </>
                )}
            </nav>

            <div onClick={() => expanded && setExpanded(false)} className="sfd-menufooter sfd-sidebar-footer shrink-0 space-y-1 border-t border-white/10 pt-2 [@media(max-height:900px)]:space-y-0 [@media(max-height:900px)]:pt-1">
                {guest ? (
                    <>
                        <Link href={route('login')} title="Log in" className={`${item} text-neutral-300 hover:bg-neutral-900`}>
                            <LogIn size={18} className="shrink-0" />
                            <span className={expanded ? 'inline' : 'hidden lg:inline'}>Log in</span>
                        </Link>
                        <Link href={route('register')} title="Register" className={`${item} bg-violet-600/20 text-violet-300 hover:bg-violet-600/30`}>
                            <UserPlus size={18} className="shrink-0" />
                            <span className={expanded ? 'inline' : 'hidden lg:inline'}>Register</span>
                        </Link>
                    </>
                ) : (
                    <>
                        <NavItem label="My Stuff" routeName="my-stuff" icon={Package} />
                        {user.is_staff && <NavItem label="Admin panel" routeName="admin" icon={ShieldCheck} />}
                        <Link href={route('logout')} method="post" as="button" title="Log out" className={`${item} text-neutral-500 hover:bg-neutral-900 hover:text-white`}>
                            <LogOut size={18} className="shrink-0" />
                            <span className={expanded ? 'inline' : 'hidden lg:inline'}>Log out</span>
                        </Link>
                    </>
                )}
            </div>
            </aside>
            {expanded && <div aria-hidden="true" className="w-14 shrink-0 lg:hidden" />}
        </>
        </ExpandedSidebar.Provider>
        </OpenPage.Provider>
    );
}
