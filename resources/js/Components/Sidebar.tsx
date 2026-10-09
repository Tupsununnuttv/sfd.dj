import ApplicationLogo from '@/Components/ApplicationLogo';
import { CoinPill } from '@/Components/CoinIcon';
import Avatar from '@/Components/Avatar';
import Flag from '@/Components/Flag';
import RoleBadge from '@/Components/RoleBadge';
import StatusDot from '@/Components/StatusDot';
import { PageProps } from '@/types';
import { embedded } from '@/lib/embed';
import { levelPercent, xpText } from '@/lib/level';
import { STATUS, STATUSES, Status, statusOf } from '@/lib/status';
import { Link, router, usePage } from '@inertiajs/react';
import { createContext, MouseEvent, useContext, useEffect, useRef, useState } from 'react';
import {
    BookOpen, ChevronDown, CalendarDays, Clock, DoorOpen, Gavel, Gift, HelpCircle, LayoutDashboard, ListMusic, LogIn, LogOut, type LucideIcon,
    MessageCircle, Package, Radio, ScrollText, Settings, ShieldCheck, ShoppingBag, Trophy, UserPlus, Users,
} from 'lucide-react';

type NavLink = { label: string; routeName: string; icon: LucideIcon; params?: Record<string, string>; membersOnly?: boolean };

