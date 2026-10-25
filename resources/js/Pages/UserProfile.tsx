import SubscriberName from '@/Components/SubscriberName';
import SubscriptionShowcase from '@/Components/SubscriptionShowcase';
import { perk, profileVars } from '@/lib/subscriptionStyle';
import { formatDate } from '@/lib/regional';
import Avatar from '@/Components/Avatar';
import UserRestrictionActions from '@/Components/UserRestrictionActions';
import SiteBanActions from '@/Components/SiteBanActions';
import { useUserRestrictions } from '@/lib/userRestrictions';
import Badges from '@/Components/Badges';
import Flag from '@/Components/Flag';
import RoleBadge from '@/Components/RoleBadge';
import SocialIcon from '@/Components/SocialIcon';
import StatusDot from '@/Components/StatusDot';
import { Profile } from '@/Components/UserCard';
import AppLayout from '@/Layouts/AppLayout';
import { AwardBadge, Cosmetics } from '@/lib/cosmetics';
import { STATUS, statusOf } from '@/lib/status';
import { PageProps, RoleInfo } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Gift, Headphones, Radio } from 'lucide-react';
import { useEffect } from 'react';

type Props = { profile: Profile & { avatar: string | null; cosmetics: Cosmetics | null; primary_role: RoleInfo; badges: RoleInfo[]; level: number; activity: { online: boolean; listening: { name: string; slug: string } | null } | null } };

/** Anyone's public profile. */
export default function UserProfile({ profile: p }: Props) {
    const { blocked } = useUserRestrictions();
    const isBlocked = blocked.includes(p.id);
    const guest = usePage<PageProps>().props.auth.guest;
    const status = statusOf(p.status);
    const tiles: [string, number][] = [['Level', p.level], ['XP', p.stats.xp], ['Songs played', p.stats.songs_played], ['Woots', p.stats.woots], ['Grabs', p.stats.grabs], ['Friends', p.stats.friends]];

    useEffect(() => {
        const timer = window.setInterval(() => {
            if (!document.hidden) router.reload({ only: ['profile'] });
        }, 15000);
        return () => window.clearInterval(timer);
    }, [p.id]);

    return (
        <AppLayout title="Profile">
            <Head title={p.name} />

            <section data-profile-animation={perk(p.cosmetics?.subscription, 'background_animation') || undefined} style={profileVars(p.cosmetics)} className="sub-profile flex flex-wrap items-center gap-5 rounded-xl border border-neutral-800 bg-linear-to-br from-violet-600/20 to-fuchsia-600/10 p-6">
                <span className="relative inline-block"><Avatar name={p.name} avatar={p.avatar} cosmetics={p.cosmetics} className="h-24 w-24 text-4xl" /><StatusDot status={status} ring="ring-neutral-900" className="absolute bottom-1 right-1 h-5! w-5!" /></span>
                <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-2xl font-bold" style={{ color: p.primary_role.color }}>
                        <Badges badges={p.badges} level={p.level} awards={9} /> <SubscriberName cosmetics={p.cosmetics}>{p.name}</SubscriberName> <RoleBadge role={p.primary_role} showMember />
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-400">
                        {p.username && <span>@{p.username}</span>}
                        {p.pronouns && <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-neutral-200" title="Pronouns">{p.pronouns}</span>}
                        {p.flag && <span className="flex items-center gap-1.5 text-neutral-300"><Flag flag={p.flag} className="h-4" /> {p.flag.name}</span>}
                        <span data-status-style={perk(p.cosmetics?.subscription, 'status') || undefined} className={`flex items-center gap-1.5 text-xs font-semibold ${STATUS[status].text}`}><StatusDot status={status} ring="ring-transparent" className="ring-0!" /> {STATUS[status].label}</span>
                    </p>
                    {p.favorite_genre && <span className="mt-2 inline-block rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs text-violet-300">🎵 {p.favorite_genre}</span>}
                    {p.bio && <p className="mt-3 max-w-2xl whitespace-pre-line wrap-break-word text-sm text-neutral-200">{p.bio}</p>}
                    <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                        <span>Joined {formatDate(p.joined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        {p.discord && <span className="flex items-center gap-1"><SocialIcon name="discord" size={14} /> {p.discord}</span>}
                        {p.youtube_channel && <a href={p.youtube_channel.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-red-300"><SocialIcon name="youtube" size={14} /> {p.youtube_channel.title || 'YouTube channel'}</a>}
                    </p>
                    {p.activity && (p.activity.online || p.activity.listening) && (
                        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-emerald-300" aria-label="SFD-DJ.EU activity">
                            {p.activity.online && <span className="flex items-center gap-1"><Radio size={14} /> On SFD-DJ.EU</span>}
                            {p.activity.listening && <Link href={route('rooms.show', p.activity.listening.slug)} className="flex items-center gap-1 hover:underline"><Headphones size={14} /> Listening in {p.activity.listening.name}</Link>}
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                    {guest ? null : p.is_me ? (
                        <Link href={route('profile.edit')} className="rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-700">Edit profile</Link>
                    ) : (
                        <>
                            <UserRestrictionActions userId={p.id} name={p.name} />
                            <Link href={`${route('settings.plus', { recipient: p.id })}#gifts`} className="flex items-center gap-2 rounded-md bg-fuchsia-500/15 px-4 py-2 text-fuchsia-200 hover:bg-fuchsia-500/25"><Gift size={16} /> Gift subscription</Link>
                            {!isBlocked && <Link href={`${route('whispers')}?with=${p.id}`} className="rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-700">💬 Whisper</Link>}
                            {!isBlocked && (p.friendship === 'none' || p.friendship === 'received') ? (
                                <button onClick={() => router.post(route('friends.store'), { user_id: p.id }, { preserveScroll: true })} className="rounded-md bg-violet-600 px-4 py-2 font-semibold hover:bg-violet-500">
                                    {p.friendship === 'received' ? '✓ Accept friend request' : '＋ Add friend'}
                                </button>
                            ) : (
                                <span className="rounded-md bg-neutral-800 px-4 py-2 text-neutral-400">{isBlocked ? 'Blocked' : p.friendship === 'friends' ? '✓ Friends' : '⏳ Request sent'}</span>
                            )}
                        </>
                    )}
                </div>
            </section>

            <SubscriptionShowcase cosmetics={p.cosmetics} badges={p.badges} />
            <SiteBanActions key={p.id} userId={p.id} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {tiles.map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/4 p-4">
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-xs text-neutral-500">{label}</p>
                    </div>
                ))}
            </div>

            {!!p.awards?.length && (
                <section className="rounded-2xl border border-white/10 bg-white/4 p-5" data-awards>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">Badges</h2>
                    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {p.awards.map((a) => (
                            <li key={a.key} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                                <AwardBadge name={a.key.slice(6)} className="h-11 w-11" />
                                <span className="min-w-0">
                                    <span className="block text-sm font-bold" style={{ color: a.color }}>{a.label}</span>
                                    <span className="block text-xs text-neutral-400">{a.text}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <section className="rounded-2xl border border-white/10 bg-white/4 p-5">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">Rooms by {p.name}</h2>
                {p.rooms.length === 0 ? (
                    <p className="text-sm text-neutral-500">No public rooms yet.</p>
                ) : (
                    <ul className="divide-y divide-neutral-800">
                        {p.rooms.map((r) => (
                            <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                                <Link href={route('rooms.show', r.slug)} className="truncate hover:underline">{r.name}</Link>
                                <span className="shrink-0 text-xs text-neutral-500">{r.genre ?? 'No genre'}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </AppLayout>
    );
}