const links: NavLink[] = [
    { label: 'Dashboard', routeName: 'dashboard', icon: LayoutDashboard },
    { label: 'Community', routeName: 'community', icon: Trophy },
    { label: 'Events', routeName: 'events', icon: CalendarDays },
    { label: 'Friends', routeName: 'friends', icon: Users, membersOnly: true },
    { label: 'Whispers', routeName: 'whispers', icon: MessageCircle, membersOnly: true },
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

const item = 'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition [@media(max-height:900px)_and_(min-height:781px)]:py-1.5 [@media(max-height:780px)_and_(min-height:681px)]:py-1 [@media(max-height:680px)]:py-0.5';
const divider = 'my-3 border-t border-white/10 [@media(max-height:900px)_and_(min-height:681px)]:my-2 [@media(max-height:680px)]:my-1';
const idle = 'text-neutral-400 hover:bg-white/5 hover:text-white';

function NavItem({ label, routeName, icon: Icon, params }: NavLink) {
    const { pendingFriends, unreadWhispers, auth } = usePage<PageProps>().props;
    const badge = routeName === 'friends' && auth.user.preferences?.notifications?.friend_requests !== false ? pendingFriends : routeName === 'whispers' ? unreadWhispers : 0;

    const url = route(routeName, params);
    const onOverlay = useOverlayClick(url, label);
    const className = `${item} ${route().current(routeName) ? 'bg-gradient-to-r from-violet-600/30 to-fuchsia-600/5 font-semibold text-white shadow-[inset_3px_0_0_#a855f7]' : idle}`;
    const inner = (
        <>
            <Icon size={18} className="shrink-0" />
            <span className="hidden flex-1 whitespace-nowrap lg:inline">{label}</span>
            {badge > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{badge}</span>}
            {routeName === 'shop' && !auth.guest && <span className="hidden shrink-0 lg:inline"><CoinPill amount={auth.coins} compact className="!px-1.5 !text-[11px]" /></span>}
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
    const url = route('profile.edit');
    const onOverlay = useOverlayClick(url, 'Profile');
    const pct = levelPercent(user.xp, user.level);
    const className = `group relative mb-1 block rounded-xl p-1 transition lg:border lg:bg-gradient-to-br lg:from-white/[0.07] lg:to-white/[0.02] lg:p-2.5 lg:hover:from-violet-500/15 lg:hover:to-fuchsia-500/5 ${route().current('profile.edit') ? 'lg:border-violet-400/50' : 'lg:border-white/10 lg:hover:border-violet-400/40'}`;
    const title = `${user.name}: level ${user.level}, ${xpText(user.xp, user.level)}. Open your profile.`;

    const body = (
        <>
            {/* wide menu: picture, name, level and the XP bar */}
            <div className="hidden items-center gap-3 lg:flex">
                <span className="relative shrink-0">
                    <Avatar name={user.name} avatar={user.avatar} cosmetics={user.cosmetics} className="h-11 w-11 text-xl" />
                    <StatusDot status={user.status} className="absolute -bottom-0.5 -right-0.5 !h-3 !w-3" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-bold leading-tight text-white">{user.name}</span>
                        <Flag flag={user.flag} className="h-3" />
                        <span className="shrink-0"><RoleBadge role={user.primary_role} /></span>
                    </span>
                    <span className="mt-0.5 flex items-baseline justify-between gap-2 text-[11px]">
                        <span className="font-semibold text-neutral-200">Level {user.level}</span>
                        <span className="tabular-nums text-neutral-400">{xpText(user.xp, user.level)}</span>
                    </span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-white/10">
                        <span className="block h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                    </span>
                </span>
            </div>

            {/* narrow menu: the picture inside a ring that fills up with XP, and the level on top */}
            <span className="relative mx-auto block h-10 w-10 lg:hidden">
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
        <div ref={box} className="relative mb-3 [@media(max-height:730px)]:mb-2">
            <button onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} title={`Status: ${STATUS[status].label}. Click to change it.`} data-status-button className="flex w-full items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-xs text-neutral-400 transition hover:bg-white/5 hover:text-white lg:justify-start lg:px-3">
                <StatusDot status={status} ring="ring-transparent" className="!ring-0" />
                <span className="hidden flex-1 text-left font-medium lg:inline">{STATUS[status].label}</span>
                <ChevronDown size={14} className={`hidden transition-transform lg:block ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div role="menu" aria-label="Status" className="absolute left-0 top-full z-40 mt-1 w-64 animate-menu rounded-xl border border-white/10 bg-neutral-900 p-1.5 shadow-2xl shadow-black/60">
                    {STATUSES.map((s) => (
                        <button key={s} role="menuitemradio" aria-checked={s === status} data-status-option={s} onClick={() => pick(s)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-white/10 ${s === status ? 'bg-white/5' : ''}`}>
                            <StatusDot status={s} ring="ring-transparent" className="!h-3 !w-3 !ring-0" />
                            <span>
                                <span className="block text-sm font-semibold text-white">{STATUS[s].label}</span>
                                <span className="block text-[11px] leading-snug text-neutral-400">{STATUS[s].hint}</span>
                            </span>
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
    room?: { slug: string; name: string; canEdit: boolean; canModerate: boolean; onRoom: () => void; onPlaylists: () => void; onWhispers: () => void; onOpenPage: (url: string, title: string) => void; onSettings: () => void; onModeration: () => void };
}) {
    const { auth: { user, guest }, unreadWhispers } = usePage<PageProps>().props;

    // the page overlay of a room shows pages without their own menu
    if (embedded) return null;

    return (
        <OpenPage.Provider value={room?.onOpenPage ?? null}>
        <aside className="flex w-14 shrink-0 flex-col border-r border-white/10 bg-neutral-950 p-2 lg:w-56">
            <Link href="/" className="mb-3 flex h-10 shrink-0 items-center justify-center lg:justify-start lg:px-3 [@media(max-height:730px)]:mb-2 [@media(max-height:730px)]:h-8">
                <ApplicationLogo className="text-xl" textClassName="hidden lg:inline" />
            </Link>

            {!guest && <ProfileCard />}
            {!guest && <StatusMenu />}

            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden [@media(max-height:900px)_and_(min-height:681px)]:space-y-0.5 [@media(max-height:680px)]:space-y-0">
                {links.filter((l) => (!guest || !l.membersOnly) && !(room && l.routeName === 'whispers')).map((l) => <NavItem key={l.routeName} {...l} />)}
                <div className={divider} />
                {help.map((l) => <NavItem key={l.routeName} {...l} />)}

                {room && (
                    <>
                        <div className={divider} />
                        <p title={room.name} className="hidden truncate px-3 pb-1 pt-0.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500 lg:block">{room.name}</p>
                        <button onClick={room.onRoom} title={`Room: ${room.name}`} aria-current="page" className={`${item} bg-gradient-to-r from-violet-600/30 to-fuchsia-600/5 font-semibold text-white shadow-[inset_3px_0_0_#a855f7]`}>
                            <Radio size={18} className="shrink-0 text-violet-300" />
                            <span className="hidden lg:inline">Room</span>
                        </button>
                        {!guest && (
                            <button onClick={room.onPlaylists} title="Playlists" className={`${item} ${idle}`}>
                                <ListMusic size={18} className="shrink-0" />
                                <span className="hidden lg:inline">Playlists</span>
                            </button>
                        )}
                        {!guest && (
                            <button onClick={room.onWhispers} title="Whispers" className={`${item} ${idle}`}>
                                <MessageCircle size={18} className="shrink-0" />
                                <span className="hidden flex-1 text-left lg:inline">Whispers</span>
                                {unreadWhispers > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{unreadWhispers}</span>}
                            </button>
                        )}
                        <NavItem label="History" routeName="history" icon={Clock} params={{ room: room.slug }} />
                        {room.canEdit && (
                            <button onClick={room.onSettings} title="Room settings" className={`${item} ${idle}`}>
                                <Settings size={18} className="shrink-0" />
                                <span className="hidden lg:inline">Room settings</span>
                            </button>
                        )}
                        {room.canModerate && (
                            <button onClick={room.onModeration} title="Room moderation" className={`${item} ${idle}`}>
                                <Gavel size={18} className="shrink-0" />
                                <span className="hidden lg:inline">Room moderation</span>
                            </button>
                        )}
                        <Link href={route('dashboard')} title="Leave Room" className={`${item} text-neutral-400 hover:bg-red-500/10 hover:text-red-300`}>
                            <DoorOpen size={18} className="shrink-0" />
                            <span className="hidden lg:inline">Leave Room</span>
                        </Link>
                    </>
                )}
            </nav>

            <div className="shrink-0 space-y-1 border-t border-white/10 pt-2 [@media(max-height:900px)_and_(min-height:681px)]:space-y-0.5 [@media(max-height:680px)]:space-y-0">
                {guest ? (
                    <>
                        <Link href={route('login')} title="Log in" className={`${item} text-neutral-300 hover:bg-neutral-900`}>
                            <LogIn size={18} className="shrink-0" />
                            <span className="hidden lg:inline">Log in</span>
                        </Link>
                        <Link href={route('register')} title="Register" className={`${item} bg-violet-600/20 text-violet-300 hover:bg-violet-600/30`}>
                            <UserPlus size={18} className="shrink-0" />
                            <span className="hidden lg:inline">Register</span>
                        </Link>
                    </>
                ) : (
                    <>
                        <NavItem label="My Stuff" routeName="my-stuff" icon={Package} />
                        {user.is_staff && <NavItem label="Admin panel" routeName="admin" icon={ShieldCheck} />}
                        <Link href={route('logout')} method="post" as="button" title="Log out" className={`${item} text-neutral-500 hover:bg-neutral-900 hover:text-white`}>
                            <LogOut size={18} className="shrink-0" />
                            <span className="hidden lg:inline">Log out</span>
                        </Link>
                    </>
                )}
            </div>
        </aside>
        </OpenPage.Provider>
    );
}
